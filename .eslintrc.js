module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: [
      './tsconfig.json',
      './packages/*/tsconfig.json',
      './packages/*/tsconfig.test.json',
      './examples/*/tsconfig.json',
      './plugins/*/tsconfig.json',
      './rgs/*/tsconfig.json',
      './rgs/*/*/tsconfig.json',
      './rgs/*/*/tsconfig.test.json'
    ],
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  overrides: [
    {
      files: ['**/packages/core/__tests__/**/*.ts', 'packages/core/__tests__/**/*.ts'],
      parserOptions: {
        project: './packages/core/tsconfig.test.json'
      }
    },
    {
      files: ['packages/cli/**/__tests__/**/*.ts'],
      parserOptions: {
        project: './packages/cli/tsconfig.json'
      }
    },
    {
      files: ['packages/telemetry/**/__tests__/**/*.ts', 'packages/telemetry/src/**/*.test.ts'],
      parserOptions: {
        project: './packages/telemetry/tsconfig.test.json'
      }
    },
    {
      files: ['packages/analysis/**/__tests__/**/*.ts', 'packages/analysis/src/**/*.test.ts'],
      parserOptions: {
        project: './packages/analysis/tsconfig.test.json'
      }
    },
    {
      files: ['packages/decision/**/__tests__/**/*.ts', 'packages/decision/src/**/*.test.ts'],
      parserOptions: {
        project: './packages/decision/tsconfig.test.json'
      }
    },
    {
      files: ['packages/persona/**/__tests__/**/*.ts', 'packages/persona/src/**/*.test.ts'],
      parserOptions: {
        project: './packages/persona/tsconfig.test.json'
      }
    },
    {
      files: ['packages/simulation/**/__tests__/**/*.ts', 'packages/simulation/src/**/*.test.ts'],
      parserOptions: {
        project: './packages/simulation/tsconfig.test.json'
      }
    }
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': ['error', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true
    }],
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': ['error', {
      allowString: false,
      allowNumber: false,
      allowNullableObject: false
    }],
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase']
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase']
      },
      {
        selector: 'class',
        format: ['PascalCase']
      },
      {
        selector: 'enum',
        format: ['PascalCase']
      }
    ]
  },
  ignorePatterns: ['dist', 'coverage', 'node_modules', '*.js', '!.eslintrc.js', '!jest.config*.js']
};
