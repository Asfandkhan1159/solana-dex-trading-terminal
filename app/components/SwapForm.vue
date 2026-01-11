<script setup lang="ts">
const dexStore = useDexStore()
const isPending = ref(false)

const updateAmount = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  dexStore.updateFromAmount(val)
}

const setMax = () => {
  dexStore.fromAmount = dexStore.maxBalance.toString()
}

const handleSlippageChange = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value)
  dexStore.updateSlippage(value)
}

const handleSwapAction = async () => {
  if (!dexStore.wallet.connected) {
    dexStore.connectWallet()
    return
  }
  
  try {
    const result = await dexStore.executeSwap()
    console.log(result)
    alert(`Successfully swapped ${dexStore.fromAmount} ${dexStore.fromToken.symbol}!`)
  } catch (error) {
    console.error(error)
    alert('Swap failed: ' + error)
  }
}
</script>

<template>
  <div class="bg-card border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
    <div class="absolute -top-24 -left-24 w-48 h-48 bg-accent/10 blur-[100px] pointer-events-none" />

    
    <div class="flex justify-between items-center mb-6">
      <h2 class="font-black text-xl tracking-tight">SWAP</h2>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500">Slippage:</span>
        <input 
          type="range" 
          min="0.1" 
          max="5.0" 
          step="0.1"
          :value="dexStore.slippage"
          @input="handleSlippageChange"
          class="w-20 accent-accent"
        />
        <span class="text-xs font-mono text-white">{{ dexStore.slippage }}%</span>
      </div>
    </div>

    
    <div class="space-y-2 relative">
      
      
      <div class="bg-bg/80 border border-white/5 p-4 rounded-2xl focus-within:border-accent/50 transition-all"
           :class="dexStore.inputError ? 'border-red/50' : ''">
        <div class="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest">
          <span>Selling</span>
          <div class="flex gap-2 items-center">
            <span>Balance: {{ dexStore.maxBalance }} {{ dexStore.fromToken.symbol }}</span>
            <button @click="setMax" class="text-accent hover:underline text-[9px]">MAX</button>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <input 
            :value="dexStore.fromAmount" 
            @input="updateAmount"
            type="number" 
            class="bg-transparent text-3xl font-bold outline-none w-full placeholder:text-white/10 text-white" 
            placeholder="0.0" 
          />
          <button class="flex items-center gap-2 bg-card border border-white/10 px-3 py-2 rounded-xl hover:bg-white/10 transition">
            <img :src="dexStore.fromToken.icon" class="w-5 h-5 rounded-full" />
            <span class="font-bold text-sm text-white">{{ dexStore.fromToken.symbol }}</span>
            <div class="i-ph-caret-down-bold w-3 h-3 text-gray-500" />
          </button>
        </div>
        
        
        <div v-if="dexStore.inputError" class="mt-2 text-xs text-red flex items-center gap-1">
          <div class="i-ph-warning-circle-bold w-3 h-3" />
          {{ dexStore.inputError }}
        </div>
      </div>

  
      <div class="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
  <button 
    @click="dexStore.swapTokens"
    class="bg-accent/20 border-2 border-accent p-3 rounded-xl text-accent hover:rotate-180 hover:bg-accent hover:text-black transition-all duration-500 shadow-xl shadow-accent/30"
  >
    <div class="i-ph-arrows-down-up-bold w-5 h-5" />
  </button>
</div>

     
<div class="bg-bg/80 border border-white/5 p-4 rounded-2xl relative overflow-hidden">

  <div 
    v-if="dexStore.isLoadingQuote"
    class="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 animate-pulse"
  />
  
  <div class="relative z-10">
    
    <div class="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest">
      <span>Buying (Estimated)</span>
      
      
      <span 
        v-if="dexStore.isLoadingQuote" 
        class="text-accent flex items-center gap-1 animate-pulse"
      >
        <div class="i-ph-circle-notched-bold animate-spin w-3 h-3" />
        Fetching best price...
      </span>
      
      
      <span 
        v-else-if="dexStore.currentQuote && !dexStore.quoteError" 
        class="text-green flex items-center gap-1"
      >
        <div class="i-ph-check-circle-bold w-3 h-3" />
        Live Price
      </span>
      
      
      <span 
        v-else-if="dexStore.quoteError" 
        class="text-yellow-500 flex items-center gap-1"
      >
        <div class="i-ph-warning-bold w-3 h-3" />
        Using fallback
      </span>
    </div>
    
    
    <div class="flex items-center gap-4">
      <div class="text-3xl font-bold w-full text-white select-none transition-all duration-300">
        <span :class="dexStore.isLoadingQuote ? 'opacity-50' : 'opacity-100'">
          {{ dexStore.estimatedTo }}
        </span>
      </div>
      
    
      <button 
        class="flex items-center gap-2 bg-card border border-white/10 px-3 py-2 rounded-xl hover:bg-white/10 transition"
      >
        <img :src="dexStore.toToken.icon" class="w-5 h-5 rounded-full" />
        <span class="font-bold text-sm text-white">{{ dexStore.toToken.symbol }}</span>
        <div class="i-ph-caret-down-bold w-3 h-3 text-gray-500" />
      </button>
    </div>
    
    
    <div 
      v-if="dexStore.currentQuote && !dexStore.isLoadingQuote" 
      class="mt-2 flex items-center gap-2 text-[10px]"
    >
      <div class="flex items-center gap-1 text-accent">
        <div class="i-ph-path-bold w-3 h-3" />
        <span class="font-mono font-bold">
          Route: {{ dexStore.currentQuote.routePlan[0]?.swapInfo.label || 'Direct' }}
        </span>
      </div>
      
      
      <div 
        class="px-2 py-0.5 rounded font-mono font-bold"
        :class="dexStore.priceImpact > 1 ? 'bg-red/10 text-red' : 'bg-green/10 text-green'"
      >
        Impact: {{ dexStore.priceImpact.toFixed(2) }}%
      </div>
    </div>
    
   
    <div 
      v-if="dexStore.quoteError && !dexStore.isLoadingQuote" 
      class="mt-2 text-xs text-yellow-500 flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded"
    >
      <div class="i-ph-warning-circle-bold w-3 h-3" />
      {{ dexStore.quoteError }}
    </div>
  </div>
</div>
    </div>

    
    <div class="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
      <div class="flex justify-between text-[11px]">
        <span class="text-gray-500">Price Impact</span>
        <span :class="dexStore.priceImpact > 1 ? 'text-red' : 'text-green'">
          {{ dexStore.priceImpact }}%
        </span>
      </div>
      
      <div class="flex justify-between text-[11px]">
        <span class="text-gray-500">Min. Received</span>
        <span class="text-gray-300 font-mono">
          {{ dexStore.minReceived }} {{ dexStore.toToken.symbol }}
        </span>
      </div>
      
      <div class="flex justify-between text-[11px]">
        <span class="text-gray-500">Network Fee</span>
        <span class="text-gray-300">~ $0.0002</span>
      </div>
    </div>

    
    <button 
      @click="handleSwapAction"
      :disabled="isPending || !!dexStore.inputError"
      class="w-full mt-6 py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      :class="dexStore.wallet.connected 
        ? 'bg-accent text-black hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
        : 'bg-white text-black'"
    >
      <div v-if="isPending" class="i-ph-circle-notched-bold animate-spin w-6 h-6" />
      <span>{{ isPending ? 'PROCESSING...' : (dexStore.wallet.connected ? 'EXECUTE SWAP' : 'CONNECT WALLET') }}</span>
    </button>
  </div>
</template>