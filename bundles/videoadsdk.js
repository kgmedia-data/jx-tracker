//THIS ONE IS WIP ..... NOT READY YET
//the one used for playing our own ads
//jxvideo.1.4.min.js

//But now I want to make it built from our building blocks under /video instead
//Add the stuff to handle the video+banner

/**
 * Bundle built for the jixie "player SDK"
 */
if (window.jxvideoadsdk) { //<--- NEW LEH
    return;
}
 
const modulesmgr                       = require('../components/basic/modulesmgr');
const cssmgr                           = require('../components/video/cssmgr');
modulesmgr.set('video/cssmgr',         cssmgr);

const stylesSet                        = require('../components/video-styles/videoad');//we choose this set of style
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

//actually no need lah.
const createObject                       = require('../components/video/adplayer');
//modulesmgr.set('video/adplayer',   adplayer);


var instMap = new Map();   
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
// it works just like the 
//this new type is via postmessage yes.
//if there is a p it will also use lah.
//just put it in iframe lah.
//then jxvisible is one type.
//adparameters is another type.
//message fly everywhere problem.
//let's try first the no iframe one lah.
//else next time you this problem no solved ah.

function listen(e) {
    let json = null;
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

//const mySig = 'jx_video_ad';

//but this is s
//this is one-off per script.
//but the subsequent instances have problem.
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
    const exposedWinPropName_ = 'jxuniversallite';
    if (window[exposedWinPropName_])
        window.postMessage(msgStr, '*'); //HACK 
    else
        parent.postMessage(msgStr, '*'); //HACK 
}

/*
window.JX = {
    player :  function(options) {
        return (makePlayer(options, null));
    },
    ampplayer : function(options, ampIntegration) {
        options.amp = true;//augment
        let metadata = ampIntegration.getMetadata();
        let canonUrl = metadata.canonicalUrl;
        options.pageurl = canonUrl;//augment
        helpers.sendScriptLoadedTrackerAMP({pageurl: canonUrl, dbgVersion: dbgVersion});
        return (makePlayer(options, ampIntegration));
    }
};
*/
//wait for incoming loh.


