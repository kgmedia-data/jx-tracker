/**
 * Instrumentation of the AMP context functions
 * One-off only !
 * Not tested after the rewrite
 * Need a lot more heuristic and junk
 */
var p_imp = null; //global ...set to corr to whatever current partner 
var p_noad = null; //global ...
function ampOneOffInit_() {
    let boundRealRenderStart = window.context.renderStart.bind(window.context);
    //let boundRealNoContent = window.context.noContentAvailable.bind(window.context);
   
    window.context.renderStart = function(arg1, arg2) {
        if (p_imp)
            window.postMessage(p_imp, "*");    
        //not accurate. depends on the vendor.
        boundRealRenderStart();
    }
    window.context.noContentAvailable = function() {
        if (p_noad)
            window.postMessage(p_noad, "*");    
    }
}

function fireTrackers(trackers, action, code = null) {
    //TODO
}

function msgListener(e) {
    if(typeof e.data == 'string' && e.data.startsWith('jxosm')) {
        let msgs = this.msgs;
        if (e.data == msgs.imp) { 
            fireTrackers(this.trackers, 'impression');
            p_imp = null;
            p_noad = null;
        }
        if (e.data == msgs.noad || e.data == msgs.timeout) { 
            //fire stuff 303
            p_imp = null;
            p_noad = null;
            //we should tear down the stuff.
            fireTrackers(this.trackers, 'error', '303');
            this.next();
        }
        
    }
}

var oneLayer = function(jxContainer, remainingCreativesArr, partners, next) {
    //console.log(`ampOnePartner`);
    //console.log(remainingCreativesArr[0]);
    let cr = remainingCreativesArr.shift();
    if (!cr) { return; }
    let subtype = cr.subtype;
    if (subtype == 'selectmedia') {
        //we dun handle
        cr = remainingCreativesArr.shift();
    }
    if (!cr) { return; }
    let partner = partners[subtype];
    if (!partner) { return; }
    let rtjson = partner.makeNormalizedObj();
    p_imp = rtjson.msgs.imp;
    p_noad = rtjson.msgs.noad;
    //imp
    //timeout should start to do a timeout also TODO
    
    let boundMsgListener = msgListener.bind({
        msgs: rtjson.msgs,
        trackers: rtjson.trackers,
        next: oneLayer.bind(null, jxContainer, remainingCreativesArr, partners, next)
    });
    window.addEventListener('message', boundMsgListener, false);
    rtjson.inject();
}

function createInstance_(p, partners) {
    //container:
    //TODO: still have to work out the adUrl ah
    let adUrl = 'https://ad.jixie.io/v1/universal?source=sdk&domain=travel.kompas.com&pageurl=https%3A%2F%2Ftravel.kompas.com%2Fread%2F2021%2F06%2F16%2F180106127%2Ftraveloka-dan-citilink-gelar-promo-diskon-tiket-pesawat-20-persen&width=546&client_id=72356cf0-d22c-11eb-81b0-7bc2c799acca&sid=1625728274-72356cf0-d22c-11eb-81b0-7bc2c799acca&creativeid=800'; //1007|1005|800';
    //let fetchedCreativesProm = respBlob && respBlob.creatives ? Promise.resolve(respBlob) : fetchAdP(_helpers.makeAdTagUrl(_jxParams));
    let fetchedCreativesProm = respBlob && respBlob.creatives ? Promise.resolve(respBlob) : fetchAdP(adUrl);
    fetchedCreativesProm
    .then(function(responseBlob) {
        let creativesArr;
        if (true || responseBlob.pre) {
            creativesArr = responseBlob.creatives;
        }
        if (creativesArr && creativesArr.length > 0)
            oneLayer(_jxContainer, creativesArr, partners, oneLayer);
    });
}

//pass you all the partners functions.
//something to get AMP context info (better be shared coz got amp-adonly)
//
//TODO just call this internally once then!!
//module.exports.ampOneOffInit = ampOneOffInit_;
module.exports.createInstance = createInstance_;

/* 
 ************** module: osmengine/amp-core***********************************************

* module.exports:
    - createInstance (function(options, arrayOfPartnerObjects)
        - creates an OSM object from the params
        - As this is not meant to be controlled, this object has no APIs to be called
        - It is just "unleashed" and will take care of itself.

* requires/dependencies:
  - none (nothing direct - the arrayOfPartner objects is passed to us from the bundles
    layer)
*/