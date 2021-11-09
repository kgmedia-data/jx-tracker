const defaultPTimeout_ = -1;

var getAdSlotAttachNode_ = function(dbjson, getPageSelectorFcn) {
    if (dbjson.adparameters.selectors) {
        let selectors = dbjson.adparameters.selectors;
        for (var i = 0; i < selectors.length; i++) {
            let sel = null;
            try {
                sel = jxsel(selectors[i]);
            } catch (er) {}
            if (sel && sel.length >= 1 && sel[0] &&
                (sel[0].nodeName == 'DIV' || sel[0].nodeName == 'P')) {
                return {
                    node: sel[0],
                    selector: selectors[i]
                }
            }
        } //for
    }
    if (getPageSelectorFcn) {
        let out = getPageSelectorFcn();
        if (out)
            return out;
    }
}

function makeNormalizedObj_({
    dbjson,
    instID,
    getPageSlotFcn,
    fixedHeightBlob
}) {
    //rtjson prepared.
    let rtjson = {
        timeout: dbjson.timeout ? dbjson.timeout : defaultPTimeout_,
        partner: dbjson.subtype, //for debug printout only
        trackers: dbjson.trackers,
        stackidx: dbjson.stackidx,
        stackdepth: dbjson.stackdepth,
        instID: instID,
        valid: false
    }; {
        if (makeNormalizedObj__(dbjson, rtjson, getPageSlotFcn, fixedHeightBlob)) {
            delete dbjson.trackers;
            rtjson.valid = true;
            return rtjson;
        }
    }
    return rtjson;
}

function common_(rtjson) {
    rtjson.customfcns = {};
    rtjson.scriptdiv = {
        id: "scriptdiv" + rtjson.instID,
        style: "all:initial;"
    };
}

function makeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn) {
    dbjson.adparameters =  {"div_id": "AdTrackGenericOutstreamDesktop", "script_src": "https://delivery.r2b2.io/get/kompas.com/generic/outstream"};
    common_(rtjson);
    rtjson.msgs = {
        noad: 'jxosm_noad_r2b2', 
        imp: 'jxosm_imp_r2b2', 
        timeout: 'jxosm_timeout_r2b2'
    };
    rtjson.scriptb = `<script type="text/javascript" src="https://delivery.r2b2.io/get/kompas.com/generic/outstream"></script>`;
    
    //`<script type="text/javascript" src="dbjson.adparameters.scripturl"></script>`;
    //`<div id="AdTrackGenericOutstreamDesktop"></div><script type="text/javascript" src="https://delivery.r2b2.io/get/kompas.com/generic/outstream"></script>`;
    
     //   `<script type="text/javascript" class="teads" src="//a.teads.tv/page/${dbjson.adparameters.pageId}/tag" async="true"></script>`;
    let aNode = getAdSlotAttachNode_(dbjson, getPageSelectorFcn);
    //let's try something different to try to solve the teads problem.
    if (false) {
        //we try this new approach
        //we do not create a new DIV .
        //we just put the div ID onto that thing (a paragraph) identified by the selector.
        if (!aNode) {
            return false;
        }
        let slotid = dbjson.adparameters.pageId == '126472' ? 'divid_jxosm_teads' : `divid_jxosm_teads_${dbjson.adparameters.pageId}`;
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
        rtjson.createslot = {};
        rtjson.createslot.parent = aNode;
        //this old stupid one I did wrongly!
        //let sslot = dbjson.adparameters.pageId == '126472' ? 'divid_jxosm_teads' : `divid_jxosm_teads_${dbjson.adparameters.pageId}`;
        let sslot = 'AdTrackGenericOutstreamDesktop';
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
