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
    transferWise: {}
}

//pade.transferWiseUrl = "https://api.sandbox.transferwise.tech/v1";
pade.transferWiseUrl = "https://api.transferwise.com/v1";

var BrowserDetect = {
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

BrowserDetect.init();

var callbacks = {}

window.addEventListener("unload", function ()
{
    console.log("pade unloading applications");

    if (pade.planner) clearInterval(pade.planner);

    closeCredsWindow();
    closeChatWindow();
    closeVideoWindow();
    closePhoneWindow();
    closeBlogWindow();
    closeAVCaptureWindow();
    closeBlastWindow();
    closeVertoWindow();
    closeApcWindow();

    console.log("pade unloading office365 accounts");

    closeOffice365Window(true);
    closeOffice365Window(false);


    var webApps = Object.getOwnPropertyNames(pade.webAppsWindow);

    for (var i=0; i<webApps.length; i++)
    {
        if (pade.webAppsWindow[webApps[i]])
        {
            console.log("pade unloading web app " + webApps[i]);
            closeWebAppsWindow(webApps[i]);
        }
    }

    etherlynk.disconnect();
    if (pade.connection) pade.connection.disconnect();

    var gmailAccounts = getSetting("gmailAccounts", "").split(",");

    for (var i=0; i<gmailAccounts.length; i++)
    {
        console.log("pade unloading gmail account " + gmailAccounts[i]);
        closeGmailWindow(gmailAccounts[i]);
    }

});

window.addEventListener("load", function()
{
    if (chrome.pade)    // browser mode
    {
        setDefaultSetting("useBasicAuth", false);
        setDefaultSetting("useWebsocket", false);
        setDefaultSetting("ofmeetUrl", "https://" + location.host + "/ofmeet/");

        setDefaultSetting("server", location.host);
        setDefaultSetting("domain", location.hostname);

        if (getSetting("useWinSSO", false))
        {
            var server = getSetting("server", null);

            console.debug("browser mode - WinSSO", server);

            if (server)
            {
                fetch("https://" + server + "/sso/password", {method: "GET"}).then(function(response){ return response.text()}).then(function(accessToken)
                {
                    console.log("Strophe.SASLOFChat.WINSSO", accessToken);

                    if (accessToken.indexOf(":") > -1 )
                    {
                        var userPass = accessToken.split(":");
                        setSetting("username", userPass[0]);
                        setSetting("password", userPass[1]);

                        pade.username = userPass[0];
                        pade.password = userPass[1];

                        pade.jid = pade.username + "@" + pade.domain;
                        pade.displayName = getSetting("displayname", pade.username);

                        setupBrowserMode(userPass[0], userPass[1]);
                    }

                }).catch(function (err) {
                    console.error("Strophe.SASLOFChat.WINSSO", err);
                });
            }
        }
        else {

            parent.getCredentials(function(credential)
            {
                var setupCreds = function(username, password)
                {
                    removeSetting("password");  // don't store password

                    setDefaultSetting("username", username);
                    setDefaultSetting("displayname", username);
                    setupBrowserMode(username, password);
                }

                if (credential)
                {
                    setupCreds(credential.id, credential.password);
                }
                else {

                    if (getSetting("useBasicAuth", false))
                    {
                        fetch("https://" + location.host + "/dashboard/token.jsp", {method: "GET"}).then(function(response){ return response.json()}).then(function(token)
                        {
                            setupCreds(token.username, token.password);

                        }).catch(function (err) {

                            console.error('access denied error', err);
                            setupBrowserMode(); // anonymous mode
                        });

                    } else setupBrowserMode(); // login screen
                }
            });
        }

        return;
    }

    if (chrome.webRequest)
    {
        chrome.webRequest.onHeadersReceived.addListener(
            function(info) {
                var headers = info.responseHeaders;
                for (var i=headers.length-1; i>=0; --i) {
                    var header = headers[i].name.toLowerCase();
                    if (header == 'x-frame-options' || header == 'frame-options') {
                        headers.splice(i, 1); // Remove header
                    }
                }
                return {responseHeaders: headers};
            },
            {urls: [ "<all_urls>" ], types: [ 'sub_frame' ]},
            ['blocking', 'responseHeaders']
        );
    }

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

        var pres = $pres(), show = null, status = null;

        if (idleState == "locked")
        {
            show = "xa";
            pres.c("show").t(show).up();

            status = getSetting("idleLockedMessage");
            if (status) pres.c("status").t(status);
        }
        else

        if (idleState == "idle")
        {
            show = "away";
            pres.c("show").t(show).up();

            status = getSetting("idleMessage");
            if (status) pres.c("status").t(status);
        }
        else

        if (idleState == "active")
        {
            status = getSetting("idleActiveMessage");
            if (status) pres.c("status").t(status);
        }

        if (pade.connection)
        {
            if (idleState == "active") publishUserLocation();   // republish location in case user has moved

            if (pade.chatWindow)
            {
                var model = chrome.extension.getViews({windowId: pade.chatWindow.id})[0]._inverse.xmppstatusview.model;

                if (model)
                {
                    model.set("status", show ? show : "online");
                    if (status) model.set("status_message", status);
                }
            }
            else {
                pade.connection.send(pres);
            }
        }
    })

    chrome.runtime.onStartup.addListener(function()
    {
        console.log("onStartup");
        pade.startUp = true;

        setTimeout(function()   // wait for 3 secs before starting apps for background dependencies to be active and ready
        {
            reopenConverse();

            if (getSetting("enableCommunity", false) && getSetting("communityAutoStart", false))
                openWebAppsWindow(getSetting("communityUrl", getSetting("server") + "/tiki"), "minimized", 1024, 800);

            if (getSetting("enableVerto", false) && getSetting("sipAutoStart", false))
                openVertoWindow("minimized");

            if (getSetting("enableTouchPad", false) && getSetting("touchPadAutoStart", false))
                openApcWindow("minimized");

            if (getSetting("enableOffice365Business", false) && getSetting("of365AutoStart", false))
                openOffice365Window(true, "minimized");

            if (getSetting("enableOffice365Personal", false) && getSetting("of365AutoStart", false))
                openOffice365Window(false, "minimized");

            if (getSetting("enableWebApps", false) && getSetting("of365AutoStart", false))
            {
                var webApps = getSetting("webApps", "").split(",");

                for (var i=0; i<webApps.length; i++)
                {
                    openWebAppsWindow(webApps[i], "minimized");
                }
            }

            if (getSetting("enableGmail", false) && getSetting("of365AutoStart", false))
            {
                var gmailAccounts = getSetting("gmailAccounts", "").split(",");

                for (var i=0; i<gmailAccounts.length; i++)
                {
                    openGmailWindow(gmailAccounts[i], "minimized");
                }
            }

        }, 3000);
    });

    // support Jitsi domain controlled screen share

    chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse)
    {
        console.debug("Got deskshare request", request, sender);

        if(request.getVersion)
        {
            sendResponse({ version: chrome.runtime.getManifest().version });
            return false;

        } else if(request.getStream) {

            var sources = ["screen", "window"];
            var tab = sender.tab;
            tab.url = sender.url;

            chrome.desktopCapture.chooseDesktopMedia(
            sources, tab,
            function(streamId) {
                sendResponse({ streamId: streamId });
            });
            return true;

        } else {
            console.error("Unknown request");
            sendResponse({ error : "Unknown request" });
            return false;
        }
    });

    // support ofmeet 0.3.x any domain screen share

    chrome.runtime.onConnect.addListener(function(port)
    {
        console.debug("popup connect", port.sender.url);

        if (port.sender.url.indexOf("chrome-extension://") > -1 && port.sender.url.indexOf("/apc.html") > -1)
        {
            pade.popup = true;
            pade.port = port;
        }

        var enableCommunity = getSetting("enableCommunity", false);
        var enableInverse = getSetting("enableInverse", false);
        var communitySidecar = getSetting("communitySidecar", false);
        var embedCommunityChat = getSetting("embedCommunityChat", false);
        var disableChatButton = getSetting("disableChatButton", false);
        var communityUrl = getSetting("communityUrl", "");


        if (port.sender.url.indexOf(communityUrl) > -1 && enableCommunity && embedCommunityChat && !enableInverse)
        {
            // converse as sidecar only available if main converse window is not enabled
            port.postMessage({community: true, url: chrome.runtime.getURL(""), id: chrome.runtime.id, sidecar: communitySidecar, domain: pade.domain, server: pade.server, username: pade.username, password: pade.password, disableButton: disableChatButton, ofmeetUrl: pade.ofmeetUrl});
        }

        port.onMessage.addListener(function(message)
        {
            if (message.action == "pade.invite.contact")
            {
                inviteToConference(pade.activeContact.jid, pade.activeContact.room);
            }
            else

            if (message.action == 'pade.management.credential.api')
            {
                console.debug("pade.management.credential.api", message);

                if (message.creds)
                {
                    setSetting("username",  message.creds.username);
                    setSetting("password", message.creds.secret);

                    pade.username = message.creds.username;
                    pade.password = message.creds.secret;

                    var token = pade.username + ":" + pade.password;

                    setTimeout(function() { setupSasl(token); })
                }
                else {
                    console.error("pade.management.credential.api", message);
                    doExtensionPage("options/index.html");
                    closeCredsWindow();
                }
            }
            else

            if (message.event == "pade.popup.open")
            {
                stopTone();
            }
            else {  // desktop share backward compatiblity for openfire meetings 0.3.x

                switch(message.type)
                {
                case 'ofmeetGetScreen':
                    //server = message.server;
                    //sendRemoteControl('action=' + message.type + '&resource=' + message.resource + '&server=' + message.server)

                    var pending = chrome.desktopCapture.chooseDesktopMedia(message.options || ['screen', 'window'], port.sender.tab, function (streamid)
                    {
                        message.type = 'ofmeetGotScreen';
                        message.sourceId = streamid;
                        port.postMessage(message);
                    });

                    // Let the app know that it can cancel the timeout
                    message.type = 'ofmeetGetScreenPending';
                    message.request = pending;
                    port.postMessage(message);
                    break;

                case 'ofmeetCancelGetScreen':
                    chrome.desktopCapture.cancelChooseDesktopMedia(message.request);
                    message.type = 'ofmeetCanceledGetScreen';
                    port.postMessage(message);
                    break;
                }

            }
        });

        port.onDisconnect.addListener(function()
        {
            console.debug("popup disconnect");

            if (port.sender.url.indexOf("chrome-extension://") > -1 && port.sender.url.indexOf("/apc.html") > -1)
            {
                pade.popup = false;
                pade.port = null;
            }
        });
    });

    chrome.notifications.onClosed.addListener(function(notificationId, byUser)
    {
        if (notificationId.startsWith("audioconf-")) etherlynk.leave(notificationId.substring(10));
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
            callback(notificationId, -1);

            callbacks[notificationId] = null;
            delete callbacks[notificationId];

            chrome.notifications.clear(notificationId, function(wasCleared)
            {

            });
        }
    });

    chrome.browserAction.onClicked.addListener(function()
    {
        if (pade.connection && pade.connection.connected)
        {
            if (getSetting("enableTouchPad", false))
            {
                if (getSetting("popupWindow", false))
                {
                    chrome.browserAction.setPopup({popup: ""});
                    openApcWindow();

                } else {
                    chrome.browserAction.setPopup({popup: "popup.html"});
                }
            } else {

                if (getSetting("enableCommunity", false))
                {
                    openWebAppsWindow(getSetting("communityUrl", getSetting("server") + "/tiki"), null, 1024, 800);

                } else {

                    if (getSetting("enableInverse", false))
                    {
                        openChatWindow("inverse/index.html");

                    } else {
                        doJitsiMeet();
                    }
                }
            }

        } else {
            doExtensionPage("options/index.html");
        }
    });

    chrome.commands.onCommand.addListener(function(command)
    {
        console.debug('Command:', command);

        if (command == "activate_chat" && getSetting("enableInverse", false)) openChatWindow("inverse/index.html");

        if (command == "activate_blogger_communicator" && getSetting("enableTouchPad", false)) openApcWindow();
        if (command == "activate_blogger_communicator" && !getSetting("enableTouchPad", false)) openBlogWindow();

        if (command == "activate_phone" && getSetting("enableVerto", false)) openVertoWindow()
        if (command == "activate_phone" && !getSetting("enableVerto", false)) openPhoneWindow(true)

        if (command == "activate_meeting" && !getSetting("enableInverse", false)) openVideoWindow(pade.activeContact.room);
        if (command == "activate_meeting" && getSetting("enableInverse", false)) openWebAppsWindow(getSetting("communityUrl", getSetting("server") + "/tiki"), null, 1024, 800);

    });

    chrome.windows.onFocusChanged.addListener(function(win)
    {
        if (pade.chatWindow)
        {
            if (win == -1) pade.minimised = true;
            if (win == pade.chatWindow.id) pade.minimised = false;

            if (!pade.minimised)
            {
                chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
                chrome.browserAction.setBadgeText({ text: "" });
                pade.messageCount = 0;
            }
        }

        else

        if (pade.videoWindow)
        {
            if (win == -1) pade.minimised = true;
            if (win == pade.videoWindow.id) pade.minimised = false;
        }
        else

        if (pade.apcWindow)
        {
            if (win == -1) pade.minimised = true;
            if (win == pade.apcWindow.id) pade.minimised = false;
        }

        console.debug("minimised", win, pade.minimised, pade.chatWindow);
    });

    chrome.windows.onCreated.addListener(function(window)
    {
        console.debug("opening window ", window);
    })

    chrome.windows.onRemoved.addListener(function(win)
    {
        console.debug("closing window ", win);

        if (pade.chatWindow && win == pade.chatWindow.id)
        {
            pade.chatWindow = null;
            pade.minimised = false;

            if (getSetting("saveAutoJoinRooms", false))
            {
                setSetting("autoJoinRooms", Object.getOwnPropertyNames(pade.autoJoinRooms).join("\n"));
            }

            if (getSetting("saveAutoJoinChats", false))
            {
                setSetting("autoJoinPrivateChats", Object.getOwnPropertyNames(pade.autoJoinPrivateChats).join("\n"));
            }

            if (pade.activeWorkgroup)
            {
                setupWorkgroup(); // needed because presence has reset status
            }
            else {
                var show = getSetting("converseCloseState", "online");

                if (pade.connection)
                {
                    if (show == "online")
                    {
                         pade.connection.send($pres());
                    }
                    else {
                        pade.connection.send($pres().c("show").t(show).up());
                    }
                }
            }
        }

        if (pade.sip.window && win == pade.sip.window.id)
        {
            pade.sip.window = null;
        }

        if (pade.blogWindow && win == pade.blogWindow.id)
        {
            pade.blogWindow = null;
        }
        if (pade.avCaptureWindow && win == pade.avCaptureWindow.id)
        {
            pade.avCaptureWindow = null;
        }

        if (pade.blastWindow && win == pade.blastWindow.id)
        {
            pade.blastWindow = null;
        }

        if (pade.vertoWindow && win == pade.vertoWindow.id)
        {
            pade.vertoWindow = null;
        }

        if (pade.videoWindow && win == pade.videoWindow.id)
        {
            sendToJabra("onhook");

            pade.videoWindow = null;
            pade.minimised = false;
           if (pade.connection) pade.connection.send($pres());  // needed because JitsiMeet send unavailable

            etherlynk.stopRecorder();
        }

        if (pade.apcWindow && win == pade.apcWindow.id)
        {
            pade.apcWindow = null;
            pade.minimised = false;
        }

        if (pade.of365BWindow && win == pade.of365BWindow.id)
        {
            pade.of365BWindow = null;
        }

        if (pade.of365PWindow && win == pade.of365PWindow.id)
        {
            pade.of365PWindow = null;
        }

        if (pade.skypeWindow && win == pade.skypeWindow.id)
        {
            pade.skypeWindow = null;
        }

        var gmailAccounts = getSetting("gmailAccounts", "").split(",");

        for (var i=0; i<gmailAccounts.length; i++)
        {
            if (pade.gmailWindow[gmailAccounts[i]] && win == pade.gmailWindow[gmailAccounts[i]].id)
            {
                delete pade.gmailWindow[gmailAccounts[i]];
            }
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

    pade.server = getSetting("server", null);
    pade.domain = getSetting("domain", null);
    pade.username = getSetting("username", null);
    pade.password = getSetting("password", null);
    pade.avatar = getSetting("avatar", null);
    pade.ofmeetUrl = getSetting("ofmeetUrl", null);

    if (!pade.ofmeetUrl) pade.ofmeetUrl = "https://" + pade.server + "/ofmeet/";

    checkForChatAPI();

    var idleTimeout = getSetting("idleTimeout", 300);
    if (idleTimeout > 0) chrome.idle.setDetectionInterval(idleTimeout);

    console.debug("pade loaded");

    chrome.contextMenus.removeAll();
    chrome.contextMenus.create({id: "pade_dnd", type: "checkbox", title: "Do not disturb", contexts: ["browser_action"], onclick: dndCheckClick});

    if (getSetting("enableInverse", false) == false)
    {
        chrome.contextMenus.create({id: "pade_conversations", title: "Conversations", contexts: ["browser_action"]});
        chrome.contextMenus.create({id: "pade_rooms", title: "Meetings", contexts: ["browser_action"]});
    }

    chrome.contextMenus.create({id: "pade_applications", title: "Applications", contexts: ["browser_action"]});

    chrome.contextMenus.create({parentId: "pade_applications", id: "pade_public_chat", type: "normal", title: "Public Chat", contexts: ["browser_action"],  onclick: function()
    {
        openWebAppsWindow("https://" + getSetting("server") + "/monitoring/", null, 1024, 800);
    }});

    chrome.contextMenus.create({id: "pade_content", type: "normal", title: "Shared Documents", contexts: ["browser_action"]});

    if (getSetting("enableInverse", false))
    {
        chrome.contextMenus.create({id: "pade_selection_reply", type: "normal", title: 'Reply to "%s"', contexts: ["selection", "editable"], onclick: handleRightClick});
        chrome.contextMenus.create({id: "pade_selection_chat", type: "normal", title: "Chat with %s", contexts: ["selection", "editable"], onclick: handleRightClick});
        chrome.contextMenus.create({id: "pade_selection_chatroom", type: "normal", title: "Enter Chatroom %s", contexts: ["selection", "editable"], onclick: handleRightClick});
    }

    chrome.contextMenus.create({id: "pade_selection_meet", type: "normal", title: "Meet in %s", contexts: ["selection", "editable"], onclick: handleRightClick});

    if (getSetting("exten", null))
    {
        var exten = getSetting("exten")

        if (exten && exten != "")
        {
            chrome.contextMenus.create({id: "pade_selection_phone", type: "normal", title: "Phone %s", contexts: ["selection"], onclick: handleRightClick});
        }
    }

    addCommunityMenu();
    addInverseMenu();
    addBlogMenu();
    addBlastMenu();
    addDrawIOMenu();
    addAVCaptureMenu();
    addVertoMenu();
    addTouchPadMenu();
    addOffice365Business();
    addOffice365Personal();
    addWebApps();
    addGmail();

    if (getSetting("enableCollaboration", false)) updateCollabUrlList();

    chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
    chrome.browserAction.setBadgeText({ text: 'off' });

    if (pade.server && pade.domain && ((!getSetting("useAnonymous", false) && !getSetting("useBasicAuth", false) && pade.password) || getSetting("useCredsMgrApi", false) || (getSetting("useAnonymous", false) || getSetting("useBasicAuth", false))))
    {
        if (pade.username)
        {
            pade.jid = pade.username + "@" + pade.domain;
            pade.displayName = getSetting("displayname", pade.username);
        }

        // setup popup

        if (getSetting("popupWindow", false))
        {
            chrome.browserAction.setPopup({popup: ""});

        } else {
            chrome.browserAction.setPopup({popup: "popup.html"});
        }

        // setup jabra speak

        if (getSetting("useJabra", false))
        {
            setupJabra();
        }

        // setup SIP
        pade.sip = {};
        pade.enableSip = getSetting("enableSip", false);

        doSetupStrophePlugins();

    } else doExtensionPage("options/index.html");
});


function handleContact(contact)
{
    console.debug("handleContact", contact);

    if (contact.type == "url" && getSetting("enableCollaboration", false))
    {
        if (contact.id == 0)
        {
            chrome.contextMenus.create({id: "pade_h5p", type: "normal", title: "H5P Interactive Content", contexts: ["browser_action"]});
            chrome.contextMenus.create({parentId: "pade_h5p", type: "normal", id: "pade_h5p_viewer", title: "H5P Content Viewer", contexts: ["browser_action"],  onclick: handleH5pViewerClick});
        }

        contact.created = true;
        var urlMenu = null;

        if (contact.url.indexOf("/h5p/") > -1)
        {
            urlMenu = {parentId: "pade_h5p", type: "radio", id: contact.url, title: contact.name, contexts: ["browser_action"],  onclick: handleH5pClick};
            if (!pade.activeH5p) pade.activeH5p = contact.url;
            pade.collabDocs[contact.url] = contact.name;
            chrome.contextMenus.create(urlMenu);

        } else {

            if (!pade.collabDocs[contact.url])
            {
                urlMenu = {parentId: "pade_content", type: "radio", id: contact.url, title: contact.name, contexts: ["browser_action"],  onclick: handleUrlClick};
                if (!pade.activeUrl) pade.activeUrl = contact.url; // default
                pade.collabDocs[contact.url] = contact.name;
                chrome.contextMenus.create(urlMenu);
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

        if (getSetting("enableInverse", false) == false)
        {
            chrome.contextMenus.create({parentId: "pade_rooms", type: "radio", id: contact.jid, title: contact.name, contexts: ["browser_action"],  onclick: handleContactClick});
        }
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

            if (getSetting("enableInverse", false) == false)
            {
                chrome.contextMenus.create({parentId: "pade_conversations", type: "radio", id: contact.jid, title: contact.name + " - " + contact.presence, contexts: ["browser_action"],  onclick: handleContactClick});
            }
        }
    }
    else

    if (contact.type == "workgroup")
    {
        if (!pade.activeWorkgroup)
        {
            chrome.contextMenus.create({id: "pade_workgroups", title: "Workgroups", contexts: ["browser_action"]});
            setActiveWorkgroup(contact);
        }

        pade.participants[contact.jid] = contact;
        contact.created = true;
        chrome.contextMenus.create({parentId: "pade_workgroups", type: "radio", id: contact.jid, title: contact.name, contexts: ["browser_action"],  onclick: handleWorkgroupClick});
    }
}

function setActiveContact(contact)
{
    pade.activeContact = contact;
    chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - " + pade.activeContact.name + " (" + pade.activeContact.type + ")"});
}

function setActiveWorkgroup(contact)
{
    if (pade.activeWorkgroup)
    {
        //pade.connection.send($pres({to: pade.activeWorkgroup.jid, type: "unavailable"}).c("status").t("Online").up().c("priority").t("1"));
    }

    pade.activeWorkgroup = contact;
    setupWorkgroup();
}

function handleContactClick(info)
{
    console.debug("handleContactClick", info, pade.participants[info.menuItemId]);
    setActiveContact(pade.participants[info.menuItemId]);
    doJitsiMeet();
}

function doJitsiMeet()
{
    if (getSetting("popupWindow", false))
    {
        chrome.browserAction.setPopup({popup: ""});

        if (pade.activeContact)
        {
            closeVideoWindow();

            if (isAudioOnly())
            {
                joinAudioCall(pade.activeContact.name, pade.activeContact.jid, pade.activeContact.room)

            } else {
                openVideoWindow(pade.activeContact.room);
            }

            if (pade.activeContact.type == "conversation")
            {
                inviteToConference(pade.activeContact.jid, pade.activeContact.room);
            }

        } else {
            openVideoWindow();
        }

    } else {

        if (isAudioOnly())
        {
            chrome.browserAction.setPopup({popup: ""});
            joinAudioCall(pade.activeContact.name, pade.activeContact.jid, pade.activeContact.room)

            if (pade.activeContact.type == "conversation")
            {
                inviteToConference(pade.activeContact.jid, pade.activeContact.room);
            }

        } else {
            chrome.browserAction.setPopup({popup: "popup.html"});
        }
    }
}

function handleWorkgroupClick(info)
{
    console.debug("handleWorkgroupClick", info, pade.participants[info.menuItemId]);
    setActiveWorkgroup(pade.participants[info.menuItemId]);
}

function handleUrlClick(info)
{
    console.debug("handleUrlClick", info);
    pade.activeUrl = info.menuItemId;
}

function handleH5pClick(info)
{
    console.debug("handleH5pClick", info);
    pade.activeH5p = info.menuItemId;
}

function handleH5pViewerClick(info)
{
    console.debug("handleH5pViewerClick", info);
    if (pade.activeH5p) openWebAppsWindow(pade.activeH5p, null, 800, 600)
}

function openInverseChatWindow(jid)
{
    checkForChatAPI();

    if (jid.indexOf("@") == -1) jid = jid + "@" + pade.domain;

    if (!pade.chatWindow)
    {
        openChatWindow("inverse/index.html#converse/chat?jid=" + jid, true);

    } else {
        chrome.extension.getViews({windowId: pade.chatWindow.id})[0].openChat(jid);
        chrome.windows.update(pade.chatWindow.id, {focused: true});
    }
}

function openInverseGroupChatWindow(jid, message, nickname, userJid)
{
    if (jid.indexOf("@") == -1) jid = jid + "@conference." + pade.domain;
    var room = Strophe.getNodeFromJid(jid);

    if (!pade.chatWindow)
    {
        openChatWindow("inverse/index.html#converse/room?jid=" + jid, true);
    } else {
        chrome.extension.getViews({windowId: pade.chatWindow.id})[0].openGroupChat(jid, room, pade.displayName, null, message, nickname, userJid)
        chrome.windows.update(pade.chatWindow.id, {focused: true});
    }
}

function openPhoneCall(destination)
{
    var phone = getSetting("exten", null)

    if (phone && phone != "" && pade.chatAPIAvailable)
    {
        makePhoneCall(phone, destination, function(err)
        {
            if (err) alert("Telephone call failed!!");
        })

    } else alert("Call control not configured!!");
}

function getSelectedChatBox()
{
    var chatBox = null;

    if (pade.chatWindow)
    {
        chatBox = chrome.extension.getViews({windowId: pade.chatWindow.id})[0].getSelectedChatBox();
    }

    return chatBox;
}

function replyInverseChat(text)
{
    if (pade.chatWindow)
    {
        chrome.extension.getViews({windowId: pade.chatWindow.id})[0].replyInverseChat(text);
    }
}

function dndCheckClick(info)
{
    chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });

    if (!info.wasChecked && info.checked)
    {
        pade.busy = true;
        if (pade.connection) pade.connection.send($pres().c("show").t("dnd").up());
        if (pade.chatWindow) chrome.extension.getViews({windowId: pade.chatWindow.id})[0]._inverse.xmppstatusview.model.set("status", "dnd");

        chrome.browserAction.setBadgeText({ text: "DND" });
        chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Do not Disturb"});
    }
    else

    if (info.wasChecked && !info.checked)
    {
        pade.busy = false;
        if (pade.connection) pade.connection.send($pres());
        if (pade.chatWindow) chrome.extension.getViews({windowId: pade.chatWindow.id})[0]._inverse.xmppstatusview.model.set("status", "online");

        chrome.browserAction.setBadgeText({ text: "" });
        chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Connected"});
    }

}

function handleRightClick(info)
{
    console.debug("handleRightClick", info);

    if (info.menuItemId == "pade_selection_reply")      replyInverseChat(info.selectionText);
    if (info.menuItemId == "pade_selection_chat")       openInverseChatWindow(info.selectionText);
    if (info.menuItemId == "pade_selection_chatroom")   openInverseGroupChatWindow(info.selectionText);
    if (info.menuItemId == "pade_selection_meet")       openVideoWindow(info.selectionText);
    if (info.menuItemId == "pade_selection_phone")      openPhoneCall(info.selectionText);
}

function reloadApp()
{
    chrome.runtime.reload();
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
    }

    if (!notifyId) notifyId = Math.random().toString(36).substr(2,9);

    var doNotify = function()
    {
        chrome.notifications.create(notifyId, opt, function(notificationId)
        {
            if (chrome.pade)
            {
                if (callback) callback(notificationId, 0);
            }
            else
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
};

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
    }
    var id = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(id, opt, function(notificationId)
    {
        if (callback) callbacks[notificationId] = callback;
    });
};

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
    }
    var id = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(id, opt, function(notificationId)
    {
        if (callback) callbacks[notificationId] = callback;
    });
};


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
    }
    if (!notifyId) notifyId = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(notifyId, opt, function(notificationId){
        if (callback) callbacks[notificationId] = callback;
    });
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

function closeOffice365Window(business)
{
    if (business && pade.of365BWindow != null)
    {
        chrome.windows.remove(pade.of365BWindow.id);
        pade.of365BWindow = null;
    }

    if (!business && pade.of365PWindow != null)
    {
        chrome.windows.remove(pade.of365PWindow.id);
        pade.of365PWindow = null;
    }
}

function openOffice365Window(business, state)
{
    var data = {url: "https://mail.office365.com", type: "popup", focused: true, incognito: !business};

    if (state == "minimized" && getSetting("openWinMinimized", false))
    {
        delete data.focused;
        data.state = state;
    }

    if ((business && pade.of365BWindow == null) || (!business && pade.of365PWindow == null))
    {
        chrome.windows.create(data, function (win)
        {
            if (win)
            {
                if (business) pade.of365BWindow = win;
                if (!business) pade.of365PWindow = win;

                chrome.windows.update(win.id, {width: 820, height: 640});
            }
        });

    } else {
        if (business) chrome.windows.update(pade.of365BWindow.id, {focused: true});
        if (!business) chrome.windows.update(pade.of365PWindow.id, {focused: true});
    }
}

function closeApcWindow()
{
    if (pade.apcWindow != null)
    {
        chrome.windows.remove(pade.apcWindow.id);
        pade.apcWindow = null;
    }
}

function openApcWindow(state)
{
    var data = {url: chrome.runtime.getURL("apc.html"), type: "popup", focused: true};

    if (state == "minimized" && getSetting("openWinMinimized", false))
    {
        delete data.focused;
        data.state = state;
    }

    if (pade.apcWindow == null)
    {
        chrome.windows.create(data, function (win)
        {
            pade.apcWindow = win;
            chrome.windows.update(pade.apcWindow.id, {width: 820, height: 640});
            updateWindowCoordinates("apcWindow", pade.apcWindow.id, {width: 820, height: 640});
        });

    } else {
        chrome.windows.update(pade.apcWindow.id, {focused: true});
    }
}

function closeGmailWindow(window)
{
    if (pade.gmailWindow[window] != null)
    {
        chrome.windows.remove(pade.gmailWindow[window].id);
        delete pade.gmailWindow[window];
    }
}

function openGmailWindow(email, state)
{
    var domain = email.indexOf("@") > -1 ? email.split("@")[1] : email;
    var url = domain == "gmail.com" ? "https://mail.google.com" : "https://mail.google.com/a/" + domain.trim();

    var data = {url: url, type: "popup", focused: true};

    if (state == "minimized" && getSetting("openWinMinimized", false))
    {
        delete data.focused;
        data.state = state;
    }

    if (pade.gmailWindow[email] == null)
    {
        chrome.windows.create(data, function (win)
        {
            pade.gmailWindow[email] = win;
            updateWindowCoordinates(email, pade.gmailWindow[email].id, {width: 1024, height: 768});
        });

    } else {
        chrome.windows.update(pade.gmailWindow[email].id, {focused: true});
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
    var httpUrl = url.startsWith("http") ? url.trim() : ( url.startsWith("chrome-extension") ? url : "https://" + url.trim());
    var data = {url: httpUrl, type: "popup", focused: true};

    console.debug("openWebAppsWindow", data, state, width, height);

    if (state == "minimized" && getSetting("openWinMinimized", false))
    {
        delete data.focused;
        data.state = state;
    }

    if (pade.webAppsWindow[url] == null)
    {
        chrome.windows.create(data, function (win)
        {
            pade.webAppsWindow[url] = win;
            updateWindowCoordinates(url, pade.webAppsWindow[url].id, {width: width, height: height});
        });

    } else {
        chrome.windows.update(pade.webAppsWindow[url].id, {focused: true});
    }
}

function closePhoneWindow()
{
    if (pade.sip && pade.sip.window != null)
    {
        chrome.windows.remove(pade.sip.window.id);
        pade.sip.window = null;
    }
}

function openPhoneWindow(focus, state, url)
{
    console.debug("openPhoneWindow", focus, state);

    var data = {url: chrome.runtime.getURL("phone/index-ext.html") + (url ? "?url=" + url: ""), type: "popup", focused: focus};

    if (state == "minimized" && getSetting("openWinMinimized", false))
    {
        delete data.focused;
        data.state = state;
    }

    if (pade.sip.window == null)
    {
        chrome.windows.create(data, function (win)
        {
            pade.sip.window = win;
            chrome.windows.update(pade.sip.window.id, {width: 400, height: 780});
            updateWindowCoordinates("phoneWindow", pade.sip.window.id, {width: 400, height: 780});
        });

    } else {
        chrome.windows.update(pade.sip.window.id, {focused: focus5});
    }
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
    if (!pade.chatWindow || update)
    {
        if (!update) pade.chatWindow = {id: 0} // dummy entry;

        var data = {url: chrome.runtime.getURL(url), type: "popup", focused: true};
        var width = 1300;

        if (url.indexOf("#") > -1) width = 761;    // width of mobile view_mode

        if (state == "minimized" && getSetting("openWinMinimized", false))
        {
            delete data.focused;
            data.state = state;
        }

        if (update && pade.chatWindow != null) chrome.windows.remove(pade.chatWindow.id);

        chrome.windows.create(data, function (win)
        {
            pade.chatWindow = win;
            updateWindowCoordinates("chatWindow", pade.chatWindow.id, {width: width, height: 900});
        });

    } else {
        chrome.windows.update(pade.chatWindow.id, {focused: true});
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

    chrome.windows.create({url: url, focused: true, type: "popup"}, function (win)
    {
        pade.videoWindow = win;
        updateWindowCoordinates("videoWindow", pade.videoWindow.id, {width: 1024, height: 800});

        sendToJabra("offhook");
    });
}

function closeBlogWindow()
{
    if (pade.blogWindow != null)
    {
        try {
            chrome.windows.remove(pade.blogWindow.id);
        } catch (e) {}
    }
}

function openBlogWindow()
{
    if (!pade.blogWindow)
    {
        var url = "https://" + pade.username + ":" + pade.password + "@" + pade.server + "/" + getSetting("blogName", "solo") + "/admin-index.do#main";

        chrome.windows.create({url: url, focused: true, type: "popup"}, function (win)
        {
            pade.blogWindow = win;
            updateWindowCoordinates("blogWindow", pade.blogWindow.id, {width: 1024, height: 800});
        });
    } else {
        chrome.windows.update(pade.blogWindow.id, {focused: true});
    }
}

function closeAVCaptureWindow()
{
    if (pade.avCaptureWindow != null)
    {
        try {
            chrome.windows.remove(pade.avCaptureWindow.id);
        } catch (e) {}
    }
}

function openAVCaptureWindow()
{
    if (!pade.avCaptureWindow)
    {
        var url = chrome.runtime.getURL("webcam/index.html");

        chrome.windows.create({url: url, focused: true, type: "popup"}, function (win)
        {
            pade.avCaptureWindow = win;
            updateWindowCoordinates("avCaptureWindow", pade.avCaptureWindow.id, {width: 800, height: 640});
        });
    } else {
        chrome.windows.update(pade.avCaptureWindow.id, {focused: true});
    }
}

function closeBlastWindow()
{
    if (pade.blastWindow != null)
    {
        try {
            chrome.windows.remove(pade.blastWindow.id);
        } catch (e) {}
    }
}

function openBlastWindow()
{
    if (!pade.blastWindow)
    {
        var url = "https://" + pade.username + ":" + pade.password + "@" + pade.server + "/dashboard/blast";

        chrome.windows.create({url: url, focused: true, type: "popup"}, function (win)
        {
            pade.blastWindow = win;
            updateWindowCoordinates("blastWindow", pade.blastWindow.id, {width: 1024, height: 800});
        });
    } else {
        chrome.windows.update(pade.blastWindow.id, {focused: true});
    }
}

function closeVertoWindow()
{
    if (pade.vertoWindow != null)
    {
        try {
            chrome.windows.remove(pade.vertoWindow.id);
        } catch (e) {}
    }
}

function openVertoWindow(state)
{
    var data = {url: "https://" + pade.username + ":" + pade.password + "@" + pade.server + "/dashboard/verto", type: "popup", focused: true};

    if (state == "minimized" && getSetting("openWinMinimized", false))
    {
        delete data.focused;
        data.state = state;
    }

    if (!pade.vertoWindow)
    {
        chrome.windows.create(data, function (win)
        {
            pade.vertoWindow = win;
            updateWindowCoordinates("vertoWindow", pade.vertoWindow.id, {width: 1024, height: 800});
        });
    } else {
        chrome.windows.update(pade.vertoWindow.id, {focused: true});
    }
}

function doExtensionPage(url)
{
    if (chrome.tabs)
    {
        chrome.tabs.query({}, function(tabs)
        {
            var setupUrl = chrome.runtime.getURL(url);

            if (tabs)
            {
                var option_tab = tabs.filter(function(t) { return t.url === setupUrl; });

                if (option_tab.length)
                {
                chrome.tabs.update(option_tab[0].id, {highlighted: true, active: true});

                }else{
                chrome.tabs.create({url: setupUrl, active: true});
                }
            }
        });
    } else window.open(chrome.runtime.getURL(url), url);
}

function addHandlers()
{
    console.debug('addHandlers');

    pade.connection.addHandler(function(iq)
    {
        console.debug('fastpath handler', iq);

        var iq = $(iq);
        var workgroupJid = iq.attr('from');

        pade.connection.send($iq({type: 'result', to: iq.attr('from'), id: iq.attr('id')}));

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

    pade.connection.addHandler(function(presence)
    {
        var to = $(presence).attr('to');
        var type = $(presence).attr('type');
        var from = Strophe.getBareJidFromJid($(presence).attr('from'));
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
            if (contact.created)
            {
                chrome.contextMenus.remove(from);
            }

            contact.created = false;
            contact.presence = pres;

            if (showUser(contact))
            {
                contact.created = true;
                chrome.contextMenus.create({parentId: "pade_conversations", type: "radio", id: contact.jid, title: contact.name + " - " + contact.presence, contexts: ["browser_action"],  onclick: handleContactClick});
            }
         }

        if ($(presence).find('agent-status').length > 0 || $(presence).find('notify-queue-details').length > 0 || $(presence).find('notify-queue').length > 0)
        {
            var from = $(presence).attr('from');
            var maxChats;

            $(presence).find('agent-status').each(function()
            {
                var free = true;

                var workGroup = Strophe.getNodeFromJid($(this).attr('jid'));
                if (!pade.fastpath[workGroup]) pade.fastpath[workGroup] = {conversations: {}};

                $(presence).find('max-chats').each(function()
                {
                    pade.fastpath[workGroup].maxChats = $(this).text();
                });

                var agent = Strophe.getNodeFromJid(from);
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
                    pade.fastpath[workGroup].conversations[agent].sessionJid = pade.fastpath[workGroup].conversations[agent].sessionID + "@conference." + pade.connection.domain;

                    pade.fastpath[workGroup].conversations[agent].userID = Strophe.getNodeFromJid($(this).attr('userID'));
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
                var workGroup = Strophe.getNodeFromJid(from);
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
                var workGroup = Strophe.getNodeFromJid(from);
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


    pade.connection.addHandler(function(message)
    {
        var id = $(message).attr("from");
        var from = $(message).attr("from");
        var to = $(message).attr("to");
        var reason = null;
        var password = null;
        var composing = false;
        var offerer = Strophe.getBareJidFromJid(from);
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

                if ((pade.chatWindow && !chrome.extension.getViews({windowId: pade.chatWindow.id})[0].getChatPanel(from)) || !pade.chatWindow)
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
                chrome.browserAction.setBadgeBackgroundColor({ color: '#0000e1' });
                chrome.browserAction.setBadgeText({ text: pade.messageCount.toString() });
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
                    if (!pade.chatWindow)
                    {
                        openChatWindow("inverse/index.html#converse/chat?jid=" + offerer, true);
                    }

                    else {
                        chrome.extension.getViews({windowId: pade.chatWindow.id})[0].openChat(offerer);
                    }
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
                room = Strophe.getNodeFromJid(id);
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

function fetchContacts(callback)
{
    var urlCount = 0;
    var roomCount = 0;
    var contactCount = 0;
    var workgroupCount = 0;

    pade.connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:private"}).c("storage", {xmlns: "storage:bookmarks"}).tree(), function(resp)
    {
        console.debug("get bookmarks", resp)

        $(resp).find('conference').each(function()
        {
            var jid = $(this).attr("jid");
            var room = Strophe.getNodeFromJid(jid);
            var muc = Strophe.getDomainFromJid(jid);
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

    pade.connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:roster"}).tree(), function(resp)
    {
        console.debug("get roster", resp)

        $(resp).find('item').each(function()
        {
            var jid = $(this).attr("jid");
            var node = Strophe.getNodeFromJid(jid);
            var name = $(this).attr("name");
            var domain = Strophe.getDomainFromJid(jid);

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
        pade.connection.sendIQ($iq({type: 'get', to: "workgroup." + pade.connection.domain}).c('workgroups', {jid: pade.connection.jid, xmlns: "http://jabber.org/protocol/workgroup"}).tree(), function(resp)
        {
            $(resp).find('workgroup').each(function()
            {
                var jid = $(this).attr('jid');
                var name = Strophe.getNodeFromJid(jid);
                var room = 'workgroup-' + name + "@conference." + pade.connection.domain;

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
                    domain: pade.connection.domain
                });

                if (callback) callback(
                {
                    id: workgroupCount++,
                    type: "workgroup",
                    jid: jid,
                    presence: "open",
                    name: name,
                    domain: pade.connection.domain
                });
            });

        }, function (error) {
            console.warn("Workgroups not available");
        });
    }

    etherlynk.connect();

    if (pade.enableSip)
    {
        pade.connection.sendIQ($iq({type: 'get', to: "sipark." + pade.connection.domain}).c('registration', {jid: pade.connection.jid, xmlns: "http://www.jivesoftware.com/protocol/sipark"}).tree(), function(resp)
        {
            $(resp).find('jid').each(function()                 {pade.sip.jid = $(this).text();});
            $(resp).find('username').each(function()            {pade.sip.username = $(this).text();});
            $(resp).find('authUsername').each(function()        {pade.sip.authUsername = $(this).text();});
            $(resp).find('displayPhoneNum').each(function()     {pade.sip.displayPhoneNum = $(this).text();});
            $(resp).find('password').each(function()            {pade.sip.password = $(this).text();});
            $(resp).find('server').each(function()              {pade.sip.server = $(this).text();});
            $(resp).find('enabled').each(function()             {pade.sip.enabled = $(this).text();});
            $(resp).find('outboundproxy').each(function()       {pade.sip.outboundproxy = $(this).text();});
            $(resp).find('promptCredentials').each(function()   {pade.sip.promptCredentials = $(this).text();});

            console.debug("get sip profile", pade.sip);

            if (pade.sip.authUsername)
            {
                etherlynk.connectSIP();

                chrome.contextMenus.create({parentId: "pade_applications", id: "pade_phone", type: "normal", title: "Phone", contexts: ["browser_action"],  onclick: function()
                {
                    openPhoneWindow(true);
                }});
            }

        }, function (error) {
            console.warn("SIP profile not available");
            connectSIP();
        });
    }
}

function makePhoneCall(line, destination, callback)
{
    console.debug('makePhoneCall', destination, pade.activeCallId);

    var url = "https://" + pade.server + "/rest/api/restapi/v1/meet/phone/" + line + "/" + destination;

    if (pade.activeCallId)  // active call, transfer
    {
       url = "https://" + pade.server + "/rest/api/restapi/v1/meet/action/transfer/" + pade.activeCallId + "?destination=" + destination;
    }

    var options = {method: "POST", headers: {"authorization": "Basic " + btoa(pade.username + ":" + pade.password), "accept": "application/json"}};

    console.debug("makePhoneCall", url, options);

    fetch(url, options).then(function(response)
    {
        console.debug("getUserProperties ok", response);
        if (callback) callback();

    }).catch(function (err) {
        if (callback) callback(err);
    });
}

function findUsers(search, callback)
{
    var url =  "https://" + pade.server + "/rest/api/restapi/v1/meet/profile/" + search;
    var options = {method: "GET", headers: {"authorization": "Basic " + btoa(pade.username + ":" + pade.password), "accept": "application/json"}};

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

    var iq = $iq({type: 'set', to: "search." + pade.connection.domain}).c('query', {xmlns: 'jabber:iq:search'}).c('x').t(search).up().c('email').t(search).up().c('nick').t(search);

    pade.connection.sendIQ(iq, function(response)
    {
        var users = [];

        $(response).find('item').each(function()
        {
            var current = $(this);
            var jid = current.attr('jid');
            var username = Strophe.getNodeFromJid(jid);
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

function inviteToConference(jid, room, invitation)
{
    var url = pade.ofmeetUrl + room;
    var invite = (invitation ? invitation : "Please join me in") + " " + url;
    var roomJid = room + "@conference." + pade.domain;

    console.debug("inviteToConference", jid, room, url, roomJid, invite);

    try {
        pade.connection.send($msg({type: "chat", to: jid}).c("body").t(invite));
    } catch (e) {
        console.error(e);
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

function handleInvitation(invite)
{
    console.debug("handleInvitation", invite);

    var jid = Strophe.getBareJidFromJid(invite.offerer);

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
        var label = invite.offerer == Strophe.getBareJidFromJid(pade.connection.jid) ? pade.displayName : "Unknown User"
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
                acceptCall(title, label, room, id, webinar);
            }
            else

            if (buttonIndex == 1)   // reject
            {
                stopTone();
            }

        }, room);

        // jabra
        pade.activeRoom = {title: title, label: label, room: room, id: id};
        sendToJabra("ring");

    } else {
        acceptCall(title, label, room, id);
    }
}

function acceptCall(title, label, room, id, webinar)
{
    console.debug("acceptCall", id, title, label, room, pade.questions[label], webinar);

    if (isAudioOnly())
    {
        joinAudioCall(title, label, room);

    } else {

        if (!id || getSetting("enableInverse", false) == false)    // ofmeet
        {
            openVideoWindow(room, webinar ? "attendee" : null);

        } else {

            if (!pade.chatWindow)
            {
                openChatWindow("inverse/index.html#converse/room?jid=" + id, true);
            } else {
                chrome.extension.getViews({windowId: pade.chatWindow.id})[0].openGroupChat(id, label || room, pade.displayName, pade.questions[label])
                chrome.windows.update(pade.chatWindow.id, {focused: true});
            }
        }
    }
}

function acceptRejectOffer(properties)
{
    if (pade.participants[properties.workgroupJid])
    {
        var question = properties.question;
        if (!question) question = "Workgroups Ask";

        var email = properties.email;
        if (!email) email = Strophe.getBareJidFromJid(properties.jid);

        pade.questions[properties.workgroupJid] = properties;

        console.debug("acceptRejectOffer", question, email);

        startTone("Diggztone_DigitalSanity");

        notifyText(question, "Fastpath - " + email, null, [{title: "Accept", iconUrl: chrome.runtime.getURL("check-solid.svg")}, {title: "Reject", iconUrl: chrome.runtime.getURL("times-solid.svg")}], function(notificationId, buttonIndex)
        {
            console.debug("handleAction callback", notificationId, buttonIndex);

            if (buttonIndex == 0)   // accept
            {
                pade.connection.send($iq({type: 'set', to: properties.workgroupJid}).c('offer-accept', {xmlns: "http://jabber.org/protocol/workgroup", jid: properties.jid, id: properties.id}));
                stopTone();
            }
            else

            if (buttonIndex == 1)   // reject
            {
                pade.connection.send($iq({type: 'set', to: properties.workgroupJid}).c('offer-reject', {xmlns: "http://jabber.org/protocol/workgroup", jid: properties.jid, id: properties.id}));
                stopTone();
            }

        }, properties.id);

    } else {
        console.warn("workgroup offer from unknown source", properties.workgroupJid);
    }
}


function setupJabra()
{
    pade.jabraPort = chrome.runtime.connectNative("pade.igniterealtime.org");

    if (pade.jabraPort)
    {
        console.log("jabra connected");

        pade.jabraPort.onMessage.addListener(function(data)
        {
            console.debug("jabra incoming", data);
            handleJabraMessage(data.message);
        });

        pade.jabraPort.onDisconnect.addListener(function()
        {
            console.debug("jabra disconnected");
            pade.jabraPort = null;
        });

        pade.jabraPort.postMessage({ message: "getdevices" });
        pade.jabraPort.postMessage({ message: "getactivedevice" });
        pade.jabraPort.postMessage({ message: "onhook" });
    }
}

function handleJabraMessage(message)
{
    if (message.startsWith("Event: Version ")) {
        console.debug("Jabra " + message);
    }

    if (message == "Event: mute") {

    }
    if (message == "Event: unmute") {

    }
    if (message == "Event: device attached") {

    }
    if (message == "Event: device detached") {

    }

    if (message == "Event: acceptcall")
    {
        if (pade.activeRoom)
        {
            stopTone();
            clearNotification(pade.activeRoom.room);

            if (isAudioOnly())
            {
                joinAudioCall(pade.activeRoom.title, pade.activeRoom.label, pade.activeRoom.room);

            } else {
                openVideoWindow(pade.activeRoom.room);
            }
            pade.activeRoom = null;
        }
    }

    if (message == "Event: endcall")
    {
        if (isAudioOnly())
        {
            if (pade.activeRoom) clearNotification(pade.activeRoom.room);

        } else {
            closeVideoWindow();
        }
    }

    if (message == "Event: reject")
    {
        if (pade.activeRoom)
        {
            stopTone();
            clearNotification(pade.activeRoom.room);
            sendToJabra("onhook");
            pade.activeRoom = null;
        }
    }

    if (message == "Event: flash") {

    }

    if (message.startsWith("Event: devices")) {

    }

    if (message.startsWith("Event: activedevice")) {

    }
}

function sendToJabra(message)
{
    if (pade.jabraPort)
    {
        console.debug("sendToJabra " + message);
        pade.jabraPort.postMessage({ message: message });
    }
}

function clearNotification(room)
{
    chrome.notifications.clear(room, function(wasCleared)
    {
        console.debug("notification cleared", room, wasCleared);
    });
}

function joinAudioCall(title, label, room)
{
    etherlynk.join(room);
    sendToJabra("offhook");

    notifyText(title, label, null, [{title: "Clear Conversation?", iconUrl: chrome.runtime.getURL("check-solid.svg")}], function(notificationId, buttonIndex)
    {
        if (buttonIndex == 0)   // terminate
        {
            etherlynk.leave(room);
        }

    }, room);
}

function removeSetting(name)
{
    localStorage.removeItem("store.settings." + name);
}

function setSetting(name, value)
{
    //console.debug("setSetting", name, value);
    window.localStorage["store.settings." + name] = JSON.stringify(value);
}

function setDefaultSetting(name, defaultValue)
{
    console.debug("setDefaultSetting", name, branding[name], defaultValue, window.localStorage["store.settings." + name]);

    if (branding && branding[name] != undefined)
    {
        window.localStorage["store.settings." + name] = JSON.stringify(branding[name].value);
    }
    else

    if (!window.localStorage["store.settings." + name] && window.localStorage["store.settings." + name] != false)
    {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }
}

function getSetting(name, defaultValue)
{
    //console.debug("getSetting", name, defaultValue);

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


function addCommunityMenu()
{
    if (getSetting("enableCommunity", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_community", type: "normal", title: "CMS/Community Client", contexts: ["browser_action"],  onclick: function()
        {
            openWebAppsWindow(getSetting("communityUrl"), null, 1024, 800);
        }});
    }
}

function removeCommunityMenu()
{
    closeWebAppsWindow(getSetting("communityUrl"), getSetting("server") + "/tiki");
    chrome.contextMenus.remove("pade_community");
}

function addInverseMenu()
{
    if (getSetting("enableInverse", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_inverse", type: "normal", title: "Converse Client", contexts: ["browser_action"],  onclick: function()
        {
            openChatWindow("inverse/index.html");
        }});
    }
}

function removeInverseMenu()
{
    closeChatWindow();
    chrome.contextMenus.remove("pade_inverse");
}

function addBlogMenu()
{
    if (getSetting("enableBlog", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_blog", type: "normal", title: "Blogger", contexts: ["browser_action"],  onclick: function()
        {
            openBlogWindow();
        }});
    }
}

function removeAVCaptureMenu()
{
    closeAVCaptureWindow();
    chrome.contextMenus.remove("pade_avcapture");
}

function addAVCaptureMenu()
{
    if (getSetting("enableAVCapture", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_avcapture", type: "normal", title: "Audio/Video Capture", contexts: ["browser_action"],  onclick: function()
        {
            openAVCaptureWindow();
        }});
    }
}

function removeBlogMenu()
{
    closeBlogWindow();
    chrome.contextMenus.remove("pade_blog");
}

function addBlastMenu()
{
    if (getSetting("enableBlast", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_blast", type: "normal", title: "Message Blast", contexts: ["browser_action"],  onclick: function()
        {
            openBlastWindow();
        }});
    }
}
function removeBlastMenu()
{
    closeBlastWindow();
    chrome.contextMenus.remove("pade_blast");
}

function addDrawIOMenu()
{
    if (getSetting("enableDrawIO", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_drawio", type: "normal", title: "Draw-IO Diagraming Tool", contexts: ["browser_action"],  onclick: function()
        {
            openWebAppsWindow("https://" + pade.server + "/drawio");
        }});
    }
}
function removeDrawIOMenu()
{
    closeWebAppsWindow("https://" + pade.server + "/drawio");
    chrome.contextMenus.remove("pade_drawio");
}

function addVertoMenu()
{
    if (getSetting("enableVerto", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_verto", type: "normal", title: "Verto Communicator", contexts: ["browser_action"],  onclick: function()
        {
            openVertoWindow();
        }});
    }
}

function removeVertoMenu()
{
    closeVertoWindow();
    chrome.contextMenus.remove("pade_verto");
}

function addTouchPadMenu()
{
    if (getSetting("enableTouchPad", false))
    {
        chrome.contextMenus.create({id: "pade_apc", type: "normal", title: "Communicator TouchPad", contexts: ["browser_action"],  onclick: function()
        {
            openApcWindow();
        }});
    }
}

function removeTouchPadMenu()
{
    closeApcWindow();
    chrome.contextMenus.remove("pade_apc");
}

function addOffice365Business()
{
    if (getSetting("enableOffice365Business", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_of365_business", type: "normal", title: "Office 365 Business", contexts: ["browser_action"],  onclick: function()
        {
            openOffice365Window(true);
        }});
    }
}

function removeOffice365Business()
{
    closeOffice365Window(true);
    chrome.contextMenus.remove("pade_of365_business");
}

function addOffice365Personal()
{
    if (getSetting("enableOffice365Personal", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_of365_personal", type: "normal", title: "Office 365 Personal", contexts: ["browser_action"],  onclick: function()
        {
            openOffice365Window(false);
        }});
    }
}

function removeOffice365Personal()
{
    closeOffice365Window(false);
    chrome.contextMenus.remove("pade_of365_personal");
}

function addGmail()
{
    if (getSetting("enableGmail", false))
    {
        var gmailAccounts = getSetting("gmailAccounts", "").split(",");

        for (var i=0; i<gmailAccounts.length; i++)
        {
            chrome.contextMenus.create({parentId: "pade_applications", id: "pade_gmail_" + gmailAccounts[i], type: "normal", title: "Gmail - " + gmailAccounts[i], contexts: ["browser_action"],  onclick: function(info)
            {
                openGmailWindow(info.menuItemId.substring(11));
            }});
        }
    }
}

function removeGmail()
{
    var gmailAccounts = getSetting("gmailAccounts", "").split(",");

    for (var i=0; i<gmailAccounts.length; i++)
    {
        closeGmailWindow(gmailAccounts[i]);
        chrome.contextMenus.remove("pade_gmail_" + gmailAccounts[i]);
    }
}

function addWebApps()
{
    if (getSetting("enableWebApps", false))
    {
        var webApps = getSetting("webApps", "").split(",");

        for (var i=0; i<webApps.length; i++)
        {
            chrome.contextMenus.create({parentId: "pade_applications", id: "pade_webapp_" + webApps[i], type: "normal", title: "App - " + webApps[i], contexts: ["browser_action"],  onclick: function(info)
            {
                openWebAppsWindow(info.menuItemId.substring(11));
            }});
        }
    }
}

function removeWebApps()
{
    var webApps = getSetting("webApps", "").split(",");

    for (var i=0; i<webApps.length; i++)
    {
        closeWebAppsWindow(webApps[i]);
        chrome.contextMenus.remove("pade_webapp_" + webApps[i]);
    }
}

function isAudioOnly()
{
    return getSetting("audioOnly", false);
}

function showUser(contact)
{
    return getSetting("enableInverse", false) || !getSetting("showOnlyOnlineUsers", true) || (getSetting("showOnlyOnlineUsers", true) && contact.presence != "unavailable");
}

function makeRoomName(contact)
{
    if (pade.username <= contact)
    {
        return pade.username + "-" + contact;
    }
    else return contact + "-" + pade.username;
}

function setSipStatus(status)
{
    pade.connection.sendIQ($iq({type: 'get', to: "sipark." + pade.connection.domain}).c('registration', {jid: pade.connection.jid, xmlns: "http://www.jivesoftware.com/protocol/sipark"}).c('status').t(status).tree(), function(resp)
    {
        console.debug("setSipStatus", status);

    }, function (error) {
        console.error("setSipStatus", error);
    });
}

function changePassword(callback, errorback)
{
    var newPass = JSON.parse(window.localStorage["store.settings.password"]);

    pade.connection.sendIQ($iq({type: 'set', to: pade.connection.domain}).c('query', {xmlns: "jabber:iq:register"}).c('username').t(pade.username).up().c('password').t(newPass).tree(), function(status)
    {
        console.debug("changePassword", status);
        if (callback) callback(status);

    }, function (error) {
        console.error("changePassword", error);
        if (errorback) errorback(error);
    });
}

function logCall(target, direction, duration)
{
    if (direction == "dialed")
    {
        numA = pade.sip.username;
        numB = target;
    }
    else {
        numB = pade.sip.username;
        numA = target;
    }

/*
    pade.connection.sendIQ($iq({type: 'get', to: "logger." + pade.connection.domain}).c('logger', {jid: pade.connection.jid, xmlns: "http://www.jivesoftware.com/protocol/log"}).c('callLog').c('numA').t(numA).up().c('numB').t(numB).up().c('direction').t(direction).up().c('duration').t(duration).up().tree(), function(resp)
    {
        console.debug("logCall", numA, numB, direction, duration);

    }, function (error) {
        console.error("logCall", error);
    });
*/
}

function getVCard(jid, callback, errorback)
{
    jid = jid.trim();

    if (pade.vcards[jid])
    {
       if (callback) callback(pade.vcards[jid]);

    }
    else

    if (pade.connection && pade.connection.vCard)
    {
        pade.connection.vCard.get(jid, function(vCard)
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
    if (pade.connection.vCard) pade.connection.vCard.set(vCard, function(resp)
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

    var jid = pade.username + "@" + pade.domain;

    getVCard(jid, function(vCard)
    {
        avatar = vCard.avatar;

        if (!avatar || avatar == "")
        {
            avatar = createAvatar(pade.displayName);

            if (getSetting("updateAvatar", false))
            {
                updateVCardAvatar(jid, avatar)
            }

            setSetting("avatar", avatar);
        }

    }, function(error) {
        avatar = createAvatar(pade.displayName);
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
        vCard.name = pade.displayName;
        vCard.nickname = pade.displayName;
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


function createAvatar(nickname, width, height, font, force)
{
    if (!nickname) nickname = "Anonymous";
    nickname = nickname.toLowerCase();

    if (avatars[nickname])
    {
        if (!force) return avatars[nickname];
    }

    if (getSetting("converseRandomAvatars", false))
    {
        return "https://" + pade.server + "/randomavatar/" + nickname
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

var nickColors = {}

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

var avatars = {}

chrome.storage.local.get('avatars', function(data)
{
    if (data && data.avatars) avatars = data.avatars;
});

chrome.storage.local.get('vuex', function(data)
{
    if (data && data.vuex) pade.tasks = data.vuex;
});

function fetchTasks()
{
    pade.connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:private"}).c("scratchpad", {xmlns: "scratchpad:tasks"}).tree(), function(resp)
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

    let iq = $iq({type: "set"}).c("query", {xmlns: "jabber:iq:private"}).c("scratchpad", {xmlns: "scratchpad:tasks"}).c("tasks", {showAll: "true"});

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

    pade.connection.sendIQ(iq.tree(), function(resp)
    {
        console.debug("set tasks", resp);

    }, function (error) {
        console.error("set tasks", error);
    });
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


function createStreamDeckImage(text, fill)
{
    if (!fill) fill = getRandomColor(text);

    var canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    canvas.width = 72;
    canvas.height = 72;
    document.body.appendChild(canvas);
    var context = canvas.getContext('2d');
    context.fillStyle = fill;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fff";

    if (text.indexOf(" ") > -1)
    {
       context.font = "16px Arial";
       texts = text.split(" ");
       context.fillText(texts[0], 3, 32);
       context.fillText(texts[1], 3, 48);

    } else {
       context.font = "24px Arial";
       context.fillText(text, 3, 48);
    }

    var data = canvas.toDataURL();
    document.body.removeChild(canvas);

    return canvas.toDataURL();
}

function setupStreamDeck()
{
    if (getSetting("useStreamDeck", false))
    {
        pade.streamDeckPort = chrome.runtime.connectNative("pade.stream.deck");

        if (pade.streamDeckPort)
        {
            console.log("stream deck connected");

            pade.streamDeckPort.onMessage.addListener(function(data)
            {
                console.debug("stream deck incoming", data);

                if (data.message == "keypress")
                {
                    if (data.key < 5)
                    {
                        handleStreamDeckPage(data.key + 1)
                    } else {
                        handleStreamDeckKey(data.key);
                    }
                }

            });

            pade.streamDeckPort.onDisconnect.addListener(function()
            {
                console.log("stream deck disconnected");
                pade.streamDeckPort = null;
            });

            pade.streamDeckPage = 1;

            for (var b=0; b<15; b++)
            {
               pade.streamDeckPort.postMessage({ message: "setColor", key: b, color: 0 });
            }

            for (var p=1; p<6; p++)
            {
                if (getSetting("pageEnabled_" + p, false))
                {
                    var label = getSetting("pageLabel_" + p, null);

                    if (label)
                    {
                        pade.streamDeckPort.postMessage({ message: "setImage", key: p-1, data: createStreamDeckImage(label, p==pade.streamDeckPage ? "#700" : "#070")});
                    }
                }
            }

            for (var b=5; b<15; b++)
            {
                setupStreadDeckKey(b);
            }
        }
    }
}

function setupStreadDeckKey(b)
{
    var p = pade.streamDeckPage;                    // page 91-5)
    var i = b < 13 ? 1 : 2;                         // row 1 - 2 (2x10 = 20)
    var j = ((b - 5) % 8) + 1;                      // cols 1 - 8 plus 2 = 10

    if (getSetting("cellEnabled_" + p + "_" + i + "_" + j, false))
    {
        var label = getSetting("cellLabel_" + p + "_" + i + "_" + j, null);
        var value = getSetting("cellValue_" + p + "_" + i + "_" + j, null);

        if (value && value.indexOf("im:") == 0)
        {
            var jid = value.substring(3);

            if (jid.indexOf("@") == -1)
            {
                var domain = getSetting("domain", null);
                jid = jid + "@" + domain;
            }

            getVCard(jid, function(vCard)
            {
                if (vCard.avatar)
                {
                    var sourceImage = new Image();

                    sourceImage.onload = function()
                    {
                        var canvas = document.createElement("canvas");
                        canvas.width = 72;
                        canvas.height = 72;
                        canvas.getContext("2d").drawImage(sourceImage, 0, 0, 72, 72);
                        vCard.avatar = canvas.toDataURL();

                        pade.streamDeckPort.postMessage({ message: "setImage", key: b, data: pade.vcards[jid].avatar});
                    }
                    sourceImage.src = vCard.avatar;
                }

            });
        }

        if (label)
        {
            pade.streamDeckPort.postMessage({ message: "setImage", key: b, data: createStreamDeckImage(label)});
        }
    }
}

function handleStreamDeckPage(p)
{
    for (var z=1; z<6; z++)
    {
        if (getSetting("pageEnabled_" + z, false))
        {
            var label = getSetting("pageLabel_" + z, null);

            if (label)
            {
                pade.streamDeckPort.postMessage({ message: "setImage", key: z-1, data: createStreamDeckImage(label, "#070")});
            }
        }
    }

    pade.streamDeckPage = p;

    if (getSetting("pageEnabled_" + p, false))
    {
        var label = getSetting("pageLabel_" + p, null);

        if (label)
        {
            pade.streamDeckPort.postMessage({ message: "setImage", key: p-1, data: createStreamDeckImage(label, "#700")});
        }

        for (var b=5; b<15; b++)
        {
            pade.streamDeckPort.postMessage({ message: "setColor", key: b, color: 0 });
            setupStreadDeckKey(b);
        }
    }
}

function handleStreamDeckKey(key)
{
    var p = pade.streamDeckPage;
    var i = key < 13 ? 1 : 2;
    var j = ((key - 5) % 8) + 1;

    if (getSetting("cellEnabled_" + p + "_" + i + "_" + j, false))
    {
        var label = getSetting("cellLabel_" + p + "_" + i + "_" + j, null);
        var value = getSetting("cellValue_" + p + "_" + i + "_" + j, null);

        if (value)
        {
            if (value.indexOf("im:") == 0)
            {
                var jid = value.substring(3);

                if (jid.indexOf("@") == -1)
                {
                    var domain = getSetting("domain", null);
                    jid = jid + "@" + domain;
                }

                doStreamDeckUrl("inverse/index.html#converse/chat?jid=" + jid, jid, label, key, false);
            }
            else

            if (value.indexOf("xmpp:") == 0)
            {
                var jid = value.substring(5);

                if (jid.indexOf("@") == -1)
                {
                    var domain = getSetting("domain", null);
                    jid = jid + "@conference." + domain;
                }

                doStreamDeckUrl("inverse/index.html#converse/room?jid=" + jid, jid, label, key, true);
            }
        }
    }
}

function doStreamDeckUrl(url, jid, label, key, groupChat)
{
    if (!pade.chatWindow)
    {
        openChatWindow(url, true);
    }

    else {

        if (groupChat)
        {
            chrome.extension.getViews({windowId: pade.chatWindow.id})[0].openGroupChat(jid, label, pade.displayName)

        } else {
            chrome.extension.getViews({windowId: pade.chatWindow.id})[0].openChat(jid);
        }
        chrome.windows.update(pade.chatWindow.id, {focused: true});
    }

    pade.streamDeckPort.postMessage({ message: "setImage", key: key, data: pade.vcards[jid] ? pade.vcards[jid].avatar : createStreamDeckImage(label, "#070")});
}

function enableRemoteControl()
{
    if (getSetting("enableRemoteControl", false))
    {
        pade.remoteControlPort = chrome.runtime.connectNative("pade.remote.control");

        if (pade.remoteControlPort)
        {
            console.log("remote control host connected");

            pade.remoteControlPort.onMessage.addListener(function(data)
            {
                console.debug("remote control incoming", data);
            });

            pade.remoteControlPort.onDisconnect.addListener(function()
            {
                console.log("remote control host disconnected");
                pade.remoteControlPort = null;
            });

            pade.remoteControlPort.postMessage({ event: "ofmeet.remote.hello" });
        }
    }
}

function getConnection(connUrl)
{
    return new Strophe.Connection(connUrl);
}

function doPadeConnect()
{
    var resource = chrome.i18n.getMessage('manifest_shortExtensionName').toLowerCase() + "-" + chrome.runtime.getManifest().version + "-" + BrowserDetect.browser + BrowserDetect.version + BrowserDetect.OS + "-" + Math.random().toString(36).substr(2,9);
    var connUrl = getSetting("boshUri", "https://" + pade.server + "/http-bind/");

    if (getSetting("useWebsocket", false))
    {
        connUrl = getSetting("websocketUri", "wss://" + pade.server + "/ws/");
    }

    var connJid = pade.username + "@" + pade.domain  + "/" + resource;

    pade.connection = getConnection(connUrl);

    if (!getSetting("autoReconnect", true))
    {
        pade.connection.connectionmanager.disable();
    }

    var doXmppConnect = function()
    {
        pade.connection.connect(connJid, pade.password, function (status)
        {
            console.debug("pade.connection ===>", status, connUrl, connJid);

            if (status === Strophe.Status.CONNECTED)
            {
                addHandlers();

                pade.connection.send($pres());

                chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
                chrome.browserAction.setBadgeText({ text: "Wait.." });
                chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Connected"});

                setTimeout(function()
                {
                    if (!getSetting("useAnonymous", false))
                    {
                        fetchContacts(function(contact)
                        {
                            handleContact(contact);
                        });

                        updateVCard();
                        setupStreamDeck();
                        enableRemoteControl();
                        runMeetingPlanner();
                        publishUserLocation();
                        setupUserPayment();
                        //fetchTasks();
                    }

                    closeCredsWindow();

                    if (getSetting("converseAutoReOpen", true)) reopenConverse();

                    chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
                    chrome.browserAction.setBadgeText({ text: "" });
                    pade.isReady = true;

                }, 3000);
            }
            else

            if (status === Strophe.Status.DISCONNECTED)
            {
                chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
                chrome.browserAction.setBadgeText({ text: "off" });
                chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Disconnected"});
            }
            else

            if (status === Strophe.Status.AUTHFAIL)
            {
               doExtensionPage("options/index.html");
               closeCredsWindow();
            }

        });
    }

    if (getSetting("useAnonymous", false))
    {
        connJid = pade.domain;
        pade.password = null;

        doXmppConnect();
    }
    else

    if (getSetting("useBasicAuth", false))
    {
        fetch("https://" + pade.server + "/dashboard/token.jsp", {method: "GET"}).then(function(response){ return response.json()}).then(function(token)
        {
            pade.username = token.username;
            pade.password = token.password;
            pade.jid = pade.username + "@" + pade.domain;
            connJid = pade.username + "@" + pade.domain  + "/" + resource;

            doXmppConnect();

        }).catch(function (err) {
            console.error('access denied error', err);
            doExtensionPage("options/index.html");
        });

    }
    else
    doXmppConnect();
}

function reopenConverse()
{
    if (getSetting("enableInverse", false) && getSetting("converseAutoStart", false) && !pade.chatWindow)
        openChatWindow("inverse/index.html", null, "minimized");
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

        var stanza = $iq({type: 'set'}).c('pubsub', {xmlns: "http://jabber.org/protocol/pubsub"}).c('publish', {node: "http://jabber.org/protocol/geoloc"}).c('item').c('geoloc', {xmlns: "http://jabber.org/protocol/geoloc"}).c("accuracy").t(position.coords.accuracy).up().c("lat").t(position.coords.latitude).up().c("lon").t(position.coords.longitude).up();

        pade.connection.sendIQ(stanza, function(iq)
        {
            console.log("User location publish ok");

        }, function(error){
            console.error("showPosition", error);
        });

        pade.connection.send($pres().c('geoloc', {xmlns: "http://jabber.org/protocol/geoloc"}).c("accuracy").t(position.coords.accuracy).up().c("lat").t(position.coords.latitude).up().c("lon").t(position.coords.longitude).up());
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

function doSetupStrophePlugins()
{
    // strophe SASL

    if (getSetting("useClientCert", false))
    {
        console.log("useClientCert enabled");

        Strophe.addConnectionPlugin('externalsasl',
        {
            init: function (connection)
            {
                Strophe.SASLExternal = function() {};
                Strophe.SASLExternal.prototype = new Strophe.SASLMechanism("EXTERNAL", true, 2000);

                Strophe.SASLExternal.test = function (connection)
                {
                    return connection.authcid !== null;
                };

                Strophe.SASLExternal.prototype.onChallenge = function(connection)
                {
                    return connection.authcid === connection.authzid ? '' : connection.authzid;
                };

                connection.mechanisms[Strophe.SASLExternal.prototype.name] = Strophe.SASLExternal;
                console.log("strophe plugin: externalsasl enabled");
            }
        });

        doPadeConnect();
    }
    else

    if (getSetting("useTotp", false) || getSetting("useWinSSO", false)  || getSetting("useCredsMgrApi", false) || getSetting("useSmartIdCard", false))
    {
        if (getSetting("useWinSSO", false))
        {
            var server = getSetting("server", null);

            console.debug("doSetupStrophePlugins - WinSSO", server);

            if (server)
            {
                fetch("https://" + server + "/sso/password", {method: "GET"}).then(function(response){ return response.text()}).then(function(accessToken)
                {
                    console.log("Strophe.SASLOFChat.WINSSO", accessToken);

                    if (accessToken.indexOf(":") > -1 )
                    {
                        var userPass = accessToken.split(":");
                        setSetting("username", userPass[0]);
                        setSetting("password", userPass[1]);

                        pade.username = userPass[0];
                        pade.password = userPass[1];

                        pade.jid = pade.username + "@" + pade.domain;
                        pade.displayName = getSetting("displayname", pade.username);
                        setDefaultSetting("displayname", pade.displayName);
                    }

                    setTimeout(function() { setupSasl(accessToken); })

                }).catch(function (err) {
                    console.error("Strophe.SASLOFChat.WINSSO", err);
                    accessToken = "error:error";
                    setTimeout(reloadApp, 10000);
                });
            }
        }

        else if (getSetting("useTotp", false) || getSetting("useSmartIdCard", false))
        {
            var username = getSetting("username", null);
            var password = getSetting("password", null);
            var token = username + ":" + password;

            setTimeout(function() { setupSasl(token); })
        }

        else if(getSetting("useCredsMgrApi", false))
        {
            var screenWidth = screen.availWidth;
            var screenHeight = screen.availHeight;
            var width = 512;
            var height = 384;

            var server = getSetting("server", null);
            var url = "https://" + server + "/apps/sso/credential-management.jsp?url=" + chrome.runtime.getURL("") + "&label=" + chrome.i18n.getMessage('manifest_shortExtensionName');

            console.debug("doSetupStrophePlugins - CredsMgrApi", server, url);

            chrome.windows.create({url: url, type: "popup"}, function (win)
            {
                pade.credWin = win;
                chrome.windows.update(win.id, {width: width, height: height, left: Math.round((screenWidth-width)/2), top: Math.round((screenHeight-height)/2)});
            });
        }
    }
    else doPadeConnect();
}


function closeCredsWindow()
{
    if (pade.credWin)
    {
        chrome.windows.remove(pade.credWin.id);
        pade.credWin = null;
    }
}
function setupSasl(token)
{
    console.debug("setupSasl", token);

    Strophe.addConnectionPlugin('ofchatsasl',
    {
        init: function (connection)
        {
            console.log("strophe plugin: ofchatsasl - init", token);

            Strophe.SASLOFChat = function () { };
            Strophe.SASLOFChat.prototype = new Strophe.SASLMechanism("OFCHAT", true, 2000);

            Strophe.SASLOFChat.test = function (connection)
            {
                return getSetting("server", null) !== null;
            };

            Strophe.SASLOFChat.prototype.onChallenge = function (connection)
            {
                return token;
            };

            connection.mechanisms[Strophe.SASLOFChat.prototype.name] = Strophe.SASLOFChat;
            console.log("strophe plugin: ofchatsasl enabled");
        }
    });

    doPadeConnect();
}

function updateCollabUrlList()
{
    console.debug("updateCollabUrlList", getSetting("collabUrlList"));

    for (var i=0; i<pade.collabList.length; i++)
    {
        if (pade.collabDocs[pade.collabList[i]])
        {
            console.debug("updateCollabUrlList - removing ", pade.collabList[i]);
            chrome.contextMenus.remove(pade.collabList[i]);
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

        var urlMenu = {parentId: "pade_content", type: "radio", id: pade.collabList[i], title: pade.collabList[i], contexts: ["browser_action"],  onclick: handleUrlClick};
        chrome.contextMenus.create(urlMenu);
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

                    inviteToConference(pade.connection.jid, meeting.room, meeting.invite);

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
         pade.connection.send($pres());
    }
    else {
        pade.connection.send($pres().c("show").t(show).up());
    }

    pade.connection.send($pres({to: pade.activeWorkgroup.jid}).c("show").t("chat").up().c("priority").t("9").up().c('agent-status', {'xmlns': "http://jabber.org/protocol/workgroup"}));

    var stanza = $iq({type: 'get', to: pade.activeWorkgroup.jid}).c('agent-status-request', {xmlns: "http://jabber.org/protocol/workgroup"})

    pade.connection.sendIQ(stanza, function(iq)
    {
        if (getSetting("wgStatusAlerts", false))
        {
            var list = [];

            $(iq).find('agent').each(function()
            {
                var jid = $(this).attr('jid');
                var name = Strophe.getNodeFromJid(jid);
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
    var url = "https://" + getSetting("server") + "/dashboard/pdf?keywords=" + keyword;
    var options = {method: "GET", headers: {"authorization": "Basic " + btoa(pade.username + ":" + pade.password), "accept": "application/json"}};

    console.debug("pdfConversations", url, options);

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

        var date = moment(conversation.startDate).format('MMM DD YYYY <br/> HH:mm:ss') + "<br/>" + moment(conversation.lastActivity).format('HH:mm:ss');
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
                convHtml = convHtml + "[" + moment(messages[j].sentDate).format('hh:mm:ss') + "] <b>" + messages[j].from.split("@")[0] + ":</b>&nbsp;" + messages[j].body + "<p/>"
            }
        }

        html = html + "<tr><td>" + date + "</td><td>" + partcipants + "</td><td>" + convHtml + "</td></tr>";
    }

    html =  html + "</table>" + "<p/><p/>";
    var enew = html.replace(/(<span>|<\/span>)/igm, "");
    var newe = enew.replace(query, "<span style=background-color:#FF9;color:#555;>$1</span>");
    return newe;
}

function setupBrowserMode(username, password)
{
    pade.server = getSetting("server", location.host);
    pade.domain = getSetting("domain", location.hostname);
    pade.username = getSetting("username", username);
    pade.password = getSetting("password", password);
    pade.jid = pade.username ? (pade.username + "@" + pade.domain) : pade.domain;
    pade.displayName = getSetting("displayname", (pade.username ? pade.username : "Anonymous"));

    pade.chatWindow = {id: 1};

    pade.ofmeetUrl = getSetting("ofmeetUrl", null);
    if (!pade.ofmeetUrl) pade.ofmeetUrl = "https://" + pade.server + "/ofmeet/";
    if (pade.username) pade.avatar = getSetting("avatar", createAvatar(pade.username));

    checkForChatAPI();

    console.log("pade in browser mode");
}

function findRooms(callback)
{
    if (pade.connection)
    {
        var iq = $iq({'to': "conference." + pade.connection.domain, 'from': pade.connection.jid, 'type': "get"}).c("query", {xmlns: "http://jabber.org/protocol/disco#items"});

        pade.connection.sendIQ(iq, function(resp)
        {
            if (callback) callback(resp.querySelectorAll('item'));

        }, function (err) {
            console.error("roomSearch", err);
        });
    }
}

function roomHistory(jid)
{
    const queryid = pade.connection.getUniqueId();
    const iq = $iq({to: jid, type: 'set'}).c('query', {'xmlns': 'urn:xmpp:mam:2', 'queryid': queryid});
    const start = moment().startOf('day').format();

    iq.c('x', {'xmlns': 'jabber:x:data', 'type': 'submit'})
        .c('field', {'var': 'FORM_TYPE','type': 'hidden'}).c('value').t('urn:xmpp:mam:2').up().up()
        .c('field', {'var': 'start'}).c('value').t(start).up().up().up()
        .c('set', {'xmlns': 'http://jabber.org/protocol/rsm'}).c('max').t(100).up().up();

    pade.connection.sendIQ(iq, function(resp)
    {
        console.log("roomHistory", resp);

    }, function (err) {
        console.error("roomHistory", err);
    });
}