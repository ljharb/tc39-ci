@app
wander-qka

@static

@http
get /
get /ipr/:user/:repo/pull/:prEtc
get /preview/:user/:repo/pull/:prX

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
