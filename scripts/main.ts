const hre = require("hardhat");
import { ethers } from "hardhat";
const fs = require("fs");
import {
  deployDiamondAndFacets,
  cutFacets,
  getFiles,
  getADiamondAddress,
  getContractRelativePath,
} from "./utils";
import {
  CONTRACT_PARENT_FOLDER,
  ADDR_GEL_OPS_PROXY_FACTORY,
  ADDR_GEL_FEE,
  networkConfig,
} from "./common";

export const testDeployParams = async () => {
  const { getChainId } = hre;
  const chainId = await getChainId();

  const diamondCutCtName = "Cut";
  const diamondCtName = "Diamond";
  const facetNames = [
    "Loupe",
    "AccessControl",
    "Utility",
    "Automate",
    "StreamSetup",
    "StreamControl",
  ];

  const facetInitsCtName = "DiamondInit";

  const minContractGelatoBalance = ethers.utils.parseEther("1");
  const addressesSuperTokens = [networkConfig[chainId]["addrUSDCx"]];

  return {
    diamondCutCtName,
    diamondCtName,
    facetNames,
    facetInitsCtName,
    minContractGelatoBalance,
    addressesSuperTokens,
  };
};

export const contractDeploy = async (
  diamondCutCtName: string,
  diamondCtName: string,
  facetNames: string[],
  facetInitsCtName: string,
  minContractGelatoBalance: any,
  addressesSuperTokens: string[]
) => {
  const { getChainId } = hre;
  const chainId = await getChainId();

  const { ctDiamond, ctDiamondCut, facetCutProcedures } =
    await deployDiamondAndFacets(diamondCutCtName, diamondCtName, facetNames);

  const initParams = [
    networkConfig[chainId]["addrGelOps"],
    ADDR_GEL_OPS_PROXY_FACTORY,
    ctDiamond.address,
    ADDR_GEL_FEE,
    minContractGelatoBalance,
    networkConfig[chainId]["addrSFHost"],
    addressesSuperTokens,
  ] as any;
  await cutFacets(
    ctDiamondCut,
    facetCutProcedures,
    facetInitsCtName,
    initParams
  );

  return [ctDiamond.address, "empty"];
};

export const contractVerify = async (currentDeployedFolderDir: string) => {
  const { getNamedAccounts, getChainId, deployments } = hre;
  const { log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  const files = getFiles(currentDeployedFolderDir);
  const addressCut = getADiamondAddress(files, "Cut");

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    console.log(`Verifying for: ${filePath}`);
    const contractName = filePath.split("/").at(-1)?.split(".").at(0);

    const openJSON = fs.readFileSync(filePath, "utf-8");
    const contractData = JSON.parse(openJSON);

    const contractPath = getContractRelativePath(
      contractName!,
      CONTRACT_PARENT_FOLDER
    );
    const contractPathVerify = `${contractPath}:${contractName}`;

    // sorting args

    let args: any[];
    if (contractName === "Diamond") {
      args = [deployer, addressCut];
    } else {
      args = [];
    }

    // verify
    try {
      await hre.run("verify:verify", {
        // https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html#using-programmatically
        address: contractData.address,
        constructorArguments: args,
        contract: contractPathVerify,
      });
    } catch (err) {
      console.log(err);
    }
  }
};

module.exports = {
  testDeployParams,
  contractDeploy,
  contractVerify,
};
