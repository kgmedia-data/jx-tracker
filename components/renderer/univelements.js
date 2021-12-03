const modulesmgr = require('../basic/modulesmgr');
const common     = modulesmgr.get('basic/common');

let MakeOneUniversalMgr_ = function() {
    let _height = 0;
    let _univEltsObj = null;

    function FactoryOneUniveralMgr() {}
    function mergeSettings(p, u) {
        let o = {};
    
        var ntd = u.nested;
        if (ntd == 0) o.nested = 0;
        else if (ntd == 1) o.nested = 1;
        else if (ntd == -1) o.nested = -1;
    
        o.title = p.title ? p.title : (u.title ? u.title : null);
        o.thumbnail = p.thumbnail ? p.thumbnail : (u.thumbnail ? u.thumbnail : null);
        o.thumbnailurl = p.thumbnailurl ? p.thumbnailurl : (u.thumbnailurl ? u.thumbnailurl : null);
        o.description = p.description ? p.description : (u.description ? u.description : null);
        o.buttonLabel = p.buttonLabel || "Learn more";
    
        o.titleCSS = "text-decoration:none;" + (p.titleCSS ? p.titleCSS : (u.titleCSS ? u.titleCSS : ""));
        o.titleCSSHover = p.titleCSSHover ? p.titleCSSHover : (u.titleCSSHover ? u.titleCSSHover : "");
        o.descriptionCSS = "margin-top:0px;" + (p.descriptionCSS ? p.descriptionCSS : (u.descriptionCSS ? u.descriptionCSS : ""));
        // add !important for overriding CSS style with CSS coming from universal object
        o.titleCSS = o.titleCSS.split(';').join(' !important;');
        o.titleCSSHover = o.titleCSSHover.split(';').join(' !important;');
        o.descriptionCSS = o.descriptionCSS.split(';').join(' !important;');
        if (!o.hasOwnProperty('nested'))
            o.nested = 0;
        return o;
    }
    
    function attachUniversalBlob_(attachNode, cb, jxParams, universal, clickurl, clicktrackerurl) {
        let newheight = 0;
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
        const _jxTitleStyle = ".jxTitleContainer{overflow:auto;text-align:left;margin-bottom:5px;display:table;font-family:Arial;font-size:14px;}.jxImgBlock{float:left; max-width:70px;min-width:40px;margin-right:10px;}.jxImg{max-width: 100%;height: auto;width: auto;}.jxBlockTitle {margin-top:5px;display:table-cell;vertical-align:middle;}.jxBlockActions{margin-top:5px;margin-bottom:5px;}.jxInfo{float:left;height:15px;width:15px;border:2px solid #bbb;color:#bbb;border-radius:50%;display:table;font-size:10px;}.jxInfo a{text-decoration:none;color:#bbb;}.jxInfo a:hover{text-decoration:none;color:#bbb;}.jxInfo a:visited{text-decoration:none;color:#bbb;}.jxButtonBlock{float:right;margin-right:5px;}.jxTitle {display: inline;}" + ".jxTitle a:link,.jxTitle a:visited{" + merged.titleCSS + "}.jxTitle a:hover{" + merged.titleCSSHover + "}.jxDescription{" + merged.descriptionCSS + "}.jxButton {font-family: Arial, Helvetica, sans-serif;font-size: 11px;color: #494949 !important;background: #ffffff;padding: 5px;border: 2px solid #494949 !important;border-radius: 6px;display: inline-block;transition: all 0.3s ease 0s;}.jxButton:hover {color: #494949 !important;border-radius: 50px;border-color: #494949 !important;transition: all 0.3s ease 0s;}";
        common.acss(_jxTitleStyle, 'jxTitleStyle');
        let jxImgBlock, jxInfo, jxBlockTitle, jxButtonBlock;
        let jxTitleDiv = document.createElement('div');

        let jxActionsDiv = null; 
        let id = '' + Math.floor(Math.random() * 100) + 1;//id not so important actually. Dunno what for.
        //we dun bother with the id really.
        jxTitleDiv.id = "jxt_" + id;
        jxTitleDiv.style.overflow = 'auto';
        jxTitleDiv.style.textAlign = 'left';
        jxTitleDiv.className = 'jxTitleContainer';
    
        if (false) {
            jxActionsDiv = document.createElement('div');
            jxActionsDiv.id = "jxa_" + id;
            jxActionsDiv.style.cssText = "all:initial;text-align:center;display:block;margin-bottom:10px;"
        }// if (false)
    
        if (merged.nested == 0) {
            if (merged.thumbnail) {
                if (merged.thumbnailurl) {
                    jxImgBlock = common.newDiv(jxTitleDiv, 'div',
                        '<a href="' + merged.thumbnailurl + '" target="_blank"><img src="' + merged.thumbnail + '" class="jxImg"/></a>',
                        'jxImgBlock');
                } else {
                    jxImgBlock = common.newDiv(jxTitleDiv, 'div',
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
                jxTitleDiv.appendChild(jxBlockTitle);
    
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
            jxActionsDiv.style.overflow = 'auto';
            jxActionsDiv.className = 'jxBlockActions';
            jxInfo = common.newDiv(jxActionsDiv, 'div',
                '<div style="display: table-cell;vertical-align: middle;"><a href="https://www.jixie.io/privacy-policy/" target="_blank">i</a></div>',
                'jxInfo');
    
            if (merged.clickurl && merged.buttonLabel) {
                jxButtonBlock = common.newDiv(jxActionsDiv, 'div',
                    '<a href="' + merged.clickurl + '" class="jxButton" target="_blank">' + merged.buttonLabel + '</a>',
                    'jxButtonBlock');
                common.addListener(jxButtonBlock, 'click', (e) => {
                    merged.click();
                });
            }
            } //if (false)
    
            if (jxTitleDiv.innerHTML) attachNode.insertBefore(jxTitleDiv, attachNode.firstChild);
            if (jxActionsDiv) {
                attachNode.appendChild(jxActionsDiv);
            }
            newheight = jxTitleDiv.offsetHeight + (jxActionsDiv ? jxActionsDiv.offsetHeight: 0);
    
        } else { // Nested, then we display the information button on top of the creative
            if (false) {
            jxActionsDiv.style.overflow = 'auto';
            jxActionsDiv.className = 'jxBlockActions';
            if (merged.nested > 0) { // if nested is negative then we don't display anything
                jxInfo = common.newDiv(jxActionsDiv, 'div',
                    '<div style="display: table-cell;vertical-align: middle;"><a href="https://inside.kompas.com/policy" target="_blank">i</a></div>',
                    'jxInfo');
                jxButtonBlock = common.newDiv(jxActionsDiv, 'div',
                    '<div style="padding-top: 10px;color:grey;font-family:Arial;font-size:10px;">Advertisement</div>',
                    'jxButtonBlock');
            }
            attachNode.appendChild(jxActionsDiv);
            newheight = jxActionsDiv.offsetHeight + 5;
            }//if (jxActionsDiv)
        }
        if (cb) {
            cb(newheight);
        }

        return {
            height: newheight,
            jxActionsDiv: jxActionsDiv,
            jxTitleDiv: jxTitleDiv
        };
    }
    FactoryOneUniveralMgr.prototype.getHeight = function() {
        return _height;
    };
    FactoryOneUniveralMgr.prototype.show = function() {
        if (_univEltsObj) {
            _univEltsObj.jxActionsDiv.style.display = 'block';
            _univEltsObj.jxTitleDiv.style.display = 'block';
        }
    };
    FactoryOneUniveralMgr.prototype.hide = function() {
        if (_univEltsObj) {
            _univEltsObj.jxActionsDiv.style.display = 'none';
            _univEltsObj.jxTitleDiv.style.display = 'none';
        }
    };
    FactoryOneUniveralMgr.prototype.init = function(
        attachNode, cb, jxParams, universal, clickurl) {
        _univEltsObj = attachUniversalBlob_(attachNode, cb, jxParams, universal, clickurl);
        if (_univEltsObj)
            _height = _univEltsObj.height;
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
