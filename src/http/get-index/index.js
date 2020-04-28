let arc = require('@architect/functions');
let data = require('@begin/data');
let validate = require('./_validate');

async function handler (req) {
  try {
    let { path } = req;

    let parts = path.split('/').filter(Boolean);

    // SHA paths
    let isSHA = parts[0] === 'ecma262-preview-sha';
    if (isSHA) {
      // These URLs' contents are immutable so cache 'em forever
      let cacheControl = 'max-age=315360000';
      let proxy = arc.http.proxy.public({ cacheControl });
      return proxy(req);
    }

    // PR paths
    let isPR = parts[0] === 'ecma262-preview-pr';
    if (isPR) {
      let pr = await data.get({
        table: 'pr',
        key: parts[1]
      });
      if (pr) {
        return {
          location: `/ecma262-preview-sha/${pr.sha}/`
        };
      }
    }

    // idk
    return {
      statusCode: 404,
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        'content-type': 'text/html; charset=utf8'
      },
      body: '404'
    };
  }
  catch (err) {
    console.log(`Error: ${req}`);
    throw err;
  }
}

exports.handler = arc.http.async(validate, handler);
