const hre = require("hardhat");
import { ethers } from "hardhat";
const { getSelectors, FacetCutAction } = require("../utilsDiamond");
import { deploy, cutFacets } from "../utils";

import deployedABI from "../../downloaded_abis/test1abi.json";

/**
 * Legend:
 * FNS = function selector(s)
 */

const setup = async () => {
  const { getNamedAccounts, getChainId } = hre;
  //   const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  const accounts = await ethers.getSigners();
  const deployer = accounts[0];

  const now = Date.now();

  return { deployer, chainId, now };
};

const main1 = async () => {
  ////////////////////////////////////////////
  /// ------------------------------------ ///
  /// ----- adds FNS --------------------- ///
  /// ----- adds new facet --------------- ///
  /// ----- no init ---------------------- ///
  /// ------------------------------------ ///
  ////////////////////////////////////////////

  const { deployer, chainId, now } = await setup();

  const deployedDiamondAddress = "0xB95b858090338B08e92633C6fC9E9da25C6e4A69";
  const ctDiamondCut = new ethers.Contract(
    deployedDiamondAddress,
    deployedABI,
    deployer
  );

  const ctNewFacet = await deploy(deployer, chainId, "Test2Facet", now, []);
  const facetCutProcedures = [
    {
      facetAddress: ctNewFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(ctNewFacet),
    },
  ];

  await cutFacets(ctDiamondCut, facetCutProcedures);
};

const main2 = async () => {
  ////////////////////////////////////////////
  /// ------------------------------------ ///
  /// ----- remove FNS ------------------- ///
  /// ----- no facet change -------------- ///
  /// ----- no init ---------------------- ///
  /// ------------------------------------ ///
  ////////////////////////////////////////////

  const { deployer, chainId, now } = await setup();

  const deployedDiamondAddress = "0xB95b858090338B08e92633C6fC9E9da25C6e4A69";
  const ctDiamondCut = new ethers.Contract(
    deployedDiamondAddress,
    deployedABI,
    deployer
  );

  const facetCutProcedures = [
    {
      facetAddress: ethers.constants.AddressZero,
      action: FacetCutAction.Remove,
      functionSelectors: ["0xe5f687b2", "0xcaae8f23"], // get from louper.dev
    },
  ];

  await cutFacets(ctDiamondCut, facetCutProcedures);
};

const addAnotherFacet = async () => {
  const { deployer, chainId, now } = await setup();

  const deployedDiamondAddress = "0xB95b858090338B08e92633C6fC9E9da25C6e4A69";
  const ctDiamondCut = new ethers.Contract(
    deployedDiamondAddress,
    deployedABI,
    deployer
  );

  const ctNewFacet = await deploy(deployer, chainId, "Test3Facet", now, []);
  const facetCutProcedures = [
    {
      facetAddress: ctNewFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(ctNewFacet),
    },
  ];

  await cutFacets(ctDiamondCut, facetCutProcedures);
};

const main3 = async () => {
  ////////////////////////////////////////////
  /// ------------------------------------ ///
  /// ----- replace FNS ------------------ ///
  /// ----- adds new facet --------------- ///
  /// ----- no init ---------------------- ///
  /// ------------------------------------ ///
  ////////////////////////////////////////////

  // TODO: verify Test3Facet and test fn first see output and compare with output AFTER replace
  // npx hardhat verify 0x28B34c5A950609bC8831371912c4bA1f62fE4267 --network mumbai

  const { deployer, chainId, now } = await setup();

  const deployedDiamondAddress = "0xB95b858090338B08e92633C6fC9E9da25C6e4A69";
  const ctDiamondCut = new ethers.Contract(
    deployedDiamondAddress,
    deployedABI,
    deployer
  );

  const ctNewFacet = await deploy(deployer, chainId, "Test3Facet2", now, []);
  const facetCutProcedures = [
    {
      facetAddress: ctNewFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: ["0xebfa4bcc"],
    },
  ];

  await cutFacets(ctDiamondCut, facetCutProcedures);

  // TODO: verify Test3Facet2 and compare output
  // npx hardhat verify 0x0b17F72C5ec5FD358a2F659f16c5c885755bbB98 --network mumbai
};

const main4 = async () => {
  ////////////////////////////////////////////
  /// ------------------------------------ ///
  /// ----- remove FNS ------------------- ///
  /// ----- removes facet ---------------- ///
  /// ----- no init ---------------------- ///
  /// ------------------------------------ ///
  ////////////////////////////////////////////

  const { deployer, chainId, now } = await setup();

  const deployedDiamondAddress = "0xB95b858090338B08e92633C6fC9E9da25C6e4A69";
  const ctDiamondCut = new ethers.Contract(
    deployedDiamondAddress,
    deployedABI,
    deployer
  );

  const facetCutProcedures = [
    {
      facetAddress: ethers.constants.AddressZero,
      action: FacetCutAction.Remove,
      functionSelectors: [
        "0xea36b558",
        "0x8ee8be30",
        "0x884280a6",
        "0xca5fa5c0",
        "0x6dc16b01",
        "0x91d0396b",
        "0x03feeeae",
        "0x2e463958",
        "0x14884309",
        "0x0c103a93",
        "0x5fd6312b",
        "0xe7de23a4",
        "0x792a8e2e",
        "0x0e4cd7fc",
        "0xc670641d",
        "0xd2f0c73e",
        "0x17fd06e7",
        "0xef3f4d78",
      ], // get from louper.dev, all FNS related to a facet
    },
  ];

  await cutFacets(ctDiamondCut, facetCutProcedures);
};

const main5 = async () => {
  ////////////////////////////////////////////
  /// ------------------------------------ ///
  /// ----- mix FNS ---------------------- ///
  /// ----- no init ---------------------- ///
  /// ------------------------------------ ///
  ////////////////////////////////////////////

  const { deployer, chainId, now } = await setup();

  const deployedDiamondAddress = "0xB95b858090338B08e92633C6fC9E9da25C6e4A69";
  const ctDiamondCut = new ethers.Contract(
    deployedDiamondAddress,
    deployedABI,
    deployer
  );

  const ctNewFacet = await deploy(deployer, chainId, "Test4Facet", now, []);
  const facetCutProcedures = [
    {
      facetAddress: ctNewFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(ctNewFacet),
    },
    {
      facetAddress: ethers.constants.AddressZero,
      action: FacetCutAction.Remove,
      functionSelectors: ["0xe7bf600f"],
    },
  ];

  await cutFacets(ctDiamondCut, facetCutProcedures);
};

const main6 = async () => {
  ////////////////////////////////////////////
  /// ------------------------------------ ///
  /// ----- init example ----------------- ///
  /// ------------------------------------ ///
  ////////////////////////////////////////////

  const { deployer, chainId, now } = await setup();

  const deployedDiamondAddress = "0xB95b858090338B08e92633C6fC9E9da25C6e4A69";
  const ctDiamondCut = new ethers.Contract(
    deployedDiamondAddress,
    deployedABI,
    deployer
  );

  const ctNewFacet = await deploy(deployer, chainId, "Test5Facet", now, []);
  const facetCutProcedures = [
    {
      facetAddress: ctNewFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(ctNewFacet),
    },
  ];

  await cutFacets(ctDiamondCut, facetCutProcedures, "InitTest", [5]);

  // TODO: verify Test5Facet and check value
  // npx hardhat verify 0xC6b863c27887E75028a86B93599671618B57b157 --network mumbai
};

const tmpRemove = async () => {
  const { deployer, chainId, now } = await setup();

  const deployedDiamondAddress = "0xB95b858090338B08e92633C6fC9E9da25C6e4A69";
  const ctDiamondCut = new ethers.Contract(
    deployedDiamondAddress,
    deployedABI,
    deployer
  );

  const facetCutProcedures = [
    {
      facetAddress: ethers.constants.AddressZero,
      action: FacetCutAction.Remove,
      functionSelectors: ["0x55241077", "0xae9aad3e", "0xfbf5c5aa"], // get from louper.dev
    },
  ];

  await cutFacets(ctDiamondCut, facetCutProcedures);
};

main1().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

export {};
/**
 * export {}
 * is to prevent block-scope error of "main" being re-declared
 * ref: https://stackoverflow.com/a/50913569/19776131
 */

// npx hardhat run scripts/diamond-upgrades/_sample.ts --network mumbai
