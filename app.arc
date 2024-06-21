@app
tc39-ci

@static

@http
get  /ipr/:user/:repo/pull/:prEtc   # IPR check
get  /preview/:u/:r/:k/:etc         # Display a PR/SHA preview
post /preview/:u/:r                 # Publish new files

@tables
data
  scopeID *String
  dataID **String
  ttl TTL

@aws
region us-west-1
