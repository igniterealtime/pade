// version 0.4.11.1

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as a module called "pade"
        define(["converse"], factory);
    } else {
        // Browser globals. If you're not using a module loader such as require.js,
        // then this line below executes. Make sure that your plugin's <script> tag
        // appears after the one from converse.js.
        factory(converse);
    }
}(this, function (converse) {

    // Commonly used utilities and variables can be found under the "env"
    // namespace of the "converse" global.
     var Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs;
     var _converse = null;
     var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
     var notified = false;
     var anonRoster = {};

     window.chatThreads = {};

    // The following line registers your plugin.
    converse.plugins.add("pade", {

        dependencies: [],

        initialize: function () {
            _converse = this._converse;
            window._inverse = _converse;
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

            if (bgWindow && bgWindow.pade.chatWindow)
            {
                chrome.windows.onFocusChanged.addListener(function(win)
                {
                    if (win == -1) notified = false;

                    if (win == bgWindow.pade.chatWindow.id)
                    {
                        notified = true;
                        chrome.browserAction.setBadgeBackgroundColor({ color: '#0000e1' });
                        chrome.browserAction.setBadgeText({ text: ""});
                    }
                });

                document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Converse - " + _converse.VERSION_NAME;
            }

            if (getSetting("enableThreading", false))
            {
                // set active thread id
                resetAllMsgCount();
            }

            /* From the `_converse` object you can get any configuration
             * options that the user might have passed in via
             * `converse.initialize`.
             *
             * You can also specify new configuration settings for this
             * plugin, or override the default values of existing
             * configuration settings. This is done like so:
            */

            _converse.api.settings.update({

            });

            /* The user can then pass in values for the configuration
             * settings when `converse.initialize` gets called.
             * For example:
             *
             *      converse.initialize({
             *           "initialize_message": "My plugin has been initialized"
             *      });
             */

            _converse.on('messageAdded', function (data) {
                // The message is at `data.message`
                // The original chatbox is at `data.chatbox`.
            });

            _converse.on('message', function (data)
            {
                var message = data.stanza;
                var isTranslation = message.getAttribute("data-translation");
                if (isTranslation) return;

                var chatbox = data.chatbox;
                var attachTo = data.stanza.querySelector('attach-to');
                var body = message.querySelector('body');
                var history = message.querySelector('forwarded');

                console.debug("pade plugin message", history, body, chatbox, message);

                if (!history && body && chatbox)
                {
                    var id = chatbox.get("box_id");
                    var jid = chatbox.get("jid");
                    var type = chatbox.get("type");
                    var display_name = chatbox.getDisplayName().trim();
                    if (!display_name || display_name == "") display_name = jid;

                    // add translation

                    if (getSetting("enableTranslation", false) && !body.innerHTML.startsWith("/"))
                    {
                        const tronId = 'translate-' + id;

                        chrome.storage.local.get(tronId, function(obj)
                        {
                            if (obj && obj[tronId])
                            {
                                fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + obj[tronId].target + "&tl=" + obj[tronId].source + "&dt=t&q=" + body.innerHTML).then(function(response){ return response.json()}).then(function(json)
                                {
                                    console.debug('translation ok', json[0][0][0]);

                                    const msgType = message.getAttribute("type");
                                    const msgFrom = message.getAttribute("from");
                                    const body = "*" + json[0][0][0] + "*";

                                    const stanza = '<message data-translation="true" type="' + msgType + '" to="' + _converse.connection.jid + '" from="' + msgFrom + '"><body>' + body + '</body></message>';
                                    _converse.connection.injectMessage(stanza);

                                }).catch(function (err) {
                                    console.error('translation error', err);
                                });
                            }
                        });
                    }

                    // draw attention to new messages
                    // done here instead of background.js becasue of chatroom messages

                    var numUnreadBox = chatbox.get("num_unread");
                    var numUnreadRoom = chatbox.get("num_unread_general");

                    if (document.hasFocus() || notified)
                    {
                        chrome.browserAction.setBadgeBackgroundColor({ color: '#0000e1' });
                        chrome.browserAction.setBadgeText({ text: "" });
                    }
                    else {

                        if (bgWindow)
                        {
                            chrome.windows.update(bgWindow.pade.chatWindow.id, {drawAttention: true});
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
                    }

                    if (type == "chatroom")
                    {
                        var theNick =  message.getAttribute("from").split("/")[1];
                        var myName =  chatbox.get('name');
                        var myNick =  chatbox.get('nick');

                        if (bgWindow) scanMessage(chatbox, message, jid, body.innerHTML, theNick, myNick, myName);
                    }

                    else

                    if (_converse.shouldNotifyOfMessage(message) && !document.hasFocus())
                    {
                        bgWindow.notifyText(body.innerHTML, display_name, jid, [{title: "Show Conversation?", iconUrl: chrome.extension.getURL("check-solid.svg")}], function(notificationId, buttonIndex)
                        {
                            if (buttonIndex == 0)
                            {
                                _converse.api.chats.open(jid);
                                chrome.windows.update(bgWindow.pade.chatWindow.id, {focused: true});

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

            _converse.api.listen.on('messageSend', function(data)
            {
                // The message is at `data.message`
                // The original chatbox is at `data.chatbox`.
                console.debug("messageSend", data);

                var id = data.chatbox.get("box_id");
                var body = data.message.get("message");

                if (getSetting("enableTranslation", false) && !body.startsWith("/"))
                {
                    const tronId = 'translate-' + id;

                    chrome.storage.local.get(tronId, function(obj)
                    {
                        if (obj && obj[tronId])
                        {
                            fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + obj[tronId].source + "&tl=" + obj[tronId].target + "&dt=t&q=" + body).then(function(response){ return response.json()}).then(function(json)
                            {
                                console.debug('translation ok', json[0][0][0]);
                                data.chatbox.sendMessage("*" + json[0][0][0] + "*");

                            }).catch(function (err) {
                                console.error('translation error', err);
                            });
                        }
                    });
                }
            });

            _converse.api.listen.on('chatRoomOpened', function (view)
            {
                const jid = view.model.get("jid");
                console.debug("chatRoomOpened", view);

                view.model.occupants.on('add', occupant =>
                {
                    if (occupant.get("jid"))
                    {
                        console.debug("chatbox.occupants added", occupant);
                        anonRoster[occupant.get("jid")] = occupant.get("nick");
                    }

                    setTimeout(function() {extendOccupant(occupant, view)}, 1000);
                });

                view.model.occupants.on('remove', occupant =>
                {
                    console.debug("chatbox.occupants removed", occupant);
                    delete anonRoster[occupant.get("jid")];
                });


                if (getSetting("enableThreading", false))
                {
                    const box_id = view.model.get("box_id");
                    const topicId = 'topic-' + box_id;

                    if (window.chatThreads[topicId])
                    {
                        const topic = window.chatThreads[topicId].topic;
                        if (topic) view.model.set("thread", topic);
                    }
                }

                if (bgWindow)
                {
                    bgWindow.pade.autoJoinRooms[view.model.get("jid")] = {jid: jid, type: view.model.get("type")};
                }

                if (getSetting("enableThreading", false))
                {
                    const box_id = view.model.get("box_id");
                    const topicId = 'topic-' + box_id;

                    if (window.chatThreads[topicId])
                    {
                        const topic = window.chatThreads[topicId].topic;
                        if (topic) view.model.set("thread", topic);
                    }
                }
            });

            _converse.api.listen.on('chatBoxInitialized', function (view)
            {
                console.debug("chatBoxInitialized", view.model, anonRoster);

                const jid = view.model.get("jid");
                const activeDiv = document.getElementById("active-conversations");
                console.debug("pade plugin chatBoxInitialized", jid, activeDiv);

                if (bgWindow)
                {
                    bgWindow.pade.autoJoinPrivateChats[view.model.get("jid")] = {jid: jid, type: view.model.get("type")};
                }

                if (!_converse.connection.pass)
                {
                    if (anonRoster[view.model.get("jid")])
                    {
                        const nick = anonRoster[view.model.get("jid")];
                        view.model.set('fullname', nick);
                        view.model.set('nickname', nick);
                        view.model.vcard.set('nickname', nick);
                        view.model.vcard.set('fullname', nick);

                        const dataUri = getSetting("avatar", createAvatar(nick, null, null, null, true));
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

                if (bgWindow)
                {
                    if (chatbox.model.get("type") == "chatbox") delete bgWindow.pade.autoJoinPrivateChats[chatbox.model.get("jid")];
                    if (chatbox.model.get("type") == "chatroom") delete bgWindow.pade.autoJoinRooms[chatbox.model.get("jid")];
                }

                const activeDiv = document.getElementById("active-conversations");
                if (activeDiv) removeActiveConversation(chatbox, activeDiv);

                // reset threads

                if (getSetting("enableThreading", false))
                {
                    const box_id = chatbox.model.get("box_id");
                    const topicId = 'topic-' + box_id;

                    if (window.chatThreads[topicId])
                    {
                        chrome.storage.local.get(topicId, function(obj)
                        {
                            resetMsgCount(obj, topicId);
                        });

                    }
                }
            });

            _converse.api.listen.on('connected', function()
            {
                if (chrome.pade)    // browser mode
                {
                    if (typeof module === 'object') // electron fix for jQuery
                    {
                        window.module = module; module = undefined;
                    }

                    top.pade.connection = _converse.connection;
                    top.addHandlers();
                    top.publishUserLocation();
                    top.setupUserPayment();

                    const username = Strophe.getNodeFromJid(_converse.connection.jid);
                    const password = _converse.connection.pass;

                    if (username && password)
                    {
                        if (top.setCredentials)    // save new credentials
                        {
                            top.setCredentials({id: username, password: password});
                        }

                        if (top.webpush && top.webpush.registerServiceWorker) // register webpush service worker
                        {
                            top.webpush.registerServiceWorker(bgWindow.pade.server, username, password);
                        }
                    }
                    else {

                    }

                    window.addEventListener('focus', function(evt)
                    {
                        chrome.browserAction.setBadgeBackgroundColor({ color: '#0000e1' });
                        chrome.browserAction.setBadgeText({ text: "" });
                    });
                }

                _converse.api.waitUntil('bookmarksInitialized').then((initPade) => {
                    var myNick = _converse.nickname || Strophe.getNodeFromJid(_converse.bare_jid);

                    if (!_converse.singleton)
                    {
                        var stanza = $iq({'from': _converse.connection.jid, 'type': 'get'}).c('query', { 'xmlns': "jabber:iq:private"}).c('storage', { 'xmlns': 'storage:bookmarks' });

                        console.debug("initPade", myNick);

                        var bookmarkRoom = function bookmarkRoom(json)
                        {
                            var room = _converse.chatboxes.get(json.jid);

                            if (!room)
                            {
                                _converse.bookmarks.create({
                                    'jid': json.jid,
                                    'name': json.name,
                                    'autojoin': json.autojoin,
                                    'nick': myNick
                                });

                                room = _converse.chatboxes.get(json.jid);
                                if (room) room.save('bookmarked', true);
                            }
                            return room;
                        }

                        if (getSetting("enableBookmarks", true))
                        {
                            _converse.connection.sendIQ(stanza, function(iq) {

                                $(iq).find('conference').each(function()
                                {
                                    var jid = $(this).attr("jid");
                                    var name = $(this).attr("name");
                                    if (!name) name = Strophe.getNodeFromJid(jid);
                                    var autojoin = $(this).attr('autojoin') === 'true' || $(this).attr('autojoin') === '1';
                                    var json = {name: name, jid: jid, autojoin: autojoin};

                                    console.debug('pade BookmarksReceived', json);
                                    if (_converse.bookmarks) bookmarkRoom(json);

                                });

                            }, function(error){
                                console.error("bookmarks error", error);
                            });

                            if (bgWindow && bgWindow.pade.activeWorkgroup)
                            {
                                stanza = $iq({type: 'get', to: "workgroup." + _converse.connection.domain}).c('workgroups', {jid: _converse.connection.jid, xmlns: "http://jabber.org/protocol/workgroup"});

                                _converse.connection.sendIQ(stanza, function(iq)
                                {
                                    $(iq).find('workgroup').each(function()
                                    {
                                        var name = Strophe.getNodeFromJid($(this).attr('jid'));
                                        var jid = 'workgroup-' + name + "@conference." + _converse.connection.domain;
                                        var json = {name: name, jid: jid, autojoin: true};

                                        console.debug('pade workgroup recieved', json);
                                        if (_converse.bookmarks) bookmarkRoom(json);
                                    });

                                }, function(error){
                                    console.error("workgroups error", error);
                                });
                            }
                        }
                    }

                });

                _converse.api.waitUntil('controlBoxInitialized').then(() => {

                    if (!_converse.connection.pass)     // anonymous connection, use Pade settings for _converse.xmppstatus
                    {
                        setTimeout(function()
                        {
                            const nick = getSetting("displayname");
                            _converse.xmppstatus.set('fullname', nick);
                            _converse.xmppstatus.set('nickname', nick);
                            _converse.xmppstatus.vcard.set('nickname', nick);
                            _converse.xmppstatus.vcard.set('fullname', nick);

                            const dataUri = getSetting("avatar", createAvatar(nick, null, null, null, true));
                            const avatar = dataUri.split(";base64,");

                            _converse.xmppstatus.vcard.set('image', avatar[1]);
                            _converse.xmppstatus.vcard.set('image_type', 'image/png');
                        }, 1000);
                    }

                    if (getSetting("converseSimpleView", false))
                    {
                        handleActiveConversations();
                    }
                });

                console.log("pade plugin is ready");
            });
        },

        overrides: {

            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    //console.debug("renderChatMessage", this.model);

                    const body = this.model.get('message');

                    if (getSetting("enableThreading", false))
                    {
                        const msgThread = this.model.get('thread');
                        const source = this.model.get("type") == "groupchat" ? this.model.get("from") : this.model.get("jid");
                        const box_jid = Strophe.getBareJidFromJid(source);
                        const box = _converse.chatboxes.get(box_jid);

                        if (box)
                        {
                            const box_id = box.get("box_id");
                            const topicId = 'topic-' + box_id;

                            console.debug("renderChatMessage", box_jid, box_id, msgThread, window.chatThreads[topicId]);

                            if (!window.chatThreads[topicId]) window.chatThreads[topicId] = {topic: msgThread}

                            if (window.chatThreads[topicId][msgThread] == undefined) window.chatThreads[topicId][msgThread] = 0;
                            window.chatThreads[topicId][msgThread]++;

                            if (window.chatThreads[topicId].topic)
                            {
                                if (!msgThread || msgThread != window.chatThreads[topicId].topic) return false; // thread mode, filter non thread messages
                            }
                        }
                    }

                    if (body.indexOf(":lol:") > -1)
                    {
                        const newBody = body.replace(":lol:", ":smiley:");
                        this.model.set('message', newBody);
                    }

                    const msgAttachId = this.model.get("msg_attach_to");

                    if (msgAttachId && body.indexOf(msgAttachId) == -1) // very important check (duplicates)
                    {
                        if (body.indexOf(":thumbsup:") > -1 || body.indexOf(":thumbsdown:") > -1)
                        {
                            const reaction = (body.indexOf(":thumbsdown:") > -1) ? ":thumbsdown:" : ":thumbsup:";
                            this.model.set('message', "/me " + reaction + " #" + msgAttachId);
                        }
                    }

                    if (getSetting("notifyOnInterests", false))
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

                        // adding message reactions

                        var messageActionButtons = this.el.querySelector('.chat-msg__actions');

                        if (!messageActionButtons)
                        {
                            messageActionButtons = document.createElement("div");
                            messageActionButtons.classList.add("chat-msg__actions");
                            messageDiv.parentElement.appendChild(messageActionButtons);
                        }

                        if (getSetting("enableMessageRetraction", false) && !messageActionButtons.querySelector('.chat-msg__action-delete') && this.model.get("type") !== 'headline' && !this.model.isMeCommand() && this.model.get('sender') === 'me')
                        {
                            var ele = document.createElement("button");
                            ele.classList.add("chat-msg__action", "chat-msg__action-delete", "far", "fa-trash-alt");
                            ele.title = "Reract this message";
                            messageActionButtons.appendChild(ele);
                        }

                        if (!messageActionButtons.querySelector('.chat-msg__action-reply'))
                        {
                            var ele = document.createElement("button");
                            ele.classList.add("chat-msg__action", "chat-msg__action-reply", "fas", "fa-reply");
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

                        }
                    }

                    // render message reaction totals

                    const msgId = this.model.get("msgid");

                    if (chrome.storage) chrome.storage.local.get(msgId, function(obj)
                    {
                        if (obj[msgId])
                        {
                            displayReactions(msgId, obj[msgId]["like"], obj[msgId]["dislike"]);
                        }
                    });
                }
            },

            ChatRoomView: {

                afterShown: function() {

                    const ret = this.__super__.afterShown.apply(this, arguments);
                    return ret;
                },

                setChatRoomSubject: function() {

                    const retValue = this.__super__.setChatRoomSubject.apply(this, arguments);

                    if (getSetting("enableThreading", false))
                    {
                        const subject = this.model.get('subject');
                        const id = this.model.get("box_id");
                        const topicId = 'topic-' + id;

                        if (getSetting("broadcastThreading", false))
                        {
                            let publicMsg = "has reset threading";
                            if (window.chatThreads[topicId].topic) publicMsg = "is threading with " + window.chatThreads[topicId].topic;
                            this.model.sendMessage("/me " + publicMsg);
                        }
                        else {
                            let privateMsg = "This groupchat has no threading";
                            if (window.chatThreads[topicId].topic) privateMsg = "This groupchat thread is set to " + window.chatThreads[topicId].topic;
                            this.showHelpMessages([privateMsg]);
                            this.viewUnreadMessages();
                        }

                        chrome.storage.local.get(topicId, function(obj)
                        {
                            if (!obj) obj = {};
                            if (!obj[topicId]) obj[topicId] = {};
                            if (!obj[topicId][subject.text]) obj[topicId][subject.text] = subject;

                            chrome.storage.local.set(obj, function() {
                                console.debug("new subject added", subject, id, obj);
                            });
                        });
                    }

                    return retValue;
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

                },

                modifyChatBody: function(text) {

                    if (getSetting("enableThreading", false))
                    {
                        const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                        const command = match[1].toLowerCase();

                        if ((command === "subject" || command === "topic") && match[2])
                        {
                            console.debug("new threaded conversation", match[2]);

                            const id = this.model.get("box_id");
                            const topicId = 'topic-' + id;

                            if (!window.chatThreads[topicId]) window.chatThreads[topicId] = {};
                            if (window.chatThreads[topicId][match[2]] == undefined) window.chatThreads[topicId][match[2]] = 0;

                            window.chatThreads[topicId].topic = match[2];
                            this.model.set("thread", match[2]);
                            const view = this;

                            chrome.storage.local.get(topicId, function(obj)
                            {
                                if (!obj) obj = {};
                                if (!obj[topicId]) obj[topicId] = {};

                                obj[topicId].thread = match[2];

                                chrome.storage.local.set(obj, function() {
                                    console.debug("active subject set", match[2], id, obj);
                                });
                            });
                        }
                    }

                    return text;
                }
            },

            /* Override converse.js's XMPPStatus Backbone model so that we can override the
             * function that sends out the presence stanza.
             */
            'XMPPStatus': {
                'sendPresence': function (type, status_message, jid) {
                    // The "_converse" object is available via the __super__
                    // attribute.
                    var _converse = this.__super__._converse;

                    // Custom code can come here ...

                    // You can call the original overridden method, by
                    // accessing it via the __super__ attribute.
                    // When calling it, you need to apply the proper
                    // context as reference by the "this" variable.
                    this.__super__.sendPresence.apply(this, arguments);

                    // Custom code can come here ...
                }
            }
        }
    });

    var occupantAvatarClicked = function(ev)
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

    var extendOccupant = function(occupant, view)
    {
        const element = document.getElementById(occupant.get('id'));
        console.debug("extendOccupant", element);

        if (element)
        {
            if (occupant.get('jid') && _converse.bare_jid != occupant.get('jid'))
            {
                const badges = element.querySelector(".occupant-badges");
                let padeEle = element.querySelector(".occupants-pade-chat");
                const html = "<span data-room-nick='" + occupant.get('nick') + "' data-room-jid='" + occupant.get('jid') + "' title='click to chat' class='badge badge-success'>chat</span>";

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

    var displayReactions = function(msgId, positives, negatives)
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

    var setActiveConversationsUread = function(chatbox, newMessage)
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

    var setActiveConversationsRead = function(chatbox)
    {
        console.debug("setActiveConversationsRead", chatbox);

        // active conversations, remove unread indicator

        var id = chatbox.get("box_id");
        var openBadge = document.getElementById("pade-badge-" + id);
        if (openBadge) openBadge.setAttribute("data-badge", "0");
    }


    var scanMessage = function(chatbox, message, fromJid, body, fromNick, myNick, myName)
    {
        console.debug("scanMessage", chatbox, message, fromJid, body, fromNick, myNick, myName);

        if (_converse.shouldNotifyOfMessage(message) && !document.hasFocus())
        {
            var jid = fromJid + "/" + fromNick;

            bgWindow.notifyText(body, fromNick, jid, [{title: "Show Conversation?", iconUrl: chrome.extension.getURL("check-solid.svg")}], function(notificationId, buttonIndex)
            {
                if (buttonIndex == 0)
                {
                    _converse.api.rooms.open(fromJid);
                    chrome.windows.update(bgWindow.pade.chatWindow.id, {focused: true});

                    if (chatbox) setActiveConversationsRead(chatbox);
                }

            }, fromJid);
        }

        else {

            var interestList = getSetting("interestList", "").split("\n");

            if (bgWindow.pade.minimised && body)
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
                        var mentioned = new RegExp(`\\b${myNick}\\b`).test(body);
                        if (mentioned) notifyMe(body, fromNick, fromJid, chatbox);
                    }
                }
            }
        }
    }

    var notifyMe = function(text, fromNick, fromJid, chatbox)
    {
        console.debug("notifyMe", text, fromNick, fromJid);
        var jid = fromJid + "/" + fromNick;

        _converse.playSoundNotification();

        bgWindow.notifyText(text, fromNick, jid, [{title: "Show Conversation?", iconUrl: chrome.extension.getURL("check-solid.svg")}], function(notificationId, buttonIndex)
        {
            if (buttonIndex == 0)
            {
                _converse.api.rooms.open(fromJid);
                bgWindow.pade.minimised = false;    // needed to reset if minimised is confused
                chrome.windows.update(bgWindow.pade.chatWindow.id, {focused: true});

                if (chatbox) setActiveConversationsRead(chatbox);
            }

        }, fromJid);
    };

    var resetAllMsgCount = function()
    {
        chrome.storage.local.get(null, function(obj)
        {
            const boxes = Object.getOwnPropertyNames(obj);

            boxes.forEach(function(box)
            {
                if (box.startsWith("topic-"))
                {
                    resetMsgCount(obj, box);
                }
            });
        });
    }

    var resetMsgCount = function(obj, box)
    {
        if (obj[box])
        {
            window.chatThreads[box] = {topic: obj[box].thread};

            const topics = Object.getOwnPropertyNames(obj[box]);

            topics.forEach(function(topic)
            {
                if (typeof obj[box][topic] == "object")
                {
                    window.chatThreads[box][topic] = 0;
                    console.debug("initialise message thread", box, topic);
                }
            });
        }
    }
}));