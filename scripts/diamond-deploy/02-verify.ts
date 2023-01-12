import { contractVerify } from "../main";

const CURRENT_DEPLOYED_FOLDER = "mumbai_1673430171488";
const CURRENT_DEPLOYED_FOLDER_DIR = __dirname
  .substring(0, __dirname.lastIndexOf("/"))
  .split("/scripts")
  .at(0)!
  .concat(`/deployments/${CURRENT_DEPLOYED_FOLDER}`);

contractVerify(CURRENT_DEPLOYED_FOLDER_DIR).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat run scripts/diamond-deploy/02-verify.ts --network mumbai
