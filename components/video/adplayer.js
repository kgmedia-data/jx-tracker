
const modulesmgr            = require('../basic/modulesmgr');
const _helpers              = modulesmgr.get('video/helpers');
const MakeOneAdObj          = modulesmgr.get('video/admgr-factory');
const buildVastXml          = modulesmgr.get('video/vast').buildVastXml;

const cssmgr                = modulesmgr.get('video/cssmgr');
const adDivCls              = cssmgr.getRealCls('adDivCls');
const contentDivCls         = cssmgr.getRealCls('contentDivCls');
const playerCls             = cssmgr.getRealCls('playerCls');
 
function MakeOneInst_(containerId, data, startAdWhenAvail = true, eventsVector = {}) {
    var _pDiv               = null;
    var _playerElt          = null;
    var _adDiv              = null;
    var _adObj              = null;
    var _startAdWhenAvail   = true;
    var _eventsVector       = {};
    var _containerId        = null;

    var _banners = {};//not sure if we really need to expose these here.

    function _createBanner(adDiv, masterObj, position) {
        let obj = masterObj.companion ? masterObj.companion[position]: null;
        if (!obj) {
            return;
        }
        let url = obj.url;
        let height = obj.height;
        let gap = obj.gap;
        if (position === 'top' && gap > 0) {
            adDiv.style.marginTop = gap + "px";
        }
        if (position === 'bottom' && gap > 0) {
            adDiv.style.marginBottom = gap + "px";
        }
        //if (obj.type == "image") { // if it is an image
        {
            let pElmt = document.createElement('div'); // create a div 
            pElmt.style.cursor = "pointer";
            pElmt.style.margin = "auto";
            // create an img tag
            pElmt.innerHTML = '<img src="' + url + '" width="100%" height="' + height + '" class="jxImg"/>';
            // set the width and height of the div
            if (obj.width && obj.height) {
                pElmt.style.width = obj.width + "px";
                pElmt.style.height = obj.height + "px";
            } else {
                pElmt.style.width = "100%";
                pElmt.style.maxWidth = "100%";
            }
            _banners[position] = pElmt;
            if (position == 'top') { // if it is a top banner
                adDiv.parentNode.insertBefore(pElmt, adDiv); // insert above the ad div container
                //jxutil.addListener(pElmt, 'click', this.onTopBannerClick); // listen to the click event
            } else if (position == 'bottom') { // if it is a bottom banner
                adDiv.parentNode.appendChild(pElmt); // insert below the ad div container
                //jxutil.addListener(pElmt, 'click', this.onBottomBannerClick); // listen to the click event
            }
        }
    }
    //var _innerCreated = false;
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
        //if (!_innerCreated) {
          //  _innerCreated = true;
            //_createInner(_containerId);
        //}
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
        var v = {
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
                //cheat:
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
                comp.height += comp[banner].height;
            }
        });
        let blob = {
            width: data.video.width, 
            height: data.video.height
        }
        if (comp.height) {
            blob.companion = comp;
        }
        _adDiv.style.width = blob.width +'px';
        _adDiv.style.height = blob.height + 'px';
        
        blob.token = _containerId;
        //we make a functions vector for them to listen??
        //to play the video.
        var v = {
            switch2Cnt: function() {
                _playerElt.play();
            },
            switch2Ad: function() {
                _playerElt.pause();
            }
        };
        ['top','bottom'].forEach(function(banner) {
            _createBanner(_adDiv, blob, banner);
        });
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
        parent.postMessage("jxhasad", '*'); //HACK 

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
