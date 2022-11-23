const modulesmgr            = require('../basic/modulesmgr');

const mpcommon              = modulesmgr.get('osmpartners/common');


function makeNormalizedObj_(dbjson, instID, getPageSelectorFcn, cfgBlob) {
    dbjson.timeout = 10000; //temp try this due to SM complaints
    return mpcommon.packRTJsonObj(dbjson, instID, getPageSelectorFcn, cfgBlob, makeNormalizedObj__);
}

function makeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn, cfgBlob) {
    let appId = dbjson.adparameters.appId;
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
             "style": "static",
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

        - the output object has the following properties
        timeout (-1 means dun have any: mean if by then still no ad detected, then we rip it out
        partner (here it will be "teads")
        trackers
        stackidx
        stackdepth
        instID: 
        valid: true/false


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
            inview <-- for impactify when the visibiltyslot comes inview we will run a function
            (see the above code to see why)
        }

        visibilityslot : {
            //the visilibyt measurement done by core.js , which container should it monitor?:
            selector: 
        }

        scriptb: the script to inject (string)
           a partner must have either scriptb or scriptcfg! impactify case there is scriptb
        scriptcfg: the module's runCreative function, if any, will be called with this cfg.

        scriptdiv = {
            inject the impactify script into a div of this id and style
            id: 
            style:
        }
        scriptselector - the selector to describe the parent to which to hang the script div

        floating - boolean - float or not is not managed by us but by the partner. 
           we just need to know for the sake of creative view events generation
    
* requires/dependencies:
    - none
*/