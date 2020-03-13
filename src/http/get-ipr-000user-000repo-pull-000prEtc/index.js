'use strict';

const path = require('path');
const { execSync } = require('child_process');
const GitHub = require('github-api');

const gh = new GitHub();

function html({ user, repo, pr, sha, result, success }) {
	return `
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<title>TC39 RFTG Contributor Check</title>
		<link rel="stylesheet" href="https://static.begin.app/starter/default.css">
		<link href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" rel="icon" type="image/x-icon" />
	</head>
	<body>
		<h1 class="center-text">
		TC39 RFTG Contributor Check
		</h1>
		<h2 class="center-text">
			<a href="https://github.com/${user}/${repo}/pull/${pr}">${user}/${repo}#${pr}</a>
		</h2>
		<h6 class="center-text">
		<sub>SHA: ${sha}</sub>
		</h6>
	${success ? `
	<p class="center-text" style="color: green">
	All authors on this PR are either delegates, ECMA member company employees, or have registered as a TC39 RFTG Contributor!
	</p>
	` : `
	<p class="center-text" style="color: red">
		${result}
	</p>
	<p class="center-text">
		Please register here: <a href="https://tc39.es/agreements/contributor/">https://tc39.es/agreements/contributor/</a>
	</p>
	`}
	</body>
</html>
`;
}

function json(data) {
	return JSON.stringify(data, null, '\t');
}

const formatters = {
	html,
	json,
};

const {
	GH_TOKEN,
	GOOGLE_API_KEY,
} = process.env;

async function getSHA(user, repo, pr) {
	const ghRepo = await gh.getRepo(user, repo);
	const ghPR = await ghRepo.getPullRequest(pr);
	const { data: { head: { sha } } } = ghPR;
	return sha;
}

// HTTP function
exports.handler = async function http(req) {
	const { user, repo, prEtc } = req.pathParameters;
	const {
		pr,
		format = 'html',
	} = prEtc.match(/^(?<pr>[1-9][0-9]+)(?:\.(?<format>html|json))?$/).groups;

	let result;
	let success = false;
	let sha;
	try {
		sha = await getSHA(user, repo, pr).catch(() => {
			throw new Error('Unable to connect to Github');
		});

		result = String(execSync(`node ${path.relative(process.cwd(), path.join(__dirname, './check-form'))} ${user}/${repo} ${sha}`, {
			env: { ...process.env, GOOGLE_API_KEY, GH_TOKEN },
		}));
		success = true;
	} catch (e) {
		result = e.message.split('\n').slice(1, -1).join('\n');
	}

	return {
		headers: {
			'content-type': `${format === 'json' ? 'application/json' : 'text/html'}; charset=utf8`,
		},
		body: formatters[format]({ user, repo, pr, sha, result: success || result, success }),
		statusCode: success ? 200 : 412,
	};
};
