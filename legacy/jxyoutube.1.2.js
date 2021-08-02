//if not supplied by caller layer
 const defaultIMA_ = false;
 const defaultWithThumbnail_ = false;
 const defaultAutoplay_ = false;
 const defaultWifiOnly_ = true;
 const defaultIsWifi_ = false;

/*******************************************************************************************************************
 *
 *                                    UTILITIES FUNCTION USED FOR YOUTUBE API
 *
 *******************************************************************************************************************/

// additional variables for indicating if the autoplay has been restricted by browser (it means the autoplay won't work even if we set the YT to autoplay the video).
// it because user decided to block all autoplay media from their browser.

// below variables will be used when the ustarted event YT (-1) triggered more than once a time,
// it means that the video is about to start with autoplay but browser rejected it and YT player's state call the unstarted event again.
// so in this case, user have to click on the play button to start the video.

var isAutoPlayPrevented = false; // indicates if the autoplay is prevented or not
var unStartedCount = 0; // indicates if the unstarted event has been called more than once

// Callback function will be called when the YouTube Iframe API is ready
function onYouTubeIframeAPIReady() {
	window.jxyt.playerYT = new YT.Player('player', {
		height: "100%",
		width: "100%",
        videoId: window.jxyt.videoID,
        playerVars: { 'playsinline': 1 },
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange,
			'onError': onPlayerError
		}
	});
}

// Callback function will be called when the YouTube player is ready
function onPlayerReady(event) {
    // send jxhasad message to parent for triggering the intersection observer
    if (!window.jxyt.hasAdFired) {
        parent.postMessage('jxhasad', '*')
        window.jxyt.hasAdFired = true;
    }
    window.jxyt.playerYTReady = true;
    if ((window.jxyt.withThumbnail && jxutil.isIOS()) || (jxutil.isIOS() && window.jxyt.pAuto)) event.target.mute();
    if (!window.jxyt.pAuto) event.target.unMute();

    if (!window.jxyt.contentDiv.classList.contains('hide')) window.jxyt.contentDiv.classList.add('hide');
    if (window.jxyt.spinnerDiv) window.jxyt.spinnerDiv.style.display = "none";

    // var e = new Event('jxhasad');
    // window.dispatchEvent(e);
}

// Callback function will be called when the YouTube player state is changed
function onPlayerStateChange(event) {
	if (event.data == 0) {
        if (!window.jxyt.playerYTLooped && !window.jxyt.playerYTCompleted) jxutil.fireEvent('complete')
        if (!window.jxyt.loop) {
            window.jxyt.playerYTCompleted = true;
        } else {
            if ((window.jxyt.withThumbnail && jxutil.isIOS()) || (jxutil.isIOS() && window.jxyt.pAuto)) event.target.mute();
            window.jxyt.playerYT.playVideo();
            window.jxyt.playerYTLooped = true;
        }
    } else if (event.data == -1) {
        unStartedCount += 1;
        if (unStartedCount > 1) isAutoPlayPrevented = true;
    } else if (event.data == 1) {
        if (!window.jxyt.playerYTCompleted) {
            if (!window.jxyt.playerYTPlayed) {
                if (!window.jxyt.pHasPlayed) window.jxyt.pHasPlayed = true;
                if (!window.jxyt.isIMA && !window.jxyt.withThumbnail) {
                    if (!window.jxyt.clickFired) {
                        if (!window.jxyt.pAuto) jxutil.fireEvent('click', 'play');
                        else {
                            if (isAutoPlayPrevented) jxutil.fireEvent('click', 'play');
                            else jxutil.fireEvent('click', 'autoplay');
                        }
                        window.jxyt.clickFired = true;
                    }
                }

                jxutil.fireEvent('start');
                window.jxyt.playerYTPlayed = true;

            } else {
                if (!window.jxyt.playerYTLooped) jxutil.fireEvent('resume');
            }
        }
        var intervalTimer = setInterval(
            function() {
                if ((window.jxyt.playerYT.getCurrentTime() > 2)&&(window.jxyt.progress == 0)){
                    jxutil.fireEvent('impression')
                    window.jxyt.progress+=1;
                }
                var pctViewed = window.jxyt.playerYT.getCurrentTime() / window.jxyt.playerYT.getDuration();
                if ((pctViewed > 0.25)&&(window.jxyt.progress == 1)){
                    jxutil.fireEvent('firstQuartile')
                    window.jxyt.progress+=1
                }
                if ((pctViewed > 0.5)&&(window.jxyt.progress == 2)){
                    jxutil.fireEvent('midpoint')
                    window.jxyt.progress+=1
                }
                if ((pctViewed > 0.75)&&(window.jxyt.progress == 3)){
                    jxutil.fireEvent('thirdQuartile')
                    window.jxyt.progress+=1
                }
        }, 1000);
    } else if (event.data == 2) {
        if (!window.jxyt.playerYTCompleted && !window.jxyt.playerYTLooped) {
            jxutil.fireEvent('pause');
        }
    }
}

// Callback function will be called when the YouTube player is error
function onPlayerError(event){
    var e = new Event('jxytError');
    window.dispatchEvent(e);
}

/*******************************************************************************************************************
 *
 *                                    UTILITIES FUNCTION USED IN MOST OF THE SCRIPTS
 *
 *******************************************************************************************************************/


// function for generating thumbnail
function generateThumbnail(thumbnailURL, videoID) {
    var ihml;
    if (thumbnailURL) { // if there is a thumbnail from response, then we create the thumbnail based on it
        ihml = '<img src="'+thumbnailURL+'" style="width: 100%; height: 100%"></img>';
    } else { // if there is no thumbnail, then we get it from the https://i.ytimg.com/vi/videoID/resolution.jpg
        ihml = '<img src="https://i.ytimg.com/vi/'+videoID+'/mqdefault.jpg" style="width: 100%; height: 100%"></img>';
    }
    return ihml;
}

var jxutil = {
    // Function to create a new div: parent is the parent, type is the type of element, html is the content of the element if any, className is the list of classes (separated with spaces)
    // Parameters: p parent, t type, h html, c class name, id
    newDiv: function(p, t, h, c, id){
        var nd = document.createElement(t);
        if (h && h != '') nd.innerHTML = h;
        if (c && c!='') nd.className = c;
        if (id) nd.id = id;
        p.appendChild(nd);
        return nd;
    },
  
    // Insert a new CSS rule to a CSS style to a style element c and a rule r
    acss: function(c,r){
        c.sheet.insertRule(r);
    },
  
    // Add a listener of the event to the element e which calls the function handler h
    addListener: function(e, event, h) {
        if (e.addEventListener) {
            //console.log('adding event listener');
            e.addEventListener(event, h, false);
        } else if (e.attachEvent) {
            e.attachEvent('on' + event, h);
        } else {
            e[ 'on' + event] = h;
        }
    },

    // function for fired the events tracking
    fireEvent: function(e, t){
        var urlToCall = window.jxyt.eventURL + "&action=" + e;
        if (e == "click" && t) urlToCall += "&clickid=" + t
        var xmlhttp;
        if (window.XMLHttpRequest) xmlhttp = new XMLHttpRequest();
        else xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        //console.log(urlToCall);
        xmlhttp.open('GET', urlToCall, true);
        xmlhttp.withCredentials = true;
        xmlhttp.crossDomain = true;
        xmlhttp.send();
    },

    // function for get current user's OS to check if user using IOS or not, for handling an autoplay issue in IOS
    isIOS: function() {
        return navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
    }
  
  };
  
  /*******************************************************************************************************************
   *
   *                                    DECLARATION OF THE SDK - OBJECT JXYT
   *
   *******************************************************************************************************************/
  
  /*
   *
   * This script will do the following:
   * 1- Display the specified thumbnail graphic (and wait for the user to click on it)
   * 2- when user clicks, play an ad  (this ad playing is to be enabled by using the Google IMA SDK) - What ad tag to call is  in the input.
   * 3- when the ad playing ends (natural, skipped or error-ed out), show and start the YouTube player to play the specified video
   * 
   * Short documentation:
   * 1- The SDK loads, and when fully loaded it will call the callback function provided.
   * 2- Build the query strings based on the parameters to call to the ad server if xmltag and adTag URL are not provided.
   * 3- If xmltag is provided, we use the xmltag as an adResponse.
   * 4- If the adTag URL is provided, then we passed the adTag URL to google IMA adRequest.adTagUrl
   * 5- If there is a thumbnail, we show the thumbnail first and wait for users to clicks on it. Otherwise it will autoplay the ad (or play the YouTube video directly if there is no ad).
   * 6- After the ad is ended or skipped or error-ed out, then we load the YouTube player to play the specified video
   * 
  
  
   * Play Pause button based on https://codepen.io/stevenfabre/pen/DvBei/
   * Speaker (mute) button based on https://codepen.io/MrStank/pen/NwXKQx
   */
  
  (function(w, d) {
      // check for run-once only
      if (window.jxyt) return;
  
      window.jxyt = {
          /**
           *
           * OPTIONS FOR THE NAKED VIDEO AD PLAYER
           *
           */
          ads: 'https://ad.jixie.io/v1/video', // base URL of the ad-server to retrieve a video ad
          rcads: 'https://ad-rc.jixie.io/v1/video', // base URL of the ad-server to retrieve a video ad
          devads: 'https://ad-dev.jixie.io/v1/video', // base URL of the ad-server to retrieve a video ad
          
          xmltag: null, // potential XML tag provided directly (no call to ad-server)
          source: "sdk", // default source
          domain: null, // Important for tracking, if cannot access the location of the page
          pageurl: null, // Important for tracking, if cannot access the location of the page
          unit: null, // Mandatory for ad call
          cid: null, // Forces the creative ID (if both creativeid and campaignid are provided, only creativeid will be considered)
          cpid: null, // Forces the campaign to select a creative from ((if both creativeid and campaignid are provided, only creativeid will be considered))
          dftImg: null, // URL to a default image to display while the video ad loads and after it finishes
          ckurl: null, // click URL on image
          head: null, // head variable for storing the head element
          style: null, // Style element

          /**
           *
           * OPTIONS FOR THE YOUTUBE PLAYER
           *
           */
       


          height: 0, // height of YouTube player
          width: 0, // width of YouTube player
          playerYT: null, // variable will contains YouTube player object
          videoID: null, // video id will be played by YouTube player
          loop: false, // Indicates if the YouTube video will be repeated
          progress: 0, // Indicates progress of the YouTube video for handling quartile events
          withThumbnail: false, // Indicates if we have a thumbnail
          thumbnail: null, // Thumbnail for video which will be showed before playing the ad
          playerYTReady: false, // Indicates if the YouTube player is ready
          playerYTPaused: false, // Indicates if the YouTube player is paused,
          playerYTPlayed: false, // Indicates if the youtube player has been played
          playerYTCompleted: false, // Indicates if the youtube player has completly played
          playerYTLooped: false, // Indicates if the youtube player has been looped
          isIMA: false, // Indicates if the there is an IMA to be loaded
          creativeInView: false, // Indicates if the youtube player is in view
          hiddenFired: false, // Indicates if the hidden event has been fired
          inViewFired: false, // Indicates if the in view event has been fired
          clickFired: false, // Indicates if the click event has been fired
  
          // Variables to control the behaviour of the player for ads
          isIMALoaded: false,
          isAdPaused: false, // Indicates if the ad is paused or not
          toload: false, // Indicates that the play function has been pressed, or any other play event, and then as soon as we have received the ad, we start to play
          hasad: false, // Indicates if there is a valid ad to play
          hasAdFired: false,
          adEnded: false, // Indicates if we ended the ad
          adSound: false, // Indicates if the ad has sound
  
          // Variables to keep the different div to consider
          // Setting the div elements of the HTML file
          playerElt:  null, // div which contains the player
          adDiv: null, // div which contains the ad (on top of the player, controled by Google IMA SDK)
          cDiv: null, // div which contains player controls displayed during the ad
          contentDiv: null, // div which is the main container of the player container
          startEndImg: null, // div which contains the start and end image
          spinnerDiv: null,
          pDiv: null, // the parent div (container div) provided by the user of the SDK
  
          // Variables used to manage IMA SDK
          adVideoContainer: null,
          adsLoader: null,
          adsRequest: null,
          adsManager: null,
  
          // Variables to manage the status of the player
          pAuto: false, // indicates if the player is autoplay
          pPaused: false, // indicates if the player is paused
          pHasPlayed: false, // indicates if a video already started to play
          cColor: "black", // color of the controls
          cStyle: null, // style of the controls
  
          t: null, // used for timer functions
  
          // Function called when the page is fully loaded - it is the initialisation function
          ready: function(){
              //console.log("JX- we create the style node");
              // Adding the stylesheet
              this.head = d.getElementsByTagName('HEAD')[0];  
              this.style = d.createElement('style');
              this.head.appendChild(this.style);
              
              // append the bootstrap css
              var link = document.createElement("link");
              link.rel = "stylesheet", link.type = "text/css", link.href = "https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css";
              this.head.appendChild(link);

              jxutil.acss(this.style,'.hide{display:none}');
              jxutil.acss(this.style,'#JXImage, #JXSpinner{display:none;}');
              // JXcontrols buttons added on top of the ad
              jxutil.acss(this.style,'.controls{height:32px;width:66px;margin-left:3px;position: absolute;bottom: 20px;left:5px;z-index:999;}');            
              
              // play button added on top of the thumbnail

              jxutil.acss(this.style,'.jxPlayBtn{position: absolute;margin: 0;text-align: center;top: 50%;left: 50%;transform: translate(-50%,-50%);box-sizing: border-box;display:block;width:80px;height:80px;padding-top: 14px;padding-left: 8px;line-height: 20px;border: 6px solid #fff;border-radius: 50%;color:#f5f5f5;text-align:center;text-decoration:none;background-color: rgba(0,0,0,0.5);font-size:20px;font-weight:bold;transition: all 0.3s ease;}')
              jxutil.acss(this.style, '.jxPlayBtn:hover {background-color: rgba(0,0,0,0.8);box-shadow: 0px 0px 10px rgba(255,255,100,1);text-shadow: 0px 0px 10px rgba(255,255,100,1);}')
              // spinner which will be showed when we load the YouTube Iframe API
              jxutil.acss(this.style, '.fa-spin{font-size:40px!important;margin:0;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}');

              if (typeof onJXPlayerReady === "function") {  // We check that there is the right existing function, otherwise no need to load the Dailymotion SDK
                var thisobj = this;
                onJXPlayerReady(
                    {
                        start: thisobj.start.bind(thisobj),
                        play: thisobj.playMaybe.bind(thisobj),
                        pause: thisobj.pauseMaybe.bind(thisobj)
                    }
                );
              }else{
                console.log("JX WARNING: no handler function onJXPlayerReady defined, please check integration documentation.");
              }
          },
  
          /*
           *
           * The following function is called when the IMA SDK is loaded. When the IMA SDK is loaded, we call the onJXPlayerReady function.
           *
           */
          imaSDKLoaded: function(){
              if (typeof onJXPlayerReady === "function") {  // We check that there is the right existing function, otherwise no need to load the Dailymotion SDK
                  onJXPlayerReady(this);
              }else{
                console.log("JX WARNING: no handler function onJXPlayerReady defined, please check integration documentation.");
              }
          },
  
          // Function to create the styleSheet for the controls
          changeControlsStylesColor: function(color){
              // Removing the previous stule, replacing by the new one
              if (this.cStyle) this.cStyle.remove();
              // Adding the stylesheet
              this.head = d.getElementsByTagName('HEAD')[0];  
              this.cStyle = d.createElement('style');
              var c = this.cStyle;
              this.head.appendChild(c);
              // JXcontrols buttons added on top of the ad
              jxutil.acss(c,'.controls{height:32px;width:66px;margin-left:3px;position: absolute;bottom: 20px;left:5px;z-index:999;}');            
              // Button play/pause CSS
              jxutil.acss(c,'.play {display: block;width: 0;height: 0;border-top: 10px solid transparent;border-bottom: 10px solid transparent;border-left: 12px solid '+this.cColor+';margin: 5px 0px 10px 0px;position: relative;z-index: 1;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;left: 10px;}');
              jxutil.acss(c,'.play:before {content: "";position: absolute;top: -15px;left: -23px;bottom: -15px;right: -7px;border-radius: 50%;border: 2px solid '+this.cColor+';z-index: 2;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;}');
              jxutil.acss(c,'.play:after {content: "";opacity: 0;transition: opacity 0.6s;-webkit-transition: opacity 0.6s;-moz-transition: opacity 0.6s;}');
              jxutil.acss(c,'.play:hover:before, .play:focus:before {transform: scale(1.1);-webkit-transform: scale(1.1);-moz-transform: scale(1.1);}');
              jxutil.acss(c,'.play.active {border-color: transparent;}');
              jxutil.acss(c,'.play.active:after {content: "";opacity: 1;width: 10px;height: 16px;position: absolute;left: -16px;top: -8px;border-color: '+this.cColor+'; border-style: double; border-width: 0px 0 0px 15px;}');
              // Button mute CSS
              jxutil.acss(c,'.speaker {height: 30px;width: 30px;position: relative;overflow: hidden;display: inline-block;}');
              jxutil.acss(c,'.speaker span {display: block;width: 8px;height: 8px;background: '+this.cColor+';margin: 11px 0 0 2px;}');
              jxutil.acss(c,'.speaker span:after {content: "";position: absolute;width: 0;height: 0;border-style: solid;border-color: transparent '+this.cColor+' transparent transparent;border-width: 10px 14px 10px 15px;left: -13px;top: 5px;}');
              jxutil.acss(c,'.speaker span:before {transform: rotate(45deg);border-radius: 0 50px 0 0;content: "";position: absolute;width: 5px;height: 5px;border-style: double;border-color: '+this.cColor+';border-width: 7px 7px 0 0;left: 18px;top: 9px;transition: all 0.2s ease-out;}');
              jxutil.acss(c,'.speaker:hover span:before {transform: scale(0.8) translate(-3px, 0) rotate(42deg);}');
              jxutil.acss(c,'.speaker.mute span:before {transform: scale(0.5) translate(-15px, 0) rotate(36deg);opacity: 0;}');
          },
  
          /**
           *
           * Main function used to start the player
           *
           */
           start: function(p){
              //   console.log("Start function called");
              // retrieving the parameters of the call
              if (p.container) this.pDiv = document.getElementById(p.container);
              else{
                  if (!this.pDiv){
                    console.log("JX - WARNING: no div to attach the player provided, we cancel the call");
                    return false;                  
                  }
              }
  
              if (!this.pDiv){
                  console.log("JX - WARNING: div to attach the content not found, we cancel the call");
                  return false;                
              }

             //this is the div to give to the YOUTUBE API: 
            let wrapper = jxutil.newDiv(this.pDiv, 'div', '', '', 'player');
            wrapper.style.cssText = "position: absolute; top: 0; left: 0;"
    
            //if the information is supplied, then we use, else we still have our defaults.
            let ima_ = defaultIMA_; 
            let withthumbnail_ = defaultWithThumbnail_; 
            let autoplay_ = defaultAutoplay_; 
            let wifionly_ = defaultWifiOnly_; 
            let isWifi_ = defaultIsWifi_; 

            if (p.ima != undefined) ima_ = p.ima;
            if (p.autoplay != undefined) autoplay_ = p.autoplay;
            if (p.withthumbnail != undefined) withthumbnail_ = p.withthumbnail;
            if (p.wifionly != undefined) wifionly_ = p.wifionly;
            if (p.iswifi != undefined) isWifi_ = p.iswifi;
              
            this.pAuto = (autoplay_ > 0 && !wifionly_ || autoplay_ > 0 && wifionly_ && isWifi_);
            this.withThumbnail = (withthumbnail_ && !this.pAuto);
            this.isIMA = (ima_ && !this.pAuto && this.withThumbnail);
            
              // Retrieving the different ad parameters
              if (p.source) this.source = p.source; else p.source = 'sdk';
              if (p.domain) this.domain = p.domain;
              if (p.pageurl) this.pageurl = p.pageurl;
              if (p.unit) this.unit = p.unit;
              if (p.creativeid) this.cid = p.creativeid;
              if (p.campaignid) this.cpid = p.campaignid;
              if (p.clickUrl) this.ckurl = p.clickUrl;
              
              if (p.xmltag) this.xmltag = p.xmltag;
              if (p.debug) this.ads = this.rcads;
              if (p.portal == 'dev') this.ads = this.devads;
              
              if (p.controlsColor) this.cColor = p.controlsColor;

              if (p.width) this.width = p.width;
              if (p.height) this.height = p.height;
              
              if (p.eventURL) this.eventURL = p.eventURL;
              if (p.videoID) this.videoID = p.videoID;
              this.thumbnail = generateThumbnail(p.thumbnail, this.videoID);
    
              if (p.loop) this.loop = p.loop;

              // set the content div if we never set it before
              if (!this.contentDiv){
                if (jxutil.isIOS())
                    this.contentDiv = jxutil.newDiv(this.pDiv,'div','<video id="JXPlayer" playsinline muted></video>','',"JXContent"); // DEBUG
                else
                    this.contentDiv = jxutil.newDiv(this.pDiv,'div','<video id="JXPlayer" playsinline></video>','',"JXContent"); // DEBUG
              }

              // set the spinner div (div will contains spinner) if we never set it before
              if (!this.spinnerDiv) {
                var spinhtml = '<i class="fa fa-circle-o-notch fa-spin"></i>'
                this.spinnerDiv = jxutil.newDiv(this.contentDiv,'div',spinhtml,'',"JXSpinner");
              }

              // set the AdDiv, ContentDiv, JXImage and JXPlayer width and height dynamic based on the ad server's response
              jxutil.acss(this.style,'#JXAdDiv,#JXContent,#JXImage,#JXPlayer{position: absolute;top: 0px;left: 0px;height: 100%;max-width: 100%;width: 100%;}');

              // add event listener for listening message coming from window
              jxutil.addListener(window, 'message', function(e) {
                if (e.data == 'jxvisible') { // if it is visible
                    if (!window.jxyt.creativeInView) { // if the creativeInView is still false
                        if (!window.jxyt.inViewFired) { // if the inViewFIred is still false then we dispatch the creativeView event
                            jxutil.fireEvent('creativeView');
                            window.jxyt.inViewFired = true; // set the inViewFired to true to make sure that we fire the event just once a time
                        }
                        window.jxyt.creativeInView = true; // set the creativeInView to true 
                    }
                } else if (e.data == 'jxnotvisible') { // if it is not visible
                    if (window.jxyt.creativeInView) { // if the creativeInView is true
                        if (!window.jxyt.hiddenFired) { // and if the hiddenFired is false (the creativeHide is never fired before) then we dispatch the creativeHide event
                            jxutil.fireEvent('creativeHide')
                            window.jxyt.hiddenFired = true; // and set the hiddenFired to true to make sure that we fire the event just once a time
                        }
                        window.jxyt.creativeInView = false; // set the creativeInView to false as the player is not visible in viewport
                    }
                }
              })

              if (this.isIMA) { // if it is IMA
                // We create the main divs
                //console.log("Creating div");
                this.createAdContainer();

                if (!this.pAuto && this.withThumbnail){ // Adding the thumbnail if there is one and if the autoplay is false
                    this.createThumbnail();
                } else { // otherwise we load the IMA SDK
                    this.loadIMASDK();
                }

                // We create the player
                if (!this.playerElt) this.playerElt = document.getElementById('JXPlayer');
              } else { // if it is not IMA

                if (!this.withThumbnail) {
                    if (!this.contentDiv.classList.contains('hide')) this.contentDiv.classList.add('hide');
                }
                if (!this.pAuto && this.withThumbnail){ // and if there is a thumbnail and the autoplay is false, then we create the thumbnail
                    this.createThumbnail();
                } else { // otherwise we load the youtube iframe API
                    this.createYTIframe();
                }
              }
           },

           createAdContainer: function() {
                if (!this.adDiv){
                    this.adDiv = jxutil.newDiv(this.pDiv,'div','','',"JXAdDiv"); // Div which will contain the ads
                    this.adDiv.classList.add("hide");
                    var controlDiv = '<div style="float:left; width:30px;"><a href="#" id="btnplay" title="Play video" class="play active"></a></div><div style="float:left; width:30px;margin-left:3px;"><a href="#" id="btnmute" class="speaker"><span></span></a></div>';
                    this.cDiv = jxutil.newDiv(this.pDiv,'div',controlDiv,'controls',"JXControls"); // Div which will contain the controls button
                    this.cDiv.classList.add("hide");

                    this.btp = document.getElementById('btnplay');
                    this.btp.addEventListener('click', this.onClickPlayAd);
                    this.btm = document.getElementById('btnmute');
                    this.btm.addEventListener('click', this.onClickMuteAd);
                    
                    // change the color of controls button if there is a controlsColor option
                    this.changeControlsStylesColor(this.cColor);
                }
                // We create the player
                if (!this.playerElt) this.playerElt = document.getElementById('JXPlayer');

                // add event listener for listening resize event in current window
                jxutil.addListener(window, "resize", this.onWindowResize);
           },

           loadIMASDK: function() {
                // show the spinner while load IMA SDK
                if (this.spinnerDiv) this.spinnerDiv.style.display = "block";

                // Inserting GOOGLE IMA script
                var tag = d.createElement('script');
                var fst = d.getElementsByTagName('script')[0];
                fst.parentNode.insertBefore(tag, fst);
                tag.onload = function(){window.jxyt.setIMASDK();};
                tag.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';

                // Building the querystring to the ad server
                if (!this.xmltag){
                    if (this.tag) this.ads = this.tag;
                    else{
                    var paramsUrl = ["source=" + this.source];
                    if (this.domain) paramsUrl.push('domain=' + this.domain);
                    if (this.unit) paramsUrl.push('unit=' + this.unit);
                    if (this.pageurl) paramsUrl.push('pageurl=' + this.pageurl);
                    if (this.cid) paramsUrl.push('creativeid=' + this.cid);
                    if (this.cpid) paramsUrl.push('campaignid=' + this.cpid);

                    if (paramsUrl.length > 0) this.ads += '?' + paramsUrl.join('&');                
                    }

                }

                // console.log("Call to ad-server " + this.ads);
           },

           setIMASDK: function() {
                this.isIMALoaded = true;
                // hide the spinner
                if (this.spinnerDiv) this.spinnerDiv.style.display = "none";

                // Setting the Google IMA stuff
                // Creating an ad container
                //console.log("Setting Google IMA container");
                if (!this.adVideoContainer) this.adVideoContainer = new google.ima.AdDisplayContainer(this.adDiv, this.playerElt);
                // Re-use this AdsLoader instance for the entire lifecycle of your page.
                //console.log("Setting Google IMA adsLoader");
                if (!this.adsLoader){
                    this.adsLoader = new google.ima.AdsLoader(this.adVideoContainer);

                    // Add event listeners to the adLoader: will be called if there is an ad loaded after calling the ad-server
                    this.adsLoader.addEventListener(
                        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
                        this.onAdsManagerLoaded,
                        false);
                    // Add event listeners to the adLoader: will be called if there is an error
                    this.adsLoader.addEventListener(
                        google.ima.AdErrorEvent.Type.AD_ERROR,
                        this.onAdError,
                        false);
                }

                // Create the request for the ad
                //console.log("Setting Google IMA AdsRequest");
                if (!this.adsRequest){
                    this.adsRequest = new google.ima.AdsRequest();
                    if (this.xmltag)
                        this.adsRequest.adsResponse = this.xmltag;
                    else
                        this.adsRequest.adTagUrl = this.ads;
                }

                // Specify the linear and nonlinear slot sizes. This helps the SDK to
                // select the correct creative if multiple are returned.
                this.adsRequest.linearAdSlotWidth = 640;
                this.adsRequest.linearAdSlotHeight = 400;

                // Managing the autoplay part --> need to update to get the volume and so on management TODO: if already played something and player volume > 0 then not muted
                if (this.pAuto && !this.playerYTReady && !this.adSound){
                    this.playerElt.volume = 0;
                    this.playerElt.muted = true;
                    this.adsRequest.setAdWillAutoPlay(true);
                    this.adsRequest.setAdWillPlayMuted(true);              
                }

                // Make the request itself now that everything has been setup (only if there is no existing ad of course)
                //console.log('ima bridge: we call the ad server');

                if (!this.hasad) {
                    // fire the adslot event when there is an opportunity to play an ad.
                    jxutil.fireEvent('adslot');
                    this.adsLoader.requestAds(this.adsRequest); // checking if we can get an ad
                }

                // Now everything has been setup. We wait for the ad loader to do its stuff and it will call onAdsManagerLoaded when ready to play an ad
           },

           createYTIframe: function() {
               // show the spinner while we load the youtube iframe API
               if (this.spinnerDiv) this.spinnerDiv.style.display = "block";

               // Inserting youtube iframe API script
               var tag = document.createElement('script');
               tag.id = 'iframe-demo';
               tag.src = 'https://www.youtube.com/iframe_api';
               var firstScriptTag = document.getElementsByTagName('script')[0];
               firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
           },

           // function for create the thumbnail
           createThumbnail: function() {
                if (this.thumbnail) {
                    // append play button to thumbnail
                    var thumbnailWithPlayBtn = this.thumbnail + '<a href="#" title="Play Video" onclick="window.jxyt.onPlayBtnClicked(event);" class="jxPlayBtn"><i class="fa fa-play fa-2x"></i></a>';
                    // append to the div and show the div
                    this.startEndImg = jxutil.newDiv(this.contentDiv,'div',thumbnailWithPlayBtn,'',"JXImage");
                    this.startEndImg.style.display = "block";

                    // send jxhasad message to parent for triggering the intersection observer
                    if (!this.hasAdFired) {
                        parent.postMessage('jxhasad', '*')
                        this.hasAdFired = true;
                    }
                }
           },
  
          /**
           *
           * PUBLIC FUNCTIONS EXPOSED
           *
           */
          play: function(){
            window.jxyt.toload = true;
            if (this.pPaused) this.pPaused = false;
            if (this.isAdPaused){
                this.adsManager.resume();
                this.isAdPaused = false;
                // add active class for make the button show the pause icon after we resume the ads
                window.jxyt.btp.classList.add('active');
            }
            else this.requestAds();
          },
  
          pause: function(){
            if (window.jxyt.hasad && !window.jxyt.isAdPaused){
            window.jxyt.adsManager.pause();
            window.jxyt.isAdPaused = true;
            window.jxyt.btp.classList.remove('active');
            }

            if (window.jxyt.playerYTReady){ // if the youtube player is ready
            // we pause the YouTube player
            window.jxyt.playerYT.pauseVideo();
            window.jxyt.playerYTPaused = true;
            }
            this.pPaused = true;
          },

          
          playMaybe: function() {
            if (this.pAuto) {
                if (this.pHasPlayed && this.pPaused) {
                    this.play();
                    this.pPaused = false;
                } else {
                    this.play();
                }
            } else {
                if (this.pHasPlayed && this.pPaused) {
                    this.play();
                    this.pPaused = false;
                }
            }
          },

          pauseMaybe: function() {
            if (this.pHasPlayed && !this.pPaused) {
                this.pause();
                this.pPaused = true;
            }
          },

          hasPlayed: function() {
            return this.pHasPlayed;
          },

          isPaused: function() {
            return this.pPaused;
          },

          // function called when we click on play button in thumbnail, then we load the IMA SDK
          // so the IMA SDK will not be loaded yet before user click on play button
          // and if user clicked on play button, then we load the IMA SDK
          onPlayBtnClicked: function(e) {
            e.preventDefault();
            // fire the click to play event
            if (!this.clickFired) {
                jxutil.fireEvent('click', 'play');
                this.clickFired = true;
            }

            this.startEndImg.style.display = "none"; // hide the thumbnail div
            if (!this.isIMALoaded && this.isIMA) {// if the IMA SDK has not been loaded yet and it is the IMA
                this.loadIMASDK(); // then we load the IMA SDK

                var interval = window.setInterval(function() {
                    if (window.jxyt.hasad) { // if there is an ad
                        window.clearInterval(interval);
                        window.jxyt.play(); // then we play the ad
                    }
                }, 100)
            } else { // if it is not IMA then we play the youtube player
                this.play();
            }
          },
  
          rewind: function(){
              this.playerElt.currentTime = 0;
          },

          onLinkClick: function(){
            jxutil.fireEvent('click','link');
          },
  
          // This function is called when calling the play function of the object
          requestAds: function() {
            if (this.hasad && this.adsManager){
                this.toload = false;
  
                // remove the hide class from the element before playing the ads, for fixing the issue in hotspot with HTML
                if (window.jxyt.startEndImg) window.jxyt.startEndImg.style.display = "none";
                if (window.jxyt.adDiv.classList.contains("hide")) window.jxyt.adDiv.classList.remove("hide");
                if (window.jxyt.cDiv.classList.contains("hide")) window.jxyt.cDiv.classList.remove("hide");
  
                // Must be done as the result of a user action on mobile
                this.adVideoContainer.initialize();
  
                // Call start to show ads. Single video and overlay ads will
                // start at this time; this call will be ignored for ad rules, as ad rules
                // ads start when the adsManager is initialized.
                this.adsManager.start();
                //console.log('ima bridge: we try to start the ad');
            }else{
                // play the YouTube player if the autoplay is true and the youtube player is ready
                // or if the player youtube has been played
                if ((this.playerYTReady && this.pAuto && !this.playerYTCompleted)) {
                    if (this.pAuto && !this.playerYTPlayed) this.playerYT.setVolume(0);
                    if (this.playerYTPlayed) {
                        if (this.playerYT.getVolume() < 1) this.playerYT.setVolume(0)
                    }
                    this.playerYT.playVideo();
                }
                else { // if the youtube player is not ready yet then we hide the thumbnail and load the youtube iframe API
                    if (this.startEndImg) this.startEndImg.style.display = "none";
                    if (!this.playerYTReady) {
                        this.createYTIframe();
                        var interval = window.setInterval(function() {
                            if (window.jxyt.playerYTReady) {
                                window.clearInterval(interval);
                                if (window.jxyt.pAuto) window.jxyt.playerYT.setVolume(0);
                                else {
                                    window.jxyt.playerYT.unMute();
                                    window.jxyt.playerYT.setVolume(50);
                                    window.jxyt.playerYT.getVolume()
                                }
                                window.jxyt.playerYT.playVideo();
                            }
                        }, 100)
                    } else {
                        if (!this.playerYTCompleted) {
                            if (!this.contentDiv.classList.contains('hide')) this.contentDiv.classList.add('hide');
                            this.playerYT.playVideo();
                        }
                    }
                }
            }
          },
  
          /*
           * EVENT FUNCTIONS
           *
           */
          // Function executed when there an ad error. In that case sends a message indicating there is no ad
          onAdError: function(adErrorEvent) {
              // Handle the error logging and destroy the AdsManager
              // We send a message to the top window (parent of the iFrame) and an event in the window
              var e = new Event('jxnoad');
              window.dispatchEvent(e);
  
              // Need to fire an error VAST empty (303)
  
              // We hide the content div and display the after ad content
              window.jxyt.contentDiv.classList.add("hide");
              window.jxyt.afterAdContent();
          },
  
          // function used to load the YouTube Iframe API after ad has ended or ad is error-ed out
          afterAdContent: function(){
            if (!this.contentDiv.classList.contains('hide')) this.contentDiv.classList.add('hide');
            this.createYTIframe(); // load the youtube iframe API
            var inter = window.setInterval(function() { // check it using interval
                if (window.jxyt.playerYTReady) { // if the youtube player is ready
                    window.clearInterval(inter); // then we clear the interval and play the youtube player
                    if (jxutil.isIOS()) window.jxyt.playerYT.mute();
                    
                    // fired the autoplay event
                    if (!window.jxyt.clickFired) {
                        jxutil.fireEvent('click', 'autoplay');
                        window.jxyt.clickFired = true;
                    }
                    window.jxyt.playerYT.playVideo();
                }
            })
          },

          // Function called when the ads manager is fully loaded (ad request done)
          onAdsManagerLoaded: function(adsManagerLoadedEvent) {
              // Get the ads manager.
            //   console.log("onAdsManagerLoaded");
              var adsRenderingSettings = new google.ima.AdsRenderingSettings();
              adsRenderingSettings.enablePreloading = true;
  
  
              window.jxyt.adsManager = adsManagerLoadedEvent.getAdsManager(window.jxyt.playerElt);
  
              // Add listeners to the required events.
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdErrorEvent.Type.AD_ERROR,
                  window.jxyt.onAdError);
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
                  window.jxyt.onContentPauseRequested);
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
                  window.jxyt.onContentResumeRequested);
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdEvent.Type.STARTED,
                  window.jxyt.onAdEvent);
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdEvent.Type.COMPLETE,
                  window.jxyt.onAdEvent);
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdEvent.Type.FIRST_QUARTILE,
                  window.jxyt.onAdEvent);
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdEvent.Type.MIDPOINT,
                  window.jxyt.onAdEvent);
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdEvent.Type.THIRD_QUARTILE,
                  window.jxyt.onAdEvent);
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
                  window.jxyt.onAdEvent);
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdEvent.Type.CLICK,
                  window.jxyt.onAdEvent);
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdEvent.Type.IMPRESSION,
                  window.jxyt.onAdEvent);
              window.jxyt.adsManager.addEventListener(
                  google.ima.AdEvent.Type.SKIPPED,
                  window.jxyt.onAdEvent);
  
              try {
                  // Initialize the ads manager. Ad rules playlist will start at this time.
                  window.jxyt.adsManager.init(window.jxyt.width, window.jxyt.height, google.ima.ViewMode.NORMAL);
                  //console.log('ima bridge: after init adsmanager, we send a message to the top window');
                  // We send a message to the top window (parent of the iFrame)
                
                  if (!window.jxyt.hasAdFired) {
                    parent.postMessage('jxhasad', '*')
                    this.hasAdFired = true;
                  }
                //   var e = new Event('jxhasad');
                //   window.dispatchEvent(e);
                  window.jxyt.hasad = true;

                  if (window.jxyt.toload) window.jxyt.requestAds();
              } catch (adError) {
                // An error may be thrown if there was a problem with the VAST response. For example when there is no ad to play (VAST error 303)
              }
          },
  
          onContentPauseRequested: function() {
            //   console.log("About to start the ad, we pause the content");
              if (window.jxyt.playerYTReady) window.jxyt.playerYT.pauseVideo();
          },
  
          onContentResumeRequested: function() {
            //   console.log("the ad is finished, we play the content");
              window.jxyt.afterAdContent();
          },
  
          onAdEvent: function(adEvent) {
            // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
            // don't have ad object associated.
            var ad = adEvent.getAd();
            switch (adEvent.type) {
              case google.ima.AdEvent.Type.STARTED:
                  // change the order of removing hide class for the element, as there is an issue in hotspot with HTML
                  // window.jxyt.adDiv.classList.remove("hide");
                  // window.jxyt.cDiv.classList.remove("hide");

                  // fired the autoplay event
                  if (window.jxyt.pAuto) jxutil.fireEvent('click', 'autoplay');

                  if (!window.jxyt.pHasPlayed) window.jxyt.pHasPlayed = true;

                  // fired the adplayed event
                  jxutil.fireEvent('adplay');
  
                  // change the order of volume checking to avoid wrong detection of the volume by our VPAID, and then wrong report on the visibility
                  if (window.jxyt.adsManager.getVolume() > 0){
                    window.jxyt.adSound = true;
                    window.jxyt.adsManager.setVolume(1);
                    window.jxyt.btm.classList.remove("mute");
                  } else {
                    window.jxyt.adSound = false;
                    window.jxyt.adsManager.setVolume(0);
                    window.jxyt.btm.classList.add("mute");
                  }
                  var e = new Event('jxadstart');
                  window.dispatchEvent(e);
  
                  //window.jxyt.adsManager.setVolume(1); // DEBUG
  
                  // This event indicates the ad has started - the video player
                  // can adjust the UI, for example display a pause button and
                  // remaining time.
                  break;
              case google.ima.AdEvent.Type.COMPLETE:
                  // We send the event that the ad ended only if there is no image to display
                  var e = new Event('jxadended');
                  window.dispatchEvent(e);
                  break;
              case google.ima.AdEvent.Type.FIRST_QUARTILE:
                  var e = new Event('jxadfirstQuartile');
                  window.dispatchEvent(e);
                  break;
              case google.ima.AdEvent.Type.MIDPOINT:
                  var e = new Event('jxadmidpoint');
                  window.dispatchEvent(e);
                  break;
              case google.ima.AdEvent.Type.THIRD_QUARTILE:
                  var e = new Event('jxadthirdQuartile');
                  window.dispatchEvent(e);
                  break;
              case google.ima.AdEvent.Type.SKIPPED:
                  var e = new Event('jxadskipped');
                  window.dispatchEvent(e);
                  break;
              case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
                  window.jxyt.hasad = false; // we played all ads, then we reinitialise
                  window.jxyt.isAdPaused = false;
                  window.jxyt.toload = false;
                  window.jxyt.adsManager.destroy();
                  if (!window.jxyt.dftImg){ // We don't fire the event if there is an image to display
                      var e = new Event('jxadalladscompleted');
                      window.dispatchEvent(e);
                      window.jxyt.adEnded = true;
                  }
                  window.jxyt.adDiv.classList.add("hide");
                  window.jxyt.cDiv.classList.add("hide");
                  break;
              case google.ima.AdEvent.Type.CLICK:
                  var e = new Event('jxadclick');
                  window.jxyt.isAdPaused = true;
                  window.dispatchEvent(e);
                  break;
              case google.ima.AdEvent.Type.IMPRESSION:
                  var e = new Event('jxadimpression');
                  window.dispatchEvent(e);
                  break;
            }
          },
  
          // Function called when the user clicks on the play/pause button we added on the ad
          onClickPlayAd: function(e){
            e.preventDefault();
            var b = e.target;
            if (b.classList.contains('active')){
                b.classList.remove("active");
                window.jxyt.pause();
            }else{
                b.classList.add("active");
                window.jxyt.play();
            }
            return false;
          },
  
          // Function called when the user clicks on the mute/unmute button we added on the ad
          onClickMuteAd: function(e){
              e.preventDefault();
              var b = window.jxyt.btm;
              if (b.classList.contains('mute')){
                  b.classList.remove("mute");
                  window.jxyt.adSound = true;
                  window.jxyt.playerElt.volume = 1;
                  window.jxyt.adsManager.setVolume(1);
              }else{
                  b.classList.add("mute");
                  window.jxyt.adSound = false;
                  window.jxyt.playerElt.volume = 0;
                  window.jxyt.adsManager.setVolume(0);
              }
              return false;
          },

          onWindowResize: function() {
              var interval = setInterval(function(){
                  if (window.jxyt.adsManager)  {
                      clearInterval(interval);
                      window.jxyt.adsManager.resize(window.jxyt.pDiv.offsetWidth, window.jxyt.pDiv.offsetHeight);
                  }
              }, 100);
          },
  
  
      } // End of object declaration 
  
      // prepare initialization - we call the ready function when fully loaded
      if (/comp|inter|loaded/.test(document.readyState))
          window.jxyt.ready();
      else
          document.addEventListener("DOMContentLoaded", window.jxyt.ready.bind(window.jxyt));
  
  })(window, document);
  
  
  
  
