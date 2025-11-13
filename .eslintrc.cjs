module.exports = {
  root: true,
  // если стояла "extends: ['@antfu']" – оставь, но переопредели ниже
  extends: ['@antfu'],
  rules: {
    // стилистика – выключаем
    'antfu/if-newline': 'off',
    'style/arrow-parens': 'off',
    'style/brace-style': 'off',
    'style/quote-props': 'off',
    'prefer-template': 'off',
    'perfectionist/sort-named-imports': 'off',
    'import/consistent-type-specifier-style': 'off',

    // предупреждения вместо ошибок
    'unused-imports/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],

    // алерты/консоль (оставим в серверной части, см. overrides ниже)
    'no-alert': 'off',
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
  },
  overrides: [
    // серверные файлы – правила node/*
    {
      files: ['server/**/*.ts', 'server/**/*.js'],
      env: { node: true },
      rules: {
        'node/prefer-global/process': 'off',
        'node/prefer-global/buffer': 'off',
        'no-console': 'off',
      },
    },
    // генерируемые типы – вообще не линтим
    {
      files: ['auto-imports.d.ts', 'components.d.ts'],
      rules: { 'eslint-comments/no-unlimited-disable': 'off' },
    },
  ],
}
