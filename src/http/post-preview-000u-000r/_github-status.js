'use strict';

const { post } = require('tiny-json-http');

const {
	GITHUB_TOKEN,
	ARC_ENV,
} = process.env;

module.exports = async function updateStatus({
	state,
	pr,
	sha,
	user,
	repo,
}) {
	// verify state
	const allow = [
		'error',
		'pending',
		'success',
	];
	if (!allow.includes(state)) { throw new ReferenceError('invalid state'); }

	if (!sha) { throw new ReferenceError('missing sha'); }

	if (!pr) { throw new ReferenceError('missing pr'); }

	if (!repo) { throw new ReferenceError('missing repo'); }

	if (state === 'success' && !pr) { throw new ReferenceError('missing pull request ID'); }

	if (!GITHUB_TOKEN) { throw new ReferenceError('missing env var GITHUB_TOKEN'); }

	const base = ARC_ENV === 'staging' ? 'staging.ci.tc39.es' : 'ci.tc39.es';
	const data = {
		state,
		context: 'TC39 CI / build preview',
	};

	if (state === 'error') { data.description = 'An error occurred'; }

	if (state === 'pending') { data.description = 'Preparing deploy preview…'; }

	if (state === 'success') {
		data.description = 'Preview ready!';
		data.target_url = `https://${base}/preview/${user}/${repo}/pull/${pr}`;
	}

	const github = 'https://api.github.com';
	const url = `${github}/repos/${user}/${repo}/statuses/${sha}`;

	console.info(`posting github status: url: ${url}, data: ${JSON.stringify(data)}`);

	return post({
		url,
		headers: { Authorization: `token ${GITHUB_TOKEN}` },
		data,
	});

};
