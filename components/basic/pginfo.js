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

function get_(config) {
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
    return {
        p_domain: p_domain,
        pagekeywords: keywords,
        pagedomain: pagedomain,
        pageurl: page,
        pagetitle: ttl
    };
}

module.exports.get = get_;