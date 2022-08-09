let Strophe, $iq, $msg, $pres, $build, b64_sha1, dayjs, _converse, html, _, __, Model, BootstrapModal, serviceWorkerRegistration, BrowserDetect, streamChannel;
const nickColors = {}
const whitelistedPlugins = [];

var pade = {
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
	BrowserDetect = {
		init: function () {
			this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
			this.version = this.searchVersion(navigator.userAgent)
				|| this.searchVersion(navigator.appVersion)
				|| "an unknown version";
			this.OS = this.searchString(this.dataOS) || "an unknown OS";

			this.width = 0;
			this.height = 0;

			if ( typeof( window.innerWidth ) == 'number' )
			{
				this.width = window.innerWidth;
				this.height = window.innerHeight;

			} else if ( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {

				this.width = document.documentElement.clientWidth;
				this.height = document.documentElement.clientHeight;

			} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {

				this.width = document.body.clientWidth;
				this.height = document.body.clientHeight;
			}
		},

		searchString: function (data) {
			for (var i=0;i<data.length;i++) {
				var dataString = data[i].string;
				var dataProp = data[i].prop;
				this.versionSearchString = data[i].versionSearch || data[i].identity;
				if (dataString) {
					if (dataString.indexOf(data[i].subString) != -1)
						return data[i].identity;
				}
				else if (dataProp)
					return data[i].identity;
			}
		},

		searchVersion: function (dataString) {
			var index = dataString.indexOf(this.versionSearchString);
			if (index == -1) return;
			return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
		},

		dataBrowser: [
			{
				string: navigator.userAgent,
				subString: "Chrome",
				identity: "Chrome"
			},
			{   string: navigator.userAgent,
				subString: "OmniWeb",
				versionSearch: "OmniWeb/",
				identity: "OmniWeb"
			},
			{
				string: navigator.vendor,
				subString: "Apple",
				identity: "Safari",
				versionSearch: "Version"
			},
			{
				prop: window.opera,
				identity: "Opera"
			},
			{
				string: navigator.vendor,
				subString: "iCab",
				identity: "iCab"
			},
			{
				string: navigator.vendor,
				subString: "KDE",
				identity: "Konqueror"
			},
			{
				string: navigator.userAgent,
				subString: "Firefox",
				identity: "Firefox"
			},
			{
				string: navigator.vendor,
				subString: "Camino",
				identity: "Camino"
			},
			{       // for newer Netscapes (6+)
				string: navigator.userAgent,
				subString: "Netscape",
				identity: "Netscape"
			},
			{
				string: navigator.userAgent,
				subString: "MSIE",
				identity: "Explorer",
				versionSearch: "MSIE"
			},
			{
				string: navigator.userAgent,
				subString: "Gecko",
				identity: "Mozilla",
				versionSearch: "rv"
			},
			{       // for older Netscapes (4-)
				string: navigator.userAgent,
				subString: "Mozilla",
				identity: "Netscape",
				versionSearch: "Mozilla"
			}
		],

		dataOS : [
			{
				string: navigator.userAgent,
				subString: "Windows NT 10.0; Win64",
				identity: "Win10.64"
			},
			{
				string: navigator.userAgent,
				subString: "Windows NT 10.0",
				identity: "Win10"
			},
			{
				string: navigator.platform,
				subString: "Win",
				identity: "Win"
			},
			{
				string: navigator.platform,
				subString: "Mac",
				identity: "Mac"
			},
			{
			   string: navigator.userAgent,
			   subString: "iPhone",
			   identity: "iPhone"
			},
			{
				string: navigator.platform,
				subString: "Linux",
				identity: "Linux"
			}
		]
	};
	BrowserDetect.init();	
	setupChromeHandlers()
	
	navigator.credentials.get({password: true}).then(function(credential) {
		console.log("window.load credential", credential);
		startConverse(credential);

	}).catch(function(err){
		console.error("window.load credential error", err);
		startConverse();		
	});	
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

function loadBranding() {
	var defaults = Object.getOwnPropertyNames(branding);

	console.debug("branding - start", defaults, branding);

	for (var i=0; i<defaults.length; i++)
	{
		var setting = defaults[i];
		var defaultVal = branding[setting];

		if (defaultVal.value && defaultVal.value != "" && !defaultVal.disable && !getSetting(setting)) {
			console.debug("branding - found", i, setting, defaultVal.value, defaultVal.disable, getSetting(setting));			
			setSetting(setting, defaultVal.value);
		}
	}	
}

function storeCredentials(pass) {
	const id = getSetting("username") + "@" + getSetting("domain");	
	
	if (location.protocol == "chrome-extension:") {
		setSetting("password", pass);	
		
	} else {
		navigator.credentials.create({password: {id: id, password: pass}}).then(function(credential)
		{
			console.debug("storeCredentials", credential);
		
			if (credential) {
				navigator.credentials.store(credential).then(function()
				{
					console.log("storeCredentials stored");

				}).catch(function (err) {
					console.error("storeCredentials error", err);
				});
			} else {
				setSetting("password", pass);			
			}

		}).catch(function (err) {
			console.error("storeCredentials error", err);
			setSetting("password", pass);			
		});	
	}
}

function setupPushNotifications(pass) {
	const domain = getSetting("domain", location.hostname);
	const server = getSetting("server", location.host);
	const username = getSetting("username");		
	const url = (domain == "localhost" || location.protocol == "http:" ? "http://" : "https://") + server + "/rest/api/restapi/v1/meet/webpush/" + username;	
	const options = {method: "GET", headers: {"Authorization": "Basic " + btoa(username + ":" + pass), "Accept":"application/json", "Content-Type":"application/json"}};

    console.debug("setupPushNotifications - vapidGetPublicKey", url, options);
		
	fetch(url, options).then(function(response) {return response.json()}).then(function(vapid)
	{
		if (vapid.publicKey)
		{
			subscribeForPushNotifications(vapid.publicKey, pass);
		}

	}).catch(function (err) {
		console.error('vapidGetPublicKey error!', err);
	});	
}

function subscribeForPushNotifications(publicKey, pass) {
	console.debug("subscribeForPushNotifications", publicKey);	
	
	if (serviceWorkerRegistration) {
		serviceWorkerRegistration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: base64UrlToUint8Array(publicKey)
		})
		.then(function (subscription) {
			return sendSubscriptionToServer(subscription, pass);
		})
		.catch(function (e) {
			if (Notification.permission === 'denied') {
				console.warn('Permission for Notifications was denied');
			} else {
				console.error('Unable to subscribe to push.', e);
			}
		});
	}
}

function base64UrlToUint8Array(base64UrlData) {
	const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
	const base64 = (base64UrlData + padding).replace(/\-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const buffer = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		buffer[i] = rawData.charCodeAt(i);
	}

	return buffer;
}

function sendSubscriptionToServer(subscription, pass) {
	console.debug("sendSubscriptionToServer", subscription);
	
	const domain = getSetting("domain", location.hostname);
	const server = getSetting("server", location.host);
	const username = getSetting("username");		
	const baseUrl = (domain == "localhost" || location.protocol == "http:" ? "http://" : "https://") + server;	

	var key = subscription.getKey ? subscription.getKey('p256dh') : '';
	var auth = subscription.getKey ? subscription.getKey('auth') : '';

	var subscriptionString = JSON.stringify(subscription);  // TODO

	console.debug("web push subscription", {
		endpoint: subscription.endpoint,
		key: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : '',
		auth: auth ? btoa(String.fromCharCode.apply(null, new Uint8Array(auth))) : ''
	}, subscription);

	var resource = chrome.i18n.getMessage('manifest_shortExtensionName').toLowerCase() + "-" + BrowserDetect.browser + BrowserDetect.version + BrowserDetect.OS;
	var putUrl = baseUrl + "/rest/api/restapi/v1/meet/webpush/" + username + "/" + resource;
	var options = {method: "PUT", body: JSON.stringify(subscription), headers: {"Authorization": "Basic " + btoa(username + ":" + pass), "Accept":"application/json", "Content-Type":"application/json"}};

	return fetch(putUrl, options).then(function(response) {
		console.debug("sendSubscriptionToServer - subscribe response", response);

	}).catch(function (err) {
		console.error('subscribe error!', err);
	});
}

function setupServiceWorker(pass) {
	console.debug("setupServiceWorker");	
	
	const initialiseError = (error) => {
		console.error("setupServiceWorker - initialiseError", error);
	}	

	const initialiseState = (registration) => {
		if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
			console.warn('Notifications aren\'t supported.');
			return;
		}

		if (Notification.permission === 'denied') {
			console.warn('The user has blocked notifications.');
			return;
		}

		if (!('PushManager' in window)) {
			console.warn('Push messaging isn\'t supported.');
			return;
		}

		console.debug("setupServiceWorker - initialiseState", registration);
	}
	
	if (location.protocol == "chrome-extension:") {
		navigator.serviceWorker.getRegistration('./').then(initialiseState, initialiseError);		
	
	} else {
		navigator.serviceWorker.register('./background.js', {scope: '.'}).then(initialiseState, initialiseError);	
	}	

	navigator.serviceWorker.ready.then(svcWorkerRegistration =>
	{
		console.debug("setupServiceWorker - ready", svcWorkerRegistration);
		serviceWorkerRegistration = svcWorkerRegistration;	
		setupPushNotifications(pass);
	});	
	
	navigator.serviceWorker.addEventListener('message', event => 
	{
		console.debug("setupServiceWorker - message event", event.data, event.action, event.reply);		
	});	

	const actionChannel = new BroadcastChannel('pade-action');
	
    actionChannel.addEventListener('message', event =>
	{
		console.debug("setupServiceWorker - notication action", event.data, event.action, event.reply);
	});		
}

function loadPlugins() {
    if (getSetting("showToolbarIcons", false))
    {	
		whitelistedPlugins.push("paderoot");
		whitelistedPlugins.push("stickers");
		
		whitelistedPlugins.push("toolbar-utilities");
		loadJS("./packages/toolbar-utilities/toolbar-utilities.js");

		whitelistedPlugins.push("jitsimeet");
		loadJS("./packages/jitsimeet/jitsimeet.js");
		
		whitelistedPlugins.push("search");
		loadCSS("./packages/search/search.css");
		loadJS("./packages/search/jspdf.debug.js");		
		loadJS("./packages/search/jspdf.plugin.autotable.js");
        loadJS("./packages/search/tokenizer.js");
        loadJS("./packages/search/js-summarize.js");		
		loadJS("./packages/search/search.js");			

		whitelistedPlugins.push("vmsg");	
		loadJS("./packages/vmsg/vmsg.js");
		
		whitelistedPlugins.push("screencast");	
		loadJS("./packages/screencast/screencast.js");

        if (getSetting("enableVoiceChat", false))
        {
            whitelistedPlugins.push("voicechat");
			loadCSS("./packages/voicechat/voicechat.css");	
			loadJS("./packages/voicechat/hark.js");
			loadJS("./packages/voicechat/jquery-3.5.1.min.js");			
			loadJS("./packages/voicechat/lib-jitsi-meet.min.js");		
            loadJS("./packages/voicechat/voicechat.js");
        }
		
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
		
        if (getSetting("useMarkdown", true))
        {
            whitelistedPlugins.push("marked");
            loadCSS("./packages/marked/marked.css");			
			loadJS("./packages/marked/marked.min.js");		
            loadJS("./packages/marked/marked.js");			
        }

        if (getSetting("showWordCloud", false))
        {
            loadJS("./packages/search/d3.js");
            loadJS("./packages/search/d3.layout.cloud.js");
            loadJS("./packages/search/stopwords.js");
        }
		
        if (getSetting("enableAdaptiveCardDesign", false) || getSetting("enableAdaptiveCardViewer", false))
        {
            whitelistedPlugins.push("adaptive-cards");			
            loadCSS("./packages/adaptive-cards/adaptivecards.css");
            loadJS("./packages/adaptive-cards/adaptivecards.min.js");			
            loadJS("./packages/adaptive-cards/markdown-it.min.js");				
            loadJS("./packages/adaptive-cards/adaptive-cards.js");				
		}			
	}
}

function setupChromeHandlers() {

	if (chrome.identity) 
	{
		chrome.identity.getProfileUserInfo((info) => {
			console.log("Browser logged in user", info);
		});
	}
	
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

function startConverse(credential) {	
	const anonUser = getSetting("useAnonymous", false);
	
	let username = getSetting("username");
	let password = credential?.password || getSetting("password");
	
	if (!username || !password || username == "" || password == "") {
		loadBranding();
		
		if (!username) {
			if (!chrome.pade) {
				setSetting("useWebsocket", true);
				location.href = "./options/index.html";
			}
		}
	}

	const domain = getSetting("domain", location.hostname);
	const server = getSetting("server", location.host);
	let discoverConnectionMethods = false;

	const defaultBoshServiceUrl = (domain == "localhost" || location.protocol == "http:" ? "http://" : "https://") + server + "/http-bind/";
	let boshServiceUrl = getSetting("boshUri", defaultBoshServiceUrl);
	if (boshServiceUrl.trim() == "") discoverConnectionMethods = true;
	
	const defaultWSServiceUrl = (domain == "localhost" || location.protocol == "http:" ? "ws://" : "wss://") + server + '/ws/';
	let wsServiceUrl = getSetting('websocketUri', defaultWSServiceUrl);	
	if (wsServiceUrl.trim() == "") discoverConnectionMethods = true;
	
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

	if (getSetting("enableHomePage", false) && !location.hash)
	{
		document.getElementById("pade-home-page").src = getSetting("homePage", chrome.runtime.getManifest().homepage_url);
	}

	const MUC_AFFILIATION_CHANGES_LIST = ['owner', 'admin', 'member', 'exowner', 'exadmin', 'exmember', 'exoutcast']
	const MUC_ROLE_CHANGES_LIST = ['op', 'deop', 'voice', 'mute'];
	const MUC_TRAFFIC_STATES_LIST = ['entered', 'exited'];

	const MUC_INFO_CODES = {
		'visibility_changes': ['100', '102', '103', '172', '173', '174'],
		'self': ['110'],
		'non_privacy_changes': ['104', '201'],
		'muc_logging_changes': ['170', '171'],
		'nickname_changes': ['210', '303'],
		'disconnect_messages': ['301', '307', '321', '322', '332', '333'],
		'affiliation_changes': [MUC_AFFILIATION_CHANGES_LIST],
		'join_leave_events': [MUC_TRAFFIC_STATES_LIST],
		'role_changes': [MUC_ROLE_CHANGES_LIST],
	};

	const mucShowInfoMessages = [
		MUC_INFO_CODES.visibility_changes,
		MUC_INFO_CODES.self,
		MUC_INFO_CODES.non_privacy_changes,
		MUC_INFO_CODES.muc_logging_changes,
		MUC_INFO_CODES.nickname_changes,
		MUC_INFO_CODES.disconnect_messages,
		MUC_INFO_CODES.affiliation_changes,
		MUC_INFO_CODES.join_leave_events,
		MUC_INFO_CODES.role_changes,
	]
			
	const autoAway = getSetting("idleTimeout", 300);
	const autoXa = autoAway * 3;			 			
	const config = {
		allow_bookmarks: true,
		allow_chat_pending_contacts: true,		
		allow_adhoc_commands: false,
		allow_logout: false,
		allow_message_corrections: getSetting("useUpDownCursorKeys") ? 'all' : false,
		allow_muc_invitations: true,		
		allow_non_roster_messaging: true,
		allow_registration: true,
		assets_path: "./dist/",
		allow_public_bookmarks: true,
		archived_messages_page_size: getSetting("archivedMessagesPageSize", 51),		
		authentication: 'login',
		auto_away: autoAway,
		auto_join_on_invite: getSetting("autoJoinOnInvite", false),
		auto_join_private_chats: autoJoinPrivateChats,
		auto_join_rooms: autoJoinRooms,
		auto_list_rooms: getSetting("autoListRooms", true),
		auto_login: password,		  
		auto_reconnect: getSetting("autoReconnectConverse", true),
		auto_subscribe: getSetting("autoSubscribe", false),
		auto_register_muc_nickname: getSetting("autoRegisterMucNick", false),
		auto_xa:  autoXa,
		bosh_service_url: boshServiceUrl,
		clear_cache_on_logout: getSetting("clearCacheOnConnect", true),
		clear_messages_on_reconnection: getSetting("clearCacheOnConnect", true),
		connection_options: { 'worker': getSetting("useWebworker", false) ? "./pade-connection-worker.js" : undefined },
		default_domain: domain,
		default_state: getSetting("converseOpenState", "online"),		
		discover_connection_methods: discoverConnectionMethods,		
		domain_placeholder: domain,
		enable_smacks: getSetting("enableSmacks", false),
		fullname: displayname,
		hide_offline_users: getSetting("hideOfflineUsers", false),	
		hide_open_bookmarks: true,	
		hide_muc_participants: !getSetting("alwaysShowOccupants", false),
		i18n: getSetting("language", "en"),	
		jid : anonUser ? domain : (username ? username + "@" + domain : undefined),				  
		locked_domain: domain,
		locked_muc_nickname: displayname,
		loglevel: getSetting("converseDebug", false) ? "debug" : "info",
		message_archiving: 'always',
		message_archiving_timeout: 30000,
		message_carbons: getSetting("messageCarbons", true),
		muc_domain: "conference." + domain,
		muc_fetch_members: getSetting("fetchMembersList", false),
		muc_history_max_stanzas: getSetting("archivedMessagesPageSize", 51),
		muc_mention_autocomplete_filter: getSetting("converseAutoCompleteFilter", "starts_with"),
		muc_nickname_from_jid: getSetting("autoCreateNickname", false),
		muc_show_info_messages: getSetting("showGroupChatStatusMessages", false) ? mucShowInfoMessages : [],
		muc_show_logs_before_join: true,
		muc_subscribe_to_rai: false,
		nickname: displayname,		
		notification_icon: './image.png',
		notify_all_room_messages: getSetting("notifyAllRoomMessages", false),
		notify_nicknames_without_references: true,
		password: anonUser ? undefined : ((password && password != "") ? password : undefined),
		persistent_store: getSetting("conversePersistentStore", 'none'),
		play_sounds: getSetting("conversePlaySounds", false),
		priority: 0,
		prune_messages_above: getSetting("pruneMessagesSize", 0),
		registration_domain: domain,
		render_media: getSetting("renderMedia", true),
		roster_groups: getSetting("rosterGroups", false),
		show_controlbox_by_default: true,
		show_message_load_animation: true,	
		show_connection_url_input: false,		
		show_desktop_notifications: getSetting("notifyAllMessages", true),
		show_send_button: getSetting("showSendButton", true),
		show_client_info: false,
		show_images_inline: getSetting("renderMedia", true),
		show_chat_state_notifications: getSetting("notifyChatState", false),		
		singleton: (autoJoinRooms && autoJoinRooms.length == 1),			  
		sounds_path: "./dist/sounds/",
		theme: getSetting('converseTheme', 'concord'),					  
		view_mode: "fullscreen",
		voicechat: {
			hosts: {
				domain: getSetting("voiceChatDomain", domain),
				muc: 'conference.' + getSetting("voiceChatDomain", domain),
			},					
			serviceUrl: getSetting("voiceChatUri", (domain == "localhost" || location.protocol == "http:" ? "ws://" : "wss://") + server + '/ws/'),
			prefix: getSetting("voiceChatPrefix", "VC"),
			transcribe: getSetting("enableVoiceChatText", false),
			transcribeLanguage: getSetting("transcribeLanguage", "en-GB"),
			start:  'Start Voice Chat',
			stop: 'Stop Voice Chat',
			started: 'has started speaking',
			stopped: 'has stopped speaking'				
		},	
		jitsimeet_start_option: getSetting("ofmeetDisplayOptions", "into_chat_window"),
		jitsimeet_head_display_toggle: getSetting("ofMeetHeadDisplayToggle", false),
		jitsimeet_modal: !getSetting("converseEmbedOfMeet", true),		
		jitsimeet_url: getSetting("ofmeetUrl", (domain == "localhost" || location.protocol == "http:" ? "http://" : "https://") + server + "/ofmeet"),
		visible_toolbar_buttons: {'emoji': true, 'call': false, 'clear': true },
		websocket_url: getSetting("useWebsocket", false) ? wsServiceUrl : undefined,		
		whitelisted_plugins: whitelistedPlugins		
	}

    if (getSetting("showToolbarIcons", true))  {	
		setupPadeRoot();
	}

	console.debug("startConverse", config);
	converse.initialize(config);

}

function setupPadeRoot() {
	console.debug("setupPadeRoot - converse", converse);
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

			console.debug("setupPadeRoot - _converse", _converse);			

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

			_converse.api.waitUntil('bookmarksInitialized').then((initPade) => {
				const myNick = _converse.nickname || Strophe.getNodeFromJid(_converse.bare_jid);
				
				var bookmarkRoom = function bookmarkRoom(json)
				{
					//console.debug("bookmarkRoom", json);					
					
					let bookmark = _converse.bookmarks.findWhere({'jid': json.jid});

					if (!bookmark)
					{
						_converse.bookmarks.create({
							'jid': json.jid,
							'name': json.name,
							'autojoin': json.autojoin,
							'nick': myNick
						});
					}
					bookmark = _converse.bookmarks.findWhere({'jid': json.jid});
					_converse.bookmarks.markRoomAsBookmarked(bookmark);
				}

				if (getSetting("enableBookmarks", true))
				{
					const stanza = $iq({'from': _converse.connection.jid, 'type': 'get'}).c('query', { 'xmlns': "jabber:iq:private"}).c('storage', { 'xmlns': 'storage:bookmarks' });					
					_converse.connection.sendIQ(stanza, function(iq) {

						iq.querySelectorAll('conference').forEach(function(conf)
						{
							var jid = conf.getAttribute("jid");
							var name = conf.getAttribute("name");
							var avatar_uri = conf.getAttribute("avatar_uri");
							if (!name) name = Strophe.getNodeFromJid(jid);
							var autojoin = conf.getAttribute('autojoin') === 'true' || conf.getAttribute('autojoin') === '1';
							var json = {name, jid, autojoin, avatar_uri};

							//console.debug('server bookmarks received', myNick, json);
							if (_converse.bookmarks) bookmarkRoom(json);

						});

					}, function(error){
						console.error("bookmarks error", error);
					});
				}
			}).catch(function (err) {
				console.error('waiting for bookmarksInitialized error', err);
			});
			
			_converse.api.waitUntil('controlBoxInitialized').then(() => {

				_converse.api.waitUntil('bookmarksInitialized').then(() => {

					if (!getSetting("disablePadeStyling", false)) {						
						setupMUCAvatars();
						addControlFeatures();	

						if (getSetting("converseSimpleView", false))
						{
							handleActiveConversations();
						}	
					}						

				}).catch(function (err) {
					console.error('waiting for controlBoxInitialized error', err);
				});			

			}).catch(function (err) {
				console.error('waiting for controlBoxInitialized error', err);
			});		
					
			_converse.api.listen.on('connected', function() {
				if (!getSetting("disablePadeStyling", false)) {				
					setupTimer();
					addSelfBot();
					
					_converse.api.waitUntil('rosterContactsFetched').then(() => {
						if (getSetting("enableRssFeeds", false)) {					
							createFeedItem("pade-rss@" + _converse.connection.domain);
						}
					});
				}					

				if (_converse.connection.pass) {
					const username = Strophe.getNodeFromJid(_converse.connection.jid);
					setSetting("username", username);
					
					setupServiceWorker(_converse.connection.pass);	
					storeCredentials(_converse.connection.pass);
				}			

			   _converse.connection.addHandler(message => {
				   console.debug("muc invite handler", message);
					if (_converse.api.settings.get('auto_join_on_invite')) return;
					
					const x_el = message.querySelector("x");
					const from = Strophe.getBareJidFromJid(message.getAttribute('from'));
					const room_jid = x_el.getAttribute('jid');
					const reason = x_el.getAttribute('reason');
					const password = x_el.getAttribute('password');
					
					let contact = _converse.roster.get(from);
					contact = contact ? contact.getDisplayName() : from;	
					let body = `${contact} has invited you to join ${room_jid}`;					
					
					if (reason) {
						body = body + "\n" + reason;
					}	

					const options = {
						body,
						icon: "./icon.png",
						data: {from, contact, room_jid, reason, password},
						requireInteraction: true,
						actions: [
						  {action: 'join', title: 'Join', type: 'button', icon: './check-solid.png'},
						  {action: 'reject', title: 'Reject', type: 'button', icon: './times-solid.png'}		  
						]
					};

					if (serviceWorkerRegistration) 
					{
						if (!streamChannel) {
							streamChannel = new BroadcastChannel('pade.notification.action');
							
							streamChannel.addEventListener('message', event =>
							{
								console.debug("notificationclick", event);							
								const settings = {'bring_to_foreground': true};
								
								if (event.data.password) {
									settings.password = event.data.password;
								}
								
								window.focus();

								const chat = _converse.chatboxes.get(event.data.room_jid);
								
								if (chat) {
									chat.maybeShow(true);
								} else {	
									_converse.api.rooms.open(event.data.room_jid, settings, true);	
								}									
							});	
						}
						
						serviceWorkerRegistration.showNotification(room_jid, options);
					}
					
					return true;
					
			   }, 'jabber:x:conference', 'message');
  
			});

			_converse.api.listen.on('rosterContactInitialized', function(contact) {
				setAvatar(contact);
			});	
			
			_converse.api.listen.on('getMessageActionButtons', (el, buttons) => {
				
				if (el.model.get('body')) {
				   buttons.push({'i18n_text': __('Pin'),   	 'handler': ev => handlePinAction(el), 								'button_class': 'chat-msg__action-pin',         'icon_class': 'fa fa-paperclip',   'name': 'pade-pin'});			   
				   buttons.push({'i18n_text': __('Reply'),   'handler': ev => handleReplyAction(el),                    		'button_class': 'chat-msg__action-reply',       'icon_class': 'fas fa-arrow-left',  'name': 'pade-reply'});			   
				   buttons.push({'i18n_text': __('Like'),    'handler': ev => handleReactionAction(el.model, ':smiley:'),   	'button_class': 'chat-msg__action-thumbsup',    'icon_class': 'fa fa-check',   		'name': 'pade-thumbsup'});	
				   buttons.push({'i18n_text': __('Dislike'), 'handler': ev => handleReactionAction(el.model, ':disappointed:'), 'button_class': 'chat-msg__action-thumbsdownp', 'icon_class': 'fa fa-times', 		'name': 'pade-thumbsdown'});			   
				}
				return buttons;
			});	

            _converse.api.listen.on('chatRoomViewInitialized', function (view)
            {
                console.debug("chatRoomViewInitialized", view);
				addPadeUI();
				addPadeOccupantsUI(view);											
			});
			
            _converse.api.listen.on('chatBoxViewInitialized', function (view)
            {
                console.debug("chatBoxViewInitialized", view);
				addPadeUI();					
			});
			
			_converse.api.listen.on('chatBoxClosed', function (chatbox)
			{
				console.debug("chatBoxClosed", chatbox);
				addPadeUI();
				const activeDiv = document.getElementById("active-conversations");
				if (activeDiv) removeActiveConversation(chatbox, activeDiv);
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

function addPadeOccupantsUI(view) {
	const allBadges = document.querySelectorAll(".occupant-badges");	
	
	if (!allBadges || allBadges.length == 0) {
		setTimeout(() => {
			addPadeOccupantsUI(view);
		}, 1000);
		return;
	}
	
	console.debug("chatRoomViewInitialized - occupant element", allBadges);	
		
	view.model.occupants.forEach(occupant =>  {	
		if (!occupant.get('jid')) return;
		
        const element = document.getElementById(occupant.get('id'));
		
		if (element) {
			const badges = element.querySelector(".occupant-badges");				
			let padeEle = element.querySelector(".occupants-pade-chat");

			console.debug("chatRoomViewInitialized - occupant", occupant, element, badges, padeEle);	
			
			let html = "<span data-room-nick='" + occupant.get('nick') + "' data-room-jid='" + occupant.get('jid') + "' title='click to chat' class='badge badge-success'>chat</span>";

			if (_converse.bare_jid == occupant.get('jid'))
			{
				html = "<span data-room-nick='" + occupant.get('nick') + "' data-room-jid='" + occupant.get('jid') + "' class='badge badge-groupchat'>self</span>";
			}

			if (padeEle)
			{
				padeEle.innerHTML = html;
			}
			else {
				padeEle = newElement('span', null, html, 'occupants-pade-chat');
				badges.appendChild(padeEle);
				
				padeEle.addEventListener('click', function(ev)
				{
					ev.stopPropagation();

					const jid = ev.target.getAttribute('data-room-jid');
					const nick = ev.target.getAttribute('data-room-nick');

					if (jid && Strophe.getNodeFromJid(jid) && _converse.bare_jid != jid)
					{
						 _converse.api.chats.open(jid, {nickname: nick, fullname: nick, bring_to_foreground: true}, true).then(chat => {
							 if (!chat.vcard?.attributes.fullname) chat.vcard.set('fullname', nick);
							 if (!chat.vcard?.attributes.nickname) chat.vcard.set('nickname', nick);
						 });
					}

				}, false);				
			}	
		}			
	});	
}

function addPadeUI() {
	if (!getSetting("disablePadeStyling", false)) {			
		setTimeout(() => {
			addControlFeatures();
			setupMUCAvatars();			
		}, 3000);
	}
}

function setupTimer() {	
	//console.debug("setupTimer render");
	if (getSetting("converseTimeAgo", false)) setupTimeAgo();		
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

/*
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
*/	
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

		if (item && pade.ohun[jid] && pade.ohun[jid].peer)
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

function showOutgoingNotification() {		
	const options = {
		body: "Outgoing Call",
		icon: "./icon.png",
		data: {},
		requireInteraction: true,
		actions: [
          {action: 'call', title: 'Call', type: 'text', icon: './check-solid.png', placeholder: 'Type username, email or phone here..'},
		  {action: 'cancel', title: 'Cancel', type: 'button', icon: './times-solid.png'}		  
		]
	};
	serviceWorkerRegistration.showNotification("Dialer", options);
}

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

function handleReplyAction(el) {
	console.debug('handleReplyAction', el.model)
	
	let selectedText = window.getSelection().toString();
	const prefix = el.model.get('nick') || el.model.get('nickname') || "";
	
	if (!selectedText || selectedText == '') selectedText = el.model.get('message');
	replyChat(el.model, prefix + ' : ' + selectedText);
}

function handlePinAction(el) {
	const msgId = el.model.get('msgid');
	const message = el.model.get('message');
	const type = el.model.get('type');
	const nick = el.model.get('nick');
	const from = Strophe.getBareJidFromJid(el.model.get('from'));	
	const prefix = (type == "groupchat") ? nick + ": " : "";
	const pos = message.indexOf("\n");	
	const pinnedMessage = prefix + (pos == -1 ? message : message.substring(0, pos));	
	console.debug('handlePinAction', msgId, message, type, from, pinnedMessage, el.model);

	if (chrome.storage)
	{
		let pinned = {};

		chrome.storage.local.get('pinned', function(data) {
			if (data && data.pinned) pinned = data.pinned;
			pinned[from + "-" + msgId] = {from: from, msgId: msgId, message: pinnedMessage, nick: nick};

			chrome.storage.local.set({pinned: pinned}, function() {
			  console.debug('chrome.storage is set for pinned', pinned);
				const elmnt = document.querySelector('[data-msgid="' + msgId + '"]');	
				if (elmnt) elmnt.scrollIntoView({block: "end", inline: "nearest", behavior: "smooth"});					  
			});
		});
	}
}

function handleReactionAction(model, emoji) {
	console.debug('handleReactionAction', model, emoji);	
	const msgId = model.get('msgid');
	const type = model.get("type");	
	
	let target = getTargetJidFromMessageModel(model);	
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


function replyInverseChat(text) {
	var box = getSelectedChatBox();

	console.debug("replyInverseChat", text, box);

	if (box)
	{
		var textArea = box.el.querySelector('.chat-textarea');
		if (textArea) textArea.value = ">" + text + "\n\n";
	}
}

function replyChat(model, text) {
	console.debug("replyChat", model, text);
	
	const box = getChatBoxFromMessageModel(model);

	if (box)
	{
		var textArea = box.querySelector('.chat-textarea');
		if (textArea) textArea.value = ">" + text + "\n";
	}
}

function getTargetJidFromMessageModel(model) {
	const type = model.get("type");	
	let target = model.get('from_muc');
	
	if (type === "chat")  {
		target = model.get('jid');
		if (model.get('sender') === 'them') {
			target = model.get('from');
		}		
	}
	return target;
}
	
function getChatBoxFromMessageModel(model) {
	const view = _converse.chatboxviews.get(getTargetJidFromMessageModel(model));
	console.debug("getChatBoxFromMessageModel", view);
	return view;
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
	
    if (localStorage["store.settings." + name] && localStorage["store.settings." + name] != "undefined")
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
	}
}
	
function createFeedItem(from_jid) {
	const chatbox = _converse.chatboxes.create({
	  'id': from_jid,
	  'jid': from_jid,
	  'type': _converse.HEADLINES_TYPE,
	  'from': from_jid
	});		
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
		var httpUrl = url.startsWith("http") ? url.trim() : ( url.startsWith("chrome-extension") ? url : (getSetting("domain") == "localhost" || location.protocol == "http:" ? "http://" : "https://") + url.trim());
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
				chrome.windows.update(pade.webAppsWindow[url].id, {focused: true});				
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
    const url = getSetting("ofmeetUrl", (getSetting("domain") == "localhost" || location.protocol == "http:" ? "http://" : "https://") + getSetting("server") + "/ofmeet");
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


    return url + '/' + room + params;
}

function dndCheckClick(info)
{
    chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });

    if (!info.wasChecked && info.checked)
    {
        pade.busy = true;
        _converse.xmppstatusview.model.set("status", "dnd");

        chrome.browserAction.setBadgeText({ text: "DND" });
        chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Do not Disturb"});
    }
    else

    if (info.wasChecked && !info.checked)
    {
        pade.busy = false;
        _converse.xmppstatusview.model.set("status", "online");

        chrome.browserAction.setBadgeText({ text: "" });
        chrome.browserAction.setTitle({title: chrome.i18n.getMessage('manifest_shortExtensionName') + " - Connected"});
    }

}