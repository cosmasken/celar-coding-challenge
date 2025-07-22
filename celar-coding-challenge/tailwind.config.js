// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4a6da7',
          50: '#f0f4fa',
          100: '#dce5f3',
          200: '#bfd0e9',
          300: '#96b2db',
          400: '#6a8fca',
          500: '#4a6da7',
          600: '#3a5a8e',
          700: '#304a75',
          800: '#2b3f61',
          900: '#273752',
        },
        secondary: '#e74c3c',
        background: '#f7f9fc',
        surface: '#ffffff',
        text: {
          primary: '#333333',
          secondary: '#555555',
          placeholder: '#999999'
        }
      },
    },
  },
  plugins: [],
}