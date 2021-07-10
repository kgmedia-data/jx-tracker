//This was done (half-baked) prior to this componentization days
//Now still need to convert this to use our /video components

/**
 * THE UNIFIED AD VIDEO SDK
 * Can run as many video ads on the page as you like.
 * 1 from the KG traditional use of player SDK (coz they depend on the use of a window function onJXPlayerReady)
 * but it can play different ads one after another (the 2nd one can play in a different DIV than the first one)
 * If from universal, you can have as many video ad instance as desired.
 * All talking to the same universal instance too
 * 
 */
/*
Renee TODO:

formation of adtag
JX image not done yet
not properly doing the content video of course (not sure if we care ...)
note that I just found out that even the jxvideo.1.3.min.js - it is "able" to play
the loop thing BY ACCIDENT ONLY.
coz ...
the ad will emit COMPLETE event at the end of the first showing of the ad (before any repeat
    orchestrated by the VPAID JS itself). So actually the KG code (..weRestart...) will call
    the start AGAIN.
    It just so happen that the start() the second time does not do anything. so the ad
    just plays on...
the PUSH idea...    



*/    

(function() {
    if (window.jxvideoad) {
        return;
    }
    window.jxvideoad = 1;
    
    const mySig = 'jx_video_ad';
    /**
     * 
     * VAST GENERATION IS NOW HERE. FOR THOSE FROM UNIVERSAL.
     * IT IS PRETTY SHORT LAH.
     * 
     */
    const newLineMaybe_ = "\n"; //when developing, easier to see check the output

    /**
     * Utility function
     * @param {*} seconds 
     */
    function formatDuration_(seconds) {
        var d = Number(seconds);
        var h = Math.floor(d / 3600);
        var m = Math.floor(d % 3600 / 60);
        var s = Math.floor(d % 3600 % 60);
        var formatted = ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
        return formatted;
    }

    const vastOpener_ = '<?xml version="1.0" encoding="UTF-8"?><VAST xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="vast.xsd" version="3.0">\n';
    const vastCloser_ = '</VAST>';
    const actionNames_ = ["start", "firstQuartile", "midpoint", "thirdQuartile", "complete", "mute", "unmute", "rewind", "pause", "resume", "fullscreen", "creativeView"];

    /**
     * output blobs for tracking, for impression, for click, for error to insert into the main vast body
     * @param {*} creative 
     * @param {*} stackidx 
     */
    function genPingBlob(creative, stackidx, stackdepth) {
        let tbase = creative.trackers.baseurl;
        let tparams = creative.trackers.parameters;

        let miscEvts = {};
        ['impression', 'click', 'error'].forEach(function(action) {
            let ecMaybe = (action === 'error' ? '&errorcode=[ERRORCODE]' : '');
            miscEvts[action] = `<![CDATA[${tbase}?action=${action}${ecMaybe}&mediaurl=[ASSETURI]&${tparams}&stackidx=${stackidx}&stackdepth=${stackdepth}]]>`;
        });
        let ret = {};
        //TrackingEvent blob
        ret.tracking = actionNames_.map((action) => (`<Tracking event="${action}"><![CDATA[${tbase}?action=${action}&mediaurl=[ASSETURI]&${tparams}&stackidx=${stackidx}&stackdepth=${stackdepth}]]></Tracking>`))
            .join("\n");

        //Impression blob
        ret.impression = `<Impression>${miscEvts.impression}</Impression>`;
        if (creative.impressiontrackers && creative.impressiontrackers.length > 0) {
            ret.impression += creative.impressiontrackers.map((tracker) => `<Impression><![CDATA[${tracker}]]></Impression>`)
                .join("\n");
        }
        //click blob
        ret.click = "";
        if (creative.clickurl) {
            ret.click += `<ClickThrough><![CDATA[${creative.clickurl}]]></ClickThrough>`;
        }
        ret.click += `<ClickTracking>${miscEvts.click}</ClickTracking>`;
        ret.error = `${miscEvts.error}`;
        return ret;
    }

    /**
     * For VPAID or SIMID type
     * @param {*} creative 
     * @param {*} stackidx 
     */
    function genVast(creative, stackidx, stackdepth) {
        //console.log(creative);
        //console.log(`${creative.id}___${creative.subtype}`);
        let pings = genPingBlob(creative, stackidx, stackdepth);

        let adP = {};
        let mediaStr = "";
        switch (creative.subtype) {
            case 'vsimid':
                adP = Object.assign({}, creative.adparameters);
                delete adP.videos;
                mediaStr += `<InteractiveCreativeFile type="text/html" apiFramework="SIMID" variableDuration="true">${creative.url}</InteractiveCreativeFile>`;
                break;
            case 'vvpaid':
            case 'vhybrid':
                adP = creative.adparameters;
                mediaStr = `<MediaFile apiFramework="VPAID" type="application/javascript"><![CDATA[${creative.url}]]></MediaFile>`;
                break;
            case 'vinstream':
                adP = {};
                break;
        }
        if (creative.subtype == 'vsimid' || creative.subtype == 'vinstream') {
            mediaStr += creative.adparameters.videos.map(function(video) {
                let br = (video.bitrate ? `bitrate="${video.bitrate}"` : '');
                let w = (video.width ? `width="${video.width}"` : '');
                let h = (video.height ? `height="${video.height}"` : '');
                return `<MediaFile id="JIXIE" ${br} ${w} ${h} delivery="progressive" type="video/mp4" maintainAspectRatio="true"><![CDATA[${video.url}]]></MediaFile>`
            }).join("\n");
        }

        let json = {
            "Ad": {
                "@attr": `id="JXAD${creative.id}"`,
                "InLine": {
                    "AdSystem": "JXADSERVER",
                    "AdTitle": `${encodeURIComponent(creative.name)}`,
                    "Description": `Hybrid in-stream`,
                    "Error": pings.error,
                    "@none": pings.impression,
                    "Creatives": {
                        "Creative": {
                            "@attr": `id="JXAD${creative.id}" sequence="1"`,
                            "Linear": {
                                "@attr": '', //placeholder
                                "Duration": `${formatDuration_(creative.duration)}`,
                                "TrackingEvents": pings.tracking,
                                "VideoClicks": pings.click,
                                "AdParameters": `<![CDATA[${JSON.stringify(adP)}]]>`,
                                "MediaFiles": mediaStr
                            } //Lin
                        } //creative
                    } //creatives
                } //linline
            } //ad
        };
        if (creative.subtype == 'vinstream') {
            //actually we dun use this subtype at all...
            delete json.Ad.InLine.Creatives.Creative.Linear.AdParameters;
            json.Ad.InLine.Creatives.Creative.Linear['@attr'] = ` skipoffset="${formatDuration_(creative.skipoffset)}"`;
        } else {
            delete json.Ad.InLine.Creatives.Creative.Linear['@attr'];
        }
        return genVastFromJson(json);
    }

    /**
     * For WRAPPER type
     * @param {*} creative 
     * @param {*} stackidx 
     */
    function genWrapperVast(creative, stackidx, stackdepth) {
        let pings = genPingBlob(creative, stackidx, stackdepth);
        let json = {
            "Ad": {
                "@attr": `id="JXAD${creative.id}"`,
                "Wrapper": {
                    "AdSystem": "JXADSERVER",
                    "VASTAdTagURI": `<![CDATA[${creative.url}]]>`,
                    "Error": pings.error,
                    "@none": pings.impression,
                    "Creatives": {
                        "Creative": {
                            "@attr": `id="JXAD${creative.id}" sequence="1"`,
                            "Linear": {
                                "TrackingEvents": pings.tracking,
                                "VideoClicks": pings.click
                            } //Linear
                        } //creative
                    }, //creatives
                    "Extensions": `<Extension type="waterfall" fallback_index="${stackidx}"/>`
                } //Wrapper
            } //ad
        };
        return genVastFromJson(json);
    }

    function genVastFromJson(json) {
        return traverse("", json);
    }

    /**
     * Simple recursive traversal to print out the XML from the JSON encoding of the XML structure:
     * mom is for mother ... coz we only print out the mother when we have looked at the children
     * coz the attribute like <Ad id="xxxxxx">
     * in the  JSON the id="xxxx" is a while. Meaning until we looked into the children of "Ad" node
     * we dunno how to print out the  <Ad...> yet
     * @param {*} mom 
     * @param {*} jsonObj 
     */
    function traverse(mom, jsonObj) {
        let buffer = '';
        if (jsonObj !== null && typeof jsonObj == "object") {
            let replacement = "";
            Object.entries(jsonObj).forEach(([key, value]) => {
                if (key === '@attr') {
                    replacement = " " + value;
                }
            });
            let newmom = mom.replace('%%attr%%', replacement);
            buffer += newmom;
            Object.entries(jsonObj).forEach(([key, value]) => {
                if (key != '@attr') {
                    if (key == '@none') {
                        buffer += value;
                    } else {
                        // key is either an array index or object key
                        buffer += traverse("<" + key + "%%attr%%>" + newLineMaybe_, value);
                        buffer += "</" + key + ">" + newLineMaybe_;
                    }
                }
            });
        } else {
            // jsonObj is a number or string
            let newmom = mom.replace('%%attr%%', '');
            buffer += newmom + jsonObj;
        }
        return buffer;
    }

    function buildVastXml_(arrayOfCreatives) {
        let finalXML = vastOpener_;
        let idx = 0;
        let stackdepth = arrayOfCreatives.length;
        arrayOfCreatives.forEach(function(creative) {
            let normCreative = Object.assign({}, creative); // Normalization
            //as to where to find certain properties: see comment right below:

            if (normCreative.assets) {
                /*
                    if the vast gen buildVastXml_ is called from adserver, 
                    then we are in this case.
                    Otherwise we are from the universal unit and in the json formation 
                    by adserver it would have done this copying already.          
                */
                normCreative.duration = normCreative.assets.duration;
                normCreative.adparameters = normCreative.assets.adparameters;
                if (normCreative.assets.adparameters)
                    normCreative.skipoffset = normCreative.assets.adparameters.skipoffset;
                normCreative.clickurl = normCreative.assets.clickurl;
                normCreative.url = normCreative.assets.url;
                normCreative.impressiontrackers = normCreative.assets.impressionTrackers;
                delete normCreative.assets;
            }
            if (['vinstream', 'vvpaid', 'vhybrid', 'vsimid'].indexOf(creative.subtype) > -1) {
                finalXML += genVast((normCreative), idx, stackdepth);
            } else {
                finalXML += genWrapperVast((normCreative), idx, stackdepth);
            }
            idx++;
        });
        return finalXML + vastCloser_;
    }
    function getEmptyVast_() {
        return vastOpener_ + vastCloser_;
    }
    window.buildVastXml = buildVastXml_;

    

    
   
    const btnPlayID                = "adBtnPlay";
    const btnMuteID                = "adBtnMute";
    const playBtnCls               = "JXPlayBtn";
    const muteBtnCls               = "JXMuteBtn";

    const contentDivCls             = "JXContentDiv";
    const adDivCls                  = "JXAdDiv";
    const thumbnailCls              = "JXThumbnail";
    const playerCls                 = "JXPlayer";
    const adControlStyleID          = "JXAdControlStyle";
    const playerStyleID             = "JXPlayerStyle";
    const playerControlsCls         = "JXPlayerControls";
    const adControlsCls             = "JXAdControls";

    const hideCls                   = "jxhide";
    const adsHideCls                = "jxadshide";
    const isIOS_                    = false;

    /**
     * Helper object. One instance for document
     * @returns 
     */
    let MakeOneHelperObj = function() {
        let _loadIMAProm = null; //these are promises
        function FactoryOneHelper() {}
        FactoryOneHelper.prototype.newDiv = function(p, t, h, c, id) {
            var nd = document.createElement(t);
            if (h && h != "") nd.innerHTML = h;
            if (c && c != "") nd.className = c;
            if (id) nd.id = id;
            p.appendChild(nd);
            return nd;
        };

        //one helper in one DOM
        //general functions:
        FactoryOneHelper.prototype.loadIMAScriptP = function() {
            if (_loadIMAProm) return _loadIMAProm;
            _loadIMAProm = new Promise(function(resolve, reject) {
                var tag = document.createElement("script");
                var fst = document.getElementsByTagName("script")[0];
                fst.parentNode.insertBefore(tag, fst);
                tag.onload = function() {
                    resolve();
                };
                tag.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";

            });
            return _loadIMAProm;
        };
        FactoryOneHelper.prototype.acss = function(stylesArr, id) {
            _acss(stylesArr, id);
        }

        function _acss(stylesArr, id) {
            var head = document.getElementsByTagName('HEAD')[0];
            var s = document.createElement("style");
            if (id) s.id = id;
            s.innerHTML = stylesArr;
            head.appendChild(s);
        };
        FactoryOneHelper.prototype.injectBasicStyles = function() {
            let d = document;
            // Adding the stylesheet
            var head = d.getElementsByTagName('HEAD')[0];
            var c = d.createElement('style');
            head.appendChild(c);
            const controlsColor = '#FF0000';
            var stylesArr2 = [
                ".controls{height:100px;width:66px;margin-left:3px;position: absolute;bottom: 20px;left:5px;z-index:999;}",
                // Button play/pause CSS
                '.' + playBtnCls + ' {display: block;width: 0;height: 0;border-top: 10px solid transparent;border-bottom: 10px solid transparent;border-left: 12px solid ' +
                controlsColor +
                ";margin: 5px 0px 10px 0px;position: relative;z-index: 1;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;left: 10px;}",
                '.' + playBtnCls + ':before {content: "";position: absolute;top: -15px;left: -23px;bottom: -15px;right: -7px;border-radius: 50%;border: 2px solid ' +
                controlsColor +
                ";z-index: 2;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;}",
                '.' + playBtnCls + ':after {content: "";opacity: 0;transition: opacity 0.6s;-webkit-transition: opacity 0.6s;-moz-transition: opacity 0.6s;}',
                '.' + playBtnCls + ':hover:before, .' + playBtnCls + ':focus:before {transform: scale(1.1);-webkit-transform: scale(1.1);-moz-transform: scale(1.1);}',
                '.' + playBtnCls + '.active {border-color: transparent;}',
                '.' + playBtnCls + '.active:after {content: "";opacity: 1;width: 10px;height: 16px;position: absolute;left: -16px;top: -8px;border-color: ' +
                controlsColor +
                "; border-style: double; border-width: 0px 0 0px 15px;}",
                // speaker
                '.' + muteBtnCls + ' {height: 30px;width: 30px;position: relative;overflow: hidden;display: inline-block;}',
                '.' + muteBtnCls + ' span {pointer-events: none; display: block;width: 8px;height: 8px;background: ' +
                controlsColor +
                ";margin: 11px 0 0 2px;}",
                '.' + muteBtnCls + ' span:after {content: "";position: absolute;width: 0;height: 0;border-style: solid;border-color: transparent ' +
                controlsColor +
                " transparent transparent;border-width: 10px 14px 10px 15px;left: -13px;top: 5px;box-sizing: unset;}",
                '.' + muteBtnCls + ' span:before {transform: rotate(45deg);border-radius: 0 50px 0 0;content: "";position: absolute;width: 5px;height: 5px;border-style: double;border-color: ' +
                controlsColor +
                ";border-width: 7px 7px 0 0;left: 18px;top: 9px;transition: all 0.2s ease-out;box-sizing: unset;}",
                '.' + muteBtnCls + ':hover span:before {transform: scale(0.8) translate(-3px, 0) rotate(42deg);}',
                '.' + muteBtnCls + '.mute span:before {transform: scale(0.5) translate(-15px, 0) rotate(36deg);opacity: 0;}',
            ].join("\n");
            _acss(stylesArr2, adControlStyleID);
            var stylesArr3 = [
                '.' + 'xcontentDivCls' + ',.' + 'xadDivCls' + ',.' + playerCls + ',.' + thumbnailCls + '{position: absolute;top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;z-index: 1;}',
                '.' + contentDivCls + '{position: absolute;top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;z-index: -1;}',
                '.' + adDivCls + '{position:relative; width: 100%;height: 100%; }',
                '.' + adControlsCls + ',.' + playerControlsCls + '{height: 32px;width: 66px;margin-left: 3px;position: absolute;bottom: 20px;left: 5px;z-index: 999;}',
                '.' + hideCls + '{display: none;}'
                /////HACK HACK HACK '.' + adsHideCls + '{visibility: hidden;}',
                //////// We are showing the fullscreen button after all 'video::-webkit-media-controls-fullscreen-button{display: none !important;}',
            ].join("\n");
            _acss(stylesArr3, playerStyleID);
        };
        let ret = new FactoryOneHelper();
        return ret;
    }
   
    /**
     * Makes a Control Object for ADS
     * 
     * APIs for the ADS Controls object: TO BE FILLED IN (basically are the prototype functions)
     */
    let MakeOneAdControlsObj = function(container, vectorFcn) {
        var _container = null;
        var _cDiv = null;
        var _vectorFcn = null;
        var _isPlaying = false;//so we do need to keep state
        var _isMuted = false; //
        var _playBtn = null;
        var _muteBtn = null;
        var _togglePlay = function() {
            //NOTE: In here, we do not try to set the button look
            //we depend on the updatePlayState, updateMutedState of
            //this object being called (this is in response to adsManager
            //events.) That is the one source of truth
            if (_isPlaying) {
                _vectorFcn.pause();
            } else {
                _vectorFcn.play();
            }
            return false;
        };
        var _toggleMute = function() {
            if (_isMuted) {
                _vectorFcn.unMute();
            } else {
                _vectorFcn.mute();
            }
            return false;
        };

        function FactoryOneAdControls(container, vectorFcn) {
            _container = container;
            _vectorFcn = vectorFcn;
            let r = Math.floor(Math.random() * 1000);
            //const innerElm = '<span style="width: 0px;"></span>'; // the child element of the progress bar
            const controlDiv = '<div style="float:left; width:30px;">' +
                '<a href="javascript:void(0)" id="' + btnPlayID + '-' + r + '" class="' + playBtnCls + '"></a></div>' +
                '<div style="float:left; width:30px;margin-left:3px;">' +
                '<a href="javascript:void(0)" id="' + btnMuteID + '-' + r + '"  class="' + muteBtnCls + '"><span></span></a></div>';
            _cDiv = _helpers.newDiv(
                _container,
                "div",
                controlDiv,
                adControlsCls
            );
            _playBtn = document.getElementById(btnPlayID + '-' + r);
            _muteBtn = document.getElementById(btnMuteID + '-' + r);
            _playBtn.onclick = _togglePlay;
            _muteBtn.onclick = _toggleMute;
        };
        //these are called when the adsManager events happens.
        FactoryOneAdControls.prototype.updatePlayState = function(isPlaying) {
            _isPlaying = isPlaying;
            if (isPlaying)
                _playBtn.classList.add('active');
            else
                _playBtn.classList.remove('active');
        }
        FactoryOneAdControls.prototype.updateMutedState = function(isMuted) {
            _isMuted = isMuted;
            if (isMuted)
                _muteBtn.classList.add('mute');
            else
                _muteBtn.classList.remove('mute');
        }
        FactoryOneAdControls.prototype.hide = function() {
            _cDiv.classList.add(hideCls);
        };
        FactoryOneAdControls.prototype.show = function() {
            _cDiv.classList.remove(hideCls);
        };
        let ret = new FactoryOneAdControls(container, vectorFcn);
        return ret;
    };

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
    let MakeOneAdObj = function(
        theAd, container, controlsColor, vid, fcnVector, 
        autoAdsMgrStart, eventsVector) {
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
                    token: _adDescriptor.token
                }
                let msgStr = "jxmsg::" + JSON.stringify(obj);
                window.parent.postMessage(msgStr, '*'); 
            }
        };
        
        FactoryOneAd.prototype.reset = function() {
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
                    _adDiv.classList.remove(adsHideCls);
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
            _adsManager.init(_width, _height, google.ima.ViewMode.NORMAL); //HACK
            const basicEvents = [   
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
        function FactoryOneAd(theAd, adDiv, controlsColor, vid, fcnVector, 
            autoAdsMgrStart = true,
            eventsVector = null) {

            _eventsVector       = eventsVector;
            _autoAdsMgrStart    = autoAdsMgrStart;
            _adDescriptor       = theAd;
            _vid                = vid;
            _adDiv = adDiv;
            _pFcnVector         = fcnVector;
            _width              = _adDescriptor.width;
            _height             = _adDescriptor.height;
            _controlsColor      = controlsColor;
        }
        
        FactoryOneAd.prototype.makeAdRequestP = function(adURL, adXML, autoplayFlag, mutedFlag) {
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
                    adsRequest.linearAdSlotWidth = _width;
                    adsRequest.linearAdSlotHeight = _height; 
                    adsRequest.nonLinearAdSlotWidth = _width;
                    adsRequest.nonLinearAdSlotHeight = _height / 3;
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
        let ret = new FactoryOneAd(theAd, container, controlsColor, vid, fcnVector,
            autoAdsMgrStart, eventsVector);
        return ret;
    };

    
    let MakeOneInst = function(containerId, data, startAdWhenAvail = true, eventsVector = {}) {
        var _pDiv               = null;
        var _playerElt          = null;
        var _adDiv              = null;
        var _adObj              = null;
        var _startAdWhenAvail   = true;
        var _eventsVector       = {};
        var _containerId        = null;

        var _banners = {};//not sure if we really need to expose these here.

        function _createBanner(adDiv, masterObj, position) {
            let obj = masterObj.companion ? masterObj.companion[position]: null;
            if (!obj) {
                return;
            }
            let url = obj.url;
            let height = obj.height;
            let gap = obj.gap;
            if (position === 'top' && gap > 0) {
                adDiv.style.marginTop = gap + "px";
            }
            if (position === 'bottom' && gap > 0) {
                adDiv.style.marginBottom = gap + "px";
            }
            //if (obj.type == "image") { // if it is an image
            {
                let pElmt = document.createElement('div'); // create a div 
                pElmt.style.cursor = "pointer";
                pElmt.style.margin = "auto";
                // create an img tag
                pElmt.innerHTML = '<img src="' + url + '" width="100%" height="' + height + '" class="jxImg"/>';
                // set the width and height of the div
                if (obj.width && obj.height) {
                    pElmt.style.width = obj.width + "px";
                    pElmt.style.height = obj.height + "px";
                } else {
                    pElmt.style.width = "100%";
                    pElmt.style.maxWidth = "100%";
                }
                _banners[position] = pElmt;
                if (position == 'top') { // if it is a top banner
                    adDiv.parentNode.insertBefore(pElmt, adDiv); // insert above the ad div container
                    //jxutil.addListener(pElmt, 'click', this.onTopBannerClick); // listen to the click event
                } else if (position == 'bottom') { // if it is a bottom banner
                    adDiv.parentNode.appendChild(pElmt); // insert below the ad div container
                    //jxutil.addListener(pElmt, 'click', this.onBottomBannerClick); // listen to the click event
                }
            }
        }

        function _createInner(containerId) {
            let tmp = document.getElementById(containerId);
            if (!tmp) {
                tmp = document.body;
            }
            _pDiv = _helpers.newDiv(tmp,'div','',''); 
            _pDiv.style.width = '100%';
            _pDiv.style.height = '100%';
            _adDiv = _helpers.newDiv(_pDiv, "div", "", adDivCls); 
            _contentDiv = _helpers.newDiv(_adDiv, 'div', `<video id="idJxPlayer" class=${playerCls} controls muted playsinline></video>`, contentDivCls); // DEBUG
            _playerElt = document.getElementById('idJxPlayer');
        }
        
       

        OneAdInstance.prototype.changeCfg = function(data) {
            //this is the type where only got config json
            //i.e. has creativeID unit, that kind of thing.
            //can also get from them lah.
            let blob = {
                width: 640, 
                height: 360 
            }
            if (data.video) {
                //the KG usage can specify odd shaped video now.
                blob.width = data.video.width;
                blob.height = data.video.height;
            }
            _adDiv.style.width = blob.width +'px';
            _adDiv.style.height = blob.height + 'px';
            if (_adObj) 
                _adObj.reset();
            var v = {
                    switch2Cnt: function() {
                        _playerElt.play();
                    },
                    switch2Ad: function() {
                        _playerElt.pause();
                    }
                };                
            _adObj = MakeOneAdObj(blob, _adDiv, "#FFFFFF", _playerElt, v,
                startAdWhenAvail, eventsVector);
            let adURL = `https://ad.jixie.io/v1/video?source=sdk&domain=jixie.io&creativeid=` + data.creativeid;
            _adObj.makeAdRequestP(adURL, null, true, true);
        }
        
        OneAdInstance.prototype.visibilityChange = function(isVisible) {
            if (_adObj) {
                if (isVisible) {
                    _adObj.playAd();
                }
                else {
                    _adObj.pauseAd();
                }
            }
        }

        //Here this JSON can be either a JSON with creative info or not.
        OneAdInstance.prototype.changeJson = function(data) {
            if (_adObj) {
                _adObj.reset();
            }
            if (!data.video) {
                data.video = {
                    width: 640,
                    height: 360
                };
            }

            if (data.video.height == 520)
                data.video.height= 320; //error somewhere
            //_playerElt.src = 'https://creative-ivstream.ivideosmart.com/3001004/954006/3001004-954006_480.mp4';
            let tmp = document.getElementById(_containerId);
            if (!tmp) {
                tmp = document.body;
            }
            let containerW = tmp.offsetWidth;
            let comp = { height: 0 }; //for companion
            ['top', 'bottom'].forEach(function(banner){
                let label = banner+'banner';
                if (data[label]) {
                    comp[banner] = {};
                    comp[banner] = JSON.parse(JSON.stringify(data[label]));
                    //cheat:
                    /*
                    let obj  = comp[banner];
                    obj.url = 'https://creatives.jixie.io/59a1361c5e23f2dcae1229fedbb4d8d5/700/pasanglklan320x100.jpeg';
                    obj.height = 100;
                    obj.width = 320;//no need bah
                    obj.gap = 0;
                    */
                    comp[banner].url = 'https://creatives.jixie.io/59a1361c5e23f2dcae1229fedbb4d8d5/700/pasanglklan320x100.jpeg';
                    comp[banner].gap = 0; //hack
                    comp[banner].ar = data[label].width/data[label].height;
                    comp[banner].width = containerW;
                    comp[banner].height = comp[banner].width/comp[banner].ar;
                    comp.height += comp[banner].height;
                }
            });
            let blob = {
                width: data.video.width, 
                height: data.video.height
            }
            if (comp.height) {
                blob.companion = comp;
            }
            _adDiv.style.width = blob.width +'px';
            _adDiv.style.height = blob.height + 'px';
            
            blob.token = _containerId;
            //we make a functions vector for them to listen??
            //to play the video.
            var v = {
                switch2Cnt: function() {
                    _playerElt.play();
                },
                switch2Ad: function() {
                    _playerElt.pause();
                }
            };
            ['top','bottom'].forEach(function(banner) {
                _createBanner(_adDiv, blob, banner);
            });
            //in the end our addescriptor object also only have very little
            _adObj = MakeOneAdObj(blob, _adDiv, "#FFFFFF", _playerElt, v,
                startAdWhenAvail, eventsVector);
            //we should not use any attribute of the container.
            //724 banner+sqvideo+banner
            //686: 9-16 singers
            //690: pure video
            //now we try to do the vast tag oh my goodness...
            let xyz = data.vast;
            delete data.vast;
            xyz.adparameters = data;           
            let vast = window.buildVastXml([xyz]);
            _adObj.makeAdRequestP(null, vast, true, true);
        }//

        OneAdInstance.prototype.play = function() {
            if (_adObj)
                _adObj.startAd();
        }
        function OneAdInstance(containerId, adparameters, startAdWhenAvail, eventsVector = {}) {
            _token = containerId;
            _containerId        = containerId;
            _startAdWhenAvail   = startAdWhenAvail;
            _eventsVector       = eventsVector;
            _createInner(containerId);
            this.changeJson(adparameters);
        }
        OneAdInstance.prototype.notifyMe = function(action) {
            if (action == 'jxvisible')
                this.visibilityChange(true);
            else if (action == 'jxnotvisible')
                this.visibilityChange(false);
                

        }
        
        let ret = new OneAdInstance(containerId, data, startAdWhenAvail, eventsVector);
        return ret;
    }


    /**
     * 
     * Run Once only.
     * 
     */
    // <-- This is specific to this SDK
    var _helpers = MakeOneHelperObj(); //used by all the players on the page.
    _helpers.injectBasicStyles();
    _helpers.loadIMAScriptP();

//
/**
     * FROM HERE ONWARDS IS JUST TEMPLATE CODE
     * IF YOU KNOW THE STUFF , THEN THERE ARE BLOCKS OF CODE YOU CAN DELETE IF THERE
     * IS NO USE FOR IT
     */
 function notifyMaster(type, token, data = null) { //todo DATA HOW
    let msgStr = '';
    if (type == 'jxloaded') {
        token = window.name;
    }
    let obj = {
        type: type,
        token: token
    };
    if (data) {
        obj.data = data;
    }
    msgStr = "jxmsg::" + JSON.stringify(obj);
    const exposedWinPropName_ = 'jxuniversallite';
    if (window[exposedWinPropName_])
        window.postMessage(msgStr, '*'); //HACK 
    else
        parent.postMessage(msgStr, '*'); //HACK 
}



let instMap = new Map();
let runMe = function(containerId, adparameters) {
    let cr = MakeOneInst(containerId, adparameters);
    instMap.set(containerId, cr);
}
let notifyMe = function(containerId, action) {
    let cr = instMap.get(containerId);
    if (cr) {
        cr.notifyMe(action);
    }
}

 //<----- Only needed when univeral unit is in same window as us
 window[mySig] = (function() {
    var queue = [];
    if (window[mySig]) {
        // queue from outside might be null... 
        queue = window[mySig].queue || queue;
    }
    //here we execute code that is in the queue
    if (queue.length > 0) {
        window[mySig] = { run: runMe, notify: notifyMe };
    }
    while (queue.length > 0) {
        var command = queue.shift();
        command();
    }
    //must override the thing so that the queue functionis eual to running it then.
    return {
        run: runMe,
        notify: notifyMe,
        queue: {
            push: function(fcn) {
                //executing it now!!!
                fcn();
            }
        }
    };
})();


    //<----- Only needed when univeral unit is outside our iframe
    function listen(e) {
        let json = null;
        if (e.data.indexOf('jxmsg::') == 0) {
            try {
                json = JSON.parse(e.data.substr('jxmsg::'.length));
            }
            catch(err) {}
        }
        if (!json) return; //unrelated to us, we dun bother.
        switch (json.type) {
            case "jxvisible":
            case "jxnotvisible":     
                notifyMe(json.token, json.type);
                break;
            case "adparameters":
                runMe(json.token, json.data);
                break;                    
        }
    }//listen
    
    window.addEventListener('message', listen, false);
    notifyMaster('jxloaded', mySig);


    // Only needed when univeral unit is outside our iframe ----->
    






    

   

})();



