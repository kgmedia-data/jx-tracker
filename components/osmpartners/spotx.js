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
/**
 * Refer to ./normalizedObj.md for details
 * @param {*} dbjson the assets for the tag. expect to have some ids in the adparameters subject typically
 * @param {*} rtjson partially filled normalized objects for us to add some
 * more stuff specific to this partner
 * @returns 
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
        ad_impression_function: "spotxImp" + instID,
        ad_error_function: "spotxErr" + instID
    };
    let placing = dbjson.adparameters.placing;
    let otherParams;
    let dividAd = `ctr${instID}`;
    let adserverParams = dbjson.adparameters.play;
    if (!adserverParams) adserverParams = {};
    
    
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
        //For in article better have some guideline to constrain the width
        //else it will be very big esp for desktop
        let width = 300;
        if (aNode.node && !isNaN(aNode.node.offsetWidth)) {
            width = aNode.node.offsetWidth;
        }
        if (width > 600) {
            width = 600;
        }
        otherParams.content_width = width;
    }
    //--->

    /*
    javascript
    */
    //<--
    //Now we go generate the fragment/script, a bit more complicated than
    //other partners coz many things can be configured and difference
    //between inarticle and floating
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
        function spotxErr${instID}()  {
            window.postMessage("${rtjson.msgs.noad}", "*");
        }
        function spotxImp${instID}()  {
            window.postMessage("${rtjson.msgs.imp}", "*");
        }
        function spotxNoAd${instID}(adFound)  {
            if(!adFound) { 
                window.postMessage("${rtjson.msgs.noad}", "*");
            }
        }
        </script>
        <script type="text/javascript" src="//js.spotx.tv/easi/v1/${dbjson.adparameters.channel_id}.js" 
        data-spotx_channel_id="${dbjson.adparameters.channel_id}"  
        ${attrStr} ></script>${divstr2}`;
    
    let styles = dbjson.adparameters.forced_styles;
    if (Array.isArray(styles)) {
        //some publishers has some css rules that will make e.g. all the iframes inside 
        //certain divs all become 'relative'.
        //So we need to "fight back"
        // Coz the spotx creatives a div and then an iframe inside their allocated container
        // and the iframe must be absolute positioned
        for (var i = 0; i < styles.length; i++) {
            let sheet = document.createElement('style')
            let exp = styles[i].replace(/%%DIVID%%/g, dividAd);
            //let final = `#${dividAd} > div > iframe {position: absolute !important;}`;
            sheet.innerHTML = exp;
            document.body.appendChild(sheet);
        }
    }
    /* does not work lah
    var donedone = false;
    setInterval(function(){ 
        if (donedone) return;
        try {
        let x = document.getElementById(dividAd);
        let y  = x.getElementsByTagName("iframe");
        if (y && y.length) {
            donedone = true;
            //y[0].style="position:absolute !important";
            y[0].style.position ="absolute !important";
        }
        }
        catch(e) {
            alert(e);
        }
    }, 5000);
    */
    return true;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'spotx';

/* 
 ************** module: osmpartners/spotx **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the osm core JS can use to inject spotx ad script etc
        Refer to ./normalizedObj.md for details
        
* requires/dependencies:
    - none
*/
