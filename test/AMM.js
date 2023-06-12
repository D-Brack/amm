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
  })

  describe('Deployment', () => {
    it('stores token 1', async () => {
      expect(await amm.token1()).to.equal(token1.address)
    })

    it('stores token 2', async () => {
      expect(await amm.token2()).to.equal(token2.address)
    })
  })
})
