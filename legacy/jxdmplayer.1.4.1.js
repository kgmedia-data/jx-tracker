/*
 * Script used for integrating Dailymotion player.
 *
 * This script has to be integrated in the page or script integrating Dailymotion player. It contains 
 * all functions necessary to interact with Dailymotion player, especially to track the events. 
 *
 * The sequence is the following:
 * 1- The script is loaded: when the objects are ready, it loads Dailymotion script
 * 2- When Dailymotion script is loaded, it calls the function onDMPlayerReady which will set the parameters of the Dailymotion player (this function is defined by the user)
 * 3- The function will retrieve the videos to play if any and instantiate the player
 * 4- When the player API is ready, we set the different events handlers
 *
 *
 * The script uses as parameters (sent in the query string of the script itself):
 * - name of the div which should contain the Dailymotion player
 * - the tag for a banner on top of the player
 * - the tag for a banner at the bottom of the player
 * - the tag for a frame
 * - the tag for hotspots
 *
 * This script calls the function callback function that has to be defined in the main script after everything is set up (parameter callbackready of jxstartDM)
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
		        if (event == 'error' && clickid){
					urlToCall += '&errorcode=' + clickid;
		        }
		        
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

// Function to initialise the DM SDK. It is called after lazy loading of Dailymotion script
window.dmAsyncInit = function(){
	// The Dailymotion script is launched
    DM.init({ apiKey: '9892153f80b047306828', status: true, cookie: true });
    // We call the function defined in the main script by the user
    // It is in this function that all the parameters for the player will be given
    // safe to use the function as we loaded the script AFTER having checked that the function is existing
    // This function will have to call window.jxdm.jxstartDM(p) to provide the parameters to start the integration
    onDMPlayerReady();
};

 (function() {
    // check for run-once only
    if (window.jxdm)
        return;

    // We define the object which will encapsulate Dailymotion player
    window.jxdm = {
        dm : null, // Dailymotion div
        player: null, // Dailymotion player
        pparams: null, // Player parameters
        videolist: [], // List of videos to play
        tdiv: null, // Top Div (div containing the player)
        auto: false, // indicate if it is autoplay
        wifi: false, // indicates if the user is in wifi (or cable or anything) or mobile

        // Other options
        minWordLength: 4, //  Minimum length of words to keep
        minWordSearch: 2, //  Minimum words to perform a search: while no results it will removes a word and retry search
        maxWordSearch: 10, // Maximum of words used for the search: more words you keep, less are chances to get a result
        sort: "relevance",  //Which sort to use. List of available values: https://developer.dailymotion.com/api#video-sort-filter
        searchParams: null, // parameters for the search (set in apisearch)

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
        view: false, // the creative has been in view
        isMobile: false, // indicates if the device is a mobile
        p: false, // indicates if the player is playing
        l: false, // indicates if the player is loading a video
        r: false, // indicates if the player is ready

        pu: null, // pageurl 
        pagetitle: null, // title of the page, will be used for the search

        // Controls for firing events
        imp: null,
        fPct: false,
        mPct: false,
        tPct: false,
        start: false, // true when a video starts, false when it ends

        // Other
        callbackReady: null,

        // Function called when the script is fully loaded, and then add and load the Dailymotion SDK
        // When the Dailymotion SDK is loaded, it will call window.dmAsyncInit
        ready: function(){
        	if (typeof onDMPlayerReady === "function") {  // We check that there is the right existing function, otherwise no need to load the Dailymotion SDK
			    // Adding a window listener of events to retrieve the events from the top friendly iFrame
		        jxutil.addListener(window, 'message', this.jxMsgIn);

        		// We add the Dailymotion script  
		    	// Loading Dailymotion player will generate a call to window.dmAsyncInit function, 
			    var e = document.createElement('script');
			    e.async = true;
			    e.src = 'https://api.dmcdn.net/all.js';
			    var s = document.getElementsByTagName('script')[0];
			    s.parentNode.insertBefore(e, s);
			}else{
				console.log("JX WARNING: no handler function onDMPlayerReady defined, please check integration documentation.");
			}
        },


    	// Function used to integrate Dailymotion player
    	/* 
    	 * Parameter is a JSON object with the following properties: 
    	 * - trackers: the trackers object (with baseurl and parameters)
    	 * - container: the container of the player. It is distinct from the player (or not) as it can include other elements than only the player
    	 * - player: the div which will contain the player. It will also contain the potential ads
    	 * - pageurl: the page URL to be sent to the player
    	 * - adparameters.topbannertag: the tag to use to integrate the top banner
    	 * - adparameters.bottombannertag: the tag to use to integrate the bottom banner
    	 * - adparameters.frametag: the tag to use to integrate the frame
    	 * - adparameters.hotspotstag: the tag to use to integrate the hotspots
    	 * - adparameters.network: can be 'mobile', 'wifi' default 'wifi' 
    	 * - callbackready: callback function to call when a video is ready. It sends back the Dailymotion created object describing the video (meant to update the title and so on)
    	*/
    	jxstartDM: function(p){
    		var o = this;
    		//console.log(JSON.stringify(p));

    		//console.log("Starting the DM player");

    		// setting the parameters
    		if (p.trackers) jxutil.setTrackers(p.trackers)
    		if (p.container) jxutil.setContainer(p.container);
    		if (p.player) o.tdiv = p.player;
    		if (p.pageurl) o.pu = p.pageurl;
    		if (p.adparameters.topbanner) o.topBannerTag = p.adparameters.topbanner;
    		if (p.adparameters.bottombanner) o.bottomBannerTag = p.adparameters.bottombanner;
    		if (p.adparameters.frametag) o.frameTag = p.adparameters.frametag;
    		if (p.adparameters.hotspotstag) o.hotspotTag = p.adparameters.hotspotstag;
    		if (p.adparameters.network == 'mobile') o.wifi = false; else o.wifi = true;
    		if (p.callbackready) o.callbackReady = p.callbackready;
    		if (p.adparameters) o.adparameters = p.adparameters; else o.adparameters = {};
    		if (p.visible) o.v = p.visible;
    		if (p.pagetitle) o.pagetitle = p.pagetitle.toLowerCase();
    		if (o.pagetitle && p.adparameters.excludewords !== undefined && p.adparameters.excludewords && p.adparameters.excludewords.length > 0){
    			//console.log("We have words to exclude");
    			var exw = p.adparameters.excludewords;
    			for (var w=0; w < exw.length; w++){
    				//console.log("Removing: " + exw[w]);
    				window.jxdm.pagetitle = window.jxdm.pagetitle.replace(exw[w].toLowerCase(),'');    				
    			}
    			o.pagetitle = o.pagetitle.replace(/ +(?= )/g,'').trim();
    			//console.log("New pagetitle is: " + o.pagetitle);
    		}

    		if (o.tdiv && o.adparameters){

    			// Possibility to ad a display before of after the player
    			if (o.topBannerTag){
    				o.createAdSlot('top', o.topBannerTag);
    			}

    			// We create a div to host the dailymotion player
		        o.dm = jxutil.newDiv(o.tdiv, 'div', '', 'container');


    			if (o.bottomBannerTag){
    				o.createAdSlot('bottom', o.bottomBannerTag);
    			}

			    // setting the player parameters
			    o.pparams = {
                	'controls': o.adparameters.controls || true,
                	'ads_params': 'contextual',
                	'ui-logo': false,
                	'origin': p.domain || null,
                	'queue-autoplay-next': false,
                	'queue-enable': false,
        		};

        		if (o.adparameters.syndication) o.pparams.syndication = o.adparameters.syndication;

        		// Setting the autoplay. We autoplay only if set to wifi and we detected we are on a wifi network
        		if (o.wifi && o.adparameters.autoPlay == "wifi"){
        			o.auto = true;
        			o.pparams['autoplay-mute'] = true;
        			//o.pparams.mute = true;
        			//o.pparams.muted = true;
        		}else{
	        		o.auto = false;
	        		o.pparams.autoplay = false;        			
        		}

        		// We add the listeners to the container in case it is not in iFrame
        		if (p.container){
        			//console.log("JX - Dmplayer - Adding event listeners");
	        		p.container.addEventListener('jxvisible', function (e) {o.onVisible(o);});
	            	p.container.addEventListener('jxnotvisible', function (e) {o.onNotVisible(o);});
        		}


        		// We create a Dailymotion player instance
        		//console.log("Params for the initialisation of the player: " + JSON.stringify(o.pparams));

			    // Starting to play videos: try to call the search is any
			    if (o.adparameters.search && o.adparameters.search == 'title' && o.pagetitle){
			    	//console.log("we run a search on the title");
			      	// We run a search on the title of the page
					o.apisearch(o);
	        		window.addEventListener('onSearchEnd', (e) => { window.jxdm.createPlayer(window.jxdm); });
			    }else{
			    	//console.log("we use a playlist or a video");
			       	// It is not a search, we check if a playlist ID has been provided
			        if (o.adparameters.defaultPlaylist){
			        	o.apiplaylist(o);
	        			window.addEventListener('onSearchEnd', (e) => { window.jxdm.createPlayer(window.jxdm); });
	                }else if(o.adparameters.defaultVideo){
                        o.videolist.push({id: o.adparameters.defaultVideo}); // we add the default video to the list of videos to play
                        o.createPlayer(o);
	                }else{
	                    console.log("Warning: nothing to play in Dailymotion player");
	                }
			    }        		
    		}else{
    			console.log("JX WARNING - missing parameter: " + JSON.stringify(p));
    		}
    	},


		// Function to process the messages received
		jxMsgIn: function(e){
			try{
				if (e.data == 'jxvisible') {
					window.jxdm.onVisible(window.jxdm);
			    }else if (e.data == 'jxnotvisible'){ 
					window.jxdm.onNotVisible(window.jxdm);
			    }				
			}catch (e){
				console.log("Error when receiving message: " + e.message);
			}
		},

        onVisible: function(o){
			//console.log("We received a VISIBLE message or event");
			o.v = true; // setting the visibility
		    if (!o.view){jxutil.fire('creativeView');o.view = true;}
		    if (!o.l){
				//console.log("No video loaded, we load a video");
		        o.LoadNextVideo(); // if there is no video already loaded then we load the next video
		    }
		    else if (!o.p && o.adparameters.autoPlay != "none" && o.r){
		        //console.log("No video plays, whereas it is autoplay and the player is ready.");
		        if (o.wifi && o.adparameters.autoPlay == 'wifi'){
		            //console.log("We are in Wifi, so we force autoplay.");
		            o.player.play();
		            o.p = true;
		        }else{
		          	//console.log("We are on mobile network, then we DO NOT force autoplay.");	            		
		        }
		    }
		        //console.log("Video play: " + JSON.stringify(window.jxdm.p) + ", Video started: " + JSON.stringify(window.jxdm.start));
        },

        onNotVisible: function(o){
        	//console.log("We received a not visible message or event, we PAUSE the video");
			o.v = false;
			if (o.p){
			    o.player.pause(); // a video is playing, then we pause the video
			    o.p = false;
			}
        },

        onFloat: function(o){
        	//
        },

        onDocked: function(o){
        	//
        },

        onFloatClose: function(o){
        	//
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
    		jxutil.checkIframeLoaded(window.jxdm.topBanner, jxutil.onWindowResize, window.jxdm.checkTopAdIframeLoaded);
		},

		// Check if bottom ad iFrame is loaded
		checkBottomAdIframeLoaded: function(){
    		jxutil.checkIframeLoaded(window.jxdm.bottomBanner, jxutil.onWindowResize, window.jxdm.checkBottomAdIframeLoaded);
		},
		
	    onTopBannerClick: function(){
	    	if (window.jxdm.topBannerTag.clickurl){
		        jxutil.fire('click','topbanner');
		        //console.log("clickurl: -" + clickurl + "-");
		         window.open(clickurl, '_blank');	    		
	    	}
	    },

	    onBottomBannerClick: function(){
	    	if (window.jxdm.bottomBannerTag.clickurl){
		        jxutil.fire('click','bottombanner');
		        //console.log("clickurl: -" + clickurl + "-");
		         window.open(clickurl, '_blank');	    		
	    	}
	    },
	
/**********************************************************************************************************
 *                                      Dailymotion player controls
 **********************************************************************************************************/
		/**
         * Takes a string and returns keywords following some rules
         * 
         * @param title {string} a sentence
         * @returns {array} keywords
         */
         sanitizeTitle: function(title){
            return  title.normalize('NFD').
                        replace(/[\u0300-\u036f]/g, '').toLowerCase().
                        //replace(/[^a-zA-Z0-9]/g, '').
                        replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"]/g,'').split(' ').
                        filter(word => word.length >= this.minWordLength);
        },

        // Function called when the API of the player is ready. 
        // It calls a function called onDMPlayerReady, similar to YouTube integration. 
        apiready: function(obj){
        	//console.log("DM player API is ready");

		    // Adding all the events catching from the player
		    obj.player.addEventListener('end', obj.EventVideoEnd);
		    obj.player.addEventListener('error', obj.EventVideoError);
		    //obj.player.addEventListener('loadedmetadata', obj.EventVideoData);
		    obj.player.addEventListener('pause', obj.EventVideoPause);
		    obj.player.addEventListener('start', obj.EventVideoStart);
		    obj.player.addEventListener('playing', obj.EventVideoPlay);
		    obj.player.addEventListener('timeupdate', obj.EventVideoDuration);
		    obj.player.addEventListener('playback_ready', obj.EventPlayBackReady);
		    obj.player.addEventListener('ad_start', obj.EventAdStart);
		    obj.player.addEventListener('ad_end', obj.EventAdEnd);
		    obj.initialisePlayer(obj);
        },

        apisearch: function(o){
        	if (!o.searchParams){
				o.searchParams = {    
	            	'fields': 'id,title',
	            	'sort': this.sort,
	            	'limit': 10,
	            	'search': o.sanitizeTitle(o.pagetitle).sort((a, b) => b.length - a.length).slice(0, o.maxWordSearch).join(' ')
	        	};

	        	if(!o.adparameters.searchInPlaylist) o.searchParams.private = 0;
	        	if(!o.adparameters.searchInPlaylist) o.searchParams.longer_than = 0.35; //21sec
	        	if(!o.adparameters.searchInPlaylist && o.adparameters.owners) o.searchParams.owners = o.adparameters.owners;
	        	if(!o.adparameters.searchInPlaylist && o.adparameters.category) o.searchParams.channel = o.adparameters.category;
	        	if(!o.adparameters.searchInPlaylist && o.adparameters.excludeIds) o.searchParams.exclude_ids = o.adparameters.excludeIds;
	        	if(o.adparameters.language) o.searchParams.language = o.adparameters.language;
        	}

	        var e = new Event('onSearchEnd');

            console.log("%c DM related ", "background: #56C7FF; color: #232323", "Search: " + JSON.stringify(o.searchParams));

            DM.api("/" + (o.adparameters.searchInPlaylist ? "playlist/" + o.adparameters.searchInPlaylist + "/videos" : "videos"), o.searchParams , 
                function(response){
                    if("list" in response && response.list.length > 0){
                    	window.jxdm.videolist = response.list;
                        window.dispatchEvent(e);
                    } 
                    else{
                        window.jxdm.searchParams.search = window.jxdm.searchParams.search.substring(0, window.jxdm.searchParams.search.lastIndexOf(' '));
                        
                        if(window.jxdm.searchParams.search.split(' ').length >= window.jxdm.minWordSearch) 
                            window.jxdm.apisearch(window.jxdm);
                        else{
                            //console.log("%c DM related ", "background: #56C7FF; color: #232323", "Can not find related video. Fallback video used.");
                            if (window.jxdm.adparameters.defaultPlaylist){
                            	window.jxdm.apiplaylist(window.jxdm);
                            }else if(window.jxdm.adparameters.defaultVideo){
                            	window.jxdm.videolist.push({id: window.jxdm.adparameters.defaultVideo}); // we add the default video to the list of videos to play
                            	window.dispatchEvent(e);
                            }else{
                            	console.log("Warning: nothing to play in Dailymotion player");
                            }
                        }
                    }  
                }
            );
        },

        // API to retrieve the videos of a playlist
        apiplaylist: function(o){
			var searchParams = {    
            	'fields': 'id,title',
            	'limit': 20,
        	};

	        var e = new Event('onSearchEnd');

            //console.log("We retrieve the videos of the playlist with id:" + o.adparameters.defaultPlaylist);

            DM.api("/playlist/" + o.adparameters.defaultPlaylist + "/videos", searchParams , 
                function(response){
                    if("list" in response && response.list.length > 0){
                    	window.jxdm.videolist = response.list;
                        window.dispatchEvent(e);
                    }else{
                        if(window.jxdm.adparameters.defaultVideo){
                            window.jxdm.videolist.push({id: window.jxdm.adparameters.defaultVideo}); // we add the default video to the list of videos to play
                            window.dispatchEvent(e);
                        }else{
                            console.log("Warning: nothing to play in Dailymotion player");
                        }
                    }                    
                }
            );
        },


        // Creates the player
        createPlayer: function(obj){
        	try{
	        	if (obj.videolist && obj.videolist.length > 0){
	        		//console.log("List of retrieved videos: " + JSON.stringify(obj.videolist));
	        		var vdo = obj.videolist.shift();
	        		obj.callbackReady(vdo);
	        		var params = {width:"100%", height:"100%", video: vdo.id, params:obj.pparams};
	        		//console.log("Creating the player with params and without video ID: " + JSON.stringify(params));
	        		obj.player = DM.player(obj.dm, params);
		    		// When the player is ready, then we finalise the initialisation 
		    		obj.player.addEventListener('apiready', obj.apiready(obj));
		    		obj.l = true;
	        	}else{
	        		console.log("Warning: no video to play");
	        	}
			}catch (e){
				console.log("Error when creating the player: " + e.message);
			}
        },

 		/**
 		 *
 		 * Initialize the player
 		 *
 		 */
 		initialisePlayer: function(obj){
 		 	//console.log("We initialise the player");
 		 	if (obj.player){
 		 		parent.postMessage('jxhasad', '*');
 		 		jxutil.container.dispatchEvent(new Event('jxhasad'));
	            
	            if(obj.adparameters.unMuteOnHover) obj.player.addEventListener("mouseover", () => { if (window.jxdm.p) window.jxdm.player.setMuted(false);});
	            if(obj.adparameters.unMuteOnHover === "strict") obj.player.addEventListener("mouseout", () => { if (window.jxdm.p) window.jxdm.player.setMuted(true); }); 		 		
 		 	}else{
 		 		console.log("Warning, the Dailymotion player is not available");
 		 	}
 		},

		/**
         * Load the next video in the player (used when the player is visible and when the video ends to load the next video)
         */
        LoadNextVideo: function(){
         	try{
	         	//console.log("Loading next video");
		        if (window.jxdm.videolist && window.jxdm.videolist.length > 0){
		            var vdo = window.jxdm.videolist.shift(); // we get the next video
		            window.jxdm.callbackReady(vdo); // to update the title in the widget
		            if (window.jxdm.auto){
		            	window.jxdm.player.load({video: vdo.id, 'queue-enable': true, 'queue-autoplay-next': true});
		            }else{
		            	window.jxdm.player.load({video: vdo.id, 'autoplay': true, 'queue-enable': true, 'queue-autoplay-next': true});	            		
		            }
		            if (window.jxdm.videolist.length == 0){
		            	// if there is no more video left in the list of videos, then we add the autoplay and queue enabled
		            	if (window.jxdm.adparameters.defaultPlaylist) window.jxdm.apiplaylist(); // if there is a playlist, well we (re)load it ;-) It will replace the current (empty) list of videos
		            }
		            window.jxdm.l = true;
		        }
			}catch (e){
				console.log("Error when loading the next video: " + e.message);
			}
         },

		/**
         * Handle player events
         */

        EventAdStart: function(e){
        	jxutil.fire('padstart');
        },

        EventAdEnd: function(e){
        	jxutil.fire('padend');
        },

        EventVideoEnd: function(e){
        	//console.log("Event video end");
        	if (window.jxdm.p){
        		// If the video was playing, otherwise it is certainly an error
	            jxutil.fire('complete');
	            window.jxdm.fPct = false;
	            window.jxdm.mPct = false;
	            window.jxdm.tPct = false;
	            window.jxdm.imp = false;
	            window.jxdm.start = false;
	            window.jxdm.l = false; // no more video loaded (end of video), indicates we can load a new video
				window.jxdm.r = false;
	            // Loading the next video of the list
	            window.jxdm.LoadNextVideo();
        	}
        },

		EventVideoError: function(e){
			//console.log("The player fired an error.");
			//console.log(e.code);
			//console.log(e.title);
  			//console.log(e.message);
  			if (e.code) jxutil.fire('error', e.code);
  			else jxutil.fire('error');
		},

		EventPlayBackReady: function(e){
			//console.log("Playback is ready");
			window.jxdm.r = true;
			// We check 3s later if the video started or not. If not, we call the play function of the player to force to play
			setTimeout(() => {  if (!window.jxdm.p && window.jxdm.adparameters.autoPlay == 'wifi' && window.jxdm.wifi && window.jxdm.v) window.jxdm.player.play(); }, 3000);
		},

		/*
		EventVideoData: function(e){
			console.log("We have video data, yeah!");
            window.jxdm.callbackReady(e.target.video);
            parent.postMessage('jxhasad', '*');
		},*/
		
		EventVideoPause: function(e){
			if (window.jxdm.v){
				//console.log("Firing a video pause");
	            jxutil.fire('pause');
			}else{
				//console.log("Pausing a video which is not in the viewport");
			}
	        window.jxdm.p = false; // The player is no more playing
		},
		
		EventVideoStart: function(e){
			//console.log("Receiving event start");
		},

		EventVideoPlay: function(e){
			try{
				//console.log("Receiving event play: (" + window.jxdm.v + ")");
				window.jxdm.p = true; // The player is playing
				if (!window.jxdm.v){
					// The player is not visible, it is a "violent" autoplay so we stop playing
					window.jxdm.player.pause();
				}else if (window.jxdm.start){
					jxutil.fire('resume');
				}
			}catch (e){
				console.log("Error when receiving event play: " + e.message);
			}
		},

		EventVideoDuration: function(e){
			//console.log("Checking duration");
			var player = e.target;
            if (parseFloat(player.currentTime) > 0){
            	if (!window.jxdm.start && window.jxdm.v){
		            jxutil.fire('start');
		            window.jxdm.start = true;
			        if (window.jxdm.auto) jxutil.fire('click','autoplay'); // the player is autoplay, then we do it autoplay
			        else jxutil.fire('click','play'); // otherwise it means click to play
            	}
            	if (parseFloat(player.currentTime) > 2 && window.jxdm.v && !window.jxdm.imp){
            		jxutil.fire('impression');
				    window.jxdm.imp = true;
            	}
                var ratio = (parseFloat(player.currentTime) || 0) / parseFloat(player.duration);
                if (ratio >= 0.25 && !window.jxdm.fPct){jxutil.fire('firstQuartile'); window.jxdm.fPct = true;}
                if (ratio >= 0.5 && !window.jxdm.mPct){jxutil.fire('midpoint'); window.jxdm.mPct = true;}
                if (ratio >= 0.75 && !window.jxdm.tPct){jxutil.fire('thirdQuartile'); window.jxdm.tPct = true;}
                //console.log('Ratio updated to ' + ratio);
            }
		},

    }; // end of object declaration

    // prepare initialization - we integrate the player only when the page is fully loaded, here meaning the iFrame
    if (/comp|inter|loaded/.test(document.readyState))
        window.jxdm.ready();
    else
        document.addEventListener("DOMContentLoaded", window.jxdm.ready.bind(window.jxdm));

})();



