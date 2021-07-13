/*
 * basic services .. TODO the GAM pageinfo thing.
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

function get_() {
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
    var page = null, pagedomain = null, ttl = null, keywords = null, p_domain = null;
    if (gIsFifs || !gIframe) {
        let win = gIsFifs ? window.top: window.self;
        page = win.location.href;
        pagedomain = win.location.hostname;
        ttl = win.document.title;
        keywords = win.document.querySelector('meta[name="keywords"]');
        if (keywords) {
            keywords = keywords.content;
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

    let qparams = (new URL(document.location)).searchParams;
    //use a loop lah!!
    if (qparams.creativeid) {
        ret.creativeid = qparams.creativeid;
    }
    if (qparams.creativeids) {
        ret.creativeids = qparams.creativeids;
    }
    if (qparams.debug) {
        ret.debug = qparams.debug;
    }
    if (qparams.deltaassets64) {
        ret.deltaassets64 = qparams.deltaassets64;
    }
    if (qparams.portal) {
        ret.portal = qparams.portal;
    }
    return ret;
}

module.exports.get = get_;

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