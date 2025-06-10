if (!window.chrome?.extension)
{
    var padeName = "pade";
    var appName = "Pade";
    var appVer = "2.2.0";
    var appLanguage = "en";
    var badgeBackgroundColor = {color: '#ff0000'};
    var i18nMessages = {};
    var favico = null;

    if (window.localStorage["store.settings.language"])
    {
        appLanguage = JSON.parse(window.localStorage["store.settings.language"]);
		if (!appLanguage || appLanguage == "") appLanguage = "en";
    }

    fetch(location.protocol + "//" + location.host + "/" + padeName + "/_locales/" + appLanguage + "/messages.json", {method: "GET", headers: {"accept": "application/json"}}).then(function(response){ return response.json()}).then(function(messages)
    {
        console.debug("i18nMessages", messages);
        i18nMessages = messages;

        if (i18nMessages.manifest_shortExtensionName) appName = i18nMessages.manifest_shortExtensionName.message;

        fetch(location.protocol + "//" +  location.host + "/" + padeName + "/manifest.json", {method: "GET", headers: {"accept": "application/json"}}).then(function(response){ return response.json()}).then(function(manifest)
        {
            console.debug("manifest.json", manifest);
            appVer = manifest.version;
            document.title = appName + " | " + appVer;

        }).catch(function (err) {
            console.error("manifest.json", err);
        });

    }).catch(function (err) {
        console.error("i18nMessages", err);
    });

    // setup chrome shim

    window.chrome = {
        pade: true,
        padeName: padeName,

        contextMenus: {
            create: function(data) {
                console.debug("create menu", data);
            },
            onClicked: {
                addListener: function(notificationId)  {
                }
            },			
        },

        storage: {
            local : {
                get : function(query, callback) {

                    var data = {};

                    if (window.localStorage[query])
                    {
                        data[query] = JSON.parse(window.localStorage[query]);
                    }
                    //console.debug("storage.local.get", data);
                    if (callback) callback(data);
                },
                set : function(data, callback) {

                    var keys = Object.getOwnPropertyNames(data);

                    if (keys.length > 0)
                    {
                        window.localStorage[keys[0]] = JSON.stringify(data[keys[0]]);
                    }
                    //console.debug("storage.local.set", data);
                    if (callback) callback(data);
                },
                clear : function() {
                    //console.debug("storage.local.clear");
                    localStorage.clear();
                },
                remove : function(key) {
                    //console.debug("storage.local.remove", key);
                    localStorage.removeItem(key);
                }
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
                console.debug("create window", data);
                openUrl(data);
            },
            update: function(id, prop) {

            },
            remove: function(id) {

            },
            getCurrent: function(obj) {

            }
        },

        extension : {
            getURL : function(file) {
                return document.location.protocol + '//' + document.location.host + '/' + padeName + '/' + file;
            },

            getBackgroundPage: function() {
                return parent;
            },

            getViews: function(filter) {
                return [parent.document.getElementById("inverse").contentWindow]
            }
        },

        tabs : {
            query : function(data, callback) {
                if (callback) callback([]);
            },

            create : function(data, callback) {
                console.debug("create tab", data);
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
                createNotification(notifyId, opt, callback);
            },
            clear: function(notifyId, callback)  {
                callback(true);
            },
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
                return document.location.protocol + '//' + document.location.host + '/' + padeName + '/' + file;
            },
            reload: function() {
                if (localStorage["store.settings.server"])
                {
                    if (parent.opener)
                    {
                        parent.opener.location.reload();
                        parent.close();
                    }
                    else {
                        parent.location.href = "/" + padeName + "/index.html";
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
            setBadgeBackgroundColor: function(data) {
               //badgeBackgroundColor = data;
            },

            setBadgeText: function(data) {
              //console.debug("setBadgeText", data);

              var favicon = parent.document.getElementById('favicon');
              var faviconSize = 16;

              if (!favico) favico = favicon.href;

              var canvas = document.createElement('canvas');
              canvas.width = faviconSize;
              canvas.height = faviconSize;

              var context = canvas.getContext('2d');
              var img = document.createElement('img');

              img.onload = () => {
                  // Draw Original Favicon as Background
                  context.drawImage(img, 0, 0, faviconSize, faviconSize);

                  if (data.text != "")
                  {
                      // Draw Notification Circle
                      context.beginPath();
                      context.arc( canvas.width - faviconSize / 3 , faviconSize / 3, faviconSize / 3, 0, 2*Math.PI);
                      context.fillStyle = badgeBackgroundColor.color;
                      context.fill();

                      // Draw Notification Number
                      context.font = '10px "helvetica", sans-serif';
                      context.textAlign = "center";
                      context.textBaseline = "middle";
                      context.fillStyle = '#FFFFFF';
                      context.fillText(data.text, canvas.width - faviconSize / 3, faviconSize / 3);

                      if (navigator.setAppBadge)
                      {
                          navigator.setAppBadge(parseInt(data.text, 10)).catch((error) => {
                            console.error("setBadgeText", error);
                          });
                      }
                  }
                  else {
                      if (navigator.clearAppBadge)
                      {
                          navigator.clearAppBadge().catch((error) => {
                            console.error("setBadgeText", error);
                          });
                      }
                  }

                  // Replace favicon
                  favicon.href = canvas.toDataURL('image/png');
              };
              img.src = favico;

            },
            setTitle: function(data) {
                if (data && data.title) document.title = data.title;
            },
        },

        i18n: {
            getMessage: function(message) {
                if (i18nMessages[message]) return i18nMessages[message].message;

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
	
    prompt.onclose = function(event)
    {
        event.preventDefault();
        if (callback) callback(notifyId, 1);
    }
}

function openUrl(data)
{
    var optionsPage = data.url.indexOf("options/index.html") > -1;

    if (optionsPage)
    {
        window.open("/" + padeName + "/options.html", "options");
    }
    else {
        window.open(data.url, data.url);
    }
}