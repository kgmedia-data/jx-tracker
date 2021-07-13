
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
const contentDivCls         = cssmgr.getRealCls('contentDivCls');
const playerCls             = cssmgr.getRealCls('playerCls');
 
// Add a listener of the event to the element e which calls the function handler h
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
    var _adDiv              = null;
    var _adObj              = null;
    var _startAdWhenAvail   = true;
    var _eventsVector       = {};
    var _containerId        = null;

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

    function _createInner(containerId) {
        let tmp = document.getElementById(containerId);
        if (!tmp) {
            tmp = document.body;
        }
        _pDiv = _helpers.newDiv(tmp,'div','',''); 
        _pDiv.style.width = '100%';
        _pDiv.style.height = '100%';
        _pDiv.style.position = 'relative';
        _adDiv = _helpers.newDiv(_pDiv, "div", "", adDivCls); 
        _contentDiv = _helpers.newDiv(_adDiv, 'div', `<video id="idJxPlayer" class=${playerCls} controls muted playsinline></video>`, contentDivCls); 
        _playerElt = document.getElementById('idJxPlayer');
    }

    OneAdInstance.prototype.changeCfg = function(data) {
        //this is the type where only got config json
        //i.e. has creativeID unit, that kind of thing.
        //can also get from them lah.
        let blob = {
            width: 640, 
            height: 360 
        }
        if (data.video) {
            //the KG usage can specify odd shaped video now.
            blob.width = data.video.width;
            blob.height = data.video.height;
        }
        _adDiv.style.width = blob.width +'px';
        _adDiv.style.height = blob.height + 'px';
        if (_adObj) 
            _adObj.reset();
        let v = {
            switch2Cnt: function() {
                _playerElt.play();
            },
            switch2Ad: function() {
                _playerElt.pause();
            }
        };                
        _adObj = MakeOneAdObj(_adDiv, "#FFFFFF", _playerElt, v,
            startAdWhenAvail, eventsVector);
        _adObj.forceDimensions(blob.width, blob.height);
        let adURL = `https://ad.jixie.io/v1/video?source=sdk&domain=jixie.io&creativeid=` + data.creativeid;
        _adObj.makeAdRequestP(adURL, null, true, true);
    }
    
    OneAdInstance.prototype.visibilityChange = function(isVisible) {
        if (_adObj) {
            if (isVisible) {
                _adObj.playAd();
            }
            else {
                _adObj.pauseAd();
            }
        }
    }

    //Here this JSON can be either a JSON with creative info or not.
    //
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
                //cheat to fake some data.
                /*
                let obj  = comp[banner];
                obj.url = 'https://creatives.jixie.io/59a1361c5e23f2dcae1229fedbb4d8d5/700/pasanglklan320x100.jpeg';
                obj.height = 100;
                obj.width = 320;//no need bah
                obj.gap = 0;
                */
                comp[banner].url = 'https://creatives.jixie.io/59a1361c5e23f2dcae1229fedbb4d8d5/700/pasanglklan320x100.jpeg';
                comp[banner].gap = 0; //hack
                comp[banner].ar = data[label].width/data[label].height;
                comp[banner].width = containerW;
                comp[banner].height = comp[banner].width/comp[banner].ar;
                comp[banner].tracker4click = data.trackers.baseurl + '?' + data.trackers.parameters + '&action=click';
                comp.height += comp[banner].height;
            }
        });
        let blob = {
            width: data.video.width, 
            height: data.video.height
        }
        
        _adDiv.style.width = blob.width +'px';
        _adDiv.style.height = blob.height + 'px';
        
        blob.token = _containerId;
        var v = {
            switch2Cnt: function() {
                _playerElt.play();
            },
            switch2Ad: function() {
                _playerElt.pause();
            }
        };
        if (comp.height) {
            blob.companion = comp;
            ['top','bottom'].forEach(function(pos) {
                if (blob.companion[pos]) {
                    _createBanner(_adDiv, blob, pos);
                }
            });
        }
        //in the end our addescriptor object also only have very little
        _adObj = MakeOneAdObj(_adDiv, "#FFFFFF", _playerElt, v,
            startAdWhenAvail, eventsVector);
        _adObj.forceDimensions(blob.width, blob.height);
        //we should not use any attribute of the container.
        //724 banner+sqvideo+banner
        //686: 9-16 singers
        //690: pure video
        //now we try to do the vast tag oh my goodness...
        let xyz = data.vast;
        delete data.vast;
        xyz.adparameters = data;           
        let vast = buildVastXml([xyz]);
        _adObj.makeAdRequestFromXMLP(vast, true, true);
        //still need a noitification mechanism leh!!!
        parent.postMessage("jxhasad", '*'); //HACK . Not here!

    }//

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
        this.changeJson(adparameters);
    }
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
