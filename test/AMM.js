const { expect } = require('chai')
const { ethers } = require('hardhat')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('AMM', () => {
  let deployer, liquidityProvider, token1, token2, amm, transaction, result

  beforeEach(async () => {
    // Get accounts
    const accounts = await ethers.getSigners()
    deployer = accounts[0]
    liquidityProvider = accounts[1]

    // Deploy DAPP & USD tokens
    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy('DappU Token', 'DAPP', tokens(1000000))
    token2 = await Token.deploy('USD Token', 'USD', tokens(1000000))

    // Deploy AMM
    const AMM = await ethers.getContractFactory('AMM')
    amm = await AMM.deploy(token1.address, token2.address)

    //Send tokens to LP
    transaction = await token1.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    transaction = await token2.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()
  })

  describe('Deployment', () => {
    it('has an address', async () => {
      expect(await amm.address).to.not.equal(0x0)
    })

    it('stores token 1', async () => {
      expect(await amm.token1()).to.equal(token1.address)
    })

    it('stores token 2', async () => {
      expect(await amm.token2()).to.equal(token2.address)
    })
  })

  describe('Swapping Tokens', () => {
    it('facilitates swapping tokens', async () => {
      let amount = tokens(100000)

      //Approve LP tokens for transfer
      transaction = await token1.connect(deployer).approve(amm.address, amount)
      await transaction.wait()

      transaction = await token2.connect(deployer).approve(amm.address, amount)
      await transaction.wait()

      // Add liquidity from deployer
      transaction = await amm.connect(deployer).addLiquidity(amount, amount)
      await transaction.wait()

      // Check AMM receives tokens
      expect(await token1.balanceOf(amm.address)).to.equal(amount)
      expect(await token2.balanceOf(amm.address)).to.equal(amount)

      // Check token balances inside amm are correct
      expect(await amm.token1Balance()).to.equal(amount)
      expect(await amm.token2Balance()).to.equal(amount)

      // Check K value    https://github.com/peterolson/BigInteger.js
      //expect(await amm.K()).to.equal(BigInt(amount * amount))

      // Check deployer shares & amm total shares
      expect(await amm.shares(deployer.address)).to.equal(tokens(100))
      expect(await amm.totalShares()).to.equal(tokens(100))

      ///////////////////////////////////////////////////////////
      // LP Adds more liquidity
      //

      amount = tokens(50000)
      //Approve LP tokens for transfer
      transaction = await token1.connect(liquidityProvider).approve(amm.address, amount)
      await transaction.wait()

      transaction = await token2.connect(liquidityProvider).approve(amm.address, amount)
      await transaction.wait()

      // Calculate token 2 deposit amount
      let token2Deposit = await amm.calculateToken2Deposit(amount)

      // Add liquidity from LP
      transaction = await amm.connect(liquidityProvider).addLiquidity(amount, token2Deposit)
      await transaction.wait()

      // Check LP shares and amm total shares
      expect(await amm.shares(liquidityProvider.address)).to.equal(tokens(50))
      expect(await amm.totalShares()).to.equal(tokens(150))

      // Verify deployer shares
      expect(await amm.shares(deployer.address)).to.equal(tokens(100))

    })
  })
})
