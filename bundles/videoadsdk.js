/**
 * Bundle built to make videoad player JS to be used by Jixie's own renderer
 * (i.e. outstream, OSM)
 * Vs the other one (for publisher to use standalone which is videoadsdk-standalone.js)
 * 
 * Documentation: refer to videoadsdk.md file in this same dir
 */

/**
 * 
 * 
 * START OF PART 1 of Standard template stuff for a new creative type 
 * This thing can easily be trusted and non-trusted (depends on how renderer create us)
 * 
 * 
 */
if (window.jxvideoadsdk) { 
    //something particular to this creative form.
    //this signature is known to the renderer
    return;
}
window.jxvideoadsdk = 1;
const ourSig = 'jxvideoadsdk';
const ourSigQ = '_jxvideoadsdkq';
                 

var trusted = false;
if (window.jxrenderercore) {
    //then we know we as a creative were created as trusted
    //since we are in the same window as the renderer.
    trusted = true;
}

/**
 * 
 * 
 * END OF PART 1 of Standard template stuff for a new creative type PART
 * 
 * 
 */

 
const modulesmgr                       = require('../components/basic/modulesmgr');
const cssmgr                           = require('../components/video/cssmgr');
modulesmgr.set('video/cssmgr',         cssmgr);

// For style this is a bit different from the default one (for video SDK)
const stylesSet                        = require('../components/video-styles/videoad');


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

const common                           = require('../components/basic/common');
modulesmgr.set('basic/common',         common);

const consts                            = require('../components/video/consts'); 
modulesmgr.set('video/consts',          consts);

const adctrls_fact                      = require('../components/video/adctrls-factory');
modulesmgr.set('video/adctrls-factory', adctrls_fact);

const admgr_fact                        = require('../components/video/admgr-factory');
modulesmgr.set('video/admgr-factory',   admgr_fact);

const spinner_fact                      = require('../components/video/spinner-factory');
modulesmgr.set('video/spinner-factory',   spinner_fact);

const replaybtn_fact                    = require('../components/video/replaybtn-factory');
modulesmgr.set('video/replaybtn-factory',  replaybtn_fact);

const horizbanner_fact                  = require('../components/video/horizbanner-factory');
modulesmgr.set('video/horizbanner-factory',   horizbanner_fact);


const createObject                       = require('../components/video/adplayer');


var instMap = new Map(); //if we just always impose that if used from universal, then it's in
                         //iframe, then this Map is a bit stupid (only 1 item)  
function makePlayer(containerId, adparameters, config = null, eventsVector = null) {
    if (!containerId) {
        containerId = 'default';
    }
    let instMaybe = instMap.get(containerId);
    if (instMaybe) {
        return;
    }
    //let tmp = stylesSet.makeCls(options.container);
    //cssmgr.init(containerId, tmp, stylesSet.makeStyles(tmp));
    //cssmgr.inject(containerId, 'adControls', { color: '#FF0000'});
    cssmgr.init(containerId, stylesSet, {controls: {adcolor: '#FF0000'}}, []);


    let playerInst = createObject(containerId, adparameters, config, eventsVector, notifyMaster);
    instMap.set(containerId, playerInst);
    return playerInst;
}



/**
 * 
 * 
 * START OF PART 2 of Standard template stuff for a new creative type 
 * This thing can easily be trusted and non-trusted (depends on how renderer create us)
 * 
 * 
 */

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
    if (!json.token) {
        json.token = 'default';
    }
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

if (!trusted) {
    window.addEventListener('message', listen, false);
    notifyMaster('jxloaded', ourSig);
}

//NOTE: If want to resize can call this:
//notifyMaster('size', ourSig, {height: 512});

function notifyMaster(type, token, data = null) { 
    let msgStr = '';
    if (type == 'jxloaded') {
        token = window.name;
    }
    let obj = {
        type: type,
        token: token
    };
    if (data) {
        obj.params = data;
    }
    msgStr = "jxmsg::" + JSON.stringify(obj);
    if (trusted) { //it is just a function call then
        window.jxrenderercore.notify(type, token, data);
        //OR you can call like this:
        //window.jxrenderercore.notifyByStr(msgStr);
    }
    else {
        parent.postMessage(msgStr, '*'); 
    }
}

    var JxEventsQ = function () {
        this.push = function () {
            for (var i = 0; i < arguments.length; i++) try {
                if (typeof arguments[i][0] === "string") {
                    let fcnname = arguments[i][0];
                    if (fcnname == 'message' && arguments[i].length >= 2) {
                        listen({
                         data:   arguments[i][1]
                        });
                    }
                }
            } catch (e) {}
        }
    };
    // get the existing queue array
    var _old_eventsq = window[ourSigQ];
    //console.log(`#### when videoadsdk comes the queue is like this: ${_old_eventsq.length}`);
    // create a new  object
    window[ourSigQ] = new JxEventsQ(); //actually no need object, just cloned from some website's snipplet .. :-)
    // execute all of the queued up events - apply() turns the array entries into individual arguments
    if (_old_eventsq)
        window[ourSigQ].push.apply(window[ourSigQ], _old_eventsq);
/**
 * 
 * 
 * END OF PART 2 of Standard template stuff for a new creative type 
 * This thing can easily be trusted and non-trusted (depends on how renderer create us)
 * 
 * 
 */
