<script setup lang="ts">
const isLoading = ref(true)
const selectedTimeframe = ref('1H')
const isLive = ref(true) // Live mode btn

interface PricePoint {
  time: number
  value: number
}

const chartData = ref<PricePoint[]>([])
const currentPrice = ref(0)
const priceChange = ref(0)
const high24h = ref(0)
const low24h = ref(0)
const lastUpdate = ref<Date>(new Date())

let updateInterval: NodeJS.Timeout | null = null

const timeframes = [
  { label: '1H', value: '1H', days: 1 },
  { label: '4H', value: '4H', days: 1 },
  { label: '1D', value: '1D', days: 7 },
]

const fetchHistoricalData = async (days: number) => {
  isLoading.value = true
  
  try {
    const interval = days === 7 ? '1h' : '5m'
    const limit = days === 7 ? 168 : 288 // 7 days or 1 day
    
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=${interval}&limit=${limit}`
    )
    const data = await response.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      console.error('No data from Binance')
      return
    }
    
    chartData.value = data.map((candle: any[]) => ({
  time: Math.floor(candle[0] / 1000),
  value: parseFloat(candle[4])
}))
    
   
    const prices = data.map((c: any[]) => parseFloat(c[4]))
    if (prices.length === 0) {
  console.error('No prices available')
  return
}
    currentPrice.value = prices[prices.length - 1] || 0
    const firstPrice = prices[0] || currentPrice.value
    priceChange.value = ((currentPrice.value - firstPrice) / firstPrice) * 100
    high24h.value = Math.max(...prices)
    low24h.value = Math.min(...prices)
    lastUpdate.value = new Date()
    
    console.log('Loaded', chartData.value.length, 'candles from Binance')
  } catch (error) {
    console.error('Failed to load chart:', error)
  } finally {
    isLoading.value = false
  }
}


const fetchLivePrice = async () => {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT')
    const data = await response.json()
    
    const newPrice = parseFloat(data.price)
    
    if (newPrice !== currentPrice.value) {
      const oldPrice = currentPrice.value
      currentPrice.value = newPrice
      
      // Add to chart
      const now = Math.floor(Date.now() / 1000)
      chartData.value.push({
        time: now,
        value: newPrice
      })
      
      if (chartData.value.length > 100) {
        chartData.value.shift()
      }
      
      if (newPrice > high24h.value) high24h.value = newPrice
      if (newPrice < low24h.value) low24h.value = newPrice
      
      lastUpdate.value = new Date()
      
      console.log(` Price update: $${newPrice.toFixed(2)}`)
    }
  } catch (error) {
    console.error('Live price failed:', error)
  }
}

// Start/stop live updates
const startLiveUpdates = () => {
  if (updateInterval) return
  
  console.log(' Starting live updates...')
  isLive.value = true
  

  updateInterval = setInterval(() => {
    fetchLivePrice()
  }, 10000) 
  
 
  fetchLivePrice()
}

const stopLiveUpdates = () => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
  isLive.value = false
  console.log(' Live updates stopped')
}

const toggleLive = () => {
  if (isLive.value) {
    stopLiveUpdates()
  } else {
    startLiveUpdates()
  }
}

const changeTimeframe = async (tf: typeof timeframes[number]) => {
  selectedTimeframe.value = tf.value
  stopLiveUpdates()
  await fetchHistoricalData(tf.days)
  if (selectedTimeframe.value === '1H') {
    startLiveUpdates()
  }
}

const timeSinceUpdate = computed(() => {
  const now = new Date()
  const diff = Math.floor((now.getTime() - lastUpdate.value.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  return `${Math.floor(diff / 60)}m ago`
})

const maxPrice = computed(() => Math.max(...chartData.value.map(p => p.value)))
const minPrice = computed(() => Math.min(...chartData.value.map(p => p.value)))
const priceRange = computed(() => maxPrice.value - minPrice.value || 1)
onMounted(() => {
  fetchHistoricalData(1)
  startLiveUpdates()
})

onUnmounted(() => {
  stopLiveUpdates()
})
</script>

<template>
  <div class="bg-card border border-white/10 rounded-2xl p-6 shadow-xl">
    <!-- Header -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-sm text-gray-500 uppercase tracking-wider">SOL/USDC</span>
          
         
          <button 
            @click="toggleLive"
            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all"
            :class="isLive 
              ? 'bg-green/10 text-green hover:bg-green/20' 
              : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'"
          >
            <span class="inline-flex items-center gap-1">
              <span v-if="isLive" class="w-2 h-2 rounded-full bg-green animate-pulse" />
              <span v-else class="w-2 h-2 rounded-full bg-gray-500" />
              {{ isLive ? 'LIVE' : 'PAUSED' }}
            </span>
          </button>
          
          
          <span v-if="isLive" class="text-[10px] text-gray-500">
            {{ timeSinceUpdate }}
          </span>
        </div>
        
        <!-- Current Price with animation -->
        <div 
          class="text-3xl font-black text-white font-mono transition-all duration-300"
          :class="{ 'scale-110': isLive }"
        >
          ${{ currentPrice.toFixed(2) }}
        </div>
        
       
        <div 
          class="text-sm font-bold mt-1 transition-colors duration-300"
          :class="priceChange >= 0 ? 'text-green' : 'text-red'"
        >
          <span class="inline-flex items-center gap-1">
            <div v-if="priceChange >= 0" class="i-ph-arrow-up-bold w-4 h-4" />
            <div v-else class="i-ph-arrow-down-bold w-4 h-4" />
            {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
          </span>
        </div>
      </div>

      
      <div class="flex gap-1 bg-bg/50 p-1 rounded-lg">
        <button
          v-for="tf in timeframes"
          :key="tf.value"
          @click="changeTimeframe(tf)"
          :disabled="isLoading"
          class="px-3 py-1.5 rounded text-xs font-bold transition-all duration-200"
          :class="selectedTimeframe === tf.value 
            ? 'bg-accent text-black shadow-lg shadow-accent/20' 
            : 'text-gray-500 hover:text-white disabled:opacity-50'"
        >
          {{ tf.label }}
        </button>
      </div>
    </div>

    
    <div class="relative h-48 bg-bg/30 rounded-lg overflow-hidden">
      
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10">
        <div class="i-ph-circle-notched-bold w-8 h-8 text-accent animate-spin" />
      </div>

      
      <div v-else-if="chartData.length > 0" class="h-full flex items-end justify-between gap-px p-4">
        <div
          v-for="(point, i) in chartData"
          :key="point.time"
          class="flex-1 bg-gradient-to-t from-accent/30 to-accent rounded-t-sm transition-all duration-500 hover:from-accent/50 hover:to-accent/80 relative group cursor-pointer"
          :class="{ 'animate-pulse': i === chartData.length - 1 && isLive }"
          :style="{ height: ((point.value - minPrice) / priceRange) * 100 + '%' }"
        >
         
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
            <div class="bg-black/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 whitespace-nowrap shadow-xl">
              <div class="text-xs text-gray-400">
                {{ new Date(point.time * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }}
              </div>
              <div class="text-sm font-bold text-white font-mono">${{ point.value.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>

      
      <div v-else class="absolute inset-0 flex items-center justify-center">
        <div class="text-gray-500 text-sm">Failed to load chart data</div>
      </div>
    </div>

    
    <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
      <div>
        <div class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">24h High</div>
        <div class="text-lg font-bold text-green font-mono">${{ high24h.toFixed(2) }}</div>
      </div>
      <div>
        <div class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">24h Low</div>
        <div class="text-lg font-bold text-red font-mono">${{ low24h.toFixed(2) }}</div>
      </div>
      <div>
        <div class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Data Points</div>
        <div class="text-lg font-bold text-white font-mono">{{ chartData.length }}</div>
      </div>
    </div>
  </div>
</template>