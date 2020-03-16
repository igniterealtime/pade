var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
var __origins = {};

window.addEventListener("unload", function()
{
    console.debug("inverse addListener unload");
    setSetting("chatWindow", {top: window.screenTop, left: window.screenLeft, width: window.outerWidth, height: window.outerHeight});
});

window.addEventListener("load", function()
{
    console.debug("inverse addListener load");

    // Temp hack to spped up converse by clearing localStorage
    // TODO fix this

    if (getSetting("clearCacheOnConnect", false))
    {
        let savedSettings = {};
        console.debug("clearCacheOnConnect, old size", localStorage.length);

        for (var i = 0; i < localStorage.length; i++)
        {
            if (localStorage.key(i).startsWith("store.settings."))
            {
                const key = localStorage.key(i);
                savedSettings[key] = localStorage.getItem(localStorage.key(i));
                console.debug("clearCacheOnConnect, saving", key, savedSettings[key]);
            }
        }

        localStorage.clear();

        const keys = Object.getOwnPropertyNames(savedSettings);

        for (var i=0; i<keys.length; i++)
        {
            localStorage[keys[i]] = savedSettings[keys[i]];
            console.debug("clearCacheOnConnect, restoring", keys[i], savedSettings[keys[i]]);
        }

        console.debug("clearCacheOnConnect, new size", localStorage.length);
    }

    BrowserDetect.init();

    var anonUser = getSetting("useAnonymous", false);
    var username = getSetting("username");
    var password = getSetting("password");
    var server = getSetting("server", location.host);

    var doBasicAuth = function()
    {
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
    }

    if (chrome.pade)    // browser mode
    {
        setDefaultSetting("useWebsocket", false);
        setDefaultSetting("useBasicAuth", false);
        setDefaultSetting("ofmeetUrl", "https://" + server + "/ofmeet/");

        setDefaultSetting("server", location.host);
        setDefaultSetting("domain", location.hostname);

        parent.getCredentials(function(credential)
        {
            if (credential)
            {
                username = credential.id;
                password = credential.password;

                doConverse(server, username, password, anonUser);
            }
            else {
                doBasicAuth();
            }
        });
    }
    else {
        doBasicAuth();
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
    console.debug("doConverse", server, username, anonUser);

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

    if (bgWindow && bgWindow.pade && bgWindow.pade.chatWindow)
    {
        if (url && (url.indexOf("im:") == 0) && window.location.hash == "")
        {
            var jid = url.substring(3);
            if (jid.indexOf("@") == -1 && domain != null) jid = jid + "@" + domain;

            chrome.extension.getViews({windowId: bgWindow.pade.chatWindow.id})[0].openChat(jid);
            chrome.windows.update(bgWindow.pade.chatWindow.id, {focused: true});
            window.close();
        }
        else

        if (url && (url.indexOf("xmpp:") == 0) && window.location.hash == "")
        {
            jid = url.substring(5);
            if (jid.indexOf("@") == -1 && domain != null) jid = jid + "@" + "conference." + domain;

            chrome.extension.getViews({windowId: bgWindow.pade.chatWindow.id})[0].openGroupChat(jid);
            chrome.windows.update(bgWindow.pade.chatWindow.id, {focused: true});
            window.close();
        }
    }
    else {

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
    }

    if (server)
    {
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

        if (getSetting("useWebsocket", false))
        {
            connUrl = getSetting("websocketUri", "wss://" + server + "/ws/");
        }

        var whitelistedPlugins = ["paderoot", "search", "directory", "invite", "webmeet", "pade", "vmsg", "payments", "gateway"];
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

        if (getSetting("enableIrma", false))
        {
            whitelistedPlugins.push("irma");
        }

        if (!getSetting("enableSip", false) && getSetting("enableAudioConfWidget", false))
        {
           whitelistedPlugins.push("audioconf");
        }

        if (chrome.pade && getSetting("wgEnabled", false))
        {
            whitelistedPlugins.push("fastpath");
        }

        var config =
        {
          allow_bookmarks: true,
          allow_chat_pending_contacts: true,
          allow_logout: false,
          allow_message_corrections: 'all',
          allow_muc_invitations: true,
          allow_non_roster_messaging: getSetting("allowNonRosterMessaging", true),
          allow_public_bookmarks: true,
          archived_messages_page_size: getSetting("archivedMessagesPageSize", 51),
          authentication: anonUser ? "anonymous" : "login",
          auto_away: 0, //autoAway,
          auto_join_on_invite: getSetting("autoJoinOnInvite", false),
          auto_join_private_chats: autoJoinPrivateChats,
          auto_join_rooms: autoJoinRooms,
          auto_list_rooms: getSetting("autoListRooms", true),
          auto_login: username != null || anonUser,
          auto_reconnect: getSetting("autoReconnectConverse", true),
          auto_subscribe: getSetting("autoSubscribe", false),
          auto_xa: 0, //autoXa,
          bosh_service_url: getSetting("boshUri", "https://" + server + "/http-bind/"),
          clear_messages_on_reconnection: getSetting("clearCacheOnConnect", false),
          loglevel: getSetting("converseDebug", false) ? "debug" : "info",
          default_domain: domain,
          default_state: getSetting("converseOpenState", "online"),
          domain_placeholder: domain,
          fullname: displayname,
          hide_offline_users: getSetting("hideOfflineUsers", false),
          hide_open_bookmarks: true,
          i18n: getSetting("language", "en"),
          jid : anonUser ? domain : username + "@" + domain,
          locked_domain: domain,
          message_archiving: "always",
          message_carbons: getSetting("messageCarbons", true),
          muc_domain: "conference." + getSetting("domain", null),
          muc_history_max_stanzas: getSetting("archivedMessagesPageSize", 51),
          muc_fetch_members: getSetting("fetchMembersList", false),
          muc_nickname_from_jid: getSetting("autoCreateNickname", false),
          muc_show_join_leave: getSetting("showGroupChatStatusMessages", true),
          muc_show_join_leave_status: getSetting("showGroupChatStatusMessages", true),
          muc_mention_autocomplete_filter: getSetting("converseAutoCompleteFilter", "starts_with"),
          nickname: displayname,
          notification_icon: '../image.png',
          notify_all_room_messages: getSetting("notifyAllRoomMessages", false),
          password: anonUser ? null : password,
          play_sounds: getSetting("conversePlaySounds", false),
          priority: 0,
          roster_groups: getSetting("rosterGroups", false),
          show_chatstate_notifications: false,
          show_controlbox_by_default: false,
          show_desktop_notifications: false,
          show_message_load_animation: false,
          show_send_button: getSetting("showSendButton", false),
          sounds_path: chrome.runtime.getURL('inverse/sounds/'),
          theme: 'concord',
          singleton: (autoJoinRooms && autoJoinRooms.length == 1),
          view_mode: viewMode,
          visible_toolbar_buttons: {'emoji': true, 'call': getSetting("showToolbarIcons", true) && getSetting("enableAudioConfWidget", false), 'clear': true },
          webinar_invitation: getSetting("webinarInvite", 'Please join webinar at'),
          webmeet_invitation: getSetting("ofmeetInvitation", 'Please join meeting at'),
          websocket_url: connUrl,
          enable_smacks: !getSetting("useWebsocket"), // TODO Fix Openfire websockets stream mgmt issues
          whitelisted_plugins: whitelistedPlugins
        };

        console.debug("converse.initialize", config);

        converse.plugins.add("paderoot", {
            dependencies: [],

            initialize: function () {
                _converse = this._converse;
                window._inverse = _converse;
                window.inverse = converse;

                if (getSetting("useClientCert", false))
                {
                    console.debug("useClientCert enabled");

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
                            console.debug("strophe plugin: externalsasl enabled");
                        }
                    });
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
                                console.debug("Strophe.SASLOFChat", token);
                                return token;
                            };

                            connection.mechanisms[converse.env.Strophe.SASLOFChat.prototype.name] = converse.env.Strophe.SASLOFChat;
                            console.debug("strophe plugin: ofchatsasl enabled");
                        }
                    });
                }
            }

        });
        converse.initialize( config );
    }
}

function openChat(from, name, groups, closed)
{
    if (_inverse && _inverse.roster)
    {
        if (!groups) groups = [];

        if (!name)
        {
            name = from.split("@")[0];
            if (name.indexOf("sms-") == 0) name = name.substring(4);
        }

        var contact = _inverse.roster.findWhere({'jid': from});

        if (!contact)
        {
          _inverse.roster.create({
            'nickname': name,
            'groups': groups,
            'jid': from,
            'subscription': 'both'
          }, {
            sort: false
          });
        }

        if (!closed) _inverse.api.chats.open(from);

        if (_inverse.connection.injectMessage)
        {
            _inverse.connection.injectMessage('<presence to="' + _inverse.connection.jid + '" from="' + from + '"/>');
        }
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

function openGroupChat(jid, label, nick, props)
{
    console.debug("openGroupChat", jid, label, nick, props);

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
    }
}

function handleActiveConversations()
{
    console.debug("handleActiveConversations");

    const roomDiv = document.getElementById("chatrooms");
    const chatDiv = document.getElementById("converse-roster");
    let activeDiv = document.getElementById("active-conversations");

    if (roomDiv && _inverse)
    {
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

            _inverse.chatboxes.models.sort(compare).forEach(function (chatbox)
            {
                addActiveConversation(chatbox, activeDiv);
            });

        } else {
            roomDiv.style.display = "";
            if (chatDiv) chatDiv.style.display = "";
            if (activeDiv) roomDiv.parentElement.removeChild(activeDiv);
        }
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
    if (_inverse && chatbox.vcard)
    {
        console.debug("addActiveConversation", chatbox);

        const panel = document.getElementById("pade-active-" + chatbox.get('box_id'));

        if (panel)
        {
            activeDiv.removeChild(panel.parentElement);
        }

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
        if (display_name.indexOf("@") > -1) display_name = display_name.split("@")[0];

        let dataUri = "data:" + chatbox.vcard.attributes.image_type + ";base64," + chatbox.vcard.attributes.image;

        if (_inverse.DEFAULT_IMAGE == chatbox.vcard.attributes.image)
        {
            dataUri = createAvatar(display_name, null, null, null, null);
        }
        else {
            setAvatar(display_name, dataUri);
        }

        msg_content.innerHTML = '<span id="pade-badge-' + id + '" class="pade-badge" data-badge="' + numUnread + '"><img class="avatar" src="' + dataUri + '" style="width: 22px; width: 22px; height: 100%; margin-right: 10px;"/></span><span title="' + newMessage + '" data-label="' + display_name + '" data-jid="' + jid + '" data-type="' + chatType + '" id="pade-active-' + id +'" class="pade-active-conv">' + display_name + '</span><a href="#" id="pade-active-conv-close-' + id +'" data-jid="' + jid + '" class="pade-active-conv-close fa fa-times"></a>';
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
                    if (type == "chat") _inverse.api.chats.open(jid);
                    else
                    if (type == "groupchat") _inverse.api.rooms.open(jid);
                }

                _inverse.chatboxes.each(function (chatbox)
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
                const view = _inverse.chatboxviews.get(jid);

                if (view) view.close();

            }, false);
        }
    }
}

function setAvatar(nickname, avatar)
{
    if (bgWindow) bgWindow.setAvatar(nickname, avatar);
}

function createAvatar(nickname, width, height, font, force, jid)
{
    if (_inverse && _inverse.vcards)
    {
        let vcard = _inverse.vcards.findWhere({'jid': nickname});
        if (!vcard && jid) vcard = _inverse.vcards.findWhere({'jid': jid});
        if (!vcard) vcard = _inverse.vcards.findWhere({'nickname': nickname});

        if (vcard && vcard.get('image') && _inverse.DEFAULT_IMAGE != vcard.get('image')) return "data:" + vcard.get('image_type') + ";base64," + vcard.get('image');
    }

    if (bgWindow) return bgWindow.createAvatar(nickname, width, height, font, force);
}

function __newElement(el, id, html, className)
{
    const ele = document.createElement(el);
    if (id) ele.id = id;
    if (html) ele.innerHTML = html;
    if (className) ele.classList.add(className);
    document.body.appendChild(ele);
    return ele;
}

function addToolbarItem (view, id, label, html)
{
    if (document.getElementById(label)) return null;

    let placeHolder = view.el.querySelector('#place-holder');

    if (!placeHolder)
    {
        const toolbar = view.el.querySelector('.chat-toolbar');
        toolbar.appendChild(__newElement('li', 'place-holder'));
        placeHolder = view.el.querySelector('#place-holder');
    }
    const newEle = __newElement('li', label, html);
    placeHolder.insertAdjacentElement('afterEnd', newEle);
    return newEle;
}

function occupantAvatarClicked(ev, view)
{
    const jid = ev.target.getAttribute('data-room-jid');
    const nick = ev.target.getAttribute('data-room-nick');

    if (_inverse && jid && converse.env.Strophe.getNodeFromJid(jid) && _inverse.bare_jid != jid)
    {
         _inverse.api.chats.open(jid, {nickname: nick, fullname: nick}).then(chat => {
             if (!chat.vcard.attributes.fullname) chat.vcard.set('fullname', nick);
             if (!chat.vcard.attributes.nickname) chat.vcard.set('nickname', nick);
         });
    }
}

function loadJS(name)
{
    var s1 = document.createElement('script');
    s1.src = name;
    s1.async = false;
    document.body.appendChild(s1);
}

function loadCSS(name)
{
    var head  = document.getElementsByTagName('head')[0];
    var link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = name;
    head.appendChild(link);
}
