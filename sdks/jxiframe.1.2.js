

		var iFrameLoaded = false;
		var iFrameVisible = false;
		var impression = false;
		var cv = false;
		var eventURL = null;
		var suppressClickApprox = false;

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

		/*
		{"data":"jxevtc","value":"jxsuppress"}
		jxiframe.1.1.min.js:82 {"data":"jxevtc","id":"link2","url":"https://www.kompas.com"}
		jxiframe.1.1.min.js:82 {"data":"jxevtc","id":"link2"}

		jxmsg::{"type":"jxsuppress","params":{"action":"jxsuppress","value":"click1"}}
		jxiframe.1.1.min.js:82 jxmsg::{"type":"click","params":{"action":"click","value":"link211"}}

		*/
		var intervalTimer;
	  	// Function to listen to the messages from the parent of the iFrame
		window.onmessage = function(e){
			//console.log(`### ${JSON.stringify(e.data, null, 2)}`);
            let type;
			j = e;
			type = e.data;
			//<--
			if (e.data && typeof e.data === 'string' && e.data.indexOf('jxmsg::') == 0) {
                try {
                    j = JSON.parse(e.data.substr('jxmsg::'.length));
					//console.log(`###### ${JSON.stringify(j, null, 2)}`);
					type = j.type;
                }
                catch(err) { j = {};}
            }
			//-->
            if (type == 'jxsuppress') { //we should suppress click by our approximate
				suppressClickApprox = true;
            }
			if (type == 'click') { 
				suppressClickApprox = true;
				let extra = (j.params && j.params.id ? 'clickid='+j.params.id: null);
				fireEvent('click', extra);
				if (j.params && j.params.url) {
					// should do the click-proxy way:
					// TODO 
					window.open(j.params.url)
				}
            }
			
    		if (type == 'jxvisible') {
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
    		}else if (type == 'jxnotvisible'){ 
    			//console.log("hidden");
	        	fireEvent('creativeHide');
	        	iFrameVisible = false;
    		}
		};

		window.focus(); //force focus on the currenct window;
		window.addEventListener('blur', function(e){
    		if(document.activeElement == document.querySelector('iframe'))
    		{
    			if (iFrameLoaded && impression && !suppressClickApprox){
					fireEvent('click');
        			//alert('Focus Left Current Window and Moved to Iframe / Possible click!');
    			}
    		}
		});

	  	function fireEvent(typeevent, extra = null){
		    var urlToCall = eventURL + "&action=" + typeevent;
			if (extra) {
				urlToCall += '&' + extra;

			}
		    var xmlhttp;
		    if (window.XMLHttpRequest) xmlhttp = new XMLHttpRequest();
		    else xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		    //console.log(urlToCall);
		    xmlhttp.open('GET', urlToCall, true);
		    xmlhttp.withCredentials = true;
		    xmlhttp.crossDomain = true;
		    xmlhttp.send();
	  	}
	



