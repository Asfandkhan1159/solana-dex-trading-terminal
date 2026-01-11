import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
    presets: [
        presetUno(),
        presetIcons({
            extraProperties: {
                'display': 'inline-block',
                'vertical-align': 'middle',
            },
        }),
    ],
    theme: {
        colors: {
            bg: '#0a0a0a',      // ✅ Darker background
            card: '#141414',    // ✅ Card background
            accent: '#c084fc',
            text: '#e5e7eb',
            green: '#10b981',
            red: '#ef4444',
        },
    },
})