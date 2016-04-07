'use strict';

module.exports = function (config) {
  var options = {
    frameworks: ['jasmine'],

    files: [
      'node_modules/es6-shim/es6-shim.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-animate/angular-animate.js',
      'node_modules/angular-mocks/angular-mocks.js',

      'dist/angular-component-router.js',
      'dist/ng_route_shim.js',

      'test/*.es5.js',
      'test/**/*_spec.js'
    ],

    browsers: ['Chrome']
  };

  config.set(options);
};
