'use strict';

const { post } = require('tiny-json-http');

const {
	GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN, NODE_ENV,
} = process.env;

module.exports = async function updateStatus({
	state,
	pr,
	sha,
	user,
	repo,
}) {

	// verify state
	let allow = [
		'error',
		'pending',
		'success',
	];
	if (allow.includes(state) === false) { throw new ReferenceError('invalid state'); }

	if (!sha) { throw new ReferenceError('missing sha'); }

	if (!pr) { throw new ReferenceError('missing pr'); }

	if (!repo) { throw new ReferenceError('missing repo'); }

	if (state === 'success' && !pr) { throw new ReferenceError('missing pull request ID'); }

	if (!GITHUB_OWNER) { throw new ReferenceError('missing env var GITHUB_OWNER'); }

	if (!GITHUB_REPO) { throw new ReferenceError('missing env var GITHUB_REPO'); }

	if (!GITHUB_TOKEN) { throw new ReferenceError('missing env var GITHUB_TOKEN'); }

	let base = NODE_ENV === 'staging' ? 'staging.ci.tc39.es' : 'ci.tc39.es';
	let data = {
		state,
		context: 'Begin.com build preview',
	};

	if (state === 'error') { data.description = 'An error occurred'; }

	if (state === 'pending') { data.description = 'Preparing deploy preview…'; }

	if (state === 'success') {
		data.description = 'Preview ready!';
		data.target_url = `https://${base}/preview/${user}/${repo}/pr/${pr}`;
	}

	const github = 'https://api.github.com';
	return post({
		url: `${github}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/statuses/${sha}`,
		headers: { Authorization: `token ${GITHUB_TOKEN}` },
		data,
	});

};
