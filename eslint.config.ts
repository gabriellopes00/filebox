import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginPrettier from 'eslint-plugin-prettier/recommended'
import pluginReact from 'eslint-plugin-react'
import pluginImport from 'eslint-plugin-import'
import { defineConfig } from 'eslint/config'
import { localPlugin } from './packages/eslint-plugins/local'

export default defineConfig([
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: { globals: globals.browser }
  },

  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginPrettier,

  {
    plugins: { local: localPlugin, import: pluginImport },
    rules: {
      // Import rules
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['default', '*'],
              message: 'Use named imports from React instead (e.g. useState, type ComponentProps)'
            }
          ]
        }
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'import/enforce-node-protocol-usage': ['error', 'always'],

      // react rules
      'react/react-in-jsx-scope': 'off',

      // vars rules
      // 'no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', caughtErrors: 'none' }
      ],

      // Typescript
      '@typescript-eslint/no-explicit-any': 'off',

      // local rules
      'local/lucide-icon-suffix': 'error'
    }
  }
])
