import type { Config } from 'tailwindcss';
import preset from '../../packages/config/tailwind-preset.js';

const config: Config = {
  presets: [preset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      height: {
        '13': '3.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
