const defaultPTimeout_ = -1;

function makeNormalizedObj_({
    dbjson
}) {
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
//to be bound;
function inject_(siteId, imp) {
    //cr.adparameters.siteId = '1018656'; //'amp-test';
    //1018656, 218003 3709286
    window.unruly = window.unruly || {};
    window.unruly.native = {
        siteId: siteId
    };
    window.unruly.native.onAdLoaded = function() {
        //post the message
        window.postMessage(imp, "*");
        return '';
    };
    let scriptUrl = 'https://video.unrulymedia.com/native/native-loader.js';
    const s = document.createElement('script');
    s.src = scriptUrl;
    document.body.appendChild(s);
}

function makeNormalizedObj_(dbjson) {
    let rtjson = {};
    common_(rtjson);
    rtjson.msgs = {
        imp: `jxosm_imp_unruly`,
        timeout: `jxosm_timeout_unruly`
    };
    rtjson.inject = inject_.bound(null,
        dbjson.adparameters.siteId, rtjson.msgs.imp
    );
    return rtjson;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'unruly';