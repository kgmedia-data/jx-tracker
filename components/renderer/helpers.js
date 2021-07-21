const modulesmgr            = require('../basic/modulesmgr');

function MakeOneHelperObj_() {
    function FactoryOneHelper() {
            
    }
    //This stuff is needed only if we need to prepare the adTagUrl
    //But since this is not alot of code, then we do not bother about
    //condition compile. Just have this built in for all variants of the universal lite
    var _acss = function(stylesArr, id) {
        var head = document.getElementsByTagName('HEAD')[0];
        var s = document.createElement("style");
        if (id) s.id = id;
        s.innerHTML = stylesArr;
        head.appendChild(s);
    }
    FactoryOneHelper.prototype.acss = function(stylesArr, id) {
        _acss(stylesArr, id);
    }

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
    FactoryOneHelper.prototype.newDiv = function(p, t, h, c, id) {
        var nd = document.createElement(t);
        if (h && h != "") nd.innerHTML = h;
        if (c && c != "") nd.className = c;
        if (id) nd.id = id;
        p.appendChild(nd);
        return nd;
    }

    FactoryOneHelper.prototype.addListener = function(e, event, h) {
        if (e.addEventListener) {
            e.addEventListener(event, h, false);
        } else if (e.attachEvent) {
            e.attachEvent('on' + event, h);
        } else {
            e['on' + event] = h;
        }
    };
    FactoryOneHelper.prototype.removeListener = function(e, event, h) {
        if (e.removeEventListener) {
            e.removeEventListener(event, h, false);
        } else {
            if (e.detachEvent) {
                e.detachEvent(event, h);
            }
        }
    }
    let ret = new FactoryOneHelper();
    return ret;
};
var gH = MakeOneHelperObj_();
module.exports = gH;