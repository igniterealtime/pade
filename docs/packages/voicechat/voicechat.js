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
						domain: 'localhost',
						muc: 'conference.localhost'
					},					
					serviceUrl: 'ws://localhost:7070/ws/',
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
				console.log("voicechat", data.attrs.json);
			});
			
            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
                let color = "fill:var(--chat-toolbar-btn-color);";
                if (toolbar_el.model.get("type") === "chatroom") color = "fill:var(--muc-toolbar-btn-color);";

                buttons.push(html`
                    <button class="plugin-voicechat" title="${voicechat_start}" @click=${performAudio}/>
						<svg style="width:18px; height:18px; ${color}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g><path d="M 14,25.808L 14,30 L 11,30 C 10.448,30, 10,30.448, 10,31C 10,31.552, 10.448,32, 11,32l 4.98,0 L 16.020,32 l 4.98,0 c 0.552,0, 1-0.448, 1-1c0-0.552-0.448-1-1-1L 18,30 l0-4.204 c 4.166-0.822, 8-4.194, 8-9.796L 26,13 C 26,12.448, 25.552,12, 25,12 S 24,12.448, 24,13L 24,16 c0,5.252-4.026,8-8,8c-3.854,0-8-2.504-8-8L 8,13 C 8,12.448, 7.552,12, 7,12S 6,12.448, 6,13L 6,16 C 6,21.68, 9.766,25.012, 14,25.808zM 16,22c 3.308,0, 6-2.692, 6-6L 22,6 c0-3.308-2.692-6-6-6C 12.692,0, 10,2.692, 10,6l0,10 C 10,19.308, 12.692,22, 16,22z M 12,6 c0-2.21, 1.79-4, 4-4s 4,1.79, 4,4l0,10 c0,2.21-1.79,4-4,4S 12,18.21, 12,16L 12,6 z"></path></g></svg>					
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
		const view = _converse.chatboxviews.get(toolbar_el.model.get('jid'));		
		model = view.model;
		const type = (model.get('type') == 'chatroom') ? 'groupchat' : 'chat';				
		const target = model.get('jid');				
		
		const myself = converse.env.Strophe.getNodeFromJid(_converse.connection.jid);
		const yourself = converse.env.Strophe.getNodeFromJid(target);								
		room = (model.get('type') == 'chatroom') ? myself : (myself < target ? myself + yourself : yourself + myself);
		button = toolbar_el.querySelector('.plugin-voicechat');

		console.log("voicechat is clicked", room, button);

		if (button.classList.contains('blink_me')) {
			stopVoiceChat(model);						
		} else {
			startVoiceChat();						
		}				
	}
			
	function sendVoiceChatState(state) {
		const type = (model.get('type') == 'chatroom') ? 'groupchat' : 'chat';
		const target = model.get('jid');
		const url = _converse.api.settings.get('voicechat').serviceUrl;
		const json = {url, room, state};
		console.log("sendVoiceChatState", json);
		
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
			sendVoiceChatState('stopVoiceChat');			
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
		console.log("startVoiceChat", room);
		
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
		console.log("goConnect", room, localTracks, options);		
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
		console.log("onLocalTracks", room, localTracks);
		
		let voiceChatAudio = document.getElementById('voicechat-audio');
		if (!voiceChatAudio) voiceChatAudio = newElement('div', 'voicechat-audio');
		
		for (let i = 0; i < localTracks.length; i++) 
		{
			if (localTracks[i].getType() === 'audio') {			
				localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,	audioLevel => console.log(`Audio Level local: ${audioLevel}`));
				localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => console.log('local track muted'));
				localTracks[i].addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,() => console.log('local track stoped'));
				localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => {console.log(`local track audio output device was changed to ${deviceId}`)	});

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
					sendVoiceChatState('startSpeaking');
					if (model) model.setChatState(_converse.COMPOSING);						
				});

				harker.on('stopped_speaking', () =>  {
					sendVoiceChatState('stopSpeaking');
					if (model) model.setChatState(_converse.PAUSED);							
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
		console.log("onRemoteTrack", room, remoteTracks);
		
		track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,	audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
		track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,	() => console.log('remote track muted'));
		track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.log('remote track stoped'));
		track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,	deviceId =>	console.log(`remote track audio output device was changed to ${deviceId}`));

		const id = participant + track.getType() + idx;
		const localAudio = newElement('span', `remote-audio-${participant}-${idx}`, `<audio autoplay='1' id='${participant}audio${idx}' />`);
		voiceChatAudio.append(localAudio);		
		track.attach($(`#${id}`)[0]);		
	}
	
	function onDeviceListChanged(devices) {
		console.info('onDeviceListChanged', devices);
	}
	
	function onConnectionSuccess() {
		console.log("onConnectionSuccess", room);		
		
		jitsiRoom = connection.initJitsiConference(room, {});	
		jitsiRoom.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
		jitsiRoom.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {console.log(`track removed!!!${track}`)	});
		jitsiRoom.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
		jitsiRoom.on(JitsiMeetJS.events.conference.USER_JOINED, id => {console.log('user join'); remoteTracks[id] = []	});
		jitsiRoom.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
		jitsiRoom.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {console.log(`${track.getType()} - ${track.isMuted()}`)	});
		jitsiRoom.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, (userID, displayName) => console.log(`${userID} - ${displayName}`));
		jitsiRoom.on(JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED, (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
		jitsiRoom.on(JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED, () => console.log(`${jitsiRoom.getPhoneNumber()} - ${jitsiRoom.getPhonePin()}`));
		
		jitsiRoom.join();
	}

	function onConnectionFailed() {
		console.error('onConnectionFailed');
	}

	function onConnectionDisconnected() {
		console.log('onConnectionDisconnected!');
		connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,  onConnectionSuccess);
		connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED,       onConnectionFailed);
		connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, onConnectionDisconnected);
	}

	function onConferenceJoined() {
		console.log('onConferenceJoined!', jitsiRoom, localTracks);
		
		for (let i = 0; i < localTracks.length; i++) {
			jitsiRoom.addTrack(localTracks[i]);
		}
		
		if (button) {
			button.classList.add('blink_me');	
			sendVoiceChatState('startVoiceChat');			
		}					
	}

	function onUserLeft(id) {
		console.log('onUserLeft', id);
		
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
			console.log("parseStanza", stanza, attrs);		
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
