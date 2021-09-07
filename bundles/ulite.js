/**
 * Bundle built to make universal (general outstream player)
 * 
 * Documentation: refer to ulite.md file in this same dir
 */

DO_NOT_REMOVE_GULPBUILD_REPLACE_FLOAT_COND_COMPILE

if (JX_FLOAT_COND_COMPILE) {
    if (window.jxuniversalflt) {
        return;
    }
}
else {
    if (window.jxuniversal) {
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
const mids                          = require('../components/basic/ids');

var instMap = new Map();

function start_(options) {
    const ids = mids.get();
    const pginfo = mpginfo.get();

    let hashStr = btoa(JSON.stringify(options));
    let instMaybe = instMap.get(hashStr);
    if (instMaybe) {
        return;
    }
    let merged = Object.assign({}, ids, pginfo, options);
    var uliteInst = mrenderer.createInstance(merged);
    instMap.set(hashStr, uliteInst);
}

var ourSigQ = '';
if (JX_FLOAT_COND_COMPILE) {
    console.log(`MIOW TYPE 1`);
    ourSigQ = '_jxuniversalfltq';
    window.jxuniversalflt = { init: start_}; 
}
else {
    console.log(`MIOW TYPE 2`);
    ourSigQ = '_jxuniversalq';
    window.jxuniversal = { init: start_}; 
}

//this is a now-common design-pattern so that the code calling us
//can just call us without checking if our script is loaded yet.
/*
window.jxuniversalq = window.jxuniversalq || [];
window.jxuniversalq.push('init', p);
*/
var JxEventsQ = function () {
    this.push = function () {
        for (var i = 0; i < arguments.length; i++) try {
            if (typeof arguments[i][0] === "string") {
                let fcnname = arguments[i][0];
                if (fcnname == 'init' && arguments[i].length >= 2) {
                    start_(
                     arguments[i][1]
                    );
                }
            }
        } catch (e) {}
    }
};

var _old_eventsq = window[ourSigQ];
window[ourSigQ] = new JxEventsQ(); //actually no need object, just cloned from some website's snipplet .. :-)
// execute all of the queued up events - apply() turns the array entries into individual arguments
if (_old_eventsq)
    window[ourSigQ].push.apply(window[ourSigQ], _old_eventsq);
