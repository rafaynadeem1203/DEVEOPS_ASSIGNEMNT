import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginPropTypes from "eslint-plugin-react-props"; // For PropTypes validation

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: pluginReact,
      "react-props": pluginPropTypes,
    },
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
    },
    rules: {
      // React-specific rules
      "react/react-in-jsx-scope": "off", // Disable if you're using React 17+ (automatic JSX runtime)
      "react/jsx-props-no-spreading": "off", // Allow prop spreading
      "react/prop-types": "warn", // Warn about missing PropTypes
      "react/display-name": "off", // Ignore display name requirement

      // Additional rules for stricter linting
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "no-unused-vars": "warn",
    }
  },
];
