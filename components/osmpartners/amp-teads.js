/**
 * Our little system whereby each osm-amp partner implements a fixed
 * set of functions for the upper layer to call (so the upper layer
 * just do stuff generically no matter what partner you are)
 *                  THIS IS FOR PARNTER TEADS
 * See bottom of file
 */

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

function inject_(pageId) {
    //to be bound 

    //pageId = '126472'; //100514 is the amp.kompas real one '126472'; //hack //128408 for no ad
    //console.log(`HACK REMEMBER THIS IS TESTING PLACEMENT`);
    window._teads_amp = {
        allowed_data: ['pid', 'tag'],
        mandatory_data: ['pid'],
        mandatory_tag_data: ['tta', 'ttp'],
        data: {
            pid: pageId
        }
    };
    let scriptUrl = 'https://a.teads.tv/page/' + pageId + '/tag';
    const s = document.createElement('script');
    s.src = scriptUrl;
    document.body.appendChild(s);
}

/**
 * Refer to ./normalizedObj.md for details
 * @param {*} dbjson the assets for the tag. expect to have some ids in the adparameters subject typically
 * @param {*} rtjson partially filled normalized objects for us to add some
 * more stuff specific to this partner
 * @returns 
 */
function makeNormalizedObj__(dbjson, rtjson) {
    common_(rtjson);
    rtjson.msgs = {
        //I stupid last time
        hasad: `jxosm_hasad_teads_${dbjson.adparameters.pageId}` + `${dbjson.adparameters.pageId==126472?'x137811':''}`, //`jxosm_noad_teads`,
        noad: `jxosm_noad_teads_${dbjson.adparameters.pageId}` + `${dbjson.adparameters.pageId==126472?'x137811':''}`, //`jxosm_noad_teads`,
        imp: `jxosm_imp_teads_${dbjson.adparameters.pageId}` + `${dbjson.adparameters.pageId==126472?'x137811':''}`, //`jxosm_noad_teads`,
        timeout: `jxosm_timeout_teads_${dbjson.adparameters.pageId}` + `${dbjson.adparameters.pageId==126472?'x137811':''}` //`jxosm_noad_teads`,
    };
    rtjson.inject = inject_.bind(null, dbjson.adparameters.pageId);
    return true;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'teads';

/* 
 ************** module: osmpartners/amp-teads **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the amp-core JS can use to inject teads script etc
    Refer to ./normalizedObj.md for details

* requires/dependencies:
    - none
*/
