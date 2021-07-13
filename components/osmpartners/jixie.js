
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
                  console.log("!!!!!!!");
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
                maxwidth: aNode.node.clientWidth ? aNode.node.clientWidth: 300,
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