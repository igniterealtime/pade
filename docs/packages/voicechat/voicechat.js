(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    let _converse, html, __, model, harker, connection, button, room, jitsiRoom, localTracks, remoteTracks = {}, voicechat_start, voicechat_stop, recognition, recognitionActive;

	converse.plugins.add("voicechat", {
		dependencies: [],

		initialize: function () {
            _converse = this._converse;
            html = converse.env.html;
            __ = _converse.__;

			_converse.api.settings.update({
				voicechat: {
					hosts: {
						domain: 'meet.jit.si',
						muc: 'conference.meet.jit.si'
					},					
					serviceUrl: 'wss://meet.jit.si/xmpp-websocket',
					prefix: 'voicechat-',					
					transcribe: true,
					transcribeLanguage: 'en-GB'
				}
			});

            voicechat_start  = __('Start Voice Chat');
            voicechat_stop  = __('Stop Voice Chat');			
			
			_converse.api.listen.on('parseMessage', async (stanza, attrs) => {
				return parseStanza(stanza, attrs);
			});	
			
			_converse.api.listen.on('parseMUCMessage', async (stanza, attrs) => {
				return parseStanza(stanza, attrs);
			});
			
			_converse.api.listen.on('message', (data) => {			
				if (!data.attrs.json) return;
				console.debug("voicechat", data.attrs.json);
			});
			
            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
                let color = "fill:var(--chat-toolbar-btn-color);";
                if (toolbar_el.model.get("type") === "chatroom") color = "fill:var(--muc-toolbar-btn-color);";

                buttons.push(html`
                    <button class="plugin-voicechat" title="${voicechat_start}" @click=${performAudio}/>
						<svg style="width:18px; height:18px; ${color}" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="headset" class="svg-inline--fa fa-headset fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M192 208c0-17.67-14.33-32-32-32h-16c-35.35 0-64 28.65-64 64v48c0 35.35 28.65 64 64 64h16c17.67 0 32-14.33 32-32V208zm176 144c35.35 0 64-28.65 64-64v-48c0-35.35-28.65-64-64-64h-16c-17.67 0-32 14.33-32 32v112c0 17.67 14.33 32 32 32h16zM256 0C113.18 0 4.58 118.83 0 256v16c0 8.84 7.16 16 16 16h16c8.84 0 16-7.16 16-16v-16c0-114.69 93.31-208 208-208s208 93.31 208 208h-.12c.08 2.43.12 165.72.12 165.72 0 23.35-18.93 42.28-42.28 42.28H320c0-26.51-21.49-48-48-48h-32c-26.51 0-48 21.49-48 48s21.49 48 48 48h181.72c49.86 0 90.28-40.42 90.28-90.28V256C507.42 118.83 398.82 0 256 0z"></path></svg>					
                    </button>
                `);

                return buttons;
            });			

            _converse.api.listen.on('chatRoomViewInitialized', function (view)
            {
                console.debug("chatRoomViewInitialized", view);
				stopVoiceChat();
			});
			
            _converse.api.listen.on('chatBoxViewInitialized', function (view)
            {
                console.debug("chatBoxViewInitialized", view);
				stopVoiceChat();
			});
			
            _converse.api.listen.on('chatBoxClosed', function (model)
            {
                console.debug("chatBoxClosed", model);
				stopVoiceChat();
            });			
			
			console.log("voicechat plugin is ready");
		} // 
	});
	
	function performAudio(ev) {
        ev.stopPropagation();
        ev.preventDefault();

		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');	
		model = toolbar_el.model;
		const type = (model.get('type') == 'chatroom') ? 'groupchat' : 'chat';				
		const target = model.get('jid');				
		
		const myself = converse.env.Strophe.getNodeFromJid(_converse.connection.jid);
		const yourself = converse.env.Strophe.getNodeFromJid(target);								
		room = _converse.api.settings.get('voicechat').prefix + ((model.get('type') == 'chatroom') ? yourself : (myself < target ? myself + yourself : yourself + myself));
		button = toolbar_el.querySelector('.plugin-voicechat');

		console.debug("voicechat is clicked", model, room, button);

		if (button.classList.contains('blink_me')) {
			stopVoiceChat(model);						
		} else {
			startVoiceChat();						
		}				
	}
			
	function sendVoiceChatState(state) {
		const type = (model.get('type') == 'chatroom') ? 'groupchat' : 'chat';
		const target = model.get('jid');
		const nick = model.get('nick');
		const nickname = model.get('nickname');
		const url = _converse.api.settings.get('voicechat').serviceUrl;
		const json = {url, room, state, type, nickname, nick};
		console.debug("sendVoiceChatState", json);
		
		_converse.api.send($msg({to: target, from: _converse.connection.jid, type}).c("json", {'xmlns': 'urn:xmpp:json:0'}).t(JSON.stringify(json)));						
	}

	function stopVoiceChat() {	
		if (localTracks){
			for (let i = 0; i < localTracks.length; i++) {
				try {				
					localTracks[i].dispose();
				} catch (e) {};
			}
			localTracks = null;
		}
		
		if (jitsiRoom) {
			jitsiRoom.leave();
			jitsiRoom = null;
		}
		
		if (connection) {
			connection.disconnect();
		}
		let voiceChatAudio = document.getElementById('voicechat-audio');
		if (voiceChatAudio) voiceChatAudio.innerHTML = "";	
		
		if (button) {
			button.classList.remove('blink_me');
			button.title = voicechat_start;					
		}
		
		if (recognitionActive && recognition)
		{
			recognition.stop();
			recognitionActive = false;
		}
		
		if (harker) {
			harker.stop();
		}
	}
	
	function startVoiceChat() {	
		console.debug("startVoiceChat", room);
		
		if (!localTracks) {		
			JitsiMeetJS.init({disableAudioLevels: true});
			
			JitsiMeetJS.createLocalTracks({ devices: [ 'audio'] }).then(onLocalTracks).catch(error => {
				console.error("startVoiceChat", error);
			});			
		} else {
			goConnect();
		}	
	}
	
	function goConnect() {
		const options = _converse.api.settings.get('voicechat');			
		console.debug("goConnect", room, localTracks, options);		
		connection = new JitsiMeetJS.JitsiConnection(null, null, options);
		connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,  onConnectionSuccess);
		connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED,       onConnectionFailed);
		connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, onConnectionDisconnected);

		JitsiMeetJS.mediaDevices.addEventListener(JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED, onDeviceListChanged);
		connection.connect();			
	}
	
	function getLocalStream() {
		return document.getElementById('localAudio0')?.srcObject;	
	}	
	
	function onLocalTracks(tracks) {
		localTracks = tracks;		
		console.debug("onLocalTracks", room, localTracks);
		
		let voiceChatAudio = document.getElementById('voicechat-audio');
		if (!voiceChatAudio) voiceChatAudio = newElement('div', 'voicechat-audio');
		
		for (let i = 0; i < localTracks.length; i++) 
		{
			if (localTracks[i].getType() === 'audio') {			
				localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,	audioLevel => console.debug(`Audio Level local: ${audioLevel}`));
				localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => console.debug('local track muted'));
				localTracks[i].addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,() => console.debug('local track stoped'));
				localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => {console.debug(`local track audio output device was changed to ${deviceId}`)	});

				const localAudio = newElement('span', `local-audio-${i}`, `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
				voiceChatAudio.append(localAudio);
				localTracks[i].attach($(`#localAudio${i}`)[0]);				
			}
			
			if (i == 0) {

				if (_converse.api.settings.get('voicechat').transcribe) {
					setupSpeechRecognition();
				}					

				harker = hark(localTracks[i].stream, {interval: 100, history: 4 });

				harker.on('speaking', () => {
					
					if (_converse.api.settings.get('voicechat').transcribe && model) {					
						model.setChatState(_converse.COMPOSING);						
					} else {
						sendVoiceChatState('voice');						
					}
				});

				harker.on('stopped_speaking', () =>  {
					
					if (_converse.api.settings.get('voicechat').transcribe && model) {						
						model.setChatState(_converse.PAUSED);							
					} else {
						sendVoiceChatState('mute');						
					}
				});						
			}
		}
		
		goConnect();		
	}

	function onRemoteTrack(track) {
		if (track.isLocal() || track.getType() === 'video') {
			return;
		}
		let voiceChatAudio = document.getElementById('voicechat-audio');		
		const participant = track.getParticipantId();

		if (!remoteTracks[participant]) {
			remoteTracks[participant] = [];
		}
		const idx = remoteTracks[participant].push(track);
		console.debug("onRemoteTrack", room, remoteTracks);
		
		track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,	audioLevel => console.debug(`Audio Level remote: ${audioLevel}`));
		track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,	() => console.debug('remote track muted'));
		track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.debug('remote track stoped'));
		track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,	deviceId =>	console.debug(`remote track audio output device was changed to ${deviceId}`));

		const id = participant + track.getType() + idx;
		const localAudio = newElement('span', `remote-audio-${participant}-${idx}`, `<audio autoplay='1' id='${participant}audio${idx}' />`);
		voiceChatAudio.append(localAudio);		
		track.attach($(`#${id}`)[0]);		
	}
	
	function onDeviceListChanged(devices) {
		console.info('onDeviceListChanged', devices);
	}
	
	function onConnectionSuccess() {
		console.debug("onConnectionSuccess", room);		
		
		jitsiRoom = connection.initJitsiConference(room, {});	
		jitsiRoom.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
		jitsiRoom.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {console.debug(`track removed!!!${track}`)	});
		jitsiRoom.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
		jitsiRoom.on(JitsiMeetJS.events.conference.USER_JOINED, id => {console.debug('user join'); remoteTracks[id] = []	});
		jitsiRoom.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
		jitsiRoom.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {console.debug(`${track.getType()} - ${track.isMuted()}`)	});
		jitsiRoom.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, (userID, displayName) => console.debug(`${userID} - ${displayName}`));
		jitsiRoom.on(JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED, (userID, audioLevel) => console.debug(`${userID} - ${audioLevel}`));
		jitsiRoom.on(JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED, () => console.debug(`${jitsiRoom.getPhoneNumber()} - ${jitsiRoom.getPhonePin()}`));
		
		jitsiRoom.join();
	}

	function onConnectionFailed() {
		console.error('onConnectionFailed');
	}

	function onConnectionDisconnected() {
		console.debug('onConnectionDisconnected!');
		connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,  onConnectionSuccess);
		connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED,       onConnectionFailed);
		connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, onConnectionDisconnected);
	}

	function onConferenceJoined() {
		console.debug('onConferenceJoined!', jitsiRoom, localTracks);
		
		for (let i = 0; i < localTracks.length; i++) {
			jitsiRoom.addTrack(localTracks[i]);
		}
		
		if (button) {
			button.classList.add('blink_me');	
			button.title = voicechat_stop;		
		}					
	}

	function onUserLeft(id) {
		console.debug('onUserLeft', id);
		
		if (!remoteTracks[id]) {
			return;
		}
		const tracks = remoteTracks[id];

		for (let i = 0; i < tracks.length; i++) {
			tracks[i].detach($(`#${id}${tracks[i].getType()}`));
		}
	}

	function newElement(el, id, html, className) {
		const ele = document.createElement(el);
		if (id) ele.id = id;
		if (html) ele.innerHTML = html;
		if (className) ele.classList.add(className);
		document.body.appendChild(ele);
		return ele;
	}
	
	async function parseStanza(stanza, attrs) {
		const json = stanza.querySelector('json');

		if (json) {
			attrs.json = JSON.parse(json.innerHTML);		
			console.debug("parseStanza", attrs);
			const nick = attrs.json.nick || attrs.json.nickname;
			model.updateNotifications([nick], attrs.json.state);
		}
		return attrs;
	}
	
    function setupSpeechRecognition() {
        console.debug("setupSpeechRecognition");

        recognition = new webkitSpeechRecognition();
        recognition.lang = _converse.api.settings.get('voicechat').transcribeLanguage;
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = function(event)
        {
            console.debug("Speech recog event", event)

            if (event.results[event.resultIndex].isFinal==true)
            {
                const transcript = event.results[event.resultIndex][0].transcript;
                console.debug("Speech recog transcript", transcript);
                if (model) model.sendMessage({'body': transcript});		
				if (model) model.setChatState(_converse.ACTIVE);					
			}
        }

        recognition.onspeechend  = function(event)
        {
            console.debug("Speech recog onspeechend", event);		
        }

        recognition.onstart = function(event)
        {
            console.debug("Speech to text started", event);
            recognitionActive = true;			
        }

        recognition.onend = function(event)
        {
            console.debug("Speech to text ended", event);

            if (recognitionActive)
            {
                console.debug("Speech to text restarted");
                setTimeout(function() {recognition.start()}, 1000);
            }
        }

        recognition.onerror = function(event)
        {
            console.debug("Speech to text error", event);
        }

        recognition.start();		
    }	
	
}));
