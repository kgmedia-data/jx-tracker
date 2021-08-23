/**
 * Since AMP ad is in its own iframe, the just let the variables
 * lie around like this (global variables) would do.
 * 
 */
var gParams = {};//later will be set.
var p_imp = null; //global ...set to corr to whatever current partner's
var p_noad = null; //global ...
/**
 * This is to take care of the creativeView tracker firing of all the partners
 */
var gOSMVisible = 0;
var gOSMCVTrackers = [];

const visThreshold_ = 0.4;

//what if there is no change?
function cb(changes) {
    //param.forEach(function(entry) 
    var entry = changes[changes.length - 1];
    {
        console.log(JSON.stringify(entry, 2));
        let trackers = [];
        if (entry.intersectionRatio > visThreshold_) {
            gOSMVisible = 1;
        }
        else {
            gOSMVisible = 0;
        }
        if (entry.intersectionRatio > visThreshold_ && gOSMCVTrackers.length > 0) {
            trackers = trackers.concat(gOSMCVTrackers);
            gOSMCVTrackers.length = 0;
        }
        for (var i = 0; i < trackers.length; i++) {
            trackers[i]('creativeView');
            //execute these bound functions
            //clear the backlog of creativeViews to fire.
        }
    }
    //if everything fired then can unlistne ah!
}
//https://github.com/ampproject/amphtml/blob/main/examples/ampcontext-creative.html
//https://jixieamptest.kompas.com/api/testpagegen?filename=ampcombikompas300x400&creativeids=1005|1027
function cb2(changes) {
    // Code below is simply an example.
    var latestChange = changes[changes.length - 1];

    // Amp-ad width and height.
    var w = latestChange.boundingClientRect.width;
    var h = latestChange.boundingClientRect.height;

    // Visible width and height.
    var vw = latestChange.intersectionRect.width;
    var vh = latestChange.intersectionRect.height;

    // Position in the viewport.
    var vx = latestChange.boundingClientRect.x;
    var vy = latestChange.boundingClientRect.y;

    // Viewable percentage.
    var viewablePerc = ((vw * vh) / (w * h)) * 100;

    console.log(viewablePerc, w, h, vw, vh, vx, vy);
  }
console.log(`#### OBSERVE START ${(new Date()).toUTCString()}`);
let unlisten = window.context.observeIntersection(cb);
//let unlisten = window.context.observeIntersection(cb);

//this is like our instrumentation to figure out if there is an ad.
function ampOneOffInit_() {
    let boundRealRenderStart = window.context.renderStart.bind(window.context);
    let boundRealRequestResize = window.context.requestResize.bind(window.context);
    
    //we use this to intercept the partner's calls to the amp runtime!!
    window.context.requestResize = function(...args) {
        if (args && args.length >= 2) 
            console.log(`### requestResize ${args[0]}x${args[1]}`);
        else
            console.log(`### requestResize no enough arg`);
        if (args && args.length >= 2) {
            //the real width and height of our unit
            if (args[0] <= gParams.data.rwidth && args[1] <= gParams.data.rheight) {
                console.log(`### requestResize No need pass to amp runtime ${args[0]}x${args[1]}`);
                return boundRealRequestResize(gParams.data.rwidth, gParams.data.rheight);
            }
        }
        console.log(`### requestResize need pass to amp runtime`);
        return boundRealRequestResize(...args);
    }
    
    window.context.renderStart = function(...args) {
        if (args && args.length >= 1) 
            console.log(`### renderStart ${JSON.stringify(args[0])}`);
        else
            console.log(`### renderStart no enough arg`);
        if (p_imp)
            window.postMessage(p_imp, "*");    
        if (args && args.length >= 1) {
            let o = args[0];
            if (o && o.width && o.height) {
                if (o.width <= gParams.data.width && o.height <= gParams.data.height) {
                    console.log(`### renderStart we ate your arg`);
                    return boundRealRenderStart(); // no need give arg then.
                }   
            }
        }
        console.log(`### renderStart we passing your arg`);
        return boundRealRenderStart(...args);
    }
    window.context.noContentAvailable = function() {
        //we will not pass this on of course. else we will get collapsed!
        console.log(`### noContentAvailable`);
        if (p_noad)
            window.postMessage(p_noad, "*");    
    }
}

function msgListener(e) {
    console.log(`_____ #### ${e.data}`);
    if(typeof e.data == 'string' && e.data.startsWith('jxosm')) {
        console.log(e.data);
        let msgs = this.msgs;
        if (e.data == msgs.imp) { 
            //if (this.unfired['impression']) {
              //  this.unfired['impression'] = 0;
              trackerFirer.bind(this)('creativeView');
              trackerFirer.bind(this)('impression');
            p_imp = null;//?
            p_noad = null;
        }
        if (e.data == msgs.noad || e.data == msgs.timeout) { 
            //fire stuff 303
            p_imp = null;
            p_noad = null;
            trackerFirer.bind(this)('error', '303');
            console.log(`### waterfalling down since you no ad`);
            this.next();
        }
        
    }
}

function trackerFirer(action, code) {
    if (this.unfired[action]) {
        this.unfired[action] = 0;
        //console.log(`__ff__${this.trackers + '&action=' + action + (code ? '&errorcode='+code:'')}`);
        fetch(this.trackers + '&action=' + action + (code ? '&errorcode='+code:''), {
            //no typo?
            method: 'GET',
            credentials: 'include'
        }).catch((err) => {
        });
    }
}

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
    let o = {
        unfired: {
            response: 1,
            error: 1,
            impression: 1,
            creativeView: 1
        },
        nextfcn: oneLayer.bind(null, jxContainer, remainingCreativesArr, partners, next),
        msgs: rtjson.msgs,
        trackers: rtjson.trackers? rtjson.trackers.baseurl + '?' + rtjson.trackers.parameters: ''
    };
    let boundMsgListener = msgListener.bind(o);
    let boundTrackerFirer = trackerFirer.bind(o);

    o.next = function() {
        window.removeEventListener('message', boundMsgListener);
        this.nextfcn();
    }
    window.addEventListener('message', boundMsgListener, false);
    if (subtype !== 'jixie') {
        boundTrackerFirer('response');
        if (gOSMVisible) {
            //already visible
            boundTrackerFirer('creativeView');
        }
        else {
            //later when visible then can 
            //no matter how much later.
            gOSMCVTrackers.push(boundTrackerFirer);
        }
    }
    rtjson.inject();
}
function fetchAdP(adTagUrl) {
    return fetch(adTagUrl, {
        method: 'GET',
        credentials: 'include'
    }).then((response) => response.json());
}

//2 modes: fixed height mode
//2 modes: unusable hiehgt mode
//2 different modes for JIXIE ads and partner ads
//try to ask for chance of our ads to increase in size.

//what kind of ids do we get
//my test page
//then my latest OSM amp js file
//then call is to the rc.
//and the call is to a different endpoint
//the only thing it does is to print out some stuff
//
function createInstance_(p, partners) {
    gParams = p;
    console.log(gParams);
    console.log("--- --- --- --- --- ");
    ampOneOffInit_();
    let url = `https://${p.debug?'ad-rc':'ad'}.jixie.io/v2/osm?source=osm`;
    if (p.creativeid == '11111') {
        url = `https://ad-rc.jixie.io/v2/osm?source=osm`;
    }
    ['amp_client_id','client_id', 'unit', 'sid', 'creativeids', 'creativeid'].forEach(function(prop) {
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
        //boundRealNoContent();
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
/*
window.context
  .requestResize(requestedWidth, requestedHeight)
  .then(function () {
    // Hide any overflow elements that were shown.
    // The requestedHeight and requestedWidth arguments may be used to
    // check which size change the request corresponds to.
  })
  .catch(function () {
    // Show the overflow element and send a window.context.requestResize(width, height)
    // when the overflow element is clicked.
    // You may use the requestedHeight and requestedWidth to check which
    // size change the request corresponds to.
  });
*/
