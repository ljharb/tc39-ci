@app
wander-qka

@static

@http
get /
get /ipr/:user/:repo/pull/:pr

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
