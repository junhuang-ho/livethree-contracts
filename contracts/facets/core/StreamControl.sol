// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.2;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

import {LibStream} from "../../libraries/core/LibStream.sol";
import {LibAutomate} from "../../libraries/core/LibAutomate.sol";
import {IStreamControl} from "../../interfaces/core/IStreamControl.sol";

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
        LibStream._requireValidSuperToken(_superToken);
        LibStream._requireValidFlowLifespan(_flowLifespan);
        LibStream._requireValidFlowRates(_flowRateReceiver, _flowRateApp);
        LibAutomate._requireSufficientContractGelatoBalance();

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

        bytes32 taskId = LibStream._scheduleDeleteFlow(
            _superToken,
            _receiver,
            _app,
            _flowLifespan,
            this.deleteFlow.selector
        );

        emit TaskId(msg.sender, taskId);
    }

    function scheduleDeleteFlow(
        ISuperToken _superToken,
        address _receiver,
        address _app,
        uint256 _flowLifespan
    ) external {
        LibStream._requireValidSuperToken(_superToken);
        LibStream._requireValidFlowLifespan(_flowLifespan);
        LibAutomate._requireSufficientContractGelatoBalance();

        bytes32 taskId = LibStream._scheduleDeleteFlow(
            _superToken,
            _receiver,
            _app,
            _flowLifespan,
            this.deleteFlow.selector
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
        LibStream._requireValidSuperToken(_superToken);

        deleteFlow(_superToken, msg.sender, _receiver, _app);

        LibAutomate._storageAutomate().ops.cancelTask(_taskId);
    }
}
