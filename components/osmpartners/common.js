/**
 * soe common routines used by "upstairs" for OSM partners and waterfalling
 */
/**
 * work out where the adslot is.
 * @param {*} dbjson <-- it can also be controlled by adparameters.selectors 
 * from the database configuring where to put the ad (HOWEVER NO BODY USE THIS! AND
 * IS NOT EXPOSED IN JIXIE PORTAL)
 * @param {*} getPageSelectorFcn 
 * @returns 
 */
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
 * PACK RUN TIME JSON OBJECT
 * this thing is a bit stupid for now.
 * the fcnPartnerMake... is a function which is partner specifc which fills in the needed stuff in the
 * RUNTIME JSON Object. for the osmengine/core.js to act upon (create the needed div etc )
 * It will 
 */
const defaultPTimeout_ = -1;
/**
 * 
 * @param {*} dbjson part of the assets of the tag so we can get to the adparameters
 * @param {*} instID string to represent this creatiev in this waterfall instance
 * @param {*} getPageSelectorFcn a funct
 * @param {*} cfgBlob config info from the page
 * @param {*} fcnPartnerMakeNormalizedObj__ the partner's (osmpartners/<partnername>.js)
 *  implements this function to do the packing.
 * @returns 
 */
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

/* 
 ************** module: basic/pginfo **************************************************
 basically since this stuff is duplicated every where. so put into 
 a common place.
 Please just read the code to know what it tries to do. Too simple
* module.exports:
    - getAdSlotAttachNode function
    - packRTJsonObj function
        make a really useful object for the osm/core.js to use
        so that core.js can be totally GENERIC not caring what partner we are dealing with
        
        Refer to ./normalizedObj.md for details

    
* requires/dependencies:
    - none
*/

