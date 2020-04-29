const fs = require('fs');
const github = require('./_github-status');
const { join, dirname, extname } = require('path');
const { gunzipSync } = require('zlib');
const aws = require('aws-sdk');
const arc = require('@architect/functions');
const data = require('@begin/data');
const validate = require('./_validate');
const verify = require('./_verify');
const mime = require('mime-types');

const isLocal = process.env.NODE_ENV === 'testing';

async function preview (req) {
	const { u: user, r: repo } = req.pathParameters;
	const { pr, sha, files } = req.body;

	// Log the request so we know who to shake our fists at later
	console.log(`Got new preview payload: ${user} / ${repo} / ${pr} / ${sha} / ${files.length}`);
	const { body, ...sansBody } = req;
	console.log(JSON.stringify(sansBody, null, 2));

	try {
		if (!isLocal) {
			await github({ state: 'pending', sha });
			for (const file of files) {
				const { filename, body } = file;

				const Body = new Buffer.from(body, 'base64');
				const ContentType = mime.contentType(extname(filename)) || 'text/html';

				const s3 = new aws.S3();
				const params = {
					ACL: 'public-read',
					Key: `${process.env.ARC_STATIC_FOLDER}/preview/${user}/${repo}/sha/${sha}/${filename}`,
					Bucket: process.env.ARC_STATIC_BUCKET,
					Body,
					ContentType,
					ContentEncoding: 'gzip'
				};
				const put = s3.putObject(params);
				await put.promise();
			}
			await github({ state: 'success', sha, pr });
		} else {
			for (const file of files) {
				const { filename, body } = file;

				const public = join(__dirname, '..', '..', '..', 'public', 'preview', user, repo, 'sha', sha);
				const data = gunzipSync(new Buffer.from(body, 'base64'));
				fs.mkdirSync(join(public, dirname(filename)), { recursive: true });
				fs.writeFileSync(join(public, filename), data);
			}
		}

		// To prevent replays, now make the preview for this SHA immutable (see: verify middleware)
		// Look up two ways: via SHA, or via PR
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
		console.log(err);

		await github({ state: 'error', sha });

		return {
			statusCode: 500,
		};
	}
}

exports.handler = arc.http.async(validate, verify, preview);
