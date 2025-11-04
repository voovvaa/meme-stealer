import path from "node:path";
import { fileURLToPath } from "node:url";

import eslintJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginImport from "eslint-plugin-import";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tsRecommended = tsPlugin.configs.recommended.rules ?? {};
const nodeGlobals = {
  console: "readonly",
  process: "readonly",
  Buffer: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  module: "readonly",
  exports: "readonly",
  require: "readonly"
};

export default [
  {
    ignores: ["dist/**", "node_modules/**", "sessions/**"]
  },
  {
    ...eslintJs.configs.recommended
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: path.resolve(__dirname, "tsconfig.json"),
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: "module"
      },
      globals: nodeGlobals
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: pluginImport,
      "unused-imports": pluginUnusedImports
    },
    rules: {
      ...tsRecommended,
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports"
        }
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false
        }
      ],
      "unused-imports/no-unused-imports": "error",
      "import/order": [
        "error",
        {
          groups: [
            ["builtin", "external"],
            ["internal"],
            ["sibling", "index", "parent"]
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          }
        }
      ],
      "no-undef": "off"
    }
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: nodeGlobals
    },
    plugins: {
      import: pluginImport,
      "unused-imports": pluginUnusedImports
    },
    rules: {
      ...eslintJs.configs.recommended.rules,
      "unused-imports/no-unused-imports": "error",
      "import/order": [
        "error",
        {
          groups: [
            ["builtin", "external"],
            ["internal"],
            ["sibling", "index", "parent"]
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          }
        }
      ]
    }
  },
  eslintConfigPrettier
];
