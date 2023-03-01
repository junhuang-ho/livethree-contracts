import { ethers as ethersBase } from "ethers";

const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const { getSelectors, FacetCutAction } = require("./utilsDiamond");
const { networkConfig, ZERO_BYTES } = require("./common");

const developmentChains = ["hardhat", "localhost"];
const CHAIN_ID_HARDHAT = 31337;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getFiles = (dir: string, files_?: string[]) => {
  files_ = files_ || [];
  var files = fs.readdirSync(dir);
  for (var i in files) {
    var name = dir + "/" + files[i];
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
};

export const getADiamondAddress = (jsonFiles: string[], name: string) => {
  for (let i = 0; i < jsonFiles.length; i++) {
    const filePath = jsonFiles[i];
    const fileName = filePath.split("/").at(-1)?.split(".").at(0);
    if (fileName === name) {
      const openJSON = fs.readFileSync(filePath, "utf-8");
      const contractData = JSON.parse(openJSON);
      return contractData.address;
    }
  }
};

export const getContractRelativePath = (
  contractName: string,
  contractParentFolder: string
) => {
  const contractDir = __dirname
    .substring(0, __dirname.lastIndexOf("/"))
    .concat(`/contracts`);
  const contractList = getFiles(contractDir);
  const contractFile = `${contractName}.sol`;
  let contractPath;
  for (let i = 0; i < contractList.length; i++) {
    if (
      contractList[i].endsWith(contractFile) &&
      !contractList[i].endsWith("I".concat(contractFile)) &&
      !contractList[i].endsWith("Lib".concat(contractFile))
    ) {
      contractPath = contractList[i];
      contractPath = contractPath.split(`${contractParentFolder}/`)[1];
    }
  }
  if (contractPath === undefined || contractPath === null) {
    throw new Error(`contract path that ends with ${contractFile} not found.`);
  }
  return contractPath;
};

const save = (
  chainId: number,
  dir: string,
  saveDir: string,
  dir2: string,
  saveDir2: string,
  contractName: string,
  contractDeployed: any,
  isProxy = false
) => {
  if (+chainId === +CHAIN_ID_HARDHAT) return;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dir2)) {
    fs.mkdirSync(dir2, { recursive: true });
  }

  // get abi
  const contractArtifactList = getFiles(
    __dirname
      .substring(0, __dirname.lastIndexOf("/"))
      .concat("/artifacts/contracts")
  );
  const fileName = `${contractName}.json`;
  let contractArtifactsDir;
  for (let i = 0; i < contractArtifactList.length; i++) {
    if (contractArtifactList[i].endsWith(fileName)) {
      contractArtifactsDir = contractArtifactList[i];
    }
  }
  if (contractArtifactsDir === undefined || contractArtifactsDir === null) {
    throw new Error(
      `contract artifact path that ends with ${fileName} not found.`
    );
  }
  const contractArtifacts = fs.readFileSync(contractArtifactsDir);
  const contractArtifactsJSON = JSON.parse(contractArtifacts);

  const json = JSON.stringify({
    address: contractDeployed.address,
    abi: contractArtifactsJSON.abi,
  });

  // save
  fs.writeFileSync(saveDir, json, function (err: any) {
    if (err) {
      console.log(err);
    }
  });
  if (isProxy) {
    fs.writeFileSync(saveDir2, contractDeployed.address, function (err: any) {
      if (err) {
        console.log(err);
      }
    });
  }

  console.log(`${"Saved".padEnd(10)} | to ${saveDir}`);
};

export const deploy = async (
  deployer: any,
  chainId: number,
  contractName: string,
  saveDate: number,
  args = [],
  isProxy = false,
  isInit = false
) => {
  const dir = `./deployments/${networkConfig[chainId]["name"]}_${saveDate}`;
  const saveDir = `${dir}/${contractName}.json`;
  const dir2 = `./diamond_addresses`;
  const saveDir2 = `${dir2}/${networkConfig[chainId]["name"]}_${saveDate}.txt`;

  // Deploying
  const contract = await ethers.getContractFactory(contractName, deployer);
  const contractDeployed = await contract.deploy(...args);

  console.log(
    "gas limit:",
    contractDeployed.deployTransaction.gasLimit.toString()
  );
  console.log("tx hash:", contractDeployed.deployTransaction.hash);

  if (chainId === CHAIN_ID_HARDHAT) {
    await contractDeployed.deployed();
  } else {
    var tx = await contractDeployed.deployTransaction.wait(1);
  }
  console.log(
    `${"Deployed".padEnd(10)} | ${contractName.padEnd(15)} on ${
      networkConfig[chainId]["name"]
    }: ${contractDeployed.address}`
  );

  if (!isInit)
    save(
      chainId,
      dir,
      saveDir,
      dir2,
      saveDir2,
      contractName,
      contractDeployed,
      isProxy
    );

  return contractDeployed;
};

export const deployDiamondAndFacets = async (
  diamondCutCtName: string,
  diamondCtName: string,
  facetNames: string[]
) => {
  const { getNamedAccounts, getChainId } = hre;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const now = Date.now();

  const ctCut = await deploy(deployer, chainId, diamondCutCtName, now, []); // "Cut"
  const ctDiamond = await deploy(
    deployer,
    chainId,
    diamondCtName,
    now,
    [deployer, ctCut?.address] as any,
    true
  ); // "Diamond"

  const facetCutProcedures = [];
  for (let i = 0; i < facetNames.length; i++) {
    const facetName = facetNames[i];
    const contractFacet = await deploy(
      deployer,
      chainId,
      facetName,
      now,
      [] // must be empty
    );
    facetCutProcedures.push({
      facetAddress: contractFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(contractFacet),
    });
  }

  const ctDiamondCut = await ethers.getContractAt(
    `I${diamondCutCtName}`,
    ctDiamond.address
  ); // call cut functionalities using main diamond address

  console.log(`--- Diamond and Facets Deployed`);
  console.log(`--- Diamond Address: ${ctDiamond.address}`);

  return { ctDiamond, ctDiamondCut, facetCutProcedures };
};

const deployDiamondInit = async (
  facetInitsCtName: string,
  initParams: any[]
) => {
  const { getNamedAccounts, getChainId } = hre;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const now = Date.now();

  const ctDiamondInit = await deploy(
    deployer,
    chainId,
    facetInitsCtName,
    now,
    [],
    false,
    true
  ); // "DiamondInit"
  const functionCallWithData = ctDiamondInit.interface.encodeFunctionData(
    "init",
    initParams
  );

  const addressDiamondInit = ctDiamondInit.address;

  return { addressDiamondInit, functionCallWithData };
};

export const cutFacets = async (
  ctDiamondCut: ethersBase.Contract,
  facetCutProcedures: any[],
  facetInitsCtName?: string,
  initParams?: any[]
) => {
  let addrDiamondInit = undefined;
  let fnCallWithData = undefined;

  if (facetInitsCtName !== undefined && initParams !== undefined) {
    const { addressDiamondInit, functionCallWithData } =
      await deployDiamondInit(facetInitsCtName, initParams);

    addrDiamondInit = addressDiamondInit;
    fnCallWithData = functionCallWithData;
  } else if (
    (facetInitsCtName !== undefined && initParams === undefined) ||
    (facetInitsCtName === undefined && initParams !== undefined)
  ) {
    throw Error(`!!! Both facetInitsCtName & initParams must be defined`);
  }

  console.log("--- Diamond Cutting 💎");
  const tx = await ctDiamondCut.diamondCut(
    facetCutProcedures,
    addrDiamondInit ?? ethers.constants.AddressZero,
    fnCallWithData ?? ZERO_BYTES
  );
  const rcpt = await tx.wait();
  if (!rcpt.status) {
    throw Error(`!!! Diamond Cut Failed: ${tx.hash}`);
  }
  console.log("--- Cut Completed");
};

module.exports = {
  developmentChains,
  getADiamondAddress,
  getContractRelativePath,
  getFiles,
  deploy,
  deployDiamondAndFacets,
  cutFacets,
};

// gas limit: 2344376
// gas limit: 2271076
// gas limit: 717427
// gas limit: 827185
// gas limit: 679360
// gas limit: 1218351
// gas limit: 862486
// gas limit: 1611154
// gas limit: 1018479
