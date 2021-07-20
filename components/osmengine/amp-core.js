/**
 * Instrumentation of the AMP context functions
 * One-off only !
 * This whole thing will be in its own iframe lah.
 * So no need worry about many instances and all that.
 * Can also use global variables ...
 * Need a lot more heuristic and junk
 */

var gParams = {};//later will be set.
    

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
    fetch(trackers + '&action=' + action + (code ? '&errorcode='+code:''), {
        //no typo?
        method: 'GET',
        credentials: 'include'
    }).catch((err) => {
    });
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

var ppp = {
    maxwidth: 400,
    fixedheight: 300,
    excludedheight: 0
};

var oneLayer = function(jxContainer, remainingCreativesArr, partners, next) {
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

    let rtjson = partner.makeNormalizedObj(cr, gParams);
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
function fetchAdP(adTagUrl) {
    return fetch(adTagUrl).then((response) => response.json());
}

function createInstance_(p, partners) {
    gParams = p;
    ampOneOffInit_();
    let url = `https://${p.debug?'ad-rc':'ad'}.jixie.io/v2/osm?source=osm`;
    ['unit', 'client_id', 'sid', 'creativeid'].forEach(function(prop) {
        if (p[prop])
            url += '&' + prop + '=' + p[prop];
    });
    ['pageurl', 'domain'].forEach(function(prop) {
        if (p[prop])
            url += '&' + prop + '=' + encodeURIComponent(p[prop]);
    });
    url += '&device=amp';

    let respBlob = {};
    let _jxContainer = document.getElementById(p.container);
    let fetchedCreativesProm = respBlob && respBlob.creatives ? Promise.resolve(respBlob) : fetchAdP(url);
    fetchedCreativesProm
    .then(function(responseBlob) {
        let creativesArr;
        if (true || responseBlob.pre) {
            creativesArr = responseBlob.creatives;
        }
        if (creativesArr && creativesArr.length > 0)
            oneLayer(_jxContainer, creativesArr, partners, oneLayer);
    })
    .catch(function(err) {
        boundRealNoContent();
    });
}

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