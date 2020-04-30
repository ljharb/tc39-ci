'use strict';

module.exports = {
	env: {
		node: true,
		es6: true
	},
	extends: '@ljharb',
	parserOptions: {
		ecmaVersion: 2018,
	},
	rules: {
		camelcase: ['error', {
			properties: 'never',
			ignoreDestructuring: false,
			ignoreImports: false,
			allow: []
		}],
		'comma-dangle': ['error', "always-multiline"],
		'func-style': 'warn',
		'handle-callback-err': 'error',
		'max-len': 'off',
		"max-statements-per-line": ['error', { max: 2 }],
		'no-cond-assign': ['error', 'always'],
		'no-console': 'off',
		'no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
		'object-shorthand': ['error', 'always'],
		'sort-keys': 'off',
	},
};
