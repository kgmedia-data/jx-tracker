
var theMap_ = new Map();

var namesObj_ = {};

function init_(namesObj, stylesObj, container) {
    namesObj_[container] = namesObj;

    let s = stylesObj.default;
    //inject the css right away.
    if (s) {
        //console.log("first we inject this lah. " + 'default');
        //console.log(s);
        acss_(s);
    }
    //for delayed injection
    for (var prop in stylesObj) {
        if (prop != 'default') {
            //console.log('adding to map not yet injected' + prop);
            //console.log(stylesObj[prop]);
            //this is just a super super rough way to do it.
            // best is not directly use the container id as string
            // TODO tomorrow 
            theMap_.set(container+prop, stylesObj[prop]);
        }
    }
}

function acss_(stylesStr, stylesId = null) {
    var head = document.getElementsByTagName('HEAD')[0];
    var s = document.createElement("style");
    if(stylesId) s.id = stylesId;
    s.innerHTML = stylesStr;
    head.appendChild(s);
}

//Once you inject then it matters.
//resolution first hor.
function inject_(container, name, styleObj) {
    let stylesStr = theMap_.get(container+name);
    if (!stylesStr) return;
    for (var styleName in styleObj)  {
        let pattern = null;
        // currently only one type
        if (styleName == 'color') {
            pattern = /%%color%%/g;
        }
        if (styleName == 'primaryColor') {
            pattern = /%%primaryColor%%/g;
        }
        if (styleName == 'buttonsColor') {
            pattern = /%%buttonsColor%%/g;
        }
        if (pattern) {
            stylesStr = stylesStr.replace(pattern, styleObj[styleName]);
        }
    }
    //inject the style
    acss_(stylesStr);

}

// need to beef this up too.
function walkUp(node, array) {
    var parent = node;
    let times = 0;
    while(parent && times < 5) {
        times++;
        if( parent.nodeName === 'DIV' ) {
            if (namesObj_[parent.id]) {
                return parent.id;
            }
        }
        parent = parent.parentNode;
    }
    return null;
}

function getRealCls_(container) {
    if (typeof container == 'string')
        return namesObj_[container];
    let divId = walkUp(container);
    if (divId)
        return namesObj_[divId];
}

module.exports.init = init_;
module.exports.inject = inject_;
module.exports.getRealCls = getRealCls_;
/*
module.exports = {
    TODO
};
*/