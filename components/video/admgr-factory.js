
/**
 *  In development : meant to REPLACE the admgr-factory.js soon
 * and be shared by both the videosdk and the normal video-ad-sdk (jxvideo.1.4.min.js and
 * jxvideo.1.3.min.s)
 **/
 const modulesmgr            = require('../basic/modulesmgr');
 const common                = modulesmgr.get('basic/common');
 const cssmgr                = modulesmgr.get('video/cssmgr');
 
 
 const maxNumVastRedirects_ = 5; //testing only. for ads

 const MakeOneAdControlsObj  = modulesmgr.get('video/adctrls-factory');

 //These we need to listen to for basic functioning:
 const imaEventsSeed_ = [
    "LINEAR_CHANGED",
    "AD_PROGRESS",
    "LOADED",
    "SKIPPED",
    "COMPLETE",
    "PAUSED",
    "RESUMED",
    "CONTENT_PAUSE_REQUESTED",
    "CONTENT_RESUME_REQUESTED",
    "STARTED",
    "ALL_ADS_COMPLETED"
];
 
 //In addition, We can call a callback when these things happen
 const  subscribableEvents_ =  [
    ["jxadended", "COMPLETE"],
    ["jxadfirstQuartile", "FIRST_QUARTILE"],
    ["jxadmidpoint", "MIDPOINT"],
    ["jxadthirdQuartile", "THIRD_QUARTILE"],
    ["jxadskipped", "SKIPPED"],
    ["jxadalladscompleted","ALL_ADS_COMPLETED"],
    ["jadclick", "CLICK"],
    ["jxadimpression", "IMPRESSION"],
    ["jxadstart", "STARTED"]
 ];

 function MakeOneAdObj_(container, vid, fcnVector, controlsObj, progressBar) {
    const styles                = cssmgr.getRealCls(container);

    var _forVideoAdSDK = false;
    var _doProgressBar = true;
    var _forceWidth = 0;
    var _forceHeight = 0;
    var _adEnduredVec = [0,0,0,0,0];//help us just add up in this ad slot how long the fella watched ads
    var _vid = null;
    var _pFcnVector = null; //this is how to work with the CONTENT VIDEO player
    var _container = null;

    var _ctrls = null;
    var _adDiv = null;

    var _width = 1;
    var _height = 1;
    var _adsManager = null;
    var _adsLoader = null;
    var _adDisplayContainer = null;
    var _sizeCheckTimer = null;
    var _resizeObserver = null;

    var _autoAdsManagerStart = false;
    var _adLoaderOutcome = 'jxnone';
    var _controlsObj = null;

    var _vpaidSecure = true;

    var _delayedAd = false;


    /**
        this is the flag for us to not manipulating the DOM multiple times
        coz the way we animate the progress bar by manipulating the DOM
    */
    var _isProgressBarUpdated = false;

    /**
        this is the flag to know that the ad has really started,
        for us to know when about to animate the progress bar,
        so we just animate the progress bar when the ad has really started
     */
    var _isAdStarted = false;

    /**
     * To support event firing (the old player sdk has this)
     */
    var _subscribedEvents = null;
    var _preSubscribedEvents = {};
    var _eventsCallback = null;
    var _imaEvents = JSON.parse(JSON.stringify(imaEventsSeed_));
    var _aStartApiCalled = false;
    var _callOnceUponStarted = null;
    
    //what is this thing? 
    //It seems in the scenario whereby due to e.g. browser setting, the play failed (yes it is possible
    //even muted can fail too)
    //The PROPER way to handle these things are actually to TRY 
    //https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/autoplay
    //i.e. make an independent test using the video element about what the browser can do
    //But this will make us have to load another little video 

    //For the videosdk we will not have this issue since the above test is done. And when cannot
    //autoplay we will get user click gesture:

    //So now doing a lazy way - just to get by since we are only going
    //the 'reallyProgressed' is used in the resume pause code . just grep for it.
    //if we are not 'reallyProgressed' at all. then hopefully thru the logic of calling 
    //adsManager.pause() first, then adsManager.resume() the video ad can play

    // The problem with the VPAID JS is. if the video cannot play, basically, nobody know
    // there is a situation (no event, nothing). So can only HOPE the user will click click
    // on the "confused" ads controls to hope to revive it. With this _reallyProgressed and if the
    // video ads really cannot start, then ... the user press the play/pause button twice should make
    // it play...
    var _reallyProgressed = false;
    var _knownCurrentTime = -1;
    
    FactoryOneAd.prototype.reset = function() {
        _reallyProgressed = false;
        _knownCurrentTime = -1;

         
        _callOnceUponStarted = fcnCallOnceUponStarted;
        //reset will not erase the events subscription 

        //for video ad really.
        _aStartApiCalled = false;

        /////_autoAdsManagerStart = false;
        _isAdStarted = false;

        _adEnduredVec = [0,0,0,0,0];
        //for use of the next ad request
        //I am thinking of destroying the ads loader also?

        /** reset the state back to initial */
        _isProgressBarUpdated = false;

        if (_adsManager) {
            _adsManager.destroy();
            _adsManager = null;
        }
        if (_adsLoader) {
            _adsLoader.destroy();
            _adsLoader = null;
        }
        if (_adDisplayContainer) {
            _adDisplayContainer.destroy();
        }
        if (_adDiv) {
            _container.removeChild(_adDiv);
            _adDiv = null;
            _ctrls = null;
        }
        _clearResizeListeners();
    }

    var _makeFcnVectorForUI = function() {
        //for the AdCtrl. if the adfinished then now.
        let fcnVector = {
            
            play: function() {
                _playAd();
            },
            pause: function() {
                _pauseAd();
            },
            mute: function() {
                if (_adsManager) {
                    _adsManager.setVolume(0);
                }
                _ctrls.updateMutedState(true);
                _pFcnVector.setContentMuteState(true);
            },
            unMute: function() {
                if (_adsManager) {
                    _adsManager.setVolume(1);
                }
                //if the user has turned on the volume then let the thing continue to play then
                //with sound                        
                _ctrls.updateMutedState(false);
                _pFcnVector.setContentMuteState(false);
            },
        };
        return fcnVector;
    };
    var _playAd = function() {
        //this is only legit if really started ah

        //This is the part to track it really.
        //but this can be due to either the GUI 
        //or due to the playerWrapper calling
        if (_adsManager) {
            //for the case of those play that actually did not start (due to e.g. browser settings
            //) then we can still be revived thru this. But since the ima3 sdk might not even know
            //the video is paused (failed to play), we need this gymnastics then at least the user
            //can start the play by clicking on the GUI buttons.
            if (_forVideoAdSDK && !_reallyProgressed) {
                _adsManager.pause();
                //cannot. oh dear it breaks the pure preroll... 
                //commented out in emergency
            }
            _adsManager.resume();
        }
    };
    var _pauseAd = function() {
        //this is only legit if really started ah
        if (_adsManager) {
            if (_isAdStarted) {
                //console.log(`## admgr to call _adsManager.pause()`);
                _adsManager.pause();
            }
        }
    };
    var _handleContentPauseReq = function(hideContent) {
        //Added this here (this is also called upon STARTED event)
        //this is for our vide ad sdk case.
        //sometimes the play() just cannot work (e.g. browser prevents autoplay)
        //then the lazy way out is to show the controls for the user to click
        //but without the STARTED event, we will the controls will still be hidden
        //so call a show here....
        //
        //video sdk will not have this issue. Coz it always check if autoplay is really
        //possible . if not, then it will put up a big play button to start with
        _ctrls.show();
        _pFcnVector.switch2Ad(hideContent, _delayedAd); 
    }
    var _setupResizeListeners = function() {
        // _sizeCheckTimer = setInterval(_sizeCheck, 500);
        _resizeObserver = new ResizeObserver(_sizeCheck);
        _resizeObserver.observe(_container);
        window.addEventListener('resize', _sizeCheck);
        window.addEventListener('jxintresize', _sizeCheck);
    }
    var _clearResizeListeners = function() {
        // if (_sizeCheckTimer) {
        //     clearInterval(_sizeCheckTimer);
        //     _sizeCheckTimer = null;
        // }
        if (_resizeObserver) {
            _resizeObserver.unobserve(_container);
            _resizeObserver = null;
        }
        window.removeEventListener('resize', _sizeCheck);
        window.removeEventListener('jxintresize', _sizeCheck);
    }
    var _handleContentResumeReq = function() {
        if (_adDisplayContainer) {
            _adDisplayContainer.destroy();
            _adDisplayContainer = null;
        }
        _ctrls.hide();
        _adDiv.classList.add(styles.hide);
        // _adDiv.style.display = 'none'; //HACK w/o this after the ad i think the controls bars of content video still not working.
        _pFcnVector.switch2Cnt(_delayedAd); 
        _clearResizeListeners();
    }
    var _leftoverEvents = {}; //use to help us fire events and make sure dun fire the same thing more than once

    var _fireReportMaybe = function(name, obj = null) {
        if (_leftoverEvents[name]) {
            delete _leftoverEvents[name];
            //oh dear, still a problem to pass any info
            _pFcnVector.report(name, obj);
        } 
    }

    var fcnCallOnceUponStarted= function(ad, resolveFcn) {
        _callOnceUponStarted = null;

        _isAdStarted = true; // set the value to be true as we know that now the ad has really started
        /////console.log(`adBreakDuration=${adData.adBreakDuration} adPosition=${adData.adPosition} currentTime=${adData.currentTime} totalAds=${adData.totalAds} duration=${adData.duration}`);
        
        //TODO: Renee Fery review tis:
        //what is the content at this stage
        //
        let pauseAdToo = false;
        if (_pFcnVector.isPaused()) {
            //means we should also pause the ad lah!!
            pauseAdToo = true;
        }
        //<----
        _pFcnVector.hideSpinner();

        if (ad && ad.isLinear()) {
            _ctrls.show(); 
        }
        else {
            console.log(`#$ no need show the ads controls then coz non linear`);
        }

        _adDiv.classList.remove(styles.adHide); //
        _adDiv.classList.remove(styles.hide); //
        
        // _adDiv.style.display = 'block';//Fery pls note that I had to manipulate the display block and none
        //pls fix this. the jxhide class does not work
        if (resolveFcn) {
            let nonlinear = (ad && !ad.isLinear());
            //then if the play (start) has been held back then we signal the thing to start the content video
            resolveFcn(nonlinear ? "jxnonlinearadstarted": "jxadstarted");
        }
        
        //---->
        _fireReportMaybe('started'); 
        _ctrls.updatePlayState(true);

        if(_adsManager.getVolume() > 0) {
            //console.log(`DS_DS_DS_DS_DS_DS_DS_DS 3 ${_adsManager.getVolume()}`);
            _adsManager.setVolume(1);
            _ctrls.updateMutedState(false);
        } else {
            //console.log(`DS_DS_DS_DS_DS_DS_DS_DS 4 ${_adsManager.getVolume()}`);
            _adsManager.setVolume(0);
            _ctrls.updateMutedState(true);
        }
        /* if (pauseAdToo) {
            setTimeout(function() {
                console.log(`executing the pause ad in started: handler`);
                _adsManager.pause();
            }, 0);
        }
        Cannot lah stupid Just did a content pause ah.
        */
        //However, if the content was already paused (coz the stupid ad took such a long time to come)
        //then here we should also 
    }
    //for app, then revert asap
    var _onAdEvent = function(evt) {
        //console.log(`##### ${evt.type}`);
        if (!_adsManager) return; //in case closed shop
        let ad = evt.getAd();
        /* if (evt.type != google.ima.AdEvent.Type.AD_PROGRESS) {
        console.log(`###1# ${ad.getAdId()}`);
        console.log(`###2# ${ad.getAdSystem()}`);
        console.log(`###3# ${ad.getAdvertiserName()}`);
        console.log(`###4# ${ad.getCreativeAdId()}`);
        console.log(`###5# ${JSON.stringify(ad.getWrapperAdIds())}`);
        }*/

        if (_eventsCallback) {
            let jxEvtName = _subscribedEvents[evt.type];
            if (jxEvtName) {
                setTimeout(function() {
                    _eventsCallback(jxEvtName);
                }, 0);
            }
        }

        switch(evt.type) {
            case google.ima.AdEvent.Type.LINEAR_CHANGED:
                if (ad && ad.isLinear()) {
                    _handleContentPauseReq(true); 
                    _ctrls.show(); 
                }
                else {
                    _handleContentResumeReq();
                    _ctrls.hide();
                }
                break;
            //or you can fire the thing 
            case google.ima.AdEvent.Type.AD_PROGRESS:
                //_isAdStarted = true;
                //it seems if the STARTED is not called, then 
                if (evt.type == google.ima.AdEvent.Type.AD_PROGRESS) {
                    let adData = evt.getAdData();
                    //console.log(`#### ONE ${JSON.stringify(adData, null, 2)}`);
                    if (adData.adPosition <= _adEnduredVec.length) {
                        _adEnduredVec[adData.adPosition] = adData.currentTime;
                        

                        if (!_reallyProgressed && adData.currentTime > 0) {
                            //the adData.currentTime can be rubbish sometimes
                            //before the ad starts, it can be e.g. 5, 15. So very strange.
                            //before it then really starts from near 0 and go up.
                           if (_knownCurrentTime ==  -1) {
                               _knownCurrentTime = adData.currentTime;
                           }
                           else if (adData.currentTime < _knownCurrentTime) {
                               _knownCurrentTime = adData.currentTime;
                           }
                           else {
                               if (adData.currentTime > (1+ _knownCurrentTime)) {
                                   //console.log(`## adData.currentTime=${adData.currentTime} vs knownCurrentTime=${_knownCurrentTime}`);
                                   _reallyProgressed = true;
                               }
                           }
                        }
                        if (adData.currentTime > 1 && _callOnceUponStarted) {
                            //if for some reason we missed the STARTED EVENT.
                            //then make up for it here...
                            //_callOnceUponStarted(ad);
                        }
                        //actually if we dun do progress bar, then dun bother.
                        if (!_isProgressBarUpdated && _isAdStarted) { // we check the progress bar has not been updated yet and the ad has really started
                            _isProgressBarUpdated = true; // change to be true so we only mainpulate the DOM just once

                            /** given container offsetWidth as the progress bar will take 100% width of its container */
                            _ctrls.updateProgressBar(_container.offsetWidth, adData);
                        }
                    }

                    //console.log(`adBreakDuration=${adData.adBreakDuration} adPosition=${adData.adPosition} currentTime=${adData.currentTime} totalAds=${adData.totalAds} duration=${adData.duration}`);
                  }
                break;
            case google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED:
                //length of all the ads in the adslot.
                let l = Math.round(_adEnduredVec.reduce((a, b) => a + b, 0));
                _fireReportMaybe('slotended', { slotduration: l});
                _fireReportMaybe('ended'); 
                _handleContentResumeReq();
                break;
            case google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED:
                _handleContentPauseReq(true); 
                _leftoverEvents['contentresume'] = 1; //with pause then can resume
                 break;
            case google.ima.AdEvent.Type.LOADED:     
                //confusing when this is fired!        
                //seems should be after adsManager.init but some webpages seems to suggest otherwise
                /* not sure if I need to act upon the info here..
                if (ad && !ad.isLinear()) {
                    console.log(`$% $% IS IS NOT LINEAR!!`);
                    //no need to hold the contents then...

                }
                else {
                    console.log(`$% $% IT IS LINEAR!!`);
                }
                */
                break;
            case google.ima.AdEvent.Type.STARTED:
                //<--
/****** yes this works:
var selectionCriteria = new google.ima.CompanionAdSelectionSettings();
selectionCriteria.resourceType = google.ima.CompanionAdSelectionSettings.ResourceType.STATIC;
selectionCriteria.creativeType = google.ima.CompanionAdSelectionSettings.CreativeType.IMAGE;
selectionCriteria.sizeCriteria = google.ima.CompanionAdSelectionSettings.SizeCriteria.IGNORE;
// Get a list of companion ads for an ad slot size and CompanionAdSelectionSettings
var companionAds = ad.getCompanionAds(300, 250, selectionCriteria);
var companionAd = companionAds[0];
// Get HTML content from the companion ad.
var content = companionAd.getContent();
console.log(content);
console.log("---------");
// Write the content to the companion ad slot.
//var div = document.getElementById('companion-ad-300-250');
//div.innerHTML = content;
//break;
the companion ad info in content is an HTML snipplet.
******/
                //-->
                if (_callOnceUponStarted) {
                    _callOnceUponStarted(ad, this.resolveFcn);
                }
                break;
            case google.ima.AdEvent.Type.COMPLETE:
            case google.ima.AdEvent.Type.SKIPPED:
                break;
            case google.ima.AdEvent.Type.PAUSED:
                _pFcnVector.report('pause'); 
                _pFcnVector.onAdPause(); 
                _ctrls.updatePlayState(false);

                /** check if the progress bar has been updated, then we set to false as now the ad has been paused */
                if (_isProgressBarUpdated) _isProgressBarUpdated = false;
                _ctrls.pauseProgressBar();
                break;
            case google.ima.AdEvent.Type.RESUMED:
                _pFcnVector.report('playing'); 
                _pFcnVector.onAdPlaying(); 
                _ctrls.updatePlayState(true);
                break;
            case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
                //Dun think it is always called. cannot depend on it.
                //TODO Not sure how to deal with his yet, if anything needs to be done
                break;
        }
    }
  

    function _onAdError(adErrorEvent) {
        let errcode = -1;
        let adE = null;
        if (adErrorEvent) {
            adE = adErrorEvent.getError();
            if (adE) {
                errcode = adE.getErrorCode();
                //console.log(`##### 1.1 ${adE.getMessage()}`);
                //console.log(`##### 1.2 ${adE.toString()}`);
                /***** if (true) {
                    _harvestErrorInfo(adE);
                }*****/
            }
        }
        _pFcnVector.report('error', {errorcode: errcode}); 
        if (this.resolveFcn)
            this.resolveFcn("jxaderrored");
        if (_leftoverEvents['triggerend']) {
            let errStr = null;
            delete _leftoverEvents['triggerend'];
            _pFcnVector.hideSpinner();
            try {
                //errStr = 'at1';
                _adsManager.stop();
                //errStr = 'at2';
                _fireReportMaybe('slotended', { slotduration: 0});
                //errStr = 'at3';
                _fireReportMaybe('ended'); 
                //errStr = 'at4';
                if (_leftoverEvents['contentresume']) {
                    //errStr = 'at5';
                    delete _leftoverEvents['contentresume'];
                    //errStr = 'at6';
                    _handleContentResumeReq();
                    //errStr = 'at7';
                }
                //else {
                  //  errStr = 'at4b';
                //}
                //errStr = 'allpass';
            }
            catch (ex) {
                //errStr += "--" + ex.toString();
            }
            /* if (errStr) {
                errStr += "--X-" + adE.toString() + "--XX-" + adE.getMessage();
            }
            if (errStr && window.reneeDbg == 1) {
                try {
                    let data = JSON.stringify({text: errStr});
                    let xhr = new XMLHttpRequest();
                    xhr.open("POST", `https://hooks.slack.com/services/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?text=dbgg`);
                    xhr.send(data);
                }
                catch (error) {
                }
            }*/
        }
        return; 
    }

    var _onNoAd = function(e) {
        /********* _harvestErrorInfo2(e);    *******/
        _adLoaderOutcome = "jxnoad";
        if (this.resolveFcn)
            this.resolveFcn("jxnoad");
    };
    var _startAd = function(resolveFcn) {
        // console.log(`___ adsManager init ${_forceWidth ? _forceWidth : _width} ${_forceHeight ? _forceHeight : _height}`);
        if (!_forVideoAdSDK) {
            // for the general ads putting the init too early we encountered problems before.
            // For our own that vpaid js stuff, doing the init earlier is OK.
            _adsManager.init(
            _forceWidth ? _forceWidth : _width, 
            _forceHeight ? _forceHeight : _height, 
            google.ima.ViewMode.NORMAL); 
        }
        if (!_subscribedEvents) {            
            //earlier the IMA SDK might not be loaded so the string like
            //google.ima.AdEvent.Type.IMPRESSION might not be defined
            //So do this now:
            _subscribedEvents = {};
            for (var p in _preSubscribedEvents) {
                _subscribedEvents[google.ima.AdEvent.Type[p]] = _preSubscribedEvents[p]
            }
        }
        _imaEvents.forEach(function(evtName) {
            _adsManager.addEventListener(
                google.ima.AdEvent.Type[evtName],
                _onAdEvent.bind({resolveFcn: resolveFcn})
            );
        });
        //bind the res function to it
        
        
        _adsManager.addEventListener(
            google.ima.AdErrorEvent.Type.AD_ERROR,
            _onAdError.bind({resolveFcn: resolveFcn}));
        
        if(_adsManager) {
            try {
            _createControls();
            }
            catch(ee1) {
                console.log(ee1.stack);
            }
            _setupResizeListeners();

            //this setVolume(0) is needed for iOS at least, may be not all.
            //else if e.g. video autoplayed and then I turned on the sound
            //when the ad comes the ad will not be able to play.
            if (common.isIOS()) {
                //console.log(`DS_DS_DS_DS_DS_DS_DS_DS 5 ${_adsManager.getVolume()}`);
                _adsManager.setVolume(0);
                //but then we should also change the volume of the underlying then
                //else when the ad ends we get a shock!
                _pFcnVector.setContentMuteState(true);
            }

            //On purpose
            // _adDiv.style.display = 'block'; //TODO
            //console.log(`#$ calling adsManager start`);
            _adsManager.start();
        }
    };
    FactoryOneAd.prototype.setAutoAdsManagerStart = function(val) {
        _autoAdsManagerStart = val;
    }
    FactoryOneAd.prototype.getAdsLoaderOutcome = function() {
        return _adLoaderOutcome;
    }
    var _onAdsManagerLoaded = function(adsManagerLoadedEvent) {
        //use this to help us only fire each of this max once:
        //will be removing from here after firing.
        //TODO PROPERLY ...
        //var e = new Event('jxhasad');
        //window.dispatchEvent(e);

        _leftoverEvents = {
            //when later there is the content paused event, then we will add 'contentresume' = 1
            'triggerend': 1, 
            'started': 1,
            'ended': 1,
            'slotended': 1
        };
        //also a similar helper
        _adEnduredVec = [0,0,0,0,0];
        //----->
    
        _adLoaderOutcome = "jxhasad";
        
        let adsRenderingSettings = new google.ima.AdsRenderingSettings();
        //https://gist.github.com/i-like-robots/4d808f71c5602e0d6dfd320a37b24cb2
        if (_forVideoAdSDK) {
            adsRenderingSettings.enablePreloading = true;
        }
        // you must restore original state for mobile devices that recycle video element
        // adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true; //?? TODO. dun understand

        _adsManager = adsManagerLoadedEvent.getAdsManager(_vid, adsRenderingSettings);
        _width = _container.offsetWidth;
        _height = _container.offsetHeight;
       // _adsManager.init(_width, _height, google.ima.ViewMode.NORMAL);
        //TODO: Pontential problems ....??? supposed to call this as response to user action on phones.
        _adDisplayContainer.initialize();
        _pFcnVector.report('hasad');

        //Even before we call the _startAd thing, the IMA SDK could be fetching stuff (e.g. the VPAID JS)
        //the mp4 etc already. So it is possible for error to be emitted even here.
        //actually if waterfall I dun really know.
        let resFcn = this.resolveFcn;
        _adsManager.addEventListener(
            google.ima.AdErrorEvent.Type.AD_ERROR,
            _onAdError.bind({resolveFcn: resFcn }));
        
        if (_forVideoAdSDK) {
            _adsManager.init(
                _forceWidth ? _forceWidth : _width, 
                _forceHeight ? _forceHeight : _height, 
                google.ima.ViewMode.NORMAL);    
        }
        //console.log(`##### autoAdsMgrStart = ${_autoAdsManagerStart}`);

        if (_autoAdsManagerStart) {
            _startAd(this.resolveFcn); //the one used in the makeAdRequest promise
            //then this is the original promise
            //we only resolve when the ad has either started or errorer out.
        }
        else {
            this.resolveFcn("jxhasad");
        }
    };
    
    var _sizeCheck = function() {
        if (_forceWidth || _forceHeight) {
            return;
        }
        
        if (_width != _container.offsetWidth || _height != _container.offsetHeight) { 
            _width = _container.offsetWidth;
            _height = _container.offsetHeight;
            if (_adsManager) {
                // console.log(`___ adsManager resize ${_width} ${_height}`);
                _adsManager.resize(_width, _height);
            }
        }
    };
    var _createControls = function() {
        if (!_ctrls) {
            _ctrls = MakeOneAdControlsObj(_adDiv, _makeFcnVectorForUI(), _doProgressBar, _controlsObj);
        }
        _ctrls.hide();
    };
    var _createUIElt = function() {
        if (!_adDiv) _adDiv = common.newDiv(_container, "div", "", styles.adDiv);
        _adDiv.classList.add(styles.adHide);
        // _adDiv.style.display = 'none'; //HACK Renee put in this fix. Without this
        //during countdown the content controls are not showing
    };
    
    //constructor
    function FactoryOneAd(container, vid, fcnVector, controlsObj, progressBar = true) {
        _vid = vid;
        _container = container;
        _pFcnVector = fcnVector;
        _width = container.offsetWidth;
        _height = container.offsetHeight;
        _doProgressBar = progressBar;
        _controlsObj = controlsObj ? JSON.parse(JSON.stringify(controlsObj)): null;
    }
    FactoryOneAd.prototype.setVpaidSecure = function(flag) {
        _vpaidSecure = flag;
    }
    FactoryOneAd.prototype.forceDimensions = function(width, height) {
        _forceWidth = width;
        _forceHeight = height;
    }

    FactoryOneAd.prototype.makeAdRequestFromXMLP = function(vastXML, autoplayFlag, mutedFlag) {
        this.reset();
        return _makeAdRequestP(null, vastXML, autoplayFlag, mutedFlag);
    }
    FactoryOneAd.prototype.makeAdRequestP = function(adURL, autoplayFlag, mutedFlag) {
        this.reset();
        return _makeAdRequestP(adURL, null, autoplayFlag, mutedFlag);
    }
    FactoryOneAd.prototype.makeAdRequestFromXMLCB = function(vastXML, autoplayFlag, mutedFlag, cb) {
        this.reset();
        _makeAdRequestCB(null, vastXML, autoplayFlag, mutedFlag, cb);
    }
    FactoryOneAd.prototype.makeAdRequestCB = function(adURL, autoplayFlag, mutedFlag, cb) {
        this.reset();
        _makeAdRequestCB(adURL, null, autoplayFlag, mutedFlag, cb);
    }

    function _makeAdRequestCB(adURL, adXML, autoplayFlag, mutedFlag, callback) {
        let prom = _makeAdRequestP(adURL, adXML, autoplayFlag, mutedFlag);
        prom.then(function(val){
            callback(val);
        });
    }

    function _makeAdRequestP(adURL, adXML, autoplayFlag, mutedFlag) {
        /* if (adURL && adURL.indexOf('1000114-aFHHNeXdkP') > -1) {
            let myarray = [
                23, 1038, 799, 691, 884, 1120
            ]
            let  myidx = Math.floor(Math.random() * 6);
            let cid = myarray[myidx];
            window.reneeDbg = 1;
            adURL = `https://content.jixie.io/v1/video?maxnumcreatives=13&source=jxplayer&client_id=52471830-e2f4-11ea-b5e9-f301ddda9414&sid=1639439102-52471830-e2f4-11ea-b5e9-f301ddda9414&pageurl=https%3A%2F%2Fmegapolitan.kompas.com%2Fread%2F2021%2F05%2F28%2F05334261%2Fupdate-27-mei-bertambah-15-kasus-covid-19-di-tangsel-kini-totalnya-11257&domain=megapolitan.kompas.com&unit=1000114-qEgXGqRpBy&creativeid=` + cid;
        }*/
        _width = _container.offsetWidth;
        _height = _container.offsetHeight;
        
        _adLoaderOutcome = "jxpending";
        _clearResizeListeners(); //paranoia

        return new Promise(function(resolve, reject) {
            common.loadIMAScriptP().then(function() {
                google.ima.settings.setDisableCustomPlaybackForIOS10Plus(true);
                google.ima.settings.setNumRedirects(maxNumVastRedirects_);

                _createUIElt();
                _adDisplayContainer = new google.ima.AdDisplayContainer(_adDiv, _vid);
                // Re-use this AdsLoader instance for the entire lifecycle of your page. 
                _adsLoader = new google.ima.AdsLoader(_adDisplayContainer);
                    // Add event listeners to the adLoader: will be called if there is an ad loaded after 
                    //calling the ad-server
                _adsLoader.addEventListener(
                    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
                    _onAdsManagerLoaded.bind({
                    resolveFcn: resolve,
                    }),
                   false
                );
                // Add event listeners to the adLoader: will be called if there is an error
                _adsLoader.addEventListener(
                    google.ima.AdErrorEvent.Type.AD_ERROR,
                    _onNoAd.bind({
                        resolveFcn: resolve
                    }),
                    false
                );
                
                let adsRequest = new google.ima.AdsRequest();
                adsRequest.forceNonLinearFullSlot = true;
                // adURL = 'https://ad.jixie.io/v1/video?source=jxplayer&domain=travel.kompas.com&pageurl=https%3A%2F%2Ftravel.kompas.com%2Fread%2F2021%2F06%2F16%2F180106127%2Ftraveloka-dan-citilink-gelar-promo-diskon-tiket-pesawat-20-persen&width=546&client_id=72356cf0-d22c-11eb-81b0-7bc2c799acca&sid=1625728274-72356cf0-d22c-11eb-81b0-7bc2c799acca&creativeid=937';
                //adURL = 'https://ad.jixie.io/v1/video?source=jxplayer&domain=travel.kompas.com&pageurl=https%3A%2F%2Ftravel.kompas.com%2Fread%2F2021%2F06%2F16%2F180106127%2Ftraveloka-dan-citilink-gelar-promo-diskon-tiket-pesawat-20-persen&width=546&client_id=72356cf0-d22c-11eb-81b0-7bc2c799acca&sid=1625728274-72356cf0-d22c-11eb-81b0-7bc2c799acca&creativeid=1120';
                //adURL = 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinearvpaid2js&correlator=' + Date.now();
                /*
                adURL = null;
                adXML = `<VAST version="3.0">
                <Ad id="20004">
                    <InLine>
                        <AdSystem version="4.0">iabtechlab</AdSystem>
            
                        <AdTitle>
                            <![CDATA[VAST 4.0 Pilot - Scenario 5]]>
                        </AdTitle>
                        <Description>
                            <![CDATA[This is sample companion ad tag with Linear ad tag. This tag while showing video ad on the player, will show a companion ad beside the player where it can be fitted. At most 3 companion ads can be placed. Modify accordingly to see your own content.]]>
                        </Description>
            
                        <Pricing model="cpm" currency="USD">
                            <![CDATA[ 25.00 ]]>
                        </Pricing>
            
                        <Error>http://example.com/error</Error>
                        <Impression id="Impression-ID">http://example.com/track/impression</Impression>
            
                        <Creatives>
                            <Creative id="5480" sequence="1">
                                <CompanionAds>
                                    <Companion id="1232" width="300" height="250" assetWidth="250" assetHeight="200" expandedWidth="350" expandedHeight="250">
                                           <StaticResource creativeType="image/png">
                                            <![CDATA[https://www.iab.com/wp-content/uploads/2014/09/iab-tech-lab-6-644x290.png]]>
                                            </StaticResource>
                                            <CompanionClickThrough>
                                                <![CDATA[https://iabtechlab.com]]>
                                            </CompanionClickThrough>
                                    </Companion>
                                </CompanionAds>
                            </Creative>
                            <Creative id="5480" sequence="1">
                                <Linear>
                                    <Duration>00:00:16</Duration>
                                    <TrackingEvents>
                                        <Tracking event="start">http://example.com/tracking/start</Tracking>
                                        <Tracking event="firstQuartile">http://example.com/tracking/firstQuartile</Tracking>
                                        <Tracking event="midpoint">http://example.com/tracking/midpoint</Tracking>
                                        <Tracking event="thirdQuartile">http://example.com/tracking/thirdQuartile</Tracking>
                                        <Tracking event="complete">http://example.com/tracking/complete</Tracking>
                                        <Tracking event="progress" offset="00:00:10">http://example.com/tracking/progress-10</Tracking>
                                    </TrackingEvents>
            
                                    <VideoClicks>
                                        <ClickTracking id="blog">
                                            <![CDATA[https://iabtechlab.com]]>
                                        </ClickTracking>
                                    </VideoClicks>
            
                                    <MediaFiles>
                                        <MediaFile id="5241" delivery="progressive" type="video/mp4" bitrate="500" width="400" height="300" minBitrate="360" maxBitrate="1080" scalable="1" maintainAspectRatio="1" codec="0">
                                            <![CDATA[https://iab-publicfiles.s3.amazonaws.com/vast/VAST-4.0-Short-Intro.mp4]]>
                                        </MediaFile>
                                    </MediaFiles>
                                </Linear>
                            </Creative>
            
                        </Creatives>
                        <Extensions>
                            <Extension type="iab-Count">
                                <total_available>
                                    <![CDATA[ 2 ]]>
                                </total_available>
                            </Extension>
                        </Extensions>
                    </InLine>
                </Ad>
            </VAST>
            `;
            This is what we get from the getContent

            <a target="_blank" id="1232" href="https://iabtechlab.com"><div class="overlayContainer"><img src="https://www.iab.com/wp-content/uploads/2014/09/iab-tech-lab-6-644x290.png" height="250" width="300"><div class="overlayTextAttribution"></div></div></a>
            

            var el = document.createElement( 'html' );
            el.innerHTML = `<a target="_blank" id="1232" href="https://iabtechlab.com"><div class="overlayContainer"><img src="https://www.iab.com/wp-content/uploads/2014/09/iab-tech-lab-6-644x290.png" height="250" width="300"><div class="overlayTextAttribution"></div></div></a>`;
            
            let x = el.getElementsByTagName( 'a' ); // Live NodeList of your anchor elements
            let y = el.getElementsByTagName( 'img' ); // Live NodeList of your anchor elements
            x[0].href
'https://iabtechlab.com/'
y[0].src
'https://www.iab.com/wp-content/uploads/2014/09/iab-tech-lab-6-644x290.png'
                    */
                if (adURL) 
                    adsRequest.adTagUrl = adURL;
                else if (adXML) {
                    adsRequest.adsResponse = adXML;
                }    
                adsRequest.linearAdSlotWidth = _forceWidth ? _forceWidth: _width;
                adsRequest.linearAdSlotHeight = _forceHeight ? _forceHeight: _height;
                adsRequest.nonLinearAdSlotWidth = _forceWidth ? _forceWidth: _width;
                adsRequest.nonLinearAdSlotHeight = (_forceHeight ? _forceHeight: _height) / 3;
              
                adsRequest.setAdWillAutoPlay(autoplayFlag); 
                adsRequest.setAdWillPlayMuted(mutedFlag);

                google.ima.settings.setVpaidMode(
                    _vpaidSecure ? 
                    google.ima.ImaSdkSettings.VpaidMode.ENABLED:
                    google.ima.ImaSdkSettings.VpaidMode.INSECURE);
                //console.log(`auto=${autoplayFlag} muted=${mutedFlag}`);
                _pFcnVector.report('requested'); //FERY NOTE
                _adsLoader.requestAds(adsRequest); // checking if we can get an ad
            })
        })
    };
    FactoryOneAd.prototype.startAd = function(resolveFcn, isDelayedAd = false) {
        _delayedAd = isDelayedAd;
        _aStartApiCalled = true;
        _startAd(resolveFcn);
    };
    FactoryOneAd.prototype.playOrStartAd = function() {
        if (!_aStartApiCalled) {
            _aStartApiCalled = true;
            //console.log(`## admgr to call _startAd()`);
            _startAd();
            return;
        }
        //console.log(`## admgr to call _playAd()`);
        _playAd();
    };
    
    FactoryOneAd.prototype.playAd = function() {
        //this is called by the player.
        _playAd();
    };
    FactoryOneAd.prototype.pauseAd = function() {
        _pauseAd();
    };
    FactoryOneAd.prototype.subscribeToEvents = function(eventsArr, callback) {
        //it will reset everything
        _imaEvents = JSON.parse(JSON.stringify(imaEventsSeed_));
        _preSubscribedEvents = {};

        eventsArr.forEach(function(jxEvtName) {
            let found = subscribableEvents_.find((e) => e[0] == jxEvtName);
            if (found) {
                if (_imaEvents.indexOf(found[1]) == -1) {
                    _imaEvents.push(found[1]);
                }
                _preSubscribedEvents[found[1]] = jxEvtName;
            }
        });
        _eventsCallback = callback;
    }

    //added this thing (repeat of code... aarh) This is for playerWrapper to call
    //coz when user press to continue with an ad , we turn the sound on for him:
    FactoryOneAd.prototype.unmuteAd = function() {
        if (_adsManager) {
            _adsManager.setVolume(1);
        }
        //if the user has turned on the volume then let the thing continue to play then
        //with sound                        
        _ctrls.updateMutedState(false);
        _pFcnVector.setContentMuteState(false);
    }
    FactoryOneAd.prototype.setForVideoAdSDK = function() {
        _forVideoAdSDK = true;
    }
    let ret = new FactoryOneAd(container, vid, fcnVector, controlsObj, progressBar);
    return ret;
};

module.exports = MakeOneAdObj_;


/* 
 ************** module: video/admgr-factory ******************************************

* module.exports:
    - function which will make one ad mgr object
     The made object will have the following functions:
        - reset  function(): to kill any current ad play, if any. Get ready for next use
        - subscribeToEvents function(eventsArr, callback) 
            - possible entries in the array
                "jxadended", 
                "jxadfirstQuartile",
                "jxadthirdQuartile",
                "jxadmidpoint",
                "jxadskipped", 
                "jxadalladscompleted",
                "jadclick", 
                "jxadimpression",
                "jxadstart"
        - getAdsLoaderOutcome  function() : jxhasad, jxnoad, jxpending

        - forceDimensions  function(width, height) (for the adManager size). Else we detect the ad container size and any change
        - makeAdRequestFromXMLP  function(vastXML, autoplayFlag, mutedFlag) 
        - makeAdRequestP  function(adURL, autoplayFlag, mutedFlag) 
        - makeAdRequestFromXMLCB  function(vastXML, autoplayFlag, mutedFlag, cb) 
        - makeAdRequestCB  function(adURL, autoplayFlag, mutedFlag, cb) 
            - adrequest can be with tag or with XML
            - see that there is a "CB" variant and a P variant
            - P variant returns a promise. Can resolve to jxhasad, jxnoad
        - setAutoAdsManagerStart  function(val)
        
        - startAd  function(resolveFcn) 
            - possible resolved values "jxnonlinearadstarted", "jxadstarted", "jxaderrored"
        - playOrStartAd  function() 
        - playAd function() 
        - pauseAd function()

        - unmuteAd function() 

    
* requires/dependencies:
    e.g. adctrls-factory 
*/
