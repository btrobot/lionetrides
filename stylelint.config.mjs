/** @type {import('stylelint').Config} */
const stylelintConfig = {
  extends: 'stylelint-config-standard',
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'layer', 'theme', 'custom-variant', 'utility'],
      },
    ],
    'hue-degree-notation': null,
    'import-notation': null,
    'lightness-notation': null,
    'rule-empty-line-before': null,
    'value-keyword-case': null,
  },
};

export default stylelintConfig;
