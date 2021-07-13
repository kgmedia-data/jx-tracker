const defaultPTimeout_ = -1;

var getAdSlotAttachNode_ = function(dbjson, getPageSelectorFcn) {
    if (dbjson.adparameters.selectors) {
        let selectors = dbjson.adparameters.selectors;
        for (var i = 0; i < selectors.length; i++) {
            let sel = null;
            try {
                sel = jxsel(selectors[i]);
            } catch (er) {}
            if (sel && sel.length >= 1 && sel[0] &&
                (sel[0].nodeName == 'DIV' || sel[0].nodeName == 'P')) {
                return {
                    node: sel[0],
                    selector: selectors[i]
                }
            }
        } //for
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
        timeout: dbjson.timeout ? dbjson.timeout : defaultPTimeout_,
        partner: dbjson.subtype, //for debug printout only
        trackers: dbjson.trackers,
        stackidx: dbjson.stackidx,
        stackdepth: dbjson.stackdepth,
        instID: instID,
        valid: false
    }; {
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
    common_(rtjson);

    rtjson.msgs = {
        //I stupid last time
        hasad: `jxosm_hasad_teads_${dbjson.adparameters.pageId}` + `${dbjson.adparameters.pageId==126472?'x137811':''}`, //`jxosm_noad_teads`,
        noad: `jxosm_noad_teads_${dbjson.adparameters.pageId}` + `${dbjson.adparameters.pageId==126472?'x137811':''}`, //`jxosm_noad_teads`,
        imp: `jxosm_imp_teads_${dbjson.adparameters.pageId}` + `${dbjson.adparameters.pageId==126472?'x137811':''}`, //`jxosm_noad_teads`,
        timeout: `jxosm_timeout_teads_${dbjson.adparameters.pageId}` + `${dbjson.adparameters.pageId==126472?'x137811':''}` //`jxosm_noad_teads`,
    };
    /*
    javascript
    */
    rtjson.scriptb =
        `<script type="text/javascript" class="teads" src="//a.teads.tv/page/${dbjson.adparameters.pageId}/tag" async="true"></script>`;
    let aNode = getAdSlotAttachNode_(dbjson, getPageSelectorFcn);
    //let's try something different to try to solve the teads problem.
    if (false) {
        //we try this new approach
        //we do not create a new DIV .
        //we just put the div ID onto that thing (a paragraph) identified by the selector.
        if (!aNode) {
            return false;
        }
        let slotid = dbjson.adparameters.pageId == '126472' ? 'divid_jxosm_teads' : `divid_jxosm_teads_${dbjson.adparameters.pageId}`;
        if (!aNode.node.id) {
            aNode.node.id = slotid;
        }
        //we do not create any slot
        //we merely attach the id to the paragraph
        rtjson.visibilityslot = {
            selector: `#${slotid}`,
            node: null
        };
    }
    if (true) {
        //WE DUN COME INTO HERE. WE TRY SOMETHING ELSE NOW.
        // we are always, so-called integrated.
        //else the solution cannot work.
        if (!aNode) return false;
        /**
         * in the integrated case, the adslot unruly is set up to
         * lookup a div divid_jxosm_teads and put in the ad into that div.
         * This div does NOT exist originally on the page.
         * What happens is JXOSM go thru the selectors and find a node
         * that is present on the page. Then JXOSM create the div with id
         * divid_jxosm_teads as a child of it (and jxosmunrulyid will take the
         * width of that node)
         * This is a good way coz there is a definite slot to observe, as it
         * it controlled by JXOSM to be unique.
         * There can be multiple selectors specified but JXOSM will pick one that
         * really corresponds to something on the page.
         */
        rtjson.createslot = {};
        rtjson.createslot.parent = aNode;
        //this old stupid one I did wrongly!
        let sslot = dbjson.adparameters.pageId == '126472' ? 'divid_jxosm_teads' : `divid_jxosm_teads_${dbjson.adparameters.pageId}`;
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
    return true;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'teads';