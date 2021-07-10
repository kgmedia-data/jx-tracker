/**
 * 
 * The core (partner-agnostic) part of the Jixie Outstream Manager: i.e. the engine
 * It consists of 2 "classes" (not techically classes). Just conceptually.
 * OneOSMWaterfall <-- 1 such "object" manages the lifetime of one waterfall traversal
 *   OneOSMLayer <-- each layer of the waterfall traversal is managed by 1 such "object"
 * 
 * NOTE: partner-agnostic-ness is achieved by the jxosmpartners layer.
 * (code in jxosmpartners_.js). It will reduce the instructions for different handlings
 * into properties/values in the json object for the layer.
 * So the OneOSMLayer just carries out what is prescribed there. It does not need
 * to have logic based on this is spotx, unruly etc... 
 * 
 * NOTE: for ease of development, we have 3 files:
 * - jxosmcore_.js (this file), 
 * - jxosmouter_.js (shell: contains the jxsel (which is from "cash" - a small jquery replacement),
 * - jxosmpartners_.js (partner specific stuff)
 * But these are combined (minified first, if needed) into 1 file for deployment
 */

// (function() {
    //if(window.jxoutstreammgr) {
      //  return;
    //}

        const JX_SLACK_OR_CONSOLE_COND_COMPILE = false;
        const JX_PARTNER_TEST= false;
        const JX_SLACK_COND_COMPILE= false;
        const JX_CONSOLE_COND_COMPILE= false;
        
    if (typeof jQuery == 'function') {
        window.jxsellib = true;
        //So far everywhere I see jQuery so we will mostly be here
        window.jxsel = jQuery;
    }
    else if (typeof Sizzle == 'function') {
        window.jxsellib = true;
        window.jxsel = Sizzle;
    }
    else { 
        window.jxsellib = false;
        //https://www.kirupa.com/html5/running_your_code_at_the_right_time.htm
        //we have to load this Sizzle thing then
        //This one will make sure our stuff works always
        //and the base script is light too.
        //But if got client pub that really no jQ on their pages
        //then we should make this script PART of ours.
        var sizScript = document.createElement('script');
        sizScript.onload = function () {
            window.jxsellib = true;
            window.jxsel = Sizzle;
        };
        sizScript.src = 'https://cdn.jsdelivr.net/npm/sizzle@2.3.6/dist/sizzle.min.js';
        document.body.appendChild(sizScript); 
    }




    

    //special Debug
    var _sendDbg = null; //for almost everybody it is turned off
    function sendTkr(partialUrl, action, strMaybe = null) {
        fetch(partialUrl + `&runId=A&action=${action}&extra=${strMaybe ? strMaybe:'na'}`).catch();
    }
        
    const   idJXOSMDiv_       = 'jxosmdiv'; //injected via the GTM TOO
    //////var     idsutils          = require('jixie-ids-common');

    ///////window.jxoutstreammgr = {};
  //https://www.sitepoint.com/comprehensive-jquery-selectors/
    /**
     * HELPER FUNCTIONS
     * @param {*} selector 
     * @param {*} parentNode 
     */
    var getAnElt = function(selector, parentNode = null) {
        //choose the library
        try {
        let sel = (parentNode ? jxsel(selector, parentNode) : jxsel(selector));
        if(sel && sel.length >= 1) return sel[0];
        }
        catch (errors) {
        }
        return null;
    }

    /**
     * Factory function for OneOSMLayer: object to do 1 layer of waterfall handling
     */

    let FactoryOneOSMLayer = function() {
        //"private" members ... (well, achieved thru closure :-))
        var _partner = null;
        var _msWFInit = null;
        //Now we are
        //jxosmdiv (part of the fragment we embed direct or thru GTM)
        //  div <-- this is what the "parentID" points to; By default, 
                    //the script fragments of the partners
                    //will be hung as children of this div
        var _parentID = "none";
        var _loggerInst = null;

        var _inArticleAdSlotNode = null; //the DOM node (the actual object, not id)pointed to by the selector
        //Only added recently coz we need to fire those "make up creativeview" events so e.g.
        //For selectmedia (floating) then it needs to listen on the visibility of this node (FES-122)
        
        var _msLayerInit = null;
        //These are like our "private" members (data and function)
        //The only public function is init()
        var _fcnTriggerNextLayer = null; //a pointer to function, to be set at init()
        
        //_jsonObj is super super important
        //It is the object from the adserver for this tag.
        //we actually mutate it: we ADD more properties to it to keep a handle on 
        //some runtime objects and we use it to manage this tag (and not create yet 
        //another object)
        var _jsonObj = null;
        
        var _instID = "none"; //just for testing only

        //Runtime created objects: observer for the visibility tracking:
        var _observer = null; //to generate CV event 
        var _observer2 = null; //this is for those floating type of tags. Coz we may need to
                                //generate synthetic CV for the earlier tags in the waterfall
                                //this is by tracking the visibility of the node pointed to by
                                //the OSM input selector
        var _observedNode2 = null; //for _observer2

        var _injectedDiv = null; //in case we want to clean up ... aargh we should
        
        var _isOpen = false; //isOpen is true when the partner fragment has been injected and we (OSM) is still 
        //awaiting news of the outcome 
        
        //Initially we may not be able to find the element from DOM
        //So we try N number of times before giving up.
        var _startVisTrkAttempts = 0;
        //just to prevent double-firing (doesn't mean we always have this)
        var _firedTrackers = {
            error: false, //can only fire once 
            creativeView: false,
            impression: false,
            response: false
        };
        //if the partners customfcn needs to create interval timers, they call _addIntervalTimer to register
        //it with this level. So that if we waterfall down and tear down everything, we also clear those interval timers
        //(in _prepareGoNext)
        var _intervalTimers = [];
        var _selfDestructTimer = null;

        //private functions:
        /**
         * Listener to listen for messages from the tags
         */
        var _addIntervalTimer = function(timer) {
            _intervalTimers.push(timer);
        };
        
        var _msgListener = function(e) {
            //TODO: may be still catch the teads hasad 
            //so that next time if we turn on the timeout thing
            //we won't kill it if an ad is waiting to be shown (not shown due to slot not in view)
            
            if(typeof e.data == 'string' && e.data.startsWith('jxosm')) {
                if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                    _dbgprint(`_msgListener (e.data=${e.data})`);
                }

                if (JX_PARTNER_TEST) {
                    //https://hooks.slack.com/services/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
                    if (true) {
                        if (e.data == _jsonObj.msgs.imp) {
                            _dbgprint(`Received ${_jsonObj.partner} ad played notification "${e.data}"`, true);
                        }
                        else if (e.data == _jsonObj.msgs.noad) {
                            _dbgprint(`Received ${_jsonObj.partner} no ad (passback) notification "${e.data}"`, true);
                        }
                        else if (e.data == _jsonObj.msgs.hasad) {
                            
                        }
                        else {
                            _dbgprint(`NOTE QUITE RIGHT! Received postMessage "${e.data}"
                                (Expecting "${_jsonObj.msgs.noad}" for no ad and "${_jsonObj.msgs.imp}" for ad played)`, true);
                        }
                        
                    }

                }
                if(e.data == _jsonObj.msgs.imp || e.data == 'jxosm_imp_selectmedia_selectJS417849795' ||
                    e.data == 'jxosm_imp_selectmediaJS417849795') {
                    //this stuff is ... because the SelectMedia way of doing things
                    //even when no ad, their window will pop up for a bit
                    //before JXOSM detect their noad and shut them down.
                    //So the trick is the scriptdiv for SM, we created it with 
                    //display: none.
                    //(SM create everything under the scriptdiv). So because of this
                    //display:none, the SM floating window will intially be invisible
                    //So we only set the scriptdiv to display: block when we get the 
                    //imp . 
                    //if no ad, then at least this trick helps to avoid the stupid 1 second
                    //black window showing up!
                    if (_jsonObj.customfcns.imp) {
                        _jsonObj.customfcns.imp();
                    }
                    //Fear not, if we have NOT YET fired the CV then fire it.
                    //it won't do double.
                    _isOpen = false; //so later if we receive some "noad" postmessage, we also won't do waterfall.
                    _fireTrackingEvent('creativeView');
                    if (!_jsonObj.floating) {
                        _fireMakeupTrackingEvent(_syntheticCVList);
                    }
                    _fireTrackingEvent('impression');
                }
                else if (e.data == _jsonObj.msgs.virtimp ) {
                    //virtual imperssion
                    //it is still possible that later they say no ad leh.
                    _fireTrackingEvent('impression', 'imptype=virtual2');
                }
                else if(e.data == _jsonObj.msgs.noad) { //HACK
                    ////I really saw it!  parent.postMessage("jxosm_noad_selectmediaJS417849795", "*");
                    _fireTrackingEvent('error', 'errorcode=303');
                    if (JX_PARTNER_TEST) {
                        //dun do anything
                        return;
                    }

                    //no use case now, block out first
                    //if (_jsonObj.customfcns.noad) {
                    //    _jsonObj.customfcns.noad();
                    //}
                    if(_isOpen) {
                        _isOpen = false;
                        _prepareGoNext(); //do all those unlisten and unobserve
                        _fcnTriggerNextLayer(_syntheticCVList);
                    } 
                } 
                else if(e.data == _jsonObj.msgs.timeout) {
                    //if there is still other stuff under this in the waterfall, then it should get out and make way
                    if (_jsonObj.stackidx < _jsonObj.stackdepth -1) {
                        if (_isOpen) {
                            _fireTrackingEvent('error', 'errorcode=301');
                            _isOpen = false;
                            _prepareGoNext(); //do all those unlisten and unobserve
                            _fcnTriggerNextLayer(_syntheticCVList);
                        }
                    }
                } 
                /* else if(e.data == _jsonObj.msgs.hasad) {                    
                    //no use case now, block out first
                    //if (_jsonObj.customfcns.hasad) {
                        //_jsonObj.customfcns.hasad();
                    //}
                    //So far no partner really emit this thing
                    //those type that has a hasad indication
                    //we would also have set off a timer
                    //if no hasad after a while we auto bye bye and waterfall to next
                    /////if(_autoWaterfallTimer) {
                        /////clearTimeout(_autoWaterfallTimer);
                    //////}
                }*/
            }
        };
        var _dbgprint = function(fcnname, partnerDbg = false) {
            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _loggerInst.prDbgStr(`f=${fcnname}`, _jsonObj? _jsonObj.stackidx: -1); 
            }
            if (partnerDbg) {
                _loggerInst.prPDbgStr(`${fcnname}`);
            }

        };
        //var _pdbgprint = function(fcnname) {
          //  //it is that stupid window also loh
            //_loggerInst.prPartner(`f=${fcnname}`, _jsonObj? _jsonObj.stackidx: -1); 
        //};
        /**
         * Called from init(...):
         * To kick start injection of the outstream tag
         * i) prepare the destination div if that is required
         * ii)inject the script
         * If this process is not successful, then we will call
         * _fcnTriggerNextLayer (private member; a pointer to a function)
         * which should have been set from the init(...)
         */
        var _start = function(getPageSlotFcn, fixedHeightBlob) {
            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _dbgprint('_start');
            }
            let keep = true;
            let tmp = getPageSlotFcn(); //see above note related to FES122
            if (tmp && tmp.node) {
                _inArticleAdSlotNode = tmp.node;
            }
            //the thing is morphed from the dbjson to rtjson
            /*
            _jsonObj = window.jxosmpartners.init({
                dbjson: _jsonObj, 
                instID: _instID, 
                getPageSlotFcn: getPageSlotFcn,
                fixedHeightBlob: fixedHeightBlob
            });
            */
            _jsonObj = _partner.makeNormalizedObj({
                dbjson: _jsonObj, 
                instID: _instID, 
                getPageSlotFcn: getPageSlotFcn,
                fixedHeightBlob: fixedHeightBlob
            });
            
            if (_jsonObj.valid) keep = true;
            else {
                //not valid:
                ////if (_sendDbg) {
                    ////sendTkr(_sendDbg, "keepfail1" , _jsonObj.partner);
                ////}
                return false;
            }
            
            let parentNode = null;
            /*
             * we do provide the functionality to create an adslot (of a certain div-id)
             * under a certain parent. but so far most of our partners we dun need go this route
             * The partner script that we inject already has the <div> (partner script is a fragment,
             * it can have non-script elements too. e.g. a div)
             */
            if(keep && _jsonObj.createslot && _jsonObj.createslot.div) {
                if(_jsonObj.createslot.parent) {
                    parentNode = (_jsonObj.createslot.parent.node ? 
                        _jsonObj.createslot.parent.node : 
                        getAnElt(_jsonObj.createslot.parent.selector)); //NOTE: was getUniqElt
                }
                if(parentNode) {
                    _jsonObj.createslot.parent.node = parentNode;
                    let childNode = getAnElt('#' + _jsonObj.createslot.div.id, parentNode);
                    if(!childNode) {
                        childNode = document.createElement("div");
                        childNode.id = _jsonObj.createslot.div.id;
                        if (_jsonObj.createslot.div.css) {
                            childNode.style.cssText = _jsonObj.createslot.div.css;
                        }

                        parentNode.appendChild(childNode);
                    }
                    if(childNode) {
                        if (JX_PARTNER_TEST) {
                            _dbgprint(`**Created div (id="${childNode.id}") for ${_jsonObj.partner} to serve ad in.`, true);
                        }
                        _jsonObj.createslot.div.node = childNode;
                    }
                }
                else {
                    ////if (_sendDbg && !keep) {
                        ////sendTkr(_sendDbg, "keepfail2",  _jsonObj.partner);
                    ////}
                    keep = false;
                }
                if(!_jsonObj.createslot.div.node) {
                    ////if (_sendDbg && !keep) {
                        ////sendTkr(_sendDbg, "keepfail3",  _jsonObj.partner);
                    ////}
                    keep = false;
                }
            }
            if(keep) {
                if(_jsonObj.scriptb || _jsonObj.scriptcfg) {
                    let scriptBody = _jsonObj.scriptb;
                    let hangScriptDiv = null; 
                    keep = false;

                    /**
                     * if there is a specific place where the injected script should be,
                     * it is specified thru scriptselector property.
                     */
                    if (_jsonObj.scriptselector) {
                        hangScriptDiv = getAnElt(_jsonObj.scriptselector); //NOTE: was getUniqElt
                    }
                    _injectedDiv = document.createElement('div');
                    _injectedDiv.id = _jsonObj.scriptdiv.id;
                    _injectedDiv.style.cssText = _jsonObj.scriptdiv.style;
                    let range = document.createRange();
                    range.setStart(_injectedDiv, 0);
                    if (JX_PARTNER_TEST) {
                        _dbgprint(`**Added ${_jsonObj.partner} script to page: ${scriptBody}`, true);
                    }
                    if (scriptBody) {
                        _injectedDiv.appendChild(range.createContextualFragment(scriptBody));
                    }
                    else {//only partner Jixie has this. //so if this function is not there. then bye
                        console.log("YES!!!!!!");
                        _partner.runCreative(_jsonObj.scriptcfg);
                    }
                    let parent = hangScriptDiv ? hangScriptDiv : document.getElementById(_parentID); //TODO HACK
                    if(parent) {
                        try {
                            parent.appendChild(_injectedDiv);
                            keep = true;
                        }
                        catch (error) {
                            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                                _dbgprint(`Exc injecting scr ${JSON.stringify(error.stack)}`);
                            }
                            //console.log(`__JX__ Ex injecting scr ${JSON.stringify(error.stack)}`);
                        }
                    }
                    else {
                        if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                            _dbgprint(`Nowhere to injecting scr`);
                        }
                        //console.log(`__JX__ Nowhere to inject scr`);
                    }
                }
            }
            if(keep) {
                _isOpen = true;
                ////if (_sendDbg) {
                    ////sendTkr(_sendDbg, "keepgood",  _jsonObj.partner);
                ////}
                _fireTrackingEvent('response');
                _startAllHooks();
            }
            ////if (_sendDbg && !keep) {
                ////sendTkr(_sendDbg, "keepfail4",  _jsonObj.partner);
            ////}
        
            return keep; 
        };
        /**
         * Called when this layer is going to be left alone as we are waterfalling down
         * to the next tag. If the CV is not yet fired, then we stash it into an array
         * Coz later in subsequent levels we may need to fire it FES-122
         * @param {*} action 
         * @param {*} trackersArr 
         * @returns 
         */
        var _stashTrackingEventMaybe = function(action, trackersArr) {
            if (!_jsonObj.trackers) return;
            if (_firedTrackers[action] === false) {
                _firedTrackers[action] = true;
                trackersArr.push(_jsonObj.trackers.baseurl + '?' + 
                    _jsonObj.trackers.parameters +
                    `&action=${action}&stackidx=${_jsonObj.stackidx}&stackdepth=${_jsonObj.stackdepth}` +
                    `&vers=v2.1&makeup=1`);
            }
        }
        var _fireMakeupTrackingEvent = function(trackersArr) {
            if (trackersArr) {
                for (var i = 0; i <  trackersArr.length; i++) {
                    fetch(trackersArr[i], {
                        method: 'GET',
                        credentials: 'include'
                    }).catch((err) => {});
                }
                trackersArr.length = 0;
            }
        }
        var _fireTrackingEvent = function(action, extraQM = "") { ///////}, trackersArr = null) {
            //Not all of these have trackers. The JIXIE one will not.
            //The JX creative (jxfriendly ... the whole set) will fire the
            //events as needed. 
            if (!_jsonObj.trackers) return;
            if (_firedTrackers[action] === false) {
                _firedTrackers[action] = true;
                if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                    _dbgprint(`_fireEvent (${action})`);
                }
                let ms = Date.now();
                let pingUrl = _jsonObj.trackers.baseurl + '?' + 
                    _jsonObj.trackers.parameters +
                    `&action=${action}&stackidx=${_jsonObj.stackidx}&stackdepth=${_jsonObj.stackdepth}` +
                    (extraQM ? '&' + extraQM: '') +
                    //this next one: more logging info at least for initial phase of JXOSM ...
                    `&vers=v2.1&msoffset0=${ms-_msWFInit}&msoffset1=${ms-_msLayerInit}`;
                    //v2.1 is with that Teads tweak in partners.js to try out

                if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                    _loggerInst.prTracker(pingUrl);
                }//if (JX_SLACK_COND_COMPILE)
                fetch(pingUrl, {
                    method: 'GET',
                    credentials: 'include'
                }).catch((err) => {
                    if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                        _dbgprint(`tracker err ${JSON.stringify(err.stack)}`);
                    }
                    //console.log(`__JX__ tracker err`);
                    //console.log(err);
                });
            }
          };
        
        var _prepareGoNext = function() {
            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _dbgprint('_prepareGoNext');
            }
            if (_selfDestructTimer) {
                clearTimeout(_selfDestructTimer);
            }
            try {
                _intervalTimers.forEach(function(t) {
                    clearInterval(t);
                });
            }
            catch(e){
                console.log(`__JX_ clear Interval in prepareGoNext exception`);
            }
            if (_injectedDiv) {
                _injectedDiv.parentNode.removeChild(_injectedDiv);
            }
            if(_msgListener) {
                window.removeEventListener('message', _msgListener);
            }
            if(_observer) {
                _observer.unobserve(_jsonObj.visibilityslot.node);
                _observer = null;
            }
            if(_observer2 && _observedNode2) {
                _observer2.unobserve(_observedNode2);
                _observer2 = null;
            }
            _inArticleAdSlotNode = null;
            if (!_jsonObj.floating)
                _stashTrackingEventMaybe('creativeView', _syntheticCVList);

        };
        var _startAllHooks = function() {
            //---- MSG LISTENER :--------------------
            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _dbgprint('_startAllHooks');
            }
            window.addEventListener('message', _msgListener, false);

            //---- SELF DESTRUCT TIMER: -------------------
            //if there is another item under in in the waterfall, then
            //set a self-destruct thing.
            if ( _jsonObj.stackidx < _jsonObj.stackdepth-1 
                && _jsonObj.timeout > 0 
                && _jsonObj.msgs.timeout) {
                _selfDestructTimer = setTimeout(function() {
                    window.postMessage(_jsonObj.msgs.timeout, "*");    
                }, _jsonObj.timeout);
            }
            _startVisibilityTrack();
        };
        var _startVisibilityTrack = function() {
            //---- VISIBILITY TRACKING:--------------------
            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _dbgprint('_startVisibilityTrack');
            }
            if (!_jsonObj.visibilityslot) return;
            let node = getAnElt(_jsonObj.visibilityslot.selector); //NOTE: was getUniqElt
            if(!node) {
                if (_startVisTrkAttempts++ < 5) {
                    setTimeout(function(){_startVisibilityTrack()}, 500);
                }
                else {
                    if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                        _dbgprint(`_startVisibilityTrack node not found after N tries (${_jsonObj.visibilityslot.selectors})`);
                    }
                }
                return;
            }
            else {
                if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                    _dbgprint('_startVisibilityTrack node found.');
                }
            }
            _jsonObj.visibilityslot.node = node;
            //this is for the real slot for this layer:
            _observer = new IntersectionObserver(function(entries) {
                if(entries[0]['isIntersecting'] === true) {
                    if (_jsonObj.customfcns.inview) {
                        if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                            _dbgprint('customfcns.inview called');
                        }
                        _jsonObj.customfcns.inview(_addIntervalTimer);
                    }
                    //FES-122: when layer N (current layer) is a normal slot (in article)
                    //based on selector to OSM
                    //Then, when the slot is in view for waterfall layer N, apart from firing CV
                    //for this craetive,
                    //in addition, if layers 0, ..., N-1 the CV not yet fired, we also fire here.
                    //
                    _fireTrackingEvent('creativeView');
                    //we can unobserve already if CV is fired:
                    if (!_jsonObj.floating) {
                        _fireMakeupTrackingEvent(_syntheticCVList);
                    }
                    _observer.unobserve(_jsonObj.visibilityslot.node);
                    //by right set to null better lah.
                } 
            }, {
                threshold: [0.2]
            });
            _observer.observe(_jsonObj.visibilityslot.node);


            //this is the supplementary only needed for SM:
            if (_jsonObj.floating && _inArticleAdSlotNode) {
                _observedNode2 = _inArticleAdSlotNode;
                _observer2 = new IntersectionObserver(function(entries) {
                    if(entries[0]['isIntersecting'] === true) {
                        _fireMakeupTrackingEvent(_syntheticCVList);
                        //we can unobserve already if CV is fired:
                        _observer2.unobserve(_observedNode2);
                        //by right set to null better lah.
                    } 
                }, {
                    threshold: [0.2]
                });
                _observer2.observe(_observedNode2);
            }//floating:
        };


        //constructor
        /**
         * 
         * @param {*} msWFInit  <-- Timestamp of waterfall init (ms)
         * @param {*} parentID <-- This is the DIV from into which this layer can inject script 
         * @param {*} loggerInst <-- The logger object we can use to spit out info
         */      
        function OneOSMLayer(partner, msWFInit, parentID, loggerInst) {
            _partner = partner;
            _msWFInit = msWFInit;
            _parentID = parentID; //THIS IS A DIV
            _loggerInst = loggerInst;
        }
        /**
         * @param {*} fcnGetPgSelector <--A function to find a Node (to show the ad)
         *                            from the page based on JXOSM-embed level selector specifications
         * 
         * @param {*} jsonObj <--  the JSON from adserver (dbjson). We use this to produce a rtjson 
         *                         (runtime json) manage the runtime of this OneOSMLayer
         * @param {*} fcnTriggerNextLayer <-- the function to call to trigger next layer in 
         *                                    waterfall when the layer is attempted (error or no ad)
         * 
         * msWFInit is fixed, parentID , fcnGetPgSelector are all fixed
         */
        OneOSMLayer.prototype.init = function(
            fcnGetPgSelector, fixedHeightBlob,
            jsonObj, 
            syntheticCVList,
            fcnTriggerNextLayer) {
            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _dbgprint('_init (OneOSMLayer)');
            }
            _msLayerInit = Date.now();
            _fcnTriggerNextLayer = fcnTriggerNextLayer;
            _syntheticCVList = JSON.parse(JSON.stringify(syntheticCVList));
            _instID = "OSMLayer_" + _msLayerInit;
            _jsonObj = jsonObj;

            if (!_start(fcnGetPgSelector, fixedHeightBlob)) { //if return false means no good lah.
                _fireTrackingEvent('error', 'errorcode=999');
                _prepareGoNext();
                _fcnTriggerNextLayer(_syntheticCVList);
            }
        };
        return OneOSMLayer;

    }

    //===================================================
    /**
     * 
     */
    let FactoryOneLogHelper = function() {
        /**
         * "Private" Members (data)
         */
        var _startMS = Date.now();
        var _slackBlob = {};
        var _attachments1 = [];
        var _attachments2 = [];
        var _attachments3 = [];
        if (JX_SLACK_COND_COMPILE) {
            _slackBlob = {
                text: `x`,
                blocks: [ 
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `${(new Date()).toISOString()} (${navigator.userAgent ? navigator.userAgent: 'no ua'})`
                        }
                    }
                ]
                
            };
        }
        var _partnerDbgWnd = null;
        var _partnerMsgIdx = 1;
        var _jxconsole = false;
        var _jxslack = false;
        var _slackPath = "";
        var _flushSlack = function() {
            if (JX_SLACK_COND_COMPILE) {
                _slackBlob.attachments = _attachments1.concat(_attachments2, _attachments3);
                let data = JSON.stringify(_slackBlob);
                let xhr = new XMLHttpRequest();
                xhr.open("POST", `https://hooks.slack.com/services/${_slackPath}?text=jxosm`);
                //Note: CANNOT HAVE THIS: xhr.setRequestHeader("Content-Type", "application/json"); //else cannot send
                //idea borrowed from https://stackoverflow.com/questions/41042786/cors-issue-using-axios-with-slack-api
                xhr.send(data);
            }
        };
        var _quickSend = null;
        if (JX_PARTNER_TEST) {
            _quickSend = function(textmsg) {
                try {
                    let data = JSON.stringify({text: textmsg});
                    let xhr = new XMLHttpRequest();
                    xhr.open("POST", `https://hooks.slack.com/services/${_slackPath}?text=jxosm`);
                    xhr.send(data);
                }
                catch (error) {
                }
            };
        }
        var _slackADbgStr = function(ms, stackidx, msg) {
            if (JX_PARTNER_TEST) {
                //quickly send it. Dun batch up to send
                _quickSend(`msoffset=${ms} layer=${stackidx} ${msg}`);
                return;
            }
            if (JX_SLACK_COND_COMPILE) {
                if (!_jxslack) {
                    return;
                }
                _attachments2.push(
                    {
                        "title": `msoffset=${ms} layer=${stackidx}`,
                        "text": `${msg}`,
                        "color": "#DFFF00"
                    }
                );
            }
        };
        var _slackAdResp = function(obj) {
            if (JX_PARTNER_TEST) {
                return;
            }
            if (JX_SLACK_COND_COMPILE) {
                if (!_jxslack) {
                    return;
                }
                if (obj.creatives) {
                    obj.creatives.forEach(function(cr) {
                        _attachments1.push(
                            {
                                "title": `${cr.stackidx}: ${cr.subtype}`,
                                "text": JSON.stringify(cr.adparameters, null, 2),
                                "color": "#7CD197"
                            }
                        );
                    });
                }
            }
        };
        var _slackATracker = function(timedesc, trackerUrl) {
            if (JX_PARTNER_TEST) {
                return;
            }
            if (JX_SLACK_COND_COMPILE) {
                if (!_jxslack) {
                    return;
                }
                try {
                    let qp = (new URL(trackerUrl)).searchParams;
                    if (!qp) {
                        qp = {
                            get: function() { return "na"; }
                        }
                    };
                    _attachments3.push({
                            "title": `ms=${timedesc}: action=${qp.get('action')} cid=${qp.get('cid')} idx=${qp.get('stackidx')} errorcode=${qp.get('errorcode')}`,
                            "text": trackerUrl,
                            "color": "#6495ED"
                        }
                    );
                }
                catch (err) {
                    console.log(err.stack);
                }
            }//if (JX_SLACK...)
        };
        
        OneLogHelper.prototype.prTracker = function(trackerUrl) {
            if (_jxslack || _jxconsole) {
                if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                    let diff = Date.now() - _startMS;
                    if (JX_CONSOLE_COND_COMPILE) {
                        if (_jxconsole)
                            console.log(`__JX__${diff} ${trackerUrl}`);
                    }
                    if (JX_SLACK_COND_COMPILE) {
                        if (_jxslack)
                            _slackATracker(diff, trackerUrl);
                    }
                }
            }
        };
        OneLogHelper.prototype.prAdResponse = function(obj) {
            if (_jxslack || _jxconsole) {
                if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                    if (JX_CONSOLE_COND_COMPILE) {
                        if (_jxconsole) 
                            console.log(JSON.stringify(obj, null, 2));
                    }
                    if (JX_SLACK_COND_COMPILE) {
                        if (_jxslack)
                            _slackAdResp(obj);
                    }
                }
            }
        };
        OneLogHelper.prototype.prDbgStr = function(msg, stackidx = -1) {
            //add to that stupid window
            if (_jxslack || _jxconsole) {
                if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                    let diff = Date.now() - _startMS;
                    if (JX_CONSOLE_COND_COMPILE) {
                        if (_jxconsole) 
                            console.log(`__JX__${diff} ${msg}`);
                    }
                    if (JX_SLACK_COND_COMPILE) {
                        if (_jxslack)
                            _slackADbgStr(diff, stackidx, `${msg}`);
                    }
                }
            }
        };
        OneLogHelper.prototype.prPDbgStr = function(msg, stackidx = -1) {
            if (_partnerDbgWnd) {
                _partnerDbgWnd.append('\n'+_partnerMsgIdx++ + ":  " + msg);
            }
            if (_jxslack) {
                //but the partner stuff better not batched up leh!
                if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                    let diff = Date.now() - _startMS;
                    if (JX_SLACK_COND_COMPILE) {
                        if (_jxslack)
                            _slackADbgStr(diff, stackidx, `${msg}`);
                    }
                }
            }
        };
        function OneLogHelper(qparams) {
            if (qparams.get('jxconsole')) {
                _jxconsole = true;
            }
            if (JX_PARTNER_TEST) {
                //a floating window to show the status to the partner testing
                var div = document.createElement("div");
                div.style.position = 'fixed';
                div.style.bottom = 0;
                div.style.width = "100%";
                div.style.height = "100px";
                div.style.zIndex = "99999";
                //style="font-size: 44pt"
                div.innerHTML = `<textarea id="partnerdbgwin" style="font-size: 8pt; background-color: yellow; margin: 0px; width: 100%; height: 100%;"></textarea>`;
                document.body.appendChild(div);
                _partnerDbgWnd = document.getElementById("partnerdbgwin");
                //this one will also include JX_SLACK_COND_COMPILE 
                _slackPath = 'T014XUZ92LV/B01RK71TUP5/rGxEpydmRlz6p8TPClgOUs86';
            }

            if (JX_SLACK_COND_COMPILE) {
                if (!_slackPath) {
                    _slackPath = qparams.get('jxslack');
                }
                if (_slackPath) {
                    _jxslack = true;
                    setTimeout(function() {
                        _flushSlack();
                    }, 20000); //more than enough lah. So the tester also must remember to
                    //scroll the part of the expected outstream appearance into the viewport
                    //else the impression event won't come out.
                }
                else {
                    console.log("___JX non slack path");
                }
            }
        }//
        return OneLogHelper;

    }



    //===================================================
    /**
     * 
     */
    let FactoryOneOSMWaterfall = function() {
        var _partners = null;
        function OneOSMWaterfall(partners) {
            _partners = partners;
        }
        /**
         * "Private" Members (data)
         */
        var _msWFInit = null;
        var _loggerInst = null;
        var _creativesArray = 0;
        var _ctrID = null;
        var _pgSelectors = [];
        var _fixedHeight = null;
        var _pgNode = null;
        var _bottomReached = true; //at first is true, then if got waterfall (from adserver)
        //to do, then set to false, then when exhausted, set to true.

        /**
         * "Private" Members (functions)
         */
        var _dbgprint = function(fcnname, partnerDbg) {
            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _loggerInst.prDbgStr(`__OSMWaterfall f=${fcnname}`, -1); // called on ${_instID}`);
            }
            if (partnerDbg) {
                _loggerInst.prPDbgStr(`__OSMWaterfall f=${fcnname}`, -1); // called on ${_instID}`);
            }
        };
        //for some tag, "where" to show the ad is hardwired into the e.g. ad partner
        //console.But for some, the tag dunno where to stick the ad into.
        //JXOSM also is getting this info in the "p" passed into it..
        //It is an array of selectors. So if need (and only if needed, this getPgSelector)
        //will be called. We see which of the passed in selectors map to a real node on page
        //and we remember the result in _pgNode. so that when called again we can just use it.
        var _getPgSelector = function() {
            //choose one from the page selectors that are legit loh.
            if (_pgNode) { // we already calculated this earlier, so just use
                if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                    _dbgprint(`_getPgSelector called by current layer: ${_pgNode.selector}`);
                }
                return _pgNode; 
            }
            //
            
            for (var i = 0; i < _pgSelectors.length; i++ ) {
                let sel = null;
                try {
                    sel = jxsel(_pgSelectors[i]);
                }
                catch (er) {}
                //the above is normal. If some kind of invalid selector,
                //we could get this kind of exception...
                if (sel && sel.length >= 1 && sel[0] && 
                    (sel[0].nodeName == 'DIV' || sel[0].nodeName == 'P')) {
                    _pgNode = {
                        node: sel[0],
                        selector: _pgSelectors[i]
                    };
                    if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                        _dbgprint(`_getPgSelector called by current layer: ${_pgNode.selector}`);
                    }
                    return _pgNode;
                }
            }//for
            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _dbgprint(`_getPgSelector called by current layer: null found`);
            }
            ////if (_sendDbg) {
                ////sendTkr(_sendDbg, "selectorfail");
            ////}
            return null;
        };
        var _startOneLayer = function(syntheticCVList = []) {
            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _dbgprint('_startOneLayer');
            }
            if(_creativesArray.length > 0) {
                try {
                    let OneOSMLayer = FactoryOneOSMLayer();
                    //we should pass in the partner info bah.
                    let thisCr = _creativesArray.shift();
                    let partner = _partners[thisCr.subtype];

                    let oneLayerInst = new OneOSMLayer(partner, _msWFInit, _ctrID, _loggerInst);
                    console.log("_______new OSMLayer " + partner.name);
                    oneLayerInst.init(
                        _getPgSelector, _fixedHeight,
                        thisCr,
                        syntheticCVList,
                        _startOneLayer);
                }
                catch (er) {
                    ////if (_sendDbg) {
                        ////sendTkr(_sendDbg, "exception", JSON.stringify(er.stack));
                    ////}
                }
            } else {
                _bottomReached = true;
            }
        };
        
        var _oneOffNonsense = function(p) {
            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _dbgprint('_oneOffNonsense');
            }
            //the default place to "hang" the script fragments...
            //but some partners they need to hang the script fragments somewhere else.
            let pCtr = getAnElt('#' + (p.managerdiv ? p.managerdiv: idJXOSMDiv_));
            if (!pCtr) {
                pCtr = getAnElt('body');
            }
            let pDiv = document.createElement('div');
            pDiv.id = _ctrID;
            pCtr.appendChild(pDiv);
        };
        var _doctor = function(qparams, creativesArray) {
            if (JX_PARTNER_TEST) {
                //they would have used creativeids;
                //partner: creativeid loh. The test one
                let partner = qparams.get('partner');
                //https://hooks.slack.com/services/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
                //fake it totally.
                _bottomReached = false;
                let blob = _creativesArray[0];
                if (!partner || blob.subtype != partner) {
                    alert("Partner mismatch");
                }
                switch (partner) {
                    case "teads":
                        blob.adparameters.pageId = qparams.get('pageId');
                        break;
                    //case "spotx":
                      //  break;
                    case "selectmedia":
                        blob.adparameters.script_id = qparams.get('script_id');
                        blob.adparameters.script_src = qparams.get('script_src');
                        break;
                    case "unruly":
                        blob.adparameters.siteId = qparams.get('siteId');
                        break;
                }//switch
            } //
        };

        OneOSMWaterfall.prototype.cleanup = function() {
            //delete whatever junk we have added
            //TODO bah...
        };
        OneOSMWaterfall.prototype.isBottomReached = function() {
            //so far also no use ....
            return _bottomReached;
        };
        /**
         * p is passed in from the page where our JX OSM script is embedded
         * @param {*} p 
         */
        //we work on this modeldiv thing ...
        OneOSMWaterfall.prototype.init = function(p, qparams, loggerInst) {
            _loggerInst = loggerInst;
            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _dbgprint('_init');
            }
            if (p.fixedheight || p.excludedheight) {
                _fixedHeight = {}; //p.fixedheight;
                if (p.fixedheight) {
                    _fixedHeight.fixedheight = p.fixedheight;
                }
                if (p.excludedheight) {
                    _fixedHeight.excludedheight = p.excludedheight;
                }
            }
            if (p.selectors && p.selectors.length > 0) {
                _pgSelectors = p.selectors;
                for (var i = 0; i < _pgSelectors.length; i++) {
                    //20210423: 
                    //this is a temp fix I need to let live for a while
                    //coz it seems even though they say it is fixed, but I still
                    //seem to see the old way in some of the older pages (how can??)
                    //else our Unruly ad or teads will get served inside the IVS thumbnail <p>
                    if (_pgSelectors[i] == '.read__content p:last') {
                        _pgSelectors[i] = '.read__content > p:last';
                    }
                    else if (_pgSelectors[i] == '.contentArticle p:last') {
                        _pgSelectors[i] = '.contentArticle > p:last';
                    }
                } 

                if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                    _dbgprint(JSON.stringify(p.selectors, null, 2));
                }
            }
            //we do not abort at this stage even if dun have selectors
            //specified coz in theory it can be supplied per creative (tag)

            _msWFInit = Date.now();
            _instID = "OSMWF_" + _msWFInit;
            _ctrID = "ctrid" + _msWFInit; //TODO REfers to the container for the injected CODE of the various partners
            /*
            var idsHelper_ = new idsutils.CIdsCommon({
                track: true, //?? TODO
                window: window,
                document: document
            });
            var idsObj = idsHelper_.getIdsIfAvail(); //Note idsObj could be null
            */
           var idsObj = {};
            let url;

            let arr = [];
            //at the earlier days of JXOSM, we need all these test paths ...
            let val64 = qparams.get('json64');    
            let valwfidx0 = qparams.get('wfidx0');    

            if (val64) {
                //the test lambda mock adserver - by JSON blob
                arr.push('json64='+encodeURIComponent(val64));
            }
            else if (valwfidx0) {
                //the test lambda mock adserver by qparams
                ['wfidx0','wfidx1','wfidx2','wfidx3','wfidx4'].forEach(function(qp){
                    let val = qparams.get(qp);    
                    if (val){
                        arr.push(qp+'='+val);
                    }
                });
            }
            //---> 
            if (arr.length > 0) { //i.e. we are doing some tests so talk to our fake endpoint.
                url = `https://pcp0dykryi.execute-api.ap-southeast-1.amazonaws.com/prod/gethbtestdesc?unit=${p.unit}`; //&modeldiv=${p.modeldiv}`;
                url += '&' + arr.join('&');
            }
            else {
                let pageurl = encodeURIComponent(location.href);
                let domain = encodeURIComponent(location.hostname);
                let pNode = _getPgSelector();

                /***********
                let isMobile = false;
                (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) isMobile = true;})(navigator.userAgent||navigator.vendor||window.opera);
                if (!isMobile && (Date.now() < 1616746593000) && pageurl && pageurl.indexOf('sains.kompas.com%2Fread%2F') > -1) {
                    _sendDbg = `https://ad-dev.jixie.io/v2/dosm?pageurl=${pageurl}&domain=${domain}`;
                }***********/
                url = `https://ad.jixie.io/v2/osm?source=osm&unit=${p.unit}&domain=${domain}&pageurl=${pageurl}` + (pNode && pNode.node.clientWidth ? '&width='+pNode.node.clientWidth:'');
                
                /*let valcids = qparams.get('creativeids');    
                if (valcids) {
                    url += '&creativeids=' + valcids;
                }*/
                if (p.unit == '1000008-iT3q5Ci4Ry') {
                    url += '&creativeids=' + 683;
                }
                if (p.unit == 'x1000008-iT3q5Ci4Ry') {
                    url += '&creativeids=1005|1165';
                }
                if (p.unit == 'xx1000008-iT3q5Ci4Ry') {
                    url += '&creativeids=' + 800;
                }
                //HACK
            }
            if (idsObj && idsObj.client_id) url += '&client_id=' + idsObj.client_id;
            if (idsObj && idsObj.sid) url += '&sid=' + idsObj.sid;

            if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                _dbgprint('_fire ad request');
            }
            /////if (_sendDbg) { //first
                ////sendTkr(_sendDbg, "request");
            ////}            
            fetch(url, {
                    method: 'GET',
                    credentials: 'include'
                })
                .then((response) => response.json())
                .then((responseJson) => {
                    ////if (_sendDbg) { //second
                        ////sendTkr(_sendDbg, "response", ""+responseJson.creatives.length);
                    ////}
                    if(responseJson.creatives.length >= 1) {
                        if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                            _loggerInst.prAdResponse(responseJson);
                        }
                        _bottomReached = false;
                        _creativesArray = JSON.parse(JSON.stringify(responseJson.creatives)); 
                        if (JX_PARTNER_TEST) {
                            _doctor(_creativesArray);
                        }
                        _oneOffNonsense(p); 
                        _startOneLayer();
                    }
                }).catch((err) => {
                    ////if (_sendDbg) { //second
                        ////sendTkr(_sendDbg, "noresponse",  JSON.stringify(err.stack));
                    ////}
                    if (JX_SLACK_OR_CONSOLE_COND_COMPILE) {
                        _dbgprint(`adserver err ${JSON.stringify(err.stack)}`);
                    }
                });
        };
        return OneOSMWaterfall;
    };

    //This is the only function actually exposed to the publisher page
    //window.jxoutstreammgr.init = function(p) 
    function createInstance_(p, partners ) {
        //if (!window.jxoutstreammgr.qparams) {
          //  window.jxoutstreammgr.qparams = (new URL(document.location)).searchParams;
        //}
        let qparams = (new URL(document.location)).searchParams;
        let OneLogHelper = FactoryOneLogHelper();
        let logInst = new OneLogHelper(qparams);
        
        let OneOSMWaterfall = FactoryOneOSMWaterfall();
        let wfInst = new OneOSMWaterfall(partners);
        if (window.jxsellib)
            wfInst.init(p, qparams, logInst);
        else {
            //this is those rare case we need to load the Sizzle library
            //explicitly coz the page has no jQ...
            window.jxRetryFcn = function() {
                if (window.jxsellib) {
                    window.jxsellib = 0;
                    wfInst.init(p, window.jxoutstreammgr.qparams, logInst);
                }
                else {
                    setTimeout(jxRetryFcn, 200);
                }
            }
            setTimeout(window.jxRetryFcn, 200);
        }            
    }

    
    module.exports.createInstance = createInstance_;

//})();
