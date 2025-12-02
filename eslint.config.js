import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript 相關規則
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      
      // React 相關規則
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
      
      // Next.js 相關規則
      "@next/next/no-img-element": "warn",
      
      // 一般規則
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": "off", // 使用 TypeScript 版本
      "prefer-const": "warn",
      "no-var": "error",
    },
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.ts",
      "prisma/**",
      "scripts/**",
    ],
  },
];

export default eslintConfig;

