const modulesmgr            = require('../basic/modulesmgr');

const mpcommon              = modulesmgr.get('osmpartners/common');

// this is a bit stupid, but not changing it b4 my trip 20211111 renee note
function makeNormalizedObj_(dbjson, instID, getPageSelectorFcn, cfgBlob) {
    return mpcommon.packRTJsonObj(dbjson, instID, getPageSelectorFcn, cfgBlob, makeNormalizedObj__);
}

/**
 * Refer to ./normalizedObj.md for details
 * @param {*} dbjson the assets for the tag. expect to have some ids in the adparameters subject typically
 * @param {*} rtjson partially filled normalized objects for us to add some
 * more stuff specific to this partner
 * @returns 
 */
function makeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn, cfgBlob) {
    let pageId = dbjson.adparameters.pageId;
    if (cfgBlob.poverrides && cfgBlob.poverrides.teads) {
        pageId = cfgBlob.poverrides.teads.pageId;
    }
    rtjson.msgs = {
        //I stupid last time
        cv: `jxosm_cv_teads_${pageId}` + `${pageId==126472?'x137811':''}`, //`jxosm_cv_teads`,
        hasad: `jxosm_hasad_teads_${pageId}` + `${pageId==126472?'x137811':''}`, //`jxosm_noad_teads`,
        noad: `jxosm_noad_teads_${pageId}` + `${pageId==126472?'x137811':''}`, //`jxosm_noad_teads`,
        imp: `jxosm_imp_teads_${pageId}` + `${pageId==126472?'x137811':''}`, //`jxosm_noad_teads`,
        timeout: `jxosm_timeout_teads_${pageId}` + `${pageId==126472?'x137811':''}` //`jxosm_noad_teads`,
    };
    /*
    javascript
    */
    rtjson.scriptb =
        `<script type="text/javascript" class="teads" src="//a.teads.tv/page/${pageId}/tag" async="true"></script>`;
    let aNode = mpcommon.getAdSlotAttachNode(dbjson, getPageSelectorFcn);
    //let's try something different to try to solve the teads problem.
    if (false) {
        //we try this new approach
        //we do not create a new DIV .
        //we just put the div ID onto that thing (a paragraph) identified by the selector.
        if (!aNode) {
            return false;
        }
        let slotid = pageId == '126472' ? 'divid_jxosm_teads' : `divid_jxosm_teads_${pageId}`;
        if (!aNode.node.id) {
            aNode.node.id = slotid;
        }
        //we do not create any slot
        //we merely attach the id to the paragraph
        rtjson.visibilityslot = {
            selector: `#${slotid}`,
            node: null
        };
    }
    if (true) {
        //WE DUN COME INTO HERE. WE TRY SOMETHING ELSE NOW.
        // we are always, so-called integrated.
        //else the solution cannot work.
        if (!aNode) return false;
        /**
         * in the integrated case, the adslot unruly is set up to
         * lookup a div divid_jxosm_teads and put in the ad into that div.
         * This div does NOT exist originally on the page.
         * What happens is JXOSM go thru the selectors and find a node
         * that is present on the page. Then JXOSM create the div with id
         * divid_jxosm_teads as a child of it (and jxosmunrulyid will take the
         * width of that node)
         * This is a good way coz there is a definite slot to observe, as it
         * it controlled by JXOSM to be unique.
         * There can be multiple selectors specified but JXOSM will pick one that
         * really corresponds to something on the page.
         */
        rtjson.createslot = {
            diffscroll: true
        };
        rtjson.createslot.parent = aNode;
        //this old stupid one I did wrongly!
        let sslot = pageId == '126472' ? 'divid_jxosm_teads' : `divid_jxosm_teads_${pageId}`;
        rtjson.createslot.div = {
            id: sslot,
            css: `width:100%;`,
            node: null
        };
        rtjson.visibilityslot = {
            selector: `#${sslot}`,
            node: null
        };
    }
    return true;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'teads';

/* 
 ************** module: osmpartners/teads **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the osm core JS can use to inject teads ad script etc
        Refer to ./normalizedObj.md for details
    
* requires/dependencies:
    - none
*/
