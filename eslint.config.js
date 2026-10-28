import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        document: 'readonly',
        localStorage: 'readonly',
        window: 'readonly',
        crypto: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      jsdoc,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsdoc.configs['flat/recommended'].rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
          },
          contexts: ['FunctionDeclaration'],
        },
      ],
    },
  },
];
