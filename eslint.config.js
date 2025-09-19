import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,ts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        queueMicrotask: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        performance: 'readonly',
        history: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        DOMException: 'readonly',
        DOMParser: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        crypto: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      // Disable the base rule and use TypeScript-specific one
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['src/**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.svelte'],
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        queueMicrotask: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        performance: 'readonly',
        history: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        DOMException: 'readonly',
        DOMParser: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        crypto: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        Buffer: 'readonly',
        // DOM types
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLSpanElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        FocusEvent: 'readonly',
        PointerEvent: 'readonly',
        PopStateEvent: 'readonly',
        IntersectionObserverEntry: 'readonly',
        MediaQueryList: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        Text: 'readonly',
        getComputedStyle: 'readonly',
      },
    },
    plugins: {
      svelte,
      '@typescript-eslint': ts,
    },
    rules: {
      ...svelte.configs.recommended.rules,
      // CRITICAL: Prevent self-closing HTML tags for non-void elements
      'svelte/html-self-closing': [
        'error',
        {
          void: 'always', // <br/>, <img/> etc should be self-closing
          normal: 'never', // <div>, <span>, <canvas> etc should NOT be self-closing
          component: 'always', // Svelte components can be self-closing
        },
      ],
      // Override any unused vars rules from svelte.configs.recommended
      // This MUST come after spreading svelte.configs.recommended.rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    ignores: [
      'build/',
      '.svelte-kit/',
      'dist/',
      'node_modules/',
      'storybook-static/',
      '.vercel/',
      '*.js', // Ignore root config files
    ],
  },
];
