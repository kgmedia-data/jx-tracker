
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
    //https://jixie.atlassian.net/wiki/spaces/DEMO/pages/1690697731/Implementation+of+ID+Tracking+for+AMP
    //there is a bullet point about the amp-ad setup of getting ids from amp runtime.
    /*
    'jixie': {
    prefetch: ['https://scripts.jixie.io/jxamp.min.js'],
    clientIdScope: '__jxamp',
    clientIdCookieName: '_jx',
    renderStartImplemented: true,
    },
    If from pub domain, it will be _jx cookie (either the existing value or the value
        the amp runtime will provide
        If this is something created by amp runtime, would look like amp-OSgrf345skUUQQke6SBbGg
    If from amp cache then it is the __jxamp scope variable curated by amp runtime:
    Looks something like this: y2WnZ1hi4dMLtcZVOY6HBPtZwMAN8nyRba8x9qmrErayqj4cvUp6ND4gW8Be1vIb
       
    */
    if (clientId) {
        //totally classical client_id so put it sin params.client_id
        //then it is not something last minute just generated by amp runtime 
        //(whcih we might want to override).
        if (clientId.length == 36) {
            var count = 0, i = 0;
            for(i;i<clientId.length;i++)if(clientId[i]=='-')count++;
            if (count == 4) {
                params.client_id = clientId;
            }
        }
        else if (clientId.startsWith('ampc-')) {
            //that it exists like this means this already is in the publisher domain
            //_jx cookie
            //If from ampruntime raw there is no ampc-
            params.client_id = clientId;
        }
        else if (clientId.startsWith('amp-')) {
            //This is generated by amp- runtime but not sure if there is a better one
            //sitting in jixie.io domain cookie
            //_jx cookie. So call it amp_client_id
            params.amp_client_id = clientId;
        }
        else if (clientId.length > 60) {
            //then likely is this
            //y2WnZ1hi4dMLtcZVOY6HBPtZwMAN8nyRba8x9qmrErayqj4cvUp6ND4gW8Be1vIb
            //would be the super long amp-generated id string then.
            params.amp_client_id = 'ampc-'+clientId;//to faciliate lookup .
        }
        else {
            //don't put.
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
    let iLR = window.context.initialLayoutRect;
    if (cxt.data.height == 1) {
        //this type we will need to resize to AMP runtime for size change.
        //note actually we 
        //we will never ask for more width lah. it is the height.
        params.maxwidth = iLR.width;
        //then we do it abit like jixie friendly standard loh.
    }
    else {
        if (iLR && iLR.width && iLR.height) {
            params.maxwidth = iLR.width;
            params.fixedheight = iLR.height;
        }
    }
    params.container = 'c'; //Yup, with amp 3p, the div is always called 'c'
    console.log(cxt.data);
    console.log("--- --- --- --- --- --- --- --- --- ---");
    ['unit','cid','creativeid','creativeids'].forEach(function(p){
        if (cxt.data[p]) {
            params[p] = cxt.data[p];
        }
    });
    params.data = JSON.parse(JSON.stringify(cxt.data));
    params.data.iwidth = iLR.width; //actual
    params.data.iheight = iLR.height;
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