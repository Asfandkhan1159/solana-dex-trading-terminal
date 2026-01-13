export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@unocss/nuxt',
  ],

  imports: {
    dirs: ['stores'],
  },

  vite: {
    resolve: {
      alias: {
        '@': '/',
        '~': '/',

        'eventemitter3': 'eventemitter3'
      },

      dedupe: ['eventemitter3']
    },
    optimizeDeps: {
      include: [
        '@solana/web3.js',
        'eventemitter3'
      ],
      exclude: [],
      esbuildOptions: {
        target: 'esnext',
        define: {
          global: 'globalThis'
        }
      }
    }
  },

  typescript: {
    typeCheck: false,
    strict: true
  },

  runtimeConfig: {
    heliusApiKey: process.env.HELIUS_API_KEY,
    birdeyeApiKey: process.env.BIRDEYE_API_KEY,
    public: {
      heliusApiKey: process.env.HELIUS_API_KEY
    }
  },

  nitro: {
    preset: 'vercel'
  }
})