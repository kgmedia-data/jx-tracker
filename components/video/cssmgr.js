/*
module.exports = {
    getCss:             getCss_,
    contentDivCls:      contentDivCls,
    adDivCls:           adDivCls,
    playerCls:          playerCls,
    thumbnailCls:       thumbnailCls,
    adControlsCls:      adControlsCls,
    playerControlsCls:  playerControlsCls,
    iconCls:            iconCls,
    spinnerCls:         spinnerCls,
    bigPlayBtnCls:      bigPlayBtnCls,
    adPlayBtnCls:       adPlayBtnCls,
    adMuteBtnCls:       adMuteBtnCls,
    adProgressBarCls:   adProgressBarCls,
    hideCls:            hideCls,
    adHideCls:          adHideCls
};
*/
var theMap_ = new Map();

var namesObj_ = {};

function init_(namesObj, stylesObj) {
    namesObj_ = namesObj;

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
            theMap_.set(prop, stylesObj[prop]);
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

//resolution first hor.
function inject_(name, styleObj) {
    let stylesStr = theMap_.get(name);
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
    //console.log(stylesStr);
    //console.log(`###### ${name} ######`);
    acss_(stylesStr);

}

function getRealCls_(logicalClsName) {
    return namesObj_[logicalClsName];
}

module.exports.init = init_;
module.exports.inject = inject_;
module.exports.getRealCls = getRealCls_;