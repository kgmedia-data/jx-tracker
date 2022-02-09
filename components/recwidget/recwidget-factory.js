const mids = require('../basic/idslite');

const rand = Math.floor(Math.random() * 1000);
const recColCls = "jxRecCol";
const recWrapperCls = "jxRecWrapper";

/* if use Vincent recommendation API then the trackerBlock is already well prepared
and looks like this:
if not from vincent recommendation API, then prepare a trackerBlock like this before
we try to create the event helper object
"trackers":{
      "baseURL":"https://traid.jixie.io/sync/recommendation",
      "sharedParams":"accountid=9262bf2590d558736cac4fff7978fcb1&s=jx&v=mixed:0.9&page=http%3A%2F%2Fmegapolitan.kompas.com%2Fread%2F2022%2F01%2F21%2F09125931%2Fupdate-20-januari-bertambah-97-kasus-positif-covid-19-pasien-dalam&widget_id=abcdef",
      "items":[
         {
            "t":"page",
            "p":0,
            "v":0,
            "i":"https://money.kompas.com/read/2022/02/08/162337626/ironi-kereta-cepat-jakarta-bandung-yang-tak-sampai-bandung"
         },
         .......
         {
            "t":"page",
            "p":5,
            "v":0,
            "i":"https://megapolitan.kompas.com/read/2022/02/09/06363061/trik-supermarket-nakal-raup-untung-dari-kelangkaan-minyak-goreng-bikin"
         }
      ]

*/
/**
 * internal use only:
 * @param {*} numItems 
 * @param {*} trackerUrlBase 
 * @param {*} loadedTS
 * @returns 
 */
 let MakeOneEvtHelper = function(numItems, trackerBlock, loadedTS) {
    // private variables:
    var _actions = [];
    var _itemVis = null;
    var _trackerUrlBase = null;
    
    function _sendWhatWeHave() {
        //prepare the object to send.
        //URL is the trackerUrlbase
        var msgBody = {
            actions: _actions,
            items: _itemVis 
        };
        //**stringify** this body and then send. by sendBeacon (see notes.txt for snipplet)
    }
    function _doPgExitHooks() {

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
    function FactoryEvtHelper(numItems, trackerBlock) {
        //NOTE: to record the loaded event also.
        for (let i = 0; i < n; ++i) a[i] = 0;
        _trackerUrlBase = trackerBlock.sharedParams + '&' + trackerBlock.sharedParams;
        _itemVis = JSON.parse.JSON.stringify(trackerblock.items);
        _doPgExitHooks();
    }
    FactoryEvtHelper.prototype.recordEvent = function(action, itemIdx = -1) {
        // TODO
        /* stash a record to your events array (CHECK THE SPECS and my notes)
        {   
            "action":"load",
            "y":3000 // the pixels from the top of the page, optional
        }
        */
    };
    FactoryEvtHelper.prototype.recordItemVis = function(itemIdx) {
        // TODO
        // find the right item in the _itemVis and set the v from 0 to 1 then.
        //_itemVis
    };
    //TODO: set up something to monitor the page being covered or killed.

    let ret = new FactoryEvtHelper(numItems, trackerBlock, loadedTS);
    return ret;
}

/** General helper function 
     * collect first party cookie info
     * and other info and pack it into an object with possibly these 
     * properties:
     * {
     *  client_id: ....
     *  sid: ...
     *  cohort: ...
     *  accountid: ...
     *  widget: ....
     *  pageurl: ....
     *  keywords: ...
     * }
     * returns an object.
     */
 function collectBasicInfo() {
    // TODO
}

/**
 * General helper function 
 * @param {*} basicInfo (an obj containing client_id, sid, cohort, accountid, widget, pageurl
 * whenever possible)
 * This function constructs the url to call the recommendation endpoint
 * and waits for the results.
 * returns a promise which should resolves to an array of objects
 */
function fetchRecommendationsP(basicInfo) {
    //FOR NOW PLEASE just call this hardcoded first!!!!!
    const dummyURL = "https://jixie-recommendation-api.azurewebsites.net/v1/recommendation?type=pages&widget_id=abcdef&accountid=28d808daafa0cf6acb0c57fde0e37b12&pageurl=https://www.bolasport.com/read/313130745/persib-kalah-dari-bhayangkara-fc-bukan-karena-ketiadaan-robert-rene-alberts";
    // TODO
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", dummyURL);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.response));
            } else {
                reject(xhr.statusText);
            }
        }
        xhr.onerror = function() {
            reject(xhr.statusText);
        }
        xhr.send();
    });
}

/**
 * General helper function 
 * @param {*} fileUrl string
 * returns a promise which should resolves to true if all goes well
 */
 function fetchCSSFileP(fileUrl) {
    return new Promise((resolve, reject) => {
        let link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.onload = function() { resolve(true); console.log('style has loaded'); };
        link.href = fileUrl;
        let headScript = document.querySelector('script');
        headScript.parentNode.insertBefore(link, headScript);
    });
}

/** General helper function 
 * A simple function, possibly do nothing. Convert the output from the whatever
 * rec endpoint into what our rendering code can use.
 * Sometimes is just change some property names as needed.
 * @param {*} resultObj that contains an array of results under "items" property:
 * 
 *     {
   "items":[
      {
         "partner_id":"28dac37dd94c1ea554961901c52ea884",
         "url":"https://megapolitan.kompas.com/read/2022/02/07/16232351/ppkm-jakarta-kembali-ke-level-3-anies-kita-akan-laksanakan",
         "img":"https://asset.kompas.com/crops/leH91rxT9LlzliWc-4b5aqHrfWQ=/235x13:1342x751/780x390/filters:watermark(data/photo/2020/03/10/5e6775ae18c31.png,0,-0,1)/data/photo/2021/12/14/61b80f28dea6b.jpg",
         "title":"PPKM Jakarta Kembali ke Level 3, Anies: Kita Akan Laksanakan"
      },
      ...
   ],
   
}
*/
function jixieRecAdaptor(resultObj) {
    // jixie adaptor has nothing much to do.
}

/**
     *  if resultObj contains trackerUrlBase property, we use that
     *  else we cook up the tracker base url from the basic info then.
     * @param {*} basicInfo 
     * @param {*} resultObj 
     * return string which is the tracker url base (means no "action" yet)
     */
 function makeTrackerBaseUrl(basicInfo, resultObj) {
    // if resultObj contains trackerUrlBase property, we use that
    // else we cook up the tracker base url from the basic info then.
}

let MakeOneRecWidget_ = function(options) {
    /*
    options: has accountid, widgetid
    possibly: pageurl, title, keywords
    and possible cssfile : url of a css file

    classes: {
        // css classes you (FERY CODE) should put onto your html elements
        title: [],
        thumbnail: [], //so the size is determined by them
        ...
    }
    numcols: 2

    */
    // client_id, session_id, cohort, accountid, widget
    // pageurl
    var _basicInfo = {};
    var _evtHelper = null;

    var _cssFileURL = null;
    var _cssClasses = null;
    var _responseMapping = {
        response: "items",
        image: "img",
        page_url: "url",
        title: "title",
        category: "category"
    };
    var _numOfCols = 0;

    var _container = null;
    var _widgetWrapper = null;
    var _clickUrlArr = [];

    var _wrapperObserver = null;
    var _itemsObserver = null;
    var _defaultThreshold = 0.5;

    function appendDefaultCSS() {
        var colWidth = 100; // default width and flex of each items
        if (_numOfCols) colWidth = 100 / _numOfCols;
    
        const stylesArr = [
            "."+recWrapperCls+""+rand+"{display:flex;flex-wrap:wrap;}",
            "."+recColCls+""+rand+"{position:relative;box-sizing:border-box;width:100%;flex:0 0 "+colWidth+"%;max-width:"+colWidth+"%;}",
        ].join("\n");
    
        var head = document.getElementsByTagName('HEAD')[0];
        var s = document.createElement("style");
        s.innerHTML = stylesArr;
        head.appendChild(s);
    }

    function createElement(tag, id, defaultClass, customClasses, iHTML) {
        var elm = document.createElement(tag);
        if (id) elm.id = id;
        if (defaultClass) elm.className = defaultClass;
        if (customClasses && customClasses.length > 0) {
            customClasses.forEach(function(cls) {
                elm.classList.add(cls);
            });
        }
        if (iHTML) elm.innerHTML = iHTML;
        return elm;
    }

    /**
     * The bulk of the work is here then.
     * it will also call on the event helper
     * @param {*} resultObj 
     */
    function createDisplay(resultObj) {
        // This is the most complicated part then.
        // FERY:
        // not just the displaying but also all the events
        // capturing and triggering.
        // and the isolation of concerns.
        // more complicated visibility stuff.
        // you will need to hook up calls to _evtHelper.
        _widgetWrapper = document.createElement('div');
        _widgetWrapper.className = `${recWrapperCls}${rand}`;
        if (_cssClasses.container && _cssClasses.container) _widgetWrapper.classList.add(_cssClasses.container);
        _container.appendChild(_widgetWrapper);

        var recList = '';
        var items = resultObj[_responseMapping.response];
        if (items.length > 0) {
            items.map(function(item, index) {
                _clickUrlArr.push({id: `recItem-${rand}-${index}`, url: item[_responseMapping.page_url]});

                var recItem = createElement('div', `recItem-${rand}-${index}`, `${recColCls}${rand}`, _cssClasses.wrapper);
                recItem.dataset.index = index;

                var imgWrapper = createElement('div', null, null, _cssClasses.thumbnail_wrapper);
                var imgElm = createElement('img', null, null, _cssClasses.thumbnail);
                imgElm.src = item[_responseMapping.image];
                imgWrapper.appendChild(imgElm);

                var categoryDiv = createElement('div', null, null, _cssClasses.category, item[_responseMapping.category]);
                var titleDiv = createElement('div', null, null, _cssClasses.title, item[_responseMapping.title]);

                recItem.appendChild(imgWrapper);
                recItem.appendChild(categoryDiv);
                recItem.appendChild(titleDiv);

                _widgetWrapper.appendChild(recItem);
            });

            if (_clickUrlArr.length > 0) {
                _clickUrlArr.map(function(item) {
                    document.getElementById(item.id).onclick = function() {
                        window.open(item.url, '_blank');
                        return false;
                    }
                });
            }

            // listen to the visibility changes of all items on the widget
            _itemsObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.intersectionRatio >= _defaultThreshold) {
                        console.log('the item with id= '+entry.target.id+' and index= '+entry.target.dataset.index+' is now visible');
                        // _evtHelper.recordItemVis(entry.target.dataset.index);
                        _itemsObserver.unobserve(entry.target);
                    }
                });
            }, {threshold: _defaultThreshold});

            document.querySelectorAll(`.${recColCls}${rand}`).forEach(function(el) {
                if (el) _itemsObserver.observe(el);
            });

            // check the visibility of the widget on viewport. we would need to check with this two conditions:
            // 1. 50% of widget is in viewport OR
            // 2. widget covered 50% of viewport (LONG WIDGET)
            const elHeight = _widgetWrapper.getBoundingClientRect().height;
            var th = _defaultThreshold;

            console.log('height of widget is', elHeight)
            console.log('height of window is', window.innerHeight)
            console.log('height of window * threshold is', window.innerHeight * _defaultThreshold)
            // The widget is too tall to ever hit the threshold - change threshold. this one is to achieve the 2nd condition
            if (elHeight > (window.innerHeight)) {
                th = ((window.innerHeight * _defaultThreshold) / elHeight);
                console.log('the threshold now is ', th);
            }
            _wrapperObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.intersectionRatio >= th) {
                        console.log('widget is now visible on viewport');
                        // _evtHelper.recordEvent('creativeView');
                    }
                });
            }, {threshold: th});
            _wrapperObserver.observe(_widgetWrapper);
        } else {
            console.error("Error: no recommendation items");
            // _evtHelper.recordEvent('error');
            return;
        }
    }

    function FactoryOneRWidget(options) {
        // prepare the options.
        // mix with the defaults
        if (options.container) {
            _container = document.getElementById(options.container);
            _cssFileURL = options.gui.cssfile;
            _cssClasses = options.gui.classes;
            _numOfCols = parseInt(options.gui.numcols);
    
            appendDefaultCSS();

            _basicInfo = collectBasicInfo();
    
            // load the CSS file and fetch the recommendation need both done.
            let promMain = fetchRecommendationsP(_basicInfo);
            // from the options or internal default we know what is the
            // css file to load
            let promCSS = fetchCSSFileP(_cssFileURL);
    
            Promise.all([promMain, promCSS])
            .then(function(values) {
                // when both css file is fetched and the rec
                // results came back, then we can use it.
                let resultObj = values[0]; // from first promise
                // let tUrl = makeTrackerBaseUrl(_basicInfo, resultObj);
                // _evtHelper = MakeOneEvtHelper(numItems, tUrl);

                // createDisplay(resultObj, _evtHelper);
                createDisplay(resultObj, null);
            })
            .catch(function(error) {
                console.log(error);
            });
        } else {
            console.error("Error: container not found in options object");
            // _evtHelper.recordEvent('error');
            return;
        }
    }
    let ret = new FactoryOneRWidget(options);
    return ret;
  }
  module.exports = MakeOneRecWidget_;

  

