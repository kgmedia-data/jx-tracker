const modulesmgr            = require('../basic/modulesmgr');

const hlsAvailHeightsArr_ = [240,360,480,720,1080];
const hlsAvailHeightsMax_ = 1080;

function MakeOneHelperObj_() {
    var _unsent = {
        loaded: 1
    }
    let _loadIMAProm = null; //these are promises
    let _loadShakaProm = null; //these are promises
    let _scriptLoadedTime = 0;

    function FactoryOneHelper() {}
    FactoryOneHelper.prototype.getClosestDamHLSHeight = function(width, height) {
        for (var i = 0; i < hlsAvailHeightsArr_.length; i++) {
            if (height <= hlsAvailHeightsArr_[i]) {
                return hlsAvailHeightsArr_[i];
            }
        }
        return hlsAvailHeightsMax_;
    }
    function _isBrowserSupported() {
        if (window.IntersectionObserver)  {
            return true;
        }
        return false;
    }
    FactoryOneHelper.prototype.isBrowserSupported = function() {
        return _isBrowserSupported();
    }
    FactoryOneHelper.prototype.getScriptLoadedTime = function() {
        return _scriptLoadedTime;
    }
    FactoryOneHelper.prototype.sendScriptLoadedTrackerAMP = function(options) {
        if (!_unsent.loaded) {
            //can only send it once
            return;
        }
        _unsent.loaded = 0; //1 --> 0
        _scriptLoadedTime = Date.now();
        let trackerBase = this.getTrackerBase(options);
        let url = trackerBase + "&device=amp&action=loaded&debug="+options.dbgVersion + "_";
        fetch(url, {
            method: 'get',
            credentials: 'include' 
        })
        .catch((ee) => {
        });
        if (!_isBrowserSupported()) {
            url = trackerBase + "&action=donothing";
            fetch(url, {
                method: 'get',
                credentials: 'include' 
            })
            .catch((e) => {
            });
        }
    }   
    FactoryOneHelper.prototype.sendScriptLoadedTracker = function(options) {
        if (!_unsent.loaded) {
            //can only send it once
            return;
        }
        if (window.AmpVideoIframe) {
            //make sure for AMP case we dun use this one. Coz at this stage we dunno
            //the canonical url.
            return; 
        }
        _unsent.loaded = 0; //1 -> 0
        _scriptLoadedTime = Date.now();
        let trackerBase = this.getTrackerBase(options);
        let url = trackerBase + "&action=loaded&debug="+options.dbgVersion + "_";
        fetch(url, {
            method: 'get',
            credentials: 'include' 
        })
        .catch((ee) => {
        });
        if (!_isBrowserSupported()) {
            url = trackerBase + "&action=donothing";
            fetch(url, {
                method: 'get',
                credentials: 'include' 
            })
            .catch((e) => {
            });
        }
    }
    FactoryOneHelper.prototype.getViewFraction = function(element) {
        const viewport = {
            top: window.pageYOffset,
            bottom: window.pageYOffset + window.innerHeight
          };
        
          const elementBoundingRect = element.getBoundingClientRect();
          const elementPos = {
            top: elementBoundingRect.y + window.pageYOffset,
            bottom: elementBoundingRect.y + elementBoundingRect.height + window.pageYOffset
          };
        
          if (viewport.top > elementPos.bottom || viewport.bottom < elementPos.top) {
            return 0;
          }
        
          // Element is fully within viewport
          if (viewport.top < elementPos.top && viewport.bottom > elementPos.bottom) {
            return 1;
          }
        
          // Element is bigger than the viewport
          if (elementPos.top < viewport.top && elementPos.bottom > viewport.bottom) {
            return 1;
          }
        
          const elementHeight = elementBoundingRect.height;
          let elementHeightInView = elementHeight;
        
          if (elementPos.top < viewport.top) {
            elementHeightInView = elementHeight - (window.pageYOffset - elementPos.top);
          }
        
          if (elementPos.bottom > viewport.bottom) {
            elementHeightInView = elementHeightInView - (elementPos.bottom - viewport.bottom);
          }
          //return (elementHeightInView / window.innerHeight) ;
          return (elementHeightInView / (elementPos.bottom - elementPos.top)) ;
    }
    FactoryOneHelper.prototype.getNetworkType = function() {
        var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            //console.log(connection.effectiveType);
            return connection.effectiveType;
        }
        else {
            return 'unknown';
        }
    }

    /**
     * May not be working perfectly yet. Still need to check to tweak
     * But the goal is to centralize so that no matter how many JX video sdks and 
     * how many videos on page. We only load this once.
     * @returns a promise for the loading. (which is resolved upon the onload event)
     */
    FactoryOneHelper.prototype.loadIMAScriptP = function() {
        if(_loadIMAProm) return _loadIMAProm;
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
    /**
     *  This is a FAKE shaka player. I am just trying to replace the shaka player with
     *  html5 video + the npm HLS.js plugin
     *  In order not to change the playerWrapper code, I have faked a shaka.Player class above
     */
    FactoryOneHelper.prototype.FAKE_loadShakaScriptP = function(goodans, badans) {
        if(_loadShakaProm) return _loadShakaProm;
        _loadShakaProm = new Promise(function(resolve) {
            var tag = document.createElement("script");
            var fst = document.getElementsByTagName("script")[0];
            fst.parentNode.insertBefore(tag, fst);
            tag.onload = function() {
                if(Hls.isSupported()) {
                    shaka._construct(); //fake the shaka.Player object
                    resolve("shaka");
                }
                else
                    resolve(fallbackTech_);

            };
            tag.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";

        });
        return _loadShakaProm;
    }
    //This is the real shaka player, right now commented out.
    FactoryOneHelper.prototype.loadShakaScriptP = function(goodans, badans) {
        //dun even have promises, then forget it just do simplist
        if (jxPromisePolyfill != 'none') {
            _loadShakaProm = Promise.resolve(fallbackTech_);
        }
        if(_loadShakaProm) return _loadShakaProm;
            //possible the loading fail, then how leh?
            _loadShakaProm = new Promise(function(resolve) {
                let ps = [];
                ps.push(new Promise(function(resolve1) {
                    var script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.onload = function() {
                        //console.log(`__JXTIMING script shaka resolve part A` + (Date.now() - basetime_));
                        if(shaka.Player.isBrowserSupported()) {
                            shaka.polyfill.installAll();
                            resolve1(1);
                        }
                        else {
                            resolve1(0);
                        }
                    };
                    script.src = "https://ajax.googleapis.com/ajax/libs/shaka-player/3.0.10/shaka-player.compiled.js";
                    document.getElementsByTagName('head')[0].appendChild(script);
                }));
                //without this mux JS script we cannot read our own generated HLS (Jixie DAM)
                /*
                Interestingly, still needed this extra JS to play the HLS generated by our own system...
                Need to talk to somebody ...
                https://docs.microsoft.com/en-us/azure/media-services/latest/player-shaka-player-how-to
                Shaka Player is an open-source JavaScript library for adaptive media. It plays adaptive media formats (such as DASH and HLS) in a browser, without using plugins or Flash. Instead, the Shaka Player uses the open web standards Media Source Extensions and Encrypted Media Extensions.
                We recommend using Mux.js as, without it, the Shaka player would support HLS CMAF format, but not HLS TS.
                */
                ps.push(new Promise(function(resolve1) {
                    var script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.onload = function() {
                        //console.log(`__JXTIMING script shaka resolve part B` + (Date.now() - basetime_));
                        resolve1(1);
                    };
                    script.src = "https://cdn.jsdelivr.net/npm/mux.js@5.6.3/dist/mux.js";
                    document.getElementsByTagName('head')[0].appendChild(script);
                })); 
                Promise.all(ps).then(function(outcomes){
                    if (outcomes.reduce(function(a, b) { return (a + b) }, 0) == 2) {
                        //console.log(`__JXTIMING script shaka resolveing` + (Date.now() - basetime_));
                        resolve("shaka");
                    }
                    else {
                        resolve(fallbackTech_);
                    }
                });
            });
        //console.log(`__JXTIMING script returning _loadShakaProm ` + (Date.now() - basetime_));
                        
        return _loadShakaProm;
    };

    
    const cookieLifeDays_ = 1;
    const playheadCookieName_ = '_jxvideopos';
    var _playheadArr = null;
    
    FactoryOneHelper.prototype.getVStoredPlayhead = function(vid) {
        if (!_playheadArr) {
            _playheadArr = _getStoredVPlayheads();
        }
        let entry = _playheadArr.find((e) => e.id == vid);
        //console.log(`prototype.getVStoredPlayhead ${vid} ${(entry ? entry.t : 0)}`);
        return (entry ? entry.t : 0);
    }
    FactoryOneHelper.prototype.setVStoredPlayhead = function(vid, playhead) {
        if (typeof playhead != "number") {
            return;
        }
        playhead = Math.round(playhead);
        if (!(playhead > 0 && playhead < 10800)) {
            return;
        }
        //console.log(`prototype.setVStoredPlayhead ${vid} after rounding ${playhead}`);
        
        if (!_playheadArr) {
            _playheadArr = _getStoredVPlayheads();
        }
        let entry = _playheadArr.find((e) => e.id == vid);
        if (entry) {
            entry.t = playhead;
        }
        else {
            _playheadArr.push({ id: vid, t: playhead});
        }
        //keep the number of videos low:
        if (_playheadArr.length > 7) {
            _playheadArr.splice(0, _playheadArr.length -7);
        }
        _flushVPlayheads();
    }
    FactoryOneHelper.prototype.deleteVStoredPlayhead = function(vid) {
        if (!_playheadArr) {
            return;
        }
        let index = _playheadArr.findIndex((e) => e.id == vid);
        if (index>=0) {
            _playheadArr.splice(index, 1);
        }
        _flushVPlayheads();
    }
    function _flushVPlayheads() {
        //store in the top domain only?
        if (_playheadArr && Array.isArray(_playheadArr)) {
            let str = JSON.stringify(_playheadArr);
            let d = new Date();
            d.setTime(d.getTime() + (cookieLifeDays_ * 24 * 60 * 60 * 1000)); //<--- aiyo we can compute that once only lah.
            var expires = "expires="+d.toUTCString();
            document.cookie = playheadCookieName_ + '=' + (str) + ";" + expires + ";path=/";
        }
    }
    function _getStoredVPlayheads() {
        let destringified = null;
        let tmp = [];
        try {
            var ca = document.cookie.split(';');
            for(var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(playheadCookieName_) == 0) {
                    destringified = c.substring(playheadCookieName_.length+1, c.length);
                    break;
                }
            }//for
            tmp = JSON.parse((destringified));
        }
        catch (eee) {
            tmp = [];
        }
        if (!Array.isArray(tmp)) {
            tmp = [];
        }
        let corrupted = false;
        for (var i = 0; i < tmp.length; i++) {
            let o = tmp[i];
            if (o.id  && typeof o.id === 'number' && o.hasOwnProperty('t') && typeof o.t === 'number') {

            }
            else {
                corrupted = true;
            }
        }
        if (corrupted) tmp = [];
        return tmp;
    };
    FactoryOneHelper.prototype.getTrackerBase = function(options) {
        let tmp = 'https://traid.jixie.io/sync/video?x=1';
        ['client_id', 'sid'].forEach(function(prop) {
            if (options[prop])
                tmp += '&' + prop + '=' + options[prop];
        });
        ['pageurl', 'domain', 'p_domain'].forEach(function(prop) {
            if (options[prop])
                tmp += '&' + prop + '=' + encodeURIComponent(options[prop]);
        });
        if (options.amp) tmp += '&device=amp';
        return tmp;
    }
    FactoryOneHelper.prototype.getAdTag = function(options) {
        let tmp = 'https://ad.jixie.io/v1/video?maxnumcreatives=13&source=jxplayer';
        ['client_id', 'sid', 'creativeid'].forEach(function(prop) {
            if (options[prop])
                tmp += '&' + prop + '=' + options[prop];
        });
        ['pageurl', 'domain'].forEach(function(prop) {
            if (options[prop])
                tmp += '&' + prop + '=' + encodeURIComponent(options[prop]);
        });
        if (options.amp) tmp += '&device=amp';
        return tmp;
    }
    let ret = new FactoryOneHelper();
    return ret;
};
var gH = MakeOneHelperObj_();
module.exports = gH;


/* 
 ************** module: video/jxvideo-helper ******************************************

* module.exports:
    - returns a helper object
     The object has the following public functions:

        - getClosestDamHLSHeight = function(width, height) 

        - isBrowserSupported = function() - refering to intersectionObservers

        Some of the earlier events needed to fire:
        - getScriptLoadedTime = function() 
        - sendScriptLoadedTrackerAMP = function(options) 
        - sendScriptLoadedTracker = function(options) 

        - getViewFraction = function(element) for viewability metric in the tracking events

        - getNetworkType = function() 

        - loadIMAScriptP = function() 
        - FAKE_loadShakaScriptP = function(goodans, badans) 
        - loadShakaScriptP = function(goodans, badans) 

        Cookie to save the playhead of videos watched:
        - getVStoredPlayhead = function(vid) 
        - setVStoredPlayhead = function(vid, playhead) 
        - deleteVStoredPlayhead = function(vid) 

        - getTrackerBase = function(opions) 
        - getAdTag = function(options) 

  it is used by the bundle js for video sdk.
        
* requires/dependencies:
    - a lot
*/