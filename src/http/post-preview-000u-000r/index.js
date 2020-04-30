'use strict';

const fs = require('fs');
const github = require('./_github-status');
const {
	join, dirname, extname,
} = require('path');
const { gunzipSync } = require('zlib');
const aws = require('aws-sdk');
const arc = require('@architect/functions');
const data = require('@begin/data');
const validate = require('./_validate');
const verify = require('./_verify');
const mime = require('mime-types');

const isLocal = process.env.NODE_ENV === 'testing';

/* eslint max-lines-per-function: 0 */
// eslint-disable-next-line
async function preview(req) {
	const { u: user, r: repo } = req.pathParameters;
	const {
		pr, sha, files,
	} = req.body;

	// Log the request so we know who to shake our fists at later
	console.log(`Got new preview payload: ${user} / ${repo} / ${pr} / ${sha} / ${files.length}`);
	const { body: _, ...sansBody } = req;
	console.log(JSON.stringify(sansBody, null, 2));

	try {
		if (isLocal) {
			for (const file of files) {
				const { filename, body } = file;

				const publicDir = join(__dirname, '..', '..', '..', 'public', 'preview', user, repo, 'sha', sha);
				const fileData = gunzipSync(Buffer.from(body, 'base64'));
				fs.mkdirSync(join(publicDir, dirname(filename)), { recursive: true });
				fs.writeFileSync(join(publicDir, filename), fileData);
			}
		} else {
			await github({
				state: 'pending',
				sha,
				pr,
				user,
				repo,
			});
			for (const file of files) {
				const { filename, body } = file;

				const Body = Buffer.from(body, 'base64');
				const ContentType = mime.contentType(extname(filename)) || 'text/html';

				const s3 = new aws.S3();
				const params = {
					ACL: 'public-read',
					Key: `${process.env.ARC_STATIC_FOLDER}/preview/${user}/${repo}/sha/${sha}/${filename}`,
					Bucket: process.env.ARC_STATIC_BUCKET,
					Body,
					ContentType,
					ContentEncoding: 'gzip',
				};
				const put = s3.putObject(params);
				await put.promise(); // eslint-disable-line no-await-in-loop
			}
			await github({
				state: 'success',
				sha,
				pr,
				user,
				repo,
			});
		}

		/*
		 * To prevent replays, now make the preview for this SHA immutable (see: verify middleware)
		 * Look up two ways: via SHA, or via PR
		 */
		await data.set([
			{
				table: `${user}/${repo}/sha`,
				key: sha,
				pr,
			},
			{
				table: `${user}/${repo}/pr`,
				key: pr,
				sha,
			},
		]);

		return {
			statusCode: 200,
		};
	} catch (err) {
		console.error(err);

		await github({
			state: 'error',
			sha,
			pr,
			user,
			repo,
		});

		return {
			statusCode: 500,
		};
	}
}

exports.handler = arc.http.async(validate, verify, preview);
