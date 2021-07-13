const modulesmgr            = require('../basic/modulesmgr');
const _helpers              = modulesmgr.get('video/helpers');
const cssmgr                = modulesmgr.get('video/cssmgr');
const hideCls               = cssmgr.getRealCls('hideCls');
const adHideCls             = cssmgr.getRealCls('adHideCls');

const MakeOneAdControlsObj  = modulesmgr.get('video/adctrls-factory');

const isIOS_ = !window.MSStream && /iPad|iPhone|iPod/.test(navigator.userAgent); // fails on iPad iOS 13


 /**
     * 
     * @param {*} theAd : an object which describes the ad
     * @param {*} container 
     * @param {*} controlsColor 
     * @param {*} vid the content video element
     * @param {*} fcnVector : vector of functions to control the player
     * @param {*} autoAdsMgrStart : whether when we get onAdsManagerLoaded, we should play the 
     * ad right away or that startAd will be called explicitly.
     * @param {*} eventsVector : the list of events we need to fire
     * @returns 
     */
    //ok we have the autoAdsMgrStart and the events Vector leh
  function MakeOneAdObj_(container, controlsColor, vid, fcnVector,
    autoAdsMgrStart, eventsVector) {
    var _forceWidth = 0;
    var _forceHeight = 0;
    
    var _vid = null;
    var _pFcnVector = null; //this is how to work with the CONTENT VIDEO player
    var _container = null;
    var _adDescriptor = null;
    var _ctrls = null;
    var _adDiv = null;

    var _width = 1;
    var _height = 1;
    var _adsManager = null;
    var _adsLoader = null;
    var _adDisplayContainer = null;
    var _sizeCheckTimer = null;
    var _autoAdsMgrStart = true; //i.e. when adsmanagerloaded comes , then just start the ad.
    
    var _doEventMaybe = function(action) {
        var e = new Event(action);
        window.dispatchEvent(e);
        if (action == 'jxadended' || action == 'jxnoad') {
            let obj = {
                type: action,
                token: "abc" //_adDescriptor.token
            }
            let msgStr = "jxmsg::" + JSON.stringify(obj);
            window.parent.postMessage(msgStr, '*'); 
        }
    };
    
    FactoryOneAd.prototype.reset = function() {
        _forceWidth = 0;
        _forceHeight = 0;
        /** reset the state back to initial */
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
                //_pFcnVector.setContentMuteState(false);
            },
        };
        return fcnVector;
    };
    var _playAd = function() {
        //this is only legit if really started ah
        if (_adsManager) {
            _adsManager.resume();
        }
    };
    var _pauseAd = function() {
        //this is only legit if really started ah
        if (_adsManager) {
            _adsManager.pause();
        }
    };
    var _handleContentPauseReq = function(hideContent) {
        _pFcnVector.switch2Ad(hideContent);
    }
    var _setupResizeListeners = function() {
        _sizeCheckTimer = setInterval(_sizeCheck, 500);
        //window.addEventListener('resize', _sizeCheck);
        //window.addEventListener('jxintresize', _sizeCheck);
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
        _pFcnVector.switch2Cnt();
        _clearResizeListeners();
    }

    var _onAdEvent = function(evt) {
        if (!_adsManager) return; //in case closed shop
        let ad = evt.getAd();
        switch (evt.type) {
            case google.ima.AdEvent.Type.STARTED:
                if (ad && ad.isLinear()) {
                    _ctrls.show();
                } else {
                    console.log(`#$ no need show the ads controls then coz non linear`);
                }
                _adDiv.classList.remove(adHideCls);
                _ctrls.updatePlayState(true);

                if (_adsManager.getVolume() > 0) {
                    _adsManager.setVolume(1);
                    _ctrls.updateMutedState(false);
                } else {
                    _adsManager.setVolume(0);
                    _ctrls.updateMutedState(true);
                }
                break;
            case google.ima.AdEvent.Type.COMPLETE:
            case google.ima.AdEvent.Type.SKIPPED:
               // _doEventMaybe('jxadended');
                //emit an ended event? to universal lite
                break;
            case google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED:
                _handleContentPauseReq();            
                break;
            case google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED:
                _handleContentResumeReq();
                break;
            case google.ima.AdEvent.Type.PAUSED:
                _ctrls.updatePlayState(false);
                break;
            case google.ima.AdEvent.Type.RESUMED:
                _ctrls.updatePlayState(true);
                break;
            case google.ima.AdEvent.Type.FIRST_QUARTILE:
                _pauseAd();
                //HACK
                _doEventMaybe('jxadfirstQuartile');
                break;
            case google.ima.AdEvent.Type.MIDPOINT:
                _doEventMaybe('jxadmidpoint');
                break;
            case google.ima.AdEvent.Type.THIRD_QUARTILE:
                _doEventMaybe('jxadthirdQuartile');
                break;
            case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
                _doEventMaybe('jxadalladscompleted');
                break;
            case google.ima.AdEvent.Type.CLICK:
                _doEventMaybe('jxadclick');
                break;
            case google.ima.AdEvent.Type.IMPRESSION:
                _doEventMaybe('jxadimpression');
                break;
        }
    }
    function _onAdError(adErrorEvent) {
        _doEventMaybe('jxnoad');
        return;
    }
    var _onNoAd = function(e) {
        _doEventMaybe('jxnoad');
    };
    var _startAd = function(resolveFcn) {
        console.log(`_startAd: _adsManager.init(${_width}, ${_height}, google.ima.ViewMode.NORMAL);`);
        _adsManager.init(
            _forceWidth ? _forceWidth : _width, 
            _forceHeight ? _forceHeight : _height, 
            google.ima.ViewMode.NORMAL);
        
        const basicEvents = [   
            "LOADED",
            "SKIPPED",
            "COMPLETE",
            "PAUSED",
            "RESUMED",
            "CONTENT_PAUSE_REQUESTED",
            "CONTENT_RESUME_REQUESTED",
            "STARTED",
            "ALL_ADS_COMPLETED",
            'FIRST_QUARTILE'

        ];
        const eventsMapping_ = {
            jxadfirstQuartile: 'FIRST_QUARTILE',
            jxadmidpoint: 'MIDPOINT',
            jxadthirdQuartile: 'THIRD_QUARTILE',
            jxadalladscompleted: 'ALL_ADS_COMPLETED',
            jxadclick: 'CLICK',
            jximpression: 'IMPRESSION'
        };
        let v = [];
        for (var prop in eventsVector) {
            if (eventsMapping_[prop]) {
                v.push(eventsMapping_[prop]);
            }
        }
        eventsWeCare = basicEvents.concat(v);
        eventsWeCare.forEach(function(evtName) {
            _adsManager.addEventListener(
                google.ima.AdEvent.Type[evtName],
                _onAdEvent.bind({
                    resolveFcn: resolveFcn
                })
            );
        });
        //bind the res function to it
        if (_adsManager) {
            _createControls();
            _setupResizeListeners();
            //this setVolume(0) is needed for iOS at least, may be not all.
            //else if e.g. video autoplayed and then I turned on the sound
            //when the ad comes the ad will not be able to play.
            if (isIOS_) {
                _adsManager.setVolume(0);
                //but then we should also change the volume of the underlying then
                //else when the ad ends we get a shock!
                _pFcnVector.setContentMuteState(true);
            }
            _adsManager.start();
        }
    };
    var _onAdsManagerLoaded = function(adsManagerLoadedEvent) {
        let adsRenderingSettings = new google.ima.AdsRenderingSettings();
        //https://gist.github.com/i-like-robots/4d808f71c5602e0d6dfd320a37b24cb2
        //adsRenderingSettings.enablePreloading = true;
        // you must restore original state for mobile devices that recycle video element
        // adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true; //?? TODO. dun understand
        _adsManager = adsManagerLoadedEvent.getAdsManager(_vid, adsRenderingSettings);
        //TODO: Pontential problems ....??? supposed to call this as response to user action on phones.
        _adDisplayContainer.initialize();

        //Even before we call the _startAd thing, the IMA SDK could be fetching stuff (e.g. the VPAID JS)
        //the mp4 etc already. So it is possible for error to be emitted even here.
        //actually if waterfall I dun really know.
        _adsManager.addEventListener(
            google.ima.AdErrorEvent.Type.AD_ERROR,
            _onAdError.bind({
            }));

        if (_autoAdsMgrStart) {
            _startAd(); //the one used in the makeAdRequest promise
            //then this is the original promise
            //we only resolve when the ad has either started or errorer out.
        } else {
            _doEventMaybe('jxhasad');
        }
    };
    //if as the display type then cannot resize lah.
    var _sizeCheck = function() {
        if (_forceWidth || _forceHeight) {
            return;
        }
        if (_width != _adDiv.offsetWidth || _height != _adDiv.offsetHeight) {
            _width = _adDiv.offsetWidth;
            _height = _adDiv.offsetHeight;
            if (_adsManager) {
                _adsManager.resize(_width, _height);
            }
        }
    };
    var _createControls = function() {
        if (!_ctrls)
            _ctrls = MakeOneAdControlsObj(_adDiv, _makeFcnVectorForUI());
        _ctrls.hide();
    };
    

    //constructor
    function FactoryOneAd(adDiv, controlsColor, vid, fcnVector, 
        autoAdsMgrStart = true,
        eventsVector = null) {

        _eventsVector       = eventsVector;
        _autoAdsMgrStart    = autoAdsMgrStart;
        //_adDescriptor       = theAd;
        _vid                = vid;
        _adDiv = adDiv;
        _pFcnVector         = fcnVector;
        _width              = _adDiv.offsetWidth; //_adDescriptor.width;
        _height             = _adDiv.offsetHeight; //_adDescriptor.height;
        _controlsColor      = controlsColor;
    }
    FactoryOneAd.prototype.forceDimensions = function(width, height) {
        _forceWidth = width;
        _forceHeight = height;
    }
    FactoryOneAd.prototype.makeAdRequestFromXMLP = function(vastXML, autoplayFlag, mutedFlag) {
        return _makeAdRequestP(null, vastXML, autoplayFlag, mutedFlag);
    }
    FactoryOneAd.prototype.makeAdRequestP = function(adURL, autoplayFlag, mutedFlag) {
        return _makeAdRequestP(adURL, null, autoplayFlag, mutedFlag);
    }
    function _makeAdRequestP(adURL, adXML, autoplayFlag, mutedFlag) {
        _clearResizeListeners(); //paranoia

        return new Promise(function(resolve, reject) {
            _helpers.loadIMAScriptP().then(function() {
                google.ima.settings.setDisableCustomPlaybackForIOS10Plus(true);
                _adDisplayContainer = new google.ima.AdDisplayContainer(_adDiv, _vid);
                // Re-use this AdsLoader instance for the entire lifecycle of your page. 
                _adsLoader = new google.ima.AdsLoader(_adDisplayContainer);
                // Add event listeners to the adLoader: will be called if there is an ad loaded after 
                //calling the ad-server
                _adsLoader.addEventListener(
                    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
                    _onAdsManagerLoaded.bind({
                    }),
                    false
                );
                // Add event listeners to the adLoader: will be called if there is an error
                _adsLoader.addEventListener(
                    google.ima.AdErrorEvent.Type.AD_ERROR,
                    _onNoAd.bind({
                    }),
                    false
                );
                let adsRequest = new google.ima.AdsRequest();
                adsRequest.forceNonLinearFullSlot = true;
                if (adURL)
                    adsRequest.adTagUrl = adURL;
                else if (adXML)                            
                    adsRequest.adsResponse = adXML;
                    adsRequest.linearAdSlotWidth = _forceWidth ? _forceWidth: _width;
                    adsRequest.linearAdSlotHeight = _forceHeight ? _forceHeight: _height;
                    adsRequest.nonLinearAdSlotWidth = _forceWidth ? _forceWidth: _width;
                    adsRequest.nonLinearAdSlotHeight = (_forceHeight ? _forceHeight: _height) / 3;
                  
                                        
                adsRequest.setAdWillAutoPlay(autoplayFlag);
                adsRequest.setAdWillPlayMuted(mutedFlag);
                _adsLoader.requestAds(adsRequest); // checking if we can get an ad
            })
        })
    };
    FactoryOneAd.prototype.startAd = function(resolveFcn) {
        _startAd(resolveFcn);
    };
    FactoryOneAd.prototype.playAd = function() {
        _playAd();
    };
    FactoryOneAd.prototype.pauseAd = function() {
        _pauseAd();
    };
    let ret = new FactoryOneAd(container, controlsColor, vid, fcnVector,
        autoAdsMgrStart, eventsVector);
    return ret;
};
module.exports = MakeOneAdObj_;