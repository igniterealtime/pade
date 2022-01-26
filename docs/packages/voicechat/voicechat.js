(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    let _converse, html, __, model, harker, connection, button, room, jitsiRoom, localTracks, remoteTracks = {}, recognition, recognitionActive;

	converse.plugins.add("voicechat", {
		dependencies: [],

		initialize: function () {
            _converse = this._converse;
            html = converse.env.html;
            __ = _converse.__;

			_converse.api.settings.update({
				voicechat: {
					hosts: {
						domain: 'beta.meet.jit.si',
						muc: 'conference.beta.meet.jit.si'
					},					
					serviceUrl: 'https://beta.meet.jit.si/http-bind',
					prefix: 'VC',					
					transcribe: false,
					transcribeLanguage: 'en-GB',
					start:  __('Start Voice Chat'),
					stop: __('Stop Voice Chat'),
					started: __('has started speaking'),
					stopped: __('has stopped speaking')					
				}
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
                    <button class="plugin-voicechat" title="${_converse.api.settings.get('voicechat').start}" @click=${performAudio}/>
						<svg style="width:18px; height:18px; ${color}" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="volume-up" class="svg-inline--fa fa-volume-up fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M215.03 71.05L126.06 160H24c-13.26 0-24 10.74-24 24v144c0 13.25 10.74 24 24 24h102.06l88.97 88.95c15.03 15.03 40.97 4.47 40.97-16.97V88.02c0-21.46-25.96-31.98-40.97-16.97zm233.32-51.08c-11.17-7.33-26.18-4.24-33.51 6.95-7.34 11.17-4.22 26.18 6.95 33.51 66.27 43.49 105.82 116.6 105.82 195.58 0 78.98-39.55 152.09-105.82 195.58-11.17 7.32-14.29 22.34-6.95 33.5 7.04 10.71 21.93 14.56 33.51 6.95C528.27 439.58 576 351.33 576 256S528.27 72.43 448.35 19.97zM480 256c0-63.53-32.06-121.94-85.77-156.24-11.19-7.14-26.03-3.82-33.12 7.46s-3.78 26.21 7.41 33.36C408.27 165.97 432 209.11 432 256s-23.73 90.03-63.48 115.42c-11.19 7.14-14.5 22.07-7.41 33.36 6.51 10.36 21.12 15.14 33.12 7.46C447.94 377.94 480 319.54 480 256zm-141.77-76.87c-11.58-6.33-26.19-2.16-32.61 9.45-6.39 11.61-2.16 26.2 9.45 32.61C327.98 228.28 336 241.63 336 256c0 14.38-8.02 27.72-20.92 34.81-11.61 6.41-15.84 21-9.45 32.61 6.43 11.66 21.05 15.8 32.61 9.45 28.23-15.55 45.77-45 45.77-76.88s-17.54-61.32-45.78-76.86z"></path></svg>					
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
		}
	});

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
	
	function performAudio(ev) {
        ev.stopPropagation();
        ev.preventDefault();

		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');	
		model = toolbar_el.model;
		const type = (model.get('type') == 'chatroom') ? 'groupchat' : 'chat';				
		const target = model.get('jid');
		const myself = Strophe.getBareJidFromJid(_converse.connection.jid);
										
		room = _converse.api.settings.get('voicechat').prefix.toLocaleLowerCase() + cyrb53((model.get('type') == 'chatroom') ? target : (myself < target ? myself + target : target + myself));
		button = toolbar_el.querySelector('.plugin-voicechat');

		console.debug("voicechat is clicked", model, room, button);

		if (button.classList.contains('blink_me')) {
			stopVoiceChat(model);						
		} else {
			startVoiceChat();						
		}				
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
		
		if (button && button.classList.contains('blink_me')) {
			button.classList.remove('blink_me');
			button.title = _converse.api.settings.get('voicechat').start;
			model.sendMessage({body: '/me ' + _converse.api.settings.get('voicechat').stopped});			
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
					}
				});

				harker.on('stopped_speaking', () =>  {
					
					if (_converse.api.settings.get('voicechat').transcribe && model) {						
						model.setChatState(_converse.PAUSED);												
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
			button.title = _converse.api.settings.get('voicechat').stop;
			model.sendMessage({body: '/me ' + _converse.api.settings.get('voicechat').started});			
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
