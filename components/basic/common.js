const modulesmgr            = require('../basic/modulesmgr');

function MakeOneHelperObj_() {
    let _loadIMAProm = null; //these are promises
    function FactoryOneHelper() {}
   
    
    FactoryOneHelper.prototype.toCamelCase = function(str) {
        return str.toLowerCase().replace(/(\-[a-z])/g, function($1) {
            return $1.toUpperCase().replace('-', '');
         });
    }
    //DUNNO WHO CALL?
    FactoryOneHelper.prototype.ancestor = function(el, tagName) {
        tagName = tagName.toLowerCase();
        while (el && el.parentNode) {
            el = el.parentNode;
            if (el.tagName && el.tagName.toLowerCase() == tagName) {
                return el;
            }
        }
        return null;
    }

    /**
     * May not be working perfectly yet. Still need to check to tweak
     * But the goal is to centralize so that no matter how many JX video sdks and 
     * how many videos on page. We only load this once.
     * @returns a promise for the loading. (which is resolved upon the onload event)
     */
    FactoryOneHelper.prototype.loadIMAScriptP = function() {
        if(_loadIMAProm) return _loadIMAProm;
        _loadIMAProm = new Promise(function(resolve, reject) {
            var tag = document.createElement("script");
            var fst = document.getElementsByTagName("script")[0];
            fst.parentNode.insertBefore(tag, fst);
            tag.onload = function() {
                resolve();
            };
            tag.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";

        });
        return _loadIMAProm;
    };
  
    FactoryOneHelper.prototype.addListener = function(e, event, h) {
        if(e.addEventListener) {
            e.addEventListener(event, h, false);
        } else if(e.attachEvent) {
            e.attachEvent('on' + event, h);
        } else {
            e['on' + event] = h;
        }
    };
    FactoryOneHelper.prototype.removeListener = function(e, event, h) {
        if (e.removeEventListener) {    // all browsers except IE before version 9
            e.removeEventListener (event, h, false);
        }
        else {
            if (e.detachEvent) {        // IE before version 9
                e.detachEvent (event, h);
            }
        }
    }
    FactoryOneHelper.prototype.newDiv = function(p, t, h, c, id) {
        var nd = document.createElement(t);
        if(h && h != "") nd.innerHTML = h;
        if(c && c != "") nd.className = c;
        if(id) nd.id = id;
        p.appendChild(nd);
        return nd;
    };

    FactoryOneHelper.prototype.acss = function(stylesStr, id) {
        _acss(stylesStr, id);
    }
    
    function _acss(stylesArr, id) {
        var head = document.getElementsByTagName('HEAD')[0];
        var s = document.createElement("style");
        if(id) s.id = id;
        s.innerHTML = stylesArr;
        head.appendChild(s);
    };
    let ret = new FactoryOneHelper();
    return ret;
};
var gH = MakeOneHelperObj_();
module.exports = gH;

/* 
 ************** module: basic/pginfo **************************************************
 basically since this stuff is duplicated every where. so put into 
 a common place.
 Please just read the code to know what it tries to do. Too simple
* module.exports:
    - toCamelCase function(str)
    - ancestor function(el, tagName)
    - loadIMAScriptP function()
    - addListener  function(e, event, h)
    - removeListener function(e, event, h)
    - newDiv function(p, t, h, c, id)
    - acss function(stylesStr, id)
  
* requires/dependencies:
    - none
*/
