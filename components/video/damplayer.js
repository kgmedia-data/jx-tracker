  /**
     * The object that is actually exposed (via prototype functions) to the outside world 
     * (publisher javascript)
     * 
     * Exposes the following APIs for outside to call:
     * - Constructor (with a options object)
     * - load
     * - addEventListener
     * - play
     * - pause
     * 
     */
//if (!window.JX) {
  //  window.JX = {};
//}
const modulesmgr            = require('../basic/modulesmgr');
//Not needed const common                = modulesmgr.get('basic/common');
const jxvhelper              = modulesmgr.get('video/jxvideo-helper');
const consts                = modulesmgr.get('video/consts');
const MakePlayerWrapperObj  = modulesmgr.get('video/player-factory');
const common =              modulesmgr.get("basic/common");

function slackItMaybe() {}
const errCodeDAMApiError_   = 1997;
const defaultAdDelay_       = consts.defaultAdDelay;
const fallbackTech_         = consts.fallbackTech; 'mp4'; //SHARE AH
//read frm the ids //SHARE AH

const startModePWClick_     = consts.startModePWClick;
const startModePWAuto_      = consts.startModePWAuto;
const startModePWApi_       = consts.startModePWApi;
const startModeSDKApi_      = consts.startModeSDKApi;
const startModeSDKClick_    = consts.startModeSDKClick;

//var DAMApiBase_ = 'https://jixie-dam-api-w.azurewebsites.net/api/stream?format=hls&metadata=basic';
var DAMApiBase_ = 'https://jx-dam-api-express.azurewebsites.net/api/stream?format=hls&metadata=basic';



const IRThreshold_ = 0.5;

function createObject_(options, ampIntegration) {
    if (options.restrictions.maxwidth == 852) {
        options.restrictions.maxwidth = 853;
    }
        
    if (options.restrictions) {
        if (options.restrictions.maxheight > 0) 
            DAMApiBase_ += '&max-height=' + options.restrictions.maxheight;
        if (options.restrictions.maxwidth > 0) 
            DAMApiBase_ += '&max-width=' + options.restrictions.maxwidth;
    }
    var _dbgCountOOS = 0;
    var _dbgCountLoad = 0;
    var _dbgL1VP = 0;
    var _dbgVersion = 'v';
    _dbgVersion = options && options.dbgVersion ? options.dbgVersion: 'v0';
    
    var _vInfoMap = null;
    var _ampIntegration = ampIntegration; //so could be null
    var _videos = [];
    var _fakeLocalDam = []; //this is to support the mode of caller using loadTest to force a HLS stream (rather than going thru DAM)
                            //Used in conjunction with this specialVideoId_
    const specialVideoId_ = 230945023482390829048;  //this is to support the loadTest mode whereby a streamURL is given.
    
    var _options = {}; // a copy of the stuff from the user.

    //this is config at our level:
    // for startModePW, tryPlayPause, onErrGoNextV, onEndedGoNextV
    var _cfg = {
    };
    var _vidFetchAcctId = null;
    var _vidConfAcctId = null;
    var _forcePlatform = null;
    var _startOffset = -1; //nothing specially forced. will try from cookie
    var _regCBs = {
    };

    var _container = null;
    var _pInst = null; //the actual playerWrapper object
    var _currIdx = -1; //current video index
    var _currVid = null; //current video id

    //for the intersection observer and visibility observer stuff.
    var _obs = null;
    var _currentIR = -1;
    //var _obsEntry = null;
    //var _visFactor = 0; //for reporting (we have this dimension)
    var _visFactor2 = -1; //alternative calculation. -1 means dunno
    var _msLastErrorTracker = 0; //a mechanism to prevent firing too many error trackers (used in _sendVTracker)

    //catalog of all the events we exposed to the caller of the SDK (e.g. widget code)
    //the property name is always the name of the listenable event exposed to the user of our sdk
    //the type, raw help us to map from event emitted from the playerwrapper object
    //to the event (name per what we expose to the api user.)
    //HOWEVER, the playerwrapper object is PER VIDEO so it is simple-minded.
    //Some of these e.g. ad_started, corresponds simply to what the playerWrapper object
    //emits, some of these, not so simple: e.g.
    //We need to support "playlist-based" kind of events too e.g. start and ended which can be
    //the WHOLE play list. Therefore there is logic in this layer to emit these events that's why
    //they are called synthetic. 
    //Refer to _routeEvent to see what's going on:
    const allEvents_ = {
        internal1: {
            type: "video",
            raw: 'internal1'
        },
        start: {
            type: "synthetic",
            raw: 'setstarted' //the whole set (playlist, array) that the load([]) gave
        },
        ended: {
            type: "synthetic",
            raw: 'setended'
        },
        video_started: {
            type: "synthetic",
            raw: "videostarted" 
        },
        videochange: {
            type: "synthetic",
            raw: "videochanged" 
        },
        error: {
            type: "video",
            raw: "error" 
        },
        ad_started: {
            type: "ad",
            raw: "started" 
        },
        ad_ended: {
            type: "ad",
            raw: "ended" 
        },
        ad_paused: {
            type: "ad",
            raw: "pause" 
        },
        ad_playing: {
            type: "ad",
            raw: "playing" 
        },
        video_ended: {
            type: "video",
            raw: "ended" 
        },
        //whatever is top layer.
        paused: {
            type: "toplayer", //can be either ad or content in context . whichever it is
            raw: "pause" 
        },
        playing: {
            type: "toplayer", //can be either ad or content in context . whichever it is
            raw: "playing" 
        },
        ready: {
            type: "video",
            raw: "ready"
        }
    };
    
    function _addEventListener(eName, cb) {
        {
            let blob = allEvents_[eName];
            if (!blob) { 
                return;
            }
        }
        if (!_regCBs[eName]) {
            _regCBs[eName] = [];
        }
        if (_regCBs[eName].length > 0) {
            console.log("[PlayerSDK  It is probably an unintended error that you are registering yet another callback for the same event. We are replacing the current with the new]");
            _regCBs[eName][0] = cb;
        }
        else 
            _regCBs[eName].push(cb);
    }
    /**
     * published API : for publisher using our sdk to subscribe to our events
     * @param {*} ename 
     * @param {*} cb 
     */
    JXPlayerInt.prototype.addListener = function(eName, cb) {
        slackItMaybe('[ addListener.jixie.io: event=' + eName + "]");

        _addEventListener(eName, cb);
    }
    /**
     * published API : for publisher using our sdk to subscribe to our events
     * @param {*} ename 
     * @param {*} cb 
     */
    JXPlayerInt.prototype.addEventListener = function(eName, cb) {
        slackItMaybe('[ addListener.jixie.io: event=' + eName + "]");
        _addEventListener(eName, cb);
    }
    function _sdkEmitEvents(argBlob, videoInfoObj, errObj) {
        let intName;
        if (typeof argBlob == 'string') {
            intName = argBlob; 
        }
        else {
            //fix this stupid later.
            for (var e in allEvents_) {
                let item = allEvents_[e];
                if (item.type == argBlob.type && item.raw == argBlob.raw) {
                    intName = e; 
                }
            }
        }
        if (!_regCBs[intName]) {
            return; //nothing to do
        }
        for (var i = 0; i < _regCBs[intName].length; i++) {
            try 
            {
                //depends on whether it is internal or external leh!!
                //we dun call them immediately. we have it queued:
                let videoid = videoInfoObj ? videoInfoObj.extid: _currVid;
                let boundFcn =  _regCBs[intName][i].bind(null, intName, videoid, errObj ? errObj.code: 0);
                //the only reason we put .jixie.io is that the thing will be highlighted in the Slack
                //display so easier to see..
                //slackItMaybe('[ sdkEmitEvent.jixie.io: event=' + intName + ': ' + 'videoid=' + videoid + '/errcode=' + (errObj ? '*** ' + errObj.code + ' ***': 0) + ']');
                //make sure if they crash we are not affected.
                setTimeout(boundFcn, 0);
            }
            catch(err) {
                console.log(err.stack);
            }
        }
    }

    //special things for the hlserror event
    //hlserror is internal.

    /**
     * Send the tracking events to our endpoint
     * For each event the accompanying query parameters are from different sources
     * some are page invariant (shared by all player instances on the page)
     * some of player invariant (i.e. no matter which playlist, video): set in _evtHelper.trackerBase once
     * the rest are for this current event:
     * @param {*} e 
     * @param {*} v 
     * @param {*} errBlob 
     * @returns 
     * _vInfoMap[jxId]
     */
    function _sendAgg(v) {
        //videoid, ownerid publisher id (accountid)
        let timeleft = _vInfoMap[v.videoid].metadata.duration - v.playhead;
        timeleft = timeleft < v.step ? Math.round(timeleft): v.step;
        let url = _evtsHelperBlock.aggTrackerBase + '&step=' + timeleft + '&action=duragg&videoid=' + v.videoid + 
            '&ownerid=' + _vInfoMap[v.videoid].owner_id +  '&rendition=' + v.w + 'x' + v.h;
        common.sendBeacon(url);
    }
    function _sendVTracker(action, v, errBlob) {
        let dbgProp = _dbgVersion; // + "_OOS_" + _dbgCountOOS + "_L_" + _dbgCountLoad + "_LVP_" + _dbgL1VP;
        if (!_evtsHelperBlock) {
            return;
        }
        //For these, no concept of videoid potentially
        if ((!v || !v.videoid) && (action != 'creativeView')) { 
            return; //this is erorr not emitted from the playerWrapper but
            //but looks like emitted e.g. cannot read DAM API etc.
        }
        if (v && v.videoid == specialVideoId_) {
            //special tests videos.
            return; 
        }
        let diffTime = 0;
        let DateNow = Date.now();
        if (action == 'ready' || action == 'creativeView') {
            let refTime = jxvhelper.getScriptLoadedTime();
            diffTime = DateNow - refTime;
        }
        else if (action == 'start') {
            diffTime = 0;
            //a second start.
            //from the first start.
            //or error dun have also ok
            //we dun need a reference point
            //...
        }
        else if (action == 'start2') {
            diffTime = _evtsHelperBlock.video.start2diff;
            action = 'start';
        }
        else {
            if (_evtsHelperBlock.video.startts == -1) {
                //if we already playing and we still have not registered any
                //start trigger, well too bad. We just have to put a number there.
                _evtsHelperBlock.video.startts = Date.now() -5;
                dbgProp += "_NOREF_1";
            }
            //reference point of all the events.
            console.log(`# ${action}: 
                # w/o: ${DateNow - _evtsHelperBlock.video.startts}
                # w: ${DateNow - _evtsHelperBlock.video.startts - (v.mspaused ? v.mspaused : 0)}`)
                
            diffTime = DateNow - _evtsHelperBlock.video.startts - (v.mspaused ? v.mspaused : 0);
            if (diffTime <0) diffTime = 0;
        }
        if (action == 'error') {
            //We suppress errors that occurs in too close proximity
            //Why? if a setup is unable to play any video (HLS+mp4), we will emit an error
            //event and then try the next video. However, it is the same setup, so likely
            //another fail and another error event, as the playlist is traversed;
            //That will spoil our data coz really,
            //it is about the same thing, no need to fire so many events. 
            //Threshold is currently set to 1 minute 60*1000ms
            if (DateNow - _msLastErrorTracker < 60000) {
                return;
            }
        }

        let url = "";
        //console.log(`${e} Using refer time = ${refTime}`);
        //let vab = parseInt(_visFactor * 100);
        if (_visFactor2 == -1) {
            _visFactor2 = jxvhelper.getViewFraction(_container);
        }
        let vab2 = parseInt(_visFactor2 * 100);
        if (v) {
            url = _evtsHelperBlock.trackerBase + 
            '&videoid=' + v.videoid + 
            '&ownerid=' + _vInfoMap[v.videoid].owner_id +
            '&vposition=' + (_evtsHelperBlock.vposition < 0 ? 0: _evtsHelperBlock.vposition) +
            '&startmode=' + _evtsHelperBlock.video.lastgesture +
            '&playhead=' + v.playhead +
            (errBlob ? '&errorcode=' + errBlob.code : '') +
            '&viewability=' + vab2 +
            '&segment=' + _evtsHelperBlock.video.segment + 
            '&origtech=' + v.origtech + 
            '&realtech=' + v.realtech + 
            '&volume=' + v.volume +
            (action != 'hlserror' ? '&debug=' + dbgProp: '');
            if (v.adslotduration) {
                url += '&adduration=' + v.adslotduration;
            } 
            if (v.w > 0 && v.h > 0) {
                url += '&rendition=' + v.w + 'x' + v.h;
            }
        }    
        else {
            url = _evtsHelperBlock.trackerBase + 
            '&viewability=' + vab2 +
            '&debug=' + dbgProp;
        }        

        if (action == 'hlserror' && errBlob){
            url += '&debug=' + encodeURIComponent(errBlob.details); //errBlob: details 
        }
        if (action == 'play') {
            url += '&step=' + jxvhelper.getStep();
        }
        //if (action.startsWith('play') || action == 'start') {
          //  console.log(`S_S_S_S_S_S_sendTracker: action=${action} diffTime = ${diffTime}`);
        //}
        if (action == 'play_2s' && v.adjustms > 0 && v.adjustms < diffTime) {
                //this one is milliseconds
                //console.log(`SENDINGA ${diffTime} (minus ${v.adjustms})`);
                diffTime -= v.adjustms;
                //console.log(`SENDINGB ${diffTime} `);
        }
        let delta = ('&elapsedms=' + diffTime) + ('&action=' + action);
        if (action == 'error') {
            _msLastErrorTracker = DateNow;
        }
        //let's say we do not bother!
        common.sendBeacon(url+delta);
    }

    /*
    function drWifiValueFromDam(value) {
        //console.log(`## drWifiValueFromDam: ${value}`);
        if (common.isMobile()) {
            value = 'mobile';
            let connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                //alert(`a=${connection.type} b =${connection.effectiveType}`);
                //console.log(`## drWifiValueFromDam: type ${connection.type}`);
                //console.log(`## drWifiValueFromDam: eff type ${connection.effectiveType}`);
            	if (connection.type == "wifi") {
                    //if (['slow-2g', '2g', '3g'].indexOf(connection.effectiveType) == -1) {
		            if (['slow-2g', '2g'].indexOf(connection.effectiveType) == -1) {
	   	                value = "wifi";
		            }
	            }
	        }
            //else {
            //    alert("connection not defined");
            //}
        }
        //else {
        //    alert("IS NOT MOBILE");
        //}
        return value;
    }
    */
    
    /**
     * figure out the startMode once and for all.
     * O no ... actually the wifi non wifi it will change ah
     * if the user spend 3 hours on this page ...
     * @param {*} nwFromAPI 
     * @returns 
     */
    function _workoutStartModeOnce(nwFromAPI) {
        let hasWifi;
        if (nwFromAPI) {
            //nwFromAPI = drWifiValueFromDam(nwFromAPI);
            //it is possible to get 'unknown' from the the video info api endpoint
            //in that case we assume no wifi. so all good
            hasWifi = (nwFromAPI == 'wifi');
        }
        else {
            hasWifi = (jxvhelper.getNetworkType() == 'wifi'); 
        }
        //we can use this for special testing
        if (_options.dev_network) {
            hasWifi = (_options.dev_network == 'wifi'); 
        }
        //already got stuff ie initialized liao
        if (_cfg.startModePW) 
            return;
        //REMINDER: this startMode is from the standpoint of the playerWrapped object
        //api means wait for the playerWrapped object's play() API to be called (by JXIntPlayer layer: which
        //can be from widget or from intersectionObserver)

        //auto means playerWrapper object should just go ahead and call video.play()

        if (_options.autoplay == 'wifi' && hasWifi || _options.autoplay == 'always') {
            //'justdoit' : this is our backdoor to force our player to try autoplay
            //coz somehow even at home sometimes the system (browser network connection api)
            //will detect my wifi as 4g!!
            if (_options.autopause) {
                //wait for our intersectionObserver stuff to call play() 
                //on the player-wrapper object
                //or the publisher JS to call our JXPlayer play API
                _cfg.startModePW = startModePWApi_;
            }
            else {
                _cfg.startModePW = startModePWAuto_; //no need wait for the play api of the playerwrapper obj
                //to be called ()
            }
            //Note: In the playerwrapper object, whether  api or auto, it is still calling
            //the play api of the HTML5 video object 
        }
        else {
            _cfg.startModePW = startModePWClick_;
        }
        //what should be the startMode of the SUBSEQUENT plays (after the first video)
        //all just switch to auto?
        //Currently I do that (hence the "true"). If need to expose this to options, then we have to add another options loh:
        _cfg.startModePW2 = (true ? startModePWAuto_: _cfg.startModePW);
    }
    /**
     * 
     * @param {*} options 
     * @returns array of adtags , null if  dun want to play ads
     */
     function getParameterByName(name, url) {
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if(!results) return null;
        if(!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
    function prepareAdsObj(options) {
        if (!options.ads) {
            //this is the case they dun want ads loh.
            //delay -1 no ads will be done then.
            options.ads = { delay: -1};
        }
        
        if (options.ads.delay>=0) {
            let adUrl = (options.ads.unit ? jxvhelper.getAdTag(options): null);
            let adUrl1 = null, adUrl2 = null;
            if (adUrl) {
                adUrl1 = adUrl + '&unit=' +options.ads.unit;
                adUrl2 = adUrl + '&unit=' +(options.ads.mrunit? options.ads.mrunit: options.ads.unit);
            }
            if (window.location.href && window.location.href.includes('jxadtag') ) {
                let tmp1 = getParameterByName('jxadtagurl', window.location.href);
                if (tmp1) {
                    adUrl1 = tmp1;
                    adUrl2 = tmp1;
                }
            }
            if (adUrl1) {
                if (!options.ads.adtagurl)
                    options.ads.adtagurl = adUrl1;
                if (!options.ads.adtagurl2)
                    options.ads.adtagurl2 = adUrl2;
            }
            else {
                options.ads.delay = -1; //cannot do ads then.                    
            }
        }
        
    }
    function repairMissingOptions(options) {
        if (options.hasOwnProperty('muted')) {
            // backward compatiable:
            if (options.hasOwnProperty('sound')) {
                delete options.muted;
            }
        }
        //This is only for crucial properties that cannot be missing
        //a final options object. 
        //use a JSON to do it. Merging of defaults and supplied options:
        [   {sub:null, p:'autopause',d: true},
		    {sub:null, p:'autoplay',d: "wifi"},
		    {sub:null, p:'sound',d: "off"},
            {sub:null, p:'starttime',d: -1}, //meaning let the mechanism works (cookie)
		    {sub:'ads', p:'delay',d: defaultAdDelay_},
		    {sub:'ads', p:'prerolltimeout',d: 5000},
	    ].forEach(function(one) {
		    o = one.sub? options[one.sub]: options;
		    if (o && !o.hasOwnProperty(one.p)) {
			    o[one.p] = one.d;
		    }
	    });
       
        if (window.IntersectionObserver) {
            _cfg.tryPlayPause = _options.autopause;
         }
         else {
            //just let it be, on these old old browsers. Just dun die                 
            _options.autopause = false; 
            _options.autoplay = 'none';
            _cfg.tryPlayPause = false; 
         }
    }

    function _JXPlayerInt(options) {
        slackItMaybe("[ init.jixie.io : " + (options ? JSON.stringify(options): "") + "]");
        if (!options) {
            alert('Developer Alert: No options object provided. Aborting');
            return;
        }
        if (!options.accountid) {
            alert('Developer Alert: No accountid in options object. Aborting');
            return;
        }
        _vInfoMap = {};
        //TODO we start with some default values and then have the stuff merged with the user's wishes.
        //Some feeding of defaults:
        // must be very careful...
        // the only objects which it can work on are blabla...
         _options = JSON.parse(JSON.stringify(options)); //augmented if needed.
        //if (!_options.hasOwnProperty('container')) {
          //  _options.container = '#body';
         //}
         if (_options.container == jxvhelper.getJxDocBodyId()) {
            _container = document.body;
         }
         else 
            _container = document.getElementById(_options.container);

         //container/autopause/cannot be changed server side.
        //autoplay still can.

         if (window.IntersectionObserver) {
            _cfg.tryPlayPause = _options.autopause;
         }
         else {
            //just let it be, on these old old browsers. Just dun die                 
            _options.autopause = false; 
            _options.autoplay = 'none';
            _cfg.tryPlayPause = false; 
         }
         _cfg.onErrGoNextV = true;
         _cfg.onEndedGoNextV = true;
        /* if (window.IntersectionObserver) {
            _visSetup2(); //for reporting trackers : one of the dimensiosn is this visiblity thing.
        }*/
        _visFactor2 = jxvhelper.getViewFraction(_container);
        document.addEventListener("scroll", function() {
            //so the value is "dirty", next time, if we need to use it, need to call
            //getViewFraction again.
            _visFactor2 = -1; //jxvhelper.getViewFraction(_container);
        });
        _triggerEarlyBirdP();
    }
    /**
     * Constructor:
     * @param {*} options 
     */
    function JXPlayerInt(options) {
        _JXPlayerInt(options);
        return;
    }
    /**
     * Externally exposed API
     * 
     */
    JXPlayerInt.prototype.play = function(videoId = null) {
        slackItMaybe("[ play.jixie.io : ]");
        if (_pInst) {
            if (videoId) {
                if (_videos.length == 0) {
                    console.log("JXPlayerSDK: play(videoId) call ignored!");
                    console.log("JXPlayerSDK: Need to have first called player.load or loadJx to give it a playlist!");
                    console.log("JXPlayerSDK: play(videoId) is for out of sequence playing of a video in a playlist");
                    return;
                }
                _playOOSVideoId(videoId);
            }
            else {
                _pInst.play();
            }
        }
    }
    /**
     * So the player wrapper layer tells us about the gestures it perceived.
     * We note it down so as to fire the start event based on requirements
     * an intention one (which may or may not succeed) . which is recorded in 0th
     * and it will trigger immediately a sending of 'start' event tracker
     * Subsequently any gesture other than a click will be ignored.
     * If we actually get a click then we put it in second pos of the array
     * If play starts, then when we send the play event, we send also a second start event
     * (to commemorate this gesture which really really "did it")
     * @param {*} type 
     * @param {*} v 
     */
    //type can be 'click', 'api', 'auto'.
    //startmode is added by us.
    var _gestureReportHandler = function(type, v) {
        let arr = _evtsHelperBlock.video.gestures;
        switch (arr.length) {
            case 0:
                let t = Date.now();
                //console.log(`S_S_S_S gestureReport ${type} added to 0th ${t}`);
                arr.push({type: type, ts: t});
                _evtsHelperBlock.video.startts = t;
                _evtsHelperBlock.video.lastgesture = type;
                _routeEvent('video', 'start', v);
                break;
            case 1:
                //if there is already a TS sitting in there, then we only will add a type click
                if (type == startModeSDKClick_ || type == startModeSDKApi_) {
                    _evtsHelperBlock.video.lastgesture = type;
                    let t = Date.now();
                    arr.push({type: type, ts: t});
                }
                break;
        }//switch.
    }
    /**
     * Externally exposed API
     */
     JXPlayerInt.prototype.pause = function() {
        slackItMaybe("[ pause.jixie.io : ]");
        if (_pInst) {
            _pInst.pause();
        }
    }

  
    //this gets called each time we have a new video to play
    //certain baseline values we need to set so that we can emit our events
    //(video trackers) properly:
    /**
     * it will be called when loadJx, load is called.
     * In that case all params null
     * mainly to instantiate 
     * @param {*} videoData 
     * @param {*} downgrade 
     * @returns 
     */
     function _initEventsHelpers(videoData = null, downgrade = false) {
        /* 
        if (!_evtsHelperBlock) {
            _evtsHelperBlock = JSON.parse(JSON.stringify(unfiredOneTimeEvtsSeed_));
            _evtsHelperBlock.trackerBase = jxvhelper.getTrackerBase() + '&accountid=' + _options.accountid + 
                     (_options.customid ? '&customid='+ _options.customid: '') +
                     '&autoplay=' + _options.autoplay,
            _evtsHelperBlock.vposition = -1;
        }
        */
        if (!_evtsHelperBlock) {
            _evtsHelperBlock = JSON.parse(JSON.stringify(unfiredOneTimeEvtsSeed_));
            _evtsHelperBlock.trackerBase = jxvhelper.getTrackerBase(_options) + '&accountid=' + _options.accountid + 
                     (_options.customid ? '&customid='+ _options.customid: '') +
                     '&autoplay=' + _options.autoplay;
            _evtsHelperBlock.aggTrackerBase = jxvhelper.getAggTrackerBase() + '&accountid=' + _options.accountid;
            _evtsHelperBlock.vposition = -1;
        }
        
        if (videoData) {
            //starting a new video
            if (!downgrade && _evtsHelperBlock.vposition >= 0) {
                //the tracker events elapsedms need that reference point.
                ////////_evtHelper.refTime = (new Date()).getTime();
                //console.log(`___jxvideosdk____ new video set a refTime: ${_evtHelper.refTime }`);
            }
            _evtsHelperBlock.video = JSON.parse(JSON.stringify(unfiredOneTimeVideoEvtsSeed_));
            if (!downgrade)
                _evtsHelperBlock.vposition++;
            if (videoData.segment) {
                _evtsHelperBlock.video.segment = videoData.segment;
            }
        }
     }
     
     /**
      * For the widget to tell us that they have changed the container size
      */
     JXPlayerInt.prototype.notifyResize = function() {
        slackItMaybe("[ notifyResize.jixie.io : ]");
        
         if (_pInst) {
            window.dispatchEvent(new Event("jxintresize", {bubbles: true}));
         }
     }
     function _playOOSVideoId(videoid) {
         _dbgCountOOS++;
         let idx = -1;
         for (var i = 0; i < _videos.length; i++) {
            if (_videos[i] == videoid) {
                idx = i;
                break;
            }
        }
        if (idx > -1) {
            _currIdx = idx;
            let vid2Fetch = _videos[_currIdx];
            _fetchNPlay1VP(vid2Fetch);
        }
    }
    
    
    /**
     * The follow are our player's main entry points 
     * The loadJx and load are the older ones here for sake of compatiability
     * @param {*} videoId 
     * @param {*} startOffset 
     * @param {*} playEndCB 
     * @param {*} forcePlatform 
     */
     JXPlayerInt.prototype.loadVideoById = function(videoId, startOffset, playEndCB, forcePlatform) {
        _load(true, [videoId], (playEndCB === undefined ? null: playEndCB), 
            (forcePlatform === undefined? null:forcePlatform), 
            (startOffset === undefined? -1: startOffset));
     }
     JXPlayerInt.prototype.loadVideoByPartnerId = function(videoId, startOffset, playEndCB, forcePlatform) {
        _load(false, [videoId], (playEndCB === undefined ? null: playEndCB), 
            (forcePlatform === undefined? null:forcePlatform), 
            (startOffset === undefined? -1: startOffset));
     }
     JXPlayerInt.prototype.loadJx = function(param, playEndCB, forcePlatform) {
        _load(true, param, (playEndCB === undefined ? null: playEndCB), (forcePlatform === undefined ? null: forcePlatform));
     }
     JXPlayerInt.prototype.load = function(param, playEndCB, forcePlatform) {
        _load(false, param, (playEndCB === undefined ? null: playEndCB), (forcePlatform === undefined ? null: forcePlatform));
     }
     JXPlayerInt.prototype.loadPlaylistById = function(param, playEndCB, forcePlatform) {
        _load(true, param, (playEndCB === undefined ? null: playEndCB), (forcePlatform === undefined ? null: forcePlatform));
     }
     JXPlayerInt.prototype.loadPlaylistByPartnerId = function(param, playEndCB, forcePlatform) {
        _load(false, param, (playEndCB === undefined ? null: playEndCB), (forcePlatform === undefined ? null: forcePlatform));
     }
     /**
      * This is for internal testing use only: caller directly specifies a stream url.
      * @param {*} param 
      * this is a request at a later stage of our development.
      * so we continue to use the _videos[] construct.
      * params can be a string (stream url)
      * or it can be an object: must have url property. In addition can also have thumbnail and network
      */
    JXPlayerInt.prototype.loadTest = function(param) {
        //param = {
          //  mp4url: 'https://video.jixie.media/1002/32719/32719_240p.mp4'
        //};
        //https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8
        //https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8
        /*
        data:
            conf: nothing
            metadata: 
                duration
                thumbnail (string)
            network "wifi"
            segment "hw-timer"
            streams: [
                {type: HLS, url: ""},
                ...
            ]
            video_id: 
        */
        _fakeLocalDam = []; //reset it.
        let arrFakeVideoIds = [];
        if (!Array.isArray(param)) {
            param = [param];
        }
        if (param.length > 1) {
            //ok currently we only do 1 video.
            param.length = 1;
        }
        param.forEach(function(elt) {
            let o = { 
                streams: [],
                metadata: {
                    title: ' '
                },
                //duration: 1000, we will not "pre-know" the duration then. we will just detect it when the video is loaded.
                network: "wifi",
                segment: "hw-timer" //it does not matter, just to fill in something to prevent programme errors
                //no trackers will be sent anyways
            };
            if (typeof elt === 'string') {
                o.streams = [ {type: 'HLS', url: elt}];
            }
            else {
                if (elt.hls) 
                    o.streams.push({type: 'HLS', url: elt.hls});
                if (elt.mp4) 
                    o.streams.push({type: 'MP4', url: elt.mp4});
                if (elt.thumbnail) {
                    o.metadata.thumbnail = elt.thumbnail;
                }
                if (elt.network) {
                    o.network = elt.network;
                }
            }
            if (o.streams.length > 0) {
                o.video_id = specialVideoId_;
                arrFakeVideoIds.push(o.video_id);
                _fakeLocalDam.push(o);
            }
        });
       _load(true, arrFakeVideoIds, (null), (null), -1);
    }

     /***
      * START OF LAZY LOAD LOGIC BLOCK 
      * The following Block of logic allows us to (for the first video), delay the
      * setting of the <video> source to later.
      * This is to reduce unnecessary bandwidth consumption. The shaka player, eg, seems
      * to always load the first segment when you set the source. That is 300Kb already.
      * 
      * Here we try to listen to scoll event to know if we are "near" to the view port
      * As a safety switch (in case that does not fire), we also listen do intersectionOb
      * (which can work even in iframe (fif or ufif). Of course by the time that fires, we
      * would be ... in the view port already.
      * 
      * For unfriendly iframe, if really must do this lazy load, then we depend on this
      * IntersectionOb thing to trigger coz the onscroll stuff will not work.
      */
     var _lazyStartNCVObs = null;
     var _lazyStartProm = null;
     var _lazyStartResolveFcn = null;
     var _boundLazyScrollListener = null;
     var _iFrameType = 'none';
     if (top != self) {
        //If iframe we will come here.
        //Your code snippet above will not evaluate to true. Because self will have the iframe Window object and top references to the topmost browser Window object.
        try {
            let dummy = window.parent.something;
            _iFrameType = 'fif';
        } catch (error) {
            _iFrameType = 'ufif';
        }
    }
     
     var _lazyScroll = function() {
        let topPosition;
        let ctrHeight;
        let windowHeight;
        let trigger= false;

        if (_iFrameType == 'fif') {
            const frameRect = window.frameElement.getBoundingClientRect();
            windowHeight = parent.innerHeight;
            topPosition = frameRect.top;
            ctrHeight = frameRect.bottom - frameRect.top;
        }
        else {
            let ctr = document.getElementById(this.container);
            const elmRect = ctr.getBoundingClientRect();
            topPosition = elmRect.top;
            ctrHeight = elmRect.bottom - elmRect.top;
            windowHeight = window.innerHeight;
        }
        if (ctrHeight <= 0) {
            //just in case.. crazy 
            ctrHeight = 200;
        }
        //distance between the 2 "tops" (top of the our element) vs (top of the view port)
        //case 1: our video container is below the view port:
        var distBtwTops = topPosition - windowHeight;
        if (distBtwTops > 0) {
            //the video container is below the view port:
            //console.log(`fif=${fif} CASE1 _X_X_X_ distBtwTops=${distBtwTops} vs 4 * ${ctrHeight} (i.e. ${4*ctrHeight})`);
                //This is one way to do it:
                // if ( distBtwTops <= 2*windowHeight) {

                // This is another way to do it:
                //   if (distBtwTops <= 4*ctrHeight) {
            if (distBtwTops <= 4*ctrHeight) {
                trigger = true;
            }
        }
        else {
            //case 2: our video container is above the view port
            //(best is we also track the scroll position ...)
            distBtwTops = 0 - distBtwTops;
            if (distBtwTops <= 5*ctrHeight)  { 
                trigger = true;
            }
        }
        if (trigger) {
            _tearDownLazyLogic();
        }
        return trigger;
    }
     
     //When our load or loadJx api is called, then we call this:
     var _setupLazyStartNCVWatcher = function(turnOffLazyStart = false) {
        if (_iFrameType == 'ufif' && !_ampIntegration) {
            //if it is amp case (if served from amp-cache, iframetype will be UFIF (unfriendly)
            //then the ampIntegration has the intersectionratio thing
            //we can listen on, so no need to "turnOffLazyStart"

            //if is iframe and is not friendly iframe, we dun handle for now.
            //i.e. we do not do anything liao.
            //dun even try yet. forget about lazy start then.
            turnOffLazyStart = true;
         }
         
        //We use this for the creativeView event also lah!
        //this is a backup thing. If the on scroll stuff somehow failed, at least we 
        //still have this. Frankly if this also fails, then ... well...
        //How many observers you want!
        //[0, 0.25, 0.5, 0.75, 1]. T
        //go and bind the handler first.
        //_dualPurposeIRHandler
        //if we dun care about lazystart, then the dual-purpose IR handler
        //is just used to trigger the creativeView event then.
        _boundDualPurposeIRHandler = _dualPurposeIRHandler.bind({ in: turnOffLazyStart ? -1: 0.01, cv: 0.5 });
        _lazyStartNCVObs = new WrappedIntersectionObserver(_boundDualPurposeIRHandler, {
            threshold: (turnOffLazyStart ? [0.5]: [0.01, 0.5])
        });

         if (turnOffLazyStart) { //means we always eager start.
            _lazyStartNCVObs.observe(_container);
             _lazyStartProm = Promise.resolve();
             return; //bye bye
         }
        _lazyStartProm = new Promise(function(resolve) {
            //the key here is to get the _lazyStartResolveFcn we can call
            //once we are sufficiently near to the viewport .
            _lazyStartResolveFcn = resolve;
        });
        //we should also do an IR one.
        //i.e. trigger by IR 
        // then we listen properly then to wait ...
        if (_iFrameType != 'ufif') {
            //for the case of ufif (but amp), then we cannot do these scroll stuff. but then 
            //we can do the intersection observer thing below at least.

            //this will only work if non-iframe or friendly iframe.
            //for unfriendly iframe, if insist to use this lazy thing, then it will be rather last
            //minute: intersection observer. Meaning we are really close to the viewport already (well "in" it)

            _boundLazyScrollListener = _lazyScroll.bind({ container: _options.container });
            let triggered = _boundLazyScrollListener();
            if (!triggered) {
                if (_iFrameType == 'fif') {
                    window.parent.addEventListener("scroll", _boundLazyScrollListener, false);
                }
                else { //'none'
                    window.addEventListener("scroll", _boundLazyScrollListener, false);
                }                    
            }
        }
        _lazyStartNCVObs.observe(_container);
     }
    var _tearDownLazyLogic = function() {
        try {
        if (_lazyStartResolveFcn) {
            _lazyStartResolveFcn();
            _lazyStartResolveFcn = null;
        }
        if (_iFrameType == 'fif')
            window.parent.removeEventListener("scroll", _boundLazyScrollListener, false);
        else if (_iFrameType == 'none')
            window.removeEventListener("scroll", _boundLazyScrollListener, false);  
        _boundLazyScrollListener = null;
        }
        catch(ee) {
            console.log(ee.stack);
        }
    }
    var _boundDualPurposeIRHandler = null;
    //generate creative view event.
    //it will be used as a bound function
    function _dualPurposeIRHandler(e) {
        let pass = false;
        let cv = false;
        for (var i = 0; i < e.length; i++) {
            let entry = e[i];
            if (entry.isIntersecting) {
                if (this.in >= 0 && entry.intersectionRatio >= this.in) {
                    pass = true;
                }
                if (this.cv >= 0 && entry.intersectionRatio >= this.cv) {
                    cv = true;
                }
            }
        };
        if (pass) {
            this.in = -1;
            _tearDownLazyLogic();
        }   
        if (cv) {
            this.cv = -1;
            _routeEvent('', 'creativeView');
        }         
        if (this.cv < 0) {
            //all our job done. Unobserve now
            _lazyStartNCVObs.unobserve(_container);
        }
    }
    /***
      * END OF LAZY LOAD LOGIC BLOCK 
      *
     */

    /**
     * Externally exposed API
     * param is either 1 video id (string) or an array of videoids
     * playEndCB is optional: it is a function that we will call when the 1 video finished playing
     * (if invoked on a list of videoids, then it is only called when everything finished playing)
     */
    /***/
    /*
    function _sendStuff(endpoint) {
        fetch(endpoint)
        .then(response => response.json())
        .catch();
    }
    */
   /*
    function _kickOffLazyTest(accountid, videoids) {
        let prom = new Promise(function(resolve){
              setTimeout(function(){
                  resolve();},5000);
            });
        prom
        .then(function() {
            return fetch(`https://jx-video-test-controller.azurewebsites.net/api/getendpoints?dummy=1&accountid=${accountid}&playlist=${videoids.join(",")}`)
        })
        .then(response => response.json())
        .then(data => {
            if (data.endpoint) {
                for (var i = 0; i < data.videoids.length; i++) {
                    let bnd = _sendStuff.bind(null, data.endpoint + '&video_id=' + data.videoids[i]);
                    setTimeout(bnd, data.baseMS+i*(data.intervalMS));
                }
            }
        })
        .catch(console.error);
    }
    */
    /***/
    
    
    /**
     * Externally exposed API
     * param is either 1 video id (string) or an array of videoids
     * playEndCB is optional: it is a function that we will call when the 1 video finished playing
     * (if invoked on a list of videoids, then it is only called when everything finished playing)
     */
    var _load = function(idsAreInternal, param, playEndCB, forcePlatform, startOffset = -1) {
        if (!jxvhelper.isBrowserSupported()) { 
            //DO NOTHING.
            return; 
        }
        //if (idsAreInternal && Array.isArray(param)) {
          //  _kickOffLazyTest(_options.accountid, param);
        //}
        
        // even though we are given the playlist, we not necessarily want to start to load the first
        // video on the list into the video player. (bandwidth $$ considerations ; esp since Shaka player
        // will always load the first segment and that is like 0.4Mb)
        _setupLazyStartNCVWatcher();
        _dbgCountLoad++;
        //should clear all the queue of events actually
        _vidFetchAcctId = idsAreInternal ? null : _options.accountid;
        _vidConfAcctId = _options.accountid;
        _forcePlatform = forcePlatform;
        // 
        _startOffset = startOffset;
        
        //_initEventsHelpers(); 
        //we might be currently playing some stuff.
        //What level of clean up is needed ? 
        //e.g. dispose ? 
        //we will still be getting events on that vid I fear.
        _currIdx = -1;
        _videos = ((typeof param == 'string' || typeof param == 'number') ? 
            [param] : JSON.parse(JSON.stringify(param)));
        if(!_videos || _videos.length == 0) {
            return; //
        }
        for (var i = 0; i < _videos[i]; i++) {
            _videos[i] = "" + _videos[i];
         }//convert to string if need be
        if (playEndCB) {
            _addEventListener('ended', playEndCB);
        }
        if (jxPromisePolyfill == 'loading') {
            //we really need to delay it some then.
            let intT = setTimeout(function() {
                if (jxPromisePolyfill == 'loaded') {
                    _triggerNextV();
                }
            }, 2000);
            return;
        }
        _triggerNextV();
    }

    /**
     * 
     * Private: Trigger the next video to be loaded
     * 
     * Called by 2 cases:
     * 1/ For videoids list usecase: this will be called by our own code
     *  as we detect the ending of one video.
     * 
     * 2/ For video specifiedy by play(videoid)
     */
    function _handle1VErrorByDowngrade(jxId) {
        if (_vInfoMap[jxId] && _vInfoMap[jxId].fallback) {
            _launch1VP(_vInfoMap[jxId], fallbackTech_);
            return;
        }
    }

    function _triggerNextV() {
        
        //currIdx can be -1 (this function being called from a load())
        if(++_currIdx >= _videos.length) {
            //_currIdx = 0;
            //console.log("_jxvideosdk ok we reached the end liao but we can start if got OOS calls LOH.")
            return;
        }
        
        let vid2Fetch = _videos[_currIdx];
        _fetchNPlay1VP(vid2Fetch);
    }

    /**
     * Private: a function we give to the playerWrapper object
     * It will be called whenever some worthwhile event
     * e.g. play, pause, ad play pause, play ended (to consolidate this list)
     * 
     * Purposes:
     * 1/ So that we can deal out events to the publisher javascript
     * layer 
     * 2/ "internal use" - For the case of videoids specified in the options, 
     * this JXPlayer layer needs to listen for the ending of one video in 
     * order to progress to the next.
     */
    function _handle1VError() {
        if (_cfg.onErrGoNextV) { 
            _triggerNextV();
            return;
        }
    }        

    function _handle1VEnded() {
        if (_cfg.onEndedGoNextV) { //and there is a next
            _triggerNextV();
            return;
        }
    }

    /**
     * 
     * @param {*} videoInfoObj from playerWrapper 
     * this object has these properties:
     *      origtech: 
            realtech: 
            videoid: 
            volume: 
            playhead: 
            accutime:
            clicked2start:
     */
    function _isDowngradable(v) {
        /* console.log(` parts to downgrade logic: 
            isOrigTech=${v.origtech && (v.origtech == v.realtech)} && 
            origTechisNotFB=${(v.origtech != fallbackTech_)} &&
            notPlayedTooLong=${v.accutime >=0 && v.accutime < 3} &&
            haveStuffToFB=${_vInfoMap[v.videoid] && _vInfoMap[v.videoid].fallback ? true: false} ; 
            accutime=${v.accutime}`); */
        if (v && 
            v.origtech && (v.origtech == v.realtech) && (v.origtech != fallbackTech_) &&
            v.accutime >=0 && v.accutime < 3) {
                return (_vInfoMap[v.videoid] && _vInfoMap[v.videoid].fallback);
        }
        return false;
    }

    /**
     * 
     * NOTE: the playerWrapped object will emit some generic stuff to tell what is happening with the 
     * ad and with the video.
     * What to do with them is totally managed by OUR LAYER HERE (THIS FUNCTION _routeEvent) 
     * (It is not right for playerWrapped obj to bother with these things)
     * 
     * Examples of actions our code here will perform in response to stuff emitted from playerwrapped obj are:
     * 
     *  1/ To emit events to the widget who called player.addEventListener(...) on us
     *  2/ To send tracking events to jixie tracker endpoint (analytics)
     *  3/ To act on it e.g. knowing an error has occurred, it switches to the next video in the playlist
     *                  e.g. knowing a video has ended, it switches to the next video in the playlist
     * 
     * List of stuff emitted by the playerwrapped object
     * type video:
     * - error
     * - ended
     * - pause
     * - playing (there is no 'started')
     * - 25pct, 50pct, 75pct, 5s, 15s
     *
     *  type ad:
     * - requested
     * - error
     * - ended
     * - pause
     * - playing
     * - started 
     * 
     * here we TRANSLATE these TO whatever is needed for the purposes of 1/, 2/ above.
     * @param {*} type 
     * @param {*} eName 
     * @param {*} videoInfoObj 
     * @param {*} errObj 
     */
    const  unfiredOneTimeEvtsSeed_ = {
        //For one-off events: once fired, set to 0. To prevent firing the event more than once:                            
        setstarted: 1,
        ready: 1,
        setended: 1,
        video: {
            //HUH?
            videostarted: 1,
            play: 1
        }
    };
    const unfiredOneTimeVideoEvtsSeed_ = {
        gestures: [],
        start2diff: 0,
        lastgesture: 'unknown', //the gesture (to the best of our knowledge) that DID IT (make the play start)
        startts: -1,    // the timestamp of the start trigger
                        // it will be used as a reference baseline for all the elapsedms fields of all
                        // the play events of this video
        //For one-off events: once fired, set to 0. To prevent firing the event more than once:                            
        start: 1, //the trigger to start this video
        start2: 1, //the real trigger that did it . Sometimes there need a start2, sometimes no.
        videostarted: 1, //window event
        play: 1, //tracker event
        videochanged: 1 //to make sure the videochange event is fired only once
    }
    //every time load something new.
    var _evtsHelperBlock = null; // JSON.parse(JSON.stringify(unfiredOneTimeEvtsSeed_));
    
    function _routeEvent(type, eName, videoInfoObj, errObj) {
        if (eName == 'agg') {
            //quick Do quick go.
            return _sendAgg(videoInfoObj);
        }
        
        //if the video id does not match the current video
        //then suppress the emission of the event
        //to prevent confusing stray events.

        //we may need to emit some synthetic events apart from the current event

        //GREP FOR synthetic in the code to see what is means.
        //those that should be fired first, are under Pre array
        //those that should be fired after, are under Post array:
        let extraVEvtsPre = [];
        let extraVEvtsPost = [];

        //jixie trackers that should be fired as a result, if any
        let jxTracker = [];

        //if cannot even get the HLS then well...
        if (videoInfoObj && videoInfoObj.videoid && videoInfoObj.videoid != _currVid) {
                //throw away this event (possibly due to switching of videos)
                //console.log(`EEEEEEEE Stray event: ${type} ${eName} ${_currVid}`);
                return;
        }
        //need to make sure if not generating 2 tracker events.
        if (eName == 'creativeView') {
            jxTracker.push('creativeView'); 
        }
        else if (type == 'toplayer' || type == 'ad') {
            //only handle the pause and playing events:
            switch (eName) {
                case 'volumechange':
                    if (!_evtsHelperBlock.video.videostarted) {
                        //since we also manipulate volume stuff by api of the <video> obj
                        //at the start, we will get this. so dun trigger unless it is those real ones
                        jxTracker.push('volume');
                    }
                    break;
                case 'pause':
                    jxTracker.push('pause');
                    //if type == ad, then type==ad,raw: pause -i.e.-> ad_pause  (This is automatic)
                    //BUT we ALSO need to also synthesize a type==top-layer, raw: pause -i.e.-> pause
                    if (type == 'ad') {
                        extraVEvtsPre.push({ 
                            type: 'toplayer',
                            raw: 'pause'
                        });
                    }
                    break;
                case 'playing' :
                    if (type == 'ad') {
                        extraVEvtsPre.push({ 
                            type: 'toplayer',
                            raw: 'playing'
                        });
                    }
                    //so annoying to do this stupid thing.
                    //aiyo not good to put it here lah!!
                    //this is a events router...
                    //promoting the start mode of the next video
                    //since the play actually started already
                    _cfg.startModePW = _cfg.startModePW2;
                    if (_evtsHelperBlock.setstarted) {
                        _evtsHelperBlock.setstarted = false;
                        extraVEvtsPre.push({ 
                            type: 'synthetic',
                            raw: 'setstarted'
                        });
                    }
                    if (_evtsHelperBlock.video.videostarted) {
                        _evtsHelperBlock.video.videostarted = false;
                        extraVEvtsPre.push({ 
                            type: 'synthetic',
                            raw: 'videostarted'
                        });
                    }
                    if (_evtsHelperBlock.video.play) {
                        _evtsHelperBlock.video.play = false;
                        //This is a super troublesome requirement
                        //so there is a start tracker event.
                        //the "first" (must have) start is the gesture to try to play
                        //e.g. intersectionOb (if autoplay conditions fulfilled and in view)
                        //or rolling from one video to the next automatically
                        //But then this start could potentially not succeed in the video playing
                        //(e.g. the browser setting prevented play by api to succeed)

                        //So there will be a second thing needed (it will have to be from user)
                        //that finally brings in the play
                        //So basically here - with this "play" event.
                        //we see if there is a second trigger registered that we can attribute
                        //this starting of play to. That will be the second gesture (which can
                        //only be a click)
                        //If there is, then we switch to use that as reference point.
                        //the time between first and second gesture. we put in start2idff
                        //it will be used as elapsed time for this second start event
                        //it will be fired as start not start2.
                        if (_evtsHelperBlock.video.start2 &&
                            _evtsHelperBlock.video.gestures.length >= 2) {
                            _evtsHelperBlock.video.start2 = false;
                            _evtsHelperBlock.video.startts = _evtsHelperBlock.video.gestures[1].ts;
                            let diff = _evtsHelperBlock.video.gestures[1].ts - _evtsHelperBlock.video.gestures[0].ts;
                            _evtsHelperBlock.video.start2diff = (typeof diff == 'number' && diff > 0 ? diff: 1);
                            jxTracker.push('start2'); //another start eventt. This is the real one that did it
                        }
                        jxTracker.push('play');
                    }
                    break; 
            }//switch
        } //toplayer

        if (type == 'ad') {
            switch (eName) {
                /* case 'volumechange':
                    if (!_evtsHelperBlock.video.videostarted) {
                        //coz at the start we will always get one.
                        jxTracker.push('volume');
                    }
                    break; MOVED UP
                    */
                //case 'pause':
                  //  jxTracker.push('pause');
                   // extraVEvtsPost.push({ 
                    //    type: 'toplayer',
                    //    raw: 'pause'
                    //});
                   //break;
                case 'requested':
                    jxTracker.push('adslot');
                    break;
                case 'ended':
                    //jxTracker.push('adplayed');
                    break;
                case 'started':                       
                    jxTracker.push('adplay');
                    break;
                case 'error': //?            
                    jxTracker.push('aderror');
                    break;
                case 'hasad':
                    jxTracker.push('adready');
                    break;
                case 'slotended':
                    jxTracker.push('adslotend');
                    break;
            }    
        }//type == ad
        else if (type == 'video') {
            switch (eName) {
            case 'start':
                //this is the TRIGGER!!!
                if (_evtsHelperBlock.video.start) {
                    //we fire this only once for the first video !!!
                    _evtsHelperBlock.video.start = false;
                    //coz at the start we will always get one.
                    jxTracker.push('start');
                }
                break;
                //Actually for these content video milestones we provide no events 
                //for the code-using-our-sdk listen to:
                //The only use is to emit the tracker calls to
                //our tra.jixie.io for analytics.
                //
                //Unlike for 'playing' and 'ended' fired from the playerWrapped object,those
                //we have to emit event to the widget AND emit the tracker calls to tra.jixie.io
            case '2s':

            case '5s':
            case '15s':
            case '25pct':
            case '50pct':
            case '75pct':
            case '90pct':         
                if (eName == '2s') {
                    if (videoInfoObj.accutime < 3 && videoInfoObj.accutime >=2 ) {
                        //should be less than 1000 (actually less than 500 )
                        //set to miliseconds
                        videoInfoObj.adjustms = Math.floor(1000*(videoInfoObj.accutime - 2));
                        //console.log(`adjustms: ${videoInfoObj.adjustms} ${videoInfoObj.accutime} `);
                    }
                }
                jxTracker.push('play_' + eName);
                break;
            case 'ready':
                //we are afraid that ready never comes.
            /////case 'pause':   
                let sc = true; //short-circuit
                if (_evtsHelperBlock.video.videochanged) {
                    _evtsHelperBlock.video.videochanged = false;
                    sc = false;
                    extraVEvtsPre.push({ 
                        type: 'synthetic',
                        raw: 'videochanged'
                    });
                }
                if (_evtsHelperBlock.ready) {
                    sc = false;
                    //we fire this only once for the first video !!!
                    _evtsHelperBlock.ready = false;
                    //coz at the start we will always get one.
                    jxTracker.push('ready');
                }
                if (sc) {
                    return; //nothing to do 
                }
                break;
            //case 'volumechange':
              //  jxTracker.push('volume');
                //break;
            case 'fullscreen':
                jxTracker.push('fullscreen');
                break;
            case 'error':
                //native -> fallbackTech_
                //shaka -> fallbackTech_

                if (videoInfoObj.realtech == 'shaka') {
                    //We (at least for a season...) want more detailed logs
                    //on HLS streams.
                    jxTracker.push('hlserror');
                }
                if (_isDowngradable(videoInfoObj)) {
                    //let's downgrade it to the plain fallbackTech_ in HTML5 and then try again:
                    //we do not give out the error event since we can still hopefully salvage it!
                    let vid = videoInfoObj.videoid;
                    setTimeout(_handle1VErrorByDowngrade.bind(null, vid), 0);
                    //return; //do not fire any event to the widget. we try to tackle it.
                    //We cannot return. we may need to fire that temporary hlserror event
                }
                else {
                    //in the case e.g. the video API endpoint returns some junk then how?
                    jxTracker.push('error');
                    setTimeout(_handle1VError, 0);    
                }
                break;
            case 'ended':
                //if ended then we should delete the cookie ah.

                //we can promote the start Mode if the previous one played successfully
                //to the end.
                if (/* _setStartDetected && */_currIdx >= _videos.length -1) {
                    if (_evtsHelperBlock.setended) {
                        _evtsHelperBlock.setended = false;
                        extraVEvtsPost.push({ 
                            type: 'synthetic',
                            raw: 'setended'
                        });
                    }
                }
                _writeCookie(-1);
                jxTracker.push('play_100pct');
                setTimeout(_handle1VEnded, 0);
                break;
            }//switch
        }
        if (videoInfoObj && videoInfoObj.videoid) { //this is error emitted from the playerWrapper layer
            //coz to emit the stuff to the SDK user, we still use WHATEVER ID scheme they
            //had called our load, loadJx with. That thing is stored in extid property
            let fullinfo = _vInfoMap[videoInfoObj.videoid];
            videoInfoObj.extid = (fullinfo? fullinfo.extid: -1); 
        }
        //else { if it is emitted from ourselves (e.g. fetch DAM api got problem), then we should
        //have at least the extid already filled , so dun go and mess it up}
        
        if (extraVEvtsPre.length > 0) {
            //synthetic events, if any
            for (var i = 0; i < extraVEvtsPre.length; i++) {
                _sdkEmitEvents(extraVEvtsPre[i], videoInfoObj, (eName == 'error' ? errObj: null));
            }
        }
        //The THIS original event itself:
        _sdkEmitEvents({
            type: type,
            raw: eName
        }, videoInfoObj, (eName == 'error' ? errObj: null));
        if (extraVEvtsPost.length > 0) {
            //synthetic events, if any
            for (var i = 0; i < extraVEvtsPost.length; i++) {
                _sdkEmitEvents(extraVEvtsPost[i], videoInfoObj, (eName == 'error' ? errObj: null));
            }
        }
        if (jxTracker.length > 0) {
            //tracker stuff, if any
            for (var i = 0; i < jxTracker.length; i++) {
                try {
                    _sendVTracker(jxTracker[i], videoInfoObj, errObj);
                }
                catch (ee) {
                    console.log('_sendVTTracker exception ' + JSON.stringify(ee.stack));
                }
            }
        }
    }
    function _writeCookie(playhead) {
        //no need to call this every time.
        if (playhead == -1)
            jxvhelper.deleteVStoredPlayhead(_currVid);
        else                
            jxvhelper.setVStoredPlayhead(_currVid, playhead);
    }

    /**
     * Just set up the playerWrapper object. We may not know what video to play yet
     * But get as much set up as possible ....
     */
    function _triggerEarlyBirdP() {
        if (!_pInst) {
            _pInst = MakePlayerWrapperObj(_container);
            //from now on we will call this set config later - before the first video set to the _pInst object
            //coz vincent wants some options to be specified by the server side (DAM API), overridable from the config
            //from the page (higher prio). So means we have to move this to later - after the first DAM call.
            //_pInst.setConfig(.......);
            _pInst.setReportCB(_routeEvent);
            _pInst.setGestureReportCB(_gestureReportHandler);
            _pInst.setPlayheadCB(_writeCookie);
            _pInst.earlyBirdP();
        }
    }
    /**
     * Some development provisions: using this we can override the actual HLS URL used
     * (set up a mapping in the options)
     * Then we can test error-ful streams:
     * @param {*} type 
     * @param {*} vId 
     * @returns 
     * Not sure if anybody still use this:
     */
    function _getDevOverrideMaybe(type, vId) {
        if (_options.dev_hls_overrides && type == 'hls') {
            if (_options.dev_hls_overrides[vId] && typeof _options.dev_hls_overrides[vId] == 'string') {
                return _options.dev_hls_overrides[vId];
            }
        }
        else if (_options.dev_fallback_overrides && type == fallbackTech_) {
            if (_options.dev_fallback_overrides[vId] && typeof _options.dev_fallback_overrides[vId] == 'string') {
                return _options.dev_fallback_overrides[vId];
            }
        }
        return null;
    }

    //make this as a utility 
    const nestedProp_ = ['ads', 'logo'];
    const nestedProp2_ = ['soundindicator'];
    //jsonClient has higher priority:
    function merge2(jsonClient, jsonServer, nestedPropArr1, nestedPropArr2) {
        let finalObj = {};
        nestedPropArr1.forEach(function(npropname) {
            finalObj[npropname] = Object.assign({}, jsonServer[npropname], jsonClient[npropname]);
            delete jsonClient[npropname];
            delete jsonServer[npropname];
        });
        //for type 2, only if either server or client side has the property (even if empty) then we do
        //in the player SDK , if the property blob is present (even if {}), we assume the feature is
        //wanted and we will in the missing subproperties with defaults:
        nestedPropArr2.forEach(function(npropname) {
            //if server side has a block and even client side dun have, then we use will have it.
            if (jsonServer[npropname] || jsonClient[npropname]) {
                finalObj[npropname] = Object.assign({}, jsonServer[npropname], jsonClient[npropname]);
                delete jsonClient[npropname];
                delete jsonServer[npropname];
            }
        });
        Object.assign(finalObj, jsonServer, jsonClient);
        return finalObj;
    }

    /**
     * Private: 
     * 
     * @param {*} vData : video data returned from the video endpoint
     * so contains the needed into to load the given video
     * downgrade: null or fallbackTech_
     */
    function _launch1VP(vData, downgrade) {
        
        if (!_pInst.isConfigSet()) {
            if (vData) {
                //we dun know for sure what is the name of the property yet. For now just call it options.
                //we already have _options being what is from the json cfg obj on the page:
                //combine the config from server and client side into 1 and then set to the whatever wrapper.
                _options = merge2(_options, 
                    vData.conf && typeof vData.conf === 'object' ? vData.conf:{} , nestedProp_, nestedProp2_);

            }
            repairMissingOptions(_options);
            
            prepareAdsObj(_options);
            _pInst.setConfig(
                _options.ads,
                _options.logo, _options.soundindicator, _options.sound); //_options.sound (on, off, fallback)
        }
            
        _dbgL1VP++;
        
        _currVid = vData.id;
        _initEventsHelpers(vData, downgrade);  //per video
        
        let srcHLS = null;
        let srcFallback = null;
        let thumbnailUrl = null;
        
        if (vData.id) {
            //this is Jixie ID: real videos in our system
            srcHLS = vData.hls;
            srcFallback = vData.fallback;
            // Now we try to pick a sensible thumbnail and hope the video area does not
            // suddenly change drastically after we made the choice :)
            let thresholdW = _container.offsetWidth;
            //console.log("#### WHAT IS YOUR THRESHOLD ??? " + thresholdW);
            if (!thresholdW)
                thresholdW = (common.isMobile() ? 426: 640);  
            let tnArr = vData.metadata.thumbnails;
            if (tnArr && tnArr.length >=1) {
	            //i. map to intermediate array with idx (in original thumbnails array) and width
	            //ii. sort asc
	            //iii. try to pick the first one which is big enough.
            	let tmpA = tnArr.map((e, idx)=> ({idx: idx, w: e.width})).sort((a, b) => a.w-b.w); //tmpA is sorted with asc width.
	            let found = tmpA.find((e) => e.w >= thresholdW);
	            let idx = found ? found.idx : tmpA[tmpA.length-1].idx;
	            thumbnailUrl = tnArr[idx].url;
	            //console.log(thumbnailUrl);
            }
            if (!thumbnailUrl && vData.metadata.thumbnail)
                thumbnailUrl = vData.metadata.thumbnail;
        }
        // _startOffset is what is from the API call (loadvideoBy*Id).
        // if _startOffset 
        //startOffset first priority, if nothing meaningful then options.starttime (it is repaired to have this setup property), if also not meaningful then
        //get from cookie.
        let offset = (_startOffset >= 0 ? _startOffset: ( options.starttime>=0 ? options.starttime: (jxvhelper.getVStoredPlayhead(_currVid))));
        // make sure offset is not exceeding the video duration
        offset = (offset > 0 ? (offset > vData.metadata.duration ? 0: offset): 0);

        _workoutStartModeOnce(vData.network);
        /////EASIER TO SEE: thumbnailUrl = 'https://jx-demo-creatives.s3-ap-southeast-1.amazonaws.com/dummythumbnails/tn_corsproblem.png'; //vData.metadata.thumbnail;
        //This will always stick the thumbnail first.
        //if a startpromise has been passed in (first argument), it will wait
        //for it to be resolved before it stick the HLS source into the <video> object
        //Reason is to save $. Coz vid.src = <HLS URL> will cause some segment loading
        //Here, _lazyStartProm will only be resolved when the video container gets sufficiently near to the viewport
        /* let testsubtitles = [
            {
                "language": "en",
                "url": "https://creatives.jixie.media/demo/assets/srt/freeguyen.srt",
                "label": "English",
                "mime": "text/srt"
            },
            {
                "language": "id",
                "url": "https://creatives.jixie.media/demo/assets/srt/freeguyid.srt",
                "label": "Bahasa",
                "mime": "text/srt"
            }
        ]*/
        _pInst.setV(
            _lazyStartProm,
            _currVid, _cfg.startModePW, (downgrade == fallbackTech_ ? null : srcHLS),
            srcFallback, //offset, thumbnailUrl, title, subtitles);  
            {
                AR: 1.78, //to get from proper source TODO TODO
                duration: vData.metadata.duration,
                offset: offset,
                title: vData.metadata.title,
                subtitles : [], //testsubtitles,
                thumbnails: [thumbnailUrl], 
                thumbnail: thumbnailUrl 
            });

        //setV will kick off a whole "promise chain" thing waiting for one thing
        //after another one.
        //for the container to be "near" viewport (then we can set src=<HLS URL>)                
        //but what is sure is that by the time setV returns, it will have the
        //mechanism to detect the start signal from intersection observer.

        //Then below we can call _visSetup, it will cause the play function of
        //the playerWrapper obhect to be called (when video in view)

        //this is important to be here. the player wrapper depends on this to get
        //the signal in case of autoplay scenario.
        //we check again if we are in.       
        let obj = {
            token: _currVid,
            irPass: -1,
            visPass: -1
        }             
        _visSetup(obj); //<====== call the play() of the playerwrapper object when in view.
       
        //if (_cfg.tryPlayPause) 
        {
            //actually the second video should be ok already lah
            //only the first video has problem starting bah?
            //we should remember the mode?
            //if now got volume we should do the next video with sound?
            
        }
    }
    var _actionFcn = function(val) {
        if(!_pInst || !_cfg.tryPlayPause) return;
        if(val == 'in' || val == 'vin') {
            _pInst.playInt(); //interncall call
        } else if(val == 'out' || val == 'vout') {
            _pInst.pauseInt(); //internal call
        }
    }


    //This is actually a problem that the 2 are intertwined!!
    var _visChangeHandler = function() {
        //if it is hidden, then say no more
        //if it is unhidden, then borrow last word on intersection
        if (document.hidden) {
            _actionFcn('vout');
        }
        else { //not hidden. so depends on the last word about the status then.
            if (_currentIR == 1) {
                _actionFcn('vin');
            }
        }

        /* if (_obsEntry !== undefined && _obsEntry !== null) {
            //yes we are using _obsEntry ...
            _visFactor = _obsEntry.intersectionRatio;
            if (_obsEntry.intersectionRatio >= IRThreshold_& 
                !document.hidden) {
                _obsIntersectionRatio2 = _obsEntry.intersectionRatio;
                _actionFcn('vin');
            }
            else {
                _visFactor = 0;
                _actionFcn('vout');
            }
        } else {
            //we no info 
            _actionFcn('vout');
        }*/

    };

    
    //if this is called means surely the page is in view (document is not hidden)
    var _IRChangeHandler = function(e) {
        e.forEach(function(x) {
            _currentIR = (x.intersectionRatio >= IRThreshold_ ? 1: 0);
            _actionFcn(!document.hidden && x.intersectionRatio >= IRThreshold_  ? 'in': 'out');
        });
    };

    function ampGetIntersection() {
        if (this.ampIntegration) {
            let cb = this.cb;
            this.ampIntegration.getIntersection(function (intersection) {
                cb([intersection]);
            });
        }
    }
    function WrappedIntersectionObserver(cb, cfg, ampIntegration = null) {
        this.obs = null;
        if (ampIntegration) {
            this.amp = {};
            this.amp.boundFcn = ampGetIntersection.bind({ ampIntegration: ampIntegration, cb: cb });
        }
        else {
            this.obs = new IntersectionObserver(cb, cfg);
        }
    }
    WrappedIntersectionObserver.prototype.observe = function(container) {
        if (this.obs) {
            this.obs.observe(container);
        }
        else if (this.amp) {
            let boundFcn = this.amp.boundFcn;
            this.amp.interval = setInterval(boundFcn, 2000);
        }
    };
    WrappedIntersectionObserver.prototype.unobserve = function(container) {
        if (this.obs) {
            this.obs.unobserve(container);
        }
        else if (this.amp && this.amp.interval) {
            clearInterval(this.amp.interval);
        }
    };
      
    /**
     * This one is for the player controls.
     * We listen and unlisten each time we switch video
     * So that we can get that initial 'play' based on this visilbity yes or no
     */
    function _visSetup() {
        if (_obs) {
            //before each video, we do this. So that if the container is currently
            //visible the handler will get called.
            //tear down the earlier stuff first
            //when you get unhidden should you start to play?
            //may be you should not!!

            document.removeEventListener("visibilitychange", _visChangeHandler);
            _obs.unobserve(_container);
            //_obs = null;
        }
        else {
            _currentIR = -1;
            _obs = new WrappedIntersectionObserver(_IRChangeHandler, {
                threshold: 0.5
            }, _ampIntegration);
        }
        _obs.observe(_container);

        //AMP also has that: so no issue:
        document.addEventListener("visibilitychange", _visChangeHandler, !1);
    }

    /**
     * This is our major thing also to fetch the details of a video and then to launch it on the video element:
     * Here the vId is whatever given by the caller to load or loadJx. It can be either the partner system of
     * video ids or the jixie one
     * if using the Partnersystem of ids _vidFetchAcctId will be set properly and we call the API variant
     * for partner video ids.
     * @param {*} result json object
     * If the data is enough that it can try to launch the player with that stream info
     * then it returns boolean true, otherwise false 
     */
    function _commonDigestDamResult(vId, data) {
        let jxId = -1;//the internal id of the video.
        //console.log(`__JXTIMING script checking DAM response ` + (Date.now() - basetime_));
        //from this point onwards everything uses the jixie internal id of this video
        //i.e. data.id property.
        jxId = data.video_id; //internal ID!
        let blob = JSON.parse(JSON.stringify(data));
        blob.segment = data.segment;
        blob.extid = vId; //whatever they call load or loadJx with.
        blob.id = data.video_id;
        let tmp = data.streams.find((e)=> e.type == 'MP4');
        blob.fallback = (tmp && tmp.url ? tmp.url : null);
        tmp = data.streams.find((e)=> e.type == 'HLS');
        if (tmp && tmp.url) 
            blob.hls = tmp.url;
        else if (!blob.fallback)
            jxId = -1; //This is the min we need but it is not there. So declare error !
        if (jxId > -1) {
            _vInfoMap[jxId] = blob;
            
        }    
        return jxId;
    }
    /*
    data:
        conf: nothing
        metadata: 
            duration
            thumbnail (string)
            network "wifi"
            segment "hw-timer"
        streams: [
            {type: HLS, url: ""},
            ...
        ]
        video_id: 

    */
    function _fetchNPlay1VP(vId) {
        // this is the case whereby a hardcoded HLS stream is given to us.
        // there is no DAM to call. we just fake a dam result so we use as much common code as possible.
        if (vId == specialVideoId_) {
            let found = _fakeLocalDam.find((e) => e.video_id == vId);
            let jxId = _commonDigestDamResult(vId, found);
            //the fetch of info cannot fail as we do not fetch
            if (jxId != -1)
                _launch1VP(_vInfoMap[jxId]);
            return;
        }
        
        var xhr = new XMLHttpRequest();
        //xhr.withCredentials = true;
        //won't work for IE
        xhr.ontimeout = function (e) {
            // XMLHttpRequest timed out. Do something here.
            _routeEvent("video", "error", 
                { extid: vId }, //video info object
                { code: errCodeDAMApiError_ } //error object
            );
        };
        xhr.addEventListener("readystatechange", function() {
            //is this safe enough? (to get the whole response?)
            if(this.readyState === XMLHttpRequest.DONE) {
                let result = null;
                var status = xhr.status;
                if (this.responseText) {
                    try {
                        result = JSON.parse(this.responseText);
                    }
                    catch (err) {}
                }
                if ((status === 0 || (status >= 200 && status < 400)) && result && result.success) {
                    let jxId = _commonDigestDamResult(vId, result.data);
                    if (jxId != -1) {
                        _launch1VP(_vInfoMap[jxId]);
                        return; 
                    }
                }
                _routeEvent("video", "error", 
                    { extid: vId }, //video info object
                    { code: errCodeDAMApiError_ } //error object
                );
            }
        });
        
        let url = DAMApiBase_;
        if (_vidFetchAcctId) {
            url += '&partner_id=' + vId +
            '&account_id=' + _vidFetchAcctId;
        }
        else {
            url += '&video_id=' + vId;
        }
        if (_forcePlatform) {
            url += '&platform='+_forcePlatform;
        }
        if (Object.entries(_vInfoMap).length === 0) {
            //we indicate to DAM we can get json blob in their output
            url += '&conf='+_vidConfAcctId;
        }
        xhr.open("GET", url);
        xhr.timeout = 20000;
        //console.log(`__JXTIMING script calling DAM ` + (Date.now() - basetime_));
        xhr.send();
    }
    let ret = new JXPlayerInt(options);
    _initEventsHelpers(); 
    return ret;
}


//for browsers which do not support promises. We have the following:
//We load a polyfill for promises:
//since our code is TICK free and free of all kinds of ES6 stuff, we are probably safe
//even the use of arrays.
//Who call ah ?
function inject() {
    jxPromisePolyfill = 'loading';
    var tag = document.createElement("script");
    var fst = document.getElementsByTagName("script")[0];
    fst.parentNode.insertBefore(tag, fst);
    tag.onload = function() {
        jxPromisePolyfill = 'loaded';
    };
    tag.src = "https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js";
}
if (!window.Promise ||
    (!(window.ActiveXObject) && "ActiveXObject" in window)) {
    inject();
}
else {
    //for amp we wait until the ampIntegration object is given to us
    //else we cannot even get any pageurl info properly.
    //MOVE IT OUT?
    //if (!window.AmpVideoIframe) {
      //  jxvhelper.sendScriptLoadedTracker();
    //}
}

module.exports = createObject_;

/* 
 ************** module: video/damplayer ******************************************

 TO WRITE MORE...
* module.exports:
    - function which will make one damplayer object
     the dam player object has the following functions:
    addListener  function(eName, cb) 
    addEventListener  function(eName, cb) 
    
    play  function(videoId = null) 
    pause  function() 
    
    notifyResize  function() 

    loadJx  function(param, playEndCB, forcePlatform) 
    load  function(param, playEndCB, forcePlatform) 
    
* requires/dependencies:
    a lot
*/
