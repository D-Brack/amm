import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import Table from 'react-bootstrap/Table'
import Chart from 'react-apexcharts'
import { options, series } from "./Charts.config"
import { ethers } from 'ethers'

import { loadAllSwaps } from '../store/interactions'
import { chartSelector } from "../store/selectors"

import Loading from './Loading'

const Charts = () => {
  const dispatch = useDispatch()

  const provider = useSelector(state => state.provider.connection)

  const tokens = useSelector(state => state.tokens.contracts)
  const symbols = useSelector(state => state.tokens.symbols)

  const amm = useSelector(state => state.amm.contract)

  const chart = useSelector(chartSelector)

  useEffect(() => {
    if (provider && amm) {
      loadAllSwaps(provider, amm, dispatch)
    }
  }, [provider, amm, dispatch])

  return(
    <div>
      {provider && amm ? (
        <div>
          <Chart
            options={options}
            series={chart ? chart.series : series}
            type='line'
            width='100%'
            height='100%'
          />

          <hr />

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Tx Hash</th>
                <th>Token Give</th>
                <th>Amt Give</th>
                <th>Token Get</th>
                <th>Amt Get</th>
                <th>User</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {chart.swaps && chart.swaps.map((swap, index) => (
                <tr key={index} >
                  <td>{swap.hash.slice(0, 5) + '...' + swap.hash.slice(-5)}</td>
                  <td>{swap.args.tokenGive === tokens[0].address ? symbols[0] : symbols[1]}</td>
                  <td>{ethers.utils.formatUnits(swap.args.tokenGiveAmount.toString(), 'ether')}</td>
                  <td>{swap.args.tokenGet === tokens[0].address ? symbols[0] : symbols[1]}</td>
                  <td>{ethers.utils.formatUnits(swap.args.tokenGetAmount.toString(), 'ether')}</td>
                  <td>{swap.args.user.slice(0, 5) + '...' + swap.args.user.slice(-4)}</td>
                  <td>{new Date(swap.args.timestamp * 1000)
                    .toLocaleDateString(
                      undefined,
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric'
                      }
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <Loading />
      )}

    </div>
  )
}

export default Charts
