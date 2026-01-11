export interface TokenInfo {
    symbol: string
    name: string
    icon: string
    mint: string
    decimals: number
    coingeckoId?: string
    isNative?: boolean
}
export const SUPPORTED_TOKENS: Record<string, TokenInfo> = {
    'SOL': {
        symbol: 'SOL',
        name: 'Solana',
        mint: 'So11111111111111111111111111111111111111112',
        decimals: 9,
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        coingeckoId: 'solana',
        isNative: true
    },
    'USDC': {
        symbol: 'USDC',
        name: 'USD Coin',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        coingeckoId: 'usd-coin'
    },
    'RAY': {
        symbol: 'RAY',
        name: 'Raydium',
        mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        decimals: 6,
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
        coingeckoId: 'raydium'
    }
}

export const getTokenInfo = (symbol: string): TokenInfo | undefined => {
    return SUPPORTED_TOKENS[symbol]
}

export const getTokenMint = (symbol: string): string | undefined => {
    const token = SUPPORTED_TOKENS[symbol]
    if (!token) {
        console.error(`Token not found for symbol: ${symbol}`)
        return undefined
    }
    return token?.mint
}


export const getTokenDecimals = (symbol: string): number => {
    const token = SUPPORTED_TOKENS[symbol]
    if (!token) {
        console.error(`Token not found for symbol: ${symbol}`)
        return 0
    }
    return token?.decimals
}

export const getAllTokens = (): TokenInfo[] => {
    return Object.values(SUPPORTED_TOKENS)
}
export type SupportedTokenSymbol = keyof typeof SUPPORTED_TOKENS 