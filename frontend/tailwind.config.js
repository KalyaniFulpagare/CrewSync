export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12142B',
        paper: '#F6F7FB',
        surface: '#FFFFFF',
        accent: { DEFAULT: '#4A5AF0', soft: '#EEF0FE' },
        success: '#1F9D6C',
        warning: '#D97706',
        danger: '#DC2626',
        text: { DEFAULT: '#1B1D2A', muted: '#6B7086' }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
