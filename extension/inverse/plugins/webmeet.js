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

    var Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs;

     var doneIt = false;
     var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
     var _converse = null,  baseUrl = null, messageCount = 0, h5pViews = {}, pasteInputs = {}, videoRecorder = null, userProfiles = {};
     var PreviewDialog = null, previewDialog = null, GeoLocationDialog = null, geoLocationDialog = null, NotepadDialog = null, notepadDialog = null, QRCodeDialog = null, qrcodeDialog = null, PDFDialog = null, pdfDialog = null;

     // The following line registers your plugin.
    converse.plugins.add("webmeet", {
        'dependencies': [],

        'initialize': function () {
            /* Inside this method, you have access to the private
             * `_converse` object.
             */
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

            if (bgWindow)
            {
                bgWindow._converse = _converse;
                bgWindow.converse = converse;
            }

            baseUrl = "https://" + _converse.api.settings.get("bosh_service_url").split("/")[2];
            _converse.log("The \"webmeet\" plugin is being initialized");


            PreviewDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">Clipboard Paste Preview</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body"></div>' +
                         '<div class="modal-footer"> <button type="button" class="btn btn-success btn-preview-image" data-dismiss="modal">Accept</button> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button></div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                    var that = this;
                    var blob = this.model.get("blob");
                    var preview = this.model.get("preview");

                    this.el.addEventListener('shown.bs.modal', function()
                    {
                        if (blob)
                        {
                            var fileReader = new FileReader();

                            fileReader.onload = function(e)
                            {
                                that.el.querySelector('.modal-body').innerHTML = '<img class="pade-preview-image" src="' + e.target.result + '"/>';
                            }

                            fileReader.readAsDataURL(blob);
                        }
                        else

                        if (preview)
                        {
                            var text = "";

                            if (preview.title) text = text + "<b>" + preview.title + "</b><br/> ";
                            if (preview.image) text = text + "<img class='pade-preview-image' src='" + preview.image + "'/><br/>";
                            if (preview.descriptionShort) text = text + preview.descriptionShort + "<br/>";

                            that.el.querySelector('.modal-body').innerHTML = text;
                        }

                    }, false);
                },
                events: {
                    "click .btn-preview-image": "uploadImage",
                },

                uploadImage() {
                    var view = this.model.get("view");
                    var blob = this.model.get("blob");
                    var html = this.model.get("html");
                    var textarea = this.model.get("textarea");

                    if (blob)
                    {
                        var file = new File([blob], "paste-" + Math.random().toString(36).substr(2,9) + ".png", {type: 'image/png'});
                        view.model.sendFiles([file]);
                    }
                    else

                    if (html && textarea)
                    {
                        textarea[0].value = "";
                        submitMessage(view, html);

                        console.debug("uploadImage/Preview", html);
                    }
                    document.execCommand("cut");

                }
            });

            QRCodeDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  var title = this.model.get("title");
                  return '<div class="modal" id="myModal"> <div class="modal-dialog"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">' + title + '</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body"></div>' +
                         '<div class="modal-status">Please scan the QR code with your IRMA app</div>' +
                         '<div class="modal-footer"><button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button></div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                    var that = this;
                    var qrcode = this.model.get("qrcode");

                    this.el.addEventListener('shown.bs.modal', function()
                    {
                        if (qrcode)
                        {
                            that.el.querySelector('.modal-body').innerHTML = '<img src="' + qrcode + '" />';
                        }

                    }, false);
                },
                events: {
                    "click .btn-danger": "clearQRCode",
                },

                clearQRCode() {
                    var callback = this.model.get("callback");
                    var token = this.model.get("token");
                    if (callback && token) callback(token);
                },
                startSession() {
                    this.el.querySelector('.modal-status').innerHTML = "Please follow the instructions in your IRMA app";
                },
                endSession() {
                   this.modal.hide();
                }
            });

            PDFDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  return '<div class="modal" id="myModal"> <div class="modal-dialog"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">Save a PDF of Conversation</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body">' +
                         '  <label for="pdf-start" class="col-form-label">Start:</label>' +
                         '  <input id="pdf-start" type="text" class="form-control" name="pdf-start"/>' +
                         '  <label for="pdf-end" class="col-form-label">End:</label>' +
                         '  <input id="pdf-end" type="text" class="form-control" name="pdf-end"/>' +
                         '</div>' +
                         '<div class="modal-footer"> <button title="Save PDF" type="button" class="btn btn-success btn-save" data-dismiss="modal">Save</button> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button></div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                    var that = this;

                    this.el.addEventListener('shown.bs.modal', function()
                    {
                        flatpickr('#pdf-start', {dateFormat: 'Z', enableTime: true, defaultDate: new Date(dayjs().startOf('day'))});
                        flatpickr('#pdf-end', {dateFormat: 'Z', enableTime: true, defaultDate: new Date()});

                    }, false);
                },
                events: {
                    "click .btn-save": "savePDF",
                },

                savePDF() {
                    var view = this.model.get("view");
                    const start = this.el.querySelector("#pdf-start").value;
                    const end = this.el.querySelector("#pdf-end").value;
                    saveToPDF(view, start, end);
                }
            });

            GeoLocationDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">Geo Location</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body"></div>' +
                         '<div class="modal-footer"><button type="button" class="btn btn-danger" data-dismiss="modal">Close</button></div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                    var that = this;
                    var geoloc = this.model.get("geoloc");
                    var view = this.model.get("view");
                    var label = view.model.getDisplayName();

                    this.el.addEventListener('shown.bs.modal', function()
                    {
                        if (geoloc)
                        {
                            var query = "?label=" + label + "&lat=" + geoloc.lat + "&lng=" + geoloc.lon + "&accuracy=" + geoloc.accuracy;
                            that.el.querySelector('.modal-body').innerHTML = '<iframe frameborder="0" style="border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:600px;" src="../options/location/index.html' + query + '"></iframe>';
                        }

                    }, false);
                }
            });

            NotepadDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                    return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">Notepad</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body"></div>' +
                         '<div class="modal-footer"> <button title="Copy to clipboard" type="button" class="btn btn-success btn-share" data-dismiss="modal">Share</button> <button title="Clear notepad contents" type="button" class="btn btn-danger">Clear</button><button type="button" class="btn" data-dismiss="modal">Close</button></div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                    var that = this;
                    var view = this.model.get("view");
                    var notepad = view.model.get("notepad");

                    this.el.addEventListener('shown.bs.modal', function()
                    {
                        if (!notepad) notepad = "";
                        that.el.querySelector('.modal-body').innerHTML = '<textarea class="pade-notepad" style="border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:200px;">' + notepad + '</textarea>';

                    }, false);
                },
                events: {
                    "click .btn-share": "shareNotePad",
                    "click .btn-danger": "clearNotePad",
                },

                shareNotePad() {
                    const message = this.el.querySelector('.pade-notepad').value;

                    navigator.clipboard.writeText(message).then(function() {
                        console.debug('shareNotePad', message);

                        chrome.storage.local.set({"pade.notepad": message}, function(obj) {
                          console.debug('set shareNotePad', obj);
                        });
                    }, function(err) {
                        console.error('shareNotePad', err);
                    });
                },
                clearNotePad() {
                    this.el.querySelector('textarea').value = "";

                    chrome.storage.local.set({"pade.notepad": ""}, function(obj) {
                      console.debug('set shareNotePad', obj);
                    });
                }
            });

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
                webmeet_invitation: 'Please join meeting in room',
                webinar_invitation: 'Please join webinar at'
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
                        console.debug("messageAdded h5p", id);
                        h5pViews[id] = data.chatbox;
                    }
                }
            });

            _converse.on('message', function (data)
            {
                var message = data.stanza;
                var body = message.querySelector('body');
                var history = message.querySelector('forwarded');
            });

            _converse.api.listen.on('chatRoomOpened', function (view)
            {
                const jid = view.model.get("jid");
                const chat_area = view.el.querySelector('.chat-area');
                const occupants_area = view.el.querySelector('.occupants.col-md-3.col-4');

                console.debug("chatRoomOpened", jid, chat_area.classList, occupants_area.classList);

                if (!getSetting("alwaysShowOccupants", false))
                {
                    chat_area.classList.add('full');
                    occupants_area.classList.add('hiddenx');
                }
            });

            _converse.api.listen.on('chatBoxInitialized', function (view)
            {
                const jid = view.model.get("jid");
                console.debug("chatBoxInitialized", jid);
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                console.debug('webmeet - renderToolbar', view.model);

                // TODO - remove when code is merged into converse
                //
                document.addEventListener("keydown", function(event)
                {
                    const input = String.fromCharCode(event.keyCode);
                    const textEl = view.el.querySelector('.chat-textarea');
                    const isFocused = (document.activeElement === textEl);
                    const dialog = document.body.querySelector('.modal.show');
                    const isInvitedContact = view.el.querySelector('.invited-contact') === document.activeElement;
                    const isRosterFilter = document.body.querySelector('.roster-filter') === document.activeElement;

                    if (/[a-zA-Z0-9-_ ]/.test(input) && !isFocused && !view.model.get('hidden') && !dialog && !isInvitedContact && !isRosterFilter)
                    {
                        textEl.focus();
                    }
                });


                var id = view.model.get("box_id");
                var jid = view.model.get("jid");
                var type = view.model.get("type");

                if (getSetting("enablePasting", true))
                {
                    setupPastingHandlers(view, id, jid, type);
                }


                testFileUploadAvailable(view, function(isFileUploadAvailable)
                {
                    console.debug('webmeet - testFileUploadAvailable', isFileUploadAvailable, bgWindow.pade.ofmeetUrl);

                    var html = '';

                    if (bgWindow)
                    {
                        if (view.model.get('type') === "chatroom" && getSetting("moderatorTools", true))
                        {
                            html = '<a class="fa fa-wrench" title="Open Groupchat Moderator Tools GUI"></a>';
                            addToolbarItem(view, id, "moderator-tools-" + id, html);
                        }

                        if (view.model.get('type') === "chatbox" && bgWindow.pade.geoloc[jid])
                        {
                            html = '<a class="fas fa-location-arrow" title="Geolocation"></a>';
                            addToolbarItem(view, id, "webmeet-geolocation-" + id, html);
                        }

                        if (bgWindow.pade.ofmeetUrl)
                        {
                            html = '<a class="fas fa-video" title="Audio/Video/Screenshare Conference"></a>';
                            addToolbarItem(view, id, "webmeet-jitsi-meet-" + id, html);
                        }

                        if (bgWindow.pade.chatAPIAvailable)
                        {
                            const domain = Strophe.getDomainFromJid(jid);

                            if (domain == 'conference.' + _converse.connection.domain || domain == _converse.connection.domain)
                            {
                                html = '<a class="far fa-file-pdf" title="Save conversation to PDF"></a>';
                                addToolbarItem(view, id, "webmeet-savepdf-" + id, html);
                            }

                            if (bgWindow.pade.activeH5p)
                            {
                                var html = '<a class="fa fa-h-square" title="Add H5P Content"></a>';
                                addToolbarItem(view, id, "h5p-" + id, html);
                            }

                            if (getSetting("enableBlast", false))   // check for chat api plugin
                            {
                                html = '<a class="fas fa-bullhorn" title="Message Blast. Send same message to many people"></a>';
                                addToolbarItem(view, id, "webmeet-messageblast-" + id, html);
                            }
                        }

                        if (bgWindow.pade.activeUrl && getSetting("enableCollaboration", false))
                        {
                            var html = '<a class="fa fa-file" title="Add Collaborative Document"></a>';
                            addToolbarItem(view, id, "oob-" + id, html);
                        }


                        if (getSetting("webinarMode", false) && bgWindow.pade.ofmeetUrl)
                        {
                            html = '<a class="fa fa-file-powerpoint-o" title="Webinar. Make a web presentation to others"></a>';
                            addToolbarItem(view, id, "webmeet-webinar-" + id, html);
                        }

                        if (getSetting("enableTasksTool", false))
                        {
                            html = '<a class="fa fa-tasks" title="Tasks"></a>';
                            addToolbarItem(view, id, "webmeet-tasks-" + id, html);
                        }
                    }

                    if (getSetting("enableNotesTool", true))
                    {
                        html = '<a class="fa fa-pencil-alt" title="Notepad"></a>';
                        addToolbarItem(view, id, "webmeet-notepad-" + id, html);
                    }

                    html = '<a class="fas fa-desktop" title="ScreenCast. Click to start and stop"></a>';
                    addToolbarItem(view, id, "webmeet-screencast-" + id, html);

                    html = '<a class="fa fa-sync" title="Refresh"></a>';
                    addToolbarItem(view, id, "webmeet-refresh-" + id, html);

                    html = '<a class="far fa-trash-alt" title="Trash local storage of chat history"></a>';
                    addToolbarItem(view, id, "webmeet-trash-" + id, html);

                    html = '<a class="fa fa-angle-double-down" title="Scroll to the bottom"></a>';
                    addToolbarItem(view, id, "webmeet-scrolldown-" + id, html);


                    // file upload by drag & drop

                    var dropZone = $(view.el).find('.chat-body')[0];
                    dropZone.removeEventListener('dragover', handleDragOver);
                    dropZone.removeEventListener('drop', handleDropFileSelect);
                    dropZone.addEventListener('dragover', handleDragOver, false);
                    dropZone.addEventListener('drop', handleDropFileSelect, false);

                    if (bgWindow)
                    {
                        var h5pButton = document.getElementById("h5p-" + id);

                        if (h5pButton) h5pButton.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();

                            if (confirm(bgWindow.pade.activeH5p + " " + (chrome.i18n ? chrome.i18n.getMessage("hp5Confirm") : "H5p?")))
                            {
                                doH5p(view, id);
                            }

                        }, false);


                        var oobButton = document.getElementById("oob-" + id);

                        if (oobButton) oobButton.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();

                            if (confirm((chrome.i18n ? chrome.i18n.getMessage("oobConfirm") : "Collaboration") + "\n\"" + bgWindow.pade.collabDocs[bgWindow.pade.activeUrl] + "\"?"))
                            {
                                doooB(view, id, jid, type);
                            }

                        }, false);

                        var moderatorTools = document.getElementById("moderator-tools-" + id);

                        if (moderatorTools) moderatorTools.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();
                            view.showModeratorToolsModal('');

                        }, false);

                        var geoLocButton = document.getElementById("webmeet-geolocation-" + id);

                        if (geoLocButton) geoLocButton.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();

                            geoLocationDialog = new GeoLocationDialog({'model': new converse.env.Backbone.Model({geoloc: bgWindow.pade.geoloc[jid], view: view}) });
                            geoLocationDialog.show();

                        }, false);

                        var messageblast = document.getElementById("webmeet-messageblast-" + id);

                        if (messageblast) messageblast.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();
                            bgWindow.openBlastWindow();

                        }, false);
                    }

                    var handleJitsiMeet = document.getElementById("webmeet-jitsi-meet-" + id);

                    if (handleJitsiMeet) handleJitsiMeet.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        var jitsiConfirm = chrome.i18n ? chrome.i18n.getMessage("jitsiConfirm") : "Meeting?";

                        if (confirm(jitsiConfirm))
                        {
                            doVideo(view);
                        }

                    }, false);


                    var handleWebinarPresenter = document.getElementById("webmeet-webinar-" + id);

                    if (handleWebinarPresenter) handleWebinarPresenter.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        var webinarConfirm = chrome.i18n ? chrome.i18n.getMessage("webinarConfirm") : "Webinar?";
                        var title = prompt(webinarConfirm, _converse.api.settings.get("webinar_invitation"));

                        if (title && title != "")
                        {
                            doWebinarPresenter(view, title);
                        }

                    }, false);

                    var screencast = document.getElementById("webmeet-screencast-" + id);

                    if (screencast) screencast.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        toggleScreenCast(view);

                    }, false);

                    var scrolldown = document.getElementById("webmeet-scrolldown-" + id);

                    if (scrolldown) scrolldown.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();
                        view.viewUnreadMessages()

                    }, false);

                    var refresh = document.getElementById("webmeet-refresh-" + id);

                    if (refresh) refresh.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();
                        view.close();
                        setTimeout(function() { openChatbox(view); });

                    }, false);

                    var trash = document.getElementById("webmeet-trash-" + id);

                    if (trash) trash.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();
                        view.clearMessages();

                    }, false);

                    var tasks = document.getElementById("webmeet-tasks-" + id);

                    if (tasks) tasks.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();
                        openTasks(view);

                    }, false);

                    var notepad = document.getElementById("webmeet-notepad-" + id);

                    if (notepad) notepad.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();
                        openNotepad(view);

                    }, false);

                    var savePDF = document.getElementById("webmeet-savepdf-" + id);

                    if (savePDF)
                    {
                        savePDF.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();
                            pdfDialog = new PDFDialog({'model': new converse.env.Backbone.Model({view: view}) });
                            pdfDialog.show();
                        }, false);
                    }
                });
            });

            _converse.api.listen.on('connected', function()
            {
                var uPort = _converse.api.settings.get("uport_data");
                var username = Strophe.getNodeFromJid(_converse.connection.jid);

                console.debug("Found uport data", uPort);

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
                                    console.debug("set vcard ok", resp);

                                }, function(err) {
                                    console.error("set vcard error", err);
                                });
                            }

                            sourceImage.src = uPort.avatar;
                        }
                    });
                }
            });

            window.addEventListener('message', function (event)
            {
                if (event.data.event == "ofmeet.event.xapi")
                {
                    console.debug("webmeet xpi handler", h5pViews, event.data);

                    if (event.data.action == "completed")
                    {
                        if (h5pViews[event.data.id])
                        {
                            console.debug("webmeet xpi handler", h5pViews, event.data);

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

            console.debug("webmeet plugin is ready");
        },

        overrides: {

            MessageView: {

                transformOOBURL: function(url)
                {
                    if (url && url.indexOf("location/leaflet/index.html?accuracy=") > -1)
                    {
                        return "<iframe frameborder='0' style='border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:600px;' src='" + url + "'></iframe>";
                    }
                },

                renderChatMessage: async function renderChatMessage()
                {
                    console.debug('webmeet - renderChatMessage', this.model.get("fullname"), this.model.getDisplayName(), this.model);
                    // intercepting email IM

                    if (this.model.vcard)
                    {
                        if (!this.model.get("fullname") && this.model.get("from").indexOf("\\40") > -1)
                        {
                            this.model.vcard.attributes.fullname = Strophe.unescapeNode(this.model.get("from").split("@")[0]);
                        }

                        var nick = this.model.getDisplayName();

                        if (nick && _converse.DEFAULT_IMAGE == this.model.vcard.attributes.image)
                        {
                            var dataUri = createAvatar(nick);
                            var avatar = dataUri.split(";base64,");

                            this.model.vcard.attributes.image = avatar[1];
                            this.model.vcard.attributes.image_type = "image/png";
                        }
                    }

                    var body = this.model.get('message');
                    var oobUrl = this.model.get('oob_url');
                    var oobDesc = this.model.get('oob_desc');
                    var nonCollab = !oobDesc || oobDesc == ""
                    var letsCollaborate = getSetting("letsCollaborate", chrome.i18n.getMessage("collaborateOn"));

                    // TODO - collaborative documents identified by oob_desc available for UI display
                    // Neeed to extend XEP or use better method

                    if (oobUrl && getSetting("enableCollaboration", false))
                    {
                        if (!oobDesc)
                        {
                            var pos = oobUrl.lastIndexOf("/");
                            oobDesc = oobUrl.substring(pos + 1);
                        }

                        var viewId = "oob-url-" + Math.random().toString(36).substr(2,9)
                        var oob_content = '<a id="' + viewId + '" href="#"> ' + letsCollaborate + ' ' + oobDesc + '</a>';

                        if (isOnlyOfficeDoc(oobUrl))
                        {
                            if (getSetting("enableOnlyOffice", false))
                            {
                                var pos = oobUrl.lastIndexOf("/");
                                oob_content = '<a id="' + viewId + '" href="#"> ' + letsCollaborate + ' ' + oobUrl.substring(pos + 1) + '</a>';
                                setupContentHandler(this, oobUrl, oob_content, doOobSession, viewId, oobDesc);
                            }
                            else {
                                await this.__super__.renderChatMessage.apply(this, arguments);
                                renderTimeAgoChatMessage(this);
                            }
                        }
                        else {
                            if (nonCollab) {
                                await this.__super__.renderChatMessage.apply(this, arguments);
                                renderTimeAgoChatMessage(this);
                            }
                            else {
                                setupContentHandler(this, oobUrl, oob_content, doOobSession, viewId, oobDesc);
                            }
                        }
                    }
                    else

                    if (body)
                    {
                        var pos0 = body.indexOf("/webinar/")
                        var pos1 = body.indexOf("/jitsimeet/index.html?room=")
                        var pos2 = body.indexOf("/h5p/");
                        var pos3 = body.indexOf("https://");

                        if ( pos0 > -1 && pos3 > -1)
                        {
                            console.debug("webinar invite", body);
                            var link_room = body.substring(pos0 + 9);
                            var link_id = link_room + "-" + Math.random().toString(36).substr(2,9);
                            var link_label = pos3 > 0 ? body.substring(0, pos3) : _converse.api.settings.get("webinar_invitation");
                            var link_content = '<a id="' + link_id + '" href="#">' + link_label + ' webinar</a>';
                            setupContentHandler(this, link_room, link_content, handleWebinarAttendee, link_id);
                        }
                        else

                        if (bgWindow && body.indexOf(bgWindow.pade.ofmeetUrl) > -1 && pos3 > -1)
                        {
                            var pos4 = body.indexOf(bgWindow.pade.ofmeetUrl);

                            var link_room = body.substring(pos4 + bgWindow.pade.ofmeetUrl.length);
                            var link_id = link_room + "-" + Math.random().toString(36).substr(2,9);
                            var link_label = pos3 > 0 ? body.substring(0, pos3) : _converse.api.settings.get("webmeet_invitation");
                            var link_content = '<a id="' + link_id + '" href="#">' + link_label + " " + link_room + '</a>';
                            setupContentHandler(this, link_room, link_content, doAVConference, link_id);
                        }
                        else

                        if ( pos1 > -1 && pos3 > -1)
                        {
                            console.debug("audio/video invite", body);
                            var link_room = body.substring(pos1 + 27);
                            var link_id = link_room + "-" + Math.random().toString(36).substr(2,9);
                            var link_label = pos3 > 0 ? body.substring(0, pos3) : _converse.api.settings.get("webmeet_invitation");
                            var link_content = '<a id="' + link_id + '" href="#">' + link_label + " " + link_room + '</a>';
                            setupContentHandler(this, link_room, link_content, doAVConference, link_id);
                        }
                        else

                        if ( pos2 > -1)
                        {
                            console.debug("h5p content", this.model.attributes);
                            var path = body.substring(pos2 + 11);
                            var hp5_url = baseUrl + "/apps/h5p/?path=" + path;
                            var h5p_content = '<iframe src="' + hp5_url + '" id="hp5_' + path + '" allow="microphone; camera;" frameborder="0" seamless="seamless" allowfullscreen="true" style="z-index: 2147483647;width:100%;height:640px;resize: both;overflow: auto;"></iframe>';
                            setupContentHandler(this, null, h5p_content);
                        }
                        else {
                            await this.__super__.renderChatMessage.apply(this, arguments);
                            renderTimeAgoChatMessage(this);
                        }
                    } else {
                        await this.__super__.renderChatMessage.apply(this, arguments);
                        renderTimeAgoChatMessage(this);
                    }
                }
            },

            RosterFilterView: {

              shouldBeVisible() {
                return _converse.roster && getSetting("converseRosterFilter") && (_converse.roster.length >= 5 || this.isActive());
              }
            },

            ChatBoxView: {

                onPaste(ev) {
                    console.debug("onPaste", ev);
                    // TODO Replace jquery paste library with this. For now stop duplication by disabling default converse pasting event handling
                },

                renderToolbar: function renderToolbar(toolbar, options) {

                    if (getSetting("converseTimeAgo", false) && !doneIt)
                    {
                        doneIt = true; // make sure we get called only once

                        setInterval(function()
                        {
                            console.debug("timeago render");
                            timeago.cancel();
                            var locale = navigator.language.replace('-', '_');
                            timeago.render(document.querySelectorAll('.chat-msg__time_span'), locale);
                        }, 60000);
                    }

                    var result = this.__super__.renderToolbar.apply(this, arguments);
                    return result;
                },

                parseMessageForCommands: function(text) {

                    return handleCommand(this, text) || this.__super__.parseMessageForCommands.apply(this, arguments);
                },

                toggleCall: function toggleCall(ev) {
                    console.debug("toggleCall", this.model);

                    ev.stopPropagation();

                    if ( _converse.view_mode === 'overlayed')
                    {

                    }
                    else

                    if (bgWindow) {
                        console.debug('callButtonClicked');
                        var room = Strophe.getNodeFromJid(this.model.attributes.jid).toLowerCase();

                        if (this.model.get("message_type") == "chat")
                        {
                            room = bgWindow.makeRoomName(room);
                        }

                        bgWindow.openWebAppsWindow(chrome.extension.getURL("webcam/sip-video.html?url=sip:" + room), null, 800, 640)
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


    var openTasks = function(view)
    {
        chrome.storage.local.get("pade.tasks", function(obj)
        {
            var url = chrome.extension.getURL("tasks/index.html");
            bgWindow.openWebAppsWindow(url, null, 1400, 900);
        });
    }


    var openNotepad = function(view)
    {
        chrome.storage.local.get("pade.notepad", function(obj)
        {
            console.debug("get pade.notepad", obj);

            if (!obj["pade.notepad"]) obj["pade.notepad"] = "";

            view.model.set("notepad", obj["pade.notepad"]);
            notepadDialog = new NotepadDialog({'model': new converse.env.Backbone.Model({view: view}) });
            notepadDialog.show();
        });
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

    var setupPastingHandlers = function(view, id, jid, type)
    {
        console.debug("setupPastingHandlers", id, jid, type);

        pasteInputs[id] = $(view.el).find('.chat-textarea');
        pasteInputs[id].pastableTextarea();

        pasteInputs[id].on('pasteImage', function(ev, data)
        {
            console.debug("pade - pasteImage", data);

            previewDialog = new PreviewDialog({'model': new converse.env.Backbone.Model({blob: data.blob, view: view}) });
            previewDialog.show();

        }).on('pasteImageError', function(ev, data){
            console.error('pasteImageError', data);

        }).on('pasteText', function(ev, data){
            console.debug("pasteText", data);

            if (pasteInputs[id][0].value == data.text && (data.text.indexOf("http:") == 0  || data.text.indexOf("https:") == 0))
            {
                // get link only when is initial  URL is pasted
                pasteLinkPreview(view, data.text, pasteInputs[id]);
            }

        }).on('pasteTextRich', function(ev, data){
            console.debug("pasteTextRich", data);

            if (getSetting("useMarkdown", true))
                pasteInputs[id][0].value = pasteInputs[id][0].value.replace(data.text, clipboard2Markdown.convert(data.text));

        }).on('pasteTextHtml', function(ev, data){
            console.debug("pasteTextHtml", data);

            if (getSetting("useMarkdown", true))
                pasteInputs[id][0].value = pasteInputs[id][0].value.replace(data.text, clipboard2Markdown.convert(data.text));

        }).on('focus', function(){
            //console.debug("paste - focus", id);

        }).on('blur', function(){
            //console.debug("paste - blur", id);
        });
    }

    var renderTimeAgoChatMessage = function(chat)
    {
        var iso8601 = function (date)
        {
            return date.getUTCFullYear()
                + "-" + (date.getUTCMonth()+1)
                + "-" + date.getUTCDate()
                + "T" + date.getUTCHours()
                + ":" + date.getUTCMinutes()
                + ":" + date.getUTCSeconds() + "Z";
        }

        if (getSetting("converseTimeAgo", false))
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
    }

    async function setupContentHandler(chat, avRoom, content, callback, chatId, title)
    {
        console.debug("setupContentHandler", chat.el);

        await chat.__super__.renderChatMessage.apply(chat, arguments);

        const msg_content = chat.el.querySelector('.chat-msg__text');

        if (msg_content)
        {
            msg_content.innerHTML = content;
        }

        if (avRoom && callback && chatId)
        {
            setTimeout(function()
            {
                if (document.getElementById(chatId)) document.getElementById(chatId).onclick = function()
                {
                    var target = Strophe.getBareJidFromJid(chat.model.get("from") || chat.model.get("jid"));
                    var view = _converse.chatboxviews.get(target);
                    callback(avRoom, Strophe.getBareJidFromJid(chat.model.get("from")), chat.model.get("type"), title, target, view);
                }
            });
        }
    }

    var openVideoWindow = function openVideoWindow(room, mode, view)
    {
        if (getSetting("converseEmbedOfMeet", false) && bgWindow)
        {
            var url = bgWindow.getVideoWindowUrl(room, mode);
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
                        setTimeout(function() { openChatbox(view) });
                    }

                    if (firstTime) firstTime = false;   // ignore when jitsi-meet room url is loaded

                });
            }

        } else {

            if ( _converse.view_mode === 'overlayed')
            {
                if (window.pade && window.pade.url && window.pade.ofmeetUrl)
                {
                    url = window.pade.ofmeetUrl + room + (mode ? "&mode=" + mode : "");
                    window.open(url, location.href);
                }
                else {
                    url = bgWindow.pade.ofmeetUrl + room + (mode ? "&mode=" + mode : "");
                    window.open(url, location.href);
                }
            } else {
                bgWindow.openVideoWindow(room, mode);
            }
        }
    }

    var doVideo = function doVideo(view)
    {
        var room = Strophe.getNodeFromJid(view.model.attributes.jid).toLowerCase() + "-" + Math.random().toString(36).substr(2,9);
        console.debug("doVideo", room, view);

        var inviteMsg = _converse.api.settings.get("webmeet_invitation") + ' ' + bgWindow.pade.ofmeetUrl + room;
        submitMessage(view, inviteMsg);
        doAVConference(room, null, null, null, null, view);
    }

    var doAVConference = function doAVConference(room, from, chatType, title, target, view)
    {
        console.debug("doAVConference", room, view);
        openVideoWindow(room, null, view);
    }

    var handleWebinarAttendee = function handleWebinarAttendee(room, from, chatType, title, target, view)
    {
        console.debug("handleWebinarAttendee", room, view);

        var mode = view.model.get("sender") == "me" ? "presenter" : "attendee";
        openVideoWindow(room, mode, view);
    }

    var doWebinarPresenter = function doWebinarPresenter(view, title)
    {
        console.debug("doWebinarPresenter", view, title);

        var room = Strophe.getNodeFromJid(view.model.attributes.jid).toLowerCase() + "-" + Math.random().toString(36).substr(2,9);
        openVideoWindow(room, "presenter", view);

        var url = "https://" + _converse.api.settings.get("bosh_service_url").split("/")[2] + "/webinar/" + room;
        submitMessage(view, title + ' ' + url);
    }

    var doExit = function doExit(event)
    {
        event.stopPropagation();
        console.debug("doExit", event);
        if (window.parent && window.parent.ofmeet) window.parent.ofmeet.doExit();
        messageCount = 0;
    }

    var isOnlyOfficeDoc = function isOnlyOfficeDoc(url)
    {
        var onlyOfficeDoc = false;
        var pos = url.lastIndexOf(".");

        if (pos > -1)
        {
            var exten = url.substring(pos + 1);
            onlyOfficeDoc = "doc docx ppt pptx xls xlsx csv".indexOf(exten) > -1;
        }
        return onlyOfficeDoc;
    }

    var doOobSession = function doOobSession(url, jid, chatType, title, target)
    {
        console.debug("doOobSession", url, jid, chatType, title);

        if (isOnlyOfficeDoc(url))
        {
            if (bgWindow.pade.server == "desktop-545pc5b:7443")   // dev testing
            {
                url = url.replace("https://desktop-545pc5b:7443", "http://desktop-545pc5b:7070");
                bgWindow.openWebAppsWindow(chrome.extension.getURL("collab/onlyoffice/index.html?url=" + url + "&title=" + title + "&to=" + target + "&from=" + _converse.connection.jid + "&type=" + chatType));

            } else
                bgWindow.openWebAppsWindow(chrome.extension.getURL("collab/onlyoffice/index.html?url=" + url + "&title=" + title + "&to=" + target + "&from=" + _converse.connection.jid + "&type=" + chatType));

        } else {
            bgWindow.openWebAppsWindow(chrome.extension.getURL("collab/index.html?owner=false&url=" + url + "&jid=" + jid + "&type=" + chatType), null, 1024, 800);
        }
    }

    var doooB = function doooB(view, id, jid, chatType)
    {
        var activeDoc = bgWindow.pade.collabDocs[bgWindow.pade.activeUrl];
        console.debug("doooB", activeDoc, view, id, jid, chatType);

        _converse.connection.send($msg(
        {
            'from': _converse.connection.jid,
            'to': view.model.get('jid'),
            'type': view.model.get('message_type'),
            'id': _converse.connection.getUniqueId()
        }).c('body').t(bgWindow.pade.activeUrl).up().c('x', {xmlns: 'jabber:x:oob'}).c('url').t(bgWindow.pade.activeUrl).up().c('desc').t(activeDoc));

        bgWindow.openWebAppsWindow(chrome.extension.getURL("collab/index.html?owner=true&url=" + bgWindow.pade.activeUrl + "&jid=" + jid + "&type=" + chatType), null, 1024, 800);
    }

    var handleDragOver = function handleDragOver(evt)
    {
        //console.debug("handleDragOver");

        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    };

    var handleDropFileSelect = function handleDropFileSelect(evt)
    {
        evt.stopPropagation();
        evt.preventDefault();

        _converse.chatboxviews.forEach(function (view)
        {
            //console.debug("handleDropFileSelect", view.model.get('type'));

            if ((view.model.get('type') === "chatroom" || view.model.get('type') === "chatbox") && !view.model.get('hidden'))
            {
                var files = evt.dataTransfer.files;
                view.model.sendFiles(files);
            }
        });
    };

    var doH5p = function doH5p(view, id)
    {
        console.debug("doH5p", view);
        submitMessage(view, bgWindow.pade.activeH5p);
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

    var toggleScreenCast = function(view)
    {
        if (videoRecorder == null)
        {
            getDisplayMedia({ video: true }).then(stream =>
            {
                handleStream(stream, view);

            }, error => {
                handleError(error)
            });

        } else {
            videoRecorder.stop();
        }

        return true;
    }

    var getDisplayMedia = function getDisplayMedia()
    {
        if (navigator.getDisplayMedia) {
          return navigator.getDisplayMedia({video: true});
        } else if (navigator.mediaDevices.getDisplayMedia) {
          return navigator.mediaDevices.getDisplayMedia({video: true});
        } else {
          return navigator.mediaDevices.getUserMedia({video: {mediaSource: 'screen'}});
        }
    }

    var handleStream = function handleStream (stream, view)
    {
        navigator.mediaDevices.getUserMedia({audio: true, video: false}).then((audioStream) => handleAudioStream(stream, audioStream, view)).catch((e) => handleError(e))
    }

    var handleAudioStream = function handleStream (stream, audioStream, view)
    {
        console.debug("handleAudioStream - seperate", stream, audioStream);

        stream.addTrack(audioStream.getAudioTracks()[0]);
        audioStream.removeTrack(audioStream.getAudioTracks()[0]);

        console.debug("handleAudioStream - merged", stream);

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
                console.debug("handleStream - start", e);

                if (e.data.size > 0)
                {
                    console.debug("startRecorder push video ", e.data);
                    videoChunks.push(e.data);
                }
            }

            videoRecorder.onstop = function(e)
            {
                console.debug("handleStream - stop", e);

                stream.getTracks().forEach(track => track.stop());

                var blob = new Blob(videoChunks, {type: 'video/webm;codecs=h264'});
                var file = new File([blob], "screencast-" + Math.random().toString(36).substr(2,9) + ".webm", {type: 'video/webm;codecs=h264'});
                view.model.sendFiles([file]);
                videoRecorder = null;
            }

            videoRecorder.start();
            console.debug("handleStream", video, videoRecorder);

        }, 1000);
    }

    var handleError = function handleError (e)
    {
        console.error("ScreenCast", e)
    }

    var pasteLinkPreview = function pasteLinkPreview(view, body, textarea)
    {
        console.debug("pasteLinkPreview", body);

        var linkUrl = btoa(body.split(" ")[0]);

        var server = getSetting("server");
        var username = getSetting("username");
        var password = getSetting("password");

        var url =  "https://" + server + "/rest/api/restapi/v1/ask/previewlink/3/" + linkUrl;
        var options = {method: "GET", headers: {"authorization": "Basic " + btoa(username + ":" + password), "accept": "application/json"}};

        console.debug("fetch preview", url, options);

        var chat = this;

        fetch(url, options).then(function(response){ return response.json()}).then(function(preview)
        {
            console.debug("preview link", preview, textarea);

            if (preview.title && preview.image && preview.descriptionShort && preview.title != "" && preview.image != "" && preview.descriptionShort != "")
            {
                var text = body + "\n\n";

                if (preview.title) text = text + preview.title + "\n "; // space needed
                if (preview.image) text = text + preview.image + " \n"; // space needed
                if (preview.descriptionShort) text = text + preview.descriptionShort;


                previewDialog = new PreviewDialog({'model': new converse.env.Backbone.Model({html: text, view: view, preview: preview, textarea: textarea}) });
                previewDialog.show();

            }

        }).catch(function (err) {
            console.error('preview link', err);
        });
    }

    var handleCommand = function(view, text)
    {
        console.debug('handleCommand', view, text);

        const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
        const args = match[2] && match[2].splitOnce(' ').filter(s => s) || [];
        const command = match[1].toLowerCase();

        if (command === "pade")
        {
            view.showHelpMessages(["<strong>/app [url]</strong> Open a supported web app", "<strong>/chat [room]</strong> Join another chatroom", "<strong>/find</strong> Perform the user directory search with keyword", "<strong>/im [user]</strong> Open chatbox IM session with another user", "<strong>/info</strong> Toggle info panel", "<strong>/invite [invitation-list]</strong> Invite people in an invitation-list to this chatroom", "<strong>/md</strong> Open markdown editor window", "<strong>/meet [room|invitation-list]</strong> Initiate a Jitsi Meet in a room or invitation-list", "<strong>/msg [query]</strong> Replace the textarea text with the first canned message that matches query", "<strong>/pref</strong> Open the options and features (preferences) window", "<strong>/screencast</strong> Toggle between starting and stopping a screencast", "<strong>/search [query]</strong> Perform the conversations text search with query", "<strong>/sip [destination]</strong> Initiate a phone call using SIP videophone", "<strong>/tel [destination]</strong> Initiate a phone call using soft telephone or FreeSWITCH remote call control if enabled", "<strong>/vmsg</strong> Popuup voice message dialog", "<strong>/who</strong> Toggle occupants list", "<strong>/tw</strong> Open TransferWise payment dialog", "<strong>/pp</strong> Open PayPal Me payment dialog", "<strong>/clearpins</strong> Clear all pinned messages for this conversation", "<strong>/notepad</strong> Open Notepad", "<strong>/feed [url]</strong> Add an RSS/Atom Feed to this groupchat", "<strong>/tron [source] [target]</strong> Activate chat translation from source to target and reverse on incoming", "<strong>/troff</strong> De-activate any active chat translation", "<strong>/? or /wiki</strong> search wikipedia", "\n\n"]);
            view.viewUnreadMessages();
            return true;
        }
        else

        if (command === "troff" && getSetting("enableTranslation", false))
        {
            const id = view.model.get("box_id");
            const tronId = 'translate-' + id;

            chrome.storage.local.remove(tronId, function(obj)
            {
                console.debug("translation removed ok", obj);

                view.showHelpMessages(["Translation disabled"]);
                view.viewUnreadMessages();
            });
            return true;
        }
        else

        if (command === "tron" && getSetting("enableTranslation", false))
        {
            const id = view.model.get("box_id");
            const tronId = 'translate-' + id;

            if (args.length == 0)
            {
                chrome.storage.local.get(tronId, function(data)
                {
                    let msg = "Translation disabled";

                    if (data && data[tronId])
                    {
                        msg = "Translation enabled from " + data[tronId].source + " to " + data[tronId].target
                    }

                    view.showHelpMessages([msg]);
                    view.viewUnreadMessages();
                });

                return true;
            }
            else

            if (args.length < 2)
            {
                view.showHelpMessages(["Use as /tron <source> <target>", "<source> and <target> can be a valid language code like any of these en, de, es, fr, it, nl, pt, ja, ko, zh-CN"]);
                return true;
            }

            let data = {};
            data[tronId] = {source: args[0], target: args[1]};

            chrome.storage.local.set(data, function(obj)
            {
                console.debug("translation saved ok", obj);

                view.showHelpMessages(["Translation enabled for " + args[0] + " to " + args[1]]);
                view.viewUnreadMessages();
            });

            return true;

        }
        else

        if (command == "notepad")
        {
            openNotepad(view);
            return true;
        }
        else

        if (command == "pref" && bgWindow)
        {
            var url = chrome.extension.getURL("options/index.html");
            bgWindow.openWebAppsWindow(url, null, 1200, 900);
            return true;
        }
        else

        if (command == "app" && bgWindow && match[2])
        {
            bgWindow.openWebAppsWindow(args[0], null, args[1], args[2]);
            return true;
        }
        else

        if ((command == "meet" && bgWindow) || command == "invite")
        {
            var meetings = {};
            var encoded = localStorage["store.settings.savedMeetings"];
            if (encoded) meetings = JSON.parse(atob(encoded));
            var saveMeetings = Object.getOwnPropertyNames(meetings);

            if (command == "meet")
            {
                if (!match[2]) doVideo(view);

                else {

                    for (var i=0; i<saveMeetings.length; i++)
                    {
                        var meeting = meetings[saveMeetings[i]];

                        if (meeting.invite.toLowerCase() == match[2].toLowerCase())
                        {
                            for (var j=0; j<meeting.inviteList.length; j++)
                            {
                                if (meeting.inviteList[j] && meeting.inviteList[j].indexOf("@") > -1)
                                {
                                    bgWindow.inviteToConference(meeting.inviteList[j], meeting.room, meeting.invite);
                                }
                            }

                            openVideoWindow(meeting.room, null, view);
                            return true;
                        }
                    }

                    // use specified room

                    var inviteMsg = _converse.api.settings.get("webmeet_invitation") + ' ' + bgWindow.pade.ofmeetUrl + args[0];
                    submitMessage(view, inviteMsg);
                    doAVConference(args[0], null, null, null, null, view);
                }
            }
            else

            if (command == "invite" && match[2])
            {
                for (var i=0; i<saveMeetings.length; i++)
                {
                    var meeting = meetings[saveMeetings[i]];

                    if (meeting.invite.toLowerCase() == match[2].toLowerCase())
                    {
                        for (var j=0; j<meeting.inviteList.length; j++)
                        {
                            if (meeting.inviteList[j] && meeting.inviteList[j].indexOf("@") > -1)
                            {
                                view.model.directInvite(meeting.inviteList[j], meeting.invite);
                            }
                        }
                    }
                }
            }

            return true;
        }
        else

        if ((command == "tel" || command == "sip") && bgWindow)
        {
            if (!match[2]) bgWindow.openPhoneWindow(true);

            else {
                if (command == "tel") bgWindow.openPhoneWindow(true, null, "sip:" + args[0]);
                if (command == "sip") bgWindow.openWebAppsWindow(chrome.extension.getURL("webcam/sip-video.html?url=sip:" + args[0]), null, 800, 640);
            }
            return true;
        }
        else

        if ((command == "im" || command == "chat"))
        {
            if (match[2])
            {
                var jid = args[0];
                if (jid.indexOf("@") == -1) jid = jid + "@" + (command == "chat" ? "conference." : "") + _converse.connection.domain;

                if (command == "im") _inverse.api.chats.open(jid);
                if (command == "chat") _inverse.api.rooms.open(jid);
            }
            return true;
        }
        else

        if (command == "?" || command == "wiki")
        {
            if (match[2])
            {
                fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + match[2], {method: "GET"}).then(function(response){if (!response.ok) throw Error(response.statusText); return response.json()}).then(function(json)
                {
                    console.debug('wikipedia ok', json);

                    const type = view.model.get("type") == "chatbox" ? "chat" : "groupchat";

                    const body = "## " + json.displaytitle + '\n ' + (json.thumbnail ? json.thumbnail.source : "") + ' \n' + (json.type == "standard" ? json.extract : json.description) + '\n' + json.content_urls.desktop.page
                    const from = view.model.get("jid") + (type == "groupchat" ? "/Wikipedia" : "");

                    const stanza = '<message data-translation="true" type="' + type + '" to="' + _converse.connection.jid + '" from="' + from + '"><body>' + body + '</body></message>';
                    _converse.connection.injectMessage(stanza);

                    if (json.type == "standard")
                    {
                        navigator.clipboard.writeText(body).then(function() {
                            console.debug('wikipedia clipboard ok');
                        }, function(err) {
                            console.error('wikipedia clipboard error', err);
                        });
                    }

                }).catch(function (err) {
                    console.error('wikipedia error', err);
                });

                return true;
            }
        }

        if (command == "who")
        {
            view.toggleOccupants(null, false);
            view.scrollDown();
            return true;
        }
        else

        if (command == "screencast") return toggleScreenCast(view);

        return false;
    }

    var submitMessage = function(view, inviteMsg)
    {
        view.model.sendMessage(inviteMsg);
    }

    var testFileUploadAvailable = async function(view, callback)
    {
        const result = await _converse.api.disco.supports('urn:xmpp:http:upload:0', _converse.domain);
        callback(result.length > 0);
    }

    var saveToPDF = function(view, start, end)
    {
        if (!start) start = dayjs().startOf('day').toISOString();
        if (!end) end = dayjs().toISOString();

        const type = view.model.get('type');
        const jid = view.model.get('jid');

        let query = "?start=" + start + "&end=" + end;

        if (type === "chatbox")
        {
            query = query + "&to=" + jid;
        }
        else {
            query = query + "&service=conference&room=" + Strophe.getNodeFromJid(jid);
        }

        const url = "https://" + getSetting("server") + "/dashboard/pdf" + query;
        const options = {method: "GET", headers: {"authorization": "Basic " + btoa(bgWindow.pade.username + ":" + bgWindow.pade.password), "accept": "application/json"}};

        console.debug("saveToPDF", url, options);

        fetch(url, options).then(function(response){ return response.blob()}).then(function(blob)
        {
            console.debug("saveToPDF", blob);

            chrome.downloads.download({url: URL.createObjectURL(blob), filename: "save-to-pdf" + Math.random().toString(36).substr(2,9) + ".pdf"}, function(id)
            {
                console.debug("PDF downloaded", id);
            });

        }).catch(function (err) {
            console.error('saveToPDF error', err);
        });
    }

}));
