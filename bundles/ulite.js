/**
 * . Bundle built for a universal lite
 * Unable to play those exotic player DM, YT etc
 */
if (window.jxuniversallite) {
    return;
}


const modulesmgr                    = require('../components/basic/modulesmgr');
const helpers                       = require('../components/renderer/helpers');
modulesmgr.set('renderer/helpers',     helpers);

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

window.jxuniversallite = start_;

