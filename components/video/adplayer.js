
/**
 * a component used to build the JS that will play a video ad (universal unit)
 * and standalone 
 * i.e. plays the role of jxvideo1.3.min.js and jxvideo1.4.mins.js
 */
const modulesmgr            = require('../basic/modulesmgr');
const _helpers              = modulesmgr.get('video/helpers');
const MakeOneAdObj          = modulesmgr.get('video/admgr-factory');
const MakeOneSpinner        = modulesmgr.get('video/spinner-factory');

//so we should have stub for all of them.
//We can build the new counterpart for jxvideo1.3.min.js
//to use vast-dummy.js and horizbanner-factory-dummy.js
//then we can build a linear JS file
//different from the one used by our universal-lite/osm
const MakeOneReplayBtn      = modulesmgr.get('video/replaybtn-factory');
const MakeOneHorizBanner    = modulesmgr.get('video/horizbanner-factory');
const buildVastXml          = modulesmgr.get('video/vast').buildVastXml;

const cssmgr                = modulesmgr.get('video/cssmgr');
const adDivCls              = cssmgr.getRealCls('adDivCls');
const comboDivCls           = cssmgr.getRealCls('comboDivCls');
const contentDivCls         = cssmgr.getRealCls('contentDivCls');
const playerCls             = cssmgr.getRealCls('playerCls');
const thumbnailCls          = cssmgr.getRealCls('thumbnailCls');
const hideCls               = cssmgr.getRealCls('hideCls');
const commonBigPlayBtnCls   = cssmgr.getRealCls('commonBigPlayBtnCls');
 
// Add a listener of the event to the element e which calls the function handler h
// General helper funciton
function addListener(e, event, h) {
    if (e.addEventListener) {
        //console.log('adding event listener');
        e.addEventListener(event, h, false);
    } else if (e.attachEvent) {
        e.attachEvent('on' + event, h);
    } else {
        e[ 'on' + event] = h;
    }
}

function MakeOneInst_(containerId, data, config = null, eventsVector = null) {
    var _pDiv               = null;
    var _playerElt          = null;
    var _comboDiv           = null;
    var _thumbnailDiv       = null;
    /* var _bigPlayBtn         = null; */
    var _context            = null;

    var _spinner            = null;
    var _replayBtn          = null;
    
    var _adObj              = null;
    var _env = null;

    var _eventsVector       = [];
    var _containerId        = null;

    var _videoSrc           = null; 

    var _boundImgLoadedFcn  = null;

    /**
     * 
     * @param {*} containerId 
     */
    function _createInner(containerId) {
        let tmp = document.getElementById(containerId);
        if (!tmp) {
            tmp = document.body;
        }
        
        _pDiv = _helpers.newDiv(tmp,'div','',''); 
        _pDiv.style.width = '100%';
        _pDiv.style.height = '100%';
        _pDiv.style.position = 'relative';
        
       //combo div is ad or content.
       _comboDiv = _helpers.newDiv(_pDiv, "div", "", comboDivCls); //this is not the real ad div
       _contentDiv = _helpers.newDiv(_comboDiv, 'div', `<video id="idJxPlayer" class=${playerCls} controls muted playsinline></video>`, contentDivCls); 
       _contentDiv.classList.add(hideCls);

       if (_env) {
           if (_env.defaultImage) {
               _thumbnailDiv = _helpers.newDiv(_comboDiv, "img", null, thumbnailCls);
               _thumbnailDiv.style.cursor = 'pointer';
               if (_env.clickurl){
                   _helpers.addListener(_thumbnailDiv, 'click', function() {
                       window.open(_env.clickurl, '_blank');
                   });
               }
               if (_env.defaultImage && _env.defaultImage != _thumbnailDiv.src) {
                   _boundImgLoadedFcn = imgLoadedFcn.bind({ img: _thumbnailDiv, cb: _hideSpinner});
                   _thumbnailDiv.addEventListener('load', _boundImgLoadedFcn);
                   _thumbnailDiv.src = _env.defaultImage; 
                   if (_thumbnailDiv.complete) {
                       _boundImgLoadedFcn();
                   }
               }
           }
           if (_env.video)
            _videoSrc = _env.video;
           //_videoSrc = 'https://creative-ivstream.ivideosmart.com/3001004/1181736/3001004-1181736_360.mp4'; // HACK
       }

       _playerElt = document.getElementById('idJxPlayer');
       addListener(_playerElt, 'ended', _onContentEnded);
       //pretend there is a content:
       //just to test the content stuff can work and show properly if we need to
       if (_videoSrc) _playerElt.src = _videoSrc;
    }

    var _manualReplayCB = function() {
        if (_replayBtn) _replayBtn.hide();
        _doReplay();
    }

    var _onAdEnded = function() {
        if (_env.loop === 'manual') {
            if (!_replayBtn) {
                _replayBtn = MakeOneReplayBtn(_comboDiv, _env.stripPosition, _manualReplayCB)
            } else {
                _replayBtn.show();
            }
        } else if (_env.loop === 'auto') {
            _doReplay();
        }
        else if (_context != 'content' && _videoSrc) {
            _context = 'content';
            _contentDiv.classList.remove(hideCls);
            _playerElt.play();
        } else if (_thumbnailDiv) {
            _thumbnailDiv.classList.remove(hideCls);
        } else {
            parent.postMessage("jxadended", '*');
        }
    }

    var _onContentEnded = function() {
        _context = null;
        if (_thumbnailDiv) _thumbnailDiv.classList.remove(hideCls);
        else { //nothing to do to show. bye close shop
            parent.postMessage("jxadended", '*');
        }
    }

    var _showSpinner = function() {
        if (_spinner) _spinner.show();
    }

    var _hideSpinner = function() {
        if (_spinner) _spinner.hide();
    }


    var _vectorForAdMgr = {
        report : function() {},
        setContentMuteState: function() {},
        isPaused: function() { return false; },
        hideSpinner: function() {
            _hideSpinner();
        },
        onAdPause: function() {},
        onAdPlaying: function() {},
        switch2Cnt: function() {
            _onAdEnded();
        },
        switch2Ad: function() {
            console.log("switch2Ad was called!");
            //WAS _playerElt.pause();
            _context = 'ad';
            _showSpinner();
            if (_thumbnailDiv) _thumbnailDiv.classList.add(hideCls)
            parent.postMessage("jxhasad", '*'); 
            _playerElt.pause();
        }
    };         
    //What is this for and when is this used?  
    /* 
    var _createBigPlayBtn = function() {
        if (!_bigPlayBtn) {
            _bigPlayBtn = document.createElement("a");
            _bigPlayBtn.href = "javascript:void(0)";
            _bigPlayBtn.className = commonBigPlayBtnCls;
            _bigPlayBtn.onclick = function() {
                _playerElt.muted = false;
                _playerElt.volume = 1;
                if (_thumbnailDiv) _thumbnailDiv.classList.add(hideCls);
                if (_adObj) _adObj.startAd();
                _bigPlayBtn.classList.add(hideCls);
            }
            _comboDiv.appendChild(_bigPlayBtn);
        }
    };*/

    var imgLoadedFcn = function() {
        try {
        this.img.removeEventListener('load', _boundImgLoadedFcn);
        }
        catch(ee) {}
        _boundImgLoadedFcn = null;
        if (this.cb) {
            this.cb();
        }
    }    
   
    /**
     * 
     * @param {*} isVisible 
     */
     OneAdInstance.prototype.visibilityChange = function(isVisible) {
        /////console.log(`OneAdInstance.prototype.visibilityChange = ${isVisible} ${_context} `);
        if (_adObj && _context === 'ad') {
            if (isVisible) {
                _adObj.playOrStartAd(); //ok this one so far is only in the admgr-factory-bc version only aaarh
            }
            else {
                _adObj.pauseAd();
            }
        } else if (_context === 'content') {
            if (isVisible) {
                _playerElt.play();
            }
            else {
                _playerElt.pause();
            }
        }
    }

    function updateUniversal(v) {
        let e;
        let msg = null;
        if (v == 'jxadstarted' || v == 'jxhasad') {
            _context = 'ad';
            msg = 'jxhasad'
            e = new Event('jxhasad');
        }
        else if (v == 'jxaderrored' || v == 'jxnoad') {
            msg = 'jxnoad';
            e = new Event('jxnoad');
        }
        if (msg) {
            parent.postMessage("jxhasad", '*'); 
        }
        if (e) {
            window.dispatchEvent(e);
        } 
        _hideSpinner();

    }
    function doNothing() {}

    function _doReplay() {
        setTimeout(function() {
            let vast = buildVastXml([_vastSrcBlob], true);//second param is SUPPRESS trackers
            _adObj.setAutoAdsManagerStart(true); //since this is the second round, just play
            _adObj.makeAdRequestFromXMLCB(vast, true, true, doNothing);
        }, 0);
    }

    var _vastSrcBlob = {};
    /**
     * 
     * @param {*} data 
     */
    OneAdInstance.prototype.changeJson = function(crData) {
        let adparameters = crData.adparameters;
        if (_adObj) {
            _adObj.reset();
        }
        //_playerElt.src = 'https://creative-ivstream.ivideosmart.com/3001004/954006/3001004-954006_480.mp4';
        let tmp = document.getElementById(_containerId);
        if (!tmp) {
            tmp = document.body;
        }
        //companion banner 
        let comp = { height: 0 }; 
        ['top', 'bottom'].forEach(function(banner){
            let label = banner+'banner';
            if (adparameters[label]) {
                comp[banner] = {};
                comp[banner] = JSON.parse(JSON.stringify(adparameters[label]));
                comp[banner].tracker4click = adparameters.trackers.baseurl + '?' + adparameters.trackers.parameters + '&action=click';
                comp.height += comp[banner].height;
            }
        });
        //ends up not very useful:
        let blob = {
            token : _containerId
        }
        if (comp.height) { //i.e. there is a companion banner:
            //for video banner video case it is not responsive
            //we will do the size "as is"
            blob.width = adparameters.video.width;
            blob.height = adparameters.video.height;
            blob.companion = comp;
            ['top','bottom'].forEach(function(pos) {
                if (blob.companion[pos]) {
                    MakeOneHorizBanner(_comboDiv, blob, pos);
                }
            });
        }
        else {
            blob.width = tmp.offsetWidth; 
            blob.height = tmp.offsetHeight;
        }
        _comboDiv.style.width = blob.width +'px';
        _comboDiv.style.height = blob.height + 'px';
            
        _adObj = MakeOneAdObj(_comboDiv,  _playerElt, _vectorForAdMgr, _env.controls);
        if (_eventsVector) {
            _adObj.subscribeToEvents(
                _eventsVector, function(jxname) {
                    let e = new Event(jxname);
                    window.dispatchEvent(e);
                    //console.log(`-CB--- adplayer.js ${jxname} ---- `);
                }); 
        }
        _vastSrcBlob = crData;

        //HACK for testing SIMID
        if (crData.jxsimidurl) {
            _vastSrcBlob.subtype = 'vsimid';
            _vastSrcBlob.url = 'https://creatives.b-cdn.net/jx/jxsimidhybrid.min.html'; //crData.jxsimidurl;
        }
        /////console.log(`VAST FODDER: ${crData.id}, ${crData.name} ,${crData.duration}, ${crData.clickurl}`);
        let vast = buildVastXml([_vastSrcBlob]);
        //for use of the jxvideo1.3.js ("SDK"): autopause is false, so depends on autoplay flag
        //for use from within our jixie universal (or lite, then we are autoplay and dependent
        //on jxvisible (autopause == true)
        //basically non-autoplay does not work now lah.
        //So it is driven by API?
        _adObj.setAutoAdsManagerStart(
            _env.autopause? (false) : ( _env.autoplay ? true : false) ); 
        _adObj.makeAdRequestFromXMLCB(vast, true, true, updateUniversal);
    }//

    /**
     * Combine the various sources of info into a normalized JSON
     * make the subsequent code cleaner.
     * @param {*} cr 
     * @param {*} u 
     * @returns an object with some key info
     *    autoplay, controls (color, position), stripPostion, loop, clickurl,
     *    defaultImge
     */
    function extractEnv(cr, config) {
        let out = {
            autoplay : true,
            autopause: true, //i.e. use the jxvisibility stuff
            controls: {
                color: '#000000',
                position: 'left'
            },
            stripPosition: 'right',
            loop: 'none'
        };
        if (cr.clickurl)  {
            out.clickurl = cr.clickurl;
        }
        let u = config;
        if (!u) {
            u = cr.universal;
        }
        if (u) {
            //if called from the jxvideoadsdk-lite (i.e. the successor of
            //jxvideo1.3.min.js) then autopause is set to false
            //i.e. we dun do those visiblity stuff for you.
            //we either autoplay (no matter what) or click to play
            if (u && u.hasOwnProperty('autopause')) {
                if (Boolean(u.autopause) == false) {
                    out.autopause = false;
                }
            }
            if (u.defaultImage) {
                out.defaultImage = u.defaultImage;
            }
            if (Array.isArray(u.videos) && config.length > 0) {
                out.video = u.videos[0];
            }
            if (u.controlsColor) {
                out.controls.color = u.controlsColor
            }
            if (u.controlsPos) {
                out.controls.position = u.controlsPos;
            }
        }
        if (u && u.hasOwnProperty('autoplay')) {
            if (Boolean(u.autoplay) == false) {
                out.autoplay = false;
            }
        }
        else if (cr.adparameters && cr.adparameters.hasOwnProperty('autoplay')) {
            if (Boolean(cr.adparameters.autoplay) == false) {
                out.autoplay = false;
            }
        }
        if (cr.adparameters && cr.adparameters.loop) {
                out.loop = cr.adparameters.loop;
        } else if (u && u.loop) {
                out.loop = false;
        }
        if (cr.adparameters && cr.adparameters.countpos) {
            out.stripPosition = cr.adparameters.countpos;
        }
        delete cr.adparameters.loop;
        return out;
     }
    /**
     * 
     */
    OneAdInstance.prototype.play = function() {
        if (_adObj)
            _adObj.startAd();
    }

    function OneAdInstance(containerId, crData, config = null, eventsVector = null) {
        _token = containerId;
        _containerId        = containerId;
        if (eventsVector) {
            _eventsVector       = JSON.parse(JSON.stringify(eventsVector));
        }
        
        _spinner = MakeOneSpinner(document.getElementById(_containerId) ? document.getElementById(_containerId) : document.body);
        _showSpinner();

        _env = extractEnv(crData, config);

        _createInner(containerId);
        this.changeJson(crData);
    }

    /**
     * triggered from universal
     * @param {*} action 
     */
    OneAdInstance.prototype.notifyMe = function(action) {
        if (action == 'jxvisible')
            this.visibilityChange(true);
        else if (action == 'jxnotvisible')
            this.visibilityChange(false);
    }

    let ret = new OneAdInstance(containerId, data, config, eventsVector);
    return ret;
}

module.exports = MakeOneInst_;
