if (!window.chrome || !window.chrome.extension)
{
    var appName = "Pade";
    var appVer = "1.2.7";

    // setup chrome shim

    window.chrome = {
        pade: true,

        storage : {
            local : {
                get : function(query, callback) {
                    if (callback) callback({});
                },
                set : function(data, callback) {
                    if (callback) callback({});
                },
                clear : function() {
                },
            }
        },

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
            onCreated: {
                addListener: function(win) {
                }
            },
            onRemoved: {
                addListener: function(win) {
                }
            },
            create: function(data, callback) {
                console.log("create window", data);
                openUrl(data);
            },
            update: function(id, prop) {

            },
            remove: function(id) {

            },
        },

        extension : {
            getURL : function(file) {
                return document.location.protocol + '//' + document.location.host + '/apps/' + file;
            },

            getBackgroundPage: function() {
                return top;
            },

            getViews: function(filter) {
                return [top.opener.document.getElementById("inverse").contentWindow]
            }
        },

        tabs : {
            query : function(data, callback) {
                if (callback) callback([]);
            },

            create : function(data, callback) {
                console.log("create tab", data);
                openUrl(data);
            },

            update : function(tabId, options, callback) {
                if (callback) callback();
            }
        },

        idle : {
            onStateChanged: {
                addListener: function(win)  {
                }
            },
        },

        notifications : {
            onClosed: {
                addListener: function(notificationId, byUser)  {
                }
            },
            onButtonClicked: {
                addListener: function(notificationId, buttonIndex)  {
                }
            },
            onClicked: {
                addListener: function(notificationId)  {
                }
            },
            create: function(notifyId, opt, callback)  {
                // TODO fix non-stop notifications
                //createNotification(notifyId, opt, callback);
            }
        },

        runtime : {
            getManifest : function() {
                return {
                    version: appVer,
                    homepage_url: "https://igniterealtime.org"
                }
            },
            onMessage: {
                addListener: function(win)  {
                }
            },
            onInstalled: {
                addListener: function(details)  {
                }
            },
            onStartup: {
                addListener: function(details)  {
                }
            },
            onMessageExternal: {
                addListener: function(request, sender, sendResponse)  {
                }
            },
            onConnect: {
                addListener: function(port)  {
                }
            },
            onConnect: {
                addListener: function(port)  {
                }
            },
            onConnect: {
                addListener: function(port)  {
                }
            },
            getURL : function(file) {
                return document.location.protocol + '//' + document.location.host + '/apps/' + file;
            },
            reload: function() {

                if (localStorage["store.settings.server"])
                {
                    if (top.opener)
                    {
                        top.opener.location.reload();
                        top.close();
                    }
                    else {
                        top.location.href = "/apps/index.html";
                    }
                }
                else {
                    location.reload();
                }
            }
        },

        commands : {
            onCommand: {
                addListener: function(comand)  {
                }
            },
        },

        browserAction : {
            setIcon : function(data, callback) {
                if (callback) callback();
            },
            onClicked: {
                addListener: function(notificationId)  {
                }
            },
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

function createNotification(notifyId, opt, callback)
{
    console.debug("createNotification", notifyId, opt);

    var prompt = new Notification(opt.contextMessage,
    {
        body: opt.message,
        icon: opt.iconUrl,
        requireInteraction: opt.requireInteraction
    });

    prompt.onclick = function(event)
    {
        event.preventDefault();
        if (callback) callback(notifyId, 0);
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

function setDefaultSetting(name, defaultValue)
{
    console.debug("setDefaultSetting", name, defaultValue, window.localStorage["store.settings." + name]);

    if (!window.localStorage["store.settings." + name] && window.localStorage["store.settings." + name] != false)
    {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }
}
function getPassword(password, localStorage)
{
    if (!password || password == "") return null;
    if (password.startsWith("token-")) return atob(password.substring(6));

    localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(password));
    return password;
}

function openUrl(data)
{
    var optionsPage = data.url.indexOf("options/index.html") > -1;

    if (optionsPage)
    {
        window.open("/apps/options.html", "options");
    }
    else {
        window.open(data.url, data.url);
    }
}