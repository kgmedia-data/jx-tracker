/**
 * Bundle built to make OSM script (non OSM)
 */
if (window.jxoutstreammgr && window.jxoutstreammgr.init) {
    return;
}
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
        init: function(options) {
            //Perhaps this should also maintain a map
            mrenderer.createInstance(options);
        }
    };
}
//-->

const mosmcore      = require('../components/osmengine/core');
const mpginfo       = require('../components/basic/pginfo');
const mids          = require('../components/basic/ids');

var instMap = new Map();

function start(options) {
    let hashStr = btoa(JSON.stringify(options));
    let instMaybe = instMap.get(hashStr);
    if (instMaybe) {
        return;
    }
    const ids = mids.get();
    const pginfo = mpginfo.get();
    let merged = Object.assign({}, ids, pginfo, options);

    var osmInst = mosmcore.createInstance(merged, {
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

