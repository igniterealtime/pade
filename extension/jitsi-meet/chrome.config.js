if (window.localStorage["store.settings.server"])
{
    var __server = JSON.parse(window.localStorage["store.settings.server"]);
    var __domain = JSON.parse(window.localStorage["store.settings.domain"]);
    var __username = JSON.parse(window.localStorage["store.settings.username"]);
    var __password = JSON.parse(window.localStorage["store.settings.password"]);

    var __startWithAudioMuted = window.localStorage["store.settings.startWithAudioMuted"] && JSON.parse(window.localStorage["store.settings.startWithAudioMuted"]);
    var __startWithVideoMuted = window.localStorage["store.settings.startWithVideoMuted"] && JSON.parse(window.localStorage["store.settings.startWithVideoMuted"]);

    var config = {
	  "etherpad_base": 'https://' + __server + '/etherpad/p/',
      "videoBandwidth": 512,
      "useNicks": false,
      "desktopSharingFirefoxMaxVersionExtRequired": 51,
      "disableAudioLevels": false,
      "audioMixer": false,
      "useIPv6": false,
      "defaultSipNumber": "",
      "audioBandwidth": 64,
      "startBitrate": 800,
      "enableWelcomePage": true,
      "useStunTurn": false,
      "enableRtpStats": true,
      "bosh": "wss://" + __server + "/ws/",
      "enableRecording": false,
      "resolution": 720,
      "hiddenDomain": "recorder." + __domain + "",
      "enableLipSync": false,
      "minHDHeight": 540,
      "useRoomAsSharedDocumentName": false,
      "recordingType": "colibri",
      "desktopSharingChromeMinExtVersion": "0.0.1",
      "startAudioMuted": 9,
      "desktopSharingFirefoxExtId": "jidesha@meet.jit.si",
      "desktopSharingFirefoxExtensionURL": "https://" + __server + "/ofmeet/jidesha-0.1.1-fx.xpi",
      "openSctp": true,
      "clientNode": "http://igniterealtime.org/ofmeet/jitsi-meet/",
      "conferences": [],
      "channelLastN": -1,
      "desktopSharingFirefoxDisabled": false,
      "adaptiveLastN": false,
      "desktopSharingChromeExtId": "blnhgbeilkjpcadckjogfflfijeblbpo",
      "hosts": {
        "domain": __domain + "",
        "focus": "focus." + __domain + "",
        "muc": "conference." + __domain + "",
        "callcontrol": "callcontrol." + __domain,
        "bridge": "jitsi-videobridge." + __domain + ""
      },
	  "getroomnode" : function (config, path) {
		console.log("getroomnode", config, path);
		return "test";
	  },
      "logStats": false,
      "useRtcpMux": true,
      "requireDisplayName": false,
      "startVideoMuted": 9,
      "adaptiveSimulcast": false,
      "enforcedBridge": "jitsi-videobridge." + __domain + "",
      "desktopSharingChromeMethod": "ext",
      "useBundle": true,
      "disableRtx": true,
      "disableAdaptiveSimulcast": true,
      "desktopSharingChromeSources": [
        "screen",
        "window"
      ],
      "disableSimulcast": false,
      "startAudioOnly": false,
      "startWithAudioMuted": __startWithAudioMuted,
      "startWithVideoMuted": __startWithVideoMuted,
      "stereo": false,
      "focusUserJid": "focus@" + __domain + ""
    };
}