
    const defaultPTimeout_ = -1;
    
    var getAdSlotAttachNode_ = function(dbjson, getPageSelectorFcn) {
        if (dbjson.adparameters.selectors) {
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
                    timeout: dbjson.timeout ? dbjson.timeout: defaultPTimeout_,
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

        //well this is one way but the other way would be to include it.
        //then it is surely loaded.
        function runCreative_(config) {
            if (window.jxrenderer) {
                //check the exact prop name. this is just the idea only
                return window.jxrenderer.init(config);
            }
            
            if (!window.jxrenderer) { 
                var jxScript = document.createElement('script');
                jxScript.onload = function () {
                    window.jxrenderer.init(config);
                };
                //just a simple renderer will do. 
                //no need even universal lite!!
                //jxrenderer would be sufficient
                jxScript.src = 'https://scripts.jixie.io/jxrenderer.min.js';
                document.body.appendChild(jxScript); 
                //and this can be made to next time be interlaced in a waterfall even!
            }
        }
        function makeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn, fixedHeightBlob) {
            common_(rtjson);
            let instID = rtjson.instID;
            let aNode = getAdSlotAttachNode_(dbjson, getPageSelectorFcn);
            if (!aNode) {
                return false;
            }
            if (!aNode.node.id) {
                aNode.node.id = 'jxadslotparent_' + instID;
            }
            rtjson.createslot = {
                parent : aNode,
                //div : { id: `jxOutstream${instID}`, css: "width:100%; " } //no use leh
                //style="text-align: center;width:100%;
                div : { id: `jxOutstream${instID}`, css: "text-align: center;width:100%" } //no use leh
            };
            /**/
            let rr = Math.floor(Math.random() * 1000) + 1;
            //there is no scriptb to run
            //scritb is for injection
            //script
            //this is new. if there is this . then just run it.
            //we may just want to run the thing directly.
            try {
            rtjson.scriptcfg = {
                responsive: 1, 
                container: `jxOutstream${instID}`, 
                pgwidth: aNode.node.offsetWidth ? aNode.node.offsetWidth: 300,
                fixedheight: fixedHeightBlob && fixedHeightBlob.fixedheight ? fixedHeightBlob.fixedheight: 0,
                excludedheight: fixedHeightBlob && fixedHeightBlob.excludedheight ? fixedHeightBlob.excludedheight: 0,
                jsoncreativeobj64: dbjson.adparameters.jsonbase64
            };
            }
            catch(x) {
                console.log(x.stack);
            }
            rtjson.msgs = { abc: 1};
            rtjson.HIDE_scriptb =
            `<script>
                var jxosmarg${rr} ={
                    responsive: 1, 
                    container: "jxOutstream${instID}", 
                    maxwidth: ${aNode.node.clientWidth ? aNode.node.clientWidth: 300},
                    fixedheight: ${fixedHeightBlob && fixedHeightBlob.fixedheight ? fixedHeightBlob.fixedheight: 0},
                    excludedheight: ${fixedHeightBlob && fixedHeightBlob.excludedheight ? fixedHeightBlob.excludedheight: 0},
                    jsoncreativeobj64: "${dbjson.adparameters.jsonbase64}"
                };
                function jxdefer(p) {
                    if (window.jxuniversallite) {
                        window.jxuniversallite(p);
                    } else {
                        setTimeout(function() { jxdefer(p) }, 100);
                    }
                }
                jxdefer(jxosmarg${rr});
                </script>
                <script type="text/javascript" src="https://jx-scripts.s3-ap-southeast-1.amazonaws.com/tests/jxoutstreamlite.min.js" defer></script>
                `; 
                //no need for jxosmcore_ later to create any div for ad.
                //and not need for jxosmcore_ to monitor on any visibility as the JX itself will fire
                //the right tracker events
                rtjson.visibilityslot = null; 
                console.log(rtjson);
                //for jx we also no need to listen for any no-ad, has-ad stuff as there is always the ad.
                return true;
        }

       module.exports.makeNormalizedObj = makeNormalizedObj_;
       module.exports.runCreative = runCreative_;
       module.exports.name ='jixie';

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
