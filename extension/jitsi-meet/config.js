var config = {

    hosts: {
        domain: 'desktop-545pc5b',
        muc: 'conference.desktop-545pc5b'
    },

    bosh: 'wss://desktop-545pc5b:7443/ws/',
    clientNode: 'http://jitsi.org/jitsimeet',

    disableSuspendVideo: true,

    desktopSharingChromeExtId: null,
    desktopSharingChromeDisabled: true,
    desktopSharingChromeSources: [ 'screen', 'window', 'tab' ],
    desktopSharingChromeMinExtVersion: '0.1',
    desktopSharingFirefoxDisabled: false,

    channelLastN: -1,
    enableWelcomePage: true,
    minHDHeight: 540,
    enableUserRolesBasedOnToken: false,

    p2p: {
        enabled: true,
        stunServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ],
        preferH264: true
    },

    deploymentInfo: {

    },

    localRecording: {
         enabled: true,
         format: 'flac'
    }

};