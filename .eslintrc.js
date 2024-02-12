'use strict';

module.exports = {
	extends: '@ljharb/eslint-config/node/18',
	rules: {
		camelcase: [
			'error', {
				properties: 'never',
				ignoreDestructuring: false,
				ignoreImports: false,
				allow: [],
			},
		],
		eqeqeq: [2, 'allow-null'],
		'func-style': 'warn',
		'id-length': 'off',
		'max-len': 'off',
		'max-statements-per-line': ['error', { max: 2 }],
		'no-unused-vars': [
			'error', {
				vars: 'all', args: 'after-used', ignoreRestSiblings: true,
			},
		],
		'sort-keys': 'off',
	},
	ignorePatterns: [
		'public/',
		'out/',
	],
};
