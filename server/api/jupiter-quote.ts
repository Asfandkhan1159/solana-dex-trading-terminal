// Cache at module level
let cachedPrices: any = {}
let lastCoinGeckoFetch = 0
const COINGECKO_CACHE_TIME = 60000 // 1 minute

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const { inputMint, outputMint, amount, slippageBps } = query

    if (!inputMint || !outputMint || !amount) {
        throw createError({
            statusCode: 400,
            message: 'Missing parameters'
        })
    }

    console.log('📤 Fetching quote for:', { inputMint, outputMint, amount })

    try {
        const response = await $fetch('https://quote-api.jup.ag/v6/quote', {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SolanaDEX/1.0',
                'Content-Type': 'application/json'
            },
            query: {
                inputMint: inputMint as string,
                outputMint: outputMint as string,
                amount: amount as string,
                slippageBps: slippageBps as string || '50',
                onlyDirectRoutes: 'false'
            },
            timeout: 5000
        })

        console.log('✅ Jupiter API Success')
        return response

    } catch (jupiterError: any) {
        console.warn('⚠️ Jupiter unavailable, using CoinGecko prices')

        try {
            const tokenMap: Record<string, string> = {
                'So11111111111111111111111111111111111111112': 'solana',
                'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
                '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'raydium'
            }

            const inputToken = tokenMap[inputMint as string]
            const outputToken = tokenMap[outputMint as string]

            if (!inputToken || !outputToken) {
                throw new Error('Unsupported token pair')
            }

            // ✅ Use cache or fetch
            const now = Date.now()
            if (now - lastCoinGeckoFetch > COINGECKO_CACHE_TIME) {
                const prices = await $fetch<Record<string, { usd: number }>>('https://api.coingecko.com/api/v3/simple/price', {
                    query: {
                        ids: `${inputToken},${outputToken}`,
                        vs_currencies: 'usd'
                    },
                    timeout: 5000
                })

                cachedPrices = prices
                lastCoinGeckoFetch = now
                console.log('📊 Updated CoinGecko cache')
            } else {
                console.log('💾 Using cached CoinGecko prices')
            }

            const inputPrice = cachedPrices[inputToken]?.usd || 0
            const outputPrice = cachedPrices[outputToken]?.usd || 1
            const exchangeRate = inputPrice / outputPrice

            const inputAmount = parseInt(amount as string)
            const inputDecimals = inputMint === 'So11111111111111111111111111111111111111112' ? 9 : 6
            const outputDecimals = outputMint === 'So11111111111111111111111111111111111111112' ? 9 : 6

            const humanInput = inputAmount / Math.pow(10, inputDecimals)
            const humanOutput = humanInput * exchangeRate
            const outputAmount = Math.floor(humanOutput * Math.pow(10, outputDecimals))

            console.log('💱 Exchange calculation:', {
                inputPrice: `$${inputPrice}`,
                outputPrice: `$${outputPrice}`,
                rate: exchangeRate,
                humanInput,
                humanOutput,
                outputAmount
            })

            return {
                inputMint: inputMint as string,
                inAmount: amount as string,
                outputMint: outputMint as string,
                outAmount: outputAmount.toString(),
                otherAmountThreshold: Math.floor(outputAmount * 0.995).toString(),
                swapMode: 'ExactIn',
                slippageBps: parseInt(slippageBps as string) || 50,
                priceImpactPct: 0.1,
                platformFee: null,
                routePlan: [
                    {
                        swapInfo: {
                            ammKey: 'coingecko-pricing',
                            label: 'CoinGecko Prices',
                            inputMint: inputMint as string,
                            outputMint: outputMint as string,
                            inAmount: amount as string,
                            outAmount: outputAmount.toString(),
                            feeAmount: '5000',
                            feeMint: inputMint as string
                        },
                        percent: 100
                    }
                ]
            }

        } catch (coinGeckoError: any) {
            console.error('❌ CoinGecko also failed:', coinGeckoError)
            throw createError({
                statusCode: 500,
                message: 'All price sources unavailable'
            })
        }
    }
})