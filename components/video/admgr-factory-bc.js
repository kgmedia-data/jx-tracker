
/**
 *  In development : meant to REPLACE the admgr-factory.js soon
 * and be shared by both the videosdk and the normal video-ad-sdk (jxvideo.1.4.min.js and
 * jxvideo.1.3.min.s)
 **/
 const modulesmgr            = require('../basic/modulesmgr');
 const _helpers              = modulesmgr.get('video/helpers');
 const cssmgr                = modulesmgr.get('video/cssmgr');
 const adDivCls              = cssmgr.getRealCls('adDivCls');
 const hideCls               = cssmgr.getRealCls('hideCls');
 const adHideCls             = cssmgr.getRealCls('adHideCls');
 
 const maxNumVastRedirects_ = 5; //testing only. for ads

 const MakeOneAdControlsObj  = modulesmgr.get('video/adctrls-factory');

 const isIOS_ = !window.MSStream && /iPad|iPhone|iPod/.test(navigator.userAgent); // fails on iPad iOS 13

 
 function MakeOneAdObj_(container, controlsColor, vid, fcnVector) {
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

    var _autoAdsManagerStart = false;
    var _adLoaderOutcome = 'jxnone';

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

    //if you are making a long long adrequest
    //and when you are back, the whole thing was reset already.

    FactoryOneAd.prototype.reset = function() {
        //_autoAdsManagerStart = false;
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
            _adsManager.resume();
        }
    };
    var _pauseAd = function() {
        //this is only legit if really started ah
        if (_adsManager) {
            if (_isAdStarted) {
                _adsManager.pause();
            }
        }
    };
    var _handleContentPauseReq = function(hideContent) {
        _pFcnVector.switch2Ad(hideContent); 
    }
    var _setupResizeListeners = function() {
        _sizeCheckTimer = setInterval(_sizeCheck, 500);
        window.addEventListener('resize', _sizeCheck);
        window.addEventListener('jxintresize', _sizeCheck);
    }
    var _clearResizeListeners = function() {
        if (_sizeCheckTimer) {
            clearInterval(_sizeCheckTimer);
            _sizeCheckTimer = null;
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
        _adDiv.classList.add(hideCls);
        // _adDiv.style.display = 'none'; //HACK w/o this after the ad i think the controls bars of content video still not working.
        _pFcnVector.switch2Cnt(); 
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

    var _onAdEvent = function(evt) {
        if (!_adsManager) return; //in case closed shop
        //console.log(`#$ #$ #$ #$ #$ #$ #$ #$ #$ ${evt.type}`);
        let ad = evt.getAd();

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
                if (evt.type == google.ima.AdEvent.Type.AD_PROGRESS) {
                    let adData = evt.getAdData();
                    //possible for the ad to be non linear leh...
                    if (adData.adPosition <= _adEnduredVec.length) {
                        _adEnduredVec[adData.adPosition] = adData.currentTime;

                        if (!_isProgressBarUpdated && _isAdStarted) { // we check the progress bar has not been updated yet and the ad has really started
                            _isProgressBarUpdated = true; // change to be true so we only mainpulate the DOM just once
                            let transitionTime = adData.duration; // give the ad duration as initial transition time for progress bar to animate

                            /** if the progress bar has been paused when pause the ad, then we give remaining time of the ad as value for transition time */
                            if (_ctrls.isProgressBarHasPaused) transitionTime = adData.duration - adData.currentTime;
                            
                            /** given container offsetWidth as the progress bar will take 100% width of its container */
                            _ctrls.updateProgressBar(_container.offsetWidth, transitionTime);
                        }
                    }
                    //console.log(`adBreakDuration=${adData.adBreakDuration} adPosition=${adData.adPosition} currentTime=${adData.currentTime} totalAds=${adData.totalAds} duration=${adData.duration}`);
                  }
                break;
            case google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED:
                //length of all the ads in the adslot.
                let l = Math.round(_adEnduredVec.reduce((a, b) => a + b, 0));
                //_fireReportMaybe('slotended', { slotduration: l});
                //_fireReportMaybe('ended'); 
                _handleContentResumeReq();
                break;
            case google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED:
                _handleContentPauseReq(true); 
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
                _adDiv.classList.remove(adHideCls); //
                _adDiv.classList.remove(hideCls); //

                // _adDiv.style.display = 'block';//Fery pls note that I had to manipulate the display block and none
                //pls fix this. the jxhide class does not work
                if (this.resolveFcn) {
                    let nonlinear = (ad && !ad.isLinear());
                    //then if the play (start) has been held back then we signal the thing to start the content video
                    this.resolveFcn(nonlinear ? "jxnonlinearadstarted": "jxadstarted");
                }
                
                //---->
                //_fireReportMaybe('started'); 
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

                break;
            case google.ima.AdEvent.Type.COMPLETE:
            case google.ima.AdEvent.Type.SKIPPED:
                //_pFcnVector.report('slotended'); 
                //_pFcnVector.report('ended'); 
                break;
            case google.ima.AdEvent.Type.PAUSED:
                _pFcnVector.report('pause'); 
                _pFcnVector.onAdPause(); 
                _ctrls.updatePlayState(false);

                /** check if the progress bar has been updated, then we set to false as now the ad has been paused */
                if (_isProgressBarUpdated) _isProgressBarUpdated = false;

                /** given the child element's width of progress bar */
                let width = _ctrls.getProgressBarChildElm().offsetWidth;
                /** we check if the child element's width of progress bar is less than its parent's width
                 * then we pass the child element's width of progress bar when pausing the animation of progress bar
                */
                if (width < _ctrls.getProgressBarElm().offsetWidth) {
                    _ctrls.pauseProgressBar(width);
                }
                break;
            case google.ima.AdEvent.Type.RESUMED:
                //_pFcnVector.report('playing'); 
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
        if (adErrorEvent) {
            let adE = adErrorEvent.getError();
            if (adE) {
                errcode = adE.getErrorCode();
                /***** if (true) {
                    _harvestErrorInfo(adE);
                }*****/
            }
        }
        _pFcnVector.report('error', {errorcode: errcode}); 
        if (this.resolveFcn)
            this.resolveFcn("jxaderrored");
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
        _adsManager.init(
            _forceWidth ? _forceWidth : _width, 
            _forceHeight ? _forceHeight : _height, 
            google.ima.ViewMode.NORMAL);
        [
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
        ].forEach(function(evtName) {
            _adsManager.addEventListener(
                google.ima.AdEvent.Type[evtName],
                _onAdEvent.bind({resolveFcn: resolveFcn})
            );
        });
        //bind the res function to it
        
        /*
        _adsManager.addEventListener(
            google.ima.AdErrorEvent.Type.AD_ERROR,
            _onAdError.bind({resolveFcn: resolveFcn}));
        */

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
            if (isIOS_) {
                //console.log(`DS_DS_DS_DS_DS_DS_DS_DS 5 ${_adsManager.getVolume()}`);
                _adsManager.setVolume(0);
                //but then we should also change the volume of the underlying then
                //else when the ad ends we get a shock!
                _pFcnVector.setContentMuteState(true);
            }

            //On purpose
            //HACK RENEE TRY _adDiv.classList.remove(hideCls);
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
        var e = new Event('jxhasad');
        window.dispatchEvent(e);

        _leftoverEvents = { 
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
        //adsRenderingSettings.enablePreloading = true;
        // you must restore original state for mobile devices that recycle video element
       // adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true; //?? TODO. dun understand
        //XXX adsRenderingSettings.enablePreloading = false;


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
            _ctrls = MakeOneAdControlsObj(_adDiv, _makeFcnVectorForUI());
        }
        _ctrls.hide();
    };
    var _createUIElt = function() {
        if (!_adDiv) _adDiv = _helpers.newDiv(_container, "div", "", adDivCls);
        _adDiv.classList.add(adHideCls);
        // _adDiv.style.display = 'none'; //HACK Renee put in this fix. Without this
        //during countdown the content controls are not showing
    };
    
    //constructor
    function FactoryOneAd(container, controlsColor, vid, fcnVector) {
        _vid = vid;
        _container = container;
        _pFcnVector = fcnVector;
        _width = container.offsetWidth;
        _height = container.offsetHeight;
        _controlsColor = controlsColor;
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
        _width = _container.offsetWidth;
        _height = _container.offsetHeight;
        
        _adLoaderOutcome = "jxpending";
        _clearResizeListeners(); //paranoia

        return new Promise(function(resolve, reject) {
            _helpers.loadIMAScriptP().then(function() {
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

                //console.log(`auto=${autoplayFlag} muted=${mutedFlag}`);
                _pFcnVector.report('requested'); //FERY NOTE
                _adsLoader.requestAds(adsRequest); // checking if we can get an ad
            })
        })
    };
    FactoryOneAd.prototype.startAd = function(resolveFcn) {
        _isAdStarted = true;
        _startAd(resolveFcn);
    };
    FactoryOneAd.prototype.playOrStartAd = function() {
        if (!_isAdStarted) {
            _startAd();
            return;
        }
        _playAd();
    };
    
    FactoryOneAd.prototype.playAd = function() {
        //this is called by the player.
        _playAd();
    };
    FactoryOneAd.prototype.pauseAd = function() {
        console.log(`!!!! -bc pauseAd`);
        _pauseAd();
    };
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

    let ret = new FactoryOneAd(container, controlsColor, vid, fcnVector);
    return ret;
};

module.exports = MakeOneAdObj_;