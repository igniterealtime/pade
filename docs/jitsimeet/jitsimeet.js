(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs, _converse;
    var MeetDialog = null, meetDialog = null;

    converse.plugins.add("jitsimeet", {
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
                jitsimeet_modal: false,
                jitsimeet_url: 'https://meet.jit.si',
                jitsimeet_confirm: "Meeting?",
                jitsimeet_invitation: 'Please join meeting in room at'
            });

            _converse.on('message', function (data)
            {
                var chatbox = data.chatbox;
                var bodyElement = data.stanza.querySelector('body');

                if (bodyElement && _converse.shouldNotifyOfMessage(data.stanza))
                {
                    var body = bodyElement.innerHTML;
                    var url = _converse.api.settings.get("jitsimeet_url");
                    var pos = body.indexOf(url + "/");

                    if (pos > -1)
                    {
                        var room = body.substring(pos + url.length + 1);
                        var label = pos > 0 ? body.substring(0, pos) : _converse.api.settings.get("jitsimeet_invitation");
                        var from = chatbox.getDisplayName().trim();
                        var avatar = _converse.DEFAULT_IMAGE;

                        if (data.chatbox.vcard.attributes.image) avatar = data.chatbox.vcard.attributes.image;

                        var prompt = new Notification(from,
                        {
                            'body': label + " " + room,
                            'lang': _converse.locale,
                            'icon': avatar,
                            'requireInteraction': true
                        });

                        prompt.onclick = function(event)
                        {
                            event.preventDefault();

                            var box_jid = Strophe.getBareJidFromJid(chatbox.get("from") || chatbox.get("jid"));
                            var view = _converse.chatboxviews.get(box_jid);

                            if (view)
                            {
                                openChatbox(view);
                                doLocalVideo(view, room, url + "/" + room, label);
                            }
                        }
                    }
                }
            });

            MeetDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  var view = this.model.get("view");
                  var label = this.model.get("label");
                  var room = this.model.get("room");
                  var url = this.model.get("url");

                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header">' +
                         '  <h4 class="modal-title">' + label + ' ' + room + '</h4>' +
                         '</div>' +
                         '<div style="text-align: center;" class="modal-body"><iframe src="' + url + '" id="jitsimeet" allow="microphone; camera;" frameborder="0" seamless="seamless" allowfullscreen="true" scrolling="no" style="z-index: 2147483647;width:640px;height:480px;display: inline-block"></iframe></div>' +
                         '<div class="modal-footer"> <button type="button" class="btn btn-danger btn-terminate" data-dismiss="modal">Close</button> </div>' +
                         '</div> </div> </div>';
                },
                events: {
                    "click .btn-terminate": "terminateCall"
                },

                terminateCall() {
                    this.el.querySelector('.modal-body').innerHTML = "about:blank"
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                const id = view.model.get("box_id");
                const jitsiMeet = addToolbarItem(view, id, "pade-jitsimeet-" + id, '<a class="fas fa-video" title="Jitsi Meet"></a>');

                if (jitsiMeet) jitsiMeet.addEventListener('click', function(evt)
                {
                    evt.stopPropagation();

                    var jitsiConfirm = _converse.api.settings.get("jitsimeet_confirm");

                    if (confirm(jitsiConfirm))
                    {
                        doVideo(view);
                    }

                }, false);
            });

            console.log("jitsimeet plugin is ready");
        },

        overrides: {

            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    var dataJid = Strophe.getBareJidFromJid(this.model.get("from") || this.model.get("jid"));
                    var body = this.model.get('message');
                    var url = _converse.api.settings.get("jitsimeet_url");
                    var pos = body.indexOf(url + "/");

                    if (pos > -1)
                    {
                        var link_room = body.substring(pos + url.length + 1);
                        var link_id = link_room + "-" + Math.random().toString(36).substr(2,9);
                        var link_label = pos > 0 ? body.substring(0, pos) : _converse.api.settings.get("jitsimeet_invitation");
                        var link_content = '<a data-jid="' + dataJid + '" id="' + link_id + '" href="#">' + link_label + " " + link_room + '</a>';

                        setupContentHandler(this, link_room, link_content, link_id, link_label);
                    }
                    else {
                        await this.__super__.renderChatMessage.apply(this, arguments);
                    }
                }

            }
        }
    });

    var setupContentHandler = function(chat, avRoom, content, linkId, linkLabel)
    {
        var dayjs_time = dayjs(chat.model.get('time'));
        var pretty_time = dayjs_time.format(_converse.time_format);
        var time = dayjs_time.format();

        var msg_content = document.createElement("div");
        msg_content.setAttribute("class", "message chat-msg groupchat");
        msg_content.setAttribute("data-isodate", time);

        if (chat.model.vcard)
        {
            msg_content.innerHTML = '<img class="avatar" src="data:image/png;base64,' + chat.model.vcard.attributes.image + '" style="width: 36px; width: 36px; height: 100%; margin-right: 10px;"/> <div class="chat-msg-content"> <span class="chat-msg-heading"> <span class="chat-msg-author">' + chat.model.getDisplayName() + '</span> <span class="chat-msg-time">' + pretty_time + '</span> </span> <span class="chat-msg-text">' + content + '</span> <div class="chat-msg-media"></div> </div>';
            chat.replaceElement(msg_content);
        }

        if (avRoom && linkId)
        {
            setTimeout(function()
            {
                if (document.getElementById(linkId)) document.getElementById(linkId).onclick = function(evt)
                {
                    var url = _converse.api.settings.get("jitsimeet_url") + '/' + avRoom;
                    var dataJid = evt.target.getAttribute("data-jid");
                    var view = _converse.chatboxviews.get(dataJid);

                    if (view) doLocalVideo(view, avRoom, url, linkLabel);
                }
            }, 1000);
        }
    }


    var doVideo = function doVideo(view)
    {
        var room = Strophe.getNodeFromJid(view.model.attributes.jid).toLowerCase() + "-" + Math.random().toString(36).substr(2,9);
        var url = _converse.api.settings.get("jitsimeet_url") + '/' + room;

        console.debug("doVideo", room, url, view);

        var label = _converse.api.settings.get("jitsimeet_invitation");
        view.model.sendMessage(label + ' ' + url);

        doLocalVideo(view, room, url, label);
    }

    var doLocalVideo = function doLocalVideo(view, room, url, label)
    {
        console.debug("doLocalVideo", view, room, url, label);

        var modal = _converse.api.settings.get("jitsimeet_modal") == true;

        if (modal)
        {
            meetDialog = new MeetDialog({'model': new converse.env.Backbone.Model({url: url, view: view, label: label, room: room}) });
            meetDialog.show();
        }
        else {

            var div = view.el.querySelector(".box-flyout");

            if (div)
            {
                div.innerHTML = '<iframe src="' + url + '" id="jitsimeet" allow="microphone; camera;" frameborder="0" seamless="seamless" allowfullscreen="true" scrolling="no" style="z-index: 2147483647;width:100%;height:-webkit-fill-available;height:-moz-available;"></iframe>';

                var jitsiDiv = div.querySelector('#jitsimeet');
                var firstTime = true;

                jitsiDiv.addEventListener("load", function ()
                {
                    console.debug("doVideo - load", this);

                    if (!firstTime) // meeting closed and root url is loaded
                    {
                        view.close();
                        openChatbox(view);
                    }

                    if (firstTime) firstTime = false;   // ignore when jitsi-meet room url is loaded

                });
            }
        }
    }

    var openChatbox = function openChatbox(view)
    {
        let jid = view.model.get("jid");
        let type = view.model.get("type");

        if (jid)
        {
            view.close();

            if (type == "chatbox") _converse.api.chats.open(jid);
            else
            if (type == "chatroom") _converse.api.rooms.open(jid);
        }
    }

    function newElement (el, id, html, className)
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
        let placeHolder = view.el.querySelector('#place-holder');

        if (!placeHolder)
        {
            const toolbar = view.el.querySelector('.chat-toolbar');
            toolbar.appendChild(newElement('li', 'place-holder'));
            placeHolder = view.el.querySelector('#place-holder');
        }
        var newEle = newElement('li', label, html);
        placeHolder.insertAdjacentElement('afterEnd', newEle);
        return newEle;
    }
}));
