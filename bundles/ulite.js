/**
 * Bundle built to make universal (general outstream player)
 * 
 * Documentation: refer to ulite.md file in this same dir
 */

if (window.jxuniversal) {
    return;
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

window.jxuniversal = { init: start_}; 

