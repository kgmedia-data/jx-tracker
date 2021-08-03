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


// Function to initialise the DM SDK. It is called after lazy loading of Dailymotion script
window.dmAsyncInit = function(){
	// The Dailymotion script is launched
    DM.init({ apiKey: '9892153f80b047306828', status: true, cookie: true });
    // We call the function defined in the main script by the user
    // It is in this function that all the parameters for the player will be given
    // safe to use the function as we loaded the script AFTER having checked that the function is existing
	// This function will have to call window.jxdm.jxstartDM(p) to provide the parameters to start the integration
	if (window.dmScriptLoaded == undefined) window.dmScriptLoaded = true;
};
		
class JX_DMPlayer {
	constructor(p){
		var o = this;
		o.dm = null; // Dailymotion div
		o.container = null; // Container of Dailymotion div
		o.trackers = null;
		o.player = null; // Dailymotion player
		o.pparams = null; // Player parameters
		o.videolist = []; // List of videos to play
		o.tdiv = null; // Top Div (div containing the player)
		o.auto = false; // indicate if it is autoplay
		o.wifi = false; // indicates if the user is in wifi (or cable or anything) or mobile

		// Other options
		o.minWordLength = 4; //  Minimum length of words to keep
		o.minWordSearch = 2; //  Minimum words to perform a search: while no results it will removes a word and retry search
		o.maxWordSearch = 10; // Maximum of words used for the search: more words you keep, less are chances to get a result

		//so far this is only for the by "channel" search and FES-48 it is "channel: ordered by last published or most viewed" (here by channel in DM jargon it is user: e.g.'kompastv')
		//we will check coz if the user anyhow give sort type in the adparameter and we just give it to the DM api, it won't work. the api will fail.
		o.sortTypes = ['recent','trending'];//so either this or that, not supporting anything under the sun.
		o.sort = "recent"; //Which sort to use. List of available values: https://developer.dailymotion.com/api#video-sort-filter

		//note this does not apply to those api search though api search the code explicitly says relevance
		o.searchParams = null; // parameters for the search (set in apisearch)

		// Companion ads
		o.topBannerTag = null; // an ad tag for a banner (728x90) that will be integrated on top of the player
		o.bottomBannerTag = null; // an ad tag for a banner (728x90) that will be integrated at the bottom of the player
		o.frameTag = null; // an ad tag for an image that will be displayed on top of the player (but letting the clicks to go through)
		o.hotspotTag = null; // an ad tag for a serie of hotspots that will be displayed on top of the player (block the clicks)

		o.topBanner = null; // the div containing the top banner
		o.bottomBanner = null; // the div containing the bottom banner
		o.pframe = null; // the div containing the frame around the player
		o.hotspots = null; // the div containing the hotspots

		o.v = false; // indicates if the player is in view (following the message sent by the outstream frame)
		o.view = false; // the creative has been in view
		o.isMobile = false; // indicates if the device is a mobile
		o.p = false; // indicates if the player is playing
		o.l = false; // indicates if the player is loading a video
		o.r = false; // indicates if the player is ready

		o.pu = null; // pageurl 
		o.pagetitle = null; // title of the page, will be used for the search
		o.jid = null;

		// Controls for firing events
		o.imp = null;
		o.fPct = false;
		o.mPct = false;
		o.tPct = false;
		o.start = false; // true when a video starts, false when it ends
		o.adSlot = false;

		// Other
		o.callbackReady = null;

		o.init(p);
	}

	init(p) {
		if (p !== undefined && typeof p === 'object' && p !== null){ // checking if the parameter p is an oect
			var o = this;

			// Adding a window listener of events to retrieve the events from the top friendly iFrame
			o.addListener(window, 'message', o.jxMsgIn.bind(o));

			// We add the Dailymotion script  
			// Loading Dailymotion player will generate a call to window.dmAsyncInit function, 
			var e = document.createElement('script');
			e.async = true;
			e.src = 'https://api.dmcdn.net/all.js';
			var s = document.getElementsByTagName('script')[0];
			s.parentNode.insertBefore(e, s);

			// setting the parameters
			if (p.trackers) o.setTrackers(p.trackers)
			if (p.container) o.setContainer(p.container);
			if (p.player) o.tdiv = p.player;
			if (p.pageurl) o.pu = p.pageurl;
			if (p.jid) o.jid = p.jid;
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
					o.pagetitle = o.pagetitle.replace(exw[w].toLowerCase(),'');    				
				}
				o.pagetitle = o.pagetitle.replace(/ +(?= )/g,'').trim();
				// console.log("New pagetitle is: " + o.pagetitle);
			}
			if (p.pagekeywords) o.pagekeywords = p.pagekeywords.toLowerCase();
			if (o.pagekeywords && p.adparameters.excludewords !== undefined && p.adparameters.excludewords && p.adparameters.excludewords.length > 0){
				//console.log("We have words to exclude");
				var exw = p.adparameters.excludewords;
				for (var w=0; w < exw.length; w++){
					//console.log("Removing: " + exw[w]);
					o.pagekeywords = o.pagekeywords.replace(exw[w].toLowerCase(),'');    				
				}
				o.pagekeywords = o.pagekeywords.replace(/ +(?= )/g,'').trim();
				// console.log("New pagekeywords is: " + o.pagekeywords);
			}
			// get the "sort" property from adparameters option
			//not any funny value in the DB:
			if (p.adparameters.sort && o.sortTypes.indexOf(p.adparameters.sort)> -1)  {
				o.sort = p.adparameters.sort;
			}
		   o.jxDmDefer(o);
		} else {
			console.log("JX - Parameter is not an object");
		}
	}

	jxDmDefer(o) {
		if (window.dmScriptLoaded) {
			o.jxstartDM();
		} else {
			setTimeout(function() { o.jxDmDefer(o) }, 100);
		}
   	}

	jxstartDM(){
		var o = this;
		// console.log(JSON.stringify(p));

		// console.log("Starting the DM player");
		
		if (o.tdiv && o.adparameters){

			// Possibility to ad a display before of after the player
			if (o.topBannerTag){
				o.createAdSlot('top', o.topBannerTag);
			}

			// We create a div to host the dailymotion player
			o.dm = o.newDiv(o.tdiv, 'div', '', 'container_' + o.jid);

			if (o.bottomBannerTag){
				o.createAdSlot('bottom', o.bottomBannerTag);
			}

			// setting the player parameters
			o.pparams = {
				'controls': o.adparameters.controls || true,
				'ads_params': 'contextual',
				'ui-logo': false,
				'origin': o.domain || null,
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
			if (o.container){
				// console.log("JX - Dmplayer - Adding event listeners");
				o.container.addEventListener('jxvisible', function (e) {o.onVisible(o);});
				o.container.addEventListener('jxnotvisible', function (e) {o.onNotVisible(o);});
			}


			// We create a Dailymotion player instance
			//console.log("Params for the initialisation of the player: " + JSON.stringify(o.pparams));
			// Starting to play videos: try to call the search is any
			
			if (o.adparameters.search && o.adparameters.search == 'title' && o.pagetitle){
				//console.log("we run a search on the title");
				// We run a search on the title of the page
				o.apisearch(o, o.pagetitle);
				o.container.addEventListener('onSearchEnd', (e) => { o.createPlayer(o); });
			}else if (o.adparameters.search && o.adparameters.search == 'keywords' && o.pagekeywords) {
				// We run a search on the keywords of the page
				o.apisearch(o, o.pagekeywords);
				o.container.addEventListener('onSearchEnd', (e) => { o.createPlayer(o); });
			}else{
				//console.log("we use a playlist or a video");
				// It is not a search, we check if a playlist ID has been provided
				if (o.adparameters.defaultPlaylist){
					o.apiplaylist(o);
					o.container.addEventListener('onSearchEnd', (e) => { o.createPlayer(o) });
				}else if (o.adparameters.channel){ // and if defaultPlaylist ID is not provided, then we check if a channel has been provided
					o.apichannel(o);
					o.container.addEventListener('onSearchEnd', (e) => { o.createPlayer(o) });
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
	}

	// Function to process the messages received
	jxMsgIn(e){
		try{
			var o = this;
			if (e.data == 'jxvisible') {
				o.onVisible(o);
			}else if (e.data == 'jxnotvisible'){ 
				o.onNotVisible(o);
			}				
		}catch (e){
			console.log("Error when receiving message: " + e.message);
		}
	}

	onVisible(o){
		// console.log("We received a VISIBLE message or event");
		o.v = true; // setting the visibility
		if (!o.view){o.fire('creativeView');o.view = true;}
		if (!o.l){
			//console.log("No video loaded, we load a video");
			o.LoadNextVideo(o); // if there is no video already loaded then we load the next video
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
	}

	onNotVisible(o){
		// console.log("We received a not visible message or event, we PAUSE the video");
		o.v = false;
		if (o.p){
			o.player.pause(); // a video is playing, then we pause the video
			o.p = false;
		}
	}

	onFloat(o){
		//
	}

	onDocked(o){
		//
	}

	onFloatClose(o){
		//
	}

/**********************************************************************************************************
 *                                      Advertising functions
**********************************************************************************************************/

	// Create an ad slot according to the position provided. For now top or bottom
	// Parameters: 
	// - p: the position of the slot (top or bottom)
	// - tag: the object containing the tag
	createAdSlot(p, tag){
		var o = this;
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
					o.topBanner = pElmt;
					o.tdiv.parentNode.insertBefore(pElmt, o.tdiv);
					if (tag.clickurl) o.addListener(pElmt, 'click', o.onTopBannerClick);
				}
				else if (p == 'bottom'){
					o.bottomBanner = pElmt;
					o.tdiv.parentNode.appendChild(pElmt);
					if (tag.clickurl) o.addListener(pElmt, 'click', o.onBottomBannerClick);
				}
				o.addListener(pElmt, 'load', o.onWindowResize);
		}else{
			pElmt = document.createElement('iframe');
			pElmt.src = tag.url;
			pElmt.className = 'adslot';
			pElmt.style.border = 'none';
			pElmt.setAttribute('frameborder', '0');
			pElmt.setAttribute('scrolling', 'no');
				if (p == 'top'){
					o.topBanner = pElmt;
					o.tdiv.parentNode.insertBefore(pElmt, o.tdiv);
					o.checkTopAdIframeLoaded();
				}else if (p == 'bottom'){
					o.bottomBanner = pElmt;
					o.tdiv.parentNode.appendChild(o.bottomBanner);
					o.checkBottomAdIframeLoaded();	
				}
		}
			//pElmt.style.maxWidth = this.ivs.offsetWidth;
			pElmt.style.left = '0';
			pElmt.style.top = '0';
			pElmt.style.marginBottom = '0px';
			pElmt.style.marginTop = '5px';
		}
	}

	// Check if top ad iFrame is loaded
	checkTopAdIframeLoaded(){
		var o = this;
		o.checkIframeLoaded(o.topBanner, o.onWindowResize, o.checkTopAdIframeLoaded);
	}

	// Check if bottom ad iFrame is loaded
	checkBottomAdIframeLoaded(){
		var o = this;
		o.checkIframeLoaded(o.bottomBanner, o.onWindowResize, o.checkBottomAdIframeLoaded);
	}
	
	onTopBannerClick(){
		var o = this;
		if (o.topBannerTag.clickurl){
			o.fire('click','topbanner');
			//console.log("clickurl: -" + clickurl + "-");
			window.open(clickurl, '_blank');	    		
		}
	}

	onBottomBannerClick(){
		var o = this;
		if (o.bottomBannerTag.clickurl){
			o.fire('click','bottombanner');
			//console.log("clickurl: -" + clickurl + "-");
			window.open(clickurl, '_blank');    		
		}
	}

/**********************************************************************************************************
 *                                      Dailymotion player controls
 **********************************************************************************************************/
	/**
	 * Takes a string and returns keywords following some rules
	 * 
	 * @param title {string} a sentence
	 * @returns {array} keywords
	 */
	sanitizeTitle(title){
		return  title.normalize('NFD').
					replace(/[\u0300-\u036f]/g, '').toLowerCase().
					//replace(/[^a-zA-Z0-9]/g, '').
					replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"]/g,'').split(' ').
					filter(word => word.length >= this.minWordLength);
	}

	// Function called when the API of the player is ready. 
	// It calls a function called onDMPlayerReady, similar to YouTube integration. 
	apiready(obj){
		// console.log("DM player API is ready");

		// Adding all the events catching from the player
		obj.player.addEventListener('end', obj.EventVideoEnd.bind(obj));
		obj.player.addEventListener('error', obj.EventVideoError.bind(obj));
		//obj.player.addEventListener('loadedmetadata', obj.EventVideoData);
		obj.player.addEventListener('pause', obj.EventVideoPause.bind(obj));
		obj.player.addEventListener('start', obj.EventVideoStart.bind(obj));
		obj.player.addEventListener('playing', obj.EventVideoPlay.bind(obj));
		obj.player.addEventListener('timeupdate', obj.EventVideoDuration.bind(obj));
		obj.player.addEventListener('playback_ready', obj.EventPlayBackReady.bind(obj));
		obj.player.addEventListener('ad_start', obj.EventAdStart.bind(obj));
		obj.player.addEventListener('ad_end', obj.EventAdEnd.bind(obj));
		obj.initialisePlayer(obj);
	}

	// function for make an API call to get list of videos based on the user (in this case it means channel)
	apichannel(o) {
		var searchParams = {
			'fields': 'id,title',
			'limit': 20,
			'sort': o.sort,
		};

		var e = new Event('onSearchEnd');

		DM.api("/user/" + o.adparameters.channel + "/videos", searchParams , 
			function(response){
				if("list" in response && response.list.length > 0){
					o.videolist = response.list;
					o.container.dispatchEvent(e);
				}else{
					if(o.adparameters.defaultVideo){
						o.videolist.push({id: o.adparameters.defaultVideo}); // we add the default video to the list of videos to play
						o.container.dispatchEvent(e);
					}else{
						console.log("Warning: nothing to play in Dailymotion player");
					}
				}                    
			}
		);
	}

	apisearch(o, key){
		if (!o.searchParams){
			o.searchParams = {    
				'fields': 'id,title',
				'sort': 'relevance',
				'limit': 10,
				'search': o.sanitizeTitle(key).sort((a, b) => b.length - a.length).slice(0, o.maxWordSearch).join(' ')
			};

			if(!o.adparameters.searchInPlaylist) o.searchParams.private = 0;
			if(!o.adparameters.searchInPlaylist) o.searchParams.longer_than = 0.35; //21sec
			if(!o.adparameters.searchInPlaylist && o.adparameters.owners) o.searchParams.owners = o.adparameters.owners;
			if(!o.adparameters.searchInPlaylist && o.adparameters.category) o.searchParams.channel = o.adparameters.category;
			if(!o.adparameters.searchInPlaylist && o.adparameters.excludeIds) o.searchParams.exclude_ids = o.adparameters.excludeIds;
			if(o.adparameters.language) o.searchParams.language = o.adparameters.language;
		}

		var e = new Event('onSearchEnd');

		//console.log("%c DM related ", "background: #56C7FF; color: #232323", "Search: " + JSON.stringify(o.searchParams));

		DM.api("/" + (o.adparameters.searchInPlaylist ? "playlist/" + o.adparameters.searchInPlaylist + "/videos" : "videos"), o.searchParams , 
			function(response){
				if("list" in response && response.list.length > 0){
					o.videolist = response.list;
					o.container.dispatchEvent(e);
				} 
				else{
					o.searchParams.search = o.searchParams.search.substring(0, o.searchParams.search.lastIndexOf(' '));
					if(o.searchParams.search.split(' ').length >= o.minWordSearch) 
						o.apisearch(o, key);
					else{
						//console.log("%c DM related ", "background: #56C7FF; color: #232323", "Can not find related video. Fallback video used.");
						if (o.adparameters.defaultPlaylist){
							o.apiplaylist(o);
						}else if (o.adparameters.channel) {
							o.apichannel(o);
						}else if(o.adparameters.defaultVideo){
							o.videolist.push({id: o.adparameters.defaultVideo}); // we add the default video to the list of videos to play
							o.container.dispatchEvent(e);
						}else{
							console.log("Warning: nothing to play in Dailymotion player");
						}
					}
				}  
			}
		);
	}

	// API to retrieve the videos of a playlist
	apiplaylist(o){
		var searchParams = {
			'fields': 'id,title',
			'limit': 20,
		};

		var e = new Event('onSearchEnd');

		//console.log("We retrieve the videos of the playlist with id:" + o.adparameters.defaultPlaylist);

		DM.api("/playlist/" + o.adparameters.defaultPlaylist + "/videos", searchParams , 
			function(response){
				if("list" in response && response.list.length > 0){
					o.videolist = response.list;
					o.container.dispatchEvent(e);
				}else{
					if(o.adparameters.defaultVideo){
						o.videolist.push({id: o.adparameters.defaultVideo}); // we add the default video to the list of videos to play
						o.container.dispatchEvent(e);
					}else{
						console.log("Warning: nothing to play in Dailymotion player");
					}
				}                    
			}
		);
	}


	// Creates the player
	createPlayer(obj){
		try{
			if (obj.videolist && obj.videolist.length > 0){
				//console.log("List of retrieved videos: " + JSON.stringify(obj.videolist));
				var vdo = obj.videolist.shift();
				obj.callbackReady(vdo);
				var params = {width:"100%", height:"100%", video: vdo.id, params:obj.pparams};
				// console.log("Creating the player with params and without video ID: " + JSON.stringify(params));
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
	}

	/**
	 *
	 * Initialize the player
	 *
	 */
	initialisePlayer(obj){
		// console.log("We initialise the player");
		if (obj.player){
			parent.postMessage('jxhasad', '*');
			obj.container.dispatchEvent(new Event('jxhasad'));
			
			if(obj.adparameters.unMuteOnHover) obj.player.addEventListener("mouseover", () => { if (obj.p) obj.player.setMuted(false);});
			if(obj.adparameters.unMuteOnHover === "strict") obj.player.addEventListener("mouseout", () => { if (obj.p) obj.player.setMuted(true); }); 		 		
		}else{
			console.log("Warning, the Dailymotion player is not available");
		}
	}

	/**
	 * Load the next video in the player (used when the player is visible and when the video ends to load the next video)
	 */
	LoadNextVideo(o){
		try{
			//console.log("Loading next video");
			if (o.videolist && o.videolist.length > 0){
				var vdo = o.videolist.shift(); // we get the next video
				o.callbackReady(vdo); // to update the title in the widget
				if (o.auto){
					o.player.load({video: vdo.id, 'queue-enable': true, 'queue-autoplay-next': true});
				}else{
					o.player.load({video: vdo.id, 'autoplay': true, 'queue-enable': true, 'queue-autoplay-next': true});	            		
				}
				if (o.videolist.length == 0){
					// if there is no more video left in the list of videos, then we add the autoplay and queue enabled
					if (o.adparameters.defaultPlaylist) o.apiplaylist(); // if there is a playlist, well we (re)load it ;-) It will replace the current (empty) list of videos
				}
				o.l = true;
			}
		}catch (e){
			console.log("Error when loading the next video: " + e.message);
		}
	}

	/**
	 * Handle player events
	 */

	EventAdStart(e){
		this.fire('padstart');
	}

	
	EventAdEnd(e){
		this.fire('padend');
	}

	EventVideoEnd(e){
		var o = this;
		if (o.p){
			// If the video was playing, otherwise it is certainly an error
			o.fire('complete');
			o.fPct = false;
			o.mPct = false;
			o.tPct = false;
			o.imp = false;
			o.start = false;
			o.l = false; // no more video loaded (end of video), indicates we can load a new video
			o.r = false;
			o.adSlot = false;
			// Loading the next video of the list
			o.LoadNextVideo(o);
		}
	}

	EventVideoError(e){
		var o = this;
		//console.log("The player fired an error.");
		//console.log(e.code);
		//console.log(e.title);
		//console.log(e.message);
		if (e.code) o.fire('error', e.code);
		else o.fire('error');
	}

	EventPlayBackReady(e){
		var o = this;
		o.r = true;
		// We check 3s later if the video started or not. If not, we call the play function of the player to force to play
		setTimeout(() => {  if (!o.p && o.adparameters.autoPlay == 'wifi' && o.wifi && o.v) o.player.play(); }, 3000);
	}

	/*
	EventVideoData: function(e){
		console.log("We have video data, yeah!");
		this.callbackReady(e.target.video);
		parent.postMessage('jxhasad', '*');
	},*/
	
	EventVideoPause(e){
		var o = this;
		if (o.v){
			//console.log("Firing a video pause");
			o.fire('pause');
		}else{
			//console.log("Pausing a video which is not in the viewport");
		}
		o.p = false; // The player is no more playing
	}
	
	EventVideoStart(e){
		//console.log("Receiving event start");
	}

	EventVideoPlay(e){
		var o = this;
		try{
			o.p = true; // The player is playing
			if (!o.v){
				// The player is not visible, it is a "violent" autoplay so we stop playing
				o.player.pause();
			}else if (o.start){
				o.fire('resume');
			}
		}catch (e){
			console.log("Error when receiving event play: " + e.message);
		}
	}

	EventVideoDuration(e){
		var o = this;
		var player = e.target;
		if (parseFloat(player.currentTime) > 0){
			if (!o.start && o.v){
				o.fire('start');
				o.start = true;
				if (o.auto) o.fire('click','autoplay'); // the player is autoplay, then we do it autoplay
				else o.fire('click','play'); // otherwise it means click to play
			}
			if (!o.adSlot && o.v) {
				o.fire('padslot');
				o.adSlot = true;
			}
			if (parseFloat(player.currentTime) > 2 && o.v && !o.imp){
				o.fire('impression');
				o.imp = true;
			}
			var ratio = (parseFloat(player.currentTime) || 0) / parseFloat(player.duration);
			if (ratio >= 0.25 && !o.fPct){o.fire('firstQuartile'); o.fPct = true;}
			if (ratio >= 0.5 && !o.mPct){o.fire('midpoint'); o.mPct = true;}
			if (ratio >= 0.75 && !o.tPct){o.fire('thirdQuartile'); o.tPct = true;}
			//console.log('Ratio updated to ' + ratio);
		}
	}

	/*******************************************************************************************************************
	 *
	 *                                    UTILITIES FUNCTION USED IN MOST OF THE SCRIPTS
	 *
	 *******************************************************************************************************************/

	// Function to create a new div: parent is the parent, type is the type of element, html is the content of the element if any, className is the list of classes (separated with spaces)
	// Parameters: p parent, t type, h html, c class name, id
	newDiv(p, t, h, c, id){
		var nd = document.createElement(t);
		if (h && h != '') nd.innerHTML = h;
		nd.className = c;
		if (id) nd.id = id;
		p.appendChild(nd);
		return nd;
	}

	// Add a listener of the event to the element e which calls the function handler h
	addListener(e, event, h) {
		if (e.addEventListener) {
			//console.log('adding event listener');
			e.addEventListener(event, h, false);
		} else if (e.attachEvent) {
			e.attachEvent('on' + event, h);
		} else {
			e[ 'on' + event] = h;
		}
	}

	// Check if an iFrame is loaded and if yes then call the function fctloaded, otherwise try again to call the function fct 
	// until the iFrame is fully loaded. Local indicates if it is a friendly iFrame (true) or 3rd party (false, default)
	checkIframeLoaded(iframe, fctloaded, fct, local) {
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
	}

	// Function to set the container 
	setContainer(c){
		this.container = c;
	}

	// Function called when the window is resized. We just send a message to the parent of the iFrame with the new dimensions
	onWindowResize(e){
		//console.log("Sending a message to parent iFrame with new height");
		if (this.container)
			parent.postMessage('jxmsg::' + JSON.stringify({'type': 'size',params: {'height': this.container.offsetHeight}}), '*');
		else
			parent.postMessage('jxmsg::' + JSON.stringify({'type': 'size',params: {'height': document.body.offsetHeight}}), '*');
	}

	// This function is used to set the tracker variable
	setTrackers(trackers){
		this.trackers = trackers;
	}

	// Function to fire a click event
	onClick(){
		this.fire('click', null);
	}

	// This function fires an event of type event following the trackers that have been provided
	fire(event, clickid){
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
	}
}