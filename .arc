@app
wander-qka

@static

@http
get  /                                  # Handle PR / SHA requests
get  /ipr/:user/:repo/pull/:prEtc       # tbd
get  /preview/:user/:repo/pull/:prX     # tbd
post /pr                                # Publish new files

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
