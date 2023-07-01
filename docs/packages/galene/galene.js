(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {

    var Strophe, $iq, $msg, $pres, $build, b64_sha1, _ , dayjs, _converse, html, _, __, Model, BootstrapModal, galene_confirm, galene_invitation, galene_tab_invitation, galene_ready, serverConnection;

    converse.plugins.add("galene", {
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
			
			setupStrophePlugins();
			
			const domain = getSetting("domain", location.hostname);
			const server = getSetting("server", location.host);
			const url = (domain == "localhost" || location.protocol == "http:" ? "http://" : "https://") + server + "/galene";
			
            _converse.api.settings.update({
                visible_toolbar_buttons: {call: false},		
                galene_head_display_toggle: false,
                galene_url: url,
				galene_host: domain
            });

            galene_confirm  = __('Galene Conference/Webinar?');
            galene_invitation = __('Please join webinar in room at');
            galene_tab_invitation = __('Or open in new tab at');

            _converse.api.listen.on('messageNotification', function (data)
            {
                console.debug("messageNotification", data);

                var chatbox = data.chatbox;
                var bodyElement = data.stanza.querySelector('body');

                if (bodyElement)
                {
                    var body = bodyElement.innerHTML;
                    var url = _converse.api.settings.get("galene_url");
                    var pos = body.indexOf(url + "/");
					
                    if (pos > -1)
                    {
                        var group = urlParam ("room", body);
                        var host = urlParam ("host", body);						
                        var label = galene_invitation;
                        var from = chatbox.getDisplayName().trim();
                        var avatar = _converse.api.settings.get("notification_icon");

                        if (data.chatbox.vcard.attributes.image) {
							avatar = "data:" + data.chatbox.vcard.attributes.image_type + ";base64," + data.chatbox.vcard.attributes.image;
						}

                        var prompt = new Notification(from,
                        {
                            'body': label + " " + group,
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
                                doLocalVideo(view, group, label, host);
                            }
                        }
                    }
                }
            });
			
			_converse.api.listen.on('callButtonClicked', function(data)
			{		
				handleCallRequest(data.model);
			});
			
			_converse.api.listen.on('getHeadingButtons', (el, buttons) => {
				buttons.push({'i18n_title': __('Toggle an audio call to ' + el.model.get('jid')),  'i18n_text': __('Call'), 'handler': ev => handleCallRequest(el.model), 'a_class': 'toggle-foo', 'icon_class': 'fa-phone', 'name': 'foo'});
				return buttons;
			});				

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
				if (galene_ready) {
					let color = "fill:var(--chat-toolbar-btn-color);";
					if (toolbar_el.model.get("type") === "chatroom") color = "fill:var(--muc-toolbar-btn-color);";
		
					buttons.push(html`
						<button class="plugin-galene" title="${__('Galene Conference/Webinar')}" @click=${performVideo}/>
							<svg style="width:20px; height:20px; ${color}" viewBox="0 0 452.388 452.388"  xml:space="preserve"> <g> 	<g id="Layer_8_38_"> 		<path d="M441.677,43.643H10.687C4.785,43.643,0,48.427,0,54.329v297.425c0,5.898,4.785,10.676,10.687,10.676h162.069v25.631 			c0,0.38,0.074,0.722,0.112,1.089h-23.257c-5.407,0-9.796,4.389-9.796,9.795c0,5.408,4.389,9.801,9.796,9.801h158.506 			c5.406,0,9.795-4.389,9.795-9.801c0-5.406-4.389-9.795-9.795-9.795h-23.256c0.032-0.355,0.115-0.709,0.115-1.089V362.43H441.7 			c5.898,0,10.688-4.782,10.688-10.676V54.329C452.37,48.427,447.589,43.643,441.677,43.643z M422.089,305.133 			c0,5.903-4.784,10.687-10.683,10.687H40.96c-5.898,0-10.684-4.783-10.684-10.687V79.615c0-5.898,4.786-10.684,10.684-10.684 			h370.446c5.898,0,10.683,4.785,10.683,10.684V305.133z M303.942,290.648H154.025c0-29.872,17.472-55.661,42.753-67.706 			c-15.987-10.501-26.546-28.571-26.546-49.13c0-32.449,26.306-58.755,58.755-58.755c32.448,0,58.753,26.307,58.753,58.755 			c0,20.553-10.562,38.629-26.545,49.13C286.475,234.987,303.942,260.781,303.942,290.648z"/> </g></g> </svg>
						</button>
					`);		
				}					

                return buttons;
            });

            _converse.api.listen.on('connected', async function()
            {
                window.connection = _converse.connection;
				
				const server = _converse.api.settings.get("galene_host");
                console.debug("connected", server);
				
				const features = await _converse.api.disco.getFeatures(server);
                console.debug("connected features", features);
				
				features.each(feature => {
					console.debug("connected feature", feature);					
					const fieldname = feature.get('var');
					
					if (fieldname == "urn:xmpp:sfu:galene:0") {
						console.debug("galene SFU found");
						galene_ready = true;						
					}
				});	

				if (!galene_ready) {
					const button = document.querySelector(".plugin-galene");
					if (button) button.style.display = 'none';
				}
				
				_converse.connection.addHandler(presence =>  {	
					/*
						<presence from="a0408534-28b9-489f-8681-a2f410c89dec@localhost" to="dele@localhost">
							<offer xmlns="urn:xmpp:rayo:1" to="xmpp:dele@localhost" from="xmpp:dele@localhost">
								<header name="caller_name" value="dele@localhost"/>
								<header name="called_name" value="dele@localhost"/>
								<header name="group" value="galene-2693057755317591-kxjnb7az0"/>
							</offer>
						</presence>
					*/
					
					_converse.connection.rayo.call_resource = presence.getAttribute("from");
					const callId = Strophe.getNodeFromJid(_converse.connection.rayo.call_resource);
					const headers = {};

					for (header of presence.querySelectorAll('header'))	{		
						var name = header.getAttribute('name');
						var value = header.getAttribute('value');						
						if (name && value) headers[name] = value;
					};					
					
					if (presence.querySelector('offer')) {					
						const view = _converse.chatboxviews.get(headers.caller_id);
						
						let avatar = _converse.api.settings.get("notification_icon");					
						if (view?.model?.vcard.attributes.image) avatar = "data:" + view.model.vcard.attributes.image_type + ";base64," + view.model.vcard.attributes.image;					
						
						console.log("Rayo offer", callId, headers);	

						if (headers.caller_name) 
						{
							var prompt = new Notification(headers.caller_name, {
								'body': "Incoming Call",
								'lang': _converse.locale,
								'icon': avatar,
								'requireInteraction': true
							});

							prompt.onclick = function(event) {
								event.preventDefault();
								console.log("Rayo event click", view?.model);
								_converse.connection.rayo.accept(headers, Strophe.getBareJidFromJid(_converse.connection.jid));									
								_converse.connection.rayo.answer(headers);									
							}						
						}
					}
					else

					if (presence.querySelector('ringing')) {
						console.log("Rayo ringing", callId);
						showStatus(headers, "call ringing");							
						connectMedia(callId, headers);
					}
					else

					if (presence.querySelector('answered')) {
						console.log("Rayo answered ", callId);
						showStatus(headers, "call established");							
					}	

					else

					if (presence.querySelector('end')) {
						console.log("Rayo hangup", callId);
						if (serverConnection) serverConnection.leave("public/" + callId);	
						disconnectMedia();
						showStatus(headers, "call ended");							
					}					
					
					return true;			
				}, 'urn:xmpp:rayo:1', 'presence');					
            });			

            _converse.api.listen.on('afterMessageBodyTransformed', function(text)
            {					
                if (text.indexOf("/galene/") > -1) {
                    const url = text.substring(0);
					const group = urlParam ("room", url);
                    const host = urlParam ("host", url);						
					
					if (group && host) {
						const link_label = galene_invitation;
						const tab_label = galene_tab_invitation;

						text.references = [];
						text.addTemplateResult(0, text.length, html`<a @click=${clickVideo} data-host="${host}" data-group="${group}" data-url="${url}" href="${url}">${link_label} ${group}</a>`);
					}
                }			
            });		

        }
    });
	
	function handleCallRequest(model) {
		if (serverConnection) {	
			terminateCall(model);
		} else {	
			makeCall(model);
		}			
	}
	
	function terminateCall(model) {
		const target = model.get('jid');
		const myself = Strophe.getBareJidFromJid(_converse.connection.jid);	
		const callId = Strophe.getNodeFromJid(_converse.connection.rayo.call_resource);	
		
		console.debug("terminateCall", callId, target, myself);	
		serverConnection.leave("public/" + callId);			
		_converse.connection.rayo.hangup(serverConnection.callHeaders);				
	}

	function makeCall(model) {
		const target = model.get('jid');
		const myself = Strophe.getBareJidFromJid(_converse.connection.jid);					
		console.debug("makeCall", target, myself);	

		_converse.connection.rayo.dial('xmpp:' + target, 'xmpp:' + myself);	
		showStatus({caller_id: target}, "call ringing");			
	}

	function disconnectMedia() {			
		closeUpMedia();						
		serverConnection = null;		
	}
	
	function connectMedia(callId, headers) {
		if (!serverConnection) {
			serverConnection = new ServerConnection();
			serverConnection.onhandshake = gotHandshake;
			serverConnection.onpeerconnection = onPeerConnection;
			serverConnection.onclose = gotClose;
			serverConnection.ondownstream = gotDownStream;
			serverConnection.onuser = gotUser;
			serverConnection.onjoined = gotJoined;
			serverConnection.onchat = addToChatbox;
			serverConnection.onusermessage = gotUserMessage;
			
			serverConnection.callHeaders = headers;			
			serverConnection.callId = callId;
			serverConnection.connect(_converse.connection, _converse.api.settings.get("galene_host"));
		}
	}

	function urlParam (name, url) {
		const results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
		if (!results) { return undefined; }
		return unescape(results[1] || undefined);
	}	

    function __confirm(msg, callback) {
      if (confirm(galene_confirm)) {
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
		
		if (galene_ready) {
			const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
			const chatView = _converse.chatboxviews.get(toolbar_el.model.get('jid'));	
			
			if (chatView) {
				__confirm(galene_confirm, function() {
					doVideo(chatView);
				});
			}
		} else {
			alert("Galene not found");
		}
    }

    function clickVideo(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();

        const group = ev.target.getAttribute("data-group");
        const host = ev.target.getAttribute("data-host");
	
        const chatView = getChatViewFromElement(ev.currentTarget);		

        console.debug("clickVideo", ev.target, group, host, chatView);
		
        if (chatView) {			
          doLocalVideo(chatView, group, galene_invitation, host);
        }
    }

    function doVideo(view)
    {
		const isChatBox = view.model.get("type") == "chatbox"
		const host = _converse.api.settings.get("galene_host");
        const group = (isChatBox ? "public/" : "") +  Strophe.getNodeFromJid(view.model.attributes.jid).toLowerCase().replace(/[\\]/g, '') + "/" + Math.random().toString(36).substr(2,9);
        const url = _converse.api.settings.get("galene_url") + '/?room=' + group + "&host=" + host;

        console.debug("doVideo", isChatBox, group, url, view.model);

        view.model.sendMessage({'body': url});	
        doLocalVideo(view, group, galene_invitation, host);
    }

    function doLocalVideo(view, group, label, host)
    {
        const chatModel = view.model;
        console.debug("doLocalVideo", chatModel, group, label, host);
		
		if (!host) host = _converse.api.settings.get("galene_host");
		const server =  _converse.api.settings.get("galene_url");

		const isOverlayedDisplay = _converse.api.settings.get("view_mode") === "overlayed";
		const headDisplayToggle = isOverlayedDisplay || _converse.api.settings.get("galene_head_display_toggle") === true;
		const div = view.querySelector(headDisplayToggle ? ".chat-body" : ".box-flyout");

		if (div) {
			let firstTime = true;

			let openChatbox = function ()
			{
				let jid = view.model.get("jid");
				let type = view.model.get("type");

				console.debug("openChatbox", jid, type);

				if (jid)
				{
					if (type == "chatbox") _converse.api.chats.open(jid, {'bring_to_foreground': true}, true);
					else
					if (type == "chatroom") _converse.api.rooms.open(jid, {'bring_to_foreground': true}, true);
				}
			}	
			
			let closeGalene = function(currentModel) {
			  console.debug("doLocalVideo - closeGalene", this);
			  
			  if (currentModel && currentModel.cid !== chatModel.cid) {
				return;
			  }
			  galeneFrame.remove();
			  view.close();
			  setTimeout(function() { openChatbox() });				  
			}
			
			let galeneIframeCloseHandler = function () {
				console.debug("doLocalVideo - galeneIframeCloseHandler");
				
				if (!firstTime) {
					closeGalene();
				}
				
				if (firstTime) {
					firstTime = false;   // ignore when galene-meet group url is loaded
					
					galeneFrame.contentWindow.addEventListener("message", function (event) {
					  if (typeof event.data === 'string') {
						let data = JSON.parse(event.data);
						let galeneEvent = data['galene_event'];
						if ('close' === galeneEvent) {
						  closeGalene();
						}
					  }
					}, false);
				}
			};
			
			const jid = view.model.attributes.jid;			
			let galeneFrame = document.createElement('iframe');

			galeneFrame.__jid = jid;
			galeneFrame.addEventListener("load", galeneIframeCloseHandler);
			galeneFrame.setAttribute("src", "./packages/galene/index.html?room=" + group + "&username=" + Strophe.getNodeFromJid(_converse.connection.jid) + "&password=" + _converse.connection.jid + "&host=" + host + "&server=" + server);
			galeneFrame.setAttribute("class", "galene");
			galeneFrame.setAttribute("allow", "microphone; camera;");
			galeneFrame.setAttribute("frameborder", "0");
			galeneFrame.setAttribute("seamless", "seamless");
			galeneFrame.setAttribute("allowfullscreen", "true");
			galeneFrame.setAttribute("scrolling", "no");
			galeneFrame.setAttribute("style", "width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden;");

			div.innerHTML = "";			
			div.appendChild(galeneFrame);					
										
		}
    }
	
	function showStatus(header, status) {
		let place = document.querySelector('converse-message-form[jid="' + header.caller_id + '"] .chat-textarea, converse-muc-message-form[jid="' + header.caller_id + '"] .chat-textarea');
		
		if (!place) {
			place = document.querySelector('converse-message-form[jid="' + header.called_id + '"] .chat-textarea, converse-muc-message-form[jid="' + header.called_id + '"] .chat-textarea');
		}	
		
		if (place) {
			place.placeholder = status
		}		
	}

	async function gotHandshake() {
		console.debug("gotHandshake");	
		
		const username = Strophe.getNodeFromJid(_converse.connection.jid);
		const pw = "";
		const group = "public/" + serverConnection.callId;	

		try {
			await serverConnection.join(group, username, pw);
		} catch(e) {
			console.error(e);
			serverConnection.close();
		}
	}

	function gotUser(id, kind) {
		console.debug("gotUser", id, kind);
	}

	function gotJoined(kind, group, perms, status, data, message) {
		console.debug("gotJoined", kind, group, perms, status, data, message);
		
		switch(kind) {
		case 'join':		
			startCall();				
			break;
		case 'change':
			break;
		case 'leave':
			break;			
		case 'redirect':
			serverConnection.close();
			break;
		case 'fail':
			console.error("failed to join")
			break;	
		}
	}	
	
	function startCall() {
		serverConnection.request({'':['audio']});		
		startStream();	
	}
	
	async function startStream() {
		console.debug("startStream");
		
		let constraints = {audio: true};
		let stream = null;
		
		try {
			stream = await navigator.mediaDevices.getUserMedia(constraints);
		} catch(e) {
			console.error("talk clicked", e);
			return;
		}

		let c;

		try {
			c = newUpStream();
			//serverConnection.groupAction('record');
		} catch(e) {
			console.error("talk clicked", e);
			return;
		}		

		setUpStream(c, stream);
		await setMedia(c, true);		
	}
	
	function stopStream(s) {
		console.debug("stopStream", s);
		
		s.getTracks().forEach(t => {
			try {
				t.stop();
			} catch(e) {
				console.warn(e);
			}
		});	
	}

	function setUpStream(c, stream) {
		console.debug("setUpStream", c, stream);	
		
		if(c.stream != null)
			throw new Error("Setting nonempty stream");

		c.setStream(stream);

		c.onclose = replace => {

			if(!replace) {
				stopStream(c.stream);
				if(c.userdata.onclose)
					c.userdata.onclose.call(c);
				delMedia(c.localId);
			}
		}

		function addUpTrack(t) {
			if(c.label === 'camera') {
				if(t.kind == 'audio') {

				} else if(t.kind == 'video') {

				}
			}
			t.onended = e => {
				stream.onaddtrack = null;
				stream.onremovetrack = null;
				c.close();
			};

			let encodings = [];
			let tr = c.pc.addTransceiver(t, {
				direction: 'sendonly',
				streams: [stream],
				sendEncodings: encodings,
			});

			// Firefox workaround
			function match(a, b) {
				if(!a || !b)
					return false;
				if(a.length !== b.length)
					return false;
				for(let i = 0; i < a.length; i++) {
					if(a.maxBitrate !== b.maxBitrate)
						return false;
				}
				return true;
			}

			let p = tr.sender.getParameters();
			
			if (!p || !match(p.encodings, encodings)) {
				p.encodings = encodings;
				tr.sender.setParameters(p);
			}
		}

		// c.stream might be different from stream if there's a filter
		c.stream.getTracks().forEach(addUpTrack);

		stream.onaddtrack = function(e) {
			addUpTrack(e.track);
		};

		stream.onremovetrack = function(e) {
			let t = e.track;
			let sender;
			
			c.pc.getSenders().forEach(s => {
				if(s.track === t)
					sender = s;
			});
			if(sender) {
				c.pc.removeTrack(sender);
			} else {
				console.warn('Removing unknown track');
			}

			let found = false;
			c.pc.getSenders().forEach(s => {
				if(s.track)
					found = true;
			});
			if(!found) {
				stream.onaddtrack = null;
				stream.onremovetrack = null;
				c.close();
			}
		};
	}

	function onPeerConnection() {
		console.debug("onPeerConnection");
		return null;
	}

	function gotClose(code, reason) {
		console.debug("gotClose", code, reason);
		
		closeUpMedia();

		if(code != 1000) {
			console.warn('Socket close', code, reason);
		}
	}

	function gotDownStats(stats) {
		console.debug("gotDownStats", stats);	
	}

	function closeUpMedia(label) {
		console.debug("closeUpMedia", label);
		
		if (serverConnection?.up) {
			for(let id in serverConnection?.up) {
				let c = serverConnection.up[id];
				if(label && c.label !== label)
					continue
				c.close();
			}
		}
	}

	function gotDownStream(c) {
		console.debug("gotDownStream", c);
		
		c.onclose = function(replace) {
			if(!replace)
				delMedia(c.localId);
		};
		c.onerror = function(e) {
			console.error(e);
		};
		c.ondowntrack = function(track, transceiver, label, stream) {
			setMedia(c, false);
		};
		c.onnegotiationcompleted = function() {
			resetMedia(c);
		}
		c.onstatus = function(status) {
			setMediaStatus(c);
		};
		
		c.onstats = gotDownStats;
		setMedia(c, false);			
	}

	function setMediaStatus(c) {
		let state = c && c.pc && c.pc.iceConnectionState;
		let good = state === 'connected' || state === 'completed';

		let media = document.getElementById('media-' + c.localId);
		if(!media) {
			console.warn('Setting status of unknown media.');
			return;
		}
		if(good) {
			media.classList.remove('media-failed');
			if(c.userdata.play) {
				if(media instanceof HTMLMediaElement)
					media.play().catch(e => {
						console.error(e);
					});
				delete(c.userdata.play);
			}
		} else {
			media.classList.add('media-failed');
		}
	}

	function delMedia(localId) {
		console.debug("delMedia", localId);
		
		let mediadiv = document.getElementById('peers');
		let peer = document.getElementById('peer-' + localId);
		
		if(!peer)
			throw new Error('Removing unknown media');

		let media = document.getElementById('media-' + localId);

		media.srcObject = null;
		mediadiv.removeChild(peer);
	}

	function resetMedia(c) {
		let media = document.getElementById('media-' + c.localId);
		
		if(!media) {
			console.error("Resetting unknown media element")
			return;
		}
		media.srcObject = media.srcObject;
	}

	async function setMedia(c, isUp, mirror, video) {
		console.debug("setMedia", c, isUp, mirror, video);
		
		let peersdiv = document.getElementById('peers');
		
		if (!peersdiv) {
			peersdiv = document.createElement('div');
			peersdiv.id = 'peers';		
			document.body.appendChild(peersdiv);		
		}		

		let div = document.getElementById('peer-' + c.localId);
		
		if (!div) {
			div = document.createElement('div');
			div.id = 'peer-' + c.localId;
			div.classList.add('peer');
			peersdiv.appendChild(div);
		}

		let media = document.getElementById('media-' + c.localId);
		
		if(!media) {
			if (video) {
				media = video;
			} else {
				media = document.createElement('audio');
				if(isUp)
					media.muted = true;
			}

			media.classList.add('media');
			media.autoplay = true;
			media.playsInline = true;
			media.id = 'media-' + c.localId;
			div.appendChild(media);
		}

		if(mirror)
			media.classList.add('mirror');
		else
			media.classList.remove('mirror');

		if(!video && media.srcObject !== c.stream)
			media.srcObject = c.stream;

		let label = document.getElementById('label-' + c.localId);
		
		if(!label) {
			label = document.createElement('div');
			label.id = 'label-' + c.localId;
			label.classList.add('label');
			div.appendChild(label);
		}
	}

	function addToChatbox(peerId, dest, nick, time, privileged, history, kind, message) {
		console.debug("addToChatbox", peerId, dest, nick, time, privileged, history, kind, message);		
		return message;	
	}

	function gotUserMessage(id, dest, username, time, privileged, kind, message) {
		console.debug("gotUserMessage", id, dest, username, time, privileged, kind, message);	
	}

	function newUpStream(localId) {
		let c = serverConnection.newUpStream(localId);
		c.onstatus = function(status) {
			setMediaStatus(c);
		};
		c.onerror = function(e) {
			console.error(e);
		};
		return c;
	}	
	
	function cyrb53(str, seed = 0) {
		let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
		for (let i = 0, ch; i < str.length; i++) {
			ch = str.charCodeAt(i);
			h1 = Math.imul(h1 ^ ch, 2654435761);
			h2 = Math.imul(h2 ^ ch, 1597334677);
		}
		h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
		h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
		return 4294967296 * (2097151 & h2) + (h1>>>0);
	}	
	
	function setupStrophePlugins() {
		Strophe.addConnectionPlugin('rayo', {
			RAYO_XMLNS: 'urn:xmpp:rayo:1',
			connection: null,
			
			init: function (conn) {
				this.connection = conn;
				
				if (this.connection.disco) {
					this.connection.disco.addFeature('urn:xmpp:rayo:client:1');
				}
				
				console.debug("Rayo plugin ready");
			},

			dial: function (to, from) {
				console.debug('dial ', to, from);
				
				var self = this;
				var req = $iq({type: 'set',	to: _converse.api.settings.get("galene_host")});
				req.c('dial', {xmlns: this.RAYO_XMLNS, to: to, from: from});
				req.c('header',	{caller_name: _converse.xmppstatus.getFullname() || Strophe.getBareJidFromJid(_converse.connection.jid)});

				this.connection.sendIQ(req,
					function (result) {
						console.debug('Dial result ', result);
						var resource = result.querySelector('ref').getAttribute('uri');
						self.call_resource = resource.substr('xmpp:'.length);
						console.debug("Received call resource: " + self.call_resource); // BAO
					},
					function (error) {
						console.debug('Dial error ', error);
					}
				);
			},

			accept: function (headers, callee) {
				console.debug('accept', this.call_resource, callee, headers);
						
				if (!this.call_resource) {
					console.warn("No call in progress");
					return;
				}

				var self = this;
				var req = $iq({	type: 'set', to: this.call_resource});
				req.c('accept', {xmlns: this.RAYO_XMLNS});
				
				if (headers) {	
					const hdrs = Object.getOwnPropertyNames(headers)

					for (name of hdrs) {
						const value = headers[name];
						if (value) req.c("header", {name: name, value: value}).up(); 
					}
				}
				
				req.c("header", {name: 'callee_id', value: callee}).up(); 

				this.connection.sendIQ(req,
					function (result) {console.debug('Accept result ', result)},
					function (error)  {console.debug('Accept error ', error)}
				);
			},
			
			answer: function (headers) {
				console.debug('answer', this.call_resource, headers);
						
				if (!this.call_resource) {
					console.warn("No call in progress");
					return;
				}

				var self = this;
				var req = $iq({	type: 'set', to: this.call_resource});
				req.c('answer', {xmlns: this.RAYO_XMLNS});
				
				if (headers) {	
					const hdrs = Object.getOwnPropertyNames(headers)

					for (name of hdrs) {
						const value = headers[name];
						if (value) req.c("header", {name: name, value: value}).up(); 
					}
				}

				this.connection.sendIQ(req,
					function (result) {console.debug('Answer result ', result)},
					function (error)  {console.debug('Answer error ', error)}
				);
			},
			
			hangup: function (headers) {
				console.debug('hangup', this.call_resource, headers);
						
				if (!this.call_resource) {
					console.warn("No call in progress");
					return;
				}

				var self = this;
				var req = $iq({	type: 'set', to: this.call_resource});
				req.c('hangup', {xmlns: this.RAYO_XMLNS});
				
				if (headers) {	
					const hdrs = Object.getOwnPropertyNames(headers)

					for (name of hdrs) {
						const value = headers[name];
						if (value) req.c("header", {name: name, value: value}).up(); 
					}
				}

				this.connection.sendIQ(req,
					function (result) {
						console.debug('Hangup result ', result);
						self.call_resource = null;
					},
					function (error) {
						console.debug('Hangup error ', error);
						self.call_resource = null;
					}
				);
			}
		});
	}		
}));
