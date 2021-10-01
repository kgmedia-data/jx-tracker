/**
 * Bundle built for the jixie "player SDK"
 */
 if (window.JX) {
  return;
}



const modulesmgr                       = require('../components/basic/modulesmgr');
const cssmgr                           = require('../components/video/cssmgr');
modulesmgr.set('video/cssmgr',         cssmgr);

const stylesSet                        = require('../components/video-styles/custom');//we choose this set of style


// these we only use within this file, so dun bother

// these will be used throughout (i.e. they are needed by the files that are 'required' by
// the top level file (this one).
// We use this method (so the child files they do not 'require' those files directly)
// for a reason: here we can load the exact variant of a service
// e.g. ctrls-factory-specialxyz, then it will be used throughout the browserified
// script as the child JS will just require mmodulesmgr and get the right instance
// from mmodulesmgr
const mpginfo                           = require('../components/basic/pginfo');
modulesmgr.set('basic/pginfo',          mpginfo);

const common                            = require('../components/basic/common');
modulesmgr.set('basic/common',         common);

const jxvhelper                           = require('../components/video/jxvideo-helper');
modulesmgr.set('video/jxvideo-helper', jxvhelper);

const consts                            = require('../components/video/consts'); 
modulesmgr.set('video/consts',          consts);

const playercfgmgr_fact                 = require('../components/video/shakacfgmgr-factory');
modulesmgr.set('video/playercfgmgr-factory', playercfgmgr_fact);

const adctrls_fact                      = require('../components/video/adctrls-factory');
modulesmgr.set('video/adctrls-factory', adctrls_fact);

const admgr_fact                        = require('../components/video/admgr-factory');
modulesmgr.set('video/admgr-factory',   admgr_fact);

const ctrls_fact                        = require('../components/video/custom-ctrls-factory');
modulesmgr.set('video/ctrls-factory',   ctrls_fact);

const soundind_fact                     = require('../components/video/soundind-factory');
modulesmgr.set('video/soundind-factory',soundind_fact);

const spinner_fact                      = require('../components/video/spinner-factory');
modulesmgr.set('video/spinner-factory', spinner_fact);

const adscheduler_fact                  = require('../components/video/adscheduler-factory');
modulesmgr.set('video/adscheduler-factory',  adscheduler_fact);

const player_fact                       = require('../components/video/player-factory');
modulesmgr.set('video/player-factory',  player_fact);

// these we only use within this file, so dun bother
const mids                              = require('../components/basic/idslite');
const createObject                      = require('../components/video/damplayer');

const pginfo = mpginfo.get(); //basic pginfo we can get from the page.
const dbgVersion = 'v46';
pginfo.dbgVersion = dbgVersion;

const optionsObjNames_ = ['ads', 'controls', 'soundindicator', 'restrictions'];

var instMap = new Map();   
function makePlayer(options) {
  
  /* options.restrictions = {
    //maxheight: 240
    //maxwidth: 426

    //maxheight: 360
    //maxwidth: 640 //is just nice 639 oso cannot

    //maxheight: 480,
    //maxwidth: 853 //852 cannot 

    //maxheight: 720 //719 oso cannot
    //maxwidth: 1280 
    //minheight: 360
  };
  */
 if (!options.restrictions) {
   options.restrictions = {};
 }
  // dangerous!!
  //options.autoplay = 'always';
  //options.sound = 'fallback';
  if (!options.controls) {
    options.controls = {};
  }
  //options.controls.font = "Andalé Mono"; //Impact"; //Comic Sans MS"; //Arial";
  //options.controls.font = 'Roboto';
  //aiyo no need lah. just use the container ah.
  let hashStr = btoa(JSON.stringify(options));
  let instMaybe = instMap.get(hashStr);
  if (instMaybe) {
      return;
  }

  const ids = mids.get();
  let merged = Object.assign({}, ids, pginfo, options);//pginfo we gotten earlier
  /// TODO jxhelper.registerOptions(options.container, options, optionsObjNames_);
  cssmgr.init(options.container, stylesSet, options, ['customControls']);

  let playerInst = createObject(merged);

  instMap.set(hashStr, playerInst);
  return playerInst;
}

window.JX = {
  player :  function(options) {
      return (makePlayer(options, null));
  },
  ampplayer : function(options, ampIntegration) {
      options.amp = true;//augment
      let metadata = ampIntegration.getMetadata();
      let canonUrl = metadata.canonicalUrl;
      options.pageurl = canonUrl;//augment
      jxvhelper.sendScriptLoadedTrackerAMP({pageurl: canonUrl, dbgVersion: dbgVersion});
      if (!options.container) {
        options.container = jxvhelper.getJxDocBodyId();        
      }
      return (makePlayer(options, ampIntegration));
  }
};

// The loaded event we need some minimal info about the page
// Dun have ids etc ready yet, it is ok.
if (!window.AmpVideoIframe) {
  //get some basic info first
  jxvhelper.sendScriptLoadedTracker(pginfo);
}

