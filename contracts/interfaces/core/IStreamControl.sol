// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IStreamControl {
    function flowCreateAndScheduleDelete(
        ISuperToken _superToken,
        address _receiver,
        address _app,
        int96 _flowRateReceiver,
        int96 _flowRateApp,
        uint256 _flowLifespan
    ) external;

    function deleteFlow(
        ISuperToken _superToken,
        address _sender,
        address _receiver,
        address _app
    ) external;

    function deleteFlowAndCancelSchedule(
        ISuperToken _superToken,
        address _receiver,
        address _app,
        bytes32 _taskId
    ) external;
}
