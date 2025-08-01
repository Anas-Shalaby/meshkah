import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/ban-types": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
    ignores: ["node_modules/**", ".next/**", "out/**"],
  },
];
