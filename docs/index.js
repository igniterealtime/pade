let Strophe, $iq, $msg, $pres, $build, b64_sha1, dayjs, _converse, html, _, __, Model, BootstrapModal;
const nickColors = {}, pade = {webAppsWindow: {}};

window.addEventListener('focus', function(evt) {
	if (chrome.action) {	
		chrome.action.setBadgeBackgroundColor({ color: '#0000e1' });
		chrome.action.setBadgeText({ text: "" });
	}
});
							
window.addEventListener("load", function() {
	setupChromeHandlers()
	startConverse();
});

window.addEventListener("unload", function() {
    var webApps = Object.getOwnPropertyNames(pade.webAppsWindow);

    for (var i=0; i<webApps.length; i++)
    {
        if (pade.webAppsWindow[webApps[i]])
        {
            console.log("pade unloading web app " + webApps[i]);
            closeWebAppsWindow(webApps[i]);
        }
    }
});

// -------------------------------------------------------
//
//  Setup
//
// -------------------------------------------------------	

function setupChromeHandlers() {

	if (chrome.windows && chrome.contextMenus && chrome.runtime) 
	{
		chrome.windows.onCreated.addListener(function(window)
		{
			console.debug("opening window ", window);
		});

		chrome.windows.onRemoved.addListener(function(win)
		{
			console.debug("closing window ", win);
			
			var webApps = Object.getOwnPropertyNames(pade.webAppsWindow);

			for (var i=0; i<webApps.length; i++)
			{
				if (pade.webAppsWindow[webApps[i]] && win == pade.webAppsWindow[webApps[i]].id)
				{
					delete pade.webAppsWindow[webApps[i]];
				}
			}
		});

		chrome.contextMenus.onClicked.addListener((info, win) => {
			console.debug("contextMenus", info, win);		
		});

		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			console.debug("onMessage", request, sender, sendResponse);

		});	
	}		
}

function startConverse() {
	const domain = getSetting("domain", location.hostname);
	const server = getSetting("server", location.host);
	const anonUser = getSetting("useAnonymous", false);
	
	const username = getSetting("username");
	const password = getSetting("password");
	
	if (!username || !password || username == "" || password == "") {
		location.href = "./options/index.html";
	}
	
    const displayname = getSetting("displayname", username);
    const whitelistedPlugins = ["paderoot", "toolbar-utilities", "stickers", "jitsimeet", "vmsg", "screencast", "search", "directory", "muc-directory", "diagrams", "location"];	
 
	converse.plugins.add("paderoot", {
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

			if (chrome.i18n) {
				document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Converse | " + chrome.runtime.getManifest().version;
			}

            _converse.api.listen.on('afterMessageBodyTransformed', function(text) {				

            });
			
			_converse.api.listen.on('parseMessage', async (stanza, attrs) => {
				return parseStanza(stanza, attrs);
			});	
			
			_converse.api.listen.on('parseMUCMessage', async (stanza, attrs) => {
				return parseStanza(stanza, attrs);
			});	

			_converse.api.waitUntil('chatBoxesFetched').then(() => {
				
			}).catch(function (err) {
				console.error('waiting for chatBoxesFetched error', err);
			});				
				
			_converse.api.waitUntil('VCardsInitialized').then(() => {
				const vcards = _converse.vcards.models;							
				for (let i=0; i < vcards.length; i++) setAvatar(vcards[i]);					
				
			}).catch(function (err) {
				console.error('waiting for VCardsInitialized error', err);
			});		
			
			_converse.api.waitUntil('controlBoxInitialized').then(() => {

				_converse.api.waitUntil('bookmarksInitialized').then(() => {
					setupMUCAvatars();
					addControlFeatures();					

				}).catch(function (err) {
					console.error('waiting for controlBoxInitialized error', err);
				});			

			}).catch(function (err) {
				console.error('waiting for controlBoxInitialized error', err);
			});		

			_converse.api.listen.on('connected', function() {
				if (getSetting("converseTimeAgo", false)) setupTimer();
				addSelfBot();			
			});

			_converse.api.listen.on('rosterContactInitialized', function(contact) {
				setAvatar(contact);
			});	
			
			_converse.api.listen.on('getMessageActionButtons', (el, buttons) => {
		       buttons.push({'i18n_text': __('Reply'),   'handler': ev => handleReplyAction(el.model),                    'button_class': 'chat-msg__action-reply',       'icon_class': 'fas fa-arrow-left',  'name': 'pade-reply'});			   
		       buttons.push({'i18n_text': __('Like'),    'handler': ev => handleReactionAction(el.model, ':thumbsup:'),   'button_class': 'chat-msg__action-thumbsup',    'icon_class': 'fa fa-check',   'name': 'pade-thumbsup'});	
		       buttons.push({'i18n_text': __('Dislike'), 'handler': ev => handleReactionAction(el.model, ':thumbsdown:'), 'button_class': 'chat-msg__action-thumbsdownp', 'icon_class': 'fa fa-times', 'name': 'pade-thumbsdown'});			   
		       return buttons;
			});	


			_converse.api.listen.on('message', (data) => {
				let count = 0;
				if (!data.attrs.message) return;
				
				_converse.chatboxes.each((chat_box) =>
				{
					if (chat_box.get("type") == "chatbox")
					{
						count = count + chat_box.get("num_unread");
					}
					else

					if (chat_box.get("type") == "chatroom")
					{
						count = count + chat_box.get("num_unread_general");
					}
				});
				
				//console.debug("message", data.attrs.message, count);				
				
				if (count > 0)
				{
					if (chrome.action) {
						chrome.action.setBadgeBackgroundColor({ color: '#0000e1' });
						chrome.action.setBadgeText({ text: count.toString() });
					}

					if (chrome.windows) {					
						chrome.windows.getCurrent({populate: false, windowTypes: ["normal"]}, (win) =>
						{
							chrome.windows.update(win.id, {drawAttention: true});
						});	
					}						
				}
			});				
		},

		overrides: {		
			RosterFilterView: {

			  shouldBeVisible() {
				return _converse.roster && getSetting("converseRosterFilter") && (_converse.roster.length >= 5 || this.isActive());
			  }
			}			  
		},
	});	
			
	const config = {
		allow_logout: false,
		show_client_info: false,
		allow_adhoc_commands: false,
        auto_login: username || anonUser,		
        password: anonUser ? undefined : password,	
        fullname: displayname,	
        nickname: displayname,		
        jid : anonUser ? domain : (username ? username + "@" + domain : undefined),		
		authentication: 'login',
        theme: 'concord',		
        default_domain: domain,		
		locked_domain: domain,
		domain_placeholder: domain,
		notification_icon: "./dist/images/logo/conversejs-filled.svg",
		allow_registration: false,
		sounds_path: "./dist/sounds/",
		loglevel: "info",
		view_mode: "fullscreen",
		assets_path: "./dist/",
		i18n: "en",		
		auto_away: 300,
		auto_reconnect: true,
		discover_connection_methods: false,		
		bosh_service_url: location.protocol + '//' + server + '/http-bind/',
		websocket_url: getSetting("useWebsocket", false) ? (location.protocol == "http:" ? "ws:" : "wss:") + '//' + server + '/ws/' : undefined,
		message_archiving: 'always',
		render_media: true,
        roster_groups: getSetting("rosterGroups", false),	
        muc_fetch_members: getSetting("fetchMembersList", false),		
        whitelisted_plugins: whitelistedPlugins		
	}		
	console.debug("startConverse", config);
	converse.initialize(config);

}

function setupTimer() {	
	//console.debug("setupTimer render");
	setupTimeAgo();
	addControlFeatures();
	setupMUCAvatars();	
	renderReactions();
	setTimeout(setupTimer, 10000);	
}

function setupTimeAgo() {
	//console.debug("timeago render");
	timeago.cancel();
	const locale = navigator.language.replace('-', '_');
	
	const elements = document.querySelectorAll('.chat-msg__time');
	
	for (let i=0; i < elements.length; i++)
	{
		if (!elements[i].querySelector('.chat-msg__time_span')) {
			const timestamp = elements[i].getAttribute('timestamp');	
			const pretty_time = elements[i].innerHTML;				
			const timeAgo = timeago.format(new Date(pretty_time));
			elements[i].innerHTML = '<span class="chat-msg__time_span" title="' + pretty_time + '" datetime="' + timestamp + '">' + timeAgo + '</span>';
		}
	}
	
	timeago.render(document.querySelectorAll('.chat-msg__time_span'), locale);
}

function renderReactions() {
	const models = _converse.chatboxes.models;	
	//console.debug("rections render", models);
	const msgReactions = new Map();

	for (model of models)
	{
		if (model.messages) 
		{
			for (message of model.messages.models)
			{
				const reactionId = message.get('reaction_id');	
				const reactionEmoji = message.get('reaction_emoji');
				
				if (reactionId) 
				{
					//console.debug("renderReactions", model.get('id'), reactionId, reactionEmoji);
					
					if (!msgReactions.has(reactionId)) {
						msgReactions.set(reactionId, {emojis: new Map(), reactionId});
					}
					
					const emojis = msgReactions.get(reactionId).emojis;
					
					if (!emojis.has(reactionEmoji)) {
						emojis.set(reactionEmoji, {count: 0, code: converse.env.utils.shortnamesToEmojis(reactionEmoji)});
					}					
					
					emojis.get(reactionEmoji).count++;						
				}
			}
		}
	}

	for (const reaction of msgReactions.values()) {
		//console.debug("rections item", reaction);		
		const el = document.querySelector('[data-msgid="' + reaction.reactionId + '"]');	
		
		if (el) {			
			let reactionDiv = el.querySelector('.pade-reaction');
			
			if (!reactionDiv) {
				const msgText = el.querySelector('.chat-msg__text');
				reactionDiv = newElement('div', null, null, 'pade-reaction');	
				msgText.insertAdjacentElement('afterEnd', reactionDiv);
			}			
				
			let div = "";
			
			for (const emoji of reaction.emojis.values()) {	
				//console.debug("rections emoji", emoji);	
				div = div + '<span class="chat-msg__reaction">' + emoji.code + '&nbsp' + emoji.count + '</span>';
			}
			
			reactionDiv.innerHTML = div;	
		}
	}
}

function setupMUCAvatars() {
	const elements = document.querySelectorAll('.available-chatroom');	
	//console.debug("setupMUCAvatars", elements);	
		
	for (let i=0; i < elements.length; i++)
	{
		if (!elements[i].querySelector('.pade-avatar')) {		
			const jid = elements[i].getAttribute('data-room-jid');
			//console.debug("setupMUCAvatars", jid);		
			
			if (jid) {
				const img = createAvatar(jid);
				const avatar = newElement('span', null, '<img style="border-radius: 100%; margin-right: 10px;" src="' + img + '" class="avatar avatar" width="30" height="30" />', 'pade-avatar');
				elements[i].prepend(avatar);
			}
		}			
	}			
}

function addControlFeatures() {
	const section = document.body.querySelector('.controlbox-section.profile.d-flex');
	if (!section) return;

	//console.debug("addControlFeatures", section);

	if (!section.querySelector('.pade-meet-now')) {	
		const ofmeetButton = newElement('a', null, '<a class="controlbox-heading__btn open-ofmeet fas fa-video align-self-center" title="Meet Now!!"></a>', 'pade-meet-now');
		section.appendChild(ofmeetButton);

		ofmeetButton.addEventListener('click', function(evt)
		{
			evt.stopPropagation();
			openVideoWindow("", "normal");

		}, false);
	}

	if (!section.querySelector('.pade-settings')) {
		const prefButton = newElement('a', null, '<a class="controlbox-heading__btn show-preferences fas fa-cog align-self-center" title="Preferences/Settings"></a>', 'pade-settings');
		section.appendChild(prefButton);

		prefButton.addEventListener('click', function(evt)
		{
			evt.stopPropagation();
			location.href = chrome.runtime.getURL("options/index.html");
		}, false);
	}
}

function addSelfBot() {
	// add self for testing
	setTimeout(function() {
		openChat(Strophe.getBareJidFromJid(_converse.connection.jid), getSetting("displayname"), ["Bots"], true)
	});	
}

// -------------------------------------------------------
//
//  Utility Functions
//
// -------------------------------------------------------	

function parseStanza(stanza, attrs) {
    const reactions = stanza.querySelector('reactions');

    if (reactions) {
		attrs.reaction_id = reactions.getAttribute('id');
		attrs.reaction_emoji = reactions.querySelector('reaction').innerHTML;		
		console.log("parseStanza", stanza, attrs);		
    }
	return attrs;
}

function handleReplyAction(model) {
	console.debug('handleReplyAction', model)
	
	let selectedText = window.getSelection().toString();
	const prefix = model.get('nick') || model.get('nickname');
	
	if (!selectedText || selectedText == '') selectedText = model.get('message');
	replyChat(prefix + ' : ' + selectedText);
}

function handleReactionAction(model, emoji) {
	console.debug('handleReactionAction', model, emoji);	
	const msgId = model.get('msgid');
	const type = model.get("type");	
	
	let target = model.get('jid');
	if (type == "groupchat") target = model.get('from_muc');
	
	let message = window.getSelection().toString();	
	
	if (!message || message == '') {
		message = model.get('message');	
		const pos = message.indexOf('\n');
		if (pos > -1) message = message.substring(0, pos);
	}
	
	if (msgId) {
		if (type == "chat") {
			model.save('reaction_id', msgId);
			model.save('reaction_emoji', emoji);
		}
		const nick = model.get('nickname') || model.get('nick') || Strophe.getNodeFromJid(model.get('from'));
		const originId = uuidv4();
		const body = ">" + nick + " : " + message + '\n' + emoji;
		_converse.api.send($msg({to: target, from: _converse.connection.jid, type}).c('body').t(body).up().c("reactions", {'xmlns': 'urn:xmpp:reactions:0', 'id': msgId}).c('reaction').t(emoji).up().up().c('origin-id', {'xmlns': 'urn:xmpp:sid:0', 'id': originId}));				
	}
}

function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

function getSelectedChatBox() {
	var models = _converse.chatboxes.models;
	var view = null;

	console.debug("getSelectedChatBox", models);

	for (var i=0; i<models.length; i++)
	{
		if ((models[i].get('type') === "chatroom" || models[i].get('type') === "chatbox") && !models[i].get('hidden'))
		{
			view = _converse.chatboxviews.views[models[i].id];
			break;
		}
	}
	return view;
}

function replyChat(text) {
	var box = getSelectedChatBox();

	console.debug("replyChat", text, box);

	if (box)
	{
		var textArea = box.querySelector('.chat-textarea');
		if (textArea) textArea.value = ">" + text + "\n";
	}
}
	
function setAvatar(contact) {
				
	if (_converse.DEFAULT_IMAGE == contact.get('image') && contact.get('jid')) {
		let label = contact.get('jid');
		
		if (contact.get('fullname')) {
			label = contact.get('fullname');
		}
		else
			
		if (contact.get('nickname')) {
			label = contact.get('nickname');
		}
		else {
			const pos = contact.get('jid').indexOf("/");
											
			if (pos > -1) {
				label = contact.get('jid').substring(pos + 1);
			}
		}
		
		const dataUri = createAvatar(label);
		const avatar = dataUri.split(";base64,");

		contact.set("image", avatar[1]);
		contact.set("image_type", "image/png");
	}		
}

function getSetting(name, defaultValue) {
    const localStorage = window.localStorage
    let value = defaultValue;
    //console.debug("getSetting", name, defaultValue, localStorage["store.settings." + name]);
	
    if (localStorage["store.settings." + name])
    {
        try {
            value = JSON.parse(localStorage["store.settings." + name]);
            if (name == "password") value = getPassword(value, localStorage);
        } catch (e) {
            console.error(e);
        }
    }

    return value;
}

function setSetting(name, value) {
    //console.debug("setSetting", name, value);
    window.localStorage["store.settings." + name] = JSON.stringify(value);
}

function setDefaultSetting(name, defaultValue) {
    //console.debug("setDefaultSetting", name, defaultValue, window.localStorage["store.settings." + name]);

    if (branding && branding[name] != undefined)
    {
        window.localStorage["store.settings." + name] = JSON.stringify(branding[name].value);
    }
    else

    if (!window.localStorage["store.settings." + name] && window.localStorage["store.settings." + name] != false)
    {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }
}

function getPassword(password, localStorage) {
    if (!password || password == "") return null;
    if (password.startsWith("token-")) return atob(password.substring(6));

    localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(password));
    return password;
}

function newElement(el, id, html, className) {
	const ele = document.createElement(el);
	if (id) ele.id = id;
	if (html) ele.innerHTML = html;
	if (className) ele.classList.add(className);
	document.body.appendChild(ele);
	return ele;
}

function openChat(from, name, groups, closed) {
	if (_converse && _converse.roster)
	{
		if (!groups) groups = [];

		if (!name)
		{
			name = from.split("@")[0];
			if (name && name.indexOf("sms-") == 0) name = name.substring(4);
		}

		var contact = _converse.roster.findWhere({'jid': from});

		if (!contact)
		{
		  _converse.roster.create({
			'nickname': name,
			'groups': groups,
			'jid': from,
			'subscription': 'both'
		  }, {
			sort: false
		  });
		}

		if (!closed) _converse.api.chats.open(from);

		if (_converse.connection.injectMessage)
		{
			_converse.connection.injectMessage('<presence to="' + _converse.connection.jid + '" from="' + from + '"/>');
		}
	}
}

function getRandomColor(nickname) {
	if (nickColors[nickname])
	{
		return nickColors[nickname];
	}
	else {
		var letters = '0123456789ABCDEF';
		var color = '#';

		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		nickColors[nickname] = color;
		return color;
	}
}

function createAvatar(nickname, width, height, font) {
	if (_converse.vcards)
	{
		let vcard = _converse.vcards.findWhere({'jid': nickname});
		if (!vcard) vcard = _converse.vcards.findWhere({'nickname': nickname});

		if (vcard && vcard.get('image') && _converse.DEFAULT_IMAGE != vcard.get('image')) return "data:" + vcard.get('image_type') + ";base64," + vcard.get('image');
	}

	if (!nickname) nickname = "Anonymous";
	nickname = nickname.toLowerCase();

	if (!width) width = 128;
	if (!height) height = 128;
	if (!font) font = "64px Arial";

	var canvas = document.createElement('canvas');
	canvas.style.display = 'none';
	canvas.width = width;
	canvas.height = height;
	document.body.appendChild(canvas);
	var context = canvas.getContext('2d');
	context.fillStyle = getRandomColor(nickname);
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.font = font;
	context.fillStyle = "#fff";
	context.textAlign = "center";		

	var first, last, pos = nickname.indexOf("@");
	if (pos > 0) nickname = nickname.substring(0, pos);

	// try to split nickname into words at different symbols with preference
	let words = nickname.split(/[, ]/); // "John W. Doe" -> "John "W." "Doe"  or  "Doe,John W." -> "Doe" "John" "W."
	if (words.length == 1) words = nickname.split("."); // "John.Doe" -> "John" "Doe"  or  "John.W.Doe" -> "John" "W" "Doe"
	if (words.length == 1) words = nickname.split("-"); // "John-Doe" -> "John" "Doe"  or  "John-W-Doe" -> "John" "W" "Doe"

	if (words && words[0] && words.first != '')
	{

		const firstInitial = words[0][0]; // first letter of first word
		var lastInitial = null; // first letter of last word, if any

		const lastWordIdx = words.length - 1; // index of last word
		if (lastWordIdx > 0 && words[lastWordIdx] && words[lastWordIdx] != '')
		{
			lastInitial = words[lastWordIdx][0]; // first letter of last word
		}

		// if nickname consist of more than one words, compose the initials as two letter
		var initials = firstInitial;
		if (lastInitial) {
			// if any comma is in the nickname, treat it to have the lastname in front, i.e. compose reversed
			initials = nickname.indexOf(",") == -1 ? firstInitial + lastInitial : lastInitial + firstInitial;
		}

		const metrics = context.measureText(initials.toUpperCase());
		context.fillText(initials.toUpperCase(), width / 2, (height - metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2 + metrics.actualBoundingBoxAscent);

		var data = canvas.toDataURL();
		document.body.removeChild(canvas);
	}

	return canvas.toDataURL();
}

function closeWebAppsWindow(window) {
	if (chrome.windows)
	{	
		if (pade.webAppsWindow[window] != null)
		{
			chrome.windows.remove(pade.webAppsWindow[window].id);
			delete pade.webAppsWindow[window];
		}
	}
}

function openWebAppsWindow(url, state, width, height) {
	if (chrome.windows)
	{
		if (!width) width = 1024;
		if (!height) height = 768;

		if (url.startsWith("_")) url = url.substring(1);
		var httpUrl = url.startsWith("http") ? url.trim() : ( url.startsWith("chrome-extension") ? url : "https://" + url.trim());
		var data = {url: httpUrl, type: "popup", focused: true};

		console.debug("openWebAppsWindow", data, state, width, height);

		if (state == "minimized" && getSetting("openWinMinimized", false))
		{
			delete data.focused;
			data.state = state;
		}

		if (pade.webAppsWindow[url] == null)
		{
			chrome.windows.create(data, function (win)
			{
				pade.webAppsWindow[url] = win;
				updateWindowCoordinates(url, pade.webAppsWindow[url].id, {width: width, height: height});
			});

		} else {
			chrome.windows.update(pade.webAppsWindow[url].id, {focused: true});
		}
	
	} else open(url, url)
}

function openVideoWindow(room, mode) {
    var url = getVideoWindowUrl(room, mode);
    openWebAppsWindow(url);
}

function getVideoWindowUrl(room, mode) {
    const url = getSetting("ofmeetUrl", "https://" + getSetting("server") + "/ofmeet/");
    let params = "#config.webinar=" + (mode != "attendee" ? "false" : "true");

    const minHDHeight = getSetting("minHDHeight");
    params = params + (minHDHeight ? "&config.minHDHeight=" + minHDHeight : "");

    const resolution = getSetting("resolution");
    params = params + (resolution ? "&config.resolution=" + resolution : "");

    const startBitrate = getSetting("startBitrate");
    params = params + (startBitrate ? "&config.startBitrate=" + resolution : "");

    const disableAudioLevels = getSetting("disableAudioLevels", null);
    params = params + (disableAudioLevels != null ? "&config.disableAudioLevels=" + disableAudioLevels : "");

    const enableLipSync = getSetting("enableLipSync", null);
    params = params + (enableLipSync != null ? "&config.enableLipSync=" + enableLipSync : "");

    const enableStereoAudio = getSetting("enableStereoAudio", null);
    params = params + (enableStereoAudio != null ? "&config.disableAP=true&config.disableAEC=true&config.disableNS=true&config.disableAGC=true&config.disableHPF=true&config.stereo=true&config.enableLipSync=false&config.opusMaxAverageBitrate=510000" : "");

    const startWithAudioMuted = getSetting("startWithAudioMuted", null);
    params = params + (startWithAudioMuted != null ? "&config.startWithAudioMuted=" + startWithAudioMuted : "");

    const startWithVideoMuted = getSetting("startWithVideoMuted", null);
    params = params + (startWithVideoMuted != null ? "&config.startWithVideoMuted=" + startWithVideoMuted : "");

    const startScreenSharing = getSetting("startScreenSharing", null);
    params = params + (startScreenSharing != null ? "&config.startScreenSharing=" + startScreenSharing : "");

    const recordMeeting = getSetting("recordMeeting", null);
    params = params + (recordMeeting != null ? "&interfaceConfig.OFMEET_RECORD_CONFERENCE=" + recordMeeting : "");

    const enableTranscription = getSetting("enableTranscription", null);
    params = params + (enableTranscription != null ? "&interfaceConfig.OFMEET_ENABLE_TRANSCRIPTION=" + enableTranscription : "");

    const showCaptions = getSetting("showCaptions", null);
    params = params + (showCaptions != null ? "&interfaceConfig.OFMEET_SHOW_CAPTIONS=" + showCaptions : "");

    const INITIAL_TOOLBAR_TIMEOUT = getSetting("INITIAL_TOOLBAR_TIMEOUT");
    params = params + (INITIAL_TOOLBAR_TIMEOUT ? "&interfaceConfig.INITIAL_TOOLBAR_TIMEOUT=" + INITIAL_TOOLBAR_TIMEOUT : "");

    const TOOLBAR_TIMEOUT = getSetting("TOOLBAR_TIMEOUT");
    params = params + (TOOLBAR_TIMEOUT ? "&interfaceConfig.TOOLBAR_TIMEOUT=" + TOOLBAR_TIMEOUT : "");

    const FILM_STRIP_MAX_HEIGHT = getSetting("FILM_STRIP_MAX_HEIGHT");
    params = params + (FILM_STRIP_MAX_HEIGHT ? "&interfaceConfig.FILM_STRIP_MAX_HEIGHT=" + FILM_STRIP_MAX_HEIGHT : "");

    const VERTICAL_FILMSTRIP = getSetting("VERTICAL_FILMSTRIP", null);
    params = params + (VERTICAL_FILMSTRIP != null ? "&interfaceConfig.VERTICAL_FILMSTRIP=" + VERTICAL_FILMSTRIP : "");


    return url + room + params;
}