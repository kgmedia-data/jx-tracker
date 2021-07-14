/**
 * This is meant to take the place of jxvideo.1.3.min.js and jxvideo.1.4.min.js 
 * (removing also need for playerbridgeJS)
 * 
 * NOTE: 
 * The 1.3 is used by partners (standalone) in typically masterhead ads
 * The 1.4 is used with "playerbridge js" in the context of jxoutstream1.3.4.min.js
 * 
 *  Current design is, when used with universal (new) we will still be in an IFRAME
 *  but using adparameters
 * 
 
 * Dependencies (not showing modulesmgr, cssmgr)
   - the bundle (videoadsdk.js):
        - video/adplayer
            - video-styles/videoad
            - video/admgr-factory (We will use video/admgr-factory-bc) <-- need to give it better name
                - video/adctrls-factory
                - video-styles/videoad
            - video/vast
 
 So to note that for now we are not using the same admgr-factory as for videosdk
 Due to the need to support other stuff e.g. emit events

 fire has ad
 fire ad ended
 visible and not visible
 change height
 *    
 */

if (window.jxvideoadsdk) { //<--- NEW LEH
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

const admgr_fact                        = require('../components/video/admgr-factory-bc');
modulesmgr.set('video/admgr-factory',   admgr_fact);

const createObject                       = require('../components/video/adplayer');


var instMap = new Map(); //if we just always impose that if used from universal, then it's in
                         //iframe, then this Map is a bit stupid (only 1 item)  
function makePlayer(containerId, adparameters) {
    let instMaybe = instMap.get(containerId);
    if (instMaybe) {
        return;
    }
    let playerInst = createObject(containerId, adparameters);
    instMap.set(containerId, playerInst);
    return playerInst;
}

window.jxvideoadsdk = 1;


//<----- Only needed when univeral unit is outside our iframe
//I am still considering..
function listen(e) {
    let json = null;
    //if (e.data.startsWith('jx')) 
      //  console.log(` VIDEOSDK GET THIS MSG ${e.data}`);
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
            json.data.universal = 1;
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
    /* const exposedWinPropName_ = 'jxuniversallite';
    if (window[exposedWinPropName_])
        window.postMessage(msgStr, '*'); 
    else */
        parent.postMessage(msgStr, '*'); 
}

/**
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
    const eventsVector_  = ['jxhasad','jxadended','jxnoad','jxplayvideo','jxvideoend',
        'jxadfirstQuartile','jxadmidpoint','jxadthirdQuartile','jxadalladscompleted',
        'jxadclick', 'jxadimpression'];
    var playerObj = {
        player: null,
        started: false,
        start: function(json) {
            if (this.started) return; //to beat a problem with the ad looping
            this.started = true;
            //get the player instance 
            let inst = oldPlayerSDKMap.get(json.container);
            if (!inst) {
                //note here (TODO) this is not the JSON creative
                //but only a config object.
                inst = makePlayer(json.container, json);
                this.player = inst;
                oldPlayerSDKMap.set(json.container, inst);
            }
            inst.changeCfg(json);
        },
        play: function() {
            this.player.play();
        }
    }
    window.onJXPlayerReady(playerObj);
}



