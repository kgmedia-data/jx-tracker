		var tag = document.createElement('script');
		tag.id = 'iframe-demo';
		tag.src = 'https://www.youtube.com/iframe_api';
		var firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

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

		var params = getUrlParams();
		var creative = null;
		if (params.creative) creative = JSON.parse(atob(params.creative));
		else console.log("JX - ERROR no creative provided");

		console.log(JSON.stringify(params));

		var domain = params.domain || null;
		var pageurl = params.pageurl || null;
		var device = params.device || null;
		var autoplay = null;
		if (creative.autoplay !== 'undefined'){
			if (creative.autoplay == 0) autoplay = 0; else autoplay = 1;
		}else{
			autoplay = 0;
		}
		var eventURL = creative.trackers.baseurl + "?" + creative.trackers.parameters;

		// useful execution variables
		var toload = false;
		var playerready = false;
		var playerpaused = false;
		var loop = false;
		var clicked = false;
		var creativeInView = false, inViewFired = false, hiddenFired = false;


		//console.log(JSON.stringify(creative));

		var width = (parseInt(creative.width)-10) || 640;
		var height = (parseInt(creative.height)-10) || 360;

	  	var player;
	  	function onYouTubeIframeAPIReady() {
	    	player = new YT.Player('player', {
          		height: height,
          		width: width,
            	videoId: creative.url,
    	    	events: {
		          'onReady': onPlayerReady,
		          'onStateChange': onPlayerStateChange,
		          'onError': onPlayerError
		        }
		    });
		}
		function onPlayerReady(event) {
		    if (toload && autoplay > 0){
		    	event.target.setVolume(0);
		    	event.target.playVideo();	
		    } 
		    playerready = true;
		    parent.postMessage('jxhasad', '*');
		}

		var progress = 0;
	  	function onPlayerStateChange(event) {
	    	if (event.data == 0) { // end
				if (!loop) fireEvent('complete');
				player.playVideo();
				loop = true;
	    	} else if (event.data == 1) { // playing
	    		if (!loop){
		    		var intervalTimer = setInterval(
	            		function() {
		            		if ((player.getCurrentTime() > 2)&&(progress == 0)){fireEvent('impression'); progress++;}
		            		var pctViewed = player.getCurrentTime() / player.getDuration();
		            		if ((pctViewed > 0.25)&&(progress == 1)){fireEvent('firstQuartile'); progress++;}
		            		if ((pctViewed > 0.5)&&(progress == 2)){fireEvent('midpoint'); progress++;}
		            		if ((pctViewed > 0.25)&&(progress == 3)){fireEvent('thirdQuartile'); progress++;}
		            	},
		            	1000); // every second	    			
	    		}
	    	} else if (event.data == 2) { // paused
	    		/* We don't open anymore if the user is not clicking on title of the unit or the learn more button. We focus on YouTube play generation.
	    		if (!playerpaused){
	    			if (!clicked){
						fireEvent('click');
						window.open(creative.clickurl, '_blank');
						clicked = true;
	    			}
	    		}*/
	    	}
	  	}

	  	function onPlayerError(event){
			fireEvent('error');
	  	}

	  	function fireEvent(typeevent){
	  		var urlToCall = eventURL + "&action=" + typeevent;
        	var xmlhttp;
            if (window.XMLHttpRequest) xmlhttp = new XMLHttpRequest();
            else xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	        //console.log(urlToCall);
	        xmlhttp.open('GET', urlToCall, true);
            xmlhttp.withCredentials = true;
            xmlhttp.crossDomain = true;
	        xmlhttp.send();
	  	}

	  	// Function to listen to the messages from the parent of the iFrame
		window.onmessage = function(e){
    		if (e.data == 'jxvisible') {
	        	//console.log('youtube bridge: visible message received');
	        	toload = true;
	        	if (playerready && autoplay > 0) {
	        		player.setVolume(0);
	        		player.playVideo();
	        		playerpaused = false;
	        	}
	      		if (!creativeInView){
	      			if (!inViewFired){
	        			fireEvent('creativeView');
	        			inViewFired = true;
	        		}
	        		creativeInView = true;
	      		}
    		}else if (e.data == 'jxnotvisible'){ 
      			//console.log('youtube bridge: the ad is no more visible, we pause it');
      			if (playerready) {player.pauseVideo(); playerpaused = true;}
	      		if (creativeInView){
	        		if (!hiddenFired){
						fireEvent('creativeHide');
						hiddenFired = true;
					}
	        		creativeInView = false;
	      		}
    		}else if (e.data == 'jxclick'){ 
      			//console.log('youtube bridge: the ad is no more visible, we pause it');
      			clicked = true;
      			if (playerready) {player.pauseVideo(); playerpaused = true;}
    		}
		};
