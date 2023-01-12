// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUtility {
    function getContractBalance() external view returns (uint256);

    function withdrawContractBalance(uint256 _amount) external;
}
