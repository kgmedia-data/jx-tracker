## Fullscreen API Issue
  - At the earlier version we do the fullscreen on the video element. but then since we have this new custom controls, we need to make the fullscreen on the container of the video, not on the video element anymore to show our custom controls.
  - This IOS doesn't supports the Fullscreen API on the div element, refer to this link https://caniuse.com/?search=fullscreen. But IOS can supports Fullscreen API on the video element.
  - To handle this kind of issue on IOS, instead of making the div fullscreen, we make the video element itself fullscreen and hide our custom controls because when video enter fullscreen mode on IOS it will show the native controls. And when users exit the fullscreen by clicking on the X (close) button, we show our custom controls.
  - Of course we need to update our custom controls when users playing with the native controls, e.g change the video sound to be muted then we need to update our custom mute button.

## Set Volume Issue
  - With this custom controls we need to be able to change the volume using our volume range input. But the volume property is not settable using Javascript. Reading the volume property will always returns 1.
  - To handle this kind of issue on IOS, we need to hide our volume range on IOS. See the link here https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html, at the Volume Control in JavaScript section.

## Getting available quality issue
  - The quality selection can't be done on IOS, that's because the getVariantTracks function from shaka player returns incomplete data on IOS. IOS plays the HLS natively, we can't play HLS using MediaSource on IOS. getVariantTracks() returns incomplete information because we are constructing it from the video element's audio track information. see this link for the issue https://github.com/google/shaka-player/issues/2802

## Adding external subtitle issue
  - Adding external subtitle will have an issue on IOS, shaka player can't query the subtitle tracks because the subtitle tracks is added to the video element and its kind has been changed from "subtitle" to "metadata" in the internal structure of the video object. see this link for the issue https://github.com/google/shaka-player/issues/3312