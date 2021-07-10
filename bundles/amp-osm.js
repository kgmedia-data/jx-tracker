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
    params.maxwidth = window.context.data.width;
    params.fixedheight = window.context.data.height; 
    params.container = 'c';
    if (window.context.data.unit) {
        params.unit = window.context.data.unit;
    }
    if (window.context.data.cid) {
        params.creativeid = window.context.data.cid;
    }
    //the params is for jixie OSM but it is also for the
    //jx universal lah:        
    //then fill it in from the amp context ah.
    mosm.oneOffInit();
    var inst = mosm.createInstance(params, {
            jixie: mpjixie,
            teads: mpteads,
            unruly: mpunruly
        });
}

start();
