

		var iFrameLoaded = false;
		var iFrameVisible = false;
		var impression = false;
		var cv = false;
		var eventURL = null;

		(function() {
		    // check for run-once only
		    if (window.jxiFrame)
		        return;

		    window.jxiFrame = {
		        // Set variables
		        jxparams : null,

		        // functions

		        // Main function used to launch the outstream
		        jxstartiFrame: function(){
		        	params = getUrlParams();

					var creative = null;
					if (params.creative) creative = JSON.parse(atob(params.creative));
					var domain = params.domain || null;
					var pageurl = params.pageurl || null;
					var device = params.device || null;
					eventURL = creative.trackers.baseurl + "?" + creative.trackers.parameters;
					var srcUrl = creative.url || null;

		            this.jxiframeElement = document.createElement('iframe');
		            this.jxiframeElement.id = "jxoutstreamiframe_" + Math.floor(Math.random() * 100000) + 1;
		            this.jxiframeElement.onload = function() { 
		            	iFrameLoaded = true; 
		    			parent.postMessage('jxhasad', '*');
		            };
		            this.jxiframeElement.src = srcUrl;

		            this.jxiframeElement.style.maxWidth = 'none !important'; 
		            this.jxiframeElement.style.maxHeight = 'none !important';
		            this.jxiframeElement.style.position = 'absolute';
		            this.jxiframeElement.style.left = '0';
		            this.jxiframeElement.style.top = '0';
		            this.jxiframeElement.style.backgroundColor = 'transparent';
		            this.jxiframeElement.style.border = 'none';
		            this.jxiframeElement.style.width = '100%';
		            this.jxiframeElement.style.height = '100%';

		            this.jxiframeElement.setAttribute('frameborder', '0');
		            this.jxiframeElement.setAttribute('scrolling', 'no');
		            this.jxiframeElement.setAttribute('allowTransparency', 'true');

		            document.getElementById('wrapper').appendChild(this.jxiframeElement);
		        },

		    }; // end of object declaration
		    
		    // prepare initialization
		    if (/comp|inter|loaded/.test(document.readyState))
		        window.jxoutstream.jxstartiFrame();
		    else
		        document.addEventListener("DOMContentLoaded", window.jxiFrame.jxstartiFrame.bind(window.jxiFrame));

		})();

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

		var intervalTimer;
	  	// Function to listen to the messages from the parent of the iFrame
		window.onmessage = function(e){
    		if (e.data == 'jxvisible') {
    			//console.log("visible");
				if (!cv) {
					cv = true; //so we dun fire again
	        		fireEvent('creativeView');
				}
				iFrameVisible = true;
	        	intervalTimer = setInterval(
	            	function() {
	            		if (iFrameLoaded && iFrameVisible && !impression){
	            			fireEvent('impression');
	            			impression = true;
	            		}
	            		if (impression) clearInterval(intervalTimer);
		            },
		            2000); // every 2 seconds
    		}else if (e.data == 'jxnotvisible'){ 
    			//console.log("hidden");
	        	fireEvent('creativeHide');
	        	iFrameVisible = false;
    		}
		};

		window.focus(); //force focus on the currenct window;
		window.addEventListener('blur', function(e){
    		if(document.activeElement == document.querySelector('iframe'))
    		{
    			if (iFrameLoaded && impression){
    				fireEvent('click');
        			//alert('Focus Left Current Window and Moved to Iframe / Possible click!');
    			}
    		}
		});

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
