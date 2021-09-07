const defaultPTimeout_ = -1; //;

var getAdSlotAttachNode_ = function(dbjson, getPageSelectorFcn) {
    /* if (dbjson.adparameters.selectors) {
         let selectors = dbjson.adparameters.selectors;
         for (var i = 0; i < selectors.length; i++ ) {
             let sel = null;
             try {
                 sel = jxsel(selectors[i]);
             }
             catch (er) {}
             if (sel && sel.length >= 1 && sel[0] && 
                 (sel[0].nodeName == 'DIV' || sel[0].nodeName == 'P')) {
                 return {
                     node: sel[0],
                     selector: selectors[i]
                 }
             }
         }//for
     }*/
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
    };

    {
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
    //The way SelectMedia works is that it just takes the DIV into which their script
    //was injected and then the script will create this aniplayer_selectJS640305376 div
    //(i.e. the div name is derived from the script "id")

    common_(rtjson);
    if (dbjson.adparameters.placing === 'fixed') {
        //hack and test 1:
        //dbjson.adparameters.script_id = 'AV61012c6aa4f8284ae05e4fe4';
        //dbjson.adparameters.script_src = 'https://tg1.selectmedia.asia/api/adserver/spt?AV_TAGID=61012c6aa4f8284ae05e4fe4&AV_PUBLISHERID=59b23d43073ef46aa456f9a8';
        //hack and test 2:
        //dbjson.adparameters.script_id = 'AV61012d8067980e6640000849';
        //dbjson.adparameters.script_src = 'https://tg1.selectmedia.asia/api/adserver/spt?AV_TAGID=61012d8067980e6640000849&AV_PUBLISHERID=59b23d43073ef46aa456f9a8';

        //Renee: 20210330 note:
        //apparently this got fixed sometime down the line. So this is no longer an issue.
        //I keep the constructs here, though the code all commented out
        //so really not doing anything.
        //--end of 20210330 note.
        //this is actually to get around an issue
        //coz floating window even if no-ad they also still pop
        //up the window (JXOSM quickly kills it - but still not nice)
        //So my trick is the parent parent div is display: none
        //Only when sure got ad (imp) then change display: block
        //But this one only apply on "fixed".
        //For inarticle cannot. Else the outstream will never OPEN!!
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
    } else { //is in -article
        //since SM create the outstream ad where its script is attached
        //then JXOSM needs to inject the SM script at where our publisher
        //wants the ad to show up:
        //-----------Other things to set up to give generic instructions to jxosmcore_ layer:
        let aNode = getAdSlotAttachNode_(dbjson, getPageSelectorFcn);
        if (!aNode) {
            return false;
        }
        rtjson.scriptselector = aNode.selector;
    }

    //--------- The script/fragment to inject:
    rtjson.scriptb = `<script async id="${dbjson.adparameters.script_id}" src="${dbjson.adparameters.script_src}"></script>`;

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
   
    //HACK: some  wrong config on their side:
    let script_id = (dbjson.adparameters.msg_script_id ?
        dbjson.adparameters.msg_script_id : dbjson.adparameters.script_id);
    let sid = script_id.replace('select', ''); //selectJS417849795
    sid = 'JS417849795'; //due to their problem, everything is this!!!
    rtjson.msgs = {
        noad: `jxosm_noad_selectmedia${sid}`,
        imp: `jxosm_imp_selectmedia${sid}`,
        timeout: `jxosm_timeout_selectmedia${sid}`
    };
    //<--- triggerhouse:
    if (rtjson.floating && rtjson.stackidx == rtjson.stackdepth-2) {
        //this is the second last on the waterfall
        rtjson.msgs.triggerhouse = `jxosm_triggerhouse_selectmedia${sid}`;
    }
    //for selectmedia their floating window sometimes is outside the
    //injected div, so still need to try to kill it
    rtjson.removedivclass = dbjson.adparameters.script_id;
    
    //-->

    //jxosm_noad_selectmediaJS417849795
    return true;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'selectmedia';

/* 
 ************** module: osmpartners/selectmedia **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the osm core JS can use to inject selectmedia ad script etc

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
