let MakeOneUniversalMgr_ = function() {
    function FactoryOneUniveralMgr() {
    }
    FactoryOneUniveralMgr.prototype.getHeight = function() {
        return 0;
    };
    FactoryOneUniveralMgr.prototype.init = function(jxParams, clickurl, universal, attachNode) {
    };        
    let ret = new FactoryOneUniveralMgr();
    return ret;
}
module.exports = MakeOneUniversalMgr_;