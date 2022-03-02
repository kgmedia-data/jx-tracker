/**
 * Bundle built to make universal (general outstream player)
 * 
 * Documentation: refer to ulite.md file in this same dir
 */

DO_NOT_REMOVE_GULPBUILD_REPLACE_FLOAT_COND_COMPILE

if (JX_FLOAT_COND_COMPILE) {
    if (window.jxuniv) {
        return;
    }
}
else {
    if (window.jxuniv) {
        return;
    }
}



const modulesmgr                    = require('../components/basic/modulesmgr');
const common                        = require('../components/basic/common');
modulesmgr.set('basic/common',     common);

const univelements                  = require('../components/renderer/univelements');
modulesmgr.set('renderer/univelements',         univelements);

const mrenderer                     = require('../components/renderer/core');
const mpginfo                       = require('../components/basic/pginfo');
const mids                          = require('../components/basic/idslite');

var instMap = new Map();

function start_(options) {
    const ids = mids.get();
    const pginfo = mpginfo.get();

    let hashStr = btoa(JSON.stringify(options));
    let instMaybe = instMap.get(hashStr);
    if (instMaybe) {
        return;
    }
    let merged = Object.assign({}, pginfo, options);
    merged.ids = ids;
    var uliteInst = mrenderer.createInstance(merged);
    instMap.set(hashStr, uliteInst);
}


var ourSigQ = '';
if (JX_FLOAT_COND_COMPILE) {
    ourSigQ = '_jxuniv';
    window.jxuniv = { init: start_}; 
}
else {
    ourSigQ = '_jxuniv';
    window.jxuniv = { init: start_}; 
}

//this is a now-common design-pattern so that the code calling us
//can just call us without checking if our script is loaded yet.
/*
window.jxuniversalq = window.jxuniversalq || [];
window.jxuniversalq.push('init', p);
*/

var JxEventsQ = function () {
    this.push = function () {
        for (var i = 0; i < arguments.length; i++) {
            try {
                if (Array.isArray(arguments[i]) && arguments[i][0] == 'init') {
                    start_(arguments[i][1]);    
                }
                else 
                    start_(arguments[i]);
      
            } catch (e) {}
        }
    }
};
/*
window._jxuniv = window._jxuniv || [];
window._jxuniv.push({
    maxwidth: 640,
    unit: "62dfd0d28588b4a2ed791b90dda06fce", // TO BE REPLACED WITH THE AD UNIT ID (HERE IT IS DEMO ONLY)
    container: "jxOutstreamContainer",
    creativeid: 1707, 
});*/

var _old_eventsq = window[ourSigQ];
if (!_old_eventsq) {
    _old_eventsq = window.jxuniversalq; //in case still got anybody using it like this?
}

window[ourSigQ] = new JxEventsQ(); //actually no need object, just cloned from some website's snipplet .. :-)
window.jxuniversalq = window[ourSigQ];//in case still got anyone using it like this

// execute all of the queued up events - apply() turns the array entries into individual arguments
if (_old_eventsq)
    window[ourSigQ].push.apply(window[ourSigQ], _old_eventsq);

