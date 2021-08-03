
// Setting the div elements of the HTML file
var videoContent = document.getElementById('contentElement');
var mainContainer = document.getElementById('mainContainer');
var adContainer = document.getElementById('adContainer');
var content = document.getElementById('content');
var imageContainer = document.getElementById('startEndImg');

// Creating the Ad request URL
var params = getUrlParams();
var srcUrl = 'https://ad.jixie.io/v1/video';
if (params.debug) srcUrl = 'https://ad-rc.jixie.io/v1/video';

var paramsUrl = ["source=outstream"];
if (params.domain) paramsUrl.push('domain=' + params.domain);
if (params.unit) paramsUrl.push('unit=' + params.unit);
if (params.pageurl) paramsUrl.push('pageurl=' + params.pageurl);
if (params.country) paramsUrl.push('country=' + params.country);
if (params.device) paramsUrl.push('device=' + params.device);
if (params.clicktracker) paramsUrl.push('clicktracker=' + params.clicktracker);
if (params.creativeid) paramsUrl.push('creativeid=' + params.creativeid);

if (paramsUrl.length > 0) srcUrl += '?' + paramsUrl.join('&');

//console.log("Call to ad-server " + srcUrl);

// retrieving the default image if there is one. We display it while the video loads
//params.defaultImage = "./640x360.png";
if (params.defaultImage){
  imageContainer.innerHTML = '<img src="' + params.defaultImage + '" width="640px" height="360"/>';
  imageContainer.style.display = "block";
} 

//console.log(JSON.stringify(params));

// Additional useful variables
var toload = false;
var hasad = false;
var isPaused = false;

// Creating an ad container
var adVideoContainer = new google.ima.AdDisplayContainer(adContainer, videoContent);
// Re-use this AdsLoader instance for the entire lifecycle of your page.
var adsLoader = new google.ima.AdsLoader(adVideoContainer);

// Add event listeners
adsLoader.addEventListener(
    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
    onAdsManagerLoaded,
    false);
adsLoader.addEventListener(
    google.ima.AdErrorEvent.Type.AD_ERROR,
    onAdError,
    false);


// An event listener to tell the SDK that our content video
// is completed so the SDK can play any post-roll ads.
var contentEndedListener = function() {
                            adsLoader.contentComplete();
                          };

//NOVID: videoContent.onended = contentEndedListener;

// Create the request for the ad
var adsRequest = new google.ima.AdsRequest();
adsRequest.adTagUrl = srcUrl;

// Specify the linear and nonlinear slot sizes. This helps the SDK to
// select the correct creative if multiple are returned.
adsRequest.linearAdSlotWidth = 640;
adsRequest.linearAdSlotHeight = 400;
videoContent.volume = 0;
videoContent.muted = true;
adsRequest.setAdWillAutoPlay(true);
adsRequest.setAdWillPlayMuted(true);

// Make the request itself
////console.log('ima bridge: we call the ad server');
if (!hasad) adsLoader.requestAds(adsRequest); // checking if we can get an ad

function requestAds() {
	if (typeof adsManager !== 'undefined'){
		  toload = false;

		  // Must be done as the result of a user action on mobile
		  adVideoContainer.initialize();

	    // Call start to show ads. Single video and overlay ads will
	    // start at this time; this call will be ignored for ad rules, as ad rules
	    // ads start when the adsManager is initialized.
	    adsManager.start();		
	    //console.log('ima bridge: we try to start the ad');
	}
}

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  // Get the ads manager.
//NOVID:  adsManager = adsManagerLoadedEvent.getAdsManager(
//NOVID      videoContent);  // See API reference for contentPlayback
  var adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsRenderingSettings.enablePreloading = true;


  adsManager = adsManagerLoadedEvent.getAdsManager(videoContent);

  // Add listeners to the required events.
  adsManager.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
      onContentPauseRequested);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
      onContentResumeRequested);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.STARTED,
      onAdEvent);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.COMPLETE,
      onAdEvent);

  try {
    // Initialize the ads manager. Ad rules playlist will start at this time.
    adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
    //console.log('ima bridge: after init adsmanager, we send a message to the top window');
	// We send a message to the top window (parent of the iFrame)
  	parent.postMessage('jxhasad', '*');
    hasad = true;

    if (toload) requestAds();
  } catch (adError) {
    // An error may be thrown if there was a problem with the VAST response.
  }
}

function onContentPauseRequested() {
}

function onContentResumeRequested() {
}

function onAdEvent(adEvent) {
  // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
  // don't have ad object associated.
  var ad = adEvent.getAd();
  switch (adEvent.type) {
    case google.ima.AdEvent.Type.STARTED:
      imageContainer.style.display = "none";
      // This event indicates the ad has started - the video player
      // can adjust the UI, for example display a pause button and
      // remaining time.
      if (ad.isLinear()) {
        // For a linear ad, a timer can be started to poll for
        // the remaining time. We pause the ad before the end if there is
        // no default image. 
        /*
        if (!params.defaultImage){
          var intervalTimer = setInterval(
              function() {
                var remainingTime = adsManager.getRemainingTime();
                 if (parseInt(remainingTime) == 0 || parseFloat(remainingTime) < 1){
                  adsManager.pause();
                  clearInterval(intervalTimer);
                 //console.log('remaining time is ' + parseInt(remainingTime));
               }
              },
              300); // every 300ms          
        }*/
      }
      break;
    case google.ima.AdEvent.Type.COMPLETE:
        if (params.defaultImage) imageContainer.style.display = "block";
        else parent.postMessage('jxadended', '*');
        contentEndedListener();
  }
}

function onAdError(adErrorEvent) {
    // Handle the error logging and destroy the AdsManager
    //console.log(adErrorEvent.getError());

    // We send a message to the top window (parent of the iFrame)
    parent.postMessage('jxnoad', '*');

    // Need to fire an error VAST empty (303)
    if (params.defaultImage) imageContainer.style.display = "block";
}


// Function to listen to the messages from the parent of the iFrame
window.onmessage = function(e){
    if (e.data == 'jxvisible') {
        //console.log('ima bridge: visible message received');
        toload = true;
        if (isPaused){
          adsManager.resume();
          isPaused = false;
        }
        else requestAds();
        // Need to check that if it was already there, then we resume
    }else if (e.data == 'jxnotvisible'){ // There is an ad waiting to be played
      //console.log('ima bridge: the ad is no more visible, we pause it');
      if (typeof adsManager !== 'undefined'){
        adsManager.pause();
        isPaused = true;
      } 
    }
};



function getUrlParams() {
    var params = {};
    var dirtyVars = window.location.href.match(/(\?|\&)([^=]+)\=([^&]+)/gi);
    if (dirtyVars && dirtyVars.length > 0) {
        dirtyVars.forEach(function(candidate, index) {
        var pair = candidate.replace(/[&\\?]/, '').split('=');
        params[pair[ 0]] = pair[ 1];
        });
    }
    return params;
}

