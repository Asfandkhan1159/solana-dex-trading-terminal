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
    }
  },

  // ✅ DISABLE broken type checking in dev
  typescript: {
    typeCheck: false,  // We'll use 'npx nuxt typecheck' manually
    strict: true
  },

  runtimeConfig: {
    heliusApiKey: process.env.HELIUS_API_KEY,
    public: {
      heliusApiKey: process.env.HELIUS_API_KEY
    }
  }
})