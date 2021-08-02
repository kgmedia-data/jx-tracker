
(function() {
    var currentScript = document.currentScript;
    var iframeElement = null, bnDiv = null, bnScaleDiv = null, bnFixedDiv = null, width = 300, height = 250;
    var trackers = null, domain=null, pageurl=null, device=null;
    var clickurl = null;
    var isEmbed = false;
    var clicktracker = null;
    var image = false, jxvisible = false, jximpression = false, creativeInView = false, inViewFired = false, hiddenFired = false;

    createIframe();

    function createIframe() {
        var urlParams = getUrlParams();
        var srcUrl = urlParams.url || ''; // path to the creative 
        clickurl = urlParams.clickurl || ''; 

        trackers = urlParams.trackers || ''; // trackers to call
        domain = urlParams.domain || ''; 
        pageurl = urlParams.pageurl || ''; 
        device = urlParams.device || ''; 
        isEmbed = urlParams.embed || false; 

        var responsive = urlParams.responsive || 1; // indicate if responsive
        width = urlParams.w || 300; // width for ratio when responsive or fixed width
        height = urlParams.h || 250; // height for ratio when responsive of fixed height
        var error = false;

        if (!srcUrl){
            srcUrl = "https://creatives.jixie.io/error.html?";
            error = true;
        }else{
            srcUrl = atob(srcUrl);
        }

        if (clickurl){
            clickurl = atob(clickurl);
        }

        if (trackers){
            if(srcUrl.indexOf('?') != -1){
                // There is already some query parameters, we add the trackers to call 
                srcUrl += '&trackers=' + trackers;
            }else{
                // There is no existing query parameters, then we add the trackers
                srcUrl += '?trackers=' + trackers;                        
            }
            trackers = JSON.parse(atob(trackers));
        }
        

        // We create the iFrame element which will contain the creative. If html file, then we add it in a "real" iFrame
        // if image then we add it in a friendly iFrame and we set the different trackers
        var parser = document.createElement('a');
        parser.href = srcUrl;
        //console.log("Pathname: " + parser.pathname)
        if (parser.pathname.indexOf('.htm') !== -1 || parser.pathname.indexOf('.html') !== -1){
            iframeElement = document.createElement('iframe');
            iframeElement.src = srcUrl;
        }else{
            // Here we consider it is an image, then we create an iFrame accordingly
            image = true;
            iframeElement = document.createElement('div');
            addListener(iframeElement, 'click', onImageClick);

            iframeElement.innerHTML = '<img src="' + srcUrl + '" class="jxImg"/>';
        }

        iframeElement.style.maxWidth = 'none !important';
        iframeElement.style.maxHeight = 'none !important';
        iframeElement.style.position = 'absolute';
        iframeElement.style.left = '0';
        iframeElement.style.top = '0';
        iframeElement.style.backgroundColor = 'transparent';
        iframeElement.style.border = 'none';
        iframeElement.style.width = width + 'px';
        iframeElement.style.height = height + 'px';

        iframeElement.setAttribute('frameborder', '0');
        iframeElement.setAttribute('scrolling', 'no');
        iframeElement.setAttribute('allowTransparency', 'true');

        bnDiv = document.createElement('div');
        bnScaleDiv = document.createElement('div');
        bnFixedDiv = document.createElement('div');

        if (currentScript && currentScript.parentNode && currentScript.parentNode.nodeName.toLowerCase() != 'head') {
            currentScript.parentNode.appendChild(bnDiv);
        } else {
            document.body.appendChild(bnDiv);
        }

        bnDiv.appendChild(bnScaleDiv);
        bnScaleDiv.appendChild(bnFixedDiv);
        bnFixedDiv.appendChild(iframeElement);

        bnDiv.style.position = 'relative';
        bnDiv.style.width = width + 'px';
        bnDiv.style.height = height + 'px';
        bnDiv.style.overflow = 'hidden';

        bnFixedDiv.style.width = width + 'px';
        bnFixedDiv.style.height = height + 'px';

        bnScaleDiv.style.width = width + 'px';
        bnScaleDiv.style.height = height + 'px';

        if (responsive == 1) {
            bnDiv.style.width = '100%';
            onWindowResize({target:window});
            addListener(window, 'resize', onWindowResize);
        }

        parent.postMessage('jxhasad', '*');

    }

    function getUrlParams() {
        var params = {};
        var dirtyVars = currentScript.src.match(/(\?|\&)([^=]+)\=([^&]+)/gi);
        if (dirtyVars && dirtyVars.length > 0) {
        dirtyVars.forEach(function(candidate, index) {
        var pair = candidate.replace(/[&\\?]/, '').split('=');
        params[pair[ 0]] = pair[ 1];
        });
        }
        return params;
    }

    function onWindowResize(e) {
        var ratio = bnDiv.offsetWidth / width,
            newH = height*ratio;

        bnScaleDiv.style.transform = 'scale(' + ratio + ') translate3d(0px, 0px, 0px)';
        bnScaleDiv.style.transformOrigin = '0px 0px 0px';
        bnDiv.style.height = newH + 'px';
    }

    function addListener(element, event, handler) {
        if (element.addEventListener) {
        element.addEventListener(event, handler, false);
        } else if (element.attachEvent) {
        element.attachEvent('on' + event, handler);
        } else {
        element[ 'on' + event] = handler;
        }
    }

    function onImageClick(){
        jxFireEvent('click');
        //console.log("clickurl: -" + clickurl + "-");
        if (clickurl) window.open(clickurl, '_blank');
    }


    function jxFireClickEvent(){
        jxFireEvent('click');        
    }

    function jxFireEvent(event){
        parent.postMessage('jx' + event, '*')
        var urlToCall = trackers.baseurl + "?" 
                    + trackers.parameters 
                    + "&action=" + event;
        //console.log('firering to ' + urlToCall);
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
            jxvisible = true;
            if (image){ // we fire the impression event only if it is an image (if html then it is under the responsibility of the HTML file)
                if (!jximpression){
                    if (!isEmbed){
                        var jxinter = window.setInterval(function() {
                            if (jxvisible){
                                if (!jximpression){
                                    jxFireEvent('impression');
                                    jximpression = true;
                                }
                            }
                            window.clearInterval(jxinter);
                        },2000); // we fire an impression after 2 second in view                    
                    }else{
                        // Si la creative is embeded, then we don't fire any impression (parameter embed)
                        jximpression = true;
                    }
                }
            }

            if (!creativeInView){
                if (!inViewFired){
                    jxFireEvent('creativeView');
                    inViewFired = true;
                }
                creativeInView = true;
            }
        }else if (e.data == 'jxnotvisible'){ 
            if (creativeInView){
                if (!hiddenFired){
                    jxFireEvent('creativeHide');
                    hiddenFired = true;
                }
                creativeInView = false;
            }
        }
    }
})();







