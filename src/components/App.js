import { useEffect } from 'react';
import  { useDispatch } from 'react-redux'
import config from '../config.json'
import { loadProvider, loadNetwork, loadAccount, loadTokens, loadExchange } from '../store/interactions';
import Navbar from './Navbar';

function App() {

const dispatch = useDispatch()

const loadBlockchainData = async () => {

//connect ethers to blockchain
  const provider = loadProvider(dispatch)

  //fetch network's chain id
  const chainId = await loadNetwork(provider, dispatch)

  //reload page when network changes
  window.ethereum.on('chainChanged', () => {
    window.location.reload()
  })

  //load account and balance from network when changed
  window.ethereum.on('accountsChanged', () => {
    loadAccount(provider, dispatch)
  })

  //token smart contract
  const DAPP = config[chainId].DAPP
  const mETH = config[chainId].mETH
  await loadTokens(provider, [DAPP.address, mETH.address], dispatch)

  //load exchange
  const exchangeConfig = config[chainId].exchange
  await loadExchange (provider, exchangeConfig.address ,dispatch)
}

  useEffect( () => {
    loadBlockchainData()
  })

  return (
    <div>

      <Navbar />

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          {/* Markets */}

          {/* Balance */}

          {/* Order */}

        </section>
        <section className='exchange__section--right grid'>

          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          {/* OrderBook */}

        </section>
      </main>

      {/* Alert */}

    </div>
  );
}

export default App;