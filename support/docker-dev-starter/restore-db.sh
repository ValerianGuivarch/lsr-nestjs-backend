#!/bin/bash

_DUMP_FILE=$1
_LOCAL_DB="swag-local"
_DUMP_DB="swag-preprod"

if [ ! -n "$1" ]
then
  echo "missing parameters"
  exit 1
fi

if [ "$1" = "help" ]
then
    echo "usage:"
    echo "'$0 preprod' : get the last remote preprod backup and restore it"
    echo "'$0 prod' : get the last remote prod backup and restore it"
    echo "'$0 <filename>' : restore the dump file located in mongo-data"
    echo "'$0 <filename> <local_database_name>' : restore the dump file located in mongo-data into the specified local database"
    echo "'$0 <filename> <local_database_name> <dump_database_name>' : restore the dump file located in mongo-data into the specified local database from the dump_database_name"
    exit 1
fi

if [ "${_DUMP_FILE}" = "preprod" ]
then
   _DUMP_FILE=`ssh swag@dev.swag.com ls -t /database-backups | grep preprod | head -1`
   scp swag@dev.swag.com:/database-backups/${_DUMP_FILE} mongo-share/
fi

if [ "${_DUMP_FILE}" = "prod" ]
then
   _DUMP_FILE=`ssh swag@swag.com ls -t /database-backups | head -1`
   scp swag@swag.com:/database-backups/${_DUMP_FILE} mongo-share/
   _DUMP_DB="swag"
fi

if [ -n "$2" ]
then
  _LOCAL_DB=$2
fi

if [ -n "$3" ]
then
  _DUMP_DB=$3
fi

if [ -f "mongo-data/${_DUMP_FILE}" ]
then
    echo "drop database..."
    docker exec atj-mongo sh -c "exec mongo ${_LOCAL_DB} --eval 'db.dropDatabase()'" >/dev/null
    if [ $? -ne 0 ]; then echo "drop database failed !"; exit 1; fi

    echo "restore database (1/2)..."
    docker exec atj-mongo sh -c "exec mongorestore --quiet --gzip --archive=/tmp/data/${_DUMP_FILE}" >/dev/null 2>&1
    if [ $? -ne 0 ]; then echo "failed !"; exit 1; fi

    echo "restore database (2/2)..."
    docker exec atj-mongo sh -c "exec mongo --eval 'db.copyDatabase(\"${_DUMP_DB}\",\"${_LOCAL_DB}\",\"localhost\")'" >/dev/null
    if [ $? -ne 0 ]; then echo "restore database failed !"; exit 1; fi

    echo "drop temporary database..."
    docker exec atj-mongo sh -c "exec mongo ${_DUMP_DB} --eval 'db.dropDatabase()'" >/dev/null
    if [ $? -ne 0 ]; then echo "drop temporary database failed !"; exit 1; fi

    echo
    read -p "drop all quartz triggers ? (y/n) " -n 1 -r
    echo    # (optional) move to a new line
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        echo "drop all quartz triggers..."
        docker exec atj-mongo sh -c "exec mongo ${_LOCAL_DB} --eval 'db.quartz__triggers.deleteMany({})'" >/dev/null
        if [ $? -ne 0 ]; then echo "drop all quartz triggers failed !"; exit 1; fi
    fi

#    echo
#    read -p "insert default users (@dev.com) ? (y/n) " -n 1 -r
#    echo    # (optional) move to a new line
#    if [[ $REPLY =~ ^[Yy]$ ]]
#    then
#        echo "insert default users..."
#        cp -f swag-test-users.archive mongo-data
#        docker exec atj-mongo sh -c "exec mongorestore --db ${_LOCAL_DB} --archive=/tmp/data/swag-test-users.archive" >/dev/null 2>&1
#        if [ $? -ne 0 ]; then echo "insert default users failed !"; exit 1; fi
#    fi

    echo "restore database '${_LOCAL_DB}' successful !"
else
 echo "file ${_DUMP_FILE} does not exist"
 exit 1
fi
