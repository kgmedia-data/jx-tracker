
const modulesmgr                = require('../basic/modulesmgr');
//Note used currently: const common                    = modulesmgr.get('basic/common');
const cssmgr                    = modulesmgr.get('video/cssmgr');
const spinnerCls                = cssmgr.getRealCls('spinnerCls');
const hideCls                   = cssmgr.getRealCls('hideCls');
      

let MakeOneSpinner_ = function(container) {
    let _spinner = null;
    
    function FactoryOneSpinner(container) {
        _spinner = document.createElement("div");
        _spinner.classList.add(spinnerCls);
        _spinner.classList.add(hideCls);
        container.appendChild(_spinner);
    }
    FactoryOneSpinner.prototype.show = function() {
        if (_spinner) _spinner.classList.remove(hideCls);
    };
    FactoryOneSpinner.prototype.hide = function() {
        if (_spinner) _spinner.classList.add(hideCls);
    };        
    let ret = new FactoryOneSpinner(container);
    return ret;
}
module.exports = MakeOneSpinner_;