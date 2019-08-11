//-------------------------------------------------------
//
//  Defines
//
//-------------------------------------------------------

var pade = {
    participants: {},
    presence: {},
    tasks: {},
    sip: {},
    autoJoinRooms: {},
    autoJoinPrivateChats: {},
    gmailWindow: [],
    webAppsWindow: [],
    vcards: {},
    questions: {},
    collabDocs: {},
    collabList: [],
    userProfiles: {},
    fastpath: {},
    geoloc: {},
    transferWise: {},
    startupList: {}
};

var nickColors = {}, callbacks = {}, avatars = {}, __origins = {}, __converse = {}, _converse = null;

//-------------------------------------------------------
//
//  WebPush
//
//-------------------------------------------------------

var webpush = (function(push)
{
    var hostname, username, password, publicKey;

    function vapidGetPublicKey(host, user, pass)
    {
        var getUrl = "https://" + host + "/rest/api/restapi/v1/meet/webpush/" + user;
        var options = {method: "GET", headers: {"Authorization": "Basic " + btoa(user + ":" + pass), "Accept":"application/json", "Content-Type":"application/json"}};

        console.debug("vapidGetPublicKey", getUrl, options);

        fetch(getUrl, options).then(function(response) {return response.json()}).then(function(vapid)
        {
            if (vapid.publicKey)
            {
                console.debug("vapidGetPublicKey found", vapid);

                publicKey = vapid.publicKey;
                hostname = host;
                username = user;
                password = pass;

                navigator.serviceWorker.register('../scripts/serviceworker.js', {scope: './'}).then(initialiseState, initialiseError);
            } else {
                console.error("no web push, vapid public key not available");
            }

        }).catch(function (err) {
            console.error('vapidGetPublicKey error!', err);
        });
    }

    function initialiseError(error)
    {
        console.error("initialiseError", error);
    }

    function initialiseState(registration)
    {
        if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
            console.warn('Notifications aren\'t supported.');
            return;
        }

        if (Notification.permission === 'denied') {
            console.warn('The user has blocked notifications.');
            return;
        }

        if (!('PushManager' in window)) {
            console.warn('Push messaging isn\'t supported.');
            return;
        }

        console.debug("initialiseState", registration);

        navigator.serviceWorker.ready.then(function (serviceWorkerRegistration)
        {
            console.debug("initialiseState ready", serviceWorkerRegistration);

            serviceWorkerRegistration.pushManager.getSubscription().then(function (subscription)
            {
                console.debug("serviceWorkerRegistration getSubscription", subscription);

                if (!subscription && publicKey) {
                    subscribe();
                    return;
                }

                // Keep your server in sync with the latest subscriptionId
                sendSubscriptionToServer(subscription);
            })
            .catch(function(err) {
                console.warn('Error during getSubscription()', err);
            });
        });
    }

    function subscribe()
    {
        console.debug("subscribe", publicKey);

        navigator.serviceWorker.ready.then(function (serviceWorkerRegistration)
        {
            serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64UrlToUint8Array(publicKey)
            })
            .then(function (subscription) {
                return sendSubscriptionToServer(subscription);
            })
            .catch(function (e) {
                if (Notification.permission === 'denied') {
                    console.warn('Permission for Notifications was denied');
                } else {
                    console.error('Unable to subscribe to push.', e);
                }
            });
        });
    }

    function base64UrlToUint8Array(base64UrlData)
    {
        const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
        const base64 = (base64UrlData + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = atob(base64);
        const buffer = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            buffer[i] = rawData.charCodeAt(i);
        }

        return buffer;
    }

    function sendSubscriptionToServer(subscription)
    {
        console.debug("sendSubscriptionToServer", subscription);

        var key = subscription.getKey ? subscription.getKey('p256dh') : '';
        var auth = subscription.getKey ? subscription.getKey('auth') : '';

        var subscriptionString = JSON.stringify(subscription);  // TODO

        console.debug("web push subscription", {
            endpoint: subscription.endpoint,
            key: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : '',
            auth: auth ? btoa(String.fromCharCode.apply(null, new Uint8Array(auth))) : ''
        }, subscription);

        var resource = chrome.i18n.getMessage('manifest_shortExtensionName').toLowerCase() + "-" + BrowserDetect.browser + BrowserDetect.version + BrowserDetect.OS;
        var putUrl = "https://" + hostname + "/rest/api/restapi/v1/meet/webpush/" + username + "/" + resource;
        var options = {method: "PUT", body: JSON.stringify(subscription), headers: {"Authorization": "Basic " + btoa(username + ":" + password), "Accept":"application/json", "Content-Type":"application/json"}};

        return fetch(putUrl, options).then(function(response) {
            console.debug("subscribe response", response);

        }).catch(function (err) {
            console.error('subscribe error!', err);
        });
    }

    push.registerServiceWorker = function(host, username, password)
    {
        vapidGetPublicKey(host, username, password);
    }

    return push;

}(webpush || {}));

//-------------------------------------------------------
//
//  BrowserDetect
//
//-------------------------------------------------------


const BrowserDetect = {
    init: function () {
        this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
        this.version = this.searchVersion(navigator.userAgent)
            || this.searchVersion(navigator.appVersion)
            || "an unknown version";
        this.OS = this.searchString(this.dataOS) || "an unknown OS";

        this.width = 0;
        this.height = 0;

        if ( typeof( window.innerWidth ) == 'number' )
        {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

        } else if ( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {

            this.width = document.documentElement.clientWidth;
            this.height = document.documentElement.clientHeight;

        } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {

            this.width = document.body.clientWidth;
            this.height = document.body.clientHeight;
        }
    },

    searchString: function (data) {
        for (var i=0;i<data.length;i++) {
            var dataString = data[i].string;
            var dataProp = data[i].prop;
            this.versionSearchString = data[i].versionSearch || data[i].identity;
            if (dataString) {
                if (dataString.indexOf(data[i].subString) != -1)
                    return data[i].identity;
            }
            else if (dataProp)
                return data[i].identity;
        }
    },

    searchVersion: function (dataString) {
        var index = dataString.indexOf(this.versionSearchString);
        if (index == -1) return;
        return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
    },

    dataBrowser: [
        {
            string: navigator.userAgent,
            subString: "Chrome",
            identity: "Chrome"
        },
        {   string: navigator.userAgent,
            subString: "OmniWeb",
            versionSearch: "OmniWeb/",
            identity: "OmniWeb"
        },
        {
            string: navigator.vendor,
            subString: "Apple",
            identity: "Safari",
            versionSearch: "Version"
        },
        {
            prop: window.opera,
            identity: "Opera"
        },
        {
            string: navigator.vendor,
            subString: "iCab",
            identity: "iCab"
        },
        {
            string: navigator.vendor,
            subString: "KDE",
            identity: "Konqueror"
        },
        {
            string: navigator.userAgent,
            subString: "Firefox",
            identity: "Firefox"
        },
        {
            string: navigator.vendor,
            subString: "Camino",
            identity: "Camino"
        },
        {       // for newer Netscapes (6+)
            string: navigator.userAgent,
            subString: "Netscape",
            identity: "Netscape"
        },
        {
            string: navigator.userAgent,
            subString: "MSIE",
            identity: "Explorer",
            versionSearch: "MSIE"
        },
        {
            string: navigator.userAgent,
            subString: "Gecko",
            identity: "Mozilla",
            versionSearch: "rv"
        },
        {       // for older Netscapes (4-)
            string: navigator.userAgent,
            subString: "Mozilla",
            identity: "Netscape",
            versionSearch: "Mozilla"
        }
    ],

    dataOS : [
        {
            string: navigator.userAgent,
            subString: "Windows NT 10.0; Win64",
            identity: "Win10.64"
        },
        {
            string: navigator.userAgent,
            subString: "Windows NT 10.0",
            identity: "Win10"
        },
        {
            string: navigator.platform,
            subString: "Win",
            identity: "Win"
        },
        {
            string: navigator.platform,
            subString: "Mac",
            identity: "Mac"
        },
        {
           string: navigator.userAgent,
           subString: "iPhone",
           identity: "iPhone"
        },
        {
            string: navigator.platform,
            subString: "Linux",
            identity: "Linux"
        }
    ]
};

//-------------------------------------------------------
//
//  Window
//
//-------------------------------------------------------

window.addEventListener("unload", function()
{
    console.debug("background addListener unload");

    if (pade.planner) clearInterval(pade.planner);

    if (pade.chatWindow) chrome.windows.remove(pade.chatWindow.id);
    if (pade.videoWindow) chrome.windows.remove(pade.videoWindow.id);


    var webApps = Object.getOwnPropertyNames(pade.webAppsWindow);

    for (var i=0; i<webApps.length; i++)
    {
        if (pade.webAppsWindow[webApps[i]])
        {
            console.log("pade unloading web app " + webApps[i]);
            closeWebAppsWindow(webApps[i]);
        }
    }
});

window.addEventListener("load", function()
{
    console.debug("background addListener load");

    BrowserDetect.init();

    Notification.requestPermission().then(function(result)
    {
      console.log("Notification.requestPermission", result);
    });

    chrome.contextMenus.removeAll();
    chrome.contextMenus.create({id: "pade_dnd", type: "checkbox", title: "Do not disturb", contexts: ["browser_action"], onclick: dndCheckClick});

    chrome.contextMenus.create({id: "pade_selection_reply", type: "normal", title: 'Reply to "%s"', contexts: ["selection", "editable"], onclick: handleRightClick});
    chrome.contextMenus.create({id: "pade_selection_chat", type: "normal", title: "Chat with %s", contexts: ["selection", "editable"], onclick: handleRightClick});
    chrome.contextMenus.create({id: "pade_selection_chatroom", type: "normal", title: "Enter Chatroom %s", contexts: ["selection", "editable"], onclick: handleRightClick});
    chrome.contextMenus.create({id: "pade_selection_meet", type: "normal", title: "Meet in %s", contexts: ["selection", "editable"], onclick: handleRightClick});

    if (chrome.pade)    // browser mode
    {
        setDefaultSetting("useWebsocket", false);
        setDefaultSetting("useBasicAuth", false);
        setDefaultSetting("useCredsMgrApi", true);

        var appLanguage = "en";

        if (window.localStorage["store.settings.language"])
        {
            appLanguage = JSON.parse(window.localStorage["store.settings.language"]);
        }

        fetch("_locales/" + appLanguage + "/messages.json", {method: "GET", headers: {"accept": "application/json"}}).then(function(response){ return response.json()}).then(function(messages)
        {
            console.debug("i18n", messages);
            chrome.pade.i18n = messages;

            fetch("manifest.json", {method: "GET", headers: {"accept": "application/json"}}).then(function(response){ return response.json()}).then(function(manifest)
            {
                console.debug("manifest", manifest);
                chrome.pade.manifest = manifest;
                startConverse();
            }).catch(function (err) {
                console.error("manifest", err);
            });
        }).catch(function (err) {
            console.error("i18n", err);
        });
    }
    else {
        startConverse();
    }
});


//-------------------------------------------------------
//
//  Chrome
//
//-------------------------------------------------------


chrome.runtime.onInstalled.addListener(function(details)
{
    if (details.reason == "install")
    {
        console.log("This is a first install!");
        doExtensionPage("changelog.html");

    } else if (details.reason == "update"){
        var thisVersion = chrome.runtime.getManifest().version;
        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");

        if (thisVersion != details.previousVersion)
        {
            doExtensionPage("changelog.html");
            pade.startUp = true;
        }
    }
});

chrome.idle.onStateChanged.addListener(function(idleState)
{
    console.debug("chrome.idle.onStateChanged", idleState);

    if (pade.busy) return;  // no presence broadcast while I am busy

    var pres = converse.env.$pres(), show = null, status = null;

    if (idleState == "locked")
    {
        show = "xa";
        pres.c("show").t(show).up();

        status = getSetting("idleLockedMessage", i18n("good bye"));
        if (status) pres.c("status").t(status);
    }
    else

    if (idleState == "idle")
    {
        show = "away";
        pres.c("show").t(show).up();

        status = getSetting("idleMessage", i18n("see you later"));
        if (status) pres.c("status").t(status);
    }
    else

    if (idleState == "active")
    {
        status = getSetting("idleActiveMessage", i18n("hello"));
        if (status) pres.c("status").t(status);
    }

    if (_converse.connection)
    {
        if (idleState == "active") publishUserLocation();   // republish location in case user has moved

        if (pade.chatWindow)
        {
            var model = _converse.xmppstatusview.model;

            if (model)
            {
                model.set("status", show ? show : "online");
                if (status) model.set("status_message", status);
            }
        }
        else {
            _converse.connection.send(pres);
        }
    }
});

chrome.runtime.onStartup.addListener(function()
{
    console.log("onStartup");
    pade.startUp = true;

    setTimeout(function()   // wait for 3 secs before starting apps for background dependencies to be active and ready
    {
        reopenConverse();

        if (getSetting("enableWebApps", false))
        {
            var webApps = getSetting("webApps", "").split(",");

            for (var i=0; i<webApps.length; i++)
            {
                openWebAppsWindow(webApps[i], "minimized");
            }
        }

    }, 3000);
});

chrome.notifications.onClosed.addListener(function(notificationId, byUser)
{

});

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex)
{
    var callback = callbacks[notificationId];

    if (callback)
    {
        callback(notificationId, buttonIndex);

        callbacks[notificationId] = null;
        delete callbacks[notificationId];

        chrome.notifications.clear(notificationId, function(wasCleared)
        {

        });
    }
});

chrome.notifications.onClicked.addListener(function(notificationId)
{
    var callback = callbacks[notificationId];

    if (callback)
    {
        callback(notificationId, 0);

        callbacks[notificationId] = null;
        delete callbacks[notificationId];

        chrome.notifications.clear(notificationId, function(wasCleared)
        {

        });
    }
});



chrome.browserAction.onClicked.addListener(function()
{
    console.debug("background browserAction click");

    if (_converse && _converse.connection && _converse.connection.connected)
    {
        openChatWindow("converse.html");
    }
    else {
       doExtensionPage("options/index.html");
    }
});

chrome.commands.onCommand.addListener(function(command)
{
    console.debug('Command:', command);

    if (command == "activate_converse") openChatWindow("converse.html");
    if (command == "activate_settings") openOptions();

});

chrome.windows.onRemoved.addListener(function(win)
{
    console.debug("closing window ", win);

    if (pade.chatWindow && win == pade.chatWindow.id)
    {
        pade.chatWindow = null;
    }

    if (pade.videoWindow && win == pade.videoWindow.id)
    {
        pade.videoWindow = null;
        pade.minimised = false;
       if (_converse.connection) _converse.connection.send(converse.env.$pres());  // needed because JitsiMeet send unavailable
    }

    var webApps = Object.getOwnPropertyNames(pade.webAppsWindow);

    for (var i=0; i<webApps.length; i++)
    {
        if (pade.webAppsWindow[webApps[i]] && win == pade.webAppsWindow[webApps[i]].id)
        {
            delete pade.webAppsWindow[webApps[i]];
        }
    }
});

chrome.windows.onFocusChanged.addListener(function(win)
{
    console.debug("onFocusChanged", win, pade.chatWindow);

    if (pade.chatWindow)
    {
        if (win == -1) pade.minimised = true;
        if (win == pade.chatWindow.id) pade.minimised = false;

        if (!pade.minimised)
        {
            setBadge("", '#ff0000');
            pade.messageCount = 0;
        }
    }
    else

    if (pade.videoWindow)
    {
        if (win == -1) pade.minimised = true;
        if (win == pade.videoWindow.id) pade.minimised = false;
    }
    console.debug("minimised", win, pade.minimised, pade.chatWindow);
});

chrome.windows.onCreated.addListener(function(window)
{
    console.debug("opening window ", window);
})

chrome.storage.local.get('avatars', function(data)
{
    if (data && data.avatars) avatars = data.avatars;
});

chrome.storage.local.get('vuex', function(data)
{
    if (data && data.vuex) pade.tasks = data.vuex;
});

//-------------------------------------------------------
//
//  Functions
//
//-------------------------------------------------------


function dndCheckClick(info)
{
    if (!info.wasChecked && info.checked)
    {
        pade.busy = true;
        if (_converse.connection) _converse.connection.send($pres().c("show").t("dnd").up());
        if (pade.chatWindow) _converse.xmppstatusview.model.set("status", "dnd");

        setBadge("DND", '#ff0000', "Do not Disturb");
    }
    else

    if (info.wasChecked && !info.checked)
    {
        pade.busy = false;
        if (_converse.connection) _converse.connection.send($pres());
        if (pade.chatWindow) _converse.xmppstatusview.model.set("status", "online");

        setBadge("", '#ff0000', "Connected");
    }

}

function injectMessage(message, room, nickname)
{
    console.debug("injectMessage", message, room);

    try {
        var msg = $msg({to: room + "@conference." + pade.domain, type: "groupchat"});
        msg.c("body", message).up();
        msg.c("nick", {xmlns: "http://jabber.org/protocol/nick"}).t(nickname).up().up();
        pade.connection.send(msg);

    } catch (e) {
        console.error(e);
    }
}

function startTone(name)
{
    if (pade.busy) return;  // no ringtone when I am busy

    if (getSetting("enableRingtone", false))
    {
        console.debug("startTone", name);

        if (!pade.ringtone)
        {
            pade.ringtone = new Audio();
            pade.ringtone.loop = true;
            pade.ringtone.volume = 1;
        }

        pade.ringtone.src = chrome.runtime.getURL("ringtones/" + name + ".mp3");
        pade.ringtone.play();
    }
}

function stopTone()
{
    if (pade.ringtone)
    {
        pade.ringtone.pause();
    }
}

function handleInvitation(invite)
{
    console.debug("handleInvitation", invite);

    var jid = converse.env.Strophe.getBareJidFromJid(invite.offerer);

    if (pade.participants[jid])
    {
        var participant = pade.participants[jid];
        processInvitation(participant.name, participant.jid, invite.room, invite.autoaccept, invite.id, invite.reason, invite.webinar);
    }
    else

    if (invite.offerer == pade.domain)
    {
        processInvitation("Administrator", "admin@"+pade.domain, invite.room, invite.autoaccept, invite.id, invite.reason, invite.webinar);
    }
    else {
        var label = invite.offerer == converse.env.Strophe.getBareJidFromJid(pade.connection.jid) ? pade.displayName : "Unknown User"
        processInvitation(label, invite.offerer, invite.room, invite.autoaccept, invite.id, invite.reason, invite.webinar);
    }

    // inform touchpad

    if (pade.port) pade.port.postMessage({event: "invited", id : invite.offerer, name: invite.room, jid: invite.id});
}

function processInvitation(title, label, room, autoaccept, id, reason, webinar)
{
    console.debug("processInvitation", title, label, room, id, reason, webinar);

    if ((!autoaccept || autoaccept != "true") && !pade.questions[label])
    {
        startTone("Diggztone_Vibe");

        notifyText(title + " - " + reason, label, label, [{title: "Accept", iconUrl: chrome.runtime.getURL("check-solid.svg")}, {title: "Hangup", iconUrl: chrome.runtime.getURL("times-solid.svg")}], function(notificationId, buttonIndex)
        {
            console.debug("handleAction callback", notificationId, buttonIndex);

            if (buttonIndex == 0)   // accept
            {
                stopTone();
                openVideoWindow(room, webinar ? "attendee" : null);
            }
            else

            if (buttonIndex == 1)   // reject
            {
                stopTone();
            }

        }, room);

        pade.activeRoom = {title: title, label: label, room: room, id: id};

    } else {
        openVideoWindow(room, webinar ? "attendee" : null);
    }
}


function doNotification(body, label, offerer, callback)
{
    console.debug("doNotification", body, label, offerer)

    notifyText(body, label, offerer, [{title: "View", iconUrl: chrome.runtime.getURL("check-solid.svg")}, {title: "Ignore", iconUrl: chrome.runtime.getURL("times-solid.svg")}], function(notificationId, buttonIndex)
    {
        if (buttonIndex == 0)   // accept
        {
            callback()
        }
    }, offerer);
}

function i18n(str)
{
    return chrome.i18n.getMessage(str) || str;
};

function updateWindowCoordinates(win, winId, coordinates)
{
    var savedWin = getSetting(win, null);

    console.debug("updateWindowCoordinates", win, savedWin, coordinates);

    if (getSetting("saveWinPositions") && savedWin && savedWin.height && savedWin.width && savedWin.top && savedWin.left)
    {
        // checks for corrupt or bad data

        if (savedWin.height < 250 || savedWin.height > screen.availHeight) savedWin.height = screen.availHeight - 50;
        if (savedWin.width < 250 || savedWin.width > screen.availWidth) savedWin.width = screen.availWidth - 50;

        if (savedWin.top < -screen.availHeight || savedWin.top > screen.availHeight) savedWin.top = screen.availTop;
        if (savedWin.left < -screen.availWidth || savedWin.left > screen.availWidth) savedWin.left = screen.availLeft;

        chrome.windows.update(winId, savedWin);
    } else
        chrome.windows.update(winId, coordinates);
}

function doExtensionPage(url)
{
    const tabUrl = chrome.runtime.getURL(url);

    if (chrome.tabs && chrome.tabs.query)
    {
        chrome.tabs.query({}, function(tabs)
        {
            if (tabs)
            {
                var tab = tabs.filter(function(t) { return t.url === tabUrl; });

                if (tab.length)
                {
                    chrome.tabs.update(tab[0].id, {highlighted: true, active: true});

                } else{
                    window.open(tabUrl, btoa(url));
                }
            }
        });
    }
    else {
        window.open(tabUrl, btoa(url));
    }
}

function startConverse()
{
    document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " - " + chrome.runtime.getManifest().version;

    setBadge("off", "#ff0000", "Disconnected");

    if (getSetting("server") && getSetting("domain") && ((!getSetting("useAnonymous", false) && !getSetting("useBasicAuth", false) && getSetting("password")) || getSetting("useCredsMgrApi", false) || (getSetting("useAnonymous", false) || getSetting("useBasicAuth", false))))
    {
        pade.server = getSetting("server");
        pade.domain = getSetting("domain");
        pade.username = getSetting("username");
        pade.password = getSetting("password");
        pade.displayName = getSetting("displayname", pade.username);
        pade.avatar = getSetting("avatar", createAvatar(pade.username));

        pade.ofmeetUrl = getSetting("ofmeetUrl", null);
        if (!pade.ofmeetUrl) pade.ofmeetUrl = "https://" + pade.server + "/ofmeet/";

        checkForChatAPI();

        var doBasicAuth = function()
        {
            if (getSetting("useBasicAuth", false))
            {
                fetch("https://" + pade.server + "/dashboard/token.jsp", {method: "GET"}).then(function(response){ return response.json()}).then(function(token)
                {
                    pade.username = token.username;
                    pade.password = token.password;
                    initConverse();

                }).catch(function (err) {
                    console.error('access denied error', err);
                    initConverse();
                });
            }
            else {
                initConverse();
            }
        }

        if (getSetting("useCredsMgrApi", false))
        {
            getCredentials(function(credential)
            {
                if (credential)
                {
                    pade.username = credential.id;
                    pade.password = credential.password;
                    initConverse();
                }
                else {
                    doBasicAuth();
                }
            });
        }
        else {
            doBasicAuth();
        }
    }
    else {
        doExtensionPage("options/index.html");
    }
}

function initConverse()
{
    console.debug("initConverse", pade);

    initStrophe();

    window.converse_disable_effects = true;

    converse.plugins.add("background", {
        dependencies: [],

        initialize: function () {
            _converse = this._converse;
            console.log("background plugin is initializing..", _converse);
        },

        overrides: {
            onConnected: function ()
            {
                console.log("background plugin is connected", _converse.connection);
                _converse.__super__.onConnected.apply(this, arguments);

                _converse.api.listen.on('disconnected', function() {
                    setBadge("wait..", '#ff0000', "Disconnected");
                });

                const idleTimeout = getSetting("idleTimeout", 300);
                if (idleTimeout > 0) chrome.idle.setDetectionInterval(idleTimeout);

                addHandlers();

                fetchContacts(function(contact)
                {
                    handleContact(contact);
                });

                updateVCard();
                runMeetingPlanner();
                publishUserLocation();
                setupUserPayment();

                if (chrome.pade)    // browser mode
                {
                    if (pade.username && pade.password)
                    {
                        setCredentials({id: pade.username, password: pade.password});
                        webpush.registerServiceWorker(pade.server, pade.username, pade.password);
                    }
                }

                setBadge("", '#ff0000', "Connected");
                if (getSetting("converseAutoReOpen", true)) reopenConverse();
                pade.isReady = true;
                console.log("background plugin is ready", _converse);
            }
        }
    });

    const anonUser = getSetting("useAnonymous", false);

    let autoJoinRooms = undefined;
    let autoJoinPrivateChats = undefined;
    let tempRooms = getSetting("autoJoinRooms", "").split("\n");
    let tempJids = getSetting("autoJoinPrivateChats", "").split("\n");

    if (tempRooms.length > 0)
    {
        autoJoinRooms = [];

        for (var i=0; i<tempRooms.length; i++)
        {
            if (tempRooms[i])
            {
                autoJoinRooms.push({jid: tempRooms[i].indexOf("@") == -1 ? tempRooms[i].trim() + "@conference." + pade.domain : tempRooms[i], nick: pade.displayName});
            }
        }
    }

    if (tempJids.length > 0)
    {
        autoJoinPrivateChats = [];

        for (var i=0; i<tempJids.length; i++)
        {
            if (tempJids[i]) autoJoinPrivateChats.push(tempJids[i].indexOf("@") == -1 ? tempJids[i].trim() + "@" + pade.domain : tempJids[i].trim());
        }
    }

    let connUrl = undefined;

    if (getSetting("useWebsocket", false))
    {
        connUrl = "wss://" + pade.server + "/ws/";
    }

    let whitelistedPlugins = ["background", "search", "directory", "invite", "webmeet", "pade", "vmsg", "payments", "gateway"];

    if (getSetting("enableInfoPanel", false))
    {
        whitelistedPlugins.push("info");
    }

    if (getSetting("useMarkdown", true))
    {
        whitelistedPlugins.push("markdown");
    }

    if (getSetting("enableSignalWire", false))
    {
        whitelistedPlugins.push("signalwire");
    }

    if (getSetting("enableCannedResponses", false))
    {
        whitelistedPlugins.push("canned");
    }

    if (getSetting("enableAudioConfs", false))
    {
        whitelistedPlugins.push("audioconf");
    }

    var config =
    {
      allow_bookmarks: true,
      allow_chat_pending_contacts: true,
      allow_non_roster_messaging: getSetting("allowNonRosterMessaging", true),
      allow_public_bookmarks: true,
      allow_logout: false,
      allow_muc_invitations: true,
      archived_messages_page_size: getSetting("archivedMessagesPageSize", 51),
      authentication: anonUser ? "anonymous" : "login",
      auto_join_rooms: autoJoinRooms,
      auto_join_private_chats: autoJoinPrivateChats,
      auto_away: 0,
      auto_xa: 0,
      auto_list_rooms: getSetting("autoListRooms", true),
      auto_login: pade.username != null || anonUser,
      auto_reconnect: getSetting("autoReconnectConverse", true),
      auto_subscribe: getSetting("autoSubscribe", false),
      auto_join_on_invite: getSetting("autoJoinOnInvite", false),
      bosh_service_url: "https://" + pade.server + "/http-bind/",
      debug: getSetting("converseDebug", false),
      default_domain: pade.domain,
      default_state: getSetting("converseOpenState", "online"),
      domain_placeholder: pade.domain,
      fullname: pade.displayName,
      hide_open_bookmarks: true,
      hide_offline_users: getSetting("hideOfflineUsers", false),
      i18n: getSetting("language", "en"),
      jid : anonUser ? pade.domain : pade.username + "@" + pade.domain,
      locked_domain: pade.domain,
      //message_archiving: "always",
      message_carbons: getSetting("messageCarbons", true),
      muc_domain: "conference." + pade.domain,
      muc_history_max_stanzas: getSetting("archivedMessagesPageSize", 51),
      muc_nickname_from_jid: false,
      muc_show_join_leave: getSetting("showGroupChatStatusMessages", true),
      nickname: pade.displayName,
      notify_all_room_messages: getSetting("notifyAllRoomMessages", false),
      notification_icon: 'image.png',
      webmeet_invitation: getSetting("ofmeetInvitation", 'Please join meeting at'),
      webinar_invitation: getSetting("webinarInvite", 'Please join webinar at'),
      password: anonUser ? null : pade.password,
      play_sounds: getSetting("conversePlaySounds", false),
      priority: 0,
      roster_groups: getSetting("rosterGroups", false),
      show_controlbox_by_default: false,
      show_message_load_animation: false,
      show_desktop_notifications: false,
      show_chatstate_notifications: false,
      show_only_online_users: getSetting("converseShowOnlyOnlineUsers", false),
      show_send_button: getSetting("showSendButton", false),
      sounds_path: chrome.runtime.getURL('sounds/'),
      view_mode: 'fullscreen',
      visible_toolbar_buttons: {'emoji': true, 'call': getSetting("enableAudioConfs", false), 'clear': true },
      websocket_url: connUrl,
      theme: 'concord',
      whitelisted_plugins: whitelistedPlugins
    };

    console.log("converse.initialize", config);
    converse.initialize( config );

    __converse.div = document.documentElement;
}

function initStrophe()
{
    converse.env.Strophe.addConnectionPlugin('vCard',
    {
        _connection: null,

        init: function (conn) {
            this._connection = conn;
            converse.env.Strophe.addNamespace('vCard', 'vcard-temp');
            console.log("strophe plugin: vCard enabled");
        },

        get: function(jid, callback, errorback)
        {
            var iq = converse.env.$iq({type: 'get', to: converse.env.Strophe.getBareJidFromJid(jid)}).c('vCard', {xmlns: 'vcard-temp'});

            this._connection.sendIQ(iq, function(response)
            {
                var response = $(response);
                var username = converse.env.Strophe.getNodeFromJid(jid);
                var name = response.find('vCard FN').text();
                var photo = response.find('vCard PHOTO');

                var avatar = "";

                if (photo.find('BINVAL').text() != "" && photo.find('TYPE').text() != "")
                avatar = 'data:' + photo.find('TYPE').text() + ';base64,' + photo.find('BINVAL').text();

                var family = response.find('vCard N FAMILY') ? response.find('vCard N FAMILY').text() : "";
                    var middle = response.find('vCard N MIDDLE') ? response.find('vCard N MIDDLE').text() : "";
                var given = response.find('vCard N GIVEN') ? response.find('vCard N GIVEN').text() : "";

                var nickname = response.find('vCard NICKNAME') ? response.find('vCard NICKNAME').text() : "";

                var email = response.find('vCard EMAIL USERID') ? response.find('vCard EMAIL USERID').text() : "";
                var url = response.find('vCard URL') ? response.find('vCard URL').text() : "";
                var role = response.find('vCard ROLE') ? response.find('vCard ROLE').text() : "";

                var workPhone = "";
                var homePhone = "";
                var workMobile = "";
                var homeMobile = "";

                response.find('vCard TEL').each(function()
                {
                if ($(this).find('VOICE').size() > 0 && $(this).find('WORK').size() > 0)
                    workPhone = $(this).find('NUMBER').text();

                if ($(this).find('VOICE').size() > 0 && $(this).find('HOME').size() > 0)
                    homePhone = $(this).find('NUMBER').text();

                if ($(this).find('CELL').size() > 0 && $(this).find('WORK').size() > 0)
                    workMobile = $(this).find('NUMBER').text();

                if ($(this).find('CELL').size() > 0 && $(this).find('HOME').size() > 0)
                    homeMobile = $(this).find('NUMBER').text();

                });

                var street = "";
                var locality = "";
                var region = "";
                var pcode = "";
                var country = "";

                response.find('vCard ADR').each(function()
                {
                if ($(this).find('WORK').size() > 0)
                {
                    street = $(this).find('STREET').text();
                    locality = $(this).find('LOCALITY').text();
                    region = $(this).find('REGION').text();
                    pcode = $(this).find('PCODE').text();
                    country = $(this).find('CTRY').text();
                }
                });

                var orgName = response.find('vCard ORG ORGNAME') ? response.find('vCard ORG ORGNAME').text() : "";
                var orgUnit = response.find('vCard ORG ORGUNIT') ? response.find('vCard ORG ORGUNIT').text() : "";

                var title = response.find('vCard TITLE') ? response.find('vCard TITLE').text() : "";

                var callbackResponse = {jid: jid, username: username, name: name, avatar: avatar, family: family, given: given, nickname: nickname, middle: middle, email: email, url: url, homePhone: homePhone, workPhone: workPhone, homeMobile: homeMobile, workMobile: workMobile, street: street, locality: locality, region: region, pcode: pcode, country: country, orgName: orgName, orgUnit: orgUnit, title: title, role: role};

                if (callback) callback(callbackResponse);

            }, function(error) {

            if (errorback) errorback(error);
            });
        },

        set: function(user, callback, errorback)
        {
            var avatar = user.avatar.split(";base64,");

            var iq = $iq({to:  this._connection.domain, type: 'set'}).c('vCard', {xmlns: 'vcard-temp'})

            .c("FN").t(user.name).up()
            .c("NICKNAME").t(user.nickname).up()
            .c("URL").t(user.url).up()
            .c("ROLE").t(user.role).up()
            .c("EMAIL").c("INTERNET").up().c("PREF").up().c("USERID").t(user.email).up().up()
            .c("PHOTO").c("TYPE").t(avatar[0].substring(5)).up().c("BINVAL").t(avatar[1]).up().up()
            .c("TEL").c("VOICE").up().c("WORK").up().c("NUMBER").t(user.workPhone).up().up()
            .c("ADR").c("WORK").up().c("STREET").t(user.street).up().c("LOCALITY").t(user.locality).up().c("REGION").t(user.region).up().c("PCODE").t(user.pcode).up().c("CTRY").t(user.country).up().up()

            this._connection.sendIQ(iq, callback, errorback);
        }
    });
}

function closeChatWindow()
{
    if (pade.chatWindow)
    {
        chrome.windows.remove(pade.chatWindow.id);
        pade.chatWindow = null;
    }
}

function openChatWindow(url, update, state)
{
    var data = {url: chrome.runtime.getURL(url), type: "popup"};
    var width = 1300;

    if (url.indexOf("#") > -1) width = 761;    // width of mobile view_mode

    if (state == "minimized" && getSetting("openWinMinimized", false))
    {
        data.state = state;
    }

    if (!pade.chatWindow || update)
    {
        if (update && pade.chatWindow != null) chrome.windows.remove(pade.chatWindow.id);

        chrome.windows.create(data, function (win)
        {
            pade.chatWindow = win;
            updateWindowCoordinates("chatWindow", pade.chatWindow.id, {width: width, height: 900, focused: true});
        });

    } else {
        chrome.windows.update(pade.chatWindow.id, {focused: true});
    }
}

function openOptions()
{
    openWebAppsWindow(chrome.runtime.getURL("options/index.html"), null, 1200, 900);
}

function setupUserPayment()
{
    if (getSetting("enableTransferWise", false) && getSetting("transferWiseKey", null) != null)
    {
        fetch(pade.transferWiseUrl + '/profiles', {headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getSetting("transferWiseKey") },  method: 'GET'}).then(resp => { return resp.json()}).then(function(profile)
        {
            console.log("setupUserPayment", profile);

            if (profile.length > 0)
            {
                pade.transferWiseProfile = profile;
            }

        }).catch(function (err) {
            console.error("setupUserPayment", err);
        });
    }
}

function publishUserLocation()
{
    var showPosition = function (position)
    {
        console.debug("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude, position);

        var stanza = converse.env.$iq({type: 'set'}).c('pubsub', {xmlns: "http://jabber.org/protocol/pubsub"}).c('publish', {node: "http://jabber.org/protocol/geoloc"}).c('item').c('geoloc', {xmlns: "http://jabber.org/protocol/geoloc"}).c("accuracy").t(position.coords.accuracy).up().c("lat").t(position.coords.latitude).up().c("lon").t(position.coords.longitude).up();

        _converse.connection.sendIQ(stanza, function(iq)
        {
            console.debug("User location publish ok");

        }, function(error){
            console.error("showPosition", error);
        });

        _converse.connection.send(converse.env.$pres().c('geoloc', {xmlns: "http://jabber.org/protocol/geoloc"}).c("accuracy").t(position.coords.accuracy).up().c("lat").t(position.coords.latitude).up().c("lon").t(position.coords.longitude).up());
    }

    var showError = function (error) {
        var errorMsg = "";
        switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = "User denied the request for Geolocation."
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = "Location information is unavailable."
          break;
        case error.TIMEOUT:
          errorMsg = "The request to get user location timed out."
          break;
        case error.UNKNOWN_ERROR:
          errorMsg = "An unknown error occurred."
          break;
        }
      console.error("Location - " + errorMsg, error);
    }

    if (getSetting("publishLocation", false))
    {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    }
}
function removeSetting(name)
{
    localStorage.removeItem("store.settings." + name);
}

function setSetting(name, value)
{
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

function getSetting(name, defaultValue)
{
    var value = defaultValue;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);

        if (name == "password") value = getPassword(value);
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

function reloadApp()
{
    chrome.runtime.reload();
}

function getConnection(connUrl)
{
    return new converse.env.Strophe.Connection(connUrl);
}

function handleRightClick(info)
{
    console.debug("handleRightClick", info);

    if (info.menuItemId == "pade_selection_reply")      replyInverseChat(info.selectionText);
    if (info.menuItemId == "pade_selection_chat")       openInverseChatWindow(info.selectionText);
    if (info.menuItemId == "pade_selection_chatroom")   openInverseGroupChatWindow(info.selectionText);
    if (info.menuItemId == "pade_selection_meet")       openVideoWindow(info.selectionText);
}

function replyInverseChat(text)
{
    var box = getSelectedChatBox();

    console.debug("replyInverseChat", text, box);

    if (box)
    {
        var textArea = box.el.querySelector('.chat-textarea');
        if (textArea) textArea.value = ">" + text + "\n\n";
    }
}

function reopenConverse()
{
    if (getSetting("converseAutoStart", false) && !pade.chatWindow) openChatWindow("converse.html", null, "minimized");
}

function focusChatWindow()
{
    if (!pade.chatWindow)
    {
        openChatWindow("converse.html");
    }
    else {
        chrome.windows.update(pade.chatWindow.id, {focused: true});
    }
}

function openInverseChatWindow(jid)
{
    if (jid.indexOf("@") == -1) jid = jid + "@" + pade.domain;
    openChat(jid);
}

function openInverseGroupChatWindow(jid, message, nickname, userJid)
{
    if (jid.indexOf("@") == -1) jid = jid + "@conference." + pade.domain;
    var room = converse.env.Strophe.getNodeFromJid(jid);
    openGroupChat(jid, room, pade.displayName, null, message, nickname, userJid);
}

function openChat(from, name)
{
    if (!name)
    {
        name = from.split("@")[0];
        if (name.indexOf("sms-") == 0) name = name.substring(4);
    }

    var contact = _converse.roster.findWhere({'jid': from});
    if (!contact) _converse.roster.addAndSubscribe(from, name);
    _converse.api.chats.open(from);
    focusChatWindow();
}

function openChatPanel(from)
{
    _converse.api.chats.open(from);
    focusChatWindow();
}

function getChatPanel(from)
{
    return _converse.api.chats.get(from);
}

function getSelectedChatBox()
{
    var views = _converse.chatboxviews.model.models;
    var view = null;

    console.debug("getSelectedChatBox", views);

    for (var i=0; i<views.length; i++)
    {
        if ((views[i].get('type') === "chatroom" || views[i].get('type') === "chatbox") && !views[i].get('hidden'))
        {
            view = _converse.chatboxviews.views[views[i].id];
            break;
        }
    }
    return view;
}

function openGroupChat(jid, label, nick, props)
{
    console.debug("openGroupChat", jid, label, nick, props);

    if (!props) props = {name: label, nick: nick};

    _converse.api.rooms.open(jid, props);

    if (props.question)
    {
        setTimeout(function()
        {
            _converse.connection.send(inverse.env.$msg({
                to: jid,
                from: _converse.connection.jid,
                type: "groupchat"
            }).c("subject", {
                xmlns: "jabber:client"
            }).t(props.question).tree());

        }, 1000);
    }

    focusChatWindow();
}

function handleActiveConversations()
{
    var roomDiv = __converse.div.querySelector("#chatrooms");
    var chatDiv = __converse.div.querySelector("#converse-roster");
    var activeDiv = __converse.div.querySelector("#active-conversations");
    var display = roomDiv.style.display;

    console.debug("handleActiveConversations", display, activeDiv);


    if (display != "none")
    {
        roomDiv.style.display = "none";
        if (chatDiv) chatDiv.style.display = "none";

        if (!activeDiv)
        {
            activeDiv = document.createElement("div");
            activeDiv.id = "active-conversations";
            activeDiv.classList.add("controlbox-section");
            roomDiv.parentElement.appendChild(activeDiv);
        }

        var compare = function ( x, y )
        {
            const one = x.get("name");
            const two = y.get("name");
            const a = one ? one.toLowerCase() : "";
            const b = two ? two.toLowerCase() : "";

            if ( a < b ) return -1;
            if ( a > b ) return 1;
            return 0;
        }

        _converse.chatboxes.models.sort(compare).forEach(function (chatbox)
        {
            addActiveConversation(chatbox, activeDiv);
        });

    } else {
        roomDiv.style.display = "";
        if (chatDiv) chatDiv.style.display = "";
        if (activeDiv) roomDiv.parentElement.removeChild(activeDiv);
    }
}

function removeActiveConversation(chatbox, activeDiv)
{
    console.debug("removeActiveConversation", chatbox);

    if (chatbox && activeDiv)
    {
        const openButton = __converse.div.parentNode.getElementById("pade-active-" + chatbox.model.get('box_id'));

        if (openButton)
        {
            activeDiv.removeChild(openButton.parentElement);
        }
    }
}

function addActiveConversation(chatbox, activeDiv, newMessage)
{
    if (chatbox.vcard)
    {
        console.debug("addActiveConversation", chatbox);

        if (!newMessage) newMessage = "";

        const status = chatbox.get("status") ? chatbox.get("status") : "";
        const chatType = chatbox.get("type") == "chatbox" ? "chat" : "groupchat";
        const numUnread = chatType == "chat" ? chatbox.get("num_unread") : chatbox.get("num_unread_general");
        const id = chatbox.get('box_id');
        const jid = chatbox.get('jid');

        const msg_content = document.createElement("div");
        msg_content.classList.add("pade-active-panel");

        let display_name = chatbox.getDisplayName();
        if (!display_name || display_name.trim() == "") display_name = jid;

        let dataUri = "data:" + chatbox.vcard.attributes.image_type + ";base64," + chatbox.vcard.attributes.image;

        if (_converse.DEFAULT_IMAGE == chatbox.vcard.attributes.image && getSetting("converseRosterIcons"))
        {
            dataUri = createAvatar(display_name);
        }
        else {
            setAvatar(display_name, dataUri);
        }

        msg_content.innerHTML = '<span id="pade-badge-' + id + '" class="pade-badge" data-badge="' + numUnread + '"><img class="avatar" src="' + dataUri + '" style="width: 36px; width: 36px; height: 100%; margin-right: 10px;"/></span><span title="' + newMessage + '" data-label="' + display_name + '" data-jid="' + jid + '" data-type="' + chatType + '" id="pade-active-' + id +'" class="pade-active-conv">' + display_name + '</span><a href="#" id="pade-active-conv-close-' + id +'" data-jid="' + jid + '" class="pade-active-conv-close fas fa-window-close"></a>';
        activeDiv.appendChild(msg_content);

        const openButton = __converse.div.parentNode.getElementById("pade-active-" + id);
        const openBadge = __converse.div.parentNode.getElementById("pade-badge-" + id);

        if (openButton)
        {
            openButton.addEventListener('click', function(evt)
            {
                evt.stopPropagation();

                let jid = evt.target.getAttribute("data-jid");
                let type = evt.target.getAttribute("data-type");
                let label = evt.target.getAttribute("data-label");

                if (jid)
                {
                    if (type == "chat") _converse.api.chats.open(jid);
                    else
                    if (type == "groupchat") _converse.api.rooms.open(jid);
                }

                _converse.chatboxes.each(function (chatbox)
                {
                    const itemId = chatbox.get('box_id');
                    const itemLabel = __converse.div.parentNode.getElementById("pade-active-" + itemId);
                    if (itemLabel) itemLabel.style.fontWeight = "normal";
                });

                this.innerHTML = label;
                this.style.fontWeight = "bold";

                if (openBadge) openBadge.setAttribute("data-badge", "0");

            }, false);
        }

        const closeButton = __converse.div.parentNode.getElementById("pade-active-conv-close-" + id);

        if (closeButton)
        {
            closeButton.addEventListener('click', function(evt)
            {
                evt.stopPropagation();

                const jid = evt.target.getAttribute("data-jid");
                const view = _converse.chatboxviews.get(jid);

                if (view) view.close();

            }, false);
        }
    }
}

function setAvatar(nickname, avatar)
{
    if (nickname && !avatars[nickname])
    {
        nickname = nickname.toLowerCase();
        avatars[nickname] = avatar;

        chrome.storage.local.set({avatars: avatars}, function() {
          //console.debug('chrome.storage is set for ' + nickname, avatars);
        });
    }
}

function createAvatar(nickname, width, height, font)
{
    if (!nickname) nickname = "Anonymous";
    nickname = nickname.toLowerCase();

    if (avatars[nickname])
    {
        return avatars[nickname];
    }

    if (getSetting("converseRandomAvatars", false))
    {
        return "https://" + getSetting("server") + "/randomavatar/" + nickname
    }

    if (!width) width = 32;
    if (!height) height = 32;
    if (!font) font = "16px Arial";

    var canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    var context = canvas.getContext('2d');
    context.fillStyle = getRandomColor(nickname);
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = font;
    context.fillStyle = "#fff";

    var first, last, pos = nickname.indexOf("@");
    if (pos > 0) nickname = nickname.substring(0, pos);

    var name = nickname.split(" ");
    if (name.length == 1) name = nickname.split(".");
    if (name.length == 1) name = nickname.split("-");
    var l = name.length - 1;

    if (name && name[0] && name.first != '')
    {
        first = name[0][0];
        last = name[l] && name[l] != '' && l > 0 ? name[l][0] : null;

        if (last) {
            var initials = first + last;
            context.fillText(initials.toUpperCase(), 3, 23);
        } else {
            var initials = first;
            context.fillText(initials.toUpperCase(), 10, 23);
        }
        var data = canvas.toDataURL();
        document.body.removeChild(canvas);
    }

    return canvas.toDataURL();
}

function getVCard(jid, callback, errorback)
{
    jid = jid.trim();

    if (pade.vcards[jid])
    {
       if (callback) callback(pade.vcards[jid]);

    }
    else

    if (_converse.connection)
    {
        _converse.connection.vCard.get(jid, function(vCard)
        {
            pade.vcards[jid] = vCard;
            if (callback) callback(vCard);

        }, function(error) {
            if (errorback) errorback(error);
            console.error(error);
        });

    } else errorback();
}

function setVCard(vCard, callback, errorback)
{
    _converse.connection.vCard.set(vCard, function(resp)
    {
        if (callback) callback(resp);

    }, function(error) {
        if (errorback) errorback(error);
        console.error(error);
    });
}

function updateVCard()
{
    console.debug("updateVCard");

    var jid = getSetting("username") + "@" + getSetting("domain");

    getVCard(jid, function(vCard)
    {
        avatar = vCard.avatar;

        if (!avatar || avatar == "")
        {
            avatar = createAvatar(getSetting("displayname"));

            if (getSetting("updateAvatar", false))
            {
                updateVCardAvatar(jid, avatar)
            }

            setSetting("avatar", avatar);
        }

    }, function(error) {
        avatar = createAvatar(getSetting("displayname"));
        setSetting("avatar", avatar);

        if (getSetting("updateAvatar", false))
        {
            updateVCardAvatar(jid, avatar)
        }
    });
}

function updateVCardAvatar(jid, avatar)
{
    console.debug("updateVCardAvatar", avatar);

    var email = getSetting("email", "");
    var phone = getSetting("phone", "");
    var country = getSetting("country", "");
    var url = getSetting("url", "");
    var role = getSetting("role", (getSetting("useUport", false) ? "uport," : "") + chrome.i18n.getMessage('manifest_shortExtensionName'));

    var avatarError = function (error)
    {
        console.error("uploadAvatar - error", error);
    }

    getVCard(jid, function(vCard)
    {
        vCard.name = getSetting("displayname");
        vCard.nickname = getSetting("displayname");
        vCard.email = email;
        vCard.workPhone = phone;
        vCard.country = country;
        vCard.role = role;
        vCard.url = url;

        var sourceImage = new Image();

        sourceImage.onload = function() {
            var canvas = document.createElement("canvas");
            canvas.width = 32;
            canvas.height = 32;
            canvas.getContext("2d").drawImage(sourceImage, 0, 0, 32, 32);

            vCard.avatar = canvas.toDataURL();

            setVCard(vCard, function(resp)
            {
                console.debug("uploadAvatar - set vcard", resp);

            }, avatarError);
        }

        sourceImage.src = avatar;

    }, avatarError);
}

function getRandomColor(nickname)
{
    if (nickColors[nickname])
    {
        return nickColors[nickname];
    }
    else {
        var letters = '0123456789ABCDEF';
        var color = '#';

        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        nickColors[nickname] = color;
        return color;
    }
}

function __newElement(el, id, html, className)
{
    var ele = document.createElement(el);
    if (id) ele.id = id;
    if (html) ele.innerHTML = html;
    if (className) ele.classList.add(className);
    document.body.appendChild(ele);
    return ele;
}

function addToolbarItem(view, id, label, html)
{
    if (getSetting("showToolbarIcons", true) || label == "webmeet-scrolldown-" + id || label == "webmeet-trash-" + id || label == "webmeet-refresh-" + id || label == "webmeet-notepad-" + id)
    {
        var placeHolder = view.el.querySelector('#place-holder');

        if (!placeHolder)
        {
            var smiley = view.el.querySelector('.toggle-smiley.dropup');
            smiley.insertAdjacentElement('afterEnd', __newElement('li', 'place-holder'));
            placeHolder = view.el.querySelector('#place-holder');
        }
        placeHolder.insertAdjacentElement('afterEnd', __newElement('li', label, html));
    }
}

function closeWebAppsWindow(window)
{
    if (pade.webAppsWindow[window] != null)
    {
        chrome.windows.remove(pade.webAppsWindow[window].id);
        delete pade.webAppsWindow[window];
    }
}

function openWebAppsWindow(url, state, width, height)
{
    if (!width) width = 1024;
    if (!height) height = 768;

    if (url.startsWith("_")) url = url.substring(1);
    var httpUrl = url.trim();
    var data = {url: httpUrl, type: "popup"};

    console.debug("openWebAppsWindow", data, state, width, height);

    if (state == "minimized" && getSetting("openWinMinimized", false))
    {
        data.state = state;
    }

    if (pade.webAppsWindow[url] == null)
    {
        chrome.windows.create(data, function (win)
        {
            pade.webAppsWindow[url] = win;
            updateWindowCoordinates(url, pade.webAppsWindow[url].id, {width: width, height: height, focused: true});
        });

    } else {
        chrome.windows.update(pade.webAppsWindow[url].id, {focused: true});
    }
}

function closeVideoWindow()
{
    if (pade.videoWindow != null)
    {
        try {
            chrome.windows.remove(pade.videoWindow.id);
        } catch (e) {}
    }
}


function openVideoWindow(room, mode)
{
    var url = getVideoWindowUrl(room, mode);
    openVideoWindowUrl(url);
}

function getVideoWindowUrl(room, mode)
{
    var url = chrome.runtime.getURL("jitsi-meet/chrome.index.html");
    if (room) url = url + "?room=" + room + (mode ? "&mode=" + mode : "");
    return url;
}

function openVideoWindowUrl(url)
{
    console.debug("openVideoWindowUrl", url);

    if (pade.videoWindow != null)
    {
        chrome.windows.remove(pade.videoWindow.id);
    }

    chrome.windows.create({url: url, type: "popup"}, function (win)
    {
        pade.videoWindow = win;
        updateWindowCoordinates("videoWindow", pade.videoWindow.id, {width: 1024, height: 800, focused: true});
    });
}

function notifyText(message, title, jid, buttons, callback, notifyId)
{
    console.debug("notifyText", title, message, jid, buttons, notifyId);

    if (pade.busy) return;  // no notifications when I am busy

    var opt = {
      type: "basic",
      title: title,
      iconUrl: chrome.runtime.getURL("image.png"),
      message: message,
      buttons: buttons,
      contextMessage: chrome.i18n.getMessage('manifest_extensionName'),
      requireInteraction: !!buttons && !!callback
    };

    if (BrowserDetect.browser == "Firefox")
    {
        delete opt.buttons;
        delete opt.requireInteraction;
    }

    if (!notifyId) notifyId = Math.random().toString(36).substr(2,9);

    var doNotify = function()
    {
        chrome.notifications.create(notifyId, opt, function(notificationId)
        {
            if (callback) callbacks[notificationId] = callback;
        });
    }

    if (avatars[jid])
    {
        opt.iconUrl = avatars[jid];
        doNotify();
    }
    else

    if (jid && jid.indexOf("@" > -1) && jid.indexOf("@conference." == -1))
    {
        getVCard(jid, function(vCard)
        {
            console.debug("notifyText vcard", vCard);

            if (vCard.avatar) opt.iconUrl = vCard.avatar;
            doNotify();

        }, doNotify);
    }
    else doNotify();
}

function notifyImage(message, title, imageUrl, buttons, callback)
{
    if (pade.busy) return;  // no notifications when I am busy

    var opt = {
      type: "image",
      title: title,
      iconUrl: chrome.runtime.getURL("image.png"),

      message: message,
      buttons: buttons,
      contextMessage: chrome.i18n.getMessage('manifest_extensionName'),
      imageUrl: imageUrl
    };

    if (BrowserDetect.browser == "Firefox")
    {
        delete opt.buttons;
    }

    var id = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(id, opt, function(notificationId)
    {
        if (callback) callbacks[notificationId] = callback;
    });
}

function notifyProgress(message, title, progress, buttons, callback)
{
    if (pade.busy) return;  // no notifications when I am busy

    var opt = {
      type: "progress",
      title: title,
      iconUrl: chrome.runtime.getURL("image.png"),

      message: message,
      buttons: buttons,
      contextMessage: chrome.i18n.getMessage('manifest_extensionName'),
      progress: progress
    };

    if (BrowserDetect.browser == "Firefox")
    {
        delete opt.buttons;
    }

    var id = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(id, opt, function(notificationId)
    {
        if (callback) callbacks[notificationId] = callback;
    });
}


function notifyList(message, title, items, buttons, callback, notifyId)
{
    if (pade.busy) return;  // no notifications when I am busy

    var opt = {
      type: "list",
      title: title,
      iconUrl: chrome.runtime.getURL("image.png"),

      message: message,
      buttons: buttons,
      contextMessage: chrome.i18n.getMessage('manifest_extensionName'),
      items: items,
      requireInteraction: !!buttons && !!callback
    };

    if (BrowserDetect.browser == "Firefox")
    {
        delete opt.buttons;
        delete opt.requireInteraction;
    }

    if (!notifyId) notifyId = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(notifyId, opt, function(notificationId){
        if (callback) callbacks[notificationId] = callback;
    });
}

function changePassword(callback, errorback)
{
    var newPass = JSON.parse(window.localStorage["store.settings.password"]);

    _converse.connection.sendIQ(converse.env.$iq({type: 'set', to: _converse.connection.domain}).c('query', {xmlns: "jabber:iq:register"}).c('username').t(getSetting("password")).up().c('password').t(newPass).tree(), function(status)
    {
        console.debug("changePassword", status);
        if (callback) callback(status);

    }, function (error) {
        console.error("changePassword", error);
        if (errorback) errorback(error);
    });
}

function findUsers(search, callback)
{
    var url =  "https://" + getSetting("server") + "/rest/api/restapi/v1/meet/profile/" + search;
    var options = {method: "GET", headers: {"authorization": "Basic " + btoa(getSetting("username") + ":" + getSetting("password")), "accept": "application/json"}};

    console.debug("findUsers", url, options);

    fetch(url, options).then(function(response){ return response.json()}).then(function(userList)
    {
        console.debug("findUsers ok", userList);

        // cache user profiles

        for (var i=0; i < userList.length; i++ )
        {
            pade.userProfiles[userList[i].jid] = userList[i];
        }

        if (callback) callback(userList);

    }).catch(function (err) {           // no chat api, use XMMP search
        findUsers2(search, callback)
    });
}

function findUsers2(search, callback)
{
    console.debug('findUsers2', search);

    var iq = converse.env.$iq({type: 'set', to: "search." + _converse.connection.domain}).c('query', {xmlns: 'jabber:iq:search'}).c('x').t(search).up().c('email').t(search).up().c('nick').t(search);

    _converse.connection.sendIQ(iq, function(response)
    {
        var users = [];

        $(response).find('item').each(function()
        {
            var current = $(this);
            var jid = current.attr('jid');
            var username = converse.env.Strophe.getNodeFromJid(jid);
            var name = current.find('nick').text();
            var email = current.find('email').text();

            console.debug('findUsers2 response', username, name, email, jid);
            users.push({username: username, name: name, email: email, jid: jid});
        });

        if (callback) callback(users);

    }, function (error) {
        console.error('findUsers2', error);
    });
};

function addHandlers()
{
    console.debug('addHandlers');

    _converse.connection.addHandler(function(iq)
    {
        console.debug('fastpath handler', iq);

        var iq = converse.env.$(iq);
        var workgroupJid = iq.attr('from');

        _converse.connection.send($iq({type: 'result', to: iq.attr('from'), id: iq.attr('id')}));

        iq.find('offer').each(function()
        {
            var id = $(this).attr('id');
            var jid = $(this).attr('jid').toLowerCase();
            var properties = {id: id, jid: jid, workgroupJid: workgroupJid};

            iq.find('value').each(function()
            {
                var name = $(this).attr('name');
                var value = $(this).text();
                properties[name] = value;
            });

            console.debug("fastpath handler offer", properties, workgroupJid);

            acceptRejectOffer(properties);
        });

        iq.find('offer-revoke').each(function()
        {
            id = $(this).attr('id');
            jid = $(this).attr('jid').toLowerCase();

            console.debug("fastpath handler offer-revoke", workgroupJid);
        });

        return true;

    }, "http://jabber.org/protocol/workgroup", 'iq', 'set');

    _converse.connection.addHandler(function(presence)
    {
        var to = $(presence).attr('to');
        var type = $(presence).attr('type');
        var from = converse.env.Strophe.getBareJidFromJid($(presence).attr('from'));
        var statusMsg = null;
        var pres = "online";

        if (type) pres = type;
        if (!pade.presence[from]) pade.presence[from] = {};

        var contact = pade.participants[from];

        console.debug("presence tracker", pres, from, to, type, contact, pade.presence[from], presence);

        $(presence).find('show').each(function()
        {
            pres = $(this).text();

            if (pade.isReady && pade.presence[from] && pade.presence[from].show != "online" && pres == "online" && getSetting("enablePresenceTracking", false) && contact)
            {
                var whiteList = getSetting("presNotifyWhitelist", null);
                var validToSend = !!contact.name && (!whiteList || whiteList.indexOf(from) > -1);

                if (validToSend) notifyText(contact.name, "Contact Tracker", from, [], null, from);
            }

            pade.presence[from].show = pres;
        });

        $(presence).find('status').each(function()
        {
            statusMsg = $(this).text();

            if (pade.isReady && pade.presence[from] && pade.presence[from].status != statusMsg && getSetting("enablePresenceStatus", false) && contact)
            {
                var whiteList = getSetting("presNotifyWhitelist", null);
                var validToSend = !!contact.name && (!whiteList || whiteList.indexOf(from) > -1);

                if (validToSend) notifyText($(this).text(), contact.name + " " + from, from, [], null, from);
            }

            pade.presence[from].status = statusMsg;
        });

        if (contact && contact.type == "conversation" && getSetting("enableInverse", false) == false)
        {
            contact.created = false;
            contact.presence = pres;

            if (showUser(contact))
            {
                contact.created = true;
            }
         }

        if ($(presence).find('agent-status').length > 0 || $(presence).find('notify-queue-details').length > 0 || $(presence).find('notify-queue').length > 0)
        {
            var from = $(presence).attr('from');
            var maxChats;

            $(presence).find('agent-status').each(function()
            {
                var free = true;

                var workGroup = converse.env.Strophe.getNodeFromJid($(this).attr('jid'));
                if (!pade.fastpath[workGroup]) pade.fastpath[workGroup] = {conversations: {}};

                $(presence).find('max-chats').each(function()
                {
                    pade.fastpath[workGroup].maxChats = $(this).text();
                });

                var agent = converse.env.Strophe.getNodeFromJid(from);
                if (!pade.fastpath[workGroup].conversations[agent]) pade.fastpath[workGroup].conversations[agent] = {};

                pade.fastpath[workGroup].conversations[agent].agent = agent;

                $(presence).find('show').each(function()
                {
                    pade.fastpath[workGroup].conversations[agent].show = $(this).text();
                });

                $(presence).find('chat').each(function()
                {
                    free = false;

                    pade.fastpath[workGroup].conversations[agent].sessionID = $(this).attr('sessionID');
                    pade.fastpath[workGroup].conversations[agent].sessionJid = pade.fastpath[workGroup].conversations[agent].sessionID + "@conference." + _converse.connection.domain;

                    pade.fastpath[workGroup].conversations[agent].userID = converse.env.Strophe.getNodeFromJid($(this).attr('userID'));
                    pade.fastpath[workGroup].conversations[agent].startTime = $(this).attr('startTime');
                    pade.fastpath[workGroup].conversations[agent].question = $(this).attr('question');
                    pade.fastpath[workGroup].conversations[agent].username = $(this).attr('username');
                    pade.fastpath[workGroup].conversations[agent].email = $(this).attr('email');

                    var text = pade.fastpath[workGroup].conversations[agent].userID + " talking with " + pade.fastpath[workGroup].conversations[agent].username + " about " + pade.fastpath[workGroup].conversations[agent].question;

                    console.debug('agent-status message', pade.fastpath[workGroup].conversations[agent]);

                    notifyText(workGroup, text, null, [{title: "Join", iconUrl: chrome.runtime.getURL("check-solid.svg")},{title: "Reject", iconUrl: chrome.runtime.getURL("times-solid.svg")}], function(notificationId, buttonIndex)
                    {
                        if (buttonIndex == 0)
                        {
                            openInverseGroupChatWindow(pade.fastpath[workGroup].conversations[agent].sessionJid);
                        }
                    }, workGroup);
                });

                console.debug("agent-status", workGroup, agent, pade.fastpath[workGroup]);

                if (free)
                {
                    console.debug("agent-status delete", workGroup, agent, pade.fastpath[workGroup]);

                    clearNotification(workGroup);
                    delete pade.fastpath[workGroup].conversations[agent];
                }
            });

            $(presence).find('notify-queue-details').each(function()
            {
                var workGroup = converse.env.Strophe.getNodeFromJid(from);
                if (!pade.fastpath[workGroup]) pade.fastpath[workGroup] = {conversations: {}};

                $(presence).find('user').each(function()
                {
                    var jid = $(this).attr('jid');
                    var position, time, joinTime

                    $(this).find('position').each(function()
                    {
                        pade.fastpath[workGroup].position = $(this).text() == "0" ? "first": jQuery(this).text();
                    });

                    $(this).find('time').each(function()
                    {
                        pade.fastpath[workGroup].time = $(this).text();
                    });

                    $(this).find('join-time').each(function()
                    {
                        pade.fastpath[workGroup].joinTime = $(this).text();
                    });

                    if (pade.fastpath[workGroup].position && pade.fastpath[workGroup].time && pade.fastpath[workGroup].joinTime)
                    {
                        var text = "A caller has been waiting for " + pade.fastpath[workGroup].time + " secconds";

                        console.debug('notify-queue-details message  ' + text);

                        if (getSetting("wgNotifications", false))
                        {
                            notifyText(workGroup, text, null, [{title: "Ok", iconUrl: chrome.runtime.getURL("check-solid.svg")}], function(notificationId, buttonIndex){}, workGroup);
                        }
                    }
                });
                console.debug("notify-queue-details", workGroup, pade.fastpath[workGroup]);
            });

            $(presence).find('notify-queue').each(function()
            {
                var workGroup = converse.env.Strophe.getNodeFromJid(from);
                if (!pade.fastpath[workGroup]) pade.fastpath[workGroup] = {conversations: {}};

                var count, oldest, waitTime, status

                $(presence).find('count').each(function()
                {
                    pade.fastpath[workGroup].count = jQuery(this).text();
                });

                $(presence).find('oldest').each(function()
                {
                    pade.fastpath[workGroup].oldest = jQuery(this).text();
                });

                $(presence).find('time').each(function()
                {
                    pade.fastpath[workGroup].waitTime = jQuery(this).text();
                });

                $(presence).find('status').each(function()
                {
                    pade.fastpath[workGroup].status = jQuery(this).text();
                });

                if (pade.fastpath[workGroup].count && pade.fastpath[workGroup].oldest && pade.fastpath[workGroup].waitTime && pade.fastpath[workGroup].status)
                {
                    var text = "There are " + count + " caller(s) waiting for as long as " + waitTime + " seconds";

                    console.debug('notify-queue message ' + text);

                    if (getSetting("wgNotifications", false))
                    {
                        notifyText(workGroup, text, null, [{title: "Ok", iconUrl: chrome.runtime.getURL("check-solid.svg")}], function(notificationId, buttonIndex){}, workGroup);
                    }
                }

                console.debug("notify-queue presence", workGroup, pade.fastpath[workGroup]);
            });
        }

        $(presence).find('geoloc').each(function ()
        {
            var accuracy = this.querySelector('accuracy').innerHTML;
            var lat = this.querySelector('lat').innerHTML;
            var lon = this.querySelector('lon').innerHTML;

            pade.geoloc[from] = {accuracy: accuracy, lat: lat, lon: lon};

            console.debug("Geolocation", from, pade.geoloc[from]);
        });

        $(presence).find('json').each(function ()
        {
            var namespace = $(this).attr("xmlns");

            if (namespace == "urn:xmpp:json:0")
            {
                var json = JSON.parse($(this).text());
                console.debug("json", from, json);
            }

        });

        return true;

    }, null, 'presence');


    _converse.connection.addHandler(function(message)
    {
        var id = $(message).attr("from");
        var from = $(message).attr("from");
        var to = $(message).attr("to");
        var reason = null;
        var password = null;
        var composing = false;
        var offerer = converse.env.Strophe.getBareJidFromJid(from);
        var type = $(message).attr("type");
        var room = null;
        var autoaccept = null;

        console.debug("message handler", from, to, message)

        var encrypted = false;

        $(message).find('encrypted').each(function ()
        {
            encrypted = true;
        });

        $(message).find('geoloc').each(function ()
        {
            var accuracy = this.querySelector('accuracy').innerHTML;
            var lat = this.querySelector('lat').innerHTML;
            var lon = this.querySelector('lon').innerHTML;

            pade.geoloc[offerer] = {accuracy: accuracy, lat: lat, lon: lon};

            console.debug("Geolocation", offerer, pade.geoloc[offerer]);
        });

        if (encrypted) return true; // ignore

        $(message).find('notification').each(function ()
        {
            var namespace = $(this).attr("xmlns");

            if (namespace == "http://igniterealtime.org/ofchat/notification")
            {
                var body = $(this).text();
                var jid = $(this).attr('jid');
                var nickname = $(this).attr('nickname');

                if ((pade.chatWindow && !getChatPanel(from)) || !pade.chatWindow)
                {
                    if (getSetting("notifyWhenClosed", true))
                    {
                        doNotification(body, jid + " " + from, jid, function()
                        {
                            openInverseGroupChatWindow(from, body, nickname, jid);
                        });
                    }
                }
            }
        });

        $(message).find('json').each(function ()
        {
            var namespace = $(this).attr("xmlns");

            if (namespace == "urn:xmpp:json:0")
            {
                var json = JSON.parse($(this).text());
            }
        });

        var history = message.querySelector('forwarded')

        if (history) return true; // ignore historical notifications

        $(message).find('body').each(function ()
        {
            var body = $(this).text();
            var pos0 = body.indexOf("/webinar/")
            var pos1 = body.indexOf("/jitsimeet/index.html?room=")
            var pos2 = body.indexOf("https://" + pade.server);
            var pos3 = body.indexOf(pade.ofmeetUrl);

            console.debug("message handler body", body, offerer, pade.minimised);

            if (!pade.messageCount) pade.messageCount = 0;

            if (!pade.chatWindow)
            {
                pade.messageCount++;
                setBadge(pade.messageCount.toString(), '#0000e1');
            }

            if ( pos0 > -1 && pos2 > -1 )
            {
                reason = pos2 > 0 ? body.substring(0, pos2) : getSetting("webinarInvite", 'Please join webinar at');
                room = body.substring(pos0 + 9);
                handleInvitation({room: room, offerer: offerer, reason: reason, webinar: true});
            }
            else

            if (pos1 > -1 && pos2 > -1 )
            {
                reason = pos2 > 0 ? body.substring(0, pos2) : getSetting("ofmeetInvitation", 'Please join meeting at');
                room = body.substring(pos1 + 27);
                handleInvitation({room: room, offerer: offerer, reason: reason, webinar: false});
            }
            else

            if (pos3 > -1)
            {
                reason = pos3 > 0 ? body.substring(0, pos3) : getSetting("ofmeetInvitation", 'Please join meeting at');
                room = body.substring(pos3 + pade.ofmeetUrl.length);
                handleInvitation({room: room, offerer: offerer, reason: reason, webinar: false});
            }

            else

            if (!pade.chatWindow || getSetting("enableInverse", false) == false)
            {
                doNotification(body, offerer, offerer, function()
                {
                    openChatWindow("converse.html#converse/chat?jid=" + offerer, true);
                });
            }
        });

        $(message).find('x').each(function ()
        {
            var namespace = $(this).attr("xmlns");

            $(message).find('offer').each(function()
            {
                offerer = $(this).attr('jid');
            });

            if (namespace == "jabber:x:conference")
            {
                $(message).find('invite').each(function()
                {
                    offerer = $(this).attr('from');
                });

                id = $(this).attr('jid');
                autoaccept = $(this).attr('autoaccept');
                room = converse.env.Strophe.getNodeFromJid(id);
                reason = $(this).attr('reason');
                password = $(this).attr('password');

                if (!reason)
                {
                    $(message).find('reason').each(function()
                    {
                        reason = $(this).text();
                    });
                }

                if (!password)
                {
                    $(message).find('password').each(function()
                    {
                        password = $(this).text();
                    });
                }

                handleInvitation({room: room, offerer: offerer, autoaccept: autoaccept, id: id, reason: reason, webinar: false});
            }
        });

        $(message).find('ofswitch').each(function ()
        {
            var json = JSON.parse($(this).text());
            console.debug("ofswitch event", json);

            var buttons = [];
            var title = json.direction == "inbound" ? json.destination : json.source;
            var callback0 = function(){};
            var callback1 = function(){};

            var doTelephoneAction = function(action, callId, destination)
            {
                var query = destination && destination != "" ? "?destination=" + destination : "";
                var url =  "https://" + pade.server + "/rest/api/restapi/v1/meet/action/" + action + "/" + callId + query;
                var options = {method: "POST", headers: {"authorization": "Basic " + btoa(pade.username + ":" + pade.password), "accept": "application/json"}};

                console.debug("doTelephoneAction", url, options);

                fetch(url, options).then(function(response)
                {
                    console.debug("doTelephoneAction ok", response);

                }).catch(function (err) {
                    console.error('doTelephoneAction error', err);
                });
            }

            if (json.state == "HANGUP")
            {
                chrome.notifications.clear(json.call_id, function(wasCleared)
                {
                    console.debug("CC Hangup", wasCleared);
                });

                pade.activeCallId = null;
            }
            else {

                if (json.state == "ACTIVE")
                {
                    buttons = [{title: "Transfer", iconUrl: chrome.runtime.getURL("check-solid.svg")}, {title: "Hangup", iconUrl: chrome.runtime.getURL("times-solid.svg")}];

                    callback0 = function()
                    {
                        var currentChat = getSelectedChatBox();
                        var defaultExten = undefined;

                        if (currentChat)
                        {
                            var currentJid = currentChat.model.get("jid");
                            var userprofile = pade.userProfiles[currentJid];
                            if (userprofile) defaultExten = userprofile.caller_id_number;
                        }

                        var destination = prompt("Transfer To:", defaultExten);
                        if (destination) doTelephoneAction("transfer", json.call_id, destination);
                    };

                    callback1 = function()
                    {
                        doTelephoneAction("clear", json.call_id);
                        pade.activeCallId = null;
                    };

                    pade.activeCallId = json.call_id;
                }
                else

                if (json.state == "HELD")
                {
                    buttons = [{title: "Unhold", iconUrl: chrome.runtime.getURL("check-solid.svg")}];

                    callback0 = function()
                    {
                        doTelephoneAction("hold", json.call_id);
                    };
                }

                else

                if (json.state == "RINGING")
                {
                    buttons = [{title: "Reject", iconUrl: chrome.runtime.getURL("times-solid.svg")}];

                    callback0 = function()
                    {
                        doTelephoneAction("clear", json.call_id);
                        pade.activeCallId = null;
                    };
                }

                notifyText(title, "Telephone Call", null, buttons, function(notificationId, buttonIndex)
                {
                    if (buttonIndex == 0) callback0();
                    if (buttonIndex == 1) callback1();

                    if (buttonIndex == -1)
                    {
                        doTelephoneAction("clear", json.call_id);
                        pade.activeCallId = null;
                    }

                }, json.call_id);
            }
        });

        return true;

    }, null, 'message');
}

function fetchContacts(callback)
{
    var urlCount = 0;
    var roomCount = 0;
    var contactCount = 0;
    var workgroupCount = 0;

    _converse.connection.sendIQ(converse.env.$iq({type: "get"}).c("query", {xmlns: "jabber:iq:private"}).c("storage", {xmlns: "storage:bookmarks"}).tree(), function(resp)
    {
        console.debug("get bookmarks", resp)

        $(resp).find('conference').each(function()
        {
            var jid = $(this).attr("jid");
            var room = converse.env.Strophe.getNodeFromJid(jid);
            var muc = converse.env.Strophe.getDomainFromJid(jid);
            var domain = muc.substring("conference.".length);           // ignore "conference."

            console.debug('ofmeet.bookmark.conference.item', {name: $(this).attr("name"), jid: $(this).attr("jid"), autojoin: $(this).attr("autojoin")});

            if (callback) callback(
            {
                id: roomCount++,
                type: "room",
                jid: jid,
                presence: "room",
                name: $(this).attr("name"),
                pinned: $(this).attr("autojoin"),
                open: $(this).attr("autojoin"),
                room: room,
                domain: domain
            });
        })

        $(resp).find('url').each(function()
        {
            console.debug('ofmeet.bookmark.url.item', {name: $(this).attr("name"), url: $(this).attr("url")});

            var ignore = $(this).attr("name") == "Video conferencing web client";

            if (ignore)
            {
                if (!getSetting("ofmeetUrl", null))
                {
                    pade.ofmeetUrl = $(this).attr("url") + "/";
                    setSetting("ofmeetUrl", pade.ofmeetUrl);
                }
            }

            if (callback && !ignore) callback(
            {
                id: urlCount++,
                type: "url",
                url: $(this).attr("url"),
                name: $(this).attr("name")

            });
        });

    }, function (error) {
        console.error(error);
    });

    _converse.connection.sendIQ(converse.env.$iq({type: "get"}).c("query", {xmlns: "jabber:iq:roster"}).tree(), function(resp)
    {
        console.debug("get roster", resp)

        $(resp).find('item').each(function()
        {
            var jid = $(this).attr("jid");
            var node = converse.env.Strophe.getNodeFromJid(jid);
            var name = $(this).attr("name");
            var domain = converse.env.Strophe.getDomainFromJid(jid);

            console.debug('ofmeet.roster.item',jid, name);

            if (callback) callback(
            {
                id: contactCount++,
                type: "conversation",
                name: name,
                room: makeRoomName(node),
                node: node,
                jid: jid,
                presence: pade.presence[jid] ? pade.presence[jid].show : "unavailable",
                open: "false",
                active: false,
                domain: domain
            });

        })


    }, function (error) {
        console.error(error);
    });

    if (getSetting("wgEnabled", false))
    {
        _converse.connection.sendIQ(converse.env.$iq({type: 'get', to: "workgroup." + _converse.connection.domain}).c('workgroups', {jid: _converse.connection.jid, xmlns: "http://jabber.org/protocol/workgroup"}).tree(), function(resp)
        {
            $(resp).find('workgroup').each(function()
            {
                var jid = $(this).attr('jid');
                var name = converse.env.Strophe.getNodeFromJid(jid);
                var room = 'workgroup-' + name + "@conference." + _converse.connection.domain;

                console.debug("get workgroups", room, jid);

                if (callback) callback(
                {
                    id: roomCount++,
                    type: "room",
                    jid: room,
                    presence: "room",
                    name: 'workgroup-' + name,
                    pinned: true,
                    open: true,
                    room: 'workgroup-' + name,
                    domain: _converse.connection.domain
                });

                if (callback) callback(
                {
                    id: workgroupCount++,
                    type: "workgroup",
                    jid: jid,
                    presence: "open",
                    name: name,
                    domain: _converse.connection.domain
                });
            });

        }, function (error) {
            console.warn("Workgroups not available");
        });
    }
}

function handleContact(contact)
{
    console.debug("handleContact", contact);

    if (contact.type == "url" && getSetting("enableCollaboration", false))
    {
        contact.created = true;
        var urlMenu = null;

        if (contact.url.indexOf("/h5p/") > -1)
        {
            urlMenu = {parentId: "pade_h5p", type: "radio", id: contact.url, title: contact.name, contexts: ["browser_action"],  onclick: handleH5pClick};
            if (!pade.activeH5p) pade.activeH5p = contact.url;

        } else {

            if (!pade.collabDocs[contact.url])
            {
                urlMenu = {parentId: "pade_content", type: "radio", id: contact.url, title: contact.name, contexts: ["browser_action"],  onclick: handleUrlClick};
                if (!pade.activeUrl) pade.activeUrl = contact.url; // default
                pade.collabDocs[contact.url] = contact.name;
            }
        }
    }
    else

    if (contact.type == "room")
    {
        if (!pade.activeContact)
        {
            setActiveContact(contact);
        }

        pade.participants[contact.jid] = contact;
        contact.created = true;

    }
    else

    if (contact.type == "conversation")
    {
        if (!pade.activeContact)
        {
            setActiveContact(contact);
        }

        if (showUser(contact))
        {
            pade.participants[contact.jid] = contact;
            contact.created = true;
        }
    }
    else

    if (contact.type == "workgroup")
    {
        if (!pade.activeWorkgroup)
        {
            setActiveWorkgroup(contact);
        }

        pade.participants[contact.jid] = contact;
        contact.created = true;
    }
}

function showUser(contact)
{
    return getSetting("enableInverse", false) || !getSetting("showOnlyOnlineUsers", true) || (getSetting("showOnlyOnlineUsers", true) && contact.presence != "unavailable");
}

function setActiveContact(contact)
{
    pade.activeContact = contact;
}

function setActiveWorkgroup(contact)
{
    if (pade.activeWorkgroup)
    {
        //_converse.connection.send($pres({to: pade.activeWorkgroup.jid, type: "unavailable"}).c("status").t("Online").up().c("priority").t("1"));
    }

    pade.activeWorkgroup = contact;
    setupWorkgroup();
}

function makeRoomName(contact)
{
    if (pade.username <= contact)
    {
        return pade.username + "-" + contact;
    }
    else return contact + "-" + pade.username;
}

function changePassword(callback, errorback)
{
    var newPass = JSON.parse(window.localStorage["store.settings.password"]);

    _converse.connection.sendIQ($iq({type: 'set', to: _converse.connection.domain}).c('query', {xmlns: "jabber:iq:register"}).c('username').t(pade.username).up().c('password').t(newPass).tree(), function(status)
    {
        console.debug("changePassword", status);
        if (callback) callback(status);

    }, function (error) {
        console.error("changePassword", error);
        if (errorback) errorback(error);
    });
}
function fetchTasks()
{
    _converse.connection.sendIQ(converse.env.$iq({type: "get"}).c("query", {xmlns: "jabber:iq:private"}).c("scratchpad", {xmlns: "scratchpad:tasks"}).tree(), function(resp)
    {
        var tasks = resp.querySelectorAll('task');
        console.debug("get tasks", resp, tasks);

        tasks.forEach(function(task)
        {
            console.debug("get task", task);

        });

    }, function (error) {
        console.error("get tasks", error);
    });

}

function getTasks()
{
    return pade.tasks;
}

function setTasks(data)
{
    chrome.storage.local.set({'vuex': data}, function()
    {
        pade.tasks = data;
    });

    // export to Openfire for Spark compatibility

    var vuex  = JSON.parse(data);
    console.debug("setTasks - board", vuex);

    if (!vuex.board || !vuex.board.lists) return;

    let iq = converse.env.$iq({type: "set"}).c("query", {xmlns: "jabber:iq:private"}).c("scratchpad", {xmlns: "scratchpad:tasks"}).c("tasks", {showAll: "true"});

    vuex.board.lists.forEach(function(list)
    {
        console.debug("setTasks - list", list);

        list.items.forEach(function(item)
        {
            console.debug("setTasks - item", item);

            let dueDate = new Date();
            let creationDate = new Date();

            if (item.date)
            {
                dueDate = new Date(item.date);
                creationDate = new Date(item.date);
            }

            iq.c("task").c("title").t(item.title).up().c("dueDate").t(dueDate.getTime()).up().c("creationDate").t(creationDate.getTime()).up().c("completed").t("false").up().up()
        });
    });

    _converse.connection.sendIQ(iq.tree(), function(resp)
    {
        console.debug("set tasks", resp);

    }, function (error) {
        console.error("set tasks", error);
    });
}

function updateCollabUrlList()
{
    console.debug("updateCollabUrlList", getSetting("collabUrlList"));

    for (var i=0; i<pade.collabList.length; i++)
    {
        if (pade.collabDocs[pade.collabList[i]])
        {
            console.debug("updateCollabUrlList - removing ", pade.collabList[i]);
        }
    }

    pade.collabList = getSetting("collabUrlList", "").split("\n");

    for (var i=0; i<pade.collabList.length; i++)
    {
        if (!pade.collabList[i] || pade.collabList[i] == "") continue;

        if (i == 0)
        {
            if (!pade.activeUrl) pade.activeUrl = pade.collabList[i];
        }

        pade.collabDocs[pade.collabList[i]] = pade.collabList[i];
    }
}


function runMeetingPlanner()
{
    if (getSetting("enableMeetingPlanner"))
    {
        var plannerCheck = getSetting("plannerCheck", 10) * 60000;
        pade.planner = setInterval(executeMeetingPlanner, plannerCheck);
        executeMeetingPlanner();    // run immediatelty
    }
}


function executeMeetingPlanner()
{
    var plannerNotice = getSetting("plannerNotice", 5) * 60000;
    var plannerExpire = getSetting("plannerExpire", 15) * 60000;

    var events = [];
    var encoded = window.localStorage["store.settings.savedPlanner"];
    if (encoded) events = JSON.parse(atob(encoded));

    var meetings = {};
    encoded = window.localStorage["store.settings.savedMeetings"];
    if (encoded) meetings = JSON.parse(atob(encoded));


    for (var i=0; i<events.length; i++)
    {
        var title = events[i].title.split("@");
        var start = (new Date(events[i].start)).getTime();
        var now = (new Date()).getTime();
        var timeDiff = start - now;

        if (title.length == 2 && meetings[title[1]])
        {
            var meeting = meetings[title[1]];
            console.debug("Processing meeting", title, start, now, plannerNotice, timeDiff, meeting);

            if (timeDiff < plannerNotice)
            {
                if (timeDiff > -plannerExpire)
                {
                    console.debug("Triggered meeting", title, start, now, plannerNotice, timeDiff, meeting);

                    inviteToConference(_converse.connection.jid, meeting.room, meeting.invite);

                    for (var j=0; j<meeting.inviteList.length; j++)
                    {
                        if (meeting.inviteList[j] && meeting.inviteList[j].indexOf("@") > -1)
                        {
                            inviteToConference(meeting.inviteList[j], meeting.room, meeting.invite);
                        }
                    }
                } else {
                    console.debug("Expired meeting", title, start, now, plannerNotice, timeDiff, meeting);
                }
                events.splice(i, 1);
                window.localStorage["store.settings.savedPlanner"] = btoa(JSON.stringify(events));
            }
        }
    }

}

function checkForChatAPI()
{
    if (pade.username && !getSetting("useAnonymous", false))
    {
        if (pade.server) searchConversations("__DUMMY__", function(html, conversations, error)
        {
            pade.chatAPIAvailable = !error;
        });
    }
}

function setupWorkgroup()
{
    console.debug("setupWorkgroup", pade.activeWorkgroup);

    var show = getSetting("converseCloseState", "online");

    if (show == "online")
    {
         _converse.connection.send(converse.env.$pres());
    }
    else {
        _converse.connection.send(converse.env.$pres().c("show").t(show).up());
    }

    _converse.connection.send(converse.env.$pres({to: pade.activeWorkgroup.jid}).c("show").t("chat").up().c("priority").t("9").up().c('agent-status', {'xmlns': "http://jabber.org/protocol/workgroup"}));

    var stanza = converse.env.$iq({type: 'get', to: pade.activeWorkgroup.jid}).c('agent-status-request', {xmlns: "http://jabber.org/protocol/workgroup"})

    _converse.connection.sendIQ(stanza, function(iq)
    {
        if (getSetting("wgNotifications", false))
        {
            var list = [];

            $(iq).find('agent').each(function()
            {
                var jid = $(this).attr('jid');
                var name = converse.env.Strophe.getNodeFromJid(jid);
                console.debug('pade workgroup agent', jid);
                list.push({title: name, message: jid});
            });

            notifyList("Available Agents", "Workgroups", list);
        }

    }, function(error){
        console.error("agent-status-request error", error);
    });
}
function searchConversations(keyword, callback)
{
    var query = keyword && keyword != "" ? "?keywords=" + keyword : "";
    var url =  "https://" + pade.server + "/rest/api/restapi/v1/chat/" + pade.username + "/messages" + query;
    var options = {method: "GET", headers: {"authorization": "Basic " + btoa(pade.username + ":" + pade.password), "accept": "application/json"}};

    console.debug("searchConversations", url, options);
    var conversations = [];

    fetch(url, options).then(function(response){ return response.json()}).then(function(messages)
    {
        console.debug("searchConversations", messages.conversation);

        if (messages.conversation instanceof Array)
        {
            conversations = messages.conversation;
            callback(processConvSearch(conversations, keyword), conversations, false);
        }
        else if (messages.conversation) {
            conversations = [messages.conversation];
            callback(processConvSearch([messages.conversation], keyword), conversations, false);
        }
        else {
            callback("<p/><p/>No conversations found", conversations, false);
        }

    }).catch(function (err) {
        callback("<p/><p/> Error - " + err, conversations, true);
    });

}

function pdfConversations(keyword, callback)
{
    var query = keyword && keyword != "" ? "?keywords=" + keyword : "";
    var url = "https://" + getSetting("server") + "/dashboard/pdf?keywords=" + keyword;
    //var url = "https://" + pade.server + "/rest/api/restapi/v1/chat/" + pade.username + "/pdf" + query;
    var options = {method: "GET", headers: {"authorization": "Basic " + btoa(pade.username + ":" + pade.password), "accept": "application/json"}};

    console.debug("pdfConversations", url, options);
    var conversations = [];

    fetch(url, options).then(function(response){ return response.blob()}).then(function(blob)
    {
        console.debug("pdfConversations", blob);
        callback(blob, false);

    }).catch(function (err) {
        //console.error('convSearch error', err);
        callback(null, true);
    });

}

function processConvSearch(conversations, keyword)
{
    if (!conversations || conversations.length == 0) return "<p/><p/>No conversations found";

    keyword = keyword.replace(/[^a-zA-Z ]/g, "");

    var query = new RegExp("(\\b" + keyword + "\\b)", "gim");
    var html = "<table style='margin-left: 15px'><tr><th>Date</th><th>Chat</th><th>Conversation</th></tr>";

    console.debug("processConvSearch", conversations, keyword);

    for (var i=conversations.length-1; i>=0; i--)
    {
        var conversation = conversations[i];

        var jid = conversation.chatRoom ? conversation.chatRoom : conversation.participantList[0].split("/")[0];

        if (jid == pade.jid) jid = conversation.participantList[1].split("/")[0]
        var prefix = "<a href='#' id='conversation-" + conversation.conversationID + "' title='" + jid + "'>";
        var suffix = "</a>";

        var date = converse.env.moment(conversation.startDate).format('MMM DD YYYY <br/> HH:mm:ss') + "<br/>" + converse.env.moment(conversation.lastActivity).format('HH:mm:ss');
        var partcipants = conversation.chatRoom ? prefix + conversation.chatRoom.split("@")[0] + suffix + "<br/>" + "(" + conversation.participantList.length + ")" : prefix + conversation.participantList[0].split("@")[0] + suffix + "<br/>" + "<a title='" + conversation.participantList[1].split("/")[0] + "'>" + conversation.participantList[1].split("@")[0] + "</a>";

        var messages = conversation.messages.message;

        if (!messages instanceof Array)
        {
            messages = [messages]
        }

        var convHtml = "";

        for (var j=0; j<messages.length; j++)
        {
            if (messages[j].body.indexOf("has left the room") == -1 && messages[j].body.indexOf("has joined the room") == -1)
            {
                convHtml = convHtml + "[" + converse.env.moment(messages[j].sentDate).format('hh:mm:ss') + "] <b>" + messages[j].from.split("@")[0] + ":</b>&nbsp;" + messages[j].body + "<p/>"
            }
        }

        html = html + "<tr><td>" + date + "</td><td>" + partcipants + "</td><td>" + convHtml + "</td></tr>";
    }

    html =  html + "</table>" + "<p/><p/>";
    var enew = html.replace(/(<span>|<\/span>)/igm, "");
    var newe = enew.replace(query, "<span style=background-color:#FF9;color:#555;>$1</span>");
    return newe;
}


function findRooms(callback)
{
    var iq = converse.env.$iq({'to': "conference." + _converse.connection.domain, 'from': _converse.connection.jid, 'type': "get"}).c("query", {xmlns: "http://jabber.org/protocol/disco#items"});

    _converse.connection.sendIQ(iq, function(resp)
    {
        if (callback) callback(resp.querySelectorAll('item'));

    }, function (err) {
        console.error("roomSearch", err);
    });
}

function roomHistory(jid)
{
    const queryid = _converse.connection.getUniqueId();
    const iq = converse.env.$iq({to: jid, type: 'set'}).c('query', {'xmlns': 'urn:xmpp:mam:2', 'queryid': queryid});
    const start = converse.env.moment().startOf('day').format();

    iq.c('x', {'xmlns': 'jabber:x:data', 'type': 'submit'})
        .c('field', {'var': 'FORM_TYPE','type': 'hidden'}).c('value').t('urn:xmpp:mam:2').up().up()
        .c('field', {'var': 'start'}).c('value').t(start).up().up().up()
        .c('set', {'xmlns': 'http://jabber.org/protocol/rsm'}).c('max').t(100).up().up();

    _converse.connection.sendIQ(iq, function(resp)
    {
        console.log("roomHistory", resp);

    }, function (err) {
        console.error("roomHistory", err);
    });
}

function inviteToConference(jid, room, invitation)
{
    var url = pade.ofmeetUrl + room;
    var invite = (invitation ? invitation : "Please join me in") + " " + url;
    var roomJid = room + "@conference." + pade.domain;

    console.debug("inviteToConference", jid, room, url, roomJid, invite);

    try {
        _converse.connection.send(converse.env.$msg({type: "chat", to: jid}).c("body").t(invite));
    } catch (e) {
        console.error(e);
    }
}

function getCredentials(callback)
{
    if (navigator.credentials)
    {
        navigator.credentials.get({password: true, federated: {providers: [ 'https://accounts.google.com' ]}, mediation: "silent"}).then(function(credential)
        {
            console.log("credential management api get", credential);
            if (callback) callback(credential);

        }).catch(function(err){
            console.error ("credential management api get error", err);
            if (callback) callback();
        });
    }
    else {
        if (callback) callback();
    }
}

function setCredentials(creds)
{
    if (navigator.credentials)
    {
        navigator.credentials.create({password: creds}).then(function(credential)
        {
            navigator.credentials.store(credential).then(function()
            {
                console.log("credential management api put", credential);

            }).catch(function (err) {
                console.error("credential management api put error", err);
            });

        }).catch(function (err) {
            console.error("credential management api put error", err);
        });
    }
}

function setBadge(text, color, title)
{
    console.debug("setBadge", text, color, title);
    if (color) chrome.browserAction.setBadgeBackgroundColor({ color: color });
    chrome.browserAction.setBadgeText({ text: text });
    if (title) chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - " + title});
}