// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.tsx',
    './components/**/*.tsx'
  ],
  theme: {
    extend: {
      colors: {
        'ghost-purple': '#8B5CF6',
        'ghost-dark': '#1a1a2e',
        'ghost-light': '#16213e',
      },
      animation: {
        'pulse-recording': 'pulse-recording 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-recording': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.5',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

export default config;