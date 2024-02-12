#!/usr/bin/env node

'use strict';

/* eslint no-throw-literal: 0 */

// web URL: `https://docs.google.com/spreadsheets/d/${sheetID}/edit`
const sheetID = '1if5bU0aV5MJ27GGKnRzyAozeKP-ILXYl5r3dzvkGFmg';

// TC39 API key for google sheets
const key = process.env.GOOGLE_API_KEY;

const sheetData = `https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/Sheet1!A2:A?key=${key}`;

const [
	,,
	slug,
	branch,
] = process.argv;

if (!slug || !branch) {
	throw 'args required: slug, branch';
}
if (!process.env.GH_TOKEN) {
	throw 'GH_TOKEN env var required';
}
if (!key) {
	throw 'GOOGLE_API_KEY env var required';
}

const request = async (url, method = 'GET', postData = undefined) => {
	// adapted from https://medium.com/@gevorggalstyan/how-to-promisify-node-js-http-https-requests-76a5a58ed90c
	// eslint-disable-next-line global-require
	const lib = url.startsWith('https://') ? require('https') : require('http');

	// eslint-disable-next-line no-unused-vars
	const [h, path] = url.split('://')[1].split('/');
	const [host, port] = h.split(':');

	const params = {
		host,
		port: port || url.startsWith('https://') ? 443 : 80,
		method,
		headers: {
			Authorization: `token ${process.env.GH_TOKEN}`,
			'User-Agent': 'curl/7.54.0',
		},
	};

	return new Promise((resolve, reject) => {
		const req = lib.request(url, params, (res) => {
			if (res.statusCode >= 300 && res.statusCode < 400) {
				resolve(request(res.headers.location, method, postData));
			} else if (res.statusCode < 200 || res.statusCode >= 300) {
				reject(new Error(`Status Code: ${res.statusCode}; ${url}`));
			} else {
				const data = [];

				res.on('data', (chunk) => {
					data.push(chunk);
				});

				res.on('end', () => resolve(String(Buffer.concat(data))));
			}
		});

		req.on('error', reject);

		if (postData) {
			req.write(postData);
		}

		req.end();
	});
};

const branchURL = `https://api.github.com/repos/${slug}/compare/master...${branch}?anon=1`;

const authorsP = request(branchURL).then((json) => JSON.parse(json)).then((data) => [...new Set(data.commits.map((x) => x.author.login))]).then((authors) => {
	console.log(`Found authors: ${authors.join(',')}\n`);
	return authors;
});

const teamURL = 'https://api.github.com/orgs/tc39/teams/delegates';

function getMembers(teamID, page = 1) {
	const memberURL = `https://api.github.com/teams/${teamID}/members?per_page=100&page=${page}`;
	const data = request(memberURL).then((json) => JSON.parse(json));
	return data.then((x) => {
		if (x.length > 0) {
			return x;
		}
		return getMembers(teamID, page + 1).then((nextPage) => x.concat(nextPage));
	});
}

const delegatesP = request(teamURL).then((json) => JSON.parse(json)).then((data) => getMembers(data.id)).then((data) => {
	const delegateNames = data.map((x) => x.login);
	console.log(`Found delegates: ${delegateNames.join(',')}\n`);
	return new Set(delegateNames);
});

function isGoogler(username) {
	return request(`https://api.github.com/orgs/googlers/members/${username}`).then(
		() => {
			console.log(`${username} is a googler`);
			return true;
		},
		() => {
			console.log(`${username} is not a googler`);
			return false;
		},
	);
}

const usernamesP = request(sheetData).then((json) => JSON.parse(json)).then((data) => {
	if (!Array.isArray(data.values)) {
		throw 'invalid data';
	}
	const usernames = data.values
		.flat(1)
		.map((x) => x.replace(/^(?:https?:\/\/)?github\.com\//, '').replace(/^@/, ''))
		.filter((x) => (/^[a-z0-9_-]{1,39}$/gi).test(x))
		.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
	console.log(`Found usernames: ${usernames.join(',')}\n`);
	return new Set(usernames);
});

const googlersP = authorsP
	// eslint-disable-next-line max-nested-callbacks
	.then((authors) => Promise.all(authors.map((author) => isGoogler(author).then((is) => [author, is]))))
	.then((entries) => new Map(entries));

Promise.all([
	usernamesP,
	authorsP,
	delegatesP,
	googlersP,
]).then(([
	usernames,
	authors,
	delegates,
	googlers,
]) => {
	const missing = authors.filter((a) => !usernames.has(a) && !delegates.has(a) && !googlers.get(a));
	if (missing.length > 0) {
		throw `Missing authors: ${missing}`;
	} else {
		console.log('All authors have signed the form, or are delegates, or employed by an ECMA member company!');
	}
}).catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
