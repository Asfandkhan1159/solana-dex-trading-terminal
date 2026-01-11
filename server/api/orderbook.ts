// caching
let cachedPrice = 135
let lastPriceFetch = 0
const PRICE_CACHE_TIME = 60000 // 1 minute

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const { pair } = query
    console.log('pair', pair)
    console.log('bird eye key', process.env.BIRDEYE_API_KEY)
    try {
        // Try Birdeye first
        const response = await $fetch('https://public-api.birdeye.so/defi/orderbook', {
            headers: {
                'X-API-KEY': process.env.BIRDEYE_API_KEY || 'demo'
            },
            query: {
                address: 'So11111111111111111111111111111111111111112',
                offset: 0,
                limit: 20
            },
            timeout: 5000
        })

        return response
    } catch (error: any) {
        console.log('error', error)
        console.warn(' Birdeye unavailable, using mock orderbook')

        const now = Date.now()
        if (now - lastPriceFetch > PRICE_CACHE_TIME) {
            try {
                const priceResponse: any = await $fetch('https://api.coingecko.com/api/v3/simple/price', {
                    query: {
                        ids: 'solana',
                        vs_currencies: 'usd'
                    },
                    timeout: 5000
                })

                cachedPrice = priceResponse.solana?.usd || 135
                lastPriceFetch = now
                console.log('Updated cached price:', cachedPrice)
            } catch (priceError) {
                console.warn('Using cached price:', cachedPrice)
            }
        }

        const currentPrice = cachedPrice

        // Generate realistic asks
        const asks = Array.from({ length: 12 }, (_, i) => {
            const price = currentPrice + (i * 0.5) + 0.1
            const amount = (Math.random() * 10 + 1)
            return {
                price: parseFloat(price.toFixed(2)),
                amount: parseFloat(amount.toFixed(3)),
                total: parseFloat((price * amount).toFixed(2))
            }
        }).reverse()

        // Generate realistic bids
        const bids = Array.from({ length: 12 }, (_, i) => {
            const price = currentPrice - (i * 0.5) - 0.1
            const amount = (Math.random() * 10 + 1)
            return {
                price: parseFloat(price.toFixed(2)),
                amount: parseFloat(amount.toFixed(3)),
                total: parseFloat((price * amount).toFixed(2))
            }
        })

        return { asks, bids }
    }
})