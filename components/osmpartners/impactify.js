const modulesmgr            = require('../basic/modulesmgr');

const mpcommon              = modulesmgr.get('osmpartners/common');


function makeNormalizedObj_(dbjson, instID, getPageSelectorFcn, cfgBlob) {
    dbjson.timeout = 10000; //temp try this due to SM complaints
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
    let appId = dbjson.adparameters.appId;
    let style = dbjson.adparameters.style;
    if (!style) {
        style = 'static';
    }
    if (!appId) { appId = 'jixie.io'; }
    let instID = rtjson.instID;
    rtjson.msgs = {
        noad: `jxosm_noad_impactify${instID}`,
        imp: `jxosm_imp_impactify${instID}`,
        timeout: `jxosm_timeout_impactify${instID}`
    };
    
    let aNode = mpcommon.getAdSlotAttachNode(dbjson, getPageSelectorFcn);
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
        let pageId = 'default';
        let sslot = `divid_jxosm_impactify_${pageId}`;
        rtjson.createslot.div = {
            id: sslot,
            css: `width:100%;`,
            node: null
        };
        rtjson.visibilityslot = {
            selector: `#${sslot}`,
            node: null
        };
        rtjson.scriptb = `<script>window.impactifyTag = window.impactifyTag || [];
        impactifyTag.push({
             "appId": "${appId}",
              "container": "#${sslot}",
             "format": "screen",
             "style": "${style}",
             "onNoAd": function(){
                parent.postMessage("${rtjson.msgs.noad}", "*");
             },
             "onAd": function(){
                parent.postMessage("${rtjson.msgs.imp}", "*");
             },
             });
             (function(d, s, id) {
                 var js, ijs = d.getElementsByTagName(s)[0];
                 if (d.getElementById(id)) return;
                 js = d.createElement(s); js.id = id;
                 js.src = 'https://ad.impactify.io/static/ad/tag.js';
                 ijs.parentNode.insertBefore(js, ijs);
              }(document, 'script', 'impactify-sdk'));
          </script>`;
  
    return true;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'impactify';

/* 
 ************** module: osmpartners/impactify **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the osm core JS can use to inject impactify ad script etc

       Refer to ./normalizedObj.md for details
    
* requires/dependencies:
    - none
*/
