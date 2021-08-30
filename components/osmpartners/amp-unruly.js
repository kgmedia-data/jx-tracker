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

/**
 * this is an unruly thing. Sometimes they have some display ads which are actually
 * shown, but they do not trigger the AdLoaded function so we actually won't know
 * there is an impression. 
 * Wah then this needs to be 
 * @param {*} msgs 
 * @returns 
 */
function checkSomethingIsThere_() {
    let theC = document.getElementById("c");
    let children = theC.getElementsByTagName('*');
    if (children && children.length > 0) {
        for (var i = 0; i < children.length; i++) {
            if (children[i].nodeName == 'DIV' || children[i].nodeName == 'IFRAME' ) {
                if (children[i].offsetHeight > 100) {
                    //cannot wor we can 
                    //ok at this stage we cannot do anything yet.
                    //we can only do a hasad only
                    //not yet an impression
                    //then if inview then we will fire the impression too.
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * is an Unruly thing coz it seems some of their ads (I believe is associated with display ads)
 * the ads is there but no imp is triggered.
 * So using heuristic to figure out ... there is something here.
 * @param {*} msgs 
 * @param {*} inview 
 * @returns 
 * 
 * When used with inview false (that means we are close to the viewport but not in there), then 
 * if there is "nothing" in there, then we infer no ad, and psotmessage(timeout)
 * But we do not send an iimpression notice
 * 
 * When used with inview true, then if there is nothing in there, we infer no ad
 * if there is something in there, we fire an impression.
 * 
 */

function forceTriggerAdNoticeByHeuristic_(msgs, inview) {
    if (this.called) return;
    this.called = true;
    if (checkSomethingIsThere_()) {
        console.log(`#### forceTriggerAdNoticeByHeuristic_ yes inviewBool=${inview}`);
        if (inview)
            window.postMessage(msgs.imp, "*");
    }
    else {
        console.log(`#### forceTriggerAdNoticeByHeuristic_ no sending timeout`);
        //dun want to wait anymore.
        window.postMessage(msgs.timeout, "*");
    }
}

function inject_(siteId, msgs) {
    siteId = '1018656'; //'amp-test';
    // siteId = '1111362'; //tribunnews amp
    //siteId = '218003'; //kompas
    //1018656, 218003 3709286
    window.unruly = window.unruly || {};
    window.unruly.native = {
        siteId: siteId
    };
    window.unruly.native.onAdLoaded = function() {
         console.log(`__#### .. .. onAdLoaded`);
        window.postMessage(msgs.imp, "*");
        return '';
    };
    window.unruly.native.onFallback = function(){
        console.log(`#### ON FALLBACK ${(new Date()).toUTCString()}`);
        window.postMessage(msgs.noad, "*");
        //then it is something to bring in our own ad loh
        //Need to throw an exception else if it goes back to Unruly code,
        //it will wipe out the whole window.
        //but unruly onFallback is called very very late,
        //it is when the user almost passes the slot visually.
        //so there is no point to waterfall it to anything then!
        //meaning this thing here is useless.
        throw new Error('');
    }; 
    //let theC = document.getElementById("c");
    //let trylah = document.createElement('div');
    //trylah.className = 'contentArticle';
    //trylah.innerHTML = '<p></p>';
    //theC.parentNode.appendChild(trylah);
    let scriptUrl = 'https://video.unrulymedia.com/native/native-loader.js';
    const s = document.createElement('script');
    s.src = scriptUrl;
    document.body.appendChild(s);
}

function makeNormalizedObj__(dbjson, rtjson) {
    common_(rtjson);
    rtjson.msgs = {
        hasad: `jxosm_noad_unruly`,
        noad: `jxosm_noad_unruly`,
        imp: `jxosm_imp_unruly`,
        timeout: `jxosm_timeout_unruly`
    };
    rtjson.inject = inject_.bind(null,
        dbjson.adparameters.siteId, rtjson.msgs
    );
    rtjson.customfcns = {
        //for unruly we have this situation whereby they play some
        //display ad . then for these things, there is no onFallback call nor
        //adLoaded call.
        //So we try to do a heuristic. After the inview, check whether "there is stuff"
        //inside the div for unruly (innerHTML). Use that to approx.
        //just do it once. 
        //last arg is "inview" or not (bollean)
        almostinview: forceTriggerAdNoticeByHeuristic_.bind({called: 0}, rtjson.msgs, false),
        inview: forceTriggerAdNoticeByHeuristic_.bind({called: 0}, rtjson.msgs, true)
    };
    return rtjson;
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name = 'unruly';

/* 
 ************** module: osmpartners/amp-unruly **************************************************

* module.exports:
    - makeNormalizedObj (function)
        - returns an object which the amp-core JS can use to inject unruly script etc

        - the output object has the following properties
        timeout (-1 means dun have any)
        partner (here it will be "unruly")
        trackers
        stackidx
        stackdepth
        instID: 
        valid: true/false
        inject: a function to be called (by the amp-core) 
        msgs : an object of the messages to expect from partner script to inform of
            noad, hasad, impression   <-- this does not apply to jixie ads (since the ad already finalized when we reach this stage)
        customfcns  - not used                
    
* requires/dependencies:
    - none
*/
