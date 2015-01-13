var gulp = require('gulp');
var Dgeni = require('dgeni');
var traceur = require('gulp-traceur');
var connect = require('gulp-connect');
var concat = require('gulp-concat');
var merge = require('merge-stream');
var rename = require('gulp-rename');

var modulate = require('./scripts/angular-modulate');

var CONFIG = require('./config');
var SERVER_CONFIG = CONFIG.server;
var TRACEUR_OPTIONS = CONFIG.traceur;
var BUILD_DIR = CONFIG.build.dir;
var PATH = {
  SRC: './src/**/*.ats'
};

gulp.task('build', ['transpile', 'angularify', 'docs']);

gulp.task('transpile', function() {
  return gulp.src(PATH.SRC)
      .pipe(traceur(TRACEUR_OPTIONS))
      .pipe(rename({extname: '.js'}))
      .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('angularify', ['transpile'], function() {
  var directive = gulp.src('./src/*.es5.js');

  var generated = gulp.src('./src/router.ats')
      .pipe(modulate({
        moduleName: 'ngFuturisticRouter.generated'
      }))

  return merge(directive, generated)
      .pipe(concat('router.es5.js'))
      .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('dgeni', function() {
  try {
    var dgeni = new Dgeni([require('./docs/dgeni.conf')]);
    return dgeni.generate();
  } catch(x) {
    console.log(x.stack);
    throw x;
  }
});


// WATCH FILES FOR CHANGES
gulp.task('watch', function() {
  gulp.watch(PATH.SRC, ['build']);
});


// WEB SERVER
gulp.task('serve', function() {
  connect.server({
    host: SERVER_CONFIG.host,
    root: [__dirname],
    port: SERVER_CONFIG.port,
    livereload: false
  });
});


gulp.task('default', ['serve', 'watch']);
