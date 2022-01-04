let Strophe, $iq, $msg, $pres, $build, b64_sha1, dayjs, _converse, html, _, __, Model, BootstrapModal;
const nickColors = {}, pade = {webAppsWindow: {}};
const whitelistedPlugins = ["paderoot", "stickers"];

var paderoot = {
	participants: {},
	presence: {},
	tasks: {},
	sip: {},
	autoJoinRooms: {},
	autoJoinPrivateChats: {},
	gmailWindow: [],
	webAppsWindow: {},
	vcards: {},
	questions: {},
	collabDocs: {},
	collabList: [],
	userProfiles: {},
	fastpath: {},
	geoloc: {},
	ohun: {},
	transferWise: {}
}

loadPlugins();
	
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

function loadPlugins() {
    if (getSetting("showToolbarIcons", false))
    {	
		whitelistedPlugins.push("toolbar-utilities");
		loadJS("./packages/toolbar-utilities/toolbar-utilities.js");

		whitelistedPlugins.push("jitsimeet");
		loadJS("./packages/jitsimeet/jitsimeet.js");
		
		whitelistedPlugins.push("search");
		loadCSS("./packages/search/search.css");
		loadJS("./packages/search/jspdf.debug.js");		
		loadJS("./packages/search/jspdf.plugin.autotable.js");
		loadJS("./packages/search/search.js");			

		whitelistedPlugins.push("vmsg");	
		loadJS("./packages/vmsg/vmsg.js");
		
		whitelistedPlugins.push("screencast");	
		loadJS("./packages/screencast/screencast.js");
			
		if (getSetting("enableDirectorySearch", false))
		{
			whitelistedPlugins.push("directory");
			loadCSS("./packages/directory/directory.css");		
			loadJS("./packages/directory/directory.js");			
		}	

        if (getSetting("enableMucDirectory", false))
        {			
			whitelistedPlugins.push("muc-directory");
			loadCSS("./packages/muc-directory/muc-directory.css");		
			loadJS("./packages/muc-directory/muc-directory.js");
		}

        if (getSetting("publishLocation", false))
		{
			whitelistedPlugins.push("location");
			loadCSS("./packages/location/location.css");		
			loadJS("./packages/location/location.js");
		}			

        if (getSetting("embedDiagrams", false))
		{
			whitelistedPlugins.push("diagrams");	
			loadJS("./packages/diagrams/mermaid.min.js");
			loadJS("./packages/diagrams/diagrams.js");
			loadJS("./packages/diagrams/abcjs.js");					
		}

        if (getSetting("enableInfoPanel", false))
		{
			whitelistedPlugins.push("muc-info");	
			loadCSS("./packages/muc-info/muc-info.css");	
			loadJS("./packages/muc-info/muc-info.js");				
		}

        if (getSetting("wgEnabled", false))
        {
            whitelistedPlugins.push("fastpath");
            loadJS("./packages/fastpath/fastpath.js");
        }
		
        if (getSetting("enableRssFeeds", false))
        {
            whitelistedPlugins.push("gateway");
			loadJS("./packages/gateway/rss-library.js");		
            loadJS("./packages/gateway/gateway.js");
        }		
	}
}

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
	let autoJoinRooms = undefined;
	let autoJoinPrivateChats = undefined;

	const tempRooms = getSetting("autoJoinRooms", "").split("\n");

	if (tempRooms.length > 0)
	{
		autoJoinRooms = [];

		for (let i=0; i<tempRooms.length; i++)
		{
			if (tempRooms[i])
			{
				autoJoinRooms.push({jid: tempRooms[i].indexOf("@") == -1 ? tempRooms[i].trim() + "@conference." + domain : tempRooms[i], nick: displayname});
			}
		}
	}

	const tempJids = getSetting("autoJoinPrivateChats", "").split("\n");

	if (tempJids.length > 0)
	{
		autoJoinPrivateChats = [];

		for (let i=0; i<tempJids.length; i++)
		{
			if (tempJids[i]) autoJoinPrivateChats.push(tempJids[i].indexOf("@") == -1 ? tempJids[i].trim() + "@" + domain : tempJids[i].trim());
		}
	}
	if (location.hash != "" && anonUser)
	{
		const pos1 = location.hash.indexOf("converse/room?jid=");
		if (pos1 != -1) autoJoinRooms = [{jid: location.hash.substring(pos1 + 18), nick: displayname}];

		const pos2 = location.hash.indexOf("converse/chat?jid=");
		if (pos2 != -1) autoJoinPrivateChats = [location.hash.substring(pos2 + 18)];
	}

	const autoAway = getSetting("idleTimeout", 300);
	const autoXa = autoAway * 3;			 			
	const config = {
		allow_bookmarks: true,
		allow_chat_pending_contacts: true,		
		allow_adhoc_commands: false,
		allow_logout: false,
		allow_message_corrections: 'all',
		allow_muc_invitations: true,		
		allow_non_roster_messaging: true,
		allow_registration: false,
		assets_path: "./dist/",
		allow_public_bookmarks: true,
		archived_messages_page_size: getSetting("archivedMessagesPageSize", 51),		
		authentication: 'login',
		auto_away: autoAway,
		auto_join_on_invite: getSetting("autoJoinOnInvite", false),
		auto_join_private_chats: autoJoinPrivateChats,
		auto_join_rooms: autoJoinRooms,
		auto_list_rooms: getSetting("autoListRooms", true),
		auto_login: username || anonUser,		  
		auto_reconnect: getSetting("autoReconnectConverse", true),
		auto_subscribe: getSetting("autoSubscribe", false),
		auto_xa:  autoXa,
		bosh_service_url: getSetting("boshUri", "https://" + server + "/http-bind/"),
		clear_messages_on_reconnection: getSetting("clearCacheOnConnect", false),
		default_domain: domain,
		default_state: getSetting("converseOpenState", "online"),		
		discover_connection_methods: false,		
		domain_placeholder: domain,
		enable_smacks: getSetting("enableSmacks", false),
		fullname: displayname,
		hide_offline_users: getSetting("hideOfflineUsers", false),	
		hide_open_bookmarks: true,			  
		i18n: getSetting("language", "en"),	
		jid : anonUser ? domain : (username ? username + "@" + domain : undefined),				  
		locked_domain: domain,
		loglevel: getSetting("converseDebug", false) ? "debug" : "info",
		message_archiving: 'always',
		message_carbons: getSetting("messageCarbons", true),
		muc_domain: "conference." + getSetting("domain", null),
		muc_fetch_members: getSetting("fetchMembersList", false),
		muc_history_max_stanzas: getSetting("archivedMessagesPageSize", 51),
		muc_mention_autocomplete_filter: getSetting("converseAutoCompleteFilter", "starts_with"),
		muc_nickname_from_jid: getSetting("autoCreateNickname", false),
		muc_show_join_leave: getSetting("showGroupChatStatusMessages", false),
		muc_show_join_leave_status: getSetting("showGroupChatStatusMessages", false),
		muc_show_room_info: getSetting("showGroupChatStatusMessages", false),
		nickname: displayname,		
		notification_icon: './image.png',
		notify_all_room_messages: getSetting("notifyAllRoomMessages", false),
		password: anonUser ? undefined : password,
		persistent_store: getSetting("conversePersistentStore", 'none'),
		play_sounds: getSetting("conversePlaySounds", false),
		priority: 0,
		roster_groups: getSetting("rosterGroups", false),
		show_chatstate_notifications: true,
		show_controlbox_by_default: true,
		show_desktop_notifications: true,
		show_message_load_animation: true,
		show_send_button: getSetting("showSendButton", true),
		singleton: (autoJoinRooms && autoJoinRooms.length == 1),			  
		render_media: true,
		show_client_info: false,
		sounds_path: "./dist/sounds/",
		theme: getSetting('converseTheme', 'concord'),			
		trusted: getSetting("conversePersistentStore", 'none') == 'none' ? 'off' : 'on',			  
		view_mode: "fullscreen",
		visible_toolbar_buttons: {'emoji': true, 'call': getSetting("showToolbarIcons", false) && (getSetting("enableAudioConfWidget", false) || getSetting("jingleCalls", false)), 'clear': true },
		websocket_url: getSetting("useWebsocket", false) ? (location.protocol == "http:" ? "ws:" : "wss:") + '//' + server + '/ws/' : undefined,		
		whitelisted_plugins: whitelistedPlugins		
	}
	
	setupPadeRoot();

	console.debug("startConverse", config);
	converse.initialize(config);

}

function setupPadeRoot() {
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

			class PadeBrandLogo extends _converse.CustomElement 
			{
				render () {
					const is_fullscreen = _converse.api.settings.get('view_mode') === 'fullscreen';
					return html
`
						<a class="brand-heading" href="https://github.com/igniterealtime/pade" target="_blank" rel="noopener">
							<span class="brand-name-wrapper ${is_fullscreen ? 'brand-name-wrapper--fullscreen' : ''}">
								<img style="height:40px;width:40px;" src="./icon.png" />&nbsp;Pade Converse
							</span>	
						</a>
`
				}		
			}
			
			_converse.api.elements.define('converse-brand-logo', PadeBrandLogo);
			
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
				// do nothing
				
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

					if (getSetting("converseSimpleView", false))
					{
						handleActiveConversations();
					}					

				}).catch(function (err) {
					console.error('waiting for controlBoxInitialized error', err);
				});			

			}).catch(function (err) {
				console.error('waiting for controlBoxInitialized error', err);
			});		

			_converse.api.listen.on('chatBoxClosed', function (chatbox)
			{
				console.debug("chatBoxClosed", chatbox);

				const activeDiv = document.getElementById("active-conversations");
				if (activeDiv) removeActiveConversation(chatbox, activeDiv);
			});
					
			_converse.api.listen.on('connected', function() {
				if (getSetting("converseTimeAgo", false)) setupTimer();
				addSelfBot();			
			});

			_converse.api.listen.on('rosterContactInitialized', function(contact) {
				setAvatar(contact);
			});	
			
			_converse.api.listen.on('getMessageActionButtons', (el, buttons) => {
		       buttons.push({'i18n_text': __('Reply'),   'handler': ev => handleReplyAction(el.model),                    	'button_class': 'chat-msg__action-reply',       'icon_class': 'fas fa-arrow-left',  'name': 'pade-reply'});			   
		       buttons.push({'i18n_text': __('Like'),    'handler': ev => handleReactionAction(el.model, ':smiley:'),   	'button_class': 'chat-msg__action-thumbsup',    'icon_class': 'fa fa-check',   'name': 'pade-thumbsup'});	
		       buttons.push({'i18n_text': __('Dislike'), 'handler': ev => handleReactionAction(el.model, ':disappointed:'), 'button_class': 'chat-msg__action-thumbsdownp', 'icon_class': 'fa fa-times', 'name': 'pade-thumbsdown'});			   
		       return buttons;
			});	


			_converse.api.listen.on('message', (data) => {			
				let count = 0;
				if (!data.attrs.message) return;
				
				_converse.chatboxes.each((chat_box) =>
				{					
					const newMessage = (data.attrs.from_muc || data.attrs.from) == chat_box.get("jid") ? data.attrs.message : null;
					
					if (chat_box.get("type") == "chatbox")
					{
						const value = chat_box.get("num_unread");
						setActiveConversationsBadge(chat_box, value, newMessage);							
						count = count + value;
					}
					else

					if (chat_box.get("type") == "chatroom")
					{
						const value = chat_box.get("num_unread_general");
						setActiveConversationsBadge(chat_box, value, newMessage);						
						count = count + value;
					}
									
				});			
				
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
		}
	});		
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
	let elements = document.querySelectorAll('.list-item.controlbox-padded');	
	//console.debug("setupMUCAvatars", elements);	
		
	for (let i=0; i < elements.length; i++)
	{
		if (!elements[i].querySelector('.pade-avatar')) {		
			const jid = elements[i].getAttribute('data-room-jid') || elements[i].getAttribute('data-headline-jid');
			//console.debug("setupMUCAvatars", jid);		
			
			if (jid) {
				const img = createAvatar(jid);
				const avatar = newElement('span', null, '<img style="border-radius: var(--avatar-border-radius); margin-right: 10px;" src="' + img + '" class="avatar avatar" width="30" height="30" />', 'pade-avatar');
				elements[i].prepend(avatar);
			}
		}			
	}

	elements = document.querySelectorAll('.chat-head-chatroom .chatbox-title__text');	
		
	for (let i=0; i < elements.length; i++)
	{
		if (!elements[i].querySelector('.pade-avatar')) {		
			const jid = elements[i].getAttribute('title');
			//console.debug("setupMUCAvatars", jid);		
			
			if (jid) {
				const img = createAvatar(jid);
				const avatar = newElement('span', null, '<img style="border-radius: var(--avatar-border-radius); margin-right: 10px;" src="' + img + '" class="avatar avatar" width="30" height="30" />', 'pade-avatar');
				elements[i].prepend(avatar);
			}
		}			
	}	
}

function addControlFeatures() {
	const section = document.body.querySelector('.controlbox-section.profile.d-flex');
	if (!section) return;

	//console.debug("addControlFeatures", section);
	
	if (!section.querySelector('.pade-active-conversations')) {		
		const viewButton = newElement('a', null, '<a class="controlbox-heading__btn show-active-conversations fa fa-list-ul align-self-center" title="Change view"></a>', 'pade-active-conversations');
		section.appendChild(viewButton);

		viewButton.addEventListener('click', function(evt)
		{
			evt.stopPropagation();
			handleActiveConversations();

		}, false);	
	}
	
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
			location.href = "./options/index.html";
		}, false);
	}
}

function handleActiveConversations() {
	console.debug("handleActiveConversations");

	const announceDiv = document.getElementById("headline");
	const roomDiv = document.getElementById("chatrooms");
	const chatDiv = document.getElementById("converse-roster");
	let activeDiv = document.getElementById("active-conversations");

	if (roomDiv && _converse)
	{
		let display = roomDiv.style.display;

		if (display != "none")
		{
			roomDiv.style.display = "none";
			if (chatDiv) chatDiv.style.display = "none";
			if (announceDiv) announceDiv.style.display = "none";			

			if (!activeDiv)
			{
				activeDiv = document.createElement("div");
				activeDiv.id = "active-conversations";
				activeDiv.classList.add("controlbox-section");
				roomDiv.parentElement.appendChild(activeDiv);
			}

			var compare = function ( x, y )
			{
				const one = x.get("name");
				const two = y.get("name");
				const a = one ? one.toLowerCase() : "";
				const b = two ? two.toLowerCase() : "";

				if ( a < b ) return -1;
				if ( a > b ) return 1;
				return 0;
			}

			_converse.chatboxes.models.sort(compare).forEach(function (chatbox)
			{
				addActiveConversation(chatbox, activeDiv);
			});

		} else {
			roomDiv.style.display = "";
			if (chatDiv) chatDiv.style.display = "";
			if (announceDiv) announceDiv.style.display = "";				
			if (activeDiv) roomDiv.parentElement.removeChild(activeDiv);
		}
	}
}

function removeActiveConversation(chatbox, activeDiv) {
	//console.debug("removeActiveConversation", chatbox, activeDiv);

	if (chatbox && activeDiv)
	{
		const openButton = document.getElementById("pade-active-" + chatbox.get('box_id'));

		if (openButton)
		{
			activeDiv.removeChild(openButton.parentElement);
		}
	}
}

function addActiveConversation(chatbox, activeDiv, newMessage) {
	//console.debug("addActiveConversation", chatbox, activeDiv, newMessage);
	
	if (_converse && chatbox.vcard) 	
	{
		const panel = document.getElementById("pade-active-" + chatbox.get('box_id'));

		if (panel)
		{
			activeDiv.removeChild(panel.parentElement);
		}

		if (!newMessage) newMessage = "";

		const status = chatbox.get("status") ? chatbox.get("status") : "";
		const chatType = chatbox.get("type") == "chatbox" ? "chat" : "groupchat";
		const numUnread = chatType == "chat" ? chatbox.get("num_unread") : chatbox.get("num_unread_general");
		const id = chatbox.get('box_id');
		const jid = chatbox.get('jid');

		const msg_content = document.createElement("div");
		msg_content.classList.add("pade-active-panel");

		let display_name = chatbox.getDisplayName();
		if (!display_name || display_name.trim() == "") display_name = jid;
		if (display_name.indexOf("@") > -1) display_name = display_name.split("@")[0];

		let dataUri = "data:" + chatbox.vcard.attributes.image_type + ";base64," + chatbox.vcard.attributes.image;

		if (_converse.DEFAULT_IMAGE == chatbox.vcard.attributes.image)
		{
			dataUri = createAvatar(display_name, null, null, null, null);
		}

		// ohun status

		msg_content.innerHTML = '<span id="pade-badge-' + id + '" class="pade-badge" data-badge="' + numUnread + '"><img class="avatar" src="' + dataUri + '" style="border-radius: var(--avatar-border-radius); width: 22px; width: 22px; height: 100%; margin-right: 10px;"/></span><span title="' + newMessage + '" data-label="' + display_name + '" data-jid="' + jid + '" data-type="' + chatType + '" id="pade-active-' + id +'" class="pade-active-conv">' + display_name + '</span><a href="#" id="pade-active-conv-close-' + id +'" data-jid="' + jid + '" class="pade-active-conv-close fa fa-times"></a><a href="#" id="pade-active-conv-ohun-' + id +'" data-jid="' + jid + '" class="pade-active-conv-ohun fas fa-volume-up"></a>';
		activeDiv.appendChild(msg_content);

		const item = document.getElementById('pade-active-conv-ohun-' + id);

		if (item && paderoot.ohun[jid] && paderoot.ohun[jid].peer)
		{
			item.style.color =  "red";
			item.style.visibility = "visible";
		}

		// handlers for mouse click and badge status

		const openButton = document.getElementById("pade-active-" + id);
		const openBadge = document.getElementById("pade-badge-" + id);

		if (openButton)
		{
			openButton.addEventListener('click', function(evt)
			{
				evt.stopPropagation();
	
				let jid = evt.target.getAttribute("data-jid");
				let type = evt.target.getAttribute("data-type");
				let label = evt.target.getAttribute("data-label");

				console.debug("addActiveConversation - open", jid, type, label);

				if (jid)
				{
					if (type == "chat") _converse.api.chats.open(jid, {'bring_to_foreground': true}, true);
					else
					if (type == "groupchat") _converse.api.rooms.open(jid, {'bring_to_foreground': true}, true);
				}

				_converse.chatboxes.each(function (chatbox)
				{
					const itemId = chatbox.get('box_id');
					const itemLabel = document.getElementById("pade-active-" + itemId);
					if (itemLabel) itemLabel.style.fontWeight = "normal";
				});

				this.innerHTML = label;
				this.style.fontWeight = "bold";

				if (openBadge) openBadge.setAttribute("data-badge", "0");

			}, false);
		}

		const closeButton = document.getElementById("pade-active-conv-close-" + id);

		if (closeButton)
		{
			closeButton.addEventListener('click', function(evt)
			{
				evt.stopPropagation();

				const jid = evt.target.getAttribute("data-jid");
				const view = _converse.chatboxviews.get(jid);
				
				console.debug("addActiveConversation - close", jid, view);				

				if (view)
				{
					const ohun = _converse.pluggable.plugins["ohun"];
					if (ohun) ohun.closeKraken(view.model);
					view.close();
				}

			}, false);
		}
	}
}

function setActiveConversationsRead(chatbox) {
	console.debug("setActiveConversationsRead", chatbox);

	var id = chatbox.get("box_id");
	var openBadge = document.getElementById("pade-badge-" + id);
	if (openBadge) openBadge.setAttribute("data-badge", "0");
}
	
function setActiveConversationsUread(chatbox, newMessage) {
	// active conversations, add unread indicator

	var id = chatbox.get("box_id");
	var numUnreadBox = chatbox.get("num_unread");
	var numUnreadRoom = chatbox.get("num_unread_general");
	var chatType = chatbox.get("type") == "chatbox" ? "chat" : "groupchat";
	var openButton = document.getElementById("pade-active-" + id);
	var openBadge = document.getElementById("pade-badge-" + id);

	var jid = chatbox.get("jid");
	var display_name = chatbox.getDisplayName().trim();
	if (!display_name || display_name == "") display_name = jid;

	if (openBadge && openButton)
	{
		if (chatType == "chat")
		{
			openBadge.setAttribute("data-badge", numUnreadBox);
		}
		else

		if (chatType == "groupchat")
		{
			openBadge.setAttribute("data-badge", numUnreadRoom);
		}

		if (newMessage) openButton.title = newMessage;

	} else {
		const activeDiv = document.getElementById("active-conversations");
		if (activeDiv) addActiveConversation(chatbox, activeDiv, newMessage);
	}
}
	
function setActiveConversationsBadge(chatbox, value, newMessage) {
	var id = chatbox.get("box_id");
    var openButton = document.getElementById("pade-active-" + id);
	var openBadge = document.getElementById("pade-badge-" + id);
	
	if (openBadge && newMessage) {
		console.debug("setActiveConversationsBadge", value, chatbox.get("jid"), newMessage);		
		openBadge.setAttribute("data-badge", value);
		if (openButton) openButton.title = newMessage;		
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

function loadJS(name) {
	console.debug("loadJS", name);
	var head  = document.getElementsByTagName('head')[0];
	var s1 = document.createElement('script');
	s1.src = name;
	s1.async = false;
	head.appendChild(s1);
}

function loadCSS(name) {
	console.debug("loadCSS", name);
	var head  = document.getElementsByTagName('head')[0];
	var link  = document.createElement('link');
	link.rel  = 'stylesheet';
	link.type = 'text/css';
	link.href = name;
	head.appendChild(link);
}
	
async function parseStanza(stanza, attrs) {
    const reactions = stanza.querySelector('reactions');

    if (reactions) {
		attrs.reaction_id = reactions.getAttribute('id');
		attrs.reaction_emoji = reactions.querySelector('reaction').innerHTML;		
		//console.log("parseStanza", stanza, attrs);		
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
	
	let target = model.get('from_muc');
	
	if (type == "chat")  {
		target = model.get('jid');

		if (model.get('sender') == 'them') {
			target = model.get('from');
		}		
	}
	
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

		if (!closed) _converse.api.chats.open(from, {'bring_to_foreground': true}, true);

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