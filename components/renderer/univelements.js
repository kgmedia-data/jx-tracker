//I am thinking of ripping out those UU stuff into there.
//Here universal is referring to those
//LearnMore, privacy jixie whatever

//then some renderer (e.g. HB) dun need all those junk
//and therefore can be very very lean 

//make sure we have the tracker url also
//I guess we just add the call to fire a tracker
//Make sure you incorporate this stuff too
    /* RENEE: We only do this stuff IF we really have to 
                //we just keep it there:
                _jxParams.title = _jxParams.title || null;
                _jxParams.thumbnail = _jxParams.thumbnail || null;
                _jxParams.thumbnailurl = _jxParams.thumbnailurl || null;
                _jxParams.description = _jxParams.description || null;
                _jxParams.buttonLabel = _jxParams.buttonLabel || "Learn more";
                if (_jxParams.titleCSS) _jxParams.titleCSS = ("text-decoration:none;" + _jxParams.titleCSS); else _jxParams.titleCSS = "text-decoration:none;";
                if (_jxParams.titleCSSHover) _jxParams.titleCSSHover = _jxParams.titleCSSHover; else _jxParams.titleCSSHover = "";
                if (_jxParams.descriptionCSS) _jxParams.descriptionCSS = ("margin-top:0px;" + _jxParams.descriptionCSS); else _jxParams.descriptionCSS = "margin-top:0px;";
                */
function getUniversalBlob_(jxParams, c) {
        let titleCSS = jxParams.titleCSS, titleCSSHover = jxParams.titleCSSHover, descriptionCSS = jxParams.descriptionCSS;
        let thumbnail = jxParams.thumbnail, thumbnailurl = jxParams.thumbnailurl;
        let title = jxParams.title, description = jxParams.description;
        
        if (titleCSS == "text-decoration:none;" && c.universal && c.universal.titleCSS){
            titleCSS += c.universal.titleCSS;
        }
        if (titleCSSHover == "" && c.universal && c.universal.titleCSSHover) {
            titleCSSHover = c.universal.titleCSSHover;
        }
        if (descriptionCSS == "margin-top:0px;" && c.universal && c.universal.descriptionCSS ) {
            descriptionCSS += c.universal.descriptionCSS;
        }
        // add !important for overriding CSS style with CSS coming from universal object
        titleCSS = titleCSS.split(';').join(' !important;');
        titleCSSHover = titleCSSHover.split(';').join(' !important;');
        descriptionCSS = descriptionCSS.split(';').join(' !important;');
        if (c.universal) {
            if (!thumbnail && c.universal.thumbnail) thumbnail = c.universal.thumbnail;
            if (!title && c.universal.title) title = c.universal.title;
            if (!description && c.universal.description) description = c.universal.description;
            if (!thumbnailurl && c.universal.thumbnailurl) thumbnailurl = c.universal.thumbnailurl;
        }
        return  {
            titleCSS:           titleCSS,
            titleCSSHover:      titleCSSHover,
            descriptionCSS:     descriptionCSS,
            thumbnail:          thumbnail,
            thumbnailurl:       thumbnailurl,
            title:              title,
            description:        description,
            buttonLabel:        jxParams.buttonLabel,
            clickurl:           c.clickurl
        };
    }

    function attachUniversalBlob_(id, universal, attachNode) {
        const _jxTitleStyle = ".jxTitleContainer{overflow:auto;text-align:left;margin-bottom:5px;display:table;font-family:Arial;font-size:14px;}.jxImgBlock{float:left; max-width:70px;min-width:40px;margin-right:10px;}.jxImg{max-width: 100%;height: auto;width: auto;}.jxBlockTitle {margin-top:5px;display:table-cell;vertical-align:middle;}.jxBlockActions{margin-top:5px;margin-bottom:5px;}.jxInfo{float:left;height:15px;width:15px;border:2px solid #bbb;color:#bbb;border-radius:50%;display:table;font-size:10px;}.jxInfo a{text-decoration:none;color:#bbb;}.jxInfo a:hover{text-decoration:none;color:#bbb;}.jxInfo a:visited{text-decoration:none;color:#bbb;}.jxButtonBlock{float:right;margin-right:5px;}.jxTitle {display: inline;}" + ".jxTitle a:link,.jxTitle a:visited{" + universal.titleCSS + "}.jxTitle a:hover{" + universal.titleCSSHover + "}.jxDescription{" + universal.descriptionCSS + "}.jxButton {font-family: Arial, Helvetica, sans-serif;font-size: 11px;color: #494949 !important;background: #ffffff;padding: 5px;border: 2px solid #494949 !important;border-radius: 6px;display: inline-block;transition: all 0.3s ease 0s;}.jxButton:hover {color: #494949 !important;border-radius: 50px;border-color: #494949 !important;transition: all 0.3s ease 0s;}";
        _helpers.acss(_jxTitleStyle, 'jxTitleStyle');
        let jxImgBlock, jxInfo, jxBlockTitle, jxButtonBlock;
        let jxTitleDiv = document.createElement('div');
        let jxActionsDiv = document.createElement('div');
        jxTitleDiv.id = "jxt_" + id;
        jxTitleDiv.style.overflow = 'auto';
        jxTitleDiv.style.textAlign = 'left';
        jxTitleDiv.className = 'jxTitleContainer';

        jxActionsDiv.id = "jxa_" + id;
        jxActionsDiv.style.cssText = "all:initial;text-align:center;display:block;margin-bottom:10px;"
        
        if (universal.nested == 0){
            if (universal.thumbnail){
                if (universal.thumbnailurl){
                    jxImgBlock = _helpers.newDiv(jxTitleDiv, 'div', 
                        '<a href="' + universal.thumbnailurl + '" target="_blank"><img src="' + universal.thumbnail + '" class="jxImg"/></a>',
                        'jxImgBlock');
                }else{
                    jxImgBlock = _helpers.newDiv(jxTitleDiv, 'div', 
                        '<a href="' + universal.clickurl + '" target="_blank"><img src="' + universal.thumbnail + '" class="jxImg"/></a>',
                        'jxImgBlock');
                    _helpers.addListener(jxImgBlock, 'click', (e) => {universal.click();}); 
                }
            }
            // Configuring the title and description
            if (universal.title){
                jxBlockTitle = document.createElement('div');
                jxBlockTitle.className = 'jxBlockTitle';
                jxTitleDiv.appendChild(jxBlockTitle);
      
                jxTitle = _helpers.newDiv(jxBlockTitle, 'h3', 
                    '<a href="' + universal.clickurl + '" target="_blank">' + universal.title + '</a>',
                    'jxTitle');
                _helpers.addListener(jxTitle, 'click', (e) => {universal.click();});                                         
            }
            if (universal.description){
                jxDescription = _helpers.newDiv(jxBlockTitle, 'p', universal.description,'jxDescription');
            }            
      
            // Configuring the action block
            jxActionsDiv.style.overflow = 'auto';
            jxActionsDiv.className = 'jxBlockActions';
            jxInfo = _helpers.newDiv(jxActionsDiv, 'div', 
                '<div style="display: table-cell;vertical-align: middle;"><a href="https://www.jixie.io/privacy-policy/" target="_blank">i</a></div>',
                'jxInfo');
      
            if (universal.clickurl && universal.buttonLabel) {                                       
                jxButtonBlock = _helpers.newDiv(jxActionsDiv, 'div', 
                    '<a href="' + universal.clickurl + '" class="jxButton" target="_blank">' + universal.buttonLabel + '</a>',
                    'jxButtonBlock');
                _helpers.addListener(jxButtonBlock, 'click', (e) => {universal.click();}); 
            }
      
            if (jxTitleDiv.innerHTML) attachNode.insertBefore(jxTitleDiv, attachNode.firstChild);
            attachNode.appendChild(jxActionsDiv);
      
      
          }else{ // Nested, then we display the information button on top of the creative
                jxActionsDiv.style.overflow = 'auto';
                jxActionsDiv.className = 'jxBlockActions';
                if (universal.nested > 0){ // if nested is negative then we don't display anything
                    jxInfo = _helpers.newDiv(_jxActionsDiv, 'div', 
                        '<div style="display: table-cell;vertical-align: middle;"><a href="https://inside.kompas.com/policy" target="_blank">i</a></div>',
                        'jxInfo');                
                    jxButtonBlock = _helpers.newDiv(jxActionsDiv, 'div', 
                        '<div style="padding-top: 10px;color:grey;font-family:Arial;font-size:10px;">Advertisement</div>',
                        'jxButtonBlock');
              }
              attachNode.appendChild(jxActionsDiv);
        }
    }

function attach_(id, jxParams, c, attachNode) {
    return; //not working yet
    let u = getUniversalBlob_(jxParams, c);
    attachUniversalBlob_(id, u, attachNode);
}    

module.exports = attach_;
