/**
 * partner type is Google (GAM) tag. passback
 * Needs to be served inside iframe (so it does not get interfered from the gpt settings on the main page)
 * 
 * CURRENTLY IT IS NOT USED. ANd not packed into an JS
 * We have some ADX tags from KG's Ridho.
 * We implement them as type=display, subtype=script,
 * and width = 320, height = 1
 * With that, then we take care of all of desktop/mobile/AMP
 * 
 * Using this way below, we only take care of desktop/mobile but not AMP
 * 
 * 
 */
const modulesmgr            = require('../basic/modulesmgr');
const mpcommon              = modulesmgr.get('osmpartners/common');
//            googletag.defineSlot('/19968336/header-bid-tag-0', [[300, 250], [300, 600]], 'div-gpt-ad-123456789-0').addService(googletag.pubads());
//googletag.defineSlot('${adP.adUnitPath}', ${adP.szSizes}, 'jxdiv${idBase}').setTargeting('${adP.tgtKey}', ['${adP.tgtValue}']).addService(googletag.pubads());
            
function makeText_(adP, idBase, noadMsg, impMsg) {
    let targetingClause = adP.tgtKey && adP.tgtValue ? `setTargeting('${adP.tgtKey}', ['${adP.tgtValue}']).`: '';
    return `
        window.googletag = window.googletag || {cmd: []};
        googletag.cmd.push(function() {
            googletag.defineSlot('${adP.adUnitPath}', ${adP.szSizes}, 'jxdiv${idBase}').${targetingClause}addService(googletag.pubads());
            googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                window.parent.document.getElementById('jxgptif${idBase}').height = (document.body.scrollHeight);
                window.parent.postMessage(event.isEmpty ? '${noadMsg}': '${impMsg}', '*');
            });                    
            googletag.enableServices();
            googletag.display('jxdiv${idBase}');
        });`;
}

//
function runCreative_(scriptcfg, cn) {
    let iFr = document.createElement('iframe');
    iFr.id = 'jxgptif' + scriptcfg.idBase;//just compose some unique name
    iFr.setAttribute('frameborder', '0');
    iFr.setAttribute('scrolling', 'no');
    iFr.setAttribute('allowTransparency', 'true');
    cn.appendChild(iFr);
    let jxinter = window.setInterval(function() {
        // put inside function 
        var iFrDoc = iFr.contentDocument || iFr.contentWindow.document;
        if(iFrDoc.readyState == "complete") {
            window.clearInterval(jxinter);
            //<---
            //1. script for GPT:
            let jsElt = iFrDoc.createElement('script');
            jsElt.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
            iFrDoc.body.appendChild(jsElt);

            //2. the DIV:
            var divElt = iFrDoc.createElement('div');
            divElt.id = 'jxdiv' + scriptcfg.idBase;
            divElt.style.textAlign = "center";
            divElt.style.verticalAlign = "middle";
            
            iFrDoc.body.appendChild(divElt);

            //3. the script, to stick inside the DIV from step 2
            let jsElt2 = document.createElement("script");
            let ins = document.createTextNode(scriptcfg.text); 
            jsElt2.appendChild(ins); 
            try {
            divElt.appendChild(jsElt2);
            }
            catch (e) {
                console.log(e.stack);
            }
            //--->
        }
    },500);
}

// this is a bit stupid, but not changing it b4 my trip 20211111 renee note
function makeNormalizedObj_(dbjson, instID, getPageSelectorFcn, fixedHeightBlob) {
    return mpcommon.packRTJsonObj(dbjson, instID, getPageSelectorFcn, fixedHeightBlob, makeNormalizedObj__);
}
        
const aDivId = 'div-gpt-ad-1234567890123-0';
/**
 * Refer to ./normalizedObj.md for details
 * @param {*} dbjson the assets for the tag. expect to have some ids in the adparameters subject typically
 * @param {*} rtjson partially filled normalized objects for us to add some
 * more stuff specific to this partner
 * @returns 
 */

function makeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn, fixedHeightBlob) {
    //From the DB here doctored:
    let instID = rtjson.instID;
    /* dbjson.adparameters = { //'[[300,600]]';//HACK
    
//        adUnitPath: '/31800665/KOMPAS.COM/osmjixie', //<-- from retgt
  //      googletag.defineSlot('/19968336/header-bid-tag-0', [[300, 250], [300, 600]], 'div-gpt-ad-123456789-0').addService(googletag.pubads());
        adUnitPath: '/19968336/header-bid-tag-0',
        sxzSizes: '[[300,600],[300,250],[320,100]]',//<-- from retgt
        szSizes: '[[300,600]]',//<-- from retgt
        tgtKey: 'xPos',//<-- from retgt
        tgtValue: 'osmkompas',//<-- from retgt
    }; */
    let aNode = mpcommon.getAdSlotAttachNode(dbjson, getPageSelectorFcn);
    if (!aNode) {
        return false;
    }
    if (!aNode.node.id) {
        aNode.node.id = 'jxadslotparent_' + instID;
    }
    rtjson.createslot = {
        diffscroll: true,
        parent : aNode,
        div : { id: `jxOutstream${instID}`, css: "text-align: center;width:100%" } //no use leh
    };
    rtjson.msgs = {
        noad: `jxosm_noad_gptpassback_${instID}`,
        imp: `jxosm_imp_gptpassback_${instID}`,
    };
    //dbjson.adparameters.divId = aDivId;
    //dbjson.adparameters.imp = 'jxosm_noad_gptpassback_' + instID;
    try {
        rtjson.scriptcfg = {
            text: makeText_(dbjson.adparameters, instID, rtjson.msgs.noad, rtjson.msgs.imp),
            idBase: instID
            
        };
    }
    catch(x) {
        console.log(x.stack);
    }
    //console.log(rtjson.scriptcfg.text);
    rtjson.visibilityslot = {
        selector: `#jxOutstream${instID}`,
        node: null
    };
    return true;
}

       module.exports.makeNormalizedObj = makeNormalizedObj_;
       module.exports.runCreative = runCreative_;
       module.exports.name ='gptpassback';

/* 
 ************** module: osmpartners/jixie **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the osm core JS can use to inject jixie ad etc

     Refer to ./normalizedObj.md for details
           
* requires/dependencies:
    - none
*/
