const mids = require('../components/basic/idslite');
const mpginfo = require('../components/basic/pginfo');

(function() {
    if (window.abcdefgh) return;
    window.abcdefgh = 1;

    const sendTypeClick_ = 1;
    const sendTypeLoad_ = 2;
    const sendTypeGeneral_ = 3;

    let MakeOneJxRecHelper = function(type, options, trackersBlock = null, tsRecReq = null, tsRecRes = null) {
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
        var _behavioursFired = 0; //current policy is we only fire the behaviours stuff ONCE!
                                  //so even with new info coming, we will not fire another batch

        var _creativeEventFired = {
            impression: 0,
            creativeView: 0,
        }

        var _recoID = generateRecoID();

        var _documentEvents = ['scroll', 'mousedown', 'mousemove', 'touchstart', 'touchmove', 'keydown', 'click'];
        var _idleTimer;

        // 
        function _sendWhatWeHave(type = sendTypeGeneral_, msgBody0 = null) {
            if (!_trackerUrlBase) {
                _trackerUrlBase = _makeTrackerBaseUrl(_basicInfo, null);
            }
            _trackerUrlBase += (_recVersion ? '&v=' + _recVersion: '');
            _recVersion = null; //else we keep on adding.
            var msgBody = null;
            if (type == sendTypeClick_ && msgBody0) {
                msgBody = msgBody0;
            }
            else if (type == sendTypeLoad_) {
                msgBody = {
                    actions: _typeLoadActions
                };
            }
            else { //general
                if (!_behavioursFired) {
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

            if (msgBody.actions && msgBody.actions.length > 0) {
                console.log(`#### sendBeacon ${JSON.stringify(msgBody.actions, null, 2)}`);
                console.log(`#### sendBeacon(items) ${JSON.stringify(msgBody.items, null, 2)}`);
                if (window &&
                    window.navigator &&
                    typeof window.navigator.sendBeacon === "function" &&
                    typeof window.Blob === "function") {
                    try {
                        if (window.navigator.sendBeacon(_trackerUrlBase, JSON.stringify(msgBody))) {
                            // sendBeacon was successful!
                            if (type == sendTypeLoad_) {
                                _typeLoadActions.length = 0;
                            }
                            else if (type == sendTypeGeneral_) {
                                _typeLoadActions.length = 0;
                                _actions.length = 0;
                            }

                            // only clear the actions array when we call this _sendWhatWeHave function from the hooks (i.e _doPgExitHooks and __idleTimerHandler)
                            //if (!_msgBody) _actions = [];
                            return;
                        }
                    } catch (e) {
                        // fallback below
                    }
                } else {
                    fetch(_trackerUrlBase, {
                        method: 'POST',
                        body: JSON.stringify(msgBody),
                        headers: {
                            'Content-Type': 'text/plain'
                        }
                    }).then((function() {
                        if (type == sendTypeLoad_) {
                            _typeLoadActions.length = 0;
                        }
                        if (type == sendTypeGeneral_) {
                            _typeLoadActions.length = 0;
                            _actions.length = 0;
                        }
                    }));
                }
            }
        }
        function _doPgExitHooks() {
            document.addEventListener('visibilitychange', function logData() {
                if (document.visibilityState === 'hidden') {
                    _sendWhatWeHave();
                }
            });
            window.addEventListener("pagehide", event => {
                /* the page isn't being discarded, so it can be reused later */
                _sendWhatWeHave();
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
                _sendWhatWeHave();
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
                const ids = mids.get(namedCookie);
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
        function _makeTrackerBaseUrl(basicInfo, trackersBlock) {
            let trackerBaseUrl;
            let trackerParams;
            if (trackersBlock && trackersBlock.baseURL) {
                trackerBaseUrl = trackersBlock.baseURL;
            }
            else {
                trackerBaseUrl = "https://traid.jixie.io/sync/recommendation";
            }
            // temporary:
            ///////trackerBaseUrl = "https://jx-id-trackers-deployslot.azurewebsites.net/sync/recommendation";
            
            if (trackersBlock && trackersBlock.sharedParams) {
                trackerParams = trackersBlock.sharedParams;
            }
            else {
                // no choice then we make our own:
                trackerParams = "s=" + basicInfo.system; //&v=mixed:0.9";
                ['accountid', 'widget_id', 'client_id', 'session_id', 'cohort', 'partner_id'].forEach(function(prop) {
                    if (basicInfo[prop])
                        trackerParams += '&' + prop + '=' + basicInfo[prop];
                });
                if (basicInfo.pageurl) trackerParams += '&page=' + decodeURIComponent(basicInfo.pageurl);
                if (_recoID) trackerParams += '&reco_id=' + _recoID;
            }
            return trackerBaseUrl + '?' + trackerParams;
        }

        // hook up the intersection observer to track the visibility of each items on the widget
        function _setVisibilityTrackingItems() {
            if (!_itemsObserver) {
                _itemsObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        const idx = _itemVis.findIndex((item) => parseInt(item.p) === parseInt(entry.target.dataset.index));
                        if (entry.intersectionRatio >= 1) {
                            if (idx > -1) {
                                _itemVis[idx].v = 1;
                                if (_itemVis[idx].t === 'ad') {
                                    _isCreativeVisible = 1;
                                    if (!_creativeEventFired.creativeView) {
                                        _fireCreativeEvent(_itemVis[idx].trackers, 'creativeview');
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
                                    _itemsObserver.unobserve(entry.target);
                                }
                            }
                            if (idx === _items2Observe.length - 1) {
                                if (!_eventsFired.widgetview_100pct) {
                                    _eventsFired.widgetview_100pct = 1;
                                    console.log('#### widgetview_100pct event')
                                    _actions.push({
                                        action: 'widgetview_100pct',
                                        elapsedms: Date.now() - _loadedTimeMs
                                    });
                                    _sendWhatWeHave();
                                }
                            }
                        } else {
                            if (_itemVis[idx].t === 'ad') {
                                _isCreativeVisible = 0;
                            }
                        }
                    });
                }, {
                    threshold: 1
                });
            }
            for (var i = 0; i < _items2Observe.length; i++) {
                _itemsObserver.observe(_items2Observe[i]);
            }
        }
        
        function _setUpItem(itemId, itemIdx, page_url, type, trackers) {
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
                    i: page_url,
                    s: "" + parseInt(elm.offsetWidth) + "x" + parseInt(elm.offsetHeight)
                }
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
            console.log(`### items being called`);
            for (var i = 0; i < arrOfItems.length; i++) {
                let oneRec = arrOfItems[i];
                _setUpItem(oneRec.divid, oneRec.pos, oneRec.id, oneRec.type, oneRec.trackers);
            }
            
        }

        // hook up the intersection observer to track the visibility of the widget
        function _registerWidget() {
            if (!_wrapperObserver) {
                const elHeight = _widgetDiv.getBoundingClientRect().height;
                var th = _defaultThreshold;

                // The widget is too tall to ever hit the threshold - change threshold. this one is to achieve the 2nd condition
                if (elHeight > (window.innerHeight)) {
                    th = ((window.innerHeight * _defaultThreshold) / elHeight);
                }
                _wrapperObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.intersectionRatio >= th) {
                            _isWidgetVisible = 1;
                            if (!_eventsFired.creativeView) {
                                _eventsFired.creativeView = 1;
                                console.log('#### creativeview event')
                                _actions.push({
                                    action: 'creativeview',
                                    elapsedms: Date.now() - _loadedTimeMs
                                });
                            }
                            if (!_eventsFired.widgetview_50pct) {
                                _eventsFired.widgetview_50pct = 1;
                                console.log('#### widgetview_50pct event')
                                _actions.push({
                                    action: 'widgetview_50pct',
                                    elapsedms: Date.now() - _loadedTimeMs
                                });
                            }
                            if (!_eventsFired.impression) {
                                var interval = setInterval(function() {
                                    if (_isWidgetVisible) {
                                        if (!_eventsFired.impression) {
                                            _eventsFired.impression = 1;
                                            console.log('#### impression event')
                                            _actions.push({
                                                action: 'impression',
                                                elapsedms: Date.now() - _loadedTimeMs
                                            });
                                            // _sendWhatWeHave();
                                        }
                                    }
                                    clearInterval(interval);
                                }, 2000);
                            }
                        } else {
                            _isWidgetVisible = 0;
                        }
                    });
                }, {
                    threshold: th
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
                _sendWhatWeHave(sendTypeClick_, msgBody);
    
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
        FactoryJxRecHelper.prototype.ready = function(version = null, trackersBlock = null, tsRecResp = null) {
            if (version) {
                _recVersion = version;
            }
            _ready(trackersBlock, tsRecResp);
        
            console.log(`### calling _registerWidget`);
            _registerWidget();
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
        }

        function _ready(trackersBlock, tsRecResp) {
            
            _trackerUrlBase = _makeTrackerBaseUrl(_basicInfo, trackersBlock);

            _readyTimeMs = tsRecResp ? tsRecResp: Date.now();
            // fire the event.
            // collect the tracker items from the recommendation API
            // this is the case whereby the publisher use Jixie recommendation API
            if (!_eventsFired.ready) {
                _eventsFired.ready = 1;
                console.log('#### ready event')
                // fire the ready event as soon as we have it
                _typeLoadActions.push({
                    action: "ready",
                    elapsedms: Date.now() - _loadedTimeMs,
                });
                _sendWhatWeHave(sendTypeLoad_);
            }
            if (trackersBlock && trackersBlock.items && trackersBlock.items.length > 0) {
                _itemVis = trackersBlock.items;
            }
            _setVisibilityTrackingItems();
            _setIdleTimer(); // setting up the idle timer
        }

        function FactoryJxRecHelper(type, options, trackersBlock, tsRecReq, tsRecResp) {
            _options = JSON.parse(JSON.stringify(options));
            if (type == 'simple') {
                _loaded();
                //later the caller will fire a ready
            }
            else if (type == 'adv') {
                _loaded(tsRecReq);
                _ready(trackersBlock, tsRecResp);
            }
        }
        let ret = new FactoryJxRecHelper(type, options, trackersBlock, tsRecReq, tsRecRes);
        return ret;
    }
    let MakeOneSimple = function(options) {
        return MakeOneJxRecHelper('simple', options);
    }
    let MakeOneAdv = function(options, trackersBlock = null, tsRecReq = null, tsRecRes = null) {
        return MakeOneJxRecHelper('adv', options, trackersBlock, tsRecReq, tsRecRes);
    }

    window.jxRecMgr = {
        createJxRecHelper: MakeOneSimple,
        createJxRecHelperCon: MakeOneAdv
    }
})();
