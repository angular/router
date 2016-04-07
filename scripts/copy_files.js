var fs = require('fs-extra');
var path = require('path');

var PROJECT_ROOT = path.resolve(__dirname, '../');

var ROUTER_LIB_FOLDER = PROJECT_ROOT + '/node_modules/angular2/src/router';
var SRC_FOLDER = PROJECT_ROOT + '/src';

var TMP_FOLDER = PROJECT_ROOT + '/tmp';
var ROUTER_TMP_FOLDER = TMP_FOLDER + '/router';

console.log('Copying files');
fs.emptyDirSync(TMP_FOLDER);
fs.copySync(ROUTER_LIB_FOLDER, ROUTER_TMP_FOLDER);
fs.copySync(SRC_FOLDER, TMP_FOLDER);
