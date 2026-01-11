let cachedPrice = 139
let cachedOrderbook: any = null
let lastFetch = 0
const CACHE_TIME = 300000

export default defineEventHandler(async (event) => {
    console.log('Fetching orderbook data...')

    const now = Date.now()

    if (cachedOrderbook && (now - lastFetch < CACHE_TIME)) {
        const age = Math.floor((now - lastFetch) / 1000)
        console.log(`Using cached orderbook (${age}s old)`)
        return cachedOrderbook
    }

    try {
        const priceResponse = await $fetch<{ data?: { value?: number } }>('https://public-api.birdeye.so/defi/price', {
            headers: {
                'X-API-KEY': process.env.BIRDEYE_API_KEY || ''
            },
            query: {
                address: 'So11111111111111111111111111111111111111112'
            },
            timeout: 5000
        })

        cachedPrice = priceResponse.data?.value || 139
        lastFetch = now

        console.log('Birdeye price:', cachedPrice)

    } catch (error: any) {
        const age = Math.floor((now - lastFetch) / 1000)
        console.warn(` Birdeye price failed - using cached (${age}s old):`, cachedPrice)
    }

    const currentPrice = cachedPrice

    const asks = Array.from({ length: 12 }, (_, i) => {
        const price = currentPrice + (i * 0.5) + 0.1
        const amount = (Math.random() * 10 + 1)
        return {
            price: parseFloat(price.toFixed(2)),
            amount: parseFloat(amount.toFixed(3)),
            total: parseFloat((price * amount).toFixed(2))
        }
    }).reverse()

    const bids = Array.from({ length: 12 }, (_, i) => {
        const price = currentPrice - (i * 0.5) - 0.1
        const amount = (Math.random() * 10 + 1)
        return {
            price: parseFloat(price.toFixed(2)),
            amount: parseFloat(amount.toFixed(3)),
            total: parseFloat((price * amount).toFixed(2))
        }
    })

    cachedOrderbook = {
        asks,
        bids,
        source: 'birdeye-price',
        timestamp: now
    }

    return cachedOrderbook
})