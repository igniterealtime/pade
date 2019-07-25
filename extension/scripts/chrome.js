if (!window.chrome || !window.chrome.extension)
{
    var createNotification = function (notifyId, opt, callback)
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
            console.debug("createNotification onclick", event, notifyId);
            event.preventDefault();

            if (chrome.pade.notificationsListener)
            {
                chrome.pade.notificationsListener(notifyId, 0);
            }
        }

        if (callback) callback(notifyId);
    };

    var openUrl = function(data)
    {
        if (data.url.endsWith("converse.html"))
        {
            chrome.pade.chatWindow = {id: chrome.pade.winId};
            return;
        }

        window.open(data.url, data.url);
    };

    window.chrome = {
        pade: {badgeBackgroundColor: {color: '#ff0000'}, winId: 0, idleCounter: 0, i18n: {}, manifest: {}},

        contextMenus: {
            create: function(data) {
                console.debug("create menu", data);
            },
            removeAll: function(data) {
                console.debug("remove all menus", data);
            }
        },

        storage: {
            local : {
                get : function(query, callback) {
                    var data = {};

                    if (window.localStorage[query])
                    {
                        data[query] = JSON.parse(window.localStorage[query]);
                    }
                    console.debug("storage.local.get", data);
                    if (callback) callback(data);
                },
                set : function(data, callback) {

                    var keys = Object.getOwnPropertyNames(data);

                    if (keys.length > 0)
                    {
                        window.localStorage[keys[0]] = JSON.stringify(data[keys[0]]);
                    }
                    console.debug("storage.local.set", data);
                    if (callback) callback(data);
                },
                clear : function() {
                    console.debug("storage.local.clear");
                    localStorage.clear();
                },
                remove : function(key) {
                    console.debug("storage.local.remove", key);
                    localStorage.removeItem(key);
                }
            },
            sync: {
              get: function(keys, callback) {
                var store = {};
                keys.forEach(function(key) {
                  try {
                    store[key] = JSON.parse(localStorage.getItem(key));
                  } catch (e) {
                    store[key] = null;
                  }
                });
                if (callback) setTimeout(function() { callback(store); });
              },
              set: function(values) {
                for (var key in values) {
                  localStorage.setItem(key, JSON.stringify(values[key]));
                }
              },
            },
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
                addListener: function(callback) {
                    chrome.pade.focusListener = callback;
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

                if (callback) callback({id: chrome.pade.winId});
                chrome.pade.winId++;
            },
            update: function(id, prop) {

            },
            remove: function(id) {

            },
        },

        extension : {
            getURL : function(file) {
                return file;
            },

            getBackgroundPage: function() {
                return opener || window;
            },

            getViews: function(filter) {
                return [top.document.getElementById("inverse").contentWindow]
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
                addListener: function(callback)  {   // "locked", "idle", "active"
                    chrome.pade.idleListener = callback;
                }
            },
            setDetectionInterval: function(interval)  {

                if (chrome.pade.idleListener)
                {
                    chrome.pade.idleInterval = interval;

                    if (chrome.pade.idleFunction)
                    {
                        clearInterval(chrome.pade.idleFunction);
                        chrome.pade.idleCounter = 0;
                        chrome.pade.idleState = "active";
                    }

                    chrome.pade.idleFunction = setInterval(function()
                    {
                        if (document.hasFocus())
                        {
                            chrome.pade.idleCounter = 0;

                            if (chrome.pade.idleState != "active")
                            {
                                chrome.pade.idleListener("active");
                                chrome.pade.idleState = "active";

                                if (chrome.pade.focusListener && chrome.pade.chatWindow)
                                {
                                    chrome.pade.focusListener(chrome.pade.chatWindow.id);
                                }
                            }
                        }
                        else {
                            chrome.pade.idleCounter++;

                            if (chrome.pade.idleState == "active" && chrome.pade.idleCounter >= chrome.pade.idleInterval)
                            {
                                chrome.pade.idleListener("idle");
                                chrome.pade.idleState = "idle";
                            }
                            else

                            if (chrome.pade.idleState != "inactive" && chrome.pade.focusListener)
                            {
                                chrome.pade.focusListener(-1);
                                chrome.pade.idleState = "inactive";
                            }
                        }
                    }, 1000 );
                }
                else console.error("idle.onStateChanged.addListener not found");
            }
        },

        notifications : {
            onClosed: {
                addListener: function(notificationId, byUser)  {
                }
            },
            onButtonClicked: {
                addListener: function(callback)  {
                    chrome.pade.notificationsListener = callback;
                }
            },
            onClicked: {
                addListener: function(callback)  {
                    chrome.pade.notificationsListener = callback;
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
                return chrome.pade.manifest;
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
                return file;
            },
            reload: function() {
                location.reload();
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
               chrome.pade.badgeBackgroundColor = data;
            },

            setBadgeText: function(data) {
              var favicon = top.document.getElementById('favicon');
              var faviconSize = 16;

              var canvas = document.createElement('canvas');
              canvas.width = faviconSize;
              canvas.height = faviconSize;
              document.body.appendChild(canvas);

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
                      context.fillStyle = chrome.pade.badgeBackgroundColor.color;
                      context.fill();

                      // Draw Notification Number
                      context.font = '10px "helvetica", sans-serif';
                      context.textAlign = "center";
                      context.textBaseline = "middle";
                      context.fillStyle = '#FFFFFF';
                      context.fillText(data.text, canvas.width - faviconSize / 3, faviconSize / 3);
                  }

                  // Replace favicon
                  favicon.href = canvas.toDataURL('image/png');
                  document.body.removeChild(canvas);
                };

                img.src = "icon.png";

            },
            setTitle: function(data) {
                if (data && data.title) document.title = data.title;
            },
        },

        i18n: {
            getMessage: function(message) {

                if (chrome.pade.i18n[message]) return chrome.pade.i18n[message].message;
                var messages = chrome.extension.getBackgroundPage().chrome.pade.i18n
                if (messages[message]) return messages[message].message;
                return message.charAt(0).toUpperCase() + message.slice(1);
            }
        }
    };
};