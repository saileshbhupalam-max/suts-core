module.exports = {
  extends: ['../../.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.test.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    'no-console': 'off', // Allow console in logging module
  },
};
