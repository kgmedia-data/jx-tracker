const defaultPTimeout_ = -1;

function makeNormalizedObj_(
    dbjson
) {
    //rtjson prepared.
    let rtjson = {
        timeout: dbjson.timeout ? dbjson.timeout : defaultPTimeout_,
        partner: dbjson.subtype, //for debug printout only
        trackers: dbjson.trackers,
        stackidx: dbjson.stackidx,
        stackdepth: dbjson.stackdepth,
        instID: 1,
        valid: false
    }; {
        if (makeNormalizedObj__(dbjson, rtjson)) {
            delete dbjson.trackers;
            rtjson.valid = true;
            return rtjson;
        }
    }
    return rtjson;
}

function common_(rtjson) {
    rtjson.customfcns = {};
    //rtjson.scriptdiv = {
    //  id: "scriptdiv" + rtjson.instID,
    //style: "all:initial;" 
    //};
}
//to be bound;

function xinject_(siteId, imp) {
    let htmlcode = `
            var unruly = window.unruly || {};
            unruly.native = unruly.native || {};
            unruly.native.siteId = ${siteId};
            unruly.native.onFallback = function(){
                console.log("___ WE ARE here");
                return "";
            }; 
            unruly.native.onAdLoaded = function(){ 
                console.log("___ WE ARE here2");
                return "";
              }; 
             `;
    let cleanhtmlcode = htmlcode.replace(/\n|\r/g, "");
    //actually the 100% is means what ah?
    //Unruly stuff must be put in iframe
    //else the fallback will not work.
    //that's why here we make a same-origin iframe
    let scriptBody =
        `<script>
            var cleanhtmlcode = '${cleanhtmlcode}';
            var iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            iframe.setAttribute("style","height:1px !important;width:100% !important;");
            iframe.name = 'jxunrulyaux';
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(
                '<html><body><scr' + 'ipt>' + cleanhtmlcode + 
                '</scr' + 'ipt>' + 
                '<scr' + 'ipt src="https://video.unrulymedia.com/native/native-loader.js">' +
                '</scr' + 'ipt></body></html>'
                );
            iframe.contentWindow.document.close();
            </script>
            `;
            let theC = document.getElementById("c");
                    let _injectedDiv = document.createElement('div');
                    _injectedDiv.id = "123";
                    _injectedDiv.style.cssText = "all:initial;";
                    
                    let range = document.createRange();
                    range.setStart(_injectedDiv, 0);
                    if (scriptBody) {
                        _injectedDiv.appendChild(range.createContextualFragment(scriptBody));
                    }
                    theC.appendChild(_injectedDiv);
                    console.log("__NO DIE");
                    
            
}

function inject_(siteId, msgs) {
    window.unruly_has_ad = "00";
    siteId = '1018656'; //'amp-test';
    siteId = '1111362'; //tribunnews amp
    //siteId = '218003'; //kompas
    //console.log(`HACK REMEMBER THIS IS TESTING PLACEMENT`);
    //1018656, 218003 3709286
    window.unruly = window.unruly || {};
    window.unruly.native = {
        siteId: siteId
    };
    console.log(`__ .. .. plant stuff`);
    //just do your own self-signed deaht?
    //unruly.native.onFallback = function(){
      //  console.log(`___UNRULY BOOOOO`);
        //parent.postMessage("${rtjson.msgs.noad}", "*");
        //return "";
    //}; 
    //we cannot do the fallback: else it will wipe out all the scripts
    //it needs to be inside an iframe.
    //but here we cannot do that.
    //How near we are to the view port.
    //console.log(`calling set time out__ .. .. xtimeout`);
    //it is not that our code is called all the time.
    console.log("__setInterval to check");
    setInterval(function() {
        console.log("__check");
        if (window.unruly_has_ad == '00') {
            console.log(`__ time .. use this way got ${window.unruly_has_ad}`);
          //  window.postMessage(msgs.timeout, "*");
        }
    }, 500);
     window.unruly.native.onAdLoaded = function() {
         console.log(`__ .. .. onAdLoaded`);
        window.unruly_has_ad = "11";
        window.postMessage(msgs.imp, "*");
        return '';
    };
    let scriptUrl = 'https://video.unrulymedia.com/native/native-loader.js';
    const s = document.createElement('script');
    s.src = scriptUrl;
    document.body.appendChild(s);
}

function makeNormalizedObj__(dbjson, rtjson) {
    common_(rtjson);
    rtjson.msgs = {
        imp: `jxosm_imp_unruly`,
        timeout: `jxosm_timeout_unruly`
    };
    rtjson.inject = inject_.bind(null,
        dbjson.adparameters.siteId, rtjson.msgs
    );
    return rtjson;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'unruly';

/* 
 ************** module: osmpartners/amp-unruly **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the amp-core JS can use to inject unruly script etc

        - the output object has the following properties
        timeout (-1 means dun have any)
        partner (here it will be "unruly")
        trackers
        stackidx
        stackdepth
        instID: 
        valid: true/false
        inject: a function to be called (by the amp-core) 
        msgs : an object of the messages to expect from partner script to inform of
            noad, hasad, impression   <-- this does not apply to jixie ads (since the ad already finalized when we reach this stage)
        customfcns  - not used                
    
* requires/dependencies:
    - none
*/
