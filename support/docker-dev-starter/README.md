# Docker for local dev

Start a mongodb server, mongo-express and smtp4dev to intercept local emails

mongo is on port 27017
mongo-express is on port 8082
smtp4dev is on port 8081

## Restore db from a dump :

put you dumpfile in `./mongo-data`

### drop the current db
`docker exec atj-mongo sh -c 'exec mongo atoutjardin-local --eval "db.dropDatabase()"'`

### restore from the dumpfile
`docker exec atj-mongo sh -c 'exec mongorestore --db atoutjardin-local --archive=/tmp/data/atoutjardin-local.archive'`


## Dump the db :

`docker exec atj-mongo sh -c 'exec mongodump --db atoutjardin-local --archive=/tmp/data/atoutjardin-local.archive'`

## exec `mango` commands
docker exec atj-mongo sh -c 'exec mongo atoutjardin-local --eval "<my mongo directives>"'
