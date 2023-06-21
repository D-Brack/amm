import { createSelector } from "reselect"

const tokens = state => state.tokens.contracts
const swaps = state => state.amm.swaps

export const chartSelector = createSelector(tokens, swaps, (tokens, swaps) => {
  if (!tokens[0] || !tokens[1]) {return}

  swaps = swaps.filter((swap) => swap.args.tokenGet === tokens[0].address || swap.args.tokenGet === tokens[1].address)
  swaps = swaps.filter((swap) => swap.args.tokenGive === tokens[0].address || swap.args.tokenGive === tokens[1].address)

  swaps = swaps.sort((a, b) => a.args.timestamp - b.args.timestamp)

  swaps = swaps.map((swap) => decorateSwap(swap))

  const prices = swaps.map((swap) => swap.rate)

  swaps = swaps.sort((a, b) => b.args.timestamp - a.args.timestamp)

  return ({
    swaps: swaps,
    series: [{
      name: 'Rate',
      data: prices
    }]
  })
})

const decorateSwap = (swap) => {
  const precision = 100000

  let rate = swap.args.token2Balance / swap.args.token1Balance

  rate = Math.round(rate * precision) / precision

  return ({
    ...swap,
    rate
  })
}
