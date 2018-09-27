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

    hosts: {
        "domain": __domain,
        "focus": "focus." + __domain,
        "bridge": "jitsi-videobridge." + __domain,
        "muc": "conference." + __domain
    },
    disableSimulcast: false,
    enableRemb: false,
    enableTcc: true,
    resolution: 720,
    constraints: {
        video: {
            aspectRatio: 16 / 9,
            height: {
                ideal: 720,
                max: 720,
                min: 240
            }
        }
    },
    bosh: connUrl,
    enforcedBridge: "jitsi-videobridge." + __domain,
    clientNode: "http://igniterealtime.org/pade/",

    disableSuspendVideo: true,

    desktopSharingChromeExtId: "blnhgbeilkjpcadckjogfflfijeblbpo",
    desktopSharingChromeDisabled: false,
    desktopSharingChromeSources: [ 'screen', 'window', 'tab' ],
    desktopSharingChromeMinExtVersion: '0.1',
    desktopSharingFirefoxDisabled: true,

    channelLastN: -1,
    startAudioMuted: 5,
    startVideoMuted: 5,
    enableWelcomePage: true,
    minHDHeight: getSetting("minHDHeight", 540),
    enableUserRolesBasedOnToken: false,

    enableLipSync: getSetting("enableLipSync", false),
    startWithAudioMuted: getSetting("startWithAudioMuted", false),
    startWithVideoMuted: getSetting("startWithVideoMuted", false),

    p2p: {
        enabled: true,
        useStunTurn: true,
        stunServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ],
        preferH264: true,
        disableH264: true,
    },

    deploymentInfo: {

    },

    localRecording: {
         enabled: false,
         format: 'flac'
    }

};