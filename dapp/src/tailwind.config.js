module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx}', './public/index.html'],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#1A202C', // Deep Blue
            light: '#2D3748',
            dark: '#0D1117',
          },
          accent: {
            DEFAULT: '#38B2AC', // Teal
            hover: '#319795',
          },
          danger: '#E53E3E', // Red Alerts
          success: '#48BB78', // Green Data
        },
      },
    },
    plugins: [],
  };