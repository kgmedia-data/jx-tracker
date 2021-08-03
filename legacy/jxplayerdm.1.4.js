/*
 * This script is used to integrate a "naked" dailymotion player, directly in the universal unit (without any additional formating)
* The arguments of the script are:
 * - creative*: a base64 encoded object containing the tracker information
 * - pageurl*: the page URL
 * - domain*: the domain of the page
 * - pagetitle*: the title of the page
 * - pagekeywords: the keywords of the page
 * - clicktracker: the tracker for clicks
 * - debug: 1 if it is in debug mode
 *
 * The parameters are set by the outstream script. As of today, only the parameters noted with * are used.
 */


// Configuration
var jxContainer = document.getElementById("jxOutstreamContainer");
var creative = null, pageurl = null, domain = null, pagetitle = null;


//console.log("Current script URL " + document.currentScript.src);
var parentScript = document.currentScript.src;
var search = parentScript.split('?');
if (search.length > 1) search = search[1];
else search = '';

// Inserting IVS integration script
var tag = document.createElement('script');
//tag.src = 'https://jx-creatives.s3-ap-southeast-1.amazonaws.com/universal-ad-unit/js/jxdmplayer.1.4.js?' + search;
tag.src = 'https://universal.jixie.io/js/jxdmplayer.1.4.min.js?' + search;
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Main code which will check first that we have a jxContainer ready to get the content
function onDMPlayerReady(){
    if (!jxContainer) console.log("Error, there is no container named jxOutstreamContainer");
    else{
        // We retieve the parameters of the script
        //console.log("Current script URL " + document.currentScript.src);
        var urlParams = jxutil.getUrlParams(parentScript);
        creative = urlParams.creative || null; // trackers to call
        pagetitle = urlParams.pagetitle || null; // eventual page title
        try {
            if (creative){
                creative = JSON.parse(atob(creative));
            }
            if (pagetitle){
                pagetitle = atob(pagetitle);   
            }
        }catch (e){
            console.log("JX - Error while loading the trackers");
        }
        
        if (urlParams.pageurl) pageurl = urlParams.pageurl;
        if (urlParams.domain) domain = urlParams.domain;

        if (creative.adparameters){
            // We create the main div which will contain the header, player, title and so on
            var playerDiv = jxutil.newDiv(jxContainer, 'div', '', null, 'player');

            // creating the IVS player
            var options = {
                trackers: creative.trackers,
                container: jxContainer,
                player: playerDiv,
                pagetitle: pagetitle,
                pageurl: pageurl,
                domain: "https://" + domain,
                callbackready: callbackReady,
                adparameters: creative.adparameters,
              };

            //console.log("Start DM options: " + JSON.stringify(options));
            window.jxdm.jxstartDM(options);

            // Some resizing stuff
            jxutil.onWindowResize(null);

            // Adding a listener in case of resizing of the page (for desktop)
            jxutil.addListener(window, 'resize', jxutil.onWindowResize);

        }else{ // end of if there is the IVS parameters, and error in the log otherwise
            console.log("JX - Parameter missing for Dailymotion player");
        }
    } // end of if there is the right container 
} // End of the function called after IVS integration script is fully loaded (onIVSPlayerReady)

// Function fired when the user clicks on a link
function onLinkClick(){
    jxutil.fire('click','link');
}

// Function called when the video player is ready
function callbackReady(data){
}

