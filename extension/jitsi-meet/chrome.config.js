var __server = getSetting("server");
var __domain = getSetting("domain");
var __displayname = getSetting("displayname");
var __username = getSetting("username");
var __password = getSetting("password");

var connUrl = "https://" + __server + "/http-bind/";

if (getSetting("useWebsocket", false))
{
    connUrl = "wss://" + __server + "/ws/";
}

var config = {
  "etherpad_base": 'https://' + __server + '/etherpad/p/',
  "videoBandwidth": 512,
  "useNicks": false,
  "desktopSharingFirefoxMaxVersionExtRequired": 51,
  "disableAudioLevels": getSetting("disableAudioLevels", false),
  "audioMixer": false,
  "useIPv6": false,
  "defaultSipNumber": "",
  "audioBandwidth": 64,
  "startBitrate": 800,
  "enableWelcomePage": true,
  "useStunTurn": false,
  "enableRtpStats": true,
  "bosh": connUrl,
  "enableRecording": false,
  "resolution": 320,
  "hiddenDomain": "recorder." + __domain + "",
  "enableLipSync": getSetting("enableLipSync", false),
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
  "startWithAudioMuted": getSetting("startWithAudioMuted", false),
  "startWithVideoMuted": getSetting("startWithVideoMuted", false),
  "stereo": false,
  "focusUserJid": "focus@" + __domain + ""
};