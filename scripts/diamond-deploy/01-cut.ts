const hre = require("hardhat");
import { ethers } from "hardhat";

import { networkConfig } from "../common";
import { contractDeploy } from "../main";

const main = async () => {
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

  await contractDeploy(
    diamondCutCtName,
    diamondCtName,
    facetNames,
    facetInitsCtName,
    minContractGelatoBalance,
    addressesSuperTokens
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat run scripts/diamond-deploy/01-cut.ts --network mumbai
