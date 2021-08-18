/*
Note: first time using this gulp stuff:

- one-off: you will need to have gulp globally on your  machine if not yet so
    - npm install --global gulp

- Then when you pull this source from git out, then need to install the dependencies
    - npm install
- If the package.json file has changed, then you should re-run npm install

- assuming all the dependencies are well setup, then each time if you changed some scripts included in this gulp build,
then just run one of the following commands

*/

/* day-to-day running:

gulp PREP-DEV
a selected subset of the scripts : feel free to add to it (look for fileslist_)
main thing is it concact the yt bridge and the yt1.2. together! into 1 file so that no need to have so many script loading (-1)

gulp PREP-PROD
a selected subset of the scripts : feel free to add to it (look for fileslist_)
main thing is it concact the yt bridge and the yt1.2. together! into 1 file so that no need to have so many script loading (-1)

gulp DEPLOY-DEVELOPER1-PROD
 used by developer1 (renee) to easily build a set of files for a live test  
 DEPLOY coz it copy the file to s3
 PROD coz it minifies

gulp DEPLOY-DEVELOPER1-DEV
 used by developer1 (renee) to easily build a set of files for a live test  
 DEPLOY coz it copy the file to s3
 PROD coz it minifies

*/

//support arguments to gulp
const supported_ = [
    //handle 3 types of things:
    //(1) our main files. some are simple just need minifying (PROD will do that)
    //(2) some need some concat (jxyoutubebridge-core.1.0.js + jxyoutube.1.2.js = dist/js/jxyoutubebridge.1.0.(min.)js
    //(3) some need browserify etc
    "PREP-PROD", 
    "PREP-DEV", 
    
    //Currently developer1 stuff is used by renee.
    //other people are welcome to clone and make their own.
    //use the word DEPLOY coz it involves copying,  PROD vs DEV is minify vs no minify.
    'DEPLOY-DEVELOPER1-PROD',
    'DEPLOY-DEVELOPER1-DEV'
  
  
    //WELCOME TO ADD WHATEVER CAN HELP YOU.
  ];
  
  //MAIN FILE LIST: files that only require simple minifying at most
  //we don't have any that only require simple minifying ...
  const fileslist_ = [
  ];
  
  
  var gulp = require('gulp');
  var uglifyjs = require('uglify-es');
  //var uglifyjs      = require("gulp-terser"), 
  var concat = require("gulp-concat");
  var composer = require('gulp-uglify/composer');
  var replace = require('gulp-replace');
  var rename = require('gulp-rename');
  var pump = require('pump');
  var clean = require('gulp-rimraf');
  var gutil = require('gulp-util');
  var source = require('vinyl-source-stream');
  var buffer = require('vinyl-buffer');
  var browserify = require('browserify');
  var minify = composer(uglifyjs, console); 
  var gulpif = require('gulp-if');
  var argv = require('yargs').argv;
  var s3 = require('gulp-s3');
  const chalk = require('chalk');
  const defaultWidth_ = 200;
  const defaultPadChar = ' ';
  const wrap = require('wordwrap')(5, 100);
  var config = null;
  
   var minify_options_strip_float = {
    compress: {
      global_defs: {
      }
    }
   };
   minify_options_strip_float.compress.global_defs['JX_FLOAT_COND_COMPILE'] = false;
   
  const floatPatternStub = `DO_NOT_REMOVE_GULPBUILD_REPLACE_FLOAT_COND_COMPILE`;
  const floatPatternTurnOff = `window.JX_FLOAT_COND_COMPILE = false;`;
  const floatPatternTurnOn = `window.JX_FLOAT_COND_COMPILE = true;`;
  
    var configKeys = require("./config-keys")(); //PLEASE SEE THIS FILE config-keys-seed.js is commited though
    var config_aws = {
        key: configKeys.awsKey,
        secret: configKeys.awsSecret,
        bucket: configKeys.awsBucket,
        region: configKeys.awsRegion
    };
    var testFilesPath_    = 'osmtest'; //configKeys.testFilesPath;
  
    const s3_options = {
        "dev": {
            headers: {
                'x-amz-acl': 'public-read'
            },
            uploadPath: testFilesPath_,
            failOnError: true
        },
        "prod": {
            headers: {
                'x-amz-acl': 'public-read'
            },
            uploadPath: testFilesPath_,
            failOnError: true
        }
    };
    
  
  /**
  * (1) The easy-to-build scripts . We have none. Just a placeholder. This is not called
  * by any steps currently
  */
  var options = {};
  gulp.task('BUILD_BULK', function(cb) {
    pump([
            gulp.src(fileslist_),
            gulpif(config.minify, minify(options)),
            gulpif(config.minify, rename({
                extname: '.min.js'
            })),
            gulp.dest('dist/js')
        ],
        cb
    );
  });
  
 
  
  /**
  * (2) trackerJS script which uses an external module and therefore needs browserify.
  * This is our main script (and only one) currently
  */
  const osmjsfile_ =
    'bundles/osm.js';
  
  gulp.task('BUILD_OSM_BUNDLE', function() {
    return browserify('' + osmjsfile_, {
            debug: false
        })
        .bundle()
        .pipe(source(osmjsfile_))
        .pipe(buffer())
        .pipe(replace(floatPatternStub,    floatPatternTurnOff))
        .pipe(gulpif(config.minify, minify(minify_options_strip_float)))
        .on('error', function(err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
        })
        .pipe(gulpif(true, rename({
            basename: 'jx-app-osm'
        })))
        .pipe(gulpif(true, rename({
            extname: '.min.js'
        })))
        .pipe(gulp.dest('dist'))
        //.s3(config_aws, s3_options.dev)
        .pipe(gutil.noop())
  });
  const ulitejsfile_ = 'bundles/ulite.js';

  
  gulp.task('BUILD_ULITE_BUNDLE', function() {
   
    floatNewPattern =  `window.JX_FLOAT_COND_COMPILE = false;`;
    return browserify('' + ulitejsfile_, {
            debug: false
        })
        .bundle()
        .pipe(source(ulitejsfile_))
        .pipe(buffer())
        .pipe(replace(floatPatternStub,    floatPatternTurnOff))
        .pipe(gulpif(config.minify, minify(minify_options_strip_float)))
        .on('error', function(err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
        })
        .pipe(gulpif(true, rename({
            basename: 'jx-app-ulite'
        })))
        .pipe(gulpif(true, rename({
            extname: '.min.js'
        })))
        .pipe(gulp.dest('dist'))
        //.s3(config_aws, s3_options.dev)
        .pipe(gutil.noop())
  });

  
  gulp.task('BUILD_FLOATABLE_ULITE_BUNDLE', function() {
    return browserify('' + ulitejsfile_, {
            debug: false
        })
        .bundle()
        .pipe(source(ulitejsfile_))
        .pipe(buffer())
        .pipe(replace(floatPatternStub,    floatPatternTurnOn))
        .pipe(gulpif(config.minify, minify()))
        .on('error', function(err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
        })
        .pipe(gulpif(true, rename({
            basename: 'jx-app-ulite-floatable'
        })))
        .pipe(gulpif(true, rename({
            extname: '.min.js'
        })))
        .pipe(gulp.dest('dist'))
        //.s3(config_aws, s3_options.dev)
        .pipe(gutil.noop())
  });

  const videosdkjsfile_ = 'bundles/videosdk.js';
  gulp.task('BUILD_VIDEOSDK_BUNDLE', function() {
    return browserify('' + videosdkjsfile_, {
            debug: false
        })
        .bundle()
        .pipe(source(videosdkjsfile_))
        .pipe(buffer())
        .pipe(gulpif(config.minify, minify()))
        .on('error', function(err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
        })
        .pipe(gulpif(true, rename({
            basename: 'jx-app-videosdk'
        })))
        .pipe(gulpif(true, rename({
            extname: '.min.js'
        })))
        .pipe(gulp.dest('dist'))
        //.s3(config_aws, s3_options.dev)
        .pipe(gutil.noop())
  });

  const amposmjsfile_ = 'bundles/amp-osm.js';
  gulp.task('BUILD_AMPOSM_BUNDLE', function() {
    return browserify('' + amposmjsfile_, {
            debug: false
        })
        .bundle()
        .pipe(source(amposmjsfile_))
        .pipe(buffer())
        .pipe(replace(floatPatternStub,   floatPatternTurnOff))
        .pipe(gulpif(config.minify, minify(minify_options_strip_float)))
        .on('error', function(err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
        })
        .pipe(gulpif(true, rename({
            basename: 'jx-app-amposm'
        })))
        .pipe(gulpif(true, rename({
            extname: '.min.js'
        })))
        .pipe(gulp.dest('dist'))
        //.s3(config_aws, s3_options.dev)
        .pipe(gutil.noop())
  });

  const hbrendererjsfile_ = 'bundles/hbrenderer.js';
  gulp.task('BUILD_HBRENDERER_BUNDLE', function() {
    return browserify('' + hbrendererjsfile_, {
            debug: false
        })
        .bundle()
        .pipe(source(hbrendererjsfile_))
        .pipe(buffer())
        .pipe(replace(floatPatternStub,    floatPatternTurnOff))
        .pipe(gulpif(config.minify, minify(minify_options_strip_float)))
        .on('error', function(err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
        })
        .pipe(gulpif(true, rename({
            basename: 'jx-app-hbrenderer'
        })))
        .pipe(gulpif(true, rename({
            extname: '.min.js'
        })))
        .pipe(gulp.dest('dist'))
        //.s3(config_aws, s3_options.dev)
        .pipe(gutil.noop())
  });

  const jxrendererjsfile_ = 'bundles/jxrenderer.js';
  gulp.task('BUILD_JXRENDERER_BUNDLE', function() {
    return browserify('' + jxrendererjsfile_, {
            debug: false
        })
        .bundle()
        .pipe(source(jxrendererjsfile_))
        .pipe(buffer())
        .pipe(replace(floatPatternStub,    floatPatternTurnOff))
        .pipe(gulpif(config.minify, minify(minify_options_strip_float)))
        .on('error', function(err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
        })
        .pipe(gulpif(true, rename({
            basename: 'jx-app-jxrenderer'
        })))
        .pipe(gulpif(true, rename({
            extname: '.min.js'
        })))
        .pipe(gulp.dest('dist'))
        //.s3(config_aws, s3_options.dev)
        .pipe(gutil.noop())
  });

  const videoadsdkjsfile_ = 'bundles/videoadsdk.js';
  gulp.task('BUILD_VIDEOADSDK_BUNDLE', function() {
    return browserify('' + videoadsdkjsfile_, {
            debug: false
        })
        .bundle()
        .pipe(source(videoadsdkjsfile_))
        .pipe(buffer())
        .pipe(gulpif(config.minify, minify()))
        .on('error', function(err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
        })
        .pipe(gulpif(true, rename({
            basename: 'jx-app-videoadsdk'
        })))
        .pipe(gulpif(true, rename({
            extname: '.min.js'
        })))
        .pipe(gulp.dest('dist'))
        //.s3(config_aws, s3_options.dev)
        .pipe(gutil.noop())
  });

  const videoadsdkstandalonejsfile_ = 'bundles/videoadsdk-standalone.js';
  gulp.task('BUILD_VIDEOADSDKSTANDALONE_BUNDLE', function() {
    return browserify('' + videoadsdkstandalonejsfile_, {
            debug: false
        })
        .bundle()
        .pipe(source(videoadsdkstandalonejsfile_))
        .pipe(buffer())
        .pipe(gulpif(config.minify, minify()))
        .on('error', function(err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
        })
        .pipe(gulpif(true, rename({
            basename: 'jx-app-videoadsdk-standalone'
        })))
        .pipe(gulpif(true, rename({
            extname: '.min.js'
        })))
        .pipe(gulp.dest('dist'))
        //.s3(config_aws, s3_options.dev)
        .pipe(gutil.noop())
  });
  
  gulp.task('BUILD_3PARTYCR_PROXY_SDK', function(cb) {
    pump([
            gulp.src('sdks/jxeventssdk.js'),
            gulpif(config.minify, minify({})),
            gulpif(true, rename({
                extname: `.min.js`
            })),//always generate min extension whether min or no min.
            gulp.dest('dist/sdks')
        ],
        cb
    );
  });
  gulp.task('UPLOAD_TEST_HTML', function(cb) {
    pump([
            gulp.src(['dist/sdks/*.js', 'dist/bundles/*.js', 'tests/*.json', 'tests/*.html', 'tests/*.css']),
            gulpif(true, s3(config_aws, s3_options.dev))
        ],
        cb
    );
  });
  //https://jx-demo-creatives.s3-ap-southeast-1.amazonaws.com/osmtest/osmwrapper.js
  
  function handleError(err) {
    console.log("Exiting Process");
    console.log(err.toString())
    process.exit(-1)
  }
  
  gulp.task('cleandev', function() {
    return gulp.src('dev/*', {
        read: false
    }).pipe(clean());
  });
  
  
  function doTitle(str, chalkFcn) {
    console.log('');
    //let cBuf = chalkFcn(wrap(" "));
    //console.log(cBuf);
    let cBuf = chalkFcn(wrap(str));
    console.log(cBuf);
  }
  
  const readline          = require('readline');  
  const npmCheckMsg_       = `IMPORTANT!! Check the lines for jixie-vast-common and jixie-ids-common in package.json (version stamps)\n` +
  `See if the version number has been bumped up since you last run npm install.` +
  `Run npm install if needed before you do your gulp build.`;
  
  gulp.task("npmnotice", async () => {
    await new Promise((resolve, reject) => {
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      doTitle(npmCheckMsg_, chalk.bgRed.white);
      rl.question(`Press any key to continue, Ctrl-C to abort.`, function(answer) {
      rl.close();
      resolve(answer);
      });
    });
  });
  
  
  
  gulp.task('clean', function() {
    return gulp.src('dist/*', {
        read: false
    }).pipe(clean());
  });
  
  ////gulp.task('main', gulp.series('npmnotice', 'clean', 'BUILD_TRACKERJS'));
  
  //add this to the list later 'BUILD_OUTSTREAMJS'
  //we are continually modifying the ids common ah.
  gulp.task('main', gulp.series('clean', 
    'BUILD_3PARTYCR_PROXY_SDK',
    'BUILD_AMPOSM_BUNDLE', 
    'BUILD_JXRENDERER_BUNDLE', 
    'BUILD_HBRENDERER_BUNDLE', 
    'BUILD_OSM_BUNDLE',
    'BUILD_VIDEOSDK_BUNDLE',
    'BUILD_VIDEOADSDK_BUNDLE',
    'BUILD_VIDEOADSDKSTANDALONE_BUNDLE', 
    'BUILD_ULITE_BUNDLE', 
    'BUILD_FLOATABLE_ULITE_BUNDLE'));
  
  gulp.task('developer1', gulp.series('clean', 
    'BUILD_3PARTYCR_PROXY_SDK',
    'BUILD_AMPOSM_BUNDLE', 
    'BUILD_JXRENDERER_BUNDLE', 
    'BUILD_HBRENDERER_BUNDLE', 
    'BUILD_OSM_BUNDLE',
    'BUILD_VIDEOSDK_BUNDLE',
    'BUILD_VIDEOADSDK_BUNDLE',
    'BUILD_VIDEOADSDKSTANDALONE_BUNDLE', 
    'BUILD_ULITE_BUNDLE', 
    'BUILD_FLOATABLE_ULITE_BUNDLE',
    'UPLOAD_TEST_HTML'));
  
  config = (function() {
    var
        env = argv._[0],
        rawConfig = {};
    // default
    if (!env) {
        throw "You need to supply an argument to gulp! Exiting";
    }
    if (supported_.indexOf(env) == -1) {
        throw 'As argument to this gulp, you can only choose one of "' + supported_.join('", "') + '"';
    }
    if (env == 'PREP-PROD') {
        rawConfig.minify = true;
        gulp.task(env, gulp.series('main'));
    }
    if (env == 'PREP-DEV') {
        rawConfig.minify = false;
        gulp.task(env, gulp.series('main'));
    }
    if (env == 'DEPLOY-DEVELOPER1-PROD') {
        rawConfig.minify = true; //always false when we do the main stuff
        rawConfig.upload = true;
        gulp.task(env, gulp.series('developer1'));
    }
    if (env == 'DEPLOY-DEVELOPER1-DEV') {
        rawConfig.minify = false; //always false when we do the main stuff
        rawConfig.upload = true;
        gulp.task(env, gulp.series('developer1'));
    }
  
    return rawConfig;
  })();
  
  

