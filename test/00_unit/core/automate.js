const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

const { testDeployParams, contractDeploy } = require("../../../scripts/main");

const TaskTreasuryUpgradableABI = require("../../../contracts/services/gelato/TaskTreasuryUpgradableABI.json");

describe("Automate", async () => {
  let ctGelatoTreasury;
  let ctAutomate;
  let ctAutomate2;
  let diamondAddress;
  let deployer;
  let chainId;

  let addressZero;
  let addressGelatoOps;
  let addressGelatoTreasury;
  let addressGelatoNetwork;
  let addressGelatoFeeAddr;
  let addressGelatoTaskCreator;
  let addressGelatoOpsProxyFactory;

  let deposit1;
  let deposit2;
  let withdraw;

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

    ctAutomate = await ethers.getContractAt(
      "Automate",
      diamondAddress,
      deployer
    );

    ctAutomate2 = await ethers.getContractAt("Automate", diamondAddress, other);

    // const GelatoOps = await ethers.getContractFactory("Ops"); // localhost mock test
    // const gelatoOps = await GelatoOps.deploy(); // localhost mock test

    // console.log(gelatoOps.address);

    // ------ mumbai addresses ------- //
    addressZero = ethers.constants.AddressZero;
    addressGelatoOps = "0xB3f5503f93d5Ef84b06993a1975B9D21B962892F";
    addressGelatoTreasury = "0x527a819db1eb0e34426297b03bae11F2f8B3A19E";
    addressGelatoNetwork = "0x25aD59adbe00C2d80c86d01e2E05e1294DA84823";
    addressGelatoFeeAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    addressGelatoTaskCreator = diamondAddress;
    addressGelatoOpsProxyFactory = "0xC815dB16D4be6ddf2685C201937905aBf338F5D7";

    ctGelatoTreasury = new ethers.Contract(
      addressGelatoTreasury,
      TaskTreasuryUpgradableABI,
      accounts[0]
    );

    deposit1 = ethers.utils.parseEther("0.00000001");
    deposit2 = ethers.utils.parseEther("0.00000002");
    withdraw = ethers.utils.parseEther("0.000000015");
  });

  describe("getMinContractGelatoBalance", function () {
    it("Should get correct contract gelato balance min amount - set from deployment init", async function () {
      var minBalance = ethers.utils.parseEther("1");
      var amount = await ctAutomate.getMinContractGelatoBalance();
      expect(amount).to.be.equal(minBalance);
    });
  });
  describe("setMinContractGelatoBalance", function () {
    it("Should revert if caller is not role", async function () {
      var minBalance = ethers.utils.parseEther("2");
      await expect(ctAutomate2.setMinContractGelatoBalance(minBalance)).to.be
        .reverted;
    });
    it("Should set min contract gelato balance amount", async function () {
      var amount = await ctAutomate.getMinContractGelatoBalance();
      expect(amount).to.be.equal(ethers.utils.parseEther("1"));

      var minBalance_ = ethers.utils.parseEther("3");
      var tx = await ctAutomate.setMinContractGelatoBalance(minBalance_);
      var rcpt = await tx.wait();

      var amount = await ctAutomate.getMinContractGelatoBalance();
      expect(amount).to.be.equal(minBalance_);
    });
  });
  describe("depositGelatoFunds", function () {
    it("Should all depositors only deposit to contract's gelato address", async function () {
      var balance_1 = await deployer.getBalance();
      var balance_2 = await other.getBalance();

      var balance = await ctGelatoTreasury.userTokenBalance(
        diamondAddress,
        addressGelatoFeeAddr
      );
      expect(balance).to.be.equal(0);
      var tx = await ctAutomate.depositGelatoFunds({
        from: deployer.address,
        value: deposit1,
      });
      var rcpt = await tx.wait();
      var totalGasUsed = rcpt.cumulativeGasUsed.mul(rcpt.effectiveGasPrice);
      var balance = await ctGelatoTreasury.userTokenBalance(
        diamondAddress,
        addressGelatoFeeAddr
      );
      expect(balance).to.be.equal(deposit1);

      var balance_3 = await deployer.getBalance();
      var balance_4 = await other.getBalance();
      expect(balance_3).to.be.equal(balance_1.sub(deposit1).sub(totalGasUsed));
      expect(balance_4).to.be.equal(balance_2);

      var tx = await ctAutomate2.depositGelatoFunds({
        from: other.address,
        value: deposit2,
      });
      var rcpt = await tx.wait();
      var totalGasUsed = rcpt.cumulativeGasUsed.mul(rcpt.effectiveGasPrice);
      var balance = await ctGelatoTreasury.userTokenBalance(
        diamondAddress,
        addressGelatoFeeAddr
      );
      expect(balance).to.be.equal(deposit1.add(deposit2));

      var balance_5 = await deployer.getBalance();
      var balance_6 = await other.getBalance();
      expect(balance_5).to.be.equal(balance_3);
      expect(balance_6).to.be.equal(balance_4.sub(deposit2).sub(totalGasUsed));
    });
  });
  describe("withdrawGelatoFunds", function () {
    it("Should revert if caller don't have role", async function () {
      await expect(ctAutomate2.withdrawGelatoFunds("10000000")).to.be.reverted;
    });
    it("Should withdraw SOME funds to caller's address", async function () {
      var balance_1 = await ctGelatoTreasury.userTokenBalance(
        diamondAddress,
        addressGelatoFeeAddr
      );
      var balance_d = await deployer.getBalance();

      var tx = await ctAutomate.withdrawGelatoFunds(withdraw);
      var rcpt = await tx.wait();
      var totalGasUsed = rcpt.cumulativeGasUsed.mul(rcpt.effectiveGasPrice);

      var balance = await ctGelatoTreasury.userTokenBalance(
        diamondAddress,
        addressGelatoFeeAddr
      );
      var balance_d2 = await deployer.getBalance();

      expect(balance).to.be.equal(balance_1.sub(withdraw));
      expect(balance_d2).to.be.equal(balance_d.add(withdraw).sub(totalGasUsed));
    });
    it("Should withdraw ALL funds to caller's address", async function () {
      var balance_1 = await ctGelatoTreasury.userTokenBalance(
        diamondAddress,
        addressGelatoFeeAddr
      );
      var balance_d = await deployer.getBalance();

      var tx = await ctAutomate.withdrawGelatoFunds(balance_1);
      var rcpt = await tx.wait();
      var totalGasUsed = rcpt.cumulativeGasUsed.mul(rcpt.effectiveGasPrice);

      var balance = await ctGelatoTreasury.userTokenBalance(
        diamondAddress,
        addressGelatoFeeAddr
      );
      var balance_d2 = await deployer.getBalance();

      expect(balance).to.be.equal(0);
      expect(balance_d2).to.be.equal(balance_d.add(withdraw).sub(totalGasUsed));
    });
  });
  describe("getGelatoAddresses", function () {
    it("Should set gelato addresses", async function () {
      var tx = await ctAutomate.setGelatoFeeAddress(addressGelatoFeeAddr);
      var rcpt = await tx.wait();

      const addresses = await ctAutomate.getGelatoAddresses();
      expect(addresses[0]).to.equal(addressGelatoOps);
      expect(addresses[1]).to.equal(addressGelatoTreasury);
      expect(addresses[2]).to.equal(addressGelatoNetwork);
      //   expect(addresses[3]).to.equal(addressGelatoOpsProxyFactory); // dedicated sender (newly deployed proxy addr)
      expect(addresses[4]).to.equal(addressGelatoOpsProxyFactory);
      expect(addresses[5]).to.equal(addressGelatoFeeAddr);
    });
  });
  describe("setGelatoFeeAddress", function () {
    it("Should revert if caller don't have role", async function () {
      await expect(ctAutomate2.setGelatoFeeAddress(addressGelatoFeeAddr)).to.be
        .reverted;
    });
    it("Should set gelato addresses", async function () {
      const addresses_ = await ctAutomate.getGelatoAddresses();
      expect(addresses_[5]).to.equal(addressGelatoFeeAddr);

      var tx = await ctAutomate.setGelatoFeeAddress(addressZero);
      var rcpt = await tx.wait();

      const addresses = await ctAutomate.getGelatoAddresses();
      expect(addresses[5]).to.equal(addressZero);
    });
  });
  describe("setGelatoProxy", function () {
    it("Should revert if caller don't have role", async function () {
      await expect(
        ctAutomate2.setGelatoProxy(
          addressGelatoOpsProxyFactory,
          addressGelatoTaskCreator
        )
      ).to.be.reverted;
    });
    it("Should set gelato addresses", async function () {
      const addresses_ = await ctAutomate.getGelatoAddresses();
      expect(addresses_[4]).to.equal(addressGelatoOpsProxyFactory);

      var tx = await ctAutomate.setGelatoProxy(
        addressGelatoOpsProxyFactory,
        addressGelatoFeeAddr
      );
      var rcpt = await tx.wait();

      const addresses = await ctAutomate.getGelatoAddresses();
      expect(addresses[4]).to.equal(addressGelatoOpsProxyFactory);
    });
  });

  //   describe("setGelatoContracts", function () {
  //     it("Should revert if caller don't have role", async function () {
  //       await expect(ctAutomate2.setGelatoContracts(addressGelatoOps)).to.be
  //         .reverted;
  //     });
  //     it("Should set gelato addresses", async function () {
  //       var tx = await ctAutomate.setGelatoContracts(addressGelatoOps);
  //       var rcpt = await tx.wait();

  //       const addresses = await ctAutomate.getGelatoAddresses();
  //       expect(addresses[0]).to.equal(addressGelatoOps);
  //       expect(addresses[1]).to.equal(addressGelatoTreasury);
  //       expect(addresses[2]).to.equal(addressGelatoNetwork);
  //       //   expect(addresses[3]).to.equal(addressZero);
  //       //   expect(addresses[4]).to.equal(addressZero);
  //       //   expect(addresses[5]).to.equal(addressZero);
  //     });
  //   });

  describe("setGelatoContracts", function () {
    it("Should set gelato addresses"); // TODO: difficult to test on hardhat-forked-mumbai, better have hardhat + mocks
  });
});

// npx hardhat test ./test/00_unit/core/automate.js
