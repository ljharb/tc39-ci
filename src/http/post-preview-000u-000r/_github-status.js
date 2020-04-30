'use strict';

const { post } = require('tiny-json-http');

module.exports = async function updateStatus({
	state,
	sha,
	pr,
}) {

	// verify state
	let allow = [
		'error',
		'failure',
		'pending',
		'success',
	];
	if (allow.includes(state) === false) { throw new ReferenceError('invalid state'); }

	if (!sha) { throw new ReferenceError('invalid sha'); }

	if (state === 'success' && !pr) { throw new ReferenceError('missing pull request ID'); }

	if (!process.env.GITHUB_OWNER) { throw new ReferenceError('missing env var GITHUB_OWNER'); }

	if (!process.env.GITHUB_REPO) { throw new ReferenceError('missing env var GITHUB_REPO'); }

	if (!process.env.GITHUB_TOKEN) { throw new ReferenceError('missing env var GITHUB_TOKEN'); }

	let base = 'https://api.github.com';
	let owner = process.env.GITHUB_OWNER;
	let repo = process.env.GITHUB_REPO;
	let token = process.env.GITHUB_TOKEN;

	let data = { state };

	let target = `https://${process.env.ARC_STATIC_FOLDER}.begin.app/ecma262-preview-pr/${pr}`;
	if (state === 'success') {
		Object.assign(data, {
			target_url: target,
			context: 'Begin.com build preview',
			description: 'Ready!',
		});
	}

	return post({
		url: `${base}/repos/${owner}/${repo}/statuses/${sha}`,
		headers: { Authorization: `token ${token}` },
		data,
	});
};
