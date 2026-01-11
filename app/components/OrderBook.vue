<script setup lang="ts">
interface OrderRow {
  price: number
  amount: number
  total: number
}

const asks = ref<OrderRow[]>([])
const bids = ref<OrderRow[]>([])
const isLoading = ref(true)


const fetchOrderbook = async () => {
  isLoading.value = true
  try {
    const data: any = await $fetch('/api/orderbook', {
      query: { pair: 'SOL/USDC' }
    })
    
    asks.value = data.asks || []
    bids.value = data.bids || []
    
    console.log(' Orderbook loaded:', asks.value.length, 'asks,', bids.value.length, 'bids')
  } catch (error) {
    console.error(' Failed to fetch orderbook:', error)
  } finally {
    isLoading.value = false
  }
}

// Load on mount
onMounted(() => {
  fetchOrderbook()
  // Refresh every 10 seconds
  setInterval(fetchOrderbook, 10000)
})

const spread = computed(() => {
  if (asks.value.length === 0 || bids.value.length === 0) return 0
  const lowestAsk = asks.value[asks.value.length - 1]
  const highestBid = bids.value[0]
  if (!lowestAsk || !highestBid) return 0
  return parseFloat((lowestAsk.price - highestBid.price).toFixed(2))
})

const spreadPercent = computed(() => {
  if (asks.value.length === 0) return 0
  const lowestAsk = asks.value[asks.value.length - 1]
  if (!lowestAsk) return 0
  return parseFloat(((spread.value / lowestAsk.price) * 100).toFixed(3))
})

const maxAskAmount = computed(() => {
  if (asks.value.length === 0) return 1
  return Math.max(...asks.value.map(a => a.amount))
})

const maxBidAmount = computed(() => {
  if (bids.value.length === 0) return 1
  return Math.max(...bids.value.map(b => b.amount))
})
</script>

<template>
  <div class="bg-card border border-white/10 rounded-2xl p-6 shadow-xl">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-sm font-bold uppercase tracking-wider text-gray-400">Order Book</h3>
      <div v-if="isLoading" class="i-ph-circle-notched-bold w-4 h-4 text-accent animate-spin" />
      <div v-else class="flex items-center gap-1 text-[10px] text-green">
        <div class="w-2 h-2 rounded-full bg-green animate-pulse" />
        <span class="font-bold">LIVE</span>
      </div>
    </div>

    <!-- Spread Info -->
    <div class="bg-bg/50 rounded-lg p-3 mb-4">
      <div class="flex justify-between items-center">
        <span class="text-xs text-gray-500">Spread</span>
        <div class="text-right">
          <div class="text-sm font-bold text-white font-mono">${{ spread }}</div>
          <div class="text-[10px] text-gray-500">{{ spreadPercent }}%</div>
        </div>
      </div>
    </div>

    <!-- Column Headers -->
    <div class="grid grid-cols-3 px-4 py-2 text-[10px] text-gray-500 uppercase tracking-wider font-bold border-b border-white/5">
      <span>Price (USDC)</span>
      <span class="text-right">Amount (SOL)</span>
      <span class="text-right">Total</span>
    </div>


    <div class="space-y-0.5 my-4">
      <div
        v-for="(ask, i) in asks"
        :key="'ask-' + i"
        class="relative group cursor-pointer"
      >
     
        <div 
          class="absolute inset-y-0 right-0 bg-red/10 transition-all duration-500"
          :style="{ width: (ask.amount / maxAskAmount) * 100 + '%' }"
        />
        

        <div class="relative grid grid-cols-3 px-4 py-1.5 text-xs hover:bg-red/5 transition-colors z-10">
          <span class="text-red font-mono font-bold">{{ ask.price.toFixed(2) }}</span>
          <span class="text-gray-300 font-mono text-right">{{ ask.amount.toFixed(3) }}</span>
          <span class="text-gray-500 font-mono text-right">{{ ask.total.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Mid Price -->
    <div class="py-3 text-center border-y border-white/10">
      <div class="text-lg font-black text-white font-mono">
        ${{ bids[0]?.price.toFixed(2) || '0.00' }}
      </div>
      <div class="text-[10px] text-gray-500 uppercase tracking-wider">Mid Price</div>
    </div>

   
    <div class="space-y-0.5 my-4">
      <div
        v-for="(bid, i) in bids"
        :key="'bid-' + i"
        class="relative group cursor-pointer"
      >
       
        <div 
          class="absolute inset-y-0 right-0 bg-green/10 transition-all duration-500"
          :style="{ width: (bid.amount / maxBidAmount) * 100 + '%' }"
        />
        
     
        <div class="relative grid grid-cols-3 px-4 py-1.5 text-xs hover:bg-green/5 transition-colors z-10">
          <span class="text-green font-mono font-bold">{{ bid.price.toFixed(2) }}</span>
          <span class="text-gray-300 font-mono text-right">{{ bid.amount.toFixed(3) }}</span>
          <span class="text-gray-500 font-mono text-right">{{ bid.total.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>