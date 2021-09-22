
/**
 * NOTE:
 * it is a bit complex coz we are returning different stuff depending on 
 * the container.
 * it is all because of the ... COLOR
 * Ideally, the color is like a class we can stick on the elements.
 * But it cannot work like that.
 * 
 * Therefore, to accomodate the scenario that there are 2 instances of the player 
 * in the same page each with a different color config... It is basically thru
 * different css.
 * 
 * The code always work with the "logical" class names.
 * e.g. controls factory code we have
 * styles.volPanel, styles.leftCtrl
 * 
 * This styles object is retrieved from the cssmgr at the init of the controls object
 *   const styles = cssmgr.getRealCls(container);
 * i.e. styles.leftCtrl in one instance of the player on the page
 * and styles.leftCtrl in another instance of the player on the page
 * are potentially DIFFERENET classnames.
 * 
 * The cssmgr manages the mapping so that the users of the styles (i.e. controls obj code, 
 * ads controls obj code etc) don't have to.
 */
/**
 * DISCLAIMER!!!!!
 * CURRENTLY ONLY A SIMPLE AND INEFFICIENT WAY 2021/09/22 that's all I have time for last night
 * I will work on this in the evening.
 */
var theMap_ = new Map();

var masterObj_ = {}; // properites will be names of containers (simple implementation...not safe)

function makeOptions(options) {
    let o = {};
    if (!options) {
        options = {};
    }
    // the names of buttonsColor 
    // primaryColor and "color" :-( should be changed.
    // the 'color' is referring to the ads controls...
    o.buttonsColor = options.color || "#C0C0C0"; //silver //just for test . easier to tell.
    o.primaryColor = options.backgroundcolor || "#00FFFF"; //aqua     "#DFFF00"; // yellow
    o.color = options.adcolor || "#FF0000"; //"#FFA07A"; //light salmon
    return o;
}

function init_(container, namesObj, stylesObj, options) {
    masterObj_[container] = {
        namesObj: namesObj,
        options: makeOptions(options)
    };
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
function inject_(container, name) {
    container = getIdForContainer(container);
    let stylesStr = theMap_.get(container+name);
    if (!stylesStr) return;
    let blob = getBlobForContainer(container);
    let styleObj = blob.options;
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
            if (masterObj_[parent.id]) {
                return parent.id;
            }
        }
        parent = parent.parentNode;
    }
    return null;
}

function getIdForContainer(container) {
    let divId;
    if (typeof container == 'string')
        divId = container;
    else 
        divId = walkUp(container);
    return divId;
}

function getBlobForContainer(container) {
    let divId;
    if (typeof container == 'string')
        divId = container;
    else 
        divId = walkUp(container);
    if (!divId) return; //
    return masterObj_[divId];
    
}
function getRealCls_(container) {
    let blob = getBlobForContainer(container);
    if (blob) {
        return blob.namesObj;
    }
    return null;    
}

module.exports.init = init_;
module.exports.inject = inject_;
module.exports.getRealCls = getRealCls_;
/*
module.exports = {
    TODO
};
*/