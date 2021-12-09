(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var MEET_START_OPTIONS = {
      INTO_CHAT_WINDOW : "into_chat_window",
      INTO_NEW_TAB : "into_new_tab",
      JUST_CREATE_LINK : "just_create_link"
    };
    var Strophe, $iq, $msg, $pres, $build, b64_sha1, _ , dayjs, _converse, html, _, __, Model, BootstrapModal, jitsimeet_confirm, jitsimeet_invitation, jitsimeet_tab_invitation;
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
            dayjs = converse.env.dayjs;
            html = converse.env.html;
            Model = converse.env.Model;
            BootstrapModal = converse.env.BootstrapModal;
            _ = converse.env._;
            __ = _converse.__;

            _converse.api.settings.update({
                jitsimeet_start_option: MEET_START_OPTIONS.INTO_CHAT_WINDOW,
                jitsimeet_head_display_toggle: false,
                jitsimeet_modal: false,
                jitsimeet_url: 'https://meet.jit.si',
            });

            jitsimeet_confirm  = __('Meeting?');
            jitsimeet_invitation = __('Please join meeting in room at');
            jitsimeet_tab_invitation = __('Or open in new tab at');

            _converse.api.listen.on('messageNotification', function (data)
            {
                console.debug("messageNotification", data);

                var chatbox = data.chatbox;
                var bodyElement = data.stanza.querySelector('body');

                if (bodyElement)
                {
                    var body = bodyElement.innerHTML;
                    var url = _converse.api.settings.get("jitsimeet_url");
                    var pos = body.indexOf(url + "/");

                    if (pos > -1)
                    {
                        var room = body.substring(pos + url.length + 1);
                        var label = pos > 0 ? body.substring(0, pos) : jitsimeet_invitation;
                        var from = chatbox.getDisplayName().trim();
                        var avatar = _converse.api.settings.get("notification_icon");

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

                            var box_jid = Strophe.getBareJidFromJid(chatbox.get("contact_jid") || chatbox.get("jid") || chatbox.get("from"));
                            var view = _converse.chatboxviews.get(box_jid);

                            if (view)
                            {
                                doLocalVideo(view, room, url + "/" + room, label);
                            }
                        }
                    }
                }
            });

            MeetDialog = BootstrapModal.extend({
                initialize() {
                    BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.listenTo(this.model, 'change', this.render);
                },
                toHTML() {
                  var view = this.model.get("view");
                  var label = this.model.get("label");
                  var room = this.model.get("room");
                  var url = this.model.get("url");

                  return html`
                         <div class="modal-dialog modal-lg">
                             <div class="modal-content">
                                 <div class="modal-header">
                                   <h4 class="modal-title">${label} ${room}</h4>
                                 </div>
                                 <div style="text-align: center;" class="modal-body"><iframe src="${url}" id="jitsimeet" allow="microphone; camera;" frameborder="0" seamless="seamless" allowfullscreen="true" scrolling="no" style="z-index: 2147483647;width:640px;height:480px;display: inline-block"></iframe></div>
                                 <div class="modal-footer"> <button type="button" class="btn btn-danger btn-terminate" data-dismiss="modal">Close</button> </div>
                             </div>
                         </div>
                `},
                 afterRender() {
                  var that = this;

                  this.el.addEventListener('shown.bs.modal', function()
                  {
                     that.el.querySelector('.modal-body').innerHTML = '<iframe src="' + that.model.get("url") + '" id="jitsimeet" allow="microphone; camera;" frameborder="0" seamless="seamless" allowfullscreen="true" scrolling="no" style="z-index: 2147483647;width:640px;height:480px;display: inline-block"></iframe>';

                  }, false);
                },
                events: {
                    "click .btn-terminate": "terminateCall"
                },

                terminateCall() {
                    this.el.querySelector('.modal-body').innerHTML = "about:blank"
                }
            });

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
                console.debug("getToolbarButtons", toolbar_el.model.get("jid"));
                let color = "fill:var(--chat-toolbar-btn-color);";
                if (toolbar_el.model.get("type") === "chatroom") color = "fill:var(--muc-toolbar-btn-color);";

                buttons.push(html`
                    <button class="plugin-jitsimeet" title="${__('Jitsi Meet')}" @click=${performVideo}/>
                        <svg style="width:18px; height:18px; ${color}" viewBox="0 0 32 32"><path d="M22.688 14l5.313-5.313v14.625l-5.313-5.313v4.688c0 .75-.625 1.313-1.375 1.313h-16C4.563 24 4 23.437 4 22.687V9.312c0-.75.563-1.313 1.313-1.313h16c.75 0 1.375.563 1.375 1.313V14z"></path></svg>
                    </button>
                `);

                return buttons;
            });

            _converse.api.listen.on('afterMessageBodyTransformed', function(text)
            {
                const pos = text.indexOf("https://");

                if (pos > -1 && text.indexOf(_converse.api.settings.get("jitsimeet_url")) > -1)
                {
                    console.debug("afterMessageBodyTransformed", text);

                    const url = text.substring(pos);
                    const link_room = url.substring(url.lastIndexOf("/") + 1);
                    const link_label = jitsimeet_invitation;
                    const tab_label = jitsimeet_tab_invitation;

                    text.references = [];
                    text.addTemplateResult(0, text.length, html`<a 
                        @click=${clickVideo} data-room="${link_room}" data-url="${url}"
                        href="#">${link_label} ${link_room}</a><br/><a target="_blank" rel="noopener noreferrer"
                        href="${url}">${tab_label} ${url}</a>`);
                }
            });

            console.debug("jitsimeet plugin is ready");
        }
    });

    function __confirm(msg, callback) {
      if (confirm(jitsimeet_confirm)) {
          callback();
      }
    }

    function __displayError(error) {
      alert(error);
    }

    function getChatViewFromElement($el) {
        return $el.closest('converse-chat.chatbox') || $el.closest('converse-muc.chatbox');
    }

    function performVideo(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();

        const chatView = getChatViewFromElement(ev.currentTarget);
        __confirm(jitsimeet_confirm, function() {
            doVideo(chatView);
        });
    }

    function clickVideo(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();

        var url = ev.target.getAttribute("data-url");
        var room = ev.target.getAttribute("data-room");

        if (ev.currentTarget) {
          const chatView = getChatViewFromElement(ev.currentTarget);
          doLocalVideo(chatView, room, url, jitsimeet_invitation);
        }
    }

    var doVideo = function doVideo(view)
    {
        const room = Strophe.getNodeFromJid(view.model.attributes.jid).toLowerCase().replace(/[\\]/g, '') + "-" + Math.random().toString(36).substr(2,9);
        const url = _converse.api.settings.get("jitsimeet_url") + '/' + room;

        console.debug("doVideo", room, url, view);

        view.model.sendMessage({'body': url});
        const startOption = _converse.api.settings.get("jitsimeet_start_option");
        if (startOption === MEET_START_OPTIONS.INTO_CHAT_WINDOW) {
          doLocalVideo(view, room, url, jitsimeet_invitation);
        } else if (startOption === MEET_START_OPTIONS.INTO_NEW_TAB) {
          doNewTabVideo(url);
        }
    }

    var doNewTabVideo = function doNewTabVideo(url)
    {
        console.debug("doNewTabVideo", url);
        var newTabVideoLink = document.createElement('a');
        Object.assign(newTabVideoLink, {
            target: '_blank',
            rel: 'noopener noreferrer',
            href: url
        })
        .click()
    }

    var doLocalVideo = function doLocalVideo(view, room, url, label)
    {
        const chatModel = view.model;
        console.debug("doLocalVideo", view, room, url, label);

        var modal = _converse.api.settings.get("jitsimeet_modal") === true;

        if (modal)
        {
            meetDialog = new MeetDialog({'model': new converse.env.Model({})});
            meetDialog.model.set("view", view);
            meetDialog.model.set("url", url);
            meetDialog.model.set("label", label);
            meetDialog.model.set("room", room);
            meetDialog.show();
        }
        else {

            const isOverlayedDisplay = _converse.api.settings.get("view_mode") === "overlayed";
            const headDisplayToggle = isOverlayedDisplay || _converse.api.settings.get("jitsimeet_head_display_toggle") === true;
            const div = view.querySelector(headDisplayToggle ? ".chat-body" : ".box-flyout");

            if (div)
            {
                const jid = view.getAttribute("jid");
                if(Array.from(document.querySelectorAll("iframe.jitsimeet")).filter(f => f.__jid === jid).length > 0) {
                  __displayError(__('A meet is already running into room'));
                  return;
                }
                const toggleHandler = function() {
                  jitsiFrame.toggleHideShow();
                };
                const dynamicDisplayManager = new function() {
                  let __resizeHandler;
                  let __resizeWatchImpl;
                  this.start = function() {
                    const $chatBox = document.querySelector('.converse-chatboxes');
                    const $anchor = document.querySelector('#conversejs.conversejs');
                    __resizeHandler = function() {
                      const currentView = _converse.chatboxviews.get(jid)
                      if (currentView && headDisplayToggle) {
                        const $head = currentView.querySelector(".chat-head");
                        $head.removeEventListener('dblclick', toggleHandler);
                        $head.addEventListener('dblclick', toggleHandler);
                      }
                      const currentDiv = currentView && currentView.querySelector(headDisplayToggle ? ".chat-body" : ".box-flyout");
                      let top = currentDiv ? currentDiv.offsetTop : 0;
                      let left = currentDiv ? currentDiv.offsetLeft : 0;
                      let width = currentDiv ? currentDiv.offsetWidth : 0;
                      let height = currentDiv ? currentDiv.offsetHeight : 0;
                      let current = currentDiv && currentDiv.offsetParent;
                      while (current && current !== $anchor) {
                        top += current.offsetTop;
                        left += current.offsetLeft;
                        current = current.offsetParent;
                      }
                      jitsiFrame.style.top = top + "px";
                      jitsiFrame.style.left = left + "px";
                      jitsiFrame.style.width = width + "px";
                      jitsiFrame.style.height = height + "px";
                    };
                    __resizeWatchImpl = new function() {
                      let __resizeObserver;
                      if (isOverlayedDisplay && typeof ResizeObserver === 'function') {
                        __resizeObserver = new ResizeObserver(function(entries) {
                          if (entries.length > 0) {
                            __resizeHandler();
                          }
                        });
                      }
                      const __resizeWatchEvents = ['controlBoxOpened', 'controlBoxClosed', 'chatBoxBlurred',
                        'chatBoxFocused', 'chatBoxMinimized', 'chatBoxMaximized',
                        'chatBoxViewInitialized', 'chatRoomViewInitialized'];
                      const __startResize = function() {
                        jitsiFrame.style.pointerEvents = 'none';
                        document.addEventListener('mousemove', __deferredResize);
                      };
                      const __endResize = function() {
                        jitsiFrame.style.pointerEvents = '';
                        document.removeEventListener('mousemove', __deferredResize);
                      };
                      let timeoutId;
                      const __deferredResize = function() {
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(__resizeHandler, 0);
                      };
                      this.start = function() {
                        _converse.api.listen.on('startDiagonalResize', __startResize);
                        _converse.api.listen.on('startHorizontalResize', __startResize);
                        _converse.api.listen.on('startVerticalResize', __startResize);
                        document.addEventListener('mouseup', __endResize);
                        window.addEventListener('resize', __resizeHandler);
                        __resizeWatchEvents.forEach(c => _converse.api.listen.on(c, __deferredResize));
                        if (__resizeObserver) {
                          __resizeObserver.observe(div);
                          __resizeObserver.observe($anchor);
                          __resizeObserver.observe($chatBox);
                        }
                      };
                      this.close = function() {
                        _converse.api.listen.not('startDiagonalResize', __startResize);
                        _converse.api.listen.not('startHorizontalResize', __startResize);
                        _converse.api.listen.not('startVerticalResize', __startResize);
                        document.removeEventListener('mouseup', __endResize);
                        window.removeEventListener('resize', __resizeHandler);
                        __resizeWatchEvents.forEach(c => _converse.api.listen.not(c, __deferredResize));
                        if (__resizeObserver) {
                          __resizeObserver.disconnect();
                        }
                      };
                    };
                    jitsiFrame.style.position = "absolute";
                    $anchor.appendChild(jitsiFrame);
                    __resizeWatchImpl.start();
                    _converse.api.listen.on('chatBoxClosed', closeJitsi);
                    this.triggerChange();
                  };
                  this.triggerChange = function() {
                    __resizeHandler();
                  };
                  this.close = function() {
                    __resizeWatchImpl.close();
                    _converse.api.listen.not('chatBoxClosed', closeJitsi);
                  };
                };
                let jitsiFrame = document.createElement('iframe');
                let firstTime = true;
                let closeJitsi = function(currentModel) {
                  dynamicDisplayManager.triggerChange();
                  if (currentModel && currentModel.cid !== chatModel.cid) {
                    return;
                  }
                  dynamicDisplayManager.close();
                  jitsiFrame.remove();
                }
                let jitsiIframeCloseHandler = function ()
                {
                  console.debug("doVideo - load", this);
                  if (!firstTime) // meeting closed and root url is loaded
                  {
                    closeJitsi();
                  }
                  if (firstTime) firstTime = false;   // ignore when jitsi-meet room url is loaded
                };
                jitsiFrame.toggleHideShow = function() {
                  if (jitsiFrame.style.display === 'none') {
                    jitsiFrame.show();
                  } else {
                    jitsiFrame.hide();
                  }
                };
                jitsiFrame.show = function() {
                  jitsiFrame.style.display = '';
                };
                jitsiFrame.hide = function() {
                  jitsiFrame.style.display = 'none';
                };
                jitsiFrame.__jid = jid;
                jitsiFrame.addEventListener("load", jitsiIframeCloseHandler);
                jitsiFrame.setAttribute("src", url);
                jitsiFrame.setAttribute("class", "jitsimeet");
                jitsiFrame.setAttribute("allow", "microphone; camera;");
                jitsiFrame.setAttribute("frameborder", "0");
                jitsiFrame.setAttribute("seamless", "seamless");
                jitsiFrame.setAttribute("allowfullscreen", "true");
                jitsiFrame.setAttribute("scrolling", "no");
                jitsiFrame.setAttribute("style", "z-index:1049;width:100%;height:100%;");
                dynamicDisplayManager.start();
                jitsiFrame.contentWindow.addEventListener("message", function (event) {
                  if (_converse.api.settings.get("jitsimeet_url").indexOf(event.origin) === 0 && typeof event.data === 'string') {
                    let data = JSON.parse(event.data);
                    let jitsiEvent = data['jitsimeet_event'];
                    if ('close' === jitsiEvent) {
                      closeJitsi();
                    }
                  }
                }, false);
            }
        }
    }
}));
