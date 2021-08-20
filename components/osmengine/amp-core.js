/**
 * Instrumentation of the AMP context functions
 * One-off only !
 * This whole thing will be in its own iframe lah.
 * So no need worry about many instances and all that.
 * Can also use global variables ...
 * Need a lot more heuristic and junk
 */

var gParams = {};//later will be set.
  
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

/**
 * This is to take care of the creativeView tracker firing of all the partners
 */
window.jxOSMVisible = 0;
window.jxOSMCVTrackers = [];
const visThreshold_ = 0.4;
//what if there is no change?
function cb(param) {
    param.forEach(function(entry) {
        let trackers = [];
        if (entry.intersectionRatio > visThreshold_) {
            window.jxOSMVisible = 1;
        }
        else {
            window.jxOSMVisible = 0;
        }
        if (entry.intersectionRatio > visThreshold_ && window.jxOSMCVTrackers.length > 0) {
            trackers = trackers.concat(window.jxOSMCVTrackers);
            window.jxOSMCVTrackers.length = 0;
        }
        for (var i = 0; i < trackers.length; i++) {
            trackers[i]('creativeView');
            //execute these bound functions
            //clear the backlog of creativeViews to fire.
        }
    });
    //if everything fired then can unlistne ah!
}
let unlisten = window.context.observeIntersection(cb);

//2 modes: size = 1
//other mode is fixed size and cannot be too small lah.
//

var p_imp = null; //global ...set to corr to whatever current partner 
var p_noad = null; //global ...

//The value window.context.initialLayoutRect contains the initial rect of the ad's position in the page.


function ampOneOffInit_() {
    return;//
    let boundRealRenderStart = window.context.renderStart.bind(window.context);
    let boundRealRequestResize = window.context.requestResize.bind(window.context);
    
    /* window.context.requestResize = function(requestedWidth, requestedHeight) {
        console.log(`__$$$$ ${requestedWidth} ${requestedHeight}`);
        if (requestedWidth == 0 || requestedHeight == 0) {
            return Promise.resolve();
        }
        //THINK ...
        return boundRealRequestResize(requestedWidth, requestedHeight).catch(function (err) {
        });
    }
    window.context.renderStart = function(arg1, arg2) {
        console.log(`__$$$$ renderStart ${arg1} ${arg2}`);
        //should call the bound function to fire trackers to make sure
        //only fire each action at most once.
        if (p_imp)
            window.postMessage(p_imp, "*");    
        //not accurate. depends on the vendor.
        return boundRealRenderStart();
        opt_hasOverflow
    }*/
    window.context.requestResize = function(...args) {
        if (args && args.length >= 2) 
            console.log(`### requestResize ${args[0]}x${args[1]}`);
        else
            console.log(`### requestResize no enough arg`);
        if (args && args.length >= 2) {
            if (args[0] <= gParams.data.width && args[1] <= gParams.data.height) {
                console.log(`### requestResize No need pass to amp runtime ${args[0]}x${args[1]}`);
                //setTimeout(function() {
                  //  if (window.context.onResizeSuccess)
                    //    window.context.onResizeSuccess(args[0], args[1]);
                //}, 50);    
                return boundRealRequestResize(args[0], args[1]);
                //return Promise.resolve(); //no need tell AMP runtime lah...
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
        console.log(`### noContentAvailable`);
        if (p_noad)
            window.postMessage(p_noad, "*");    
    }
}

function msgListener(e) {
    console.log(`${e.data}`);
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
            error: 1,
            impression: 1,
            creativeView: 1
        },
        fcn: oneLayer.bind(null, jxContainer, remainingCreativesArr, partners, next),
        msgs: rtjson.msgs,
        trackers: rtjson.trackers? rtjson.trackers.baseurl + '?' + rtjson.trackers.parameters: ''
    };
    let boundMsgListener = msgListener.bind(o);
    let boundTrackerFirer = trackerFirer.bind(o);

    o.next = function() {
        window.removeEventListener('message', boundMsgListener);
        this.fcn();
    }
    window.addEventListener('message', boundMsgListener, false);
    if (subtype !== 'jixie') {
        if (window.jxOSMVisible) {
            //already visible
            boundTrackerFirer('creativeView');
        }
        else {
            //later when visible then can 
            //no matter how much later.
            window.jxOSMCVTrackers.push(boundTrackerFirer);
        }
    }
    rtjson.inject();
}
function fetchAdP(adTagUrl) {
    return fetch(adTagUrl, {
        //no typo?
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
    if (p.data.height == 1) {
        //means we really must do the request for resize else nothing will work

    }
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