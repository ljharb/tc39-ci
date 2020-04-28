let { join } = require('path');
let glob = require('glob').sync;
let tiny = require('tiny-json-http');
let fs = require('fs');
let { gzipSync } = require('zlib');

// ↓ put some files to publish in here
let dir = join(__dirname, '..', 'out');
let files = glob(join(dir, '**'), { nodir: true });

async function go () {

  let data = {
    pr: 9001, // Even testing values should be OVER 9000!!!
    sha: 'c0a4289e43fb2e68c722a1e9c9b2b13b7058f754', // Also just for testing
    files: []
  };
  for (let file of files) {
    let filename = file.replace(dir, '').substr(1);
    let contents = fs.readFileSync(file);
    let body = gzipSync(contents).toString('base64');
    console.log(`Publishing: ${filename} (${body.length / 1000}KB)`);
    data.files.push({
      filename,
      body
    });
  }
  let url = 'http://localhost:3333/pr';
  // let url = 'https://river-xt6-staging.begin.app/pr';

  let payloadSize = JSON.stringify(data).length;
  console.log(`Payload size: ${payloadSize / 1000}KB`);
  if (payloadSize >= 1000 * 1000 * 6) {
    throw Error('Payloads must be under 6MB');
  }

  let token = new Buffer.from('Q2XGAWJ42pk9Rutzh').toString('base64');
  let headers = {
    authorization: `Bearer ${token}`
  };
  await tiny.post({ url, data, headers });
}
go();
