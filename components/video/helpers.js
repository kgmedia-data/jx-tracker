
const mpginfo                     = require('../basic/pginfo');

const hlsAvailHeightsArr_ = [240,360,480]; //,720];
const hlsAvailHeightsMax_ = 480;
const dbgVersion = 'v40';

function MakeOneHelperObj_() {
    console.log("MADE1________ AND SHOULD NOT APPEAR MORE THAN ONCE !!!");
    var _unsent = {
        loaded: 1
    }
    var _idsObj = null;
    var _cssObj = null;
    var _fixedInfo = null; //pageurl, domain, client_id, sid, adTagUrlBase, trackerBase
    let _loadIMAProm = null; //these are promises
    let _loadShakaProm = null; //these are promises
    let _scriptLoadedTime = 0;

    function FactoryOneHelper() {}
    FactoryOneHelper.prototype.getDbgVersion = function() { return _dbgVersion; }
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
    FactoryOneHelper.prototype.sendScriptLoadedTrackerAMP = function(ampIntegration) {
        if (!_unsent.loaded) {
            //can only send it once
            return;
        }
        let canonUrl = '';
        try {
            let metadata = ampIntegration.getMetadata();
            canonUrl = metadata.canonicalUrl;
        }
        catch (err) {
        }
        _unsent.loaded = 0; //1 --> 0

        _scriptLoadedTime = Date.now();
        _setupFixedInfo(canonUrl);
        let url = _fixedInfo.trackerBase + "&action=loaded&debug="+dbgVersion + "_";
        fetch(url, {
            method: 'get',
            credentials: 'include' 
        })
        .catch((ee) => {
        });
        if (!_isBrowserSupported()) {
            url = _fixedInfo.trackerBase + "&action=donothing";
            fetch(url, {
                method: 'get',
                credentials: 'include' 
            })
            .catch((e) => {
            });
        }
    }   
    FactoryOneHelper.prototype.sendScriptLoadedTracker = function() {
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
        _setupFixedInfo();//may not be necessary. it may do nothing.
        let url = _fixedInfo.trackerBase + "&action=loaded&debug="+dbgVersion + "_";
        fetch(url, {
            method: 'get',
            credentials: 'include' 
        })
        .catch((ee) => {
        });
        if (!_isBrowserSupported()) {
            url = _fixedInfo.trackerBase + "&action=donothing";
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
    FactoryOneHelper.prototype.injectStyles = function(stylesString, styleName) {
         _acss(stylesString, styleName);
    }
    FactoryOneHelper.prototype.getCssObj = function() {
        return _cssObj;
    }
    
    FactoryOneHelper.prototype.setCssObj = function(cssObj) {
        _cssObj = cssObj;
        _acss(cssObj.getCss(), "JxPlayerStyle");

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

    FactoryOneHelper.prototype.toCamelCase = function(str) {
        return str.toLowerCase().replace(/(\-[a-z])/g, function($1) {
            return $1.toUpperCase().replace('-', '');
         });
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

    FactoryOneHelper.prototype.addListener = function(e, event, h) {
        if(e.addEventListener) {
            e.addEventListener(event, h, false);
        } else if(e.attachEvent) {
            e.attachEvent('on' + event, h);
        } else {
            e['on' + event] = h;
        }
    };
    FactoryOneHelper.prototype.removeListener = function(e, event, h) {
        if (e.removeEventListener) {    // all browsers except IE before version 9
            e.removeEventListener (event, h, false);
        }
        else {
            if (e.detachEvent) {        // IE before version 9
                e.detachEvent (event, h);
            }
        }
    }
    FactoryOneHelper.prototype.newDiv = function(p, t, h, c, id) {
        var nd = document.createElement(t);
        if(h && h != "") nd.innerHTML = h;
        if(c && c != "") nd.className = c;
        if(id) nd.id = id;
        p.appendChild(nd);
        return nd;
    };
    FactoryOneHelper.prototype.acss = function(stylesArr, id) {
        _acss(stylesArr, id);
    }

    function _acss(stylesArr, id) {
        var head = document.getElementsByTagName('HEAD')[0];
        var s = document.createElement("style");
        if(id) s.id = id;
        s.innerHTML = stylesArr;
        head.appendChild(s);
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
        if (!(playhead > 0 && playhead < 7200)) {
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
            if (o.id  && typeof o.id === 'string' && o.hasOwnProperty('t') && typeof o.t === 'number') {

            }
            else {
                corrupted = true;
            }
        }
        if (corrupted) tmp = [];
        return tmp;
    };
    
    FactoryOneHelper.prototype.getTrackerBase = function() {
        _setupFixedInfo();//may not be necessary. it may do nothing.
        return _fixedInfo.trackerBase;
    }
    FactoryOneHelper.prototype.getAdTag = function(unit) {
        _setupFixedInfo();//may not be necessary. it may do nothing.
        return _fixedInfo.adTagBase + '&unit=' + unit;
    }
    FactoryOneHelper.prototype.setIds = function(idsObj) {
        _idsObj = idsObj;
    }
    
    function _setupFixedInfo(ampCanonicalUrl = '') {
        if (!_fixedInfo) { //|| _fixedInfo.adTagBase || _fixedInfo.trackerBase) {
            if (!_fixedInfo)  {
                _fixedInfo = {};
            }
            var pageurl = ampCanonicalUrl;
            var domain = '';
            var p_domain = '';
            if (!pageurl) {
                let pginfo = mpginfo.get(); 
                pageurl = pginfo.pageurl ? pginfo.pageurl:null;
                domain = pginfo.pagedomain ? pginfo.pagedomain:null;
                p_domain = pginfo.p_domain ? pginfo.p_domain:null;
            }
            _fixedInfo.pageurl = pageurl;
            _fixedInfo.domain = domain;
            _fixedInfo.p_domain = p_domain;
            if (_idsObj && _idsObj.client_id) _fixedInfo.client_id = _idsObj.client_id;
            if (_idsObj && _idsObj.sid) _fixedInfo.sid = _idsObj.sid;
            let tmp = '';
            if (_fixedInfo.client_id) tmp += '&client_id=' + _fixedInfo.client_id;
            if (_fixedInfo.sid) tmp += '&sid=' + _fixedInfo.sid;
            if (_fixedInfo.pageurl) tmp += '&pageurl=' + encodeURIComponent(_fixedInfo.pageurl);
            if (_fixedInfo.domain) tmp += '&domain=' + encodeURIComponent(_fixedInfo.domain);
            _fixedInfo.adTagBase = 'https://ad.jixie.io/v1/video?maxnumcreatives=13&source=jxplayer' + tmp + (ampCanonicalUrl? '&device=amp':'');
            _fixedInfo.trackerBase = 'https://traid.jixie.io/sync/video?x=1' + tmp + 
                (_fixedInfo.p_domain? '&p_domain=' + _fixedInfo.p_domain: '') + (ampCanonicalUrl? '&device=amp':'');
        }
    }
    let ret = new FactoryOneHelper();
    return ret;
};
var gH = MakeOneHelperObj_();
module.exports = gH;