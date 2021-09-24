
const modulesmgr                = require('../basic/modulesmgr');
const common                    = modulesmgr.get('basic/common');
const jxvhelper                 = modulesmgr.get('video/jxvideo-helper');
const consts                    = modulesmgr.get('video/consts');
const MakeOneAdObj              = modulesmgr.get('video/admgr-factory');
const MakeOnePlayerControlsObjD = modulesmgr.get('video/ctrls-factory');
const MakeOneSoundIndicator     = modulesmgr.get('video/soundind-factory');
const MakeOneSpinner            = modulesmgr.get('video/spinner-factory');
const MakeOneAdScheduler        = modulesmgr.get('video/adscheduler-factory');
     
const msPlayAttributeThreshold_     = 1000;
const msPauseAttributeThreshold_    = 1000;
    

const defaultPBMethod_          = 'shaka';
const defaultVolume_            = 0.5;

const fallbackTech_             = consts.fallbackTech;
const startModePWClick_         = consts.startModePWClick;
const startModePWAuto_          = consts.startModePWAuto;
const startModePWApi_           = consts.startModePWApi;
const startModeSDKApi_          = consts.startModeSDKApi;
const startModeSDKClick_        = consts.startModeSDKClick;
const startModeSDKAutoplay_     = consts.startModeSDKAutoplay;
const startModeSDKAuto_         = consts.startModeSDKAuto;


const _jxPreloadOverride        = null;
const _jxPlaybackOverride       = "shaka";

const initialState_             = 'content';
const remainSecEventsSeed_      = [15, 5, 2];

const adCountdownSec_           = 3;
const defaultCountDownToAdMsg   = "Ad starts in %%SECONDS%% s";

const delayedSetOffsetPBMethods_ = [ fallbackTech_, "native"];

const cssmgr                 = modulesmgr.get('video/cssmgr');

const JXPlayerID                = "JXPlayer"; //Is purely internal stuff no need 

window.jxPromisePolyfill        = 'none';

/**
    /**
     * The most important object in this whole file. The one doing the real work
     * Wraps around some player: currently:
     * -plain HTML5 video element (plays HLS or fallbackTech_)
     * -Shaka player around a video element
     * 
     *    constructor(container)
     *    setConfig (things dun change from vid to vide)
     *    setV = (srcHLS, srcFallback, title, offset, visEvent: optional )
     *    setReportCB (pause, play adplay, adpuse, ended...)
     * 
     *    JXPlayer [123, 124, 156]
     * 
     * @returns 
     */
     function MakePlayerWrapperObj_(container) {
        const styles                 = cssmgr.getRealCls(container);

        /**
         * "PRIVATE" variables :-) using closure.
         */
        var _forceAutoplayWithSound = false; 
        var _nextAdSlotTime = 999999;
        var _currToken = null;
        var _isConfigSet = false;
        var _genInitP = null; //general init promise (resolved means the general init of the player done)
        var _isDeferPlayPauseCmd = false; //when in a certain state, play pause commands 
                                          //to the video is piled up and not done immediately
        var _state = initialState_; //"init"; //ad or content or nothing yet
                                    //Yes we do keep if we are ad or content state currently
        var _cntVState = 'init'; //playing paused init (referring to the content video)
                                 //I may not keep this variable (Mainly for the case whereby
                                 //by the time the ad is started, content is paused (not referring to
                                 //being paused for the ad but really paused e.g. out of view)
                                 //KIV
        var _videoID = '';
        var _thumbnailURL = null;
        var _vid = null;
        var _container = null;
        var _contentDiv = null;
        var _ctrls = null; //player controls.

        var _oneOffInitDone = false; //after doing a first video, then this is set to true
        //some init we only need to do once.
        var _adObject = null;

        var _reportCB = function() {}; //donothing now. Can be overwritten
        var _gestureReportCB = function() {}; //donothing now. Can be overwritten
        var _defaultReportInfoBlob = null;
        var _accumulatedTime = 0;
        var _playheadCB = null; //for doing the save playhead in cookie
        var _adCountdownMgrFcn = null;

        //to manage the emission of the quartile, midpoint events efficiently
        //So ugly...
        var _remainSecEvents = JSON.parse(JSON.stringify(remainSecEventsSeed_));
        
        var _milestonesArr = [99999,99999,99999,99999];
        var _milestones = null;
        
        //At certain junctures, we do not immediately honor the calls on our play(), pause() functions
        //we save it (e.g. when ad about to come on.)
        var _todoPlayPauseCmd = null;

        /**
         * GUI elements typically created once and just hidden when not needed:
         */
        var _logoDiv = null;
        var _infoDiv = null;
        var _stripMessageDiv = null;
        var _stripMessage = defaultCountDownToAdMsg;
        //var _goOnModal = null;
        var _spinner = null;
        var _soundIndObj = null;

        //Each time we switch to a new video we refresh this
        //we need a start signal.
        //Only when this start signal is given then we can try to play
        //This start signal can be this object's play api being called
        //(by publisher JS or our own JXIntPlayer's intersection Observation)
        //If we dun *really* need a signal like that, then the code will resolve the
        //promise asap.
        var _startSignalledResolveFcns = [];
        
        //the first time play we use this to test out the play flag 
        var _savedVolume = -1;
        var _savedMuted = true;

        //playback method: possible values:
        //native (means not using any plugin to play HLS, just the <video>
        //shaka (means using shaka player to play HLS)
        //mp4 (play the mp4 in <video>)
        var _pbMethod = defaultPBMethod_; 
        var _pbMethodReal = defaultPBMethod_;

        var _startModePW = startModePWClick_;
        var _shakaPlayer = null;       

        //All the video events callback:
        //<-----
        //these are removed from listening as soon as video started
        var _boundMetadataLoadedCB = null;
        var _boundCanPlayThroughCB = null;
        var _boundVideoInitErrCB = null;
        //just to make sure in between videos the events are not ascribed to
        //the wrong video when we emit them to the api caller
        //always a clean unlisten and listen when we switch video
        //and the handler, when called, contains the bound videoid of the video
        //that it is associated with.
        var _boundOnEndedCB = null;
        var _boundOnErrorCB = null;
        var _boundOnPlayheadUpdateCB = null;
        var _boundOnPlayingCB = null;
        // var _boundOnClickCB = null;
        var _boundOnPausedCB = null;
        var _boundOnFullScreenCB = null;
        var _boundVolumeChangedCB = null;
        var _boundShakaOnErrorCB = null;
        var _boundSizeManagerFcn = null;
        //----->

        var _forcedResolution = -1;
        
        var _cfg = {
            
            //see definition place for the constant at top of file.
            startModePW: startModePWClick_
            //ad_delay: -1
            //no default adtag
        };

        //we need to do some heuristics to help us know whether the current pausing or playing
        //is due to user action or just our internal mechanism (intersectionObserver etc)
        var _msLastInternalCallPause = 0;
        var _msLastInternalCallPlay = 0;
        var _manualPaused = false;
  
        function FactoryPlayerWrapper(container) {
            //one off init: the synchronous stuff.
            _container = container;
            _boundSizeManagerFcn = sizeManagerFcn.bind({ lastwidth: _container.offsetWidth, lastheight: _container.offsetHeight, container: _container });
            _spinner = MakeOneSpinner(container);
                let r = Math.floor(Math.random() * 1000); 
                if(!_vid) {
                    let preloadString = 'metadata'; //currently that's what we have LIVE
                    if (_jxPreloadOverride == 'none') {
                        preloadString = 'none';
                    }
                    _contentDiv = common.newDiv(
                        _container,
                        "div",
                        '<video class="' + styles.player + '" width="100%" height="100%" id="' + JXPlayerID + '-' + r + '" muted playsinline preload="' + preloadString + '"></video>',
                        styles.cDiv
                    );
                    _vid = document.getElementById(JXPlayerID + '-' + r);
                }
                _createControlsMaybe();
        }
   
        function _makeCurrInfoBlobEarly(videoid) {
            return {
                accutime: 0,
                origtech: _pbMethod,
                realtech: _pbMethod,
                videoid: videoid,
                volume: 0,
                playhead: 0
            };
        }
        function _makeCurrInfoBlob(videoid) {
            //if it is provided here we will use that.
            if (videoid && videoid != _videoID) { 
                return null; 
            }
            return {
                accutime: _accumulatedTime,
                origtech: _pbMethod,
                realtech: _pbMethodReal,
                videoid: _videoID,
                volume: (_savedMuted ? 0: parseInt(_savedVolume * 100)),
                playhead: Math.round(_vid.currentTime) //should be the playhead ah Math.round(_accumulatedTime),
            };
        }

        //Renee note to Fery: I removed the resolve(..) calls as there is nothing to 
        //resolve. The hooking up of this canplay thru is just so we can set the playhead
        //it is not to trigger the next stage of the setup (vid -> ads etc)
        function _canPlayThroughCB() {
            if(_boundCanPlayThroughCB)
                _vid.removeEventListener('canplay', _boundCanPlayThroughCB);
            if (!isNaN(this.offset) && this.offset > 0) {
                if (delayedSetOffsetPBMethods_.includes(_pbMethodReal)) { 
                    _vid.currentTime = this.offset;
                }
            }
        }

        function setupMilestones() {
            if (!_milestones && _vid.duration > 0) {
                //set up then we can compare more easily in the playhead update
                //no need everytime do a calculation ...
                //calculate once 
                _milestonesArr[3] = Math.round(_vid.duration/4); //25pct
                _milestonesArr[2] = Math.round(_vid.duration/2); //50pct
                _milestonesArr[1] = Math.round(3*_vid.duration/4); //75pct
                _milestonesArr[0] = Math.round(9*_vid.duration/10); //90pct
                _milestones = _milestonesArr;
            }
        }
        //is bound one:
        //when a video source is changed. then all listeners should be removed.
        //If there was another video selected while the current one's metadataloaded was in flight
        //we try to toCancel it so that we can just run the promise chain and not leave it dangling.
        function _metadataLoadedCB(arg1) {
            if (arg1) {
                //this is normal case this function is called by the "system" and arg1 is some
                //event object.
                //this is the function above. But we may not be able to get what we want
                //Esp for mobile, seems at the above juncture _vid.duration is still not set.
                setupMilestones();
                if(_boundMetadataLoadedCB)
                    _vid.removeEventListener('loadedmetadata', _boundMetadataLoadedCB);
                if(_boundVideoInitErrCB) 
                    _vid.removeEventListener('error', _boundVideoInitErrCB);
                _registerEventListener();   
                if (this.resolveFcn)   {     
                    this.resolveFcn(true);
                }
            }
            else {
                //if arg1 is null, means we call this ourselves with parameter of null.
                //console.log(`_metadataLoaded to cancel=true token=${this.token} (curr=${_currToken})`);
                if (this.rejectFcn) {
                    this.rejectFcn("shortcircuit");
                }
            }
        }
        const vErrDesc_ = {
            1: 'MEDIA_ERR_ABORTED',
            2: 'MEDIA_ERR_NETWORK',
            3: 'MEDIA_ERR_DECODE',
            4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
        };
        function _makeErrInfo(errObj) {
            let ret = {};
            if (errObj && errObj.source == 'handler') {
                ret.code = errObj.code;
                ret.codeType = 'native';
                ret.codeStr = vErrDesc_[errObj.code] ? vErrDesc_[errObj.code]: "";
                ret.details = errObj.details || "";
            }
            else if (errObj && errObj.code && errObj.data && errObj.category) { //infer that this is from shaka
                ret.code = errObj.code;
                ret.codeType = 'shaka';
                ret.codeStr = 'shaka code=' + errObj.code + ' category=' + errObj.category + ' severity=' + errObj.severity;
                ret.details = JSON.stringify(errObj);
                //(errObj.data? JSON.stringify(errObj.data): "");
            }
            else if (errObj && errObj.source == 'ima') {
                ret.code = errObj.code;
                ret.codeType = 'ima';
                ////ret.codeStr = vErrDesc_[errObj.code] ? vErrDesc_[errObj.code]: "";
                /////ret.details = errObj.details || "";
            }else {
                //probably an internal crash ...our own bug
                ret.code = -1;
                ret.codeType = 'none';
                ret.codeStr = '';
                try {
                    ret.details = JSON.stringify(errObj);
                }
                catch (ee) {
                    ret.details = "cannot stringify error";
                }
            }
            return ret;
        }
        /**
         * attached only at the init load phrase of a new video
         * So either the loaded meta data callback or this one.
         * @param {*} e 
         */
        function _videoInitErrCB(e) {
            if (e) {
                //just some notes, since not totally sure how this thing works.
                //seems: if pure native player, and we supply a non-existent url of m3u8 file
                //then it will come here
                //if we try to do it thru the shaka player, then the error is the shaka emitted one
                //not thru here.
                if(_boundMetadataLoadedCB)
                    _vid.removeEventListener('loadedmetadata', _boundMetadataLoadedCB);
                if(_boundCanPlayThroughCB)
                    _vid.removeEventListener('canplay', _boundCanPlayThroughCB);
                if(_boundVideoInitErrCB) {
                    _vid.removeEventListener('error', _boundVideoInitErrCB);
                }
               this.rejectFcn({
                   source: 'handler',
                   code: e.target.error.code,
                   details: e.target.error.message //dun have ah
                });
            }
            else {
                if (this.rejectFcn) {
                    this.rejectFcn("shortcircuit");
                }
            }
        }
        
        //prepare this object to play the next video
        function _reset() {
            //We do not set this to null here.
            //we actually set this very early in setV for some very early signal reporting
            //DO NOT DO _defaultReportInfoBlob = null;
            //actually if _pbMethod and _pbMethodReal are not the same
            //then should change 
            _state = initialState_; //'init'; //overall : content or ads
            _cntVState = 'init'; //state of the content video 
            _remainSecEvents = JSON.parse(JSON.stringify(remainSecEventsSeed_));
            if (_adScheduler) {
                _adScheduler.reset();
                _nextAdSlotTime = _adScheduler.getFirstNonPreroll();
            }
            if (_ctrls)
                _ctrls.reset();
            if (_stripMessageDiv)
                _stripMessageDiv.classList.add(styles.hide);
            if (_shakaPlayer && _boundShakaOnErrorCB) {
                _shakaPlayer.removeEventListener('error', _boundShakaOnErrorCB);
                _boundShakaOnErrorCB = null;
            }
            
            _milestones = null; // the percentile events milestone array not set yet
            //this only set when we have the duration of the video (on mobile, it seems
            //even upon metadata loaded event we also dun have that info yet.
            //this will be set to point to the _milestonesArr only when we are sure we have
            //good info in there


            if (_boundMetadataLoadedCB) {
                _boundMetadataLoadedCB(null); // special significance for the first parameter like this
                _vid.removeEventListener('loadedmetadata',_boundMetadataLoadedCB);
                _boundMetadataLoadedCB = null;
            }
            if (_boundCanPlayThroughCB) {
                _vid.removeEventListener('canplay',_boundCanPlayThroughCB);
                _boundCanPlayThroughCB = null;
            }
            if (_boundVideoInitErrCB) {
                _boundVideoInitErrCB(null); // special significance for the first parameter like this
                _vid.removeEventListener('error',_boundVideoInitErrCB);
                _boundVideoInitErrCB = null;
            }
            _unRegisterEventListener();
            if (_adObject) {
                _adObject.reset();
            }
            _contentDiv.classList.remove(styles.hide); //this is important. Coz if video is switched while ad is playing, 
            //then the content div at that time would be hidden!
            
            _accumulatedTime = 0;
            _thumbnailURL = null;

            _msLastInternalCallPause = 0;
            _msLastInternalCallPlay = 0;
            _manualPaused = false;
            _forcedResolution = -1;

            //we do not reset this, we keep what was there from the first video
        };
        function _updatePlayState(isPlaying) {
            if (isPlaying) _cntVState = 'playing';
            else _cntVState = 'paused';
        }
        /**
         * This is for the caller function (JXPlayer) to set a report function
         * The report function will be called for the major events: play, pause, adplay, adpause, ended
         * (need to consolidate the list and publisher)
         * 
         * So this PlayerWrapper does not directly communicate with the outside (publisher javascript)
         * It merely let the JXIntPlayer layer handle the stuff
         * @param {*} fcn 
         */
        FactoryPlayerWrapper.prototype.setReportCB = function(fcn) {
            _reportCB = fcn;
        }
        FactoryPlayerWrapper.prototype.setGestureReportCB = function(fcn) {
            _gestureReportCB = fcn;
        }
        FactoryPlayerWrapper.prototype.setPlayheadCB = function(fcn) {
            _playheadCB = fcn;
        }
        FactoryPlayerWrapper.prototype.isConfigSet = function() {
            //well if not, it is still not end of the wordl lah.
            //just use default.
            return _isConfigSet;
        }
        FactoryPlayerWrapper.prototype.setConfig = function(
            adsCfg, //the tags are also inside this obj: adtagurl and adtagurl2
            logoCfg, soundIndCfg = null, mute = true) {
            _isConfigSet = true;
            _cfg.ads = adsCfg;
            _adScheduler = MakeOneAdScheduler(_cfg.ads);
            _nextAdSlotTime = _adScheduler.getFirstNonPreroll();
            _controlsColor = "#FF1111"; //controlsColor;
            _cfg.logo = logoCfg ? JSON.parse(JSON.stringify(logoCfg)): null;
            _cfg.soundind = soundIndCfg ?  JSON.parse(JSON.stringify(soundIndCfg)): null;
            if (!mute) {
                _forceAutoplayWithSound = true;
            }
        }   
        var _hide = function() {
            _contentDiv.classList.add(styles.hide);
        };
        var _show = function() {
            _contentDiv.classList.remove(styles.hide);
        };
        var _showSpinner = function() {
            if (_spinner) _spinner.show();
        }
        var _hideSpinner = function() {
            if (_spinner) _spinner.hide();
        }
        //this is the function we expose to the ads object to "control us"
        //the content <video>
        var _makeFcnVectorForAd = function() {
            return {
                hideSpinner: function() {
                    _hideSpinner();
                },
                isPlaying: function() {
                    return (_cntVState == 'playing');
                },
                isPaused: function() {
                    return (_cntVState == 'paused');
                },
                isContentMuted: function() {
                    return _vid.muted;
                },
                
                setContentMuteState: function(mute) {
                    _vid.muted = mute? true: false;
                },
                report: function(evt, obj) {
                    //obj can be null. can carry some extra info specific to certain events
                    //e.g. slotduration for slotended
                    //e.g. errorcode for error
                    let b = _makeCurrInfoBlob();
                    if (b && obj && obj.slotduration) {
                        b.adslotduration = obj.slotduration;
                    }
                    let adErrBlob = null;
                    if (obj && obj.errorcode) {
                        adErrBlob = _makeErrInfo({ source: 'ima', code: obj.errorcode });
                    }
                    _reportCB('ad', evt, b, adErrBlob);
                },
                switch2Ad: function(toHide) {
                    _state = "ad";
                    _msLastInternalCallPause = Date.now();
                    _vid.pause();
                    if (toHide)
                        _hide();
                    _showSpinner();
                    if (_soundIndObj)
                        _soundIndObj.hideMaybe(); //if the sound indicator is there need to hide ah.
                    _ctrls.hideControls();
                },
                switch2Cnt: function() {
                    //_state = "content";
                    _show();
                    _msLastInternalCallPlay = Date.now();
                    /****
                     * We only use native controls
                     in any case this should be reviewed.
                     Setting state should only be triggered upon
                     onPLaying onPaused callbacks I feel...
                     _ctrls.setBtnPlayActive(true);
                    */
                    let playInnerProm = _vid.play();
                    if (playInnerProm !== undefined) {
                        playInnerProm
                        .then(function(){
                        })
                        .catch(function(e) {
                            //alert(e);
                        })
                    }
                    if (_soundIndObj)
                        _soundIndObj.showMaybe();
                    //then the state will be set to content in the onPlayingCB....
                    _ctrls.showControls();
                },
                onAdPlaying: function() {
                    _detectManualPlayOrPause('playing');
                },
                onAdPause: function() {
                    _detectManualPlayOrPause('pause');
                }
            };
        };
        //this is to play the VIDEO (i.e. assuming we are in video mode)
        function _playVideo() {
            //let todo = _isDeferPlayPauseCmd;//?????
            
            //_vid.play();
            //if (_ctrls) _ctrls.setBtnPlayActive(true);
            //https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
            _vid.play().then(function() {
                //Does nothing if (_ctrls) _ctrls.setBtnPlayActive(true);
            }).catch(function(ee) {
                //Does nothing if (_ctrls) _ctrls.setBtnPlayActive(false);
            }).finally(function(){
                //if (todo) _isDeferPlayPauseCmd = false;
            });
        }

        //this is to pause the VIDEO (i.e. assuming we are in video mode)
        function _pauseVideo() {
            _vid.pause();
            /* Does nothing 
            no need as we currently use the native controls
            in any case it should be reviewed:
            I feel we should only call the controls when we receive 
            onPause onPlaying callbacks ...
            if (_ctrls) _ctrls.setBtnPlayActive(false);
            */
        }
        /**
         * 
         * 
         */
        function _queuePlayPauseCmds(isPlay) {
            if (isPlay) {
                if (_todoPlayPauseCmd != 'play')
                    _todoPlayPauseCmd = 'play'; 
                //if _queuedPlayPauseOrder == play then nothing to do here
            }
            else { //want pause
                if (_todoPlayPauseCmd != 'pause')
                _todoPlayPauseCmd = 'pause'; 
            }
        }
        
        //I think this should be a bound function also
        function _flushPlayPauseCmds() {
            if (_todoPlayPauseCmd == 'play')
                _playInt();
            else if (_todoPlayPauseCmd == 'pause')
                _pauseInt();
            _todoPlayPauseCmd = null;
        }

        FactoryPlayerWrapper.prototype.play = function() {
            _playInt(true);
        }
        FactoryPlayerWrapper.prototype.playInt = function() {
            //called by e.g. intersection observer outisde this wrapper
            _playInt(false);
        }
        function _playInt(externalCall) {
            if (!externalCall && _manualPaused) {
                //console.log(`Debug Even though playInt is called but it seems we were manuallyPaused earlier so better not.`);
                
                //externalCall means this is triggered from intersectionOb etc by player SDK
                //This condition says: 
                //if this is an internally triggered play (probably due to visiblity) and our video
                //was paused by user earlier on (intentionally), then do not execute the play.

                //Coz if user intentionally paused the play; then - if - just by scrolling
                //the video in and out of view, we resume the play for him, it will be super annoying
                return;
            }

            //we get any form of a trigger, if need then use it.
            if (_accumulatedTime < 1 && _defaultReportInfoBlob) {
                //actually if play had already started then no need call this anymore bah.
                //if intentional is to start by API (i.e. viewability or explicit call of SDK's play)
                if (_startModePW == startModePWApi_ || externalCall) { //if current startmode is not click
                    _gestureReportCB(externalCall ? startModeSDKApi_: startModeSDKAutoplay_, 
                        _defaultReportInfoBlob);
                }
            }
            //if cfg.startMode == 'api', 
            //then we need a call of this play function here
            //can be from publisher calling the api. or our JXIntPlayer's
            //intersection observer.
            if (_startSignalledResolveFcns.length > 0) {
                _resolveStartSignalled();
                return;
            }

            if (_isDeferPlayPauseCmd && !externalCall) {
                //if we are in a state of having a big play button and waiting for user to touch/click start:
                //those stuff triggered by our own intersection observer
                //as the user moves the video unit up and down (out of sight and back)
                //we ignore. that's what it is doing here.

                //However, if the SDK caller (externalCall == true) calls play() on us, then just let it do
                //the play may not succeed (based on the browser setting etc)
                //
                _queuePlayPauseCmds(true);
                return;
            }
            //if (_state == 'init'&& !externalCall) {
              //  _queuePlayPauseCmds(true);
            //}
            //else
            _msLastInternalCallPlay = new Date().getTime();

            if (_state == 'content') {
                _playVideo();
            } else if (_state == 'ad') {
                if (_adObject) _adObject.playAd();
            }
        }
        FactoryPlayerWrapper.prototype.pause = function() {
            _pauseInt(true);
        }
        FactoryPlayerWrapper.prototype.pauseInt = function() {
            _pauseInt(false);
        }
        function _pauseInt(externalCall) {
            if (_isDeferPlayPauseCmd) {
                _queuePlayPauseCmds(false);
                return;
            }
            //if (_state == 'init') {
              //  _queuePlayPauseCmds(false);
            //}
            //else 
            _msLastInternalCallPause = new Date().getTime();
            if (_state == 'content') {
                _pauseVideo();
            } else if (_state == 'ad') {
                if (_adObject) _adObject.pauseAd();
            }
        }
        //Currently not used much coz we are using the default controls
        //of HTML5 <video>
        var _makeFcnVectorForUI = function() {
            let fcnVector = {
                showSpinner: function() {
                    _showSpinner();
                },
                hideSpinner: function() {
                    _hideSpinner();
                },
                reportClickToStart: function() {
                    _gestureReportCB(startModeSDKClick_, _defaultReportInfoBlob);
                },
                play: function() {
                    _playVideo();
                },
                pause: function() {
                    _pauseVideo();
                },
                mute: function() {
                    _vid.muted = true;
                },
                unMute: function() {
                    _vid.muted = false;
                },
                getDuration: function() {
                    return _vid.duration;
                },
                getCurrentTime: function() {
                    return _vid.currentTime;
                },
                setVideoPlayhead: function(time) {
                    _vid.currentTime = time;
                },
                isPaused: function() {
                    return _vid.paused;
                },
<<<<<<< HEAD
                isMuted: function() {
                    return _vid.muted;
                },
                setVolume: function(vol) {
                    _vid.volume = vol;
                },
                getVolume: function() {
                    return _vid.volume;
                },
                setPlaybackRate: function(speed) {
                    _vid.playbackRate = speed;
                },
                hideSoundInd: function() {
                    if (_soundIndObj && _cfg.soundind && _cfg.soundind.position.indexOf('bottom') > -1) _soundIndObj.hideMaybe();
                },
                showSoundInd: function() {
                    if (_soundIndObj && _cfg.soundind && _cfg.soundind.position.indexOf('bottom') > -1) _soundIndObj.showMaybe();
                },
                //https://animoto.com/blog/news/hd-video-creation-sharing
                setResolution: function(track) {
                    if (!_shakaPlayer) return; 
                    if (track.height === "auto") {
                        _forcedResolution = -1;
                        _shakaPlayer.configure({
                            abr: {
                                enabled: true
                            }
                        });
                    } else {
                        _shakaPlayer.configure({
                            abr: {
                                enabled: false
                            }
                        });
                        _shakaPlayer.selectVariantTrack(track, true);
                        _forcedResolution = track.height;
                    }
                },
                getResolution: function() {
                    // this stuff dun hardcode in the controls layer as it should be dumb in this
                    // aspect. 
                    return {
                        current: _forcedResolution, //the current mode. -1 means our auto method
                        // 
                        // I suggest the menu also should have an entry "auto". So initially it is auto 
                        // Coz we don't really know which one the shaka is using in our normal mode
                        // So initially you display "auto" in the options.
                        // This also means, if the user is tired of self-setting the resolution, he can
                        // flip it back to auto...
                        // NOTE: I also added _forcedResolution = -1 in the reset function for now.
                        tracks: _getAvailableResolutions() //clean up later . Of course also should not hardcode here ;)
                    };
                },
                setSubtitle: function(sub) {
                    if (_shakaPlayer) {
                        console.log('selected subtitle', sub)
                        if (sub.language === "off") _shakaPlayer.setTextTrackVisibility(false);
                        else {
                            _shakaPlayer.selectTextTrack(sub);
                            _shakaPlayer.setTextTrackVisibility(true);
                        }
                    }
                },
                getSubtitles: function() {
                    var tmp = []
                    if (_shakaPlayer) tmp = _shakaPlayer.getTextTracks();
                    return tmp;
                },
=======
>>>>>>> master
            };
            return fcnVector;
        };
        var _getAvailableResolutions = function() {
            var tracks = [];
            if (_shakaPlayer) {
                tracks = _shakaPlayer.getVariantTracks();
                if (tracks.length > 0) {
                    // Remove duplicate entries with the same height.  This can happen if
                    // we have multiple resolutions of audio.  Pick an arbitrary one.
                    tracks = tracks.filter((track, idx) => {
                        // Keep the first one with the same height.
                        const otherIdx = tracks.findIndex((t) => t.height == track.height);
                        return otherIdx == idx;
                    });
                }
            }
            return tracks;
        };
        var _createControlsMaybe = function() {
            if (!_ctrls) {
                _ctrls = MakeOnePlayerControlsObjD(_contentDiv, _makeFcnVectorForUI()); 
            }
            if (_ctrls.showNativeControl()) {
                _vid.controls = true;
            } else {
                _vid.controls = false;
            }
            _ctrls.hideControls();
        };
        var _createStripMessage = function(remaining) {
            const stripStyle = "#JXMessage{position: absolute;padding: 9px;bottom: 20px;padding-right: 32px;right: 0px;background: rgba(0, 0, 0, 0.74);z-index: 2;color: rgba(255, 255, 255, 0.8);border-radius: 4px;font-size: 13px;letter-spacing: 1px;}";
            common.acss(stripStyle);
            _stripMessageDiv = document.createElement('span');
            _stripMessageDiv.id = 'JXMessage';
            _stripMessageDiv.style.fontFamily = '"Open Sans",sans-serif';
            _stripMessageDiv.innerHTML = _stripMessage.replace(/%%SECONDS%%/, remaining);
            _contentDiv.appendChild(_stripMessageDiv);
        };
        
        //These are bound functions and the this.videoid will contain
        //the videoid of the videoid they are associated with
        //To avoid the events of one video getting mixed with the events
        //of the next when we are in switching situation
        function _onFullScreenChangeCB() {
            var state = document.fullscreenElement || document.mozFullScreenElement ||
                document.webkitFullscreenElement || document.msFullscreenElement;
            if (this.isIOS) {
                state = true;
            }
            if (state) {
                _reportCB('video', 'fullscreen', _makeCurrInfoBlob(this.videoid));
            }
            if (_ctrls) _ctrls.updateFullscreen();
        };
        
        function _onVolumeChangedCB() {
            _savedMuted = _vid.muted;
            _savedVolume = _vid.volume;

            if (_ctrls) {
                _ctrls.updateVolume(_vid.volume);
            }
            
            /* if (_vid.muted) {
                _savedMuted = true;
            } else {
                _savedVolume = _vid.volume;
            }
            */
            //you will need to update the controls right?
            _reportCB('toplayer', 'volumechange', _makeCurrInfoBlob(this.videoid));
        }
        function _onErrorCB(e) {
            let o = _makeErrInfo(e);
            //was internal. TODO
            _reportCB(o.code == -1 ? 'video': 'video', 'error', 
                _makeCurrInfoBlob(this.videoid), o);
        }
        function _onEndedCB() {
            //for the subsequent (next) video:
            _savedVolume = _vid.volume;
            _savedMuted = _vid.muted;
            _reportCB('video', 'ended', _makeCurrInfoBlob(this.videoid));
        }
        var _onPausedCB = function(param) {
            if (_ctrls) {
                _ctrls.updatePlayBtn();
            }

            if (param.type == 'pause') {

                _detectManualPlayOrPause('pause');
                
                if (_state == 'ad') {
                    //console.log("__debug_ no need report this pause which is due to IMA sdk telling us to pause the content");
                }
                else if (!(_vid.duration - _vid.currentTime == 0)) {
                    //console.log("__debug_ then this one is legit pause");
                    //RENEE REVIEW TODO
                    if (!_isDeferPlayPauseCmd)
                        _reportCB('toplayer', param.type, _makeCurrInfoBlob(this.videoid));
                }
            }
            //_ctrls.showBigPlayBtn();

            _updatePlayState(false);
        };
        
        function _shakaOnErrorCB(error) {
            //http://v1-6-2.shaka-player-demo.appspot.com/docs/tutorial-errors.html
            //this articles says we should listen to the shakar player and not the video element.
            //Oh dear then we need to suppress the _vid listening one... TODO!!!
            //TODO: not tested. Cannot make it come here.
            _reportCB('video', 'error', _makeCurrInfoBlob(this.videoid), _makeErrInfo(error && error.detail ? error.detail: {}));
        }
        //this is called when our play function () is called (origin: our intersectionobserver
        //trigger call of this wrapper object's play function 
        //or .. somehow maybe the intersectionObsever trigger is sluggish and the user somehow 
        //touched the video area and play is started: but we still need this coz
        //we may need to do the preroll ah.
        function _resolveStartSignalled() {
            try {
            for (var i = 0; i < _startSignalledResolveFcns.length; i++) {
                _startSignalledResolveFcns[i](startModePWApi_);
            }
            _startSignalledResolveFcns = [];
            _queuePlayPauseCmds(true);//coz due to e.g. intersection observer
            //during the bootstrapping phase might be there is a pause stashed
            //in the queued commands. So if finally due to moving player into view
            //we can play it, we cannot let the pause in the queue mess us up
            //when we do _flushPlayPauseCmds.
            }
            catch(erx) {
                console.log(erx.stack);
            }
            return; //we go the init path first
        }
        function _onPlayingCB(param) {
            _manualPaused = false;//well it already is playing. erase history.
            _detectManualPlayOrPause('playing');

            if (_ctrls) {
                _ctrls.initializeVideoInfo(_vid);
                _ctrls.updatePlayBtn();
            }

            if (_state == 'ad') {
                //then suppress any event sending.
                //console.log("__debug_ Then suppress playing event sending (just back from ad lah)"); 
                _state = 'content';
            }
            else {
                _reportCB('toplayer', param.type, _makeCurrInfoBlob(this.videoid));
            }
            //if we are waiting on a usere touch to start.
            //but then in theory the sdk user code can call play API on the player
            //That might succeed, leading to this callback being triggered.
            //In that case we want this call hideBigPlayBtn - for the Promise to
            //be resolved so that the ads-init promise chain and run on:
            _ctrls.videoVisualsHide();//this is needed. Do not remove 

            //Special eventlistener: volumechange we only hook up after play really started
            //if we do that earlier it is possible the player-triggered volume change
            //e.g. for click to play users, we start with sound - will also trigger onVolChange 
            //callback and hence generate a tracker event 
            if (!_boundVolumeChangedCB) {
                _boundVolumeChangedCB = _onVolumeChangedCB.bind({videoid: this.videoid});
                _vid.addEventListener('volumechange', _boundVolumeChangedCB, false);
            }

            //if (_state == 'init') {
              //  _state = 'content';
            //}
            
             //Not used coz we just use native controls 
            _ctrls.showControls();
            
            _updatePlayState(true);
  
            /* Not used coz we just use native controls
               in any case this seems rather inefficient why make 2 calls like that?!
            if(!_vid.muted) {
                _ctrls.setBtnMuteActive(false);
                _ctrls.updateMutedState(false);
            } else {
                _ctrls.setBtnMuteActive(true);
                _ctrls.updateMutedState(true);
            }
            */
            if (_startSignalledResolveFcns.length > 0) {
                _resolveStartSignalled();
                return; //we go the init path first
            }
        };
        
        function _detectManualPlayOrPause(action) {
            if (action == 'playing') {
                //after the ad it will also start ah.
                //console.log(`Debug___ Hmmm, it starts to play ${_accumulatedTime}`);
                //need to set the accumulated time criteria else the bootstrapping initial play
                //if you try to make it not muted, it will fail and then the whole thing will be paused!

                //NOTE: 20210707 comment: I am disabling this code now coz it is causing problems.
                //Scenario:
                //Buffering so play was paused and then later then is an onPlaying cb being triggered.
                //So since so far we do not track buffering, sdk only know that the onPLaying is not attributable
                //to our own visiblity mechanism (_msLastInternalCallPlay) so it infers that it is user
                //intention. So we here turn on the sound.
                //Now if it is actually a buffering and if the user had not interacted with the video
                //before, this play resumption will fail and the video will just stop

                /* COMMENTED OUT FOR NOW!!!
                if (_accumulatedTime > 1 && Date.now() - _msLastInternalCallPlay > msPlayAttributeThreshold_) { // get the difference between last saved timestamp and current timestamp
                    //console.log(`Debug___ Hmmm, it starts to play MUST BE USER INTENTIONAL (${Date.now() - _msLastInternalCallPlay})`);
                    //the last internal trigger to play was too long ago. cannot explain this
                    //play-start. This play start likely is due to user action:
                    try {
                        if (_state == 'ad') {
                            if (_adObject)
                                _adObject.unmuteAd();
                        }
                        else { 
                            if (_vid.muted) _vid.muted = false; // if the video is muted, then we need to make it play unmuted
                            //the sound indicator object (if present), will go away soon (logic in the playheadCB)
                            //then it is a clean disappearance 
                            
                        }
                    } catch (error) {
                        //console.log('_onPlayingCB exception', error)
                    }
                }*/
            }
            else {
                //console.log(`Debug___ Hmmm, it starts to PAUSE ${_accumulatedTime}`);
                /* disable for now
                coz this apparently can be triggered via buffering!!
                buffering is not manual pause!!

                if (Date.now() - _msLastInternalCallPause > msPauseAttributeThreshold_) { // get the difference between last saved timestamp and current timestamp
                    //the last internal trigger to pause was too long ago. cannot explain this pause
                    //This pause likely is due to user action:
                    //console.log(`Debug___ Hmmm, it starts to pause MUST BE USER INTENTIONAL (${Date.now() - _msLastInternalCallPause})`);
                    _manualPaused = true;
                }*/
            }
        }
       
        /**
         * Function to manage the countdown strip
         * Meant to be used as a bound function.
         */
      
        var  __adCountdownMgrFcn = function(accuTime) {
            //Note I changed to this coz even the countdown phase it should use
            //play time and not absolute time.
            //let's also not have too many timers flying around
            //oh coz fetch ad also taken time lah.
            let remaining = Math.floor(adCountdownSec_ + this.addTime  + this.adReqTime - accuTime );
            if(remaining <= 0) {
                _adCountdownMgrFcn = null; //self-removal so that the playhead update will not be calling it.
                _stripMessageDiv.classList.add(styles.hide);
                this.resolveFcn('');
            }
            else {
                _stripMessageDiv.innerHTML = _stripMessage.replace(/%%SECONDS%%/, remaining);
            }
        };
        const _evtName = [
            //0,
            '90pct',
            //1
            '75pct',
            //2,
            '50pct',
            //3,
            '25pct'
        ];
        
       //this function will be bound.
       //if it detected the container DIM has changed since the last time it was called
       //(remember in the "this" object), then it will return an object.
        function sizeManagerFcn(mustReturnObj = false) {
            if (mustReturnObj || (this.container.offsetWidth != this.lastwidth)) {
                this.lastwidth = this.container.offsetWidth;
                this.lastheight = this.container.offsetHeight;
                return {width: this.container.offsetWidth, height: this.container.offsetHeight};
            }
            return null;

        }

        function _doPlayedPctEvent(playhead) {
            if (!_milestones) {
                setupMilestones();
                if (!_milestones) 
                    return;
            }
            let idx = _milestones.findIndex((e) => e <= playhead);
            if (idx != -1) {
                _milestones[idx] = 99999;
                _milestones.forEach(function(element, i) { 
                    if (i >= idx) _milestones[i] = 999999;
                });
                _reportCB('video', _evtName[idx], _makeCurrInfoBlob());
            }
        }

        //TODO:
        //actually - only the first bit we need report so accurate bah.
        //after a while we can do less frequently..
        //after the 15th second. not so strict; then no need to do so much in this handler function.

        //if it starts playing

        function _onPlayheadUpdateCB() {
            _manualPaused = false;
            let currentTime = _vid.currentTime;
            //<--- Do the video events (25%, 75% etc.)
            _doPlayedPctEvent(currentTime);

            if (_ctrls) {
                _ctrls.updateTimeElapsed(currentTime);
            }

            if (!this.soundind) {
                //dun want any sound:
                //either it already made its appearance (and then went away after its 10 sec)
                //or no such configuration for sound indicator.
            }
            else if (this.soundind == 'before' && _accumulatedTime >= 0 && _vid.muted) {
                this.soundind = 'during';
                _createSoundIndMaybe();
                _soundIndObj.start(function() {
                    //well it also depends on the ad?
                    //if the ad starts then also need to hide bah.
                    _vid.muted = false;

                    // if the video paused, and users click on the sound indicator, then we should restart playing the video
                    //Aiyo this will never happen ah!! this is playheadupdateCB 
                    if (_vid.paused) {
                        _playVideo();
                    }
                });
            }
            else if (this.soundind == 'during' && _soundIndObj) {

                if (!_vid.muted || _accumulatedTime > _soundIndObj.getDuration()) {
                    //there is the _vid.muted check coz it is possible the _vid.muted is set to false
                    //but the sound indicator was not disposed off cleanly.
                    //if the ad came out while we are showing this thing, the _soundIndObj.hide
                    //would be called already (switch2ad). but then after the ad we will be here to set
                    //the soundind to be null; (no harm calling the hide() twice)
                    this.soundind = null;
                    _soundIndObj.stop();
                }
                else {
                    _soundIndObj.setRemainingTime(_vid.duration - currentTime);
                }
            }
            
            // FOR DEBUGGING ONLY
            // if (_shakaPlayer) console.log('Adaptation: ' + _shakaPlayer.getStats().width + "x" + _shakaPlayer.getStats().height);

            this.spacer10++; 
            if (this.spacer10 == 10 && _shakaPlayer && _forcedResolution == -1) {
                try {
                    let newDim = _boundSizeManagerFcn();
                    //the dim of the video area has changed since we last checked:
                    if (newDim) {
                        let maxH = jxvhelper.getClosestDamHLSHeight(newDim.width, newDim.height);
                        if (maxH > 0) {
                            _shakaPlayer.configure({
                                abr: {
                                    restrictions: {
                                        maxHeight: maxH
                                    }
                                }
                            });
                        }
                    }
                }
                catch(ee){}
                this.spacer10 = 0;
            }

            if(currentTime > 0) {
                /* We dun need this any more if we dun do our own progress bar.
                requestAnimationFrame(() => {
                    let width = (_vid.currentTime / _vid.duration) * 100;
                    _ctrls.setTramsitionProgressBar();
                    _ctrls.updateProgressBar(width);
                }); */
                _ctrls.updateProgressBar(_vid.currentTime);
                let diff = currentTime- this.lastPlayhead;
                if (diff < 0) diff = 0 - diff;
                if(diff <= 2) {
                    _accumulatedTime += diff;
                }

                //if we allow for midrolls, then everybody has delayed ads then.
                if(_nextAdSlotTime != -1 && _accumulatedTime >= _nextAdSlotTime) {
                    if (_adScheduler.canPlayAd(currentTime, _vid.duration)) {
                        _adScheduler.useSlot(_accumulatedTime);
                        _nextAdSlotTime = _adScheduler.getNext(_accumulatedTime);
                        _fetchMidrollWithCountdownP(_accumulatedTime, 
                            _adScheduler.getAdIdx()== 0? _cfg.ads.adtagurl : _cfg.ads.adtagurl2); //this will kick off a promise chain.
                    }
                    else {
                        //not enough remaining time to justify an ad. So we are done
                        _nextAdSlotTime = -1; //we are done with ad playing (midrolls also)
                    }
                }

                if (_changeShakaBuffering && _accumulatedTime > 15) {
                    let tmp = _changeShakaBuffering;
                    _changeShakaBuffering = null;
                    tmp(_shakaPlayer);
                }
                  

                /** Get the diff between playheads then check whether it make senses to take it as an accumulated time
                 * the timeupdate handler didn't take longer than 250ms or 0.25 to run. refer to https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/timeupdate_event
                 * if the diff is longer than 500ms for example, so we can assume that users has seeked the video to certain playhead
                 * and we didn't set the diff as an accumulated time, coz users didn't really watch the video
                 */
                if(_adCountdownMgrFcn) {
                    //this is the one that shows the countdown stuff.
                    //_doDelayedAdP, if can secure an ad will set this up _delayedAdMgrFcn is a bound function
                    //the countdown thing:
                    _adCountdownMgrFcn(_accumulatedTime);
                }
                //2 seconds.
                if (_remainSecEvents.length) {
                    if (_accumulatedTime > _remainSecEvents[_remainSecEvents.length-1]) {
                        let s = _remainSecEvents.pop();
                        _reportCB('video', s+'s', _makeCurrInfoBlob(this.videoid));
                    }
                }
                if (_accumulatedTime - this.lastReportAccTime > 10) {
                    this.lastReportAccTime = _accumulatedTime;
                    _playheadCB(currentTime);
                }
                this.lastPlayhead = currentTime;
            }
        };

     

        function _unRegisterEventListener() {
            if (_boundOnErrorCB) _vid.removeEventListener('ended', _boundOnErrorCB);
            _boundOnErrorCB = null;
            if (_boundOnEndedCB) _vid.removeEventListener('ended', _boundOnEndedCB);
            _boundOnEndedCB = null;
            if (_boundOnPlayheadUpdateCB) _vid.removeEventListener('timeupdate', _boundOnPlayheadUpdateCB);
            _boundOnPlayheadUpdateCB = null;
            if (_boundOnPlayingCB) _vid.removeEventListener('playing', _boundOnPlayingCB);
            _boundOnPlayingCB = null;
            // if (_boundOnClickCB) _vid.removeEventListener('click', _boundOnClickCB);
            // _boundOnClickCB = null;
            if (_boundOnPausedCB) _vid.removeEventListener('pause', _boundOnPausedCB);
            //NEED MAH if (_boundOnPausedCB) _vid.removeEventListener('waiting', _boundOnPausedCB);
            _boundOnPausedCB = null;
            if (_boundOnFullScreenCB) {
                if (!common.isIOS()) {
                    ["webkit", "moz", "ms"].forEach(function(prefix) {
                        _container.removeEventListener(prefix+"fullscreenchange", _boundOnFullScreenCB, false);
                    });
                } else {
                    _vid.removeEventListener("webkitbeginfullscreen", _boundOnFullScreenCB, false);
                }
            }
            _boundOnFullScreenCB = null;
            if (_boundVolumeChangedCB) _vid.removeEventListener('volumechange', _boundVolumeChangedCB);
            _boundVolumeChangedCB = null;
        }
        
        function _registerEventListener() {
            /////_unRegisterEventListener();
            let saved = _videoID;
            _boundOnPlayingCB = _onPlayingCB.bind({videoid: saved});
            // _boundOnClickCB = _onVideoClickCB.bind({videoid: saved});
            _boundOnPausedCB = _onPausedCB.bind({videoid: saved});
            _boundOnPlayheadUpdateCB = _onPlayheadUpdateCB.bind({
                soundind: _cfg.soundind? 'before': null,
                videoid: saved, spacer10: 0, lastReportAccTime: 0});
            _boundOnEndedCB = _onEndedCB.bind({videoid: saved});
            _boundOnErrorCB = _onErrorCB.bind({videoid: saved});
            _boundOnFullScreenCB = _onFullScreenChangeCB.bind({videoid: saved});

            //_onVolumeChangedCB is now done only after the play has started.
            //to avoid any setting of volume by the SDK triggering any volume tracker event

            // if (common.isMobile()) _vid.addEventListener('touchstart', _boundOnClickCB, false);
            _vid.addEventListener('playing', _boundOnPlayingCB, false);
            _vid.addEventListener('pause', _boundOnPausedCB, false);
            //NEED MAH ? _vid.addEventListener('waiting', _boundOnPausedCB, false);
            _vid.addEventListener('timeupdate', _boundOnPlayheadUpdateCB, false);
            _vid.addEventListener('ended', _boundOnEndedCB, false);
            _vid.addEventListener('error', _boundOnErrorCB, false);
            if (!common.isIOS()) {
                ["webkit", "moz", "ms"].forEach(function(prefix) {
                    _container.addEventListener(prefix+"fullscreenchange", _boundOnFullScreenCB, false);
                }); 
            } else {
                _boundOnFullScreenCB = _onFullScreenChangeCB.bind({isIOS: true});
                _vid.addEventListener("webkitbeginfullscreen", _boundOnFullScreenCB, false);
            }

        };
        // function _onVideoClickCB() {
        //     if (_vid.paused) {
        //         _playVideo();
        //     } else {
        //         _pauseVideo();
        //     }
        // }
        var _createSoundIndMaybe = function() {
            //a configuration exists
            if (!_soundIndObj) {
                _soundIndObj = MakeOneSoundIndicator(_container, _cfg.soundind);
            }
        }
        var _createLogoMaybe = function() {
            let logoObj = _cfg.logo;
            if (logoObj && logoObj.url && !_logoDiv) {
                _logoDiv = document.createElement("div");
                _logoDiv.className = styles.icon + ' ' + (logoObj.position? logoObj.position:'');

                if(logoObj.link) {
                    common.addListener(_logoDiv, 'click', function() {
                        window.open(logoObj.link, '_blank');
                    })
                }
                _logoDiv.style.backgroundImage = 'url(' + logoObj.url + ')';
                _contentDiv.appendChild(_logoDiv);
            }
        };
        var _createInfoIcon = function() {
            if (!_infoDiv) {
                _infoDiv = common.newDiv(_contentDiv, "div", "<span>i</span>", styles.info);
                common.addListener(_infoDiv, 'click', function() {
                    window.open("https://www.jixie.io/", "_blank");
                })
            }
        };
        var _createAdObjMaybe = function(makeNew) {
            if (!_adObject) {
                _adObject = MakeOneAdObj(_container, _vid, _makeFcnVectorForAd());
                _adObject.setVpaidSecure(false);
            }
            return _adObject;
        };
  
        function _newAShakaPlayer(video, sizeMgrFcn) {
            shakaPlayer = new shaka.Player(video);
            let newDim = sizeMgrFcn(true);//true means force return an object whether there was a change or not
            let maxHeight2Req = jxvhelper.getClosestDamHLSHeight(newDim.width, newDim.height);
            let o = {
                streaming: {
                    useNativeHlsOnSafari: false,
                    bufferingGoal: 5
                },
                abr: {
                    switchInterval: 5
                }
            };
            if (maxHeight2Req > 0) {
                o.abr.defaultBandwidthEstimate = 200000;
                o.abr.restrictions = {
                    maxHeight: maxHeight2Req
                }
            }
            shakaPlayer.configure(o);
            return shakaPlayer;       
        }                  
        /**
         * One-off init of this playerwrapper object.
         * Note: when switching video src no need call this again.
         * it will try to figure out what type of playback to use
         * nativeHLS, shaka-HLS or fallbackTech_ backup
         * It will load the necessary files e.g. shaka player scripts (if not already loaded) 
         * before resolving.
         * 
         * resolve value is 'native', 'shaka', fallbackTech_
         * So the mode to attempt _pbMethod will be remembered
         * across to the next video.
         * @returns a promise
         */
        function _oneOffInitP() {
            return new Promise(function(resolve, reject) {
                let loadPlayerProm;
                if (_vid.canPlayType('application/vnd.apple.mpegURL') != "" && _jxPlaybackOverride != 'shaka') {
                    //if this browser can do native but we force to shaka, then we will do shaka loh!
                    loadPlayerProm = Promise.resolve('native');
                }
                else {
                    loadPlayerProm = jxvhelper.loadShakaScriptP('shaka','mp4');
                }
                loadPlayerProm.then(function(method) { //TMP HACK was async
                    if(method == 'native') {
                        //nothing much to do
                        resVal = 'native';
                    } else if(method == 'shaka') {
                        _shakaPlayer = _newAShakaPlayer(_vid, _boundSizeManagerFcn);
                        resVal = 'shaka';
                    } else {
                        resVal = fallbackTech_;
                    }
                    _pbMethod = resVal;
                    _oneOffInitDone = true;   
                    resolve(resVal);
                }); //the THEN to the loadShaka
            }); //promise
        }

        /**
         * These few functions all return promises and are used in the start phase of a new
         * content video
         * Wire up handlers (this consider resolved if metaloaded or we know or error)
         * For the shaka player case another condition for resolution of promise is the shaka 
         * scripts all loaded
         * @param {*} playbackMethod 
         * @returns a promise
         */
        function _initChainSetupNewVP(playbackMethod, srcHLS, srcFallback, offset, subTitles) {
            if (this.token != _currToken) {
                //console.log(`_S_S_S_S_S_S _setupNewVP mismatch token ${this.token} ${_currToken}`);
                return Promise.reject("shortcircuit");
            }
            let token = this.token;
            ///console.log(`_S_S_S_S_S_S _setupNewVP GOOD token ${this.token} ${_currToken}`);
            //we wire up this funciton. once it is executed, this _changeShaka.. will be null
            _changeShakaBuffering = __changeShakaBuffering;
            let overridePlaybackMethod = (srcHLS ? playbackMethod: fallbackTech_);
  
            let p1 = new Promise(function(resolve, reject) {
                //see which one comes first loh. error or metadata loaded.
                //_MTDResolveFcnsMap[token] = resolve;
                _boundMetadataLoadedCB = _metadataLoadedCB.bind({
                    token: token,
                    resolveFcn: resolve,
                    rejectFcn: reject
                });
                _vid.addEventListener('loadedmetadata', _boundMetadataLoadedCB);
                if (_jxPreloadOverride == 'none') {
                    //we know the loadedmetadata will likely not fire.
                    setTimeout(function() {
                        _boundMetadataLoadedCB();
                    }, 1000);
                }
                if (offset > 0) { 
                    //we are only bothered if offset > 0
                    _boundCanPlayThroughCB = _canPlayThroughCB.bind({
                        offset: offset
                    });
                    _vid.addEventListener('canplay', _boundCanPlayThroughCB);
                }

                //for video normal error we use another handler.
                _boundVideoInitErrCB = _videoInitErrCB.bind({rejectFcn: reject});
                _vid.addEventListener('error', _boundVideoInitErrCB);
            });

            switch (overridePlaybackMethod)  {
                case "native":
                    _pbMethodReal = 'native';
                    _vid.src = srcHLS;
                    return p1;
                    break;
                case fallbackTech_:
                    _pbMethodReal = fallbackTech_;
                    _vid.src = srcFallback;
                    _vid.load();
                    return p1;
                    break;
                case "shaka":
                    if (!_shakaPlayer) {
                        _shakaPlayer = _newAShakaPlayer(_vid, _boundSizeManagerFcn);
                            //try only:
                            //https://shaka-player-demo.appspot.com/docs/api/shaka.extern.html#.AbrConfiguration
                            //https://shaka-player-demo.appspot.com/docs/api/shaka.extern.html#.PlayerConfiguration
                            //https://github.com/google/shaka-player/issues/556
                            /* No need for this anymore. It is done via giving some maxwidth and
                            height guidelines to the stream API to get the "right" "playlist" */
                    }
                    _pbMethodReal = 'shaka';
                    // DO listen for errors from the Player.
                    _boundShakaOnErrorCB = _shakaOnErrorCB.bind({videoid: _videoID});
                    _shakaPlayer.addEventListener('error', _boundShakaOnErrorCB);
                    return Promise.all([
                        p1, 
                        _shakaPlayer.load(srcHLS, offset).then(() => {
                            if (_shakaPlayer) {
                                if (subTitles.length > 0) subTitles.forEach((x) => _shakaPlayer.addTextTrackAsync(x.url, x.language, 'subtitle', x.mime, '', x.label));
                                _shakaPlayer.setTextTrackVisibility(false);
                            }
                        })
                    ]);
                    break;
            }//switch
        }
        /**
         * Short function returning a promise used in the starting phase of a new content video
         * @param {*} tryStartMode api, click. If click, then we do nothing just resolve promise
         * It is a bit unnecessary but better to keep a linear (non nested) promise chain lah
         * @param {*} pauseForAd : if true, then if video managed to be started, we pause it.
         * @returns a promise
         */
        function _initChainAutoStartVP(tryStartMode, pauseForAd) {
            if (tryStartMode == startModePWClick_) {
                return Promise.resolve(startModePWClick_);
            }
            return new Promise(function(resolve) {
                // the _vid is actually following the whatever setting.
                // whatever it was _vid.muted = false;
                console.log(`attempt start play with video.muted=${_vid.muted}`);
                let playInnerProm = _vid.play();
                if (playInnerProm !== undefined) {
                    playInnerProm
                    .then(function(){
                        console.log(`attempt start play succeeded with video.muted=${_vid.muted}`);
                        if (pauseForAd) {
                            _vid.pause();
                        }
                        resolve('apistarted'); //already started 
                        return;
                    })
                    .catch(function(e) {
                        console.log(`attempt start play failed with video.muted=${_vid.muted} (${e})`);
                        if (_vid.muted) {
                            // if just now that attempt was WITH sound, then now we can try 
                            // without sound.
                            // if already just now was without sound, then now we just stick
                            // up the big play button.
                            resolve(startModePWClick_);
                            return;
                        }
                        // second attempt: sound off:
                        _vid.muted = true;
                        let playProm2 = _vid.play();
                        if (playProm2 !== undefined) {
                            playProm2.then(function() {
                                console.log(`attempt start play succeeded with video.muted=${_vid.muted}`);
                                if (pauseForAd) {
                                    _vid.pause();
                                }
                                resolve('apistarted'); //already started 
                                return;
                            }).catch(function(ee) {
                                console.log(`attempt start play failed with video.muted=${_vid.muted} ${ee}`);
                                resolve(startModePWClick_);
                                return;
                            });
                        }
                        else {
                            resolve(startModePWClick_);
                            return;
                        }
                    })
                }
                else {
                    resolve(startModePWClick_);
                }    
            }); //promise
            return;
        }

       

        /**
         * Short function returning a promise used in the starting phase of a new content video
         * @param {*} startMode api, click. If click, then we do show the big play button
         * and resolution comes when user touches the button.
         * If startMode non click, then resolve right away
         * @returns a promise
         */
        function _initChainClickStartVP(tryStartMode) {
            if (tryStartMode != startModePWClick_) return Promise.resolve(tryStartMode);

            //click to play we start with volume
            _vid.muted = false; 
            _vid.volume = defaultVolume_;
            //Here at this stage we did not hook up the volumchanged callback yet. This is on purpose
            //Else this player-triggered volume change will cause a tracker event (as if a user-triggered one)
            //So here we manually set these 2:
            _savedMuted = false;
            _savedVolume = defaultVolume_;


            return new Promise(function(resolve) {
                //if this thing is showing a big play button
                //then just kan ta killed . i.e. switch to a new video
                //then the promise chain how?
                //then it will never resolve loh then just a dangling thing.
                //it will need to call a resolve ah.
                // to continue the promise chain ah.
                _ctrls.showBigPlayBtn(resolve.bind(null, startModePWClick_), _thumbnailURL); 
            });
        }

        /**
         * function to manage the pure preroll with timeout.
         * @param {*} adPromise. The attempt to fetch ads should have started earlier.
         * This one is a bit complicated due to the adsManager. Read the notes below.
         * @returns a promise
         */
         /**
           * the ad fetch has already been underway, to save time
           * This looks complication and deserves a detailed explanation here.
           *   If ad mode is "prefetch",
           *   then the fetching of ads would have gone out while the status of the video
           *   play is unclear (whether "autoplay" <-- meaning starting the thing with our calling the video
           *   play api : is possible or not)
           *   That's why when we do the ad call, for ads manager loaded callback, we do not set it to
           *   call adsManager.start() immediately
           *   (Coz at that time of adfetching we dunno if autoplay (play by play() api) is possible or not)
           * 
           * Anyway, all these just to say that in the adcall (makeAdRequestP) gone out earlier,
           * the autoAdsManagerStart flag is false. I.e. even if ad found, IMA SDK will not try
           * to play the ad immediately
           * 
           * More comments in the jxpending and jxhasad cases:
           */
        function _initChainDoAdsP(getAdMode, adProm) {
            if (getAdMode == 'noprefetch') {
                adProm = _adObject.makeAdRequestP(_cfg.ads.adtagurl, 
                    _startModePW == startModePWClick_ ? false: true,
                    _savedMuted);
            }
            if (!adProm) {
                return Promise.resolve("jxnoadbreak");
            }
            let ps = [];
            switch (_adObject.getAdsLoaderOutcome()) {
                case "jxnoad":
                    return Promise.resolve("jxnoad");
                    break;
                case "jxpending":
                    //Ads loader not done with its job yet.
                    //Means adsManagerLoaded not yet called and there is also no
                    //sign of 'no ad found'. So still waiting for that.
                    //
                    //However, since at this stage we already know play can proceed,
                    //then we set the flag so that if and when adsManagerLoaded happens,
                    //then the onAdsMgrLoaded can just call the adsManager.start();

                    //Here the promise will only be resolved when either ad STARTED PLAYING or
                    //the ad errorer out!!!!
                    _adObject.setAutoAdsManagerStart(true);
                    ps.push(adProm);
                    break;
                case "jxhasad":
                    //(that adfetch was done with autoAdsManagerStart false)
                    //So now we need to explicitly call startAd:
                    //We use a new promise keep track of the ad's startedness or error-ed-out-ness.
                    ps.push(new Promise(function(resolve, reject) {
                        _adObject.startAd(resolve);
                    }));
                    break;
            }
            // This is for ads.
            _showSpinner();

            //Cannot pause the start of video forever ah.
            //so we must have a timeout. If the ad does not start within that time
            //then we just have to start the video loh.
            //As and when the ad is ready, then it will be played
            ps.push(new Promise(function(resolve) {
                setTimeout(function() {
                    resolve("timeout");
                }, _cfg.ads.prerolltimeout); 
            }));
            return Promise.race(ps);
        }

        /**
         * Ok the ad promise resolved. Based on the resolution we do what is needed
         * @param {*} res 
         */
        function _initChainRespond2AdOutcome(res) {
            //possible values for res:
                //-timeout (either the ads loader dunno yet, or the adsManager is loaded, but actual ad not started 
                    //to play
                //-jxadstarted
                //-jxaderror
                //-jxnoad
                //-jxnoadbreak : we are not even trying to do pure preroll
                    //so no need to play the video coz we had not stopped anything.
            _hideSpinner();
            if (res == 'jxnonlinearadstarted' || res == 'timeout' || res == 'jxaderrored' || res == 'jxnoad' || res == 'jxnoadbreak') {
                //THUMBNAIL_FERY : dun bother about this one first. For ads stuff _spinner.hide();
                //_hideSpinner();
                _ctrls.videoVisualsHide(); 
                _playVideo();
            }
            //the other type I believe (need to check) the state is already content?
            //fire those queue stuff.
        }


        FactoryPlayerWrapper.prototype.earlyBirdP = function() {       
            _genInitP = _oneOffInitP();
        }

        /**
         * Used in bound function way in the initialization promise chain
         * So that when one promise resolves, if the token associated with it
         * is not that of the current token, then we dun care and we typically then throw
         * a rejection to end the whole chain.
         * This will happen if , while the init promise-chain of one is still "running"
         * E.g. waiting for metadata to load etc etc, then the user go and click on
         * another thumbnail to start another video dada
         * @returns 
         */
        function _initChainContextCheck() {
            if (!this.token || this.token != _currToken) {
                return false;
            }
            return true;
        }

        /**
         * 
         * One of our most important interface functions. Called by JXPlayer
         * Switching to a new content video and handling the click / auto play wishes
         * of the user of the player sdk
         * and also handle pure preroll, if any (coz need to hold off the content for a certain
         * prescribed time out; so that no annoying "content leak") ...
         * @param {*} startMode 
         *  explanation of the possible values:
         *   api (wait for the playerwrapper to be called either by our own internsection ob
         *          or indirectly by the widget calling our exposed play() API 
         *   auto (Means we should just try to use video.play() to start it)
         *   click (means let the fella touch to play or whatever)
         * @param {*} srcHLS <--- if this is not provided, meaning we just want do fallbackTech_
         *                   <--- this would be a retry after an error then 
         * @param {*} srcFallback
         * @param {*} title 
         * @param {*} offset 
         */
        FactoryPlayerWrapper.prototype.setV = function(
            delayPutSrcWaitProm, //
            videoID,
            startModePW,
            srcHLS, srcFallback, offset, thumbnailURL, videoTitle, subTitles) {

            let token = videoID +"-" + Date.now();                
            
            _currToken = token;
            _startModePW = startModePW; 

            _createControlsMaybe();
            _createLogoMaybe();
            _createInfoIcon();
            _ctrls.videoVisualsInit(thumbnailURL, function() {
                _reportCB('video', 'ready', _makeCurrInfoBlobEarly(videoID));
            });
            
            _isDeferPlayPauseCmd = true;
            //if an ad is currently playing, we need to shutdown that stuff first

            //<-- MUST DO THIS EARLY. So we can catch any call to play()
            //that could happen as soon as setV returns.

            //starting at this juncture 
            let startSignalledProm; //local variable
            
            _defaultReportInfoBlob = _makeCurrInfoBlobEarly(videoID);
            switch (startModePW) {
                case startModePWApi_:         
                    startSignalledProm = new Promise(function(resolve, reject) {
                        _startSignalledResolveFcns.push(resolve);
                    });
                  break;
                case startModePWAuto_:                    
                    //normally rolling from one video to the next...
                    //so the gesture is here.
                    _gestureReportCB(startModeSDKAuto_, _defaultReportInfoBlob);
                    break;
                case startModePWClick_:                    
                    startSignalledProm = Promise.resolve(startModePWClick_);
                  break;
            }//switch startMode
            
            //-->
            //<--- PURE PREROLL (if any) preparation
            let getAdMode = 'none'; //none, prefetch, noprefetch
            let adPromise = null; //important to init this to null
            let genInitP = null;//general Initialization. Only done once
            //subsequent videos no need do again.
            //Is a promise: returns "native", "shaka", fallbackTech_
            if (!_oneOffInitDone && _genInitP == null) {
                //there was not attempt to do earlyBird - though not quite finished 
                //(early bird means there is no video mentioned yet
                //but we preemptively set up the container and video area )
                genInitP = _oneOffInitP();
            }   
            else if (!_oneOffInitDone && _genInitP) {
                //we have done some early bird stuff already so we just use that promise created earlier.
                genInitP = _genInitP;
            }
            else { 
                //if oneOffInitDone is true, the _pbMethod has been set already.
                //this would be a second video .... oneOffInitDone is true already.
                //this Player Wrapper object is being reused to play a next video
                //general init already carried out.
                //now is reset only
                _reset();
                genInitP = Promise.resolve(_pbMethod);//gen init considered done. Hence resolve
            } 
            _videoID = videoID;
            _thumbnailURL = thumbnailURL;
            if(_cfg.ads.delay == 0) {
                //pure preroll.
                _createAdObjMaybe();
                getAdMode = 'noprefetch'; //if boss or whoever want then we no prefetch.
                //can cause more "wasted ads" not sure if the adnetworks like it.
            }
            else {
                getAdMode = 'none';
            }
            //basically we need to know the state ah.
            let pauseForAd = getAdMode != 'none';
            
            //-------OUR INIT PHASE PROMISE CHAIN -----------------------
            //Note: if there is a failure while doing the shaka way and then
            //we downgrade to fallbackTech_ playing natively, we need to detach the video
            //element from the shaka player. Otherwise, e.g. the ended event of
            //the fallbackTech_ will not come thru properly. However, this detach is a promise
            //you must wait until the promise has resolved before using the video element
            //(putting an fallbackTech_ to play in it, say). Else everything goes dead.
            let shakaDetachProm = null;
            if (!srcHLS) {
                if (_shakaPlayer) {
                    shakaDetachProm = _shakaPlayer.detach();
                    _shakaPlayer = null;
                }
            }
            if (!shakaDetachProm) shakaDetachProm = Promise.resolve();

            // While one promise chain has not "gone thru", there could be video
            // change and all that stuff. So all these to avoid a "dangling" chain
            // still doing stuff.
            // we use a TOKEN to see if a handler (one of these bound functions) is "still relevant"
            // compare to the private variable _currToken                
            let boundChainContextCheck  = _initChainContextCheck.bind({token: token});
            let boundSetupNewVP         = _initChainSetupNewVP.bind({token: token});
            
            if (_ctrls) _ctrls.setVideoTitle(videoTitle);

            shakaDetachProm
            .then(function() { 
                //we are waiting here.
                //we only put the source when we are a few pages near to the viewport
                if (delayPutSrcWaitProm)
                    return delayPutSrcWaitProm;
                else
                    return Promise.resolve();        
            }).then(function(){
                //the player must be ready first e.g. all the shaka scripts loaded and run
                return genInitP; 
            }).then(function(playbackMethod){
                //video readiness
                //this will set video.src = <THE STREAM URL>
                return boundSetupNewVP(playbackMethod, srcHLS, srcFallback, offset, subTitles);
            }).then(function() {
                    //Video is ready (metadataloaded) to be played so remove the loading spinner
                    if (!boundChainContextCheck()) {
                        throw new Error("shortcircuit");
                    }
                    //in case there is no thumbnail we also can have the ready ah!!!
                    //or something screwed up.
                    _reportCB('video', 'ready', _makeCurrInfoBlobEarly(videoID));
                    _ctrls.videoVisualsRemoveSpinner();
                    if(getAdMode == 'prefetch') {
                        adPromise = _adObject.makeAdRequestP(_cfg.ads.adtagurl, 
                            _startModePW == startModePWClick_? false: true, //autoplay Flag (best effort lah)
                            _savedMuted); //muted flag (best effort lah)
                    }
                    //Ads stuff--->
                    if (_savedVolume == -1) {
                        _vid.muted = _savedMuted;     
                        _savedVolume = _vid.volume;
                    }
                    if (_forceAutoplayWithSound && _startModePW != startModePWClick_) {
                        // coz only applies to first video.
                        _vid.muted = false;
                        _vid.volume = 0.5;
                    }
                    _forceAutoplayWithSound = false;
                    //start vis setup. wait for the signal from intersection observation etc
                    return startSignalledProm; //not the global var one ah. THIS one
            })
            .then(function(tryStartMode) {
                return (boundChainContextCheck() ? 
                    _initChainAutoStartVP(tryStartMode, pauseForAd):
                    Promise.reject("shortcircuit"));
            })
            .then(function(tryStartMode) {
                return (boundChainContextCheck() ? 
                    _initChainClickStartVP(tryStartMode):
                    Promise.reject("shortcircuit"));
                //if tryStartMode == 'click' this thing will pop up the GUI 
                //(big play button) for the fella to click
            })
            .then(function() {
                return (boundChainContextCheck() ? 
                    _initChainDoAdsP(getAdMode, adPromise):
                    Promise.reject("shortcircuit"));
            })
            .then(function(adOutcome) {
                return (boundChainContextCheck() ? 
                    _initChainRespond2AdOutcome(adOutcome):
                    Promise.reject("shortcircuit"));
            })
            .catch(function(error){
                if (boundChainContextCheck()) {
                    if (error && typeof error === 'string' && error == 'shortcircuit') {}
                    else {
                        let o = _makeErrInfo(error);
                        _reportCB((o.code == -1 ? 'internal': 'video'), 'error', 
                            _makeCurrInfoBlob(_videoID), o);
                    }
                }
            })
            .finally(function(){
                if (boundChainContextCheck()) {
                    //console.log(`##### S_S_S_S_S_S_S                 FINALLY >>>>>`)
                    _isDeferPlayPauseCmd = false;
                    setTimeout(_flushPlayPauseCmds, 0);
                }
                //else {
                  //  console.log(`##### S_S_S_S_S_S_S            (mismatch)  FINALLY >>>>>`)
                //}
            });
            //-------HERE ENDS OUR INIT PHASE PROMISE CHAIN --------------------
        }
        //These are things we want to do in the life-time of a video, if it plays long enough
        
        var _changeShakaBuffering = null;

        function __changeShakaBuffering(shakaPlayer) {
            if (shakaPlayer) {
                shakaPlayer.configure({
                    streaming: {
                        bufferingGoal: 10
                    },
                });
            }
        }

        /**
         * Promise chain for doing delayed ads
         * This is called by the playhead update callback function when the time is ripe
         * @param {*} startAccuTime. When this function is called what is the accumulated play time.
         */
        function _fetchMidrollWithCountdownP(startAccuTime, adUrl) {
            if (common.isIOS() && !_vid.muted) {
                console.log(`is IOS and the thing is not muted. so we dun want to play an ad.`);
                //on iOS we are not able to start the ad with sound (will hang)
                //so we dun ask for ads if at this juncture there is sound.
                return; 
            }
            _createAdObjMaybe();
            //autoplay how you decide leh.
            _adObject.makeAdRequestP(adUrl,
                _startModePW == startModePWClick_ ? false: true,
                _vid.muted)
            .then(function(outcome) {
                if(outcome == 'jxhasad') {
                    //we use accumulated time to also manage the countdown but since time is taken up
                    //between adRequest and hasad (adsMgrloaded), I need to factor that in also.
                    let wastedTime = _accumulatedTime - startAccuTime;
                    return new Promise(function(resolve) {
                        _adCountdownMgrFcn = __adCountdownMgrFcn.bind({adReqTime: _accumulatedTime, addTime: wastedTime, resolveFcn: resolve});
                        _createStripMessage(adCountdownSec_);
                    });
                }
                else {
                    return Promise.reject("jxnoad");//go to the catch clause then
                }
            })
            .then(function() {
                //if countdown phase then if the whole video is gone, then the countdown is gone coz we using 
                //bound handlers

                //end of countdown period
                _isDeferPlayPauseCmd = true; //during this time we do not allow play(), pause() api to take effect
                //as the ad is coming:
                return new Promise(function(resolve) {
                    _adObject.startAd(resolve);
                });
            })
            .catch(function(res) {
                /* WE DO NOT SUPPORT THIS FEATURE YET: SUBJECT TO VINCENT VETTING:
                if (res == 'jxnoad' || res == 'jxaderror') {
                    _isDeferPlayPauseCmd = true; //during this time we do not allow play(), pause() api to take effect
                    if (!_goOnModal) {
                        _goOnModal = MakeOneGoOnModal(_container);
                    }
                    return new Promise(function(resolve) {
                        _pauseVideo();
                        _goOnModal.show(function() {
                            _playVideo();
                            resolve();
                        });
                    });
                }*/
            })
            .finally(function() {
                _isDeferPlayPauseCmd = false;
                setTimeout(_flushPlayPauseCmds, 0);
                //clear the queue loh. During bootstrap phase we cannot execute the play and pause stuff.
            });
        }
        let ret = new FactoryPlayerWrapper(container);
        return ret;
    };
    module.exports = MakePlayerWrapperObj_;


/* 
 ************** module: video/player-factory ******************************************

* module.exports:
    - function which will make one player wrapper object
     The object has the following public functions:

       - isConfigSet = function()
       - setConfig = function(adsCfg, logoCfg, soundIndCfg)

       set some callback to inform the calling party of events
       - setReportCB function(fcn) 
       - setGestureReportCB function(fcn) 
       - setPlayheadCB function(fcn) 

       - play = function() play video or ad (for when triggered by outside video sdk)
       - playInt = function() play video or ad (for when triggered from within the video sdk)
       - pause = function() 
       - pauseInt = function() 
       
       - earlyBirdP = function() early init before we know about any video to play
       - setV = function <-- IMPORTANT FUNCTION
            delayPutSrcWaitProm, 
                //wait until we are e.g. nearer to the video area then this will resolve
                //prevent too much fetching of HLS segments.
            videoID,
            startModePW,
            srcHLS, srcFallback, 
            offset, 
            thumbnailURL)

  it is used by video/damplayer.js
        

* requires/dependencies:
    - a lot
*/