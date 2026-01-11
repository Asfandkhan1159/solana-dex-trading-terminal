// ✅ Increase cache to 5 minutes
let cachedStats: any = null
let lastFetch = 0
const CACHE_TIME = 300000 // 5 minutes (was 30 seconds)

export default defineEventHandler(async (event) => {
    const now = Date.now()

    if (cachedStats && (now - lastFetch < CACHE_TIME)) {
        const age = Math.floor((now - lastFetch) / 1000)
        console.log(` Using cached stats (${age}s old)`)
        return cachedStats
    }

    try {
        console.log(' Fetching Birdeye market overview...')

        const response = await $fetch<{
            data?: {
                liquidity?: number
                v24hUSD?: number
                trade24h?: number
            }
        }>('https://public-api.birdeye.so/defi/token_overview', {
            headers: {
                'X-API-KEY': process.env.BIRDEYE_API_KEY || ''
            },
            query: {
                address: 'So11111111111111111111111111111111111111112'
            },
            timeout: 10000
        })

        const data = response.data

        cachedStats = {
            tvl: data?.liquidity || 8147494971,
            volume24h: data?.v24hUSD || 8088935016,
            trades24h: data?.trade24h || 26929839,
            liquidity: data?.liquidity || 8147494971
        }

        lastFetch = now

        console.log(' Birdeye stats:', cachedStats)

        return cachedStats

    } catch (error: any) {
        console.warn(' Birdeye stats failed:', error.message)

        if (cachedStats) {
            const age = Math.floor((now - lastFetch) / 1000)
            console.log(` Using stale cache (${age}s old)`)
            return cachedStats
        }

        console.log(' Using mock stats')
        cachedStats = {
            tvl: 8147494971,
            volume24h: 8088935016,
            trades24h: 26929839,
            liquidity: 8147494971
        }

        return cachedStats
    }
})