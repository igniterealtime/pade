if (!window.chrome || !window.chrome.extension)
{
    window.pade = getBackgroundPage().pade;

    var appName = "BeeKeeper";
    var appVer = "1.1.1";

    window.chrome = {
        storage : {
            local : {
                get : function(query, callback) {
                    if (callback) callback({});
                },
                set : function(data, callback) {
                    if (callback) callback({});
                }
            }
        },

        pade: true,

        downloads: {
            download: function(json, callback) {
                alert("Not Supported");
            }
        },

        windows: {
            onRemoved: {
                addListener: function(win)  {
                }
            },

            onFocusChanged: {
                addListener: function(win) {
                }
            },

            update: function(id, prop) {

            },
        },

        extension : {
            getURL : function(file) {
                return document.location.protocol + '//' + document.location.host + '/apps/' + file;
            },

            getBackgroundPage: function() {
                return getBackgroundPage();
            },

            getViews: function(filter) {
                return []
            }
        },

        tabs : {
            query : function(data, callback) {
                if (callback) callback();
            },

            create : function(data, callback) {
                if (callback) callback();
            },

            update : function(tabId, options, callback) {
                if (callback) callback();
            }
        },

        runtime : {
            getManifest : function() {
                return {
                    version: appVer
                }
            },
            onMessage: {
                addListener: function(win)  {
                }
            },
            getURL : function(file) {
                return document.location.protocol + '//' + document.location.host + '/apps/' + file;
            },
        },

        browserAction : {
            setIcon : function(data, callback) {
                if (callback) callback();
            }
        },

        i18n: {
            getMessage: function(message) {
                if (message == "manifest_extensionDescription") return appName;
                if (message == "manifest_extensionName") return appName;
                if (message == "manifest_shortExtensionName") return appName;
                if (message == "browserAction_title") return appName;

                return message.charAt(0).toUpperCase() + message.slice(1);
            }
        }
    };
}

function getBackgroundPage()
{
    var server = getSetting("server", null);
    var domain = getSetting("domain", null);
    var username = getSetting("username", null);
    var password = getSetting("password", null);
    var avatar = getSetting("avatar", null);
    var ofmeetUrl = getSetting("ofmeetUrl", null);

    if (!ofmeetUrl) ofmeetUrl = "https://" + server + "/ofmeet/";

    return {
        openWebAppsWindow: function(url, status, width, height)
        {
            if (!width) width = 1024;
            if (!height) height = 768;

            if (url.startsWith("_")) url = url.substring(1);
            var httpUrl = url.startsWith("http") ? url.trim() : ( url.startsWith("chrome-extension") ? url : "https://" + url.trim());

            console.debug("openWebAppsWindow", httpUrl, width, height);
            window.open(httpUrl, httpUrl);
        },

        notifyText: function(message, context, jid, buttons, callback, notifyId) {
            notifyText(message, context, jid, buttons, callback, notifyId)
        },

        openVideoWindow: function(room, mode)
        {
            var url = ofmeetUrl;
            if (room) url = url + room;
            window.open(url, url);
        },

        getVideoWindowUrl: function(room, mode)
        {
            var url = chrome.runtime.getURL("jitsi-meet/chrome.index.html");
            if (room) url = url + "?room=" + room + (mode ? "&mode=" + mode : "");
            return url;
        },

        pade: {
            autoJoinRooms: {}, autoJoinPrivateChats: {}, gmailWindow: [], webAppsWindow: [], vcards: {}, questions: {}, collabDocs: {}, collabList: [], userProfiles: {}, fastpath: {}, geoloc: {}, transferWise: {},
            transferWiseUrl: "https://api.transferwise.com/v1", // "https://api.sandbox.transferwise.tech/v1";
            server: server,
            domain: domain,
            username: username,
            password: password,
            avatar: avatar,
            ofmeetUrl: ofmeetUrl,
            chatWindow: {},
            busy: false,
            jid: username + "@" + domain,
        },

        searchConversations: function(keywords, callback) {
            searchConversations(keywords, callback);
        },
    }
}
function getSetting(name, defaultValue)
{
    var localStorage = window.localStorage
    //console.debug("getSetting", name, defaultValue, localStorage["store.settings." + name]);

    if (window.pade)
    {
        if (name == "username") return window.pade.username;
        if (name == "password") return window.pade.password;
        if (name == "domain") return window.pade.domain;
        if (name == "server") return window.pade.server;
    }

    var value = defaultValue;

    if (localStorage["store.settings." + name])
    {
        value = JSON.parse(localStorage["store.settings." + name]);

        if (name == "password") value = getPassword(value, localStorage);
    }

    return value;
}

function setSetting(name, value)
{
    //console.debug("setSetting", name, value);
    window.localStorage["store.settings." + name] = JSON.stringify(value);
}

function getPassword(password, localStorage)
{
    if (!password || password == "") return null;
    if (password.startsWith("token-")) return atob(password.substring(6));

    localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(password));
    return password;
}

function notifyText(message, context, jid, buttons, callback, notifyId)
{
    console.debug("notifyText", message, context, jid, buttons, notifyId);

    //if (pade.busy) return;  // no notifications when I am busy

    if (!notifyId) notifyId = Math.random().toString(36).substr(2,9);

    var prompt = new Notification(context,
    {
        body: message,
        icon: chrome.runtime.getURL("image.png"),
        requireInteraction: !!buttons && !!callback
    });

    prompt.onclick = function(event)
    {
        event.preventDefault();
        if (callback && buttons) callback(notifyId, 0);
    }
};
