const modulesmgr            = require('../basic/modulesmgr');

const mpcommon              = modulesmgr.get('osmpartners/common');

// this is a bit stupid, but not changing it b4 my trip 20211111 renee note
function makeNormalizedObj_(dbjson, instID, getPageSelectorFcn, cfgBlob) {
    return mpcommon.packRTJsonObj(dbjson, instID, getPageSelectorFcn, cfgBlob, makeNormalizedObj__);
}

/**
 * 
 * @param {*} dbjson 
 * @param {*} rtjson 
 * @param {*} getPageSelectorFcn 
 * @param {*} cfgBlob 
 * @returns rtjson which has these key fields:
 *  - msgs object
 *  - scriptb <--- the script to stick onto the page.
 *  - createslot: {
 *      diffscroll: true or false <-- will be false for spotx
 *         (this flag tells the osm core layer whether to do diffscroll for it). 
 *         Spotx is all video ads
 *      parent: an HTML node object
 *      div: {
 *          id: sslot,
 *           css: `width:100%;`,
 *           node: null <-- will be filled in later by the osm core code.
 *      }
 *    }
 *  - visibilityslot: {
 *      selector: `#${sslot}`,
 *       node: null
 *    }
 */
function makeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn, cfgBlob) {
    rtjson.msgs = {
        cv: `jxosm_cv_spotx`, //`jxosm_cv_spotx`,
        noad: `jxosm_noad_spotx`, //`jxosm_noad_spotx`,
        imp: `jxosm_imp_spotx`, //`jxosm_noad_spotx`,
        timeout: `jxosm_timeout_spotx` //`jxosm_noad_spotx`,
    };

    //<---
    let instID = rtjson.instID;
    const comParams = {
        placement_type: 3,
        content_type: "video",
        ad_unit: "incontent",
        https: 1,
        //So thankfully spotx already 'has' these ad_done_function
        //and ad_impression_function in their interfacing. So we just define (create) these functions
        //and let them be hooked up here then.
        ad_done_function: "spotxNoAd" + instID,
        ad_impression_function: "spotxImp" + instID
    };
    let placing = dbjson.adparameters.placing;
    let otherParams;

    let dividAd = `ctr${instID}`;
    
    //---- for spotx  we set up all these
    //instructional constructrs for the jxosmcore_ layer first.
    //where to hang the script, what slot to monitor for visbility
    //what message (post) to expect to check noad/imp etc
    if (placing == 'fixed') {
        //then the parent is actually the #body
        //then attach that created div
        //then the script is attached to that div!!
        otherParams = dbjson.adparameters.fixed; 
        rtjson.scriptselector = `body`; 
        rtjson.floating = true;
        rtjson.visibilityslot = { selector: dividAd, node: null };
    }
    else {
        //normal in-article type:
        //find the node in the page to hang the outstream.
        //And this node is supposed to be the "model" where spotx
        //model after to do the width etc of the outstream
        //(thru target_width_element)
        //So we need to give that element an id if there is none:
        //We create ctr12345 in this node to be the actual ad container
        //(tell to spotx via content_container_id)
        let aNode = mpcommon.getAdSlotAttachNode(dbjson, getPageSelectorFcn);
        //let aNode = getAdSlotAttachNode_(dbjson, getPageSelectorFcn);
        if (!aNode) {
            return false;
        }
        if (!aNode.node.id) {
            aNode.node.id = 'jxadslotparent_' + instID;
        }
        otherParams = {
            target_width_element: aNode.node.id, 
            content_container_id: dividAd
        };
        // so the osm core layer will obey these instructions below 
        // to create the div accordingly:
        rtjson.createslot = {
            parent : aNode,
            div : { id: dividAd }
        };
        // osm core layer will use this as the thing to look for in vis
        // tracking
        rtjson.visibilityslot = {
            selector: `#${dividAd}`,
            node: null
        };
    }
    //--->

    /*
    javascript
    */
    //<--
    //Now we go generate the fragment/script, a bit more complicated than
    //other partners coz many things can be configured and difference
    //between inarticle and floating
    let adserverParams = dbjson.adparameters.play;
    if (!adserverParams) adserverParams = {};
    let attrStr = ``;
    const finalObj = Object.assign({}, comParams, otherParams, adserverParams);
    for (var prop in finalObj) {
        attrStr += ` data-spotx_${prop}="${finalObj[prop]}" `;
    }
    let divstr1 = "";
    let divstr2 = "";
    /*
    {"adparameters": {"play": {"autoplay": 1, "ad_skippable": 1, "ad_skip_delay": 5, "media_transcoding": "low", "continue_out_of_view": 1}, "fixed": {"mobile": {"content_width": 300, "content_height": 168}, "desktop": {"content_width": 301, "content_height": 169}}, "placing": "fixed", "channel_id": 79391}}
    */
    if (placing == 'fixed') {
        let szBlob = dbjson.adparameters.fixed; 
        //expected to look like the above... example json
        divstr1 = `<div id="${dividAd}" style = "width:${szBlob.content_width}px; !important; height:${szBlob.content_height}px; !important;z-index:99999999999;position:fixed;bottom:0px;left: 0;">`;
        divstr2 = '</div>';
    }
    rtjson.scriptb = `
    ${divstr1}            
    <script type="text/javascript">
        function spotxImp${instID}()  {
            window.postMessage("${rtjson.msgs.imp}", "*");
        }
        function spotxNoAd${instID}(adFound)  {
            if(!adFound)  
                window.postMessage("${rtjson.msgs.noad}", "*");
        }
        </script>
        <script type="text/javascript" src="//js.spotx.tv/easi/v1/${dbjson.adparameters.channel_id}.js" 
        data-spotx_channel_id="${dbjson.adparameters.channel_id}"  
        ${attrStr} ></script>${divstr2}`;
    //scriptb body formed -->
    return true;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'spotx';

/* 
 ************** module: osmpartners/spotx **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the osm core JS can use to inject spotx ad script etc

        - the output object has the following properties
        timeout (-1 means dun have any)
        partner (here it will be "spotx")
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
            - none for the case of spotx
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
