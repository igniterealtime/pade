window.addEventListener("load", function()
{
	console.log("Pade is trying to get permissions to use your video/audio devices");

	navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function(stream)
	{
		console.log("Pade now has permissions to use your video/audio devices");

		setTimeout(function()
		{
			stream.getAudioTracks().forEach(function (track)
			{
				console.log("stopping track")
				track.stop();
			});

		}, 120000);
	})
	.catch(function(err) {
		alert("To experience the full functionality of Pade, please connect audio and video devices.");
		console.error("Error trying to get the stream:: " + err.message);
	});

	navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

	function onMIDISuccess(midiAccess) {
	    console.log('MIDI Access Object', midiAccess);
	}

	function onMIDIFailure(e) {
	    console.error("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
	}

});