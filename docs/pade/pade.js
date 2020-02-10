(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var nickColors = {}, avatars = {}, anonRoster = {};
    var Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs;
    var _converse = null;
    var notified = false;
    var anonRoster = {};

    converse.plugins.add("pade", {

        dependencies: [],

        initialize: function () {
            _converse = this._converse;

            Strophe = converse.env.Strophe;
            $iq = converse.env.$iq;
            $msg = converse.env.$msg;
            $pres = converse.env.$pres;
            $build = converse.env.$build;
            b64_sha1 = converse.env.b64_sha1;
            _ = converse.env._;
            Backbone = converse.env.Backbone;
            dayjs = converse.env.dayjs;

            _converse.api.settings.update({
                pade_publish_webpush: true
            });

            _converse.on('messageAdded', function (data) {

            });

            _converse.on('message', function (data)
            {
                var chatbox = data.chatbox;
                var message = data.stanza;
                var history = message.querySelector('forwarded');
                var body = message.querySelector('body');

                if (!history && body && chatbox)
                {
                    setActiveConversationsUread(chatbox, body.innerHTML);
                }
            });

            _converse.api.listen.on('messageSend', function(data)
            {

            });

            _converse.api.listen.on('chatRoomViewInitialized', function (view)
            {
                const jid = view.model.get("jid");
                console.debug("chatRoomViewInitialized", view);

                view.model.occupants.on('add', occupant =>
                {
                    if (occupant.get("jid"))
                    {
                        console.debug("chatbox.occupants added", occupant);
                        anonRoster[occupant.get("jid")] = occupant.get("nick");
                    }

                    extendOccupant(occupant, this);
                });

                view.model.occupants.on('remove', occupant =>
                {
                    if (occupant.get("jid"))
                    {
                        console.debug("chatbox.occupants removed", occupant);
                        delete anonRoster[occupant.get("jid")];
                    }
                });
            });

            _converse.api.listen.on('chatBoxInitialized', function (model)
            {
                console.debug("chatBoxInitialized", model, anonRoster);
                const jid = model.get("jid");

                if (anonRoster[model.get("jid")])
                {
                    const nick = anonRoster[model.get("jid")];
                    model.set('fullname', nick);
                    model.set('nickname', nick);
                    model.vcard.set('nickname', nick);
                    model.vcard.set('fullname', nick);

                    const dataUri = createAvatar(nick, null, null, null, true);
                    const avatar = dataUri.split(";base64,");

                    model.vcard.set('image', avatar[1]);
                    model.vcard.set('image_type', 'image/png');
                }

                const activeDiv = document.getElementById("active-conversations");
                if (activeDiv) addActiveConversation(model, activeDiv);
            });

            _converse.api.listen.on('chatBoxInsertedIntoDOM', function (chatbox)
            {
                const jid = chatbox.model.get("jid");

                console.debug("chatBoxInsertedIntoDOM", chatbox, jid);

                if (_converse.api.settings.get("pade_publish_webpush") && chatbox.model.get("type") == "chatbox")
                {
                    sendWebPush(jid);
                }
            });

            _converse.api.listen.on('chatBoxClosed', function (chatbox)
            {
                console.debug("chatBoxClosed", chatbox);

                const activeDiv = document.getElementById("active-conversations");
                if (activeDiv) removeActiveConversation(chatbox, activeDiv);
            });

            _converse.api.listen.on('connected', function()
            {
                if (!_converse.connection.pass && _converse.nickname)
                {
                    setTimeout(function()
                    {
                        _converse.xmppstatus.set('fullname', _converse.nickname);
                        _converse.xmppstatus.set('nickname', _converse.nickname);
                        _converse.xmppstatus.vcard.set('nickname', _converse.nickname);
                        _converse.xmppstatus.vcard.set('fullname', _converse.nickname);

                        const dataUri = createAvatar(_converse.nickname, null, null, null, true);
                        const avatar = dataUri.split(";base64,");

                        _converse.xmppstatus.vcard.set('image', avatar[1]);
                        _converse.xmppstatus.vcard.set('image_type', 'image/png');

                    }, 1000);
                }

                _converse.api.waitUntil('roomsPanelRendered').then(() => {
                    extendControlBox();

                    console.log("pade plugin is ready");
                });

                if (_converse.api.settings.get("pade_publish_webpush"))
                {
                    listenForWebPush();
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                console.debug('ingite - renderToolbar', view.model);
                var id = view.model.get("box_id");
                var jid = view.model.get("jid");

                updateToolbar(view);

                var trash = addToolbarItem(view, id, "pade-trash-" + id, '<a class="far fa-trash-alt" title="Trash local storage of chat history"></a>');

                trash.addEventListener('click', function(evt)
                {
                    evt.stopPropagation();
                    view.clearMessages();

                }, false);

                var refresh = addToolbarItem(view, id, "pade-refresh-" + id, '<a class="fa fa-sync" title="Refresh"></a>');

                refresh.addEventListener('click', function(evt)
                {
                    evt.stopPropagation();
                    view.close();
                    setTimeout(function() { openChatbox(view); });

                }, false);

                var scrolldown = addToolbarItem(view, id, "pade-scrolldown-" + id, '<a class="fa fa-angle-double-down" title="Scroll to the bottom"></a>');

                scrolldown.addEventListener('click', function(evt)
                {
                    evt.stopPropagation();
                    view.viewUnreadMessages()

                }, false);

            });
        },

        overrides: {

            MessageView: {
                renderChatMessage: async function renderChatMessage()
                {
                    if (this.model.vcard)
                    {
                        var nick = this.model.getDisplayName();

                        if (nick && _converse.DEFAULT_IMAGE == this.model.vcard.attributes.image)
                        {
                            var dataUri = createAvatar(nick);
                            var avatar = dataUri.split(";base64,");

                            this.model.vcard.attributes.image = avatar[1];
                            this.model.vcard.attributes.image_type = "image/png";
                        }
                    }

                    await this.__super__.renderChatMessage.apply(this, arguments);
                }
            },

            ChatRoomView: {

                afterShown: function() {
                    const ret = this.__super__.afterShown.apply(this, arguments);
                    return ret;
                },

                setChatRoomSubject: function() {
                    const retValue = this.__super__.setChatRoomSubject.apply(this, arguments);
                    return retValue;
                },

                showJoinNotification: function(occupant) {
                    const retValue = this.__super__.showJoinNotification.apply(this, arguments);
                    return retValue;
                },
            },

            ChatBoxView: {

                afterShown: function() {

                    var id = this.model.get("box_id");
                    var jid = this.model.get("jid");
                    var type = this.model.get("type");

                    var display_name = this.model.getDisplayName().trim();
                    if (!display_name || display_name == "") display_name = jid;

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
                    return text;
                }
            },

            XMPPStatus: {
                sendPresence: function (type, status_message, jid) {
                    var _converse = this.__super__._converse;
                    this.__super__.sendPresence.apply(this, arguments);
                }
            }
        }
    });

    function sendWebPush(jid)
    {
        if (window.WebPushLib && window.WebPushLib.selfSecret)
        {
            console.debug("sendWebPush", window.WebPushLib.selfSecret);
            _converse.connection.send($msg({to: jid}).c('webpush', {xmlns: "urn:xmpp:push:0"}).t(window.WebPushLib.selfSecret));
        }
    }

    function listenForWebPush()
    {
        _converse.connection.addHandler(function(message)
        {
            console.debug('webpush handler', message);
            const handleElement = message.querySelector('webpush');

            if (handleElement)
            {
                const secret = handleElement.innerHTML;
                const jid = Strophe.getBareJidFromJid(message.getAttribute("from"));
                const view = _converse.chatboxviews.get(jid);

                localStorage['pade.webpush.' + jid] = atob(secret);

                if (view) updateToolbar(view);
            }

            return true;

        }, "urn:xmpp:push:0", "message");

        navigator.serviceWorker.onmessage = function(event)
        {
            console.debug("Broadcasted from service worker : ", event.data);

            if (event.data.msgFrom)     // notification
            {
                if (event.data.msgType == "chat") _converse.api.chats.open(event.data.msgFrom);
                else
                if (event.data.msgType == "room") _converse.api.rooms.open(event.data.msgFrom);
            }
            else

            if (event.data.options)    // subscription renewal.
            {
                makeSubscription(function(err, subscription, keys)
                {
                    if (!err)
                    {
                        // TODO when converse implements dynamic configuration, update push_servers here
                        handleSubscription(_converse.settings, subscription, keys);

                        _converse.chatboxviews.forEach(view =>
                        {
                          if (view.model.get('type') == 'chatbox') sendWebPush(view.model.get('jid'));
                        });
                    }
                })
            }
        }
    }

    function updateToolbar(view)
    {
        const id = view.model.get("box_id");
        const jid = view.model.get("jid");

        console.debug("updateToolbar", jid, localStorage['pade.webpush.' + jid]);

        if (localStorage['pade.webpush.' + jid] && !document.getElementById("pade-webpush-" + id))
        {
            const webpush = addToolbarItem(view, id, "pade-webpush-" + id, '<a class="fa fa-bell" title="Send Ping"></a>');

            webpush.addEventListener('click', function(evt)
            {
                evt.stopPropagation();
                const payload = {msgBody: 'Ping!!', msgFrom: _converse.bare_jid, msgType: 'chat'};

                const secret = JSON.parse(localStorage['pade.webpush.' + jid]);
                console.debug("updateToolbar secret", secret);

                window.WebPushLib.setVapidDetails('xmpp:' + _converse.bare_jid, secret.publicKey, secret.privateKey);

                window.WebPushLib.sendNotification(secret.subscription, JSON.stringify(payload), {TTL: 60}).then(response => {
                    console.log("Web Push Notification is sended!")
                }).catch(e => {
                    console.error('Failed to notify ' + jid, e)
                })

            }, false);
        }
    }

    function occupantAvatarClicked(ev)
    {
        const jid = ev.target.getAttribute('data-room-jid');
        const nick = ev.target.getAttribute('data-room-nick');

        if (jid && converse.env.Strophe.getNodeFromJid(jid) && _converse.bare_jid != jid)
        {
             _converse.api.chats.open(jid, {nickname: nick, fullname: nick}).then(chat => {
                 if (!chat.vcard.attributes.fullname) chat.vcard.set('fullname', nick);
                 if (!chat.vcard.attributes.nickname) chat.vcard.set('nickname', nick);
             });
        }
    }

    var openChatbox = function openChatbox(view)
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

    function rafAsync() {
        return new Promise(resolve => {
            requestAnimationFrame(resolve);
        });
    }

    function checkElement(id) {
        if (document.getElementById(id) === null) {
            return rafAsync().then(() => checkElement(id));
        } else {
            return Promise.resolve(document.getElementById(id));
        }
    }

    function extendOccupant(occupant, view)
    {
        console.debug("extendOccupant", occupant, view);

        checkElement(occupant.get('id')).then((element) =>
        {
            console.debug("extendOccupant", element);

            const status = element.querySelector(".occupant-status");
            let imgEle = element.querySelector(".occupant-avatar");
            const image = createAvatar(occupant.get('nick'));
            const imgHtml = '<img data-room-nick="' + occupant.get('nick') + '" data-room-jid="' + occupant.get('jid') + '" class="room-avatar avatar" src="' + image + '" height="22" width="22">';

            if (imgEle)
            {
                imgEle.innerHTML = imgHtml;
            }
            else {
                imgEle = __newElement('span', null, imgHtml, 'occupant-avatar');
                status.insertAdjacentElement('beforeBegin', imgEle);
            }

            const myJid = Strophe.getBareJidFromJid(_converse.connection.jid);

            if (occupant.get('jid') && myJid != occupant.get('jid'))
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
        });

        const element = document.getElementById(occupant.get('id'));
    }

    function extendControlBox()
    {
        const section = document.body.querySelector('.controlbox-section.profile.d-flex');
        console.debug("extendControlBox", section);

        if (section)
        {
            const viewButton = __newElement('a', null, '<a class="controlbox-heading__btn show-active-conversations fa fa-navicon align-self-center" title="Change view"></a>');
            section.appendChild(viewButton);

            viewButton.addEventListener('click', function(evt)
            {
                evt.stopPropagation();
                handleActiveConversations();

            }, false);

            // set active conversations as default view
            handleActiveConversations();
        }
    }

    function setAvatar(nickname, avatar)
    {
        if (nickname && !avatars[nickname])
        {
            nickname = nickname.toLowerCase();
            avatars[nickname] = avatar;
        }
    }

    function createAvatar (nickname, width, height, font, force)
    {
        nickname = nickname.toLowerCase();

        if (avatars[nickname] && !force)
        {
            return avatars[nickname];
        }

        if (_converse.vcards)
        {
            const vcard = _converse.vcards.findWhere({'nickname': nickname});
            if (vcard && vcard.get('image')) return "data:" + vcard.get('image_type') + ";base64," + vcard.get('image');
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

        var dataUrl = canvas.toDataURL();
        avatars[nickname] = dataUrl;
        return dataUrl;
    }

    function getRandomColor (nickname)
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

            if (_converse.DEFAULT_IMAGE == chatbox.vcard.attributes.image)
            {
                dataUri = createAvatar(display_name);
            }
            else {
                setAvatar(display_name, dataUri);
            }

            msg_content.innerHTML = '<span id="pade-badge-' + id + '" class="pade-badge" data-badge="' + numUnread + '"><img class="avatar" src="' + dataUri + '" style="width: 24px; width: 24px; height: 100%; margin-right: 10px;"/></span><span title="' + newMessage + '" data-label="' + display_name + '" data-jid="' + jid + '" data-type="' + chatType + '" id="pade-active-' + id +'" class="pade-active-conv">' + display_name + '</span><a href="#" id="pade-active-conv-close-' + id +'" data-jid="' + jid + '" class="pade-active-conv-close fa fa-times-circle"></a>';
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

    function setActiveConversationsTitle(chatbox, newMessage)
    {
        var id = chatbox.get("box_id");
        var openButton = document.getElementById("pade-active-" + id);
        if (openButton && newMessage) openButton.title = newMessage;
    }

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

}));