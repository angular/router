#! /bin/bash
SCRIPT_DIR=$(dirname $0)
cd $SCRIPT_DIR/..

function killServer {
  kill $serverPid
}

./node_modules/.bin/gulp build
./node_modules/.bin/gulp serve &
serverPid=$!

trap killServer EXIT

SAUCE_ACCESS_KEY=`echo $SAUCE_ACCESS_KEY | rev`
gulp build

karma start --sauce &
karma start karma.es5.conf.js --sauce &
./node_modules/.bin/protractor protractor.travis.conf.js &
wait %2 %3 %4
