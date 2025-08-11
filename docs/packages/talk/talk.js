(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var  _converse, html, __, button, myJid, myself, me, model, pcSpeak, pcListen, whipStream, whepStream, whipStreamKey, whepStreamKey, whipAvailable = false, incomingCall = false;

    converse.plugins.add("talk", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            html = converse.env.html;
            __ = _converse.__;
		
			_converse.api.listen.on('connected', async function() {
				console.debug("screencast - connected");	
				myJid = await _converse.api.connection.get().jid;
				myself = converse.env.Strophe.getBareJidFromJid(myJid);	
				me = converse.env.Strophe.getNodeFromJid(myJid);	

				const features = await _converse.api.disco.getFeatures(await _converse.api.connection.get().domain);
                console.debug("connected features", features);
								
				features.each(feature => {					
					const fieldname = feature.get('var');
					console.debug("connected feature", fieldname);		
					
					if (fieldname == "urn:xmpp:whip:0") whipAvailable = true;				
				});	

				
				setTimeout(() => {
					const names = Object.getOwnPropertyNames(_converse.chatboxviews.views);
					
					for (name of names) {	
						const view = _converse.chatboxviews.views[name];
						const button = document.body.querySelector("button.btn.toggle-call");
							
						if (view.model.get("type") != "chatbox" || !whipAvailable) {
							if (button) button.style.display = 'none';	
						}
					};	
				});					
			});	
			
            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)   {
				setTimeout(() => {				
					const button = toolbar_el.querySelector("button.btn.toggle-call");
					
					if (toolbar_el.model.get("type") != "chatbox" || !whipAvailable) {
						if (button) button.style.display = 'none';	
					}
				});					
                return buttons;
            });			

			_converse.api.listen.on('parseMessage', (stanza, attrs) => {
				return parseStanza(stanza, attrs);
			});	
			
			_converse.api.listen.on('callButtonClicked', function (obj) {
				console.debug("callButtonClicked", obj);	
				
				if (!whipStreamKey) {
					incomingCall = false;
					model = obj.model;
					doWhipRequest();
					sendInviteMessage();
					
				} else {
					if (incomingCall) {
						sendLeftMessage();			
					} else {
						sendRetractMessage();			
					}	

					stopBothStreams();					
				}
			});				

            console.debug("talk plugin is ready");
        }
	});	
	
	async function doWhepRequest() {
		pcListen = new RTCPeerConnection();
		pcListen.addTransceiver('audio', { direction: 'recvonly' })					

		pcListen.oniceconnectionstatechange = () => {
			console.debug("oniceconnectionstatechange listen", pcListen.iceConnectionState);
		}
		
		pcListen.ontrack = (event) => {
			console.debug("ontrack listen ", event.streams, event);	

			if (event.track.kind == "audio") {
				const ele = document.createElement("audio");
				ele.id = whepStreamKey;
				ele.setAttribute("autoplay", true);									
				ele.style.display = "none";
				whepStream = event.streams[0];
				ele.srcObject = whepStream;
			}	
			sendTextMessage("/me is connected to talk");			
		}	
								
		const offer = await pcListen.createOffer();
		pcListen.setLocalDescription(offer);
		console.debug('whep offer', offer.sdp);					

		const res = await _converse.api.sendIQ(converse.env.$iq({type: 'set'}).c('whep', {key: whepStreamKey, xmlns: 'urn:xmpp:whep:0'}).c('sdp', offer.sdp));				
		console.debug('whep response', res);
		
		const answer = res.querySelector('sdp').innerHTML;
		pcListen.setRemoteDescription({sdp: answer,  type: 'answer'});	
		console.debug('whep answer', answer);									
	}
	
    async function doWhipRequest() {
		const view = _converse.chatboxviews.views[model.get('jid')];		
		button = view?.querySelector("button.btn.toggle-call");		
		console.debug("doWhipRequest", model, view, button);
		
        if (!button.classList.contains('blink_me')) { 
			whipStreamKey = uuidv4();
			console.debug("doWhipRequest", model, whipStreamKey);
				
            navigator.mediaDevices.getUserMedia({audio: true, video: false }).then(async stream => 	{
				whipStream = stream;
				console.debug("doWhipRequest", stream);
				
				stream.getAudioTracks()[0].addEventListener('ended', () => {
					console.debug('The user has ended call');
					stopBothStreams();
					sendRetractMessage();	
				});
				
				pcSpeak = new RTCPeerConnection();

				pcSpeak.oniceconnectionstatechange = () => {
					console.debug("oniceconnectionstatechange speak", pcSpeak.iceConnectionState);
				}
				
				pcSpeak.ontrack = function (event) {
					console.debug("ontrack speak", event.streams, event);			
				}	

				stream.getTracks().forEach(t =>  {
					pcSpeak.addTransceiver(t, {direction: 'sendonly'})					
				})	

				const offer = await pcSpeak.createOffer();
				pcSpeak.setLocalDescription(offer);
				
				const res = await _converse.api.sendIQ(converse.env.$iq({type: 'set'}).c('whip', {xmlns: 'urn:xmpp:whip:0', key: whipStreamKey}).c('sdp', offer.sdp));		
				const answer = res.querySelector('sdp').innerHTML;
				pcSpeak.setRemoteDescription({sdp: answer,  type: 'answer'});	
				console.debug('whip answer', answer);

				button.classList.add('blink_me');			
				
            }, error => {
                handleError(error)
            });

        } else {
			stopBothStreams();
			sendRetractMessage();			
        }
    }

	function sendInviteMessage() {
		const message = "/me requests a talk";			
		const type = 'chat';	
		const target = model.get('jid');			
		const msg = converse.env.stx`<message xmlns="jabber:client" from="${myJid}" to="${target}" type="${type}"><body>${message}</body><invite xmlns="urn:xmpp:call-invites:0"><external uri="${"whip:" + whipStreamKey}" /></invite></message>`;
		_converse.api.send(msg);		
	}

	function sendAcceptMessage() {
		const message = "/me accepts the talk";			
		const type = 'chat';	
		const target = model.get('jid');		
		const msg = converse.env.stx`<message xmlns="jabber:client" from="${myJid}" to="${target}" type="${type}"><body>${message}</body><accept xmlns="urn:xmpp:call-invites:0" id="${whepStreamKey}" ><external uri="${"whip:" + whipStreamKey}" /></accept></message>`;
		_converse.api.send(msg);		
	}
	
	function sendRejectMessage() {
		const message = "/me rejects the talk";			
		const type = 'chat';	
		const target = model.get('jid');		
		const msg = converse.env.stx`<message xmlns="jabber:client" from="${myJid}" to="${target}" type="${type}"><body>${message}</body><reject xmlns="urn:xmpp:call-invites:0" id="${whepStreamKey}" /></message>`;
		_converse.api.send(msg);		
	}
	
	function sendRetractMessage() {
		const message = "/me terminates the talk";			
		const type = 'chat';
		const target = model.get('jid');
		const msg = converse.env.stx`<message xmlns="jabber:client" from="${myJid}" to="${target}" type="${type}"><body>${message}</body><retract xmlns="urn:xmpp:call-invites:0" id="${whipStreamKey}" /></message>`;
		_converse.api.send(msg);		
	}

	function sendLeftMessage() {
		const message = "/me left the talk";			
		const type = 'chat';
		const target = model.get('jid');
		const msg = converse.env.stx`<message xmlns="jabber:client" from="${myJid}" to="${target}" type="${type}"><body>${message}</body><left xmlns="urn:xmpp:call-invites:0" id="${whepStreamKey}" /></message>`;
		_converse.api.send(msg);				
	}
	
	function sendTextMessage(message) {		
		const type = 'chat';
		const target = model.get('jid');
		const msg = converse.env.stx`<message xmlns="jabber:client" from="${myJid}" to="${target}" type="${type}"><body>${message}</body></message>`;
		_converse.api.send(msg);				
	}	

    function stopBothStreams()  {
		button.classList.remove('blink_me');

		if (incomingCall) {
			sendTextMessage("/me left talk");	
		}			

		if (pcSpeak && whipStream) {	
			whipStream.getTracks().forEach(track => track.stop());
			pcSpeak.close();
		}
		
		if (pcListen && whepStream) {	
			whepStream.getTracks().forEach(track => track.stop());
			pcListen.close();
			
			if (whepStreamKey) {
				const eleId = document.getElementById(whepStreamKey);
				if (eleId) eleId.remove();
			}
		}
		
		whepStreamKey = undefined;
		whipStreamKey = undefined;
    }

    function handleError(e) {
        console.error("talk", e)
    }
	
	async function parseStanza(stanza, attrs) {
		console.debug("parseStanza", stanza, attrs);		
		const invite = stanza.querySelector('invite');	
		const retract = stanza.querySelector('retract');	
		const accept = stanza.querySelector('accept');	
		const reject = stanza.querySelector('reject');
		const left = stanza.querySelector('left');
				
		if (!invite && !retract && !accept && !reject && !left) return attrs;
		
		const view = _converse.chatboxviews.get(attrs.contact_jid);
		if (!view) return attrs;
				
		console.debug("parseStanza", view, view.model);
		model = view.model;
		button = view?.querySelector("button.btn.toggle-call");			
		let uri, id;
		
		if (invite) {
			incomingCall = true;
			uri = invite.querySelector('external')?.getAttribute("uri");

			if (uri && uri.startsWith("whip:")) {
				whepStreamKey = uri.substring(5);                
				
				const prompt = new Notification(model.get('jid').trim(), {
					body: "Talk?",
					lang: _converse.locale,
					icon: _converse.api.settings.get("notification_icon"),
					requireInteraction: true,
				});

				prompt.onclick = function (event) {
					event.preventDefault();
					
					doWhipRequest();
					setTimeout(doWhepRequest, 1000);
					
					sendAcceptMessage();
				};
				
				prompt.onclose = function (event) {
					event.preventDefault();
					//sendRejectMessage();
				}						
			}			
		}
		else
			
		if (accept) {
			uri = accept.querySelector('external')?.getAttribute("uri");
			id = accept.getAttribute("id");
			
			if (whipStreamKey != null && whipStreamKey == id) {
				whepStreamKey = uri.substring(5);
				doWhepRequest();
			}			
		}		
		else
			
		if (retract) {
			id = retract.getAttribute("id");
			
			//if (whepStreamKey != null && whepStreamKey == id) {
				stopBothStreams();				
			//}
		}
		else
			
		if (reject) {
			id = retract.getAttribute("id");
			
			//if (whipStreamKey != null && whipStreamKey == id) {
				stopBothStreams();			
			//}
		}
		else
			
		if (left) {
			id = left.getAttribute("id");
			
			//if (whepStreamKey != null && whepStreamKey == id) {
				stopBothStreams();			
			//}
		}		
				
		return attrs;
	}

	function newElement(el, id, html, class1, class2, class3, class4, class5) {
		const ele = document.createElement(el);
		if (id) ele.id = id;
		if (html) ele.innerHTML = html;
		if (class1) ele.classList.add(class1);
		if (class2) ele.classList.add(class2);
		if (class3) ele.classList.add(class3);
		if (class4) ele.classList.add(class4);
		if (class5) ele.classList.add(class5);	
		document.body.appendChild(ele);
		return ele;
	}

	function uuidv4() {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
	
}));
