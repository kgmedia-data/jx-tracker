
const modulesmgr                = require('../basic/modulesmgr');
const _helpers                  = modulesmgr.get('video/helpers');
const cssmgr                    = modulesmgr.get('video/cssmgr');
const hideCls                   = cssmgr.getRealCls('hideCls');
const replayBtnCls              = cssmgr.getRealCls('replayBtnCls');

let MakeOneReplayButton_ = function(container, position, clickCB) {
    let _replayButton = null;
    let _replayLabel = "Replay";
    
    function FactoryOneReplayButton(container, position, clickCB) {
      _replayButton = document.createElement("span");
      var icon = _replayLabel + "&nbsp;&nbsp;<i class='material-icons'>&#xe042;</i>"
      _replayButton.innerHTML = icon;

      _replayButton.classList.add(replayBtnCls);

      if(position == "left") {
        _replayButton.style.right = "unset";
        _replayButton.style.left = "0px";
      }

      if (clickCB) {
        _helpers.addListener(_replayButton, 'click', clickCB);
      }

      container.appendChild(_replayButton);
    }
    FactoryOneReplayButton.prototype.show = function() {
      if (_replayButton) {
        _replayButton.classList.remove(hideCls);
        _replayButton.style.visibility = "visible";
      }
    };
    FactoryOneReplayButton.prototype.hide = function() {
      if (_replayButton) _replayButton.classList.add(hideCls);
    };
    let ret = new FactoryOneReplayButton(container, position, clickCB);
    return ret;
}
module.exports = MakeOneReplayButton_;
 