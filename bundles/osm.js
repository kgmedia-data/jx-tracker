/**
 * Bundle built to make OSM script (non OSM)
 */
if (window.jxoutstreammgr && window.jxoutstreammgr.init) {
    return;
}
/** TODO TODO TODO 
 * need to form adtag:
 * client_id, pageurl, unit, source=osm
 * -->adtagurl
 * then internally they want to augment with hack it is up to them
 */
const mpjixie       = require('../components/osmpartners/jixie');
const mpsm          = require('../components/osmpartners/selectmedia');
const mpteads       = require('../components/osmpartners/teads');
const mpunruly      = require('../components/osmpartners/unruly');

//<-- If we want, we can build the renderer code right in
//    of course our script will be much bigger than.
//    If e.g. Teads has a ad (say, as top of waterfall), then
//    the JX renderer stuff would have been included in vain.
const mrenderer     = require('../components/renderer/core');
if (!window.jxrenderer) {
    //check the exact prop name. this is just the idea only
    //then this will be accessible by any other things inside
    //the same window!
    window.jxrenderer = {
        start: function(options) {
            //Perhaps this should also maintain a map
            mrenderer.createInstance(options);
        }
    };
}
//-->




const mosmcore      = require('../components/osmengine/core');

var instMap = new Map();

function start(options) {
    let hashStr = btoa(JSON.stringify(options));
    let instMaybe = instMap.get(hashStr);
    if (instMaybe) {
        return;
    }
    var osmInst = mosmcore.createInstance(options, {
            jixie: mpjixie,
            selectmedia: mpsm,
            teads: mpteads,
            unruly: mpunruly
    });
    instMap.set(hashStr, osmInst);
}

window.jxoutstreammgr = {
    init: start
};

