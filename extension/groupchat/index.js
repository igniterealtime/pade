var config = {};
var bgWindow = null;

if (getSetting("useClientCert", false))
{
    console.log("useClientCert enabled");

    Strophe.addConnectionPlugin('externalsasl',
    {
        init: function (connection)
        {
            Strophe.SASLExternal = function() {};
            Strophe.SASLExternal.prototype = new Strophe.SASLMechanism("EXTERNAL", true, 2000);

            Strophe.SASLExternal.test = function (connection)
            {
                return connection.authcid !== null;
            };

            Strophe.SASLExternal.prototype.onChallenge = function(connection)
            {
                return connection.authcid === connection.authzid ? '' : connection.authzid;
            };

            connection.mechanisms[Strophe.SASLExternal.prototype.name] = Strophe.SASLExternal;
            console.log("strophe plugin: externalsasl enabled");
        }
    });
}

if (getSetting("useTotp", false))
{
    console.log("useTotp enabled");

    Strophe.addConnectionPlugin('ofchatsasl',
    {
        init: function (connection)
        {
            Strophe.SASLOFChat = function () { };
            Strophe.SASLOFChat.prototype = new Strophe.SASLMechanism("OFCHAT", true, 2000);

            Strophe.SASLOFChat.test = function (connection)
            {
                return getSetting("password", null) !== null;
            };

            Strophe.SASLOFChat.prototype.onChallenge = function (connection)
            {
                var token = getSetting("username", null) + ":" + getSetting("password", null);
                console.log("Strophe.SASLOFChat", token);
                return token;
            };

            connection.mechanisms[Strophe.SASLOFChat.prototype.name] = Strophe.SASLOFChat;
            console.log("strophe plugin: ofchatsasl enabled");
        }
    });
}

window.addEventListener("load", function()
{
    setTimeout(function()
    {
        document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Group Chat";

    }, 1000);

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
    //console.log("getSetting", name, defaultValue);

    var value = defaultValue;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);

        if (name == "password") value = getPassword(value);

    } else {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }

    return value;
}

function getPassword(password)
{
    if (!password || password == "") return null;
    if (password.startsWith("token-")) return atob(password.substring(6));

    window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(password));
    return password;
}

