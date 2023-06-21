import { ethers } from 'ethers'

import { setProvider, setNetwork, setAccount } from './reducers/provider'
import { setContracts, setSymbols, balancesLoaded } from './reducers/tokens'
import { setContract, sharesLoaded, depositRequest, depositSuccess, depositFail, swapRequest, swapSuccess, swapFail } from './reducers/amm'

import TOKEN_ABI from '../abis/Token.json'
import AMM_ABI from '../abis/AMM.json'
import config from '../config.json';

// Load network and account info

export const loadProvider = (dispatch) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  dispatch(setProvider(provider))

  return provider
}

export const loadNetwork = async (provider, dispatch) => {
  const { chainId } = await provider.getNetwork()
  dispatch(setNetwork(chainId))

  return chainId
}

export const loadAccount = async (dispatch) => {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  const account = ethers.utils.getAddress(accounts[0])
  dispatch(setAccount(account))

  return account
}

// Load contracts

export const loadTokens = async (chainId, provider, dispatch) => {
  const dapp = new ethers.Contract(config[chainId].dapp.address, TOKEN_ABI, provider)
  const usd = new ethers.Contract(config[chainId].usd.address, TOKEN_ABI, provider)

  dispatch(setContracts([dapp, usd]))
  dispatch(setSymbols([await dapp.symbol(), await usd.symbol() ]))

  return ([dapp, usd])
}

export const loadAMM = async (chainId, provider, dispatch) => {
  const amm = new ethers.Contract(config[chainId].amm.address, AMM_ABI, provider)

  dispatch(setContract(amm))

  return amm
}

// Load balances and shares

export const loadBalances = async (amm, tokens, account, dispatch) => {
  const balance1 = await tokens[0].balanceOf(account)
  const balance2 = await tokens[1].balanceOf(account)

  dispatch(balancesLoaded([
    ethers.utils.formatUnits(balance1.toString(), 'ether'),
    ethers.utils.formatUnits(balance2.toString(), 'ether')
  ]))

  const shares = await amm.shares(account)
  dispatch(sharesLoaded(ethers.utils.formatUnits(shares.toString(), 'ether')))
}

// Add Liquidity

export const addLiquidity = async (provider, amm, tokens, amounts, dispatch) => {
  dispatch(depositRequest())

  try {

    const signer = await provider.getSigner()

    let transaction

    console.log('0')
    transaction = await tokens[0].connect(signer).approve(amm.address, amounts[0])
    await transaction.wait()

    console.log('1')
    transaction = await tokens[1].connect(signer).approve(amm.address, amounts[1])
    await transaction.wait()

    console.log('2')
    transaction = await amm.connect(signer).addLiquidity(amounts[0], amounts[1])
    await transaction.wait()

    dispatch(depositSuccess(transaction.hash))

  } catch (error) {
    dispatch(depositFail())
  }
}

// Swap

export const swap = async (provider, amm, token, symbol, amount, dispatch) => {
  try {
    dispatch(swapRequest())

    let transaction

    const signer = await provider.getSigner()

    transaction = await token.connect(signer).approve(amm.address, amount)
    await transaction.wait()

    if (symbol === 'DAPP') {
      transaction = await amm.connect(signer).swapToken1(amount)
    } else {
      transaction = await amm.connect(signer).swapToken2(amount)
    }

    await transaction.wait()

    dispatch(swapSuccess(transaction.hash))
  } catch (error) {
    dispatch(swapFail())
  }
}
