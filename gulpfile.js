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

/* input parameters:

gulp PREP-DEV
build the files without minification. The resultant files will be found in dist/bundles/ folder

gulp PREP-PROD
build the files with minification. The resultant files will be found in dist/bundles/ folder
You take those by hand and then copy over to whatever destination and do your own cdn cache clearing etc

gulp DEPLOY-DEVELOPER1-DEV
gulp DEPLOY-DEVELOPER1-PROD
This is also w/o and w minification. The difference between the PREP-* stuff is that this one give you 
a convenience of copying your files to s3 (You probably would have set up resource override on your Chrome/Firefox
browser e.g.
https://scripts.jixie.media/jxvideo.3.1.min.js --> https://jx-demo-creatives.s3-ap-southeast-1.amazonaws.com/blablablatest/jxvideo.3.1.min.js
 
*/

const bundlessubfolder_ = 'bundles/';
const jsext_ = '.js';

//support arguments to gulp
const supported_ = [
    "PREP-PROD", 
    "PREP-DEV", 
    
    'DEPLOY-DEVELOPER1-PROD',
    'DEPLOY-DEVELOPER1-DEV'
    //WELCOME TO ADD WHATEVER CAN HELP YOU.
  ];
  
  var gulp = require('gulp');
  var gap = require('gulp-append-prepend');
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
  
  // Important: even the gulp tasks are generated dynamically from this array
  // so if there is a new bundle, then you will need to add to this array here.
  /*
  explanation WHAT IS signature: it is not needed for build-purpose, but good to know.
  Coz our scripts all aim to: 1 script in one window-space. yet serve multiple instances
  if needed (example is: 1 OSM script but support several units on the page)
  */
  var bundles_  = [
    {
        name: 'OSM', //name does not matter
        in: 'osm', //name of the file in bundles/ folder. So this one is bundles/osm.js
        out: 'jxosm.1.0', //the built file is jxosm.1.0.min.js 
        floatable: 'yes', //this will determine the built for some of the stuff so it matters.
                         //floatable no means it will not have the ability to float.
        signature: "window.jxoutstreammgr.init", //if the script is somehow loaded twice by the publisher
                                                 // the second time the script sees that window.jxoutstreammgr & the init
                                                 // is already defined, then it will not continue to run.
        queue: "window._jxoutstreammgrq",
        //so there are 2 ways to deploy the unit.
        // Method 1 the traditional way of calling window.jxoutstreammgr.init (but need to spin wait until sure that 
        // the script is loaded)
        // Method 2: the newer way of enqueueing to window._jxoutstreammgrq (queue)
        liveall: ["https://scripts.jixie.io/jxosm.1.0.min.js"]
    },
    {
        name: 'OSM-AMP',
        in: 'amp-osm',
        out: 'jxamp',
        floatable: 'no',
        signature: "n/a", 
        queue: "n/a",
        // this destination cannot anyhow be changed: as it is wired into our jixie AMP adaptor:
        liveall: ["https://scripts.jixie.io/jxamp.min.js"]
    },
    {
        name: 'HBRENDERER',
        in: 'hbrenderer',
        out: 'jxhbrenderer.1.1',
        floatable: 'no',
        signature: "window.jxhbuniversal.hbinit",
        queue: "jxhbrendererq", 
        //this is set as a repository variable in the jixie_retargeting_engine repo:
        livefull: ["https://scripts.jixie.media/jxhbrenderer.1.1.min.js"]
    },
    {
        name: 'VIDEOPLAYER',
        in: 'videosdk-v3',
        out: 'jxvideo.3.1',
        signature: "window.JX.player and window.JX.ampplayer",
        //queue: not supported.
        liveall: ["https://scripts.jixie.media/jxvideo.3.1.min.js"]
    },  
    {
        name: 'VIDEOP-AD-PLAYER',
        // use with our osm, new universal etc
        in: 'videoadsdk',
        out: 'jxvideocr.1.0',
        signature: "window.jxvideoadsdk",
        queue: "_jxvideoadsdkq",
        liveall: ["https://scripts.jixie.media/jxvideocr.1.0.min.js"]
    },
    //<--------- NOT USED ACTIVITELY IN LIVE YET -----------------------
    {   // as of now, the universal unit (jxfriendly.1.3.min.js etc that is LIVE
        //is built from the universal_ad_unit repo)
        name: 'UNIVERSAL (no float)',
        in: 'ulite',
        out: 'jxfriendly.2.0',
        floatable: 'no',
        signature: "window.jxuniversal.init",
        queue: "window._jxuniversalq",
        liveall: ["https://scripts.jixie.io/jxfriendly.2.0.min.js"]
    },
    {
        name: 'UNIVERSAL (can float)',
        in: 'ulite',
        out: 'jxfriendly.2.0.flt',
        floatable: 'yes',
        signature: "window.jxuniversal.init", //<--!!!
        queue: "window._jxuniversalfltq",
        liveall: ["https://scripts.jixie.io/jxfriendly.2.0.flt.min.js"]
    },
    {
        name: 'VIDEO-AD-SDK',
        // successor to jxvideo.1.3.min.js to be used by KG masterhead
        in: 'videoadsdk-standalone',
        out: 'jxvideoad.2.0',
        signature: "window.jxvideoadsdksal",
        //queue: not supported.
        liveall: ["https://scripts.jixie.media/jxvideoad.2.0.min.js"]
    },
    {
        name: 'RECWIDGET', //name does not matter
        in: 'recwidget', //name of the file in bundles/ folder. So this one is bundles/osm.js
        out: 'jxrwidget.1.0', //the built file is jxosm.1.0.min.js 
        floatable: 'no',
        signature: "window.jxwidget", 
        queue: "window._jxrwidget"
    }, 
    //--------- NOT USED ACTIVITELY IN LIVE ----------------------->
];
  // 
  // we will be adding to this array based on a JSON object with all the bundles we need to build
  // a var called bundles_ .
  var orderedTasksArr = ['clean', 'BUILD_3PARTYCR_PROXY_SDK', 'BUILD_REC_SDK', 'BUILD_IFRAMEHELPER_JS'];
  
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
  
  // <-- this one is for copying those test files (not the real prod) onto s3.
    var configKeys = require("./config-keys")(); //PLEASE SEE THIS FILE config-keys-seed.js is commited though
    console.log(configKeys);
    console.log("-----");
    var config_aws = {
        key: configKeys.awsKey,
        secret: configKeys.awsSecret,
        bucket: configKeys.awsBucket,
        region: configKeys.awsRegion
    };
    var testFilesPath_    = configKeys.testFilesPath;
  
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
  // -- this one is for copying those test files (not the real prod) onto s3. -->


// create the tasks for all the bundle items:
bundles_.forEach(function (bundle) {
    let bundlename = bundle.name;
    let doCoreB_ =  doCore_.bind(null, bundle.in, bundle.out, bundle.floatable);
    gulp.task(bundlename, function() {
        return doCoreB_();
    });
    orderedTasksArr.push(bundlename);

});
 
function doCore_(inname, outname, floatable = 'na') {
    let minifyOptions = floatable != 'yes' ? minify_options_strip_float: {};
    let thefile = bundlessubfolder_ + inname + jsext_;
    return browserify(thefile, {
            debug: false
        })
        .bundle()
        .pipe(source(thefile))
        .pipe(buffer())
        .pipe(gulpif((floatable == 'yes' || floatable == 'no'), replace(floatPatternStub,   floatable == 'yes' ? floatPatternTurnOn: floatPatternTurnOff)))
        .pipe(gulpif(config.minify, minify(minifyOptions)))
        .on('error', function(err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
        })
        .pipe(gap.prependText('(function(){'))
        .pipe(gap.appendText('})();'))
        .pipe(gulpif(true, rename({
            basename: outname
        })))
        .pipe(gulpif(true, rename({
            extname: '.min.js'
        })))
        .pipe(gulp.dest('dist'))
        //.s3(config_aws, s3_options.dev)
        .pipe(gutil.noop())
    }
 
  
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

  gulp.task('BUILD_REC_SDK', function(cb) {
    browserify('sdks/jxrecsdk.js', {
        debug: false
    }).bundle()
    .pipe(source('jxrecsdk.js'))
    .pipe(buffer())
    .pipe(gulpif(config.minify, minify({})))
    .pipe(gulpif(true, rename({
        extname: '.1.0.min.js'
    })))
    .pipe(gulp.dest('dist/sdks'))
    cb();
    
  gulp.task('BUILD_IFRAMEHELPER_JS', function(cb) {
    pump([
            gulp.src('sdks/jxiframe.1.2.js'),
            gulpif(config.minify, minify({})),
            gulpif(true, rename({
                extname: `.min.js`
            })),//always generate min extension whether min or no min.
            gulp.dest('dist/sdks')
        ],
        cb
    );
  });

  gulp.task('UPLOAD_TESTFILES', function(cb) {
    pump([
            gulp.src(['dist/sdks/*.js', 'dist/bundles/*.js', 'tests/*.json', 'tests/*.html', 'tests/*.css']), //, 'tests/jxrwidget.1.0.min.js']),
            gulpif(true, s3(config_aws, s3_options.dev))
        ],
        cb
    );
  });

  //gulp.task('WRAP_UP', function(cb) {
    //printWhoGoesWhere();
    //cb();
  //});
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


 /*
const whoGoesWhere = [];


function printWhoGoesWhere() {
    whoGoesWhere.forEach(function(oneEntry) {
        let floatSeg = (oneEntry.floatable ? '-floatable': '');
        let devPath = `https://${config_aws.bucket}.s3-ap-southeast-1.amazonaws.com/${testFilesPath_}/${outputprefix_}${oneEntry.src}${floatSeg}.min.js`;
        let localName = `dist/bundles/${outputprefix_}` + oneEntry.src + 
            floatSeg + 
            '.min.js';
        console.log(`
            ______${oneEntry.title}_______
            ${localName} -> 
                [${oneEntry.livefull}]
                {${devPath}}
        `);
    
    });
  }
  */
  
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
  
  gulp.task('main', gulp.series(orderedTasksArr));
  gulp.task('developer1', gulp.series(orderedTasksArr.concat(['UPLOAD_TESTFILES'])));
  
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
  
  

