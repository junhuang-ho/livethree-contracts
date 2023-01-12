// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {ISuperfluid, ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IStreamSetup {
    function setConstantFlowAgreement(ISuperfluid _sfHost) external;

    function getSuperfluidAddresses() external view returns (address);

    function appendSuperToken(ISuperToken _superToken) external;

    function removeSuperToken(ISuperToken _superToken) external;

    function hasSupportedSuperToken(ISuperToken _superToken)
        external
        view
        returns (bool);

    // function setPerc(uint256 _value) external;

    // function getPerc() external view returns (uint256);
}
