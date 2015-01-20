var through = require('through2');

var marked = require('marked');
// Async highlighting with pygmentize-bundled
marked.setOptions({
  highlight: function (code, lang, callback) {
    if (lang === 'dot') {
      graphvizualize(code, callback);
    } else {
      return callback(null, code);
    }
  }
});
function markdownize(str, cb) {
// Using async version of marked
  marked(str, cb);
}


var exec = require('child_process').exec;
// make a graphviz thing
function graphvizualize(data, cb) {
  var cp = exec('dot -Tsvg');

  // buffer stdout
  var buf = '';
  cp.stdout.on('data', function (data) {
    buf += data;
  });
  cp.stdout.on('end', function () {
    cb(null, buf);
  });

  // set dot to stdin
  cp.stdin.end(data);
}


module.exports = function (opts) {

  // creating a stream through which each file will pass
  var stream = through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }
    var self = this;

    if (file.isBuffer()) {
      var contents = file.contents.toString();
      markdownize(contents.toString(), function (err, contents) {  
        file.contents = new Buffer(contents.toString());
        self.push(file);
        return cb();
      });
    }
  });

  // returning the file stream
  return stream;
};
