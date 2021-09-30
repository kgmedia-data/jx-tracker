
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
 * The player CODE always work with the "logical" class names.
 * e.g. controls factory code we have
 * styles.volPanel, styles.leftCtrl
 * 
 * when a player is instantiated we have (container (id of the div) and the options)
 * 
 * div-id-of-player-instance
 *   divnameA |--> hashvaluexyz (corr to options=bgcolor=blue,color=white) 
 *                     ||==> objectP (has the classids which will give you the right colors) 
 * 
 *   divnameB |--> hashvaluexyz (corr to options=bgcolor=blue,color=white) 
 *                     ||==> objectP (has the classids which will give you the right colors) 
 * 
 *   divnameC |--> hashvaluexxxyz (corr to options=bgcolor=red,color=yellow) 
 *                     ||==> objectQ (has the classids which will give you the right colors) 
 *
 *   divnameD |--> hashvalueyyyz (corr to options=bgcolor=red,color=yellow) 
 *                     ||==> objectR (has the classids which will give you the right colors) 
 * 
 *  In this example, if 4 instances of the player on the page)
 * 
 * divId2HashCode_ look like this
 *  (if 4 instances of the player on the page)
 *  divA B they have the same options settings
 *  which is diff from divC and diff from  divD 
 * {
 *    divnameA : xyz (hashvalue)
 *    divnameB :  xyz
 *    divnameC : xxxyz
 *    divnameD : yyyz
 * }
 * 
 * theMap_ {
 *   xyz: objectP
 *   xxxyz: objectQ
 *   yyyz: objectR
 * }
 * 
 */

var divId2HashCode_ = {};
var theMap_ = new Map();

// tmporary 20210927. We also need something for any module to easily pull out
// their options object. This may not be the best place (or need to change name of
// this module from cssmgr...)
var divId2Options_ = {}; 

// internal helper function:
// basically just to repair and make sure all properties are filled in
// at least with a default.
function makeOptions_(options) {
    // currently this options is actually just options.controls
    // TODO
    let o = {};
    if (!options) {
        options = {};
    }
    // the names of buttonsColor 
    // backgroundColor and "color" :-( should be changed.
    // the 'color' is referring to the ads controls...
    o.buttonsColor = options.color || "#C0C0C0"; //silver //just for test . easier to tell.
    o.backgroundColor = options.backgroundcolor || "#00FFFF"; //aqua     "#DFFF00"; // yellow
    o.adsButtonsColor = options.adcolor || "#FF0000"; //"#FFA07A"; //light salmon
    o.font = options.font || 'Roboto'; //'Dancing Script'; //'Quicksand'; //Roboto
    return o;
}

// internal function: convert a string (a concatenation of some css properties to do with color (so far))
function makeHashCode_(str) {
    var hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr   = str.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    // console.log(hash);
    return hash;
};

// every player INSTANCE will call this at their start. 
// container is the divId of the player container (options.container property)
// the styles set object is read from the desired video-styles/*.js file. depending
// on what style is desired. 
function init_(container, stylesSetObj, options, injectSSNow = []) {
    // get a hash value
    if (divId2HashCode_[container]) {
        // do nothing.
        // already init before. what are you trying to do again?!
        return;
    }
    let o = makeOptions_(options.controls);
    // the hash code is derived from the actual options settings.
    // so 2 containers with the exact same options color settings will map to the same hash.
    let str = ['buttonsColor','backgroundColor','adsButtonsColor','font'].map((e) => o[e]).join("|");
    let hash = makeHashCode_(str);

    let storedObj = theMap_.get(hash);
    if (!storedObj) {
        storedObj = {
            stylesSet: stylesSetObj,
            cssClsnames: stylesSetObj.makeCssClsnames(hash),
            options: o,
            injected: []
        };
        theMap_.set(hash, storedObj);
    }
    ['default'].concat(injectSSNow).forEach(function(stylesSetName) {
        inject_(null, stylesSetName, storedObj);
    });
    divId2HashCode_[container] = hash;
    divId2Options_[container] = options;
}

function acss_(stylesStr, stylesId = null) {
    var head = document.getElementsByTagName('HEAD')[0];
    var s = document.createElement("style");
    if(stylesId) s.id = stylesId;
    s.innerHTML = stylesStr;
    head.appendChild(s);
}

// either container must be specified, or storedObj must be specified.
// we have an internal call inject_ that one will have storedObj != null already
// so save a lookup
function inject_(container, stylesSetName, storedObj = null) {
    if (!storedObj) {
        storedObj = getStoredObj_(container);
    }
    if (storedObj.injected.indexOf(stylesSetName) == -1) {
        //make the whatever.
        console.log(`the ${stylesSetName} not yet injected_ now then do`);
        let sstr = storedObj.stylesSet.makeCssString(storedObj.cssClsnames, stylesSetName, storedObj.options);
        acss_(sstr);
        storedObj.injected.push(stylesSetName);
    }
    else {
        console.log(`the ${stylesSetName} already injected liao ah`);
    }
}

function walkUp_(node) {
    var parent = node;
    let times = 0;
    while(parent && times < 5) {
        times++;
        if( parent.nodeName === 'DIV' ) {
            if (divId2HashCode_[parent.id]) {
                return parent.id;
            }
        }
        parent = parent.parentNode;
    }
    return null;
}

function getStoredObj_(container) {
    let divId;
    if (typeof container == 'string')
        divId = container;
    else 
        divId = walkUp_(container);
    if (!divId) return; //
    return theMap_.get(divId2HashCode_[divId]);
}

function getRealCls_(container) {
    let storedObj = getStoredObj_(container);
    if (storedObj) {
        return storedObj.cssClsnames;
    }
    return {};
}

function getOptions_(container) {
    let divId;
    if (typeof container == 'string')
        divId = container;
    else 
        divId = walkUp_(container);
    if (!divId) return {}; //
    return (divId2Options_[divId]);
}

function updateOptions_(container, newObj) {
    let divId;
    if (typeof container == 'string')
        divId = container;
    else 
        divId = walkUp_(container);
    if (!divId) return {}; //
    divId2Options_[divId] = newObj;
}


module.exports.init = init_;
module.exports.inject = inject_;
module.exports.getRealCls = getRealCls_;
// temporary: see comments on declaration of divId2Options_ above.
module.exports.getOptions = getOptions_;
// temporary: see comments on declaration of divId2Options_ above.
module.exports.updateOptions = updateOptions_;