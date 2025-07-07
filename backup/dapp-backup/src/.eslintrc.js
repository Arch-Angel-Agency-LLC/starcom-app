module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    extends: [
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:tailwindcss/recommended", // For TailwindCSS
      "plugin:prettier/recommended"
    ],
    rules: {
      "react/react-in-jsx-scope": "off", // Not needed in modern React
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": ["error"],
      "tailwindcss/classnames-order": "warn", // Optional: enforce consistent Tailwind class ordering
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  };