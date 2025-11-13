module.exports = {
  extends: ['../../../.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.test.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Add any GitHub scraper-specific overrides here
  },
};
