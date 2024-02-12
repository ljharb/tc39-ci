'use strict';

/**
 * Ensure the payload is of the correct format and from an allowed GitHub org / owner
 */
module.exports = function validate(req) {
	const { u: user } = req.pathParameters;
	const payload = req.body;

	// Only allow requests from the following orgs / owners
	const allowed = [
		'tc39', 'tc39-transfer', 'ljharb',
	];
	if (!allowed.some((a) => a === user)) {
		return {
			statusCode: 401,
		};
	}

	// Ensure the request is properly formed
	if (!payload.pr || !payload.sha || (!payload.files && !payload.compressed)) {
		return {
			statusCode: 400,
		};
	}
	return void undefined;
};
