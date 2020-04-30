'use strict';

module.exports = function validate(req) {
	const { path } = req;
	const { k: kind, etc } = req.pathParameters;

	let headers = {
		'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
		'content-type': 'text/html; charset=utf8',
	};

	if (kind === 'sha' && etc.length === 40 && !path.endsWith('/')) {
		/*
		 * etc.length 40 == SHA URL request, and we need a trailing trailing slash
		 * Seems a little hacky but it's only temporary until we implement non-trailing slash index.html peeking into arc/fns
		 */
		return {
			location: req.path + '/',
		};
	}

	if (kind === 'sha' || kind === 'pull') {
		return void undefined;
	}

	return {
		headers,
		statusCode: 404,
	};
};
