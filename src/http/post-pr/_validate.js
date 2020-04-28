module.exports = function validate (req) {
  const isLocal = process.env.NODE_ENV === 'testing' || process.env.ARC_LOCAL;
  try {
    if (!isLocal) {
      const auth = req.headers.authorization || req.headers.Authorization; // lolhttp
      const token = new Buffer.from(auth.substr(7), 'base64').toString();
      if (token !== process.env.PR_TOKEN) throw Error('Auth request failed');
    }

    let payload = req.body;
    if (!payload.pr || !payload.sha || !payload.files) {
      return {
        statusCode: 400
      };
    }
    return;
  }
  catch (err) {
    return {
      statusCode: 400
    };
  }
};
