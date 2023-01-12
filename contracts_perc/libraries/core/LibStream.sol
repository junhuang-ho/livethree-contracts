//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.2;

import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import {ISuperfluid, ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

// superfluid based

// error InvalidPerc();

library LibStream {
    using CFAv1Library for CFAv1Library.InitData;

    bytes32 constant STORAGE_POSITION_STREAM = keccak256("ds.stream");

    struct StorageStream {
        ISuperfluid sfHost;
        CFAv1Library.InitData _cfaLib;
        mapping(ISuperToken => bool) superTokens;
        // uint256 perc;
        // mapping(address => bytes32[]) taskIds; // implement this only when have a way to remove taskId by user in scheduled task fn
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

    // function _setPerc(uint256 _value) internal {
    //     if (_value <= 0 || _value > 100) revert InvalidPerc();
    //     _storageStream().perc = _value;
    // }

    // function _getPerc() internal view returns (uint256) {
    //     return _storageStream().perc;
    // }
}
