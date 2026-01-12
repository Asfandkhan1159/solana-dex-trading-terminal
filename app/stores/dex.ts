// stores/dex.ts
import { defineStore } from 'pinia'
import { z } from 'zod'
import {
    getTokenMint,
    getTokenDecimals,
    getAllTokens,
    type TokenInfo,
} from '../types/tokens'
import { usePhantomWallet } from '../composables/usePhantomWallet'

const JUPITER_API_URL = 'https://quote-api.jup.ag/v6'

interface JupiterQuote {
    inputMint: string
    inAmount: string
    outputMint: string
    outAmount: string
    otherAmountThreshold: string
    swapMode: string
    slippageBps: number
    priceImpactPct: number
    platformFee: null | any
    routePlan: Array<{
        swapInfo: {
            ammKey: string
            label: string
            inputMint: string
            outputMint: string
            inAmount: string
            outAmount: string
            feeAmount: string
            feeMint: string
        }
        percent: number
    }>
}

type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D'

interface ExecuteSwapResult {
    success: boolean
    amount: string
    token: string
}

interface Candle {
    time: string
    open: number
    high: number
    low: number
    close: number
    volume: number
}

interface OrderBookRow {
    price: number
    amount: number
    total: number
}

interface OrderBookData {
    asks: OrderBookRow[]
    bids: OrderBookRow[]
}

interface MarketStats {
    tvl: number
    volume24h: number
    trades24h: number
    liquidity: number
}

interface MarketData {
    price: number
    orderbook: OrderBookData
    stats: MarketStats
    lastFetch: number
    isLoading: boolean
    error: string | null
}

export const useDexStore = defineStore('dex', () => {
    const tokens = ref<TokenInfo[]>(getAllTokens())
    const walletBalances = ref<Record<string, number>>({
        'SOL': 12.5,
        'USDC': 1000.0,
        'RAY': 0.0
    })

    const maxBalance = computed(() => {
        return walletBalances.value[fromToken.value.symbol] || 0
    })

    const inputError = ref<string | null>(null)
    const fromToken = ref<TokenInfo>(tokens.value.find((t) => t.symbol === 'SOL')!)
    const toToken = ref<TokenInfo>(tokens.value.find((t) => t.symbol === 'USDC')!)
    const fromAmount = ref('1.25')
    const wallet = ref({ publicKey: null as string | null, connected: false })

    const isLoadingQuote = ref(false)
    const quoteError = ref<string | null>(null)
    const currentQuote = ref<JupiterQuote | null>(null)
    const lastQuoteTime = ref<number>(0)

    const estimatedTo = ref('0.00')
    const priceImpactValue = ref(0.1)
    const priceImpact = computed(() => priceImpactValue.value)

    const marketData = ref<MarketData>({
        price: 0,
        orderbook: {
            asks: [],
            bids: []
        },
        stats: {
            tvl: 0,
            volume24h: 0,
            trades24h: 0,
            liquidity: 0
        },
        lastFetch: 0,
        isLoading: false,
        error: null
    })

    const fetchAllMarketData = async () => {
        const now = Date.now()
        const CACHE_TIME = 300000 // 5 minutes

        if (now - marketData.value.lastFetch < CACHE_TIME) {
            const age = Math.floor((now - marketData.value.lastFetch) / 1000)
            console.log(` Using cached market data (${age}s old)`)
            return
        }

        marketData.value.isLoading = true
        marketData.value.error = null

        try {
            console.log('Fetching unified market data...')


            const data = await $fetch<{
                price: number
                tvl: number
                volume24h: number
                trades24h: number
                liquidity: number
            }>('/api/market-data')


            const currentPrice = data.price

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

            marketData.value.price = data.price
            marketData.value.orderbook = { asks, bids }
            marketData.value.stats = {
                tvl: data.tvl,
                volume24h: data.volume24h,
                trades24h: data.trades24h,
                liquidity: data.liquidity
            }
            marketData.value.lastFetch = now

            console.log('✅ Market data updated:', { price: data.price, tvl: data.tvl })

        } catch (error: any) {
            console.error('❌ Market data fetch failed:', error)
            marketData.value.error = error.message
        } finally {
            marketData.value.isLoading = false
        }
    }


    if (process.client) {
        fetchAllMarketData()
        setInterval(() => {
            fetchAllMarketData()
        }, 300000)
    }

    const toTokenAmount = (amount: number, symbol: string): string => {
        const decimals = getTokenDecimals(symbol)
        return Math.floor(amount * Math.pow(10, decimals)).toString()
    }

    const fromTokenAmount = (amount: string, symbol: string): number => {
        const decimals = getTokenDecimals(symbol)
        return parseInt(amount) / Math.pow(10, decimals)
    }

    const fetchJupiterQuote = async () => {
        const amount = parseFloat(fromAmount.value)

        if (!amount || isNaN(amount) || amount <= 0) {
            estimatedTo.value = '0.00'
            return
        }

        const now = Date.now()
        if (now - lastQuoteTime.value < 500) {
            return
        }
        lastQuoteTime.value = now

        isLoadingQuote.value = true
        quoteError.value = null

        try {
            const inputMint = getTokenMint(fromToken.value.symbol)
            const outputMint = getTokenMint(toToken.value.symbol)

            if (!inputMint || !outputMint) {
                throw new Error('Unsupported token selected')
            }

            const inputAmount = toTokenAmount(amount, fromToken.value.symbol)

            if (!inputAmount) {
                throw new Error('Invalid input amount')
            }

            const data = await $fetch('/api/jupiter-quote', {
                query: {
                    inputMint,
                    outputMint,
                    amount: inputAmount,
                    slippageBps: Math.floor(slippage.value * 100).toString()
                }
            }) as JupiterQuote

            currentQuote.value = data

            const outputAmount = fromTokenAmount(data.outAmount, toToken.value.symbol)
            estimatedTo.value = outputAmount.toFixed(4)

            if (data.priceImpactPct !== undefined) {
                priceImpactValue.value = Math.abs(data.priceImpactPct)
            }

            console.log('Jupiter quote received:', {
                input: `${amount} ${fromToken.value.symbol}`,
                output: `${outputAmount.toFixed(4)} ${toToken.value.symbol}`,
                route: data.routePlan[0]?.swapInfo.label || 'Unknown'
            })

        } catch (error) {
            console.error('Failed to fetch Jupiter quote:', error)
            quoteError.value = 'Failed to fetch live price'

            const val = Number(fromAmount.value)
            const mockPrice = fromToken.value.symbol === 'SOL' ? 150 : 1 / 150
            estimatedTo.value = (val * mockPrice).toFixed(4)
            priceImpactValue.value = val > 10 ? 2.4 : (val > 5 ? 0.8 : 0.1)

        } finally {
            isLoadingQuote.value = false
        }
    }

    const TIMEFRAME_CONFIG: Record<Timeframe, { candles: number, interval: number }> = {
        '1m': { candles: 60, interval: 1 },
        '5m': { candles: 48, interval: 5 },
        '15m': { candles: 24, interval: 15 },
        '1H': { candles: 24, interval: 60 },
        '4H': { candles: 42, interval: 240 },
        '1D': { candles: 30, interval: 1440 }
    }

    const generateMockCandles = (timeframe: Timeframe = '15m') => {
        const config = TIMEFRAME_CONFIG[timeframe]
        const candles: Candle[] = []
        let lastClose = 150
        const now = Date.now()

        for (let i = config.candles - 1; i >= 0; i--) {
            const time = new Date(now - i * config.interval * 60 * 1000)
            const change = (Math.random() - 0.5) * 4

            const open = lastClose
            const close = open + change
            const high = Math.max(open, close) + Math.random() * 2
            const low = Math.min(open, close) - Math.random() * 2
            const volume = Math.random() * 1000000 + 50000

            candles.push({
                time: formatTimeForTimeframe(time, timeframe),
                open: parseFloat(open.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                volume: parseFloat(volume.toFixed(2))
            })
            lastClose = close
        }
        return candles
    }

    const formatTimeForTimeframe = (date: Date, timeframe: Timeframe): string => {
        if (timeframe === '1D') {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        } else {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }
    }

    const currentTimeframe = ref<Timeframe>('15m')
    const chartData = ref<Candle[]>(generateMockCandles(currentTimeframe.value))

    const updateTimeframe = (timeframe: Timeframe) => {
        currentTimeframe.value = timeframe
        chartData.value = generateMockCandles(timeframe)
    }

    const isSwapping = ref(false)
    // just for vercel deployment, will fix in the next push
    const executeSwap = async (): Promise<ExecuteSwapResult> => {
        if (!process.client) {
            throw new Error('Swap is client-only')
        }

        const wallet = usePhantomWallet()

        if (!wallet.connected.value || !wallet.publicKey.value) {
            throw new Error('Wallet not connected')
        }

        if (!currentQuote.value) {
            throw new Error('No quote available')
        }

        isSwapping.value = true

        try {
            console.log('🔨 Building swap transaction...')

            const response = await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse: currentQuote.value,
                    userPublicKey: wallet.publicKey.value.toString(),
                    wrapAndUnwrapSol: true,
                })
            })

            const { swapTransaction } = await response.json()

            let VersionedTransaction: any

            if (process.client) {
                const solana = await import('@solana/web3.js')
                VersionedTransaction = solana.VersionedTransaction
            } else {
                throw new Error('Solana SDK loaded on server')
            }
            const txBuf = Buffer.from(swapTransaction, 'base64')
            const transaction = VersionedTransaction.deserialize(txBuf)

            console.log('Signing transaction...')

            await wallet.signTransaction(transaction)

            console.log('✅ Transaction signed (not sent - demo mode)')

            return {
                success: true,
                amount: fromAmount.value,
                token: fromToken.value.symbol
            }

        } catch (error: any) {
            console.error('❌ Swap failed:', error)
            throw error
        } finally {
            isSwapping.value = false
        }
    }

    const connectWallet = () => {
        const mockKey = Array.from({ length: 44 }, () =>
            'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'[Math.floor(Math.random() * 58)]
        ).join('')
        wallet.value = { publicKey: mockKey, connected: true }
    }

    const swapTokens = () => {
        const temp = fromToken.value
        fromToken.value = toToken.value
        toToken.value = temp
    }

    const slippage = ref(0.5)

    const updateSlippage = (value: number) => {
        const result = slippageSchema.safeParse(value)
        if (!result.success) return
        slippage.value = result.data
    }

    const minReceived = computed(() => {
        const estimated = parseFloat(estimatedTo.value)
        if (isNaN(estimated)) return '0.00'

        const slippageMultiplier = 1 - (slippage.value / 100)
        return (estimated * slippageMultiplier).toFixed(4)
    })

    const slippageSchema = z.number().min(0.1).max(5.0)

    const updateFromAmount = (value: string) => {
        inputError.value = null

        if (value === '') {
            fromAmount.value = ''
            estimatedTo.value = '0.00'
            return
        }

        if (!/^\d*\.?\d*$/.test(value)) return

        const num = parseFloat(value)
        if (isNaN(num)) return

        const balance = walletBalances.value[fromToken.value.symbol] || 0
        if (num > balance) {
            inputError.value = 'Insufficient balance'
            return
        }

        fromAmount.value = value
        if (value !== '') {
            fetchJupiterQuote()
        }
    }

    watch([fromToken, toToken], () => {
        if (fromAmount.value && fromAmount.value !== '0' && fromAmount.value !== '') {
            fetchJupiterQuote()
        }
    })

    watch(slippage, () => {
        if (fromAmount.value && fromAmount.value !== '0' && fromAmount.value !== '') {
            fetchJupiterQuote()
        }
    })

    return {
        tokens,
        fromToken,
        toToken,
        fromAmount,
        wallet,
        estimatedTo,
        priceImpact,
        connectWallet,
        executeSwap,
        isSwapping,
        swapTokens,
        maxBalance,
        slippage,
        updateSlippage,
        slippageSchema,
        updateFromAmount,
        minReceived,
        walletBalances,
        inputError,
        chartData,
        currentTimeframe,
        updateTimeframe,
        isLoadingQuote,
        quoteError,
        currentQuote,
        fetchJupiterQuote,
        marketData,
        fetchAllMarketData
    }
})