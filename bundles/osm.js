/**
 * Bundle built to make OSM script (non AMP)
 * 
 * Documentation: refer to osm.md file in this same dir
 */
if (window.jxoutstreammgr && window.jxoutstreammgr.init) {
    return;
}
const modulesmgr    = require('../components/basic/modulesmgr');

const common                       = require('../components/basic/common');
modulesmgr.set('basic/common',     common);

const univelements  = require('../components/renderer/univelements-stub');
modulesmgr.set('renderer/univelements',         univelements);

const mpjixie       = require('../components/osmpartners/jixie');
const mpsm          = require('../components/osmpartners/selectmedia');
const mpteads       = require('../components/osmpartners/teads');
const mpunruly      = require('../components/osmpartners/unruly');

const osmWorkingDivId_ = 'osmdiv';

if (!document.getElementById(osmWorkingDivId_)) {
    var div = document.createElement("div");
    div.id = osmWorkingDivId_;
    div.style.display = "none;";
    div.style.visibility = "hidden";
    document.body.appendChild(div);
}

//<-- If we want, we can build the renderer code right in
//    of course our script will be much bigger then.
//    If e.g. Teads has a ad (say, as top of waterfall), then
//    the JX renderer stuff would have been included in vain.
const mrenderer     = require('../components/renderer/core');
if (!window.jxrenderer) {
    //this is for playing jixie ad
    //check the exact prop name. this is just the idea only
    //then this will be accessible by any other things inside
    //the same window!
    window.jxrenderer = {
        init: function(options) {
            //options.managerdiv = osmWorkingDivId_;
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
    //ability to handle a few OSM units on the page.
    //I assume the publisher is sensible enough to put different
    //selectors in the options. Else the ads will go haywire.
    options.managerdiv = osmWorkingDivId_;
    let hashStr = btoa(JSON.stringify(options));
    let instMaybe = instMap.get(hashStr);
    if (instMaybe) {
        return;
    }
    const ids = mids.get();
    const pginfo = mpginfo.get();
    let merged = Object.assign({}, ids, pginfo, options);
    //console.log(`###merged ${JSON.stringify(merged, null, 2)}`);

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

var JxOSMQ = function () {
    this.push = function () {
        for (var i = 0; i < arguments.length; i++) try {
            if (Array.isArray(arguments[i]) && arguments[i][0] == 'init') {
                start(arguments[i][1]);    
            }
            else 
                start(arguments[i]);
        } catch (e) {}
    }
};

// get the existing _jxoutstreammgrq array
var _old_jxoutstreammgrq = window._jxoutstreammgrq;
// create a new object
window._jxoutstreammgrq = new JxOSMQ(); //actually no need object, just cloned from some website's snipplet .. :-)
// execute all of the queued up events - apply() turns the array entries into individual arguments
if (_old_jxoutstreammgrq) {
    window._jxoutstreammgrq.push.apply(window._jxoutstreammgrq, _old_jxoutstreammgrq);
}


