var OFMEET_CONFIG = {};

if (window.localStorage["store.settings.server"])
{
	// mandatory

    var __server = JSON.parse(window.localStorage["store.settings.server"]);
    var __domain = JSON.parse(window.localStorage["store.settings.domain"]);
    var __displayname = JSON.parse(window.localStorage["store.settings.displayname"]);
    var __username = JSON.parse(window.localStorage["store.settings.username"]);
    var __password = JSON.parse(window.localStorage["store.settings.password"]);

    // optional
    var __enableSip = window.localStorage["store.settings.enableSip"] && JSON.parse(window.localStorage["store.settings.enableSip"]);
    var __showSharedCursor = window.localStorage["store.settings.showSharedCursor"] && JSON.parse(window.localStorage["store.settings.showSharedCursor"]);


	OFMEET_CONFIG = {
		emailAddress:'',
		nickName:__displayname ? __displayname : __username,
		userAvatar: null,
		authorization: btoa(__username + ":" + __password),

		isSwitchAvailable: __enableSip,
		showSharedCursor: __showSharedCursor,
		callcontrol:'callcontrol.' + __domain,
		sip:__server,
		hostname: __server,
		room: urlParam("room"),
		domain:__domain
	};

	window.addEventListener("load", function()
	{
		chrome.runtime.getBackgroundPage(function(win)
		{
			OFMEET_CONFIG.bgWin = win;
			OFMEET_CONFIG.userAvatar = win.pade.avatar;
			OFMEET_CONFIG.activeUrl = win.pade.activeUrl;

			APP.conference.changeLocalAvatarUrl(OFMEET_CONFIG.userAvatar);
		});
	});
}

function urlParam(name)
{
	var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (!results) { return undefined; }
	return unescape(results[1] || undefined);
};

