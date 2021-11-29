/**
 * partner type is Google (GAM) tag. passback
 * Needs to be served inside iframe (so it does not get interfered from the gpt settings on the main page)
 * 
 * 
 */
const modulesmgr            = require('../basic/modulesmgr');
const mpcommon              = modulesmgr.get('osmpartners/common');

function makeText_(adP, idBase, impMsg) {
    return `
        window.googletag = window.googletag || {cmd: []};
        googletag.cmd.push(function() {
            googletag.defineSlot('${adP.adUnitPath}', ${adP.szSizes}, 'jxdiv${idBase}').setTargeting('${adP.tgtKey}', ['${adP.tgtValue}']).addService(googletag.pubads());
            googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                window.parent.document.getElementById('jxgptif${idBase}').height = (document.body.scrollHeight);
                window.parent.postMessage('${impMsg}', '*');
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
function makeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn, fixedHeightBlob) {
    //From the DB here doctored:
    let instID = rtjson.instID;
    //dbjson.adparameters.szSizes = '[[300,600]]';//HACK
    /*
        adUnitPath: '/31800665/KOMPAS.COM/osmjixie', //<-- from retgt
        sxzSizes: '[[300,600],[300,250],[320,100]]',//<-- from retgt
        szSizes: '[[300,600]]',//<-- from retgt
        tgtKey: 'Pos',//<-- from retgt
        tgtValue: 'osmkompas',//<-- from retgt
    */
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
            text: makeText_(dbjson.adparameters, instID, rtjson.msgs.imp),
            idBase: instID
            
        };
    }
    catch(x) {
        console.log(x.stack);
    }
    console.log(rtjson.scriptcfg.text);
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

        - the output object has the following properties
        timeout (-1 means dun have any)
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
            jixie has no use for this.
        }

        visibilityslot : null for our case . Jixie the rendering script/creatives manage their 
            creative view events.

        scriptb: the script to inject (string)
           a partner must have either scriptb or scriptcfg! Jixie case there is scriptcfg
        scriptcfg: for jixie we have a scriptcfg and runCreative function will be called with this
            cfg.


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
