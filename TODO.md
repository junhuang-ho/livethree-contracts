TODO: function to extend end date: 1. cancelTask 2. set new schedule

1. test only role write functions in louper.dev on mumbai
   MAINTAINER_ROLE diamondCut
      <!-- DEFAULT_ADMIN_ROLE grantRole
      DEFAULT_ADMIN_ROLE revokeRole -->
      <!-- TREASURER_ROLE withdrawContractBalance
      STRATEGIST_ROLE setGelatoContracts
      STRATEGIST_ROLE setGelatoFeeAddress
      STRATEGIST_ROLE setGelatoProxy
      STRATEGIST_ROLE setMinContractGelatoBalance
      TREASURER_ROLE withdawGelatoFunds
      STRATEGIST_ROLE appendSuperToken
      STRATEGIST_ROLE removeSuperToken
      STRATEGIST_ROLE setConstantFlowAgreement -->
   0x19eff48ba5eff380b22a9c2cb7bb92e7b25ee58653cf731bf895491297cad24d
2. deploy mumbai and go test in frontend

0xab9bbc59359e70EBdfAB5941bc8546E65BBe02da
0x9743E3Dc18D3A5062AD0bd1f5547047B660B553C
("0xC6b863c27887E75028a86B93599671618B57b157","0",["0x20965255","0x55241077"])}
0x0000000000000000000000000000000000000000
0x

TODO: might need add support for EIP 1271 !!!! (if want to support account abstraction !!)

- so like DApp contract calls `isValidSignature`, and if `magicValue` is returned then its only valid!!!
- `isValidSignature` is implemented in the AA contract wallet and called from the DApp contract
- can always implement in upgrade? (see example of how its called in DApp first !!)

- EIP-1271 interface: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/interfaces/IERC1271.sol
- example of super simple contract wallet with EIP-1271: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/mocks/ERC1271WalletMock.sol#enroll-beta
- example of contract (DApp) calling EIP-1271 (see `callERC1271isValidSignature`): https://eips.ethereum.org/EIPS/eip-1271

- can implement eip-1271 first but as another contract "a copy"
