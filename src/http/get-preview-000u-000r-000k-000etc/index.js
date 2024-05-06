'use strict';

/* eslint no-magic-numbers: 0 */

const arc = require('@architect/functions');
const data = require('@begin/data');
const validate = require('./_validate');

// eslint-disable-next-line
async function handler(req) {
	const {
		u: user, r: repo, k: kind, etc,
	} = req.pathParameters;

	if (kind === 'sha') {
		const {
			sha,
		} = etc.match(/^(?<sha>[0-9a-z]+)\/?$/).groups;
		if (sha) {
			// These URLs' contents are immutable so cache 'em forever
			const cacheControl = 'max-age=315360000';
			const proxy = arc.http.proxy.public({ cacheControl });
			return proxy(req);
		}
	}

	if (kind === 'pull') {
		const { pr } = etc.match(/^(?<pr>[1-9][0-9]+)\/?$/).groups;

		const prData = await data.get({
			table: `${user}/${repo}/pr`,
			key: pr,
		});

		if (pr && prData) {
			return {
				location: `/preview/${user}/${repo}/sha/${prData.sha}/`,
			};
		}
	}

	return {
		statusCode: 404,
		headers: {
			'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
			'content-type': 'text/html; charset=utf8',
		},
		body: '404',
	};
}

exports.handler = arc.http(validate, handler);
