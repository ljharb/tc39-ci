module.exports = function validate (req) {
  let { path } = req;

  let headers = {
    'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
    'content-type': 'text/html; charset=utf8'
  };

  // Add something here!
  if (path === '/') {
    return {
      headers,
      body: 'Hello!'
    };
  }

  let isSHA = path.startsWith('/ecma262-preview-sha/');
  // isSHA + 40 == requesting SHA URL without the trailing slash
  // Seems a little hacky but it's only temporary until we implement non-trailing slash index.html peeking into arc/fns
  if (isSHA && path.length === 61) {
    return {
      location: req.path += '/'
    };
  }
  if (isSHA || path.startsWith('/ecma262-preview-pr/')) {
    return;
  }
  else {
    return {
      headers,
      statusCode: 404
    };
  }
};
