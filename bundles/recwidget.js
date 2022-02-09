/**
 * A jixie recommendation widget which supports multiple copies of the widget
 * on a given webpage
 * It talks to the Jixie recommendation endpoint
 * Also serves as an example of how one can use the JIXIE REC WIDGET SDK
 */
 (function() {
    if (window._jxrecsdkalreadyinit) return;
    window._jxrecsdkalreadyinit = 1;

    const rand = Math.floor(Math.random() * 1000);
    const recColCls = "jxRecCol";
    const recWrapperCls = "jxRecWrapper";

    /**
     * General Helper Function 
     */
    function appendDefaultCSS(numCols) {
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
     * General Helper function
     * TODO write properly
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
            //do the reject case leh
        });
    };

    /**
     * General helper function. To be called bound.
     * @param {*} url 
     * @param {*} pos 
     * @returns 
     */
    function handleClick(jxRecHelper0, url, pos) {
        jxRecHelper0.reportClick(pos); //we need the position of the thing.
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

    function createDisplay(container, resultObj, jxRecHelper) {
        let widgetWrapper = document.createElement('div');
        widgetWrapper.className = `${recWrapperCls}${rand}`;
        widgetWrapper.classList.add(cssClasses.container); //OWN
        container.appendChild(widgetWrapper);
        let clickUrlArr = [];
        //var recList = '';
        try {
        var items = resultObj.items;
        if (items.length > 0) {
            items.map(function(item, index) {
                clickUrlArr.push({
                    id: `recItem-${rand}-${index}`,
                    url: item.url,
                    pos: index
                });
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
                jxRecHelper.registerItem(`recItem-${rand}-${index}`, index, item.url);

            });

            if (clickUrlArr.length > 0) {
                clickUrlArr.map(function(item) {
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

    const _cssURL = 'https://jixie-creative-debug.s3.ap-southeast-1.amazonaws.com/universal-component/test_rec_widget.css';
    const _jxRecSdkURL = 'https://scripts.jixie.media/jxrecwidgetsdk.1.0.min.js';

    class OneWidget {
        constructor(options) {
            this._numOfCols = options.numcols || 2;
            this._containerId = options.container;
            this._container = document.getElementById(this._containerId);
        }
        kickOff() {
            appendDefaultCSS(this._numOfCols);
            //get the cohort 
            let basicInfo = {}; //dummy need to gather cohort client id etc
            let promMain = fetchRecommendationsP(basicInfo);
            let promCSS = fetchCSSFileP(_cssURL); //you can inject your css dynamically . this is optional.
            //let promJXSDK = fetchJSFileP(_jxRecSdkURL);
            let promJXSDK = Promise.resolve(true); //pretend
            let thisObj = this;
            Promise.all([promMain, promCSS, promJXSDK])
                .then(function(values) {
                    // when both css file is fetched and the rec
                    // results came back, then we can use it.
                    let resultObj = values[0]; // from first promise
                    //when the JX REC SDK is there, then we have this jxRecMgr.
                    //let recHelperObj = jxRecMgr.createJxRecHelper(options.container);
                    let recHelperObj = {
                        reportClick: function() {},
                        registerItem: function() {},
                    };
                    createDisplay(thisObj._container, resultObj, recHelperObj);
                })
                .catch(function(error) {
                    console.log(error);
                });
        }
    }

    function start_(options) {
        // by right we should check for 1 container only 1 widget
        const newW = new OneWidget(options);
        newW.kickOff();
    }

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
})();