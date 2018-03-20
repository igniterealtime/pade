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
        createAvatar();     // default avatar

        OFMEET_CONFIG.activeUrl = win.pade.activeUrl;

        win.findUsers(__username, function(users)
        {
            if (users[0] && users[0].email)
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
        var canvas = document.createElement('canvas');
        canvas.style.display = 'none';
        canvas.width = '32';
        canvas.height = '32';
        document.body.appendChild(canvas);
        var context = canvas.getContext('2d');
        context.fillStyle = "#777";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = "16px Arial";
        context.fillStyle = "#fff";

        var first, last;
        var name = OFMEET_CONFIG.nickName.split(" ");

        if (name && name[0] && name.first != '')
        {
            first = name[0][0];
            last = name[1] && name[1] != '' ? name[1][0] : null;

            if (last) {
                var initials = first + last;
                context.fillText(initials.toUpperCase(), 3, 23);
            } else {
                var initials = first;
                context.fillText(initials.toUpperCase(), 10, 23);
            }
            var data = canvas.toDataURL();
            document.body.removeChild(canvas);
            OFMEET_CONFIG.userAvatar = data;
        }
    }
}