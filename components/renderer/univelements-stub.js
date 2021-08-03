let MakeOneUniversalMgr_ = function() {
    function FactoryOneUniveralMgr() {
    }
    FactoryOneUniveralMgr.prototype.getHeight = function() {
        return 0;
    };
    FactoryOneUniveralMgr.prototype.show = function() {
    };
    FactoryOneUniveralMgr.prototype.hide = function() {
    };
    FactoryOneUniveralMgr.prototype.init = function(jxParams, clickurl, universal, attachNode) {
    };        
    let ret = new FactoryOneUniveralMgr();
    return ret;
}
module.exports = MakeOneUniversalMgr_;

/* 
 ************** module: renderer/univelements **************************************************

* module.exports: this is the stubbed version 
    i.e. contains just dummy function
    that does nothing
    
    - a function which will make a universal manager object
    - When run, an object will be created which has the following functions:
        init( attachNode, jxParams, universal, clickurl)
            -attachNode is where the created stuff will be attached  (should be the "master div")
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
