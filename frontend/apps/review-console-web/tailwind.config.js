import sharedConfig from '../../packages/ui-kit/src/theme/tailwind.tokens';

/** @type {import('tailwindcss').Config} */
export default {
  ...sharedConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui-kit/src/**/*.{js,ts,jsx,tsx}',
  ],
};
