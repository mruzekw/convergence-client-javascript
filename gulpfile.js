const gulp = require('gulp');

const concat = require('gulp-concat');
const del = require('del');
const merge = require('merge2');
const release = require('gulp-github-release');
const rename = require('gulp-rename');

const ts = require('gulp-typescript');
const tsLint = require('gulp-tslint');

const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');

const rollup = require('gulp-rollup');
const rollupTypescript = require('rollup-plugin-typescript');
const sourceMaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

gulp.task('default', ["build"]);

/**
 * Converts Typescript w/ ES6 modules to ES5 w/ commonjs modules using the
 * Typescript compiler.  This builds both the main source and the test sources.
 */
gulp.task('build', [], function () {
  const tsProject = ts.createProject('tsconfig.json', { 
    sortOutput: true
  });
  var tsResult = gulp.src(['src/**/*.ts', "typings/browser.d.ts", "typings/promise.d.ts"])
    .pipe(ts(tsProject));
    
  return merge([ // Merge the two output streams, so this task is finished when the IO of both operations are done. 
		tsResult.dts.pipe(gulp.dest('build')),
		tsResult.js.pipe(gulp.dest('build'))
	]);
});


/**
 * Test the code using the ES5 output from the build command.
 */
gulp.task('test', ["build"], function () {
  return gulp.src("build/test/**/*.js")
    .pipe(mocha({reporter: 'progress'}));
});


/**
 * Runs the tests and produces a coverage report.
 */
gulp.task('coverage', ["build"], function () {
  return gulp.src("build/**/*.js")
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function () {
      gulp.src("build/test/**/*.js")
        .pipe(mocha({reporter: 'progress'}))
        .pipe(istanbul.writeReports()) // Creating the reports after tests run
        .on('finish', function () {
          process.chdir(__dirname);
        });
    });
});


/**
 * Checks the code for stylistic and design errors as defined in the
 * tslint.config file.
 */
gulp.task('lint', function () {
  return gulp.src('src/main/ts/**/*.ts')
    .pipe(tsLint())
    .pipe(tsLint.report('prose'));
});


/**
 * Creates a single file build in ES5 using RollupJS.  Both a minified and
 * non minified version is created using UglifyJS.  The code will be linted
 * and tested before being rolled up and minified.
 */
gulp.task('dist-build', ["dist-typings", "lint", "test"], function () {
  return gulp.src('src/main/ts/ConvergenceDomain.ts', {read: false})
    .pipe(rollup({
      format: 'iife',
      moduleName: 'ConvergenceDomain',
      sourceMap: true,
      plugins: [
        rollupTypescript()
      ]
    }))
    .pipe(rename("convergence-client.js"))
    .pipe(sourceMaps.write("."))
    .pipe(gulp.dest("dist"));
});

gulp.task('dist-typings', ["build"], function() {
  var dts = require('dts-bundle');

  dts.bundle({
    name: 'convergence-client',
    main: 'build/main/ts/ConvergenceDomain.d.ts',
    out: '../../../dist/convergence-client.d.ts',
    externals: true,
    referenceExternals: true
  });
});

/**
 * Creates a single file build in ES5 using RollupJS.  Both a minified and
 * non minified version is created using UglifyJS.  The code will be linted
 * and tested before being rolled up and minified.
 */
gulp.task('dist-build-es6', ["lint", "test"], function () {
  gulp.src('src/main/ts/ConvergenceDomain.ts', {read: false})
    .pipe(rollup({
      format: 'es6',
      moduleName: 'ConvergenceDomain',
      sourceMap: true,
      plugins: [
        rollupTypescript()
      ]
    }))
    .pipe(rename("convergence-client.es2015.js"))
    .pipe(sourceMaps.write("."))
    .pipe(gulp.dest("dist"));
});


/**
 * Creates a single file build in ES5 using RollupJS.  Both a minified and
 * non minified version is created using UglifyJS.  The code will be linted
 * and tested before being rolled up and minified.
 */
gulp.task('dist-min', ["dist-build"], function () {
  gulp.src("dist/convergence-client.js")
    .pipe(sourceMaps.init())
    .pipe(uglify())
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(sourceMaps.write("."))
    .pipe(gulp.dest("dist"));
});

gulp.task('release', ['dist-min'], function() {
  // you will need to have the environment var GITHUB_TOKEN set to a personal access token from
  // https://github.com/settings/tokens
  gulp.src(["dist/convergence-client.min.js", "dist/convergence-client.d.ts"])
    .pipe(release({
      manifest: require('./package.json')
    }))
    .on('error', function(err) { console.error(err)});
});

/**
 * Removes all build artifacts.
 */
gulp.task('clean', function () {
  return del(['dist/', "build"]);
});
