/* The jixie recommendation widget :
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
    const defaultAR = 0.5626;
    /**
     * General Helper Function 
     */
    function appendDefaultCSS(rand, blockwidth) {

        const stylesArr = [
            "." + recWrapperCls + "" + rand + "{display:flex;flex-wrap:wrap;justify-content:center;}",
            "." + recColCls + "" + rand + "{position:relative;box-sizing:border-box;width:"+ blockwidth+ "px;flex:0 0 " + blockwidth + "px;max-width:" + blockwidth + "px;margin:5px;}",
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
        ["count", "adpositions","accountid","pageurl","widget_id","keywords","title","date_published"].forEach(function(pname) {
            if (infoObj[pname])
                s += '&' + pname + '=' + encodeURIComponent(infoObj[pname]);
        });
        ["client_id","session_id","cohort"].forEach(function(pname) {
            if (jxUserInfo[pname])
                s += '&' + pname + '=' + encodeURIComponent(jxUserInfo[pname]);
        });
        
        let url = "https://recommendation.jixie.media/v1/recommendation?type=pages" + s;
        
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
        wrapper: 'jxrwgt-wrap-cl',
        sponsored: 'jxrwgt-itm-sponsored'
    };

    function getOriginalSizeImage (imageUrl){
        return new Promise((resolve, reject) => {
            var newImg = new Image();
            newImg.onload = function() {
                var height = newImg.height;
                var width = newImg.width;
                resolve({ width, height });
            }
            newImg.onerror = function() {
                resolve(null);
            }
            newImg.src = imageUrl;
        })
    }

    function augmentWithUtm(url, utm) {
        if (utm) {
            return url + (url.indexOf('?') > -1 ? '&': '?') + utm;
        }
        return url;
    }

    function padTo2Digits(num) {
        return num.toString().padStart(2, '0');
    }
      
    function formatDate(date) {
        return [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
        ].join('-');
    }

    function createDisplay(blockwidth, rand, container, resultObj, jxRecHelper, count, widgetType, utm) {
        let widgetWrapper = document.createElement('div');
        widgetWrapper.className = `${recWrapperCls}${rand}`;
        widgetWrapper.classList.add(cssClasses.container);
        container.appendChild(widgetWrapper);
        let widgetItemArr = [];
        try {
        var items = resultObj.items;
        if (items.length > 0) {
            items.slice(0, count).map(function(item, index) {
                let divid = `recItem-${rand}-${index}`; 
                widgetItemArr.push({
                    divid: divid,
                    id: item.type === 'ad' ? item.id : jxRecHelper.jxUrlCleaner(item.url),
                    pos: index, //starts from 0
                    type: item.type,
                    trackers: item.trackers,
                    algo: item.a,
                    img: item.img
                });

                /* note: We have this -rand- thing in the div id (this is just
                * because want the div id to be unique on the page as
                * in case more than 1 widget is embedded on the page) */
                var recItem = createElement('div', divid, `${recColCls}${rand}`, [cssClasses.wrapper]);
                recItem.dataset.index = index;

                var imgWrapper = createElement('div', null, null, [cssClasses.thumbnail_wrapper]);
                var imgElm = createElement('img', null, null, [cssClasses.thumbnail]);

                getOriginalSizeImage(item.img).then(function(obj) {
                    if (obj.width && obj.height) {
                        const aspectRatio = obj.width / obj.height;
                        var wrapperHeight = blockwidth * defaultAR;
                        // imgWrapper.style.height = wrapperHeight + 'px';

                        imgElm.style.maxWidth = '100%';
                        imgElm.style.maxHeight = '100%';
                        if (aspectRatio > 1) {
                            imgElm.style.width = blockwidth + 'px';
                            imgElm.style.height = (blockwidth / aspectRatio) + 'px';
                            imgWrapper.style.height = (blockwidth / aspectRatio) + 'px';
                        } else {
                            imgElm.style.width = (wrapperHeight * aspectRatio) + 'px';
                            imgElm.style.height = wrapperHeight + 'px';
                            imgWrapper.style.height = wrapperHeight + 'px';
                        }
                    } else {
                        console.log('Unable to get the original size of the image');
                    }
                }).catch(function(error) {
                    console.log(`Unable to get the original size of the image ${error.stack} ${error.message}`);
                });

                imgElm.src = item.img;
                imgWrapper.appendChild(imgElm);

                var categoryDiv = createElement('div', null, null, [cssClasses.category], item.type === 'ad' && widgetType !== 'normal' ? 'Sponsored' : item.category);

                var titleDiv = createElement('div', null, null, [cssClasses.title], item.title);

                if (widgetType === 'normal' && item.type === 'ad') {
                    var sponsoredDiv = createElement('div', null, null, [cssClasses.sponsored], 'Sponsored');
                    imgWrapper.appendChild(sponsoredDiv);
                }

                recItem.appendChild(imgWrapper);
                recItem.appendChild(categoryDiv);
                recItem.appendChild(titleDiv);

                widgetWrapper.appendChild(recItem);
                
                recItem.onclick = handleClick.bind(null, jxRecHelper, (item.type === 'ad' ? item.url : augmentWithUtm(item.url, utm)), index);
                
            });
            /***
             * JXRECSDK NOTES 3 of 5 - 
             * pass all the info about the items to the rec helper
             * each one is an object: ALL MANDATORY (check with Vincent.)
             *  id: div id of the item
             *  index of the item in the widget (starts from 0)
             *  url: click url of the item
             */
            jxRecHelper.items(widgetItemArr);
             /***
             * JXRECSDK NOTES 4 of 5 - 
             * Call the ready() of the helper object when the recommendation 
             * results have been populated to the widget
             * (This will register the action=ready event)
             */ 
            jxRecHelper.ready(resultObj.options.version, resultObj.options.reco_id);
        } else {
            jxRecHelper.error(204);
            console.error("Error: no recommendation items");
            return;
        }
        }
        catch (err) {
            jxRecHelper.error(901);
            console.log(err.stack);
        }
    }
    const fileBase_ = 'https://scripts.jixie.media/';
    const _cssURL = fileBase_ + 'jxrecwidget.1.0.css';
    const _jxRecSdkURL = fileBase_ + 'jxrecsdk.1.0.min.js';
    //const _jxRecSdkURL = "https://scripts.jixie.media/jxrecsdk.1.t.min.js";
    
    const _rowsWidgetCssURL = fileBase_ + 'rows-widget.css';
    const _gridWidgetCssURL = fileBase_ + 'grid-widget.css';
    const _gridVertBarsWidgetCssURL = fileBase_ + 'grid-vert-bars-widget.css';
    
    class OneWidget {
        constructor(options) {
            // in our case most of the stuff is gotten from the page 
            this._options = {
                accountid : options.accountid,
                pageurl: options.pageurl ? options.pageurl: windows.location.href,
                widget_id: options.widgetid,
                system: "jx", // this current widget is calling the jixie recommendation backend
                              // as it is the jixie recommendation widget :)
                partner_id: options.partner_id,
                partner_cookie: options.partner_cookie,
                container: options.container,
                keywords: options.keywords,
                title: options.title,
                count: options.count || 6,
            };
            this.publishedDate = document.querySelector('meta[property="article:published_time"]') || document.querySelector('meta[name="content_PublishedDate"]') || undefined;
            if (options.adpositions) {
                this._options.adpositions = options.adpositions;
            }
            if (options.utm) {
                this._options.utm = options.utm;
            }
            if (options.date_published) {
                this._options.date_published = options.date_published;
            } else if (this.publishedDate && this.publishedDate.content) {
                this._options.date_published = formatDate(new Date(this.publishedDate.content));
            }
            this._count = options.count || 6;
            this._widgetType = options.type || 'normal';
            this._blockwidth = Number(options.blockwidth) || 280;
            this._containerId = options.container;
            this._container = document.getElementById(this._containerId);
        }
        kickOff() {
                const rand = Math.floor(Math.random() * 1000);
                appendDefaultCSS(rand, this._blockwidth);

                // just fire this request off (loadcss)
                let _cssToBeLoad = _cssURL;
                switch (this._widgetType) {
                    case 'grid':
                        _cssToBeLoad = _gridWidgetCssURL;
                        break;
                    case 'grid-vert-bars':
                        _cssToBeLoad = _gridVertBarsWidgetCssURL;
                        break;
                    case 'rows':
                        _cssToBeLoad = _rowsWidgetCssURL;
                        break;
                    default:
                        break;
                }
                let promCSS = fetchCSSFileP(_cssToBeLoad); // if you css is loaded on the page already, 
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
                        recHelperObj.error(204);
                        throw "no recommendation results";
                    }            
                    return promCSS; //ok this promise (CSS loading) should have resolved by now 
                                    //so should be minimal waiting
                })
                .then(function() {
                    // everything is ready (recommendation results, css):
                    createDisplay(thisObj._blockwidth, rand, thisObj._container, recResults, recHelperObj, thisObj._count, thisObj._widgetType, thisObj._options.utm);
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
