// eslint.config.ts
import antfu from '@antfu/eslint-config'

export default antfu({
  // форматтеры
  formatters: { css: true },

  // Глобальные игноры (замена .eslintignore)
  ignores: [
    'node_modules',
    'dist',
    'build',
    '.output',
    '.vercel',
    '.netlify',
    'coverage',
    // генерируемые и публичные
    'auto-imports.d.ts',
    'components.d.ts',
    'public/**',
    'uploads/**',
    '.private/**',
    '**/generated/**',
  ],

  // Общие правила
  rules: {
    // косметика — не ругаться
    'antfu/if-newline': 'off',
    'style/arrow-parens': 'off',
    'style/brace-style': 'off',
    'style/quote-props': 'off',
    'prefer-template': 'off',
    'perfectionist/sort-named-imports': 'off',
    'import/consistent-type-specifier-style': 'off',

    // консоль
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],

    // не убивай за неиспользуемые (разрешим _)
    'unused-imports/no-unused-vars': [
      'warn',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      },
    ],

    // твои правила
    'perfectionist/sort-imports': ['error', { type: 'natural', order: 'asc' }],
    'perfectionist/sort-objects': [
      'error',
      {
        destructureOnly: true,
        ignoreCase: true,
        order: 'asc',
        type: 'alphabetical',
      },
    ],
    'vue/max-attributes-per-line': ['error', { singleline: 1 }],
  },

  // Перекрытия для серверного кода
  overrides: [
    {
      files: ['server/**/*.{ts,js}'],
      rules: {
        // эти правила мешали
        'node/prefer-global/process': 'off',
        'node/prefer-global/buffer': 'off',
        'no-console': 'off',
      },
    },
  ],
})
