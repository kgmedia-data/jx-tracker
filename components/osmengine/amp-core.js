/**
 * Since AMP ad is in its own iframe, the just let the variables
 * lie around like this (global variables) would do.
 * 
 */
/**
 * OK not really using an OBJECT, but just using globals as I don't like to have too many
 * this.BLABLABLA
 * This code is in a closure and also this is running in its own iframe anyways.
 */
var gOSMVisible         = 0;     //current visibility state of our unit 
var gOSMCVTrackers      = [];    //trackers which still need to be fired once the unit gets inview (backlog)
var gImpFired           = false; //whether has an impression event been fired yet
var gIntObsCBUnlisten   = null;  //the function to call to unlisten on the intersection observation stuff
var gCurrPartnerObj     = null;  //the current partner obj
var gFallbackCreative   = null;  //there is a sure serve at in the waterfall
var gMsgImp             = null;  //set to corr to whatever current partner's expected Imp msg string is
var gMsgNoAd            = null;  //
var gUnitNearViewport   = false;
const visThreshold_ = 0.4;


/**
 * To check if we are "close" to the viewport (entering from below)
 * 
 * WHY NEED to check? 
 * 
 * We may want to cut short a partner which normally takes a long time to find ad
 * 
 * For some partner not known to take a long time, we also want to jump right to the 
 * fall back jixie ad when the partner is done, i.e. by passing partners in the waterfall
 * 
 * Else we will show a big white space by the time the units appears in front of the users' eyes
 * 
 * https://github.com/ampproject/amphtml/blob/main/ads/README.md
 * https://medium.com/dev-channel/intersectionobservers-coming-into-view-c397b4f1f854
 * 
 * e.g. To check if unitTop < ViewPortHeight*(1 + 0.4)
 * if to check if the top of our unit is 0.4*VPHeight from the bottom of the viewport 
 *    (the "1" is coz of "bottom")
 * @param {*} entry (the latest 'change' object from the intersection obsv callback)
 * @returns true or false
 */
/**
 * Note: at first this is not quite accurate coz the ad areas will resize after a bit
 * So it is possible that at first we are closer to the viewport and then later as ads get
 * opened up, we are not so close after all.
 */
function isUnitClose2Viewport(entry) {
    let vpH = entry.rootBounds.height;
    let thresholdTop = vpH*(1+1);
    let unitTop = entry.boundingClientRect.y;
    //actually if already in viewport this also will return true
    //console.log(`#### isClose? ${unitTop} <? ${thresholdTop}`);
    if (unitTop < thresholdTop) {
        return true;
    }
    return false;
}

/**
 * This is the callback to register to the AMP 
 *    window.context.observeIntersection(..)
 * 
 * @param {*} changes : this is an array of changes; but we only process the latest change
 * @returns nothing
 */
function intObsCB(changes) {
    /**
     * Check some conditions and if good then call the unlisten function to call listening
    * to intersection Observation.
    * The conditions are:
    *   impression event fired (some partner network) OR we already waterfalled down to "jixie" (sure got ad)
    *      AND
    *   There is no more outstanding creativeview trackers for the earlier partners that we still need to fire
    */
    //if (gIntObsCBUnlisten && (gImpFired) && gOSMCVTrackers.length == 0) {
      //  gIntObsCBUnlisten();
      //  gIntObsCBUnlisten = null;
      //  return; //we won't come here again. basically this thing can close shop.
    //}

    var entry = changes[changes.length - 1];
    gUnitNearViewport = isUnitClose2Viewport(entry);
    if (!gImpFired && gUnitNearViewport && gFallbackCreative) {
        if (gCurrPartnerObj && gCurrPartnerObj.customfcns && gCurrPartnerObj.customfcns.almostinview) {
            //those slow partners we will have this function
            //this could, e.g. trigger a no ad based on certain heuristics
            if ((Date.now() - gCurrPartnerObj.injectts) > 5000) {
                console.log(`#### ms elapsed: ${Date.now() - gCurrPartnerObj.injectts}`);
                gCurrPartnerObj.customfcns.almostinview();
            }
        }
    }
    //state keeping:
    let vis = (entry.intersectionRatio > visThreshold_); //boolean
    if (vis && !gOSMVisible) {//there is a custom function.
        if (gCurrPartnerObj && gCurrPartnerObj.customfcns.inview) {
            gOSMVisible = true;
            //e.g. unruly has coz sometimes their stuff certain display ads no trigger hasad signal !
            gCurrPartnerObj.customfcns.inview();
        }
    }
    gOSMVisible = vis;
    //array of bound functions.
    let trackers = [];
    if (gOSMCVTrackers.length == 0) {
        //no back firing needed:
        return;
    }
    if (gOSMVisible) {
        trackers = trackers.concat(gOSMCVTrackers);
        gOSMCVTrackers.length = 0;
    }
    for (var i = 0; i < trackers.length; i++) {
        trackers[i]('creativeView');
        //execute these bound functions
        //clear the backlog of creativeViews to fire.
    }
}

//https://github.com/ampproject/amphtml/blob/main/examples/ampcontext-creative.html
//https://jixieamptest.kompas.com/api/testpagegen?filename=ampcombikompas300x400&creativeids=1005|1027

gIntObsCBUnlisten = window.context.observeIntersection(intObsCB);


/**
 * We intercept the AMP apis renderStart, noContentAvailable, requestResize
 * (window.context.renderStart etc)
 * Right now it is just to infer has-ad, no-ad (a backup mechanism in case the usual
 * mechanism to know about has-ad, no-ad fails)
 * 
 * Turns out less useful than thought:
 * Actually at first I thought I could intercept and DOCTOR the partner's parameters
 * and replace with our own to e.g. prevent some request for resize that could fail
 * But turns out it it too dangerous. Can cause ad serving to fail.
 * So now it is just interception in the sense that if I see a renderStart
 * or requestResize, I take it that they have an ad (fire the tracker)
 * 
 * So to supplement the postMessage from the integration in case that does not work out.
 * 
 * Also if partner calls noContentAvailable, we do not pass it on. Coz we still could waterfall
 */
function ampOneOffInit_() {
    let boundRealRenderStart = window.context.renderStart.bind(window.context);
    let boundRealRequestResize = window.context.requestResize.bind(window.context);
    
    //we use this to intercept the partner's calls to the amp runtime!!
    window.context.requestResize = function(...args) {
        /**********
        if (args && args.length >= 2) 
            console.log(`### requestResize ${args[0]}x${args[1]}`);
        else
            console.log(`### requestResize no enough arg`);
        if (args && args.length >= 2) {
            //the real width and height of our unit
            if (args[0] <= gParams.data.rwidth && args[1] <= gParams.data.rheight) {
                console.log(`### (init=${gParams.data.rwidth}x${gParams.data.rheight}) requestResize .. No need pass to amp runtime ${args[0]}x${args[1]}`);
                //so just pass the current size .
                //give up the following idea. cannot work.
                return boundRealRequestResize(gParams.data.rwidth, gParams.data.rheight);
            }
        }
        console.log(`### (init=${gParams.data.rwidth}x${gParams.data.rheight}) requestResize need pass to amp runtime`);
        *********/
        return boundRealRequestResize(...args);
    }
    
    window.context.renderStart = function(...args) {
        if (gMsgImp)
            window.postMessage(gMsgImp, "*");    
        /**********            
        if (args && args.length >= 1) 
            console.log(`### (init=${gParams.data.rwidth}x${gParams.data.rheight}) renderStart ${JSON.stringify(args[0])}`);
        else
            console.log(`### (init=${gParams.data.rwidth}x${gParams.data.rheight}) renderStart no enough arg`);
        if (args && args.length >= 1) {
            let o = args[0];
            if (o && o.width && o.height) {
                if (o.width <= gParams.data.rwidth && o.height <= gParams.data.rheight) {
                    console.log(`### (init=${gParams.data.rwidth}x${gParams.data.rheight}) renderStart we ate your arg`);
                    //cannot . does not work.
                    return boundRealRenderStart(); // no need give arg then.
                }   
            }
        }
        console.log(`### renderStart we passing your arg`);
        **********/
        return boundRealRenderStart(...args);
    }
    window.context.noContentAvailable = function() {
        //we will not pass this on of course. else we will get collapsed!
        //console.log(`### noContentAvailable`);
        if (gMsgNoAd)
            window.postMessage(gMsgNoAd, "*");    
    }
}


//https://www.intertech.com/encapsulation-in-javascript/
    
/**
 * our bound listener to listen to window messages.
 * Per layer of waterfall we cleanly listen and unlisten.
 * 
 * There is the "this" which is like this: is corresponds to the current partner layer
 * {
        unfired: {
            response: these all start with 1, and becomes 0 when fired. To make sure only fired at most 1x.
            error: 
            impression: 
            creativeView: 
        },
        nextfcn: a function to call to go to next 
        msgs: object with the various msgs to match with whatever is incoming.
        trackers: rtjson.trackers? rtjson.trackers.baseurl + '?' + rtjson.trackers.parameters: ''
    };
 * @param {*} e The message string.
 */
function msgListener(e) {
    if(typeof e.data == 'string' && e.data.startsWith('jxosm')) {
        //console.log(`#### e.data=${e.data}`);
        let msgs = this.msgs;

        if (e.data == msgs.imp) { 
            gImpFired = true;
            gMsgImp = null; //to prevent the backup mechanism also firing stuff 
            gMsgNoAd = null;//actually no harm (since we have safety switch we will only fire tracker action once)
            //but just to avoid unnec processing
            trackerFirer.bind(this)('creativeView');
            trackerFirer.bind(this)('impression');
        }
        else if (e.data == msgs.noad || e.data == msgs.timeout) { 
            //if we are close to the viewport ...
            //fire stuff 303
            gMsgImp = null;
            gMsgNoAd = null;
            trackerFirer.bind(this)('error', '303');
            //console.log(`### waterfalling down since you no ad`);
            if (e.data == msgs.timeout || gUnitNearViewport) {
                //gUnitNearViewport type: we let the partner come to its conclusion taking its own time (no ad)
                //but then no time to entertain yet another partner.
                //console.log(`#### recvd ${e.data}->going direct to the last entry`);
                this.last();
            }
            else {
                //console.log(`#### recvd ${e.data}->going to next natural entry`);
                this.next();
            }
        }
    }
}

/**
 * our bound function to fireTracker
 * Note we have safety-mechanism so we will never fire the same action twice for a partner
 * 
 * There is the "this" which is like this:
 * {
        unfired: {
            response: these all start with 1, and becomes 0 when fired. To make sure only fired at most 1x.
            error: 
            impression: 
            creativeView: 
        },
        trackers: ...
        //other properties we dun care
    };
 * @param {*} e The message string.
 */
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

/**
 * process one layer of the waterfall:
 * @param {*} jxContainer 
 * @param {*} remainingCreativesArr 
 * @param {*} partners 
 * @param {*} next 
 * @returns 
 */
var oneLayer = function(jxContainer, remainingCreativesArr, partners, next) {
    let cr = remainingCreativesArr.shift();
    if (!cr) { return; }
    let subtype = cr.subtype;
    let partner = partners[subtype];
    if (!partner) { return; }

    //console.log(`## VP ${cr.subtype} bolean of equality ${cr != gFallbackCreative}`);
    let rtjson = partner.makeNormalizedObj(cr, gParams);
    gMsgImp = rtjson.msgs.imp;
    gMsgNoAd = rtjson.msgs.noad;
    let o = {
        unfired: {
            response: 1,
            error: 1,
            impression: 1,
            creativeView: 1
        },
        nextfcn: oneLayer.bind(null, jxContainer, remainingCreativesArr, partners, next),
        //Then characteristic of the fallback creative is that fallbackfcn is null
        fallbackfcn: cr != gFallbackCreative ? oneLayer.bind(null, jxContainer, [ gFallbackCreative ], partners, next): null,
        msgs: rtjson.msgs,
        trackers: rtjson.trackers? rtjson.trackers.baseurl + '?' + rtjson.trackers.parameters: ''
    };
    let boundMsgListener = msgListener.bind(o);
    let boundTrackerFirer = trackerFirer.bind(o);
    o.next = function() {
        window.removeEventListener('message', boundMsgListener);
        this.nextfcn();
    }
    o.last = function() {
        window.removeEventListener('message', boundMsgListener);
        if (this.fallbackfcn)
            this.fallbackfcn();
    }
    gCurrPartnerObj = rtjson;
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
    rtjson.injectts = Date.now();
    rtjson.inject();
}

function fetchAdP(adTagUrl) {
    return fetch(adTagUrl, {
        method: 'GET',
        credentials: 'include'
    }).then((response) => response.json());
}

function createInstance_(p, partners) {
    gParams = p;
    ampOneOffInit_();
    let url = `https://${p.debug?'ad-rc':'ad'}.jixie.io/v2/osm?source=osm`;
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
        if (creativesArr && creativesArr.length > 0) {
            //To note that we have a fallback creative:
            //For the AMP situation, it is possible we need to jump to it
            //to avoid having a big white space.
            for (var i = 0; i < creativesArr.length; i++) {
                if (creativesArr[i].subtype == "jixie") {
                    gFallbackCreative = creativesArr[i];
                }
            }
            oneLayer(_jxContainer, creativesArr, partners, oneLayer);
        }
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
