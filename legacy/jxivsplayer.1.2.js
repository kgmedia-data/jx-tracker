/*
 * Script used for integrating IVS player.
 *
 * This script has to be integrated in the page or script integrating IVS player. It contains 
 * all functions necessary to interact with IVS player. 
 *
 * The script uses as parameters (sent in the query string of the script itself):
 * - name of the div which should contain the IVS player
 * - the tag for a banner on top of the player
 * - the tag for a banner at the bottom of the player
 * - the tag for a frame
 * - the tag for hotspots
 *
 */

var jxinter = null;


/*******************************************************************************************************************
 *
 *                                    UTILITIES FUNCTION USED IN MOST OF THE SCRIPTS
 *
 *******************************************************************************************************************/
var jxutil = {
	trackers: null, // the object trackers, retrieved usually from the parameters
	container: null, // the container containing the thing to display

	// Retrieve the parameters of the given URL
	getUrlParams: function(url) {
	    var params = {};
	    var dirtyVars = url.match(/(\?|\&)([^=]+)\=([^&]+)/gi);
	    if (dirtyVars && dirtyVars.length > 0) {
	        dirtyVars.forEach(function(candidate, index) {
	        var pair = candidate.replace(/[&\\?]/, '').split('=');
	        params[pair[ 0]] = pair[ 1];
	        });
	    }
	    return params;
	},

	// Function to create a new div: parent is the parent, type is the type of element, html is the content of the element if any, className is the list of classes (separated with spaces)
	// Parameters: p parent, t type, h html, c class name, id
	newDiv: function(p, t, h, c, id){
	    var nd = document.createElement(t);
	    if (h && h != '') nd.innerHTML = h;
	    nd.className = c;
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

	// Check if an iFrame is loaded and if yes then call the function fctloaded, otherwise try again to call the function fct 
	// until the iFrame is fully loaded. Local indicates if it is a friendly iFrame (true) or 3rd party (false, default)
	checkIframeLoaded: function(iframe, fctloaded, fct, local) {
		//if (!iframe) console.log("No IFRAME !!!!");
		//else console.log("IFRAME YEAH");

		if (local){
		    // Get a handle to the iframe element
		    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

		    //if (!iframeDoc) console.log("We don't have the content"); else console.log("we have the content");

		    // Check if loading is complete
		    if (  iframeDoc.readyState  == 'complete' ) {
		        fctloaded();
		        return;
		    }			
	
		    // If we are here, it is not loaded. Set things up so we check the status again in 300 milliseconds
		    window.setTimeout(fct, 300);
		}else{
			// We set a call back when the iFrame is loaded (less exact than when local iFrame but good enough for now)
		    iframe.onload = function() {
		        fctloaded();
		    }
		}
	},

	// Function to set the container 
	setContainer: function(c){
		this.container = c;
	},

	// Function called when the window is resized. We just send a message to the parent of the iFrame with the new dimensions
	onWindowResize: function(e){
	    //console.log("Sending a message to parent iFrame with new height");
	    if (this.container)
	    	parent.postMessage('jxmsg::' + JSON.stringify({'type': 'size',params: {'height': this.container.offsetHeight}}), '*');
	    else
	    	parent.postMessage('jxmsg::' + JSON.stringify({'type': 'size',params: {'height': document.body.offsetHeight}}), '*');
	},

	// This function is used to set the tracker variable
	setTrackers: function(trackers){
		this.trackers = trackers;
	},

	// Function to fire a click event
	onClick: function(){
    	this.fire('click', null);
	},

	// This function fires an event of type event following the trackers that have been provided
	fire: function(event, clickid){
		if (this.trackers && this.trackers.baseurl && this.trackers.parameters){
		    //console.log("firing event " + event);
		    parent.postMessage('jxmsg::' + JSON.stringify({'type': 'event',params: {'action': event}}), '*');
		    
		    var urlToCall = '';
		    if (this.trackers.baseurl) {
		        urlToCall = this.trackers.baseurl + "?" + this.trackers.parameters + '&action=' + event;

		        if (event == 'click' && clickid){
					urlToCall += '&clickid=' + clickid;
		        }
		        //console.log('firering to ' + urlToCall);
		        
		        var xmlhttp;
		        if (window.XMLHttpRequest) xmlhttp = new XMLHttpRequest();
		        else xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		        xmlhttp.open('GET', urlToCall, true);
		        xmlhttp.withCredentials = true;
		        xmlhttp.crossDomain = true;
		        xmlhttp.send();
		    }
		}
	},
};


 (function() {
    // check for run-once only
    if (window.jxivs)
        return;

    // We define the object which will encapsulate IVS player
    window.jxivs = {
        ivs : null, // IVS iFrame
        tdiv: null, // Top Div (div containing the player)

        // Companion ads
        topBannerTag: null, // an ad tag for a banner (728x90) that will be integrated on top of the player
        bottomBannerTag: null, // an ad tag for a banner (728x90) that will be integrated at the bottom of the player
        frameTag: null, // an ad tag for an image that will be displayed on top of the player (but letting the clicks to go through)
        hotspotTag: null, // an ad tag for a serie of hotspots that will be displayed on top of the player (block the clicks)

        topBanner: null, // the div containing the top banner
        bottomBanner: null, // the div containing the bottom banner
        pframe: null, // the div containing the frame around the player
        hotspots: null, // the div containing the hotspots

        v: false, // indicates if the player is in view (following the message sent by the outstream frame)

        // Parameters of IVS player
        pu: null, // pageurl (sent to IVS player)
        pt: null, // page title (sent to IVS player)
        key: null, // IVS key
        wid: null, // widget ID
        spid: null, // spid

        // Controls for firing events
        imp: null,
        fPct: false,
        mPct: false,
        tPct: false,
        start: false,
        view: false,

        // Other
        callbackReady: null,

        // Function called when the page is fully loaded, and then the jxivs object is ready to receive calls
        // It calls a function called onIVSPlayerReady, similar to YouTube integration
        ready: function(){
        	if (typeof onIVSPlayerReady === "function") { 
    			// safe to use the function
        		onIVSPlayerReady();
			}else{
				console.log("JX WARNING: no handler function onIVSPlayerReady defined, please check integration documentation.");
			}
        },

    	// Function used to integrate IVS player
    	/* 
    	 * Parameter is a JSON object with the following properties: 
    	 * - trackers: the trackers object (with baseurl and parameters)
    	 * - container: the container of the player. It is distinct from the player (or not) as it can include other elements than only the player
    	 * - player: the div which will contain the player. It will also contain the potential ads
    	 * - key: the IVS key
    	 * - wid: the IVS widget ID
    	 * - spid: the IVS SP ID
    	 * - pageurl: the page URL to be sent to the player
    	 * - topbannertag: the tag to use to integrate the top banner
    	 * - bottombannertag: the tag to use to integrate the bottom banner
    	 * - frametag: the tag to use to integrate the frame
    	 * - hotspotstag: the tag to use to integrate the hotspots
    	 * - callbackready: callback function to call when the video is ready. It sends back the IVS created object describing the video
    	*/
    	jxstartIVS: function(p){
    		//console.log(JSON.stringify(p));

    		// setting the parameters
    		if (p.trackers) jxutil.setTrackers(p.trackers)
    		if (p.container) jxutil.setContainer(p.container);
    		if (p.player) this.tdiv = p.player;
    		if (p.key) this.key = p.key;
    		if (p.wid) this.wid = p.wid;
    		if (p.spid) this.spid = p.spid;
    		if (p.pageurl) this.pu = p.pageurl;
    		if (p.pagetitle) this.pt = p.pagetitle;
    		if (p.topbanner) this.topBannerTag = p.topbanner;
    		if (p.bottombanner) this.bottomBannerTag = p.bottombanner;
    		if (p.frametag) this.frameTag = p.frametag;
    		if (p.hotspotstag) this.hotspotTag = p.hotspotstag;
    		if (p.callbackready) this.callbackReady = p.callbackready;
    		if (p.visible) this.v = p.visible;

    		if (this.tdiv && this.key && this.wid && this.spid){

    			// Possibility to ad a display before of after the player
    			if (this.topBannerTag){
    				this.createAdSlot('top', this.topBannerTag);
    			}

    			if (this.bottomBannerTag){
    				this.createAdSlot('bottom', this.bottomBannerTag);
    			}

    			if (this.frameTag){
    				// TODO - code that part properly
		        	var frameImg = jxcreateNewDiv(
		                    this.tdiv, 
		                    'div', 
		                    '<img src="' + this.frameTag + '" class="jxImg"/>',
		                    'container frameImg');
    			}

    			// TODO - add hotspots

		    	// We add the IVS script to the player div    
		        this.ivs = document.createElement('iframe');
		        this.ivs.id="ivsplayer01";
		        this.ivs.className = 'container';
		        this.ivs.style.border = 'none';
		        this.ivs.setAttribute('frameborder', '0');
		        this.ivs.setAttribute('scrolling', 'no');
		        this.ivs.setAttribute('allow', 'autoplay; fullscreen');
		        var srcUrl = 'https://player.ivideosmart.com/ivsplayer/v4/dist/html/iframe-src.html?lite=1'
		        srcUrl += '&key=' + this.key;
		        srcUrl += '&wid=' + this.wid;
		        srcUrl += '&spid=' + this.spid;
		        if (this.pt) srcUrl += '&title=' + this.pt; else srcUrl += '&title=Jixie integration';
		        srcUrl += '&url=' + this.pu;
		        this.ivs.src = srcUrl;

		        this.tdiv.appendChild(this.ivs);				
		        this.checkPlayerIframeLoaded();

		        jxutil.addListener(window, 'message', this.jxMsgIn);

		        // Listening the clicks on the iFrame
		        this.iLtnr();

    		}else{
    			console.log("JX WARNING - missing parameter: " + JSON.stringify(p));
    		}

    	},

    	// Function to set the pageurl
    	setPlayerParams: function(p){
    		if (p.pageurl) this.pu = p.pageurl;

    	},

    	// Check if the iFrame including the player is loaded, and if yes, it resize the window
		checkPlayerIframeLoaded: function() {
			if (!window.jxivs.ivs) console.log("JX error - IVS iFrame undefined");
    		jxutil.checkIframeLoaded(window.jxivs.ivs, jxutil.onWindowResize, window.jxivs.checkPlayerIframeLoaded);
		},

		// Function to process the messages received
		jxMsgIn: function(e){
			if (e.data == 'jxvisible') {
		        window.jxivs.v = true;
		        if (!window.jxivs.view){jxutil.fire('creativeView');window.jxivs.view = true;}
		        window.jxivs.onScroll();
		    }else if (e.data == 'jxnotvisible'){ 
		        window.jxivs.v = false;
		        window.jxivs.onScroll();
		    }else{ 
		        // Here we suppose a message from IVS player, well at least we check
		        var messagePrefix = "ivs.playersdk.message://";
		        // Check if message is from Player SDK
		        if (typeof event.data !== 'string' || event.data.indexOf(messagePrefix) !== 0) {
		            return;
		        }

		        // Get actual JSON in message
		        var message = null;
		        try {
		            message = JSON.parse(event.data.substr(messagePrefix.length));
		        } catch (e) {
		            message = null;
		        }
		        window.jxivs.onPlayerEvent(message.event, message.params);    
    		}
		},




/**********************************************************************************************************
 *                                      Advertising functions
 **********************************************************************************************************/

 		// Create an ad slot according to the position provided. For now top or bottom
 		// Parameters: 
 		// - p: the position of the slot (top or bottom)
 		// - tag: the object containing the tag
 		createAdSlot: function(p, tag){
 			// Of course we can create the ad slot only if there is at least a URL
 			if (tag.url){
 				//console.log("We have a url");
 				var pElmt = null;

				// We create the iFrame element which will contain the creative. If not image file, then we add it in a "real" iFrame
		        // if image then we add it in a friendly iFrame and we set the different trackers
		        var parser = document.createElement('a');
		        parser.href = tag.url;
		        //console.log("Pathname: " + parser.pathname)
		        if (parser.pathname.indexOf('.png') !== -1 || parser.pathname.indexOf('.gif') !== -1 || parser.pathname.indexOf('.jpg') !== -1 || parser.pathname.indexOf('.jpeg') !== -1){
		            // Here we consider it is an image, then we create an iFrame accordingly
		            //console.log("It is an image");
		            pElmt = document.createElement('div');
		            pElmt.innerHTML = '<img src="' + tag.url + '" width="100%" class="jxImg"/>';
	 				if (p == 'top'){
	 					this.topBanner = pElmt;
	 					this.tdiv.parentNode.insertBefore(pElmt, this.tdiv);
	 					if (tag.clickurl) jxutil.addListener(pElmt, 'click', this.onTopBannerClick);
	 				}
	 				else if (p == 'bottom'){
	 					this.bottomBanner = pElmt;
	 					this.tdiv.parentNode.appendChild(pElmt);
	 					if (tag.clickurl) jxutil.addListener(pElmt, 'click', this.onBottomBannerClick);
	 				}
	 				jxutil.addListener(pElmt, 'load', jxutil.onWindowResize);
		        }else{
		            pElmt = document.createElement('iframe');
		            pElmt.src = tag.url;
				    pElmt.className = 'adslot';
				    pElmt.style.border = 'none';
				    pElmt.setAttribute('frameborder', '0');
				    pElmt.setAttribute('scrolling', 'no');
			 		if (p == 'top'){
	 					this.topBanner = pElmt;
			 			this.tdiv.parentNode.insertBefore(pElmt, this.tdiv);
			 			this.checkTopAdIframeLoaded();
			 		}else if (p == 'bottom'){
	 					this.bottomBanner = pElmt;
			 			this.tdiv.parentNode.appendChild(this.bottomBanner);
			 			this.checkBottomAdIframeLoaded();	
			 		}
		        }
		       	//pElmt.style.maxWidth = this.ivs.offsetWidth;
		        pElmt.style.left = '0';
		        pElmt.style.top = '0';
		        pElmt.style.marginBottom = '0px';
		        pElmt.style.marginTop = '5px';
 			}
	 	},

	 	// Check if top ad iFrame is loaded
		checkTopAdIframeLoaded: function(){
    		jxutil.checkIframeLoaded(window.jxivs.topBanner, jxutil.onWindowResize, window.jxivs.checkTopAdIframeLoaded);
		},

		// Check if bottom ad iFrame is loaded
		checkBottomAdIframeLoaded: function(){
    		jxutil.checkIframeLoaded(window.jxivs.bottomBanner, jxutil.onWindowResize, window.jxivs.checkBottomAdIframeLoaded);
		},
		
	    onTopBannerClick: function(){
	    	if (window.jxivs.topBannerTag.clickurl){
		        jxutil.fire('click','topbanner');
		        //console.log("clickurl: -" + clickurl + "-");
		         window.open(clickurl, '_blank');	    		
	    	}
	    },

	    onBottomBannerClick: function(){
	    	if (window.jxivs.bottomBannerTag.clickurl){
		        jxutil.fire('click','bottombanner');
		        //console.log("clickurl: -" + clickurl + "-");
		         window.open(clickurl, '_blank');	    		
	    	}
	    },
	
/**********************************************************************************************************
 *                                      IVS Functions (slightly modified)
 **********************************************************************************************************/

    	/**
       	 * Scroll event handler
         *
         * @returns {void}
         */
    	onScroll: function() {
        	// We fake the scroll message to IVS to keep compatibility with the rest of the integrations
        	// We manage ourselves the visibility of the player

        	var top = 0;
        	if (!this.v){
            	top = 600;
        	}

        	this.sendMessageToPlayer('ivs.page.scroll', {
            	pageYOffset: 0,
            	viewportHeight: 500,
            	containerTop: top,
            	containerHeight: 345
        	});
            
            this.sendMessageToPlayer('ivs.player.visible', {
                flag: this.v // true if player is visible, false if out of view
            });
    	},


		/**
		 * Send message to player in <iframe>
		 *
		 * @param {string} event
		 * @param {object} params
		 * @returns {void}
		*/
      	sendMessageToPlayer: function(event, params) {
        	// All player messages are prefixed with this
          	var messagePrefix = 'ivs.playersdk.message://';
          	var iframeId = 'ivsplayer01';
          	var iframeElement = null;

          	// Get <iframe> element
          	if (window.AMP) {
              	// <amp-video-iframe> creates an <iframe> within
              	iframeElement = document.querySelector('#' + iframeId + ' iframe');
          	} else {
              	iframeElement = document.querySelector('#' + iframeId);
          	}

          	if (!iframeElement) {
              	return;
          	}

	          /*console.log("Sending message to player: " + JSON.stringify({
	                  event: event,
	                  params: params
	              }));*/

          	// Post message to <iframe> element
          	iframeElement.contentWindow.postMessage(
              	messagePrefix + JSON.stringify({
                  	event: event,
                  	params: params
              	}),
              	'*'
          	);
      	},

		/**
         * Handle player events
         *
         * @param {string} event
         * @param {(null|object)} params
         * @returns {void}
         */
      	onPlayerEvent: function(event, params) {
          	switch (event) {
              	case 'ivs.player.rendered': {
                  	// Need to pass scroll/visibility info to player cos browser security policies prevent <iframe>
                  	// from access such information in its parent page
                  	this.onScroll(); // let player know on load if it's visible

                  	// Listen to user switching browser tab or application
                  	// https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
                  	document.addEventListener('visibilitychange', function (event) {
						if (document.hidden) {
                          	window.jxivs.sendMessageToPlayer('ivs.player.visible', {
                              	flag: false
                          	});
                      	}else {
                          	// Do not emit ivs.player.visible cos player might be out of view
                          	window.jxivs.onScroll();
                      	}
                  	});

                    break;
                }
                case 'ivs.content.ready': {
                    var data = (params && params.response && params.response.body) || null;
                    if (data) {
                    	this.callbackReady(data);
                    	parent.postMessage('jxhasad', '*');
                    	//console.log("Height of the container is :" + jxContainer.offsetHeight);
                    	// We send a message to the parent of the iFrame with the height of the container
                  	}
                  	break;
              	}
              	case 'ivs.content.play': {
                	//console.log('Video played.');
                	if (this.v && !this.start){
                		jxutil.fire('start');
	                	this.start = true;
		              	if (this.ist.hCk) jxutil.fire('click','play'); // if we detected a click first, it means click to play
		              	else jxutil.fire('click','autoplay'); // otherwise it means autoplay
                	}else if(this.v){
                		jxutil.fire('resume');
                	}
                	break;
              	}
              	case 'ivs.content.pause': {
                	jxutil.fire('pause');
                	//console.log('Video paused.');
                	break;
              	}
              	case 'ivs.content.ended': {
                	jxutil.fire('complete');
                	this.fPct = false;
                	this.mPct = false;
                	this.tPct = false;
                	this.imp = false;
                	this.start = false;
                	//console.log('Video ended.');
                	break;
              	}
              	case 'ivs.content.time': {
                	if (parseFloat(params.durationMs) > 0){
                		if (parseFloat(params.durationMs) > 2000 && window.jxivs.v && !window.jxivs.imp){
                			jxutil.fire('impression');
		                    window.jxivs.imp = true;
                		}
                    	var ratio = (parseFloat(params.positionMs) || 0) / parseFloat(params.durationMs);
                    	if (ratio >= 0.25 && !this.fPct){jxutil.fire('firstQuartile'); this.fPct = true;}
                    	if (ratio >= 0.5 && !this.mPct){jxutil.fire('midpoint'); this.mPct = true;}
                    	if (ratio >= 0.75 && !this.tPct){jxutil.fire('thirdQuartile'); this.tPct = true;}
                    	//console.log('Ratio updated to ' + ratio);
                    	//console.log(params.positionMs);
                	}
                	break;
              	}
              	default: {
                  	break;
              	}
          	}
      	},

		/****************************************************************************************************************
		 *
		 *                                      IFRAME CLICK TRACKING
		 *
		 ****************************************************************************************************************/

		ist : {
				iOIF: false, // isOverIFrame
				fB: false, // firstBlur
				hFA: false, // hasFocusAcquired
				hCk: false, // hasClicked
			  },

		// iFrameListener function
		iLtnr: function() {
    		this.bLtnr();

    		//document.body.addEventListener('click', onClick);

		    if (typeof window.attachEvent !== 'undefined') {
		        top.attachEvent('onblur', function () {
		            window.jxivs.ist.fB = true; // firstBlur
		            window.jxivs.ist.hFA = false; // hasFocusAcquired
		            window.jxivs.onIFC(); // on iFrameClick
		        });
		        top.attachEvent('onfocus', function () {
		            window.jxivs.ist.hFA = true; // hasFocusAcquired
		            //console.log('attachEvent.focus');
		        });
		    } else if (typeof window.addEventListener !== 'undefined') {
		        top.addEventListener('blur', function () {
		            window.jxivs.ist.fB = true; // firstBlur
		            window.jxivs.ist.hFA = false; // hasFocusAcquired
		            window.jxivs.onIFC(); // onIFrameClick
		        }, false);
		        top.addEventListener('focus', function () {
		            window.jxivs.ist.hFA = true; // hasFocusAcquired
		            //console.log('addEventListener.focus');
		        });
    		}

    		setInterval(this.bLtnr, 500); // Bind listeners
		},

		// Function to identify if it is Firefox
		isFF: function() {
		    return navigator.userAgent.search(/firefox/i) !== -1;
		},

		// isActiveElementChanged
		isActElmtCh: function() {
		    var pr = document.activeElement.tagName.toUpperCase();
		    document.activeElement.blur();
		    var cur = document.activeElement.tagName.toUpperCase();
		    return !pr.includes('BODY') && cur.includes('BODY');
		},

		// onMouseOut
		onMOut: function() {
		    if (!window.jxivs.ist.fB && window.jxivs.isFF() && window.jxivs.isActElmtCh()) {
		        //console.log('firefox first click');
		        window.jxivs.onClick();
		    } else {
		        document.activeElement.blur();
		        top.focus();
		    }
		    window.jxivs.ist.iOIF = false; // isOverIFrame
		    //console.log(`onMouseOut`);
		},

		// onMouseOver
		onMOver: function() {
		    window.jxivs.ist.iOIF = true; // isOverIFrame
		    //console.log(`onMouseOver`);
		},

		// onIFrameClick
		onIFC: function() {
			this.ist.hCk = true; // There was a click
		    //console.log('onIFrameClick');
		    if (this.ist.iOIF) {
		        this.onClick();
		    }
		},

		onClick: function() {
		    //console.log('onClick');
		},

		// Bind listener
		bLtnr: function() {
		    window.jxivs.ivs.onmouseover = window.jxivs.onMOver;
		    window.jxivs.ivs.onmouseout = window.jxivs.onMOut;
		},

    }; // end of object declaration

    // prepare initialization - we integrate IVS player only when the page is fully loaded, here meaning the iFrame
    if (/comp|inter|loaded/.test(document.readyState))
        window.jxivs.ready();
    else
        document.addEventListener("DOMContentLoaded", window.jxivs.ready.bind(window.jxivs));

})();



