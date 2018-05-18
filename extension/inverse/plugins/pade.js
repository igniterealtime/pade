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

            _converse.api.settings.update({
                ofmeet_invitation: getSetting("ofmeetInvitation", 'Please join meeting at')
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

            console.log("pade is ready");

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
                // Overrides the onConnected method in converse.js

                // Top-level functions in "overrides" are bound to the
                // inner "_converse" object.
                var _converse = this;

                // Your custom code can come here ...

                var initPade = function initPade()
                {
                    var stanza = $iq({'from': _converse.connection.jid, 'type': 'get'}).c('query', { 'xmlns': "jabber:iq:private"}).c('storage', { 'xmlns': 'storage:bookmarks' });

                    _converse.connection.sendIQ(stanza, function(iq) {

                        $(iq).find('conference').each(function()
                        {
                            var myNick = _converse.xmppstatus.vcard.get('fullname') || Strophe.getNodeFromJid(_converse.bare_jid);

                            //console.log('pade BookmarksReceived', _converse, myNick, {name: $(this).attr("name"), jid: $(this).attr("jid"), autojoin: $(this).attr("autojoin")});

                            if (_converse.bookmarks)
                            {
                                _converse.bookmarks.create({
                                    'jid': $(this).attr("jid"),
                                    'name': $(this).attr('name'),
                                    'autojoin': $(this).attr('autojoin') === 'true' || $(this).attr('autojoin') === '1',
                                    'nick': myNick
                                });

                                var room = _converse.chatboxes.get($(this).attr("jid"));
                                if (room) room.save('bookmarked', true);
                            }

                        });

                        console.log("pade plugin ready");

                    }, function(error){
                        console.error("bookmarks error", error);

                    });
                }

                Promise.all([_converse.api.waitUntil('bookmarksInitialized')]).then(initPade);

                // You can access the original function being overridden
                // via the __super__ attribute.
                // Make sure to pass on the arguments supplied to this
                // function and also to apply the proper "this" object.
                _converse.__super__.onConnected.apply(this, arguments);

                // Your custom code can come here ...
            },

            MessageView: {

                renderChatMessage: function renderChatMessage()
                {
                    this.__super__.renderChatMessage.apply(this, arguments);

                    var body = this.model.get('message');
                    var from = this.model.getDisplayName();

                    if (bgWindow.pade.minimised && body)
                    {
                        //console.log("messageAdded", body);

                        var text = this.model.get('type') ? this.model.get('type') + " : " + body : body;

                        if (getSetting("notifyAllRoomMessages", false))
                        {
                            // TODO move to background page
                            notifyMe(text, from, from);
                        }

                        if (getSetting("notifyOnInterests", false))
                        {
                            var interestList = (getSetting("username", "") + "," + getSetting("interestList", "")).split(",");
                            var foundInterest = false;

                            for (var i=0; i<interestList.length; i++)
                            {
                                if (interestList[i] != "")
                                {
                                    var searchRegExp = new RegExp('^(.*)(\s?' + interestList[i] + ')', 'ig');

                                    if (searchRegExp.test(body))
                                    {
                                        // TODO move to background page
                                        notifyMe(text, from, from);
                                        break;
                                    }
                                }
                            }
                        }
                    }
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

    var notifyMe = function(text, room, id)
    {
        _converse.playSoundNotification();

        bgWindow.notifyText(text, room, null, [{title: "Show Conversation?", iconUrl: chrome.extension.getURL("success-16x16.gif")}], function(notificationId, buttonIndex)
        {
            if (buttonIndex == 0)
            {
                bgWindow.openChatWindow("inverse/index.html");
            }

        }, id);
    }

}));