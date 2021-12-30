DO_NOT_REMOVE_GULPBUILD_REPLACE_FLOAT_COND_COMPILE

/*
    video and banner+video types
    -put our video js-script in IFRAME
    -wait for jxloaded message
    -postMessage(adparameters)
    -wait for jxhasad etc message
    -postMessage(jxvisible etc) - creatives fires the trackers, not us

    DPA
    -inject the template HTML in IFRAME
    -wait for jxloaded message
    -postMessage(adparameters)
    -wait for jxhasad etc message
    -postMessage(jxvisible etc) - creatives fires the trackers, not us

    simple display image
    -we just stick in the image into the DOM (DIV), but we hook onload, onerror and talk to self using events on the div
    -wait for jxhasad etc event
    -call our own handler upon jxvisible (we fire trackers)
    
    display script fragment (can be injected into DIV or IFRAME)
    -we just stick the fragment into the DOM
    -we fake jxhasad
    -call our own handler upon jxvisible (we fire trackers)

    player script (can be injected into DIV or IFRAME)
    -stick the script into the DOM 
    -these older generation of stuff they are all talk using arguments or query params
        (for trusted, they use query param to the script url, for IFRAME
            they seem to use the jxuni_p injected into the iframe)
    -wait for jxhasad etc event or message
    -we postMessage (& dispatchEvents too) for jxvisibile etc.

    */


//for the new trusted creatives to talk to us.
//OK for now we shall keep this implementation which is using 
//post messages
//If on the page we have both e.g. OSM and ULITE JS running
//then we use this which is a post message mechanism.
//Bother renderers will get the messages but only those that spawned
//the creative will handle it (token match)
window.jxrenderercore = {
    dummy: 1,
    notifyByStr: function(m) {
        window.postMessage(m, "*");
    },
    notify: function(type, token, data) {
        let obj = {
            type: type,
            token: token
        };
        if (data) {
            obj.params = data;
        }
        let msgStr = "jxmsg::" + JSON.stringify(obj);
        window.postMessage(msgStr, "*");
    }
};

const modulesmgr                = require('../basic/modulesmgr');
const common                    = modulesmgr.get('basic/common');
const MakeOneUniversalMgr       = modulesmgr.get('renderer/univelements');
const u_ = "universal";

/*
function addGAMNoAdNotifyMaybe(str) {
    //also need to give it some time to act ah.
    //means we fire the has ad after a while.
    //Note instead of jxnoad, we do adended which will trigger a teardown
    //for this type we always assume hasad to start with (normCrParams.assumeAsAd), 
    //so it will be weird to fire jxnoad
    if (str.includes("<script") && str.includes("googletag.pubads()")) {
        var script = new DOMParser().parseFromString(str, "text/html");
        var t = `googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                if (event.isEmpty) {
                    var id = event.slot.getSlotElementId();
                    parent.postMessage('jxadended', '*');
                }
            });
            `;
        script.querySelector("script").innerHTML = t.concat(script.querySelector("script").innerHTML);
        return script.querySelector("script").outerHTML;
    }
    return str;
}
*/

var MakeOneFloatingUnit = function() { return null; };

if (JX_FLOAT_COND_COMPILE) {
MakeOneFloatingUnit = function(container, params, divObjs, dismissCB, univmgr) {
    const JXFloatingClsName = 'jxfloating';
    const cbn_ = 'jxfloating-close-button';
    const JXFloatingStyleID = 'JXFloatingStyle';
    var _univmgr = null;
    var _fP = null; //params
    var _closeBtn = null;
    var _ctr = null;//container
    var _parentCtr = null;//parent container
    var _placeholderDiv = null; //placeholder. acc to fery, needed for non fixed height
    var _scaleDiv = null; //arrgh ugly ... ... fixedheight ...

    var _initialHeight = 0;
    var _floating = false;//current state.
    var _dismissCB = null;
    var _userClosed = false; //if the user has closed the floating unit already
    
    function FactoryOneFloating(container, params, divObjs, dismissCB, univmgr) { 
        _univmgr = univmgr;
        _scaleDiv = divObjs.jxbnScaleDiv;

        _parentCtr = container;
        _ctr = divObjs.outerDiv;
        _dismissCB = dismissCB;

        //<--- if it is not from the publisher nor the creative, then we assume some defaults.
        // The parameters of the float are from publisher setting  and creative setting.
        // By the time we reach here, the publisher and creative setting are already mixed.
        // Now if anything is still not set, then we fill in with a sensible default.
        params.start = params.start || 'viewed';
        //the right way to merge maxwidth is take the most conservative.
        let elt = divObjs.jxCoreElt;
        let ar = elt.offsetWidth/elt.offsetHeight;
        
        //set to all the reasonable values first: 
        /*
        params.maxwidth = params.maxwidth || (common.isMobile() ? 200:600);
        params.maxheight = params.maxheight || (common.isMobile() ? 300:400);
        //translate it into maxwidth also: if whatever from the maxheight is stricter, then update the maxwidht
        let tmp = ar*params.maxheight;
        if (tmp < params.maxwidth) params.maxwidth = tmp; 
        */
        params.position = params.position || 'bottom-right';
        params.marginX = params.hasOwnProperty('marginX') ? params.marginX : 10;
        params.marginY = params.marginY || 0;
        params.background = params.background || 'transparent';
        //--->
        //<--
        //WIP: this array will be traversed from top and stopping as soon as the ar matches (arOfCreative > ar in the object)
        //x : 1 means consider width, 0 means consider height
        //p and v are some limits to the extent of the creative we will impose:
            //p: is a percentage of the browser width (or height) 
            //v: is a hard value (px) 
        const rules_ = {
            other: { //<-- creative type (potentially we can have another entry for e.g. video)
                desktop: [
                    //horiz: banner type
                    { ar: 3,   x: 1, p: 0.7,  v: 800},
                    // normal video:
                    { ar: 1.7, x: 1, p: 0.50, v: 400},
                    // squarish stuff
                    { ar: 0.8, x: 1, p: 0.50, v: 300},
                    //vertical video
                    { ar: 0.5, x: 0, p: 0.5, v: 400},
                    { ar: 0.4, x: 0, p: 0.5, v: 500},
                    { ar: 0,   x: 0, p: 0.7, v: 600},
                ],
                mobile: [
                    //horiz: banner type
                    { ar: 3,   x: 1, p: 0.7,  v: 400},
                    // normal video:
                    { ar: 1.7, x: 1, p: 0.50, v: 200},
                    // squarish stuff
                    { ar: 0.8, x: 1, p: 0.50, v: 150},
                    //vertical video
                    { ar: 0.5, x: 0, p: 0.5, v: 200},
                    { ar: 0.4, x: 0, p: 0.5, v: 300},
                    { ar: 0,   x: 0, p: 0.7, v: 400}
                ]
            }
        };
        let brSz = {
            x: window.innerWidth || document.body.clientWidth,
            y: window.innerHeight || document.body.clientHeight
        };
        let blob = rules_[params.adtype] || rules_.other;
        blob = blob.desktop;
        let rule = blob.find((e) => e.ar < ar);
        //console.log(`### FOUND RULE ${JSON.stringify(rule,null,2)}`);
        params.maxwidth = rule.x ? Math.min(brSz.x*rule.p, rule.v): brSz.x;
        params.maxheight = rule.x ? brSz.y: Math.min(brSz.y*rule.p, rule.v);
        let tmp = ar*params.maxheight;
        if (tmp < params.maxwidth) params.maxwidth = tmp; 
        //natural width:
        //-->

        _fP = params;

        _fP.width = _fP.maxwidth < elt.offsetWidth ? _fP.maxwidth: elt.offsetWidth;
        _fP.height = _fP.width/ar;
        
        _initialHeight = Math.max(divObjs.innerDiv.offsetHeight, divObjs.innerDiv.offsetHeight);

        _prepareFloatingUnits();
    }

    var _prepareFloatingUnits = function() {
        let stylesArr = [
            "."+cbn_+"{position: absolute;box-sizing: border-box;display: block;left: -12px;bottom: auto;top: 3px;right: auto;cursor:pointer;z-index: 99;}",
            "."+cbn_+":before,."+cbn_+":after{width: 20px;height: 5px;transform: rotate(-45deg);content: '';position: absolute;display: block;background-color: #000;transition: all 0.2s ease-out;top: 50%;left: 50%;}",
            "."+cbn_+":after{transform: rotate(45deg);}",
            "."+cbn_+":hover:after{transform: rotate(-45deg);}",
            "."+cbn_+":hover:before{transform: rotate(45deg);}",
            "."+cbn_+".left{position: absolute;box-sizing: border-box;display: block;right: 5px;bottom: auto;top: 3px;left: auto;cursor:pointer;z-index: 99;}",
            "."+JXFloatingClsName+"{position:fixed;height:auto;opacity:1;z-index:9999}",
        ].join("\n");
        common.acss(stylesArr, JXFloatingStyleID);

        _closeBtn = document.createElement('a');
        _closeBtn.className = cbn_;
        if (_fP.position.indexOf('left') > -1) _closeBtn.classList.add('left');
        _closeBtn.onclick = function() {
            _stopFloat();
            _userClosed = true;
            _dismissCB();
        }
        _ctr.appendChild(_closeBtn);
        _showHideCloseBtn(false);
    }

    var _setContainerStyle = function(s) {
        let pos = _fP.position;
        if (["bottom-right","bottom-left","bottom"].includes(pos)) {
            s.top = "auto";
            s.bottom = _fP.marginY + "px";
        }
        else {
            s.top = _fP.marginY + "px";
            s.bottom = "auto"; 
        }
        if (["bottom-right","top-right"].includes(pos)) s.left = "auto"; 
        if (["bottom-left","top-left"].includes(pos)) s.left = _fP.marginX + "px"; 
        if (["bottom-left", "top-left"].includes(pos)) s.right = "auto"; 
        if (["bottom-right","bottom","top-right"].includes(pos)) s.right = _fP.marginX + "px";
        if (["bottom","top"].includes(pos)) {
            s.right = "0px";
            s.left = "0px";
            s.margin = "auto";
        } else s.margin  = "0px 10px 10px";
    }
    
    var _setPlaceholderDiv = function() {
        if (!_placeholderDiv) {
            _placeholderDiv = common.newDiv(_parentCtr, 'div');
            _placeholderDiv.style.cssText = "display:block;width:100%;clear:both;height:" + _initialHeight + "px";
        } else _placeholderDiv.style.display = "block";
    }
    var _hidePlaceholderDiv = function() {
        if (_placeholderDiv) _placeholderDiv.style.display = "none";
    }
    var _startFloat = function(crViewed) {
        if (!_floating) {
            _floating = true;
            _ctr.classList.add(JXFloatingClsName);
            let sty = _ctr.style;
            sty.background = _fP.background;

            if (_fP.fixedHeight > 0) {
                sty.height = _fP.height + "px";
                _scaleDiv.style.top = 0 + "px";//wah liao!
            } else sty.height = "auto";
            sty.width = _fP.width + "px";
            //console.log(`_startfloat: ${sty.width} ${sty.height}`);
        
            _setContainerStyle(sty);
            if (_closeBtn) _showHideCloseBtn(true);
            _univmgr.hide();
            window.dispatchEvent(new Event('resize'));
            _setPlaceholderDiv();
        }
    }
    //if the floating is closed and the whatever is not yet in viewport then it is invisible

    var _stopFloat = function() {
        if (_floating) {
            _floating = false;
            _ctr.classList.remove(JXFloatingClsName);
            _ctr.style.cssText = "";
            _ctr.style.height = _initialHeight + "px";
            _hidePlaceholderDiv();
            if (_closeBtn) _showHideCloseBtn(false);
            _univmgr.show();
            window.dispatchEvent(new Event('resize'));
        }
    }
    var _showHideCloseBtn = function(show) {
        if (_closeBtn) _closeBtn.style.display = show ? "block": "none";
    }
    var _cleanUpElement = function() {
        if (_placeholderDiv && _placeholderDiv.parentNode) _placeholderDiv.parentNode.removeChild(_placeholderDiv);
        //????? what is this? _placeholderObs = null;
        _floating = false;
    }
    FactoryOneFloating.prototype.startFloat = function(crViewed) {
        _startFloat(crViewed);
    }
    FactoryOneFloating.prototype.isShowing = function() {
        return _floating;
    }
    FactoryOneFloating.prototype.startFloat = function(crViewed) {
        _startFloat(crViewed);
    }
    FactoryOneFloating.prototype.shouldFloat = function(crViewed, visible) {
        return (!_userClosed && ((_fP.start == "init" && !visible) || (_fP.start == "viewed" && crViewed && !visible)));
    }
    FactoryOneFloating.prototype.stopFloat = function() {
        _stopFloat();
    }
    FactoryOneFloating.prototype.cleanup = function() {
        _cleanUpElement();
    }
    let floatUnit = new FactoryOneFloating(container, params, divObjs, dismissCB, univmgr);
    return floatUnit;   
}
}

//////(function() {

    const destContainerPrefix_ = 'jxifr_';
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
            signature: "jxvideoadsdk",
            //the queue name is '_' + signature + 'q';
            //so here it is _jxvideoadsdkq
            url: 'https://scripts.jixie.media/jxvideocr.1.0.min.js'
            ///////url: 'https://jx-demo-creatives.s3-ap-southeast-1.amazonaws.com/osmtest/jx-app-videoadsdk-test.min.js'
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
        getType: function() {return 'amp';},
        handleNoAd: function() {
            //This stuff what you do also depends on context ..e.g. So AMP you need to call context API
            // to tell runtime to collapsee your slot
            window.context.noContentAvailable();
        },
        setupVisChangeNotifiers: function(allhooks, obsCtr, boundCB) {
            //dun care the container
            let unlisten = window.context.observeIntersection(boundCB);
            allhooks.push({ e: 'intersection', f: unlisten});
            window.addEventListener('amp:visibilitychange', boundCB);
            allhooks.push({ t: window, e: 'amp:visibilitychange', f:boundCB});
        },
        addListener: function(allhooks, target, event, boundCB) {
            if (event == 'jxhasad' || event == 'jxnoad' || event == 'message' || event == 'blur') {
                common.addListener(target, event, boundCB);    
                allhooks.push({ t: target, e: event, f:boundCB});
            }
            //ignore resize and scroll
        },
        teardown(allhooks) {
            allhooks.forEach(function(l) {
                if (l.e == 'intersection') {
                    l.f(); //an unlisten function
                }
                if (['jxhasad','jxhasnoad', 'message','blur','amp:visibilitychange'].indexOf(l.e) > -1) {
                    common.removeListener(l.t, l.e, l.f);
                }
            })
        }
    },//end of amp group
    //non AMP:
    'default': {
        getType: function() {return 'default';},
        setupVisChangeNotifiers: function(allhooks, obsCtr, boundCB) {
            let ob = new IntersectionObserver(boundCB, {
                threshold: visThreshold_
            });
            ob.observe(obsCtr); 
            allhooks.push({ t: obsCtr, e: 'intersection', f: ob});
            common.addListener(document, "visibilitychange", boundCB);
            allhooks.push({ t: document, e: 'visibilitychange', f: boundCB});
        },
        addListener: function(allhooks, target, event, boundCB) {
            if (['jxfloat', 'jxdocked','jxhasad','jxnoad','message','blur','scroll','resize'].indexOf(event) > -1) {
                if (event == 'scroll') {
                    target = top;
                }
                common.addListener(target, event, boundCB);    
                allhooks.push({ t: target, e: event, f:boundCB});
                if (event == 'scroll' || event == 'resize') {
                    boundCB();
                }
            }
        },
        removeListener: function(allhooks, target, event, boundCB) {
            if (['scroll'].indexOf(event) > -1) {
                if (event == 'scroll') {
                    target = top;
                }
                common.removeListener(target, event, boundCB);
            }
        },
        teardown(allhooks) {
            allhooks.forEach(function(l) {
                if (l.e == 'intersection') {
                    l.f.unobserve(l.t); //an unlisten function
                }
                if (['jxhasad','jxhasnoad', 'message','blur','scroll','resize','visibilitychange'].indexOf(l.e) > -1) {
                    common.removeListener(l.t, l.e, l.f);
                }
            })
        },
        handleNoAd: function() {
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
        if (!this.hasOwnProperty('lastVisVal')) {
            //not initialized yet
            this.lastVisVal = -1;
            this.lastPgVis = -1;
            this.lastFired = -1;
            this.firstViewed = false;
        }
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
            if (param && Array.isArray(param) && param.length > 0) {
                var latestChange = param[param.length - 1];
                //param.forEach(function(entry) 
                if (thisObj.amp) {
                    //console.log(`### thisObj.amp.boundScrollEvent ${latestChange.rootBounds.height} ${JSON.stringify(latestChange.boundingClientRect)}`);
                    thisObj.amp.boundScrollEvent(
                        null,//this is position of the event argument of the scollcallback
                        latestChange.rootBounds.height,
                        latestChange.boundingClientRect
                    );
                }
                //console.log(`### latestChange.intersectionRatio ${latestChange.intersectionRatio}`);

                newVisVal = latestChange.intersectionRatio > visThreshold_ ? 1: 0;
                //console.log(`DEBUG new visiblity value ${newVisVal}`);
            } 
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
            if (fire == 1 && this.notifyFirstVisible) {
                // console.log(`!!!!!! ####calling notifyFirstVisible NOW`);
                this.notifyFirstVisible();
                this.notifyFirstVisible = null;
            }
            
            this.lastFired = fire;
        }
    }

    function fireTracker(trackers, action, extra) {
        if (trackers.actions) {
            if (!trackers.actions.hasOwnProperty(action)) {
                //console.log("#####WE ARE NOT MEANT TO EVER FIRE THIS!!!!!");
                return;
            }
        }
        //TODO : switch to Beacon!!
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
        let time2imp = 2000;
        if (this.c.time2imp) {
            time2imp = this.c.time2imp;
        }
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
                            if (theObj.c.trackers) {
                                //if the object is torn down, then c.trackers
                                //will not be there.
                                theObj.c.trackers.actions.impression = 0;
                                fireTracker(theObj.c.trackers, 'impression');
                            }
                            else {
                                console.log(`trackers properly is gone. Torn down already `);
                            }
                        }
                    }, time2imp);
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
        let node = document.activeElement;
        let loop = 0;
        try {
            while (node && loop < 10) {
                if (node == this.divObjs.jxCoreElt) {
                    break;
                }
                else {
                    node = node.parentNode;
                    loop++;
                }
            }
        }
        catch(e) {}
        if (node && node == this.divObjs.jxCoreElt) {
            let fire = false;
            let tsNow = Date.now();
            if (this.lastFired) {
                //else sometimes there will be 2:
                if (tsNow - this.lastFired > 3000) {
                    fire = true;
                }
            }
            else {
                fire = true;
            }
            if (fire) {
                this.lastFired = tsNow;
                fireTracker(this.trackers, 'click');
            }

        }
    }

    /**
     * It is very important to handle this properly:
     * each instance of the OSM is listening. So it is important that the instance
     * IGNORES whatever that is not meant for it!!!
     * @param {*} e 
     * @returns 
     */        
    function __handleCrEvtsMsgs(e) {
        let sureOK = false;
        // sureOK set to true if this listener is working with a creative in an iframe
        // and we already checked this incoming msg is from that iframe.
        // Then no need to check to throw anything away
        // The challenge is for those listeners working with trusted creatives ...
        if (this.divObjs.jxCoreElt && this.divObjs.jxCoreElt.contentWindow) {
            //creative is in iframe iframe situation:
            //Then we can easily check if the source of the message is that
            //iframe
            if (!(this.divObjs.jxCoreElt.contentWindow === e.source)) {
                return;
            }
            sureOK = true;
        }
        else {
            // our creative is not in an iframe. in that case I expect at a minimum
            // only to entertain msg from the same window (and not some iframe thereof)
            // if it is a normal windows messages (not one we send to ourself) then there will be a e.source
            // in that case we want to at least check it is from this current window.
            if (e.source && !(window === e.source)) {
                return;
            }
        }
        let type = null;                    
        let json = null;
        
        if (e && e.type && e.type.startsWith('jx')) {
            type = e.type;
        }
        if (!type) {
            if (!e.data || typeof e.data === 'string' && e.data.indexOf('jx') != 0 ) {
                return;
            }
            if (e.data && typeof e.data === 'string' && e.data.indexOf('jxmsg::') == 0) {
                try {
                    json = JSON.parse(e.data.substr('jxmsg::'.length));
                }
                catch(err) {}
            }
        }
        if (!type && !json) {
            if (e.data == 'jxadended' || e.data == 'jxhasad' || e.data == 'jxnoad' || e.data == 'jxloaded')
                type = e.data;
        }
        if (!type && !json) return; //unrelated to us, we dun bother.
        //Frankly we still have an issue with trusted creatives
        //But hopefully with trusted type the creative will communicate 
        //more using events then it won't have the mismatch...
        if (json) {
            type = json.type;
        }

        if (this.c.div && this.c.crSig) {
            //trusted
            //if the creative has a signature (new trusted script type) 
            //and it is trusted
            //then we need to also do a token match check too (token
            //is derived from the id of the div)
            //Else if different univeral units on the page has a few 
            //have this kind of trusted scripts, the msgs may end up
            //to wrong renderer listener
            //
            //Currently we do not yet have such creatives
            if (!json || json.token != this.c.token) {
                return; //not meant for us.
            }
        }
        
        // we don't want the iframe type to kill our own local creative though.
        if (!sureOK && json && json.token && this.c.div) {
            if (json.token != this.c.token) { //this.c.div.token could be undefined
                // console.log(`#### type=${type} json=(${JSON.stringify(json)}) json.token=${json.token} VS this.c.token=${this.c.token}`);
                return;
            }
            // then we need to check if 
            //we need to match it properly:

        }
        
        if (type) {
            switch (type) {
                case "jxloaded": //only used for untrusted
                    //for trusted, the old creatives dun need this sign to talk to the creative
                    //for trusted, the future creative will follow template/trustedscript.js
                    //and will not need this.
                case "jxhasad":     
                case "jxnoad":
                case "jxadended":
                    if (this.handlers[type]) {
                        this.handlers[type]();
                    }
                    break;
                case "jxchangeheight":
                case "size":
                    //things have to be rewritten in order to get the benefits of the new design.
                    //if we are not something that can change height, then ... well.
                    //if it is fixed height
                    //so this is working already.
                    //console.log(`!!! json.type: ${json.type}, data=${json.params}. ULITE: tk ${json.token} VS ${this.token}`);
                    if (this.handlers.jxchangeheight) {
                        this.handlers.jxchangeheight(json.params.height, this.handlers.resize);
                    }
                    //we need to trigger an on window resize actually.
                    break;     
            }//case
        }//if type

    }

    /**
     * This is the case the creative loads the jx events sdk.
     * the firing of creativeView is our responsibility. That's the __pm2Self part
     * Once we here knows the sdk side is ready this function will be
     * 
     * called with openShop. It will clear the back log of stuff to talk to that entity
     * 
     * thereafter (when already openshop state), then it is to be handled just like
     * __pm2CrWithMsgsEvts then.
     * @param {*} msgtype 
     * @param {*} dataMaybe 
     * @returns 
     */
    function __pm2JxEvtsSDKWithMsgs(msgtype, dataMaybe = null) {
        if (msgtype == 'jxvisible' || msgtype == 'jxnotvisible') {
            this.visState = msgtype;
            if (msgtype == 'jxvisible') {
                __pm2Self.call(this, 'jxvisible');
            }
        }
        if (this.openshop) {
            //operate like normal
            return __pm2CrWithMsgsEvts.call(this, msgtype, dataMaybe);
        }
        if (msgtype == 'openshop') {
            __pm2CrWithMsgsEvts.call(this, 'adparameters', this.c.adparameters);
            if (this.visState == 'jxvisible' || this.visState == 'jxnotvisible') {
                __pm2CrWithMsgsEvts.call(this, this.visState);
            }
            this.openshop = 1;
            return;
        }
        //else we do nothing then.
    }

    /**
     * This function is quite comprehensive in the sense that it handles both simple and complex
     * communications (simple: e.g. jxvisible; complex: e.g. adparameters)
     * and the creative can be in iframe or in div (trusted)
     * For the latter we have the older legacy creatives and the newer cratives (with a much improved
     * protocol of communication with this renderer)
     * @param {*} msgtype 
     * @param {*} dataMaybe 
     * @returns 
     */
    function __pm2CrWithMsgsEvts(msgtype, dataMaybe = null) {
        let postMsgStr = null;
        let eventStr = null;
        //from this we know if trusted or not: this.c.div
        if (!dataMaybe) {
            //simple type of stuff e.g. jxvisible and jxnotvisible. there is no "data"
            if (this.c.iframe) { //iframe type. just post the message, no other options
                postMsgStr = msgtype;
            }
            else {
                let crSig = this.c.crSig;
                //console.log(`CCC#### Simple type: this is the crSig ${crSig} and this is the token ${this.c.token}`);
                //not in iframe (trusted) so need more care:
                if (crSig) {
                    crSig = '_' + crSig + 'q';
                    //new type of creatives (using our creatives Template to develop) and running in trusted mode:
                    //we need that token else there will be problem if there are several instances
                    //of the thing flying in the same "window"
                    window[crSig] = window[crSig] || [];
                    window[crSig].push(['message', 
                        "jxmsg::" + JSON.stringify({ type: msgtype, token: this.c.token})
                    ]);
                    return; //nothing else to send
                }
                else { //older creatives - not sure if they listening to msgs or events. so do both
                    postMsgStr = msgtype;
                    eventStr = msgtype;
                }
            }
        }
        else {
            //complex type . So far only have 1 which is adparameters
            if (this.c.iframe) { //most clear what to do
                postMsgStr = "jxmsg::" + JSON.stringify({type: msgtype, data: dataMaybe});
            }
            else { //div type but there is the new stuff and the old stuff.
                let crSig = this.c.crSig;
                //console.log(`CCC#### Complex type: this is the crSig ${crSig} and this is the token ${this.c.token}`);
                if (crSig) { //new way. then we only call a queue push 
                    crSig = '_' + crSig + 'q';
                    window[crSig] = window[crSig] || [];
                    window[crSig].push(['message', 
                        "jxmsg::" + JSON.stringify({ type: msgtype, token: this.c.token, data: dataMaybe})]);
                    return; //nothing else to send.                        
                }
                else {
                    //there will not be any such creatives.
                    //those "old ways" they all have other ways to pass the adparameters which is
                    //e.g. inject a fragment of code which has the jx_uni var p that kind of stuff
                }
            }
        }

        //Ok all figured out, so time to emit the stuff:
        let crNode = this.divObjs.jxCoreElt;
        if (postMsgStr) {
            if (crNode && crNode.contentWindow) {
                crNode.contentWindow.postMessage(postMsgStr, '*');
            }
            else {
                window.postMessage(postMsgStr, '*');
            }
        }
        if (eventStr) {
            crNode.dispatchEvent(new Event(eventStr));
        }
        return;
    }
  
    /**
     * Super generic stuff to use fetch API to return a promise (the json object)
     * @param {*} adTagUrl 
     * @returns 
     */
    function fetchAdP(adTagUrl) {
        return fetch(adTagUrl, {
            method: 'GET',
            credentials: 'include'
        }).then((response) => response.json());
    }

    /**
     * it will take general object normCrParams (normalized creative parameters)
     * produced by getNormalizedCreativeParams
     * and then stick the stuff into the core element (core destination element)
     * @param {*} divObjs
     * @param {*} normCrParams 
     */
    function insertCreative(divObjs, normCrParams) {
        let jxCoreElt = divObjs.jxCoreElt;
        if (normCrParams.iframe) {
            let blob = normCrParams.iframe;
            if (blob.url) {
                //console.log(`Type iframe | url`);
                //e.g. DPA will come here
                jxCoreElt.src = normCrParams.iframe.url;
            }
            else if (blob.scripturl && !blob.jxuni_p) {
                //OUR VIDEO ADS belong here. Not using the old jxuni_p to pass params
                //but using postMessages later.
                //So simpler injection
                //Moving forward, this should be the way for any new jixie crative type
                //whether trusted or not
                //
                //<-- I am switching to this method now:
                // strange thing is that using this (in the comment):
                //    let html = `<body style="margin: 0;"><script type="text/javascript" src="${blob.scripturl}"></script></body>`;
                //    jxCoreElt.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
                // things appear to work, but then, the mp4 for the ad video is never taken from disk cache and sometimes is also
                // loaded in chuncks. 
                // Once I switch to this following way, then I start to see the mp4 (at least those from bunny cdn since disk caching
                // is configured) being FROM DISK CACHE. 
                // Don't quite understand why yet.
                var jxinter = window.setInterval(function() {
                    // put inside function 
                    var jxiframeDoc = jxCoreElt.contentDocument || jxCoreElt.contentWindow.document;
                    if(jxiframeDoc.readyState == "complete") {
                        window.clearInterval(jxinter);
                        var ns = document.createElement("script");
                        ns.src = blob.scripturl;
                        jxiframeDoc.body.style.margin = '0px';
                        jxiframeDoc.body.appendChild(ns);
                    }
                },500);
            }
            else if (blob.scripturl && blob.jxuni_p) {
                //console.log(`Type iframe | script | using jxuni_p`);
                //Our older stuff like the player scripts come here:
                //those that are not "trusted"
                //They depend on the whole blob of parameters injected into the DOM
                //as code: var p = blablabla
                //to work: that's why the big blob of code here:
                let jxuni_p = {c: normCrParams.iframe.jxuni_p};
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
                //console.log(`Type iframe | scriptBody`);
                //the other untrusted scripts. 
                //These are typically not jixie stuff. but things like DFP script
                //Amazaon display ads script etc
                //So no parameters to pass either
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
                //console.log(`Type div | simpleimage`);
                //SIMPLE IMAGE MANAGED BY US
                var img = new Image();
                img.onload = function () {
                   jxCoreElt.dispatchEvent(new Event('jxhasad'));
                }
                img.onerror= function() {
                    jxCoreElt.dispatchEvent(new Event('jxnoad'));
                }
                img.src = blob.image.url;
                //img.src = 'https://creatives.b-cdn.net/KG116cVoTd/377/1251/house1x.jpeg';
                //actually to do it properly we should only do the creativeView and stuff
                //based on onload-ed-ness of the image ah TODO
                jxCoreElt.innerHTML = '<a style="border-bottom: none;" href="' + blob.image.clickurl + '" target="_blank"><img src="' + blob.image.url + '" class="jxImg"/></a>';
                common.addListener(jxCoreElt, 'click', (e) => {
                    fireTracker(blob.image.trackers, 'click');
                });
            }
            else if (blob.scripturl) {
                //this can be a non-JX script
                //Or some players that are trusted would come here too.
                //console.log(`Type div | scripturl ${blob.scripturl}`);
                //JX stuff like trusted player scripts will come here.
                //These things work so far by tails of query params in the script url
                //so that's how these things get the adparameters
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
                //console.log(`Type div | scriptBody`);
                let range = document.createRange();
                range.setStart(jxCoreElt, 0);
                jxCoreElt.appendChild(range.createContextualFragment(blob.scriptbody));
            }
        }
        divObjs.jxbnFixedDiv.appendChild(jxCoreElt);
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
            //console.log(`##### name or id of container ${jxContainer.id}`);
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
        jxmasterDiv.style.maxWidth = normCrParams.maxwidth + 'px';
        //else            
        //    jxmasterDiv.style.width = normCrParams.width + 'px';
        //if (normCrParams.maxwidth)
        jxbnDiv.style.maxWidth = normCrParams.maxwidth + 'px';

         //is this causing the problem of UNIV
         if (normCrParams.maxheight && !normCrParams.fixedHeight && !normCrParams.varsize) {
            jxmasterDiv.style.maxHeight = normCrParams.maxheight + 'px';
            jxbnDiv.style.maxHeight = normCrParams.maxheight + 'px';
        }
        
        jxbnDiv.style.height = normCrParams.height + 'px';
        jxbnDiv.style.width = '100%';
        jxbnFixedDiv.style.width = normCrParams.width + 'px';
        jxbnFixedDiv.style.height = normCrParams.height + 'px';
        jxbnScaleDiv.style.width = (normCrParams.width ) + 'px';
        //jxbnScaleDiv.style.border = '1px solid black'; //renee
        //jxbnScaleDiv.style.zIndex = 99999999;
        jxbnScaleDiv.style.height = (normCrParams.height ) + 'px';

        //differential scroll:
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

        //at this stage it is unclear to me if we really need to remember all these things:
        divObjs.jxmasterDiv = jxmasterDiv;
        divObjs.jxbnDiv = jxbnDiv;
        divObjs.jxbnFixedDiv = jxbnFixedDiv;
        divObjs.jxbnScaleDiv = jxbnScaleDiv;
        divObjs.jxCoreElt = jxCoreElt;

        //insertCreative(jxCoreElt, normCrParams);
        //jxbnFixedDiv.appendChild(jxCoreElt);

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
        // here we think of all the constraints and get the height of the universal elements.
        //total fixed height.
        //universal is occupying even more space.
        //so we need to subtract.

        let c = this.c;
        let jxbnDiv = this.divObjs.jxbnDiv;
        let jxbnScaleDiv = this.divObjs.jxbnScaleDiv;
        if (c.varsize) {
            //those 1x1 google tags , so far.
            //the creative starts with height =1 , but then later will issue a size message
            //to change the height.
            c.creativeH = c.height;
            return;
        }
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
        
        if (ratio < 0.2) {
            // console.log(`### ${jxbnDiv.id} bad ratio: realW=${jxbnDiv.offsetWidth} realH=${jxbnDiv.offsetHeight} cWidth=${c.width} cHeight=${c.height} `);
            // for amp we will have this. at least for the prebidserver one we could well have this
            // problem (our winner ad is server in some GAM iframe)
            // I see sometimes, that when this is called, the offsetWidth == 1.
            // Then we get a ridiculously small ratio then.
            // safety switch .
            // console.log(`### ${jxbnDiv.id} bad ratio: __handleResize ridiculous width etc `);
            return false; //this is likely those e.g. AMP cases, whereby this thing can happen when 
            // the container for our stuff (may be some GAM slot of some amp-ad whatever) may not
            // have the right size yet.
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
        
        //here we calculate.

        if (c.fixedHeight && c.doDiffScroll) {
            //this is one way
            ratio = jxbnDiv.offsetWidth/c.width;
            c.creativeH = c.height*ratio;

            //console.log(`_WOO_ H=${c.creativeH} h=${c.height} r=${ratio}`);
        }
        switch(c.type) {
            case 'player':
            case 'display': // we resize applying a transformation ratio
            case 'video':
            case 'iframe':                
                jxbnScaleDiv.style.transform = 'scale(' + ratio + ') translate3d(0px, 0px, 0px)';
                jxbnScaleDiv.style.transformOrigin = '0px 0px 0px';
                //jxbnScaleDiv.style.transformOrigin = 'top center';
                
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
        return true;
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
    
    //function __handleFloated() {
      //  this.univmgr.hide();
        //if (this.cb) this.cb();
    //}
    //function __handleDocked() {
      //  this.univmgr.show();
        //if (this.cb) this.cb();
    //}

    // univ elements will be invariant under differential scrolling but they 
    // do eat into the "window" of the diff scroll, so we account for that here:
    // e.g. if fixedHeight is 400px, and if the height of the univ element is 90,
    // then really the bnDiv we need to constrain it to 400-90
    // this is related to the implementation of the fixedHeight/diff scroll mechanism.
    function __handleUnivHeight(height) {
        if (height == 0) {
            //univ has nothing ...
            this.divObjs.jxmasterDiv.style.maxHeight = 'none';
            this.divObjs.jxbnDiv.style.maxHeight = 'none';
            this.divObjs.jxbnDiv.style.minHeight = '0px';
            return;
        }
        
        if (this.fixedHeight) {
            let h = this.fixedHeight - height;
            if (!isNaN(h) && h > 0) {
                //for the fixed height case, the uni stuff will eat into the space for 
                //the creative.
                this.divObjs.jxbnDiv.style.maxHeight = h + 'px';
                this.divObjs.jxbnDiv.style.minHeight = h + 'px';
            }
        }
        let currMH = this.divObjs.jxmasterDiv.style.maxHeight;
        if (currMH) {
            try {
            let x = parseInt(currMH.replace('px', '')) + height;
            //not some rubbish value::
            if (x > 0 && x < 1000)
                this.divObjs.jxmasterDiv.style.maxHeight = x +"px";
            }
            catch(e){}
        }
    }

// For Differential scroll (fixeHeight)
// This logic of this differential you can find in docs/
// differentialScroll_RendererCore.pptx
//
// What is this constant?     
// for case the container is taller than the ad     
// if the difference is < this threshold, then we dun bother
// else such little movements is just ridiculous
//
const thresholdDiff_ = 120;     
     function __handleScrollEvent(event, windowHeight = null, BCR = null) {
        if (this.floatmgr && this.floatmgr.isShowing()) {
            //when float unit is there, then no differential scroll behaviour.
            return;
        }
        //console.log(`windowHeight=${windowHeight} BCR=${BCR}`);
        let c = this.c;
        if (!c.hasOwnProperty('creativeH') || !c.hasOwnProperty('containerH')) {
            //first time only.
            c.creativeH = c.height;
            c.containerH = c.fixedHeight;
        }
        let containerH = c.containerH - this.univmgr.getHeight();

        let jxbnScaleDiv = this.divObjs.jxbnScaleDiv;
        let diff = containerH - c.creativeH; 
        //console.log(`__handleScroll diff: ${diff} containerH: ${c.containerH} creativeH: ${c.creativeH}`);
        
        //for AMP we get this from the first parameter
        let winH = windowHeight ? windowHeight: top.innerHeight;
        let containerBCR = BCR ? BCR: this.containerElt.getBoundingClientRect();

        // The whole job of this function, is to calculate offset:
        let offset = 0;

        let delta = this.c.excludedHeight; 
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
        if (containerH > winH) {
            if (containerBCR_top < 0) {
                // special case of a very short viewport (shorter than the container). 
                if (c.creativeH < winH) {
                    // creative height is shorter than that of viewport
                    //console.log(`kicked in ${0 - containerBCR.top} ${diff}`);
                    offset = Math.min(0 - (containerBCR_top), diff);
                }
                else {
                    // creative height is longer than that of viewport.
                    offset = ((0-containerBCR_top)*(diff))/(containerH-winH);
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
                        ((winH - containerBCR_bottom)*(diff))/(winH-containerH)
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
        //if (offset != this.savedoffset) 
        {
            //we set the top= offset only if it is different from last set.
            this.savedoffset = offset;
            jxbnScaleDiv.style.top = offset +  'px'; 
        }
    }

    
    /**
     * called as bound function . See comment above "START OF : POSITION AND SIZE MANIPULATION FUNCTIONS."
     **/
    function __cleanup() {
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
         if (cr[u_] && cr[u_].hasOwnProperty('diffscroll') &&
         !cr[u_].diffscroll) return true;
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
         if (cr.assets && cr.assets[u_]) {
            scaling = cr.assets[u_].scaling;
         }
         if (cr[u_] && cr[u_].scaling) {
            scaling = cr[u_].scaling;
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
         
        // (2) Get ready the Creative size (resize) info (some of these 
        // can be done before caching )
        //<--- This whole thing should be set in the precache preparation :
    
        // (2a) width, height columns
        let w = cr.width ? cr.width: 0;
        let h = cr.height ? cr.height: 0;
        
        let crDetails = (cr.assets ? cr.assets: cr); //this logic, run from adserver will have cr.assets
                                                     //if from renderer, then will be cr
        // (2b) assets
        if ((!w || !h)) { //server-side
            w = crDetails.width ? crDetails.width: 0;
            h = crDetails.height ? crDetails.height: 0;
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
            let p = crDetails.adparameters;
            if (p) {
                w = p.width ? p.width: 0;
                h = p.height ? p.height: 0;
                if (!w || !h) {
                    if (p.video) {
                        w = p.video.width ? p.video.width: 0;
                        h = p.video.height ? p.video.height: 0;
                    }
                }
            }
        }
        // ok exhausted all 
        if (!w || !h) {
            //cannot serve this corrupted creative
            w = 640;
            h = 360;
        }
        
        let crAR = w/h;
        if (cr.scaling == 'creative' && onlyARMatterTypes_.indexOf(cr.type)> -1) {
            w = 0;// to facilate the below calculations
            h = 0;
        }
        // Reminder that so for video : w and h are both set to 0 at this stage:
        /*
        let crMaxW = w;
        let crMinW = w;
        let crMaxH = h;
        let crMinH = h;
        */
        let crMaxW = 0;
        let crMinW = 0;
        let crMaxH = 0;
        let crMinH = 0;

        //<--- NEW CODE:
        if (scaling == 'none') {
            crMaxW = w;
            crMinW = w;
            crMaxH = h;
            crMinH = h;
        }
        else {
            let u = crDetails[u_]; 
            //init to 0 0 0 0
            //do the max first:
            if (u && !u.maxwidth && u.maxheight) {
                u.maxwidth = Math.round(crAR*u.maxheight);
            }
            if (u && u.maxwidth) {
                let tmp = Math.round(u.maxwidth/crAR);
                if (!u.maxheight || tmp < u.maxheight) {
                    //u.maxwidth make a more restricted thing:
                    crMaxW = u.maxwidth;
                    crMaxH = tmp;
                }
                else {
                    crMaxH = u.maxheight;
                    crMaxW = Math.round(crMaxH*crAR);
                }
            }
            //do the min then:
            if (u && !u.minwidth && u.minheight) {
                u.minwidth = Math.round(crAR*u.minheight);
            }
            if (u && u.minwidth) {
                let tmp = Math.round(u.minwidth/crAR);
                if (!u.minheight || tmp < u.minheight) {
                    //u.maxwidth make a more restricted thing:
                    crMinW = u.minwidth;
                    crMinH = tmp;
                }
                else {
                    crMinH = u.minheight;
                    crMinW = Math.round(crMinH*crAR);
                }
            }
            if (!crMaxW) {
                crMaxW = bigWidth_;
                crMaxH = bigHeight_;
            }
        }
        ////--- NEW CODE --->


        

        //none renderer, creative
        if (false) { //block it out:
        if (scaling != 'none') {
            // if it is not responsive, then crMaxW and crMinW = width of creative
            // ditto for height, nothing much to further calculate then:
            let u = crDetails[u_]; 
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
        }//if (false) block


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
        let mh_ = params.maxheight ? params.maxheight : 0;
    
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
                l = Math.min(params.maxheight ? params.maxheight: bigHeight_, crSizeRange.maxheight);
                if (h_ > l) {
                    h_ = l;
                    w_ = l*AR;
                }

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
        //console.log(`#### # # # # # ${w_} ${h_} ${mw_} ${mh_}`);
        //console.log("^^ w h mw mh ^^");
    }

    function sanitizeTitle(t){
        if (!t) return "";
        return  t.normalize('NFD').replace(/[^a-zA-Z0-9\s]/g, '').replace(/[\u0300-\u036f]/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"]/g,'');
    }

    /**
     * For the case of OSM the response event is to be fired by us here
     * Not by adserver, not by the OSM engine (coz the whole thing is in a base64 blob)
     * which a bit troublesome for osm engine to handle ... A bit hacky lah ... aaah
     * @param {*} c 
     */

    function fireOSMResponseMaybe(c) {
        let trackers = c.trackers ? c.trackers: ( c.adparameters.trackers ? c.adparameters.trackers: null);
        if (trackers && trackers.parameters && trackers.parameters.indexOf('source=osm')>-1) {
            fireTracker(trackers, 'response');
        }
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
         * 
         * OK this is no longer true.20211202 note. 
         */
        let nested = jxParams.nested;

        /* dun need this any more if (!isNaN(jxParams.fixedHeight)) {
            fixedHeight = parseInt(jxParams.fixedHeight); //gosh forgot to declare var
            if (fixedHeight > 0)
                nested = -1;
        }*/
        
        //this is the case whereby the creative itself will not manage the tracker firing
        //so WE HERE need to do it.
        //let doBasicTrackers = false; //later may become true, depends on the type of creative.
        let sendTrackerActions = null; 
        let trackers = c.trackers ? c.trackers: ( c.adparameters.trackers ? c.adparameters.trackers: null);
        let clicktrackerurl = null;
        if (trackers) {
            //need for universal mgr init:
            clicktrackerurl = trackers.baseurl + '?' + trackers.parameters + '&action=click';
        }

        // Currently the likes of R2B2 they are not properly integrated with our OSM stack, so
        // just put here as  a script type (type=display and subtype = script)
        // the thing is they actually better to follow the width of the container
        // It is better for such stuff to really occupy the full width of the article
        //So here we do just that.
        if (!isNaN(jxParams.fixedHeight) && c[u_] && c[u_].scaling == 'article') {
            c.width = jxParams.maxwidth-1;
            c.height = jxParams.maxheight-1;
            c[u_].scaling = 'none';
        }
        //ok I know what is the problem.
        //width and height supposed to be the perceived height of the creative.
        doSizeMgmt(jxParams, c);
        let out = { 
            varsize:            (c.height == 1),  
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
        // perhaps there will be nothing from server side.
        // just base on shape?
        // 
        if (JX_FLOAT_COND_COMPILE) {
            let device = (common.isMobile() ? 'mobile': 'desktop');
            console.log(`context: ### ${jxParams.context}`);
            //for amp there is not floating:
            if (jxParams.context != 'amp' && 
                (jxParams.floating == 'always' || jxParams.floating == 'creative' && c[u_] && c[u_].floating)) {
                //let srvCfg = (c[u_] && c[u_].floatparams ? c[u_].floatparams: {});
                //if (srvCfg[device]) { 
                  //  srvCfg = Object.assign(srvCfg, srvCfg[device]);
                //}
                let brwCfg = (jxParams.floatparams ? jxParams.floatparams: {});
                //let smw = srvCfg.maxwidth > 0 ? srvCfg.maxwidth : 9999;
                //let cmw = brwCfg.maxwidth > 0 ? brwCfg.maxwidth : 9999;
                //we take the more conservative maxwidth
                //let t = Math.min(cmw, smw);
                //if (t != 9999) tmp.maxwidth = t;
                
                if (brwCfg[device]) { 
                    brwCfg = Object.assign(brwCfg, brwCfg[device]);
                }
                let tmp = Object.assign({}, brwCfg);
                
                if (jxParams.fixedHeight) {
                    tmp.fixedHeight = jxParams.fixedHeight;
                }
                tmp.floating = jxParams.floating;
                tmp.adtype = c.type;
                out.floatParams = tmp;
            }
        }

        let trusted = (c.adparameters && c.adparameters.trusted ? true: false);
            //Their common characteristics: all to be in iframe.
            //then need a jxOutstream injected into the iframe as well.    
            const playerUrls_ = {
                video: 'https://scripts.jixie.media/jxplayerbridge.1.1.min.js?', 
                pyoutube: 'https://scripts.jixie.media/jxyoutubebridge.1.0.min.js', 
                pdailymotion: 'https://scripts.jixie.media/jxplayerdm.1.4.1.js?', 
                pivs: 'https://scripts.jixie.media/jxplayerivs.1.2.min.js?'
            };
        let assumeHasAd = false;

        /**
         * Get ready for a new type
         * Next time to develop a jixie script AND if it MUST be run as trusted
         * (Coz that opens a lot of problems actually; if stick it in 
         * 
         * You need to develop it using the template/trustedscript.js as a model
         * 
         * Over here, in the handling case for this type, subtype
         * 
         * You need to set 
         * out.crSig = '<signature of your creative script>' <-- this is needed.
         * out.trusted = true;
         * if got adparameters to pass this this script then just
         * out.adparameters ...
         * The renderer will be able to pass it then.
         */
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
                        break;
                    case 'pscript':
                        //But this thing is so funny.
                        //If it is DIV, then it get from adparameters.
                        //If it is IFRAME then it get from the jxuni_p...so funny.
                        //This is just a big mess
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
                    default: //igeneric
                        //e.g. the famous cid=29
                        //srcUrl = o.bUrl.iother;
                        //if it is SDK type (cid=1403, for example), then need to talk to it.
                        //and this type need to fire creative View also
                        //and also need to self fire a hasad.
                        let url ;
                        if (c.adparameters && c.adparameters.jxeventssdk) {
                            c.noclickevents = true;
                            url = c.url; //https://universal.jixie.io/iframe.1.1.html?'; //broker
                            sendTrackerActions = { creativeView: 1 };
                            assumeHasAd = true; //<== !!!
                            out.adparameters = c.adparameters;
                        }
                        else {
                            url = 'https://universal.jixie.io/iframe.1.1.html?'; //broker
                            url += 'creative=' + btoa(JSON.stringify(c)) + '&trackers=' + btoa(JSON.stringify(c.trackers));
                        }
                        out['iframe'] = { url: url };
                        break;
                }
                break;    
            case 'video': 
                trusted = false; //our video sdk will operate in friendly iframe most most most of the time.
                if (c.adparameters.trusted) {
                    trusted = true;
                    out.crSig = jxScriptUrls_.video.signature
                }
                //console.log(`CCC##### sucked out the signature ${c.crSig}`);
                out.adparameters = c; //<--- this is a special behaviour for video sdk stuff.
                //the videoadsdk needs more than the adparameters but 1 level up (still need generate vast)
                //this c blob contains a property adparameters                 
                if (!c.adparameters) { 
                    //case of third party tag; for vast generation
                    c.adparameters = { trackers: JSON.parse(JSON.stringify(c.trackers)) };
                }
                if (jxParams.jxsimidurl) {
                    //forcing to do SIMID
                    out.adparameters.jxsimidurl = jxParams.jxsimidurl;
                }
                //only those that are managed by us have this property
                delete out.adparameters.trackers;
                
                out[trusted ? 'div': 'iframe'] = { 
                    scripturl: jxScriptUrls_.video.url
                };
                //for this type we will use postMessage to post the adparameters.
                break;
            case 'display':
                switch (c.subtype) {
                    //case 'video+banner':
                        //now from adserver it is already morphed into video vvpaid
                        //break;
                    case 'script':
                        //this can be all kinds of things that are not integrated with jixie.
                        //so they don't know to fire jxhasad and what not.
                        let sbody = null;
                        try {
                            //example is the amazon display ad.
                            sbody = atob(c.script);
                        }   
                        catch (err) {
                            //need to handle properly.
                        } //TODO
                        //GAM type is able to detect no ad.
/* sbody = `<script src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<div id='div-gpt-ad-12345-0'>
  <script>
    window.googletag = window.googletag || {cmd: []};
    googletag.cmd.push(function() {
        googletag.defineSlot('/31800665/KOMPAS.COM_Mobile_AMP/osmjixie', [[300,600],[300,250],[320,100]], 'div-gpt-ad-12345-0').setTargeting('Pos',['osmkompas']).addService(googletag.pubads());
        googletag.pubads().addEventListener('slotRenderEnded', function(event) {
            if (event.isEmpty) {
                parent.postMessage('jxadended', '*');
                return;
            }
            parent.postMessage('jxmsg::' + JSON.stringify({'type': 'size',params: {'height': window.document.body.scrollHeight}}), '*');
        }); 
        googletag.pubads().set('page_url', 'https://amp.kompas.com/megapolitan/read/2021/05/28/05334261/update-27-mei-bertambah-15-kasus-covid-19-di-tangsel-kini-totalnya-11257');
        googletag.enableServices();
        googletag.display('div-gpt-ad-12345-0'); 
    });
  </script>
</div>`;*/
                        console.log(sbody); 
                        assumeHasAd = true; //<== !!!
                        out[trusted? 'div':'iframe'] = { scriptbody: sbody };
                        if (c.adparameters && c.adparameters.jxeventssdk) {
                            //THIS STUFF NOT YET TESTED....
                            //We also announced this only supported for trusted case.
                            c.noclickevents = true;
                            sendTrackerActions = { creativeView: 1 };
                            out.adparameters = c.adparameters;
                        }
                        else {
                            sendTrackerActions = { creativeView: 1, impression: 1};
                       }
                        break;
                    default: //can be either simple image or DPA (html). Still have to figure out...
                        let psr = document.createElement('a');
                        psr.href = c.url;
                        if (psr.pathname.indexOf('.htm') === -1 && psr.pathname.indexOf('.html') === -1) {
                            sendTrackerActions = {creativeView: 1, impression: 1};
                            c.noclickevents = true; //so below we force it to not do click events
                            out['div'] = { image: { url: c.url, clickurl: c.clickurl, trackers: c.trackers }};
                        }
                        else {
                            //DPA
                            out.adparameters = c.adparameters;
                            if (c.scaling == 'creative') {
                                //in the doSizeMgmt... it is possible
                                //that the widht and height has changed:
                                //instruct the DPA to do so:
                                out.adparameters.display_htmlsize = out.width+"x"+out.height;
                                //console.log(`### SCALING: out.adparameters.display_htmlsize=${out.adparameters.display_htmlsize}`);
                            }
                            out.iframe = { url: c.url };
                        }
                        break;
                }
                break;
        }//switch
        //console.log(JSON.stringify(out, null, 2));
        if (sendTrackerActions && trackers) {
            //tracker local var set earlier in the function
            trackers = JSON.parse(JSON.stringify(trackers));
            trackers.actions = sendTrackerActions; 
            if (!c.noclickevents) {
                //some of those there is our click proxy integrated into the tag so for those
                //we no need use such mechanism to approximate clicks
                trackers.actions.click = 1;
            }
            out.trackers = trackers;
        }
        if (c.adparameters && c.adparameters.jxeventssdk)
            out.jxeventssdk = 1;
        //we no longer have this restrictions            
        //if (out.fixedHeight > 0) {
            //if we have fixed height, then we need to set the nested to be -1. so the learn more and info button won't be shown
            //this is the just the only solution for now, coz I still can't find the way to support this kind of buttons when we are moving the creative within the window
         //   out.nested = -1;
        //}
        if (c[u_]) {
            out[u_] = c[u_];//??
        }
        /* just for ease of local testing: */
        /* out[u_] = {
            "title":"OSM demo video",
        "thumbnail":"https://creatives.jixie.media/MN168F6uZj/459/1708/mnc_youtube.jpg",
        "description":"This is a demo video for testing OSM solution from Jixie."
         };
         */
        
        
        out.assumeHasAd = assumeHasAd;
        return out;
    }

    //===============================================

    /**
     * Use this so that our startP function can be cleaner and
     * easily to see as a procedural flow (vs all kinds of callback
     * so one cannot really see the order of things happening)
     * This HooksMgr will "bind" functions to handle resize, blue, scroll
     * etc.
     * I did it this way so that those functions can be independently outside
     * this "object" ('class') so that this "class"-like thing (HooksMgr) can 
     * be small and what's going on is clearer
     * 
     * Coz those functions that do all the handling of stuff are long.
     * @param {*} container 
     * @param {*} normCrParams 
     * @param {*} divObjs 
     * @param {*} cxtFcns 
     */    
    function HooksMgr(container, normCrParams, divObjs, cxtFcns) { //}, univmgr) {
        this.needcallresize = true; //typically we will have this called after the hasad signal
        //but with amp, this might be too early and can cause problems.

        this.cxtFcns = cxtFcns;
        this.c = normCrParams;
        this.divObjs = divObjs;
        this.trackers = normCrParams.trackers; //not nec present
        this.ctr = container;
        //this.excludedH = normCrParams.excludedHeight;

        if (normCrParams.crSig && normCrParams.div) { 
            //
            normCrParams.token = divObjs.jxCoreElt.id;
        }
        this.allhooks = [];
        this.msghandlers = {};

        this.bf_cleanup = __cleanup.bind({divObjs:this.divObjs, c: this.c });
        this.bf_heightchange = __handleCreativeHeightChange.bind({divObjs:this.divObjs, c: this.c});
        this.bf_resize = __handleResize.bind({divObjs:this.divObjs, c: this.c });
        /* this.bf_scroll = __handleScrollEvent.bind({
            univmgr:        univmgr,
            savedoffset:    0,
            containerElt:   this.ctr,
            divObjs:        this.divObjs,
            c:              this.c
        });*/ 
        this.msghandlers['jxadended'] = this.bf_cleanup;
        this.msghandlers['jxchangeheight'] =  this.bf_heightchange;
        this.msghandlers['resize'] = this.bf_resize;
        this.bf_processCrEvtsMgs = __handleCrEvtsMsgs.bind({ 
            divObjs: this.divObjs, c: this.c, handlers: this.msghandlers });
      }
      HooksMgr.prototype.callHandleResize = function(mode) {
          let success = this.bf_resize();
          if (success) {
            this.needcallresize = false;
            // the reason for failure could be -- esp for AMP Prebidserver case
            // the container by the time of jxhasad could still be e.g. width = 1 or
            // something. so not a good time to do __handleResize yet.
          }
          else {
              // console.log(`!!!!!! ####need call resize is true`);
          }
      }
      HooksMgr.prototype.getPM2CreativeFcn = function(mode) {
        if (mode == 'jxeventssdk') return __pm2JxEvtsSDKWithMsgs.bind({divObjs:this.divObjs, c: this.c});
        if (mode == 'self') return __pm2Self.bind({divObjs:this.divObjs, c: this.c});
        //We don't have direct type yet.
        ///direct also do what is below lah: if (mode == 'direct') return __pm2CrDirectCall.bind({divObjs:this.divObjs, c: this.c});
        return __pm2CrWithMsgsEvts.bind({divObjs:this.divObjs, c: this.c });
      }
      HooksMgr.prototype.overrideHandler = function(e, cb) {
          this.msghandlers[e] = cb;
      }
      HooksMgr.prototype.hookBlur = function() {
        let bf = __handleBlur.bind({divObjs:this.divObjs, trackers: this.trackers });
        this.cxtFcns.addListener(this.allhooks, window, "blur", bf);
      } 
      HooksMgr.prototype.hookDifferentialScroll = function(univmgr, floatmgr) {
            this.bf_scroll = __handleScrollEvent.bind({
                univmgr:        univmgr,
                floatmgr:       floatmgr, //if float is showing then no diff scroll.
                savedoffset:    0,
                containerElt:   this.ctr,
                divObjs:        this.divObjs,
                c:              this.c
            });
            this.cxtFcns.addListener(this.allhooks, null, "scroll", this.bf_scroll);
      }
      //HooksMgr.prototype.unhookDifferentialScroll = function() {
        //this.cxtFcns.removeListener(this.allhooks, null, "scroll", this.bf_scroll);
      //}
      HooksMgr.prototype.hookResize = function() {
        this.cxtFcns.addListener(this.allhooks, window, "resize", this.bf_resize);
      }
      HooksMgr.prototype.hookVisChangeNotifiers = function(notifyFcn) {
        let o = {
            amp: (this.c.fixedHeight && this.cxtFcns.getType() == 'amp' ? 
                { boundScrollEvent: this.bf_scroll } : null),
            lastVisVal: -1,
            lastPgVis: -1,
            lastFired: -1,
            firstViewed: false,
            notifyFcn: notifyFcn
        };   
        if (this.needcallresize) {
            // console.log(`!!!!!! ####need call resize is true so wire up the notifyFirstVisible`);
            // this may be the case for AMP prebidserver case
            // as by the time of the jxhasad, the offsetWidth could very well be
            // 1 and so we cannot transform properly.
            o.notifyFirstVisible = this.bf_resize;
        }
        let bf = __combiVisibilityChange.bind(o);
        this.cxtFcns.setupVisChangeNotifiers(this.allhooks, this.ctr, bf); 
      }
      HooksMgr.prototype.hookEvts = function() {
        //trusted creative (in DIV could talk to us via events)
        this.cxtFcns.addListener(this.allhooks, this.divObjs.jxCoreElt, "jxhasad", this.bf_processCrEvtsMgs);
        this.cxtFcns.addListener(this.allhooks, this.divObjs.jxCoreElt, "jxnoad", this.bf_processCrEvtsMgs);
      }
      HooksMgr.prototype.hookMsgs = function() {
        this.cxtFcns.addListener(this.allhooks, window, "message", this.bf_processCrEvtsMgs);
     }
     HooksMgr.prototype.hookGeneric = function(target, event, boundFcn) {
        this.cxtFcns.addListener(this.allhooks, target, event, boundFcn);
      },
      HooksMgr.prototype.teardown = function() {
         delete this.c.trackers; //if there is any impression event not fired yet
         //(waiting for timer) then when the timer is up, it will not be fired.
         this.cxtFcns.teardown(this.allhooks);
         let bf = __cleanup.bind({divObjs:this.divObjs, c: this.c });
         bf();
      }

      /**
       * 2 outcomes in the resolved promise "full" or "fixedheight"
       * @param {*} resolveFcn 
       * @param {*} x 
       * @param {*} y 
       * @param {*} fixedheight 
       * @returns 
       */
      function ampReqSize(resolveFcn, x,y, fixedheight) {
          //here the fixedheight is our current height of the unit
          if (y == 1) {
              //somethingx1 type which is used to model 1x1 variable size slots 
              //in google; for this type, the height will be changed later
              //thru "size" messages posted from the creative iframe.
            resolveFcn("fixedheight");
            return;
          }
          if (y < fixedheight) {
              //no need to request resize
              //we have already enough real estate
              resolveFcn("full");
              return;
          }
          //this one is e.g. we have 300x600 then the slot is 400x300 (411x307)
          //then hopefully we get more space lah:
          return window.context.requestResize(x,y)
          .then(function() {
              resolveFcn("full");
          })
          .catch(function() {
              resolveFcn("fixedheight");
          });
      }


    var makeAdRenderer = function(params) {
        var _jxParams = null;
        var _jxContainer = null;
        
        var _floatInst = null; //in the build that does not build in the float code, this will
                               //always be null.
                               //in the build that has float capability, this may be non-null
                               //If the configuration says that they want float mode,
                               //then there will be a _floatInst != null then.
       
        /**
         * Main function : to kick off the ad call and render the ad etc
         * @param {*} jxContainer 
         *  handles 1 level of the waterfall                     
         */
        var _startP = function(jxContainer, remainingCreativesArr, next) {
            let univmgr = MakeOneUniversalMgr();
            let instId = "jx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        
            let cxtFcns = fcnVectorsByContext_[_jxParams.context];
            if (!cxtFcns) {
                cxtFcns = fcnVectorsByContext_.default;
            }
            let cr = remainingCreativesArr.shift();
            fireOSMResponseMaybe(cr);

            // MOST IMPORTANT CALL. THE NORMALIZED PARAMS OF THE CREATIVE: 
            let normCrParams = getNormalizedCreativeParams(_jxParams, cr);

            let ampReqSizeAnsResolveFcn     = null;
            let prom_ampReqSizeAns  = (_jxParams.context != 'amp' ?
                        Promise.resolve(null):
                        new Promise(function(resolve) { ampReqSizeAnsResolveFcn = resolve; }));
            if (_jxParams.context == 'amp') {               
                //with AMP we can actually request for more real estate (particularly vertical.)
                //this one we will see the outcome, then we decide how to create the container
                //Whether AMP grant us the request usu depeneds on where we are in the viewport
                //if the resize request will cause a reflow right in front of the user's eyes
                //then it will likely be denied.
                //In that case (if we dun get the vertical height we desire), then we will do 
                //fixedheight (differential scrolling)
                ampReqSize(ampReqSizeAnsResolveFcn, _jxParams.pgwidth, normCrParams.height, normCrParams.fixedHeight);
            }

            

            let prom1_stdCrHandshake    = null;
            let prom2_crHasAd           = null;
            let prom3_evtSDKHandshake   = null;
            let handshakenResolveFcn    = null; //called by standard creative, 
                                             //or the JX events sdk (which is loaded by creative
            let crHasAdResolveFcn       = null;
            let hooksMgr                = null;
            let boundPM2Creative        = null;
            let divObjs                 = null;

            prom_ampReqSizeAns.then(function(reqSizeAns) {
                if (reqSizeAns == 'full') {
                    //then we remove the fixed height stuff!
                    delete normCrParams.fixedHeight;
                }
                // This will create all the needed DIVs. And we are going to insert the
                // creative in a bit. but before that , set up the needed listens first
                divObjs = createOuterContainer(instId, jxContainer, normCrParams);
                createMainContainer(divObjs, normCrParams);//these can be called earlier too

                hooksMgr = new HooksMgr(jxContainer, normCrParams, divObjs, cxtFcns, univmgr);

                //
                //STEPS:
                //  1) [WAIT on prom1_stdCrHandshake]: if needed, WAIT for word that creative to 
                //        communicate to us that it is jxloaded
                //  2)      if needed, use messages to pass adparameters to creative (needed for e.g. DPA)
                //  3) [WAIT on prom2_crHasAd]: WAIT for creative to tell us jxhasad 
                //  4)      start visibility tracking (firing jxvisible, jxnotvisible as needed to creative)
                //  5) [WAIT on prom3_evtSDKHandshake]: (only applies to creatives using the jx events sdk; else
                //     this is just a resolved promise): if needed, WAIT for the creative (well, the jx events 
                //     sdk the the creative loads) to tell us it has been loaded

                prom2_crHasAd  =  normCrParams.assumeHasAd ? 
                                Promise.resolve('jxhasad'):
                                new Promise(function(resolve) { crHasAdResolveFcn = resolve; });
                if (normCrParams.jxeventssdk) {
                    //for events sdk integration (typically used with HTML type creatives), 
                    //prom1 we just 'pass' immediately
                    //So that immediately we can hook up the visibility hook so that we
                    //can fire the CV. after that then we really wait for the jx events sdk (loaded
                    //by the creative) to handshake with us . then we can tell to it the adparameters 
                    prom1_stdCrHandshake = Promise.resolve();
                    prom3_evtSDKHandshake = new Promise(function(resolve) {handshakenResolveFcn = resolve;});
                }
                else {
                    prom1_stdCrHandshake =  ( normCrParams.iframe && normCrParams.adparameters ? 
                        new Promise(function(resolve) {handshakenResolveFcn = resolve;}) : 
                        Promise.resolve());
                        // This is the case whereby we need to wait until the creative is "ready" 
                        // (script loaded and run)
                        // then & only then, fire the info of adparameters
                        // In those cases where this is not needed (e.g. the parameters passed thru object in the
                        // injected fragments, then this is resolved here.)
                    prom3_evtSDKHandshake = Promise.resolve();                    
                }
                hooksMgr.overrideHandler('jxloaded', handshakenResolveFcn);
                hooksMgr.hookMsgs();
                if (!normCrParams.iframe) 
                    hooksMgr.hookEvts(); //the creative may use events to talk to us
  
                let talkMode = normCrParams.trackers ? 'self': (normCrParams.crSig ? 'direct': 'other');
                if (normCrParams.jxeventssdk) talkMode = 'jxeventssdk';
                boundPM2Creative = hooksMgr.getPM2CreativeFcn(talkMode);    
                //for the case of the sdk stuff then we will talk later.
                //ah I know what to do!
            
                /**
                * SETTING UP OUR RESPONDING TO ANY COMMUNICATIONS FROM CREATIVE 
                * 3 things to do:
                * allhooks, all divs floating
                * 
                */
                hooksMgr.overrideHandler('jxhasad', function() { if (crHasAdResolveFcn) crHasAdResolveFcn('jxhasad');});
                hooksMgr.overrideHandler('jxnoad', function() { if (crHasAdResolveFcn) crHasAdResolveFcn('jxnoad');});
                hooksMgr.overrideHandler('jxadended', function() {
                    hooksMgr.teardown();
                    if (_floatInst) _floatInst.cleanup();
                    if (remainingCreativesArr.length > 0){
                        //waterfall to next layer
                        next(jxContainer, remainingCreativesArr, next);
                    }
                });

                // FINALLY , WE INJECT THE CREATIVE'S NEEDED SCRIPTS AND STUFF!!!!
                // THEN WE WAIT ON THE PROMISE THAT IT IS READY TO RECEIVE INSTRUCTIONS
                // FROM US    
                insertCreative(divObjs, normCrParams);
                return prom1_stdCrHandshake;
            })
            .then(function() {
                /**
                 * the creative (script, html ..or nothing) is loaded and ready to listen to our orders.
                 */
                if (normCrParams.adparameters) {
                    //Moving forward, for "trusted" type of script whereby we 
                    //need to pass them the adparameters, we need to match signature already
                    //But even signature is not fool proof...
                    //
                    //The older creatives definitely suffer a problem esp with the trusted type
                    //The problem occurs when the trusted type communicate with renderer using
                    //messages
                    //They may receive message from another UNIT
                    //Their messagse may go to renderer of another UNIT
                    //also the change height, how?
                    boundPM2Creative('adparameters', normCrParams.adparameters);
                }

                /**
                 * Set up on blur handler - ONLY IF needed
                 */
                if (normCrParams.trackers && normCrParams.trackers.actions.click) {
                    hooksMgr.hookBlur();
                }
                
                //OK, JUST WAIT FOR THE CREATIVE TO SAY HAS AD OR NO AD THEN!
                return prom2_crHasAd; 
            })
            .then(function(resolveVal) {
                if (resolveVal == 'jxnoad') {
                    throw new Error('jxnoad');
                }

                /**
                 * Set up resize handlers
                 */
                hooksMgr.hookResize();
                
                univmgr.init(divObjs.jxmasterDiv, //attachNode
                    __handleUnivHeight.bind({fixedHeight: normCrParams.fixedHeight, divObjs: divObjs}),
                    _jxParams, 
                    normCrParams[u_], 
                    normCrParams.clickurl, 
                    normCrParams.clicktrackerurl);
                
                hooksMgr.callHandleResize();

                if (JX_FLOAT_COND_COMPILE) {
                    if (normCrParams.floatParams) {
                        try {
                        _floatInst = MakeOneFloatingUnit(jxContainer, normCrParams.floatParams, divObjs, function() {
                            boundPM2Creative('jxnotvisible'); }, univmgr); 
                        }
                        catch (x) {
                            console.log(x.stack);
                        }
                    }
                }

                /**
                 *  if we do differential scrolling, then set up the listener
                 */
                if (normCrParams.doDiffScroll) {
                    hooksMgr.hookDifferentialScroll(univmgr, _floatInst);
                }
          
                /**
                 * visibility detection (for AMP, the differential scrolling depends on same callback
                 * mechanism as the visibility stuff)
                 */
                let notifyFcn = function(vis) {
                    if (_floatInst) { 
                        if (vis) { //the in-article slot is visible
                            _floatInst.stopFloat();
                        } else if (this.lastPgVis != 0) { //the page is not covered (lastPgVis != 0)
                            if (_floatInst.shouldFloat(this.firstViewed, vis)) {
                                _floatInst.startFloat(this.firstViewed);
                            } 
                        }
                    } 
                    //if the page is covered (lastPgVis == 0), then nothing is visible then:
                    //somethingVis: either at the original inarticle position, or the floating.
                    let somethingVis = (this.lastPgVis == 0 ? 0: (vis ? true : (_floatInst ? _floatInst.isShowing(): false)));
                    boundPM2Creative(somethingVis ? 'jxvisible': 'jxnotvisible');
                };
                hooksMgr.hookVisChangeNotifiers(notifyFcn);
                return prom3_evtSDKHandshake; 
            })
            .then(function() {
                boundPM2Creative('openshop');
            })
            .catch(function() {
                if (hooksMgr) hooksMgr.teardown();
                if (_floatInst) _floatInst.cleanup();
                if (remainingCreativesArr.length > 0){
                    //waterfall to next layer
                    next(jxContainer, remainingCreativesArr, next);
                }
            })
            .finally(function() {
            });
        }

        
        /**
         * 
         * Do any minor repair and stubbing with default if needed.
         * @param {*} params 
         * let the frame info be passed to here by the code.
         * gam: default none, safeframe friendlyframe
         */
        function _assembleParams(params) {
            if (params !== undefined && typeof params === 'object' && params !== null) {
                _jxParams = JSON.parse(JSON.stringify(params));
                let p = _jxParams;
                
                if (p.excludedheight) {
                    p.excludedHeight = p.excludedheight;
                }
                // Checking the parameters and adding parameters if needed
                p.pgwidth = parseInt(p.pgwidth) || 0;
                p.maxwidth = parseInt(p.maxwidth) || 0;
                if (p.pgwidth && !p.maxwidth) {
                    p.maxwidth = p.pgwidth;
                }
                p.maxheight = parseInt(p.maxheight) || 0;
                
                if (p.fixedheight) {
                    p.fixedHeight = p.fixedheight;
                    p.maxheight = p.fixedheight;
                }
                //_jxParams.nested = parseInt(_jxParams.nested) || 0;
                p.creativeid = parseInt(p.creativeid) || null;
                
                //but this stuff really no body use ah?!
                //_jxParams.width = parseInt(_jxParams.width) || 640;
                //_jxParams.height = parseInt(_jxParams.height) || 360;
                p.campaignid = parseInt(p.campaignid) || null;

                let ctr = null;

                if (JX_FLOAT_COND_COMPILE) {
                    if (p.floating == 'never' || !p.floating) {
                        delete p.floatparams; //even if there is, delete.
                    }
                    //the other options are: always, creative (default)
                    //for those we would have kept the floatparams already.
                }

                if (params.container) {
                    if (gIsFifs && p.doFloat) { //<--?
                        ctr = parent.document.getElementById(params.container);
                        if (!ctr) ctr = window.top.document.getElementById(params.container);
                    } else {
                        ctr = document.getElementById(params.container);
                    }
                    if (ctr) {
                        let pgWidthGuide = Math.round(ctr.offsetWidth);
                        //too off we dun use.
                        if (!isNaN(pgWidthGuide) && pgWidthGuide > 300 && pgWidthGuide < 700) {
                            p.pgwidth = pgWidthGuide;
                        }
                    }
                } 
                if (p.context != 'amp' && gIsUFif) {
                    p.fixedHeight = 0; //We will not be able to do the differential scroll
                    p.excludedHeight = 0; 
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
            //debugger;
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
                ['pageurl', 'domain', 'pagekeywords'].forEach(function(prop) {
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
