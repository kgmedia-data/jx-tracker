const modulesmgr             = require('../basic/modulesmgr');
const common                 = modulesmgr.get('basic/common');
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
 const msMaxElapsed_ = 100000;
  function MakeOneHotspotMgr_(container, hsContainer, config, fcnVector) {
    var _styles = cssmgr.getRealCls(container);
    var _getAccTime = null;
    var _getCompHotspot = null;
    var _cfg = null;
    var _hsCtr = null;
    var _szObs = null;
    var _ovlDiv = null;
    var _hsJson = null;
    var _inProg = false; //whether a hotspot is in progress (this includes fetching)

    //the admgr side captures the hotspot info as HTML fragment.
    //we convert it to JSON here.
    var _extractHotspot = function(innerHTML) {
      let json = null;
      try {
        var el = document.createElement( 'html' );
        el.innerHTML = innerHTML;
        let url = el.getElementsByTagName('img')[0].src;
        let idx = url.indexOf('jxhotspot=');
        json = JSON.parse(decodeURIComponent(url.substring(idx+10)));
        json.url = url.substring(0, idx-1);
        json.clickurl = el.getElementsByTagName('a')[0].href;
      }
      catch(e) {
          console.log(e.stack);
          return null;
      }
      console.log(json);
      return json;
    }

    //handling the hotspot when the video area is changed
    var _resize = function() {
      let x = _hsCtr.offsetWidth;
      let y = _hsCtr.offsetHeight;
      let imgAR = _hsJson.width / _hsJson.height;
      let containerAR = x / y;

      let newHeight, newWidth;
      if (x >= _hsJson.width && y >= _hsJson.height) {
        newWidth = _hsJson.width;
        newHeight= newWidth / imgAR;
      } else {
        if (imgAR > containerAR) {
          newWidth = x;
          newHeight = newWidth / imgAR;
        } else {
          newWidth = _hsJson.width;
          newHeight = newWidth / imgAR;

          if (newHeight > y) {
            newHeight = y;
            newWidth = newHeight*imgAR;
          }
        }
      }
      if (_hsJson.maxheight > 0 && newHeight > _hsJson.maxheight) {
        newHeight = _hsJson.maxheight;
        newWidth = newHeight*imgAR;
      }
      _ovlDiv.style.width = newWidth + 'px';
      _ovlDiv.style.height = newHeight + 'px';
    }
    var _setupResizeListeners = function() {
      _szObs = new ResizeObserver(_resize);
      _szObs.observe(_hsCtr);
    }
    var _clearResizeListeners = function() {
      if (_szObs) {
        _szObs.unobserve(_hsCtr);
        _szObs = null;
      }
    }

    // one hotspot: (will be torn down when the time for that hotspot is finished)
    var _createOverlay = function() {
      if (!_ovlDiv) {
        _ovlDiv = document.createElement('div');
        _ovlDiv.className = `${_styles.oHotspot} ${_hsJson.position ? _hsJson.position : 'top-left'}`;

        // if (config.width && Number(config.width) > 0) _ovlDiv.style.width = config.width + 'px';
        // if (config.height && Number(config.height) > 0) _ovlDiv.style.height = config.height + 'px';
        // if (config.maxwidth && Number(config.maxwidth) > 0) _ovlDiv.style.maxWidth = config.maxwidth + 'px';
        // if (config.maxheight && Number(config.maxheight) > 0) _ovlDiv.style.maxHeight = config.maxheight + 'px';

        var img = document.createElement('img');
        img.src = _hsJson.url;

        if (_hsJson.clickurl) {
          common.addListener(_ovlDiv, 'click', function(e) {
            window.open(_hsJson.clickurl, '_blank');
            e.stopPropagation();
          });
        }

        _ovlDiv.appendChild(img);
        _hsCtr.appendChild(_ovlDiv);

        _setupResizeListeners();
      }
    }

    var _destroyOverlay = function() {
      _inProg = false;
      if (_ovlDiv) {
        _hsCtr.removeChild(_ovlDiv);
        _ovlDiv = null;
        _hsJson = null;
        _clearResizeListeners();
      }
    }
   
    //we fix this later. 
    //can we not use fetch ? 
    //Anyways No need of this feature for a long time
    /* var _fetchHostpot = function(url) {
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
    }*/
    var _fetchHotspot = function() {
      return Promise.reject();
    }
    
    //Manage the lifetime of a hotspot:
    //we are trying something different for hotspot
    //it runs its own timing and only get the accumulated time as it wishes.
    //so the playhead update in the main player code does not have to do
    //so many things.
    //we can be more coarse grained here (duration is not too important to be super exact)
    //Here it is 2sec
    //
    //in future, if we just go by elapsed time and not accumulated time, then then dun even 
    //need to care about accumulated time.
    var _runHotspot = function() {
      let startAcc = _getAccTime() + _cfg.delay;
      let endAcc = startAcc + _cfg.duration;
      let started = false;
      let msElapsed = 0;
      let iTimer = setInterval(function() {
        if (msElapsed > msMaxElapsed_) {
          //if the video is paused (no progression of accumulated time), we also takedown the hotspot after a while
          //to prevent the interval timer running for too long.
          clearInterval(iTimer);
          _destroyOverlay();
        }
        if (!started) {
          if (_getAccTime() > startAcc) {
            //console.log(`START __${_getAccTime()}`);
            started = true;
            _createOverlay();
          }
        }
        else { //started, then check if it is time to take the hotspot down.
          if (_getAccTime() > endAcc) {
            //console.log(`FINI __${_getAccTime()}`);
            clearInterval(iTimer);
            _destroyOverlay();
          }
        }
        msElapsed += 2000; 
      }, 2000);
    }
    //to trigger the fetching and then display of a hotspot.
    FactHSMgr.prototype.trigger = function() {
      if (_inProg) {
        //if hotspot is in progress (that includes fetching) then do not this.
        return;
      }
      _inProg = true;
      let hsHTML = _getCompHotspot();
      if (hsHTML) {
        let json = _extractHotspot(hsHTML);
        if (json) {
          _hsJson = json;
          _runHotspot();
          return;
        }
      }
      //nothing to show from the instream ad just now; then call to try fetch a hotspot then.
      let jsonProm =  _fetchHotspot(_cfg.hstagurl);
      jsonProm.then(function(json){
        _hsJson = json;
        _runHotspot();
      })
      .catch(function(e) {
        _inProg = false;
      });
    }
    // called between video change:
    FactHSMgr.prototype.reset = function() {
      _destroyOverlay();
    }
    function FactHSMgr(ctr, hsCtr, cfg, fcnVector) {
      _hsCtr = hsCtr;
      _cfg = cfg;
      _getAccTime = fcnVector.getAccTime;
      _getCompHotspot = fcnVector.getCompHotspot;
    }
    let ret = new FactHSMgr(container, hsContainer, config, fcnVector);
    return ret;
  }
module.exports = MakeOneHotspotMgr_;
  

/* 
 ************** module: video/hotspotmgr-factory*********************************************

* module.exports:
    - function which will make one hotspot object
     The object has the following public functions:
         currently only used in video/player-factory.js

* requires/dependencies:
    - none
*/