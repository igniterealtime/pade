var bgWindow = null;

window.addEventListener("load", function()
{
    document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Converse";
    document.getElementById("brand-heading").innerHTML = "<img src='../image.png' />&nbsp;&nbsp;" + document.title;

    function getUniqueID()
    {
        return Math.random().toString(36).substr(2, 9);
    }

    chrome.runtime.getBackgroundPage(function(win)
    {
        bgWindow = win;

        if (getSetting("useTotp", false))
        {
            console.log("useTotp enabled");

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

            if (getSetting("useWebsocket", false))
            {
                connUrl = "wss://" + server + "/ws/";
            }

            var config =
            {
              authentication: "login",
              auto_login: true,
              muc_domain: "conference." + getSetting("domain", null),
              jid : getSetting("username", null) + "@" + getSetting("domain", null),
              password: getSetting("password", null),
              domain_placeholder: domain,
              registration_domain: domain,
              locked_domain: domain,
              whitelisted_plugins: ["converse-singleton", "converse-inverse", "pade"],
              blacklisted_plugins: ["converse-minimize", "converse-dragresize"],
              bosh_service_url: "https://" + server + "/http-bind/",
              websocket_url: connUrl,

              auto_away: 300,
              message_archiving: "always",
              i18n: "en",
              debug: getSetting("converseDebug", false),
              notify_all_room_messages: getSetting("notifyAllRoomMessages", false),
              message_carbons: getSetting("messageCarbons", false),
              auto_reconnect: getSetting("autoReconnect", true),
              roster_groups: getSetting("rosterGroups", true),
              allow_non_roster_messaging: getSetting("allowNonRosterMessaging", true)
            };

            converse.initialize( config );
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