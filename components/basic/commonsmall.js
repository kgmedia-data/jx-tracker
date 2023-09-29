/**
 * common helper function used througout the life of these scripts
 */
const modulesmgr            = require('./modulesmgr');

function MakeOneHelperObj_() {
    function FactoryOneHelper() {}
    
    FactoryOneHelper.prototype.toCamelCase = function(str) {
        return str.toLowerCase().replace(/(\-[a-z])/g, function($1) {
            return $1.toUpperCase().replace('-', '');
         });
    }
    
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
    - loadIMAScriptP function()
    - addListener  function(e, event, h)
    - removeListener function(e, event, h)
    - newDiv function(p, t, h, c, id)
    - acss function(stylesStr, id)
  
* requires/dependencies:
    - none
*/
