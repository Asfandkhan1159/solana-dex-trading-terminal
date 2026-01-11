<script setup lang="ts">
interface Stats {
  tvl: number
  volume24h: number
  trades24h: number
  liquidity: number
}

const stats = ref<Stats>({
  tvl: 0,
  volume24h: 0,
  trades24h: 0,
  liquidity: 0
})

const isLoading = ref(true)
const lastUpdate = ref<Date>(new Date())


const fetchStats = async () => {
  isLoading.value = true
  
  try {
   
    const response = await fetch('/api/liquidity-stats')
    const data = await response.json()
    
    stats.value = data
    lastUpdate.value = new Date()
    
    console.log(' Liquidity stats updated:', data)
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  } finally {
    isLoading.value = false
  }
}

const formatNumber = (num: number): string => {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

const formatCount = (num: number): string => {
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
  return num.toString()
}


const timeSinceUpdate = computed(() => {
  const now = new Date()
  const diff = Math.floor((now.getTime() - lastUpdate.value.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  return `${Math.floor(diff / 60)}m ago`
})


onMounted(() => {
  fetchStats()
  
 
  setInterval(fetchStats, 300000)
})
</script>

<template>
  <div class="bg-card border border-white/10 rounded-2xl p-6 shadow-xl">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-sm font-bold uppercase tracking-wider text-gray-400">
        Market Stats
      </h3>
      
      <div class="flex items-center gap-2">
        <div v-if="isLoading" class="i-ph-circle-notched-bold w-4 h-4 text-accent animate-spin" />
        <div v-else class="flex items-center gap-1">
          <div class="w-2 h-2 rounded-full bg-green animate-pulse" />
          <span class="text-[10px] text-gray-500">{{ timeSinceUpdate }}</span>
        </div>
      </div>
    </div>

  
    <div class="space-y-4">
      
      <div class="group hover:bg-white/5 p-4 rounded-lg transition-all cursor-pointer">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-500 uppercase tracking-wider">Total Value Locked</span>
          <div class="i-ph-lock-bold w-4 h-4 text-accent opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <div class="text-2xl font-black text-white font-mono group-hover:text-accent transition-colors">
          {{ formatNumber(stats.tvl) }}
        </div>
      </div>

      
      <div class="group hover:bg-white/5 p-4 rounded-lg transition-all cursor-pointer">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-500 uppercase tracking-wider">24h Volume</span>
          <div class="i-ph-chart-line-up-bold w-4 h-4 text-green opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <div class="text-2xl font-black text-white font-mono group-hover:text-green transition-colors">
          {{ formatNumber(stats.volume24h) }}
        </div>
      </div>

      
      <div class="group hover:bg-white/5 p-4 rounded-lg transition-all cursor-pointer">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-500 uppercase tracking-wider">24h Trades</span>
          <div class="i-ph-swap-bold w-4 h-4 text-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <div class="text-2xl font-black text-white font-mono group-hover:text-purple-500 transition-colors">
          {{ formatCount(stats.trades24h) }}
        </div>
      </div>

      
      <div class="group hover:bg-white/5 p-4 rounded-lg transition-all cursor-pointer">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-500 uppercase tracking-wider">Available Liquidity</span>
          <div class="i-ph-drop-bold w-4 h-4 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <div class="text-2xl font-black text-white font-mono group-hover:text-blue-500 transition-colors">
          {{ formatNumber(stats.liquidity) }}
        </div>
      </div>
    </div>

    
    <div class="mt-6 pt-4 border-t border-white/5">
      <div class="flex items-center justify-between text-[10px] text-gray-500">
        <span>Powered by Birdeye</span>
        <span class="uppercase tracking-wider">SOL/USDC</span>
      </div>
    </div>
  </div>
</template>