import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
    presets: [
        presetUno(),
        presetIcons({
            prefix: 'i-',
            extraProperties: {
                'display': 'inline-block',
                'vertical-align': 'middle',
            },
        }),
    ],
    theme: {
        colors: {
            bg: '#0f0f17',
            card: '#1a1a2e',
            text: '#e0e0ff',
            accent: '#a855f7',
            green: '#22c55e',
            red: '#ef4444',
        },
    },
    safelist: ['text-red', 'text-green', 'bg-accent', 'bg-card', 'bg-bg', 'text-white'],
})