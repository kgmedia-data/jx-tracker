
const modulesmgr                = require('../basic/modulesmgr');
const common                    = modulesmgr.get('basic/common');
const cssmgr                    = modulesmgr.get('video/cssmgr');
const hideCls                   = cssmgr.getRealCls('hideCls');
// const replayBtnCls              = cssmgr.getRealCls('replayBtnCls');
const replayWrapperCls          = cssmgr.getRealCls('replayWrapperCls');
const replayBtnContainerCls     = cssmgr.getRealCls('replayBtnContainerCls');

let MakeOneReplayButton_ = function(container, position, clickCB) {
    let _replayButton = null;
    let _replayWrapper = null;
    let _replayLabel = "Replay";
    
    function FactoryOneReplayButton(container, position, clickCB) {
      _replayWrapper = document.createElement("div");
      _replayWrapper.className = replayWrapperCls;

      var iHTML = `<div class="replay-icon">
                    <i class='material-icons'>&#xe042;</i>
                  </div>
                  <div class="replay-text">${_replayLabel}</div>`;
      _replayButton = document.createElement("div");
      _replayButton.className = replayBtnContainerCls;
      _replayButton.innerHTML = iHTML;

      if (clickCB) {
        common.addListener(_replayButton, 'click', clickCB);
      }

      _replayWrapper.appendChild(_replayButton);
      container.appendChild(_replayWrapper);
    }
    FactoryOneReplayButton.prototype.show = function() {
      if (_replayWrapper) {
        _replayWrapper.style.display = "flex";
      }
    };
    FactoryOneReplayButton.prototype.hide = function() {
      if (_replayWrapper) _replayWrapper.style.display = "none";
    };
    let ret = new FactoryOneReplayButton(container, position, clickCB);
    return ret;
}
module.exports = MakeOneReplayButton_;


/* 
 ************** module: video/replaybtn-factory*********************************************

* module.exports:
    - function which will make one replay button object object
     The object has the following public functions:
        - hide
        - show

* requires/dependencies:
    - none
*/