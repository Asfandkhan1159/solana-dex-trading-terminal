
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const { tokenMint } = query

    if (!tokenMint || typeof tokenMint !== 'string') {
        throw createError({
            statusCode: 400,
            message: 'Missing or invalid token mint address'
        })
    }

    const HELIUS_API_KEY = process.env.HELIUS_API_KEY

    if (!HELIUS_API_KEY) {
        throw createError({
            statusCode: 500,
            message: 'Helius API key not configured on server'
        })
    }

    try {

        const metadata = await $fetch(`https://api.helius.xyz/v0/token-metadata`, {
            query: {
                'api-key': HELIUS_API_KEY
            },
            method: 'POST',
            body: {
                mintAccounts: [tokenMint],
                includeOffChain: true,
                disableCache: false
            }
        })


        const priceData = await $fetch(`https://api.helius.xyz/v0/addresses/${tokenMint}/transactions`, {
            query: {
                'api-key': HELIUS_API_KEY,
                limit: 10,
                type: 'SWAP'
            }
        })

        return {
            metadata: metadata,
            recentSwaps: priceData,
            timestamp: Date.now()
        }

    } catch (error: any) {
        console.error(' Helius API error:', error)

        // Return structured error instead of throwing
        return {
            error: true,
            message: error.message || 'Failed to fetch token data from Helius',
            statusCode: error.statusCode || 500
        }
    }
})