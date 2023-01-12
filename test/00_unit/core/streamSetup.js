const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

const { testDeployParams, contractDeploy } = require("../../../scripts/main");

describe("StreamSetup", async () => {
  let ctStreamSetup;
  let ctStreamSetup2;
  let diamondAddress;
  let deployer;
  let chainId;

  let addressSFHost;
  let addressUSDCxMumbai;
  let addressDAIxMumbai;

  before(async function () {
    const { getChainId } = hre;
    chainId = await getChainId();

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    other = accounts[1];

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

    ctStreamSetup = await ethers.getContractAt(
      "StreamSetup",
      diamondAddress,
      deployer
    );

    ctStreamSetup2 = await ethers.getContractAt(
      "StreamSetup",
      diamondAddress,
      other
    );

    // ----- mumbai addresses ----- //
    addressSFHost = "0xEB796bdb90fFA0f28255275e16936D25d3418603";
    addressUSDCxMumbai = "0x42bb40bF79730451B11f6De1CbA222F17b87Afd7";
    addressDAIxMumbai = "0x1305F6B6Df9Dc47159D12Eb7aC2804d4A33173c2";
  });

  describe("setConstantFlowAgreement", function () {
    it("Should revert if caller is not role", async function () {
      await expect(ctStreamSetup2.setConstantFlowAgreement(addressSFHost)).to.be
        .reverted;
    });
    it("Should setup CFAV1 for contract"); // TODO: requires mock CFA contract to be tested
  });
  describe("getSuperfluidAddresses", function () {
    it("Should return SF addresses", async function () {
      const addr = await ctStreamSetup.getSuperfluidAddresses();
      expect(addr).to.be.equal(addressSFHost);
    });
  });
  describe("hasSupportedSuperToken", function () {
    it("Should support", async function () {
      const isSupport = await ctStreamSetup.hasSupportedSuperToken(
        addressUSDCxMumbai
      );
      expect(isSupport).to.be.equal(true);
    });
    it("Should not support", async function () {
      const isSupport = await ctStreamSetup.hasSupportedSuperToken(
        addressDAIxMumbai
      );
      expect(isSupport).to.be.equal(false);
    });
  });
  describe("appendSuperToken", function () {
    it("Should revert if caller is not role", async function () {
      await expect(ctStreamSetup2.appendSuperToken(addressDAIxMumbai)).to.be
        .reverted;
    });
    it("Should add supertoken", async function () {
      var isSupport = await ctStreamSetup.hasSupportedSuperToken(
        addressDAIxMumbai
      );
      expect(isSupport).to.be.equal(false);

      var tx = await ctStreamSetup.appendSuperToken(addressDAIxMumbai);
      var rcpt = await tx.wait();

      var isSupport = await ctStreamSetup.hasSupportedSuperToken(
        addressDAIxMumbai
      );
      expect(isSupport).to.be.equal(true);
    });
  });
  describe("removeSuperToken", function () {
    it("Should revert if caller is not role", async function () {
      await expect(ctStreamSetup2.removeSuperToken(addressUSDCxMumbai)).to.be
        .reverted;
    });
    it("Should remove supertoken", async function () {
      var isSupport = await ctStreamSetup.hasSupportedSuperToken(
        addressUSDCxMumbai
      );
      expect(isSupport).to.be.equal(true);

      var tx = await ctStreamSetup.removeSuperToken(addressUSDCxMumbai);
      var rcpt = await tx.wait();

      var isSupport = await ctStreamSetup.hasSupportedSuperToken(
        addressUSDCxMumbai
      );
      expect(isSupport).to.be.equal(false);
    });
  });
  //   describe("getPerc", function () {
  //     it("Should return perc value", async function () {
  //       var perc = await ctStreamSetup.getPerc();
  //       expect(perc).to.be.equal(35);
  //     });
  //   });
  //   describe("setPerc", function () {
  //     it("Should revert if invalid perc value", async function () {
  //       await expect(ctStreamSetup2.setPerc(35)).to.be.reverted;
  //     });
  //     it("Should set perc value", async function () {
  //       var perc = await ctStreamSetup.getPerc();
  //       expect(perc).to.be.equal(35);

  //       var tx = await ctStreamSetup.setPerc(45);
  //       var rcpt = await tx.wait();

  //       var perc = await ctStreamSetup.getPerc();
  //       expect(perc).to.be.equal(45);
  //     });
  //   });
});

// npx hardhat test ./test/00_unit/core/streamSetup.js
