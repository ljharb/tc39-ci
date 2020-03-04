@app
wander-qka

@static

@http
get /
get /ipr/:user/:repo/pull/:prPlusFormat

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
