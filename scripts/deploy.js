// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  // Deploy Token
  const Token = await hre.ethers.getContractFactory('Token')

  let token1 = await Token.deploy('DappU', 'DAPP', 1000000)
  await token1.deployed()
  console.log(`DAPP deployed to: ${token1.address}\n`)

  let token2 = await Token.deploy('USD Coin', 'USD', 1000000)
  await token2.deployed()
  console.log(`USD deployed to: ${token2.address}\n`)

  // Deploy AMM
  const AMM = await hre.ethers.getContractFactory('AMM')
  let amm = await AMM.deploy(token1.address, token2.address)
  console.log(`AMM deployed to: ${amm.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
