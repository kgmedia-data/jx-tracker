/**
 * script to do amp osm
 */
const mpjixie       = require('../components/osmpartners/amp-jixie');
const mpteads       = require('../components/osmpartners/amp-teads');
const mpunruly      = require('../components/osmpartners/amp-unruly');
const mosm          = require('../components/osmengine/amp-core');

function start() {
    let params = {};
    params.responsive = 1; //for AMP must
    params.context = 'amp';
    let cxt = window.context;
    if (!cxt) {
        return;
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
        if (qparams.has('creativeid'))
            params.creativeid = qparams.get('creativeid');
    }

    params.maxwidth = cxt.data.width;
    params.fixedheight = cxt.data.height; 
    params.container = 'c'; //Yup, with amp 3p, the div is always called 'c'
    if (cxt.data.unit) {
        params.unit = cxt.data.unit;
    }
    if (cxt.data.cid) {
        params.creativeid = cxt.data.cid;
    }
    if (cxt.data.creativeid) {
        params.creativeid = cxt.data.creativeid;
    }
    var inst = mosm.createInstance(params, {
            jixie: mpjixie,
            teads: mpteads,
            unruly: mpunruly
        });
}

start();

/*
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