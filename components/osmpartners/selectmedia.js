
    const defaultPTimeout_ = 10000;
    
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

        function makeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn) {
           //The way SelectMedia works is that it just takes the DIV into which their script
            //was injected and then the script will create this aniplayer_selectJS640305376 div
            //(i.e. the div name is derived from the script "id")
            
            common_(rtjson);
            if (dbjson.adparameters.placing === 'fixed') {
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
            }
            else { //is in -article
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
            
            

            rtjson.visibilityslot = { 
                selector: `#aniplayer_${dbjson.adparameters.script_id}`, 
                node: null 
            };
            //HACK: some  wrong config on their side:
            let script_id = (dbjson.adparameters.msg_script_id ? 
                dbjson.adparameters.msg_script_id: dbjson.adparameters.script_id);
            let sid = script_id.replace('select',''); //selectJS417849795
            rtjson.msgs = {
                noad: `jxosm_noad_selectmedia${sid}`,
                imp: `jxosm_imp_selectmedia${sid}`,
                timeout: `jxosm_timeout_selectmedia${sid}`
            };
            //jxosm_noad_selectmediaJS417849795
            return true;
        }
       module.exports.makeNormalizedObj = makeNormalizedObj_;
       module.exports.name ='selectmedia';