const modulesmgr = require('../basic/modulesmgr');
const common     = modulesmgr.get('basic/common');

let MakeOneUniversalMgr_ = function() {
    let _height = 0;// 
    let _cb = null; //whenver this univ elements is hideen or shown then a callback of the main renderer would be called.
    let _shown = true; //if floating state, then shown would be false
    let _uElts = null;

    function FactoryOneUniveralMgr() {}
    function mergeSettings(p, u) {
        let o = {};
    
        var ntd = u.nested;
        if (ntd == 0) o.nested = 0;
        else if (ntd == 1) o.nested = 1;
        else if (ntd == -1) o.nested = -1;
    
        o.buttonLabel = p.buttonLabel || "Learn more";
        ['title','thumbnail','thumbnailurl','description','buttonLabel','titleCSS','titleCSSHover','descriptionCSS'].forEach(function(prop){
            o[prop] = p[prop] ? p[prop] : (u[prop] ? u[prop] : (prop.indexOf('CSS')>-1? "":null));
        });

        // add !important for overriding CSS style with CSS coming from universal object
        o.titleCSS = ("text-decoration:none;" + o.titleCSS).split(';').join(' !important;');
        o.titleCSSHover = o.titleCSSHover.split(';').join(' !important;');
        o.descriptionCSS = ("margin-top:0px;" + o.descriptionCSS).split(';').join(' !important;');
        if (!o.hasOwnProperty('nested'))
            o.nested = 0;
        return o;
    }
    
    function attachUniversalBlob_(attachNode, cb, jxParams, universal, clickurl, clicktrackerurl) {
        let newheight = 0;
        _cb = cb;
        let merged = mergeSettings(jxParams, universal ? universal : {});
        merged.clickurl = clickurl;
        if (clickurl) {
            merged.clickurl = clickurl;
            merged.click = function() {
                fetch(clicktrackerurl, {
                    method: 'GET',
                    credentials: 'include'
                }).catch((err) => {
                });
            };
        }
        if (!(merged.thumbnail || merged.title || merged.description)) {
            //if there is none of these items, then we do not bother!
            return; 
        }
        //jxTitleContainer, jxImgBlock, jxImg, jxBlockTitle, jxBlockAction, jxInfo, jxTitle, jxDescription
        //the following classes names 
        const _jxTitleStyle = ".jxTitleContainer{overflow:auto;text-align:left;margin-bottom:5px;display:table;font-family:Arial;font-size:14px;}.jxImgBlock{float:left; max-width:70px;min-width:40px;margin-right:10px;}.jxImg{max-width: 100%;height: auto;width: auto;}.jxBlockTitle {margin-top:5px;display:table-cell;vertical-align:middle;}.jxBlockActions{margin-top:5px;margin-bottom:5px;}.jxInfo{float:left;height:15px;width:15px;border:2px solid #bbb;color:#bbb;border-radius:50%;display:table;font-size:10px;}.jxInfo a{text-decoration:none;color:#bbb;}.jxInfo a:hover{text-decoration:none;color:#bbb;}.jxInfo a:visited{text-decoration:none;color:#bbb;}.jxButtonBlock{float:right;margin-right:5px;}.jxTitle {display: inline;}" + ".jxTitle a:link,.jxTitle a:visited{" + merged.titleCSS + "}.jxTitle a:hover{" + merged.titleCSSHover + "}.jxDescription{" + merged.descriptionCSS + "}.jxButton {font-family: Arial, Helvetica, sans-serif;font-size: 11px;color: #494949 !important;background: #ffffff;padding: 5px;border: 2px solid #494949 !important;border-radius: 6px;display: inline-block;transition: all 0.3s ease 0s;}.jxButton:hover {color: #494949 !important;border-radius: 50px;border-color: #494949 !important;transition: all 0.3s ease 0s;}";
        common.acss(_jxTitleStyle, 'jxTitleStyle');
        let jxImgBlock, jxInfo, jxBlockTitle, jxButtonBlock;
        let titDiv = document.createElement('div');

        let actDiv = null; 
        let id = '' + Math.floor(Math.random() * 100) + 1;//id not so important actually. Dunno what for.
        //we dun bother with the id really.
        titDiv.id = "jxt_" + id;
        titDiv.style.overflow = 'auto';
        titDiv.style.textAlign = 'left';
        titDiv.className = 'jxTitleContainer';
    
        if (false) {
            actDiv = document.createElement('div');
            actDiv.id = "jxa_" + id;
            actDiv.style.cssText = "all:initial;text-align:center;display:block;margin-bottom:10px;"
        }// if (false)
    
        if (merged.nested == 0) {
            if (merged.thumbnail) {
                if (merged.thumbnailurl) {
                    jxImgBlock = common.newDiv(titDiv, 'div',
                        '<a href="' + merged.thumbnailurl + '" target="_blank"><img src="' + merged.thumbnail + '" class="jxImg"/></a>',
                        'jxImgBlock');
                } else {
                    jxImgBlock = common.newDiv(titDiv, 'div',
                        '<a href="' + merged.clickurl + '" target="_blank"><img src="' + merged.thumbnail + '" class="jxImg"/></a>',
                        'jxImgBlock');
                    common.addListener(jxImgBlock, 'click', (e) => {
                        merged.click();
                    });
                }
            }
            // Configuring the title and description
            if (merged.title) {
                jxBlockTitle = document.createElement('div');
                jxBlockTitle.className = 'jxBlockTitle';
                titDiv.appendChild(jxBlockTitle);
    
                jxTitle = common.newDiv(jxBlockTitle, 'h3',
                    '<a href="' + merged.clickurl + '" target="_blank">' + merged.title + '</a>',
                    'jxTitle');
                common.addListener(jxTitle, 'click', (e) => {
                    merged.click();
                });
            }
            if (merged.description) {
                jxDescription = common.newDiv(jxBlockTitle, 'p', merged.description, 'jxDescription');
            }
    
            if (false) {
            // Configuring the action block
            actDiv.style.overflow = 'auto';
            actDiv.className = 'jxBlockActions';
            jxInfo = common.newDiv(actDiv, 'div',
                '<div style="display: table-cell;vertical-align: middle;"><a href="https://www.jixie.io/privacy-policy/" target="_blank">i</a></div>',
                'jxInfo');
    
            if (merged.clickurl && merged.buttonLabel) {
                jxButtonBlock = common.newDiv(actDiv, 'div',
                    '<a href="' + merged.clickurl + '" class="jxButton" target="_blank">' + merged.buttonLabel + '</a>',
                    'jxButtonBlock');
                common.addListener(jxButtonBlock, 'click', (e) => {
                    merged.click();
                });
            }
            } //if (false)
    
            if (titDiv.innerHTML) attachNode.insertBefore(titDiv, attachNode.firstChild);
            if (actDiv) {
                attachNode.appendChild(actDiv);
            }
            newheight = titDiv.offsetHeight + (actDiv ? actDiv.offsetHeight: 0);
    
        } else { // Nested, then we display the information button on top of the creative
            if (false) {
            actDiv.style.overflow = 'auto';
            actDiv.className = 'jxBlockActions';
            if (merged.nested > 0) { // if nested is negative then we don't display anything
                jxInfo = common.newDiv(actDiv, 'div',
                    '<div style="display: table-cell;vertical-align: middle;"><a href="https://inside.kompas.com/policy" target="_blank">i</a></div>',
                    'jxInfo');
                jxButtonBlock = common.newDiv(actDiv, 'div',
                    '<div style="padding-top: 10px;color:grey;font-family:Arial;font-size:10px;">Advertisement</div>',
                    'jxButtonBlock');
            }
            attachNode.appendChild(actDiv);
            newheight = actDiv.offsetHeight + 5;
            }//if (actDiv)
        }
        if (_cb) {
            _cb(newheight);
        }
        return {
            height: newheight,
            actDiv: actDiv,
            titDiv: titDiv
        };
    }
    FactoryOneUniveralMgr.prototype.getHeight = function() {
        return _shown ? _height: 0;
    };
    FactoryOneUniveralMgr.prototype.show = function() {
        _shown = true;
        if (_uElts) {
            if (_uElts.actDiv) _uElts.actDiv.style.display = 'block';
            if (_uElts.titDiv) _uElts.titDiv.style.display = 'block';
        }
        _cb(_height);
    };
    FactoryOneUniveralMgr.prototype.hide = function() {
        _shown = false;
        if (_uElts) {
            if (_uElts.actDiv) _uElts.actDiv.style.display = 'none';
            if (_uElts.titDiv) _uElts.titDiv.style.display = 'none';
        }
        _cb(0);
    };
    FactoryOneUniveralMgr.prototype.init = function(
        attachNode, cb, jxParams, universal, clickurl) {
        _uElts = attachUniversalBlob_(attachNode, cb, jxParams, universal, clickurl);
        if (_uElts)
            _height = _uElts.height;
    };
    let ret = new FactoryOneUniveralMgr();
    return ret;
}
module.exports = MakeOneUniversalMgr_;

/* 
 ************** module: renderer/univelements **************************************************

* module.exports:
    - a function which will make a universal manager object
    - When run, an object will be created which has the following functions:
        init( attachNode, callback, jxParams, universal, clickurl)
            -attachNode is where the created stuff will be attached  (should be the "master div")
            -callback supplied by the caller . Will be called after the attachment of the universal elements and when the height is determinable
            -jxparams is the "p" var of the calling of the renderer
                If it contains any from this: then they will be used
                (we search jxparam, if not then see from universal object)
                title, thumbnail, thumbnailurl,description,titleCSS,
                titleCSSHover,descriptionCSS,
            -universal is the assets: universal object from the ad response json
            -clickurl 

    
* requires/dependencies:
    - none
*/
