const modulesmgr             = require('../basic/modulesmgr');
const common                 = modulesmgr.get('basic/common');
const cssmgr                 = modulesmgr.get('video/cssmgr');

/**
 * 
 * @param {*} fcnVector: exposes some function so we can get some info from video player
 * config is not really used now
 * @returns 
 */
 const msMaxElapsed_ = 100000;
 const longDuration_ = 60*60;
 const defaultPosition_ = 'top-left';

  function MakeOneHotspotMgr_(container, hsContainer, config, fcnVector) {
    var _styles = cssmgr.getRealCls(container);
    var _getAccTime = null;
    var _getCompHotspot = null;
    var _cfg = null;
    var _hsCtr = null;
    var _szObs = null;
    var _ovlDiv = null;
    var _ovlPos = null;
    var _hsJson = null;
    var _iTimer = null;
    var _inProg = false; //whether a hotspot is in progress (this includes fetching)

    //the admgr side captures the hotspot info as HTML fragment.
    //we convert it to JSON here.
    var _extractHotspot = function(innerHTML) {
      let json = null;
      try {
        let parser = new DOMParser();
        var el = parser.parseFromString(innerHTML, 'text/html');
        let url = el.getElementsByTagName('img')[0].src;
        let idx = url.indexOf('jxhotspot=');
        json = JSON.parse(decodeURIComponent(url.substring(idx+10)));
        json.url = url.substring(0, idx-1);
        json.clickurl = el.getElementsByTagName('a')[0].href;
        
        /*  Sorry some testing...
        json.url = 'https://www.iab.com/wp-content/uploads/2014/09/iab-tech-lab-6-644x290.png';
        json.width = 300;
        json.height = 250;
        
        json.url = 'https://jx-creatives.s3.ap-southeast-1.amazonaws.com/demo/assets/hotspots/Lazada_animated_gif_500x112.gif';
        json.width = 500;
        json.height = 112;
        
        json.url = 'https://creatives.ivideosmart.com/hotspots/TokoIOT_1.gif',
        json.width = 300;
        json.height = 600;
        json.position = 'bottom-left';
        */
      }
      catch(e) {
          console.log(e.stack);
          return null;
      }
      return json;
    }

    //handling the hotspot when the video area is set or changed
    var _resize = function() {
      let x = _hsCtr.offsetWidth;
      let y = _hsCtr.offsetHeight;
      let imgAR = _hsJson.width / _hsJson.height;
      let containerAR = x / y;

      let w, h;
      if (x >= _hsJson.width && y >= _hsJson.height) {
        //totally fitting in
        w = _hsJson.width;
        h= _hsJson.height;
      } else {
        if (imgAR > containerAR) {
          w = x;
          h = w / imgAR;
        } else {
          w = _hsJson.width;
          h = _hsJson.height;
          if (h > y) {
            h = y;
            w = h*imgAR;
          }
        }
      }
      //this set of rules applies to video of 16:9
      //we will have another set of rules for other video shapes
      const maxPcts_ = [
        // I mean ... we can get more fine grained of course....
        
        //Meaning: if ar > 7, then we impose that the [height] of the hotspot cannot exceed [22%] of the height of the video
        //x:0 means we compare "not x (widht), but y (height)"
        { ar: 7, pct: 0.22, x: 0, margin: 0},

        //Meaning: if 7 >= ar > 1.2, then we impose that the [height] of the hotspot cannot exceed [15%] of the height of the video
        { ar: 1.2, pct: 0.15, x: 0, margin: 5},

        // similar explanations...
        { ar: 0.8, pct: 0.3, x: 0, margin: 5},
        { ar: 0, pct: 0.15, x: 1, margin: 5}
      ];
      let found = maxPcts_.find((e) => imgAR >= e.ar);  
      //sure have one that describes our lineup well:
      let val = (found.x ? w : h);
      let maxval = (found.x ? x*found.pct : y*found.pct);
      let mult = maxval/val; 
      if (mult < 1) { //then you need to shrink then coz exceeded 
        w = mult*w;
        h = mult*h;
      }
      _ovlPos.split('-').map(function(pos) {
        if (pos !== 'center') _ovlDiv.style[pos] = found.margin + 'px';
      });
      _ovlDiv.style.width = Math.round(w) + 'px';
      _ovlDiv.style.height = Math.round(h) + 'px';
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
        _ovlPos = _hsJson.position ? _hsJson.position : defaultPosition_;
        _ovlDiv = document.createElement('div');
        _ovlDiv.className = `${_styles.oHotspot} ${_ovlPos}`;

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
        _ovlPos = null;
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
      let startAcc = _getAccTime() + (_hsJson.time ? _hsJson.time: 0);
      let endAcc = startAcc + (_hsJson.duration ? _hsJson.duration: longDuration_);
      let started = false;
      let msElapsed = 0;
      _iTimer = setInterval(function() {
        if (msElapsed > msMaxElapsed_) {
          //if the video is paused (no progression of accumulated time), we also takedown the hotspot after a while
          //to prevent the interval timer running for too long.
          reset_();
        }
        if (!started) {
          if (_getAccTime() >= startAcc) {
            //console.log(`START __${_getAccTime()}`);
            started = true;
            _createOverlay();
          }
        }
        else { //started, then check if it is time to take the hotspot down.
          if (_getAccTime() >= endAcc) {
            //console.log(`FINI __${_getAccTime()}`);
            reset_();
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
      return; //we do not support the general type yet
      /*
      //nothing to show from the instream ad just now; then call to try fetch a hotspot then.
      let jsonProm =  _fetchHotspot(_cfg.hstagurl);
      jsonProm.then(function(json){
        _hsJson = json;
        _runHotspot();
      })
      .catch(function(e) {
        _inProg = false;
      });
      */
    }
    // called between video change:
    var reset_ = function() {
      if (_iTimer) {
        clearInterval(_iTimer);
       _iTimer = null;
      }
     _destroyOverlay();
     _inProg = false;
    }
    FactHSMgr.prototype.reset = function() {
      reset_();
    }
    function FactHSMgr(ctr, hsCtr, cfg, fcnVector) {
      _hsCtr = hsCtr;
      // we do not get the cfg from anywhere yet. That's for a later ticket
      _cfg = cfg;
      if (!_cfg) {
        _cfg = {};
      }
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
