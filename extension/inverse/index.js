window.addEventListener("unload", function()
{
    console.debug("inverse addListener unload");
    setSetting("chatWindow", {top: window.screenTop, left: window.screenLeft, width: window.outerWidth, height: window.outerHeight});
});

window.addEventListener("load", function()
{
    console.debug("inverse addListener load");

    BrowserDetect.init();

    if (chrome.pade)    // browser mode
    {
        setDefaultSetting("useBasicAuth", true);
        setDefaultSetting("ofmeetUrl", "https://" + location.host + "/ofmeet/");

        setSetting("server", location.host);
        setSetting("domain", location.hostname);

    }

    var server = getSetting("server");
    var username = getSetting("username");
    var password = getSetting("password");
    var anonUser = getSetting("useAnonymous", false);

    if (getSetting("useBasicAuth", false))
    {
        fetch("https://" + server + "/dashboard/token.jsp", {method: "GET"}).then(function(response){ return response.json()}).then(function(token)
        {
            username = token.username;
            password = token.password;

            doConverse(server, username, password, false);

        }).catch(function (err) {
            console.error('access denied error', err);

            doConverse(server, username, password, true);
        });

    }
    else {
        doConverse(server, username, password, anonUser);
    }
});

window.addEventListener('message', function (event)
{
    //console.debug("inverse addListener message", event.data);

    if (event.data && event.data.action)
    {
        if (event.data.action == "pade.action.open.chat") openChat(event.data.from, event.data.name);
        if (event.data.action == "pade.action.open.chat.panel") openChatPanel(event.data.from);
        if (event.data.action == "pade.action.open.group.chat") openGroupChat(event.data.jid, event.data.label, event.data.nick, event.data.properties);
    }
});

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

function doConverse(server, username, password, anonUser)
{
    console.log("doConverse", server, username, password, anonUser);

    function getUniqueID()
    {
        return Math.random().toString(36).substr(2, 9);
    }

    function urlParam(name)
    {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (!results) { return undefined; }
        return unescape(results[1] || undefined);
    };

    var url = urlParam("url");
    var domain = getSetting("domain", null);

    if (url && (url.indexOf("im:") == 0 || url.indexOf("xmpp:") == 0) && window.location.hash == "")
    {
        var href = "index.html#converse/chat?jid=" + url.substring(3);
        if (url.indexOf("xmpp:") == 0) href = "index.html#converse/room?jid=" + url.substring(5);

        if (href.indexOf("@") == -1 && domain != null)
        {
            href = href + "@" + (url.indexOf("xmpp:") == 0 ? "conference." + domain : domain);
        }


        location.href = href;
    }

    if (getSetting("useTotp", false) || getSetting("useWinSSO", false) || getSetting("useCredsMgrApi", false) || getSetting("useSmartIdCard", false))
    {
        converse.env.Strophe.addConnectionPlugin('ofchatsasl',
        {
            init: function (connection)
            {
                converse.env.Strophe.SASLOFChat = function () { };
                converse.env.Strophe.SASLOFChat.prototype = new converse.env.Strophe.SASLMechanism("OFCHAT", true, 2000);

                converse.env.Strophe.SASLOFChat.test = function (connection)
                {
                    return getSetting("password", null) !== null;
                };

                converse.env.Strophe.SASLOFChat.prototype.onChallenge = function (connection)
                {
                    var token = getSetting("username", null) + ":" + getSetting("password", null);
                    console.log("Strophe.SASLOFChat", token);
                    return token;
                };

                connection.mechanisms[converse.env.Strophe.SASLOFChat.prototype.name] = converse.env.Strophe.SASLOFChat;
                console.log("strophe plugin: ofchatsasl enabled");
            }
        });
    }

    if (getSetting("useClientCert", false))
    {
        console.log("useClientCert enabled");

        converse.env.Strophe.addConnectionPlugin('externalsasl',
        {
            init: function (connection)
            {
                converse.env.Strophe.SASLExternal = function() {};
                converse.env.Strophe.SASLExternal.prototype = new converse.env.Strophe.SASLMechanism("EXTERNAL", true, 2000);

                converse.env.Strophe.SASLExternal.test = function (connection)
                {
                    return connection.authcid !== null;
                };

                converse.env.Strophe.SASLExternal.prototype.onChallenge = function(connection)
                {
                    return connection.authcid === connection.authzid ? '' : connection.authzid;
                };

                connection.mechanisms[converse.env.Strophe.SASLExternal.prototype.name] = converse.env.Strophe.SASLExternal;
                console.log("strophe plugin: externalsasl enabled");
            }
        });
    }

    if (server)
    {
        var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
        var domain = getSetting("domain", null);
        var displayname = getSetting("displayname", username);

        var autoJoinRooms = undefined;
        var autoJoinPrivateChats = undefined;

        var tempRooms = getSetting("autoJoinRooms", "").split("\n");

        if (tempRooms.length > 0)
        {
            autoJoinRooms = [];

            for (var i=0; i<tempRooms.length; i++)
            {
                if (tempRooms[i])
                {
                    autoJoinRooms.push({jid: tempRooms[i].indexOf("@") == -1 ? tempRooms[i].trim() + "@conference." + domain : tempRooms[i], nick: displayname});
                }
            }
        }
        var tempJids = getSetting("autoJoinPrivateChats", "").split("\n");

        if (tempJids.length > 0)
        {
            autoJoinPrivateChats = [];

            for (var i=0; i<tempJids.length; i++)
            {
                if (tempJids[i]) autoJoinPrivateChats.push(tempJids[i].indexOf("@") == -1 ? tempJids[i].trim() + "@" + domain : tempJids[i].trim());
            }
        }

        var autoAway = getSetting("idleTimeout", 300);
        var autoXa = autoAway * 3;

        var connUrl = undefined;

        if (getSetting("useWebsocket", true))
        {
            connUrl = "wss://" + server + "/ws/";
        }

        var whitelistedPlugins = ["search", "directory", "invite", "webmeet", "pade", "vmsg", "payments"];
        var viewMode = chrome.pade ? 'fullscreen' : (window.pade ? 'overlayed' : 'fullscreen');

        if (getSetting("enableHomePage", false))
        {
            viewMode = 'overlayed';
            document.getElementById("pade-home-page").src = getSetting("homePage", chrome.runtime.getManifest().homepage_url)
        }

        if (getSetting("enableInfoPanel", false))
        {
            whitelistedPlugins.push("info");
        }

        if (getSetting("useMarkdown", true))
        {
            if (!chrome.pade) whitelistedPlugins.push("markdown");
        }

        if (getSetting("enableCannedResponses", false))
        {
            whitelistedPlugins.push("canned");
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
          auto_away: autoAway,
          auto_xa: autoXa,
          auto_list_rooms: getSetting("autoListRooms", true),
          auto_login: username != null || anonUser,
          auto_reconnect: getSetting("autoReconnect", true),
          auto_subscribe: getSetting("autoSubscribe", false),
          auto_join_on_invite: getSetting("autoJoinOnInvite", false),
          bosh_service_url: "https://" + server + "/http-bind/",
          debug: getSetting("converseDebug", false),
          default_domain: domain,
          default_state: getSetting("converseOpenState", "online"),
          domain_placeholder: domain,
          fullname: displayname,
          hide_open_bookmarks: true,
          hide_offline_users: getSetting("hideOfflineUsers", false),
          i18n: getSetting("language", "en"),
          jid : anonUser ? domain : username + "@" + domain,
          locked_domain: domain,
          //message_archiving: "always",
          message_carbons: getSetting("messageCarbons", true),
          muc_domain: "conference." + getSetting("domain", null),
          muc_history_max_stanzas: getSetting("archivedMessagesPageSize", 51),
          muc_nickname_from_jid: false,
          muc_show_join_leave: getSetting("showGroupChatStatusMessages", true),
          nickname: displayname,
          notify_all_room_messages: getSetting("notifyAllRoomMessages", false),
          notification_icon: '../image.png',
          webmeet_invitation: getSetting("ofmeetInvitation", 'Please join meeting at'),
          webinar_invitation: getSetting("webinarInvite", 'Please join webinar at'),
          password: anonUser ? null : password,
          play_sounds: getSetting("conversePlaySounds", false),
          priority: 0,
          roster_groups: getSetting("rosterGroups", false),
          show_controlbox_by_default: false,
          show_message_load_animation: false,
          show_desktop_notifications: false,
          show_chatstate_notifications: false,
          show_only_online_users: getSetting("converseShowOnlyOnlineUsers", false),
          show_send_button: getSetting("showSendButton", false),
          sounds_path: 'sounds/',
          view_mode: viewMode,
          visible_toolbar_buttons: {'emoji': true, 'call': getSetting("enableSip", false), 'clear': true },
          websocket_url: connUrl,
          theme: 'concord',
          whitelisted_plugins: whitelistedPlugins
        };

        console.log("converse.initialize", config);
        converse.initialize( config );
    }
}

function openChat(from, name)
{
    if (_inverse)
    {
        if (!name)
        {
            name = from.split("@")[0];
            if (name.indexOf("sms-") == 0) name = name.substring(4);
        }

        var contact = _converse.roster.findWhere({'jid': from});
        if (!contact) _inverse.roster.addAndSubscribe(from, name);
        _inverse.api.chats.open(from);
    }
}

function openChatPanel(from)
{
    if (_inverse) _inverse.api.chats.open(from);
}

function getChatPanel(from)
{
    if (_inverse) return _inverse.api.chats.get(from);
}

function getSelectedChatBox()
{
    var views = _inverse.chatboxviews.model.models;
    var view = null;

    console.debug("getSelectedChatBox", views);

    for (var i=0; i<views.length; i++)
    {
        if ((views[i].get('type') === "chatroom" || views[i].get('type') === "chatbox") && !views[i].get('hidden'))
        {
            view = _inverse.chatboxviews.views[views[i].id];
            break;
        }
    }
    return view;
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

function openGroupChat(jid, label, nick, props, message, nickname, userJid)
{
    console.debug("openGroupChat", jid, label, nick, props, message, nickname, userJid);

    if (_inverse)
    {
        if (!props) props = {name: label, nick: nick};

        _inverse.api.rooms.open(jid, props);

        if (props.question)
        {
            setTimeout(function()
            {
                _inverse.connection.send(inverse.env.$msg({
                    to: jid,
                    from: _inverse.connection.jid,
                    type: "groupchat"
                }).c("subject", {
                    xmlns: "jabber:client"
                }).t(props.question).tree());

            }, 1000);
        }

        if (message)
        {
            setTimeout(function()
            {
                const view = _converse.chatboxviews.get(jid);

                if (view)
                {
                    const msg = view.model.getOutgoingMessageAttributes(message);

                    if (nickname)
                    {
                        msg.fullname = nickname;
                        msg.nick = nickname;
                    }

                    if (jid) msg.from = jid;
                    view.model.messages.create(msg);
                }

            }, 1000);
        }
    }
}

function handleActiveConversations()
{
    console.debug("handleActiveConversations");

    const roomDiv = document.getElementById("chatrooms");
    const chatDiv = document.getElementById("converse-roster");
    let activeDiv = document.getElementById("active-conversations");

    let display = roomDiv.style.display;

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

        _converse.chatboxes.each(function (chatbox)
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
        const openButton = document.getElementById("pade-active-" + chatbox.model.get('box_id'));

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
        msg_content.setAttribute("class", "message chat-msg pade-active-panel "  + chatType);

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

        const openButton = document.getElementById("pade-active-" + id);
        const openBadge = document.getElementById("pade-badge-" + id);

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
                    const itemLabel = document.getElementById("pade-active-" + itemId);
                    if (itemLabel) itemLabel.style.fontWeight = "normal";
                });

                this.innerHTML = label;
                this.style.fontWeight = "bold";

                if (openBadge) openBadge.setAttribute("data-badge", "0");

            }, false);
        }

        const closeButton = document.getElementById("pade-active-conv-close-" + id);

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

var avatars = {}

if (chrome.storage)
{
    chrome.storage.local.get('avatars', function(data) {
      if (data && data.avatars) avatars = data.avatars;
      //console.debug('chrome.storage get', avatars);
    });
}

function setAvatar(nickname, avatar)
{
    if (nickname && !avatars[nickname])
    {
       nickname = nickname.toLowerCase();
       avatars[nickname] = avatar;

        if (chrome.storage)
        {
            chrome.storage.local.set({avatars: avatars}, function() {
              //console.debug('chrome.storage is set for ' + nickname, avatars);
            });
        }
    }
}

function createAvatar(nickname, width, height, font)
{
    nickname = nickname.toLowerCase();

    if (avatars[nickname])
    {
        return avatars[nickname];
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

    var first, last;
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

    avatars[nickname] = canvas.toDataURL();

    if (chrome.storage)
    {
        chrome.storage.local.set({avatars: avatars}, function() {
          //console.debug('chrome.storage is set for ' + nickname, avatars);
        });
    }
    return avatars[nickname];
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