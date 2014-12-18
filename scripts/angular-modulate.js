'use strict';

var falafel = require('falafel');
var through = require('through2');
var fs = require('fs');
var path = require('path');
var traceur = require('traceur');
var traceurRuntime = fs.readFileSync(__dirname + '/lib/traceur-runtime-custom.js', 'utf8');
var escape = require('escape-regexp');

var TRACEUR_OPTS = {
  "asyncFunctions": true,
  "types": true,
  "typeAssertions": false,
  "annotations": true,
  "modules": "inline"
};

module.exports = function (opts) {

  // creating a stream through which each file will pass
  var stream = through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      // do nothing
    }

    if (file.isBuffer()) {
      var contents = file.contents.toString();
      contents = processFile(file.path, contents);
      contents = traceur.compile(contents, TRACEUR_OPTS);
      contents = stripIife(contents);
      contents = dollarQify(contents);
      contents = detraceurify(contents);
      contents = angularModulate(contents, opts);
      file.contents = new Buffer(contents.toString());
    }

    this.push(file);

    return cb();
  });

  // returning the file stream
  return stream;
};

function detraceurify (contents) {
  return traceurRuntime + ';\n' + contents.replace('$traceurRuntime.createClass', 'createClass');
}

var moduleLocations = {
  'route-recognizer': '../node_modules/route-recognizer/lib/route-recognizer'
};

var IIEF_RE = new RegExp([
  escape('var $'),
  '__anon_[0-9_]+',
  escape(' = (function() {'),
].join(''));

function stripIife (contents) {
  contents = contents.replace(IIEF_RE, '');
  contents = contents.replace([
    '  return {get Router() {',
    '      return Router;',
    '    }};',
    '})();'
  ].join('\n'), '');

  return contents;
}

var IMPORT_RE = new RegExp("import (.+) from '(.+)'", 'g');
var EXPORT_RE = new RegExp("export default ");
function processFile (filePath, contents) {
  contents = contents || fs.readFileSync(filePath, 'utf8');

  var dir = path.dirname(filePath);

  var wrap = false;
  contents = contents.replace(EXPORT_RE, function (match) {
    wrap = true;
    return 'return ';
  });
  if (wrap) {
    contents = ['(function(){', contents, '}())'].join('');
  }

  return contents.replace(IMPORT_RE, function (match, obj, includePath) {
    var includeFile = path.join(dir, moduleLocations[includePath] || includePath);
    if (includeFile.substr(-3) !== '.js') {
      includeFile += '.js';
    }
    return 'var ' + obj + '=' + processFile(includeFile) + ';';
  });
}




/*
 * convert AMD to Angular modules
 */
function angularModulate (src, opts) {
  return [
    'angular.module(\'' + opts.moduleName + '\', [])',
    '.factory(\'router\', [\'$q\', function($q) {',
      src,
      'return new Router();',
    '}]);'
  ].join('');
}


/*
 * Replace ES6 promises with calls to $q
 *
 * note that this may not be comprehensive
 */
function dollarQify (src) {
  return falafel(src, {tolerant: true}, function (node) {
    if (node.type === 'NewExpression' && node.callee.name === 'Promise') {
      node.update('$q(' + argsToSrc(node) + ')');
    } else if (node.type === 'CallExpression') {
      var callee = node.callee.source(),
          match,
          method;
      if (match = callee.match(/^Promise\.(resolve|reject|all)$/)) {
        var method = match[1];
        if (method === 'resolve') {
          method = 'when';
        }
        node.update('$q.' + method + '(' + argsToSrc(node) + ')');
      }
    }
  }).toString();
}

/*
 * given a node with arguments return the source prepresentation
 */
function argsToSrc (node) {
  return node.arguments.map(function (node) {
    return node.source();
  }).join(', ');
}

