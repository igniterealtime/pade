var OFMEET_CONFIG = {};

// mandatory

var __server = getSetting("server");
var __displayname = getSetting("displayname");
var __username = getSetting("username");
var __password = getSetting("password");
var __domain = getSetting("domain");

// optional
var __enableSip = getSetting("enableSip", false);
var __showSharedCursor = getSetting("showSharedCursor", true);


OFMEET_CONFIG = {
    emailAddress:'',
    nickName:__displayname ? __displayname : __username,
    username:__username,
    userAvatar: null,
    authorization: btoa(__username + ":" + __password),

    isSwitchAvailable: __enableSip,
    showSharedCursor: __showSharedCursor,
    callcontrol:'callcontrol.' + __domain,
    sip:__server,
    hostname: __server,
    room: urlParam("room"),
    domain:__domain,
    iframe: function(url) {
        return '<iframe src=' + url + ' id="ofmeet-content" style="width: 100%; height: 100%; border: 0;padding-left: 45px; padding-top: 90px;">';
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
        OFMEET_CONFIG.activeUrl = win.pade.activeUrl;
        OFMEET_CONFIG.userAvatar = win.pade.avatar;
        APP.conference.changeLocalAvatarUrl(OFMEET_CONFIG.userAvatar);
    });
});

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
