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

        - the output object has the following properties
        timeout (-1 means dun have any)
        partner (here it will be "teads")
        trackers
        stackidx
        stackdepth
        instID: 
        valid: true/false
        inject: a function to be called (by the amp-core) to inject teads stuff onto the page
        msgs : an object of the messages to expect from partner script to inform of
            noad
            imp
            virtimp (not all partners have this, Teads does not)
            timeout
        customfcn: {
            not used for amp OSM
        }    
* requires/dependencies:
    - none
*/
