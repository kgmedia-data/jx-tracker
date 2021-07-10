/**
 * Bundle built for a universal lite
 * Unable to play those exotic player DM, YT etc
 */
if (window.jxuniversallite) {
    return;
}

//yes we should move the adrequest formation(ids, pageinfo) outside
//of renderer so that renderer can be as small as possible
//e.g. hbrenderer does not need all those junk

//const madreq        = require('../components/basic/adreq');
//const mids          = require('../components/basic/ids'); 
//const mpginfo       = require('../components/basic/pginfo');
const mrenderer     = require('../components/renderer/core');

var instMap = new Map();

function start_(options) {
    let hashStr = btoa(JSON.stringify(options));
    let instMaybe = instMap.get(hashStr);
    if (instMaybe) {
        return;
    }
    //TODO 
    //var ids = mids.get();
    //var pginfo = mpginfo.get(option); 
    //Where to form the adtag
    var uliteInst = mrenderer.createInstance(options);
    instMap.set(hashStr, uliteInst);
    console.log(hashStr);
    console.log("added to hash: new siz=" + instMap.size);
}

window.jxuniversallite = start_;

