import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-plugin-prettier";
import { fixupConfigRules } from "@eslint/compat";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

// fixupConfigRules patches all plugins inside the compat-extended configs that use
// the legacy ESLint v8 context API (e.g. eslint-plugin-react uses context.getFilename()
// which was removed in ESLint v10). This shim makes them work with ESLint v10.
// Note: eslint-plugin-react and @typescript-eslint are registered inside these extended
// configs — they must NOT be re-registered in the outer plugins block (ESLint v10 throws
// on duplicate plugin registration, unlike v9 which silently allowed it).
const legacyExtends = fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
));

export default defineConfig([globalIgnores(["**/index.js", "**/PaymentMethods/Icons/code/code.js"]), {
    extends: legacyExtends,

    plugins: {
        // Only add plugins NOT already registered by the compat.extends above.
        // eslint-plugin-react-hooks@7 is a native flat-config plugin — no compat shim needed.
        "react-hooks": reactHooks,
        // prettier is not registered by any of the extended configs — add it here.
        prettier,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.jest,
            ...globals.node,
        },

        ecmaVersion: "latest",
        sourceType: "module",

        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            ecmaFeatures: {
                jsx: true,
            },

            project: "./tsconfig.json",
        },
    },

    settings: {
        "import/resolver": {
            typescript: {},
        },

        react: {
            version: "detect",
        },
    },

    rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "off",
        "react/prop-types": "off",
        "react/react-in-jsx-scope": "off",
        "@typescript-eslint/strict-boolean-expressions": "off",

        "@typescript-eslint/naming-convention": ["error", {
            selector: "variableLike",
            format: ["camelCase", "snake_case", "PascalCase", "UPPER_CASE"],
            leadingUnderscore: "allow",
        }],
        '@typescript-eslint/no-unused-vars': [
            'error',
            { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
        ],

        // eslint-plugin-react-hooks v7 introduces many new rules (immutability, purity,
        // refs, set-state-in-effect, etc.). These are too aggressive for the current
        // codebase — disable the new ones and retain only the two rules from v5.
        "react-hooks/static-components": "off",
        "react-hooks/use-memo": "off",
        "react-hooks/void-use-memo": "off",
        "react-hooks/preserve-manual-memoization": "off",
        "react-hooks/incompatible-library": "off",
        "react-hooks/immutability": "off",
        "react-hooks/globals": "off",
        "react-hooks/refs": "off",
        "react-hooks/set-state-in-effect": "off",
        "react-hooks/error-boundaries": "off",
        "react-hooks/purity": "off",
        "react-hooks/set-state-in-render": "off",
        "react-hooks/unsupported-syntax": "off",
        "react-hooks/config": "off",
        "react-hooks/gating": "off",
    },
}, {
    // Test files are excluded from tsconfig.json — disable TypeScript project-aware
    // rules so @typescript-eslint/parser does not error on "file not found in project".
    files: ["**/*.test.ts", "**/*.spec.ts"],
    languageOptions: {
        parserOptions: {
            project: false,
        },
    },
    rules: {
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/require-await": "off",
    },
}]);
