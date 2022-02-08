/**
 * internal use only:
 * @param {*} numItems 
 * @param {*} trackerUrlBase 
 * @returns 
 */
 let MakeOneEvtHelper = function(numItems, trackerUrlBase) {
    // private variables:
    var _events = [];
    var _itemVis = null;
    var _sent = false;
    var _trackerUrlBase = null;

    // it will hook up to some pagekill events 
    // this one is more complicated than normal
    // please do not implement this. Just focus
    // on the GUI first.
    // These things are to be done differently than before.
    
    function FactoryEvtHelper(numItems) {
        _itemVis = new Array(numItems);
        for (let i = 0; i < n; ++i) a[i] = 0;
        _trackerUrlBase = trackerUrlBase;
    }
    FactoryEvtHelper.prototype.recordEvent = function(action, itemIdx = -1) {
        // TODO
    };
    FactoryEvtHelper.prototype.recordItemVis = function(itemIdx) {
        // TODO
    };
    let ret = new FactoryEvtHelper(numItems);
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
    //https://jixie-recommendation-api.azurewebsites.net/v1/recommendation?type=pages&widget_id=abcdef&accountid=28d808daafa0cf6acb0c57fde0e37b12&pageurl=https://www.bolasport.com/read/313130745/persib-kalah-dari-bhayangkara-fc-bukan-karena-ketiadaan-robert-rene-alberts
    // TODO
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
    }

    function FactoryOneRWidget(options) {
        // prepare the options.
        // mix with the defaults

        _basicInfo = collectBasicInfo();

        // load the CSS file and fetch the recommendation need both done.
        let promMain = fetchRecommendationsP(_basicInfo);
        // from the options or internal default we know what is the
        // css file to load
        let promCSS = fetchCSSFileP(fileUrl);

        Promise.all([promMain, promCSS])
        .then(function(values) {
            // when both css file is fetched and the rec
            // results came back, then we can use it.
            let resultObj = values[0]; // from first promise
            let tUrl = makeTrackerBaseUrl(basicInfo, resultObj);
            _evtHelper = MakeOneEvtHelper(numItems, tUrl);
            createDisplay(resultObj, _evtHelper);
        })
        //.catch() {

        //}
    }
    let ret = new FactoryOneRWidget(options);
    return ret;
  }
  module.exports = MakeOneRecWidget_;

  

