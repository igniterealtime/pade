var OFMEET_CONFIG = {};

__bgWin = chrome.extension.getBackgroundPage();

// mandatory

var __server = getSetting("server");
var __domain = getSetting("domain");
var __baseUrl = getSetting("ofmeetUrl", "https://meet.jit.si");
var __sameOrigin = true;

if (__baseUrl.indexOf("https://" + __server) == -1)
{
    __server = __baseUrl.split("/")[2];
    __domain = __server.split(":")[0];
    __sameOrigin = false;
}

var __displayname = getSetting("displayname");
var __username = __bgWin.pade.username;
var __password = __bgWin.pade.password;
var __email = getSetting("email", null);
var __mode = urlParam("mode");
var __ofmeetUrl = __mode ? "https://" + __server + "/webinar/" : getSetting("ofmeetUrl", "https://" + __server + "/ofmeet/");

if (__ofmeetUrl.substring(__ofmeetUrl.length -1, __ofmeetUrl.length) != "/")
{
   __ofmeetUrl = __ofmeetUrl + "/";
}

var __baseUrl = getSetting("ofmeetUrl", "https://" + __server + "/ofmeet/");

// optional
var __enableSip = getSetting("enableSip", false);
var __showSharedCursor = getSetting("showSharedCursor", true);


OFMEET_CONFIG = {
    bgWin: __bgWin,
    emailAddress: __email,
    nickName:__displayname ? __displayname : __username,
    username:__username,
    userAvatar: null,
    authorization: btoa(__username + ":" + __password),
    mode: __mode,
    isSwitchAvailable: __enableSip,
    showSharedCursor: __showSharedCursor,
    callcontrol:'callcontrol.' + __domain,
    sip:__server,
    sameOrigin: __sameOrigin,
    hostname: __server,
    room: urlParam("room") || getUrl(),
    domain:__domain,
    ofmeetUrl: __ofmeetUrl,
    converseEmbedOfMeet: getSetting("converseEmbedOfMeet", false),
    enableTranscription: getSetting("enableTranscription", false),
    transcribeLanguage: getSetting("transcribeLanguage", "en-GB"),
    recordAudio: getSetting("recordAudio", false),
    recordVideo: getSetting("recordVideo", false),
    enableCaptions: getSetting("enableCaptions", false),
    iframe: function(url) {
        return '<iframe src=' + url + ' id="ofmeet-content" style="width: 100%; height: 100%; border: 0;padding-left: 0px; padding-top: 0px;">';
    },
};

window.addEventListener("DOMContentLoaded", function()
{
    chrome.runtime.getBackgroundPage(function(win)
    {
        createAvatar();     // default avatar

        OFMEET_CONFIG.activeUrl = win.pade.activeUrl;
        if (OFMEET_CONFIG.emailAddress) APP.conference.changeLocalEmail(OFMEET_CONFIG.emailAddress);

        win.findUsers(__username, function(users)
        {
            if (users[0] && users[0].email && users[0].email != "")
            {
                OFMEET_CONFIG.emailAddress = users[0].email;
                APP.conference.changeLocalEmail(OFMEET_CONFIG.emailAddress);
            }
        });

        if (win.pade.avatar) OFMEET_CONFIG.userAvatar = win.pade.avatar;

        if (OFMEET_CONFIG.nickName)        APP.conference.changeLocalDisplayName(OFMEET_CONFIG.nickName);
        if (OFMEET_CONFIG.userAvatar)      APP.conference.changeLocalAvatarUrl(OFMEET_CONFIG.userAvatar);

    });
});

function getUrl()
{
    var url = urlParam("url");

    if (url && url.indexOf("web+meet:") == 0)
    {
        url = url.substring(9);
    }
    return url;
}

function urlParam(name)
{
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (!results) { return undefined; }
    return unescape(results[1] || undefined);
};


function getSetting(name, defaultValue)
{
    //console.debug("getSetting", name, defaultValue);

    var value = defaultValue;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);
    }

    return value;
}

function createAvatar()
{
    if (!OFMEET_CONFIG.userAvatar && OFMEET_CONFIG.nickName)
    {
        OFMEET_CONFIG.userAvatar = ofmeet.createAvatar(OFMEET_CONFIG.nickName);
    }
}
