var pade = {}
var callbacks = {}

window.addEventListener("beforeunload", function ()
{
    if (pade.videoWindow) chrome.windows.remove(pade.videoWindow.id);
    if (pade.connection) pade.connection.disconnect();
});


window.addEventListener("unload", function ()
{
	if (pade.connection) pade.connection.disconnect();
});

window.addEventListener("load", function()
{
    console.log("loaded");

    chrome.contextMenus.removeAll();

    chrome.contextMenus.create({id: "pade_conversations", title: "Meetings", contexts: ["browser_action"]});

    chrome.runtime.onConnect.addListener(function(port)
    {
        //console.log("popup connect");
        pade.popup = true;
        pade.port = port;

        port.onMessage.addListener(function(msg)
        {
            if (msg.action == "pade.invite.contact")
            {
				inviteToConference()
            }

            if (msg.event == "pade.popup.open")
            {
				stopTone();
			}
        });

        port.onDisconnect.addListener(function()
        {
            //console.log("popup disconnect");
            pade.popup = false;
            pade.port = null;
        });
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
        doOptions();
    });

    chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex)
    {
        var callback = callbacks[notificationId];

        if (callback)
        {
            callback(notificationId, buttonIndex);

            chrome.notifications.clear(notificationId, function(wasCleared)
            {
                callbacks[notificationId] = null;
                delete callbacks[notificationId];
            });
        }
    });

    chrome.windows.onRemoved.addListener(function(win)
    {
        //console.log("closing window ", win);

        if (pade.videoWindow && win == pade.videoWindow.id)
        {
            pade.videoWindow = null;
        }
    });

    if (window.localStorage["store.settings.server"] && window.localStorage["store.settings.domain"] && window.localStorage["store.settings.username"] && window.localStorage["store.settings.password"])
    {
        pade.server = JSON.parse(window.localStorage["store.settings.server"]);
        pade.domain = JSON.parse(window.localStorage["store.settings.domain"]);
        pade.username = JSON.parse(window.localStorage["store.settings.username"]);
        pade.password = JSON.parse(window.localStorage["store.settings.password"]);
        pade.jid = pade.username + "@" + pade.domain;

        chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
        chrome.browserAction.setBadgeText({ text: 'off' });


        if (pade.server && pade.domain && pade.username && pade.password)
        {
            if (window.localStorage["store.settings.enableSip"] && JSON.parse(window.localStorage["store.settings.enableSip"]))
            {
                pade.enableSip = true;
            }

            pade.connection = new Strophe.Connection("wss://" + pade.server + "/ws/");
            //pade.connection = new Strophe.Connection("https://" + pade.server + "/http-bind/");

            pade.connection.connect(pade.username + "@" + pade.domain + "/" + pade.username, pade.password, function (status)
            {
                if (status === Strophe.Status.CONNECTED)
                {
					chrome.browserAction.setBadgeText({ text: "" });
                    pade.connection.send($pres());

					pade.presence = {};
					pade.participants = {};

					fetchContacts(function(contact)
					{
						handleContact(contact);
					});
                }
                else

                if (status === Strophe.Status.DISCONNECTED)
                {
					chrome.browserAction.setBadgeText({ text: "off" });
				}

            });

        } else doOptions();

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

	} else {
		pade.participants[contact.jid] = contact;
		chrome.contextMenus.create({parentId: "pade_conversations", type: "radio", id: contact.jid, title: contact.name + " - " + contact.presence, contexts: ["browser_action"],  onclick: handleContactClick});

		// set default
		if (contact.id == 0 && contact.type == "room") pade.activeContact = contact;
	}
}

function handleContactClick(info)
{
	console.log("handleContactClick", info, pade.participants[info.menuItemId]);
	pade.activeContact = pade.participants[info.menuItemId];
}

function handleUrlClick(info)
{
	console.log("handleUrlClick", info);
	pade.activeUrl = info.menuItemId;
}

function reloadApp()
{
    chrome.runtime.reload();
}

function startTone(name)
{
    if (window.localStorage["store.settings.enableRingtone"] && JSON.parse(window.localStorage["store.settings.enableRingtone"]))
    {
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

function closeVideoWindow()
{
    if (pade.videoWindow != null)
    {
        chrome.windows.remove(pade.videoWindow.id);
        pade.videoWindow = null;
    }
}

function openVideoWindow(room)
{
    if (pade.videoWindow != null)
    {
        chrome.windows.remove(pade.videoWindow.id);
    }
    var url = chrome.extension.getURL("jitsi-meet/chrome.index.html?room=" + room);

	chrome.windows.create({url: url, width: 800, height: 600, focused: true, type: "popup"}, function (win)
	{
		pade.videoWindow = win;
		chrome.windows.update(pade.videoWindow.id, {drawAttention: true});
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

function fetchContacts(callback)
{
	pade.connection.addHandler(function(presence)
	{
		var to = $(presence).attr('to');
		var type = $(presence).attr('type');
		var from = Strophe.getBareJidFromJid($(presence).attr('from'));

		//console.log("presence handler", from, to, type);

        var pres = "online";
        if (type == "unavailable") pres = "offline";
        pade.presence[from] = pres;

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

		//console.log("message handler", from, to, type)

		$(message).find('body').each(function ()
		{
			var body = $(this).text();
			var pos1 = body.indexOf("/ofmeet/");
			var pos2 = body.indexOf("https://" + pade.server)

            if ( pos1 > 0 && pos2 > 0 )
            {
				offerer = Strophe.getBareJidFromJid(from);
				room = body.substring(pos1 + 6);
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

				handleInvitation({room: room, offerer: offerer});
			}
		});

		return true;

	}, null, 'message');


	pade.connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:private"}).c("storage", {xmlns: "storage:bookmarks"}).tree(), function(resp)
	{
		//console.log("get bookmarks", resp)

		var count = 0;

		$(resp).find('conference').each(function()
		{
			var jid = $(this).attr("jid");
			var room = Strophe.getNodeFromJid(jid);
			var muc = Strophe.getDomainFromJid(jid);
			var domain = muc.substring("conference.".length);           // ignore "conference."

			//console.log('ofmeet.bookmark.conference.item', {name: $(this).attr("name"), jid: $(this).attr("jid"), autojoin: $(this).attr("autojoin")});

			if (callback) callback(
			{
				id: count++,
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

		count = 0;

		$(resp).find('url').each(function()
		{
			//console.log('ofmeet.bookmark.url.item', {name: $(this).attr("name"), url: $(this).attr("url")});

			if (callback) callback(
			{
				id: count++,
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
		var count = 0;

		$(resp).find('item').each(function()
		{
			var jid = $(this).attr("jid");
			var node = Strophe.getNodeFromJid(jid);
			var name = $(this).attr("name");
			var domain = Strophe.getDomainFromJid(jid);

			//console.log('ofmeet.roster.item',jid, name);

			if (callback) callback(
			{
				id: count++,
				type: "person",
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

		console.log("get vcard", img_src);

		if (img_src != 'data:;base64,')
		{
			pade.avatar = img_src;
		}

	}, function (error) {
		console.error(error);
	});

}

function inviteToConference()
{
	console.log("inviteToConference", pade.activeContact);

	try {
		var invite = "Please join me in https://" + pade.server + "/ofmeet/" + pade.activeContact.room;
		pade.connection.send($msg({type: "chat", to: pade.activeContact.jid}).c("body").t(invite));
	} catch (e) {
		console.error(e);
	}
}

function handleInvitation(invite)
{
	var jid = Strophe.getBareJidFromJid(invite.offerer);

	if (pade.participants[jid])
	{
		var participant = pade.participants[jid];
		console.log("handleInvitation", participant);

		startTone("Diggztone_Vibe");

		notifyText(participant.name, participant.jid, null, [{title: "Accept Pade - Openfire Meeting?", iconUrl: chrome.extension.getURL("success-16x16.gif")}, {title: "Reject Pade - Openfire Meeting?", iconUrl: chrome.extension.getURL("forbidden-16x16.gif")}], function(notificationId, buttonIndex)
		{
			console.log("handleAction callback", notificationId, buttonIndex);

			if (buttonIndex == 0)   // accept
			{
				openVideoWindow(invite.room);
				stopTone();
			}
			else

			if (buttonIndex == 1)   // reject
			{
				stopTone();
			}

		}, invite.room);

	} else {
		console.log("invitation from unknown source", invite);
	}
}

