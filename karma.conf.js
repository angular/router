var sharedConfig = require('pipe/karma');

module.exports = function(config) {
  sharedConfig(config);
  config.traceurPreprocessor.options.asyncFunctions = true;

  config.set({
    // list of files / patterns to load in the browser
    files: [
      'node_modules/traceur/bin/traceur.js',
      'utils/loader.js',
      'test-main.js',

      {pattern: 'src/**/*.js', included: false},
      {pattern: 'test/**/*', included: false},

      {pattern: 'node_modules/di/src/**/*.js', included: false},
      {pattern: 'node_modules/rtts-assert/src/**/*.js', included: false},
      {pattern: 'node_modules/watchtower/src/**/*.js', included: false},
      {pattern: 'node_modules/expressionist/src/**/*.js', included: false},
      {pattern: 'node_modules/deferred/src/**/*.js', included: false},
      {pattern: 'node_modules/route-recognizer/lib/**/*.js', included: false},
      {pattern: 'node_modules/es6-shim/es6-shim.js', included: false}
    ],

    preprocessors: {
      'src/**/*.js': ['traceur'],
      'test/**/*.js': ['traceur'],
      'node_modules/di/src/**/*.js': ['traceur'],
      'node_modules/rtts-assert/src/**/*.js': ['traceur'],
      'node_modules/watchtower/src/**/*.js': ['traceur'],
      'node_modules/expressionist/src/**/*.js': ['traceur'],
      'node_modules/deferred/src/**/*.js': ['traceur'],
      'node_modules/route-recognizer/lib/**/*.js': ['traceur'],
    }
  });

  config.sauceLabs.testName = 'router';

  if (process.env.TRAVIS) {
    config.sauceLabs.startConnect = false;
  }
};
