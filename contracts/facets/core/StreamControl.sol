// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.2;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

import {LibStream} from "../../libraries/core/LibStream.sol";
import {LibAutomate} from "../../libraries/core/LibAutomate.sol";
import {IStreamControl} from "../../interfaces/core/IStreamControl.sol";

import "../../services/gelato/Types.sol";

error InvalidSuperToken();
error InvalidFlowRate();
error InvalidFlowLifespan();
error InsufficientContractGelatoBalance();

contract StreamControl is IStreamControl {
    using CFAv1Library for CFAv1Library.InitData;

    event TaskId(address indexed sender, bytes32 taskId);

    function flowCreateAndScheduleDelete(
        ISuperToken _superToken,
        address _receiver,
        address _app,
        int96 _flowRateReceiver,
        int96 _flowRateApp,
        uint256 _flowLifespan
    ) external {
        if (!LibStream._storageStream().superTokens[_superToken])
            revert InvalidSuperToken();
        if (_flowLifespan <= 0) revert InvalidFlowLifespan();
        if (_flowRateReceiver <= 0 || _flowRateApp <= 0)
            revert InvalidFlowRate();

        if (
            LibAutomate._getContractGelatoBalance() <=
            LibAutomate._storageAutomate().minContractGelatoBalance
        ) revert InsufficientContractGelatoBalance();

        LibStream._storageStream()._cfaLib.createFlowByOperator(
            msg.sender,
            _receiver,
            _superToken,
            _flowRateReceiver
        );
        LibStream._storageStream()._cfaLib.createFlowByOperator(
            msg.sender,
            _app,
            _superToken,
            _flowRateApp
        );

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](2),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.TIME;
        moduleData.modules[1] = Module.SINGLE_EXEC;

        moduleData.args[0] = LibAutomate._timeModuleArg(
            block.timestamp + _flowLifespan,
            _flowLifespan
        );

        bytes memory execData = abi.encodeWithSelector(
            this.deleteFlow.selector,
            _superToken,
            msg.sender,
            _receiver,
            _app
        );

        bytes32 taskId = LibAutomate._storageAutomate().ops.createTask(
            address(this), // address(this) = address of diamond
            execData,
            moduleData,
            address(0)
        );

        emit TaskId(msg.sender, taskId);
    }

    function deleteFlow(
        ISuperToken _superToken,
        address _sender, // should be EOA (sender of flow)
        address _receiver,
        address _app
    ) public {
        LibAutomate._requireOnlyGelatoOpsOrParticipants(_sender, _receiver);

        LibStream._storageStream()._cfaLib.deleteFlowByOperator(
            _sender,
            _receiver,
            _superToken
        );
        LibStream._storageStream()._cfaLib.deleteFlowByOperator(
            _sender,
            _app,
            _superToken
        );
    }

    function deleteFlowAndCancelSchedule(
        ISuperToken _superToken,
        address _receiver,
        address _app,
        bytes32 _taskId
    ) external {
        /**
         * TODO: reject if very close to scheduled timestamp??
         * if dont check and hit this condition, and bug effects?
         * TEST !!
         */
        if (!LibStream._storageStream().superTokens[_superToken])
            revert InvalidSuperToken();

        deleteFlow(_superToken, msg.sender, _receiver, _app);

        LibAutomate._storageAutomate().ops.cancelTask(_taskId);
    }
}
