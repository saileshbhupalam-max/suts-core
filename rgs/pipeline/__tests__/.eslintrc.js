module.exports = {
  parserOptions: {
    project: __dirname + '/../tsconfig.test.json',
  },
  rules: {
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
};
