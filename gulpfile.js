var gulp    = require('gulp');
var debug   = require('gulp-debug');
var plumber = require('gulp-plumber');

var jshint = require('gulp-jshint');
var shell  = require('gulp-shell');
var subs   = require('gulp-html-subs');
var babel  = require('gulp-babel');
var zip    = require('gulp-zip');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var chalk    = require('chalk');
var combine  = require('stream-combiner');
var karma    = require('karma').server;
var minimist = require('minimist');
var through  = require('through2');
var yuidoc   = require('yuidocjs');

var browserify = require('browserify');
var babelify = require('babelify');

function subJsHint() {
  return combine(
      jshint.extract(),
      jshint({
        esnext: true,
        laxbreak: true,
        sub: true,
        expr: true
      }),
      jshint.reporter('jshint-stylish'),
      jshint.reporter('fail'));
}

function subBabel() {
    var scriptSubs = subs('script');
  return combine(
      scriptSubs.extract,
      babel({modules: 'ignore', comments: false}),
      scriptSubs.inject);
}

function subBrowserifyBabel() {
  return through.obj(function (file, enc, next) {
    browserify(file.path, { debug: true })
        .transform(babelify)
        .bundle(function (err, res) {
          if (err) {
            return next(err);
          }

          file.contents = res;
          next(null, file);
        });
  });
}

gulp.task('clean', shell.task('rm -r out'));

gulp.task('jshint', function() {
  return gulp.src(['./src/**/*.js', './test/**/*.html'])
      .pipe(plumber())
      .pipe(subJsHint());
});

gulp.task('source', ['jshint'], function() {
  return gulp.src('./src/index.js')
      .pipe(subBrowserifyBabel())
      .pipe(rename('bin.js'))
      .pipe(gulp.dest('out'));
});

gulp.task('test-source', ['jshint', 'source'], function() {
  var scriptSubs = subs('script[lang="es6"]');
  return gulp.src(['./test/**/*_test.html', './test/testutils.html'])
      .pipe(scriptSubs.extract)
          .pipe(babel())
      .pipe(scriptSubs.inject)
      .pipe(gulp.dest('out'));
});

gulp.task('test', ['compile'], function(done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('test-server', function(done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: false
  }, done);
});


gulp.task('compile', ['source', 'test-source']);
gulp.task('pack', ['compile'], function() {
  return gulp.src('out/bin.js')
      .pipe(uglify())
      .pipe(rename('bin.min.js'))
      .pipe(gulp.dest('out'));
});
