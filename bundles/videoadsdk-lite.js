/**
 * This is meant to take the place of jxvideo.1.3.min.js 
 * It should be lighter than the videoadsdk as it will not do vast generation
 * and no horiz-banner so for those 2 components we are using a -dummy version
 * which will be smaller
 * 
 * NOTE: 
 * The 1.3 is used by partners (standalone) in typically masterhead ads
 * 
 * Dependencies (not showing modulesmgr, cssmgr)
   - the bundle (videoadsdk.js):
        - video/adplayer
            - video-styles/videoad
            - video/spinner-factory
            - video/replaybtn-factory <-- use dummy version which does nothing
            - video/horizbanner-factory <-- use dummy version which does nothing
            - video/admgr-factory (We will use video/admgr-factory-bc) <-- need to give it better name
                - video/adctrls-factory
                - video-styles/videoad
            - video/vast <-- use dummy version which does nothing
 *    
 */
 if (window.jxvideoadsdklite) { //<--- NEW LEH
    return;
}

 
const modulesmgr                       = require('../components/basic/modulesmgr');
const cssmgr                           = require('../components/video/cssmgr');
modulesmgr.set('video/cssmgr',         cssmgr);

// For style this is a bit different from the default one (for video SDK)
const stylesSet                        = require('../components/video-styles/videoad');
cssmgr.init(stylesSet.getCls(), stylesSet.getStyles());
cssmgr.inject('adControls', { color: '#FF0000'});

const vast                             = require('../components/video/vast');
modulesmgr.set('video/vast',         vast);

// these we only use within this file, so dun bother

// these will be used throughout (i.e. they are needed by the files that are 'required' by
// the top level file (this one).
// We use this method (so the child files they do not 'require' those files directly)
// for a reason: here we can load the exact variant of a service
// e.g. ctrls-factory-specialxyz, then it will be used throughout the browserified
// script as the child JS will just require mmodulesmgr and get the right instance
// from mmodulesmgr

const helpers                           = require('../components/video/helpers');
modulesmgr.set('video/helpers',         helpers);

const consts                            = require('../components/video/consts'); 
modulesmgr.set('video/consts',          consts);

const adctrls_fact                      = require('../components/video/adctrls-factory');
modulesmgr.set('video/adctrls-factory', adctrls_fact);

const admgr_fact                        = require('../components/video/admgr-factory');
modulesmgr.set('video/admgr-factory',   admgr_fact);

const spinner_fact                      = require('../components/video/spinner-factory');
modulesmgr.set('video/spinner-factory',   spinner_fact);

const replaybtn_fact                    = require('../components/video/replaybtn-factory-dummy');
modulesmgr.set('video/replaybtn-factory',  replaybtn_fact);

const horizbanner_fact                  = require('../components/video/horizbanner-factory-dummy');
modulesmgr.set('video/horizbanner-factory',   horizbanner_fact);

const createObject                       = require('../components/video/adplayer');


var instMap = new Map(); //if we just always impose that if used from universal, then it's in
                         //iframe, then this Map is a bit stupid (only 1 item)  
function makePlayer(containerId, adparameters, config = null, eventsVector = null) {
    config.autopause = false; //i.e. we are not dependent on those jxvisible
    //testing only config.autoplay = false;
    //and what not.
    //just depend on the autoplay flag.
    let instMaybe = instMap.get(containerId);
    if (instMaybe) {
        return;
    }
    let playerInst = createObject(containerId, adparameters, config, eventsVector);
    instMap.set(containerId, playerInst);
    return playerInst;
}

window.jxvideoadsdklite = 1;

//Actually this is not needed if this code is just to replace jxvideo1.3.min.js
//<----- Only needed when univeral unit is outside our iframe
//I am still considering..
function listen(e) {
    let json = null;
    if (typeof e.data === 'string' && e.data.startsWith('jx')) 
        ;
    else {
        return;
    }        
    if (e.data == 'jxvisible' || e.data == 'jxnotvisible') {
        json = {type : e.data};
    }
    if (!json && e.data.indexOf('jxmsg::') == 0) {
        try {
            json = JSON.parse(e.data.substr('jxmsg::'.length));
        }
        catch(err) {}
    }
    if (!json) return; //unrelated to us, we dun bother.
    json.token = 'hardcode';
    switch (json.type) {
        case "jxvisible":
        case "jxnotvisible":     
            let instMaybe = instMap.get(json.token);
            if (instMaybe) {
                instMaybe.notifyMe(json.type);
            }
            break;
        case "adparameters":
            makePlayer(json.token, json.data);
            break;                    
    }
}//listen
window.addEventListener('message', listen, false);
notifyMaster('jxloaded', 'jx_video_ad');

//height change
function notifyMaster(type, token, data = null) { //todo DATA HOW
    let msgStr = '';
    if (type == 'jxloaded') {
        token = window.name;
    }
    let obj = {
        type: type,
        token: token
    };
    if (data) {
        obj.data = data;
    }
    msgStr = "jxmsg::" + JSON.stringify(obj);
    parent.postMessage(msgStr, '*'); 
}


//--- not really needed -->


function fetchAdJsonP(cfg) {
    let domain = cfg.domain? cfg.domain:'jixie.io';
    let adURL = `https://ad.jixie.io/v1/universal?source=sdk&domain=${domain}&creativeid=` + cfg.creativeid;
    return fetch(adURL)
    .then((response) => response.json())
    .then(function(respJson) {
        let arr = respJson.creatives;
        if (arr && arr.length >= 1) {
            return arr[0];
        }
        throw new Error("no ad");
    });
}
            

/** This is the main usage the main way the jxvideo1.3.min.js is currently use
 * so we expose it here
 * 
 * Backward compatiability: Coz this current script is supposed to replace 
 * jxvideo.1.4.min.js AS WELL AS jxvideo.1.3.min.js (<-- only used by Kompas
 * to play masterhead ads)
 * 
 * Support the use case of typically the masterhead ads of our publishers
 * (jxvideo.1.3.min.js)
 * 
 * Basically the code using the sdk provides a 
 * function "onJXPlayerReady". This is supposedly called by jxvideo.1.3.min.js
 * when the jxvideo.1.3.min.js is loaded and initialized. 
 */
var oldPlayerSDKMap = null;
if (window.onJXPlayerReady && !window.onJXPlayerReadyProcessed) {
    window.onJXPlayerReadyProcessed = 1;
    oldPlayerSDKMap = new Map();
    //well, since these events are published in our documentation, we need to support them
    const eventsVector_ =[
            "jxadended", 
            "jxadfirstQuartile",
            "jxadthirdQuartile",
            "jxadmidpoint",
            "jxadskipped", 
            "jxadalladscompleted",
            "jadclick", 
            "jxadimpression",
            "jxadstart"
        ];
    var playerObj = {
        player: null,
        started: false,
        start: function(config) {
            if (this.started) return; //to beat a problem with the ad looping
            this.started = true;
            //get the player instance 
            let thisObj = this;
            let inst = oldPlayerSDKMap.get(config.container);
            if (!inst) {
                fetchAdJsonP(config)
                .then(function(creativeJson) {
                    inst = makePlayer(config.container, creativeJson, config, eventsVector_);
                    thisObj.player = inst;
                    //Just testing nonautoplay
                    //setTimeout(function(){
                      //  thisObj.player.play();
                    //}, 7000);
                    oldPlayerSDKMap.set(config.container, inst);
                })
                .catch(function(e) {
                    console.log("CANNOT FETCH AD");
                });
            }
        },
        play: function() {
            //already playing by itself
            //this.player.play();
        }
    }
    window.onJXPlayerReady(playerObj);
}



