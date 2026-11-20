import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#172554', foreground: '#ffffff' },
        secondary: { DEFAULT: '#64748B', foreground: '#ffffff' },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        background: '#F8FAFC',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        foreground: 'hsl(var(--foreground))',
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        // Vibrant palette from design reference
        electric: {
          blue: '#3A4EFB',
          sky: '#33A4FA',
        },
        lime: {
          DEFAULT: '#E3FF3B',
          foreground: '#252943',
        },
        navy: {
          DEFAULT: '#252943',
          light: '#3A3F58',
        },
        lavender: {
          DEFAULT: '#DEE0ED',
          light: '#EDEDF5',
          dark: '#C8CBDB',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
export default config
