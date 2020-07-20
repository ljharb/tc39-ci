'use strict';

const data = require('@begin/data');
const { get } = require('tiny-json-http');

const getCommits = async (url) => {
	let page = 1;
	const commits = [];
	const urlPage = () => `${url}&page=${page}&per_page=100`;

	const getter = async (getting) => {
		const result = await get({ url: getting });
		const { body, headers } = result;
		if (body.length) { commits.push(...body); }
		if (headers.link || headers.Link) {
			const link = headers.link || headers.Link;
			const hasNextLink = link && link.includes('rel="next"');
			if (hasNextLink) {
				page += 1;
				await getter(urlPage());
			}
		}
	};
	await getter(urlPage());
	return commits;
};

/**
 * Verify that the received payload is indeed a real PR + SHA
 * If so, pass it along
 */
module.exports = async function verify(req) {
	try {
		const { u: user, r: repo } = req.pathParameters;
		const { pr, sha } = req.body;

		const base = 'https://api.github.com';
		const url = `${base}/repos/${user}/${repo}/pulls/${pr}/commits`;

		const commits = await getCommits(url);

		// Is this an actual SHA on the repo?
		const shaIsReal = commits.some((c) => c.sha === sha);

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
		return void undefined;
	} catch (err) {
		console.error(err);
		return {
			statusCode: 403,
		};
	}
};
