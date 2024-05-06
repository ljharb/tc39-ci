'use strict';

const fs = require('fs');
const github = require('./_github-status');
const {
	join,
	dirname,
	extname,
} = require('path');
const {
	gzipSync,
	gunzipSync,
	brotliDecompressSync,
} = require('zlib');
const { Readable } = require('stream');

const tar = require('tar-stream');
const AwsLite = require('@aws-lite/client');
const arc = require('@architect/functions');
const data = require('@begin/data');
const validate = require('./_validate');
const verify = require('./_verify');
const mime = require('mime-types');

const isLocal = process.env.ARC_ENV === 'testing';

/*
 * takes a buffer holding a brotli-compressed tar and returns a list of { filename, body } objects
 * where each body is a buffer with a gzip-encoded representation of the corresponding file
 */
async function brotliOfListToListOfGzip(compressed) {
	return new Promise((resolve, reject) => {
		const files = [];
		const extract = tar.extract();

		extract.on('entry', (header, stream, next) => {
			if (header.type !== 'file') {
				stream.on('end', () => {
					next();
				});
				stream.resume();
				return;
			}

			// this is apparently the simplest way to drain a stream to a buffer???
			const chunks = [];
			stream.on('data', (chunk) => chunks.push(chunk));
			stream.on('error', reject);
			stream.on('end', () => {
				files.push({
					filename: header.name,
					body: gzipSync(Buffer.concat(chunks)),
				});
				next();
			});
			stream.resume();
		});

		extract.on('finish', () => {
			resolve(files);
		});

		Readable.from(brotliDecompressSync(Buffer.from(compressed, 'base64')))
			.pipe(extract);
	});
}

/* eslint max-lines-per-function: 0, max-statements: 0 */
async function preview(req) {
	const { u: user, r: repo } = req.pathParameters;
	let { files } = req.body;
	const {
		pr,
		sha,
		compressed,
	} = req.body;

	// Log the request so we know who to shake our fists at later
	console.log(`Got new preview payload: ${user} / ${repo} / ${pr} / ${sha} / ${compressed ? '(compressed)' : files.length}`);
	const { body: _, ...sansBody } = req;
	console.log(JSON.stringify(sansBody, null, 2));

	if (compressed == null) {
		files = files.map(({ filename, body }) => ({ filename, body: Buffer.from(body, 'base64') }));
	} else {
		files = await brotliOfListToListOfGzip(compressed);
	}

	try {
		if (isLocal) {
			for (const file of files) {
				const { filename, body } = file;

				const publicDir = join(__dirname, '..', '..', '..', 'public', 'preview', user, repo, 'sha', sha);
				const fileData = gunzipSync(body);
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
				const { filename, body: Body } = file;

				const ContentType = mime.contentType(extname(filename)) || 'text/html';

				const aws = new AwsLite({ plugins: [import('@aws-lite/s3')] });
				const params = {
					ACL: 'public-read',
					Key: `${process.env.ARC_STATIC_FOLDER}/preview/${user}/${repo}/sha/${sha}/${filename}`,
					Bucket: process.env.ARC_STATIC_BUCKET,
					Body,
					ContentType,
					ContentEncoding: 'gzip',
				};
				await aws.s3.PutObject(params); // eslint-disable-line no-await-in-loop, new-cap
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
