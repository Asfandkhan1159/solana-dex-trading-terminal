import { ref, computed, onMounted } from 'vue'
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js'

export const usePhantomWallet = () => {
    const publicKey = ref<PublicKey | null>(null)
    const connected = ref(false)
    const connecting = ref(false)
    const balance = ref<number>(0)
    const phantomInstalled = ref(false)

    const connection = new Connection(
        `https://mainnet.helius-rpc.com/?api-key=${useRuntimeConfig().public.heliusApiKey}`,
        'confirmed'
    )


    onMounted(() => {
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
            publicKey.value = new PublicKey(resp.publicKey.toString())
            connected.value = true


            const lamports = await connection.getBalance(publicKey.value)
            balance.value = lamports / 1e9

            console.log(' Wallet connected!')
            console.log(' Address:', publicKey.value.toString())
            console.log(' Balance:', balance.value, 'SOL')

        } catch (error: any) {
            console.error(' Connection failed:', error)

            if (error.code === 4001) {
                //rejection
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

    const signTransaction = async (tx: VersionedTransaction) => {
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
        signTransaction,
        connection
    }
}