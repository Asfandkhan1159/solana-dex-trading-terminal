# 🚀 Solana DEX Trading Terminal

A professional, production-ready decentralized exchange interface for Solana, built with modern web technologies and real-time data streaming.

![Solana](https://img.shields.io/badge/Solana-14F195?style=for-the-badge&logo=solana&logoColor=white)
![Nuxt](https://img.shields.io/badge/Nuxt-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=websocket&logoColor=white)

## ✨ Features

### 📊 Real-Time Trading
- **Live Price Feed** - WebSocket connection to Binance for sub-second SOL/USDT updates
- **Interactive Charts** - Historical price data with multiple timeframes (1H, 4H, 1D)
- **Order Book Visualization** - Real-time bid/ask depth with visual indicators
- **Market Statistics** - Live TVL, 24h volume, and trade counts from Birdeye

### 🔗 Blockchain Integration
- **Phantom Wallet** - Seamless wallet connection and transaction signing
- **Jupiter Aggregator** - Best swap routes across all Solana DEXes
- **Helius RPC** - Fast, reliable Solana blockchain access
- **Transaction Building** - Production-ready swap transaction architecture

### 🎨 Professional UI/UX
- **Dark Mode Design** - Trading-optimized color scheme
- **Responsive Layout** - Desktop and mobile support
- **Smooth Animations** - Polished user interactions
- **Loading States** - Professional feedback for all async operations
- **Error Handling** - Graceful fallbacks when APIs fail

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | Nuxt 3 (v4.2.2) | Vue meta-framework with SSR |
| **Frontend** | Vue 3 Composition API | Reactive component architecture |
| **Language** | TypeScript (Strict) | Type-safe development |
| **State** | Pinia | Centralized state management |
| **Styling** | UnoCSS | Atomic CSS framework |
| **Validation** | Zod | Schema validation for forms |
| **Real-time** | WebSocket (Native) | Live price streaming |
| **Blockchain** | Solana Web3.js | Solana interactions |
| **Wallet** | Phantom Adapter | Wallet connection |

## 📊 Data Sources & Architecture

### Price Feeds
- **Primary:** Jupiter Aggregator API (real-time swap quotes)
- **Fallback:** Birdeye API (Solana DEX prices)
- **Cache Strategy:** 2-minute server-side cache to respect rate limits
- **Live Updates:** Binance WebSocket for real-time price streaming

### Market Data
- **Source:** Birdeye DeFi API
- **Metrics:** TVL, 24h Volume, Trades, Liquidity
- **Cache Strategy:** 5-minute server-side cache
- **Refresh:** Auto-refresh every 5 minutes

### Chart Data
- **Source:** Binance Public API
- **Connection:** WebSocket (wss://stream.binance.com)
- **Update Frequency:** Sub-second live updates
- **History:** Multiple timeframes with OHLC data

### Blockchain Access
- **Provider:** Helius RPC
- **Usage:** Wallet balances, transaction validation
- **Network:** Solana Mainnet

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Phantom wallet browser extension

### Installation
```bash