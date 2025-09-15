import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import typescriptPlugin from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'

const config = [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      '.git/**',
      '.yarn/**',
      'coverage/**',
      'build/**',
    ],
  },

  // Base JavaScript configuration
  js.configs.recommended,

  // Global settings for all files
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // TypeScript files configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2024,
        sourceType: 'module',
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
      // TypeScript rules
      ...typescriptPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-var-requires': 'error',

      // React rules
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js 13+
      'react/prop-types': 'off', // TypeScript handles this
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-unescaped-entities': 'warn',

      // React Hooks rules
      ...reactHooksPlugin.configs.recommended.rules,

      // Accessibility rules
      ...jsxA11yPlugin.configs.recommended.rules,
      'jsx-a11y/anchor-is-valid': 'off', // Next.js Link component

      // Next.js rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // Code quality rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': 'off', // Handled by TypeScript
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

      // Prettier integration
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
    },
  },

  // JavaScript files configuration
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@next/next': nextPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // React rules for JS files
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',

      // React Hooks rules
      ...reactHooksPlugin.configs.recommended.rules,

      // Accessibility rules
      ...jsxA11yPlugin.configs.recommended.rules,
      'jsx-a11y/anchor-is-valid': 'off',

      // Next.js rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // Code quality rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',

      // Prettier integration
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
    },
  },

  // Configuration files
  {
    files: ['*.config.{js,ts}', '*.config.*.{js,ts}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // Test files
  {
    files: ['**/__tests__/**/*', '**/*.{test,spec}.{js,ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Prettier config override (must be last)
  prettierConfig,
]

export default config
