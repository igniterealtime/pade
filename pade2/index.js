let Strophe, $iq, $msg, $pres, $build, b64_sha1, dayjs, _converse, html, _, __, Model, BootstrapModal;
const nickColors = {};

window.addEventListener("load", function()
{
	startConverse()
});

window.addEventListener("unload", function()
{

});
	
function startConverse() {
	const domain = getSetting("domain", location.hostname);
	const server = getSetting("server", location.host);
	const anonUser = getSetting("useAnonymous", false);
	const username = getSetting("username");
	const password = getSetting("password");
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

			document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Converse | " + chrome.runtime.getManifest().version;
			
			_converse.api.listen.on('VCardsInitialized', function(contact) {
				console.debug("VCardsInitialized", _converse.vcards);
				
				for (let i=0; i<_converse.vcards.models.length; i++)
				{	
					const contact = _converse.vcards.models[i];
					
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
						console.debug("VCardsInitialized", label);
					}	
				}

			});

			_converse.api.listen.on('connected', function() {
				if (_converse.api.waitUntil('controlBoxInitialized')) _converse.api.waitUntil('controlBoxInitialized').then(() => {

					var addControlFeatures = function()
					{
						const section = document.body.querySelector('.controlbox-section.profile.d-flex');

						if (!section)
						{
							setTimeout(addControlFeatures, 1000);
							return;
						}

						console.debug("addControlFeatures", section);

						const ofmeetButton = newElement('a', null, '<a class="controlbox-heading__btn open-ofmeet fas fa-video align-self-center" title="Meet Now!!"></a>');
						section.appendChild(ofmeetButton);

						ofmeetButton.addEventListener('click', function(evt)
						{
							evt.stopPropagation();
							//background.openVideoWindow("", "normal");

						}, false);

						const prefButton = newElement('a', null, '<a class="controlbox-heading__btn show-preferences fas fa-cog align-self-center" title="Preferences/Settings"></a>');
						section.appendChild(prefButton);

						prefButton.addEventListener('click', function(evt)
						{
							evt.stopPropagation();
							const url = chrome.extension.getURL("options/index.html");
							//openWebAppsWindow(url, null, 1300, 950);

						}, false);

						// add self for testing
						setTimeout(function() {
							openChat(Strophe.getBareJidFromJid(_converse.connection.jid), getSetting("displayname"), ["Bots"], true)
						});
					}

					addControlFeatures();

				}).catch(function (err) {
					console.error('waiting for controlBoxInitialized error', err);
				});
			});			
		}			
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
		websocket_url: (location.protocol == "http:" ? "ws:" : "wss:") + '//' + server + '/ws/',
		message_archiving: 'always',
		render_media: true,
        whitelisted_plugins: whitelistedPlugins		
	}		
	console.debug("startConverse", config);
	converse.initialize(config);

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

	console.debug("_createAvatar: " + nickname );
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