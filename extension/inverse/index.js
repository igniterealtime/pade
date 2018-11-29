window.addEventListener("unload", function()
{
    setSetting("chatWindow", {top: window.screenTop, left: window.screenLeft, width: window.outerWidth, height: window.outerHeight});
});

window.addEventListener("load", function()
{
    function getUniqueID()
    {
        return Math.random().toString(36).substr(2, 9);
    }

    function urlParam(name)
    {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (!results) { return undefined; }
        return unescape(results[1] || undefined);
    };

    var url = urlParam("url");
    var domain = getSetting("domain", null);

    if (url && (url.indexOf("im:") == 0 || url.indexOf("xmpp:") == 0) && window.location.hash == "")
    {
        var href = "index.html#converse/chat?jid=" + url.substring(3);
        if (url.indexOf("xmpp:") == 0) href = "index.html#converse/room?jid=" + url.substring(5);

        if (href.indexOf("@") == -1 && domain != null)
        {
            href = href + "@" + (url.indexOf("xmpp:") == 0 ? "conference." + domain : domain);
        }


        location.href = href;
    }

    if (!window.pade) document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Converse";

    if (getSetting("useTotp", false) || getSetting("useWinSSO", false) || getSetting("useCredsMgrApi", false) || getSetting("useSmartIdCard", false))
    {
        converse.env.Strophe.addConnectionPlugin('ofchatsasl',
        {
            init: function (connection)
            {
                converse.env.Strophe.SASLOFChat = function () { };
                converse.env.Strophe.SASLOFChat.prototype = new converse.env.Strophe.SASLMechanism("OFCHAT", true, 2000);

                converse.env.Strophe.SASLOFChat.test = function (connection)
                {
                    return getSetting("password", null) !== null;
                };

                converse.env.Strophe.SASLOFChat.prototype.onChallenge = function (connection)
                {
                    var token = getSetting("username", null) + ":" + getSetting("password", null);
                    console.log("Strophe.SASLOFChat", token);
                    return token;
                };

                connection.mechanisms[converse.env.Strophe.SASLOFChat.prototype.name] = converse.env.Strophe.SASLOFChat;
                console.log("strophe plugin: ofchatsasl enabled");
            }
        });
    }

    if (getSetting("useClientCert", false))
    {
        console.log("useClientCert enabled");

        converse.env.Strophe.addConnectionPlugin('externalsasl',
        {
            init: function (connection)
            {
                converse.env.Strophe.SASLExternal = function() {};
                converse.env.Strophe.SASLExternal.prototype = new converse.env.Strophe.SASLMechanism("EXTERNAL", true, 2000);

                converse.env.Strophe.SASLExternal.test = function (connection)
                {
                    return connection.authcid !== null;
                };

                converse.env.Strophe.SASLExternal.prototype.onChallenge = function(connection)
                {
                    return connection.authcid === connection.authzid ? '' : connection.authzid;
                };

                connection.mechanisms[converse.env.Strophe.SASLExternal.prototype.name] = converse.env.Strophe.SASLExternal;
                console.log("strophe plugin: externalsasl enabled");
            }
        });
    }
    var server = getSetting("server", null);

    if (server)
    {
        var domain = getSetting("domain", null);
        var username = getSetting("username", null);
        var password = getSetting("password", null);
        var displayname = getSetting("displayname", username);

        var connUrl = undefined;

        if (getSetting("useWebsocket", true))
        {
            connUrl = "wss://" + server + "/ws/";
        }

        var whitelistedPlugins = ["search", "options", "webmeet", "pade"];
        var viewMode = window.pade ? 'overlayed' : 'fullscreen';

        if (getSetting("useMarkdown", false))
        {
            whitelistedPlugins.push("markdown");
        }

        var config =
        {
          allow_bookmarks: true,
          allow_non_roster_messaging: getSetting("allowNonRosterMessaging", true),
          allow_public_bookmarks: true,
          allow_logout: false,
          authentication: "login",
          auto_away: 300,
          auto_xa: 900,
          auto_list_rooms: getSetting("allowNonRosterMessaging", false),
          auto_login: username != null,
          auto_reconnect: getSetting("autoReconnect", true),
          bosh_service_url: "https://" + server + "/http-bind/",
          debug: getSetting("converseDebug", false),
          default_domain: domain,
          domain_placeholder: domain,
          fullname: getSetting("displayname", null),
          hide_open_bookmarks: true,
          i18n: getSetting("language", "en"),
          jid : getSetting("username", null) + "@" + getSetting("domain", null),
          locked_domain: domain,
          message_archiving: "always",
          message_carbons: getSetting("messageCarbons", true),
          muc_domain: "conference." + getSetting("domain", null),
          notify_all_room_messages: getSetting("notifyAllRoomMessages", false),
          notification_icon: '../image.png',
          webmeet_invitation: getSetting("ofmeetInvitation", 'Please join meeting at'),
          webinar_invitation: getSetting("webinarInvite", 'Please join webinar at'),
          password: getSetting("password", null),
          play_sounds: getSetting("conversePlaySounds", false),
          roster_groups: getSetting("rosterGroups", false),
          show_message_load_animation: false,
          sounds_path: 'sounds/',
          view_mode: viewMode,
          visible_toolbar_buttons: {'emoji': true, 'call': getSetting("enableSip", false), 'clear': true },
          websocket_url: connUrl,
          whitelisted_plugins: whitelistedPlugins
        };

        converse.initialize( config );
    }
});

window.addEventListener('message', function (event)
{
    //console.log("inverse addListener message", event.data);

    if (event.data && event.data.action)
    {
        if (event.data.action == "pade.action.open.chat") openChat(event.data.from, event.data.name);
        if (event.data.action == "pade.action.open.chat.panel") openChatPanel(event.data.from);
        if (event.data.action == "pade.action.open.group.chat") openGroupChat(event.data.jid, event.data.label, event.data.nick, event.data.properties);
    }
});

function openChat(from, name)
{
    if (_inverse)
    {
        if (!name)
        {
            name = from.split("@")[0];
            if (name.indexOf("sms-") == 0) name = name.substring(4);
        }

        var contact = _converse.roster.findWhere({'jid': from});
        if (!contact) _inverse.roster.addAndSubscribe(from, name);
        _inverse.api.chats.open(from);
    }
}

function openChatPanel(from)
{
    if (_inverse) _inverse.api.chats.open(from);
}

function openGroupChat(jid, label, nick, properties)
{
    console.log("openGroupChat", jid, label, nick, properties);

    if (_inverse)
    {
        if (!properties) properties = {name: label, nick: nick};

        _inverse.api.rooms.open(jid, properties);

        console.log("openGroupChat - subject", properties.question);

        if (properties.question)
        {
            setTimeout(function()
            {
                _inverse.connection.send(inverse.env.$msg({
                    to: jid,
                    from: _inverse.connection.jid,
                    type: "groupchat"
                }).c("subject", {
                    xmlns: "jabber:client"
                }).t(properties.question).tree());

            }, 1000);
        }
    }
}
function getSetting(name, defaultValue)
{
    var localStorage = window.localStorage
    //console.log("getSetting", name, defaultValue, localStorage["store.settings." + name]);

    if (window.pade)
    {
        if (name == "username") return window.pade.username;
        if (name == "password") return window.pade.password;
        if (name == "domain") return window.pade.domain;
        if (name == "server") return window.pade.server;
    }

    var value = defaultValue;

    if (localStorage["store.settings." + name])
    {
        value = JSON.parse(localStorage["store.settings." + name]);

        if (name == "password") value = getPassword(value, localStorage);

    } else {
        if (defaultValue) localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }

    return value;
}

function setSetting(name, value)
{
    //console.log("setSetting", name, value);
    window.localStorage["store.settings." + name] = JSON.stringify(value);
}

function getPassword(password, localStorage)
{
    if (!password || password == "") return null;
    if (password.startsWith("token-")) return atob(password.substring(6));

    localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(password));
    return password;
}
var avatars = {}

function createAvatar(nickname, width, height, font)
{
    if (avatars[nickname])
    {
        return avatars[nickname];
    }

    if (!width) width = 32;
    if (!height) height = 32;
    if (!font) font = "16px Arial";

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

    var first, last;
    var name = nickname.split(" ");
    var l = name.length - 1;

    if (name && name[0] && name.first != '')
    {
        first = name[0][0];
        last = name[l] && name[l] != '' && l > 0 ? name[l][0] : null;

        if (last) {
            var initials = first + last;
            context.fillText(initials.toUpperCase(), 3, 23);
        } else {
            var initials = first;
            context.fillText(initials.toUpperCase(), 10, 23);
        }
        var data = canvas.toDataURL();
        document.body.removeChild(canvas);
    }

    avatars[nickname] = canvas.toDataURL();
    return avatars[nickname];
}

var nickColors = {}

function getRandomColor(nickname)
{
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