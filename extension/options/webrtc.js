window.addEventListener("load", function()
{
    console.debug(chrome.i18n.getMessage('manifest_shortExtensionName') + " is trying to get permissions to use your video/audio devices");

    // webrtc permission for mic and webcam for first time log-in

    if (!window.localStorage["store.settings.server"])
    {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function(stream)
        {
            console.debug(chrome.i18n.getMessage('manifest_shortExtensionName') + " now has permissions to use your video/audio devices");

            setTimeout(function()
            {
                stream.getAudioTracks().forEach(function (track)
                {
                    console.debug("stopping track")
                    track.stop();
                });

            }, 30000);
        })
        .catch(function(err) {
            alert("To experience the full functionality of " + chrome.i18n.getMessage('manifest_shortExtensionName') + ", please connect audio and video devices.");
            console.error("Error trying to get the stream:: " + err.message);
        });

        // register MIDI permissions for APC
        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

        // register location permissions
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    }

    function onMIDISuccess(midiAccess) {
        console.debug('MIDI Access Object', midiAccess);
    }

    function onMIDIFailure(e) {
        console.error("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
    }

    function showPosition(position) {
        console.debug("Location - Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude, position);
    }

    function showError(error) {
        var errorMsg = "";
        switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = "User denied the request for Geolocation."
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = "Location information is unavailable."
          break;
        case error.TIMEOUT:
          errorMsg = "The request to get user location timed out."
          break;
        case error.UNKNOWN_ERROR:
          errorMsg = "An unknown error occurred."
          break;
        }
      console.error("Location - " + errorMsg, error);
    }
});