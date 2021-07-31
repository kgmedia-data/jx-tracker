/**
 * Bundle built to make standalone videoad player JS for publisher use
 * (not used thru jixie outstream/ OSM that type. That's why called standalone)
 * 
 * Documentation: refer to videoadsdk-standalone.md file in this same dir
 */
 if (window.jxvideoadsdksal) { //<--- NEW LEH
    return;
}
 
const modulesmgr                       = require('../components/basic/modulesmgr');
const cssmgr                           = require('../components/video/cssmgr');
modulesmgr.set('video/cssmgr',         cssmgr);

// For style this is a bit different from the default one (for video SDK)
const stylesSet                        = require('../components/video-styles/videoad');
cssmgr.init(stylesSet.getCls(), stylesSet.getStyles());
cssmgr.inject('adControls', { color: '#FF0000'});

const vast                             = require('../components/video/vast');
modulesmgr.set('video/vast',         vast);

const common                           = require('../components/basic/common');
modulesmgr.set('basic/common',         common);

const consts                            = require('../components/video/consts'); 
modulesmgr.set('video/consts',          consts);

const adctrls_fact                      = require('../components/video/adctrls-factory');
modulesmgr.set('video/adctrls-factory', adctrls_fact);

const admgr_fact                        = require('../components/video/admgr-factory');
modulesmgr.set('video/admgr-factory',   admgr_fact);

const spinner_fact                      = require('../components/video/spinner-factory');
modulesmgr.set('video/spinner-factory',   spinner_fact);

const replaybtn_fact                    = require('../components/video/replaybtn-factory-dummy');
modulesmgr.set('video/replaybtn-factory',  replaybtn_fact);

const horizbanner_fact                  = require('../components/video/horizbanner-factory-dummy');
modulesmgr.set('video/horizbanner-factory',   horizbanner_fact);

const createObject                       = require('../components/video/adplayer');


var instMap = new Map(); //if we just always impose that if used from universal, then it's in
                         //iframe, then this Map is a bit stupid (only 1 item)  
function makePlayer(containerId, adparameters, config = null, eventsVector = null) {
    config.autopause = false; //i.e. we are not dependent on those jxvisible
    config.video = 'https://creative-ivstream.ivideosmart.com/3001004/1181736/3001004-1181736_360.mp4';
    //config.tag = 'https://search.spotxchange.com/vast/2.0/79391?VPAID=JS&content_page_url=&cb=1627609832&player_width=400&player_height=320&media_transcoding=low';
    config.loop = 'auto';
    config.width = 640;
    config.height = 360;
    //testing only config.autoplay = false;
    //and what not.
    //just depend on the autoplay flag.
    let instMaybe = instMap.get(containerId);
    if (instMaybe) {
        return;
    }
    let playerInst = createObject(containerId, adparameters, config, eventsVector);
    instMap.set(containerId, playerInst);
    return playerInst;
}

window.jxvideoadsdksal = 1;

//aiyo cannot also
function fetchAdJsonP(cfg) {
    //return Promise.resolve(null);
    if (!cfg.unit && !cfg.creativeid && !cfg.campaignid && !cfg.tag && !cfg.xmltag) {
        //then I don't think they are trying to play an ad.
        //it may just be wanting to play a video then.
        return Promise.resolve(null);
    }
    let tag = null;
    let seg = cfg.debug ? '-rc':'';
    if (cfg.tag) {
        tag = cfg.tag;
    }
    else {
        if (!cfg.source) { 
            cfg.source = 'sdk'; 
        }
        if (!cfg.domain) { 
            cfg.domain = 'jixie.io'; 
        }
        ['creativeid','campaignid','source','pageurl','unit'].forEach(function(qparam) {
            tag += (cfg[qparam] ? '&' + qparam + '=' + cfg[qparam]: '');
        });
        tag = 'https://ad' + seg + '.jixie.io/v1/universal?';
        ['creativeid','campaignid','source','pageurl','unit'].forEach(function(qparam) {
            tag += (cfg[qparam] ? '&' + qparam + '=' + cfg[qparam]: '');
        });
    }
    return fetch(tag)
    .then((response) => response.json())
    .then(function(respJson) {
        let arr = respJson.creatives;
        if (arr && arr.length >= 1) {
            return arr[0];
        }
        throw new Error("no ad");
    });
}

//aiya, with this onJXPlayerReady callback, this stuff cannot
//have multiple instances on the same page also lah!!
var oldPlayerSDKMap = null;
if (window.onJXPlayerReady && !window.onJXPlayerReadyProcessed) {
    window.onJXPlayerReadyProcessed = 1;
    oldPlayerSDKMap = new Map();
    //well, since these events are published in our documentation, we need to support them
    const eventsVector_ =[
            "jxplayvideo",
            "jxvideoend",
            "jxhasad",
            "jxnoad",

            "jxadended", 
            "jxadfirstQuartile",
            "jxadthirdQuartile",
            "jxadmidpoint",
            "jxadskipped", 
            "jxadalladscompleted",
            "jadclick", 
            "jxadimpression",
            "jxadstart"
        ];
    var playerObj = {
        player: null,
        started: false,
        start: function(config) {
            if (this.started) return; //to beat a problem with the ad looping
            this.started = true;
            //get the player instance 
            let thisObj = this;
            let inst = oldPlayerSDKMap.get(config.container);
            if (!inst) {
                fetchAdJsonP(config)
                .then(function(creativeJson) {
                    //creativeJson could be null 
                    //if there is no ad.
                    inst = makePlayer(config.container, creativeJson, config, eventsVector_);
                    thisObj.player = inst;
                    //Just testing nonautoplay
                    //setTimeout(function(){
                      //  thisObj.player.play();
                    //}, 5000);
                    oldPlayerSDKMap.set(config.container, inst);
                })
                .catch(function(e) {
                    console.log("CANNOT FETCH AD");
                });
            }
        },
        play: function() {
            if (this.player) this.player.play();
        },
        pause: function() {
            if (this.player) this.player.pause();
        },
        rewind: function() {
            if (this.player) this.player.rewind();
        }
    }
    window.onJXPlayerReady(playerObj);
}



