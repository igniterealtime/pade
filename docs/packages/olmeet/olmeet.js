(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
	let baseMeetUrl;
	converse.plugins.add("olmeet", { initialize });
	
	const MEET_START_OPTIONS = {
		INTO_CHAT_WINDOW: "into_chat_window",
		INTO_NEW_TAB: "into_new_tab",
		BASE_URL: "https://meet.jit.si"
	};

	function handleMessageNotification(_converse, data) {
		console.debug("messageNotification", data);

		const chatbox = data.chatbox;
		const bodyElement = data.stanza.querySelector("body");
		const { __ } = _converse;

		if (bodyElement) {
			const body = bodyElement.innerHTML;
			const url = baseMeetUrl;
			const pos = body.indexOf(url + "/");

			if (pos > -1) {
				const room = body.substring(pos + url.length + 1);
				const label = pos > 0 ? body.substring(0, pos) : __("New meeting");
				const from = chatbox.getDisplayName().trim();
				const avatar = _converse.api.settings.get("notification_icon");

				if (chatbox.vcard.attributes.image) {
					avatar = chatbox.vcard.attributes.image;
				}

				const prompt = new Notification(from, {
					body: label + " " + room,
					lang: _converse.locale,
					icon: avatar,
					requireInteraction: true,
				});

				prompt.onclick = function (event) {
					event.preventDefault();
					const box_jid = Strophe.getBareJidFromJid(
						chatbox.get("contact_jid") ||
							chatbox.get("jid") ||
							chatbox.get("from")
					);
					const view = _converse.chatboxviews.get(box_jid);
					if (view) {
						doLocalVideo(view, room, `${url}/${room}`, label);
					}
				};
			}
		}
	}

	function parseStanza(_converse, stanza, attrs) {
		const type = attrs.type;
		const from = (type == "chat") ? attrs.from : attrs.from_muc;	
		const view = _converse.chatboxviews.get(from);	
		
		if (view) {	
			const model = view.model;		
			const accept = stanza.querySelector('accept');			
			const invite = stanza.querySelector('invite');	
			const retract = stanza.querySelector('retract');
				
			if (invite) { 	
				const uri = invite.querySelector('external').getAttribute("uri");
				console.debug("online meeting invite", uri);				
								
			}
			else
				
			if (accept) {	
				const id = accept.getAttribute("id");
				console.debug("online meeting accept", id);					
								
			}
			else
				
			if (retract) {	
				const id = retract.getAttribute("id");
				console.debug("online meeting retract", id);	
			}	
		}		
					
		return attrs;
	}	

	function getToolbarButtons(_converse, toolbar_el, buttons) {
		const { html } = env;
		const { __ } = _converse;
		console.debug("getToolbarButtons", toolbar_el.model.get("jid"));

		let style = "width:18px; height:18px; fill:var(--chat-color);";
		if (toolbar_el.model.get("type") === "chatroom") {
			style = "width:18px; height:18px; fill:var(--muc-color);";
		}

		buttons.push(html`
			<button type="button" class="btn plugin-olmeet" title="${__("Online Meet")}" @click="${(ev) => performVideo(_converse, ev)}"/>
				<svg style="${style}" viewBox="0 0 32 32">
					<path d="M22.688 14l5.313-5.313v14.625l-5.313-5.313v4.688c0 .75-.625 1.313-1.375 1.313h-16C4.563 24 4 23.437 4 22.687V9.312c0-.75.563-1.313 1.313-1.313h16c.75 0 1.375.563 1.375 1.313V14z"></path>
				</svg>
			</button>`);
		return buttons;
	}

	function afterMessageBodyTransformed(_converse, text) {
		const { api, __ } = _converse;
		const pos = text.indexOf(baseMeetUrl);

		if (pos > -1) {
			console.debug("afterMessageBodyTransformed", text);
			const { html } = env;
			const url = text.substring(pos);
			const link_room = url.substring(url.lastIndexOf("/") + 1);

			text.references = [];
			text.addTemplateResult(
				0,
				text.length,
				html`
					<p>${__('A new meeting started:')} ${link_room}</p>
					<button type="button"
						class="btn btn-primary"
						@click="${(ev) => clickVideo(_converse, ev)}"
						data-room="${link_room}"
						data-url="${url}">Open Meeting</button>
					<button type="button"
						class="btn btn-secondary"
						@click="${() => window.open(url, '_blank')}">Open Meeting in New tab</button>`
			);
		}
	}

	function __displayError(error) {
		alert(error);
	}

	function getChatViewFromElement(el) {
		return (
			el.closest("converse-chat.chatbox") ||
			el.closest("converse-muc.chatbox")
		);
	}

	function performVideo(_converse, ev) {
		ev.stopPropagation();
		ev.preventDefault();

		const { __ } = _converse;
		const chatView = getChatViewFromElement(ev.currentTarget);
		const olmeet_confirm = __("Would you like to start a meeting?");
		if (confirm(olmeet_confirm)) {
			doVideo(_converse, chatView);
		}

	}

	function clickVideo(_converse, ev) {
		ev.stopPropagation();
		ev.preventDefault();

		const url = ev.target.getAttribute("data-url");
		const room = ev.target.getAttribute("data-room");

		if (ev.currentTarget) {
			const chatView = getChatViewFromElement(ev.currentTarget);
			doLocalVideo(_converse, chatView, room, url);
		}
	}

	function doVideo(_converse, view) {
		const { api } = _converse;
		const room = Strophe.getNodeFromJid(view.model.attributes.jid).toLowerCase().replace(/[\\]/g, "") + "-" + Math.random().toString(36).substr(2, 9);
		const url = baseMeetUrl + "/" + room;
		const model = view.model;
		console.debug("doVideo", room, url, view, model);
			
		const type = (model.get('type') == 'chatroom') ? 'groupchat' : 'chat';	
		const target = (model.get('type') == 'chatbox') ? model.get('jid') : (model.get('type') == 'chatroom' ? model.get('jid') : model.get('from'));			
		const msg = converse.env.stx`<message xmlns="jabber:client" to="${target}" type="${type}"><body>${url}</body><invite video="true" xmlns="urn:xmpp:call-invites:0"><external uri="${url}" /></invite></message>`;
		_converse.api.send(msg);					
		
		const startOption = api.settings.get("olmeet_start_option");
		
		if (startOption === MEET_START_OPTIONS.INTO_CHAT_WINDOW) {
			doLocalVideo(_converse, view, room, url);
			
		} else if (startOption === MEET_START_OPTIONS.INTO_NEW_TAB) {
			doNewTabVideo(url);
		}
	};

	function doNewTabVideo(url) {
		console.debug("doNewTabVideo", url);
		const newTabVideoLink = document.createElement("a");
		Object.assign(newTabVideoLink, {
			target: "_blank",
			rel: "noopener noreferrer",
			href: url,
		}).click();
	};

	function doLocalVideo(_converse, view, room, url, label) {
		const { api } = _converse;
		const chatModel = view.model;
		console.debug("doLocalVideo", view, room, url, label);

		const modal = api.settings.get("olmeet_modal") === true;

		if (modal) {
			const model = new converse.env.Model();
			model.set({ view, url, label, room });
			api.modal.show('converse-olmeet-dialog', { model });
		} else {
			const isOverlayedDisplay = _converse.api.settings.get("view_mode") === "overlayed";
			const headDisplayToggle =
				isOverlayedDisplay ||
				_converse.api.settings.get("olmeet_head_display_toggle") ===
					true;
			const div = view.querySelector(headDisplayToggle ? ".chat-body" : ".box-flyout");

			if (div) {
				const jid = view.getAttribute("jid");
				if (
					Array.from(
						document.querySelectorAll("iframe.olmeet")
					).filter((f) => f.__jid === jid).length > 0
				) {
					__displayError(__("A meet is already running into room"));
					return;
				}

				const toggleHandler = () => olFrame.toggleHideShow();

				const dynamicDisplayManager = new (function () {
					let __resizeHandler;
					let __resizeWatchImpl;
					this.start = function () {
						const $chatBox = document.querySelector(
							".converse-chatboxes"
						);
						const $anchor = document.querySelector(
							"#conversejs.conversejs"
						);
						__resizeHandler = function () {
							const currentView = _converse.chatboxviews.get(jid);
							if (currentView && headDisplayToggle) {
								const head = currentView.querySelector(".chat-head");
								head.removeEventListener("dblclick", toggleHandler);
								head.addEventListener("dblclick", toggleHandler);
							}
							const currentDiv =
								currentView &&
								currentView.querySelector(
									headDisplayToggle
										? ".chat-body"
										: ".box-flyout"
								);
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
							olFrame.style.top = top + "px";
							olFrame.style.left = left + "px";
							olFrame.style.width = width + "px";
							olFrame.style.height = height + "px";
						};
						__resizeWatchImpl = new (function () {
							let __resizeObserver;
							if (
								isOverlayedDisplay &&
								typeof ResizeObserver === "function"
							) {
								__resizeObserver = new ResizeObserver(
									function (entries) {
										if (entries.length > 0) {
											__resizeHandler();
										}
									}
								);
							}
							const __resizeWatchEvents = [
								"controlBoxOpened",
								"controlBoxClosed",
								"chatBoxBlurred",
								"chatBoxFocused",
								"chatBoxMinimized",
								"chatBoxMaximized",
								"chatBoxViewInitialized",
								"chatRoomViewInitialized",
							];
							const __startResize = function () {
								olFrame.style.pointerEvents = "none";
								document.addEventListener("mousemove", __deferredResize);
							};
							const __endResize = function () {
								olFrame.style.pointerEvents = "";
								document.removeEventListener("mousemove", __deferredResize);
							};
							let timeoutId;
							const __deferredResize = function () {
								clearTimeout(timeoutId);
								timeoutId = setTimeout(__resizeHandler, 0);
							};

							this.start = function () {
								_converse.api.listen.on("startDiagonalResize", __startResize);
								_converse.api.listen.on("startHorizontalResize", __startResize);
								_converse.api.listen.on("startVerticalResize", __startResize);
								document.addEventListener("mouseup", __endResize);
								window.addEventListener("resize", __resizeHandler);
								__resizeWatchEvents.forEach((c) => _converse.api.listen.on(c, __deferredResize));
								if (__resizeObserver) {
									__resizeObserver.observe(div);
									__resizeObserver.observe($anchor);
									__resizeObserver.observe($chatBox);
								}
							};

							this.close = function () {
								_converse.api.listen.not("startDiagonalResize", __startResize);
								_converse.api.listen.not("startHorizontalResize", __startResize);
								_converse.api.listen.not("startVerticalResize", __startResize);
								document.removeEventListener("mouseup", __endResize);
								window.removeEventListener("resize", __resizeHandler);
								__resizeWatchEvents.forEach((c) => _converse.api.listen.not(c, __deferredResize));
								if (__resizeObserver) {
									__resizeObserver.disconnect();
								}
							};
						})();

						olFrame.style.position = "absolute";
						$anchor.appendChild(olFrame);
						__resizeWatchImpl.start();
						_converse.api.listen.on("chatBoxClosed", closeOnline);
						this.triggerChange();
					};
					this.triggerChange = function () {
						__resizeHandler();
					};
					this.close = function () {
						__resizeWatchImpl.close();
						_converse.api.listen.not("chatBoxClosed", closeOnline);
					};
				})();

				const olFrame = document.createElement("iframe");
				let firstTime = true;

				function closeOnline (currentModel) {
					dynamicDisplayManager.triggerChange();
					if (currentModel && currentModel.cid !== chatModel.cid) {
						return;
					}
					dynamicDisplayManager.close();
					olFrame.remove();
				};

				function olIframeCloseHandler() {
					console.debug("doVideo - load", this);
					if (!firstTime) {
						// meeting closed and root url is loaded
						closeOnline();
					}
					if (firstTime) {
						firstTime = false; // ignore when ol-meet room url is loaded
					}
				};

				olFrame.toggleHideShow = function () {
					if (olFrame.style.display === "none") {
						olFrame.show();
					} else {
						olFrame.hide();
					}
				};
				olFrame.show = () => {
					olFrame.style.display = "";
				};
				olFrame.hide = () => {
					olFrame.style.display = "none";
				};
				olFrame.__jid = jid;
				olFrame.addEventListener("load", olIframeCloseHandler);
				olFrame.setAttribute("src", url);
				olFrame.setAttribute("class", "olmeet");
				olFrame.setAttribute("allow", "microphone; camera; display-capture;");
				olFrame.setAttribute("frameborder", "0");
				olFrame.setAttribute("seamless", "seamless");
				olFrame.setAttribute("allowfullscreen", "true");
				olFrame.setAttribute("scrolling", "no");
				olFrame.setAttribute("style", "z-index:1049;width:100%;height:100%;");
				dynamicDisplayManager.start();

				olFrame.contentWindow.addEventListener(
					"message",
					function (event) {
						if (baseMeetUrl.indexOf(event.origin) === 0 &&	typeof event.data === "string") {
							let data = JSON.parse(event.data);
							let olEvent = data["olmeet_event"];
							
							if ("close" === olEvent) {
								closeOnline();
							}
						}
					},
					false
				);
			}
		} 
	};
	
	async function handleConnected() {	
		const features = await _converse.api.disco.getFeatures(await _converse.api.connection.get().domain);
		console.debug("connected features", features);
		
		let jitsiAvailable = false;
		let galeneAvailable = false;
		let ohunAvailable = false;
						
		features.each(feature => {					
			const fieldname = feature.get('var');
			console.debug("connected feature", fieldname);	
			
			if (fieldname == "urn:xmpp:http:online-meetings#jitsi") jitsiAvailable = true;				
			if (fieldname == "urn:xmpp:http:online-meetings#galene") galeneAvailable = true;	
			if (fieldname == "urn:xmpp:http:online-meetings#ohun") ohunAvailable = true;				
		});	
		
		baseMeetUrl = _converse.api.settings.get("olmeet_url");
		
		if (jitsiAvailable) {
			const res = await _converse.api.sendIQ(converse.env.$iq({type: 'get'}).c('query', {type: 'jitsi', xmlns: 'urn:xmpp:http:online-meetings:0'}));				
			console.debug('handleConnected query jitsi response', res);			
			if (res.querySelector('url')) baseMeetUrl = res.querySelector('url').innerHTML;
		}
		else
			
		if (galeneAvailable) {
			const res = await _converse.api.sendIQ(converse.env.$iq({type: 'get'}).c('query', {type: 'galene', xmlns: 'urn:xmpp:http:online-meetings:0'}));				
			console.debug('handleConnected query galene response', res);			
			if (res.querySelector('url')) baseMeetUrl = res.querySelector('url').innerHTML;
		}
		else	

		if (ohunAvailable) {
			const res = await _converse.api.sendIQ(converse.env.$iq({type: 'get'}).c('query', {type: 'ohun', xmlns: 'urn:xmpp:http:online-meetings:0'}));				
			console.debug('handleConnected query ohun response', res);			
			if (res.querySelector('url')) baseMeetUrl = res.querySelector('url').innerHTML;
		}			
				
	}

	function initialize() {
		Strophe = converse.env.Strophe;
		env = converse.env;
		const _converse = this._converse;
		const { api, __ } = _converse;
		const { BaseModal } = _converse.exports;
		const { html, render } = converse.env;
			
		api.settings.extend({
			olmeet_start_option: MEET_START_OPTIONS.INTO_CHAT_WINDOW,
			olmeet_head_display_toggle: true,
			olmeet_modal: false,
			olmeet_url: MEET_START_OPTIONS.BASE_URL,
		});

		api.listen.on('connected', (data) => handleConnected(_converse));
		api.listen.on("messageNotification", (data) => handleMessageNotification(_converse, data));
		api.listen.on( "getToolbarButtons", (toolbar_el, buttons) => getToolbarButtons(_converse, toolbar_el, buttons));
		api.listen.on("afterMessageBodyTransformed", (text) => afterMessageBodyTransformed(_converse, text));
		api.listen.on('parseMessage', (stanza, attrs) => parseStanza(_converse, stanza, attrs));	
		api.listen.on('parseMUCMessage', (stanza, attrs) => parseStanza(_converse, stanza, attrs));		

		class MeetDialog extends BaseModal {

			initialize() {
				super.initialize();
				this.listenTo(this.model, "change", () => this.requestUpdate());
				this.addEventListener('hidden.bs.modal', () => render('', this));
			}

			getModalTitle () {
				return __('Meeting room: %1$s', this.model.get('room'));
			}

			renderModal() {
				return html`
					<iframe
						src="${this.model.get("url")}"
						id="olmeet"
						allow="microphone; camera; display-capture"
						frameborder="0"
						seamless="seamless"
						allowfullscreen="true"
						scrolling="no"
						style="z-index: 2147483647; width:460px; height:480px; display: inline-block"></iframe>`;
			}
		}

		api.elements.define('converse-olmeet-dialog', MeetDialog);
		console.debug("olmeet plugin is ready");
	}
}));	
