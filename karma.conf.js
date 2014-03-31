var sharedConfig = require('pipe/karma');

module.exports = function(config) {
  sharedConfig(config);

  config.set({
    // list of files / patterns to load in the browser
    files: [
      'node_modules/traceur/bin/traceur.js',
      'test-main.js',

      {pattern: 'src/**/*.js', included: false},
      {pattern: 'test/**/*', included: false},      

      {pattern: 'node_modules/di/dist/amd/**/*.js', included: false},
      {pattern: 'node_modules/assert/dist/amd/**/*.js', included: false},
      {pattern: 'node_modules/watchtower/dist/amd/**/*.js', included: false},
      {pattern: 'node_modules/expressionist/dist/amd/**/*.js', included: false},
      {pattern: 'node_modules/es6-shim/es6-shim.js', included: false}
    ],

    preprocessors: {
      'src/**/*.js': ['traceur'],
      'test/**/*.js': ['traceur'],
    }
  });

  config.sauceLabs.testName = 'templating';
};
