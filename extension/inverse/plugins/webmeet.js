// version 0.4.11.1

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as a module called "webmeet"
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

     var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
     var _converse = null;
     var baseUrl = null;
     var messageCount = 0;
     var h5pViews = {};
     var pasteInputs = {};
     var videoRecorder = null;

    // override converse for openfire
    Strophe.addNamespace('MAM', 'urn:xmpp:mam:1');

    // The following line registers your plugin.
    converse.plugins.add("webmeet", {

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

            if (bgWindow)
            {
                bgWindow._converse = _converse;
                bgWindow.converse = converse;
            }

            baseUrl = "https://" + _converse.api.settings.get("bosh_service_url").split("/")[2];
            _converse.log("The \"webmeet\" plugin is being initialized");

            /* From the `_converse` object you can get any configuration
             * options that the user might have passed in via
             * `converse.initialize`.
             *
             * You can also specify new configuration settings for this
             * plugin, or override the default values of existing
             * configuration settings. This is done like so:
            */
            _converse.api.settings.update({
                'initialize_message': 'Initializing webmeet',
                'visible_toolbar_buttons': {
                    'emoji': true,
                    'call': false,
                    'clear': true
                },

                hide_open_bookmarks: true,
                ofswitch: false,
                uport_data: {avatar: "", name: "", email: "", phone: "", country: ""},
                webmeet_record: false,
                webmeet_record_audio: false,
                webmeet_record_video: false,
                webmeet_transcription: false,
                webmeet_captions: false,
                webmeet_invitation: 'Please join meeting in room '
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

                if (data.message.get("message"))
                {
                    var body = data.message.get("message");
                    var pos = body.indexOf("/h5p/")

                    if (pos > -1)
                    {
                        var id = body.substring(pos + 11);
                        //console.log("messageAdded h5p", id);
                        h5pViews[id] = data.chatbox;
                    }
                }
            });

            window.addEventListener('message', function (event)
            {
                if (event.data.event == "ofmeet.event.xapi")
                {
                    //console.log("webmeet xpi handler", h5pViews, event.data);

                    if (event.data.action == "completed")
                    {
                        if (h5pViews[event.data.id])
                        {
                            //console.log("webmeet xpi handler", h5pViews, event.data);

                            var view = h5pViews[event.data.id];
                            var nick = _converse.xmppstatus.vcard.get('nickname') || _converse.xmppstatus.vcard.get('fullname') || _converse.connection.jid;

                            if (view.get("message_type") == "groupchat")
                            {
                                nick = view.get("nick");
                            }
                            var msg = nick + " completed " + event.data.category + " in " + event.data.id + " and scored " + Math.round(event.data.value * 100) / 100 + "%";

                            var attrs = view.getOutgoingMessageAttributes(msg);
                            view.sendMessage(attrs);
                        }
                    }
                }

            });

            console.log("webmeet plugin is ready");

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

                _converse.connection.xmlInput = function(b) {
                    //console.log("xmlInput", b);
                };
                _converse.connection.xmlOutput = function(b) {
                    //console.log("xmlOutput", b);
                };

                var uPort = _converse.api.settings.get("uport_data");
                var username = Strophe.getNodeFromJid(_converse.connection.jid);

                //console.log("Found uport data", uPort);

                // only save avatar if user has success with uport

                if (username && username != "" && uPort && uPort.name != "" && uPort.avatar != "")
                {
                    var stanza = $iq({type: 'get', to: Strophe.getBareJidFromJid(_converse.connection.jid)}).c('vCard', {xmlns: 'vcard-temp'});

                    _converse.connection.sendIQ(stanza, function(iq) {
                        var vCard = getVCard(iq);

                        vCard.name = uPort.name;
                        vCard.nickname = uPort.name;
                        vCard.email = uPort.email;
                        vCard.workPhone = uPort.phone;
                        vCard.country = uPort.country;
                        vCard.role = "uport";
                        vCard.url = uPort.avatar;    // TODO ipfs address url

                        if (uPort.avatar)
                        {
                            var sourceImage = new Image();
                            sourceImage.crossOrigin="anonymous";

                            sourceImage.onload = function()
                            {
                                var canvas = document.createElement("canvas");
                                canvas.width = 32;
                                canvas.height = 32;
                                canvas.getContext("2d").drawImage(sourceImage, 0, 0, 32, 32);

                                vCard.avatar = canvas.toDataURL();

                                _converse.connection.sendIQ( setVCard(vCard), function(resp)
                                {
                                    //console.log("set vcard ok", resp);
                                    _converse.__super__.onConnected.apply(this, arguments);

                                }, function(err) {
                                    console.error("set vcard error", err);
                                    _converse.__super__.onConnected.apply(this, arguments);
                                });
                            }

                            sourceImage.src = uPort.avatar;
                        }
                        else {
                            _converse.__super__.onConnected.apply(this, arguments);
                        }
                    });
                }
                else {
                    _converse.__super__.onConnected.apply(this, arguments);
                }
            },

            MessageView: {

                renderChatMessage: function renderChatMessage()
                {
                    //console.log('webmeet - renderChatMessage', this.model);

                    var nick = this.model.getDisplayName();

                    if (nick && !this.model.vcard.attributes.fullname) // no vcard
                    {
                        this.model.vcard.attributes.image = createAvatar(this.model.vcard.attributes.image, nick);
                    }

/* REMOVE
                    if (!document.hasFocus() && window.parent && window.parent.ofmeet)
                    {
                        window.parent.ofmeet.doBadge(++messageCount);
                    } else {
                        messageCount = 0;
                    }
*/
                    var body = this.model.get('message');
                    var oobUrl = this.model.get('oob_url');
                    var oobDesc = this.model.get('oob_desc');

                    if (oobUrl && oobDesc) {
                        var viewId = "oob-url-" + Math.random().toString(36).substr(2,9)
                        var oob_content = '<a id="' + viewId + '" href="#">' + oobDesc + '</a>';
                        setupContentHandler(this, oobUrl, oob_content, doOobSession, viewId);
                    }
                    else

                    if (body)
                    {
                        var pos = body.indexOf(baseUrl)

                        if (pos > -1)
                        {
                            var pos0 = body.indexOf("/jitsimeet/index.html?room=")
                            var pos1 = body.indexOf("/ofmeet/");
                            var pos2 = body.indexOf("/h5p/");

                            if ( pos0 > -1)
                            {
                                //console.log("audio/video invite", body);
                                var link_room = body.substring(pos0 + 27);
                                var link_content = '<a id="' + link_room + '" href="#">' + _converse.api.settings.get("webmeet_invitation") + link_room + '</a>';
                                setupContentHandler(this, link_room, link_content, doAVConference, link_room);
                            }
                            else

                            if ( pos1 > -1)
                            {
                                //console.log("audio/video invite", body);
                                var link_room = body.substring(pos1 + 8);
                                var link_content = '<a id="' + link_room + '" href="#">' + _converse.api.settings.get("webmeet_invitation") + link_room + '</a>';
                                setupContentHandler(this, link_room, link_content, doAVConference, link_room);

                            }
                            else

                            if ( pos2 > -1)
                            {
                                //console.log("h5p content", this.model.attributes);
                                var path = body.substring(pos2 + 11);
                                var hp5_url = baseUrl + "/apps/h5p/?path=" + path;
                                var h5p_content = '<iframe src="' + hp5_url + '" id="hp5_' + path + '" allow="microphone; camera;" frameborder="0" seamless="seamless" allowfullscreen="true" style="z-index: 2147483647;width:100%;height:640px;resize: both;overflow: auto;"></iframe>';
                                setupContentHandler(this, null, h5p_content);
                            }
                            else {
                                renderSuperChatMessage(this, arguments);
                            }
                        } else {
                            renderSuperChatMessage(this, arguments);
                        }

                    } else {
                        renderSuperChatMessage(this, arguments);
                    }
                }
            },

            ChatBoxView: {

                toggleCall: function toggleCall(ev) {
                    //console.log("toggleCall", this.model);

                    ev.stopPropagation();

                    if ( _converse.view_mode === 'overlayed')
                    {

                    }
                    else

                    if (_converse.view_mode === 'embedded')
                    {
                        var url = "../phone/index.html";
                        var converseDiv = document.getElementById("conversejs");
                        var jitsiDiv = document.getElementById("jitsimeet");

                        iframeURLChange(jitsiDiv, function (newURL)
                        {
                            if (newURL.indexOf("/jitsimeet/") == -1 && newURL.indexOf("/phone/") == -1)
                            {
                                converseDiv.style.display = "inline";
                                jitsiDiv.style.display = "none";
                                jitsiDiv.src = "about:blank";
                            }
                        });

                        converseDiv.style.display = "none";
                        jitsiDiv.src = url;
                        jitsiDiv.style.display = "inline";

                    } else  if (bgWindow) {
                        //console.log('callButtonClicked');
                        var room = Strophe.getNodeFromJid(this.model.attributes.jid).toLowerCase();

                        if (this.model.get("message_type") == "chat")
                        {
                            room = bgWindow.makeRoomName(room);
                        }

                        bgWindow.openWebAppsWindow(chrome.extension.getURL("webcam/sip-video.html?url=sip:" + room), null, 800, 640)
                    }
                },

                renderToolbar: function renderToolbar(toolbar, options) {
                   //console.log('webmeet - renderToolbar', this.model);

                    var view = this;
                    var id = this.model.get("box_id");
                    var jid = this.model.get("jid");
                    var type = this.model.get("type");

                    // hide occupants list by default
                    this.model.set({'hidden_occupants': true});

                    if (bgWindow && bgWindow.getSetting("enablePasting", true))
                    {
                        // paste
                        pasteInputs[id] = $(this.el).find('.chat-textarea');
                        pasteInputs[id].pastableTextarea();

                        pasteInputs[id].on('pasteImage', function(ev, data){
                            console.log("pade - pasteImage", data);
                            var file = new File([data.blob], "paste-" + Math.random().toString(36).substr(2,9) + ".png", {type: 'image/png'});
                            view.model.sendFiles([file]);

                        }).on('pasteImageError', function(ev, data){
                            console.error('pasteImageError', data);

                        }).on('pasteText', function(ev, data){
                            console.log("pasteText", data);

                            if (data.text.indexOf("http:") == 0  || data.text.indexOf("https:") == 0)
                            {
                                pasteLinkPreview(data.text, pasteInputs[id]);
                            }

                        }).on('pasteTextRich', function(ev, data){
                            //console.log("pasteTextRich", data);

                        }).on('pasteTextHtml', function(ev, data){
                            //console.log("pasteTextHtml", data);

                        }).on('focus', function(){
                            //console.log("paste - focus", id);

                        }).on('blur', function(){
                            //console.log("paste - blur", id);
                        });
                    }


                    if (_converse.view_mode === 'mobile')
                    {
                         document.title = this.model.attributes.jid;
                    }

                    var result = this.__super__.renderToolbar.apply(this, arguments);

                    $(this.el).find('.toggle-toolbar-menu .toggle-smiley').after('<li id="place-holder"></li>');

                    if (_converse.view_mode === 'embedded')
                    {
                        var html = '<li id="webmeet-exit-webchat-' + id + '"><a class="fa fa-sign-out" title="Exit Web Chat"></a></li>';
                        $(this.el).find('#place-holder').after(html);

                    } else {
                        // file upload by drag & drop

                        var dropZone = $(this.el).find('.chat-body')[0];
                        dropZone.removeEventListener('dragover', handleDragOver);
                        dropZone.removeEventListener('drop', handleDropFileSelect);
                        dropZone.addEventListener('dragover', handleDragOver, false);
                        dropZone.addEventListener('drop', handleDropFileSelect, false);

                        // h5p content button

                        if (bgWindow && bgWindow.pade.activeH5p)
                        {
                            var html = '<li id="h5p-' + id + '"><a class="fa fa-h-square" title="Add H5P Content"></a></li>';
                            $(this.el).find('#place-holder').after(html);
                        }

                        if (bgWindow && bgWindow.pade.activeUrl)
                        {
                            var html = '<li id="oob-' + id + '"><a class="fa fa-file" title="Add Collaborative Document"></a></li>';
                            $(this.el).find('#place-holder').after(html);
                        }
                    }

                    var html = '<li id="webmeet-jitsi-meet-' + id + '"><a class="fa fa-users" title="Audio/Video Conference"></a></li>';
                    $(this.el).find('#place-holder').after(html);

                    html = '<li id="webmeet-scrolldown-' + id + '"><a class="fa fa-angle-double-down" title="Scroll to the bottom"></a></li>';
                    $(this.el).find('#place-holder').after(html);

                    if (bgWindow)
                    {
                        html = '<li id="webmeet-screencast-' + id + '"><a class="fas fa-desktop" title="ScreenCast. Click to start and stop"></a></li>';
                        $(this.el).find('#place-holder').after(html);
                    }

                    setTimeout(function()
                    {
                        var exitButton = document.getElementById("webmeet-exit-webchat-" + id);
                        if (exitButton) exitButton.addEventListener('click', doExit, false);

                        var h5pButton = document.getElementById("h5p-" + id);

                        if (h5pButton && bgWindow)
                        {
                            h5pButton.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                if (confirm(bgWindow.pade.activeH5p + " " + (chrome.i18n ? chrome.i18n.getMessage("hp5Confirm") : "H5p?")))
                                {
                                    doH5p(view, id);
                                }

                            }, false);
                        }

                        var oobButton = document.getElementById("oob-" + id);

                        if (oobButton && bgWindow)
                        {
                            oobButton.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                if (confirm((chrome.i18n ? chrome.i18n.getMessage("oobConfirm") : "Collaboration") + "\n\"" + bgWindow.pade.collabDocs[bgWindow.pade.activeUrl] + "\"?"))
                                {
                                    doooB(view, id, jid, type);
                                }

                            }, false);
                        }

                        var exitJitsiMeet = document.getElementById("webmeet-jitsi-meet-" + id);

                        if (exitJitsiMeet)
                        {
                            exitJitsiMeet.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                if (confirm(chrome.i18n ? chrome.i18n.getMessage("jitsiConfirm"): "Jitsi Meeting?"))
                                {
                                    doVideo(view);
                                }

                            }, false);
                        }

                        var screencast = document.getElementById("webmeet-screencast-" + id);

                        if (screencast)
                        {
                            screencast.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                if (videoRecorder == null)
                                {
                                    chrome.desktopCapture.chooseDesktopMedia(['screen', 'window', 'tab'], null, function(streamId)
                                    {
                                        navigator.mediaDevices.getUserMedia({
                                            audio: false,
                                            video: {
                                                mandatory: {
                                                    chromeMediaSource: 'desktop',
                                                    chromeMediaSourceId: streamId
                                                }
                                            }
                                        }).then((stream) => handleStream(stream, view)).catch((e) => handleError(e))
                                    })

                                } else {
                                    videoRecorder.stop();
                                }

                            }, false);
                        }

                        var scrolldown = document.getElementById("webmeet-scrolldown-" + id);

                        if (scrolldown)
                        {
                            scrolldown.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();
                                view.viewUnreadMessages()

                            }, false);
                        }

                    });

                    return result;
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

    var renderSuperChatMessage = function(chat, arguments)
    {
        chat.__super__.renderChatMessage.apply(chat, arguments);
    }

    var setupContentHandler = function(chat, avRoom, content, callback, chatId)
    {
        var moment_time = moment(chat.model.get('time'));
        var pretty_time = moment_time.format(_converse.time_format);
        var time = moment_time.format();

        var msg_content = document.createElement("div");
        msg_content.setAttribute("class", "message chat-msg groupchat");
        msg_content.setAttribute("data-isodate", time);

        msg_content.innerHTML = '<img class="avatar" src="data:image/png;base64,' + chat.model.vcard.attributes.image + '" style="width: 36px; width: 36px; height: 100%; margin-right: 10px;"/> <div class="chat-msg-content"> <span class="chat-msg-heading"> <span class="chat-msg-author">' + chat.model.getDisplayName() + '</span> <span class="chat-msg-time">' + pretty_time + '</span> </span> <span class="chat-msg-text">' + content + '</span> <div class="chat-msg-media"></div> </div>';
        chat.replaceElement(msg_content);

        if (avRoom && callback && chatId)
        {
            setTimeout(function()
            {
                if (document.getElementById(chatId)) document.getElementById(chatId).onclick = function()
                {
                    callback(avRoom, Strophe.getBareJidFromJid(chat.model.get("from")), chat.model.get("type"));
                }
            });
        }
    }

    var doAVConference = function doAVConference(room)
    {
        //console.log("doAVConference", room);
        var url = null;

        if ( _converse.view_mode === 'overlayed')
        {
            if (window.pade && window.pade.url)
            {
                url = "https://" + _converse.api.settings.get("bosh_service_url").split("/")[2] + "/ofmeet/" + room;
                window.open(window.pade.url + "jitsi-meet/chrome.index.html?room=" + room, location.href);
            }
        }
        else

        if (_converse.view_mode === 'embedded')
        {
            var url = "../verto/index.html";
            var converseDiv = document.getElementById("conversejs");
            var jitsiDiv = document.getElementById("jitsimeet");

            if (_converse.api.settings.get("ofswitch") == false)
            {
                var url = "../jitsimeet/index.html?room=";
                url = url + room;

                var a = document.createElement('a');
                a.href = url;
                url = a.href;

                iframeURLChange(jitsiDiv, function (newURL)
                {
                    if (newURL.indexOf("/jitsimeet/") == -1 && newURL.indexOf("/phone/") == -1)
                    {
                        converseDiv.style.display = "inline";
                        jitsiDiv.style.display = "none";
                        jitsiDiv.src = "about:blank";
                    }
                });

                converseDiv.style.display = "none";
                jitsiDiv.src = url;
                jitsiDiv.style.display = "inline";

            } else {
                window.open(url, location.href);
            }

        } else {
            url = "https://" + _converse.api.settings.get("bosh_service_url").split("/")[2] + "/ofmeet/" + room;
            if (bgWindow) bgWindow.openVideoWindow(room);
        }
        return url;
    }

    var doVideo = function doVideo(view)
    {
        var room = Strophe.getNodeFromJid(view.model.attributes.jid).toLowerCase() + "-" + Math.random().toString(36).substr(2,9);
        url = doAVConference(room);

        console.log("doVideo", room, url, view);

        if (_converse.api.settings.get("ofswitch") == false)
        {
            var inviteMsg = _converse.api.settings.get("webmeet_invitation") + ' ' + url;
            view.onMessageSubmitted(inviteMsg);
        }
    }

    var doExit = function doExit(event)
    {
        event.stopPropagation();
        //console.log("doExit", event);
        if (window.parent && window.parent.ofmeet) window.parent.ofmeet.doExit();
        messageCount = 0;
    }

    var doOobSession = function doOobSession(url, jid, type)
    {
        console.log("doOobSession", url, jid, type);
        bgWindow.openWebAppsWindow(chrome.extension.getURL("collab/index.html?owner=false&url=" + url + "&jid=" + jid + "&type=" + type), null, 1024, 800);
    }

    var doooB = function doooB(view, id, jid, type)
    {
        var activeDoc = bgWindow.pade.collabDocs[bgWindow.pade.activeUrl];
        console.log("doooB", activeDoc, view, id, jid, type);

        _converse.connection.send($msg(
        {
            'from': _converse.connection.jid,
            'to': view.model.get('jid'),
            'type': view.model.get('message_type'),
            'id': _converse.connection.getUniqueId()
        }).c('body').t(bgWindow.pade.activeUrl).up().c('x', {xmlns: 'jabber:x:oob'}).c('url').t(bgWindow.pade.activeUrl).up().c('desc').t(activeDoc));

        bgWindow.openWebAppsWindow(chrome.extension.getURL("collab/index.html?owner=true&url=" + bgWindow.pade.activeUrl + "&jid=" + jid + "&type=" + type), null, 1024, 800);
    }

    var doH5p = function doH5p(view, id)
    {
        //console.log("doH5p", view);
        view.onMessageSubmitted(bgWindow.pade.activeH5p);
    }

    var handleDragOver = function handleDragOver(evt)
    {
        //console.log("handleDragOver");

        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    };

    var handleDropFileSelect = function handleDropFileSelect(evt)
    {
        evt.stopPropagation();
        evt.preventDefault();

        _converse.chatboxviews.each(function (view)
        {
            //console.log("handleDropFileSelect", view.model.get('type'));

            if ((view.model.get('type') === "chatroom" || view.model.get('type') === "chatbox") && !view.model.get('hidden'))
            {
                var files = evt.dataTransfer.files;
                view.model.sendFiles(files);
            }
        });
    };

    var iframeURLChange = function(iframe, callback) {
        var lastDispatched = null;

        var dispatchChange = function () {
            var newHref = iframe.contentWindow.location.href;

            if (newHref !== lastDispatched) {
                callback(newHref);
                lastDispatched = newHref;
            }
        };

        var unloadHandler = function () {
            // Timeout needed because the URL changes immediately after
            // the `unload` event is dispatched.
            setTimeout(dispatchChange, 0);
        };

        function attachUnload() {
            // Remove the unloadHandler in case it was already attached.
            // Otherwise, there will be two handlers, which is unnecessary.
            iframe.contentWindow.removeEventListener("unload", unloadHandler);
            iframe.contentWindow.addEventListener("unload", unloadHandler);
        }

        iframe.addEventListener("load", function () {
            attachUnload();

            // Just in case the change wasn't dispatched during the unload event...
            dispatchChange();
        });

        attachUnload();
    }

    var nickColors = {}

    var getRandomColor = function getRandomColor(nickname)
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

    var createAvatar = function(avatar, nickname)
    {
        var canvas = document.createElement('canvas');
        canvas.style.display = 'none';
        canvas.width = '32';
        canvas.height = '32';
        document.body.appendChild(canvas);
        var context = canvas.getContext('2d');
        context.fillStyle = getRandomColor(nickname);
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = "16px Arial";
        context.fillStyle = "#fff";

        var first, last;
        var name = nickname.split(" ");
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
            avatar = data.split(";base64,")[1];
        }

        return avatar;
    }

    var getVCard = function(response)
    {
        var response = $(response);
        var name = response.find('vCard FN').text();
        var photo = response.find('vCard PHOTO');

        var avatar = "";

        if (photo.find('BINVAL').text() != "" && photo.find('TYPE').text() != "")
        avatar = 'data:' + photo.find('TYPE').text() + ';base64,' + photo.find('BINVAL').text();

        var family = response.find('vCard N FAMILY') ? response.find('vCard N FAMILY').text() : "";
            var middle = response.find('vCard N MIDDLE') ? response.find('vCard N MIDDLE').text() : "";
        var given = response.find('vCard N GIVEN') ? response.find('vCard N GIVEN').text() : "";

        var nickname = response.find('vCard NICKNAME') ? response.find('vCard NICKNAME').text() : "";

        var email = response.find('vCard EMAIL USERID') ? response.find('vCard EMAIL USERID').text() : "";
        var url = response.find('vCard URL') ? response.find('vCard URL').text() : "";
        var role = response.find('vCard ROLE') ? response.find('vCard ROLE').text() : "";

        var workPhone = "";
        var homePhone = "";
        var workMobile = "";
        var homeMobile = "";

        response.find('vCard TEL').each(function()
        {
            if ($(this).find('VOICE').size() > 0 && $(this).find('WORK').size() > 0)
                workPhone = $(this).find('NUMBER').text();

            if ($(this).find('VOICE').size() > 0 && $(this).find('HOME').size() > 0)
                homePhone = $(this).find('NUMBER').text();

            if ($(this).find('CELL').size() > 0 && $(this).find('WORK').size() > 0)
                workMobile = $(this).find('NUMBER').text();

            if ($(this).find('CELL').size() > 0 && $(this).find('HOME').size() > 0)
                homeMobile = $(this).find('NUMBER').text();
        });

        var street = "";
        var locality = "";
        var region = "";
        var pcode = "";
        var country = "";

        response.find('vCard ADR').each(function()
        {
            if ($(this).find('WORK').size() > 0)
            {
                street = $(this).find('STREET').text();
                locality = $(this).find('LOCALITY').text();
                region = $(this).find('REGION').text();
                pcode = $(this).find('PCODE').text();
                country = $(this).find('CTRY').text();
            }
        });

        var orgName = response.find('vCard ORG ORGNAME') ? response.find('vCard ORG ORGNAME').text() : "";
        var orgUnit = response.find('vCard ORG ORGUNIT') ? response.find('vCard ORG ORGUNIT').text() : "";

        var title = response.find('vCard TITLE') ? response.find('vCard TITLE').text() : "";

        return {name: name, avatar: avatar, family: family, given: given, nickname: nickname, middle: middle, email: email, url: url, homePhone: homePhone, workPhone: workPhone, homeMobile: homeMobile, workMobile: workMobile, street: street, locality: locality, region: region, pcode: pcode, country: country, orgName: orgName, orgUnit: orgUnit, title: title, role: role};
    }

    var setVCard = function(user)
    {
        var avatar = user.avatar.split(";base64,");

        var iq = $iq({to:  _converse.connection.domain, type: 'set'}).c('vCard', {xmlns: 'vcard-temp'})

        .c("FN").t(user.name).up()
        .c("NICKNAME").t(user.nickname).up()
        .c("URL").t(user.url).up()
        .c("ROLE").t(user.role).up()
        .c("EMAIL").c("INTERNET").up().c("PREF").up().c("USERID").t(user.email).up().up()
        .c("PHOTO").c("TYPE").t(avatar[0].substring(5)).up().c("BINVAL").t(avatar[1]).up().up()
        .c("TEL").c("VOICE").up().c("WORK").up().c("NUMBER").t(user.workPhone).up().up()
        .c("ADR").c("WORK").up().c("STREET").t(user.street).up().c("LOCALITY").t(user.locality).up().c("REGION").t(user.region).up().c("PCODE").t(user.pcode).up().c("CTRY").t(user.country).up().up()
/*
        .c("TEL").c("PAGER").up().c("WORK").up().c("NUMBER").up().up()
        .c("TEL").c("CELL").up().c("WORK").up().c("NUMBER").t(user.workMobile).up().up()

        .c("TEL").c("FAX").up().c("WORK").up().c("NUMBER").up().up()
        .c("TEL").c("PAGER").up().c("HOME").up().c("NUMBER").up().up()
        .c("TEL").c("CELL").up().c("HOME").up().c("NUMBER").t(user.homeMobile).up().up()
        .c("TEL").c("VOICE").up().c("HOME").up().c("NUMBER").t(user.homePhone).up().up()
        .c("TEL").c("FAX").up().c("HOME").up().c("NUMBER").up().up()
        .c("URL").t(user.url).up()
        .c("ADR").c("HOME").up().c("STREET").up().c("LOCALITY").up().c("REGION").up().c("PCODE").up().c("CTRY").up().up()
        .c("TITLE").t(user.title).up()
*/
        return iq;
    }

    var handleStream = function handleStream (stream, view)
    {
        navigator.mediaDevices.getUserMedia({audio: true, video: false}).then((audioStream) => handleAudioStream(stream, audioStream, view)).catch((e) => handleError(e))
    }

    var handleAudioStream = function handleStream (stream, audioStream, view)
    {
        console.info("handleAudioStream - seperate", stream, audioStream);

        stream.addTrack(audioStream.getAudioTracks()[0]);
        audioStream.removeTrack(audioStream.getAudioTracks()[0]);

        console.info("handleAudioStream - merged", stream);

        var video = document.createElement('video');
        video.playsinline = true;
        video.autoplay = true;
        video.muted = true;
        video.srcObject = stream;
        video.style.display = "none";

        setTimeout(function()
        {
            videoRecorder = new MediaRecorder(stream);
            videoChunks = [];

            videoRecorder.ondataavailable = function(e)
            {
                console.info("handleStream - start", e);

                if (e.data.size > 0)
                {
                    console.log("startRecorder push video ", e.data);
                    videoChunks.push(e.data);
                }
            }

            videoRecorder.onstop = function(e)
            {
                console.info("handleStream - stop", e);

                stream.getTracks().forEach(track => track.stop());

                var blob = new Blob(videoChunks, {type: 'video/webm;codecs=h264'});
                var file = new File([blob], "screencast-" + Math.random().toString(36).substr(2,9) + ".webm", {type: 'video/webm;codecs=h264'});
                view.model.sendFiles([file]);
                videoRecorder = null;
            }

            videoRecorder.start();
            console.info("handleStream", video, videoRecorder);

        }, 1000);
    }

    var handleError = function handleError (e)
    {
        console.error("ScreenCast", e)
    }

    var pasteLinkPreview = function pasteLinkPreview(body, textarea)
    {
        console.log("pasteLinkPreview", body);

        if (bgWindow != null)
        {
            var linkUrl = btoa(body.split(" ")[0]);

            var server = bgWindow.getSetting("server");
            var username = bgWindow.getSetting("username");
            var password = bgWindow.getSetting("password");

            var url =  "https://" + server + "/rest/api/restapi/v1/ask/previewlink/3/" + linkUrl;
            var options = {method: "GET", headers: {"authorization": "Basic " + btoa(username + ":" + password), "accept": "application/json"}};

            console.log("fetch preview", url, options);

            var chat = this;

            fetch(url, options).then(function(response){ return response.json()}).then(function(preview)
            {
                console.log("preview link", preview, textarea);

                var text = body + "\n\n";

                if (preview.title) text = text + preview.title + "\n ";
                if (preview.image) text = text + preview.image.split("?")[0] + " \n";
                if (preview.descriptionShort) text = text + preview.descriptionShort + "\n";

                textarea[0].value = text;

            }).catch(function (err) {
                console.error('preview link', err);
            });
        }
    }

}));
