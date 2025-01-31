module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
  },
  extends: ['plugin:prettier/recommended', 'eslint:recommended'],
  plugins: ['babel','eslint-plugin'],
  env: {
    amd: true,
    browser: true,
    es6: true,
    node: true,
  },
  rules: {
    'max-len': [
      'error',
      {
        code: 250,
        ignoreUrls: true,
        ignoreComments: false,
        ignoreRegExpLiterals: true,
        ignoreStrings: false,
        ignoreTemplateLiterals: false,
      },
    ],
    'no-console': ['error', { allow: ['error'] }],
  },
};
