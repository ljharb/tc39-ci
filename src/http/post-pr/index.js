let fs = require('fs');
let github = require('./_github-status');
let { join, dirname, extname } = require('path');
let { gunzipSync } = require('zlib');
let aws = require('aws-sdk');
aws.config.setPromisesDependency(null);
let arc = require('@architect/functions');
let data = require('@begin/data');
let validate = require('./_validate');
let mime = require('mime-types');

let isLocal = process.env.NODE_ENV === 'testing';

async function pr (req) {

  let { pr, sha, files } = req.body;
  console.log(`Got new PR: ${pr} / ${sha} / ${files.length}`);

  try {

    // Look up two ways: via SHA, or via PR
    await data.set([
      {
        table: 'sha',
        key: sha,
        pr
      },
      {
        table: 'pr',
        key: pr,
        sha
      }
    ]);


    if (!isLocal) {
      await github({ state: 'pending', sha });
      for (let file of files) {
        let { filename, body } = file;

        let Body = new Buffer.from(body, 'base64');
        let ContentType = mime.contentType(extname(filename)) || 'text/html';

        let s3 = new aws.S3();
        let params = {
          ACL: 'public-read',
          Key: `${process.env.ARC_STATIC_FOLDER}/ecma262-preview-sha/${sha}/${filename}`,
          Bucket: process.env.ARC_STATIC_BUCKET,
          Body,
          ContentType,
          ContentEncoding: 'gzip'
        };
        let put = s3.putObject(params);
        await put.promise();
      }
      await github({ state: 'success', sha, pr });
    }
    else {
      for (let file of files) {
        let { filename, body } = file;

        let public = join(__dirname, '..', '..', '..', 'public', 'ecma262-preview-sha');
        let data = gunzipSync(new Buffer.from(body, 'base64'));
        fs.mkdirSync(join(public, sha, dirname(filename)), { recursive: true });
        fs.writeFileSync(join(public, sha, filename), data);
      }
    }
    return {
      statusCode: 200
    };
  }
  catch (err) {
    console.log(err);
    await github({ state: 'error', sha });
    return {
      statusCode: 500
    };
  }
}

exports.handler = arc.http.async(validate, pr);
