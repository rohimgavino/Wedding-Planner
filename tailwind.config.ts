import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wedding: {
          50: '#FDF8F5',
          100: '#FAF0EB',
          200: '#F5E1D7',
          300: '#ECCAC0',
          400: '#DE9E8E',
          500: '#D97762',
          600: '#C85A43',
          700: '#A7422E',
          800: '#8A3626',
          900: '#713023',
        },
        champagne: {
          50: '#FAF8F3',
          100: '#F5EFE3',
          200: '#EBDDC6',
          300: '#DEC6A4',
          400: '#CDA87B',
          500: '#B88B57',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E6EDE6',
          500: '#5F8D76',
          600: '#4B735F',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;