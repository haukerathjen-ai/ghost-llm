// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        border: '#1e293b',
        background: '#0a0a0a',
        foreground: '#ffffff',
      },
      borderColor: {
        DEFAULT: '#1e293b',
      },
    },
  },
  plugins: [],
};

export default config;
