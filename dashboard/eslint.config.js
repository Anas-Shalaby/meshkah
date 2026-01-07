import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      "src/app/dashboard/theme/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      // Disable all TypeScript-specific rules
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",

      // Disable general rules
      "no-unused-vars": "off",
      "@next/next/no-html-link-for-pages": "off",

      // Disable React rules that might cause issues
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];
