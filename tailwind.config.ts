import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // zinc-950
        surface: '#18181b', // zinc-900
        border: '#27272a', // zinc-800
        alchemical: {
          spirit: '#a855f7', // purple-500
          essence: '#10b981', // emerald-500
          matter: '#3b82f6', // blue-500
          substance: '#f59e0b', // amber-500
        },
      },
      backgroundImage: {
        'premium-gradient': 'linear-gradient(to right, #09090b, #18181b)',
      },
    },
  },
  plugins: [],
}
export default config
