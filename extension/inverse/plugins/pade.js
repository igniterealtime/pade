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
    var Strophe = converse.env.Strophe,
        $iq = converse.env.$iq,
        $msg = converse.env.$msg,
        $pres = converse.env.$pres,
        $build = converse.env.$build,
        b64_sha1 = converse.env.b64_sha1,
        _ = converse.env._,
        moment = converse.env.moment;

     var _converse = null;
     var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
     var notified = false;

    // The following line registers your plugin.
    converse.plugins.add("pade", {

        /* Optional dependencies are other plugins which might be
           * overridden or relied upon, and therefore need to be loaded before
           * this plugin. They are called "optional" because they might not be
           * available, in which case any overrides applicable to them will be
           * ignored.
           *
           * NB: These plugins need to have already been loaded via require.js.
           *
           * It's possible to make optional dependencies non-optional.
           * If the setting "strict_plugin_dependencies" is set to true,
           * an error will be raised if the plugin is not found.
           */
        'dependencies': [],

        /* Converse.js's plugin mechanism will call the initialize
         * method on any plugin (if it exists) as soon as the plugin has
         * been loaded.
         */
        'initialize': function () {
            /* Inside this method, you have access to the private
             * `_converse` object.
             */
            _converse = this._converse;
            window._inverse = _converse;
            window.inverse = converse;

            if (bgWindow.pade.chatWindow)
            {
                chrome.windows.onFocusChanged.addListener(function(win)
                {
                    if (win == -1) notified = false;
                    if (win == bgWindow.pade.chatWindow.id) notified = false;
                });

                document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Converse - " + _converse.VERSION_NAME;
            }

            _converse.log("The \"pade\" plugin is being initialized");

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

            /* Besides `_converse.api.settings.update`, there is also a
             * `_converse.api.promises.add` method, which allows you to
             * add new promises that your plugin is obligated to fulfill.
             *
             * This method takes a string or a list of strings which
             * represent the promise names:
             *
             *      _converse.api.promises.add('myPromise');
             *
             * Your plugin should then, when appropriate, resolve the
             * promise by calling `_converse.api.emit`, which will also
             * emit an event with the same name as the promise.
             * For example:
             *
             *      _converse.api.emit('operationCompleted');
             *
             * Other plugins can then either listen for the event
             * `operationCompleted` like so:
             *
             *      _converse.api.listen.on('operationCompleted', function { ... });
             *
             * or they can wait for the promise to be fulfilled like so:
             *
             *      _converse.api.waitUntil('operationCompleted', function { ... });
             */
        },

        /* If you want to override some function or a Backbone model or
         * view defined elsewhere in converse.js, then you do that under
         * the "overrides" namespace.
         */
        'overrides': {
            /* For example, the private *_converse* object has a
             * method "onConnected". You can override that method as follows:
             */
            'onConnected': function () {
                var _converse = this;

                var initPade = function initPade()
                {
                    var myNick = _converse.nickname || Strophe.getNodeFromJid(_converse.bare_jid);
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

                    console.log("pade plugin is ready");
                }

                _converse.on('message', function (data)
                {
                    var  message = data.stanza;
                    var full_from_jid = message.getAttribute('from');
                    var from_jid = Strophe.getBareJidFromJid(full_from_jid);
                    var body = message.querySelector('body');
                    var chatbox = _converse.chatboxes.get(from_jid);

                    if (body && chatbox)
                    {
                        // draw attention to new messages
                        // done here instead of background.js becasue of chatroom messages

                        if (bgWindow.pade.chatWindow && !notified)
                        {
                            chrome.windows.update(bgWindow.pade.chatWindow.id, {drawAttention: true});
                            notified = true;
                        }

                        if (chatbox.get('type') == "chatroom")  // chatboxes handled in background.js
                        {
                            var myNick =  chatbox.get('nick');
                            var theNick =  chatbox.get('name');

                            if (bgWindow) scanMessage(from_jid, body.innerHTML, theNick, myNick);
                        }
                    }
                });

                Promise.all([_converse.api.waitUntil('bookmarksInitialized')]).then(initPade);

                _converse.__super__.onConnected.apply(this, arguments);
            },

            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    if (getSetting("notifyOnInterests", false))
                    {
                        var body = this.model.get('message');
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

    var scanMessage = function(fromJid, body, fromNick, myNick)
    {
        console.debug("scanMessage", fromJid, body, fromNick, myNick);

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
                    if (mentioned) notifyMe(body, fromNick, fromJid);
                }
            }
        }
    }

    var notifyMe = function(text, fromNick, fromJid)
    {
        console.debug("notifyMe", text, fromNick, fromJid);

        _converse.playSoundNotification();

        bgWindow.notifyText(text, fromNick, null, [{title: "Show Conversation?", iconUrl: chrome.extension.getURL("check-solid.svg")}], function(notificationId, buttonIndex)
        {
            if (buttonIndex == 0)
            {
                _converse.api.rooms.open(fromJid);
                bgWindow.pade.minimised = false;    // needed to reset if minimised is confused
                chrome.windows.update(bgWindow.pade.chatWindow.id, {focused: true});
            }

        }, fromJid);
    };
}));