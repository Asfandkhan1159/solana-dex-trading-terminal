// app/composables/useRealtimePrice.ts
export const useRealtimePrice = () => {
    const currentPrice = ref(0)
    const priceChange = ref(0)
    const connected = ref(false)

    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
        if (typeof window === 'undefined') return

        try {
            // ✅ Use native WebSocket (Binance)
            ws = new WebSocket('wss://stream.binance.com:9443/ws/solusdt@trade')

            ws.onopen = () => {
                connected.value = true
                console.log('✅ WebSocket connected')
            }

            ws.onmessage = (event) => {
                try {
                    const trade = JSON.parse(event.data)
                    const newPrice = parseFloat(trade.p)

                    if (currentPrice.value > 0) {
                        priceChange.value = ((newPrice - currentPrice.value) / currentPrice.value) * 100
                    }
                    currentPrice.value = newPrice
                } catch (err) {
                    console.error('Parse error:', err)
                }
            }

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error)
                connected.value = false
            }

            ws.onclose = () => {
                connected.value = false
                console.log('🔌 WebSocket disconnected, reconnecting...')

                // Auto-reconnect after 5 seconds
                reconnectTimeout = setTimeout(() => {
                    connect()
                }, 5000)
            }
        } catch (error) {
            console.error('Connection failed:', error)
        }
    }

    const disconnect = () => {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
        }
        if (ws) {
            ws.close()
            ws = null
        }
        connected.value = false
    }

    // Auto-connect on mount
    onMounted(() => {
        connect()
    })

    // Cleanup on unmount
    onUnmounted(() => {
        disconnect()
    })

    return {
        currentPrice,
        priceChange,
        connected,
        connect,
        disconnect
    }
}