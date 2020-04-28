'use strict';

module.exports = function validate(req) {
	const isLocal = process.env.NODE_ENV === 'testing' || process.env.ARC_LOCAL;
	try {
		if (!isLocal) {
			const auth = req.headers.authorization || req.headers.Authorization; // lolhttp
			const token = String(new Buffer.from(auth.slice(7), 'base64'));
			if (token !== process.env.CI_PREVIEW_TOKEN) {
				throw Error('Auth request failed');
			}
		}

		const payload = req.body;
		if (!payload.pr || !payload.sha || !payload.files) {
			return {
				statusCode: 400,
			};
		}
	} catch (err) {
		return {
			statusCode: 400,
		};
	}
};
