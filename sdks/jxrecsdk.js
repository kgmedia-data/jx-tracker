const mids = require('../components/basic/idslite');
const mpginfo = require('../components/basic/pginfo');

(function() {
    if (window.abcdefgh) return;
    window.abcdefgh = 1;

    const sendTypeClick_ = 1;
    const sendTypeLoad_ = 2;
    const sendTypeGeneral_ = 3;

    var ImpressionTimer = function(callback, delay) {
        var timerId, start, remaining = delay;
        this.pause = function() {
            window.clearTimeout(timerId);
            timerId = null;
            remaining -= Date.now() - start;
        };
    
        this.resume = function() {
            if (timerId) {
                return;
            }
    
            start = Date.now();
            timerId = window.setTimeout(callback, remaining);
        };
    
        this.resume();
    }


    let MakeOneJxRecHelper = function(type, options) {
        var _slackPath = null;
        
        //actually now not so necesssary...
        var _readyBlkRun = false; // to control a certain piece of code not run twice
        if (window.location.href && window.location.href.indexOf('send2rwslack') > -1) {
            _slackPath = 'T01RTR6CT43/B03MP1J0LAZ/r0XSxWYeKsHCe0GmJ30g7VE3';
        }
        else if (window.location.href && window.location.href.indexOf('send2slack') > -1) {
            _slackPath = 'T01RTR6CT43/B03MRT64MK5/YCh8WjoqoHZmkNpz6iumMgJe';
        }
        var _actions = []; //those impression, cv, whatever stuff.
        var _typeLoadActions = []; //load ready and error
        var _itemVis = [];
        var _options = null;
        var _recVersion = null;
        var _trackerUrlBase = null;
        var _basicInfo = null;

        var _widgetDiv = null;

        var _loadedTimeMs = 0;
        var _readyTimeMs = 0;

        var _registeredDivs = [];
        var _items2Observe = [];
        var _wrapperObserver = null;
        var _itemsObserver = null;
        var _defaultThreshold = 0.5;
        var _isCreativeVisible = 0;
        var _isWidgetVisible = 0;

        var _eventsFired = {
            load: 0,
            ready: 0,
            impression: 0,
            creativeView: 0,
            widgetview_50pct: 0,
            widgetview_100pct: 0,
        }
        var _behavioursFired = 0; //not used.

        var _creativeEventFired = {
            impression: 0,
            creativeView: 0,
        }

        var _recoID = null;

        var _documentEvents = ['scroll', 'click'];
        var _idleTimer;
        var _imagePromises = [];
        var _imgLoadTimeout = 8000;

        var _impInterval = null;

        /**
         * Due to evolution this function name is not so good already
         * and it is not even a "send what we have" any more.
         * Some; like the click, is sent immediately and on its own (the provided msgbody0)
         * @param {*} type 
         *  const sendTypeClick_ = 1;
            const sendTypeLoad_ = 2;
            const sendTypeGeneral_ = 3; <-- default
         * @param {*} context : some extra info as to the circumstances of invocation (for debugging and testing)
         * @param {*} msgBody0 : only relevant if it is click.
         * @returns 
         */
        function _sendWhatWeHave(type = sendTypeGeneral_, context = null, msgBody0 = null) {
            if (!_trackerUrlBase) {
                _trackerUrlBase = _makeTrackerBaseUrl(_basicInfo, null);
            }
            _trackerUrlBase += (_recVersion ? '&v=' + _recVersion: '');
            _recVersion = null; //else we keep on adding.
            var msgBody = null;
            if (type == sendTypeClick_) {
                msgBody = msgBody0;
            }
            else if (type == sendTypeLoad_) {
                msgBody = {
                    actions: _typeLoadActions
                };
            }
            else { //general type
                if (_actions.length > 0) { //!_behavioursFired) {
                    _behavioursFired = 1;
                    msgBody = {
                        actions: _typeLoadActions.length > 0 ? _typeLoadActions.concat(_actions): _actions,
                        items: _itemVis
                    };
                }
                else {
                    return;//dun send again...
                }
            }
            if (!(msgBody.actions && msgBody.actions.length > 0)) {
                return;
            }
            let url = _trackerUrlBase;
            let data = JSON.stringify(msgBody,(key, value) => {
                // aiyo. the code also use the item array to put own stuff
                // trackers object.
                // then send also to the backend.
                // then got thrown out by Panji's check!!
                // I put in this patch first. Later ask fery to fix it properly.
                if (key === "trackers") {
                    return undefined;
                }
                return value;
            });
            let slackUrl = null;
            let slackData = null;
            if (_slackPath) {
                slackUrl = `https://hooks.slack.com/services/${_slackPath}?text=recwidget`;
                slackData = {
                    text: `x`,
                    blocks: [ 
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": `v1.5 xxxxxxxxxxxxxxxxxxx_ ${(new Date()).toLocaleTimeString()}. sendContext=` + (context ? context : "") + "_recoID=" + _recoID
                            }
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": JSON.stringify(msgBody)
                            }
                        }
                    ]
                };
                slackData = JSON.stringify(slackData); //after stringify then we can clear the stuff.
            }
        
            if (type == sendTypeLoad_) {
                _typeLoadActions.length = 0;
            }
            else if (type == sendTypeGeneral_) {
                _typeLoadActions.length = 0;
                _actions.length = 0;
            }
            {
                if (window &&
                    window.navigator &&
                    typeof window.navigator.sendBeacon === "function" &&
                    typeof window.Blob === "function") {
                    try {
                        if (window.navigator.sendBeacon(url, data)) {
                            // sendBeacon was successful!
                            //return;
                        }
                        if (slackUrl) {
                            if (window.navigator.sendBeacon(slackUrl, slackData)) {
                                // sendBeacon was successful!
                                //return;
                            }
                        }
                    } catch (e) {
                        // fallback below
                    }
                } else {
                    fetch(url, {
                        method: 'POST',
                        body: data,
                        headers: {
                            'Content-Type': 'text/plain'
                        }
                    }).then((function() {}));

                    if (slackUrl) {
                        fetch(slackUrl, {
                            method: 'POST',
                            body: slackData,
                            headers: {
                                'Content-Type': 'text/plain'
                            }
                        }).then((function() {}));
                    }
                }
            }
        }
        function _doPgExitHooks() {
            
            if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
            document.addEventListener('visibilitychange', function logData() {
               
                if (document.visibilityState === 'hidden') {
                    //for my mobile safari when the fella opens a new tab, then 
                    //I get this
                    //But on Safari mobile I do not get a pagehide.
                    //
                    _sendWhatWeHave(sendTypeGeneral_,'hidden');
                }
            });
            }
            window.addEventListener("freeze", event => {
                _sendWhatWeHave(sendTypeGeneral_,'freeze');
            }, false);
            window.addEventListener("beforeunload", event => {
                _sendWhatWeHave(sendTypeGeneral_,'beforeunload');
            }, false);
            window.addEventListener("unload", event => {
                _sendWhatWeHave(sendTypeGeneral_,'unload');
            }, false);
            window.addEventListener("pagehide", event => {
                /* the page isn't being discarded, so it can be reused later */
                _sendWhatWeHave(sendTypeGeneral_,'pagehide');
            }, false);
        }

        function generateRecoID(placeholder) {
            return placeholder
              ? (placeholder ^ (_getRandomData() >> (placeholder / 4))).toString(
                  16
                )
              : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(
                  /[018]/g,
                  generateRecoID
                );
          }

        /**
         * Returns random data using the Crypto API if available and Math.random if not
         * Method is from https://gist.github.com/jed/982883 like generateUUID, direct link https://gist.github.com/jed/982883#gistcomment-45104
         */
        function _getRandomData() {
          if (window && window.crypto && window.crypto.getRandomValues) {
            return crypto.getRandomValues(new Uint8Array(1))[0] % 16;
          } else {
            return Math.random() * 16;
          }
        }

        function _resetTimer() {
            clearTimeout(_idleTimer);
            _idleTimerHandler();
        }

        function _idleTimerHandler() {
            _idleTimer = setTimeout(function() {
                _sendWhatWeHave(sendTypeGeneral_,'1min');
            }, 60000); // 1 minute
        }

        function _setIdleTimer() {
            _idleTimerHandler();
            _documentEvents.forEach(function(event) {
                document.addEventListener(event, _resetTimer, true);
            })
        }

        // collect the basic info needed to build the trackers URL
        // this will collect the page information from the options passed by the publisher on their HTML file if any
        // else we will try to get it from our page info module
        // this will also get the ids information (client_id, session_id) using our ids module
        function _collectBasicInfo() {
            let options = _options;
            try {
                const pginfo = mpginfo.get();
                let newObj = {};
                let namedCookie = options.partner_cookie;
                let ids = {};
                try {
                    // for now, for AMP we put like this.
                    // we won't be able to get anything, but at least won't crash.
                    // this mids it access window local storage and will crash for AMP..
                    // 20220901 hot fix.
                    ids = mids.get(namedCookie);
                }
                catch(e) {
                }
                if (namedCookie && ids && ids[namedCookie]) {
                    newObj.partner_id = ids[namedCookie];
                }
                else if (options.partner_id) {
                    newObj.partner_id = options.partner_id;
                }
                newObj.type = "pages";
                if (options.title) newObj.title = options.title;
                else if (pginfo.pagetitle) newObj.title = pginfo.pagetitle;

                if (options.keywords) newObj.keywords = options.keywords;
                else if (pginfo.pagekeywords) newObj.keywords = pginfo.pagekeywords;

                if (options.pageurl) newObj.pageurl = options.pageurl;
                else if (pginfo.pageurl) newObj.pageurl = pginfo.pageurl;

                if (options.accountid) newObj.accountid = options.accountid;
                if (ids.sid) {
                    newObj.session_id = ids.sid;
                    delete ids.sid;
                }
                if (options.system) newObj.system = options.system;
                if (options.widget_id) newObj.widget_id = options.widget_id;
                if (options.customid) newObj.customid = options.customid;
                
                let merged = Object.assign({}, ids, newObj);
                return merged;
            } catch (error) {

                // so ?? still need to handle it properly moving forward ah?!
                // TODO
                console.log("#### Error: error while extracting the options object");
            }
        }

        // create the tracker URL to be called when firing the event
        // we can build our own if the publisher use their own recommendation API
        // by getting the page information and ids information
        // but we can easily take the info to build the tracker URL if the publisher use Jixie recommendation API
        function _makeTrackerBaseUrl(basicInfo) {
            let trackerParams;
            let trackerBaseUrl = "https://traid.jixie.io/sync/recommendation";
            
            // temporary:
            ///////trackerBaseUrl = "https://jx-id-trackers-deployslot.azurewebsites.net/sync/recommendation";
            
            {
                // no choice then we make our own:
                trackerParams = "s=" + basicInfo.system; //&v=mixed:0.9";
                ['accountid', 'widget_id', 'client_id', 'session_id', 'cohort', 'partner_id', 'customid'].forEach(function(prop) {
                    if (basicInfo[prop])
                        trackerParams += '&' + prop + '=' + basicInfo[prop];
                });
                if (basicInfo.pageurl) trackerParams += '&page=' + decodeURIComponent(basicInfo.pageurl);
                if (_recoID) trackerParams += '&reco_id=' + _recoID;
            }
            return trackerBaseUrl + '?' + trackerParams;
        }

        function impressionHandler() {
            if (!_eventsFired.impression) {
                _eventsFired.impression = 1;
                _actions.push({
                    action: 'impression',
                    elapsedms: Date.now() - _loadedTimeMs
                });
            }
        }

        // hook up the intersection observer to track the visibility of each items on the widget
        function _setVisibilityTrackingItems() {
            if (!_itemsObserver) {
                _itemsObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        const idx = _itemVis.findIndex((item) => parseInt(item.p) === parseInt(entry.target.dataset.index));
                        if (entry.intersectionRatio >= 0.5) {
                            if (idx === 0) {
                                if (!_eventsFired.creativeView) {
                                    _eventsFired.creativeView = 1;
                                    _actions.push({
                                        action: 'creativeView',
                                        elapsedms: Date.now() - _loadedTimeMs
                                    });
                                    _itemsObserver.unobserve(entry.target);
                                }
                                // if somehow this items observer get called after the wrapper observer, then we won't loss the impression
                                var int = setInterval(function() {
                                    if (_eventsFired.creativeView) {
                                        clearInterval(int);
                                        if (!_impInterval) {
                                            _impInterval = new ImpressionTimer(impressionHandler, 2000)
                                        }
                                    }
                                }, 100)
                            }
                        }
                        if (entry.intersectionRatio >= 1) {
                            if (idx > -1) {
                                _itemVis[idx].v = 1;
                                if (_itemVis[idx].t === 'ad') {
                                    _isCreativeVisible = 1;
                                    if (!_creativeEventFired.creativeView) {
                                        _fireCreativeEvent(_itemVis[idx].trackers, 'creativeView');
                                        _creativeEventFired.creativeView = 1;
                                    }

                                    if (!_creativeEventFired.impression) {
                                        var jxinter = setInterval(function() {
                                            if (_isCreativeVisible) {
                                                if (!_creativeEventFired.impression){
                                                    _fireCreativeEvent(_itemVis[idx].trackers, 'impression');
                                                    _creativeEventFired.impression = 1;

                                                    _itemsObserver.unobserve(entry.target);
                                                }
                                            }
                                            clearInterval(jxinter);
                                        }, 2000);
                                    }
                                } else {
                                    if (idx === _items2Observe.length - 1) {
                                        if (!_eventsFired.widgetview_100pct) {
                                            _eventsFired.widgetview_100pct = 1;
                                            //console.log('#### widgetview_100pct event')
                                            _actions.push({
                                                action: 'widgetview_100pct',
                                                elapsedms: Date.now() - _loadedTimeMs
                                            });
        
                                            // we need to wait for the impression to be in array of actions
                                            var interval = setInterval(function() {
                                                if (_eventsFired.impression && _isWidgetVisible) {
                                                    clearInterval(interval);
                                                    _sendWhatWeHave(sendTypeGeneral_,'fullyshown');
                                                }
                                            }, 100);
                                        }
                                    }
                                }
                                _itemsObserver.unobserve(entry.target);
                            }
                        } else {
                            if (_itemVis[idx].t === 'ad') {
                                _isCreativeVisible = 0;
                            }
                        }
                    });
                }, {
                    threshold: [0.5, 1]
                });
            }
            for (var i = 0; i < _items2Observe.length; i++) {
                _itemsObserver.observe(_items2Observe[i]);
            }
        }
        
        function _setUpItem(itemId, itemIdx, page_url, type, trackers, algo) {
            if (!_readyTimeMs) _readyTimeMs = Date.now();
            const elm = document.getElementById(itemId);
            if (_registeredDivs.findIndex((x) => x.divId === itemId) < 0) {
                _items2Observe.push(elm);
                //if (elm) _itemsObserver.observe(elm);
                _registeredDivs.push({
                    divId: itemId,
                    index: itemIdx,
                    url: page_url
                }); 
            }

            // if we didn't have the tracker items from the recommendation API respsonse
            // then we build our own using the information giving by the widget
            // this case is whereby the publisher have their own recommendation API
            if (true) { //!_itemVis.length) {
                const _itemVisObj = {
                    t: type ? type : "page",
                    p: itemIdx,
                    v: 0,
                    i: page_url + "", //force it to be a string. (coz can be a creativeid which is numeric)
                    s: "" + parseInt(elm.offsetWidth) + "x" + parseInt(elm.offsetHeight)
                }
                if (algo) _itemVisObj.a = algo;
                if (trackers) _itemVisObj.trackers = trackers;
                _itemVis.push(_itemVisObj);
            } else {
                // but if the publisher using Jixie recommendation API
                // then we can get it from the API response sent to us
                // and we just add one new property to store the size information
                const idx = _itemVis.findIndex((item) => parseInt(item.p) === parseInt(itemIdx));
                if (idx > -1) {
                    _itemVis[idx].s = "" + parseInt(elm.offsetWidth) + "x" + parseInt(elm.offsetHeight);
                }
            }
            //_registerWidget();
        }

        function _fireCreativeEvent(trackers, action = null) {
            if (!action) {
                return;
            }

            let url = trackers.baseurl + '?' + trackers.parameters + '&action='+action;
            fetch(url, {
                method: 'get',
                credentials: 'include' 
            })
            .catch((ee) => {
            });
            
        }

        //FactoryJxRecHelper.prototype.items = function(itemId, itemIdx, page_url) {
          //  _setUpItems(itemId, itemIdx, page_url);
        //}

        FactoryJxRecHelper.prototype.items = function(arrOfItems) {
            //console.log(`### items being called`);
            for (var i = 0; i < arrOfItems.length; i++) {
                let oneRec = arrOfItems[i];
                _setUpItem(oneRec.divid, oneRec.pos, oneRec.id, oneRec.type, oneRec.trackers, oneRec.algo);
                if (oneRec.img) {
                    _imagePromises.push(_imageLoadedPromise(oneRec.img));
                }
            }
            
        }

        // hook up the intersection observer to track the visibility of the widget
        function _registerWidget() {
            if (!_wrapperObserver) {
                const elHeight = _widgetDiv.getBoundingClientRect().height;

                var th = _defaultThreshold;
                let thresholds = [];
                let numSteps = 20;

                thresholds.push(0);

                for (let i=1.0; i<=numSteps; i++) {
                    let ratio = i/numSteps;
                    if (elHeight > (window.innerHeight)) {
                        ratio = ((window.innerHeight * ratio) / elHeight);
                        th = ((window.innerHeight * _defaultThreshold) / elHeight);
                    }
                    thresholds.push(ratio);
                }                  
                

                // The widget is too tall to ever hit the threshold - change threshold. this one is to achieve the 2nd condition
                // if (elHeight > (window.innerHeight)) {
                //     th = ((window.innerHeight * _defaultThreshold) / elHeight);
                // }
                _wrapperObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.intersectionRatio > 0) {
                            _isWidgetVisible = 1;
                            if (_eventsFired.creativeView) {
                                if (!_impInterval) {
                                    _impInterval = new ImpressionTimer(impressionHandler, 2000)
                                } else {
                                    _impInterval.resume();
                                }
                            }
                        } else if (entry.intersectionRatio <= 0) {
                            if (_impInterval) _impInterval.pause();
                            _isWidgetVisible = 0;
                        }
                        if (entry.intersectionRatio >= th) {
                            if (!_eventsFired.widgetview_50pct) {
                                _eventsFired.widgetview_50pct = 1;
                                //console.log('#### widgetview_50pct event')
                                _actions.push({
                                    action: 'widgetview_50pct',
                                    elapsedms: Date.now() - _loadedTimeMs
                                });
                            }
                        }
                    });
                }, {
                    threshold: thresholds
                });
                _wrapperObserver.observe(_widgetDiv);
            }
        }

        // fire the click event when users click on the item of the widget
        // we would need to determine which item being clicked by the users
        // and map it as an object to be sent to the trackers URL
        FactoryJxRecHelper.prototype.clicked = function(itemIdx) {
            const idx = _itemVis.findIndex((item) => parseInt(item.p) === parseInt(itemIdx))
            if (idx > -1)  {
                var msgBody = {
                    actions: [{
                        action: 'click',
                        elapsedms: Date.now() - _loadedTimeMs
                    }],
                    items: [_itemVis[idx]]
                };
                _sendWhatWeHave(sendTypeClick_, null, msgBody);//null: is the context info
    
                if (_itemVis[idx].t === 'ad') {
                    _fireCreativeEvent(_itemVis[idx].trackers, 'click');
                }
            }
        }
        FactoryJxRecHelper.prototype.error = function(code = 0) {
            _typeLoadActions.push({
                action: 'error',
                elapsedms: Date.now() - _loadedTimeMs,
                code: code
            })
            _sendWhatWeHave(sendTypeLoad_);
        }
        FactoryJxRecHelper.prototype.ready = function(version, reco_id = null) {
            if (version) {
                _recVersion = version;
            }
            _recoID = reco_id ? reco_id : generateRecoID();
            if (_imagePromises.length > 0) {
                Promise.all(_imagePromises).then(function() {
                    if (!_readyBlkRun) {
                        _readyBlkRun = true;
                        _ready();
                        //console.log(`### calling _registerWidget`);
                        _registerWidget();
                    }
                }).catch(function(error) {
                    console.log(`Unable to register the widget ${error.stack} ${error.message}`);
                });
            } else {
                _readyBlkRun = true;
                _ready();
            
                //console.log(`### calling _registerWidget`);
                _registerWidget();
            }
        }
        FactoryJxRecHelper.prototype.jxUrlCleaner = function(url) {
            if (url && typeof url == 'string') {
                let tmp = url.replace(/^https?:\/\//, '');
                tmp = tmp.split(/[?#]/)[0];
                return tmp;
            }
            return "";
        }
        FactoryJxRecHelper.prototype.getJxUserInfo = function() {
            return _basicInfo;
        }

        function _imageLoadedPromise (imageUrl){
            let timer = null;
            const imgPromise = new Promise((resolve) => {
                var newImg = new Image();
                newImg.onload = function() {
                    //console.log('### image loaded ', imageUrl)
                    resolve();
                }
                newImg.onerror = function() {
                    resolve();
                }
                newImg.src = imageUrl;
            });
            return Promise.race([
                new Promise((resolve) => {
                    timer = setTimeout(() => {
                        //console.log('### timeout reached');
                        resolve();
                    }, _imgLoadTimeout);
                    return timer;
                }),
                imgPromise.then((value) => {
                    clearTimeout(timer);
                    return value;
                })
            ]);
        }

        function _loaded(ts = null) {
            _loadedTimeMs = ts ? ts:  Date.now();
            if (_options.container) {
                _widgetDiv = document.getElementById(_options.container);
            }
            if (!_basicInfo)
                _basicInfo = _collectBasicInfo();
            if (!_eventsFired.load) {
                _eventsFired.load = 1;
                console.log('#### load event')
                // fire the load event as soon as we have it
                _typeLoadActions.push({
                    action: "load",
                    y: Math.round(_widgetDiv.getBoundingClientRect().top),
                });
            }
            _doPgExitHooks();
            // _startResizeObserver();
        }

        function _ready() {
            
            _trackerUrlBase = _makeTrackerBaseUrl(_basicInfo);

            //_readyTimeMs = tsRecResp ? tsRecResp: Date.now();
            _readyTimeMs = Date.now();
            // fire the event.
            // collect the tracker items from the recommendation API
            // this is the case whereby the publisher use Jixie recommendation API
            if (!_eventsFired.ready) {
                _eventsFired.ready = 1;
                // fire the ready event as soon as we have it
                _typeLoadActions.push({
                    action: "ready",
                    elapsedms: Date.now() - _loadedTimeMs,
                });
                _sendWhatWeHave(sendTypeLoad_);
            }
            //////if (trackersBlock && trackersBlock.items && trackersBlock.items.length > 0) {
                /////_itemVis = trackersBlock.items;
            /////}
            _setVisibilityTrackingItems();
            _setIdleTimer(); // setting up the idle timer
        }

        function FactoryJxRecHelper(type, options) {
            _options = JSON.parse(JSON.stringify(options));
            if (type == 'simple') {
                _loaded();
                //later the caller will fire a ready
            }
            //////else if (type == 'adv') {
                // I guess we will get rid of this lah
                ///////_loaded(tsRecReq);
                //////_ready(trackersBlock, tsRecResp);
            //////}
        }
        let ret = new FactoryJxRecHelper(type, options);
        return ret;
    }
    let MakeOneSimple = function(options) {
        return MakeOneJxRecHelper('simple', options);
    }
    window.jxRecMgr = {
        createJxRecHelper: MakeOneSimple
    }
})();
