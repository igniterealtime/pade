window.pade = {
    tasks: {},
    autoJoinRooms: {},
    autoJoinPrivateChats: {},
    gmailWindow: [],
    webAppsWindow: [],
    vcards: {},
    userProfiles: {},
    transferWise: {}
}

const channel = new BroadcastChannel('sw-notification');

channel.addEventListener('message', event =>
{
    console.debug('Received sw-notification', event.data);

    if (event.data.reply && event.data.reply != "")
    {
        var url =  "https://" + getSetting("server") + "/rest/api/restapi/v1/meet/message";
        var options = {method: "POST", headers: {"authorization": "Basic " + btoa(getSetting("username") + ":" + getSetting("password")), "accept": "application/json"}, body: JSON.stringify(event.data) };

        fetch(url, options).then(function(response)
        {
            console.debug("sw-notification response", response);

        }).catch(function (err) {
            console.error("sw-notification error", err);
        });
    }
    else {
        openChatWindow("inverse/index.html");
    }
});

//pade.transferWiseUrl = "https://api.sandbox.transferwise.tech/v1";
pade.transferWiseUrl = "https://api.transferwise.com/v1";

window.addEventListener("unload", function ()
{
    console.log("pade unloading applications");

    if (pade.planner) clearInterval(pade.planner);

    closeChatWindow();
    closeVideoWindow();

    closeBlogWindow();
    closeBlastWindow();

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

    var gmailAccounts = getSetting("gmailAccounts", "").split(",");

    for (var i=0; i<gmailAccounts.length; i++)
    {
        console.log("pade unloading gmail account " + gmailAccounts[i]);
        closeGmailWindow(gmailAccounts[i]);
    }

});

window.addEventListener("load", function()
{
    // branding overrides

    var overrides = Object.getOwnPropertyNames(branding);

    console.debug("branding - start", overrides, branding);

    for (var i=0; i<overrides.length; i++)
    {
        var setting = overrides[i];
        var override = branding[setting];

        if (override.value != null && override.value != undefined)
        {
            if (!window.localStorage["store.settings." + setting])  // override default value
            {
                window.localStorage["store.settings." + setting] = JSON.stringify(override.value);
            }
        }

        console.debug("branding - found", i, setting, override.value, override.disable, window.localStorage["store.settings." + setting]);
    }

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

            var username = getSetting("username");
            var password = getSetting("password");

            parent.getCredentials(username, password, function(credential)
            {
                var setupCreds = function(username, password)
                {
                    setDefaultSetting("username", username);
                    setDefaultSetting("displayname", username);
                    setupBrowserMode(username, password);
                }

                if ((credential.id && credential.password) || credential.anonymous)
                {
                    if (!credential.err) removeSetting("password");  // don't store password if credentials ok
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

        var show = null, status = null;

        if (idleState == "locked")
        {
            show = "xa";
            status = getSetting("idleLockedMessage");
        }
        else

        if (idleState == "idle")
        {
            show = "away";
            status = getSetting("idleMessage");
        }
        else

        if (idleState == "active")
        {
            status = getSetting("idleActiveMessage");
        }

        if (pade.chatWindow)
        {
            var converse = chrome.extension.getViews({windowId: pade.chatWindow.id})[0];

            if (converse)
            {
                if (idleState == "active") converse.padeapi.publishUserLocation();   // republish location in case user has moved
                converse.padeapi.myStatus("status", show ? show : "online");
                if (status) converse.padeapi.myStatus("status_message", status);
            }
        }
    })

    chrome.runtime.onStartup.addListener(function()
    {
        console.log("onStartup");
        pade.startUp = true;

        setTimeout(function()   // wait for 3 secs before starting apps for O/S to be active and ready
        {
            reopenConverse();

            if (getSetting("enableOffice365Business", false) && getSetting("of365AutoStart", false))
                openOffice365Window(true, "minimized");

            if (getSetting("enableOffice365Personal", false) && getSetting("of365AutoStart", false))
                openOffice365Window(false, "minimized");

            if (getSetting("enableWebApps", false) && getSetting("of365AutoStart", false))
            {
                var webApps = getSetting("webApps", "").split(",");

                for (var i=0; i<webApps.length; i++)
                {
                    if (webApps[i] != "") openWebAppsWindow(webApps[i], "minimized");
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

    chrome.browserAction.onClicked.addListener(function()
    {
        if (getSetting("server", null))
        {
            if (getSetting("enableCommunity", false))
            {
                openWebAppsWindow(getSetting("communityUrl", getSetting("server") + "/"), null, 1024, 800);

            } else {
                openChatWindow("inverse/index.html");
            }

        } else {
            doExtensionPage("options/index.html");
        }
    });

    chrome.commands.onCommand.addListener(function(command)
    {
        console.debug('Command:', command);

        if (command == "activate_chat")     openChatWindow("inverse/index.html");
        if (command == "activate_meeting")  openVideoWindow(pade.activeContact.room);

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
            delete pade.chatWindow;
            pade.minimised = false;

            if (getSetting("saveAutoJoinRooms", false))
            {
                setSetting("autoJoinRooms", Object.getOwnPropertyNames(pade.autoJoinRooms).join("\n"));
            }

            if (getSetting("saveAutoJoinChats", false))
            {
                setSetting("autoJoinPrivateChats", Object.getOwnPropertyNames(pade.autoJoinPrivateChats).join("\n"));
            }

            reloadApp();
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

        if (pade.videoWindow && win == pade.videoWindow.id)
        {
            sendToJabra("onhook");

            pade.videoWindow = null;
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

    if (!pade.ofmeetUrl && pade.server)
    {
        pade.ofmeetUrl = "https://" + pade.server + "/ofmeet/";
        setSetting("ofmeetUrl", pade.ofmeetUrl);
    }

    checkForChatAPI();

    var idleTimeout = getSetting("idleTimeout", 300);
    if (idleTimeout > 0) chrome.idle.setDetectionInterval(idleTimeout);

    console.debug("pade loaded");

    chrome.contextMenus.removeAll();
    chrome.contextMenus.create({id: "pade_dnd", type: "checkbox", title: "Do not disturb", contexts: ["browser_action"], onclick: dndCheckClick});
    chrome.contextMenus.create({id: "pade_applications", title: "Applications", contexts: ["browser_action"]});

    chrome.contextMenus.create({parentId: "pade_applications", id: "pade_public_chat", type: "normal", title: "Public Chat", contexts: ["browser_action"],  onclick: function()
    {
        openWebAppsWindow("https://" + getSetting("server") + "/monitoring/", null, 1024, 800);
    }});

    chrome.contextMenus.create({id: "pade_content", type: "normal", title: "Shared Documents", contexts: ["browser_action"]});
    chrome.contextMenus.create({id: "pade_selection_reply", type: "normal", title: 'Reply to "%s"', contexts: ["selection", "editable"], onclick: handleRightClick});
    chrome.contextMenus.create({id: "pade_selection_chat", type: "normal", title: "Chat with %s", contexts: ["selection", "editable"], onclick: handleRightClick});
    chrome.contextMenus.create({id: "pade_selection_chatroom", type: "normal", title: "Enter Chatroom %s", contexts: ["selection", "editable"], onclick: handleRightClick});

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
    addOffice365Business();
    addOffice365Personal();
    addWebApps();
    addGmail();

    if (pade.server && pade.domain && ((!getSetting("useAnonymous", false) && !getSetting("useBasicAuth", false) && pade.password) || getSetting("useCredsMgrApi", false) || (getSetting("useAnonymous", false) || getSetting("useBasicAuth", false))))
    {
        if (pade.username)
        {
            pade.jid = pade.username + "@" + pade.domain;
            pade.displayName = getSetting("displayname", pade.username);
        }

        chrome.browserAction.setPopup({popup: ""});

        // setup jabra speak

        setupJabra();
        enableRemoteControl();
        runMeetingPlanner();
        doSetupStrophePlugins();

    } else doExtensionPage("options/index.html");
});

function doSetupStrophePlugins()
{
    var setupUserPass = function(username, password)
    {
        setSetting("username", username);
        setSetting("password", password);

        pade.username = username;
        pade.password = password;

        pade.jid = pade.username + "@" + pade.domain;
        pade.displayName = getSetting("displayname", pade.username);
    }

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
                    setupUserPass(userPass[0], userPass[1]);
                }

            }).catch(function (err) {
                console.error("Strophe.SASLOFChat.WINSSO", err);
            });
        }
    }
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
        chrome.extension.getViews({windowId: pade.chatWindow.id})[0].padeapi.openChat(jid);
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
        chrome.extension.getViews({windowId: pade.chatWindow.id})[0].padeapi.openGroupChat(jid, room, pade.displayName, null, message, nickname, userJid)
        chrome.windows.update(pade.chatWindow.id, {focused: true});
    }
}

function getSelectedChatBox()
{
    var chatBox = null;

    if (pade.chatWindow)
    {
        chatBox = chrome.extension.getViews({windowId: pade.chatWindow.id})[0].padeapi.getSelectedChatBox();
    }

    return chatBox;
}

function replyInverseChat(text)
{
    if (pade.chatWindow)
    {
        chrome.extension.getViews({windowId: pade.chatWindow.id})[0].padeapi.replyInverseChat(text);
    }
}

function dndCheckClick(info)
{
    chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });

    if (!info.wasChecked && info.checked)
    {
        pade.busy = true;
        if (pade.chatWindow) chrome.extension.getViews({windowId: pade.chatWindow.id})[0].padeapi.myStatus("status", "dnd");

        chrome.browserAction.setBadgeText({ text: "DND" });
        chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Do not Disturb"});
    }
    else

    if (info.wasChecked && !info.checked)
    {
        pade.busy = false;
        if (pade.chatWindow) chrome.extension.getViews({windowId: pade.chatWindow.id})[0].padeapi.myStatus("status", "online");

        chrome.browserAction.setBadgeText({ text: "" });
        chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Connected"});
    }

}

function publishUserLocation()
{
    if (pade.chatWindow) chrome.extension.getViews({windowId: pade.chatWindow.id})[0].padeapi.publishUserLocation()
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

function _getVCard(response)
{
    var name = response.querySelector('vCard FN').innerHTML;
    var photo = response.querySelector('vCard PHOTO');

    var avatar = "";

    if (photo.querySelector('BINVAL').innerHTML != "" && photo.querySelector('TYPE').innerHTML != "")
    avatar = 'data:' + photo.querySelector('TYPE').innerHTML + ';base64,' + photo.querySelector('BINVAL').innerHTML;

    var family = response.querySelector('vCard N FAMILY') ? response.querySelector('vCard N FAMILY').innerHTML : "";
    var middle = response.querySelector('vCard N MIDDLE') ? response.querySelector('vCard N MIDDLE').innerHTML : "";
    var given = response.querySelector('vCard N GIVEN') ? response.querySelector('vCard N GIVEN').innerHTML : "";

    var nickname = response.querySelector('vCard NICKNAME') ? response.querySelector('vCard NICKNAME').innerHTML : "";

    var email = response.querySelector('vCard EMAIL USERID') ? response.querySelector('vCard EMAIL USERID').innerHTML : "";
    var url = response.querySelector('vCard URL') ? response.querySelector('vCard URL').innerHTML : "";
    var role = response.querySelector('vCard ROLE') ? response.querySelector('vCard ROLE').innerHTML : "";

    var workPhone = "";
    var homePhone = "";
    var workMobile = "";
    var homeMobile = "";

    response.querySelectorAll('vCard TEL').forEach(function(item)
    {
        if (item.querySelector('VOICE').length > 0 && item.querySelector('WORK').length > 0)
            workPhone = item.querySelector('NUMBER').innerHTML;

        if (item.querySelector('VOICE').length > 0 && item.querySelector('HOME').length > 0)
            homePhone = item.querySelector('NUMBER').innerHTML;

        if (item.querySelector('CELL').length > 0 && item.querySelector('WORK').length > 0)
            workMobile = item.querySelector('NUMBER').innerHTML;

        if (item.querySelector('CELL').length > 0 && item.querySelector('HOME').length > 0)
            homeMobile = item.querySelector('NUMBER').innerHTML;
    });

    var street = "";
    var locality = "";
    var region = "";
    var pcode = "";
    var country = "";

    response.querySelectorAll('vCard ADR').forEach(function(item)
    {
        if (item.querySelector('WORK').length > 0)
        {
            street = item.querySelector('STREET').innerHTML;
            locality = item.querySelector('LOCALITY').innerHTML;
            region = item.querySelector('REGION').innerHTML;
            pcode = item.querySelector('PCODE').innerHTML;
            country = item.querySelector('CTRY').innerHTML;
        }
    });

    var orgName = response.querySelector('vCard ORG ORGNAME') ? response.querySelector('vCard ORG ORGNAME').innerHTML : "";
    var orgUnit = response.querySelector('vCard ORG ORGUNIT') ? response.querySelector('vCard ORG ORGUNIT').innerHTML : "";

    var title = response.querySelector('vCard TITLE') ? response.querySelector('vCard TITLE').innerHTML : "";

    var vcard =  {name: name, avatar: avatar, family: family, given: given, nickname: nickname, middle: middle, email: email, url: url, homePhone: homePhone, workPhone: workPhone, homeMobile: homeMobile, workMobile: workMobile, street: street, locality: locality, region: region, pcode: pcode, country: country, orgName: orgName, orgUnit: orgUnit, title: title, role: role};
    return vcard;
}

function _setVCard(user)
{
    var avatar = user.avatar.split(";base64,");

    var iq = $iq({to:  pade.connection.domain, type: 'set'}).c('vCard', {xmlns: 'vcard-temp'})

    .c("FN").t(user.name).up()
    .c("NICKNAME").t(user.nickname).up()
    .c("URL").t(user.url).up()
    .c("ROLE").t(user.role).up()
    .c("EMAIL").c("INTERNET").up().c("PREF").up().c("USERID").t(user.email).up().up()
    .c("PHOTO").c("TYPE").t(avatar[0].substring(5)).up().c("BINVAL").t(avatar[1]).up().up()
    .c("TEL").c("VOICE").up().c("WORK").up().c("NUMBER").t(user.workPhone).up().up()
    .c("ADR").c("WORK").up().c("STREET").t(user.street).up().c("LOCALITY").t(user.locality).up().c("REGION").t(user.region).up().c("PCODE").t(user.pcode).up().c("CTRY").t(user.country).up().up()
/*
    .c("TEL").c("PAGER").up().c("WORK").up().c("NUMBER").up().up()
    .c("TEL").c("CELL").up().c("WORK").up().c("NUMBER").t(user.workMobile).up().up()

    .c("TEL").c("FAX").up().c("WORK").up().c("NUMBER").up().up()
    .c("TEL").c("PAGER").up().c("HOME").up().c("NUMBER").up().up()
    .c("TEL").c("CELL").up().c("HOME").up().c("NUMBER").t(user.homeMobile).up().up()
    .c("TEL").c("VOICE").up().c("HOME").up().c("NUMBER").t(user.homePhone).up().up()
    .c("TEL").c("FAX").up().c("HOME").up().c("NUMBER").up().up()
    .c("URL").t(user.url).up()
    .c("ADR").c("HOME").up().c("STREET").up().c("LOCALITY").up().c("REGION").up().c("PCODE").up().c("CTRY").up().up()
    .c("TITLE").t(user.title).up()
*/
    return iq;
}

function getVCard(jid, callback, errorback)
{
    console.log("getVCard", jid, pade.connection);

    jid = jid.trim();

    if (pade.vcards[jid])
    {
       if (callback) callback(pade.vcards[jid]);

    }
    else

    if (pade.connection)
    {
        var stanza = $iq({type: 'get', to: jid}).c('vCard', {xmlns: 'vcard-temp'});

        pade.connection.sendIQ(stanza, function(iq) {
            var vCard = _getVCard(iq);
            console.debug("getVCard", iq, vCard);
            pade.vcards[jid] = vCard;
            if (callback) callback(vCard);

        }, function(error) {
            if (errorback) errorback(error);
            console.error(error);
        });

    } else if (errorback) errorback();
}

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

function closeChatWindow()
{
    if (pade.chatWindow)
    {
        chrome.windows.remove(pade.chatWindow.id);
        delete pade.chatWindow;
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
    const url = getSetting("ofmeetUrl");
    let params = "#config.webinar=" + (mode != "attendee" ? "false" : "true");

    const minHDHeight = getSetting("minHDHeight");
    params = params + (minHDHeight ? "&config.minHDHeight=" + minHDHeight : "");

    const resolution = getSetting("resolution");
    params = params + (resolution ? "&config.resolution=" + resolution : "");

    const startBitrate = getSetting("startBitrate");
    params = params + (startBitrate ? "&config.startBitrate=" + resolution : "");

    const disableAudioLevels = getSetting("disableAudioLevels", null);
    params = params + (disableAudioLevels != null ? "&config.disableAudioLevels=" + disableAudioLevels : "");

    const enableLipSync = getSetting("enableLipSync", null);
    params = params + (enableLipSync != null ? "&config.enableLipSync=" + enableLipSync : "");

    const enableStereoAudio = getSetting("enableStereoAudio", null);
    params = params + (enableStereoAudio != null ? "&config.disableAP=true&config.disableAEC=true&config.disableNS=true&config.disableAGC=true&config.disableHPF=true&config.stereo=true&config.enableLipSync=false&config.opusMaxAverageBitrate=510000" : "");

    const startWithAudioMuted = getSetting("startWithAudioMuted", null);
    params = params + (startWithAudioMuted != null ? "&config.startWithAudioMuted=" + startWithAudioMuted : "");

    const startWithVideoMuted = getSetting("startWithVideoMuted", null);
    params = params + (startWithVideoMuted != null ? "&config.startWithVideoMuted=" + startWithVideoMuted : "");

    const startScreenSharing = getSetting("startScreenSharing", null);
    params = params + (startScreenSharing != null ? "&config.startScreenSharing=" + startScreenSharing : "");

    const recordMeeting = getSetting("recordMeeting", null);
    params = params + (recordMeeting != null ? "&interfaceConfig.OFMEET_RECORD_CONFERENCE=" + recordMeeting : "");

    const enableTranscription = getSetting("enableTranscription", null);
    params = params + (enableTranscription != null ? "&interfaceConfig.OFMEET_ENABLE_TRANSCRIPTION=" + enableTranscription : "");

    const showCaptions = getSetting("showCaptions", null);
    params = params + (showCaptions != null ? "&interfaceConfig.OFMEET_SHOW_CAPTIONS=" + showCaptions : "");

    const INITIAL_TOOLBAR_TIMEOUT = getSetting("INITIAL_TOOLBAR_TIMEOUT");
    params = params + (INITIAL_TOOLBAR_TIMEOUT ? "&interfaceConfig.INITIAL_TOOLBAR_TIMEOUT=" + INITIAL_TOOLBAR_TIMEOUT : "");

    const TOOLBAR_TIMEOUT = getSetting("TOOLBAR_TIMEOUT");
    params = params + (TOOLBAR_TIMEOUT ? "&interfaceConfig.TOOLBAR_TIMEOUT=" + TOOLBAR_TIMEOUT : "");

    const FILM_STRIP_MAX_HEIGHT = getSetting("FILM_STRIP_MAX_HEIGHT");
    params = params + (FILM_STRIP_MAX_HEIGHT ? "&interfaceConfig.FILM_STRIP_MAX_HEIGHT=" + FILM_STRIP_MAX_HEIGHT : "");

    const VERTICAL_FILMSTRIP = getSetting("VERTICAL_FILMSTRIP", null);
    params = params + (VERTICAL_FILMSTRIP != null ? "&interfaceConfig.VERTICAL_FILMSTRIP=" + VERTICAL_FILMSTRIP : "");


    return url + room + params;
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
        updateWindowCoordinates("videoWindow", pade.videoWindow.id, {width: 1900, height: 1020});

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
        if (callback) callback([]);
    });
}

function inviteToConference(jid, room, invitation)
{
    var url = pade.ofmeetUrl + room;
    var invite = (invitation ? invitation : "Please join me in") + " " + url;
    var roomJid = room + "@conference." + pade.domain;

    console.debug("inviteToConference", jid, room, url, roomJid, invite);

    try {
        //pade.connection.send($msg({type: "chat", to: jid}).c("body").t(invite));
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

function setupJabra()
{
    if (getSetting("useJabra", false))
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

    }
    if (message == "Event: endcall")
    {

    }
    if (message == "Event: reject")
    {

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
    closeWebAppsWindow(getSetting("communityUrl"), getSetting("server") + "/");
    chrome.contextMenus.remove("pade_community");
}

function addInverseMenu()
{
    chrome.contextMenus.create({parentId: "pade_applications", id: "pade_inverse", type: "normal", title: "Converse Client", contexts: ["browser_action"],  onclick: function()
    {
        openChatWindow("inverse/index.html");
    }});
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
            if (webApps[i] != "")
            {
                chrome.contextMenus.create({parentId: "pade_applications", id: "pade_webapp_" + webApps[i], type: "normal", title: "App - " + webApps[i], contexts: ["browser_action"],  onclick: function(info)
                {
                    openWebAppsWindow(info.menuItemId.substring(11));
                }});
            }
        }
    }
}

function removeWebApps()
{
    var webApps = getSetting("webApps", "").split(",");

    for (var i=0; i<webApps.length; i++)
    {
        if (webApps[i] != "")
        {
            closeWebAppsWindow(webApps[i]);
            chrome.contextMenus.remove("pade_webapp_" + webApps[i]);
        }
    }
}

function isAudioOnly()
{
    return getSetting("audioOnly", false);
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

    pade.connection.sendIQ($iq({type: 'set', to: pade.connection.domain}).c('query', {xmlns: "jabber:iq:register"}).c('username').t(pade.username).up().c('password').t(newPass).tree(), function(status)
    {
        console.debug("changePassword", status);
        if (callback) callback(status);

    }, function (error) {
        console.error("changePassword", error);
        if (errorback) errorback(error);
    });
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
            chrome.extension.getViews({windowId: pade.chatWindow.id})[0].padeapi.openGroupChat(jid, label, pade.displayName)

        } else {
            chrome.extension.getViews({windowId: pade.chatWindow.id})[0].padeapi.openChat(jid);
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

function reopenConverse()
{
    if (getSetting("enableCommunity", false))
    {
        if (getSetting("communityAutoStart", false))
            openWebAppsWindow(getSetting("communityUrl", getSetting("server") + "/"), "minimized", 1024, 800);
    } else {
        if (getSetting("converseAutoStart", false) && !pade.chatWindow)
            openChatWindow("inverse/index.html", null, "minimized");
    }
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


function runMeetingPlanner()
{
    if (getSetting("enableMeetingPlanner"))
    {
        var plannerCheck = getSetting("plannerCheck", 10) * 60000;
        pade.planner = setInterval(executeMeetingPlanner, fCheck);
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

                    inviteToConference(pade.jid, meeting.room, meeting.invite);

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