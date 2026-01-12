import { defineEventHandler } from 'h3'


let marketCache = {
    price: 139,
    tvl: 8147494971,
    volume24h: 8088935016,
    trades24h: 26929839,
    liquidity: 8147494971,
    lastFetch: 0
}

const CACHE_TTL = 300000
let isFetching = false

export default defineEventHandler(async (event) => {
    const now = Date.now()

    if (now - marketCache.lastFetch < CACHE_TTL || isFetching) {
        const age = Math.floor((now - marketCache.lastFetch) / 1000)
        console.log(` Market cache HIT (${age}s old)`)
        return marketCache
    }

    console.log('Fetching ALL market data from Birdeye...')
    isFetching = true

    try {

        const [priceData, statsData] = await Promise.all([
            $fetch<{ data?: { value?: number } }>('https://public-api.birdeye.so/defi/price', {
                headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY || '' },
                query: { address: 'So11111111111111111111111111111111111111112' },
                timeout: 5000
            }).catch(() => null),

            $fetch<{ data?: { liquidity?: number; v24hUSD?: number; trade24h?: number } }>('https://public-api.birdeye.so/defi/token_overview', {
                headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY || '' },
                query: { address: 'So11111111111111111111111111111111111111112' },
                timeout: 10000
            }).catch(() => null)
        ])

        marketCache = {
            price: priceData?.data?.value || marketCache.price,
            tvl: statsData?.data?.liquidity || marketCache.tvl,
            volume24h: statsData?.data?.v24hUSD || marketCache.volume24h,
            trades24h: statsData?.data?.trade24h || marketCache.trades24h,
            liquidity: statsData?.data?.liquidity || marketCache.liquidity,
            lastFetch: now
        }

        console.log('Market data updated:', { price: marketCache.price, tvl: marketCache.tvl })

    } catch (error: any) {
        console.warn('Birdeye failed, using stale cache')
    } finally {
        isFetching = false
    }

    return marketCache
})