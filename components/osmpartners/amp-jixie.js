const defaultPTimeout_ = -1;

function makeNormalizedObj_({
    dbjson,
    p
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
        if (makeNormalizedObj__(dbjson, rtjson, p)) {
            delete dbjson.trackers;
            rtjson.valid = true;
            return rtjson;
        }
    }
    return rtjson;
}

function common_(rtjson) {
    rtjson.customfcns = {};

}

function inject_(params) {
    if (window.jxrenderer) {
        //check the exact prop name. this is just the idea only
        return window.jxrenderer.init(params);
    }

    if (!window.jxrenderer) {
        var jxScript = document.createElement('script');
        jxScript.onload = function() {
            window.jxrenderer.init(params);
        };
        //just a simple renderer will do. 
        //no need even universal lite!!
        //jxrenderer would be sufficient
        jxScript.src = 'https://jx-demo-creatives.s3-ap-southeast-1.amazonaws.com/osmtest/jx-app-jxrenderer.min.js';
        //'https://scripts.jixie.io/jxrenderer.min.js';
        document.body.appendChild(jxScript);
        //and this can be made to next time be interlaced in a waterfall even!
    }
}

function makeNormalizedObj_(dbjson, p) {
    let rtjson = {};
    common_(rtjson);
    rtjson.msgs = {
        //or we fire the has ad immediately lor.
        //we dun have hor.
    };
    var pp = {
        responsive: 1,
        context: 'amp',
        container: `c`,
        maxwidth: p.maxwidth,
        fixedheight: p.fixedheight,
        excludedheight: 0,
        jsoncreativeobj64: dbjson.adparameters.jsonbase64
    };
    rtjson.inject = inject_.bind(null, pp);
    return rtjson;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'jixie';