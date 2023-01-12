// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {ISuperfluid, ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {LibDiamond} from "../libraries/utils/LibDiamond.sol";
import {LibAutomate} from "../libraries/core/LibAutomate.sol";
import {LibStream} from "../libraries/core/LibStream.sol";
import {IERC165} from "../interfaces/utils/IERC165.sol";
import {ICut} from "../interfaces/utils/ICut.sol";
import {ILoupe} from "../interfaces/utils/ILoupe.sol";
import {IAccessControl} from "../interfaces/utils/IAccessControl.sol";
import {IAutomate} from "../interfaces/core/IAutomate.sol";
import {IStreamControl} from "../interfaces/core/IStreamControl.sol";

contract DiamondInit {
    function init(
        address _gelatoOps,
        address _opsProxyFactory,
        address _taskCreator,
        address _feeAddress,
        ISuperfluid _sfHost,
        ISuperToken[] memory _superTokens // uint256 _perc
    ) external {
        LibDiamond.StorageDiamond storage s = LibDiamond._storageDiamond();
        s.supportedInterfaces[type(IERC165).interfaceId] = true;
        s.supportedInterfaces[type(ICut).interfaceId] = true;
        s.supportedInterfaces[type(ILoupe).interfaceId] = true;
        s.supportedInterfaces[type(IAccessControl).interfaceId] = true;
        s.supportedInterfaces[type(IAutomate).interfaceId] = true;
        s.supportedInterfaces[type(IStreamControl).interfaceId] = true;

        LibAutomate._setGelatoContracts(_gelatoOps);
        LibAutomate._setGelatoProxy(_opsProxyFactory, _taskCreator);
        LibAutomate._setGelatoFeeAddress(_feeAddress);
        LibStream._setConstantFlowAgreement(_sfHost);

        for (uint256 i = 0; i < _superTokens.length; i++) {
            LibStream._appendSuperToken(_superTokens[i]);
        }

        // LibStream._setPerc(_perc);
    }
}
