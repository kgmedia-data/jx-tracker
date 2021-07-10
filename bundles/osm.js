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

