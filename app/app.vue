<style>
/* Global resets */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  background-color: #0a0a0a;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
<script setup lang="ts">
const dexStore = useDexStore()
const wallet = usePhantomWallet()
const realtimePrice = useRealtimePrice() // ✅ ADD THIS

const handleWalletClick = async () => {
  if (wallet.connected.value) {
    await wallet.disconnect()
  } else {
    try {
      await wallet.connect()
    } catch (error: any) {
      console.error('Wallet error:', error)
    }
  }
}
</script>

<template>
    <div class="min-h-screen w-full bg-[#0a0a0a] text-text overflow-x-hidden">
     <header class="sticky top-0 z-50 backdrop-blur-xl bg-bg/80 border-b border-white/5 w-full">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <!-- Logo -->
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-lg shadow-accent/20">
              <div class="i-ph-swap-bold w-6 h-6 text-black" />
            </div>
            <div>
              <h1 class="text-2xl font-black tracking-tight">
                <span class="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">SOLANA</span>
                <span class="text-accent">DEX</span>
              </h1>
              <p class="text-[10px] text-gray-500 uppercase tracking-wider">Live Demo</p>
            </div>
          </div>
          
          <!--  LIVE PRICE TICKER (WebSocket) -->
          <div 
            v-if="realtimePrice.connected.value"
            class="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-green/10 to-green/5 border border-green/20"
          >
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green animate-pulse" />
              <span class="text-[10px] text-green font-bold uppercase tracking-wider">Live</span>
            </div>
            <div class="h-6 w-px bg-white/10" />
            <div class="flex items-center gap-2">
              <span class="text-lg font-black text-white font-mono">
                ${{ realtimePrice.currentPrice.value.toFixed(2) }}
              </span>
              <span 
                class="text-xs font-bold"
                :class="realtimePrice.priceChange.value >= 0 ? 'text-green' : 'text-red'"
              >
                {{ realtimePrice.priceChange.value >= 0 ? '▲' : '▼' }}
                {{ Math.abs(realtimePrice.priceChange.value).toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Wallet Button -->
        <button 
          @click="handleWalletClick"
          :disabled="wallet.connecting.value"
          class="px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg"
          :class="wallet.connected.value 
            ? 'bg-green/10 text-green border border-green/20 hover:bg-green/20 hover:shadow-green/20' 
            : 'bg-accent text-black hover:scale-105 hover:shadow-accent/30'"
        >
          <div class="flex items-center gap-2">
            <div v-if="wallet.connecting.value" class="i-ph-circle-notched-bold w-5 h-5 animate-spin" />
            <template v-else-if="wallet.connected.value">
              <div class="i-ph-check-circle-bold w-5 h-5" />
              <span class="font-mono">{{ wallet.shortAddress }}</span>
              <span class="text-xs opacity-70 font-mono">{{ wallet.balance.value.toFixed(2) }} SOL</span>
            </template>
            <template v-else>
              <div class="i-ph-wallet-bold w-5 h-5" />
              <span>Connect Wallet</span>
            </template>
          </div>
        </button>
      </div>
    </header>

    <!-- main -->
    <main class="w-full">
  <!--  Warning -->
  <div v-if="!wallet.phantomInstalled && !wallet.connected.value" 
       class="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl backdrop-blur-sm">
    <div class="flex items-start gap-3">
      <div class="i-ph-warning-bold w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
      <div>
        <p class="font-bold text-yellow-500">Phantom Wallet Required</p>
        <p class="text-sm text-gray-400 mt-1">
          Install the Phantom browser extension to connect your wallet.
          <a href="https://phantom.app/" target="_blank" class="text-accent hover:underline ml-1">
            Download here →
          </a>
        </p>
      </div>
    </div>
  </div>


  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
   
    <div class="lg:col-span-8">
      <SwapForm />
    </div>
    <div class="lg:col-span-4 space-y-6">
      <LiquidityStats />
    </div>
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <TradingChart />
    <OrderBook />
  </div>
</main>
  </div>
</template>