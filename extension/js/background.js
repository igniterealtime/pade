var pade = {}
var callbacks = {}

window.addEventListener("beforeunload", function ()
{
    if (pade.videoWindow) chrome.windows.remove(pade.videoWindow.id);
    if (pade.connection) pade.connection.disconnect();
});


window.addEventListener("unload", function ()
{
    console.log("pade unloaded");

    etherlynk.connect();
    if (pade.connection) pade.connection.disconnect();

    closeChatWindow();
    closeVideoWindow();
});

window.addEventListener("load", function()
{
    console.log("pade loaded");

    chrome.contextMenus.removeAll();
    chrome.contextMenus.create({id: "pade_chat", type: "normal", title: "Chat", contexts: ["browser_action"],  onclick: function()
    {
        openChatWindow("groupchat/index.html");
    }});

    chrome.runtime.onConnect.addListener(function(port)
    {
        //console.log("popup connect");
        pade.popup = true;
        pade.port = port;

        port.onMessage.addListener(function(msg)
        {
            if (msg.action == "pade.invite.contact")
            {
                inviteToConference(pade.activeContact.jid, pade.activeContact.room);
            }
            else

            if (msg.event == "pade.popup.open")
            {
                stopTone();
            }
            else {  // desktop share backward compatiblity for openfire meetings 0.3.x

                switch(message.type)
                {
                case 'ofmeetGetScreen':
                    server = message.server;
                    sendRemoteControl('action=' + message.type + '&resource=' + message.resource + '&server=' + message.server)

                    var pending = chrome.desktopCapture.chooseDesktopMedia(message.options || ['screen', 'window'], channel.sender.tab, function (streamid)
                    {
                        message.type = 'ofmeetGotScreen';
                        message.sourceId = streamid;
                        channel.postMessage(message);
                    });

                    // Let the app know that it can cancel the timeout
                    message.type = 'ofmeetGetScreenPending';
                    message.request = pending;
                    channel.postMessage(message);
                    break;

                case 'ofmeetCancelGetScreen':
                    chrome.desktopCapture.cancelChooseDesktopMedia(message.request);
                    message.type = 'ofmeetCanceledGetScreen';
                    channel.postMessage(message);
                    break;
                }

            }
        });

        port.onDisconnect.addListener(function()
        {
            //console.log("popup disconnect");
            pade.popup = false;
            pade.port = null;
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

    chrome.browserAction.onClicked.addListener(function()
    {
        doJitsiMeet();
    });


    chrome.windows.onRemoved.addListener(function(win)
    {
        //console.log("closing window ", win);

        if (pade.chatWindow && win == pade.chatWindow.id)
        {
            pade.chatWindow = null;
        }

        if (pade.videoWindow && win == pade.videoWindow.id)
        {
            sendToJabra("onhook");

            pade.videoWindow = null;
            pade.connection.send($pres());  // needed because JitsiMeet send unavailable
        }
    });

    pade.server = getSetting("server", null);
    pade.domain = getSetting("domain", null);
    pade.username = getSetting("username", null);
    pade.password = getSetting("password", null);

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
            pade.jabraPort = chrome.runtime.connectNative("pade.igniterealtime.org");

            if (pade.jabraPort)
            {
                console.log("jabra connected");

                pade.jabraPort.onMessage.addListener(function(data)
                {
                    console.log("jabra incoming", data);
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

        chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
        chrome.browserAction.setBadgeText({ text: 'off' });

        // setup SIP
        pade.enableSip = getSetting("enableSip", false);

        var connUrl = "https://" + pade.server + "/http-bind/";

        if (getSetting("useWebsocket", false))
        {
            connUrl = "wss://" + pade.server + "/ws/";
        }

        pade.connection = new Strophe.Connection(connUrl);

        pade.connection.connect(pade.username + "@" + pade.domain + "/" + pade.username, pade.password, function (status)
        {
            if (status === Strophe.Status.CONNECTED)
            {
                addHandlers();

                chrome.browserAction.setBadgeText({ text: "" });
                pade.connection.send($pres());

                chrome.browserAction.setTitle({title: "Pade - Connected"});

                pade.presence = {};
                pade.participants = {};

                setTimeout(function()
                {
                    fetchContacts(function(contact)
                    {
                        handleContact(contact);
                    });
                });
            }
            else

            if (status === Strophe.Status.DISCONNECTED)
            {
                chrome.browserAction.setBadgeText({ text: "off" });
                chrome.browserAction.setTitle({title: "Pade - Disconnected"});
            }

        });

        // etherlynk for audio only
        etherlynk.connect();

    } else doOptions();
});

function handleContact(contact)
{
    //console.log("handleContact", contact);

    if (contact.type == "url")
    {
        if (contact.id == 0)
        {
            chrome.contextMenus.create({id: "pade_content", type: "normal", title: "Shared Documents", contexts: ["browser_action"]});
            pade.activeUrl = contact.url; // default
        }

        chrome.contextMenus.create({parentId: "pade_content", type: "radio", id: contact.url, title: contact.name, contexts: ["browser_action"],  onclick: handleUrlClick});

    }
    else

    if (contact.type == "room")
    {
        if (contact.id == 0)
        {
            chrome.contextMenus.create({id: "pade_rooms", title: "Meetings", contexts: ["browser_action"]});
            setActiveContact(contact);
        }

        pade.participants[contact.jid] = contact;
        chrome.contextMenus.create({parentId: "pade_rooms", type: "radio", id: contact.jid, title: contact.name, contexts: ["browser_action"],  onclick: handleContactClick});
    }
    else

    if (contact.type == "conversation")
    {
        if (contact.id == 0)
        {
            chrome.contextMenus.create({id: "pade_conversations", title: "Conversations", contexts: ["browser_action"]});
            if (!pade.activeContact) setActiveContact(contact);
        }

        pade.participants[contact.jid] = contact;
        chrome.contextMenus.create({parentId: "pade_conversations", type: "radio", id: contact.jid, title: contact.name + " - " + contact.presence, contexts: ["browser_action"],  onclick: handleContactClick});
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
        chrome.contextMenus.create({parentId: "pade_workgroups", type: "radio", id: contact.jid, title: contact.name, contexts: ["browser_action"],  onclick: handleWorkgroupClick});
    }
}

function setActiveContact(contact)
{
    pade.activeContact = contact;
    chrome.browserAction.setTitle({title: "Pade - " + pade.activeContact.name + " (" + pade.activeContact.type + ")"});
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
      title: "Pade - Openfire Meetings",
      iconUrl: iconUrl ? iconUrl : chrome.extension.getURL("ignite_dl_openfire.png"),

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
      title: "Pade - Openfire Meetings",
      iconUrl: chrome.extension.getURL("ignite_dl_openfire.png"),

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
      title: "Pade - Openfire Meetings",
      iconUrl: chrome.extension.getURL("ignite_dl_openfire.png"),

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
      title: "Pade - Openfire Meetings",
      iconUrl: chrome.extension.getURL("ignite_dl_openfire.png"),

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

function closeChatWindow()
{
    if (pade.chatWindow)
    {
        chrome.windows.remove(pade.chatWindow.id);
        pade.chatWindow = null;
    }
}

function openChatWindow(url)
{
    if (!pade.chatWindow)
    {
        chrome.windows.create({url: chrome.extension.getURL(url), focused: true, type: "popup"}, function (win)
        {
            pade.chatWindow = win;
            chrome.windows.update(pade.chatWindow.id, {drawAttention: true, width: 800, height: 600});
        });

    } else {
        chrome.windows.update(pade.chatWindow.id, {drawAttention: true, focused: true, width: 800, height: 600});
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
    if (pade.videoWindow != null)
    {
        chrome.windows.remove(pade.videoWindow.id);
    }
    var url = chrome.extension.getURL("jitsi-meet/chrome.index.html");
    if (room) url = url + "?room=" + room;

    chrome.windows.create({url: url, width: 1024, height: 800, focused: true, type: "popup"}, function (win)
    {
        pade.videoWindow = win;
        chrome.windows.update(pade.videoWindow.id, {drawAttention: true});

        sendToJabra("offhook");
    });
}

function doOptions()
{
    chrome.tabs.getAllInWindow(null, function(tabs)
    {
        var setupUrl = chrome.extension.getURL('options/index.html');

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

        if (contact)
        {
            contact.presence = pres;
            chrome.contextMenus.update(from, {title: contact.name + " - " + contact.presence});
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

        //console.log("message handler", from, to, type)

        $(message).find('body').each(function ()
        {
            var body = $(this).text();
            var pos1 = body.indexOf("/ofmeet/");
            var pos2 = body.indexOf("https://" + pade.server)

            offerer = Strophe.getBareJidFromJid(from);

            //console.log("message handler body", body, offerer);

            if ( pos1 > -1 && pos2 > -1 )
            {
                room = body.substring(pos1 + 8);
                handleInvitation({room: room, offerer: offerer});
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

                handleInvitation({room: room, offerer: offerer, autoaccept: autoaccept});
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
                room: pade.username + "-" + node,
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

    pade.connection.sendIQ($iq({type: "get"}).c("vCard", {xmlns: "vcard-temp"}).tree(), function(resp)
    {
        var vCard = $(resp).find("vCard");
        var img = vCard.find('BINVAL').text();
        var type = vCard.find('TYPE').text();
        var img_src = 'data:'+type+';base64,'+img;

        //console.log("get vcard", img_src);

        if (img_src != 'data:;base64,')
        {
            pade.avatar = img_src;
        }

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
                name: name,
                pinned: true,
                open: true,
                room: room,
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


}

function findUsers(search, callback)
{
    console.log('findUsers', search);

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
            var room = pade.username + "-" + username;

            console.log('findUsers response', name, jid, room);

            users.push({username: username, name: name, email: email, jid: jid, room: room});
        });

        if (callback) callback(users);

    }, function (error) {
        console.error('findUsers', error);
    });
};

function inviteToConference(jid, room)
{
    console.log("inviteToConference", jid, room);

    try {
        var invite = "Please join me in https://" + pade.server + "/ofmeet/" + room;
        pade.connection.send($msg({type: "chat", to: jid}).c("body").t(invite));
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
        processInvitation(participant.name, participant.jid, invite.room, invite.autoaccept);
    }
    else

    if (invite.offerer == pade.domain)
    {
        processInvitation("Administrator", "admin@"+pade.domain, invite.room, invite.autoaccept);
    }
    else {
        processInvitation("Unknown User", invite.offerer, invite.room);
    }
}

function processInvitation(title, label, room, autoaccept)
{
    //console.log("processInvitation", title, label, room);

    if (!autoaccept || autoaccept != "true")
    {
        startTone("Diggztone_Vibe");

        notifyText(title, label, null, [{title: "Accept Pade - Openfire Meeting?", iconUrl: chrome.extension.getURL("success-16x16.gif")}, {title: "Reject Pade - Openfire Meeting?", iconUrl: chrome.extension.getURL("forbidden-16x16.gif")}], function(notificationId, buttonIndex)
        {
            //console.log("handleAction callback", notificationId, buttonIndex);

            if (buttonIndex == 0)   // accept
            {
                stopTone();
                acceptCall(title, label, room);
            }
            else

            if (buttonIndex == 1)   // reject
            {
                stopTone();
            }

        }, room);

        // jabra
        pade.activeRoom = {title: title, label: label, room: room};
        sendToJabra("ring");        

    } else {
        acceptCall(title, label, room);
    }
}

function acceptCall(title, label, room)
{
    //console.log("acceptCall", title, label, room);

    if (isAudioOnly())
    {
        joinAudioCall(title, label, room);

    } else {
        openVideoWindow(room);
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
        console.log("sendToJabra " + message);
        pade.jabraPort.postMessage({ message: message });
    }
}

function isAudioOnly()
{
    return getSetting("audioOnly", false);
}

function clearNotification(room)
{
    chrome.notifications.clear(room, function(wasCleared)
    {
        console.log("notification cleared", room, wasCleared);
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

function getSetting(name, defaultValue)
{
    console.log("getSetting", name, defaultValue);

    var value = defaultValue;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);

    } else {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }

    return value;
}