// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'

import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import typescriptPlugin from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'

const IGNORED_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/.vercel/**',
  '**/out/**',
  '**/dist/**',
  '**/build/**',
  'coverage/**',
  '**/.cache/**',
  '**/.yarn/**',
  '.git/**',
  'public/**',
  'prisma/migrations/**',
  'scripts/**',
  '__tests__/**',
  'tests/**',
  'test-results*/**',
  'scratch/**',
  'design/prototypes/**',
  'backend/**',
  'lib/**',
  'app/**',
  '!app/api/agent-interaction/**',
  '!app/api/consciousness-crafting/**',
  '!app/api/create-agent/**',
  '!app/api/profile/**',
  '!app/api/user-charts/**',
  '!app/philosophers-stone/**',
  '!lib/api-client/**',
  '!lib/consciousness/**',
  '!lib/utils.ts',
  '**/*.json',
  '**/*.md',
  '**/*.log',
  '**/*.ipynb',
  '**/*.py',
  '**/*.sh',
  '**/*.env*',
  'dev.db',
]

const SOURCE_GLOBS = [
  'app/api/agent-interaction/**/*.{ts,tsx}',
  'app/api/consciousness-crafting/**/*.{ts,tsx}',
  'app/api/user-charts/**/*.{ts,tsx}',
  'app/api/profile/**/*.{ts,tsx}',
  'app/api/create-agent/**/*.{ts,tsx}',
  'app/philosophers-stone/**/*.{ts,tsx}',
  'lib/api-client/**/*.ts',
  'lib/consciousness/**/*.ts',
  'lib/utils.ts',
]

const COMMON_RULES = {
  ...js.configs.recommended.rules,
  ...reactPlugin.configs.recommended.rules,
  ...reactHooksPlugin.configs.recommended.rules,
  ...jsxA11yPlugin.configs.recommended.rules,
  ...nextPlugin.configs.recommended.rules,
  ...nextPlugin.configs['core-web-vitals'].rules,
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  'react/jsx-uses-react': 'off',
  'react/jsx-uses-vars': 'error',
  'jsx-a11y/anchor-is-valid': 'off',
  'no-console': 'off',
  'no-debugger': 'error',
  'no-duplicate-imports': 'error',
  'prefer-const': 'error',
  'no-var': 'error',
  'object-shorthand': 'error',
  'prefer-template': 'error',
  'prettier/prettier': [
    'error',
    {
      semi: false,
      singleQuote: true,
      trailingComma: 'es5',
      tabWidth: 2,
      useTabs: false,
      printWidth: 100,
      endOfLine: 'lf',
    },
  ],
}

const config = [
  { ignores: IGNORED_PATTERNS },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@next/next': nextPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: SOURCE_GLOBS,
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        setImmediate: 'readonly',
        performance: 'readonly',
        Blob: 'readonly',
        WebSocket: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        ReadableStream: 'readonly',
        AbortController: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        alert: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@next/next': nextPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...COMMON_RULES,
      ...typescriptPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['*.config.{js,ts}', '*.config.*.{js,ts}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*', '**/*.{test,spec}.{js,ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettierConfig,
  ...storybook.configs['flat/recommended'],
]

export default config
