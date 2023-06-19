import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Loading from './Loading';

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadAMM
} from '../store/interactions'

// ABIs: Import your contract ABIs here
// import TOKEN_ABI from '../abis/Token.json'

// Config: Import your network config here
// import config from '../config.json';

function App() {
  const dispatch = useDispatch()

  const loadBlockchainData = async () => {
    // Fetch provider
    const provider = await loadProvider(dispatch)

    // Fetch chain id
    const chainId = await loadNetwork(provider, dispatch)

    // Fetch accounts
    const account = await loadAccount(dispatch)

    // Fetch contracts
    const tokens = await loadTokens(chainId, provider, dispatch)

    const amm = await loadAMM(chainId, provider, dispatch)

    // Fetch token balances
    //await loadBalances(tokens, account, dispatch)
  }

  useEffect(() => {
    loadBlockchainData()
  });

  return(
    <Container>
      <Navigation account={'0x0...'} />

      <h1 className='my-4 text-center'>React Hardhat Template</h1>

    </Container>
  )
}

export default App;
