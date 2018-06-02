var uportWin = null;

window.addEventListener("unload", function ()
{
    if (uportWin)
    {
        chrome.windows.remove(uportWin.id);
        uportWin = null;
    }
});

window.addEvent("domready", function () {

    chrome.windows.onRemoved.addListener(function(win)
    {
        if (uportWin && win == uportWin.id)
        {
            uportWin = null;
        }
    });

    document.getElementById("settings-label").innerHTML = chrome.i18n.getMessage('manifest_shortExtensionName')

    doDefaults();

    new FancySettings.initWithManifest(function (settings)
    {
        var background = chrome.extension.getBackgroundPage();
        var avatar = getSetting("avatar");

        if (avatar)
        {
            document.getElementById("avatar").innerHTML = "<img style='width: 64px;' src='" + avatar + "' />";
        }

        settings.manifest.uploadAvatar.element.innerHTML = "<input id='uploadAvatar' type='file' name='files[]'>";

        document.getElementById("uploadAvatar").addEventListener('change', function(event)
        {
            uploadAvatar(event, settings);
        });

        settings.manifest.uploadApp.element.innerHTML = "<input id='uploadApplication' type='file' name='files[]'>";

        document.getElementById("uploadApplication").addEventListener('change', function(event)
        {
            uploadApplication(event, settings);
        });

        setDefaultPassword(settings);

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

        settings.manifest.enableInverse.addEvent("action", function ()
        {
            if (getSetting("enableInverse"))
            {
                background.addInverseMenu();

            } else {
               background.removeInverseMenu();
            }
        });

        settings.manifest.enableTouchPad.addEvent("action", function ()
        {
            if (getSetting("enableTouchPad"))
            {
                background.addTouchPadMenu();

            } else {
               background.removeTouchPadMenu();
            }
        });

        settings.manifest.enableOffice365Business.addEvent("action", function ()
        {
            if (getSetting("enableOffice365Business"))
            {
                background.addOffice365Business();

            } else {
               background.removeOffice365Business();
            }
        });

        settings.manifest.enableOffice365Personal.addEvent("action", function ()
        {
            if (getSetting("enableOffice365Personal"))
            {
                background.addOffice365Personal();

            } else {
               background.removeOffice365Personal();
            }
        });

        settings.manifest.enableWebApps.addEvent("action", function ()
        {
            if (getSetting("enableWebApps"))
            {
                background.addWebApps();

            } else {
               background.removeWebApps();
            }
        });

        settings.manifest.enableGmail.addEvent("action", function ()
        {
            if (getSetting("enableGmail"))
            {
                background.addGmail();

            } else {
               background.removeGmail();
            }
        });

        settings.manifest.enableSip.addEvent("action", function ()
        {
            background.reloadApp();
        });

        settings.manifest.useTotp.addEvent("action", function ()
        {
            background.reloadApp();
        });

        settings.manifest.useClientCert.addEvent("action", function ()
        {
            setDefaultPassword(settings);
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

        settings.manifest.enableBlast.addEvent("action", function ()
        {
            if (getSetting("enableBlast"))
            {
                background.addBlastMenu();

            } else {
               background.removeBlastMenu();
            }
        });

        settings.manifest.enableAVCapture.addEvent("action", function ()
        {
            if (getSetting("enableAVCapture"))
            {
                background.addAVCaptureMenu();

            } else {
               background.removeAVCaptureMenu();
            }
        });

        settings.manifest.enableVerto.addEvent("action", function ()
        {
            if (getSetting("enableVerto"))
            {
                background.addVertoMenu();

            } else {
               background.removeVertoMenu();
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

        settings.manifest.qrcode.addEvent("action", function ()
        {
            if (window.localStorage["store.settings.server"])
            {
                var host = JSON.parse(window.localStorage["store.settings.server"]);
                var url = "https://" + host + "/meet/qrcode.jsp";

                chrome.windows.create({url: url, focused: true, type: "popup"}, function (win)
                {
                    chrome.windows.update(win.id, {drawAttention: true, width: 380, height: 270});
                });
            }
        });


        settings.manifest.registerUrlProtocols.addEvent("action", function ()
        {
            navigator.registerProtocolHandler("im",  chrome.extension.getURL("inverse/index.html?url=%s"), "Pade - Conversation");
            navigator.registerProtocolHandler("xmpp",  chrome.extension.getURL("inverse/index.html?url=%s"), "Pade - Meeting");
        });

        settings.manifest.uport.addEvent("action", function ()
        {
            if (getSetting("useUport"))
            {
                if (uportWin)
                {
                    chrome.windows.update(uportWin.id, {drawAttention: true, focused: true});

                } else {
                    var url = chrome.extension.getURL("uport/index.html");

                    chrome.windows.create({url: url, focused: true, type: "popup"}, function (win)
                    {
                        uportWin = win;
                        chrome.windows.update(win.id, {drawAttention: true, width: 500, height: 700});
                    });
                }
            }
        });

        settings.manifest.certificate.addEvent("action", function ()
        {
            if (window.localStorage["store.settings.server"])
            {
                var host = JSON.parse(window.localStorage["store.settings.server"]);
                var username = JSON.parse(window.localStorage["store.settings.username"]);
                var password = getPassword(JSON.parse(window.localStorage["store.settings.password"]));

                var url =  "https://" + host + "/rest/api/restapi/v1/chat/certificate";
                var options = {method: "GET", headers: {"authorization": "Basic " + btoa(username + ":" + password)}};

                console.log("fetch", url, options);

                fetch(url, options).then(function(response){ return response.blob()}).then(function(blob)
                {
                    chrome.downloads.download({url: URL.createObjectURL(blob)});

                }).catch(function (err) {
                    console.error('connection error', err);
                });

            }
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
                lynks.password = getPassword(JSON.parse(window.localStorage["store.settings.password"]));

                if (lynks.server && lynks.domain && lynks.username && lynks.password)
                {
                    var connection = background.getConnection("https://" + lynks.server + "/http-bind/");

                    connection.connect(lynks.username + "@" + lynks.domain + "/" + lynks.username, lynks.password, function (status)
                    {
                        //console.log("status", status);

                        if (status === 5)
                        {
                            background.reloadApp();
                        }
                        else

                        if (status === 4)
                        {
                            setDefaultPassword(settings);
                            settings.manifest.status.element.innerHTML = '<b>bad username or password</b>';
                        }
                    });
                }
                else {
                    if (!lynks.server) settings.manifest.status.element.innerHTML = '<b>bad server</b>';
                    if (!lynks.domain) settings.manifest.status.element.innerHTML = '<b>bad domain</b>';
                    if (!lynks.username) settings.manifest.status.element.innerHTML = '<b>bad username</b>';
                    if (!lynks.password) settings.manifest.status.element.innerHTML = '<b>bad password</b>';
                }

            } else settings.manifest.status.element.innerHTML = '<b>bad server, domain, username or password</b>';
        }
    });


});

function doDefaults()
{
    // connection
    setSetting("uportPermission", chrome.i18n.getMessage("uport_permission"));

    // preferences
    setSetting("popupWindow", true);
    setSetting("enableLipSync", false);
    setSetting("enableChat", false);
    setSetting("audioOnly", false);
    setSetting("enableSip", false);
    setSetting("enableBlog", false);

    // config


    // user interface
    setSetting("CAPTIONS_SUBTITLES", true);
    setSetting("VERTICAL_FILMSTRIP", true);
    setSetting("FILM_STRIP_MAX_HEIGHT", 90);

    // candy chat
    setSetting("chatWithOnlineContacts", true);
    setSetting("notifyWhenMentioned", true);

    // converse
    setSetting("enableInverse", true);
    setSetting("allowNonRosterMessaging", true);
    setSetting("rosterGroups", true);
    setSetting("autoReconnect", true);

    // web apps
    setSetting("webApps", "web.skype.com, web.whatsapp.com");
}

function setDefaultPassword(settings)
{
    settings.manifest.password.element.disabled = false;

    if (settings.manifest.useClientCert.element.checked)
    {
        settings.manifest.password.element.disabled = true;
        setSetting("password", settings.manifest.username.element.value);
    }
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

function removeSetting(name)
{
    localStorage.removeItem("store.settings." + name);
}

function getPassword(password)
{
    if (!password || password == "") return null;
    if (password.startsWith("token-")) return atob(password.substring(6));

    window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(password));
    return password;
}

function uploadApplication(event, settings)
{
    //console.log("uploadApplication", event);

    if (window.localStorage["store.settings.server"] && window.localStorage["store.settings.username"] && window.localStorage["store.settings.password"])
    {
        var files = event.target.files;
        var server = JSON.parse(window.localStorage["store.settings.server"]);
        var username = JSON.parse(window.localStorage["store.settings.username"]);
        var password = getPassword(JSON.parse(window.localStorage["store.settings.password"]));

        for (var i = 0, file; file = files[i]; i++)
        {
            console.log("upload", file);

            if (file.name.endsWith(".zip"))
            {
                var putUrl = "https://" + server + "/dashboard/upload?name=" + file.name + "&username=" + username;
                var req = new XMLHttpRequest();

                req.onreadystatechange = function()
                {
                  if (this.readyState == 4 && this.status >= 200 && this.status < 400)
                  {
                    console.log("pade.upload.app", this.statusText);
                    settings.manifest.uploadStatus.element.innerHTML = '<b>' + this.statusText + '</b>';
                  }
                  else

                  if (this.readyState == 4 && this.status >= 400)
                  {
                    console.error("pade.upload.error", this.statusText);
                    settings.manifest.uploadStatus.element.innerHTML = '<b>' + this.statusText + '</b>';
                  }

                };
                req.open("PUT", putUrl, true);
                req.setRequestHeader("Authorization", 'Basic ' + btoa(username+':'+password));
                req.send(file);
            } else {
                settings.manifest.uploadStatus.element.innerHTML = '<b>application file must be a zip file</b>';
            }
        }

    } else {
        settings.manifest.uploadStatus.element.innerHTML = '<b>user not configured</b>';
    }
}

function uploadAvatar(event, settings)
{
    settings.manifest.uploadAvatarStatus.element.innerHTML = "Please wait...";

    var files = event.target.files;
    var background = chrome.extension.getBackgroundPage();

    var domain = JSON.parse(window.localStorage["store.settings.domain"]);
    var username = JSON.parse(window.localStorage["store.settings.username"]);
    var jid = username + "@" + domain

    for (var i = 0, file; file = files[i]; i++)
    {
        if (file.name.endsWith(".png") || file.name.endsWith(".jpg"))
        {
            var reader = new FileReader();

            reader.onload = function(event)
            {
                dataUri = event.target.result;
                console.log("uploadAvatar", dataUri);

                window.localStorage["store.settings.avatar"] = JSON.stringify(dataUri);

                var sourceImage = new Image();

                sourceImage.onload = function() {
                    var canvas = document.createElement("canvas");
                    canvas.width = 32;
                    canvas.height = 32;
                    canvas.getContext("2d").drawImage(sourceImage, 0, 0, 32, 32);

                    background.getVCard(jid, function(vCard)
                    {
                        console.log("uploadAvatar - get vcard", vCard);
                        vCard.avatar = canvas.toDataURL();

                        background.setVCard(vCard, function(resp)
                        {
                            console.log("uploadAvatar - set vcard", resp);
                            setTimeout(function() {location.reload();}, 500);

                        }, avatarError);

                    }, avatarError);
                }

                sourceImage.src = dataUri;
            };

            reader.onerror = function(event) {
                console.error("uploadAvatar - error", event);
                settings.manifest.uploadAvatarStatus.element.innerHTML = '<b>File could not be read! Code ' + event.target.error.code;
            };

            reader.readAsDataURL(file);

        } else {
            settings.manifest.uploadAvatarStatus.element.innerHTML = '<b>image file must be a png or jpg file</b>';
        }
    }
}


function avatarError(error)
{
    console.error("uploadAvatar - error", error);
    settings.manifest.uploadAvatarStatus.element.innerHTML = '<b>picture/avatar cannot be uploaded and saved</b>';
}

