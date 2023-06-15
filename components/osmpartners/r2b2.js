const modulesmgr            = require('../basic/modulesmgr');
const mpcommon              = modulesmgr.get('osmpartners/common');

// this is a bit stupid, but not changing it b4 my trip 20211111 renee note
function makeNormalizedObj_(dbjson, instID, getPageSelectorFcn, fixedHeightBlob) {
    return mpcommon.packRTJsonObj(dbjson, instID, getPageSelectorFcn, fixedHeightBlob, makeNormalizedObj__);
}

/**
 * Refer to ./normalizedObj.md for details
 * @param {*} dbjson the assets for the tag. expect to have some ids in the adparameters subject typically
 * @param {*} rtjson partially filled normalized objects for us to add some
 * more stuff specific to this partner
 * @returns 
 */
function makeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn) {
    rtjson.msgs = {
        noad: 'jxosm_noad_r2b2', 
        imp: 'jxosm_imp_r2b2', 
        timeout: 'jxosm_timeout_r2b2'
    };
    rtjson.scriptb = `<script type="text/javascript" src="${dbjson.adparameters.script_src}"></script>`;
    let aNode = mpcommon.getAdSlotAttachNode(dbjson, getPageSelectorFcn);
    if (true) {
        if (!aNode) return false;
        /**
         * well, the partner dictates to put the ad in a certain div
         * so we just put the div in div_id of the adparameters
         * Here will be create the div in the osm slot then
         * 
         * Foreseeable problem is that they are fixed using 1 div id
         * ..... what if the page has several of their scripts (hope that will not happen)
         */
        rtjson.createslot = {
            diffscroll: false
        };
        rtjson.createslot.parent = aNode;
        rtjson.createslot.div = {
            id: `${dbjson.adparameters.div_id}`,
            css: `width:100%;`,
            node: null
        };
        rtjson.visibilityslot = {
            selector: `#${dbjson.adparameters.div_id}`,
            node: null
        };
    }
    return true;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'r2b2';

/* 
 ************** module: osmpartners/teads **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the osm core JS can use to inject teads ad script etc

      Refer to ./normalizedObj.md for details
    
* requires/dependencies:
    - none
*/
