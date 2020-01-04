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

            });

            _converse.on('messageAdded', function (data) {

            });

            _converse.on('message', function (data)
            {

            });

            _converse.api.listen.on('messageSend', function(data)
            {

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

                    setTimeout(function() {extendOccupant(occupant, view)}, 500);

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

            _converse.api.listen.on('chatBoxInitialized', function (view)
            {
                console.debug("chatBoxInitialized", view.model, anonRoster);
                const jid = view.model.get("jid");

                if (anonRoster[view.model.get("jid")])
                {
                    const nick = anonRoster[view.model.get("jid")];
                    view.model.set('fullname', nick);
                    view.model.set('nickname', nick);
                    view.model.vcard.set('nickname', nick);
                    view.model.vcard.set('fullname', nick);

                    const dataUri = createAvatar(nick, null, null, null, true);
                    const avatar = dataUri.split(";base64,");

                    view.model.vcard.set('image', avatar[1]);
                    view.model.vcard.set('image_type', 'image/png');
                }
            });

            _converse.api.listen.on('chatBoxClosed', function (chatbox)
            {
                console.debug("chatBoxClosed", chatbox);
            });

            _converse.api.listen.on('connected', function()
            {
                console.log("pade plugin is ready");

                _converse.api.waitUntil('controlBoxInitialized').then(() => {

                    if (!_converse.connection.pass)
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
                });
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                console.debug('ingite - renderToolbar', view.model);
                var id = view.model.get("box_id");
                var jid = view.model.get("jid");

                var scrolldown = addToolbarItem(view, id, "ignite-scrolldown-" + id, '<a class="fa fa-angle-double-down" title="Scroll to the bottom"></a>');

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
                }
            },

            ChatBoxView: {

                afterShown: function() {

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

    function extendOccupant(occupant, view)
    {
        const element = document.getElementById(occupant.get('id'));
        console.debug("extendOccupant", element);

        if (element)
        {
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

            if (occupant.get('jid'))
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

    function __newElement (el, id, html, className)
    {
        var ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        if (className) ele.classList.add(className);
        document.body.appendChild(ele);
        return ele;
    }

    function addToolbarItem (view, id, label, html)
    {
        var placeHolder = view.el.querySelector('#place-holder');

        if (!placeHolder)
        {
            var smiley = view.el.querySelector('.toggle-smiley.dropup');
            smiley.insertAdjacentElement('afterEnd', __newElement('li', 'place-holder'));
            placeHolder = view.el.querySelector('#place-holder');
        }
        var newEle = __newElement('li', label, html);
        placeHolder.insertAdjacentElement('afterEnd', newEle);
        return newEle;
    }
}));