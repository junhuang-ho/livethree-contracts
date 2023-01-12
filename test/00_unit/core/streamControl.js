const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

const { testDeployParams, contractDeploy } = require("../../../scripts/main");

const TaskTreasuryUpgradableABI = require("../../../contracts/services/gelato/TaskTreasuryUpgradableABI.json");
const OpsImplementationABI = require("../../../contracts/services/gelato/OpsImplementationABI.json");
const ISuperfluid = require("@superfluid-finance/ethereum-contracts/build/contracts/ISuperfluid.json");
const IConstantFlowAgreementV1 = require("@superfluid-finance/ethereum-contracts/build/contracts/IConstantFlowAgreementV1.json");
const { equal } = require("assert");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("StreamControl", async () => {
  let ctStreamControl;
  let ctStreamControl2;
  let diamondAddress;
  let deployer;
  let other;
  let chainId;
  let gelatoExecutor;
  let deposit1;

  let ctGelatoOps;
  let ctSFHost;
  let iCFAV1;
  let addressSFHost;
  let addressCFAV1;
  let addressGelatoFeeAddr;

  let flowLifespanSeconds;
  let flowRateReceiver;
  let flowRateApp;
  const ZERO_BYTES = "0x";
  const GELATO_FEE = ethers.utils.parseEther("0.1");
  const RANDOM_BYTES32 =
    "0x09c62162b93593261a6deefd5bb6c14dd4758c6973ed2b41f331a88d04c11222";

  let encodeTimeArgs;
  let theTaskId;
  let theStartTime;

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

    ctStreamControl = await ethers.getContractAt(
      "StreamControl",
      diamondAddress,
      deployer
    );

    ctStreamControl2 = await ethers.getContractAt(
      "StreamControl",
      diamondAddress,
      other
    );

    ctStreamControl7 = await ethers.getContractAt(
      "StreamControl",
      diamondAddress,
      receiver
    );

    ctAutomate = await ethers.getContractAt(
      "Automate",
      diamondAddress,
      deployer
    );

    deposit1 = ethers.utils.parseEther("0.2");

    // ----- mumbai addresses ----- //
    addressSFHost = "0xEB796bdb90fFA0f28255275e16936D25d3418603";
    addressCFAV1 = "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873";
    addressUSDCxMumbai = "0x42bb40bF79730451B11f6De1CbA222F17b87Afd7";
    addressDAIxMumbai = "0x1305F6B6Df9Dc47159D12Eb7aC2804d4A33173c2";
    addressGelatoFeeAddr = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    addressGelatoOps = "0xB3f5503f93d5Ef84b06993a1975B9D21B962892F";
    addressGelatoNetwork = "0x25aD59adbe00C2d80c86d01e2E05e1294DA84823";
    addressGelatoTreasury = "0x527a819db1eb0e34426297b03bae11F2f8B3A19E";

    ctGelatoTreasury = new ethers.Contract(
      addressGelatoTreasury,
      TaskTreasuryUpgradableABI,
      deployer
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [addressGelatoNetwork],
    });
    gelatoExecutor = ethers.provider.getSigner(addressGelatoNetwork);

    ctGelatoOps = new ethers.Contract(
      addressGelatoOps,
      OpsImplementationABI,
      gelatoExecutor
    );
    ctGelatoOps2 = new ethers.Contract(
      addressGelatoOps,
      OpsImplementationABI,
      receiver
    );
    ctGelatoOps3 = new ethers.Contract(
      addressGelatoOps,
      OpsImplementationABI,
      other
    );
    ctSFHost = new ethers.Contract(addressSFHost, ISuperfluid.abi, deployer);
    ctSFHost2 = new ethers.Contract(addressSFHost, ISuperfluid.abi, other);
    ctCFAV1 = new ethers.Contract(
      addressCFAV1,
      IConstantFlowAgreementV1.abi,
      deployer
    );
    iCFAV1 = new ethers.utils.Interface(IConstantFlowAgreementV1.abi);
    // ctCFAV1 = new ethers.Contract(
    //   addressCFAV1,
    //   IConstantFlowAgreementV1.abi,
    //   deployer
    // );

    flowRateReceiver = ethers.utils.parseEther("0.00001");
    flowRateApp = ethers.utils.parseEther("0.00002");
    flowLifespanSeconds = 60;

    encodeTimeArgs = (startTime, interval) => {
      const encoded = ethers.utils.defaultAbiCoder.encode(
        ["uint128", "uint128"],
        [startTime, interval]
      );

      return encoded;
    };

    ModuleData = {
      RESOLVER: "RESOLVER",
      TIME: "TIME",
      PROXY: "PROXY",
      SINGLE_EXEC: "SINGLE_EXEC",
    };
  });

  describe("deleteFlow", function () {
    it("Should revert if caller is non role", async function () {
      await expect(
        ctStreamControl.deleteFlow(
          addressUSDCxMumbai,
          other.address,
          receiver.address,
          app.address
        )
      ).to.be.revertedWith("LibAutomate: Only Gelato Ops or Flow Participants");
    });
    it("Should revert if permission not given by caller to allow diamond contract to delete flow", async function () {
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);
      const dataCreateFlowReceiver = iCFAV1.encodeFunctionData("createFlow", [
        addressUSDCxMumbai,
        receiver.address,
        flowRateReceiver,
        ZERO_BYTES,
      ]);
      const dataCreateFlowApp = iCFAV1.encodeFunctionData("createFlow", [
        addressUSDCxMumbai,
        app.address,
        flowRateApp,
        ZERO_BYTES,
      ]);
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataCreateFlowReceiver,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataCreateFlowApp,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(flowRateReceiver);
      expect(flowDataApp.flowRate).to.be.equal(flowRateApp);
      await expect(
        ctStreamControl.deleteFlow(
          addressUSDCxMumbai,
          deployer.address,
          receiver.address,
          app.address
        )
      ).to.be.reverted;
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(flowRateReceiver);
      expect(flowDataApp.flowRate).to.be.equal(flowRateApp);
      // manually turn offf flows
      const dataDeleteFlowReceiver = iCFAV1.encodeFunctionData("deleteFlow", [
        addressUSDCxMumbai,
        deployer.address,
        receiver.address,
        ZERO_BYTES,
      ]);
      const dataDeleteFlowApp = iCFAV1.encodeFunctionData("deleteFlow", [
        addressUSDCxMumbai,
        deployer.address,
        app.address,
        ZERO_BYTES,
      ]);
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataDeleteFlowReceiver,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataDeleteFlowApp,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);
    });
    it("Should delete flow if caller is sender", async function () {
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);
      const dataCreateFlowReceiver = iCFAV1.encodeFunctionData("createFlow", [
        addressUSDCxMumbai,
        receiver.address,
        flowRateReceiver,
        ZERO_BYTES,
      ]);
      const dataCreateFlowApp = iCFAV1.encodeFunctionData("createFlow", [
        addressUSDCxMumbai,
        app.address,
        flowRateApp,
        ZERO_BYTES,
      ]);
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataCreateFlowReceiver,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataCreateFlowApp,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(flowRateReceiver);
      expect(flowDataApp.flowRate).to.be.equal(flowRateApp);
      var dataPermission = await ctCFAV1.getFlowOperatorData(
        addressUSDCxMumbai,
        deployer.address,
        diamondAddress
      );
      expect(dataPermission.permissions).to.be.equal(0);
      // grant permission // delete only
      var dataPermission_ = iCFAV1.encodeFunctionData(
        "updateFlowOperatorPermissions",
        [addressUSDCxMumbai, diamondAddress, "4", "0", ZERO_BYTES]
      );
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataPermission_,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var dataPermission = await ctCFAV1.getFlowOperatorData(
        addressUSDCxMumbai,
        deployer.address,
        diamondAddress
      );
      expect(dataPermission.permissions).to.be.equal(4);
      var tx = await ctStreamControl.deleteFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address,
        app.address
      );
      var rcpt = await tx.wait();
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);
      // clean up permission
      var dataPermission_ = iCFAV1.encodeFunctionData(
        "revokeFlowOperatorWithFullControl",
        [addressUSDCxMumbai, diamondAddress, ZERO_BYTES]
      );
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataPermission_,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var dataPermission = await ctCFAV1.getFlowOperatorData(
        addressUSDCxMumbai,
        deployer.address,
        diamondAddress
      );
      expect(dataPermission.permissions).to.be.equal(0);
    });
    it("Should delete flow if caller is receiver", async function () {
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);
      const dataCreateFlowReceiver = iCFAV1.encodeFunctionData("createFlow", [
        addressUSDCxMumbai,
        receiver.address,
        flowRateReceiver,
        ZERO_BYTES,
      ]);
      const dataCreateFlowApp = iCFAV1.encodeFunctionData("createFlow", [
        addressUSDCxMumbai,
        app.address,
        flowRateApp,
        ZERO_BYTES,
      ]);
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataCreateFlowReceiver,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataCreateFlowApp,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(flowRateReceiver);
      expect(flowDataApp.flowRate).to.be.equal(flowRateApp);
      var dataPermission = await ctCFAV1.getFlowOperatorData(
        addressUSDCxMumbai,
        deployer.address,
        diamondAddress
      );
      expect(dataPermission.permissions).to.be.equal(0);
      // grant permission // delete only
      var dataPermission_ = iCFAV1.encodeFunctionData(
        "updateFlowOperatorPermissions",
        [addressUSDCxMumbai, diamondAddress, "4", "0", ZERO_BYTES]
      );
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataPermission_,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var dataPermission = await ctCFAV1.getFlowOperatorData(
        addressUSDCxMumbai,
        deployer.address,
        diamondAddress
      );
      expect(dataPermission.permissions).to.be.equal(4);
      var tx = await ctStreamControl7.deleteFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address,
        app.address
      );
      var rcpt = await tx.wait();
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);
      // clean up permission
      var dataPermission_ = iCFAV1.encodeFunctionData(
        "revokeFlowOperatorWithFullControl",
        [addressUSDCxMumbai, diamondAddress, ZERO_BYTES]
      );
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataPermission_,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var dataPermission = await ctCFAV1.getFlowOperatorData(
        addressUSDCxMumbai,
        deployer.address,
        diamondAddress
      );
      expect(dataPermission.permissions).to.be.equal(0);
    });
    it("Should delete flow if caller is gelato ops");
  });

  describe("flowCreateAndScheduleDelete", function () {
    it("Should revert if supertoken not supported", async function () {
      await expect(
        ctStreamControl.flowCreateAndScheduleDelete(
          addressDAIxMumbai,
          receiver.address,
          app.address,
          flowRateReceiver,
          flowRateApp,
          flowLifespanSeconds
        )
      ).to.be.revertedWithCustomError(ctStreamControl, "InvalidSuperToken");
    });
    it("Should revert if 0 input flow lifespan duration", async function () {
      await expect(
        ctStreamControl.flowCreateAndScheduleDelete(
          addressUSDCxMumbai,
          receiver.address,
          app.address,
          flowRateReceiver,
          flowRateApp,
          0
        )
      ).to.be.revertedWithCustomError(ctStreamControl, "ZeroFlowLifespan");
    });
    it("Should revert if 0 input flow rate for receiver", async function () {
      await expect(
        ctStreamControl.flowCreateAndScheduleDelete(
          addressUSDCxMumbai,
          receiver.address,
          app.address,
          0,
          flowRateApp,
          flowLifespanSeconds
        )
      ).to.be.revertedWithCustomError(ctStreamControl, "ZeroFlowRate");
    });
    it("Should revert if 0 input flow rate for app", async function () {
      await expect(
        ctStreamControl.flowCreateAndScheduleDelete(
          addressUSDCxMumbai,
          receiver.address,
          app.address,
          flowRateReceiver,
          0,
          flowLifespanSeconds
        )
      ).to.be.revertedWithCustomError(ctStreamControl, "ZeroFlowRate");
    });
    it("Should revert insufficient contract gelato balance", async function () {
      await expect(
        ctStreamControl.flowCreateAndScheduleDelete(
          addressUSDCxMumbai,
          receiver.address,
          app.address,
          flowRateReceiver,
          flowRateApp,
          flowLifespanSeconds
        )
      ).to.be.revertedWithCustomError(
        ctStreamControl,
        "InsufficientContractGelatoBalance"
      );

      var tx = await ctAutomate.depositGelatoFunds({
        from: deployer.address,
        value: ethers.utils.parseEther("5"),
      });
      var rcpt = await tx.wait();
    });
    it("Should revert if permission not given by caller to allow diamond contract to create flow", async function () {
      await expect(
        ctStreamControl.flowCreateAndScheduleDelete(
          addressUSDCxMumbai,
          receiver.address,
          app.address,
          flowRateReceiver,
          flowRateApp,
          flowLifespanSeconds
        )
      ).to.be.reverted;
    });
    it("Should start stream and schedule delete (emit taskId), with delete being executed in future timestamp of block", async function () {
      var dataPermission = await ctCFAV1.getFlowOperatorData(
        addressUSDCxMumbai,
        deployer.address,
        diamondAddress
      );
      expect(dataPermission.permissions).to.be.equal(0);

      var dataPermission_ = iCFAV1.encodeFunctionData(
        "authorizeFlowOperatorWithFullControl",
        [addressUSDCxMumbai, diamondAddress, ZERO_BYTES]
      );
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataPermission_,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();

      var dataPermission = await ctCFAV1.getFlowOperatorData(
        addressUSDCxMumbai,
        deployer.address,
        diamondAddress
      );
      expect(dataPermission.permissions).to.be.equal(7);

      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);

      var tx = await ctAutomate.depositGelatoFunds({
        from: deployer.address,
        value: deposit1,
      });
      var rcpt = await tx.wait();

      var tx = await ctStreamControl.flowCreateAndScheduleDelete(
        addressUSDCxMumbai,
        receiver.address,
        app.address,
        flowRateReceiver,
        flowRateApp,
        flowLifespanSeconds
      );
      var rcpt = await tx.wait();
      var rc = await ethers.provider.getTransactionReceipt(
        rcpt.transactionHash
      );
      var block = await ethers.provider.getBlock(rc.blockNumber);
      var startTime = block.timestamp;

      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(flowRateReceiver);
      expect(flowDataApp.flowRate).to.be.equal(flowRateApp);
      expect(flowDataReceiver.deposit).to.be.lessThan(
        flowRateReceiver.mul(60).mul(60).mul(4)
      );
      expect(flowDataApp.deposit).to.be.lessThan(
        flowRateApp.mul(60).mul(60).mul(4)
      );

      var execData = ctStreamControl.interface.encodeFunctionData(
        "deleteFlow",
        [addressUSDCxMumbai, deployer.address, receiver.address, app.address]
      );

      const timeArgs = encodeTimeArgs(
        startTime + flowLifespanSeconds,
        flowLifespanSeconds
      );
      moduleData = {
        modules: [1, 3],
        args: [timeArgs],
      };

      await helpers.time.increase(30);

      await expect(
        ctGelatoOps.connect(gelatoExecutor).exec(
          diamondAddress, //deployer.address, // deployer.address,
          diamondAddress,
          execData,
          moduleData,
          GELATO_FEE,
          addressGelatoFeeAddr,
          true,
          true
        )
      ).to.be.revertedWith("Ops.preExecCall: TimeModule: Too early");

      await helpers.time.increase(30);

      await ctGelatoOps.connect(gelatoExecutor).exec(
        diamondAddress, //deployer.address, // deployer.address,
        diamondAddress,
        execData,
        moduleData,
        GELATO_FEE,
        addressGelatoFeeAddr,
        true,
        true
      );

      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);
    });
  });

  describe("deleteFlowAndCancelSchedule", function () {
    it("Should revert if supertoken not supported", async function () {
      await expect(
        ctStreamControl.deleteFlowAndCancelSchedule(
          addressDAIxMumbai,
          receiver.address,
          app.address,
          RANDOM_BYTES32
        )
      ).to.be.revertedWithCustomError(ctStreamControl, "InvalidSuperToken");
    });
    it("Should revert if flow not active", async function () {
      await expect(
        ctStreamControl.deleteFlowAndCancelSchedule(
          addressUSDCxMumbai,
          receiver.address,
          app.address,
          RANDOM_BYTES32
        )
      ).to.be.reverted;
    });
    it("Should revert if not taskId", async function () {
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);
      const dataCreateFlowReceiver = iCFAV1.encodeFunctionData("createFlow", [
        addressUSDCxMumbai,
        receiver.address,
        flowRateReceiver,
        ZERO_BYTES,
      ]);
      const dataCreateFlowApp = iCFAV1.encodeFunctionData("createFlow", [
        addressUSDCxMumbai,
        app.address,
        flowRateApp,
        ZERO_BYTES,
      ]);
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataCreateFlowReceiver,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataCreateFlowApp,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(flowRateReceiver);
      expect(flowDataApp.flowRate).to.be.equal(flowRateApp);

      await expect(
        ctStreamControl.deleteFlowAndCancelSchedule(
          addressUSDCxMumbai,
          receiver.address,
          app.address,
          RANDOM_BYTES32
        )
      ).to.be.reverted;

      // manually turn offf flows
      const dataDeleteFlowReceiver = iCFAV1.encodeFunctionData("deleteFlow", [
        addressUSDCxMumbai,
        deployer.address,
        receiver.address,
        ZERO_BYTES,
      ]);
      const dataDeleteFlowApp = iCFAV1.encodeFunctionData("deleteFlow", [
        addressUSDCxMumbai,
        deployer.address,
        app.address,
        ZERO_BYTES,
      ]);
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataDeleteFlowReceiver,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataDeleteFlowApp,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);
    });
    it("Should end flow for all receivers and cancel auto task", async function () {
      //   var dataPermission = await ctCFAV1.getFlowOperatorData(
      //     addressUSDCxMumbai,
      //     deployer.address,
      //     diamondAddress
      //   );
      //   expect(dataPermission.permissions).to.be.equal(0);

      //   var dataPermission_ = iCFAV1.encodeFunctionData(
      //     "authorizeFlowOperatorWithFullControl",
      //     [addressUSDCxMumbai, diamondAddress, ZERO_BYTES]
      //   );
      //   var tx = await ctSFHost.callAgreement(
      //     addressCFAV1,
      //     dataPermission_,
      //     ZERO_BYTES
      //   );
      //   var rcpt = await tx.wait();

      var dataPermission = await ctCFAV1.getFlowOperatorData(
        addressUSDCxMumbai,
        deployer.address,
        diamondAddress
      );
      expect(dataPermission.permissions).to.be.equal(7);

      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);

      var tx = await ctAutomate.depositGelatoFunds({
        from: deployer.address,
        value: deposit1,
      });
      var rcpt = await tx.wait();

      var tx = await ctStreamControl.flowCreateAndScheduleDelete(
        addressUSDCxMumbai,
        receiver.address,
        app.address,
        flowRateReceiver,
        flowRateApp,
        flowLifespanSeconds
      );
      var rcpt = await tx.wait();
      var rc = await ethers.provider.getTransactionReceipt(
        rcpt.transactionHash
      );
      var block = await ethers.provider.getBlock(rc.blockNumber);
      var startTime = block.timestamp;

      var dataEvent = rcpt.events?.filter((x) => {
        return x.event == "TaskId";
      });
      var taskId = dataEvent.at(0).args.taskId; //
      /**
       * NOTE: in frontend need reliable way to get this.
       * If underlying contract changes events count, this event might not be at pos0
       */

      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(flowRateReceiver);
      expect(flowDataApp.flowRate).to.be.equal(flowRateApp);

      var tx = await ctStreamControl.deleteFlowAndCancelSchedule(
        addressUSDCxMumbai,
        receiver.address,
        app.address,
        taskId
      );
      var rcpt = await tx.wait();

      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);

      await helpers.time.increase(100);

      var execData = ctStreamControl.interface.encodeFunctionData(
        "deleteFlow",
        [addressUSDCxMumbai, deployer.address, receiver.address, app.address]
      );

      const timeArgs = encodeTimeArgs(
        startTime + flowLifespanSeconds,
        flowLifespanSeconds
      );
      moduleData = {
        modules: [1, 3],
        args: [timeArgs],
      };

      await expect(
        ctGelatoOps.connect(gelatoExecutor).exec(
          diamondAddress, //deployer.address, // deployer.address,
          diamondAddress,
          execData,
          moduleData,
          GELATO_FEE,
          addressGelatoFeeAddr,
          true,
          true
        )
      ).to.be.revertedWith("Ops.exec: Task not found");
    });
  });

  describe("external cancelling", function () {
    it("Should revert if non flow participant tries to end flow", async function () {
      var dataPermission = await ctCFAV1.getFlowOperatorData(
        addressUSDCxMumbai,
        deployer.address,
        diamondAddress
      );
      expect(dataPermission.permissions).to.be.equal(7);

      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);

      var tx = await ctAutomate.depositGelatoFunds({
        from: deployer.address,
        value: deposit1,
      });
      var rcpt = await tx.wait();

      var tx = await ctStreamControl.flowCreateAndScheduleDelete(
        addressUSDCxMumbai,
        receiver.address,
        app.address,
        flowRateReceiver,
        flowRateApp,
        flowLifespanSeconds
      );
      var rcpt = await tx.wait();
      var rc = await ethers.provider.getTransactionReceipt(
        rcpt.transactionHash
      );
      var block = await ethers.provider.getBlock(rc.blockNumber);
      theStartTime = block.timestamp;

      var dataEvent = rcpt.events?.filter((x) => {
        return x.event == "TaskId";
      });
      theTaskId = dataEvent.at(0).args.taskId;

      // cancel flow
      const dataDeleteFlowReceiver = iCFAV1.encodeFunctionData("deleteFlow", [
        addressUSDCxMumbai,
        deployer.address,
        receiver.address,
        ZERO_BYTES,
      ]);
      const dataDeleteFlowApp = iCFAV1.encodeFunctionData("deleteFlow", [
        addressUSDCxMumbai,
        deployer.address,
        app.address,
        ZERO_BYTES,
      ]);
      await expect(
        ctSFHost2.callAgreement(
          addressCFAV1,
          dataDeleteFlowReceiver,
          ZERO_BYTES
        )
      ).to.be.reverted;
      await expect(
        ctSFHost2.callAgreement(addressCFAV1, dataDeleteFlowApp, ZERO_BYTES)
      ).to.be.reverted;
    });
    it("Should revert if not sender tries to end task", async function () {
      // 1. try receiver
      await expect(ctGelatoOps2.cancelTask(theTaskId)).to.be.reverted;
      // 2. try other
      await expect(ctGelatoOps3.cancelTask(theTaskId)).to.be.reverted;
      // 3. impersonate gelato
      await expect(ctGelatoOps.cancelTask(theTaskId)).to.be.reverted;

      // clean up
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(flowRateReceiver);
      expect(flowDataApp.flowRate).to.be.equal(flowRateApp);

      var tx = await ctStreamControl.deleteFlowAndCancelSchedule(
        addressUSDCxMumbai,
        receiver.address,
        app.address,
        theTaskId
      );
      var rcpt = await tx.wait();

      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);

      await helpers.time.increase(100);

      var execData = ctStreamControl.interface.encodeFunctionData(
        "deleteFlow",
        [addressUSDCxMumbai, deployer.address, receiver.address, app.address]
      );

      const timeArgs = encodeTimeArgs(
        theStartTime + flowLifespanSeconds,
        flowLifespanSeconds
      );
      moduleData = {
        modules: [1, 3],
        args: [timeArgs],
      };

      await expect(
        ctGelatoOps.connect(gelatoExecutor).exec(
          diamondAddress, //deployer.address, // deployer.address,
          diamondAddress,
          execData,
          moduleData,
          GELATO_FEE,
          addressGelatoFeeAddr,
          true,
          true
        )
      ).to.be.revertedWith("Ops.exec: Task not found");
    });
  });

  describe("scheduleDeleteFlow", function () {
    it("Should revert if supertoken not supported", async function () {
      await expect(
        ctStreamControl.scheduleDeleteFlow(
          addressDAIxMumbai,
          receiver.address,
          app.address,
          flowLifespanSeconds
        )
      ).to.be.revertedWithCustomError(ctStreamControl, "InvalidSuperToken");
    });
    it("Should revert if 0 input flow lifespan duration", async function () {
      await expect(
        ctStreamControl.scheduleDeleteFlow(
          addressUSDCxMumbai,
          receiver.address,
          app.address,
          0
        )
      ).to.be.revertedWithCustomError(ctStreamControl, "ZeroFlowLifespan");
    });
    it("Should revert insufficient contract gelato balance", async function () {
      var balance = await ctGelatoTreasury.userTokenBalance(
        diamondAddress,
        addressGelatoFeeAddr
      );
      expect(balance).to.be.greaterThan(0);

      var tx = await ctAutomate.withdrawGelatoFunds(balance);
      var rcpt = await tx.wait();

      var balance = await ctGelatoTreasury.userTokenBalance(
        diamondAddress,
        addressGelatoFeeAddr
      );
      expect(balance).to.be.equal(0);

      await expect(
        ctStreamControl.scheduleDeleteFlow(
          addressUSDCxMumbai,
          receiver.address,
          app.address,
          flowLifespanSeconds
        )
      ).to.be.revertedWithCustomError(
        ctStreamControl,
        "InsufficientContractGelatoBalance"
      );

      var tx = await ctAutomate.depositGelatoFunds({
        from: deployer.address,
        value: ethers.utils.parseEther("5"),
      });
      var rcpt = await tx.wait();
    });
    it("Should schedule delete flow and ops executes", async function () {
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);
      const dataCreateFlowReceiver = iCFAV1.encodeFunctionData("createFlow", [
        addressUSDCxMumbai,
        receiver.address,
        flowRateReceiver,
        ZERO_BYTES,
      ]);
      const dataCreateFlowApp = iCFAV1.encodeFunctionData("createFlow", [
        addressUSDCxMumbai,
        app.address,
        flowRateApp,
        ZERO_BYTES,
      ]);
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataCreateFlowReceiver,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var tx = await ctSFHost.callAgreement(
        addressCFAV1,
        dataCreateFlowApp,
        ZERO_BYTES
      );
      var rcpt = await tx.wait();
      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(flowRateReceiver);
      expect(flowDataApp.flowRate).to.be.equal(flowRateApp);

      // schedule delete
      var tx = await ctStreamControl.scheduleDeleteFlow(
        addressUSDCxMumbai,
        receiver.address,
        app.address,
        flowLifespanSeconds
      );
      var rcpt = await tx.wait();
      var rc = await ethers.provider.getTransactionReceipt(
        rcpt.transactionHash
      );
      var block = await ethers.provider.getBlock(rc.blockNumber);
      var startTime = block.timestamp;

      var dataEvent = rcpt.events?.filter((x) => {
        return x.event == "TaskId";
      });
      var taskId = dataEvent.at(0).args.taskId;

      var execData = ctStreamControl.interface.encodeFunctionData(
        "deleteFlow",
        [addressUSDCxMumbai, deployer.address, receiver.address, app.address]
      );

      const timeArgs = encodeTimeArgs(
        startTime + flowLifespanSeconds,
        flowLifespanSeconds
      );
      moduleData = {
        modules: [1, 3],
        args: [timeArgs],
      };

      await helpers.time.increase(30);

      await expect(
        ctGelatoOps.connect(gelatoExecutor).exec(
          diamondAddress, //deployer.address, // deployer.address,
          diamondAddress,
          execData,
          moduleData,
          GELATO_FEE,
          addressGelatoFeeAddr,
          true,
          true
        )
      ).to.be.revertedWith("Ops.preExecCall: TimeModule: Too early");

      await helpers.time.increase(30);

      await ctGelatoOps.connect(gelatoExecutor).exec(
        diamondAddress, //deployer.address, // deployer.address,
        diamondAddress,
        execData,
        moduleData,
        GELATO_FEE,
        addressGelatoFeeAddr,
        true,
        true
      );

      var flowDataReceiver = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        receiver.address
      );
      var flowDataApp = await ctCFAV1.getFlow(
        addressUSDCxMumbai,
        deployer.address,
        app.address
      );
      expect(flowDataReceiver.flowRate).to.be.equal(0);
      expect(flowDataApp.flowRate).to.be.equal(0);
    });
  });
});

// npx hardhat test ./test/00_unit/core/streamControl.js
