/*
 * basic services .. 
 * to get some basic info about the page.
 * needed for analytics and for making the ad call
 */
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

function get_(options) {
    if (false) { //TODO
        //TMP
        return {
            pagekeywords: "",
            pagedomain: "",
            pageurl: "",
            pagetitle: ""
        };
    }
    // Something stupid here... what is in and what is out.
    // Getting the page information (URL and hostname and title) depending if friendly iFrame or not
    var page = null, pagedomain = null, ttl = null, keywords = null, p_domain = null, pagecategory = null;
    if (gIsFifs || !gIframe) {
        try {
            let win = gIsFifs ? window.top: window.self;
            page = win.location.href;
            pagedomain = win.location.hostname;
            ttl = win.document.title;
            keywords = win.document.querySelector('meta[name="keywords"]');
            pagecategory = win.document.querySelector('meta[name="content_category"]');
            if (pagecategory) {
                pagecategory = pagecategory.content;
            }
            if (!keywords && options && options.keywordsmeta) {
                keywords = win.document.querySelector(`meta[name="${options.keywordsmeta}"]`);
            }
            if (keywords) {
                keywords = keywords.content;
            }
        }
        catch(ee1) {
        }
    }
    else if (gIsUFif && config.pageurl_gam) {
        try {
            page = config.pageurl_gam;
            pagedomain = config.pageurl_gam.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];
        }
        catch (ee) {}
    }
    try{
        if (document.referrer) {
            p_domain = document.referrer;
        }
        let parser = document.createElement('a');
        // Let the browser do the work
        parser.href = url;
        _hostname = parser.hostname;
    }
    catch (e) {}
    //????
    //if (!outp.domain && (!pagedomain || pagedomain == '') && (page && page !== '')){
      //  if (up.hostname) outp.domain = _hostname;
    //}else if (!outp.domain){
      //  outp.domain = encodeURIComponent(pagedomain ? pagedomain: '');
    //}
    let ret = {};
    if (p_domain) ret.p_domain = p_domain;
    if (pagedomain) ret.domain = pagedomain;
    if (page) ret.pageurl = page;
    if (keywords) ret.pagekeywords = keywords;
    if (pagecategory) ret.pagecategory = pagecategory;
    if (ttl) ret.pagetitle = ttl;

    let qparams = (new window.URL(document.location)).searchParams;
    ['jxoptions','creativeid','creativeids','debug', 'deltaassets64', 'logwhythrow','portal', 'jxsimidurl'].forEach(function(item) {
        if (qparams.has(item)) {
            ret[item] = qparams.get(item);
        }
    });
    //add a jxosm.

    return ret;
}

// AMP they cannot have htis already .
/*
not good also lah: this one only take from the current window. 

function getKeywords_(tagNameMaybe = null) {
    let keywords = null;
    if (tagNameMaybe) {
        keywords = document.querySelector(`meta[name="${tagNameMaybe}"]`).content;
        if (keywords) { 
            return keywords; 
        }
    }
    let metas = document.getElementsByTagName("meta");
    if (metas && metas.length > 0) {
        for (var i = 0; i < metas.length; i++) {
            if (metas[i].name.indexOf("keyword") > -1) {
                keywords = metas[i].content;
                if (keywords) { 
                    return keywords; 
                }
            }
        }

    }
    return null;
}
*/

module.exports.get = get_;
//module.exports.getKeywords = getKeywords_;

/* 
 ************** module: basic/pginfo **************************************************

* module.exports:
    - get (function)
        - returns an object and this object could contain the following, if available:
            - creativeid (from current url)
            - creativeids (from current url)
            - debug (from current url)
            - deltaassets64 (from current url)
            - portal (from curent url)
    
            - domain
            - pageurl
            - p_domain
            - (Renee TODO: write down the way we determine the answer)

  
* requires/dependencies:
    - none
*/