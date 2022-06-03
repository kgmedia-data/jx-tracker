
function getAdSlotAttachNode_(dbjson, getPageSelectorFcn) {
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

    function common_(rtjson) {
        rtjson.customfcns = {};
        rtjson.scriptdiv = {
            id: "scriptdiv" + rtjson.instID,
            style: "all:initial;"
        };
    }

    /**
     * this thing is a bit stupid for now.
     * the fcnPartnerMake... is a function which is partner specifc which fills in the needed stuff in the
     * RUNTIME JSON Object. for the osmengine/core.js to act upon (create the needed div etc )
     * It will 
     */
const defaultPTimeout_ = -1;
function packRTJsonObj_(dbjson, instID, getPageSelectorFcn, cfgBlob, fcnPartnerMakeNormalizedObj__) {
    let timeout = dbjson.adparameters && dbjson.adparameters.timeout ? dbjson.adparameters.timeout:defaultPTimeout_;
    let rtjson = {
        timeout: timeout,
        partner: dbjson.subtype, //for debug printout only
        trackers: dbjson.trackers,
        stackidx: dbjson.stackidx,
        stackdepth: dbjson.stackdepth,
        instID: instID,
        valid: false
    }; 
        common_(rtjson);
        if (fcnPartnerMakeNormalizedObj__(dbjson, rtjson, getPageSelectorFcn, cfgBlob)) {
            delete dbjson.trackers;
            rtjson.valid = true;
            return rtjson;
        }
    return rtjson;
}

module.exports.getAdSlotAttachNode = getAdSlotAttachNode_;
module.exports.packRTJsonObj = packRTJsonObj_;

