import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'warn',
      eqeqeq: ['error', 'smart'],
      // Pin explicitly so the inline disables in client effects stay meaningful
      // even if the Next preset changes this rule's default level.
      'react-hooks/set-state-in-effect': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '__tests__/**/*'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['lib/logger.ts', 'lib/env.ts', 'scripts/**/*', 'prisma/seed.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'generated/**',
    'coverage/**',
  ]),
]);

export default eslintConfig;
