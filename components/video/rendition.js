
const modulesmgr            = require('../basic/modulesmgr');

// Also cover choice of thumbnail too?
//getSelections
//change select (verb imperative) --METHOD, RENDITION this will trigger the needed.

// initialize is only with 
function MakeOneRenditionsHelperObj_() {
    // there is the options object.
    // container
    // options <-- restrictions.
    // available (FROM DAM)
    // renditions helper.
    // selection array (after applying the restrictions from publisher)
    // constructor (container, options) this will not change from video to video
    // reset or update 
  
    const hugeLength_ = 2000;
    //considering current video's aspect ratio and combining the options.restrictions's
    //maxheight, maxwidth, minheight,minwidth, we work out everything in terms of
    //height.

    var _vmaxheight = 0; //considering current video's aspect ratio
    var _vminheight = 0;
    var _scheme = 'auto'; //
    var _sizeGetterFcn = null;
    var _AR = 1; //video AR

    var _lastwidth = -1;
    var _lastheight = -1;

    function _getChangedSize(mustReturnObj = false) {
        if (mustReturnObj || (_container.offsetWidth != _lastwidth)) {
            _lastwidth = _container.offsetWidth;
            _lastheight = _container.offsetHeight;
            return {width: _container.offsetWidth, height: _container.offsetHeight};
        }
        return null;

    }
    function changeVideo(AR, renditions, sizeGetterFcn) {
        // follow previous _scheme = 'auto';
        // let's translate everything to height then.
        let tmp = Math.min(
            _r.maxheight > 0 ? _r.maxheight: hugeLength_,
            _r.maxwidth > 0 ? _r.maxwidth/_AR: hugeLength_);
        _vmaxheight = tmp == hugeLength_ ? 0: tmp;
        tmp = Math.max(
            _r.minheight > 0 ? _r.minheight: 0,
            _r.minwidth > 0 ? _r.minwidth/_AR: 0);
        _vminheight = tmp > 0 ? tmp: 0;
        _renditions = renditions.slice();
        _renditions = _renditions.filter((h) => (_vmaxheight == 0 || h <= _vmaxheight) && r >= _vminheight);
        // we sort it in descending .. TODO
    }
    // something to set the scheme.
    // TODO
    //if we can combine the 2 into 1 then better
    // a bandwidth or 
    function getSelections(shakaPlayer) {

        return _renditions;
    }       
    function getSelected() {
        return _selectedRendition; // can be -1
    }
    function reset() {
    }
    // 
    function execCfgOnPlayer(_shakaPlayer) {
        makeShakaConfigObj(forInit) {

        if (iOS) {
            // we use funny way to force.

        }
        else {

        }
    }
    // user , bitrate
    function makeShakaConfigObj(forInit) {
        // write the answer into out.
        // will be based on everything.
        let dim = _getChangedSize(forInit);
        if (!dim) return null; //no change then nothing to do.
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
            if (_scheme == 'user')
                skrobj.abr = 0; //????? 
        }
        else {
            skrobj = { abr: {}};
        }
        skrobj.abr.enabled = _schema == 'user' ? false: true; 
        if (_scheme == 'auto') {
            skrobj.maxHeight = getClosestDamHLSHeight_(dim.height);
            if (_vminheight) skrobj.minHeight = _vminheight;
        }
        return skrobj;
    }

    function FactoryOneHelper() {}
    function getClosestDamHLSHeight_(vheight) {
        for (var i = 0; i < _renditions.length; i++) {
            if (vheight <= _renditions[i]) {
                return _renditions[i];
            }
        }
        return _renditions[0];
    }
     let ret = new FactoryOneHelper();
    return ret;
};
module.exports = MakeOneRenditionsHelperObj_


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
