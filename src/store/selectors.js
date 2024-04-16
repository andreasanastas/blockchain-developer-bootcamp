import { createSelector } from "reselect";
import { get, groupBy, reject, maxBy, minBy } from "lodash";
import moment from 'moment'
import { ethers } from "ethers";

const GREEN = '#25CE8F'
const RED = '#F45353'

const tokens = state => get(state, 'tokens.contracts')

const allOrders = state => get(state, 'exchange.allOrders.data', [])
const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
const filledOrders = state => get(state, 'exchange.filledOrders.data', [])

const openOrders = state => {
  const all = allOrders(state)
  const filled = filledOrders(state)
  const cancelled = cancelledOrders(state)

  const openOrders = reject(all, (order) => {
    const orderFilled = filled.some((o) => o.id.toString() === order.id.toString())
    const orderCancelled = cancelled.some((o) => o.id.toString() === order.id.toString())
    return(orderFilled || orderCancelled)
  })

  return openOrders

}

const decorateOrder = (order, tokens) => {
    let token0Amount, token1Amount
    if (order.tokenGive === tokens[1].address) {
        token0Amount = order.amountGive
        token1Amount = order.amountGet
    } else {
        token0Amount = order.amountGet
        token1Amount = order.amountGive
    }

    let tokenPrice = Math.round((token1Amount / token0Amount)* 100000) / 100000

    return ({
        ...order,
        token0Amount: ethers.utils.formatUnits(token0Amount, 'ether'),
        token1Amount: ethers.utils.formatUnits(token1Amount, 'ether'),
        tokenPrice: tokenPrice,
        formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ssa d MMM D')
    })
}
// ORDER BOOK SELECTOR
// ------------------------------------------------------------------------------------------------------------------------
export const orderBookSelector = createSelector(
    openOrders, 
    tokens, 
    (orders, tokens) => {
        //check for tokens
        if (!tokens[0] || !tokens[1]) { return }
        //filter tokens by market
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

        orders = decorateOrderBookOrders(orders, tokens)

        orders = groupBy(orders, 'orderType')

        //sort buy order by token price
        const buyOrders = get(orders, 'buy', [])

        //sort sell order by token price

        orders = {
            ...orders,
            buyOrders: buyOrders.sort((a,b) => b.tokenPrice - a.tokenPrice),
        }
        const sellOrders = get(orders, 'sell', [])

        orders = {
            ...orders,
            sellOrders: sellOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)      
        }
        //console.log (orders)
        return orders
})
const decorateOrderBookOrders = (orders, tokens) => {
    return(
        //decorate orders
        orders.map((order) => {
            order = decorateOrder (order, tokens)
            order = decorateOrderBookOrder (order, tokens)
            return(order)
        })
    )
}

const decorateOrderBookOrder = (order, tokens) => {
  const orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'

  return({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderFillAction: (orderType === 'buy' ? 'sell' : 'buy')
  })
}

// PRICE CHART SELECTOR
// ------------------------------------------------------------------------------------------------------------------------

export const priceChartSelector = createSelector(
    filledOrders, 
    tokens, 
    (orders, tokens) => {
        //check for tokens
        if (!tokens[0] || !tokens[1]) { return }

        //filter tokens by market
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

        // sort orders by date ascending to comapre history
        orders = orders.sort((a, b) => a.timestamp - b.timestamp)

        //decorate orders - add display attributes
        orders = orders.map((o) => decorateOrder(o, tokens))

        let secondLastOrder, lastOrder
        [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length -1)

        const lastPrice = get(lastOrder, 'tokenPrice', 0)

        const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)

        return({
            lastPrice: lastPrice, 
            lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
            series: [{
                data: buildGraphData(orders)
            }]
        })
        
    })

    const buildGraphData = (orders) => {
        //grou the orders by the hour
        orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('day').format())

        //get each hour where data exists

        const hours = Object.keys(orders)

        const graphData = hours.map((hour) => {
            //fetch orders from current hour
            const group = orders[hour]

            //calculate price values: open, high, low, close
            const open = group[0]
            const high = maxBy(group, 'tokenPrice')
            const low = minBy(group, 'tokenPrice')
            const close = group[group.length - 1]

            return({
                x: new Date(hour),
                y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
            })
        })
        return graphData
    }
