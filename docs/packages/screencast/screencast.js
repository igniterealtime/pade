(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var  _converse, html, __, button, myJid, myself, me, model, pcSpeak, audioStream, occupantId, screencastDlg, whipAvailable;

    converse.plugins.add("screencast", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            html = converse.env.html;
            __ = _converse.__;
			
			class ScreencastDialog extends _converse.exports.BaseModal {				
			   
                initialize() {
					super.initialize();					
					this.listenTo(this.model, "change", () => this.requestUpdate());
					
					this.addEventListener('shown.bs.modal', async () => {
						const key = this.model.get("key");
						const nick = this.model.get("nick");

						this.querySelector('.modal-title').innerHTML = nick;
						this.querySelector('.modal-body').innerHTML = __("Please wait....");
						
						const pcListen = new RTCPeerConnection();
						pcListen.addTransceiver('audio', { direction: 'recvonly' })
						pcListen.addTransceiver('video', { direction: 'recvonly' })						

						pcListen.oniceconnectionstatechange = () => {
							console.debug("oniceconnectionstatechange listen", pcListen.iceConnectionState);
						}

						let audioStream;
						
						pcListen.ontrack = (event) => {
							console.debug("ontrack listen ", event.streams, event);	

							if (event.track.kind == "video") {
								const ele = document.createElement("video");
								ele.setAttribute("autoplay", true);	
								ele.setAttribute("controls", true);									
								ele.style = "width: 100%; height: 100%";
								audioStream	=  event.streams[0];
								ele.srcObject = audioStream;

								const parent = this.querySelector('.modal-body');
								
								if (parent) {
									parent.innerHTML = "";
									parent.appendChild(ele);
								}
							}								
						}	
						
						this.addEventListener("blur", (event) => {
							console.debug("screencast dialog lost focus");
							
							setTimeout(() => {
								if (!converse.env.u.isVisible(screencastDlg)) {
									if (audioStream) audioStream.getTracks().forEach(track => track.stop());
									pcListen.close();	
								}
							}, 2000);								
						})
												
						const offer = await pcListen.createOffer();
						pcListen.setLocalDescription(offer);
						console.debug('whep offer', offer.sdp);					

						const res = await _converse.api.sendIQ(converse.env.$iq({type: 'set'}).c('whep', {key, xmlns: 'urn:xmpp:whep:0'}).c('sdp', offer.sdp));				
						console.debug('whep response', res);
						
						const answer = res.querySelector('sdp').innerHTML;
						pcListen.setRemoteDescription({sdp: answer,  type: 'answer'});	
						console.debug('whep answer', answer);							
					});						
                }
				
				renderModal() {
                  return html`<div class="modal-dialog"></div>`;
                }
            };
		
			_converse.api.elements.define('converse-pade-screencast-dialog', ScreencastDialog);				

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)   {
				console.debug("screencast - getToolbarButtons", whipAvailable);
				
				if (toolbar_el.model.get("type") === "chatroom" && whipAvailable) {
					style = "width:18px; height:18px; fill:var(--muc-color);";

					buttons.push(html`
						<button class="btn plugin-screencast" title="${__('ScreenCast. Click to start and stop')}" @click=${performScreenCast} .chatview=${this.chatview}/>
							<svg style="${style}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g><path d="M 30,2L 2,2 C 0.896,2,0,2.896,0,4l0,18 c0,1.104, 0.896,2, 2,2l 9.998,0 c-0.004,1.446-0.062,3.324-0.61,4L 10.984,28 C 10.44,28, 10,28.448, 10,29C 10,29.552, 10.44,30, 10.984,30l 10.030,0 C 21.56,30, 22,29.552, 22,29c0-0.552-0.44-1-0.984-1l-0.404,0 c-0.55-0.676-0.606-2.554-0.61-4L 30,24 c 1.104,0, 2-0.896, 2-2L 32,4 C 32,2.896, 31.104,2, 30,2z M 14,24l-0.002,0.004 C 13.998,24.002, 13.998,24.002, 14,24L 14,24z M 18.002,24.004L 18,24l 0.002,0 C 18.002,24.002, 18.002,24.002, 18.002,24.004z M 30,20L 2,20 L 2,4 l 28,0 L 30,20 z"></path></g></svg>
						</button>
					`);

				}
                return buttons;
            });			
		
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

				if (!whipAvailable) {
					const view = _converse.chatboxviews.get(model.get("from_muc"));
					const button = view.querySelector(".plugin-screencast");
					if (button) button.style.display = 'none';					
				}					
			});	
			
			_converse.api.listen.on('parseMUCMessage', (stanza, attrs) => {
				return parseStanza(stanza, attrs);
			});				

            console.debug("screencast plugin is ready");
        }
	});	
	
    function performScreenCast(ev)     {
        ev.stopPropagation();
        ev.preventDefault();

		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		button = toolbar_el.querySelector('.plugin-screencast');	
		model = toolbar_el.model;		
		const occupant = model.getOwnOccupant();
		const occupants = model.getOccupantsSortedBy('occupant_id'); 

        if (!button.classList.contains('blink_me')) {  
			occupantId = occupant.get("occupant_id");
			if (!occupantId) occupantId = occupant.get("id");
			console.debug("performScreenCast", model, occupantId, occupants);
				
            navigator.mediaDevices.getDisplayMedia({audio: true, video: true }).then(async stream => 	{
				audioStream = stream;
				console.debug("performScreenCast", stream);
				
				stream.getVideoTracks()[0].addEventListener('ended', () => {
					console.debug('The user has ended sharing the screen');
					stopStream();
					sendStopMessage();	
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
				
				const res = await _converse.api.sendIQ(converse.env.$iq({type: 'set'}).c('whip', {xmlns: 'urn:xmpp:whip:0', key: occupantId}).c('sdp', offer.sdp));		
				const answer = res.querySelector('sdp').innerHTML;
				pcSpeak.setRemoteDescription({sdp: answer,  type: 'answer'});	
				console.debug('whip answer', answer);

				button.classList.add('blink_me');	
				sendStartMessage();			
				
            }, error => {
                handleError(error)
            });

        } else {
			stopStream();
			sendStopMessage();			
        }
    }
	
	function sendStartMessage() {
		const message = "/me started streaming";			
		const type = (model.get('type') == 'chatroom') ? 'groupchat' : 'chat';	
		const target = (model.get('type') == 'chatbox') ? model.get('jid') : (model.get('type') == 'chatroom' ? model.get('jid') : model.get('from'));			
		const msg = converse.env.stx`<message xmlns="jabber:client" from="${myJid}" to="${target}" type="${type}"><body>${message}</body><invite xmlns="urn:xmpp:call-invites:0"><external uri="${"whip:" + occupantId}" /></invite></message>`;
		_converse.api.send(msg);		
	}
	
	function sendStopMessage() {
		const message = "/me stopped streaming";			
		const type = (model.get('type') == 'chatroom') ? 'groupchat' : 'chat';	
		const target = (model.get('type') == 'chatbox') ? model.get('jid') : (model.get('type') == 'chatroom' ? model.get('jid') : model.get('from'));			
		const msg = converse.env.stx`<message xmlns="jabber:client" from="${myJid}" to="${target}" type="${type}"><body>${message}</body><retract xmlns="urn:xmpp:call-invites:0" id="${occupantId}" /></message>`;
		_converse.api.send(msg);		
	}	

    function stopStream()  {
		button.classList.remove('blink_me');	

		if (pcSpeak && audioStream) {	
			audioStream.getTracks().forEach(track => track.stop());
			pcSpeak.close();
		}
    }

    function handleError(e) {
        console.error("ScreenCast", e)
    }
	
	async function parseStanza(stanza, attrs) {
		const invite = stanza.querySelector('invite');	
		const retract = stanza.querySelector('retract');		
		const occupantEle = stanza.querySelector('occupant-id');	
		
		if (!invite && !retract) return attrs;
		//console.debug("parseStanza", stanza, attrs);

		let occupant_id;
		
		if (occupantEle) {	
			occupant_id = occupantEle.getAttribute("id");	
		} else {
			if (invite) occupant_id = invite.querySelector('external')?.getAttribute("uri").substring(5);
			if (retract) occupant_id = retract.getAttribute("id");
		}
		
		//console.debug("parseStanza occupant", occupant_id, occupantId);		
		
		if (occupant_id && attrs.from_muc) {		
			const view = _converse.chatboxviews.get(attrs.from_muc);			
			const element = document.getElementById(occupant_id);
			
			if (element && view) {
				let occupant = view.model.occupants.findOccupant({ occupant_id });	
				if (!occupant) occupant = view.model.occupants.findOccupant({ id: occupant_id });
				const ocId = occupant.get('occupant_id') || occupant.get('id');
					
				const badges = element.querySelector(".occupant-badges");				
				let padeEle = element.querySelector(".occupants-pade-chat");
				
				//console.debug("parseStanza - occupant element", badges, padeEle, occupant, ocId);

				const html = "<span data-room-nick='" + occupant.get('nick') + "' data-stream-key='" + ocId + "' class='badge badge-groupchat' title='" + __("Screen/Desktop Share") + "'>SS</span>";
				
				if (invite) 
				{
					if (padeEle) {
						padeEle.innerHTML = html;
					}
					else {
						padeEle = newElement('span', null, html, 'occupants-pade-chat');
						badges.appendChild(padeEle);
						
						padeEle.addEventListener('click', function(ev)	{
							ev.stopPropagation();
							
							const key = ev.target.getAttribute('data-stream-key');							
							const nick = ev.target.getAttribute('data-room-nick');								
							//console.debug("parseStanza stream click", key, nick);

							const modalModel = new converse.env.Model();
							modalModel.set({ key, nick});
							screencastDlg = _converse.api.modal.show('converse-pade-screencast-dialog', { model: modalModel });							

						}, false);				
					}
				}
				else
					
				if (retract) {
					if (padeEle) padeEle.innerHTML = "";					
				}
			}
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
}));
