<script setup lang="ts">
const dexStore = useDexStore()
const hoveredCandle = ref<number | null>(null)
const isLoading= ref(false)
const timeframe = ref('15m')
const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D'] as const 

const priceRange = computed(() => {
  if (dexStore.chartData.length === 0) {
    return { min: 140, max: 160 }
  }
  
  const prices = dexStore.chartData.flatMap(c => [c.high, c.low])
  return {
    min: Math.min(...prices) * 0.995,
    max: Math.max(...prices) * 1.005
  }
})

const maxVolume = computed(() => {
  if (dexStore.chartData.length === 0) return 1000000
  return Math.max(...dexStore.chartData.map(c => c.volume))
})

const getCandleHeight = (candle: any) => {
  const range = priceRange.value.max - priceRange.value.min
  const bodyHeight = Math.abs(candle.close - candle.open)
  return (bodyHeight / range) * 100
}

const getCandlePosition = (price: number) => {
  const range = priceRange.value.max - priceRange.value.min
  return ((priceRange.value.max - price) / range) * 100
}

const getVolumeHeight = (volume: number) => {
  return (volume / maxVolume.value) * 100
}

const currentPrice = computed(() => {
  if (dexStore.chartData.length === 0) return 150
  
  const lastCandle = dexStore.chartData[dexStore.chartData.length - 1]
  return lastCandle?.close ?? 150
})

const priceChange = computed(() => {
  if (dexStore.chartData.length < 2) return 0
  
  const first = dexStore.chartData[0]?.close ?? 0
  const last = dexStore.chartData[dexStore.chartData.length - 1]?.close ?? 0
  
  return ((last - first) / first) * 100
})

const handleTimeChange = async (tf :typeof timeframes[number]) =>{
  isLoading.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  dexStore.updateTimeframe(tf)
  timeframe.value = tf
  isLoading.value = false
}

</script>

<template>
  <div class="w-full h-full flex flex-col bg-card relative">
    
    <!-- Header -->
    <div class="flex justify-between items-center px-6 pt-6 pb-4 border-b border-white/5">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-2xl font-black">SOL/USDC</span>
          <span 
            class="text-sm font-mono px-2 py-1 rounded"
            :class="priceChange >= 0 ? 'text-green bg-green/10' : 'text-red bg-red/10'"
          >
            {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
          </span>
        </div>
        <div class="flex flex-col text-xs text-gray-500">
          <span class="text-2xl font-bold text-white">${{ currentPrice.toFixed(2) }}</span>
          <span class="font-mono">Last 24h</span>
        </div>
      </div>
      
      <div class="flex gap-1">
        <button 
          v-for="tf in timeframes" 
          :key="tf"
          @click="handleTimeChange(tf)"
          class="text-xs px-3 py-1.5 rounded-lg transition-all font-mono"
          :class="timeframe === tf 
            ? 'bg-accent text-black font-bold' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'"
        >
          {{ tf }}
        </button>
      </div>
    </div>

    <!-- Chart Area -->
    <div class="flex-1 relative px-6 py-6 overflow-hidden">
      
      <!-- Candlesticks Container -->
      <div class="h-full flex items-end justify-between gap-1 pb-8">
        <div 
          v-for="(candle, idx) in dexStore.chartData" 
          :key="idx"
          class="flex-1 h-full flex flex-col justify-end items-center group cursor-crosshair relative"
          @mouseenter="hoveredCandle = idx"
          @mouseleave="hoveredCandle = null"
        >
          <!-- Candle Visualization -->
          <div class="relative flex flex-col items-center" :style="{ height: '85%' }">
            
            <!-- High Wick -->
            <div 
              class="w-[2px] transition-all"
              :class="candle.close >= candle.open ? 'bg-green' : 'bg-red'"
              :style="{ 
                height: ((candle.high - Math.max(candle.open, candle.close)) / (priceRange.max - priceRange.min)) * 100 + '%'
              }"
            />
            
            <!-- Candle Body -->
            <div 
              class="w-full max-w-[14px] transition-all duration-200"
              :class="[
                candle.close >= candle.open 
                  ? 'bg-green hover:bg-green/80' 
                  : 'bg-red hover:bg-red/80',
                hoveredCandle === idx ? 'ring-2 ring-white/50 scale-110' : ''
              ]"
              :style="{ 
                height: (Math.abs(candle.close - candle.open) / (priceRange.max - priceRange.min)) * 100 + '%',
                minHeight: '3px'
              }"
            />
            
            <!-- Low Wick -->
            <div 
              class="w-[2px] transition-all"
              :class="candle.close >= candle.open ? 'bg-green' : 'bg-red'"
              :style="{ 
                height: ((Math.min(candle.open, candle.close) - candle.low) / (priceRange.max - priceRange.min)) * 100 + '%'
              }"
            />
          </div>
          
          <!-- Hover Tooltip -->
       
<div 
  v-if="hoveredCandle === idx"
  class="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-bg border border-accent/30 rounded-lg p-3 text-[11px] font-mono whitespace-nowrap z-50 shadow-xl shadow-black/50 pointer-events-none"
>
  <div class="flex flex-col gap-1">
    <div class="text-accent font-bold border-b border-white/10 pb-1 mb-1">{{ candle.time }}</div>
    <div class="flex justify-between gap-6">
      <span class="text-gray-500">Open:</span>
      <span class="text-white font-bold">${{ candle.open.toFixed(2) }}</span>
    </div>
    <div class="flex justify-between gap-6">
      <span class="text-gray-500">High:</span>
      <span class="text-green font-bold">${{ candle.high.toFixed(2) }}</span>
    </div>
    <div class="flex justify-between gap-6">
      <span class="text-gray-500">Low:</span>
      <span class="text-red font-bold">${{ candle.low.toFixed(2) }}</span>
    </div>
    <div class="flex justify-between gap-6">
      <span class="text-gray-500">Close:</span>
      <span :class="candle.close >= candle.open ? 'text-green' : 'text-red'" class="font-bold">
        ${{ candle.close.toFixed(2) }}
      </span>
    </div>
    <div class="flex justify-between gap-6 pt-1 border-t border-white/10">
      <span class="text-gray-500">Volume:</span>
      <span class="text-accent font-bold">{{ (candle.volume / 1000).toFixed(0) }}K</span>
    </div>
  </div>
  
  <!-- Little arrow pointing to candle -->
  <div class="absolute right-full top-1/2 -translate-y-1/2 mr-[-1px] w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-accent/30"></div>
</div>
        </div>
      </div>

      <!-- Price Axis (Right) -->
      <div class="absolute right-0 top-6 bottom-8 w-20 flex flex-col justify-between text-[11px] font-mono text-gray-500 pr-2">
        <span class="text-green font-bold">${{ priceRange.max.toFixed(2) }}</span>
        <span class="text-white">${{ ((priceRange.max + priceRange.min) / 2).toFixed(2) }}</span>
        <span class="text-red font-bold">${{ priceRange.min.toFixed(2) }}</span>
      </div>

      <!-- Time Labels -->
      <div class="absolute bottom-0 left-6 right-24 flex justify-between text-[10px] font-mono text-gray-500">
        <span>{{ dexStore.chartData[0]?.time }}</span>
        <span>{{ dexStore.chartData[Math.floor(dexStore.chartData.length / 2)]?.time }}</span>
        <span>{{ dexStore.chartData[dexStore.chartData.length - 1]?.time }}</span>
      </div>

      <!-- Grid Lines (Optional) -->
      <div class="absolute inset-0 pointer-events-none opacity-10">
        <div class="h-full flex flex-col justify-between">
          <div class="h-[1px] bg-white/20"></div>
          <div class="h-[1px] bg-white/20"></div>
          <div class="h-[1px] bg-white/20"></div>
        </div>
      </div>
    </div>

    <!-- Watermark -->
    <div class="absolute bottom-2 right-24 text-[8px] text-gray-700 font-mono opacity-40 pointer-events-none">
      MOCK DATA • PROTOTYPE
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>