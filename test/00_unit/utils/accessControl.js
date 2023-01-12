const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

const { testDeployParams, contractDeploy } = require("../../../scripts/main");

describe("AccessControl", async () => {
  let ctAccessControl;
  let ctAccessControl2;
  let diamondAddress;
  let deployer;
  let chainId;
  let roleHash;

  before(async function () {
    const { getChainId } = hre;
    chainId = await getChainId();

    accounts = await ethers.getSigners();
    deployer = accounts[0];

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

    ctAccessControl = await ethers.getContractAt(
      "AccessControl",
      diamondAddress,
      deployer
    );

    ctAccessControl2 = await ethers.getContractAt(
      "AccessControl",
      diamondAddress,
      accounts[1]
    );

    roleHash = await ctAccessControl.getRole("MAINTAINER_ROLE");
  });

  describe("getDefaultAdminRole", function () {
    it("Should return zero bytes (hash)", async function () {
      expect(await ctAccessControl.getDefaultAdminRole()).to.equal(
        ethers.constants.HashZero
      );
    });
  });
  describe("getRole", function () {
    it("Should match hash", async function () {
      const roleHash_ = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["string"], ["MAINTAINER_ROLE"])
      );

      expect(roleHash).to.equal(roleHash_);
    });
  });
  describe("getRoleAdmin", function () {
    it("Should return admin role of role being queried", async function () {
      expect(await ctAccessControl.getRoleAdmin(roleHash)).to.equal(
        ethers.constants.HashZero
      );
    });
  });
  describe("hasRole", function () {
    it("Should return false if no role", async function () {
      expect(
        await ctAccessControl.hasRole(roleHash, accounts[1].address)
      ).to.equal(false);
    });
    it("Should return true if have role", async function () {
      var tx = await ctAccessControl.grantRole(roleHash, accounts[1].address);
      var rcpt = await tx.wait();

      expect(
        await ctAccessControl.hasRole(roleHash, accounts[1].address)
      ).to.equal(true);
    });
  });
  describe("grantRole", function () {
    it("Should revert if caller not admin of quering role", async function () {
      await expect(ctAccessControl2.grantRole(roleHash, accounts[2].address)).to
        .be.reverted;
    });
    it("Should set role to address", async function () {
      expect(
        await ctAccessControl.hasRole(roleHash, accounts[2].address)
      ).to.equal(false);

      var tx = await ctAccessControl.grantRole(roleHash, accounts[2].address);
      var rcpt = await tx.wait();

      expect(
        await ctAccessControl.hasRole(roleHash, accounts[2].address)
      ).to.equal(true);
    });
  });
  describe("renounceRole", function () {
    it("Should remove role from caller's address", async function () {
      expect(
        await ctAccessControl2.hasRole(roleHash, accounts[1].address)
      ).to.equal(true);

      var tx = await ctAccessControl2.renounceRole(roleHash);
      var rcpt = await tx.wait();

      expect(
        await ctAccessControl2.hasRole(roleHash, accounts[1].address)
      ).to.equal(false);
    });
  });
  describe("revokeRole", function () {
    it("Should revert if caller not admin of queried role", async function () {
      await expect(ctAccessControl2.revokeRole(roleHash, deployer.address)).to
        .be.reverted;
    });
    it("Should remove role from address", async function () {
      var tx = await ctAccessControl.revokeRole(roleHash, accounts[1].address);
      var rcpt = await tx.wait();

      expect(
        await ctAccessControl.hasRole(roleHash, accounts[1].address)
      ).to.equal(false);
    });
  });
});

// npx hardhat test ./test/00_unit/utils/accessControl.js
