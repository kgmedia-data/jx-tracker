// TODO
// This is the snipplet copied from the old codebase. not fitted into the new framework yet
 /**
         * SPOTX
         * @param {*} json 
         */
      
  spotx : function(dbjson, rtjson, getPageSelectorFcn) {
    this.common(rtjson);
    
    let instID = rtjson.instID;
    const comParams = {
        placement_type: 3,
        content_type: "video",
        ad_unit: "incontent",
        https: 1,
        ad_done_function: "spotxNoAd" + instID,
        ad_impression_function: "spotxImp" + instID
    };
    let placing = dbjson.adparameters.placing;
    let otherParams;

    //---- for spotx  we set up all these
    //instructional constructrs for the jxosmcore_ layer first.
    //where to hang the script, what slot to monitor for visbility
    //what message (post) to expect to check noad/imp etc
    if (placing == 'fixed') {
        //then the parent is actually the #body
        //then attach that created div
        //then the script is attached to that div!!
        otherParams = dbjson.adparameters.fixed; 
        rtjson.scriptselector = `body`; 
        rtjson.floating = true;
        rtjson.visibilityslot = { selector: `#ctr${instID}`, node: null };
    }
    else {
        //normal in-article type:
        //find the node in the page to hang the outstream.
        //And this node is supposed to be the "model" where spotx
        //model after to do the width etc of the outstream
        //(thru target_width_element)
        //So we need to give that element an id if there is none:
        //We create ctr12345 in this node to be the actual ad container
        //(tell to spotx via content_container_id)
        let aNode = getAdSlotAttachNode_(dbjson, getPageSelectorFcn);
        if (!aNode) {
            return false;
        }
        if (!aNode.node.id) {
            aNode.node.id = 'jxadslotparent_' + instID;
        }
        otherParams = {
            target_width_element: aNode.node.id, 
            content_container_id: "ctr"+ instID
        };
        rtjson.createslot = {
            parent : aNode,
            div : { id: `ctr${instID}`}
        };
        rtjson.visibilityslot = { selector: `#ctr${instID}`, node: null };
    }
    //set up the msg the jxosmcore_ would be expecting:
    rtjson.msgs = {
        noad: `jxosm_noad_spotx${instID}`,
        imp: `jxosm_imp_spotx${instID}`,
        timeout: `jxosm_timeout_spotx${instID}`
    };

    //Now we go generate the fragment/script, a bit more complicated than
    //other partners coz many things can be configured and difference
    //between inarticle and floating
    let adserverParams = dbjson.adparameters.play;
    if (!adserverParams) adserverParams = {};
    let attrStr = ``;
    const finalObj = Object.assign({}, comParams, otherParams, adserverParams);
    for (var prop in finalObj) {
        attrStr += ` data-spotx_${prop}="${finalObj[prop]}" `;
    }
    let divstr1 = "";
    let divstr2 = "";
    if (placing == 'fixed') {
        let szBlob = dbjson.adparameters.fixed; 
        divstr1 = `<div id="ctr${instID}" style = "width:${szBlob.content_width}px; !important; height:${szBlob.content_height}px; !important;z-index:99999999999;position:fixed;bottom:0px;left: 0;">`;
        divstr2 = '</div>';
    }
    rtjson.scriptb = `
    ${divstr1}            
    <script type="text/javascript">
        function spotxImp${instID}()  {
            window.postMessage("${rtjson.msgs.imp}", "*");
        }
        function spotxNoAd${instID}(adFound)  {
            if(!adFound)  
                window.postMessage("${rtjson.msgs.noad}", "*");
        }
        </script>
        <script type="text/javascript" src="//js.spotx.tv/easi/v1/${dbjson.adparameters.channel_id}.js" 
        data-spotx_channel_id="${dbjson.adparameters.channel_id}"  
        ${attrStr} ></script>${divstr2}`;
        return true;
},