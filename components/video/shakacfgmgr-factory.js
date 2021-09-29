
const modulesmgr            = require('../basic/modulesmgr');
const cssmgr                = modulesmgr.get("video/cssmgr");

function MakeOnePlayerCfgMgr_(container) {
    var _container = container;
    const hugeLength_ = 10000;

    //considering current video's aspect ratio and combining the options.restrictions's
    //maxheight, maxwidth, minheight,minwidth, we work out everything in terms of
    //height.

    var _vmaxheight = 0; //considering current video's aspect ratio
    var _vminheight = 0;
    var _scheme = 'auto'; //
    
    var _lastwidth = -1;
    var _lastheight = -1;
    var _heightsArr = [ 240, 360, 480, 720, 1280]; //default. Later will be changed by
    //reality.

    var _r = cssmgr.getOptions(container);
    if (_r && _r.restrictions) {
        _r = _r.restrictions;
    }
    else {
        _r = {};
    }
  
    if (window.location && window.location.hostname) {
        if (window.location.hostname.indexOf(".jixie.io") > -1) {
            _scheme = 'bitrateonly';
        }
    }

    function _getChangedSize(mustReturnObj = false) {
        if (mustReturnObj || (_container.offsetWidth != _lastwidth)) {
            _lastwidth = _container.offsetWidth;
            _lastheight = _container.offsetHeight;
            return {width: _container.offsetWidth, height: _container.offsetHeight};
        }
        return null;

    }
    // _r is the options from the page:
    FactoryOneHelper.prototype.changeVideo = function(AR, shakaPlayer) {
        // follow previous _scheme = 'auto';
        // let's translate everything to height then.
        let tmp = Math.min(
            _r.maxheight > 0 ? _r.maxheight: hugeLength_,
            _r.maxwidth > 0 ? _r.maxwidth/AR: hugeLength_);
        _vmaxheight = tmp == hugeLength_ ? 0: tmp;
        tmp = Math.max(
            _r.minheight > 0 ? _r.minheight: 0,
            _r.minwidth > 0 ? _r.minwidth/AR: 0);
        _vminheight = tmp > 0 ? tmp: 0;

        // Get all the available heights. So that we can give it a good 
        // height:
        let arr = shakaPlayer.getVariantTracks();
        if (arr) {
            _heightsArr = arr.map((track) => track.height); 
            _heightsArr = _heightsArr.filter((h) => 
            ((_vmaxheight == 0 || _vmaxheight >= h) &&
                (_vminheight == 0 || _vminheight <= h)));
            _heightsArr.sort(function(a, b){return a-b});
        }                            
    }
    function reset() {
    }

    FactoryOneHelper.prototype.filterTracks = function(tracksArr) {
        return tracksArr.filter((t) => 
            ((_vmaxheight == 0 || _vmaxheight >= t.height) &&
                (_vminheight == 0 || _vminheight <= t.height)));
    }    
   // they use click proxy 
   // which is under another campaign
   // obfuscate campaignid
    FactoryOneHelper.prototype.getNewCfgMaybe = function(forceHeightMaybe, forInit = false) {
        // write the answer into out.
        // will be based on everything.
        if (forceHeightMaybe > 0) {
            _scheme = 'user';
        }
        if (forceHeightMaybe == 0) {
            _scheme = 'auto';
        }
        let dim = _getChangedSize(forInit || forceHeightMaybe == undefined || forceHeightMaybe == 0);
        if (!dim) {
            if (forceHeightMaybe == undefined) 
                return null; //no change then nothing to do.
        }
        let skrobj = null;
        // the vheight should also take into account the strips (black strips)    
        if (forInit) {
            skrobj = {
                streaming: {
                    useNativeHlsOnSafari: false,
                    bufferingGoal: 5
                },
                abr: {
                    switchInterval: 5
                }
            };
            if (_scheme == 'auto')
                skrobj.abr.defaultBandwidthEstimate = 200000;
        }
        else {
            skrobj = { abr: {}};
        }
        skrobj.abr.enabled = _scheme == 'user' ? false: true; 
        if (_scheme == 'auto' && !forInit) {
            //at init we do not restrict them
            skrobj.abr.restrictions = {
                maxHeight : _getClosestDamHLSHeight(dim.height)
            };
            if (_vminheight) skrobj.abr.restrictions.minHeight = _vminheight;
        }
        return skrobj;
    }

    function FactoryOneHelper() {}
    function _getClosestDamHLSHeight(vheight) {
        for (var i = 0; i < _heightsArr.length; i++) {
            if (vheight <= _heightsArr[i]) {
                return _heightsArr[i];
            }
        }
        return _heightsArr[0];
    }
     let ret = new FactoryOneHelper();
    return ret;
};
module.exports = MakeOnePlayerCfgMgr_;


/* 
 ************** module: video/jxvideo-helper ******************************************
THIS IS NOT YET WRITTEN !!!
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
