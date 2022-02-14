/**
 * The jixie recommendation widget :
 * - Supports multiple copies of the widget on a given webpage
 * - This widget talks to the Jixie recommendation endpoint and does a simple
 *   rendering into rows of fixed number of columns
 * - It loads the Jixie Recommendation Helper SDK jxrecsdk.1.0.min.js to manage
 *   all the monitoring of visibility of the widget and the individual items and
 *   sending the events to jixie_tracker on its behalf.
 * 
 * This piece of code also serves as an example of how one can use the 
 * jxrecsdk then. Look for 
 * JXRECSDK NOTES 1 of 5 
 * JXRECSDK NOTES 2 of 5 
 * JXRECSDK NOTES 3 of 7 
 * JXRECSDK NOTES 4 of 5 
 * JXRECSDK NOTES 5 of 5 
 * 
 */
(function() {
    if (window._jxrecsdkalreadyinit) return;
    window._jxrecsdkalreadyinit = 1;

    const recColCls = "jxRecCol";
    const recWrapperCls = "jxRecWrapper";
    /**
     * General Helper Function 
     */
    function appendDefaultCSS(rand, numCols) {
        var colWidth = 100; // default width and flex of each items
        if (numCols) colWidth = 100 / numCols;

        const stylesArr = [
            "." + recWrapperCls + "" + rand + "{display:flex;flex-wrap:wrap;}",
            "." + recColCls + "" + rand + "{position:relative;box-sizing:border-box;width:100%;flex:0 0 " + colWidth + "%;max-width:" + colWidth + "%;}",
        ].join("\n");

        var head = document.getElementsByTagName('HEAD')[0];
        var s = document.createElement("style");
        s.innerHTML = stylesArr;
        head.appendChild(s);
    }

    /**
     * General Helper function with DOM elements creation
     * @returns 
     */
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
     * General helper function 
     * @param {*} basicInfo (an obj containing client_id, sid, cohort, accountid, widget, pageurl
     * whenever possible)
     * needed by Jixie
     * 
     * This function constructs the url to call the recommendation endpoint, fires the request 
     * returns a promise which should resolves to an array of objects
     * 
     * Note we also call resolve in case of error. Just easier to report the error in the code that calls it
     */
    function fetchRecommendationsP(infoObj, jxUserInfo) {
        let s = '';
        ["accountid","pageurl","widget_id","keywords","title"].forEach(function(pname) {
            if (infoObj[pname])
                s += '&' + pname + '=' + encodeURIComponent(infoObj[pname]);
        });
        ["client_id","session_id","cohort"].forEach(function(pname) {
            if (jxUserInfo[pname])
                s += '&' + pname + '=' + encodeURIComponent(jxUserInfo[pname]);
        });
        
        let url = "https://recommendation.jixie.io/v1/recommendation?type=pages" + s;
        
        // TODO CORS 
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.response));
                } else {
                    resolve(null); 
                }
            }
            xhr.onerror = function() {
                resolve(null);
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
            link.onload = function() {
                resolve(true);
                console.log('style has loaded');
            };
            link.href = fileUrl;
            let headScript = document.querySelector('script');
            headScript.parentNode.insertBefore(link, headScript);
            //do the reject case leh
        });
    }

    /**
     * General helper function 
     * @param {*} fileUrl string
     * returns a promise which should resolves to true if all goes well
     */
    function fetchJSFileP(fileUrl) {
        return new Promise(function(resolve, reject) {
            var tag = document.createElement("script");
            var fst = document.getElementsByTagName("script")[0];
            fst.parentNode.insertBefore(tag, fst);
            tag.onload = function() {
                resolve();
            };
            tag.src = fileUrl;
        });
    };

    /**
     * Click handler; A BOUND version is wired up to a particular DOM
     * element as the click handler
     * @param {*} url 
     * @param {*} pos 
     * @returns 
     */
    function handleClick(jxRecHelper0, url, pos) {
        /***
         * JXRECSDK NOTES 5 of 5 calling 
         * Call clicked(pos) of helper object to report a click
         * Here pos is the index of the item (starts from 0, 1, 3)
         */
        jxRecHelper0.clicked(pos); //we need the position of the item in the widget
        window.open(url, '_blank');
        return false;
    }

    const cssClasses = {
        thumbnail_wrapper: 'jxrwgt-itm-timgwrap-cl',
        thumbnail: 'jxrwgt-itm-timg-cl',
        category: 'jxrwgt-itm-cat-cl',
        title: 'jxrwgt-itm-title-cl',
        container: 'jxrwgt-ctr-cl',
        category: 'jxrwgt-itm-cat-cl',
        wrapper: 'jxrwgt-wrap-cl'
    };

    function createDisplay(rand, container, resultObj, jxRecHelper) {
        let widgetWrapper = document.createElement('div');
        widgetWrapper.className = `${recWrapperCls}${rand}`;
        widgetWrapper.classList.add(cssClasses.container); //OWN
        container.appendChild(widgetWrapper);
        let widgetItemArr = [];
        try {
        var items = resultObj.items;
        if (items.length > 0) {
            items.map(function(item, index) {
                widgetItemArr.push({
                    id: `recItem-${rand}-${index}`,
                    url: item.url,
                    pos: index
                });

                /* note: We have this -rand- thing in the div id (this is just
                * because want the div id to be unique on the page as
                * in case more than 1 widget is embedded on the page) */
                var recItem = createElement('div', `recItem-${rand}-${index}`, `${recColCls}${rand}`, [cssClasses.wrapper]);
                recItem.dataset.index = index;

                var imgWrapper = createElement('div', null, null, [cssClasses.thumbnail_wrapper]);
                var imgElm = createElement('img', null, null, [cssClasses.thumbnail]);
                imgElm.src = item.img;
                imgWrapper.appendChild(imgElm);

                var categoryDiv = createElement('div', null, null, [cssClasses.category], item.category);
                var titleDiv = createElement('div', null, null, [cssClasses.title], item.title);

                recItem.appendChild(imgWrapper);
                recItem.appendChild(categoryDiv);
                recItem.appendChild(titleDiv);

                widgetWrapper.appendChild(recItem);
            });
                   

            if (widgetItemArr.length > 0) {
                widgetItemArr.map(function(item) {
                    /***
                     * JXRECSDK NOTES 4 of 5 - 
                     * call items of helper obj - for all items on the widget
                     * param1: MANDATORY: the DOM div-id of the item
                     * param2: MANDATORY: index of the item of the widget (starts from 0)
                     * param3: MANDATORY: click url of the item
                     */
                    jxRecHelper.items(item.id, item.pos, item.url);

                    document.getElementById(item.id).onclick = handleClick.bind(null, jxRecHelper, item.url, item.pos);
                });
            }
            
        } else {
            console.error("Error: no recommendation items");
            return;
        }
        }
        catch (err) {
            console.log(err.stack);
        }
    }

    const _cssURL = 'https://scripts.jixie.media/jxrecwidget.1.0.css';
    //const _jxRecSdkURL = 'https://scripts.jixie.media/jxrecsdk.1.0.min.js';
    const _jxRecSdkURL = 'https://jx-demo-creatives.s3-ap-southeast-1.amazonaws.com/osmtest/jxrecsdk.1.0.min.js';

    class OneWidget {
        constructor(options) {
            this._options = {
                accountid : options.accountid,
                pageurl: options.pageurl ? options.pageurl: windows.location.href,
                widget_id: options.widgetid,
                container: options.container,
                keywords: options.keywords,
                title: options.title
            };
            this._numOfCols = options.numcols || 2;
            this._containerId = options.container;
            this._container = document.getElementById(this._containerId);
        }
        kickOff() {
                const rand = Math.floor(Math.random() * 1000);
                appendDefaultCSS(rand, this._numOfCols);

                // just fire this request off (loadcss)
                let promCSS = fetchCSSFileP(_cssURL); // if you css is loaded on the page already, 
                                                      // then no need this
                let promJXSDK = fetchJSFileP(_jxRecSdkURL); //kick off fetching of JX REC HELPER SDK
                let thisObj = this;

                // first we wait on the JX REC SDK to be loaded and initialized
                let recHelperObj = null;
                let recResults = null;
                promJXSDK
                .then(function() {
                     /***
                       * JXRECSDK NOTES 1 of 5 - INSTANTIATION OF A JX REC HELPER OBJECT
                       * Call this AFTER JX REC SDK is loaded but BEFORE you call your REC
                       * backend.
                       * 
                       * param: MANDATORY options object
                       * options object must at a minimal have 
                       *    accountid: get from jixie
                       *    widgetid: get from jixie
                       *    container: DIV ID of the destination div to house the widget
                       * (for jixie widget this is just the options object passed from the page)  
                       *  
                       * (This will also register the action=load event)
                       */    
                    recHelperObj = jxRecMgr.createJxRecHelper(thisObj._options);
                    // now fire off the call to recommendation endpoint 
                    let basicInfo = thisObj._options; //for now just use back the options obj 
                    // it has the pageurl and stuff.

                    // this getJxUserInfo is an unpublished convenience the JX recommendation
                    // widget will call.
                    return fetchRecommendationsP(basicInfo, recHelperObj.getJxUserInfo());
                })
                .then(function(resp) {
                    recResults = resp;          
                    if (!resp || !recResults.items || recResults.items.length == 0) {
                      // bad bad bad bad
                      /***
                       * JXRECSDK NOTES 2 of 5 - 
                       * Call the error() function on the recHelper when either an error
                       * has occured in the fetching or there are no recommended items
                       * 
                       * (This will register the action=error event)
                       */ 
                        recHelperObj.error();
                        throw "no recommendation results";
                    }            
                    /***
                       * JXRECSDK NOTES 3 of 5 - 
                       * Call the ready() of the helper object when the recommendation 
                       * results have been fetched.  
                       * 
                       * (This will register the action=ready event)
                       */ 
                    recHelperObj.ready();
                    return promCSS; //ok this promise (CSS loading) should have resolved by now 
                                    //so should be minimal waiting
                })
                .then(function() {
                    // everything is ready (recommendation results, css):
                    createDisplay(rand, thisObj._container, recResults, recHelperObj);
                })
                .catch(function(error) {
                    console.log(`Unable to create recommendations widget ${error.stack} ${error.message}`);
                });
        }
    }

    // create a new instance of our widget based on the options
    function start_(options) {
        // what we had not bothered to do is to maintain a map so that for a given
        // destintation div the page do not call this twice
        const newW = new OneWidget(options);
        newW.kickOff();
    }

    //<--
    // OK standard jixie stuff: we do this then we can ensure people using our widget can 
    // trigger us without worrying whether our script is loaded or not:
    var JxEventsQ = function() {
        this.push = function() {
            for (var i = 0; i < arguments.length; i++) {
                try {
                    start_(arguments[i]);
                } catch (e) {}
            }
        }
    };
    var ourSigQ = '_jxrwidget';
    var _old_eventsq = window[ourSigQ];
    window[ourSigQ] = new JxEventsQ();
    // execute all of the queued up events - apply() turns the array entries into individual arguments
    if (_old_eventsq)
        window[ourSigQ].push.apply(window[ourSigQ], _old_eventsq);
    //-->
})();

/* 
on the page this is the way to embed this widget:
window._jxrwidget.push({
    "accountid": "9262bf2590d558736cac4fff7978fcb1", 
    "container": "recWidgetTestDivId",
    "widgetid": "xyz",
    "title": "",
    "pageurl": "",
    "keywords": ""
   });
</script>
<!-- NOTE: can do defer or async: no issue -->
<script type="text/javascript" src="https://scripts.jixie.media/jxrwidget.1.0.min.js" defer></script>
*/
