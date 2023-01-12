// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.2;

import {ISuperfluid, ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

import {LibAccessControl} from "../../libraries/utils/LibAccessControl.sol";
import {LibStream} from "../../libraries/core/LibStream.sol";
import {IStreamSetup} from "../../interfaces/core/IStreamSetup.sol";

contract StreamSetup is IStreamSetup {
    function setConstantFlowAgreement(ISuperfluid _sfHost) external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        LibStream._setConstantFlowAgreement(_sfHost);
    }

    function getSuperfluidAddresses() external view returns (address) {
        return LibStream._getSuperfluidAddresses();
    }

    function appendSuperToken(ISuperToken _superToken) external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        LibStream._appendSuperToken(_superToken);
    }

    function removeSuperToken(ISuperToken _superToken) external {
        LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
        LibStream._removeSuperToken(_superToken);
    }

    function hasSupportedSuperToken(ISuperToken _superToken)
        external
        view
        returns (bool)
    {
        return LibStream._hasSupportedSuperToken(_superToken);
    }

    // function setPerc(uint256 _value) external {
    //     LibAccessControl._requireOnlyRole(LibAccessControl.STRATEGIST_ROLE);
    //     LibStream._setPerc(_value);
    // }

    // function getPerc() external view returns (uint256) {
    //     return LibStream._getPerc();
    // }
}
