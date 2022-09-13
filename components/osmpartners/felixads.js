const modulesmgr            = require('../basic/modulesmgr');

const mpcommon              = modulesmgr.get('osmpartners/common');

// under docs/felixads subfolder
// There is some info and screenshots about the org
// of the felixads floating player in the DOM

// this is a bit stupid, but not changing it b4 my trip 20211111 renee note
function makeNormalizedObj_(dbjson, instID, getPageSelectorFcn, fixedHeightBlob) {
    return mpcommon.packRTJsonObj(dbjson, instID, getPageSelectorFcn, fixedHeightBlob, makeNormalizedObj__);
}

function makeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn) {
    //The way felixads works is that it just takes the DIV into which their script
    //was injected and then the script will create this aniplayer_selectJS640305376 div
    //(i.e. the div name is derived from the script "id")

    //on the SM side, turns out that those postMessage stuff are all inside "files"
    //e.g. https://play.felixads.asia/58fcbed1073ef420086c9d08/604cf5d5374e2240d0749637/kompas.com_osm_pass.txt
    //Which has only 1 line and it is this:
    //parent.postMessage("jxosm_noad_felixadsJS417849795", "*");
    //So... it is too messy to expect them to keep many different files
    //so all the e.g. impression messages (no matter what the siteID is) is
    //JS417849795 
    // Assuming that there is only 1 such on the page, then it should be quite safe...
    let script_id = (dbjson.adparameters.msg_script_id ?
        dbjson.adparameters.msg_script_id : dbjson.adparameters.script_id);
    let sid = script_id; 

    if (dbjson.adparameters.placing === 'fixed') {
        rtjson.scriptdiv = {
            id: "scriptdiv" + rtjson.instID,
            style: "" //display: none; visibility: hidden; "
        };
        let divid = "scriptdiv" + rtjson.instID;
        rtjson.floating = true;
        rtjson.customfcns = {
            imp: function() {
                //let tmp = document.getElementById(divid);
                //tmp.style.cssText = "display: block; visibility: hidden;"; 
            }
        };
        //we need to hang this SM script under body and not in the node
        //with all the jxosm stuff (coz if jxosm was served by GTM, then the node
        //tree is display:none. Then this float window cannot be seen loh)
        rtjson.scriptselector = 'body';
        console.log(`felixads____ jxosm will not crative any div (assuming the felixads tag is floating)`);
    } else { //is in -article
        //since SM create the outstream ad where its script is attached
        //then JXOSM needs to inject the SM script at where our publisher
        //wants the ad to show up:
        //-----------Other things to set up to give generic instructions to jxosmcore_ layer:
        let aNode = mpcommon.getAdSlotAttachNode(dbjson, getPageSelectorFcn);
        if (!aNode) {
            return false;
        }
        // we try this lah. we don't attach the script at a particular place
        // just the standard way (under osmdiv). Then we specify to them what adslot to find
        // rtjson.scriptselector = aNode.selector;
        rtjson.createslot = {
            diffscroll: false
        };
        rtjson.customfcns = {
            
        };
        rtjson.createslot.parent = aNode;
        //this old stupid one I did wrongly!
        let sslot = 'divid_jxosm_felixads_' + sid;
        console.log(`felixads____  jxosm will create div ${sslot} for felixads to put the ad`);
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

    //--------- The script/fragment to inject:
    

   /* up to 20210907, we were doing it like this:
      But then I realized that the SM newer tag they name their div with some additional 
      random string appened. 

      like this aniplayer_AV61012c6aa4f8284ae05e4fe4-1630998559494
      instead of aniplayer_selectJS417849795 (which is for the older tag)

      so the below formula for selector does not work
      So we say forget it. The logic in the visibility tracking has been changed
      If floating, then we just fire the creativeView for this tag.

    rtjson.visibilityslot = {
        selector: `#aniplayer_${dbjson.adparameters.script_id}`,
        node: null
    };
    */
    rtjson.visibilityslot = {
        select: "notused",
        node: null
    };
   
    
    
    rtjson.msgs = {
        noad: `jxosm_noad_felixads_${sid}`,
        imp: `jxosm_imp_felixads_${sid}`,
        timeout: `jxosm_timeout_felixads_${sid}`
    };
    if (true || !rtjson.floating) {
        //in article they enabled this new kind of event ... so ...
        //we can use it to determine whether to stop their tag or not.
        rtjson.msgs.hasad = `jxosm_hasad_felixads_${sid}`;
    }
    //<--- triggerhouse:
    if (rtjson.floating && rtjson.stackidx == rtjson.stackdepth-2) {
        //this is the second last on the waterfall
        rtjson.msgs.triggerhouse = `jxosm_triggerhouse_felixads_${sid}`;
    }
    //for felixads their floating window sometimes is outside the
    //injected div, so still need to try to kill it
    rtjson.removedivclass = dbjson.adparameters.script_id;
    
    rtjson.scriptb = `<script async id="${dbjson.adparameters.script_id}" src="${dbjson.adparameters.script_src}"></script>`;
    console.log(`felixads____ jxosm will inject this script of yours: \n${rtjson.scriptb}`);
    console.log(`felixads____ jxosm Please watched out : if OSM receives any message you post it will show up in the console.log`);
    console.log(`felixads____ jxosm: Recapping: for the postMessage: we expect \n
        ${rtjson.msgs.noad}   to tell jxosm no ad\n
        ${rtjson.msgs.imp}    to tell jxosm when ad just starts to play\n
        ${rtjson.msgs.hasad}  (needed if in-article) to tell jxosm that an ad has been found (perhaps not yet played due to not in viewport)\n`);
    console.log(`felixads____ jxosm: General info: your pixel looks like this:\n
        parent.postMessage("jxosm_hasad_felixads_blablablabla", "*");`);
    //-->
    return true;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'felixads';

/* 
 ************** module: osmpartners/felixads **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the osm core JS can use to inject felixads ad script etc

        - the output object has the following properties
        timeout (for SM we have a timeout set coz their tag normally would take minutes before wanting to
            tell us that they have no ad; So we throw them out if still no ad after timeout sec)
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
            inview <-- for unruly when the visibiltyslot comes inview we will run a function
            (see the above code to see why)
        }

        visibilityslot : {
            //the visilibyt measurement done by core.js , which container should it monitor?:
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
