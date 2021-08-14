/**
 * Bundle built to make AMP OSM script (so this will also be the universal script for AMP)
 * 
 * Documentation: refer to amp-osm.md file in this same dir
 */
const modulesmgr    = require('../components/basic/modulesmgr');

const common                       = require('../components/basic/common');
modulesmgr.set('basic/common',     common);
 
const univelements  = require('../components/renderer/univelements-stub');
modulesmgr.set('renderer/univelements',         univelements);
 
const mpjixie       = require('../components/osmpartners/amp-jixie');
const mpteads       = require('../components/osmpartners/amp-teads');
const mpunruly      = require('../components/osmpartners/amp-unruly');
const mosm          = require('../components/osmengine/amp-core');

function start() {
    let params = {};
    params.responsive = 1; //for AMP must ?!
    params.context = 'amp';
    let cxt = window.context;
    if (!cxt) {
        return;
    }
    let clientId = cxt.clientId;
    if (clientId) {
        //this can be our jixie_jx cookie thing or it can be the 
        //amp id
        if (clientId.length == 36) {
            var count = 0, i = 0;
            for(i;i<clientId.length;i++)if(clientId[i]=='-')count++;
            if (count == 4) {
                params.aclient_id = clientId;
            }
        }
        if (!params.aclient_id) { 
            //those starting with amp- are when the page is from publisher
            //domain, this is per domain. the else case is when served
            //from AMP cache. Seems to be tied to the subdomain (publisher subdomain)
            //and hence is ...less high quality then.
            if (clientId.startsWith('amp-')) 
                params.aaclient_id = clientId;
            else
                params.aaaclient_id = clientId;
        }
    }
    if (cxt.canonicalUrl) {
        params.pageurl = cxt.canonicalUrl;
    }
    if (cxt.location.origin) {
        params.domain = cxt.location.origin;
    }
    if (cxt.sourceUrl) {
        //our own folks can still force a creativeid to check creatives;
        let qparams = (new URL(cxt.sourceUrl)).searchParams;
        ['creativeids','creativeid'].forEach(function(p) {
            if (qparams.has(p))
            params[p] = qparams.get(p);
        });
    }
    params.maxwidth = cxt.data.width;
    params.fixedheight = cxt.data.height; 
    params.container = 'c'; //Yup, with amp 3p, the div is always called 'c'
    ['unit','cid','creativeid','creativeids'].forEach(function(p){
        if (cxt.data[p]) {
            params[p] = cxt.data[p];
        }
    });
    var inst = mosm.createInstance(params, {
            jixie: mpjixie,
            teads: mpteads,
            unruly: mpunruly
        });
}

//<--- NOTE: For now we just build the jixie-ad-rendering capability
//into the JS file too (so no loading of yet another file to play JX ad)
const mrenderer     = require('../components/renderer/core');
if (!window.jxrenderer) {
    window.jxrenderer = {
        init: function(options) {
            mrenderer.createInstance(options);
        }
    };
}

start();

/*

ampSlotIndex: "0"
cid: "1174"
maybe do a fixed height then?
height: 300
options: "{\"miscParams\":{\"reserve1\":\"test1\",\"reserve2\":\"test2\"}}"
type: "jixie"
unit: "jixietestunit"
width: 400


   'data',
        'canonicalUrl',      
        'container',
        'domFingerprint',
        'location',
        'pageViewId',
        'pageViewId64',
        'referrer',
        'sourceUrl',
        'startTime'
        */
/* sample values
gotten canonicalUrl="https://tekno.kompas.com/read/2021/06/22/20040087/ketika-ceo-grab-nyambi-jadi-kurir-grabfood-naik-sepeda-antar-makanan"
jx-app-amposm.min.js:34 gotten container=null
jx-app-amposm.min.js:34 gotten domFingerprint="4156542820"
jx-app-amposm.min.js:34 gotten location={
  "href": "https://jixieamptest.kompas.com/api/testpagegen?filename=ampad1",
  "protocol": "https:",
  "host": "jixieamptest.kompas.com",
  "hostname": "jixieamptest.kompas.com",
  "port": "",
  "pathname": "/api/testpagegen",
  "search": "?filename=ampad1",
  "hash": "",
  "origin": "https://jixieamptest.kompas.com"
}
jx-app-amposm.min.js:34 gotten pageViewId="6465"
jx-app-amposm.min.js:34 gotten pageViewId64="bXP7es6f6jgigRcwtnu3Xw"
jx-app-amposm.min.js:34 gotten referrer=""
jx-app-amposm.min.js:34 gotten sourceUrl="https://jixieamptest.kompas.com/api/testpagegen?filename=ampad1"
*/