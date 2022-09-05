const modulesmgr            = require('../basic/modulesmgr');

const mpcommon              = modulesmgr.get('osmpartners/common');


function makeNormalizedObj_(dbjson, instID, getPageSelectorFcn, cfgBlob) {
    dbjson.timeout = 10000; //temp try this due to SM complaints
    return mpcommon.packRTJsonObj(dbjson, instID, getPageSelectorFcn, cfgBlob, makeNormalizedObj__);
}

function makeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn, cfgBlob) {
    let siteId = dbjson.adparameters.siteId;
    if (cfgBlob.poverrides && cfgBlob.poverrides.unruly) {
        siteId = cfgBlob.poverrides.unruly.siteId;
        dbjson.timeout = -1;
        rtjson.timeout = -1;
    }
    let instID = rtjson.instID;
    rtjson.msgs = {
        noad: `jxosm_noad_unruly${instID}`,
        imp: `jxosm_imp_unruly${instID}`,
        virtimp: `jxosm_virtimp_unruly${instID}`,
        timeout: `jxosm_timeout_unruly${instID}`
    };

    //This is the function for the inview stuff below:
    //<----
    let div2check = (siteId === 226678 ? "jxunrulydivid_226678" : `divid_jxosm_unruly_${siteId}`);
    let virtimp = rtjson.msgs.virtimp;

    function doWork_(timerBlob) {
        //console.log(`TIMER_CB_CALLED: __JX______ xx ${timerBlob.times} / ${timerBlob.id} / ${div2check} / ${virtimp} `);
        timerBlob.times++;
        let node = document.getElementById(div2check);
        if (node && node.innerHTML && node.innerHTML.trim().length > 0) {
            clearInterval(timerBlob.id);
            window.postMessage(virtimp, "*");
        } else {
            if (timerBlob.times > 20) {
                clearInterval(timerBlob.id);
            }
        }
    }
    //---->
    rtjson.customfcns = {
        //for unruly we have this situation whereby they play some
        //display ad . then for these things, there is no onFallback call nor
        //adLoaded call.
        //So we try to do a heuristic. After the inview, check whether "there is stuff"
        //inside the div for unruly (innerHTML). Use that to approx.
        inview: function(regTimerFcn) {
            var timerBlob = {
                times: 0
            };
            timerBlob.id = setInterval(doWork_.bind(null, timerBlob),
                1500);
            regTimerFcn(timerBlob.id);
        }
    };

    let htmlcode = `
            var unruly = window.unruly || {};
            unruly.native = unruly.native || {};
            unruly.native.siteId = ${siteId};
            unruly.native.placementId = ${siteId};
            unruly.native.onFallback = function(){
                parent.postMessage("${rtjson.msgs.noad}", "*");
                return "";
            }; 
            unruly.native.onAdLoaded = function(){ 
                parent.postMessage("${rtjson.msgs.imp}", "*");
                return "";
              }; 
             `;
    let cleanhtmlcode = htmlcode.replace(/\n|\r/g, "");
    //actually the 100% is means what ah?
    //Unruly stuff must be put in iframe
    //else the fallback will not work.
    //that's why here we make a same-origin iframe
    //
    // A bit of the explanation about the iframe.setAttribute(....display:block) below which was added only 20220902
    // It is because we got this complaint from kompas about this space at the bottom of the page
    // (it is very noticeable against the kompas black page background)
    // Even if we make the height=0 (it was 1; the unruly script will set it to 1 even if you put 0) actually there will 
    // still be this 0.4mm (vertical span) of space due to this iframe (making the iframe border, margin etc none does not help)
    // Then this stackoverflow says it is the display: ** that is the problem and should use
    // display: block ...
    // https://stackoverflow.com/questions/6735022/remove-the-extra-whitespace-surrounding-iframes
    // So I added the display: block and it seems to help totally.
    // (setting background-color: transparent does not work at all)
        //From the aboev stackoverflow answer that I adopted:
        //Having just seen your fiddle your issue is because you are using display:inline-block. This takes whitespace in your html into account. display:inline-block is notorious for being difficult and has dodgy browser support.
        //Option 1: Try removing the white space in your html can sometimes sort the problem.
        //Option 2: Using a different display property such as display:block will definitely sort the problem. Live example: http://jsfiddle.net/mM6AB/3/
        //
    rtjson.scriptb =
        `<script>
            var cleanhtmlcode = '${cleanhtmlcode}';
            var iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            iframe.setAttribute("style","display: block !important;height:1px !important;width:100% !important;");
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
    let aNode = mpcommon.getAdSlotAttachNode(dbjson, getPageSelectorFcn);
    if (true) { //dbjson.adparameters.integrated) {
        if (!aNode) return false;
        /**
         * in the integrated case, the adslot unruly is set up to
         * lookup a div jxosmunrulyid and put in the ad into that div.
         * This div does NOT exist originally on the page.
         * What happens is JXOSM go thru the selectors and find a node
         * that is present on the page. Then JXOSM create the div with id
         * jxosmunrulyid as a child of it (and jxosmunrulyid will take the
         * width of that node)
         * This is a good way coz there is a definite slot to observe, as it
         * it controlled by JXOSM to be unique.
         * There can be multiple selectors specified but JXOSM will pick one that
         * really corresponds to something on the page.
         */
        rtjson.createslot = {
            diffscroll: false
        };
        rtjson.createslot.parent = aNode;
        let destdivid = (siteId === 226678 ? "jxunrulydivid_226678" : `divid_jxosm_unruly_${siteId}`);
        rtjson.createslot.div = {
            id: destdivid,
            css: `width:100%;`,
            node: null
        };
        rtjson.visibilityslot = {
            selector: '#' + destdivid,
            node: null
        };
    }
    return true;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'unruly';

/* 
 ************** module: osmpartners/unruly **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the osm core JS can use to inject unruly ad script etc

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
