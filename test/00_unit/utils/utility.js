const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

const { testDeployParams, contractDeploy } = require("../../../scripts/main");

const OpsImplementationABI = require("../../../contracts/services/gelato/OpsImplementationABI.json");
const ISuperfluid = require("@superfluid-finance/ethereum-contracts/build/contracts/ISuperfluid.json");
const IConstantFlowAgreementV1 = require("@superfluid-finance/ethereum-contracts/build/contracts/IConstantFlowAgreementV1.json");
const { equal } = require("assert");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("Utility", async () => {
  let ctUtility;
  let ctUtility2;
  let diamondAddress;
  let deployer;
  let other;
  let chainId;
  let amount;

  before(async function () {
    const { getChainId } = hre;
    chainId = await getChainId();

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    other = accounts[1];
    receiver = accounts[7];
    app = accounts[8];

    const {
      diamondCutCtName,
      diamondCtName,
      facetNames,
      facetInitsCtName,
      minContractGelatoBalance,
      addressesSuperTokens,
    } = await testDeployParams();
    [diamondAddress, _] = await contractDeploy(
      diamondCutCtName,
      diamondCtName,
      facetNames,
      facetInitsCtName,
      minContractGelatoBalance,
      addressesSuperTokens
    );

    ctUtility = await ethers.getContractAt("Utility", diamondAddress, deployer);

    ctUtility2 = await ethers.getContractAt("Utility", diamondAddress, other);

    amount = ethers.utils.parseEther("1");
  });
  describe("withdrawContractBalance", function () {
    it("Should revert if caller is not role", async function () {
      await expect(ctUtility2.withdrawContractBalance("100")).to.be.reverted;
    });
    it("Should withdraw contract native balance to caller", async function () {
      var balance_1 = await deployer.getBalance();

      var ctBalance = await ctUtility.getContractBalance();
      expect(ctBalance).to.be.equal(0);

      var tx = await deployer.sendTransaction({
        value: amount,
        to: diamondAddress,
      });
      var rcpt = await tx.wait();
      var totalGasUsed1 = rcpt.cumulativeGasUsed.mul(rcpt.effectiveGasPrice);

      var ctBalance = await ctUtility.getContractBalance();
      expect(ctBalance).to.be.equal(amount);

      var tx = await ctUtility.withdrawContractBalance(amount);
      var rcpt = await tx.wait();
      var totalGasUsed2 = rcpt.cumulativeGasUsed.mul(rcpt.effectiveGasPrice);

      var ctBalance = await ctUtility.getContractBalance();
      expect(ctBalance).to.be.equal(0);

      var balance_2 = await deployer.getBalance();
      expect(balance_2).to.be.equal(
        balance_1.sub(totalGasUsed1).sub(totalGasUsed2)
      );
    });
  });
  describe("getContractBalance", function () {
    it("Should get contract native balance", async function () {
      var ctBalance = await ctUtility.getContractBalance();
      expect(ctBalance).to.be.equal(0);

      var tx = await deployer.sendTransaction({
        value: amount,
        to: diamondAddress,
      });
      var rcpt = await tx.wait();
      //   var totalGasUsed1 = rcpt.cumulativeGasUsed.mul(rcpt.effectiveGasPrice);

      var ctBalance = await ctUtility.getContractBalance();
      expect(ctBalance).to.be.equal(amount);
    });
  });
});

// npx hardhat test ./test/00_unit/utils/utility.js
