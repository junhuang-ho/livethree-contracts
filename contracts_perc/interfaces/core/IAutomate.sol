// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAutomate {
    function setGelatoContracts(address _ops) external;

    function setGelatoProxy(address _opsProxyFactory, address _taskCreator)
        external;

    function setGelatoFeeAddress(address _feeAddress) external;

    function getGelatoAddresses()
        external
        view
        returns (
            address,
            address,
            address,
            address,
            address,
            address
        );

    function withdrawGelatoFunds(uint256 _amount) external;

    function depositGelatoFunds() external payable;
}
