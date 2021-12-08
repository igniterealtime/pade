var _inverse;

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
			_inverse = _converse;

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
                if (toolbar_el.model.get("type") == "chatroom") color = "fill:var(--muc-toolbar-btn-color);";

                buttons.push(html`
                    <button class="plugin-jitsimeet" title="${__('Jitsi Meet')}" @click=${performVideo}/>
                        <svg style="width:18px; height:18px; ${color}" viewBox="0 0 32 32"><path d="M22.688 14l5.313-5.313v14.625l-5.313-5.313v4.688c0 .75-.625 1.313-1.375 1.313h-16C4.563 24 4 23.437 4 22.687V9.312c0-.75.563-1.313 1.313-1.313h16c.75 0 1.375.563 1.375 1.313V14z"></path></svg>
                    </button>
                `);

                return buttons;
            });

            _converse.api.listen.on('afterMessageBodyTransformed', function(text)
            {
				let body = "";
                for (let i=0; i<text.length; i++) body = body + text[i];

                if (body != "")
                {					
                    const pos = body.indexOf("https://");

                    if (pos > -1 && body.indexOf(_converse.api.settings.get("jitsimeet_url")) > -1)
                    {
                        console.debug("afterMessageBodyTransformed", body, text);

                        const url = body.substring(pos);
                        const link_room = url.substring(url.lastIndexOf("/") + 1);
                        const link_label = jitsimeet_invitation;
                        const tab_label = jitsimeet_tab_invitation;
                        const link_id = link_room + "-" + Math.random().toString(36).substr(2,9);
						
                        text.references = [];
                        text.addTemplateResult(0, body.length, html`<a 
                            @click=${clickVideo} data-room="${link_room}" data-url="${url}" id="${link_id}"
                            href="#">${link_label} ${link_room}</a><br/><a target="_blank" rel="noopener"
                            href="${url}">${tab_label} ${url}</a>`);						
                    }
                }
				
            });

            console.debug("jitsimeet plugin is ready");
        }
    });

    function performVideo(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();
		
		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));

        if (confirm(jitsimeet_confirm))
        {
            doVideo(chatview);
        }
    }

    function clickVideo(ev)
    {		
        ev.stopPropagation();
        ev.preventDefault();
		
		const content_el = converse.env.utils.ancestor(ev.target, 'converse-chat-content');	
        const jid = content_el.getAttribute("jid");		
        console.debug("clickVideo", jid);	
		
		const chatview = _converse.chatboxviews.get(jid);

        var url = ev.target.getAttribute("data-url");
        var room = ev.target.getAttribute("data-room");

        if (chatview) doLocalVideo(chatview, room, url, jitsimeet_invitation);
    }
	
    var doVideo = function doVideo(view)
    {
		const label = jitsimeet_invitation;		
        const room = Strophe.getNodeFromJid(view.model.attributes.jid).toLowerCase().replace(/[\\]/g, '') + "-" + Math.random().toString(36).substr(2,9);
        const url = _converse.api.settings.get("jitsimeet_url") + '/' + room;

		let type = 'chat';
		if (view.model.get("type") == "chatroom") type = 'groupchat';			
		_converse.api.send($msg({ to: view.model.get('jid'), from: _converse.connection.jid, type}).c('body').t(url).tree());		
		
        console.debug("doVideo", room, url, view);		
        var startOption = _converse.api.settings.get("jitsimeet_start_option");
		
        if (startOption === MEET_START_OPTIONS.INTO_CHAT_WINDOW) {
          doLocalVideo(view, room, url, label);
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
        console.debug("doLocalVideo", view, room, url, label);

        var modal = _converse.api.settings.get("jitsimeet_modal") == true;

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
            var div = view.querySelector(isOverlayedDisplay ? ".chat-body" : ".box-flyout");

            if (div)
            {
                const dynamicDisplayManager = new function() {
                  const __isActive = isOverlayedDisplay;
                  let __resizeHandler;
                  let __resizeWatchImpl;
                  this.handle = function(meetIFrame) {
                    if (__isActive) {
                      const __anchor = document.querySelector('.converse-chatboxes');
                      __resizeHandler = function() {
                        let top = div.offsetTop;
                        let left = div.offsetLeft;
                        let width = div.offsetWidth;
                        let height = div.offsetHeight;
                        let current = div.offsetParent;
                        while (current && current !== __anchor) {
                          top += current.offsetTop;
                          left += current.offsetLeft;
                          current = current.offsetParent;
                        }
                        jitsiFrame.style.top = top + "px";
                        jitsiFrame.style.left = left + "px";
                        jitsiFrame.style.width = width + "px";
                        jitsiFrame.style.height = height + "px";
                      };
                      if (typeof ResizeObserver === 'function') {
                        __resizeWatchImpl = new function() {
                          const resizeObserver = new ResizeObserver(entries => {
                            if (entries.length > 0) {
                              __resizeHandler();
                            }
                          });
                          this.start = function() {
                            resizeObserver.observe(div);
                            resizeObserver.observe(__anchor);
                          };
                          this.close = function() {
                            resizeObserver.disconnect();
                          };
                        };
                      } else {
                        __resizeWatchImpl = new function() {
                          const __resizeWatchEvents = ['controlBoxOpened', 'controlBoxClosed', 'chatBoxBlurred',
                            'chatBoxFocused', 'chatBoxMinimized', 'chatBoxMaximized'];
                          let __resizedElement;
                          const __startResize = function(currentView) {
                            if (!__resizedElement) {
                              __resizedElement = currentView.el.querySelector('.box-flyout');
                              __resizedElement.addEventListener('mousemove', __resizeHandler);
                            }
                          };
                          const __endResize = function() {
                            if (__resizedElement) {
                              __resizedElement.removeEventListener('mousemove', __resizeHandler);
                              __resizedElement = undefined;
                            }
                          };
                          const __deferredResize = function() {
                            setTimeout(__resizeHandler, 0);
                          };
                          this.start = function() {
                            _converse.api.listen.on('startDiagonalResize', __startResize);
                            _converse.api.listen.on('startHorizontalResize', __startResize);
                            _converse.api.listen.on('startVerticalResize', __startResize);
                            document.addEventListener('mouseup', __endResize);
                            window.addEventListener('resize', __resizeHandler);
                            __resizeWatchEvents.forEach(c => _converse.api.listen.on(c, __deferredResize));
                          };
                          this.close = function() {
                            _converse.api.listen.not('startDiagonalResize', __startResize);
                            _converse.api.listen.not('startHorizontalResize', __startResize);
                            _converse.api.listen.not('startVerticalResize', __startResize);
                            document.removeEventListener('mouseup', __endResize);
                            window.removeEventListener('resize', __resizeHandler);
                            __resizeWatchEvents.forEach(c => _converse.api.listen.not(c, __deferredResize));
                          };
                        };
                      }
                      meetIFrame.style.position = "absolute";
                      __anchor.appendChild(meetIFrame);
                      __resizeWatchImpl.start();
                      _converse.api.listen.on('chatBoxClosed', closeJitsi);
                      this.triggerChange();
                    }
                    return __isActive;
                  };
                  this.triggerChange = function() {
                    if (__isActive) {
                      __resizeHandler();
                    }
                  };
                  this.close = function() {
                    if (__isActive) {
                      __resizeWatchImpl.close();
                      _converse.api.listen.not('chatBoxClosed', closeJitsi);
                    }
                  };
                };

                const divChildElements = [].slice.call(div.children, 0).map(function(bloc) {
                  const data = {
                    el : bloc,
                    previousDisplay : bloc.style.display
                  }
                  bloc.style.display = 'none';
                  return data;
                });
                let jitsiFrame = document.createElement('iframe');

                var firstTime = true;

                let closeJitsi = function(currentView) {
                  dynamicDisplayManager.triggerChange();
                  if (currentView && currentView !== view) {
                    return;
                  }
                  dynamicDisplayManager.close();
                  jitsiFrame.remove();
                  divChildElements.forEach(function(bloc) {
                    bloc.el.style.display = bloc.previousDisplay;
                  });
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
                jitsiFrame.addEventListener("load", jitsiIframeCloseHandler);
                jitsiFrame.setAttribute("src", url);
                jitsiFrame.setAttribute("id", "jitsimeet");
                jitsiFrame.setAttribute("allow", "microphone; camera;");
                jitsiFrame.setAttribute("frameborder", "0");
                jitsiFrame.setAttribute("seamless", "seamless");
                jitsiFrame.setAttribute("allowfullscreen", "true");
                jitsiFrame.setAttribute("scrolling", "no");
                jitsiFrame.setAttribute("style", "z-index:2147483647;width:100%;height:100%;");
                if (!dynamicDisplayManager.handle(jitsiFrame)) {
                  div.appendChild(jitsiFrame);
                }
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
