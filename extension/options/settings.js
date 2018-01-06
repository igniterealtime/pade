window.addEvent("domready", function () {

    doDefaults();

    new FancySettings.initWithManifest(function (settings)
    {
        var background = chrome.extension.getBackgroundPage();

        settings.manifest.connect.addEvent("action", function ()
        {
            reloadApp()
        });

        settings.manifest.search.addEvent("action", function ()
        {
            background.findUsers(settings.manifest.searchString.element.value, function(users)
            {
                //console.log("findUsers", users);

                var html = "";

                for (var i=0; i<users.length; i++)
                {
                    var user = users[i];
                    html = html + "<a title='" + user.name + "' name='" + user.room + "' id='" + user.jid + "' href='#'>" + user.name + "</a><br/>";
                }

                if (html == "") html = "No user found";

                settings.manifest.searchResults.element.innerHTML = "<p/><p/>" + html;

                for (var i=0; i<users.length; i++)
                {
                    document.getElementById(users[i].jid).addEventListener("click", function(e)
                    {
                        var user = e.target;
                        console.log("findUsers click", user.id, user.title, user.name);

                        background.acceptCall(user.title, user.id, user.name);
                        background.inviteToConference(user.id, user.name);
                    });
                }
            });
        });

        settings.manifest.popupWindow.addEvent("action", function ()
        {
            if (getSetting("popupWindow"))
            {
                chrome.browserAction.setPopup({popup: ""});

            } else {
                chrome.browserAction.setPopup({popup: "popup.html"});
            }
        });

        settings.manifest.enableChat.addEvent("action", function ()
        {
            if (getSetting("enableChat"))
            {
                background.addChatMenu();

            } else {
               background.removeChatMenu();
            }
        });

        settings.manifest.enableSip.addEvent("action", function ()
        {
            background.reloadApp();
        });

        settings.manifest.enableBlog.addEvent("action", function ()
        {
            if (getSetting("enableBlog"))
            {
                background.addBlogMenu();

            } else {
               background.removeBlogMenu();
            }
        });

        settings.manifest.desktopShareMode.addEvent("action", function ()
        {
            background.reloadApp();
        });

        settings.manifest.showOnlyOnlineUsers.addEvent("action", function ()
        {
            background.reloadApp();
        });

        function reloadApp(){

            openAppWindow()
        }

    function openAppWindow()
    {
        if (window.localStorage["store.settings.server"] && window.localStorage["store.settings.domain"] && window.localStorage["store.settings.username"] && window.localStorage["store.settings.password"])
        {
            var lynks = {};

            lynks.server = JSON.parse(window.localStorage["store.settings.server"]);
            lynks.domain = JSON.parse(window.localStorage["store.settings.domain"]);
            lynks.username = JSON.parse(window.localStorage["store.settings.username"]);
            lynks.password = JSON.parse(window.localStorage["store.settings.password"]);

            if (lynks.server && lynks.domain && lynks.username && lynks.password)
            {
                background.reloadApp();
            }
            else {
                if (!lynks.server) settings.manifest.status.element.innerHTML = '<b>bad server</b>';
                if (!lynks.domain) settings.manifest.status.element.innerHTML = '<b>bad domain</b>';
                if (!lynks.username) settings.manifest.status.element.innerHTML = '<b>bad username</b>';
                if (!lynks.password) settings.manifest.status.element.innerHTML = '<b>bad password</b>';
            }

            } else settings.manifest.status.element.innerHTML = '<b>bad bad server, domain, username or password</b>';
    }
    });


});

function doDefaults()
{
    // preferences
    setSetting("desktopShareMode", false)
    setSetting("showOnlyOnlineUsers", true)
    setSetting("popupWindow", true);
    setSetting("useJabra", false);
    setSetting("useWebsocket", false);
    setSetting("disableAudioLevels", false);
    setSetting("enableLipSync", false);
    setSetting("enableChat", false);
    setSetting("audioOnly", false);
    setSetting("enableSip", false);
    setSetting("enableBlog", false);

    // config
    setSetting("startWithAudioMuted", false);
    setSetting("startWithVideoMuted", false);

    // user interface
    setSetting("VERTICAL_FILMSTRIP", true);
    setSetting("FILM_STRIP_MAX_HEIGHT", 90);

    // candy chat
    setSetting("chatWithOnlineContacts", true);
    setSetting("notifyWhenMentioned", true);

}

function setSetting(name, defaultValue)
{
    console.log("setSetting", name, defaultValue);

    if (!window.localStorage["store.settings." + name])
    {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }
}

function getSetting(name)
{
    //console.log("getSetting", name);
    var value = null;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);
    }

    return value;
}