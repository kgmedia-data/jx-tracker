/**
 * Note this file will not be deployed standalone. It is gulp pasted together with jxyoutube.1.2.js into jxyoutubebridge.1.0.js 
 * (or jxyoutubebridge.1.0.min.js). It is done by running gulp PREP-PROD or gulp PREP-DEV (no minify) at the root level
 * so this file : it needs jxyoutube.1.2.js but it does NOT load it. It relies on the gulp concat to paste them together
 * and it will become jxyoutubebridge.1.0.(min).js
 * The reason is that we want to avoid an unnecessary file load. 
 */

var jxContainer = document.getElementById("jxOutstreamContainer"),
    containerID = "jxOutstreamContainer",
    wrapper = null,
    myplayer = null,
    playerOpt = {
    };

//PLEASE SEE THE COMMENTS AT THE TOP OF THIS FILE!!!    
///////var tag = document.createElement("script");
//////tag.src = "./script/jxyoutube.1.2.js"
////////tag.src = "../../js/jxvideo.1.3.min.js"
///////var firstScriptTag = document.getElementsByTagName("script")[0];

function onJXPlayerReady(jx) {
    if (jxuni_p && Array.isArray(jxuni_p) && jxuni_p.length > 0) {
        
        myplayer = jx;

        // create a div wrapper with "player" as the id, for youtube iframe
        //wrapper = newDiv(jxContainer, 'div', '', '', 'player');
       // wrapper.style.cssText = "position: absolute; top: 0; left: 0;"

        var jxObj = jxuni_p.shift();
        var creative = jxObj.c;

        if (jxObj.domain) playerOpt.domain = jxObj.domain;
        if (jxObj.pageurl) playerOpt.pageurl = jxObj.pageurl;
        if (jxObj.device) playerOpt.device = jxObj.device;
        if (jxObj.source) playerOpt.source = jxObj.source;
        if (jxObj.debug) playerOpt.debug = jxObj.debug;
        if (jxObj.portal) playerOpt.portal = jxObj.portal;

        if (creative.url) playerOpt.videoID = creative.url;
        
        if (creative.adparameters) {
            if (creative.adparameters.autoplay !== undefined) playerOpt.autoplay = creative.adparameters.autoplay;
            if (creative.adparameters.wifionly !== undefined) playerOpt.wifionly = creative.adparameters.wifionly;
            if (creative.adparameters.ima !== undefined) playerOpt.ima = creative.adparameters.ima;
            if (creative.adparameters.network !== undefined) playerOpt.iswifi = (creative.adparameters.network == 'wifi'); 
            if (creative.adparameters.withthumbnail !== undefined) playerOpt.withthumbnail = creative.adparameters.withthumbnail;
            if (creative.adparameters.thumbnail !== undefined) playerOpt.thumbnail = creative.adparameters.thumbnail;


            if (creative.adparameters.loop !== undefined) playerOpt.loop = creative.adparameters.loop;
            if (creative.adparameters.creativeid) playerOpt.creativeid = creative.adparameters.creativeid;
            if (creative.adparameters.campaignid) playerOpt.campaignid = creative.adparameters.campaignid;
            if (creative.adparameters.unit) playerOpt.unit = creative.adparameters.unit;
    
        }

        playerOpt.container = containerID;
        playerOpt.width = parseInt(creative.width) || 640;
        playerOpt.height = parseInt(creative.height) || 360;
        playerOpt.eventURL = creative.trackers.baseurl + "?" + creative.trackers.parameters;

        myplayer.start(playerOpt);

        window.addEventListener("message", function(e) {
            if (e.data == "jxvisible") {
                myplayer.play();
            } else if (e.data == "jxnotvisible") {
                myplayer.pause();
            }
        })

        window.addEventListener("resize", function() {
            var ratio = document.body.offsetWidth / playerOpt.width,
            newH = playerOpt.height*ratio;

            jxContainer.style.height = newH + 'px';

            var msg = 'jxmsg::' + JSON.stringify({'type': 'jxsize',params: {'height': newH}});

            parent.postMessage(msg, '*');
        })
    }
}

// function for append css style to the element
function acss(c,r){
    c.sheet.insertRule(r);
}


// function for create new div element
/*
function newDiv(p, t, h, c, id){
    var nd = document.createElement(t);
    if (h && h != '') nd.innerHTML = h;
    if (c && c!='') nd.className = c;
    if (id) nd.id = id;
    p.appendChild(nd);
    return nd;
}
*/

//PLEASE SEE THE COMMENTS AT THE TOP OF THIS FILE!!!    
////////firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);