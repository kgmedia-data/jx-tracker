
const modulesmgr                = require('../basic/modulesmgr');
//Note used currently: const common                    = modulesmgr.get('basic/common');
const cssmgr                    = modulesmgr.get('video/cssmgr');

let MakeOneSpinner_ = function(container) {
    const styles                    = cssmgr.getRealCls(container);
    let _spinner = null;
    
    function FactoryOneSpinner(container) {
        _spinner = document.createElement("div");
        _spinner.classList.add(styles.spinner);
        _spinner.classList.add(styles.hide);
        container.appendChild(_spinner);
    }
    FactoryOneSpinner.prototype.show = function() {
        if (_spinner) _spinner.classList.remove(styles.hide);
    };
    FactoryOneSpinner.prototype.hide = function() {
        if (_spinner) _spinner.classList.add(styles.hide);
    };        
    let ret = new FactoryOneSpinner(container);
    return ret;
}
module.exports = MakeOneSpinner_;

/* 
 ************** module: video/spinner-factory*********************************************

* module.exports:
    - function which will make one spinner object
     The object has 2 public functions:
        - show
        - hide
        
* requires/dependencies:
    - none
*/