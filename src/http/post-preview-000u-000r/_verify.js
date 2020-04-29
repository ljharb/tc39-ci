'use strict';

const data = require('@begin/data');
const { get } = require('tiny-json-http');

/**
 * Verify that the received payload is indeed a real PR + SHA
 * If so, pass it along
 */
module.exports = async function verify (req) {
	try {
		const { u: user, r: repo } = req.pathParameters;
		const { pr, sha } = req.body;

		const base = 'https://api.github.com';
		const url = `${base}/repos/${user}/${repo}/pulls/${pr}/commits`;

		const commits = await get({ url });

		// Is this an actual SHA on the repo?
		const shaIsReal = commits.body.some(c => c.sha === sha);

		// Have we seen this SHA before and published its preview?
		const shaHasBeenSeen = await data.get({
			table: `${user}/${repo}/sha`,
			key: sha,
		});

		if (!shaIsReal || shaHasBeenSeen) {
			return {
				statusCode: 403,
			};
		}
		return;
	} catch (err) {
		return {
			statusCode: 403,
		};
	}
};
