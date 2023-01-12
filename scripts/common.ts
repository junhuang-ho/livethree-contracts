export const CONTRACT_PARENT_FOLDER = "livethree-contracts";
export const ZERO_BYTES = "0x";

export const ADDR_GEL_OPS_PROXY_FACTORY =
  "0xC815dB16D4be6ddf2685C201937905aBf338F5D7";
export const ADDR_GEL_FEE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const networkConfig = {
  default: {
    name: "hardhat",
  },
  31337: {
    name: "localhost",
    addrUSDCx: "0x42bb40bF79730451B11f6De1CbA222F17b87Afd7", // using mumbai data
    addrDAIx: "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f", // using mumbai data
    addrSFHost: "0xEB796bdb90fFA0f28255275e16936D25d3418603", // using mumbai data
    addrCFAV1: "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873", // using mumbai data
    addrGelNet: "0x25aD59adbe00C2d80c86d01e2E05e1294DA84823", // using mumbai data
    addrGelOps: "0xB3f5503f93d5Ef84b06993a1975B9D21B962892F", // using mumbai data
    addrGelTreasury: "0x527a819db1eb0e34426297b03bae11F2f8B3A19E", // using mumbai data
  },
  1: {
    name: "mainnet",
  },
  5: {
    name: "goerli",
  },
  137: {
    name: "polygon",
  },
  80001: {
    name: "mumbai",
    addrUSDCx: "0x42bb40bF79730451B11f6De1CbA222F17b87Afd7",
    addrDAIx: "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f",
    addrSFHost: "0xEB796bdb90fFA0f28255275e16936D25d3418603",
    addrCFAV1: "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873",
    addrGelNet: "0x25aD59adbe00C2d80c86d01e2E05e1294DA84823",
    addrGelOps: "0xB3f5503f93d5Ef84b06993a1975B9D21B962892F",
    addrGelTreasury: "0x527a819db1eb0e34426297b03bae11F2f8B3A19E",
  },
} as any;

module.exports = {
  CONTRACT_PARENT_FOLDER,
  //   CURRENT_DEPLOYED_FOLDER,
  //   CURRENT_DEPLOYED_FOLDER_DIR,
  ADDR_GEL_OPS_PROXY_FACTORY,
  ADDR_GEL_FEE,
  ZERO_BYTES,
  networkConfig,
};
