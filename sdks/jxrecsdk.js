const mids = require('../components/basic/idslite');
const mpginfo = require('../components/basic/pginfo');

(function() {
    if (window.abcdefgh) return;
    window.abcdefgh = 1;

    let MakeOneJxRecHelper = function(type, options, trackersBlock = null, tsRecReq = null, tsRecRes = null) {
        var _actions = [];
        var _itemVis = [];
        var _options = null;
        var _trackerUrlBase = null;
        var _basicInfo = null;

        var _widgetDiv = null;

        var _loadedTimeMs = 0;
        var _readyTimeMs = 0;

        var _registeredDivs = [];
        var _wrapperObserver = null;
        var _itemsObserver = null;
        var _defaultThreshold = 0.5;

        var _eventsFired = {
            load: 0,
            ready: 0,
            impression: 0,
            creativeView: 0,
        }

        function _sendWhatWeHave(_msgBody = null) {
            if (!_trackerUrlBase) {
                _trackerUrlBase = _makeTrackerBaseUrl(_basicInfo, null);
            }
            var msgBody = {
                actions: _actions,
                items: _itemVis
            };
            if (_msgBody) {
                msgBody = _msgBody;
            }
            
            if (msgBody.actions && msgBody.actions.length > 0) {
                if (window &&
                    window.navigator &&
                    typeof window.navigator.sendBeacon === "function" &&
                    typeof window.Blob === "function") {
                    try {
                        if (window.navigator.sendBeacon(_trackerUrlBase, JSON.stringify(msgBody))) {
                            // sendBeacon was successful!
                            _actions = [];
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
                        _actions = [];
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

        // collect the basic info needed to build the trackers URL
        // this will collect the page information from the options passed by the publisher on their HTML file if any
        // else we will try to get it from our page info module
        // this will also get the ids information (client_id, session_id) using our ids module
        function _collectBasicInfo() {
            let options = _options;
            // TODO
            try {
                const ids = mids.get();
                const pginfo = mpginfo.get();
                let newObj = {};

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

                if (options.widgetid) newObj.widget_id = options.widgetid;
                else newObj.widget_id = "abcdef"; // hardcoded widget id

                let merged = Object.assign({}, ids, newObj);
                return merged;
            } catch (error) {
                console.log("Error: error while extracting the options object");
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
            trackerBaseUrl = "https://jx-id-trackers-deployslot.azurewebsites.net/sync/recommendation";
            
            if (trackersBlock && trackersBlock.sharedParams) {
                trackerParams = trackersBlock.sharedParams;
            }
            else {
                // no choice then we make our own:
                trackerParams = "s=jx&v=mixed:9.0";
                ['accountid', 'widget_id', 'client_id', 'session_id', 'cohort'].forEach(function(prop) {
                    if (basicInfo[prop])
                        trackerParams += '&' + prop + '=' + basicInfo[prop];
                });
                if (basicInfo.pageurl) trackerParams += '&page=' + decodeURIComponent(basicInfo.pageurl);
            }
            return trackerBaseUrl + '?' + trackerParams;
        }

        // hook up the intersection observer to track the visibility of each items on the widget
        function _setVisibilityTrackingItems() {
            if (!_itemsObserver) {
                _itemsObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.intersectionRatio >= _defaultThreshold) {
                            const idx = _itemVis.findIndex((item) => parseInt(item.p) === parseInt(entry.target.dataset.index));
                            if (idx > -1) {
                                _itemVis[idx].v = 1;
                                _itemsObserver.unobserve(entry.target);
                            }
                        }
                    });
                }, {
                    threshold: _defaultThreshold
                });
            }
        }

        FactoryJxRecHelper.prototype.item = function(itemId, itemIdx, page_url) {
            if (!_readyTimeMs) _readyTimeMs = Date.now();
            const elm = document.getElementById(itemId);
            if (_registeredDivs.findIndex((x) => x.divId === itemId) < 0) {
                if (elm) _itemsObserver.observe(elm);
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
                _itemVis.push({
                    t: "page",
                    p: itemIdx,
                    v: 0,
                    i: page_url,
                    s: "" + parseInt(elm.offsetWidth) + "x" + parseInt(elm.offsetHeight)
                });
            } else {
                // but if the publisher using Jixie recommendation API
                // then we can get it from the API response sent to us
                // and we just add one new property to store the size information
                const idx = _itemVis.findIndex((item) => parseInt(item.p) === parseInt(itemIdx));
                if (idx > -1) {
                    _itemVis[idx].s = "" + parseInt(elm.offsetWidth) + "x" + parseInt(elm.offsetHeight);
                }
            }
        }

        // hook up the intersection observer to track the visibility of the widget
        function _registerWidget(elm) {
            if (!_wrapperObserver) {
                _widgetDiv = elm;
                const elHeight = elm.getBoundingClientRect().height;
                var th = _defaultThreshold;

                // The widget is too tall to ever hit the threshold - change threshold. this one is to achieve the 2nd condition
                if (elHeight > (window.innerHeight)) {
                    th = ((window.innerHeight * _defaultThreshold) / elHeight);
                }
                _wrapperObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.intersectionRatio >= th) {
                            if (!_eventsFired.creativeView) {
                                _eventsFired.creativeView = 1;
                                console.log('creativeview event')
                                _actions.push({
                                    action: 'creativeview',
                                    elapsedms: Date.now() - _loadedTimeMs
                                });
                            }
                            if (!_eventsFired.impression) {
                                _eventsFired.impression = 1;
                                console.log('impression event')
                                setTimeout(function() {
                                    _actions.push({
                                        action: 'impression',
                                        elapsedms: Date.now() - _loadedTimeMs
                                    });
                                    _sendWhatWeHave();
                                }, 2000);
                            }
                        }
                    });
                }, {
                    threshold: th
                });
                _wrapperObserver.observe(elm);
            }
        }

        // fire the click event when users click on the item of the widget
        // we would need to determine which item being clicked by the users
        // and map it as an object to be sent to the trackers URL
        FactoryJxRecHelper.prototype.clicked = function(itemIdx) {
            var _msgBody = {
                actions: [{
                    action: 'click',
                    elapsedms: Date.now() - _loadedTimeMs
                }],
                items: [_itemVis.find((item) => parseInt(item.p) === parseInt(itemIdx))]
            };
            _sendWhatWeHave(_msgBody);
        }
        FactoryJxRecHelper.prototype.error = function() {
        }
        FactoryJxRecHelper.prototype.ready = function(trackersBlock = null, tsRecResp = null) {
            _ready(trackersBlock, tsRecResp);
        }
        FactoryJxRecHelper.prototype.getJxUserInfo = function() {
            return _basicInfo;
        }

        function _loaded(ts = null) {
            _loadedTimeMs = ts ? ts:  Date.now();
            if (options.container) {
                const containerElm = document.getElementById(options.container)
                if (containerElm) _registerWidget(containerElm);
            }
            if (!_basicInfo)
                _basicInfo = _collectBasicInfo();
            if (!_eventsFired.load) {
                _eventsFired.load = 1;
                console.log('load event')
                _actions.push({
                    action: "load",
                    y: Math.round(_widgetDiv.getBoundingClientRect().top)
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
                console.log('ready event')
                _actions.push({
                    action: "ready",
                    elapsedms: Date.now() - _loadedTimeMs
                });
            }
            if (trackersBlock && trackersBlock.items && trackersBlock.items.length > 0) {
                _itemVis = trackersBlock.items;
            }
            _setVisibilityTrackingItems();
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
