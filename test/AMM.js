const { expect } = require('chai')
const { ethers } = require('hardhat')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens
const shares = ether

describe('AMM', () => {
  let deployer, liquidityProvider, investor1, investor2, token1, token2, amm, transaction, result

  beforeEach(async () => {
    // Get accounts
    const accounts = await ethers.getSigners()
    deployer = accounts[0]
    liquidityProvider = accounts[1]
    investor1 = accounts[2]
    investor2 = accounts[3]

    // Deploy DAPP & USD tokens
    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy('DappU Token', 'DAPP', tokens(1000000))
    token2 = await Token.deploy('USD Token', 'USD', tokens(1000000))

    // Deploy AMM
    const AMM = await ethers.getContractFactory('AMM')
    amm = await AMM.deploy(token1.address, token2.address)

    // Send tokens to LP
    transaction = await token1.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    transaction = await token2.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    // Send tokens to investors
    transaction = await token1.connect(deployer).transfer(investor1.address, tokens(100000))
    await transaction.wait()

    transaction = await token2.connect(deployer).transfer(investor2.address, tokens(100000))
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

      let balance, extimate

      //Approve deployer tokens for transfer
      transaction = await token1.connect(deployer).approve(amm.address, amount)
      await transaction.wait()

      transaction = await token2.connect(deployer).approve(amm.address, amount)
      await transaction.wait()

      // Add liquidity from deployer
      transaction = await amm.connect(deployer).addLiquidity(amount, amount)
      result = await transaction.wait()

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

      // Check deposit emits an event with args
      await expect(transaction).to.emit(amm, 'Deposit').withArgs(
        deployer.address,
        tokens(100000),
        tokens(100000),
        tokens(100000),
        tokens(100000),
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      )

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

      ///////////////////////////////////////////////////////////
      // Investor 1 Swaps Tokens
      //

      amount = tokens(100000)

      // Approve tokens for swap
      transaction = await token1.connect(investor1).approve(amm.address, amount)
      await transaction.wait()

      // Check investor1 token2 balance before swap
      balance = await token2.balanceOf(investor1.address)
      expect(balance).to.equal(0)

      // Estimate amount of token2 investor1 will receive after swap (includes slippage)
      estimate = await amm.calculateToken1Swap(tokens(1))

      // Swap token1 for token2
      transaction = await amm.connect(investor1).swapToken1(tokens(1))
      result = await transaction.wait()

      // Check for swap event
      await expect(transaction).to.emit(amm, 'Swap').withArgs(
        investor1.address,
        token1.address,
        tokens(1),
        token2.address,
        estimate,
        await amm.token1Balance(),
        await amm.token2Balance(),
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      )

      // Check token2 balance after swap
      expect(await token2.balanceOf(investor1.address)).to.equal(estimate)

      //Check AMM token balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
      expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

      ///////////////////////////////////////////////////////////
      // Investor 1 Swaps More Tokens
      //

      // Check investor1 token2 balance before swap
      balance = await token2.balanceOf(investor1.address)

      // Estimate amount of token2 investor1 will receive after swap (includes slippage)
      estimate = await amm.calculateToken1Swap(tokens(1000))

      // Swap token1 for token2
      transaction = await amm.connect(investor1).swapToken1(tokens(1000))
      result = await transaction.wait()

      ///////////////////////////////////////////////////////////
      // Investor 2 Swaps Tokens
      //

      // Approve
      transaction = await token2.connect(investor2).approve(amm.address, amount)
      await transaction.wait()

      // Balance check
      expect(await token1.balanceOf(investor2.address)).to.equal(0)

      // Estimate
      estimate = await amm.calculateToken2Swap(tokens(1))

      // Swap
      transaction = await amm.connect(investor2).swapToken2(tokens(1))
      result = await transaction.wait()

      // Check event
      await expect(transaction).to.emit(amm, 'Swap').withArgs(
        investor2.address,
        token2.address,
        tokens(1),
        token1.address,
        estimate,
        await amm.token1Balance(),
        await amm.token2Balance(),
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      )

      // Check balance
      expect(await token1.balanceOf(investor2.address)).to.equal(estimate)

      // Check balance sync
      expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
      expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

      ///////////////////////////////////////////////////////////
      // Remove liquidity
      //

      let share = await amm.shares(liquidityProvider.address)

      let tokenAmounts = await amm.calculateTokenWithdraw(share)

      // Remove all of LP's liquidity
      transaction = await amm.connect(liquidityProvider).removeLiquidity(share)
      result = await transaction.wait()

      // Check for withdraw function
      await expect(transaction).to.emit(amm, 'Withdraw').withArgs(
        liquidityProvider.address,
        tokenAmounts[0],
        tokenAmounts[1],
        await amm.token1Balance(),
        await amm.token2Balance(),
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      )

      // LP should have 0 shares
      expect(await amm.shares(liquidityProvider.address)).to.equal(0)

      // Deployer should have 100 shares
      expect(await amm.shares(deployer.address)).to.equal(shares(100))

      // Total shares should be 100 shares
      expect(await amm.totalShares()).to.equal(shares(100))

    })
  })
})
