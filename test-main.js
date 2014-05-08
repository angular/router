var allTestFiles = [];
var TEST_REGEXP = /\.spec\.js$/;

var pathToModule = function(path) {
  return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    allTestFiles.push(pathToModule(file));
  }
});

require.config({
  // Karma serves files under /base, which is the basePath from your config file
  baseUrl: '/base',

  paths: {
    'node_modules': './node_modules',
    'src': './src'
  },
  map: {
    '*': {
      'rtts-assert': 'node_modules/rtts-assert/src/assert',
      'di': 'node_modules/di/src/index',
      'di/testing': 'node_modules/di/src/testing',
      'watchtower': 'node_modules/watchtower/src/index',
      'expressionist': 'node_modules/expressionist/src/index',
      'templating': 'src/index',
      'compile_ng_template': 'src/loader/requirejs_html',
    }
  },

  // Dynamically load all test files and ES6 polyfill.
  deps: allTestFiles.concat([
    'node_modules/es6-shim/es6-shim'
  ]),

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
