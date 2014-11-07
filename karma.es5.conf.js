// This runs the tests for Angular 1.x

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],

    files: [
      'node_modules/traceur/bin/traceur-runtime.js',

      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',

      'build/src/*.es5.js',
      'src/*.es5.js',

      'test/*.es5.spec.js'
    ],

    browsers: ['Chrome']
  });
};
