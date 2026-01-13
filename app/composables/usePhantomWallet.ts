import { ref, computed, onMounted } from 'vue'

export const usePhantomWallet = () => {
    const publicKey = ref<any>(null)
    const connected = ref(false)
    const connecting = ref(false)
    const balance = ref<number>(0)
    const phantomInstalled = ref(false)


    let Connection: any = null
    let PublicKey: any = null
    let connection: any = null

    const initSolana = async () => {
        if (Connection) return // Already loaded

        if (!process.client) return

        try {
            const web3 = await import('@solana/web3.js')
            Connection = web3.Connection
            PublicKey = web3.PublicKey

            const { public: { heliusApiKey } } = useRuntimeConfig()
            connection = new Connection(
                `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`,
                'confirmed'
            )

            console.log('✅ Solana Web3.js loaded')
        } catch (error) {
            console.error('❌ Failed to load Solana:', error)
            throw error
        }
    }

    onMounted(async () => {
        await initSolana()
        checkPhantomInstalled()
    })

    const checkPhantomInstalled = () => {
        if (typeof window !== 'undefined') {
            phantomInstalled.value = 'phantom' in window && (window as any).phantom?.solana?.isPhantom
        }
    }

    const getProvider = () => {
        if (typeof window === 'undefined') return null

        if ('phantom' in window) {
            const provider = (window as any).phantom?.solana
            if (provider?.isPhantom) {
                return provider
            }
        }
        return null
    }

    const connect = async () => {

        await initSolana()

        checkPhantomInstalled()

        const provider = getProvider()

        if (!provider) {
            alert('Phantom wallet not detected!\n\n1. Install Phantom extension\n2. Refresh this page\n3. Try again')
            window.open('https://phantom.app/', '_blank')
            throw new Error('Phantom wallet not installed')
        }

        connecting.value = true

        try {
            const resp = await provider.connect()


            if (PublicKey) {
                publicKey.value = new PublicKey(resp.publicKey.toString())
            } else {
                publicKey.value = resp.publicKey
            }

            connected.value = true


            if (connection && publicKey.value) {
                const lamports = await connection.getBalance(publicKey.value)
                balance.value = lamports / 1e9
            }

            console.log('Wallet connected!')
            console.log('Address:', publicKey.value.toString())
            console.log('Balance:', balance.value, 'SOL')

        } catch (error: any) {
            console.error('Connection failed:', error)

            if (error.code === 4001) {
                alert('Connection rejected. Please approve in Phantom wallet.')
            } else {
                alert('Failed to connect wallet. Please try again.')
            }

            throw error
        } finally {
            connecting.value = false
        }
    }

    const disconnect = async () => {
        const provider = getProvider()
        if (provider) {
            try {
                await provider.disconnect()
            } catch (err) {
                console.error('Disconnect error:', err)
            }
        }

        publicKey.value = null
        connected.value = false
        balance.value = 0

        console.log('Wallet disconnected')
    }

    const signTransaction = async (tx: any) => {
        const provider = getProvider()
        if (!provider || !connected.value) {
            throw new Error('Wallet not connected')
        }

        try {
            const signed = await provider.signTransaction(tx)
            return signed
        } catch (error: any) {
            if (error.code === 4001) {
                alert('Transaction rejected by user')
            }
            throw error
        }
    }

    const shortAddress = computed(() => {
        if (!publicKey.value) return ''
        const addr = publicKey.value.toString()
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`
    })

    return {
        publicKey,
        connected,
        connecting,
        balance,
        shortAddress,
        phantomInstalled,
        connect,
        disconnect,
        signTransaction
    }
}