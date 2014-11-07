// Karma configuration
// Generated on Fri Mar 14 2014 15:01:19 GMT-0700 (PDT)

var traceurOptions = require('./config').traceur;

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine', 'requirejs', 'traceur'],

    files: [
      // The entry point that dynamically imports all the specs.
      {pattern: 'test/main.js', included: true},

      // All the specs and sources are included dynamically from `test/main.js`.
      {pattern: 'src/**/*.ats', included: false},
      {pattern: 'node_modules/route-recognizer/dist/route-recognizer.amd.js', included: false},
      {pattern: 'test/**/*.ats', included: false},

      // The runtime assertion library.
      {pattern: 'node_modules/rtts-assert/dist/amd/assert.js', included: false}
    ],

    preprocessors: {
      '**/*.ats': ['traceur']
    },

    browsers: ['Chrome'],

    traceurPreprocessor: {
      options: traceurOptions,
      transformPath: function(path) {
        return path.replace(/\.ats$/, '.js');
      }
    }
  });
};
