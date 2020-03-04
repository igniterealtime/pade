(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var ready = false;
    var handlers = {};
    var Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs;
    var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;

    converse.plugins.add("markdown", {
        'dependencies': [],

        'initialize': function () {
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

            chrome.runtime.onMessage.addListener(function(message)
            {
                if (bgWindow.pade.activeView && message.markdown)
                {
                    console.debug("chrome.runtime.onMessage", message);
                    submitMessage(bgWindow.pade.activeView, message.markdown);
                    bgWindow.closeWebAppsWindow(chrome.extension.getURL("inverse/plugins/editor.html"));
                }
            });


            _converse.api.listen.on('renderToolbar', function(view)
            {
                if (bgWindow && !view.el.querySelector(".plugin-markdown") && getSetting("showToolbarIcons", true))
                {
                    var id = view.model.get("box_id");
                    var markdown = addToolbarItem(view, id, "webmeet-markdown-" + id, '<a class="plugin-markdown fa" title="Markdown Editor. Click to open"><b style="font-size: large;">M&darr;</b></a>');

                    if (markdown) markdown.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();
                        doMarkdown(view);

                    }, false);
                }
            });

            console.log("markdown plugin is ready");
        },

        'overrides': {
            'onConnected': function () {

                Promise.all([_converse.api.waitUntil('rosterContactsFetched'), _converse.api.waitUntil('chatBoxesFetched'), _converse.api.waitUntil('bookmarksInitialized')]).then(() =>
                {
                    ready = true;
                    console.debug("markdown plugin is ready");
                })

                _converse.__super__.onConnected.apply(this, arguments);
            },

            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    var that = this;
                    var originator = that.model.vcard && that.model.vcard.get("jid") ? that.model.vcard.get("jid") : that.model.get("from");
                    var source = that.model.get("type") == "groupchat" ? that.model.get("from") : that.model.get("jid");

                    if (ready)
                    {
                        var form = that.el.querySelector('.marked-forms input[type=button]') || that.el.querySelector('.marked-forms input[type=submit]');
                        var inputs = that.el.querySelectorAll('.marked-forms input:not([type=button]):not([type=submit])');

                        if (form && !handlers[form.id])
                        {
                            var box_jid = Strophe.getBareJidFromJid(source);
                            var myNick = _converse.xmppstatus.vcard.get('fullname') || Strophe.getNodeFromJid(_converse.bare_jid);
                            var box = _converse.chatboxes.get(box_jid);
                            var view = getSelectedChatBox();

                            console.debug("renderChatMessage - form", box, form, view);

                            if (box) myNick = box.get('nick');

                            form.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();
                                var formJson = {event: "markdown-form-data", nick: myNick};

                                for (var j=0; j< inputs.length; j++)
                                {
                                    console.debug("renderChatMessage - form data", inputs[j].type, inputs[j].name, inputs[j].value, inputs[j].checked);

                                    if (inputs[j].type == "text" || inputs[j].type == "textarea" || inputs[j].checked)
                                    {
                                        formJson[inputs[j].name] = inputs[j].value;
                                    }
                                }

                                _converse.connection.send($msg({'to': originator}).c("json", {xmlns: "urn:xmpp:json:0"}).t(JSON.stringify(formJson)));
                                if (view) submitMessage(view, '/me submitted form ' + form.id);
                                delete handlers[form.id]

                            });

                            handlers[form.id] = {};
                            console.debug("renderChatMessage - markdown", form.id);
                        }
                    }
                    await this.__super__.renderChatMessage.apply(this, arguments);
                }
            },

            ChatBoxView: {
                parseMessageForCommands: function(text) {
                    console.debug('markdown - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();

                    if (command == "md" && bgWindow) return doMarkdown(this);
                    else

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                }
            }
        }
    });

    var doMarkdown = function(view)
    {
        bgWindow.pade.activeView = view;
        var url = chrome.extension.getURL("inverse/plugins/editor.html");

        bgWindow.closeWebAppsWindow(url);
        bgWindow.openWebAppsWindow(url, null, 623, 600);

        return true;
    }

    var getSelectedChatBox = function()
    {
        var views = _converse.chatboxviews.model.models;
        var view = null;

        console.debug("getSelectedChatBox", views[i]);

        for (var i=0; i<views.length; i++)
        {
            if ((views[i].get('type') === "chatroom" || views[i].get('type') === "chatbox") && !views[i].get('hidden'))
            {
                view = _inverse.chatboxviews.views[views[i].id];
            }
        }
        return view;
    }

    var submitMessage = function(view, inviteMsg)
    {
        view.model.sendMessage(inviteMsg);
    }
}));
