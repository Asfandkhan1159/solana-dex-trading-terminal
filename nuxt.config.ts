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
        '~': '/'
      }
    },
    optimizeDeps: {
      include: ['@solana/web3.js']
    }
  },

  typescript: {
    typeCheck: false,
    strict: true
  },

  runtimeConfig: {
    heliusApiKey: process.env.HELIUS_API_KEY,
    public: {
      heliusApiKey: process.env.HELIUS_API_KEY
    }
  },

  // ✅ FIX: Configure Nitro for Vercel
  nitro: {
    preset: 'vercel',
    // ✅ Don't bundle @solana/web3.js on server
    externals: {
      inline: ['@solana/web3.js']
    },
    rollupConfig: {
      external: ['@solana/web3.js']
    }
  }
})