/**
 * diamond-upgrades/DDMMYY_upgrade.ts
 *
 * this is an example of how the file should be named
 * (placed in diamond-upgrades folder)
 * when there is an upgrade to the diamond contract
 */

var main = async () => {
  // TODO
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

export {};
/**
 * export {}
 * is to prevent block-scope error of "main" being re-declared
 * ref: https://stackoverflow.com/a/50913569/19776131
 */
