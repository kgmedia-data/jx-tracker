DO_NOT_REMOVE_GULPBUILD_REPLACE_FLOAT_COND_COMPILE


const modulesmgr                = require('../basic/modulesmgr');
const common                    = modulesmgr.get('basic/common');
const MakeOneUniversalMgr       = modulesmgr.get('renderer/univelements');

function addGAMNoAdNotifyMaybe(str) {
    if (str.includes("<script") && str.includes("googletag.pubads()")) {
        var script = new DOMParser().parseFromString(str, "text/html");
        var t = `googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                if (event.isEmpty) {
                    var id = event.slot.getSlotElementId();
                    parent.postMessage('jxnoad', '*');
                }
            });
            `;
        script.querySelector("script").innerHTML = t.concat(script.querySelector("script").innerHTML);
        return script.querySelector("script").outerHTML;
    }
    return str;
}

var MakeOneFloatingUnit = function() { return null; };

if (JX_FLOAT_COND_COMPILE) {
MakeOneFloatingUnit = function(container, params, divObjs, token, pm2CreativeFcn) {
    const JXFloatingClsName = 'jxfloating';
    const JXCloseBtnClsName = 'jxfloating-close-button';
    const JXFloatingStyleID = 'JXFloatingStyle';

    var _floatParams = null;
    var _closeBtn = null;
    var _token = null;
    
    var _container = null;
    var _parentContainer = null;
    var _placeholderDiv = null;

    var _initialHeight = 0;
    var _visThreshold = 0.4;

    var _floating = false;
    var _pm2CreativeFcn = null;
    var _placeholderObs = null;

    function FactoryOneFloating(container, params, divObjs, token, pm2CreativeFcn) {
        var _innerDiv = divObjs.innerDiv;
        var _outterDiv = divObjs.outerDiv;

        _parentContainer = container;
        _floatParams = JSON.parse(JSON.stringify(params));
        _floatParams.isFloat = true;
        _container = _outterDiv;
        _token = token;
        _pm2CreativeFcn = pm2CreativeFcn;

        _initialHeight = Math.max(_innerDiv.offsetHeight, _innerDiv.offsetHeight);

        _prepareFloatingUnits();
    }

    var _prepareFloatingUnits = function() {
        var stylesArr = [
            "."+JXCloseBtnClsName+"{position: absolute;box-sizing: border-box;display: block;left: -12px;bottom: auto;top: 15px;right: auto;cursor:pointer;z-index: 99;}",
            "."+JXCloseBtnClsName+":before,."+JXCloseBtnClsName+":after{width: 20px;height: 5px;transform: rotate(-45deg);content: '';position: absolute;display: block;background-color: #000;transition: all 0.2s ease-out;top: 50%;left: 50%;}",
            "."+JXCloseBtnClsName+":after{transform: rotate(45deg);}",
            "."+JXCloseBtnClsName+":hover:after{transform: rotate(-45deg);}",
            "."+JXCloseBtnClsName+":hover:before{transform: rotate(45deg);}",
            "."+JXCloseBtnClsName+".left{position: absolute;box-sizing: border-box;display: block;right: 2px;bottom: auto;top: 18px;left: auto;cursor:pointer;z-index: 99;}",
            "."+JXFloatingClsName+"{position:fixed;height:auto;opacity:1;z-index:9999}",
        ].join("\n");
        common.acss(stylesArr, JXFloatingStyleID);

        _closeBtn = document.createElement('a');
        _closeBtn.className = JXCloseBtnClsName;

        if (_floatParams.floatLocation == "bottom left" || _floatParams.floatLocation == "top left") _closeBtn.classList.add('left');
        _closeBtn.onclick = function() {
            _stopFloat();
            _floatParams.isFloat = false;
            _pm2CreativeFcn("jxnotvisible");
        }

        _container.appendChild(_closeBtn);
        _hideCloseBtn();
    }

    var _setContainerStyle = function(elmStyle) {
        if (["bottom right","bottom left","bottom"].includes(_floatParams.floatLocation)) elmStyle.top = "auto";
        if (["top right","top left","top"].includes(_floatParams.floatLocation)) elmStyle.top = _floatParams.floatVMargin + "px";

        if (["bottom right","top right"].includes(_floatParams.floatLocation)) elmStyle.left = "auto"; 
        if (["bottom left","top left"].includes(_floatParams.floatLocation)) elmStyle.left = _floatParams.floatHMargin + "px"; 

        if (["top","top right", "top left"].includes(_floatParams.floatLocation)) elmStyle.bottom = "auto"; 
        if (["bottom right","bottom left","bottom"].includes(_floatParams.floatLocation)) elmStyle.bottom = _floatParams.floatVMargin + "px";

        if (["bottom left", "top left"].includes(_floatParams.floatLocation)) elmStyle.right = "auto"; 
        if (["bottom right","bottom","top right"].includes(_floatParams.floatLocation)) elmStyle.right = _floatParams.floatHMargin + "px";

        if (["bottom","top"].includes(_floatParams.floatLocation)) {
            elmStyle.right = "0px";
            elmStyle.left = "0px";
            elmStyle.margin = "auto";
        } else elmStyle.margin  = "0px 10px 10px";
    }

    var _setPlaceholderDiv = function() {
        if (!_placeholderDiv) {
            _placeholderDiv = common.newDiv(_parentContainer, 'div');
            _placeholderDiv.style.cssText = "display:block;width:100%;clear:both;height:" + _initialHeight + "px";
        } else _placeholderDiv.style.display = "block";

        _placeholderObs = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry){
                if (entry.intersectionRatio > _visThreshold) {
                    console.log(`THE OTHER ONE IN `);
                    _placeholderObs.unobserve(entry.target);
                    _stopFloat();
                }
            });
        }, {threshold: _visThreshold});
        _placeholderObs.observe(_placeholderDiv);
    }

    var _hidePlaceholderDiv = function() {
        if (_placeholderDiv) _placeholderDiv.style.display = "none";
    }

    var _sendEvent = function(msg) {
        var evt = new Event(msg);
        _parentContainer.dispatchEvent(evt);
    }

    var _startFloat = function(hasBeenViewed) {
            _floating = true;
            _container.classList.add(JXFloatingClsName);
            var ctrStyle = _container.style;
            ctrStyle.background = _floatParams.floatBackground;
            ctrStyle.height = "auto";
            ctrStyle.width = _floatParams.floatWidth + "px";
        
            _setContainerStyle(ctrStyle);
            _showCloseBtn();
            _sendEvent("jxfloat");

            _setPlaceholderDiv();
            if (_floatParams.floatType == "always" && !hasBeenViewed) _pm2CreativeFcn("jxvisible");
    }

    var _stopFloat = function() {
            if (_floating && _floatParams.isFloat) {
                _container.classList.remove(JXFloatingClsName);
                _container.style.cssText = "";
                _container.style.height = _initialHeight + "px";
                _hidePlaceholderDiv();
                if (_closeBtn) _hideCloseBtn();
                _sendEvent("jxdocked");
            }
    }

    var _hideCloseBtn = function() {
        if (_closeBtn) _closeBtn.style.display = "none";
    }

    var _showCloseBtn = function() {
        if (_closeBtn) _closeBtn.style.display = "block";
    }

    var _shouldFloat = function(hasBeenViewed, isVisible) {
        if (_floatParams.isFloat && ((_floatParams.floatType == "always" && !isVisible) || (_floatParams.floatType == "view" && hasBeenViewed && !isVisible)))
            return true;
        else 
            return false;
    }

    var _cleanUpElement = function() {
        if (_placeholderDiv && _placeholderDiv.parentNode) _placeholderDiv.parentNode.removeChild(_placeholderDiv);
        _placeholderObs = null;
        _floating = false;
    }

    FactoryOneFloating.prototype.startFloat = function(hasBeenViewed) {
        _startFloat(hasBeenViewed);
    }
    FactoryOneFloating.prototype.shouldFloat = function(hasBeenViewed, isVisible) {
        return _shouldFloat(hasBeenViewed, isVisible);
    }
    FactoryOneFloating.prototype.stopFloat = function() {
        _stopFloat();
    }
    FactoryOneFloating.prototype.cleanup = function() {
        _cleanUpElement();
    }

    let floatUnit = new FactoryOneFloating(container, params, divObjs, token, pm2CreativeFcn);
    return floatUnit;   
}
}

//////(function() {

    const destContainerPrefix_ = 'jxifr_';
    if (!window.jxfeslite)
        window.jxfeslite = {};
    const exposedWinPropName_ = 'jxuniversallite';
    //if (window[exposedWinPropName_]) {
      //  return;
    //}
    // Globals
    //Initialize and then set them properly.
    var gIsUFif = false;
    var gIframe = false;
    var gIsFifs  = false;

    let currW = window;
    while (top != currW)  {
        gIframe = true;
        try {
            currW = currW.parent;
        }
        catch(err) { gIsUFif = true; }
        if (gIsUFif) {
            break;
        }
    }//while
    if (gIframe && !gIsUFif) gIsFifs = true;
   
    const jxScriptUrls_ = {
        video: {
            //default visibility threshold
            signature: 'jx_video_ad',
            url: 'https://scripts.jixie.io/jxvideocr.1.0.min.js'
            //url: 'https://jx-demo-creatives.s3-ap-southeast-1.amazonaws.com/osmtest/jx-app-videoadsdk.min.js'
        }
    };
    const visThreshold_ = 0.4;
   
    /**
     * Function vector
     * Current 2 sets. one set for amp one set for others
     * functions are :
     *  handleNoAd, handleHasAd, setupVisChangeNotifiers, clearVisChangeNotifiers
     */
    const fcnVectorsByContext_ = {
    'amp' :  {
        handleNoAd: function() {
            //This stuff what you do also depends on context ..e.g. So AMP you need to call context API
            // to tell runtime to collapsee your slot
            window.context.noContentAvailable();
        },
        handleHasAd: function(width, height, fixedHeight) { 
            //console.log(`calling the render start .... ${width} ${height} ${fixedHeight}`);
            window.context.renderStart({
                width: width,
                height: fixedHeight > 0 ? fixedHeight : height
            });
        },
        setupVisChangeNotifiers: function(boundCB, obsContainer = null) {
            let retObserver = window.context.observeIntersection(boundCB);
            window.addEventListener('amp:visibilitychange', boundCB);
            return retObserver;
        },
        setupBlurHandler: function() {
            common.addListener(window, 'blur', boundCB);
        },
        setupResizeHandler: function() {

        },
        setupScrollEventHandler: function() {
            //for AMP: do nothing.
        },
        unlisten(type, boundCB) {
            //TODO : for AMP also
            if (!boundCB) return;
            switch (type) {
                case 'scroll': //no listen
                case 'resize':
                case 'blur':
                    break;
                case 'message':
                    common.removeListener(window, 'message', boundCB);
                    break;                    
                case 'visibilitychange':
                    common.removeListener(window, 'amp:visibilitychange', boundCB);
                    break;
            }//switch
        }
    },//end of amp group
    //non AMP:
    'default': {
        setupVisChangeNotifiers: function(boundCB, obsContainer) {
            let retObserver = null;
            retObserver = new IntersectionObserver(boundCB, {
                threshold: visThreshold_
            });
            retObserver.observe(obsContainer); 
            common.addListener(document, "visibilitychange", boundCB);
            return retObserver;
        },
        setupResizeHandler: function(boundCB, isResponsive) {
            //if (isResponsive) {
                common.addListener(window, 'resize', boundCB);
                boundCB();
            //}
        },
        setupScrollEventHandler: function(boundCB) {
            //Listen on the top window.
            common.addListener(top, 'scroll', boundCB);
            boundCB();
        },
        setupBlurHandler: function(boundCB) {
            common.addListener(window, 'blur', boundCB);
        },
        unlisten(type, boundCB) {
            if (!boundCB) return;
            switch (type) {
                case 'scroll':
                    common.removeListener(top, type, boundCB);
                    break;
                case 'resize':
                case 'message':
                case 'blur':
                case 'visibilitychange':
                    common.removeListener(window, type, boundCB);
                    break;
            }//switch
        },
        unobserve(observer, container) {
            if (!observer) return;
            observer.unobserve(container);
        },
        handleNoAd: function() {
        },
        handleHasAd: function(width, height, fixedHeight) {
        }
    }//end of 'default' group
    };


     /**
         * this is a bound function
         * thsi is called by BOTH intersection observer AND visibility change
         * We try to differentiate which case it is by the type of param.
         * 
         * This is to be used as a bound function. The "this" has lastVisVal, lastPgVis, lastFired
         * (initially all are -1)
         * 
         * @param {*} param 
         */
    function __combiVisibilityChange(param, secondParam) {
        let lastVisVal = this.lastVisVal; //-1 , 1, 0
        let lastPgVis = this.lastPgVis; //-1, 1, 0
        let lastFired = this.lastFired; //-1, 1, 0
        let newPgVis = -1;
        let newVisVal = -1;
        let fire = -1;
        let isIR = Array.isArray(param);
        let thisObj = this;

        if (!isIR) {
            //console.log(JSON.stringify(param, null, 2));
            if (secondParam)
                console.log(JSON.stringify(secondParam, null, 2));

            if (param.data && param.data.hasOwnProperty('hidden')) {
                //the AMP stuff seems like this
                //this is the visibility stuff.
                //actually is AMP case:
                newPgVis = param.data.hidden ? 0: 1;
            }
            else if (param.target && param.target.hasOwnProperty('hidden')) {
                //dun get called at all; does not work.
                //when the event is fired, I just cannot get the thing at all
                newPgVis = param.target.hidden ? 0: 1;
            }
            else {
                //need to review this: ?! document ?!
                newPgVis = document.hidden ? 0: 1;
            }
        }
        else { //is IR ratio change
            //for AMP we actually get an array of stuff every now and then. not sure what it is doing.
            param.forEach(function(entry) {
                if (thisObj.amp) {
                    thisObj.amp.boundScrollEvent(
                        null,//this is position of the event argument of the scollcallback
                        entry.rootBounds.height,
                        entry.boundingClientRect
                    );
                }
                newVisVal = entry.intersectionRatio > visThreshold_ ? 1: 0;
                //console.log(`DEBUG new visiblity value ${newVisVal}`);
            });
        }
        
        //decision time:
        //still need to check the logic. however, the idea is . we only need to check
        //if there is a change. for amp, since there is no threshold we specifiy in observer
        //it keep on calling the callback. but doesn't mean there is need to fire visible/invisible

        if (newPgVis != -1) { //this call is triggered by visibility change
            if (newPgVis != lastPgVis) {
                this.lastPgVis =  newPgVis;
                if (newPgVis == 1) {
                    if (lastVisVal == 1)
                        fire = 1;
                }
                else {
                    fire = 0;
                }
            }
        }
        else if (newVisVal != -1) { //this call is trigged by IR change
            //the fact that this can be reported mean it is not hidden bah... the page is not hidden.
            if (newVisVal != lastVisVal) {
                this.lastVisVal = newVisVal;
                fire = newVisVal;
            }

        }
        if (fire != -1) {
            if (!this.firstViewed) {
                if (fire == 1) this.firstViewed = true;
            }
            this.notifyFcn(fire == 1 ? true: false);
            this.lastFired = fire;
        }
    }

    function fireTracker(trackers, action, extra) {
        let url = trackers.baseurl + '?' + trackers.parameters + '&action='+action;
        fetch(url, {
            method: 'get',
            credentials: 'include' 
        })
        .catch((ee) => {
        });
    }

    /*
     some creatives are uncapable of doing jixie tracker events in that case we 
     manage it the standard way for them.
     */
    function __pm2Self(msgtype) {
        let trackers = this.c.trackers;
        switch (msgtype) {
            case "jxvisible":
                this.visible = 1;
                if (trackers.actions.creativeView) {
                    trackers.actions.creativeView = 0;
                    fireTracker(trackers, 'creativeView');
                }
                if (trackers.actions.impression) {
                    let theObj = this;
                    setTimeout(function(){
                        if (theObj.visible == 1) {
                            theObj.c.trackers.actions.impression = 0;
                            fireTracker(theObj.c.trackers, 'impression');
                        }
                    }, 2000);
                }
                break;
            case "jxnotvisible":
                this.visible = 0;
                if (trackers.actions.creativeHide && !trackers.actions.creativeView) {
                    trackers.actions.creativeHide = 0;
                    fireTracker(trackers, 'creativeHide');
                }
                break;
        }
    }

    function __handleBlur(e) {
        if (document.activeElement == this.divObjs.jxCoreElt) {
            fireTracker(this.trackers, 'click'); 
        }
    }

    //iframe, totally controlled by us. 
    function __handleCreativeMsgs(e) {
        if (this.divObjs.jxCoreElt && this.divObjs.jxCoreElt.contentWindow) {
            //creative is in iframe iframe situation:
            //not meant for us, the parent then.
            if (!(this.divObjs.jxCoreElt.contentWindow === e.source)) {
                return;
            }
        }
        
        let type = null;                    
        let json = null;
        if (!e.data || typeof e.data === 'string' && e.data.indexOf('jx') != 0 ) {
            return;
        }
        console.log(`LITE received ${e.data}________________`);
        if (e.data && typeof e.data === 'string' && e.data.indexOf('jxmsg::') == 0) {
            try {
                json = JSON.parse(e.data.substr('jxmsg::'.length));
            }
            catch(err) {}
        }
        //if (!json) return; //unrelated to us, we dun bother.
        if (!json) {
            if (e.data == 'jxadended' || e.data == 'jxhasad' || e.data == 'jxnoad' || e.data == 'jxloaded')
                type = e.data;
        }
        if (!type && !json) return; //unrelated to us, we dun bother.

        //this thing will fly everywhere loh...
        //because of this type of trusted and unreformed things.
        //Things like cid=262 are precisely the problem.
        //they cannot be present with other creatives fullstop.
        //we can only limit the damage then.
        /*
        if (!(e.source === window)) {
            if (this.divObjs.jxCoreElt.contentWindow && e.source ) {
            }
            else {
            }
        }
        else {
        }
        */
        if (json) {
            type = json.type;
        }
        if (type) {
            switch (type) {
                case "jxloaded":
                    
                    //if (!json || json.token == this.token) 
                    {
                        if (this.handlers.jxloaded) {
                            this.handlers.jxloaded();
                        }
                    }
                    break;
                case "jxhasad":     
                    if (this.handlers.jxhasad) {
                        this.handlers.jxhasad();
                    }
                    break;
                case "jxnoad":     
                case "jxadended":
                    if (this.handlers.jxnoad)
                       this.handlers.jxnoad();
                    break;
                case "jxchangeheight":
                case "size":
                    //things have to be rewritten in order to get the benefits of the new design.
                    //if we are not something that can change height, then ... well.
                    //if it is fixed height
                    //so this is working already.
                    //console.log(`json.type: ${json.type}, data=${json.data}. ULITE: tk ${json.token} VS ${this.token}`);
                    //not data ah!!!
                    if (this.handlers.jxchangeheight) {
                        this.handlers.jxchangeheight(json.params.height, this.handlers.resize);
                    }
                    //we need to trigger an on window resize actually.
                    break;     
            }
        }

    }

    /*
     to be bound coreElt is assumed.
     postMessage to the creative. So that the calling code does not have to think about iframe 
     dadad bla blabla 
     */
    function __pm2Creative(msgtype, dataMaybe = null) {
        
        //aiyo I want to fix it lah!
        //jxvisible, jxnotvisible, cannot be in this form lah.
        let creativeNode = this.divObjs.jxCoreElt;
        let msgStr;
        if (msgtype == 'jxvisible' || msgtype == 'jxnotvisible') {
            msgStr = msgtype;
        }
        else {
            //if (this.c.crSig) 
            {
                let obj = {
                    type: msgtype,
                    token: this.c.token,
                    sig: this.c.crSig ? this.c.crSig: '',
                    data: dataMaybe ? dataMaybe: {}
                }
                msgStr = "jxmsg::" + JSON.stringify(obj);
            }
        }
        if (creativeNode && creativeNode.contentWindow) {
            creativeNode.contentWindow.postMessage(msgStr, '*');
        }
        else {
            window.postMessage(msgStr, '*');
        }
    }

    function __direct2Creative(msgtype, dataMaybe = null) {
        if (!this.c.crSig) {
            //for the classical stuff (not converted to the new type), we use this:
            //as they are expecting events:
            if (msgtype.indexOf('visible') > -1) {
                this.divObjs.jxCoreElt.dispatchEvent(new Event(msgtype));
            }
            return;
        }
        //dun worry nobody use this now ah
        //except your video.
        let sig = this.c.crSig;
        let token = this.c.token;
        //console.log(`MESS ${msgtype} ${sig} ${token}`);
        //console.log(dataMaybe);

        window[sig] = window[sig] || {}; 
        window[sig].queue = window[sig].queue || [];
        if (msgtype == 'adparameters' && dataMaybe) {
            let p = JSON.parse(JSON.stringify(dataMaybe));
            window[sig].queue.push(function(){
                window[sig].run(token, p);
            });//queue push
        }
        else {
            window[sig].queue.push(function(){
                window[sig].notify(token, msgtype);
            });//queue push
        }
    }
  

    /**
     * Super generic stuff to use fetch API to return a promise (the json object)
     * @param {*} adTagUrl 
     * @returns 
     */
    function fetchAdP(adTagUrl) {
        //wrap around the normal network apis.
        //returns a promise.
        //resolve with the json or reject
        //no ad then just reject promise
        return fetch(adTagUrl).then((response) => response.json());
    }

    /**
     *  isFrame
     *  isPlainScript (the meat of it, not a url of a JS file)
     *  isScript
     */
    /**
     * it will take general object normCrParams (normalized creative parameters)
     * produced by getNormalizedCreativeParams
     * 
     * and then stick the stuff into the core element (core destination element)
     * @param {*} jxCoreElt 
     * @param {*} normCrParams 
     */
     function insertCreative(jxCoreElt, normCrParams) {
         
        if (normCrParams.iframe) {
            let blob = normCrParams.iframe;
            if (blob.url) {
                //e.g. DPA: self managed firing of events
                jxCoreElt.src = normCrParams.iframe.url;
            }
            else if (blob.scripturl && !blob.jxuni_p) {
                let html = `<body style="margin: 0;"><script type="text/javascript" src="${blob.scripturl}"></script></body>`;
                jxCoreElt.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
            }
            else if (blob.scripturl && blob.jxuni_p) {
                //Who need this kind of things?
                //many old players. video sdk
                //compatiability stuff:
                let jxuni_p = {c: normCrParams.iframe.jxuni_p};
                jxuni_p.creativeid = 23;
                jxuni_p.unit = 'xyz';

                //This is script by URL
                // The creative is a script, then we create a div element in the friendly iFrame to add and execute it
                var jxinter = window.setInterval(function() {
                    // put inside function 
                    var jxiframeDoc = jxCoreElt.contentDocument || jxCoreElt.contentWindow.document;
                    if(jxiframeDoc.readyState == "complete") {
                        window.clearInterval(jxinter);
                        var jxnewDiv = jxiframeDoc.createElement('div');
                        jxnewDiv.id = "jxOutstreamContainer";
                        jxnewDiv.style.textAlign = "center";
                        jxiframeDoc.body.appendChild(jxnewDiv);
                        var ns = document.createElement("script");
                        //gosh need to pass the whole thing !!!
                        //adparameters, width, height, trackers.
                        var ins = document.createTextNode("var jxuni_p = ["+JSON.stringify(jxuni_p)+"];"); // Add all the parameters to the script
                        ns.appendChild(ins); 
                        jxnewDiv.appendChild(ns);
                        var jxjs = jxiframeDoc.createElement('script');
                        jxjs.src = normCrParams.iframe.scripturl;
                        jxnewDiv.appendChild(jxjs);
                    }
                },500);
            }
            else if (blob.scriptbody) {
                let html = '<!DOCTYPE html>'+
                    '<html>'+
                        '<head>'+
                            '<meta name="viewport" content="width=device-width, initial-scale=1">'+
                        '</head>'+
                        '<body style="margin: 0;">'+
                            blob.scriptbody+
                        '</body>'+
                    '</html>';
                jxCoreElt.style.cssText = "width:100%;height:100%;border:none;min-width:100%;min-height:100%";
                jxCoreElt.srcdoc = html; // cid=765; encodeURI(html); seems if encode the amazon ad cannot work.
                //how to generate creativeView, impression, click?
                //if this thing is third party, then it is unable to do its own events.
                //this is characteristic of third party!!
            }
            jxCoreElt.name = jxCoreElt.id;

        }
        else if (normCrParams.div) {
            let blob = normCrParams.div;
            if (blob.image) {
                jxCoreElt.innerHTML = '<a style="border-bottom: none;" href="' + blob.image.clickurl + '" target="_blank"><img src="' + blob.image.url + '" class="jxImg"/></a>';
                common.addListener(jxCoreElt, 'click', (e) => {
                    fireTracker(blob.image.trackers, 'click');
                });
            }
            else if (blob.scripturl) {
                //the likes of cid=70 (tribunnews ivs player, if force trusted = 1 )will not work here
                //that code assumes there is a div with id exactly equal to jxOutstreamContainer 
                //hardcoded ...
                //but if we dun have that then bye bye.
                //also that script has a clash of variables with the test page urlParams.
                let jxjs = document.createElement('script');
                jxjs.src = blob.scripturl;
                jxCoreElt.appendChild(jxjs);
            }
            else if (blob.scriptbody) {
                //TODO
                //this one needs fragment.
                
            }
        }
    }

    /******************************************************************************
     *  START OF : POSITION AND SIZE MANIPULATION FUNCTIONS. CALLED AS BOUND FUNCTIONS
     * 
     * The following: various function which will be bound to 
     * __createOuterContainer, __createMainContainer
     * 
     * __handleCreativeHeightChange, __handleResize, __handleScrollEvent, __cleanupContainers
     * 
     * They will all be bound with an object (the "this" in the code)
     *   it will act on those divs pointed to by the this (this.divObjs)
     *   it will also get the needed info about creative height, "showing height" etc from 
     *   this.c object
     */
    /**
     * called as bound function . See comment above "START OF : POSITION AND SIZE MANIPULATION FUNCTIONS."
     **/
    function __handleCreativeHeightChange(newH, cb) {
        let divObjs = this.divObjs;
        if (this.c.fixedHeight) {
            //console.log(`__handleCreativeHeightChange ${newH} CASE 1 ${divObjs.jxbnDiv.style.height}, ${divObjs.jxbnScaleDiv.style.height}`);
            divObjs.jxCoreElt.style.height = newH + 'px'; //seems to be ok.
            divObjs.jxbnFixedDiv.style.height = newH + 'px';//seems to be ok
            this.c.creativeH = newH;
            //bnDiv (100%) and ScaleDiv (auto) that won't change
            this.c.height = newH;
        }
        else {
            //console.log(`__handleCreativeHeightChange ${newH} CASE 2`);
            divObjs.jxCoreElt.style.height = newH + 'px';
            divObjs.jxbnDiv.style.height = newH + 'px';
            divObjs.jxbnScaleDiv.style.height = newH + 'px';
            divObjs.jxbnFixedDiv.style.height = newH + 'px';
            this.c.height = newH;
        }
        setTimeout(cb, 2);
    }

    /**
     * called as bound function . See comment above "START OF : POSITION AND SIZE MANIPULATION FUNCTIONS."
     **/
    function createOuterContainer(containerId, jxContainer, normCrParams) {
        
        let oDiv = null;
        let iDiv = null;
        let id = containerId; //"jx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        
        //let id = "jx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        if (!oDiv) {
            oDiv = common.newDiv(jxContainer, 'div', null, null, 'f' + id);
        }
        if (!oDiv) {
            throw new Error("unable to create essential container (outer)");
        }
        iDiv = common.newDiv(oDiv, 'div', null, null, 'ifr' + id);
        iDiv.style.cssText = "width: 100%; border: 0";
        iDiv.style.textAlign = "center";
        if (!iDiv) {
            throw new Error("unable to create essential container (inner)");
        }

        /**
         * if we have the fixed height, we need to set the height of container to be the value given from the jxParams
         * then the outter div and inner div need to set the height to be 100%
         */
        if (normCrParams.fixedHeight > 0) {
            jxContainer.style.height = normCrParams.fixedHeight + "px";
            oDiv.style.height = "100%";
            iDiv.style.height = "100%";
        }
        let divObjs = {};
        //write that into the bound object
        divObjs.innerDiv = iDiv;
        divObjs.outerDiv = oDiv;
        divObjs.container = jxContainer;
        divObjs.jxID = id;
        
        return divObjs;
    }
    
    /**
     * called as bound function . See comment above "START OF : POSITION AND SIZE MANIPULATION FUNCTIONS."
     **/
    /**
     * The this.divObjs have the innerDiv created already; We need here to start 
     * work all the jxmasterDiv etc will be saved in the this.divObjs 
     * How does it know what size and all that? it comes from normCrParams. 
     * See comments on "normalized creative params" in the code:
     * @param {*} normCrParams 
     * @returns the jxCoreElt (this is the real div or iframe to house the creative script (jsfile, or snipplet) 
     * or html file)
     */
    function createMainContainer(divObjs, normCrParams) {
        let id = divObjs.jxID;
        let jxmasterDiv = common.newDiv(divObjs.innerDiv, 'div', null, null, 'jxm_' + id);
        let jxbnDiv = common.newDiv(jxmasterDiv, 'div', null, null, 'jxb_' + id);
        
        let jxbnScaleDiv = common.newDiv(jxbnDiv, 'div', null, null, 'jxbs_' + id);
        let jxbnFixedDiv = common.newDiv(jxbnScaleDiv, 'div', null, null, 'jxbf_' + id);
        let jxCoreElt = null;


        jxmasterDiv.style.position = 'relative';
        jxmasterDiv.style.margin = 'auto';
        jxbnDiv.style.position = 'relative';
        jxbnDiv.style.display = 'inline-block';
        jxbnDiv.style.background = "transparent";
        jxbnDiv.style.overflow = 'hidden';


        //20210723: still need to think about this a bit more
        //sorry for the mess here:
        //this following stuff uses the creative's sizing info:
        //this is what is new!!!
        //if (normCrParams.maxwidth)
        jxmasterDiv.style.maxWidth = normCrParams.maxwidth + 'px';
        //else            
        //    jxmasterDiv.style.width = normCrParams.width + 'px';
        //if (normCrParams.maxwidth)
            jxbnDiv.style.maxWidth = normCrParams.maxwidth + 'px';

        if (normCrParams.maxheight) {
            //jxmasterDiv.style.maxHeight = normCrParams.maxheight + 'px';
            //jxbnDiv.style.maxHeight = normCrParams.maxheight + 'px';
        }
        
        jxbnDiv.style.height = normCrParams.height + 'px';
        jxbnDiv.style.width = '100%';
        jxbnFixedDiv.style.width = normCrParams.width + 'px';
        jxbnFixedDiv.style.height = normCrParams.height + 'px';
        jxbnScaleDiv.style.width = (normCrParams.width ) + 'px';
        //jxbnScaleDiv.style.border = '1px solid black'; //renee
        //jxbnScaleDiv.style.zIndex = 99999999;
        jxbnScaleDiv.style.height = (normCrParams.height ) + 'px';

        //FANCYSCROLL
        /**
         * if we have the fixed height, we need to set the master div and bn div to be 100% height
         * and for the scaled div need to have absolute position, coz we will move the creative within the window by setting the top position of scaled div
         * also the scaled div need to have an auto height to support this kind of fixed height
         */
         if (normCrParams.fixedHeight > 0) {
            jxmasterDiv.style.height = "100%";
            jxbnDiv.style.height = "100%";
            jxbnScaleDiv.style.height = "auto";
            jxbnScaleDiv.style.position = "absolute";
            jxbnScaleDiv.style.inset = "0px";
            jxbnScaleDiv.style.top = "0px"; //it will be changed upon some scrolling
        }
        //--->
       
        if (normCrParams.iframe) { //not trusted 
            jxCoreElt = document.createElement('iframe');
            jxCoreElt.setAttribute('frameborder', '0');
            jxCoreElt.setAttribute('scrolling', 'no');
            jxCoreElt.setAttribute('allowTransparency', 'true');
        } else {
            jxCoreElt = document.createElement('div');
        }
        jxCoreElt.id = destContainerPrefix_ + id; //<==== ==== ==== ====
        jxCoreElt.style.cssText = 'maxwidth:none!important;maxheight:none!important;position:absolute;left:0;top:0;background-color:white;border:none;width:' + normCrParams.width + 'px;height:' + normCrParams.height + 'px;'
        
        jxCoreElt.style.maxWidth = 'none !important'; 
        jxCoreElt.style.maxHeight = 'none !important';
        jxCoreElt.style.position = 'absolute';
        jxCoreElt.style.left = '0';
        jxCoreElt.style.top = '0';
        jxCoreElt.style.backgroundColor = 'white';
        jxCoreElt.style.border = 'none';
        jxCoreElt.style.width = normCrParams.width + 'px';
        
        jxCoreElt.style.height = normCrParams.height + 'px';

        

        //jxCoreElt.style.zIndex = 99999;
      
        insertCreative(jxCoreElt, normCrParams);
        jxbnFixedDiv.appendChild(jxCoreElt);

        //at this stage it is unclear to me if we really need to remember all these things:
        divObjs.jxmasterDiv = jxmasterDiv;
        divObjs.jxbnDiv = jxbnDiv;
        divObjs.jxbnFixedDiv = jxbnFixedDiv;
        divObjs.jxbnScaleDiv = jxbnScaleDiv;
        divObjs.jxCoreElt = jxCoreElt;
        return jxCoreElt;
    }
   
    /**
     * called as bound function . See comment above "START OF : POSITION AND SIZE MANIPULATION FUNCTIONS."
     **/
    /**
     * This is the stuff to do the scaling and transform if we find that
     * the creative cannot be shown in full.
     * Note: even if there is the fixedHeight stuff, we might still need to call this
     * (coz the width aspect of it might still be challenged and therefore still require 
     * scaling)
     */    
    function __handleResize() {
        //console.log(new Error().stack);
        let c = this.c;
        let jxbnDiv = this.divObjs.jxbnDiv;
        let jxbnScaleDiv = this.divObjs.jxbnScaleDiv;
    
        /*
            Renee new idea:
            suppose the maxwidth and maxheight given is not useful.
            i.e. practically it is more restricted.
            e.g. 300x600 creative
            actual possible is this:
            250 is the real maxwidth --> 250x500
            400 is the real maxheight --> 200x400 --> this is the real possible.
        */
        let ratio;
        if (JX_FLOAT_COND_COMPILE) {
            ratio = jxbnDiv.offsetWidth/c.width;
        } 
        else 
        {
            ratio = Math.min(jxbnDiv.offsetWidth/c.width, jxbnDiv.offsetHeight / c.height);
        }

        let newH = ((c.height*ratio) + 5);
        //console.log(`realW=${jxbnDiv.offsetWidth} realH=${jxbnDiv.offsetHeight} cWidth=${c.width} cHeight=${c.height} ==> newH ${newH}`);

        //console.log(`__handleResizeContainer ratio=${ratio} (=${jxbnDiv.offsetWidth}/${c.width}) newH=${newH} (=${c.height}*${ratio})`);
        //Not sure how to combine the fixedHeight stuff with this squashing though!!
        //if (c.fixedHeight > 0) newH = "100%";
        //question is: if we are doing the fixedHeight thing.
        //what to do here?
        //we could STILL need scaling.
        //suppose fixed height is 400px
        //but the max width is 250px meaning 
        //the thing should be scaled to 250x500px
        //i.e. the challenge is to show 500px height of stuff within a 400px box.
        //this seems to work fine.
        if (c.fixedHeight && c.doDiffScroll) {
            ratio = jxbnDiv.offsetWidth/c.width;
            c.creativeH = c.height*ratio;
            //console.log(`_WOO_ H=${c.creativeH} h=${c.height} r=${ratio}`);
        }
        switch(c.type) {
            case 'player':
            case 'display': // we resize applying a transformation ratio
            case 'video':
                jxbnScaleDiv.style.transform = 'scale(' + ratio + ') translate3d(0px, 0px, 0px)';
                jxbnScaleDiv.style.transformOrigin = '0px 0px 0px';
                if (!c.fixedHeight) {
                    jxbnDiv.style.height = newH + 'px';
                }
                break;
            /*  REMOVE FOR NOW WE MIGHT NOT SUPPORT
            case 'iframe': // we just resize the width of the different elements
                this.divObjs.jxbnFixedDiv.style.width = jxbnDiv.offsetWidth + 'px';
                jxbnScaleDiv.style.width = jxbnDiv.offsetWidth + 'px';
                this.divObjs.jxCoreElt.style.width = jxbnDiv.offsetWidth + 'px';
                break;
            */                
        }
     }

    /**
     * called as bound function . See comment above "START OF : POSITION AND SIZE MANIPULATION FUNCTIONS."
     **/
    /**
      * This function could be called really as a on scroll callback
      * (for nonAMP that's how we use it - in this case, the event param
      * will be there (but we do not use it). There will not be windowHeight and BCR params
      * 
      * In the AMP case, we call this explicitly (null, windowHeight: a number and
      * BCR, an object). We call this from the intersection observer in context of AMP.
      */
    
    function __handleFloated() {
        this.univmgr.hide();
        if (this.cb) this.cb();
    }
    function __handleDocked() {
        this.univmgr.show();
        if (this.cb) this.cb();
    }

// What is this constant?     
// for case the container is taller than the ad     
// if the difference is < this threshold, then we dun bother
// else such little movements is just ridiculous
const thresholdDiff_ = 120;     
     function __handleScrollEvent(event, windowHeight = null, BCR = null) {
        //console.log(`windowHeight=${windowHeight} BCR=${BCR}`);
        let c = this.c;
        let jxbnScaleDiv = this.divObjs.jxbnScaleDiv;
        let diff = c.containerH - c.creativeH; 
        //console.log(`__handleScroll diff: ${diff} containerH: ${c.containerH} creativeH: ${c.creativeH}`);
        
        //for AMP we get this from the first parameter
        let winH = windowHeight ? windowHeight: top.innerHeight;
        let containerBCR = BCR ? BCR: this.containerElt.getBoundingClientRect();

        // The whole job of this function, is to calculate offset:
        let offset = 0;

        let delta = this.excludedH; 
        let vertOffsetToOurFrame = 0;

        if (!BCR) {
            //the non-AMP case (AMP base the params windowHeight & BCR would be set)
            //if friendly iframes, we still have to work out the top offset with
            //respect to the top of the viewport.
            let currW = window;
            while (currW !== top) {
                var rect = currW.frameElement.getBoundingClientRect();
                vertOffsetToOurFrame += rect.top;
                currW = currW.parent;
            }
        }
        let containerBCR_top = containerBCR.top - delta + vertOffsetToOurFrame;
        let containerBCR_bottom = containerBCR.bottom - delta + vertOffsetToOurFrame;
        winH = winH - delta;
        //console.log(`ad=${c.creativeH} osm=${c.containerH} vp=${winH} bcrtop=${containerBCR.top} bcrbot=${containerBCR.bottom}`);
        if (c.containerH > winH) {
            if (containerBCR_top < 0) {
                // special case of a very short viewport (shorter than the container). 
                if (c.creativeH < winH) {
                    // creative height is shorter than that of viewport
                    //console.log(`kicked in ${0 - containerBCR.top} ${diff}`);
                    offset = Math.min(0 - (containerBCR_top), diff);
                }
                else {
                    // creative height is longer than that of viewport.
                    offset = ((0-containerBCR_top)*(diff))/(c.containerH-winH);
                    // the Math.min one is when creative is taller than container
                    // the Math.max is when creative is shorter .
                    offset = (offset >= 0 ? Math.min(offset, diff): Math.max(offset, diff));
                }
            }
        }
        else {
            // The more common whereby the container height is < viewport height:
            if (diff < 0) {
                // creative is taller than container: This is the most common case:
                if (containerBCR_bottom <= winH) {
                    //console.log(`____ diff=${diff} val=${((winH - containerBCR_bottom)*(diff))/(winH-c.containerH)}`);
                    offset = Math.max(
                        diff, //negative
                        ((winH - containerBCR_bottom)*(diff))/(winH-c.containerH)
                    );
                }
            }
            else {
                // container is taller than creative
                if (containerBCR_top < 0) {
                    if (diff > thresholdDiff_) {
                        offset = Math.min(diff, 0 - containerBCR_top);
                    }
                }
            }
        }
        //console.log(`____ ----> OFFSET ${offset}`)
        //if (offset != this.savedoffset) 
        {
            //we set the top= offset only if it is different from last set.
            this.savedoffset = offset;
            jxbnScaleDiv.style.top = offset + 'px';
        }
    }

    
    /**
     * called as bound function . See comment above "START OF : POSITION AND SIZE MANIPULATION FUNCTIONS."
     **/
    function __cleanup() {
        let unhook = this.unhook;
        if (unhook.observer) {
            unhook.unobserve(unhook.observer, unhook.container);
        }
        if (unhook.listeners) {
            //use a loop lah
            if (unhook.listeners.message) {
                unhook.unlisten('message', unhook.listeners.message);
            }
            if (unhook.listeners.scroll) {
                unhook.unlisten('scroll', unhook.listeners.scroll);
            }
            if (unhook.listeners.resize) {
                unhook.unlisten('resize', unhook.listeners.resize);
            }
            if (unhook.listeners.visibilitychange) {
                unhook.unlisten('visibilitychange', unhook.listeners.visibilitychange);
            }
            if (unhook.listeners.blur) {
                unhook.unlisten('blur', unhook.listeners.blur);
            }
        }
        
        let tmp = this.divObjs.outerDiv;
        if (tmp && tmp.parentNode) {
            tmp.parentNode.removeChild(tmp);    
        }
    }
    /**
     *  END OF : POSITION AND SIZE MANIPULATION FUNCTIONS. 
     * CALLED AS BOUND FUNCTIONS
     *******************************************************************************/ 
     const onlyARMatterTypes_ = ['video'];
     const bigWidth_ = 999;
     const bigHeight_ = 999;

     function noDiffScroll(cr) {
        return cr.type == 'video' || cr.subtype == 'video+banner';
    }

    /**
     * Note: This will be put at adserver side soon. Then client side no need
     * do this. The adserver will add that out blob into the response JSON.
     * @param {*} cr 
     * @returns 
     */
     function creativeSizeRangeRepair(cr) {
         let scaling = 'none';
         if (cr.assets && cr.assets.universal) {
            scaling = cr.assets.universal.scaling;
         }
         if (cr.universal) {
            scaling = cr.universal.scaling;
         }
         if (scaling != 'creative'  && scaling != 'renderer') {
            if (cr.type == 'video') {
                //Hack:
                //this will be chnaged at adserver level.
                //currently the video+banner subtype (of type=display) is
                //changed to type=video vvpaid before being sent to the page
                //in the universal response.
                if (cr.adparameters && (cr.adparameters.topbanner || cr.adparameters.bottombanner))
                    ;
                else                    
                    scaling = 'creative';
            }
            else scaling = 'none';
         }
         cr.scaling = scaling;
         /////if (cr.id == 724)
            //////cr.scaling = 'none'; 
         
        // (2) Get ready the Creative size (resize) info (some of these 
        // can be done before caching )
        //<--- This whole thing should be set in the precache preparation :
    
        // (2a) width, height columns
        let w = cr.width ? cr.width: 0;
        let h = cr.height ? cr.height: 0;
        // (2b) assets
        if ((!w || !h) && cr.assets) { //server-side
            w = cr.assets.width ? cr.assets.width: 0;
            h = cr.assets.height ? cr.assets.height: 0;
        }
        // (2c) subtype
        //still can get from the subtype
        if ((!w || !h) && cr.type == 'display') {
            let subtype = cr.subtype.replace("d", "").replace("r", "");
            let arr = subtype.split("x");
            if (arr.length == 2) {
                w = parseInt(arr[0]);
                h = parseInt(arr[1]);
            }
        }
        // (2d) some are in adparameters ?
        if (!w || !h) {
            let p = cr.assets && cr.assets.adparameters ? cr.assets.adparameters: cr.adparameters;
            if (p) {
                w = p.width ? p.width: 0;
                h = p.height ? p.height: 0;
            }
        }
        // ok exhausted all 
        if (!w || !h) {
            //cannot serve this corrupted creative
            return null;
        }
        let crAR = w/h;
        if (cr.scaling == 'creative' && onlyARMatterTypes_.indexOf(cr.type)> -1) {
            w = 0;// to facilate the below calculations
            h = 0;
        }
        // Reminder that so for video : w and h are both set to 0 at this stage:
        let crMaxW = w;
        let crMinW = w;
        let crMaxH = h;
        let crMinH = h;

        //none renderer, creative

        if (scaling != 'none') {
            // if it is not responsive, then crMaxW and crMinW = width of creative
            // ditto for height, nothing much to further calculate then:
            let u = cr.assets && cr.assets.universal ? cr.assets.universal : cr.universal;
            //make the max W and H specified in the creative be consistent
            //with aspect ratio
            let maxW = u && u.maxwidth ? u.maxwidth: 0;
            let maxH = u && u.maxheight ? u.maxheight: 0;
            if (maxW && maxH) { //if both are given, then make sure they are
                //consistent with AR.
                let AR1 = maxW/maxH;
                if (AR1 > crAR) {
                    maxW = maxH*crAR;
                }
                else {
                    maxH = maxW/crAR;
                }
            }
            else if (maxW) {
                //if one is given, make sure the other is set per AR.
                maxH = maxW/crAR;
            }
            else if (maxH) {
                //if one is given, make sure the other is set per AR.
                maxW = maxH*crAR;
            }
    
            // Same drill but for the MIN w and h:
            let minW = u && u.minwidth ? u.minwidth: 0;
            let minH = u && u.minheight ? u.minheight: 0;
            if (minW && minH) {
                let AR1 = minW/minH;
                if (AR1 > crAR) {
                    minW = minH*crAR;
                }
                else {
                    minH = minW/crAR;
                }
            }
            else if (minW) {
                minH = minW/crAR;
            }
            else if (minH) {
                minW = minH*crAR;
            }
            //
            if (!maxW) {
                maxW = bigWidth_;
                maxH = bigHeight_;//dun care AR for such.
            }
            //now maxW, maxH, minW, minH are all set to intentional values//
    
            //Now revisit how to set crMaxW, ... etc:
            //responsive=true, and go smaller is always technically possible 
            //so whateverso we can lower the crMinH crMinW ...
            if (minH  < crMinH) {
                crMinH = minH;
            }
            if (minW  < crMinW) {
                crMinW = minW;
            }
            //whether we can go higher ... that one is a technical thing which only
            //the creative can do, if they choose to:
            if (cr.scaling == 'creative' || cr.scaling == 'renderer') {
                if (maxW > crMaxW) {
                    crMaxW = maxW;
                }
                if (maxH > crMaxH) {
                    crMaxH = maxH;
                }
            }
        }
          
        // the precache should add the properties
        //{
            //crMaxW, crMinW, crMaxH, crMinH, crAR, ? width, height
        //}
        //--->
        if (!crMaxW) crMaxW = bigWidth_;
        if (!crMaxH) crMaxH = bigHeight_;
        return {
            aspectratio:    crAR,
            width:          w, //for video will be 0
            height:         h, //for video will be 0
            maxwidth:       crMaxW,
            minwidth:       crMinW, 
            maxheight:      crMaxH,
            minheight:      crMinH 
        };
    }
     function doSizeMgmt(params, cr) {
         //debugger;
        let crSizeRange = creativeSizeRangeRepair(cr);
        //console.log(crSizeRange);
        //console.log("^^ repaired sizes of adserver response above^^");
        //console.log(".........................................");
        //console.log(params);
        //console.log("^^ jxParams above^^");

        let w_ = params.width ? params.width: 640; 
        let h_ = params.height ? params.height: 360;
        let mw_ = params.maxwidth ? params.maxwidth: 0;
        let mh_ = params.maxheigth ? params.maxheight : 0;
    
        let AR = crSizeRange.aspectratio;
        if (!AR) { 
            AR = 1.66
        };
        let doDiffScroll = (params.fixedheight ? true: false);
        if (cr.scaling == 'creative') {
            if (params.fixedheight && noDiffScroll(cr)) {
                doDiffScroll = false;
                //try to fill this limited height:
                h_ = params.fixedheight;
                w_ = params.fixedheight*AR;
                let l = Math.min(params.maxwidth ? params.maxwidth: bigWidth_, crSizeRange.maxwidth);
                if (w_ > l) {
                    w_ = l;
                    h_ = w_/AR;
                }
                l = Math.min(params.maxheight ? params.maxheight: bigHeight_, crSizeRange.maxheight);
                if (h_ > l) {
                    h_ = l;
                    w_ = l*AR;
                }
            }
            else {
                //for video remember now we are 0 hor.
                //we have a width guideline
                if (cr.width)
                    w_ = cr.width;
                if (params.pgwidth && params.pgwidth > w_) {
                    w_ = params.pgwidth;
                }
                let l = Math.min(params.maxwidth? params.maxwidth: bigWidth_, crSizeRange.maxwidth);
                if (w_ > l) {
                    w_ = l;
                }
                h_ = w_/AR;
            }
            mh_ = h_;//so we won't have funny thing to trigger scaling at our level
            mw_ = w_;
        }
        else {
            if (params.fixedheight && noDiffScroll(cr)) {
                //if not enough then we need to clip then?
                doDiffScroll = false;
            }
            w_ = crSizeRange.width;
            h_ = crSizeRange.height;
            mw_ = Math.min(params.maxwidth?params.maxwidth:bigWidth_, crSizeRange.maxwidth);
            mh_ = Math.min(params.maxheight?params.maxheight:bigHeight_, crSizeRange.maxheight);
        }
        
        cr.width = w_;
        cr.height = h_;
        cr.maxwidth = mw_;
        cr.maxheight = mh_;
        cr.doDiffScroll = doDiffScroll;
        //console.log(`${w_} ${h_} ${mw_} ${mh_}`);
        //console.log("^^ w h mw mh ^^");
    }

    function sanitizeTitle(t){
        return  t.normalize('NFD').replace(/[^a-zA-Z0-9\s]/g, '').replace(/[\u0300-\u036f]/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"]/g,'');
    }
    /**
     * From every kind of creative supported we just extract a few common values
     * sufficiently to interact with the core element where we are supposed to
     * insert the creative
     * (purpose to prepare this normalized object is to make the code to insert the 
     * creative as generic as possible)
     * @param {*} jxParams 
     * @param {*} c - creative object from adserver
     * @returns a normalized creative params object
     */
    function getNormalizedCreativeParams(jxParams, c) {
        /** FANCYSCROLL:
         * if we have fixed height, then we need to set the nested to be -1. so the learn more and info button won't be shown
         * this is the just the only solution for now, coz I still can't find the way to support this kind of buttons when we are moving the creative within the window
         */
        let nested = jxParams.nested;

        if (!isNaN(jxParams.fixedHeight)) {
            fixedHeight = parseInt(jxParams.fixedHeight);
            if (fixedHeight > 0)
                nested = -1;
        }
        
        //this is the case whereby the creative itself will not manage the tracker firing
        //so WE HERE need to do it.
        let doBasicTrackers = c.type != 'video' && c.thirdpartytag;
        let trackers = c.trackers ? c.trackers: ( c.adparameters.trackers ? c.adparameters.trackers: null);
        let clicktrackerurl = null;
        if (trackers) {
            trackers = JSON.parse(JSON.stringify(trackers));
            clicktrackerurl = trackers.baseurl + '?' + trackers.parameters + '&action=click';
        }
        //ok I know what is the problem.
        //width and height supposed to be the perceived height of the creative.
        doSizeMgmt(jxParams, c);

        let out = { 
            nested:             nested,
            type:               c.type,
            clickurl:           c.clickurl, 
            clicktrackerurl:    clicktrackerurl,
            width:              c.width, 
            height:             c.height,
            maxwidth:           c.maxwidth,
            maxheight:          c.maxheight,
            fixedHeight:        jxParams.fixedHeight ? jxParams.fixedHeight: 0, //we stuff something in first.
            excludedHeight:     jxParams.excludedHeight ? jxParams.excludedHeight: 0,
            doDiffScroll:       c.doDiffScroll
        };

        if (JX_FLOAT_COND_COMPILE) {
            if (jxParams.doFloat) {
                out.floatParams = {
                    floatType:          jxParams.floatType,
                    floatLocation:      jxParams.floatLocation,
                    floatWidth:         jxParams.floatWidth,
                    floatVMargin:       jxParams.floatVMargin,
                    floatHMargin:       jxParams.floatHMargin,
                    floatBackground:    jxParams.floatBackground,
                };
            }
        }

        if (c.adparameters)
            out.adparameters = c.adparameters;
        if (c.thirdpartytag) {
            delete out.adparameters;
        }
        let trusted = (c.adparameters && c.adparameters.trusted ? true: false);
            //Their common characteristics: all to be in iframe.
            //then need a jxOutstream injected into the iframe as well.    
            const playerUrls_ = {
                video: 'https://scripts.jixie.io/jxplayerbridge.1.1.min.js?', 
                pyoutube: 'https://scripts.jixie.io/jxyoutubebridge.1.0.min.js', 
                pdailymotion: 'https://universal.jixie.io/js/jxplayerdm.1.4.1.js?', 
                pivs: 'https://universal.jixie.io/js/jxplayerivs.1.2.js?'
            };

        switch (c.type) {
            case 'player': {
                let surl;
                switch (c.subtype) {
                    //page info etc also need to do properly.
                    case 'pyoutube':
                    case 'pdailymotion':
                    case 'pivs':
                        // the naked scripts all work in iframe only:
                        surl = playerUrls_[c.subtype];
                        out['iframe'] = { scripturl: surl, jxuni_p: JSON.parse(JSON.stringify(c)) };
                        delete out.adparameters;
                        break;
                    case 'pscript':
                        surl = (!c.script ? c.url: c.script);
                        surl += (surl.indexOf('?') != -1 ? '&': '?') + 'trackers=' + btoa(JSON.stringify(c.trackers));
                        if (c.adparameters) surl += '&adparameters=' + btoa(JSON.stringify(c.adparameters));
                        // add missing pagetitle property
                        surl += '&pagetitle=' + btoa(sanitizeTitle(jxParams.pagetitle));
                        // add missing pagekeywords property
                        if (jxParams.pagekeywords) surl += '&pagekeywords=' + btoa((jxParams.pagekeywords));
                        //should we also add those stuff from jxParams to the blob
                        out[trusted? 'div':'iframe'] = { scripturl: surl, jxuni_p: JSON.parse(JSON.stringify(c)) };
                        // add missing pagetitle property and pagekeywords
                }//inner switch
                }
                break;
            case 'iframe':
                switch (c.subtype) {
                    case 'iscript':
                        //54, 65, 70 (those player stuff that are not used)
                        let surl = (!c.script ? c.url: c.script);
                        surl += (surl.indexOf('?') != -1 ? '&': '?') + 'trackers=' + btoa(JSON.stringify(c.trackers));
                        if (c.adparameters) surl += '&adparameters=' + btoa(JSON.stringify(c.adparameters));
                        // add missing pagetitle property and pagekeyword
                        //out.crSig = 'tribun';
                        out[trusted? 'div':'iframe'] = { scripturl: surl };
                        out.json = JSON.parse(JSON.stringify(c));
                        break;
                    default:
                        //e.g. the famous cid=29
                        //srcUrl = o.bUrl.iother;
                        let url = 'https://universal.jixie.io/iframe.1.1.html?'; //broker
                        url += 'creative=' + btoa(JSON.stringify(c)) + '&trackers=' + btoa(JSON.stringify(c.trackers));
                        out['iframe'] = { url: url };
                        break;
                }
                break;    
            case 'video': 
                trusted = false; //our video sdk will operate in friendly iframe
                out.adparameters = c; //<--- this is a special behaviour for video sdk stuff.
                //the videoadsdk needs more than the adparameters but 1 level up (still need generate vast)
                //this c blob contains a property adparameters                 
                if (!c.adparameters) { 
                    //case of third party tag; for vast generation
                    c.adparameters = { trackers: JSON.parse(JSON.stringify(c.trackers)) };
                }
                //only those that are managed by us have this property
                delete out.adparameters.trackers;
                out['iframe'] = { 
                    scripturl: jxScriptUrls_.video.url
                };
                break;
            case 'display':
                switch (c.subtype) {
                    case 'video+banner':
                        //now from adserver it is already morphed into video vvpaid
                        break;
                    case 'script':
                        let sbody = null;
                        try {
                            //example is the amazon display ad.
                            sbody = atob(c.script);
                        }   
                        catch (err) {
                            //need to handle properly.
                        } //TODO
                        let sbody1 = addGAMNoAdNotifyMaybe(sbody);
                        if (sbody1) {
                            sbody = sbody1;
                        }
                        doBasicTrackers = true; //totally managed by us in fact.
                        out[trusted? 'div':'iframe'] = { scriptbody: sbody };
                        delete out.adparameters;//nothing to tell to the creative
                        break;
                    default: //can be either simple image or DPA (html). Still have to figure out...
                        let psr = document.createElement('a');
                        psr.href = c.url;
                        if (psr.pathname.indexOf('.htm') === -1 && psr.pathname.indexOf('.html') === -1) {
                            doBasicTrackers = true; //totally managed by us in fact.
                            c.noclickevents = true; //so below we force it to not do click events
                            out['div'] = { image: { url: c.url, clickurl: c.clickurl, trackers: c.trackers }};
                            delete out.adparameters;
                        }
                        else {
                            if (c.url.indexOf('amazonaws.com') == -1) {
                                c.url = c.url.replace(/index.min.html/g, "index.std-ulite.min.html");
                                c.url = c.url.replace(/index.lt.min.html/g, "index.lt-ulite.min.html");
                            }
                            if (c.scaling == 'creative') {
                                //in the doSizeMgmt... it is possible
                                //that the widht and height has changed:
                                //instruct the DPA to do so:
                                out.adparameters.display_htmlsize = out.width+"x"+out.height;
                            }
                            out.iframe = { url: c.url };
                        }
                        break;
                }
                break;
        }//switch
        //console.log(JSON.stringify(out, null, 2));
        if (doBasicTrackers) {
            trackers.actions = { creativeView: 1, impression: 1, creativeHide: 1};
            if (!c.noclickevents) {
                //some of those there is our click proxy integrated into the tag so for those
                //we no need use such mechanism to approximate clicks
                trackers.actions.click = 1;
            }
            out.trackers = trackers;
        }
        if (out.fixedHeight > 0) {
            //if we have fixed height, then we need to set the nested to be -1. so the learn more and info button won't be shown
            //this is the just the only solution for now, coz I still can't find the way to support this kind of buttons when we are moving the creative within the window
            out.nested = -1;
        }
        if (c.universal) {
            out.universal = c.universal;//??
        }
        return out;
    }

    //===============================================

    var makeAdRenderer = function(params) {
        var _jxParams = null;
        var _jxContainer = null;
        
        var _floatInst = null; //in the build that does not build in the float code, this will
                               //always be null.
                               //in the build that has float capability, this may be non-null
                               //If the configuration says that they want float mode,
                               //then there will be a _floatInst != null then.
        
        //not sure if we need to put this here at this level or just functional scope enough.
        
        //we just bound this to the createOuterContainer, createMainContainer, cleanupContainers
        //to avoid unnecessary having all those div variables at this level.
       
        /**
         * Main function : to kick off the ad call and render the ad etc
         * @param {*} jxContainer 
         *  handles 1 level of the waterfall                     
         */
        var _startP = function(jxContainer, remainingCreativesArr, next) {
            let univmgr = MakeOneUniversalMgr();
            let instId = "jx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        
            let divObjs = {}; //this will get filled in (all the outer div, inner div, master div,...
            //several functions have AMP and non-amp versions. Make sure we use the correct one
            
            let cxtFcnsVector = fcnVectorsByContext_[_jxParams.context];
            if (!cxtFcnsVector) {
                cxtFcnsVector = fcnVectorsByContext_.default;
            }
            //we will be saving the bound functions we set to listen on various window/document
            //events into here. This is to facilitate un-listening and unobserving:
            let unhook = {
                unlisten: cxtFcnsVector.unlisten,
                unobserve: cxtFcnsVector.unobserve,
                listeners: {} //<-- function "pointers" will get filled in
            };
            let boundHandleResize               = null;
            let boundHandleBlur                 = null;
            let boundHandleCreativeHeightChange = null;
            let boundPM2Creative                = null; 
            let boundScrollEvent                = null; //wait but this is only for non-AMP and certain scenarios.  TODO
            let boundCleanupThisCreative        = null;
            let normCrParams                    = null;

            // if (JX_FLOAT_COND_COMPILE) {
                let boundHandleFloated              = null;
                let boundHandleDocked               = null;
            // }
            //some stuff about the creative, may still change during runtime.
            //let sharedCreativeRTObj;
            let creativeObj = remainingCreativesArr.shift();

            // MOST IMPORTANT CALL. THE NORMALIZED PARAMS OF THE CREATIVE: 
            normCrParams = getNormalizedCreativeParams(_jxParams, creativeObj);

            //these 2 will create the outer and inner div
            divObjs = createOuterContainer(instId, jxContainer, normCrParams);


            //these 2 will create master, fixed div dadada. Basically everything
            //and the script (if any) would be planted at this stage. 
            //Wah then the function name is very bad leh.
            boundCleanupThisCreative        = __cleanup.bind({divObjs: divObjs, unhook:unhook});

            //reminder: adparameters is what to commuicate to creative
            //it is different from those you plant in the jxuni_p
            let crReady2HearAdParamsResolve = null;
            let crHasAdResolve = null;
            let crHasAdProm =  normCrParams.trackers ? Promise.resolve(): new Promise(function(resolve) {crHasAdResolve = resolve;});
            //who will not say has ad?
            //third party stuff , our own processed ones.
            
            let crInIframe = normCrParams.iframe;
            //IF we do not need to communicate any adparameters to the creative, then nothing to wait on:
            let crReady2HearAdParamsProm =  ( crInIframe && normCrParams.adparameters ? 
                new Promise(function(resolve) {crReady2HearAdParamsResolve = resolve;}) : 
                Promise.resolve());
            //that of the creative script we are dealing with now.

            //<-- at first we must at least listen to the loaded event from the creative
            //Once we call createMainContainer, the creative will run and the jxloaded may be called 
            //anytime. So start listening:
            let msghandlers = {};
            let token = destContainerPrefix_ + instId; 
            msghandlers['jxloaded'] = crReady2HearAdParamsResolve;
            boundHandleCreativeMsgs = __handleCreativeMsgs.bind({ 
                divObjs: divObjs, token: token, handlers: msghandlers });
            common.addListener(window, "message", boundHandleCreativeMsgs);
            unhook.listeners.message = boundHandleCreativeMsgs; 
            //-->
            
            normCrParams.token = token;
            // IMPORTANT 
            // IIMPORTANT: within here the creative is INSERTED into the DOM
            // That's why above, we already started listening to the loaded event.
            let destElt = createMainContainer(divObjs, normCrParams);
            //  

            //Coz there can be multiple instances of universal lite on the page
            //we must be sure we are talking/listening to the right party: coz there will be all sorts
            //of messages from different creatives being postMessaged-ed and we will get all of them.
            //But we only want to process the ones from the creative associated with THIS instance of the
            //universal

            //we use the token to help us. (commObj stands for "communications object")
            normCrParams.token = token;

            //This is very important
            //if there are trackers means are managing everything, there is no creative to talk to
            //iframe is iframe (postmessage),
            //direct2Creative (we dun have it yet.... not working yet need to fix for some of those player scripts)
            boundPM2Creative = (
                normCrParams.trackers ? 
                    __pm2Self.bind({divObjs:divObjs, c: normCrParams}): 
                    (normCrParams.iframe ?
                        __pm2Creative.bind({divObjs:divObjs, c: normCrParams}) :
                        __direct2Creative.bind({divObjs:divObjs, c: normCrParams}))
                );
                
            normCrParams.creativeH  = normCrParams.height;
            normCrParams.containerH = normCrParams.fixedHeight;
            boundHandleResize               = __handleResize.bind({divObjs:divObjs, c: normCrParams});
            boundHandleCreativeHeightChange = __handleCreativeHeightChange.bind({divObjs:divObjs, c: normCrParams});

            /**
             * SETTING UP OUR RESPONDING TO ANY COMMUNICATIONS FROM CREATIVE 
             */
            msghandlers['jxadended'] = boundCleanupThisCreative;
            msghandlers['jxnoad'] = function() {
                boundCleanupThisCreative();
                // if (JX_FLOAT_COND_COMPILE) {
                    if (_floatInst) _floatInst.cleanup();
                // }
                if (remainingCreativesArr.length > 0){
                    //waterfall to next layer
                    next(jxContainer, remainingCreativesArr, next);
                }
            };
            msghandlers['jxchangeheight'] =  boundHandleCreativeHeightChange;
            msghandlers['resize'] = boundHandleResize;
            msghandlers['jxhasad'] = crHasAdResolve; //boundHandleResize;
            //save the bound function "pointers" so we can unlisten later


            
            
            crReady2HearAdParamsProm.then(function() {
                /**
                 * the creative (script, html ..or nothing) is loaded and ready to listen to our orders.
                 */
                if (normCrParams.adparameters) {
                    //whether iframe (messages) or direct call to the creative object, we are here:
                    boundPM2Creative('adparameters', normCrParams.adparameters);
                }

                /**
                 * Set up on blur handler - but ONLY IF needed (if we are in charge of firing trackers for the creative)
                 */
                if (normCrParams.trackers && normCrParams.trackers.actions.click) {
                    boundHandleBlur = __handleBlur.bind({divObjs:divObjs, trackers: normCrParams.trackers });
                    cxtFcnsVector.setupBlurHandler(boundHandleBlur);
                    unhook.listeners.blur = boundHandleBlur;
                }

                
                /**
                 *  if we do differential scrolling, then set up the listener
                 */
                if (normCrParams.doDiffScroll) {
                    boundScrollEvent = __handleScrollEvent.bind({
                        savedoffset:    0,
                        containerElt:   jxContainer,
                        excludedH:      normCrParams.excludedHeight,
                        divObjs:        divObjs,
                        c:              normCrParams
                    });
                    cxtFcnsVector.setupScrollEventHandler(boundScrollEvent);
                    unhook.listeners.scroll = boundScrollEvent;
                }
                return crHasAdProm;
            })
            .then(function() {

                /**
                 * Set up resize handlers
                 */
                //if (normCrParams.scalable) 
                {
                    cxtFcnsVector.setupResizeHandler(boundHandleResize);
                    //save the bound function "pointers" so we can unlisten later
                    unhook.listeners.resize = boundHandleResize;
                }
                
                univmgr.init(divObjs.jxmasterDiv, _jxParams, normCrParams.universal, normCrParams.clickurl, normCrParams.clicktrackerurl);
                /////////_univEltsObj = univmgr.getElts();

                cxtFcnsVector.handleHasAd(normCrParams.width, normCrParams.height, normCrParams.fixedHeight);
                boundHandleResize();

                if (JX_FLOAT_COND_COMPILE) {
                    if (normCrParams.floatParams) {
                        _floatInst = MakeOneFloatingUnit(jxContainer, normCrParams.floatParams, divObjs, token, boundPM2Creative);
                        boundHandleFloated = __handleFloated.bind({ univmgr: univmgr, cb: boundHandleResize });
                        boundHandleDocked = __handleDocked.bind({ univmgr: univmgr, cb: boundHandleResize });
        
                        //Need to unlisten to this event, but still dunno where is the suitable place
                        common.addListener(jxContainer, 'jxfloat', boundHandleFloated);
                        common.addListener(jxContainer, 'jxdocked', boundHandleDocked);
                    }
                }

                /**
                 * visibility detection (for AMP, the differential scrolling depends on same callback
                 * mechanism as the visibility stuff)
                 * 
                 * need to wait for the jxhasad ah only then can listen to this.
                 */
                 let combiVisChangeHelper = {
                    amp: (normCrParams.fixedHeight && _jxParams.context == 'amp' ? 
                        { boundScrollEvent: boundScrollEvent } : null),
                    lastVisVal: -1,
                    lastPgVis: -1,
                    lastFired: -1,
                    firstViewed: false,
                    notifyFcn: function(vis) {
                        if (_floatInst) { // JX_FLOAT_COND_COMPILE
                            if (vis) {
                                boundPM2Creative('jxvisible');
                            } else {
                                if (!_floatInst.shouldFloat(this.firstViewed, vis) || !this.lastPgVis) boundPM2Creative('jxnotvisible');
                                else _floatInst.startFloat(this.firstViewed);
                            }
                        } else {
                            boundPM2Creative(vis ? 'jxvisible': 'jxnotvisible');
                        }
                    }
                };   
                let boundCombiVisChange = __combiVisibilityChange.bind(combiVisChangeHelper);
                observer = cxtFcnsVector.setupVisChangeNotifiers(boundCombiVisChange, jxContainer); 
                unhook.observer = observer;
                unhook.container = jxContainer;
                unhook.listeners.visibilitychange = boundCombiVisChange;
            })
            .catch(function(err) {
                boundCleanupThisCreative();
                console.error(err);
                if (remainingCreativesArr.length > 0) {
                    next(jxContainer, remainingCreativesArr, next);
                }
            })
            .finally(function() {
                //current nothing to do yet.
            });
        }

        
        /**
         * 
         * Do any minor repair and stubbing with default if needed.
         * @param {*} params 
         */
        function _assembleParams(params) {
            if (params !== undefined && typeof params === 'object' && params !== null) {
                _jxParams = JSON.parse(JSON.stringify(params));
                
                if (_jxParams.excludedheight) {
                    _jxParams.excludedHeight = _jxParams.excludedheight;
                }
                // Checking the parameters and adding parameters if needed
                _jxParams.pgwidth = parseInt(_jxParams.pgwidth) || 0;
                _jxParams.maxwidth = parseInt(_jxParams.maxwidth) || 0;
                if (_jxParams.pgwidth && !_jxParams.maxwidth) {
                    _jxParams.maxwidth = _jxParams.pgwidth;
                }
                _jxParams.maxheight = parseInt(_jxParams.maxheight) || 0;
                if (_jxParams.fixedheight) {
                    _jxParams.fixedHeight = _jxParams.fixedheight;
                    _jxParams.maxheight = _jxParams.fixedheight;
                }
                //_jxParams.nested = parseInt(_jxParams.nested) || 0;

                _jxParams.creativeid = parseInt(_jxParams.creativeid) || null;
                
                //but this stuff really no body use ah?!
                //_jxParams.width = parseInt(_jxParams.width) || 640;
                //_jxParams.height = parseInt(_jxParams.height) || 360;
                _jxParams.campaignid = parseInt(_jxParams.campaignid) || null;

                let ctr = null;

                _jxParams.doFloat = true;
                if (JX_FLOAT_COND_COMPILE) {
                    _jxParams.doFloat = params.float || false;
                    _jxParams.floatType = "view";
                    _jxParams.floatLocation = "bottom right";
    
                    if (_jxParams.doFloat) {
                        if (params.floatType && ["view","always"].includes(params.floatType)) _jxParams.floatType = params.floatType;
                        if (params.floatLocation && ["top","bottom","top right","top left","bottom right","bottom left"].includes(params.floatLocation)) _jxParams.floatLocation = params.floatLocation;
                        _jxParams.floatWidth = parseInt(params.floatWidth) || 300;
                        _jxParams.floatVMargin = parseInt(params.floatVMargin) || 0;
                        _jxParams.floatHMargin = parseInt(params.floatHMargin) || 10;
                        _jxParams.floatBackground = params.floatBackground || "transparent";
                    }
                }

                if (params.container) {
                    if (gIsFifs && _jxParams.doFloat) { //<--?
                        ctr = parent.document.getElementById(params.container);
                        if (!ctr) ctr = window.top.document.getElementById(params.container);
                    } else {
                        ctr = document.getElementById(params.container);
                    }
                    if (ctr) {
                        let pgWidthGuide = Math.round(ctr.offsetWidth);
                        //too off we dun use.
                        if (!isNaN(pgWidthGuide) && pgWidthGuide > 300 && pgWidthGuide < 700) {
                            _jxParams.pgwidth = pgWidthGuide;
                        }
                    }
                } 
                if (_jxParams.context != 'amp' && gIsUFif) {
                    _jxParams.fixedHeight = 0; //We will not be able to do the differential scroll
                    _jxParams.excludedHeight = 0; 
                }
                if (ctr) {
                    _jxContainer = ctr;
                }
            } else {
                //For now we just quietly dun do anything then.
                console.log("JX - Parameter is not an object");
            }
        }

        function JXAdRendererInt(params) {
            _assembleParams(params);
            return;
        }
        JXAdRendererInt.prototype.kickOff = function() {
            if (!_jxContainer) {
                return;
            }
            let respBlob = null;
            if (_jxParams.jsoncreativeobj64) {
                try {
                    let json =  atob(_jxParams.jsoncreativeobj64);
                    if (json) {
                        json = JSON.parse(json);
                        respBlob = {
                            pre: 1,
                            creatives: [json]
                        };
                    }
                }
                catch(err) {  }
            }
            let fetchedCreativesProm = null;
            if (respBlob && respBlob.creatives) {
                fetchedCreativesProm = Promise.resolve(respBlob);
            }
            else {
                let subdomain = _jxParams.portal == 'dev' ? 'ad-dev':(_jxParams.debug?'ad-rc': 'ad');
                let tmp = `https://${subdomain}.jixie.io/v1/universal?source=outstream`;
                ['unit', 'client_id', 'sid', 'deltaassets64', 'creativeid'].forEach(function(prop) {
                    if (_jxParams[prop])
                        tmp += '&' + prop + '=' + _jxParams[prop];
                });
                ['pageurl', 'domain'].forEach(function(prop) {
                    if (_jxParams[prop])
                        tmp += '&' + prop + '=' + _jxParams[prop];
                });
                ['maxwidth', 'minwidth', 'maxheight', 'minheight', 'fixedheight'].forEach(function(prop) {
                    if (_jxParams[prop])
                        tmp += '&' + prop + '=' + _jxParams[prop];
                });
                if (_jxParams.amp) tmp += '&device=amp';
                fetchedCreativesProm = fetchAdP(tmp);
            }
            //let adUrl = 'https://ad.jixie.io/v1/universal?source=sdk&domain=travel.kompas.com&pageurl=https%3A%2F%2Ftravel.kompas.com%2Fread%2F2021%2F06%2F16%2F180106127%2Ftraveloka-dan-citilink-gelar-promo-diskon-tiket-pesawat-20-persen&width=546&client_id=72356cf0-d22c-11eb-81b0-7bc2c799acca&sid=1625728274-72356cf0-d22c-11eb-81b0-7bc2c799acca&creativeid=800'; //1007|1005|800';
            fetchedCreativesProm
            .then(function(responseBlob) {
                let creativesArr;
                if (true || responseBlob.pre) {
                    creativesArr = responseBlob.creatives;
                }
                /* else {
                    //just to try the waterfalling :
                    let x = JSON.parse(JSON.stringify(responseBlob.creatives[0]));
                    let y = JSON.parse(JSON.stringify(responseBlob.creatives[0]));
                    x.url = 'https://creatives.b-cdn.net/80c8a13725c68736d9faf7e5858d51f1/360/1174/VCBL_GIF%20-%20Mario%20Russellino.gif';
                    x.width = 320;
                    x.height = 100;
                    x.id = 1174;
                    creativesArr = [
                        x, y
                    ];
                }
                console.log(creativesArr[0]);
                */
                if (creativesArr && creativesArr.length > 0)
                    _startP(_jxContainer, creativesArr, _startP);
            });
        }
        
        
        
      
        let ret = new JXAdRendererInt(params);
        return ret;
    }    
   
  /* const checklist_ = [
        'data',
        'canonicalUrl',      
        'container',
        'domFingerprint',
        'location',
        'pageViewId',
        'pageViewId64',
        'referrer',
        'sourceUrl',
        'startTime'
    ];*/
    function createInstance_(params) {
        let ar = makeAdRenderer(params);
        ar.kickOff();
    }
    module.exports.createInstance = createInstance_;

/* 
 ************** module: renderer/core **************************************************

* module.exports:
    - createInstance (function(params)
        kick off an ad rendering activity based on the params
        there is no object being returned.
        this created thing has a life of its own (fetch ad, render ad)
    
* requires/dependencies:
    - none
*/
