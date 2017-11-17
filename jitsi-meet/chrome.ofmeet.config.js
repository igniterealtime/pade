var room = urlParam("room");
var OFMEET_CONFIG = {};

if (window.localStorage["store.settings.server"])
{
    var __server = JSON.parse(window.localStorage["store.settings.server"]);
    var __domain = JSON.parse(window.localStorage["store.settings.domain"]);
    var __displayname = JSON.parse(window.localStorage["store.settings.displayname"]);
    var __username = JSON.parse(window.localStorage["store.settings.username"]);
    var __password = JSON.parse(window.localStorage["store.settings.password"]);

	OFMEET_CONFIG = {
		emailAddress:'',
		nickName:__displayname ? __displayname : __username,
		userAvatar: null,
		authorization: btoa(__username + ":" + __password),

		isSwitchAvailable: false,
		callcontrol:'callcontrol.' + __domain,
		sip:__server,
		hostname: __server,
		room: room,
		domain:__domain
	};

	window.addEventListener("load", function()
	{
		chrome.runtime.getBackgroundPage(function(win)
		{
			OFMEET_CONFIG.userAvatar = win.pade.avatar;
			OFMEET_CONFIG.activeUrl = win.pade.activeUrl;

			APP.conference.changeLocalAvatarUrl(OFMEET_CONFIG.userAvatar);
		});
	});

	window.addEventListener('message', function (event)
	{
		console.log("addListener message collab", event);
	});
}

function urlParam(name)
{
	var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (!results) { return undefined; }
	return unescape(results[1] || undefined);
};

function ofmeetEtherpadClicked()
{
	console.log("ofmeetEtherpadClicked", OFMEET_CONFIG.activeUrl);

	if (OFMEET_CONFIG.activeUrl)
	{
		if (OFMEET_CONFIG.documentShare)
		{
			OFMEET_CONFIG.documentShare = false;
			document.getElementById("largeVideoContainer").innerHTML = OFMEET_CONFIG.largeVideoContainer;
		}
		else {
			OFMEET_CONFIG.documentShare = true;
			OFMEET_CONFIG.largeVideoContainer = document.getElementById("largeVideoContainer").innerHTML;

			var url = OFMEET_CONFIG.activeUrl;

			if (OFMEET_CONFIG.activeUrl.indexOf(".pdf") > -1)
			{
				url = chrome.extension.getURL("pdf/index.html?pdf=" + OFMEET_CONFIG.activeUrl);
			}

			document.getElementById("largeVideoContainer").innerHTML = '<iframe src=' + url + ' id="ofmeet-content" style="width: 100%; height: 100%; border: 0;">';
		}
	}
}