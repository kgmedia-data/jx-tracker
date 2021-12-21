/*
GR 13: GR-54 and GR-82
*/

const defaultLongDuration = 60;
const modulesmgr                = require('../basic/modulesmgr');
const common                    = modulesmgr.get('basic/common');
const cssmgr                 = modulesmgr.get('video/cssmgr');
/**
 * 
 * @param {*} config 
 * assume the config could have the follow things:
 *  unit, delay, duration, limit
 *      hstagurl: the url to call (adserver) to try to get a hotspot to play
 *      (it is similar to adtagurl but the unit would be different etc; the response would be some json then)
 *      delay: the delay between a video ad and a hotspot
 *       duration: the duration to display the hotspot
 *       maxslots: Maximum number of hotspots
 * @returns 
 */
  function MakeOneHotspotMgr_(container, hsContainer, config, vectorFcn) {
    var _styles = cssmgr.getRealCls(container);

    var _vectorFcn = null;
    var _hsConfig = null;
    var _hsDetails = null;
    
    var _hsContainer = null;
    var _resizeObserver = null;
    var _overlayDiv = null;
    
    var _defaultStartTime = 0;
    var _isPlaying = false;
    var _isHSReady = false;

    var _prepareData = function() {
      _hsConfig.start  = _hsConfig.delay > 0 ? (_hsConfig.delay + _defaultStartTime) : _defaultStartTime;
      _hsConfig.stop = (_hsConfig.duration + _hsConfig.start);
      _isHSReady = true;
    }

    var _resizeHotspotFcn = function() {
      let x = _hsContainer.offsetWidth;
      let y = _hsContainer.offsetHeight;
      let imgAR = _hsDetails.width / _hsDetails.height;

      let newHeight, newWidth;
      if (x >= _hsDetails.width && y >= _hsDetails.height) {
        newWidth = _hsDetails.width;
        newHeight= newWidth / imgAR;
      } else {
        newWidth = (x - 10);
        newHeight = newWidth / imgAR;
      }
      _overlayDiv.style.width = newWidth + 'px';
      _overlayDiv.style.height = newHeight + 'px';

    }

    var _setupResizeListeners = function() {
      _resizeObserver = new ResizeObserver(_resizeHotspotFcn);
      _resizeObserver.observe(_hsContainer);
    }
    var _clearResizeListeners = function() {
      if (_resizeObserver) {
        _resizeObserver.unobserve(_hsContainer);
        _resizeObserver = null;
      }
    }

    var _createOverlay = function(config) {
      if (!_overlayDiv) {
        _overlayDiv = document.createElement('div');
        _overlayDiv.className = `${_styles.oHotspot} ${config.position ? config.position : 'top-left'}`;

        if (config.width && Number(config.width) > 0) _overlayDiv.style.width = config.width + 'px';
        if (config.height && Number(config.height) > 0) _overlayDiv.style.height = config.height + 'px';
        if (config.maxwidth && Number(config.maxwidth) > 0) _overlayDiv.style.maxWidth = config.maxwidth + 'px';
        if (config.maxheight && Number(config.maxheight) > 0) _overlayDiv.style.maxHeight = config.maxheight + 'px';

        var img = document.createElement('img');
        img.src = config.img_url;

        if (config.clickurl) {
          common.addListener(_overlayDiv, 'click', function(e) {
            window.open(config.clickurl, '_blank');
            e.stopPropagation();
          });
        }

        _overlayDiv.appendChild(img);
        _hsContainer.appendChild(_overlayDiv);

        _setupResizeListeners();
      }
    }

    var _destroyOverlay = function() {
      if (_overlayDiv) {
        _hsContainer.removeChild(_overlayDiv);
        _overlayDiv = null;
        _isHSReady = false;
      }
    }

    var _fetchHostpot = function(url) {
      var xhr = new XMLHttpRequest();
      xhr.ontimeout = function (e) {
        console.log('timeout reached when trying to get a hotspot')
      };
      xhr.addEventListener("readystatechange", function() {
        if(this.readyState === XMLHttpRequest.DONE) {
          let result = null;
          var status = xhr.status;
          if (this.responseText) {
            try {
              result = JSON.parse(this.responseText);
            }
            catch (err) {}
          }
          if (status >= 200 && status < 400) {
            console.log(result);
            // _prepareData(result);
          }
        }
      });
      xhr.open("GET", url);
      xhr.timeout = 20000;
      xhr.send();
    }

    //the cb is a function furnished by the caller . well something to turn on the sound loh...
    FactHSMgr.prototype.setVisibility = function(makeVisible) {
        // i'd imagine sometimes when the next ad (midroll) comes on, then
        // we need to hide the hotspot ah
    }

    FactHSMgr.prototype.playheadUpdateCB = function(playhead) {
      console.log(playhead, _hsConfig)
      if (playhead >= _hsConfig.start && playhead < _hsConfig.stop) {
        _createOverlay(_hsDetails);
      } else if ((playhead >= _hsConfig.stop || playhead < _hsConfig.start)) {
        _destroyOverlay();
      }
    }

    FactHSMgr.prototype.isHSReady = function() {
      return _isHSReady;
    }

    FactHSMgr.prototype.isPlaying = function() {
      // boolean: is it having something to show right now
      return _isPlaying;
    }
    /*
    what is in the "details" of a hotspot ? 
    There is not much info about this thing currently.

    I guess we need to let it evolve as Fery you actually implements the thing
    The simple one (just a picture):
    
    -URL of the graphic file (at start hotspot just a graphic file; perhaps animated gif;
          but any animation is in the file itself)

    -click link (I am thinking let this be a click proxy then:
        i.e. it will be a traid link which then redirects to the product webpage
        then we don't need 2 links one for product one for reporting)

    position (which corner) top-left, top-right, bottom-left, bottom-right
    i am thinking (just me), the hotspot does not necessary is a horizontal strip,
    it could be a vertical one .
    
    -what is unclear is the scalability (coz video area can vary)
        i.e. should we specificy its width (or height) as a percentage of the video width (or height)

    -may be a maxwidth or maxheight of the thing
    
    -Also whether we need the width and height of the image (or we can wait till it is loaded then we know)

    -Or simpler...... just do the natural size of the hotspot graphic (if video area is large enough)
    and only "shrink" if necessary (video cannot fit it)

    ----
    Checklist for things to be careful about:
    - if the hotspot is there and video size changes what will happen (esp big in article -> small)
    - if change video, make sure nothing is dangling there
    - frankly it is not clear to me how to coexist with the sound indicator

    and ... we also need to know the growth of accumulated time ... aaah .
    so need some other api too. accutime change.
    or the player side give us a function to query the accumuated time
    (then this hotspot thing can do so lazily with a loose timer)
        
    */
    // Currently will be called by player code when the ad ended:
    FactHSMgr.prototype.trigger = function(hsDetails = null) {
      /*
      if hsDetails is there, then use it
      Else need to call adserver to get the hotspot (the support is not there yet)
          To Fery: don't worry about this for now, just hard code hsDetails to do your development
      If there is nothing to play then just do nothing then.
      Else after the "delay", then let the hotspot appear then.
      */
     _defaultStartTime = _vectorFcn.getAccumulatedTime();
      if (hsDetails) {
        _hsDetails = hsDetails;
        _prepareData();
      } else {
        console.log('calling hstagurl');
        if (_hsConfig.hstagurl) _fetchHostpot(_hsConfig.hstagurl);
      }
    }
    // dunno. just have it just in case for now.
    FactHSMgr.prototype.forceStop = function() {
    }
    // called between video change:
    FactHSMgr.prototype.reset = function() {
      if (_overlayDiv) _hsContainer.removeChild(_overlayDiv);
      _clearResizeListeners();

      _isHSReady = false;
      _isPlaying = false;
      _hsDetails = null;
      _overlayDiv = null;
    }
    function FactHSMgr(container, hsContainer, config, vectorFcn) {
      _hsContainer = hsContainer;
      _hsConfig = config;
      _vectorFcn = vectorFcn;
      _defaultStartTime = 0;
    }
    let ret = new FactHSMgr(container, hsContainer, config, vectorFcn);
    return ret;
  }
module.exports = MakeOneHotspotMgr_;

/* 
 ************** module: video/soundind-factory*********************************************

* module.exports:
    - function which will make one hotspot object
     The object has the following public functions:
         currently only used in video/player-factory.js

* requires/dependencies:
    - none
*/