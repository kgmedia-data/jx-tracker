
const _helpers              = require('./helpers');
const _cssObj               = _helpers.getCssObj();
const hideCls               = _cssObj.hideCls; 
const spinnerCls            = _cssObj.spinnerCls; 
 
     

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