@app
wander-qka

@static

@http
get  /ipr/:user/:repo/pull/:prEtc       # IPR check
get  /preview/:u/:r/:k/:etc     # display a PR/SHA preview
post /preview/:user/:repo       # Publish new files

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
