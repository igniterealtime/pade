var OFMEET_CONFIG = {};

// mandatory

var __server = getSetting("server");
var __displayname = getSetting("displayname");
var __username = getSetting("username");
var __password = getSetting("password");
var __domain = getSetting("domain");
var __email = getSetting("email", null);

// optional
var __enableSip = getSetting("enableSip", false);
var __showSharedCursor = getSetting("showSharedCursor", true);


OFMEET_CONFIG = {
    emailAddress: __email,
    nickName:__displayname ? __displayname : __username,
    username:__username,
    userAvatar: null,
    authorization: btoa(__username + ":" + __password),
    mode: urlParam("mode"),
    isSwitchAvailable: __enableSip,
    showSharedCursor: __showSharedCursor,
    callcontrol:'callcontrol.' + __domain,
    sip:__server,
    hostname: __server,
    room: urlParam("room") || getUrl(),
    domain:__domain,
    enableTranscription: getSetting("enableTranscription", false),
    transcribeLanguage: getSetting("transcribeLanguage", "en-GB"),
    recordAudio: getSetting("recordAudio", false),
    recordVideo: getSetting("recordVideo", false),
    enableCaptions: getSetting("enableCaptions", false),
    iframe: function(url) {
        return '<iframe src=' + url + ' id="ofmeet-content" style="width: 100%; height: 100%; border: 0;padding-left: 0px; padding-top: 0px;">';
    },
};

OFMEET_CONFIG.bgWin = chrome.extension.getBackgroundPage();

if (!OFMEET_CONFIG.bgWin)
{
    chrome.runtime.getBackgroundPage(function(win)
    {
        OFMEET_CONFIG.bgWin = win;
    });
}

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
    //console.log("getSetting", name, defaultValue);

    var value = defaultValue;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);

        if (name == "password") value = getPassword(value);

    } else {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }

    return value;
}

function getPassword(password)
{
    if (!password || password == "") return null;
    if (password.startsWith("token-")) return atob(password.substring(6));

    window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(password));
    return password;
}

function createAvatar()
{
    if (!OFMEET_CONFIG.userAvatar && OFMEET_CONFIG.nickName)
    {
        OFMEET_CONFIG.userAvatar = ofmeet.createAvatar(OFMEET_CONFIG.nickName);
    }
}
