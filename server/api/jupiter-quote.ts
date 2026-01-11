// Cache at module level - NEVER expires unless server restarts
let cachedPrices: Record<string, number> = {
    'So11111111111111111111111111111111111111112': 139, // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1  // USDC
}
let lastBirdeyeFetch = 0
const BIRDEYE_CACHE_TIME = 120000

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const { inputMint, outputMint, amount, slippageBps } = query

    if (!inputMint || !outputMint || !amount) {
        throw createError({
            statusCode: 400,
            message: 'Missing parameters'
        })
    }

    console.log('📤 Quote request:', { inputMint, outputMint, amount })

    try {
        // Try Jupiter first
        const response = await $fetch('https://quote-api.jup.ag/v6/quote', {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SolanaDEX/1.0'
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

        console.log(' Jupiter success')
        return response

    } catch (jupiterError: any) {
        console.warn(' Jupiter unavailable, using Birdeye')

        // USE BIRDEYE INSTEAD OF COINGECKO
        const now = Date.now()

        try {
            // Only fetch if cache expired
            if (now - lastBirdeyeFetch > BIRDEYE_CACHE_TIME) {
                console.log(' Fetching Birdeye prices...')

                // Fetch SOL price
                const solPrice = await $fetch<{ data?: { value?: number } }>('https://public-api.birdeye.so/defi/price', {
                    headers: {
                        'X-API-KEY': process.env.BIRDEYE_API_KEY || ''
                    },
                    query: {
                        address: 'So11111111111111111111111111111111111111112'
                    },
                    timeout: 5000
                })

                cachedPrices['So11111111111111111111111111111111111111112'] = solPrice.data?.value || 139
                cachedPrices['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'] = 1 // USDC is always $1

                lastBirdeyeFetch = now
                console.log(' Birdeye prices:', cachedPrices)
            } else {
                console.log(' Using cached Birdeye prices')
            }
        } catch (birdeyeError) {
            console.warn(' Birdeye failed, using stale cache:', birdeyeError)
        }

        // Calculate swap
        const inputPrice = cachedPrices[inputMint as string] || 139
        const outputPrice = cachedPrices[outputMint as string] || 1
        const exchangeRate = inputPrice / outputPrice

        const inputAmount = parseInt(amount as string)
        const inputDecimals = inputMint === 'So11111111111111111111111111111111111111112' ? 9 : 6
        const outputDecimals = outputMint === 'So11111111111111111111111111111111111111112' ? 9 : 6

        const humanInput = inputAmount / Math.pow(10, inputDecimals)
        const humanOutput = humanInput * exchangeRate
        const outputAmount = Math.floor(humanOutput * Math.pow(10, outputDecimals))

        console.log(' Swap:', {
            input: `${humanInput.toFixed(4)} @ $${inputPrice}`,
            output: `${humanOutput.toFixed(4)} @ $${outputPrice}`,
            outputLamports: outputAmount
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
            routePlan: [{
                swapInfo: {
                    ammKey: 'birdeye-pricing',
                    label: 'Birdeye (Solana DEX Data)',
                    inputMint: inputMint as string,
                    outputMint: outputMint as string,
                    inAmount: amount as string,
                    outAmount: outputAmount.toString(),
                    feeAmount: '0',
                    feeMint: inputMint as string
                },
                percent: 100
            }]
        }
    }
})