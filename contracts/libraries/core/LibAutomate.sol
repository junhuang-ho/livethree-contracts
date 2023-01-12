//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../services/gelato/Types.sol";

// gelato based

error InsufficientContractGelatoBalance();

library LibAutomate {
    using SafeERC20 for IERC20;

    bytes32 constant STORAGE_POSITION_AUTOMATE = keccak256("ds.automate");

    struct StorageAutomate {
        IOps ops;
        ITaskTreasuryUpgradable taskTreasury;
        address _gelato;
        address dedicatedMsgSender;
        address opsProxyFactory;
        address eth;
        uint256 minContractGelatoBalance;
    }

    function _storageAutomate()
        internal
        pure
        returns (StorageAutomate storage s)
    {
        bytes32 position = STORAGE_POSITION_AUTOMATE;
        assembly {
            s.slot := position
        }
    }

    function _requireOnlyDedicatedMsgSender() internal view {
        require(
            msg.sender == _storageAutomate().dedicatedMsgSender,
            "LibAutomate: Only dedicated msg.sender"
        );
    }

    function _requireOnlyGelatoOpsOrParticipants(
        address _sender,
        address _receiver
    ) internal view {
        require(
            msg.sender == address(_storageAutomate().ops) ||
                msg.sender == _sender ||
                msg.sender == _receiver,
            "LibAutomate: Only Gelato Ops or Flow Participants"
        );
    }

    function _setGelatoContracts(address _ops) internal {
        _storageAutomate().ops = IOps(_ops);
        _storageAutomate()._gelato = IOps(_ops).gelato();
        _storageAutomate().taskTreasury = _storageAutomate().ops.taskTreasury();
    }

    function _setGelatoProxy(address _opsProxyFactory, address _taskCreator)
        internal
    {
        (address dedicatedMsgSender, ) = IOpsProxyFactory(_opsProxyFactory)
            .getProxyOf(_taskCreator);

        _storageAutomate().dedicatedMsgSender = dedicatedMsgSender;
        _storageAutomate().opsProxyFactory = _opsProxyFactory;
    }

    function _setGelatoFeeAddress(address _feeAddress) internal {
        _storageAutomate().eth = _feeAddress;
    }

    function _getGelatoAddresses()
        internal
        view
        returns (
            address,
            address,
            address,
            address,
            address,
            address
        )
    {
        return (
            address(_storageAutomate().ops),
            address(_storageAutomate().taskTreasury),
            _storageAutomate()._gelato,
            _storageAutomate().dedicatedMsgSender,
            _storageAutomate().opsProxyFactory,
            _storageAutomate().eth
        );
    }

    function _transfer(uint256 _fee, address _feeToken) internal {
        if (_feeToken == _storageAutomate().eth) {
            (bool success, ) = _storageAutomate()._gelato.call{value: _fee}("");
            require(success, "LibAutomate: _transfer failed");
        } else {
            SafeERC20.safeTransfer(
                IERC20(_feeToken),
                _storageAutomate()._gelato,
                _fee
            );
        }
    }

    function _getFeeDetails()
        internal
        view
        returns (uint256 fee, address feeToken)
    {
        (fee, feeToken) = _storageAutomate().ops.getFeeDetails();
    }

    function _resolverModuleArg(
        address _resolverAddress,
        bytes memory _resolverData
    ) internal pure returns (bytes memory) {
        return abi.encode(_resolverAddress, _resolverData);
    }

    function _timeModuleArg(uint256 _startTime, uint256 _interval)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode(uint128(_startTime), uint128(_interval));
    }

    function _proxyModuleArg() internal pure returns (bytes memory) {
        return bytes("");
    }

    function _singleExecModuleArg() internal pure returns (bytes memory) {
        return bytes("");
    }

    function _withdrawGelatoFunds(uint256 _amount) internal {
        _storageAutomate().taskTreasury.withdrawFunds(
            payable(msg.sender),
            _storageAutomate().eth,
            _amount
        );
    } // withdrawer address restriction set in facet

    function _depositGelatoFunds(uint256 _amount) internal {
        _storageAutomate().taskTreasury.depositFunds{value: _amount}(
            address(this), // address(this) = address of diamond
            _storageAutomate().eth,
            _amount
        );
    }

    function _setMinContractGelatoBalance(uint256 _value) internal {
        _storageAutomate().minContractGelatoBalance = _value;
    }

    function _getMinContractGelatoBalance() internal view returns (uint256) {
        return _storageAutomate().minContractGelatoBalance;
    }

    function _getContractGelatoBalance() internal view returns (uint256) {
        return
            _storageAutomate().taskTreasury.userTokenBalance(
                address(this),
                LibAutomate._storageAutomate().eth
            );
    }

    function _requireSufficientContractGelatoBalance() internal view {
        if (
            _getContractGelatoBalance() <=
            _storageAutomate().minContractGelatoBalance
        ) revert InsufficientContractGelatoBalance();
    }
}
