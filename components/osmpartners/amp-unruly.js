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
/*
var iframe = document.createElement('iframe');
var html = '<body>Foo</body>';
document.body.appendChild(iframe);
iframe.contentWindow.document.open();
iframe.contentWindow.document.write(html);
iframe.contentWindow.document.close();
*/
function xinject_(siteId, imp) {
    siteId = '1018656';
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    let html =              `<body style="margin: 0;">
    <script>
        var unruly = window.unruly || {};
        unruly.native = unruly.native || {};
        unruly.native.siteId = ${siteId};
        unruly.native.onFallback = function(){
            console.log('abcdef');
            return "";
        }; 
        unruly.native.onAdLoaded = function(){ 
            return "";
        }; 
        </script>
        <script src="https://video.unrulymedia.com/native/native-loader.js"></script>
        </body>`;
        let theC = document.getElementById("c");
        theC.parentNode.appendChild(iframe);
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(html);
        iframe.contentWindow.document.close();
}

function cannot_null_inject_(siteId, imp) {
    siteId = '1018656';
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframe.setAttribute("style","height:1px !important;width:100% !important;");
    iframe.name = 'jxunrulyaux';
    let html =              `<body style="margin: 0;">
    <script>
        var unruly = window.unruly || {};
        unruly.native = unruly.native || {};
        unruly.native.siteId = ${siteId};
        unruly.native.onFallback = function(){
            console.log('abcdef');
            return "";
        }; 
        unruly.native.onAdLoaded = function(){ 
            return "";
        }; 
        </script>
        <script src="https://video.unrulymedia.com/native/native-loader.js"></script>
        </body>`;
    iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
    let theC = document.getElementById("c");
    theC.parentNode.appendChild(iframe);
   
}

function xxinject_(siteId, imp) {
    siteId = '1018656'; //'amp-test';

    let htmlcode = `
            console.log("#### UNRULY YES");
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
              console.log("#### UNRULY YES2");

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
    console.log(`#### INJECT_${(new Date()).toUTCString()}`);
    window.unruly_has_ad = "00";
    siteId = '1018656'; //'amp-test';
   // siteId = '1111362'; //tribunnews amp
    //siteId = '218003'; //kompas
    //console.log(`HACK REMEMBER THIS IS TESTING PLACEMENT`);
    //1018656, 218003 3709286
    window.unruly = window.unruly || {};
    window.unruly.native = {
        siteId: siteId
    };
    //we cannot do the fallback: else it will wipe out all the scripts
    //it needs to be inside an iframe.
    //but here we cannot do that.
    //How near we are to the view port.
    //console.log(`calling set time out__ .. .. xtimeout`);
    //it is not that our code is called all the time.
    /*
    console.log("__setInterval to check");
    setInterval(function() {
        console.log("__check");
        if (window.unruly_has_ad == '00') {
            console.log(`__ time .. use this way got ${window.unruly_has_ad}`);
          //  window.postMessage(msgs.timeout, "*");
        }
    }, 500);
    */
     window.unruly.native.onAdLoaded = function() {
         console.log(`__#### .. .. onAdLoaded`);
        //window.unruly_has_ad = "11";
        window.postMessage(msgs.imp, "*");
        return '';
    };
    window.unruly.native.onFallback = function(){
        console.log(`#### ON FALLBACK ${(new Date()).toUTCString()}`);
        
        window.postMessage(msgs.noad, "*");
        //then it is something to bring in our own ad loh
        //Need to throw an exception else if it goes back to Unruly code,
        //it will wipe out the whole window.
        //but unruly onFallback is called very very late,
        //it is when the user almost passes the slot visually.
        //so there is no point to waterfall it to anything then!
        //meaning this thing here is useless.
        throw new Error('');
    }; 
    let scriptUrl = 'https://video.unrulymedia.com/native/native-loader.js';
    const s = document.createElement('script');
    s.src = scriptUrl;
    document.body.appendChild(s);
}

function makeNormalizedObj__(dbjson, rtjson) {
    common_(rtjson);
    rtjson.msgs = {
        noad: `jxosm_noad_unruly`,
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
