var padeapi = (function(api)
{
    var background = chrome.extension.getBackgroundPage();
    var nickColors = {}, anonRoster = {}, callbacks = {};
    var Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs, _converse;

    var paderoot = {
        participants: {},
        presence: {},
        tasks: {},
        sip: {},
        autoJoinRooms: {},
        autoJoinPrivateChats: {},
        gmailWindow: [],
        webAppsWindow: {},
        vcards: {},
        questions: {},
        collabDocs: {},
        collabList: [],
        userProfiles: {},
        fastpath: {},
        geoloc: {},
        ohun: {},
        transferWise: {}
    }

    var doneIt = false;

    window.addEventListener("unload", function()
    {
        console.debug("inverse addListener unload");
        setSetting("chatWindow", {top: window.screenTop, left: window.screenLeft, width: window.outerWidth, height: window.outerHeight});
        delete window["padeapi"];
    });

    window.addEventListener("load", function()
    {
        console.debug("inverse addListener load");

        // Temp hack to speed up converse by clearing localStorage
        // TODO fix this

        if (getSetting("clearCacheOnConnect", false))
        {
            const deleteList = [];
            console.debug("clearCacheOnConnect, old size", localStorage.length);

            for (var i = 0; i < localStorage.length; i++)
            {
                if (localStorage.key(i).includes("/converse.messages-"))
                {
                    deleteList.push(localStorage.key(i));
                }
            }
            deleteList.forEach(function(key) {localStorage.removeItem(key)});
            console.debug("clearCacheOnConnect, new size", localStorage.length);
        }

        BrowserDetect.init();

        if (window.mermaid) mermaid.initialize({});

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
        }

        doBasicAuth();
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


    BrowserDetect = {
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

    var whitelistedPlugins = ["paderoot"];
    loadCSS("css/font-awesome.min.css");
    loadCSS("plugins/css/pade.css");
    loadCSS("plugins/css/marked.css");

    loadJS("plugins/libs/marked.js");
    loadJS("plugins/libs/marked-forms.js");
    loadJS("plugins/libs/abcjs_basic.js");
    loadJS("plugins/libs/mermaid.min.js");
    loadJS("plugins/libs/timeago.min.js");

    if (getSetting("showToolbarIcons", false))
    {
        whitelistedPlugins = ["paderoot", "webmeet", "search", "directory", "invite", "vmsg", "payments", "ohun"];
        loadCSS("plugins/css/search.css");
        loadCSS("plugins/css/flatpickr.css");

        loadJS("plugins/libs/rss-library.js");
        loadJS("plugins/libs/hark.js");
        loadJS("../js/jquery.js");

        loadJS("plugins/payments.js");
        loadJS("plugins/search.js");
        loadJS("plugins/directory.js");
        loadJS("plugins/invite.js");
        loadJS("plugins/vmsg.js");
        loadJS("plugins/ohun.js");

        loadJS("plugins/webmeet.js");

        if (getSetting("showWordCloud", false))
        {
            loadJS("plugins/libs/d3.js");
            loadJS("plugins/libs/d3.layout.cloud.js");
            loadJS("plugins/libs/stopwords.js");
        }

        if (getSetting("enableInfoPanel", false))
        {
            whitelistedPlugins.push("info");
            loadCSS("plugins/css/info.css");
            loadJS("plugins/info.js");
        }

        if (getSetting("useMarkdown", true))
        {
            if (!chrome.pade)
            {
                whitelistedPlugins.push("markdown");
                loadJS("plugins/markdown.js");
                loadJS("plugins/libs/to-markdown.js");
                loadJS("plugins/libs/clipboard2markdown.js");
            }
        }

        if (getSetting("enableRssFeeds", false))
        {
            whitelistedPlugins.push("gateway");
            loadJS("plugins/gateway.js");
        }

        if (getSetting("enableCannedResponses", false))
        {
            whitelistedPlugins.push("canned");
            loadJS("plugins/canned.js");
        }

        if (getSetting("enableAudioConfWidget", false))
        {
           whitelistedPlugins.push("audioconf");
           loadJS("plugins/audioconf.js");
        }

        if (chrome.pade && getSetting("wgEnabled", false))
        {
            whitelistedPlugins.push("fastpath");
            loadJS("plugins/fastpath.js");
        }

        if (getSetting("enableMucDirectory", false))
        {
            whitelistedPlugins.push("muc-directory");
            loadCSS("plugins/css/muc-directory.css");
            loadJS("plugins/muc-directory.js");
        }

        if (getSetting("jingleCalls", false))
        {
            whitelistedPlugins.push("jinglecalls");
            loadJS("plugins/jinglecalls.js");
        }

        loadCSS("plugins/css/custom.css");

        loadJS("plugins/libs/paste.js");
        loadJS("plugins/libs/flatpickr.js");
        loadJS("plugins/libs/tgs-player.js");
        loadJS("plugins/libs/jspdf.debug.js");
        loadJS("plugins/libs/jspdf.plugin.autotable.js");
        loadJS("plugins/libs/tokenizer.js");
        loadJS("plugins/libs/js-summarize.js");
    }

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

        if (url && (url.indexOf("im:") == 0) && window.location.hash == "")
        {
            var jid = url.substring(3);
            if (jid.indexOf("@") == -1 && domain != null) jid = jid + "@" + domain;

            openChat(jid);
        }
        else

        if (url && (url.indexOf("xmpp:") == 0) && window.location.hash == "")
        {
            jid = url.substring(5);
            if (jid.indexOf("@") == -1 && domain != null) jid = jid + "@" + "conference." + domain;

            openGroupChat(jid);
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
            if (location.hash != "" && anonUser)
            {
                const pos1 = location.hash.indexOf("converse/room?jid=");
                if (pos1 != -1) autoJoinRooms = [{jid: location.hash.substring(pos1 + 18), nick: displayname}];

                const pos2 = location.hash.indexOf("converse/chat?jid=");
                if (pos2 != -1) autoJoinPrivateChats = [location.hash.substring(pos2 + 18)];
            }

            var autoAway = getSetting("idleTimeout", 300);
            var autoXa = autoAway * 3;

            var connUrl = undefined;

            if (getSetting("useWebsocket", false))
            {
                connUrl = getSetting("websocketUri", "wss://" + server + "/ws/");
            }

            if (getSetting("enableHomePage", false) && !location.hash)
            {
                viewMode = getSetting("homePageView", "fullscreen");
                document.getElementById("pade-home-page").src = getSetting("homePage", chrome.runtime.getManifest().homepage_url);
            }

            var viewMode = chrome.pade ? 'fullscreen' : (window.pade ? 'overlayed' : 'fullscreen');

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
              auto_login: username || anonUser,
              auto_reconnect: getSetting("autoReconnectConverse", true),
              auto_subscribe: getSetting("autoSubscribe", false),
              auto_xa: 0, //autoXa,
              bosh_service_url: getSetting("boshUri", "https://" + server + "/http-bind/"),
              clear_messages_on_reconnection: false,
              loglevel: getSetting("converseDebug", false) ? "debug" : "info",
              default_domain: domain,
              default_state: getSetting("converseOpenState", "online"),
              domain_placeholder: domain,
              fullname: displayname,
              hide_offline_users: getSetting("hideOfflineUsers", false),
              hide_open_bookmarks: true,
              i18n: getSetting("language", "en"),
              jid : anonUser ? domain : (username ? username + "@" + domain : undefined),
              locked_domain: domain,
              message_archiving: "always",
              message_carbons: getSetting("messageCarbons", true),
              muc_domain: "conference." + getSetting("domain", null),
              muc_history_max_stanzas: getSetting("archivedMessagesPageSize", 51),
              muc_fetch_members: getSetting("fetchMembersList", false),
              muc_nickname_from_jid: getSetting("autoCreateNickname", false),
              muc_show_room_info: getSetting("showGroupChatStatusMessages", false),
              muc_show_join_leave: getSetting("showGroupChatStatusMessages", false),
              muc_show_join_leave_status: getSetting("showGroupChatStatusMessages", false),
              muc_mention_autocomplete_filter: getSetting("converseAutoCompleteFilter", "starts_with"),
              nickname: displayname,
              notification_icon: '../image.png',
              notify_all_room_messages: getSetting("notifyAllRoomMessages", false),
              password: anonUser ? undefined : password,
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
              visible_toolbar_buttons: {'emoji': true, 'call': getSetting("showToolbarIcons", false) && (getSetting("enableAudioConfWidget", false) || getSetting("jingleCalls", false)), 'clear': true },
              webinar_invitation: getSetting("webinarInvite", 'Please join webinar at'),
              webmeet_invitation: getSetting("ofmeetInvitation", 'Please join meeting at'),
              websocket_url: connUrl,
              persistent_store: getSetting("conversePersistentStore", 'none'),
              trusted: getSetting("conversePersistentStore", 'none') == 'none' ? 'off' : 'on',
              enable_smacks: getSetting("enableSmacks", false),
              whitelisted_plugins: whitelistedPlugins
            };

            console.debug("converse.initialize", config);

            converse.plugins.add("paderoot", {
                dependencies: [],

                initialize: function () {
                    _converse = this._converse;
                    window._inverse = this._converse;
                    window.inverse = converse;

                    Strophe = converse.env.Strophe;
                    $iq = converse.env.$iq;
                    $msg = converse.env.$msg;
                    $pres = converse.env.$pres;
                    $build = converse.env.$build;
                    b64_sha1 = converse.env.b64_sha1;
                    _ = converse.env._;
                    Backbone = converse.env.Backbone;
                    dayjs = converse.env.dayjs;

                    if (getSetting("useGitea", false))
                    {
                        Strophe.addConnectionPlugin('giteasasl',
                        {
                            init: function (connection)
                            {
                                Strophe.SASLGitea = function () { };
                                Strophe.SASLGitea.prototype = new Strophe.SASLMechanism("GITEA", true, 2000);

                                Strophe.SASLGitea.test = function (connection)
                                {
                                    return getSetting("password", null) !== null;
                                };

                                Strophe.SASLGitea.prototype.onChallenge = function (connection)
                                {
                                    return btoa(Strophe.getNodeFromJid(connection.jid) + ":" + connection.pass);
                                };

                                connection.mechanisms[Strophe.SASLGitea.prototype.name] = Strophe.SASLGitea;
                                console.log("Gitea SASL authentication enabled");
                            }
                        });
                    }

                    document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Converse | " + this._converse.VERSION_NAME;

                    _converse.api.settings.update({
                        rai_muc_service: "conference." + getSetting("domain"),
                        rai_notification: true,
                        rai_notification_label: "Room Activity Indicator",
                        show_client_info: false
                    });

                    _converse.api.listen.on('renderToolbar', function(view)
                    {
                        console.debug('webmeet - renderToolbar', view.model);

                        view.el.querySelector('.chat-textarea').addEventListener("focus", function(evt)
                        {
                            console.debug("renderToolbar focus", evt);
                            chrome.browserAction.setBadgeBackgroundColor({ color: '#0000e1' });
                            chrome.browserAction.setBadgeText({ text: "" });
                        });

                        view.el.querySelector('.chat-textarea').addEventListener("blur", function(evt)
                        {
                            console.debug("renderToolbar blur", evt);
                            chrome.browserAction.setBadgeBackgroundColor({ color: '#0000e1' });
                            chrome.browserAction.setBadgeText({ text: "" });
                        });

                        var id = view.model.get("box_id");
                        var jid = view.model.get("jid");
                        var type = view.model.get("type");
                        var nick = view.model.getDisplayName();

                        if (getSetting("converseTimeAgo", false) && !doneIt)
                        {
                            doneIt = true; // make sure we get called only once

                            setInterval(function()
                            {
                                //console.debug("timeago render");
                                timeago.cancel();
                                var locale = navigator.language.replace('-', '_');
                                timeago.render(document.querySelectorAll('.chat-msg__time_span'), locale);
                            }, 60000);
                        }

                        var html = '<a class="fa fa-sync" title="Refresh"></a>';
                        var refresh = addToolbarItem(view, id, "webmeet-refresh-" + id, html);

                        if (refresh) refresh.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();
                            view.close();
                            setTimeout(function() { openChatbox(view); });

                        }, false);

                        html = '<a class="far fa-trash-alt" title="Trash local storage of chat history"></a>';
                        var trash = addToolbarItem(view, id, "webmeet-trash-" + id, html);

                        if (trash) trash.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();
                            view.clearMessages();

                        }, false);


                        html = '<a class="fa fa-angle-double-down" title="Scroll to the bottom"></a>';
                        var scrolldown = addToolbarItem(view, id, "webmeet-scrolldown-" + id, html);

                        if (scrolldown) scrolldown.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();
                            view.viewUnreadMessages()

                        }, false);
                    });

                    _converse.on('message', function (data)
                    {
                        var message = data.stanza;
                        var chatbox = data.chatbox;
                        var attachTo = data.stanza.querySelector('attach-to');
                        var body = message.querySelector('body');
                        var history = message.querySelector('forwarded');

                        //console.debug("pade plugin message", history, body, chatbox, message);

                        if (!history && body && chatbox)
                        {
                            var id = chatbox.get("box_id");
                            var jid = chatbox.get("jid");
                            var type = chatbox.get("type");
                            var display_name = chatbox.getDisplayName().trim();
                            if (!display_name || display_name == "") display_name = jid;

                            // draw attention to new messages
                            // done here instead of background.js becasue of chatroom messages

                            var numUnreadBox = chatbox.get("num_unread");
                            var numUnreadRoom = chatbox.get("num_unread_general");

                            if (document.hasFocus())
                            {
                                chrome.browserAction.setBadgeBackgroundColor({ color: '#0000e1' });
                                chrome.browserAction.setBadgeText({ text: "" });
                            }
                            else {
                                chrome.windows.getCurrent({populate: false, windowTypes: ["normal"]}, function(win)
                                {
                                    chrome.windows.update(win.id, {drawAttention: true});
                                });

                                let count = 0;

                                _converse.chatboxes.each(function (chat_box)
                                {
                                    if (chat_box.get("type") == "chatbox")
                                    {
                                        count = count + chat_box.get("num_unread");
                                    }
                                    else

                                    if (chat_box.get("type") == "chatroom")
                                    {
                                        count = count + chat_box.get("num_unread_general");
                                    }
                                });

                                if (count > 0)
                                {
                                    chrome.browserAction.setBadgeBackgroundColor({ color: '#0000e1' });
                                    chrome.browserAction.setBadgeText({ text: count.toString() });
                                }
                            }

                            if (type == "chatroom")
                            {
                                var theNick =  message.getAttribute("from").split("/")[1];
                                var myName =  chatbox.get('name');
                                var myNick =  chatbox.get('nick');

                                scanMessage(chatbox, message, jid, body.innerHTML, theNick, myNick, myName);
                            }

                            else

                            if (_converse.shouldNotifyOfMessage(message) && !document.hasFocus())
                            {
                                notifyText(body.innerHTML, display_name, jid, [{title: "Show Conversation?", iconUrl: chrome.extension.getURL("check-solid.svg")}], function(notificationId, buttonIndex)
                                {
                                    if (buttonIndex == 0)
                                    {
                                        _converse.api.chats.open(jid);
                                        focusThisWindow();
                                        if (chatbox) setActiveConversationsRead(chatbox);
                                    }

                                }, jid);
                            }

                            setActiveConversationsUread(chatbox, body.innerHTML);
                        }

                        if (!history && body && attachTo && (body.innerHTML.indexOf(":thumbsup:") > -1 || body.innerHTML.indexOf(":thumbsdown:") > -1))
                        {
                            const msgId = attachTo.getAttribute("id");
                            const reaction = body.innerHTML.indexOf(":thumbsdown:") > -1 ? "dislike" : "like";

                            console.debug("pade plugin - attach-to", msgId, reaction);

                            if (chrome.storage && msgId)
                            {
                                chrome.storage.local.get(msgId, function(obj)
                                {
                                    if (!obj[msgId]) obj[msgId] = {};
                                    if (!obj[msgId][reaction]) obj[msgId][reaction] = 0;

                                    obj[msgId][reaction]++;

                                    chrome.storage.local.set(obj, function() {
                                      console.debug('set emoji reaction', obj);
                                    });

                                    displayReactions(msgId, obj[msgId]["like"], obj[msgId]["dislike"]);
                                });
                            }
                        }
                    });

                    _converse.api.listen.on('chatRoomViewInitialized', function (view)
                    {
                        console.debug("chatRoomViewInitialized", view);

                        if (!getSetting("alwaysShowOccupants", false))
                        {
                            const chat_area = view.el.querySelector('.chat-area');
                            const occupants_area = view.el.querySelector('.occupants.col-md-3.col-4');
                            chat_area.classList.add('full');
                            occupants_area.classList.add('hiddenx');
                        }

                        view.model.occupants.on('add', occupant =>
                        {
                            if (occupant.get("jid"))
                            {
                                //console.debug("chatbox.occupants added", occupant);
                                anonRoster[occupant.get("jid")] = occupant.get("nick");
                            }

                            setTimeout(function() {extendOccupant(occupant, view)}, 1000);
                        });

                        view.model.occupants.on('remove', occupant =>
                        {
                            //console.debug("chatbox.occupants removed", occupant);
                            delete anonRoster[occupant.get("jid")];
                        });
                    });

                    _converse.api.listen.on('chatBoxInsertedIntoDOM', function (view)
                    {
                        console.debug("chatBoxInsertedIntoDOM", view.model, anonRoster);

                        const jid = view.model.get("jid");
                        const activeDiv = document.getElementById("active-conversations");
                        console.debug("pade plugin chatBoxInsertedIntoDOM", jid, activeDiv);

                        if (!_converse.connection.pass)
                        {
                            if (anonRoster[view.model.get("jid")])
                            {
                                const nick = anonRoster[view.model.get("jid")];
                                view.model.set('fullname', nick);
                                view.model.set('nickname', nick);
                                view.model.vcard.set('nickname', nick);
                                view.model.vcard.set('fullname', nick);

                                const dataUri = getSetting("avatar", api.createAvatar(nick, null, null, null, true, jid));
                                const avatar = dataUri.split(";base64,");

                                view.model.vcard.set('image', avatar[1]);
                                view.model.vcard.set('image_type', 'image/png');
                            }
                        }

                        if (activeDiv) addActiveConversation(view.model, activeDiv);
                    });

                    _converse.api.listen.on('chatBoxClosed', function (chatbox)
                    {
                        console.debug("chatBoxClosed", chatbox);

                        const activeDiv = document.getElementById("active-conversations");
                        if (activeDiv) removeActiveConversation(chatbox, activeDiv);
                    });

                    _converse.api.listen.on('connected', function()
                    {
                        console.debug("xmpp connected", _converse.connection);
                        listenForPresence();
                        publishUserLocation();

                        background.Strophe = Strophe;
                        background.$iq = $iq;
                        background.$msg = $msg;
                        background.$pres = $pres;

                        if (background.pade)
                        {
                            background.pade.connection = _converse.connection;
                            background.setupUserPayment();
                            background.setupStreamDeck();
                        }

                        const id = Strophe.getNodeFromJid(_converse.connection.jid);
                        const password = _converse.connection.pass;

                        if (id && password && webpush && webpush.registerServiceWorker) // register webpush service worker
                        {
                            webpush.registerServiceWorker(getSetting("server"), username, password);
                        }

                        if (chrome.pade)    // browser mode
                        {
                            if (id && password)
                            {
                                if (parent.setCredentials)    // save new credentials
                                {
                                    parent.setCredentials({id: id, password: password});
                                }
                            }

                            if (typeof module === 'object') // electron fix for jQuery
                            {
                                window.module = module; module = undefined;
                            }

                            window.addEventListener('focus', function(evt)
                            {
                                chrome.browserAction.setBadgeBackgroundColor({ color: '#0000e1' });
                                chrome.browserAction.setBadgeText({ text: "" });
                            });
                        }

                        setupRoomActivityIndicators(function(supported)
                        {
                            console.debug("rai discover", supported);
                            if (supported) listenForRoomActivityIndicators();
                        });

                        if (_converse.api.waitUntil('bookmarksInitialized')) _converse.api.waitUntil('bookmarksInitialized').then((initPade) => {

                            var myNick = _converse.nickname || Strophe.getNodeFromJid(_converse.bare_jid);

                            if (!_converse.singleton)
                            {
                                var stanza = inverse.env.$iq({'from': _converse.connection.jid, 'type': 'get'}).c('query', { 'xmlns': "jabber:iq:private"}).c('storage', { 'xmlns': 'storage:bookmarks' });

                                console.debug("initPade", myNick);

                                var bookmarkRoom = function bookmarkRoom(json)
                                {
                                    let bookmark = _converse.bookmarks.findWhere({'jid': json.jid});

                                    if (!bookmark)
                                    {
                                        _converse.bookmarks.create({
                                            'jid': json.jid,
                                            'name': json.name,
                                            'autojoin': json.autojoin,
                                            'nick': myNick
                                        });
                                    }
                                    bookmark = _converse.bookmarks.findWhere({'jid': json.jid});
                                    _converse.bookmarks.markRoomAsBookmarked(bookmark);
                                }

                                if (getSetting("enableBookmarks", true))
                                {
                                    _converse.connection.sendIQ(stanza, function(iq) {

                                        iq.querySelectorAll('conference').forEach(function(conf)
                                        {
                                            var jid = conf.getAttribute("jid");
                                            var name = conf.getAttribute("name");
                                            var avatar_uri = conf.getAttribute("avatar_uri");
                                            if (!name) name = Strophe.getNodeFromJid(jid);
                                            var autojoin = conf.getAttribute('autojoin') === 'true' || conf.getAttribute('autojoin') === '1';
                                            var json = {name: name, jid: jid, autojoin: autojoin, avatar_uri: avatar_uri};

                                            console.debug('pade BookmarksReceived', json);
                                            if (_converse.bookmarks) bookmarkRoom(json);

                                        });

                                    }, function(error){
                                        console.error("bookmarks error", error);
                                    });
                                }
                            }
                        }).catch(function (err) {
                            console.error('waiting for bookmarksInitialized error', err);
                        });

                        if (_converse.api.waitUntil('controlBoxInitialized')) _converse.api.waitUntil('controlBoxInitialized').then(() => {

                            var addControlFeatures = function()
                            {
                                const section = document.body.querySelector('.controlbox-section.profile.d-flex');

                                if (!section)
                                {
                                    setTimeout(addControlFeatures, 1000);
                                    return;
                                }

                                console.debug("addControlFeatures", section);

                                if (getSetting("converseSimpleView", false))
                                {
                                    handleActiveConversations();
                                }

                                const viewButton = __newElement('a', null, '<a class="controlbox-heading__btn show-active-conversations fa fa-navicon align-self-center" title="Change view"></a>');
                                section.appendChild(viewButton);

                                viewButton.addEventListener('click', function(evt)
                                {
                                    evt.stopPropagation();
                                    handleActiveConversations();

                                }, false);


                                const ofmeetButton = __newElement('a', null, '<a class="controlbox-heading__btn open-ofmeet fas fa-video align-self-center" title="Meet Now!!"></a>');
                                section.appendChild(ofmeetButton);

                                ofmeetButton.addEventListener('click', function(evt)
                                {
                                    evt.stopPropagation();
                                    background.openVideoWindow("", "normal");

                                }, false);

                                const prefButton = __newElement('a', null, '<a class="controlbox-heading__btn show-preferences fas fa-cog align-self-center" title="Preferences/Settings"></a>');
                                section.appendChild(prefButton);

                                prefButton.addEventListener('click', function(evt)
                                {
                                    evt.stopPropagation();
                                    const url = chrome.extension.getURL("options/index.html");
                                    openWebAppsWindow(url, null, 1300, 950);

                                }, false);

                                if (!_converse.connection.pass)     // anonymous connection, use Pade settings for _converse.xmppstatus
                                {
                                    const nick = getSetting("displayname");
                                    _converse.xmppstatus.set('fullname', nick);
                                    _converse.xmppstatus.set('nickname', nick);
                                    _converse.xmppstatus.vcard.set('nickname', nick);
                                    _converse.xmppstatus.vcard.set('fullname', nick);

                                    const dataUri = getSetting("avatar", api.createAvatar(nick, null, null, null, true));
                                    const avatar = dataUri.split(";base64,");

                                    _converse.xmppstatus.vcard.set('image', avatar[1]);
                                    _converse.xmppstatus.vcard.set('image_type', 'image/png');
                                }
                                // add self for testing
                                setTimeout(function() {
                                    openChat(Strophe.getBareJidFromJid(_converse.connection.jid), getSetting("displayname"), ["Bots"], true)
                                });
                            }

                            addControlFeatures();

                        }).catch(function (err) {
                            console.error('waiting for controlBoxInitialized error', err);
                        });
                    });

                    if (getSetting("useClientCert", false))
                    {
                        console.debug("useClientCert enabled");

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
                                console.debug("strophe plugin: externalsasl enabled");
                            }
                        });
                    }

                    if (getSetting("useTotp", false) || getSetting("useWinSSO", false) || getSetting("useSmartIdCard", false))
                    {
                        Strophe.addConnectionPlugin('ofchatsasl',
                        {
                            init: function (connection)
                            {
                                Strophe.SASLGitea = function () { };
                                Strophe.SASLGitea.prototype = new Strophe.SASLMechanism("OFCHAT", true, 2000);

                                Strophe.SASLGitea.test = function (connection)
                                {
                                    return getSetting("password", null) !== null;
                                };

                                Strophe.SASLGitea.prototype.onChallenge = function (connection)
                                {
                                    var token = getSetting("username", null) + ":" + getSetting("password", null);
                                    console.debug("Strophe.SASLGitea", token);
                                    return token;
                                };

                                connection.mechanisms[Strophe.SASLGitea.prototype.name] = Strophe.SASLGitea;
                                console.debug("strophe plugin: ofchatsasl enabled");
                            }
                        });
                    }
                },
                overrides: {

                    MessageView: {

                        renderChatMessage: async function renderChatMessage()
                        {
                            //console.debug("renderChatMessage", this.model);

                            if (this.model.vcard)
                            {
                                if (!this.model.get("fullname") && this.model.get("from").indexOf("\\40") > -1)
                                {
                                    this.model.vcard.attributes.fullname = Strophe.unescapeNode(this.model.get("from").split("@")[0]);
                                }

                                var nick = this.model.getDisplayName();

                                if (nick && _converse.DEFAULT_IMAGE == this.model.vcard.attributes.image)
                                {
                                    var dataUri = api.createAvatar(nick);
                                    var avatar = dataUri.split(";base64,");

                                    this.model.vcard.attributes.image = avatar[1];
                                    this.model.vcard.attributes.image_type = "image/png";
                                }
                            }

                            const body = this.model.get('message');

                            if (body && body.indexOf(":lol:") > -1)
                            {
                                const newBody = body.replace(":lol:", ":smiley:");
                                this.model.set('message', newBody);
                            }

                            const msgAttachId = this.model.get("msg_attach_to");

                            if (msgAttachId && body && body.indexOf(msgAttachId) == -1) // very important check (duplicates)
                            {
                                if (body.indexOf(":thumbsup:") > -1 || body.indexOf(":thumbsdown:") > -1)
                                {
                                    const reaction = (body.indexOf(":thumbsdown:") > -1) ? ":thumbsdown:" : ":thumbsup:";
                                    this.model.set('message', "/me " + reaction + " #" + msgAttachId);
                                }
                            }

                            if (body && getSetting("notifyOnInterests", false))
                            {
                                var highlightedBody = body;
                                var interestList = getSetting("interestList", "").split("\n");

                                for (var i=0; i<interestList.length; i++)
                                {
                                    interestList[i] = interestList[i].trim();

                                    if (interestList[i] != "")
                                    {
                                        var searchRegExp = new RegExp('^(.*)(\s?' + interestList[i] + ')', 'ig');
                                        var replaceRegExp = new RegExp('\#' + interestList[i], 'igm');

                                        var enew = highlightedBody.replace(replaceRegExp, interestList[i]);
                                        var highlightedBody = enew.replace(searchRegExp, "$1#$2");
                                    }
                                }

                                this.model.set('message', highlightedBody);
                            }

                            await this.__super__.renderChatMessage.apply(this, arguments);

                            if (getSetting("converseTimeAgo", false))
                            {
                                renderTimeAgoChatMessage(this);
                            }

                            // hashtags and mentions transformation

                            const source = this.model.get("from") || this.model.get("jid");
                            const box_jid = Strophe.getBareJidFromJid(source);
                            const view = _converse.chatboxviews.get(box_jid);

                            if (view)
                            {
                                this.el.querySelectorAll('.badge-hash-tag').forEach(function(hashtag)
                                {
                                    var oldMsg = view.model.messages.findWhere({'msgid': hashtag.getAttribute("data-hashtag")});

                                    if (oldMsg)
                                    {
                                        const nick = Strophe.getResourceFromJid(oldMsg.get('from'));
                                        hashtag.title = nick + ": " + oldMsg.get('message');
                                        hashtag.innerText = "this";
                                    }

                                    hashtag.addEventListener('click', function(evt)
                                    {
                                        evt.stopPropagation();

                                        console.debug("pade.hashtag click", evt.target);

                                        const tag = document.getElementById("msg-" + evt.target.getAttribute("data-hashtag"));

                                        // can't find old message, we default to groupchat room

                                        if (tag) tag.scrollIntoView({block: "end", inline: "nearest", behavior: "smooth"});
                                        else {
                                            const roomJid = evt.target.getAttribute("data-hashtag") + "@conference." + _converse.connection.domain;
                                            _converse.api.rooms.open(roomJid, {name: evt.target.getAttribute("data-hashtag"), nick: getSetting("displayname")});

                                        }
                                    }, false);
                                });

                                this.el.querySelectorAll('.mention').forEach(function(mention)
                                {
                                    mention.addEventListener('click', function(evt)
                                    {
                                        evt.stopPropagation();

                                        console.debug("pade.mention click", evt.target);

                                        const jid = evt.target.getAttribute("data-jid");

                                        if (jid) {
                                            _converse.api.chats.open(jid, {fullname: evt.target.getAttribute("data-mention")});
                                        }
                                        else {
                                            const contact = _converse.roster.findWhere({'user_id': evt.target.getAttribute("data-mention")});

                                            if (contact) {
                                                _converse.api.chats.open(contact.get("jid"), {fullname: contact.get("nickname") || contact.get("fullname")});
                                            }
                                        }

                                    }, false);
                                });
                            }

                            const msgId = this.model.get("msgid");

                            // mermaid transformation

                            const bodyDiv = document.querySelector('div[data-msgid="' + msgId + '"] .chat-msg__text');

                            if (bodyDiv)
                            {
                                const html = bodyDiv.innerHTML;

                                if (window.mermaid && (html.startsWith("graph TD") ||
                                    html.startsWith("graph TB") ||
                                    html.startsWith("graph BT") ||
                                    html.startsWith("graph RL") ||
                                    html.startsWith("graph LR") ||
                                    html.startsWith("pie") ||
                                    html.startsWith("gantt") ||
                                    html.startsWith("stateDiagram") ||
                                    html.startsWith("classDiagram") ||
                                    html.startsWith("sequenceDiagram") ||
                                    html.startsWith("erDiagram"))) {

                                    bodyDiv.innerHTML = '<div class="mermaid">' + html.replace(/<br>/g, '\n') + '</div>';
                                    mermaid.init(bodyDiv.querySelector(".mermaid"));
                                }
                                else

                                if (window.ABCJS && html.startsWith("X:1"))
                                {
                                    bodyDiv.innerHTML = '<div id="abc-' + msgId + '"></div>';
                                    ABCJS.renderAbc("abc-" + msgId, html.replace(/<br>/g, '\n'));
                                }
                            }

                            // action button for quoting, pinning

                            var messageDiv = this.el.querySelector('.chat-msg__message');

                            if (messageDiv)
                            {
                                // looking for blockquote

                                var blockQuote = messageDiv.querySelector('blockquote');

                                if (blockQuote && msgAttachId)
                                {
                                    blockQuote.setAttribute('msgid', msgAttachId);

                                    blockQuote.addEventListener('click', function(evt)
                                    {
                                        //evt.stopPropagation();

                                        var elmnt = document.getElementById("msg-" + evt.target.getAttribute('msgid'));
                                        if (elmnt) elmnt.scrollIntoView({block: "end", inline: "nearest", behavior: "smooth"});

                                    }, false);
                                }

                                // adding message actions

                                var messageActionButtons = this.el.querySelector('.chat-msg__actions');

                                if (!messageActionButtons)
                                {
                                    messageActionButtons = document.createElement("div");
                                    messageActionButtons.classList.add("chat-msg__actions");
                                    messageDiv.parentElement.appendChild(messageActionButtons);
                                }

                                if (!messageActionButtons.querySelector('.chat-msg__action-reply'))
                                {
                                    var ele = document.createElement("button");
                                    ele.classList.add("chat-msg__action", "chat-msg__action-reply", "fas", "fa-reply-all");
                                    ele.title = "Reply this message";
                                    messageActionButtons.appendChild(ele);
                                }

                                if (!messageActionButtons.querySelector('.chat-msg__action-forward'))
                                {
                                    var ele = document.createElement("button");
                                    ele.classList.add("chat-msg__action", "chat-msg__action-forward", "fas", "fa-share");
                                    ele.title = "Add this message to Notepad";
                                    messageActionButtons.appendChild(ele);
                                }

                                if (getSetting("allowMsgPinning", true))
                                {
                                    if (!messageActionButtons.querySelector('.chat-msg__action-pin') && this.model.get("type") === "groupchat")
                                    {
                                        var ele = document.createElement("button");
                                        ele.classList.add("chat-msg__action", "chat-msg__action-pin", "fas", "fa-thumbtack");
                                        ele.title = "Pin this message";
                                        messageActionButtons.appendChild(ele);
                                    }
                                }

                                if (getSetting("allowMsgReaction", true))
                                {
                                    if (!messageActionButtons.querySelector('.chat-msg__action-like') && this.model.get("type") === "groupchat")
                                    {
                                        var ele = document.createElement("button");
                                        ele.classList.add("chat-msg__action", "chat-msg__action-like", "far", "fa-thumbs-up");
                                        ele.title = "React positive to this message";
                                        messageActionButtons.appendChild(ele);
                                    }

                                    if (!messageActionButtons.querySelector('.chat-msg__action-dislike') && this.model.get("type") === "groupchat")
                                    {
                                        var ele = document.createElement("button");
                                        ele.classList.add("chat-msg__action", "chat-msg__action-dislike", "far", "fa-thumbs-down");
                                        ele.title = "React negative to this message";
                                        messageActionButtons.appendChild(ele);
                                    }

                                    if (!messageActionButtons.querySelector('.chat-msg__action-react'))
                                    {
                                        var ele = document.createElement("button");
                                        ele.classList.add("chat-msg__action", "chat-msg__action-react", "fa", "fa-smile");
                                        ele.title = "React to this message with emoji";
                                        messageActionButtons.appendChild(ele);
                                    }
                                }
                            }

                            // render message reaction totals

                            if (chrome.storage) chrome.storage.local.get(msgId, function(obj)
                            {
                                if (obj[msgId])
                                {
                                    displayReactions(msgId, obj[msgId]["like"], obj[msgId]["dislike"]);
                                }
                            });
                        }
                    },

                    RosterFilterView: {

                      shouldBeVisible() {
                        return _converse.roster && getSetting("converseRosterFilter") && (_converse.roster.length >= 5 || this.isActive());
                      }
                    },

                    RosterContactView: {

                        renderAvatar: function() {

                            if (this.model.vcard)
                            {
                                var nick = this.model.getDisplayName();

                                if (nick && _converse.DEFAULT_IMAGE == this.model.vcard.attributes.image)
                                {
                                    var dataUri = api.createAvatar(nick);
                                    var avatar = dataUri.split(";base64,");

                                    this.model.vcard.set("image", avatar[1]);
                                    this.model.vcard.set("image_type", "image/png");
                                }
                            }

                            this.__super__.renderAvatar.apply(this, arguments);
                        }
                    },
                    ChatRoomView: {

                        afterShown: function() {

                            const ret = this.__super__.afterShown.apply(this, arguments);
                            return ret;
                        }
                    },

                    ChatBoxView: {

                        afterShown: function() {

                            var id = this.model.get("box_id");
                            var jid = this.model.get("jid");
                            var type = this.model.get("type");

                            var display_name = this.model.getDisplayName().trim();
                            if (!display_name || display_name == "") display_name = jid;

                            // active conversations, reset unread indicator

                            console.debug("afterShown", id, jid, type);

                            var openButton = document.getElementById("pade-active-" + id);
                            var openBadge = document.getElementById("pade-badge-" + id);

                            if (openButton)
                            {
                                openButton.innerText = display_name;
                                openButton.style.fontWeight = "bold";
                            }

                            if (openBadge) openBadge.setAttribute("data-badge", "0");

                            const ret = this.__super__.afterShown.apply(this, arguments);
                            return ret;

                        }
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
                dataUri = api.createAvatar(display_name, null, null, null, null);
            }

            // ohun status

            msg_content.innerHTML = '<span id="pade-badge-' + id + '" class="pade-badge" data-badge="' + numUnread + '"><img class="avatar" src="' + dataUri + '" style="width: 22px; width: 22px; height: 100%; margin-right: 10px;"/></span><span title="' + newMessage + '" data-label="' + display_name + '" data-jid="' + jid + '" data-type="' + chatType + '" id="pade-active-' + id +'" class="pade-active-conv">' + display_name + '</span><a href="#" id="pade-active-conv-close-' + id +'" data-jid="' + jid + '" class="pade-active-conv-close fa fa-times"></a><a href="#" id="pade-active-conv-ohun-' + id +'" data-jid="' + jid + '" class="pade-active-conv-ohun fas fa-volume-up"></a>';
            activeDiv.appendChild(msg_content);

            const item = document.getElementById('pade-active-conv-ohun-' + id);

            if (item && paderoot.ohun[jid] && paderoot.ohun[jid].peer)
            {
                item.style.color =  "red";
                item.style.visibility = "visible";
            }

            // handlers for mouse click and badge status

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

                    if (view)
                    {
                        const ohun = _converse.pluggable.plugins["ohun"];
                        if (ohun) ohun.closeKraken(view.model);
                        view.close();
                    }

                }, false);
            }
        }
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

    function _createAvatar(nickname, width, height, font)
    {
        if (_converse.vcards)
        {
            let vcard = _converse.vcards.findWhere({'jid': nickname});
            if (!vcard) vcard = _converse.vcards.findWhere({'nickname': nickname});

            if (vcard && vcard.get('image') && _converse.DEFAULT_IMAGE != vcard.get('image')) return "data:" + vcard.get('image_type') + ";base64," + vcard.get('image');
        }

        if (!nickname) nickname = "Anonymous";
        nickname = nickname.toLowerCase();

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

        if (_inverse && jid && Strophe.getNodeFromJid(jid) && _inverse.bare_jid != jid)
        {
             _inverse.api.chats.open(jid, {nickname: nick, fullname: nick}).then(chat => {
                 if (!chat.vcard.attributes.fullname) chat.vcard.set('fullname', nick);
                 if (!chat.vcard.attributes.nickname) chat.vcard.set('nickname', nick);
             });
        }
    }

    function makeRoomName(contact)
    {
        const username = getSetting("username");

        if (username <= contact)
        {
            return username + "-" + contact;
        }
        else return contact + "-" + username;
    }

    function loadJS(name)
    {
        console.debug("loadJS", name);
        var head  = document.getElementsByTagName('head')[0];
        var s1 = document.createElement('script');
        s1.src = name;
        s1.async = false;
        head.appendChild(s1);
    }

    function loadCSS(name)
    {
        console.debug("loadCSS", name);
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = name;
        head.appendChild(link);
    }

    function occupantAvatarClicked(ev)
    {
        const jid = ev.target.getAttribute('data-room-jid');
        const nick = ev.target.getAttribute('data-room-nick');

        if (jid && _converse.bare_jid != jid)
        {
             _converse.api.chats.open(jid, {nickname: nick, fullname: nick}).then(chat => {
                 if (!chat.vcard.attributes.fullname) chat.vcard.set('fullname', nick);
                 if (!chat.vcard.attributes.nickname) chat.vcard.set('nickname', nick);
             });
        }
    }

    function extendOccupant(occupant, view)
    {
        const element = document.getElementById(occupant.get('id'));
        //console.debug("extendOccupant", element);

        if (element)
        {
            // avatar

            const status = element.querySelector(".occupant-status");
            let imgEle = element.querySelector(".occupant-avatar");
            const image = api.createAvatar(occupant.get('nick'), null, null, null, null, occupant.get('jid'));
            const imgHtml = '<img class="room-avatar avatar" src="' + image + '" height="22" width="22">';

            if (imgEle)
            {
                imgEle.innerHTML = imgHtml;
            }
            else {
                imgEle = __newElement('span', null, imgHtml, 'occupant-avatar');
                status.insertAdjacentElement('beforeBegin', imgEle);
            }

            if (occupant.get('jid'))
            {
                const badges = element.querySelector(".occupant-badges");

                // location

                if (paderoot.geoloc[occupant.get('jid')])
                {
                    let locationEle = element.querySelector(".occupants-pade-location");
                    let locationHtml = "<span data-room-nick='" + occupant.get('nick') + "' data-room-jid='" + occupant.get('jid') + "' title='click to see location' class='badge badge-dark'>GeoLoc</span>";

                    if (locationEle)
                    {
                        locationEle.innerHTML = locationHtml;
                    }
                    else {
                        locationEle = __newElement('span', null, locationHtml, 'occupants-pade-location');
                        badges.appendChild(locationEle);
                    }

                    locationEle.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        const jid = evt.target.getAttribute('data-room-jid');
                        const nick = evt.target.getAttribute('data-room-nick');
                        _converse.pluggable.plugins["webmeet"].showGeolocation(jid, nick, view);

                    }, false);
                }

                // chat badge

                let padeEle = element.querySelector(".occupants-pade-chat");
                let html = "<span data-room-nick='" + occupant.get('nick') + "' data-room-jid='" + occupant.get('jid') + "' title='click to chat' class='badge badge-success'>chat</span>";

                if (_converse.bare_jid == occupant.get('jid'))
                {
                    html = "<span data-room-nick='" + occupant.get('nick') + "' data-room-jid='" + occupant.get('jid') + "' class='badge badge-groupchat'>self</span>";
                }

                if (padeEle)
                {
                    padeEle.innerHTML = html;
                }
                else {
                    padeEle = __newElement('span', null, html, 'occupants-pade-chat');
                    badges.appendChild(padeEle);
                }

                padeEle.addEventListener('click', function(evt)
                {
                    evt.stopPropagation();
                    occupantAvatarClicked(evt);

                }, false);
            }
        }
    }

    function setupRoomActivityIndicators(callback)
    {
        try {
            const id = Math.random().toString(36).substr(2,9);
            _converse.connection.send(converse.env.$pres({to: _converse.api.settings.get("rai_muc_service"), id: id}).c('rai', {'xmlns': "xmpp:prosody.im/protocol/rai"}));

            if (callback) callback(true);
        } catch (e) {
            console.error("setupRoomActivityIndicators", e);
            if (callback) callback(false);
        }
    }

    function listenForPresence()
    {
        console.debug("listenForPresence");

        _converse.connection.addHandler(function(presence)
        {
            const from = Strophe.getBareJidFromJid(presence.getAttribute('from'));

            presence.querySelectorAll('geoloc').forEach(function(item)
            {
                var accuracy = item.querySelector('accuracy').innerHTML;
                var lat = item.querySelector('lat').innerHTML;
                var lon = item.querySelector('lon').innerHTML;

                paderoot.geoloc[from] = {accuracy: accuracy, lat: lat, lon: lon};
                const webmeet = _converse.pluggable.plugins["webmeet"];
                if (webmeet) webmeet.showGeolocationIcon(from);
                console.debug("Geolocation", from, paderoot.geoloc[from]);
            });

            presence.querySelectorAll('json').forEach(function(item)
            {
                var namespace = item.getAttribute("xmlns");

                if (namespace == "urn:xmpp:json:0")
                {
                    var json = JSON.parse(item.innerHTML);
                    console.debug("json", from, json);
                }
            });

            return true;

        }, null, 'presence');
    }

    function listenForRoomActivityIndicators()
    {
        _converse.connection.addHandler(function(message)
        {
            console.debug("listenForRoomActivityIndicators - message", message);

            message.querySelectorAll('activity').forEach(function(activity)
            {
                if (activity) {
                    const jid = activity.innerHTML;
                    console.debug("listenForRoomActivityIndicators - message", jid);

                    if (_converse.api.settings.get("rai_notification"))
                    {
                        notifyText(_converse.api.settings.get("rai_notification_label"), jid, jid, [{title: "Show Conversation?", iconUrl: chrome.extension.getURL("check-solid.svg")}], function(notificationId, buttonIndex)
                        {
                            if (buttonIndex == 0) _converse.api.rooms.open(jid);

                        }, jid);
                    }
                }
            });

            const subject = message.querySelector('subject');
            const body = message.querySelector('body');
            if (subject && !body) sendMarker(message.getAttribute('from'), message.getAttribute('id'), 'received');

            return true;

        }, 'xmpp:prosody.im/protocol/rai', 'message');
    }

    function sendMarker(to_jid, id, type)
    {
        console.debug("sendMarker", to_jid, id, type);

        const stanza = $msg({
          'from': _converse.connection.jid,
          'id': Math.random().toString(36).substr(2,9),
          'to': to_jid,
          'type': 'chat'
        }).c(type, {
          'xmlns': Strophe.NS.MARKERS,
          'id': id
        });

        _converse.api.send(stanza);
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

        if (paderoot.webAppsWindow[url] == null)
        {
            chrome.windows.create(data, function (win)
            {
                paderoot.webAppsWindow[url] = win;
                updateWindowCoordinates(url, paderoot.webAppsWindow[url].id, {width: width, height: height});
            });

        } else {
            chrome.windows.update(paderoot.webAppsWindow[url].id, {focused: true});
        }
    }

    chrome.windows.onRemoved.addListener(function(win)
    {
        console.debug("closing window ", win);

        var webApps = Object.getOwnPropertyNames(paderoot.webAppsWindow);

        for (var i=0; i<webApps.length; i++)
        {
            if (paderoot.webAppsWindow[webApps[i]] && win == paderoot.webAppsWindow[webApps[i]].id)
            {
                delete paderoot.webAppsWindow[webApps[i]];
            }
        }

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

    function scanMessage(chatbox, message, fromJid, body, fromNick, myNick, myName)
    {
        console.debug("scanMessage", chatbox, message, fromJid, body, fromNick, myNick, myName);

        if (_converse.shouldNotifyOfMessage(message) && !document.hasFocus())
        {
            var jid = fromJid + "/" + fromNick;

            notifyText(body, fromNick, jid, [{title: "Show Conversation?", iconUrl: chrome.extension.getURL("check-solid.svg")}], function(notificationId, buttonIndex)
            {
                if (buttonIndex == 0)
                {
                    _converse.api.rooms.open(fromJid);
                    focusThisWindow();
                    if (chatbox) setActiveConversationsRead(chatbox);
                }

            }, fromJid);
        }

        else {

            var interestList = getSetting("interestList", "").split("\n");

            if (!document.hasFocus() && body)
            {
                if (getSetting("notifyAllRoomMessages", false))
                {
                    // TODO move to background page
                    notifyMe(body, fromNick, fromJid);
                }
                else {
                    var alerted = false;

                    if (getSetting("notifyOnInterests", false))
                    {
                        for (var i=0; i<interestList.length; i++)
                        {
                            interestList[i] = interestList[i].trim();

                            if (interestList[i] != "")
                            {
                                var searchRegExp = new RegExp('^(.*)(\s?' + interestList[i] + ')', 'ig');

                                if (searchRegExp.test(body))
                                {
                                    // TODO move to background page using server-sent events
                                    notifyMe(body, fromNick, fromJid);
                                    alerted = true;
                                    break;
                                }
                            }
                        }
                    }

                    // track groupchat mentions

                    if (!alerted && getSetting("notifyRoomMentions", false))
                    {
                        if (_converse.shouldNotifyOfMessage(message) && !document.hasFocus())
                        {
                            var mentioned = new RegExp(`\\b${myNick}\\b`).test(body);
                            if (mentioned) notifyMe(body, fromNick, fromJid, chatbox);
                        }
                    }
                }
            }
        }
    }

    function focusThisWindow()
    {
        chrome.windows.getCurrent({populate: false, windowTypes: ["normal"]}, function(win)
        {
            chrome.windows.update(win.id, {focused: true});
        });
    }

    function notifyMe(text, fromNick, fromJid, chatbox)
    {
        console.debug("notifyMe", text, fromNick, fromJid);
        var jid = fromJid + "/" + fromNick;

        _converse.playSoundNotification();

        notifyText(text, fromNick, jid, [{title: "Show Conversation?", iconUrl: chrome.extension.getURL("check-solid.svg")}], function(notificationId, buttonIndex)
        {
            if (buttonIndex == 0)
            {
                _converse.api.rooms.open(fromJid);
                focusThisWindow();
                if (chatbox) setActiveConversationsRead(chatbox);
            }

        }, fromJid);
    };

    function setActiveConversationsUread(chatbox, newMessage)
    {
        // active conversations, add unread indicator

        var id = chatbox.get("box_id");
        var numUnreadBox = chatbox.get("num_unread");
        var numUnreadRoom = chatbox.get("num_unread_general");
        var chatType = chatbox.get("type") == "chatbox" ? "chat" : "groupchat";
        var openButton = document.getElementById("pade-active-" + id);
        var openBadge = document.getElementById("pade-badge-" + id);

        var jid = chatbox.get("jid");
        var display_name = chatbox.getDisplayName().trim();
        if (!display_name || display_name == "") display_name = jid;

        if (openBadge && openButton)
        {
            if (chatType == "chat")
            {
                openBadge.setAttribute("data-badge", numUnreadBox);
            }
            else

            if (chatType == "groupchat")
            {
                openBadge.setAttribute("data-badge", numUnreadRoom);
            }

            if (newMessage) openButton.title = newMessage;

        } else {
            const activeDiv = document.getElementById("active-conversations");
            if (activeDiv) addActiveConversation(chatbox, activeDiv, newMessage);
        }
    }

    function setActiveConversationsRead(chatbox)
    {
        console.debug("setActiveConversationsRead", chatbox);

        // active conversations, remove unread indicator

        var id = chatbox.get("box_id");
        var openBadge = document.getElementById("pade-badge-" + id);
        if (openBadge) openBadge.setAttribute("data-badge", "0");
    }

    function displayReactions(msgId, positives, negatives)
    {
        console.debug("displayReactions", positives, negatives);

        const msgDiv = document.querySelector("#msg-" + msgId + " .chat-msg__text");

        if (msgDiv)
        {
           let reactionDiv = document.querySelector("#msg-" + msgId + " .chat-msg__reactions");

            if (!reactionDiv)
            {
                reactionDiv = document.createElement("div");
                reactionDiv.classList.add("chat-msg__reactions");
                msgDiv.insertAdjacentElement('afterEnd', reactionDiv);
            }

            let div =  '<table><tr>';
            if (positives) div = div + '<td class="chat-msg__reaction far fa-thumbs-up"> ' + positives + '</td>';
            if (negatives) div = div + '<td class="chat-msg__reaction far fa-thumbs-down"> ' + negatives + '</td>';
            div = div + '</tr></table>';

            reactionDiv.innerHTML = div;
        }
    }

    function notifyText(message, title, jid, buttons, callback, notifyId)
    {
        console.debug("notifyText", title, message, jid, buttons, notifyId);

        var opt = {
          type: "basic",
          title: title,
          iconUrl: chrome.runtime.getURL ? chrome.runtime.getURL("image.png") : "../image.png",
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

        if (_inverse && _inverse.vcards)
        {
            let vcard = _inverse.vcards.findWhere({'jid': jid});

            if (vcard && vcard.get('image') && _inverse.DEFAULT_IMAGE != vcard.get('image'))
            {
                opt.iconUrl = "data:" + vcard.get('image_type') + ";base64," + vcard.get('image');
                doNotify();
            }
            else doNotify();
        }
        else doNotify();
    };


    function openChatbox(view)
    {
        let jid = view.model.get("jid");
        let type = view.model.get("type");

        if (jid)
        {
            if (type == "chatbox") _converse.api.chats.open(jid);
            else
            if (type == "chatroom") _converse.api.rooms.open(jid);
        }
    }

    function publishUserLocation()
    {
        var showPosition = function (position)
        {
            console.debug("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude, position);

            var stanza = $iq({type: 'set'}).c('pubsub', {xmlns: "http://jabber.org/protocol/pubsub"}).c('publish', {node: "http://jabber.org/protocol/geoloc"}).c('item').c('geoloc', {xmlns: "http://jabber.org/protocol/geoloc"}).c("accuracy").t(position.coords.accuracy).up().c("lat").t(position.coords.latitude).up().c("lon").t(position.coords.longitude).up();

            _converse.connection.sendIQ(stanza, function(iq)
            {
                console.debug("User location publish ok");

            }, function(error){
                console.error("showPosition", error);
            });

            _converse.connection.send($pres().c('geoloc', {xmlns: "http://jabber.org/protocol/geoloc"}).c("accuracy").t(position.coords.accuracy).up().c("lat").t(position.coords.latitude).up().c("lon").t(position.coords.longitude).up());
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
            console.debug('publishUserLocation');
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        }
    }

    function findUsers(search, callback)
    {
        console.debug('findUsers2', search);

        var iq = $iq({type: 'set', to: "search." + _converse.connection.domain}).c('query', {xmlns: 'jabber:iq:search'}).c('x').t(search).up().c('email').t(search).up().c('nick').t(search);

        _converse.connection.sendIQ(iq, function(response)
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
    }

    function iso8601(date)
    {
        return date.getUTCFullYear()
            + "-" + (date.getUTCMonth()+1)
            + "-" + date.getUTCDate()
            + "T" + date.getUTCHours()
            + ":" + date.getUTCMinutes()
            + ":" + date.getUTCSeconds() + "Z";
    }

    function renderTimeAgoChatMessage(chat)
    {
        var dayjs_time = dayjs(chat.model.get('time'));
        var pretty_time = dayjs_time.format(_converse.time_format);

        var timeEle = chat.el.querySelector('.chat-msg__time');
        var timeAgo = timeago.format(chat.model.get('time'));

        if (timeEle && timeEle.innerHTML)
        {
            timeEle.innerHTML = '<span class="chat-msg__time_span" title="' + pretty_time + '" datetime="' + iso8601(new Date(chat.model.get('time'))) + '">' + timeAgo + '</span>';
        }
    }

    api.createAvatar = function(nickname, width, height, font, force, jid)
    {
        if (_converse.vcards)
        {
            let vcard = _converse.vcards.findWhere({'jid': nickname});
            if (!vcard && jid) vcard = _converse.vcards.findWhere({'jid': jid});
            if (!vcard) vcard = _converse.vcards.findWhere({'nickname': nickname});

            if (vcard && vcard.get('image') && _converse.DEFAULT_IMAGE != vcard.get('image')) return "data:" + vcard.get('image_type') + ";base64," + vcard.get('image');
        }

        return _createAvatar(nickname, width, height, font, force);
    }

    api.publishUserLocation = publishUserLocation;
    api.openChat = openChat;
    api.openGroupChat = openGroupChat;
    api.getSelectedChatBox = getSelectedChatBox;
    api.replyInverseChat = replyInverseChat;
    api.addToolbarItem = addToolbarItem;
    api.__newElement = __newElement;
    api.openChatbox = openChatbox;
    api.getSelectedChatBox = getSelectedChatBox;
    api.notifyText = notifyText;

    api.getResource = function()
    {
        return BrowserDetect.browser + BrowserDetect.version + BrowserDetect.OS + '-' + (Math.floor(Math.random() * 139749528)).toString();
    };

    api.myStatus = function(attr, value)
    {
        _converse.xmppstatusview.model.set(attr, value)
    };

    api.origins = {};
    api.geoloc = paderoot.geoloc;
    api.ohun = paderoot.ohun;

    return api;

}(padeapi || {}));
