'use strict';

module.exports = {
	env: {
		node: true,
		es6: true,
	},
	extends: '@ljharb/eslint-config/node/12',
	rules: {
		camelcase: [
			'error', {
				properties: 'never',
				ignoreDestructuring: false,
				ignoreImports: false,
				allow: [],
			},
		],
		'comma-dangle': ['error', 'always-multiline'],
		'dot-notation': [2, { allowKeywords: true }],
		eqeqeq: [2, 'allow-null'],
		'func-style': 'warn',
		'handle-callback-err': 'error',
		'id-length': 'off',
		'max-len': 'off',
		'max-statements-per-line': ['error', { max: 2 }],
		'no-cond-assign': ['error', 'always'],
		'no-console': 'off',
		'no-unused-vars': [
			'error', {
				vars: 'all', args: 'after-used', ignoreRestSiblings: true,
			},
		],
		'object-shorthand': ['error', 'always'],
		'prefer-arrow-callback': 'error',
		'prefer-const': 'error',
		'prefer-destructuring': 'error',
		'prefer-exponentiation-operator': 'error',
		'prefer-numeric-literals': 'error',
		'prefer-object-spread': 'error',
		'prefer-promise-reject-errors': 'error',
		'prefer-rest-params': 'error',
		'prefer-spread': 'error',
		'prefer-template': 'error',
		'sort-keys': 'off',
	},
};
