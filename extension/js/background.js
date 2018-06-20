var pade = {gmailWindow: [], webAppsWindow: [], chatsWindow: [], vcards: {}}
var callbacks = {}

// uPort

function uportRequestedCredentials(creds)
{
    console.log("uportRequestedCredentials", creds.publicEncKey, creds.address, creds.name);
}

function uportError(error)
{
    console.error("uportError", error);
}

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
}

if (getSetting("useTotp", false))
{
    console.log("useTotp enabled");

    Strophe.addConnectionPlugin('ofchatsasl',
    {
        init: function (connection)
        {
            Strophe.SASLOFChat = function () { };
            Strophe.SASLOFChat.prototype = new Strophe.SASLMechanism("OFCHAT", true, 2000);

            Strophe.SASLOFChat.test = function (connection)
            {
                return getSetting("password", null) !== null;
            };

            Strophe.SASLOFChat.prototype.onChallenge = function (connection)
            {
                var token = getSetting("username", null) + ":" + getSetting("password", null);
                console.log("Strophe.SASLOFChat", token);
                return token;
            };

            connection.mechanisms[Strophe.SASLOFChat.prototype.name] = Strophe.SASLOFChat;
            console.log("strophe plugin: ofchatsasl enabled");
        }
    });
}


window.addEventListener("unload", function ()
{
    console.log("pade unloaded");

    closeChatWindow();
    closeVideoWindow();
    closePhoneWindow();
    closeBlogWindow();
    closeAVCaptureWindow();
    closeBlastWindow();
    closeVertoWindow();
    closeApcWindow();
    closeOffice365Window(true);
    closeOffice365Window(false);

    var gmailAccounts = getSetting("gmailAccounts", "").split(",");

    for (var i=0; i<gmailAccounts.length; i++)
    {
        closeGmailWindow(gmailAccounts[i]);
    }

    var webApps = getSetting("webApps", "").split(",");

    for (var i=0; i<webApps.length; i++)
    {
        closeWebAppsWindow(webApps[i]);
    }

    var chats = Object.getOwnPropertyNames(pade.chatsWindow);

    for (var y = 0; y<chats.length; y++)
    {
        if (pade.chatsWindow[chats[y]] && win == pade.chatsWindow[chats[y]].id)
        {
           closeChatsWindow(chats[y]);
        }
    }

    etherlynk.disconnect();
    if (pade.connection) pade.connection.disconnect();
});

window.addEventListener("load", function()
{
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
            }
        }
    });

    chrome.runtime.onStartup.addListener(function()
    {
        console.log("onStartup");

        if (getSetting("enableInverse", false) && getSetting("converseAutoStart", false))
            openChatWindow("inverse/index.html", null, "minimized");

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
    });

    // support Jitsi domain controlled screen share

    chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse)
    {
        console.log("Got deskshare request", request, sender);

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
        console.log("popup connect", port.sender.url);

        if (port.sender.url.indexOf("chrome-extension://") > -1 && port.sender.url.indexOf("/apc.html") > -1)
        {
            pade.popup = true;
            pade.port = port;
        }

        port.onMessage.addListener(function(message)
        {
            if (message.action == "pade.invite.contact")
            {
                inviteToConference(pade.activeContact.jid, pade.activeContact.room);
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
            console.log("popup disconnect");

            if (port.sender.url.indexOf("chrome-extension://") > -1 && port.sender.url.indexOf("/apc.html") > -1)
            {
                pade.popup = false;
                pade.port = null;
            }
        });
    });


    if (getSetting("desktopShareMode", false))
    {
        console.log("pade screen share mode only");
        return;
    }

    pade.server = getSetting("server", null);
    pade.domain = getSetting("domain", null);
    pade.username = getSetting("username", null);
    pade.password = getSetting("password", null);
    pade.avatar = getSetting("avatar", null);

    console.log("pade loaded");

    chrome.contextMenus.removeAll();
    chrome.contextMenus.create({id: "pade_rooms", title: "Meetings", contexts: ["browser_action"]});
    chrome.contextMenus.create({id: "pade_conversations", title: "Conversations", contexts: ["browser_action"]});
    chrome.contextMenus.create({id: "pade_applications", title: "Applications", contexts: ["browser_action"]});

    addChatMenu();
    addInverseMenu();
    addBlogMenu();
    addBlastMenu();
    addAVCaptureMenu();
    addVertoMenu();
    addTouchPadMenu();
    addOffice365Business();
    addOffice365Personal();
    addWebApps();
    addGmail();

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

    chrome.browserAction.onClicked.addListener(function()
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
          doJitsiMeet();
        }
    });

    chrome.commands.onCommand.addListener(function(command)
    {
        console.log('Command:', command);

        if (command == "activate_chat" && getSetting("enableInverse", false)) openChatWindow("inverse/index.html");
        if (command == "activate_chat" && getSetting("enableChat", false)) openChatWindow("groupchat/index.html");

        if (command == "activate_blogger_communicator" && getSetting("enableTouchPad", false)) openApcWindow();
        if (command == "activate_blogger_communicator" && !getSetting("enableTouchPad", false)) openBlogWindow();

        if (command == "activate_phone" && getSetting("enableVerto", false)) openVertoWindow()
        if (command == "activate_phone" && !getSetting("enableVerto", false)) openPhoneWindow(true)

        if (command == "activate_meeting") openVideoWindow(pade.activeContact.room);

    });

    chrome.windows.onFocusChanged.addListener(function(win)
    {
        if (pade.chatWindow)
        {
            if (win == -1) pade.minimised = true;
            if (win == pade.chatWindow.id) pade.minimised = false;
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

        //console.log("minimised", win, pade.minimised, pade.chatWindow);
    });

    chrome.windows.onRemoved.addListener(function(win)
    {
        //console.log("closing window ", win);

        if (pade.chatWindow && win == pade.chatWindow.id)
        {
            pade.chatWindow = null;
            pade.minimised = false;
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
            pade.connection.send($pres());  // needed because JitsiMeet send unavailable
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

        var chats = Object.getOwnPropertyNames(pade.chatsWindow);

        for (var y = 0; y<chats.length; y++)
        {
            if (pade.chatsWindow[chats[y]] && win == pade.chatsWindow[chats[y]].id)
            {
               delete pade.chatsWindow[chats[y]];
            }
        }

    });

    chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
    chrome.browserAction.setBadgeText({ text: 'off' });


    if (pade.server && pade.domain && pade.username && pade.password)
    {
        pade.jid = pade.username + "@" + pade.domain;
        pade.displayName = getSetting("displayname", pade.username);

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

        var connUrl = "https://" + pade.server + "/http-bind/";

        if (getSetting("useWebsocket", false))
        {
            connUrl = "wss://" + pade.server + "/ws/";
        }

        pade.connection = getConnection(connUrl);

        pade.connection.connect(pade.username + "@" + pade.domain + "/" + pade.username + "-" + Math.random().toString(36).substr(2,9), pade.password, function (status)
        {
            console.log("pade.connection ===>", status);

            if (status === Strophe.Status.CONNECTED)
            {
                addHandlers();

                chrome.browserAction.setBadgeText({ text: "Wait.." });
                pade.connection.send($pres());

                chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Connected"});

                pade.presence = {};
                pade.participants = {};

                setTimeout(function()
                {
                    fetchContacts(function(contact)
                    {
                        handleContact(contact);
                    });

                    updateVCard();
                    setupStreamDeck();
                    enableRemoteControl();

                    chrome.browserAction.setBadgeText({ text: "" });

                }, 3000);
            }
            else

            if (status === Strophe.Status.DISCONNECTED)
            {
                chrome.browserAction.setBadgeText({ text: "off" });
                chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Disconnected"});
            }
            else

            if (status === Strophe.Status.AUTHFAIL)
            {
               doExtensionPage("options/index.html");
            }

        });

    } else doExtensionPage("options/index.html");
});

function getConnection(connUrl)
{
    return new Strophe.Connection(connUrl);
}

function handleContact(contact)
{
    //console.log("handleContact", contact);

    if (contact.type == "url")
    {
        if (contact.id == 0)
        {
            chrome.contextMenus.create({id: "pade_content", type: "normal", title: "Shared Documents", contexts: ["browser_action"]});

            chrome.contextMenus.create({id: "pade_h5p", type: "normal", title: "H5P Interactive Content", contexts: ["browser_action"]});
            chrome.contextMenus.create({parentId: "pade_h5p", type: "normal", id: "pade_h5p_viewer", title: "H5P Content Viewer", contexts: ["browser_action"],  onclick: handleH5pViewerClick});
        }

        contact.created = true;
        var urlMenu = null;

        if (contact.url.indexOf("/h5p/") > -1)
        {
            urlMenu = {parentId: "pade_h5p", type: "radio", id: contact.url, title: contact.name, contexts: ["browser_action"],  onclick: handleH5pClick};
            if (!pade.activeH5p) pade.activeH5p = contact.url;

        } else {
            urlMenu = {parentId: "pade_content", type: "radio", id: contact.url, title: contact.name, contexts: ["browser_action"],  onclick: handleUrlClick};
            if (!pade.activeUrl) pade.activeUrl = contact.url; // default
        }

        chrome.contextMenus.create(urlMenu);
    }
    else

    if (contact.type == "room")
    {
        if (contact.id == 0)
        {
            setActiveContact(contact);
        }

        pade.participants[contact.jid] = contact;
        contact.created = true;
        chrome.contextMenus.create({parentId: "pade_rooms", type: "radio", id: contact.jid, title: contact.name, contexts: ["browser_action"],  onclick: handleContactClick});
    }
    else

    if (contact.type == "conversation")
    {
        if (contact.id == 0)
        {
            if (!pade.activeContact) setActiveContact(contact);
        }

        if (showUser(contact))
        {
            pade.participants[contact.jid] = contact;
            contact.created = true;
            chrome.contextMenus.create({parentId: "pade_conversations", type: "radio", id: contact.jid, title: contact.name + " - " + contact.presence, contexts: ["browser_action"],  onclick: handleContactClick});
        }
    }
    else

    if (contact.type == "workgroup")
    {
        if (contact.id == 0)
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
        pade.connection.send($pres({to: pade.activeWorkgroup.jid, type: "unavailable"}).c("status").t("Online").up().c("priority").t("1"));
    }

    pade.activeWorkgroup = contact;

    pade.connection.send($pres({to: pade.activeWorkgroup.jid}).c('agent-status', {'xmlns': "http://jabber.org/protocol/workgroup"}));
    pade.connection.send($pres({to: pade.activeWorkgroup.jid}).c("status").t("Online").up().c("priority").t("1"));
    pade.connection.sendIQ($iq({type: 'get', to: pade.activeWorkgroup.jid}).c('agent-status-request', {xmlns: "http://jabber.org/protocol/workgroup"}));

}

function handleContactClick(info)
{
    //console.log("handleContactClick", info, pade.participants[info.menuItemId]);
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
    //console.log("handleWorkgroupClick", info, pade.participants[info.menuItemId]);
    setActiveWorkgroup(pade.participants[info.menuItemId]);
}

function handleUrlClick(info)
{
    //console.log("handleUrlClick", info);
    pade.activeUrl = info.menuItemId;
}

function handleH5pClick(info)
{
    //console.log("handleH5pClick", info);
    pade.activeH5p = info.menuItemId;
}

function handleH5pViewerClick(info)
{
    console.log("handleH5pViewerClick", info);
    if (pade.activeH5p) openWebAppsWindow(pade.activeH5p, null, 800, 600)
}

function reloadApp()
{
    chrome.runtime.reload();
}

function startTone(name)
{
    if (getSetting("enableRingtone", false))
    {
        //console.log("startTone", name);

        if (!pade.ringtone)
        {
            pade.ringtone = new Audio();
            pade.ringtone.loop = true;
        }

        pade.ringtone.src = chrome.extension.getURL("ringtones/" + name + ".mp3");
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


function notifyText(message, context, iconUrl, buttons, callback, notifyId)
{
    var opt = {
      type: "basic",
      title: chrome.i18n.getMessage('manifest_extensionName'),
      iconUrl: iconUrl ? iconUrl : chrome.extension.getURL("image.png"),

      message: message,
      buttons: buttons,
      contextMessage: context,
      requireInteraction: !!buttons && !!callback
    }
    if (!notifyId) notifyId = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(notifyId, opt, function(notificationId)
    {
        if (callback) callbacks[notificationId] = callback;
    });
};

function notifyImage(message, context, imageUrl, buttons, callback)
{
    var opt = {
      type: "image",
      title: chrome.i18n.getMessage('manifest_extensionName'),
      iconUrl: chrome.extension.getURL("image.png"),

      message: message,
      buttons: buttons,
      contextMessage: context,
      imageUrl: imageUrl
    }
    var id = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(id, opt, function(notificationId)
    {
        if (callback) callbacks[notificationId] = callback;
    });
};

function notifyProgress(message, context, progress, buttons, callback)
{
    var opt = {
      type: "progress",
      title: chrome.i18n.getMessage('manifest_extensionName'),
      iconUrl: chrome.extension.getURL("image.png"),

      message: message,
      buttons: buttons,
      contextMessage: context,
      progress: progress
    }
    var id = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(id, opt, function(notificationId)
    {
        if (callback) callbacks[notificationId] = callback;
    });
};


function notifyList(message, context, items, buttons, callback)
{
    var opt = {
      type: "list",
      title: chrome.i18n.getMessage('manifest_extensionName'),
      iconUrl: chrome.extension.getURL("image.png"),

      message: message,
      buttons: buttons,
      contextMessage: context,
      items: items
    }
    var id = Math.random().toString(36).substr(2,9);

    chrome.notifications.create(id, opt, function(notificationId){
        if (callback) callbacks[notificationId] = callback;
    });
};


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

    if (state == "minimized")
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

                chrome.windows.update(win.id, {drawAttention: true});
            }
        });

    } else {
        if (business) chrome.windows.update(pade.of365BWindow.id, {drawAttention: true, focused: true});
        if (!business) chrome.windows.update(pade.of365PWindow.id, {drawAttention: true, focused: true});
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
    var data = {url: chrome.extension.getURL("apc.html"), type: "popup", focused: true};

    if (state == "minimized")
    {
        delete data.focused;
        data.state = state;
    }

    if (pade.apcWindow == null)
    {
        chrome.windows.create(data, function (win)
        {
            pade.apcWindow = win;
            chrome.windows.update(pade.apcWindow.id, {drawAttention: true, width: 820, height: 640});
        });

    } else {
        chrome.windows.update(pade.apcWindow.id, {drawAttention: true, focused: true});
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

    if (state == "minimized")
    {
        delete data.focused;
        data.state = state;
    }

    if (pade.gmailWindow[email] == null)
    {
        chrome.windows.create(data, function (win)
        {
            pade.gmailWindow[email] = win;
            chrome.windows.update(pade.gmailWindow[email].id, {drawAttention: true, width: 640, height: 1024});
        });

    } else {
        chrome.windows.update(pade.gmailWindow[email].id, {drawAttention: true, focused: true});
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
    var httpUrl = url.startsWith("http") ? url.trim() : "https://" + url.trim();
    var data = {url: httpUrl, type: "popup", focused: true};

    console.log("openWebAppsWindow", data);

    if (state == "minimized")
    {
        delete data.focused;
        data.state = state;
    }

    if (pade.webAppsWindow[url] == null)
    {
        chrome.windows.create(data, function (win)
        {
            pade.webAppsWindow[url] = win;
            chrome.windows.update(pade.webAppsWindow[url].id, {drawAttention: true, width: width, height: height});
        });

    } else {
        chrome.windows.update(pade.webAppsWindow[url].id, {drawAttention: true, focused: true});
    }
}

function closeChatsWindow(window)
{
    if (pade.chatsWindow[window] != null)
    {
        chrome.windows.remove(pade.chatsWindow[window].id);
        delete pade.chatsWindow[window];
    }
}

function openChatsWindow(url, from)
{
    closeChatsWindow(from)

    var data = {url: chrome.extension.getURL(url), type: "popup", focused: true};

    chrome.windows.create(data, function (win)
    {
        pade.chatsWindow[from] = win;
        chrome.windows.update(pade.chatsWindow[from].id, {drawAttention: true, width: 761, height: 900});
    });
}

function closePhoneWindow()
{
    if (pade.sip && pade.sip.window != null)
    {
        chrome.windows.remove(pade.sip.window.id);
        pade.sip.window = null;
    }
}

function openPhoneWindow(focus, state)
{
    console.log("openPhoneWindow", focus, state);

    var data = {url: chrome.extension.getURL("phone/index-ext.html"), type: "popup", focused: focus};

    if (state == "minimized")
    {
        delete data.focused;
        data.state = state;
    }

    if (pade.sip.window == null)
    {
        chrome.windows.create(data, function (win)
        {
            pade.sip.window = win;
            chrome.windows.update(pade.sip.window.id, {drawAttention: focus, width: 350, height: 725});
        });

    } else {
        chrome.windows.update(pade.sip.window.id, {drawAttention: focus, focused: focus5});
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
    var data = {url: chrome.extension.getURL(url), type: "popup", focused: true};
    var width = 1300;

    if (url.indexOf("#") > -1) width = 761;    // width of mobile view_mode

    if (state == "minimized")
    {
        delete data.focused;
        data.state = state;
    }

    if (!pade.chatWindow || update)
    {
        if (update && pade.chatWindow != null) chrome.windows.remove(pade.chatWindow.id);

        chrome.windows.create(data, function (win)
        {
            pade.chatWindow = win;
            chrome.windows.update(pade.chatWindow.id, {drawAttention: true, width: width, height: 900});
        });

    } else {
        chrome.windows.update(pade.chatWindow.id, {drawAttention: true, focused: true});
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

function openVideoWindow(room)
{
    var url = chrome.extension.getURL("jitsi-meet/chrome.index.html");
    if (room) url = url + "?room=" + room;
    openVideoWindowUrl(url);
}

function openVideoWindowUrl(url)
{
    if (pade.videoWindow != null)
    {
        chrome.windows.remove(pade.videoWindow.id);
    }

    chrome.windows.create({url: url, focused: true, type: "popup"}, function (win)
    {
        pade.videoWindow = win;
        chrome.windows.update(pade.videoWindow.id, {width: 1024, height: 800, drawAttention: true});

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
            chrome.windows.update(pade.blogWindow.id, {width: 1024, height: 800, drawAttention: true});
        });
    } else {
        chrome.windows.update(pade.blogWindow.id, {drawAttention: true, focused: true});
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
        var url = chrome.extension.getURL("webcam/index.html");

        chrome.windows.create({url: url, focused: true, type: "popup"}, function (win)
        {
            pade.avCaptureWindow = win;
            chrome.windows.update(pade.avCaptureWindow.id, {width: 800, height: 640, drawAttention: true});
        });
    } else {
        chrome.windows.update(pade.avCaptureWindow.id, {drawAttention: true, focused: true});
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
            chrome.windows.update(pade.blastWindow.id, {width: 1024, height: 800, drawAttention: true});
        });
    } else {
        chrome.windows.update(pade.blastWindow.id, {drawAttention: true, focused: true});
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

    if (state == "minimized")
    {
        delete data.focused;
        data.state = state;
    }

    if (!pade.vertoWindow)
    {
        chrome.windows.create(data, function (win)
        {
            pade.vertoWindow = win;
            chrome.windows.update(pade.vertoWindow.id, {width: 1024, height: 800, drawAttention: true});
        });
    } else {
        chrome.windows.update(pade.vertoWindow.id, {drawAttention: true, focused: true});
    }
}

function doExtensionPage(url)
{
    chrome.tabs.getAllInWindow(null, function(tabs)
    {
        var setupUrl = chrome.extension.getURL(url);

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
}

function addHandlers()
{
    pade.connection.addHandler(function(iq)
    {
        //console.log('fastpath handler', iq);

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

            //console.log("fastpath handler offer", properties, workgroupJid);

            acceptRejectOffer(properties);
        });

        iq.find('offer-revoke').each(function()
        {
            id = $(this).attr('id');
            jid = $(this).attr('jid').toLowerCase();

            //console.log("fastpath handler offer-revoke", workgroupJid);
        });

        return true;

    }, "http://jabber.org/protocol/workgroup", 'iq', 'set');

    pade.connection.addHandler(function(presence)
    {
        var to = $(presence).attr('to');
        var type = $(presence).attr('type');
        var from = Strophe.getBareJidFromJid($(presence).attr('from'));

        //console.log("presence handler", from, to, type);

        var pres = "online";
        if (type == "unavailable") pres = "unavailable";

        pade.presence[from] = pres;
        var contact = pade.participants[from];

        if (contact && contact.type == "conversation")
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
        var offerer = null;
        var type = $(message).attr("type");
        var room = null;
        var autoaccept = null;

        console.log("message handler", from, to, message)

        $(message).find('body').each(function ()
        {
            var body = $(this).text();
            var pos0 = body.indexOf("/jitsimeet/index.html?room=")
            var pos1 = body.indexOf("/ofmeet/");
            var pos2 = body.indexOf("https://" + pade.server)

            offerer = Strophe.getBareJidFromJid(from);

            console.log("message handler body", body, offerer);

            if ( pos0 > -1 && pos2 > -1 )
            {
                room = body.substring(pos0 + 27);
                handleInvitation({room: room, offerer: offerer});
            }
            else

            if ( pos1 > -1 && pos2 > -1 )
            {
                room = body.substring(pos1 + 8);
                handleInvitation({room: room, offerer: offerer});
            }
            else

            if (!pade.chatWindow && !pade.chatsWindow[offerer])
            {
                // converse/inverse is closed generate notification
                processChatNotification(offerer, body);
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

                handleInvitation({room: room, offerer: offerer, autoaccept: autoaccept, id: id});
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

    pade.connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:private"}).c("storage", {xmlns: "storage:bookmarks"}).tree(), function(resp)
    {
        //console.log("get bookmarks", resp)

        $(resp).find('conference').each(function()
        {
            var jid = $(this).attr("jid");
            var room = Strophe.getNodeFromJid(jid);
            var muc = Strophe.getDomainFromJid(jid);
            var domain = muc.substring("conference.".length);           // ignore "conference."

            //console.log('ofmeet.bookmark.conference.item', {name: $(this).attr("name"), jid: $(this).attr("jid"), autojoin: $(this).attr("autojoin")});

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
            //console.log('ofmeet.bookmark.url.item', {name: $(this).attr("name"), url: $(this).attr("url")});

            if (callback) callback(
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
        //console.log("get roster", resp)

        $(resp).find('item').each(function()
        {
            var jid = $(this).attr("jid");
            var node = Strophe.getNodeFromJid(jid);
            var name = $(this).attr("name");
            var domain = Strophe.getDomainFromJid(jid);

            //console.log('ofmeet.roster.item',jid, name);

            if (callback) callback(
            {
                id: contactCount++,
                type: "conversation",
                name: name,
                room: makeRoomName(pade.username, node),
                node: node,
                jid: jid,
                presence: pade.presence[jid] ? pade.presence[jid] : "unavailable",
                open: "false",
                active: false,
                domain: domain
            });

        })


    }, function (error) {
        console.error(error);
    });

    pade.connection.sendIQ($iq({type: 'get', to: "workgroup." + pade.connection.domain}).c('workgroups', {jid: pade.connection.jid, xmlns: "http://jabber.org/protocol/workgroup"}).tree(), function(resp)
    {
        $(resp).find('workgroup').each(function()
        {
            var jid = $(this).attr('jid');
            var name = Strophe.getNodeFromJid(jid);
            var room = 'workgroup-' + name + "@conference." + pade.connection.domain;

            //console.log("get workgroups", room, jid);

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
        console.warn("Fastpath not available");
    });

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

            console.log("get sip profile", pade.sip);

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

function findUsers(search, callback)
{
    //console.log('findUsers', search);

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
            var room = makeRoomName(pade.username, username);

            //console.log('findUsers response', name, jid, room);

            users.push({username: username, name: name, email: email, jid: jid, room: room});
        });

        if (callback) callback(users);

    }, function (error) {
        console.error('findUsers', error);
    });
};

function inviteToConference(jid, room)
{
    //console.log("inviteToConference", jid, room);

    try {
        var invite = "Please join me in https://" + pade.server + "/ofmeet/" + room;
        pade.connection.send($msg({type: "chat", to: jid}).c("body").t(invite));
    } catch (e) {
        console.error(e);
    }
}

function injectMessage(message, room, nickname)
{
    //console.log("injectMessage", message, room);

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
    //console.log("handleInvitation", invite);

    var jid = Strophe.getBareJidFromJid(invite.offerer);

    if (pade.participants[jid])
    {
        var participant = pade.participants[jid];
        processInvitation(participant.name, participant.jid, invite.room, invite.autoaccept, invite.id);
    }
    else

    if (invite.offerer == pade.domain)
    {
        processInvitation("Administrator", "admin@"+pade.domain, invite.room, invite.autoaccept, invite.id);
    }
    else {
        processInvitation("Unknown User", invite.offerer, invite.room, invite.id);
    }

    // inform touchpad

    if (pade.port) pade.port.postMessage({event: "invited", id : invite.offerer, name: invite.room, jid: invite.id});
}

function processInvitation(title, label, room, autoaccept, id)
{
    //console.log("processInvitation", title, label, room, id);

    if (!autoaccept || autoaccept != "true")
    {
        startTone("Diggztone_Vibe");

        notifyText(title, label, null, [{title: "Accept " + chrome.i18n.getMessage('manifest_extensionName') + "?", iconUrl: chrome.extension.getURL("success-16x16.gif")}, {title: "Reject " + chrome.i18n.getMessage('manifest_extensionName') + "?", iconUrl: chrome.extension.getURL("forbidden-16x16.gif")}], function(notificationId, buttonIndex)
        {
            //console.log("handleAction callback", notificationId, buttonIndex);

            if (buttonIndex == 0)   // accept
            {
                stopTone();
                acceptCall(title, label, room, id);
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

function processChatNotification(from, body)
{
    notifyText(body, from, null, [{title: "View", iconUrl: chrome.extension.getURL("success-16x16.gif")}, {title: "Ignore", iconUrl: chrome.extension.getURL("forbidden-16x16.gif")}], function(notificationId, buttonIndex)
    {
        if (buttonIndex == 0)   // accept
        {
            if (getSetting("enableInverse", false)) openChatsWindow("inverse/index.html#converse/chat?jid=" + from, from);
            if (getSetting("enableChat", false)) openChatWindow("groupchat/index.html");
        }
    }, from);
}

function acceptCall(title, label, room, id)
{
    //console.log("acceptCall", title, label, room);

    if (isAudioOnly())
    {
        joinAudioCall(title, label, room);

    } else {

        if (!id)    // ofmeet
        {
            openVideoWindow(room);

        } else {
            openChatsWindow("inverse/index.html#converse/room?jid=" + id, label);
        }
    }
}

function acceptRejectOffer(properties)
{
    if (pade.participants[properties.workgroupJid])
    {
        var agent = pade.participants[properties.workgroupJid];

        var question = properties.question;
        if (!question) question = "Fastpath Assistance";

        var email = properties.email;
        if (!email) email = Strophe.getBareJidFromJid(properties.jid);

        //console.log("acceptRejectOffer", question, email, agent);

        startTone("Diggztone_DigitalSanity");

        notifyText(question, email, null, [{title: "Accept - Fastpath Assistance", iconUrl: chrome.extension.getURL("success-16x16.gif")}, {title: "Reject - Fastpath Assistance?", iconUrl: chrome.extension.getURL("forbidden-16x16.gif")}], function(notificationId, buttonIndex)
        {
            //console.log("handleAction callback", notificationId, buttonIndex);

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
            //console.log("jabra incoming", data);
            handleJabraMessage(data.message);
        });

        pade.jabraPort.onDisconnect.addListener(function()
        {
            console.log("jabra disconnected");
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
        console.log("Jabra " + message);
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
        //console.log("sendToJabra " + message);
        pade.jabraPort.postMessage({ message: message });
    }
}

function clearNotification(room)
{
    chrome.notifications.clear(room, function(wasCleared)
    {
        //console.log("notification cleared", room, wasCleared);
    });
}

function joinAudioCall(title, label, room)
{
    etherlynk.join(room);
    sendToJabra("offhook");

    notifyText(title, label, null, [{title: "Clear Conversation?", iconUrl: chrome.extension.getURL("success-16x16.gif")}], function(notificationId, buttonIndex)
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
    //console.log("setSetting", name, value);
    window.localStorage["store.settings." + name] = JSON.stringify(value);
}

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


function addChatMenu()
{
    if (getSetting("enableChat", false))
    {
        chrome.contextMenus.create({parentId: "pade_applications", id: "pade_chat", type: "normal", title: "Candy Chat", contexts: ["browser_action"],  onclick: function()
        {
            openChatWindow("groupchat/index.html");
        }});
    }
}

function removeChatMenu()
{
    closeChatWindow();
    chrome.contextMenus.remove("pade_chat");
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
    return !getSetting("showOnlyOnlineUsers", true) || (getSetting("showOnlyOnlineUsers", true) && contact.presence != "unavailable");
}

function makeRoomName(me, contact)
{
    if (me <= contact)
    {
        return me + "-" + contact;
    }
    else return contact + "-" + me;
}

function setSipStatus(status)
{
    pade.connection.sendIQ($iq({type: 'get', to: "sipark." + pade.connection.domain}).c('registration', {jid: pade.connection.jid, xmlns: "http://www.jivesoftware.com/protocol/sipark"}).c('status').t(status).tree(), function(resp)
    {
        console.log("setSipStatus", status);

    }, function (error) {
        console.error("setSipStatus", error);
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
        console.log("logCall", numA, numB, direction, duration);

    }, function (error) {
        console.error("logCall", error);
    });
*/
}

function getVCard(jid, callback, errorback)
{
    pade.connection.vCard.get(jid, function(vCard)
    {
        if (callback) callback(vCard);

    }, function(error) {
        if (errorback) errorback(error);
        console.error(error);
    });

}

function setVCard(vCard, callback, errorback)
{
    pade.connection.vCard.set(vCard, function(resp)
    {
        if (callback) callback(resp);

    }, function(error) {
        if (errorback) errorback(error);
        console.error(error);
    });
}

function updateVCard()
{
    console.log("updateVCard");

    var avatar = getSetting("avatar", null);

    if (!avatar)
    {
        avatar = createAvatar(pade.displayName);
        setSetting("avatar", avatar);
    }

    var email = getSetting("email", "");
    var phone = getSetting("phone", "");
    var country = getSetting("country", "");
    var url = getSetting("url", "");
    var role = getSetting("role", (getSetting("useUport", false) ? "uport," : "") + chrome.i18n.getMessage('manifest_shortExtensionName'));

    var avatarError = function (error)
    {
        console.error("uploadAvatar - error", error);
    }

    var jid = pade.username + "@" + pade.domain;

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
                console.log("uploadAvatar - set vcard", resp);

            }, avatarError);
        }

        sourceImage.src = avatar;

    }, avatarError);
}

function createAvatar(nickname, width, height, font)
{
    if (!width) width = 32;
    if (!height) height = 32;
    if (!font) font = "16px Arial";

    var canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    var context = canvas.getContext('2d');
    context.fillStyle = "#777";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = font;
    context.fillStyle = "#fff";

    var first, last;
    var name = nickname.split(" ");
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

function createStreamDeckImage(text, fill)
{
    if (!fill) fill = "#070";

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
                //console.log("stream deck incoming", data);

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
                        pade.vcards[jid] = vCard;

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

            var i = b < 13 ? 1 : 2;     // row 1 - 2 (2x10 = 20)
            var j = ((b - 5) % 8) + 1;  // cols 1 - 8 plus 2 = 10

            if (getSetting("cellEnabled_" + p + "_" + i + "_" + j, false))
            {
                var label = getSetting("cellLabel_" + p + "_" + i + "_" + j, null);

                if (label)
                {
                    pade.streamDeckPort.postMessage({ message: "setImage", key: b, data: createStreamDeckImage(label)});
                }
            }
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

                doStreamDeckUrl("inverse/index.html#converse/chat?jid=" + jid, jid, label, key);
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

                doStreamDeckUrl("inverse/index.html#converse/room?jid=" + jid, jid, label, key);
            }
        }
    }
}

function doStreamDeckUrl(url, jid, label, key)
{
    if (pade.chatsWindow[jid])
    {
        closeChatsWindow(jid);
        pade.streamDeckPort.postMessage({ message: "setImage", key: key, data: pade.vcards[jid] ? pade.vcards[jid].avatar : createStreamDeckImage(label, "#070")});

    } else {
        openChatsWindow(url, jid);
        pade.streamDeckPort.postMessage({ message: "setImage", key: key, data: createStreamDeckImage(label, "#700")});
    }
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
                console.log("remote control incoming", data);
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