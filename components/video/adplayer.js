
/**
 * a component used to build the JS that will play a video ad (universal unit)
 * and standalone 
 * i.e. plays the role of jxvideo1.3.min.js and jxvideo1.4.mins.js
 */
const modulesmgr            = require('../basic/modulesmgr');
const _helpers              = modulesmgr.get('video/helpers');
const MakeOneAdObj          = modulesmgr.get('video/admgr-factory');
const buildVastXml          = modulesmgr.get('video/vast').buildVastXml;

const cssmgr                = modulesmgr.get('video/cssmgr');
const adDivCls              = cssmgr.getRealCls('adDivCls');
const comboDivCls           = cssmgr.getRealCls('comboDivCls');
const contentDivCls         = cssmgr.getRealCls('contentDivCls');
const playerCls             = cssmgr.getRealCls('playerCls');
 
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
    var _comboDiv              = null;
    var _adObj              = null;
    var _startAdWhenAvail   = true;
    var _eventsVector       = {};
    var _containerId        = null;

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
        
        //combo div is ad or content.
        _comboDiv = _helpers.newDiv(_pDiv, "div", "", comboDivCls); //this is not the real ad div
        _contentDiv = _helpers.newDiv(_comboDiv, 'div', `<video id="idJxPlayer" class=${playerCls} controls muted playsinline></video>`, contentDivCls); 
        _playerElt = document.getElementById('idJxPlayer');
        //pretend there is a content:
        //just to test the content stuff can work and show properly if we need to
        _playerElt.src = 'https://creative-ivstream.ivideosmart.com/3001004/1181736/3001004-1181736_360.mp4';

    }

    var _vectorForAdMgr = {
        report : function() {},
        setContentMuteState: function() {},
        isPaused: function() { return false; },
        hideSpinner: function() {},
        onAdPause: function() {},
        onAdPlaying: function() {},
        switch2Cnt: function() {
            //if it is unversal then it gets this msg and will kill this whole thing.
            parent.postMessage("jxadended", '*'); 
            _playerElt.play();
        },
        switch2Ad: function() {
            //parent.postMessage("jxhasad", '*'); 
            _playerElt.pause();
        }
    };                
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
            console.log(`_________SO FORCE width ${data.video.width} heigth ${data.video.height} `);

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
            console.log(`_________SO WE DUN PUT ANYTHING AND let the size natural `);
        }
        if (_adObj) 
            _adObj.reset();
        
        _adObj = MakeOneAdObj(_comboDiv, "#FFFFFF", _playerElt, _vectorForAdMgr,
            startAdWhenAvail, eventsVector);
        if (blob.width || blob.height) {            
            // console.log("WE ARE FORCING LET THEM DO WHATEVER. They can force us 640 360 then we scale");
            _adObj.forceDimensions(blob.width, blob.height);
        }
        let domain = data.domain? data.domain:'jixie.io';
        let adURL = `https://ad.jixie.io/v1/video?source=sdk&domain=${domain}&creativeid=` + data.creativeid;
        _adObj.setAutoAdsManagerStart(true);
        _adObj.makeAdRequestCB(adURL, true, true, updateUniversal);
    }
    
    /**
     * 
     * @param {*} isVisible 
     */
    OneAdInstance.prototype.visibilityChange = function(isVisible) {
        //console.log(`OneAdInstance.prototype.visibilityChange = function(${isVisible}) `);
        if (_adObj) {
            if (isVisible) {
                _adObj.playOrStartAd();
            }
            else {
                _adObj.pauseAd();
            }
        }
    }

    function updateUniversal(v) {
        let e;
        let msg = null;
        if (v == 'jxadstarted' || v == 'jxhasad') {
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
    }

    /**
     * 
     * @param {*} data 
     */
    OneAdInstance.prototype.changeJson = function(data) {
        if (_adObj) {
            _adObj.reset();
        }
        if (!data.video) {
            data.video = {
                width: 640,
                height: 360
            };
        }
        //testing and faking some data
        if (data.video.height == 520)
            data.video.height= 320; //error somewhere
        //_playerElt.src = 'https://creative-ivstream.ivideosmart.com/3001004/954006/3001004-954006_480.mp4';
        let tmp = document.getElementById(_containerId);
        if (!tmp) {
            tmp = document.body;
        }
        let containerW = tmp.offsetWidth;
        let comp = { height: 0 }; //for companion
        ['top', 'bottom'].forEach(function(banner){
            let label = banner+'banner';
            if (data[label]) {
                comp[banner] = {};
                comp[banner] = JSON.parse(JSON.stringify(data[label]));
                //Testing and cheating and faking data
                comp[banner].url = 'https://creatives.jixie.io/59a1361c5e23f2dcae1229fedbb4d8d5/700/pasanglklan320x100.jpeg';
                comp[banner].gap = 0; //hack
                comp[banner].ar = data[label].width/data[label].height;
                comp[banner].width = 320;
                comp[banner].height = 100;
                
                comp[banner].tracker4click = data.trackers.baseurl + '?' + data.trackers.parameters + '&action=click';
                comp.height += comp[banner].height;
            }
        });
        let blob = {
            width: data.video.width, 
            height: data.video.height
        }
        
        _comboDiv.style.width = blob.width +'px';
        _comboDiv.style.height = blob.height + 'px';
        
        blob.token = _containerId;
        if (comp.height) {
            blob.companion = comp;
            ['top','bottom'].forEach(function(pos) {
                if (blob.companion[pos]) {
                    _createBanner(_comboDiv, blob, pos);
                }
            });
        }
        //in the end our addescriptor object also only have very little
        _adObj = MakeOneAdObj(_comboDiv, "#FFFFFF", _playerElt, _vectorForAdMgr,
            startAdWhenAvail, eventsVector);
        //_adObj.forceDimensions(blob.width, blob.height);
        //we should not use any attribute of the container.
        //724 banner+sqvideo+banner
        //686: 9-16 singers
        //690: pure video
        //now we try to do the vast tag oh my goodness...
        let vastSrcBlob = data.vast;
        delete data.vast;
        vastSrcBlob.adparameters = data;           
        let vast = buildVastXml([vastSrcBlob]);
        _adObj.setAutoAdsManagerStart(false);
        _adObj.makeAdRequestFromXMLCB(vast, true, true, updateUniversal);
    }//

    /**
     * 
     */
    OneAdInstance.prototype.play = function() {
        if (_adObj)
            _adObj.startAd();
    }
    function OneAdInstance(containerId, adparameters, eventsVector = {}) {
        _token = containerId;
        _containerId        = containerId;
        _startAdWhenAvail   = true; //would be from adparameters if there is ever one.
        _eventsVector       = eventsVector;
        _createInner(containerId);
        if (adparameters.universal) {
            this.changeJson(adparameters);
        }
        else {
            /* if (containerId == 'playerContainerJX') {
                adparameters.video = {
                    width: 640,
                    height: 360
                };
            }*/
            this.changeCfg(adparameters);
        }
    }

    /**
     * 
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
