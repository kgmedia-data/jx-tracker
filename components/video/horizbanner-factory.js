function fireTracker(url) {
    fetch(url, {
            method: 'get',
            credentials: 'include'
        })
        .catch((ee) => {});
}

function addListener(e, event, h) {
    if (e.addEventListener) {
        e.addEventListener(event, h, false);
    } else if (e.attachEvent) {
        e.attachEvent('on' + event, h);
    } else {
        e['on' + event] = h;
    }
}

let MakeOneHorizBanner_ = function(adDiv, masterObj, pos) {
    var _boundNoGAdListener = null;

    function FactoryOneHorizBanner(adDiv, masterObj, pos) {
        _createBanner(adDiv, masterObj, pos);
    }

    /**
     * 
     * @param {*} masterObj 
     * @param {*} pos 
     * @returns 
     */
    function _doImgBanner(masterObj, pos) {
        let obj = masterObj.companion[pos];
        let pElmt = document.createElement('div'); // create a div 
        pElmt.style.cursor = "pointer";
        pElmt.style.margin = "auto";
        // create an img tag
        //what class? We dun have it yet?
        pElmt.innerHTML = '<img src="' + obj.url + '" width="100%" height="' + obj.height + '" class="jxImg"/>';
        // set the width and height of the div
        if (obj.width && obj.height) {
            pElmt.style.width = obj.width + "px";
            pElmt.style.height = obj.height + "px";
        } else {
            pElmt.style.width = "100%";
            pElmt.style.maxWidth = "100%";
        }
        if (obj.clicktracker) {
            addListener(pElmt, 'click', function() {
                fireTracker(obj.tracker4click)
            });
        }
        return pElmt;
    }

    /**
     * 
     * @param {*} e 
     * @returns 
     */
    function __noGoogleAdListener(e) {
        let pos = (e.data == 'jxnobanneradtop' ? 'top' : (e.data == 'jxnobanneradbottom' ? 'bottom' : null));
        if (!pos) return;
        let sizeObj = this.masterObj;
        let iFr = document.getElementById(pos + 'banner');
        iFr.style.display = "none"; // set the display of iframe to none
        if (sizeObj.companion && sizeObj.companion[pos]) {
            delete sizeObj.companion[pos];
        }
        let h = sizeObj.height;
        if (pos == 'top' && sizeObj.companion['bottom'])
            h += sizeObj.companion['bottom'].height + sizeObj.companion['bottom'].gap;
        else if (pos == 'bottom' && sizeObj.companion['top'])
            h += sizeObj.companion['top'].height + sizeObj.companion['top'].gap;
        //change size
        parent.postMessage('jxmsg::' + JSON.stringify({
            'type': 'size',
            params: {
                'height': h
            }
        }), '*');
    }

    function _doScriptBanner(masterObj, pos) {
        let obj = masterObj.companion[pos];
        let script = null;
        let ifr = null;
        try {
            script = atob(obj.script); // decode the script
        } catch (e) {}
        let s = '';
        if (script && script.includes("<script") && script.includes("googletag.pubads()")) {
            s = `googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                if (event.isEmpty) {
                    var id = event.slot.getSlotElementId();
                    var x = document.getElementById(id);
                    x.parentElement.style.display = "none";
                    parent.postMessage("jxnobannerad${pos}", "*");
                }
            });`;
            if (!_boundNoGAdListener) {
                _boundNoGAdListener = __noGoogleAdListener.bind({
                    masterObj: masterObj
                });
                window.addEventListener('message', _boundNoGAdListener, false);
                setTimeout(function() {
                    if (_boundNoGAdListener) {
                        window.removeEventListener('message', _boundNoGAdListener);
                        _boundNoGAdListener = null;
                    }
                }, 5000);
            }
        } else {
            s = script;
        }
        ifr = document.createElement('iframe');
        ifr.id = pos + "banner";
        ifr.style.border = 'none';
        ifr.setAttribute('frameborder', '0');
        ifr.setAttribute('scrolling', 'no');
        if (obj.width && obj.height) {
            ifr.style.width = obj.width + "px";
            ifr.style.height = obj.height + "px";
        } else { //??
            ifr.onload = function(e) {
                ifr.style.width = e.target.contentWindow.document.body.scrollWidth;
                ifr.style.height = e.target.contentWindow.document.body.scrollHeight;
            }
        }
        let interval = setInterval(function() {
            if (ifr.contentWindow.document || ifr.contentDocument) {
                clearInterval(interval);
                var doc = ifr.contentWindow.document || ifr.contentDocument;
                var jxjs = doc.createElement('script');
                if (s != "") {
                    var script_body = document.createTextNode(s);
                    jxjs.appendChild(script_body);
                }
                doc.open();
                doc.write('<!DOCTYPE html>' +
                    '<html>' +
                    '<head>' +
                    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
                    '</head>' +
                    '<body style="margin: 0;">' +
                    script +
                    jxjs.outerHTML +
                    '</body>' +
                    '</html>');
                doc.close();
                focus();
                addListener(window, 'blur', function(e) {
                    if (document.activeElement == ifr) {
                        fireTracker(obj.tracker4click, position == 'top' ? 'click2' : 'click3');
                    }
                });

            }
        }, 500);
        return ifr;
    }

    /**
     * 
     * @param {*} adDiv 
     * @param {*} masterObj 
     * @param {*} pos 
     */
    function _createBanner(adDiv, masterObj, pos) {
        let obj = masterObj.companion ? masterObj.companion[pos] : null;
        if (obj.gap > 0) {
            adDiv.style[pos === 'top' ? 'marginTop' : 'marginBottom'] = obj.gap + "px";
        }
        let pElmt = obj.type === 'image' ? _doImgBanner(masterObj, pos) : _doScriptBanner(masterObj, pos);
        if (pElmt) {
            if (pos == 'top') {
                adDiv.parentNode.insertBefore(pElmt, adDiv); // insert above the ad div container
            } else if (pos == 'bottom') {
                adDiv.parentNode.appendChild(pElmt); // insert below the ad div container
            }
        }
    }
    let ret = new FactoryOneHorizBanner(adDiv, masterObj, pos);
    return ret;
}

module.exports = MakeOneHorizBanner_;