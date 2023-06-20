import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation'
import Swap from './Swap'
import Deposit from './Deposit'
import Withdraw from './Withdraw'
import Charts from './Charts'
import Tabs from './Tabs'

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadAMM
} from '../store/interactions'

function App() {
  const dispatch = useDispatch()

  const loadBlockchainData = async () => {
    // Fetch provider
    const provider = await loadProvider(dispatch)

    // Fetch chain id
    const chainId = await loadNetwork(provider, dispatch)

    // Fetch contracts
    const tokens = await loadTokens(chainId, provider, dispatch)

    const amm = await loadAMM(chainId, provider, dispatch)

    // Update page/info when Metamask account is changed
    window.ethereum.on('accountsChanged', async () => {
      await loadAccount(dispatch)
    })

    // Update page/info when Metamask network is changed
    window.ethereum.on('chainChanged', async () => {
      window.location.reload()
    })
  }

  useEffect(() => {
    loadBlockchainData()
  });

  return (
    <Container>
      <HashRouter>
        <Navigation />

        <hr />

        <Tabs />

        <Routes>
          <Route exact path='/' element={<Swap />} />
          <Route path='/deposit' element={<Deposit />} />
          <Route path='/withdraw' element={<Withdraw />} />
          <Route path='/charts' element={<Charts />} />
        </Routes>
      </HashRouter>
    </Container>
  )
}

export default App;
