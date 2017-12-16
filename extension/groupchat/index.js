var config = {};
var bgWindow = null;

window.addEventListener("load", function()
{
    function getUniqueID()
    {
        return Math.random().toString(36).substr(2, 9);
    }

    chrome.runtime.getBackgroundPage(function(win)
    {
        bgWindow = win;
        var server = getSetting("server", null);

        if (server)
        {
            var domain = getSetting("domain", null);
            var username = getSetting("username", null);
            var password = getSetting("password", null);
            var displayname = getSetting("displayname", username);

            var autojoin = true;
            var room = urlParam("room");
            var jid = urlParam("jid");
            var name = urlParam("name");

            var connUrl = "https://" + server + "/http-bind/";

            if (getSetting("useWebsocket", false))
            {
                connUrl = "wss://" + server + "/ws/";
            }

            if (room)
            {
                autojoin = [room + "@" + "conference." + domain];
            }
            else

            if (jid)
            {
                autojoin = [];
                if (!name) name = Strophe.getNodeFromJid(jid);
            }

            Candy.init(connUrl, {core: {debug: false, autojoin: autojoin}, view: { assets: 'res/' }});

            $(Candy).on('candy:core.chat.connection', function(obj, data)
            {
                switch(data.status)
                {
                    case Strophe.Status.CONNECTED:
                        if (jid)

                        setTimeout(function()
                        {
                            Candy.View.Pane.PrivateRoom.open(jid, name, true, true);
                        }, 500);
                }
            });

            if (getSetting("chatWithOnlineContacts", true))
            {
                CandyShop.Roster.init();
            }

            CandyShop.SlashCommands.defaultConferenceDomain = "conference." + domain;
            CandyShop.SlashCommands.init();
            CandyShop.Timeago.init();
            CandyShop.TypingNotifications.init();
            CandyShop.Colors.init();
            CandyShop.Upload.init();
            CandyShop.OfMeet.init(win);
            CandyShop.Mam.init();
            CandyShop.Fastpath.init();

            Candy.Core.connect(username + "@" + domain + "/" + username  + "-" + Math.random().toString(36).substr(2,9), password, username);

            if (getSetting("notifyWhenMentioned", true))
            {
                CandyShop.NotifyMe.init(win, null);
            }

        }
    });
});

function urlParam(name)
{
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (!results) { return undefined; }
    return unescape(results[1] || undefined);
};

function getSetting(name, defaultValue)
{
    console.log("getSetting", name, defaultValue);

    var value = defaultValue;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);

    } else {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }

    return value;
}