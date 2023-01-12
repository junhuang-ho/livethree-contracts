//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.2;

import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {ISuperfluid, ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import {LibAutomate} from "./LibAutomate.sol";

import "../../services/gelato/Types.sol";

// superfluid based
error InvalidSuperToken();
error ZeroFlowLifespan();
error ZeroFlowRate();

library LibStream {
    using CFAv1Library for CFAv1Library.InitData;

    bytes32 constant STORAGE_POSITION_STREAM = keccak256("ds.stream");

    struct StorageStream {
        ISuperfluid sfHost;
        CFAv1Library.InitData _cfaLib;
        mapping(ISuperToken => bool) superTokens;
    }

    function _storageStream() internal pure returns (StorageStream storage s) {
        bytes32 position = STORAGE_POSITION_STREAM;
        assembly {
            s.slot := position
        }
    }

    function _setConstantFlowAgreement(ISuperfluid _sfHost) internal {
        IConstantFlowAgreementV1 cfa = IConstantFlowAgreementV1(
            address(
                _sfHost.getAgreementClass(
                    keccak256(
                        "org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
                    )
                )
            )
        );
        _storageStream()._cfaLib = CFAv1Library.InitData(_sfHost, cfa);
        _storageStream().sfHost = _sfHost;
    }

    function _getSuperfluidAddresses() internal view returns (address) {
        return address(_storageStream().sfHost);
    }

    function _appendSuperToken(ISuperToken _superToken) internal {
        _storageStream().superTokens[_superToken] = true;
    }

    function _removeSuperToken(ISuperToken _superToken) internal {
        delete _storageStream().superTokens[_superToken];
    }

    function _hasSupportedSuperToken(ISuperToken _superToken)
        internal
        view
        returns (bool)
    {
        return _storageStream().superTokens[_superToken];
    }

    function _requireValidSuperToken(ISuperToken _superToken) internal view {
        if (!_storageStream().superTokens[_superToken])
            revert InvalidSuperToken();
    }

    function _requireValidFlowLifespan(uint256 _flowLifespan) internal pure {
        if (_flowLifespan <= 0) revert ZeroFlowLifespan();
    }

    function _requireValidFlowRates(int96 _flowRateReceiver, int96 _flowRateApp)
        internal
        pure
    {
        if (_flowRateReceiver <= 0 || _flowRateApp <= 0) revert ZeroFlowRate();
    }

    function _scheduleDeleteFlow(
        ISuperToken _superToken,
        address _receiver,
        address _app,
        uint256 _flowLifespan,
        bytes4 _selector
    ) internal returns (bytes32) {
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
            _selector, // this.deleteFlow.selector,
            _superToken,
            msg.sender,
            _receiver,
            _app
        );

        return
            LibAutomate._storageAutomate().ops.createTask(
                address(this), // address(this) = address of diamond
                execData,
                moduleData,
                address(0)
            );
    }
}
