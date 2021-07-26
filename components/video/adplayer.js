
/**
 * a component used to build the JS that will play a video ad (universal unit)
 * and standalone 
 * i.e. plays the role of jxvideo1.3.min.js and jxvideo1.4.mins.js
 */
const modulesmgr            = require('../basic/modulesmgr');
const _helpers              = modulesmgr.get('video/helpers');
const MakeOneAdObj          = modulesmgr.get('video/admgr-factory');
const MakeOneSpinner          = modulesmgr.get('video/spinner-factory');
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

function MakeOneInst_(containerId, data, startAdWhenAvail = true, eventsVector = {}) {
    var _pDiv               = null;
    var _playerElt          = null;
    var _comboDiv           = null;
    var _thumbnailDiv       = null;//?
    var _bigPlayBtn         = null;//?
    var _context            = null;//?

    var _spinner            = null;//?
    
    var _adObj              = null;
    var _env = null;

    var _startAdWhenAvail   = true;
    var _eventsVector       = {};
    var _containerId        = null;

    var _videoSrc           = null; //? source of the content video which will get from universal

    var _boundImgLoadedFcn  = null;//?

    /**
     * 
     * @param {*} masterObj 
     * @param {*} pos 
     * @returns 
     */
    function _doImgBanner(masterObj, pos) {
        let obj = masterObj.companion[pos];
        let pElmt = document.createElement('div'); // create a div 
        pElmt.style.cursor = "pointer";
        pElmt.style.margin = "auto";
        // create an img tag
        //what class? We dun have it yet?
        pElmt.innerHTML = '<img src="' + obj.url + '" width="100%" height="' + obj.height + '" class="jxImg"/>';
        // set the width and height of the div
        if (obj.width && obj.height) {
            pElmt.style.width = obj.width + "px";
            pElmt.style.height = obj.height + "px";
        } else {
            pElmt.style.width = "100%";
            pElmt.style.maxWidth = "100%";
        }
        if (obj.clicktracker) {
            addListener(pElmt, 'click', function() {
                fireTracker(obj.tracker4click)
            });
        }
        return pElmt;
   }

    /**
     * 
     * @param {*} e 
     * @returns 
     */
    function __noGoogleAdListener(e) {
        let pos = (e.data == 'jxnobanneradtop' ? 'top' : (e.data == 'jxnobanneradbottom'? 'bottom': null));
        if (!pos) return;
        let sizeObj = this.masterObj;           
        let iFr = document.getElementById(pos+'banner'); 
        iFr.style.display = "none"; // set the display of iframe to none
        if (sizeObj.companion && sizeObj.companion[pos]) {
            delete sizeObj.companion[pos];
        }
        let h = sizeObj.height;
        if (pos == 'top' && sizeObj.companion['bottom']) 
            h += sizeObj.companion['bottom'].height + sizeObj.companion['bottom'].gap;
        else if (pos == 'bottom' && sizeObj.companion['top']) 
            h += sizeObj.companion['top'].height + sizeObj.companion['top'].gap;
        //change size
        parent.postMessage('jxmsg::' + JSON.stringify({'type': 'size',params: {'height': h}}), '*');
    }
    var _boundNoGAdListener = null;

    function _doScriptBanner(masterObj, pos) {
        let obj = masterObj.companion[pos];
        let script = null;
        let ifr = null;
        try {
            script = atob(obj.script); // decode the script
        }
        catch (e) {
        }
        let s = '';
        if (script && script.includes("<script") && script.includes("googletag.pubads()")) {
            s = `googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                    if (event.isEmpty) {
                        var id = event.slot.getSlotElementId();
                        var x = document.getElementById(id);
                        x.parentElement.style.display = "none";
                        parent.postMessage("jxnobannerad${pos}", "*");
                    }
                });`;
                if (!_boundNoGAdListener) {
                    _boundNoGAdListener = __noGoogleAdListener.bind({ masterObj: masterObj });                    
                    window.addEventListener('message', _boundNoGAdListener, false);
                    setTimeout(function() {
                        if (_boundNoGAdListener) {
                            window.removeEventListener('message', _boundNoGAdListener);
                            _boundNoGAdListener = null;
                        }
                    }, 5000);
                }
        }
        else {
            s = script;
        }
        ifr = document.createElement('iframe');
        ifr.id = pos + "banner";
        ifr.style.border = 'none';
        ifr.setAttribute('frameborder', '0');
        ifr.setAttribute('scrolling', 'no');
        if (obj.width && obj.height) {
            ifr.style.width = obj.width + "px";
            ifr.style.height = obj.height + "px";
        } else { //??
            ifr.onload = function(e) {
                ifr.style.width = e.target.contentWindow.document.body.scrollWidth;
                ifr.style.height = e.target.contentWindow.document.body.scrollHeight;
            }
        }
        let interval = setInterval(function() {
            if (ifr.contentWindow.document || ifr.contentDocument) {
                clearInterval(interval);
                    var doc = ifr.contentWindow.document || ifr.contentDocument;
                    var jxjs = doc.createElement('script');
                    if (s != "") {
                        var script_body = document.createTextNode(s);
                        jxjs.appendChild(script_body);
                    }
                    doc.open();
                    doc.write('<!DOCTYPE html>'+
                        '<html>'+
                            '<head>'+
                                '<meta name="viewport" content="width=device-width, initial-scale=1">'+
                            '</head>'+
                            '<body style="margin: 0;">'+
                                script
                                +jxjs.outerHTML+
                            '</body>'+
                        '</html>');
                    doc.close();
                    focus();
                    addListener(window, 'blur', function(e) {
                        if (document.activeElement == ifr) {
                            fireTracker(obj.tracker4click, position == 'top' ? 'click2' : 'click3');
                        }
                    });

            }
        }, 500);
        return ifr;
    }

    /**
     * 
     * @param {*} adDiv 
     * @param {*} masterObj 
     * @param {*} pos 
     */
    function _createBanner(adDiv, masterObj, pos) {
        let obj = masterObj.companion ? masterObj.companion[pos]: null;
        if (obj.gap > 0) {
            adDiv.style[pos==='top'? 'marginTop':'marginBottom'] = obj.gap + "px";
        }
        let pElmt = obj.type === 'image' ? _doImgBanner(masterObj, pos) : _doScriptBanner(masterObj, pos);
        if (pElmt) {
            if (pos == 'top') { 
                adDiv.parentNode.insertBefore(pElmt, adDiv); // insert above the ad div container
            } else if (pos == 'bottom') { 
                adDiv.parentNode.appendChild(pElmt); // insert below the ad div container
            }
        }
    }

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
        
        /*
        //combo div is ad or content.
        _comboDiv = _helpers.newDiv(_pDiv, "div", "", comboDivCls); //this is not the real ad div
        _contentDiv = _helpers.newDiv(_comboDiv, 'div', `<video id="idJxPlayer" class=${playerCls} controls muted playsinline></video>`, contentDivCls); 
        _playerElt = document.getElementById('idJxPlayer');
        //pretend there is a content:
        //just to test the content stuff can work and show properly if we need to
        //_playerElt.src = 'https://creative-ivstream.ivideosmart.com/3001004/1181736/3001004-1181736_360.mp4';
        */
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

    var _onContentEnded = function() {
        _context = null;
        if (_thumbnailDiv) _thumbnailDiv.classList.remove(hideCls);
        //else parent.postMessage("jxadended", '*');
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
            //if it is unversal then it gets this msg and will kill this whole thing.
            //was parent.postMessage("jxadended", '*'); 
            //was _playerElt.play();
            if (_videoSrc) {
                _context = 'content';
                _contentDiv.classList.remove(hideCls);
                _playerElt.play();
            } else if (_thumbnailDiv) {
                _thumbnailDiv.classList.remove(hideCls);
            } else {
                parent.postMessage("jxadended", '*');
            }
        },
        switch2Ad: function() {
            //WAS _playerElt.pause();
            _context = 'ad';
            _showSpinner();
            if (_thumbnailDiv) _thumbnailDiv.classList.add(hideCls)
            parent.postMessage("jxhasad", '*'); 
            _playerElt.pause();
        }
    };            
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
    
    /**
     * This is from the ads SDK usage jxvideo.1.3.min.js
     * @param {*} data 
     */
    OneAdInstance.prototype.changeCfg = function(data) {
        //this is the type where only got config json
        //i.e. has creativeID unit, that kind of thing.
        //can also get from them lah.
        //current node is really Hard code and pretend to be 640 360
        //no matter what.

        //Another way is that your div is already styled like this
        //of course your div should already obey the aspect ratio.
        //then we just say we always follow your div.

        let blob = {
        }
        //let us detect and follow your size.

        if (data.video) {
            //If they want to specify and we just stick to this.
            //Let them do the scaling, fine.
            //the KG usage can specify odd shaped video now.
            //So they can specify odd shaped video if they like
            //else we have the 640 360 default from the above.
            blob.width = data.video.width;
            blob.height = data.video.height;
            //not sure if still need. may be not.
            _comboDiv.style.width = blob.width +'px';
            _comboDiv.style.height = blob.height + 'px';
        }
        else {
            //we are trying this for KG masterad case:
            //already say 100%
            //you dun give I assume all good.
        }
        if (_adObj) 
            _adObj.reset();
        

        _adObj = MakeOneAdObj(_comboDiv, _playerElt, _vectorForAdMgr, _env.controls);
        if (blob.width || blob.height) {            
            _adObj.forceDimensions(blob.width, blob.height);
        }
        //let domain = data.domain? data.domain:'jixie.io';
        //let adURL = `https://ad.jixie.io/v1/video?source=sdk&domain=${domain}&creativeid=` + data.creativeid;
        //_adObj.setAutoAdsManagerStart(true);
        //_adObj.makeAdRequestCB(adURL, true, true, updateUniversal);
        let domain = data.domain? data.domain:'jixie.io';
        let adURL = `https://ad.jixie.io/v1/video?source=sdk&domain=${domain}&creativeid=` + data.creativeid;
        _adObj.setAutoAdsManagerStart(_startAdWhenAvail);
        _adObj.makeAdRequestCB(adURL, _startAdWhenAvail, _startAdWhenAvail ? true : false, updateUniversal);
        if (!_startAdWhenAvail) _createBigPlayBtn();
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

    var _handleAdEnded = _realFireAdEnded;

    function _realFireAdEnded() {
        parent.postMessage("jxadended", '*');
    }
    function _realDoReplay() {
        let vast = buildVastXml([_vastSrcBlob], true);//second param is SUPPRESS trackers
        _adObj.setAutoAdsManagerStart(true); //since this is the second round, just play
        _adObj.makeAdRequestFromXMLCB(vast, true, true, doNothing);
    }

    function trigger1Replay() {
        _handleAdEnded = _realDoReplay;
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
        /* WOO
        if (!adparameters.video) {
            adparameters.video = {
                width: 640,
                height: 360
            };
        }
        */
        //testing and faking some data
        //WOO if (adparameters.video.height == 520)
        //WOO adparameters.video.height= 320; //error somewhere
        //_playerElt.src = 'https://creative-ivstream.ivideosmart.com/3001004/954006/3001004-954006_480.mp4';
        let tmp = document.getElementById(_containerId);
        if (!tmp) {
            tmp = document.body;
        }
        let containerW = tmp.offsetWidth;
        let comp = { height: 0 }; //for companion
        ['top', 'bottom'].forEach(function(banner){
            let label = banner+'banner';
            if (adparameters[label]) {
                comp[banner] = {};
                comp[banner] = JSON.parse(JSON.stringify(adparameters[label]));
                //Testing and cheating and faking data
                comp[banner].url = 'https://creatives.jixie.io/59a1361c5e23f2dcae1229fedbb4d8d5/700/pasanglklan320x100.jpeg';
                comp[banner].gap = 0; //hack
                comp[banner].ar = adparameters[label].width/adparameters[label].height;
                comp[banner].width = 320;
                comp[banner].height = 100;
                
                comp[banner].tracker4click = adparameters.trackers.baseurl + '?' + adparameters.trackers.parameters + '&action=click';
                comp.height += comp[banner].height;
            }
        });
        let blob = {
            token : _containerId
        }
        
        if (comp.height) {
            //for video banner video case it is not responsive
            //we will do the size "as is"
            blob.width = adparameters.video.width;
            blob.height = adparameters.video.height;
            
            blob.companion = comp;
            ['top','bottom'].forEach(function(pos) {
                if (blob.companion[pos]) {
                    _createBanner(_comboDiv, blob, pos);
                }
            });
        }
        else {
            blob.width = tmp.offsetWidth; 
            blob.height = tmp.offsetHeight;
        }
        _comboDiv.style.width = blob.width +'px';
        _comboDiv.style.height = blob.height + 'px';
            
        //this is the big question:
        adparameters.loop = "auto"; //HACK
        if (adparameters.loop) {  //actually apart from auto there is also the manual one aaargh
            trigger1Replay(_comboDiv);
            delete adparameters.loop;
        }
        _adObj = MakeOneAdObj(_comboDiv,  _playerElt, _vectorForAdMgr, _env.controls);
        const mylist =[
        "jxadended", 
        "jxadfirstQuartile",
        "jxadthirdQuartile",
        "jxadmidpoint",
        "jxadskipped", 
        "jxadalladscompleted",
        "jadclick", 
        "jxadimpression",
        "jxadstart"];
        _adObj.subscribeToEvents(
            mylist, function(jxname) {
                if (jxname == 'jxadended') {
                    console.log("A1");
                    _handleAdEnded();
                    console.log("A2");
                }
                console.log(`-WOOYANYU-CB--- adplayer.js ${jxname} ---- `);
            });

        //_adObj.forceDimensions(blob.width, blob.height);
        //we should not use any attribute of the container.
        _vastSrcBlob = crData;
        console.log(`VAST FODDER: ${crData.id}, ${crData.name} ,${crData.duration}, ${crData.clickurl}`);
        let vast = buildVastXml([_vastSrcBlob]);
        _adObj.setAutoAdsManagerStart(false); 
        _adObj.makeAdRequestFromXMLCB(vast, true, true, updateUniversal);
    }//

    function extractEnv(cr, u) {
        let out = {
            autoplay : true,
            controls: {
                color: '#000000',
                position: 'left'
            }
        };
        if (cr.clickurl)  {
            out.clickurl = cr.clickurl;
        }
        if (u) {
            if (u.defaultImage) {
                out.defaultImage = u.defaultImage;
            }
            if (Array.isArray(u.videos) && u.length > 0) {
                out.video = u.videos[0];
            }
            if (u.controlsColor) {
                out.controls.color = u.controlsColor
            }
            if (u.controlsPosition) {
                out.controls.position = u.controlsPos;
            }
        }
        if (cr.adparameters && cr.adparameters.hasOwnProperty('autoplay')) {
            if (Boolean(cr.adparameters.autoplay) == false) {
                u.autoplay = false;
            }
        } else if (u && u.hasOwnProperty('autoplay')) {
            if (Boolean(u.autoplay) == false) {
                u.autoplay = false;
            }
        }
        return out;
     }
    /**
     * 
     */
    OneAdInstance.prototype.play = function() {
        if (_adObj)
            _adObj.startAd();
    }
    function OneAdInstance(containerId, crData, eventsVector = {}) {
        _token = containerId;
        _containerId        = containerId;
        _startAdWhenAvail   = true; //would be from adparameters if there is ever one.
        _eventsVector       = eventsVector;

        _spinner = MakeOneSpinner(document.getElementById(_containerId) ? document.getElementById(_containerId) : document.body);
        _showSpinner();

        let u = {}; //fake for now. still not ok yet.
        

        _env = extractEnv(crData, crData.universal);

        _createInner(containerId);
        if (crData.adparameters) {
            //from our own renderer
            this.changeJson(crData);
        }
        else {
            //from standalone "SDK" usage:
            /* if (containerId == 'playerContainerJX') {
                adparameters.video = {
                    width: 640,
                    height: 360
                };
            }*/
            this.changeCfg(crData);
        }
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
    let ret = new OneAdInstance(containerId, data, startAdWhenAvail, eventsVector);
    return ret;
}

module.exports = MakeOneInst_;
