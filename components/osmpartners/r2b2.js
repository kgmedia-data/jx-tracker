const modulesmgr            = require('../basic/modulesmgr');
const mpcommon              = modulesmgr.get('osmpartners/common');

// this is a bit stupid, but not changing it b4 my trip 20211111 renee note
function makeNormalizedObj_(dbjson, instID, getPageSelectorFcn, fixedHeightBlob) {
    return mpcommon.packRTJsonObj(dbjson, instID, getPageSelectorFcn, fixedHeightBlob, makeNormalizedObj__);
}

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

        - the output object has the following properties
        timeout (-1 means dun have any)
        partner (here it will be "teads")
        trackers
        stackidx
        stackdepth
        instID: 
        valid: true/false

        scriptdiv : {
            id: 
            style: 
        };

        

        createslot: {  <-- for the osm core when creating the div for the script
            parent: {
                - the HTML element to attach the created slot to
                node - if node is present, corejs uses code, else use selector
                selector
            },
            div: { 
                id: id to give to the div to create
                css: any special css to add
            }
        }
        
        msgs : an object of the messages to expect from partner script to inform of
            noad, hasad, impression   
            core js uses this to map incoming messages to 'noad', 'imp' etc and act accordingly            
        
        customfcns  : {
            - none for the case of teads
        }

        visibilityslot : {
            - the visibility measurement done by core.js , which container should it monitor?:
            selector: 
        }

        scriptb: the script to inject (string)
           a partner must have either scriptb or scriptcfg! Unruly case there is scriptb
        scriptcfg: the module's runCreative function, if any, will be called with this cfg.

        scriptdiv = {
            inject the unruly script into a div of this id and style
            id: 
            style:
        }
        scriptselector - the selector to describe the parent to which to hang the script div

        floating - boolean - float or not is not managed by us but by the partner. 
           we just need to know for the sake of creative view events generation
    
* requires/dependencies:
    - none
*/
