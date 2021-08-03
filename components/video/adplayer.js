//need to reigster for 
//need to listen to skip event
/**
 * a component used to build the JS that will play a video ad (universal unit)
 * and standalone 
 * i.e. plays the role of jxvideo1.3.min.js and jxvideo1.4.mins.js
 */
const modulesmgr            = require('../basic/modulesmgr');
const common                = modulesmgr.get('basic/common');
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
const commonBigPlayBtnCls   = cssmgr.getRealCls('bigPlayBtnCls'); //commonBigPlayBtnCls');
 
//of all the subscribable stuff for jxvideo1.3.min.js, this subset 
//we need from the admgr layer (IMA based)
const imaEventsSubset_ =[ 
    "jxadended", 
    "jxadfirstQuartile",
    "jxadthirdQuartile",
    "jxadmidpoint",
    "jxadskipped", 
    "jxadalladscompleted",
    "jadclick", 
    "jxadimpression",
    "jxadstart"
];

function MakeOneInst_(containerId, data, config = null, eventsVector = null) {
    var _adOutcomePromise = null;
    var _adOutcomeResolveFcn = null;
        
    var _pDiv               = null;
    var _playerElt          = null;
    var _comboDiv           = null;
    var _thumbnailDiv       = null;
    var _bigPlayBtn         = null; 
    var _context            = null;
    var _adReqParams        = {};

    var _spinner            = null;
    var _replayBtn          = null;
    
    var _adObj              = null;
    var _env                = null;

    var _eventsVector       = [];
    var _containerId        = null;

    var _videoSrc           = null; 

    var _boundImgLoadedFcn  = null;

    //What is this for and when is this used?  
    //can start or not.
    var _createBigPlayBtn = function(boundCB) {
        if (!_bigPlayBtn) {
            _bigPlayBtn = document.createElement("a");
            _bigPlayBtn.href = "javascript:void(0)";
            _bigPlayBtn.className = commonBigPlayBtnCls;
            _bigPlayBtn.onclick = function() {
                //_playerElt.muted = false;
                //_playerElt.volume = 1;
                //if (_thumbnailDiv) _thumbnailDiv.classList.add(hideCls);
                //if (_adObj) _adObj.playOrStartAd();
                _bigPlayBtn.classList.add(hideCls);
                boundCB();
            }
            _comboDiv.appendChild(_bigPlayBtn);
        }
    };
    /**
     * 
     * @param {*} containerId 
     */
    function _createInner(containerId) {
        let tmp = document.getElementById(containerId);
        if (!tmp) {
            tmp = document.body;
        }
        
        _pDiv = common.newDiv(tmp,'div','',''); 
        _pDiv.style.width = '100%';
        _pDiv.style.height = '100%';
        _pDiv.style.position = 'relative';
        
       //combo div is ad or content.
       _comboDiv = common.newDiv(_pDiv, "div", "", comboDivCls); //this is not the real ad div
       _contentDiv = common.newDiv(_comboDiv, 'div', `<video id="idJxPlayer" class=${playerCls} controls muted playsinline></video>`, contentDivCls); 
       //WHY DO THIS HERE ?? _contentDiv.classList.add(hideCls);

       if (_env) {
           if (_env.defaultImage) {
               _thumbnailDiv = common.newDiv(_comboDiv, "img", null, thumbnailCls);
               _thumbnailDiv.style.cursor = 'pointer';
               if (_env.clickurl){
                    common.addListener(_thumbnailDiv, 'click', function() {
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
       }
       _playerElt = document.getElementById('idJxPlayer');
       common.addListener(_playerElt, 'ended', _onContentEnded);
    }

    var _manualReplayCB = function() {
        if (_replayBtn) _replayBtn.hide();
        _adObj.playAd();
    }
    var _doManualReplay = function() {
        if (!_replayBtn) {
            _replayBtn = MakeOneReplayBtn(_comboDiv, _env.stripPosition, _manualReplayCB)
        } else {
            _replayBtn.show();
        }
    }
    var _onAdEnded = function() {
        _env.repeat = true; //now is not the first time already.
        if (_env.loop === 'auto' || _env.loop === 'manual') {
            _doReplay();
        }
        else if (_context != 'content' && _videoSrc) {
            _context = 'content';
            _contentDiv.classList.remove(hideCls);
            _playerElt.play();
        } else if (_thumbnailDiv) {
            _thumbnailDiv.classList.remove(hideCls);
        } else {
            //This one is for the universal unit to get 
            //If player sdk (jxvideo1.3.min.js) then this
            //is just wasted 
            //wait .... we have to subscribe to it bah.
            //for the case of universal.
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
        //if (_spinner) _spinner.show();
    }

    var _hideSpinner = function() {
        //if (_spinner) _spinner.hide();
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
            _context = 'ad';
            _showSpinner();
            if (_thumbnailDiv) _thumbnailDiv.classList.add(hideCls)
            _playerElt.pause();
        }
        //what if there is no content video
        //and the setting is cannot autoplay anything.
        //How would we know .... that we are in a cannot play situation?
        //add a big play button.
    };         
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
   
    var _cannotAuto = false;
    function startPlayWrapper(cb) {
        if (_cannotAuto) {
            _createBigPlayBtn(function() {
                _cannotAuto = false;
                cb();
            });
        }    
        else {
            cb();
        }
    }
    
    /**
     * 
     * @param {*} isVisible 
     */
     OneAdInstance.prototype.visibilityChange = function(isVisible) {
        //console.log(`OneAdInstance.prototype.visibilityChange = ${isVisible} ${_context} `);
        if (_adObj && _context === 'ad') {
            if (isVisible) {
                startPlayWrapper(function(){
                    _adObj.playOrStartAd();
                });
            }
            else {
                _adObj.pauseAd();
            }
        } else if (_context === 'content') {
            if (isVisible) {
                startPlayWrapper(function(){
                    _playerElt.play();
                });           
            }
            else {
                _playerElt.pause();
            }
        }
    }

    //v is the value given to the callback on the adcall
    function adOutcomeCB(v) {
        let e = null;
        let msg = null;
        if (v == 'jxadstarted' || v == 'jxhasad') {
            _context = 'ad';
            msg = 'jxhasad';
        }
        else if (v == 'jxaderrored' || v == 'jxnoad') {
            msg = 'jxnoad';
        }
        if (msg == 'jxhasad' && _eventsVector.indexOf('jxhasad') > -1) {
            e = new Event('jxhasad');
        }
        if (msg == 'jxnoad' && _eventsVector.indexOf('jxnoad') > -1) {
            e = new Event('jxnoad');
        }
        _autoplayTestProm.then(function(val) {
            _cannotAuto = val != 'pass';
            if (e) {
                window.dispatchEvent(e);
            }
            //if used in the universal context this is the one
            //which is important: we are in an iframe
            if (msg) {
                parent.postMessage(msg, '*'); 
            }
        });
        _hideSpinner();

    }
    function doNothing() {}

    //the replay is also dependent on the whatever it is
    function _doReplay() {
        setTimeout(function() {
            _makeAdRequest(_adReqParams, true);//last params is isRepeat
        }, 0);
    }

    /**
     * a generic way to make ad call. whether from creative JSON (we compose
     * the vast on the fly : possibly due to needing to do loop, suppress tracker stuff)
     * or it can be from ad tag url or ad tag xml
     */
    var _adReqParams = {};
    var _makeAdRequest = function(adReqParams, isRepeat) {
        let crData = adReqParams.crJson;
        let autoStart = isRepeat;
        let cb = isRepeat ? doNothing: adOutcomeCB;


        ///autoStart = false; //HACK HACK HACK HACK CANNOT AUTOSTART AH.

      // OK We are making the ad call now:
      if (crData) {
        //This is those Jixie ads and we construct the vast XML from the JSON
        //
        let vastSrcBlob = crData;
        //For testing SIMID... Normally won't come here
        if (crData.jxsimidurl) {
            _vastSrcBlob.subtype = 'vsimid';
            _vastSrcBlob.url = 'https://creatives.b-cdn.net/jx/jxsimidhybrid.min.html'; //crData.jxsimidurl;
        }
        /////console.log(`VAST FODDER: ${crData.id}, ${crData.name} ,${crData.duration}, ${crData.clickurl}`);
        // if isRepeat, then suppress the trackers: (second arg)
        let vast = buildVastXml([vastSrcBlob], isRepeat);
        _adObj.setAutoAdsManagerStart(autoStart); 
        _adObj.makeAdRequestFromXMLCB(vast, true, true, cb);
    }
    else {
        _adObj.setAutoAdsManagerStart(autoStart); 
        if (adReqParams.tag) {
            _adObj.makeAdRequestCB(adReqParams.tag, true, true, cb);
        }
        else if (adReqParams.xmltag)
            _adObj.makeAdRequestFromXMLCB(adReqParams.xmltag, true, true, cb);
        }
    }
    //we need to know we will have problem with the ad.
    
    var _setContainerSize = function(width, height) {
        if (width == 0) {
            _comboDiv.style.width = '100%'; 
            _comboDiv.style.height = '100%';
        }
        else {
            _comboDiv.style.width = width +'px';
            _comboDiv.style.height = height + 'px';
        }
    }
    var _triggerAd = function(crData, config) {
        let adparameters = crData ? crData.adparameters: {};
        if (_adObj) {
            _adObj.reset();
        }
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
        let blob = {
            //token : _containerId
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
        else if (config && config.width && config.height) {
            //force us to hard code the dims
            blob.width = config.width;
            blob.height = config.height;
        }
        else {
            //follow container
            blob.width = 0; 
            blob.height = 0;
        }
        _setContainerSize(blob.width, blob.height);
        if (crData || config.tag || config.xmltag) {            
            _adReqParams = {};
            if (config && config.xmltag) _adReqParams.xmltag = config.xmltag;
            else if (config && config.tag) _adReqParams.tag = config.tag;
            else if (crData) _adReqParams.crJson = crData;
            
            if (!_adObj) {
                //the last param is about whether to do process bar:
                _adObj = MakeOneAdObj(_comboDiv,  _playerElt, _vectorForAdMgr, _env.controls, false);
                if (blob.width && blob.height) {
                    _adObj.forceDimensions(blob.width, blob.height);
                }
                //even if the sdk caller does not want to listen to anything
                //we still need to listen to these things:
                _imaEventsWeNeed_ = ['jxadstart', 'jxadended', 'jxadskipped'];//internally we also need some
                let combined = _imaEventsWeNeed_.concat(_eventsVector ? _eventsVector: []);
                //Remove duplicates:
                combined = combined.filter(function(item, pos, self) {
                    return self.indexOf(item) == pos;
                });
                let imaSubset = combined.filter((e) => imaEventsSubset_.indexOf(e)> -1);
                _adObj.subscribeToEvents(
                    imaSubset, 
                    function(jxname) {
                        //console.log(` ___.^.^.^.^.^.^.^ adplayer.js ${jxname}`);
                        if (jxname == 'jxadstart') {
                            if (_env.loop == 'manual' && _env.repeat) {
                                _adObj.pauseAd();
                                _doManualReplay();
                            }
                        }
                        else if (jxname == 'jxadskipped') {
                            _env.loop = 'none';
                            //make sure we do not play the ad another time round.
                        }
                        else if (jxname == 'jxadended' && _env.loop != 'none') {
                            //we don't fire the adend then.
                            //I think we should also suppress the other events
                            //when we are in a repeat too.
                            //unless it is a click
                            return;
                        }   
                        if (_eventsVector.indexOf(jxname) > -1) {
                            window.dispatchEvent(new Event(jxname));
                            console.log(`-FROM IMA CB--- adplayer.js ${jxname} ---- `);
                        }
                    }
                ); //subscribe to events to admgr factory.
            }
            _makeAdRequest(_adReqParams, false);
        }
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
            controls: {
                color: '#000000',
                position: 'left'
            },
            stripPosition: 'right',
            loop: 'none'
        };
        if (cr && cr.clickurl)  {
            out.clickurl = cr.clickurl;
        }
        let u = config;
        if (!u && cr) {
            u = cr.universal;
        }
        if (u) {
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
        else if (cr && cr.adparameters && cr.adparameters.hasOwnProperty('autoplay')) {
            if (Boolean(cr.adparameters.autoplay) == false) {
                out.autoplay = false;
            }
        }
        if (cr && cr.adparameters && cr.adparameters.loop) {
                out.loop = cr.adparameters.loop;
        } else if (u && u.loop) {
                out.loop = u.loop;
        }
        if (cr && cr.adparameters && cr.adparameters.countpos) {
            out.stripPosition = cr.adparameters.countpos;
        }
        if (cr && cr.adparameters)
            delete cr.adparameters.loop;
        return out;
     }

    /**
     * These next 3 are used by the ad sdk (i.e. the jxvideo.1.3.min.js)
     * since this is in the interface document, we continue to support it
     * Well, the play is important. Currently their (KG) usage pattern is 
     * that they call it upon hearing jxhasad event
     */
    OneAdInstance.prototype.play = function() {
        if (_adObj) {
            startPlayWrapper(function() {
                _adObj.playOrStartAd();    
            })
        }
        else {
            if (_thumbnailDiv) {
                _thumbnailDiv.classList.add(hideCls);
            }
            _playerElt.play();
        }            
    }
    OneAdInstance.prototype.rewind = function() {
        if (_adObj) {
            ; //do nothing
        }
        else {
            //set the playhead to 0 and let it play on
            _playerElt.play();
        }            
    }
    OneAdInstance.prototype.pause = function() {
        if (_adObj)
            _adObj.pauseAd();
        else {
            _playerElt.pause();
        }            
    }
    var DO_AUTOPLAY_TEST = false;
    function OneAdInstance(containerId, crData, config = null, eventsVector = null) {
        //_token = containerId;
        _containerId = containerId;
        
        _spinner = MakeOneSpinner(document.getElementById(_containerId) ? document.getElementById(_containerId) : document.body);
        _showSpinner();
        _env = extractEnv(crData, config); //this will set the default image, among many other things.

        _createInner(containerId);
        if (eventsVector) {
            _eventsVector = JSON.parse(JSON.stringify(eventsVector));
        }
        if (config && config.video) {
            _videoSrc = config.video;
            if (_videoSrc) _playerElt.src = _videoSrc;
        }
        else {
            if (DO_AUTOPLAY_TEST)
                _playerElt.src = 'https://creatives.b-cdn.net/jx/white5sec.mp4';
        }
        /* By right is figure out whether this system can autoplay muted or not
        a very very short video....
        The problem is that for the IMA - if it cannot autoplay and you did
        it then it is not clear how to continue. By then already cannot use any
        api to revive the thing already */
        //we do trigger ad ah. this is independent.
        if (DO_AUTOPLAY_TEST) {
            _autoplayTestProm = new Promise(function(resolve) {
                autoplayTestResolve = resolve;
            });
            _triggerAd(crData, config);
            _playerElt.volume = 0;
            _playerElt.muted = true;
            var playPromise = _playerElt.play();
            if (playPromise !== undefined) {
                playPromise.then(function() {
                    autoplayTestResolve('pass');
                    _playerElt.pause();
                }).catch(function() {
                    _cannotAuto = true;
                    autoplayTestResolve('fail');
                });
            }
        }
        else {
            _autoplayTestProm = Promise.resolve('pass');
            _triggerAd(crData, config);
        }
        
    }

    OneAdInstance.prototype.triggerAd = function(crData, config) {
        _triggerAd(crData, config);
    }

    /**
     * Only the universal integration will trigger this
     * The ads sdk (aka jxvideo1.3.min.js will not have this)
     * @param {*} action 
     */
    OneAdInstance.prototype.notifyMe = function(action) {
        console.log(`notifyMe: ${action}`);
        if (action == 'jxvisible')
            this.visibilityChange(true);
        else if (action == 'jxnotvisible')
            this.visibilityChange(false);
    }
    let ret = new OneAdInstance(containerId, data, config, eventsVector);
    return ret;
}

module.exports = MakeOneInst_;
