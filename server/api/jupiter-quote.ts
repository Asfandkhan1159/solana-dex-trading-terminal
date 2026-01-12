import { defineEventHandler, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const { inputMint, outputMint, amount, slippageBps } = query

    if (!inputMint || !outputMint || !amount) {
        throw createError({ statusCode: 400, message: 'Missing parameters' })
    }

    console.log('Quote request:', { inputMint, outputMint, amount })

    try {

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

        console.log('Jupiter success')
        return response

    } catch (jupiterError: any) {
        console.log(' Jupiter unavailable, using unified market price')

        const marketData = await $fetch<{ price: number }>('/api/market-data')
        const inputPrice = marketData.price
        const outputPrice = 1
        const exchangeRate = inputPrice / outputPrice

        const inputAmount = parseInt(amount as string)
        const inputDecimals = inputMint === 'So11111111111111111111111111111111111111112' ? 9 : 6
        const outputDecimals = outputMint === 'So11111111111111111111111111111111111111112' ? 9 : 6

        const humanInput = inputAmount / Math.pow(10, inputDecimals)
        const humanOutput = humanInput * exchangeRate
        const outputAmount = Math.floor(humanOutput * Math.pow(10, outputDecimals))

        console.log('Swap calculated from unified price:', inputPrice)

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
                    ammKey: 'unified-cache',
                    label: 'Cached Market Price',
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
