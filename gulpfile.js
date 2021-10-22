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

const bundlessubfolder_ = 'bundles/';
const jsext_ = '.js';
//const outputprefix_ = 'jx-app-';

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
  
  var bundles_  = [
    {
        name: 'OSM',
        in: 'osm',
        out: 'jxosm.1.0',
        floatable: 'no',
        signature: "window.jxoutstreammgr.init", //already live
        queue: "window._jxoutstreammgrq",
        liveall: ["https://scripts.jixie.io/jxosm.1.0.min.js"]
    },
    {
        name: 'OSM-AMP',
        in: 'amp-osm',
        out: 'jxamp',
        floatable: 'no',
        signature: "n/a", 
        queue: "n/a",
        liveall: ["https://scripts.jixie.io/jxamp.min.js"]
    },
    {
        name: 'HBRENDERER',
        in: 'hbrenderer',
        out: 'jxhbrenderer.1.1',
        floatable: 'no',
        signature: "window.jxhbuniversal.hbinit",
        queue: "jxhbrendererq", 
        livefull: ["https://scripts.jixie.io/jxhbrenderer.1.1.min.js"]
    },
    
    {
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
    //---
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
        //queue: not supported.
        liveall: ["https://scripts.jixie.media/jxvideocr.1.0.min.js"]
    },  
    {
        name: 'VIDEO-AD-SDK',
        // successor to jxvideo.1.3.min.js used by KG masterhead
        in: 'videoadsdk-standalone',
        out: 'jxvideoad.2.0',
        signature: "window.jxvideoadsdksal",
        //queue: not supported.
        liveall: ["https://scripts.jixie.media/jxvideoad.2.0.min.js"]
    },  
];
  // 
  // we will be adding to this array based on a JSON object with all the bundles we need to build
  // a var called bundles_ .
  var orderedTasksArr = ['clean', 'BUILD_3PARTYCR_PROXY_SDK'];

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
  // -- this one is for copying those test files (not the real prod) onto s3. -->

  // This is the most most important list
var bundles_  = [
    {
        name: 'OSM',
        in: 'osm',
        out: 'jxosm.1.0',
        floatable: 'no',
        signature: "window.jxoutstreammgr.init", //already live
        queue: "window._jxoutstreammgrq",
        liveall: ["https://scripts.jixie.io/jxosm.1.0.min.js"]
    },
    {
        name: 'OSM-AMP',
        in: 'amp-osm',
        out: 'jxamp',
        floatable: 'no',
        signature: "n/a", 
        queue: "n/a",
        liveall: ["https://scripts.jixie.io/jxamp.min.js"]
    },
    {
        name: 'HBRENDERER',
        in: 'hbrenderer',
        out: 'jxhbrenderer.1.1',
        floatable: 'no',
        signature: "window.jxhbuniversal.hbinit",
        queue: "jxhbrendererq", 
        livefull: ["https://scripts.jixie.io/jxhbrenderer.1.1.min.js"]
    },
    
    {
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
    //---
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
        //queue: not supported.
        liveall: ["https://scripts.jixie.media/jxvideocr.1.0.min.js"]
    },  
    {
        name: 'VIDEO-AD-SDK',
        // successor to jxvideo.1.3.min.js used by KG masterhead
        in: 'videoadsdk-standalone',
        out: 'jxvideoad.2.0',
        signature: "window.jxvideoadsdksal",
        //queue: not supported.
        liveall: ["https://scripts.jixie.media/jxvideoad.2.0.min.js"]
    },  
];

// create the tasks for all the bundle items:
bundles_.forEach(function (bundle) {
    let bundlename = bundle.name;
    let doCoreB_ =  doCore_.bind(null, bundle.in, bundle.out);
    gulp.task(bundlename, function() {
        return doCoreB_();
    });
    orderedTasksArr.push(bundlename);

});
orderedTasksArr.push('UPLOAD_TEST_HTML');
orderedTasksArr.push('UPLOAD_TEST_HTML');
 
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

  gulp.task('UPLOAD_TEST_HTML', function(cb) {
    pump([
            gulp.src(['dist/sdks/*.js', 'dist/bundles/*.js', 'tests/*.json', 'tests/*.html', 'tests/*.css']),
            gulpif(true, s3(config_aws, s3_options.dev))
        ],
        cb
    );
  });

  gulp.task('WRAP_UP', function(cb) {
    printWhoGoesWhere();
    cb();
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


 
const whoGoesWhere = [];
/*{ 
        title: "OSM non AMP",
        signature: "window.jxoutstreammgr.init", //already live
        queue: "window._jxoutstreammgrq",
        src: osmjsfile_, 
        livebase: "jxosm.1.0.min.js", 
        livefull: "https://scripts.jixie.io/jxosm.1.0.min.js"
    }, { 
        //eventually it should replace the friendly system lah.
        title: "universal (new) floatable (replaces jxfriendly.1.3.flt.min.js)",
        signature: "window.jxuniversal.init",
        queue: "window._jxuniversalfltq",
        src: ulitejsfile_,
        floatable: true,
        livebase: "jxfriendly.2.0.flt.min.js",
        livefull: "https://scripts.jixie.io/jxfriendly.2.0.flt.min.js"
    }, { 
        //eventually it should replace the friendly system lah.
        title: "universal (new) not-floatable (replaces jxfriendly.1.3.min.js)",
        signature: "window.jxuniversal.init",
        queue: "window._jxuniversalq",
        src: ulitejsfile_,
        livebase: "jxfriendly.2.0.min.js",
        livefull: "https://scripts.jixie.io/jxfriendly.2.0.min.js"
    }, { 
        title: "video ad sdk (to replace jxvideo.1.4.min.js)",
        //this is used expressedly by the renderer and talk using
        //adparameters etc.
        //so this is custom.
        signature: "window.jxvideoadsdk (flat)", //coz this one is not really "called from page"
        queue: "_jxvideoadsdkq", 
        src: videoadsdkjsfile_,
        livebase: "jxvideocr.1.0.min.js",
        livefull: "https://scripts.jixie.io/jxvideocr.1.0.min.js",
    }, {
        title: "OSM (AMP). Our JS for amp-ad jixie",
        src: amposmjsfile_,
        //signature: "n/a",
        //queue: "n/a",
        livebase: "jxamp.min.js",
        //cannot anyhow changed. Built into AMP runtime.
        livefull: "https://scripts.jixie.io/jxamp.min.js"
    }, {
        title: "renderer to play HB ad",
        src: hbrendererjsfile_,
        signature: "window.jxhbuniversal.hbinit",
        queue: "jxhbrendererq", 
        livebase: "jxhbrenderer.1.1.min.js",
        livefull: "https://scripts.jixie.io/jxhbrenderer.1.1.min.js"
    }, { 
        title: "renderer to play simple ad (from base64 blob)",
        //we should combine there 2.
        //this one is not officially used yet.
        src: jxrendererjsfile_,
        signature: "window.jxrenderer.init",
        livebase: "",
        livefull: ""
    }, { 
        title: "Jixie video SDK",
        src: videosdkjsfile2_,
        signature: "window.JX.player and window.JX.ampplayer",
        //queue: not supported.
        livebase: "jxvideo2.1.min.js",
        livefull: "https://scripts.jixie.io/jxvideo2.1.min.js"
    }, { 
        title: "Jixie video SDK v3",
        src: videosdkjsfile3_,
        signature: "window.JX.player and window.JX.ampplayer",
        //queue: not supported.
        livebase: "jxvideo.3.1.min.js",
        livefull: "https://scripts.jixie.io/jxvideo2.1.min.js"
    }, { 
        title: "Jixie video AD SDK (to replace jxvideo.1.3.min.js)",
        //not sure if it is working now.
        src: videoadsdkstandalonejsfile_,
        signature: "window.jxvideoadsdksal (flat)",
        //queue: not supported
        livebase: "jxvideoad.1.0.min.js", //aiyo what to call it ah?
        livefull: "https://scripts.jixie.io/jxvideoad.1.0.min.js"
    }
];       */

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

  
  //add this to the list later 'BUILD_OUTSTREAMJS'
  //we are continually modifying the ids common ah.
  /*
  gulp.task('main', gulp.series('clean', 
    'BUILD_3PARTYCR_PROXY_SDK',
    'BUILD_AMPOSM_BUNDLE', 
    'BUILD_JXRENDERER_BUNDLE', 
    'BUILD_HBRENDERER_BUNDLE', 
    'BUILD_OSM_BUNDLE',
    'BUILD_VIDEOSDKV2_BUNDLE',
    'BUILD_VIDEOSDKV3_BUNDLE',
    'BUILD_VIDEOADSDK_BUNDLE',
    'BUILD_VIDEOADSDKSTANDALONE_BUNDLE', 
    'BUILD_ULITE_BUNDLE', 
    'BUILD_FLOATABLE_ULITE_BUNDLE',
    'WRAP_UP'));
  
  gulp.task('developer1', gulp.series('clean', 
    'BUILD_3PARTYCR_PROXY_SDK',
    'BUILD_AMPOSM_BUNDLE', 
    'BUILD_JXRENDERER_BUNDLE', 
    'BUILD_HBRENDERER_BUNDLE', 
    'BUILD_OSM_BUNDLE',
    'BUILD_VIDEOSDKV2_BUNDLE',
    'BUILD_VIDEOSDKV3_BUNDLE',
    'BUILD_VIDEOADSDK_BUNDLE',
    'BUILD_VIDEOADSDKSTANDALONE_BUNDLE', 
    'BUILD_ULITE_BUNDLE', 
    'BUILD_FLOATABLE_ULITE_BUNDLE',
    'UPLOAD_TEST_HTML',
    'WRAP_UP'));
    */
  
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
  
  

