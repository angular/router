var gutil = require('gulp-util');
var through = require('through2');
var jsdom = require("jsdom");

var doc = jsdom.jsdom();
global.document = doc;

var el = document.createElement('div');

var precompile = require('./dist/cjs/precompiler').precompile;


// TODO(vojta): this is a dependency of templating, move it there...
require('traceur/bin/traceur-runtime');

module.exports = function (options) {
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-ng-templating-compiler', 'Streaming not supported'));
      return cb();
    }

    var stream = this;
    precompile({}, require, file.contents.toString()).then(function(code) {
      // TODO(vojta): clone the file
      file.contents = new Buffer(code);
      stream.push(file)
      cb();
    });
  });
};
