var uportWin = null, credWin = null, message_handler;

window.addEventListener("load", function()
{
    console.debug("options loaded");
	
	document.getElementById("avatar").addEventListener("click", () => {
		location.href= "./../index.html";
	});
	
})

window.addEventListener("unload", function ()
{
    console.debug("options unloaded");
});

window.addEvent("domready", function () {

    var background = chrome.extension?.getBackgroundPage();
	
	if (chrome.i18n) {
		document.getElementById("settings-label").innerHTML = chrome.i18n.getMessage('settings')
	}

    doDefaults(background);

    new FancySettings.initWithManifest(function (settings)
    {
        var avatar = getSetting("avatar");

        if (avatar)
        {
            document.getElementById("avatar").innerHTML = "<img style='width: 64px;' src='" + avatar + "' />";
        }

        if (chrome.i18n)
        {
            document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " | Settings";
        }

        if (settings.manifest.connect) settings.manifest.connect.addEvent("action", function ()
        {
			location.href= "./../index.html";
        });

        if (settings.manifest.cannedResponses)
        {
            var planner = settings.manifest.cannedResponses.element;
            planner.innerHTML = "<iframe frameborder='0' style='border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:700px;' src='canned/index.html'></iframe>";
        }

        if (settings.manifest.exportPreferences) settings.manifest.exportPreferences.addEvent("action", function ()
        {
            exportPreferences(settings);
        });

        if (settings.manifest.importPreferences)
        {
            settings.manifest.importPreferences.element.innerHTML = "<input id='importPreferences' type='file' name='files[]'>";

            document.getElementById("importPreferences").addEventListener('change', function(event)
            {
                importPreferences(event, settings);
            });
        }

        if (settings.manifest.uploadApp)
        {
            settings.manifest.uploadApp.element.innerHTML = "<input id='uploadApplication' type='file' name='files[]'>";

            document.getElementById("uploadApplication").addEventListener('change', function(event)
            {
                uploadApplication(event, settings, background);
            });
        }

        setDefaultPassword(settings);

        if (settings.manifest.connect) settings.manifest.connect.addEvent("action", function ()
        {
			location.href = "./../index.html";
        });

        if (settings.manifest.remoteConnect) settings.manifest.remoteConnect.addEvent("action", function ()
        {
            var host = getSetting("server", null);
            var hostname = host.split(":")[0]

            if (hostname)
            {
                var creds = "";
                var username = getSetting("remoteUsername", "");
                var password = getSetting("remotePassword", "");

                if (username != "")
                {
                    creds = creds + "&user=" + username
                }

                if (password != "")
                {
                    creds = creds + "&pwd=" + password
                }

                var url = "http://" + hostname + "/rdpdirect.html?gateway=" + hostname + "&server=" + getSetting("remoteHost", hostname) + "&domain=" + getSetting("remoteDomain") + "&color=16" + creds;
                openWebAppsWindow(url, null, screen.availWidth, screen.availHeight);
            }
        });

        if (settings.manifest.converseTheme) settings.manifest.converseTheme.addEvent("action", function ()
        {
            reloadConverse();
        });

        if (settings.manifest.publishLocation && settings.manifest.userLocation)
        {
            var setPublish = function()
            {
                settings.manifest.userLocation.element.innerHTML = getSetting("publishLocation", false) ? "<iframe frameborder='0' style='border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:600px;' src='location/index.html'></iframe>" : "";
            }

            settings.manifest.publishLocation.addEvent("action", setPublish);
            setPublish();
        }

        var enterToClick = function (text, button)
        {
            if (settings.manifest[text]) settings.manifest[text].element.addEventListener("keyup", function(event)
            {
              if (event.keyCode === 13)
              {
                event.preventDefault();
                settings.manifest[button].element.click();
              }
            });
        }

        enterToClick("password", "connect");
        enterToClick("searchString", "search");
        enterToClick("convSearchString", "convSearch");
        enterToClick("roomsSearchString", "roomsSearch");

        var setAnonBasicAuth = function()
        {
            if (settings.manifest.username) settings.manifest.username.element.parentElement.style.display = getSetting("useAnonymous", false) || getSetting("useBasicAuth", false) ? "none" : "";
            if (settings.manifest.password) settings.manifest.password.element.parentElement.style.display = getSetting("useAnonymous", false) || getSetting("useBasicAuth", false) ? "none" : "";
            if (settings.manifest.register) settings.manifest.register.element.parentElement.style.display = getSetting("useAnonymous", false) ? "none" : "";
        }
        setAnonBasicAuth();

        if (settings.manifest.useAnonymous)
        {
            settings.manifest.useAnonymous.addEvent("action", setAnonBasicAuth);
        }

        if (settings.manifest.useBasicAuth)
        {
            settings.manifest.useBasicAuth.addEvent("action", setAnonBasicAuth);
        }

        if (settings.manifest.enableCannedResponses)
        {
            settings.manifest.enableCannedResponses.addEvent("action", function ()
            {
                settings.manifest.cannedResponses.element.style = getSetting("enableCannedResponses") ? "display:initial;" : "display: none;";
            });

            // default
            settings.manifest.cannedResponses.element.style = getSetting("enableCannedResponses") ? "display:initial;" : "display: none;";
        }


        if (settings.manifest.enableFriendships) settings.manifest.enableFriendships.addEvent("action", function ()
        {
            location.reload()
        });

        if (settings.manifest.useStreamDeck) settings.manifest.useStreamDeck.addEvent("action", function ()
        {
            location.reload()
        });

        if (settings.manifest.enableOffice365Business) settings.manifest.enableOffice365Business.addEvent("action", function ()
        {
            if (getSetting("enableOffice365Business"))
            {
                addOffice365Business();

            } else {
               removeOffice365Business();
            }
        });

        if (settings.manifest.enableOffice365Personal) settings.manifest.enableOffice365Personal.addEvent("action", function ()
        {
            if (getSetting("enableOffice365Personal"))
            {
                addOffice365Personal();

            } else {
               removeOffice365Personal();
            }
        });

        if (settings.manifest.enableWebApps) settings.manifest.enableWebApps.addEvent("action", function ()
        {
            if (getSetting("enableWebApps"))
            {
                addWebApps();

            } else {
               removeWebApps();
            }
        });

        if (settings.manifest.enableGmail) settings.manifest.enableGmail.addEvent("action", function ()
        {
            if (getSetting("enableGmail"))
            {
                //background.addGmail();

            } else {
               //background.removeGmail();
            }
        });

        if (settings.manifest.changelog) settings.manifest.changelog.addEvent("action", function ()
        {
            location.href = "../changelog.html";
        });

        if (settings.manifest.help) settings.manifest.help.addEvent("action", function ()
        {
            location.href = chrome.runtime.getManifest ? chrome.runtime.getManifest().homepage_url : "";
        });

        if (settings.manifest.useTotp) settings.manifest.useTotp.addEvent("action", function ()
        {
            location.reload();
        });

        if (settings.manifest.useWinSSO) settings.manifest.useWinSSO.addEvent("action", function ()
        {
            setDefaultSetting("password", "__DEFAULT__WINSSO__")
            location.reload();
        });

        if (settings.manifest.enableRemoteControl) settings.manifest.enableRemoteControl.addEvent("action", function ()
        {
            location.reload()
        });

        if (settings.manifest.enableHomePage) settings.manifest.enableHomePage.addEvent("action", function ()
        {
            reloadConverse();
        });

        if (settings.manifest.factoryReset) settings.manifest.factoryReset.addEvent("action", function ()
        {
            let keepSettings = false;

            if (confirm("Reset?"))
            {
                sessionStorage.clear();
                localStorage.clear();
                if (chrome.storage) chrome.storage.local.clear();
				
				window.location.reload();
            }
        });

        if (settings.manifest.enableBlog) settings.manifest.enableBlog.addEvent("action", function ()
        {
            if (getSetting("enableBlog"))
            {
                addBlogMenu();

            } else {
               removeBlogMenu();
            }
        });

        if (settings.manifest.enableBlast) settings.manifest.enableBlast.addEvent("action", function ()
        {
            if (getSetting("enableBlast"))
            {
                addBlastMenu();

            } else {
              removeBlastMenu();
            }
        });

        if (settings.manifest.enableDrawIO) settings.manifest.enableDrawIO.addEvent("action", function ()
        {
            if (getSetting("enableDrawIO"))
            {
                addDrawIOMenu();

            } else {
               removeDrawIOMenu();
            }
        });

        if (settings.manifest.registerUrlProtocols && chrome.extension) settings.manifest.registerUrlProtocols.addEvent("action", function ()
        {
            if (getSetting("registerIMProtocol"))
            {
                navigator.registerProtocolHandler("im",  chrome.extension.getURL("inverse/index.html?url=%s"), "Pade - Conversation");
            }

            if (getSetting("registerXMPPProtocol"))
            {
                navigator.registerProtocolHandler("xmpp",  chrome.extension.getURL("inverse/index.html?url=%s"), "Pade - Meeting");
            }

            if (getSetting("registerSIPProtocol"))
            {
                navigator.registerProtocolHandler("sip",  chrome.extension.getURL("webcam/sip-video.html?url=%s"), "Pade - SIP VideoConference");
            }

            if (getSetting("registerTELProtocol"))
            {
                navigator.registerProtocolHandler("tel",  chrome.extension.getURL("phone/index-ext.html?url=%s"), "Pade - Phone");
            }
        });

        if (settings.manifest.certificate && chrome.downloads) settings.manifest.certificate.addEvent("action", function ()
        {
            if (window.localStorage["store.settings.server"])
            {
                var host = JSON.parse(window.localStorage["store.settings.server"]);
                var username = JSON.parse(window.localStorage["store.settings.username"]);
                var password = getPassword(JSON.parse(window.localStorage["store.settings.password"]));

                var url =  "https://" + host + "/rest/api/restapi/v1/chat/certificate";
                var options = {method: "GET", headers: {"authorization": "Basic " + btoa(username + ":" + password)}};

                console.debug("fetch certificate", url, options);

                fetch(url, options).then(function(response){ return response.blob()}).then(function(blob)
                {
                    chrome.downloads.download({url: URL.createObjectURL(blob)});

                }).catch(function (err) {
                    console.error('connection error', err);
                    settings.manifest.status.element.innerHTML = '<b style="color:red">Client Cert Error ' + err + '</b>';
                });

            }
        });

        if (settings.manifest.friendCreate) settings.manifest.friendCreate.addEvent("action", function ()
        {
            var host = getSetting("server", null);

            if (host)
            {
                var domain = getSetting("domain");
                var username = getSetting("username");
                var password = getPassword(JSON.parse(window.localStorage["store.settings.password"]));
                var friendId = getSetting("friendId");
                var friendType = getSetting("friendType", "xmpp");
                var friendName = getSetting("friendName", "Unknown");

                if (friendType == "xmpp")
                {
                    if (friendId.indexOf("@") == -1)
                    {
                        friendId = friendId + "@" + domain;
                    }
                }
                else

                if (friendType == "email")
                {
                    if (friendId.indexOf("@") == -1)
                    {
                        alert("Invalid Email Address")
                        return;
                    }

                    var temp = friendId.split("@");
                    friendId = temp[0] + "\\40" + temp[1] + "@" + domain;
                }
                else

                if (friendType == "sms")
                {
                    if (friendId.indexOf("+") == 0)
                    {
                        friendId = friendId.substring(1);
                    }

                    friendId = "sms-" + friendId + "@" + domain;
                }


                var body = {
                  "jid": friendId,
                  "nickname": friendName,
                  "groups": getSetting("friendGroups", ""),
                };

                var url =  "https://" + host + "/rest/api/restapi/v1/meet/friend";
                var permission =  "Basic " + btoa(username + ":" + password);
                var options = {method: "POST", headers: {"authorization": permission, "content-type": "application/json"}, body: JSON.stringify(body)};

                console.debug("fetch friendCreate", url, options);

                fetch(url, options).then(function(response)
                {
                    setTimeout(function() {alert('Created : ' + friendName + "\n" + friendId);});

                }).catch(function (err) {
                    setTimeout(function() {alert('Error : ' + err);});
                    console.error('friendCreate error', err);
                });

            }
        });

        if (settings.manifest.saveProfile) settings.manifest.saveProfile.addEvent("action", function ()
        {
            var host = getSetting("server", null);

            if (host)
            {
                var domain = getSetting("domain");
                var username = getSetting("username");
                var password = getPassword(JSON.parse(window.localStorage["store.settings.password"]));

                var phone   = getSetting("phone");
                var sms     = getSetting("sms");
                var url     = getSetting("url");
                var country = getSetting("country");
                var role    = getSetting("role");
                var email   = getSetting("email");
                var exten   = getSetting("exten");

                var body = []

                if (phone)      body.push({"name": "sms_in_number", "value": phone});
                if (sms)        body.push({"name": "sms_out_number", "value": sms});
                if (exten)      body.push({"name": "caller_id_number", "value": exten});
                if (url)        body.push({"name": "pade.profile.url", "value": url});
                if (country)    body.push({"name": "pade.profile.country", "value": country});
                if (role)       body.push({"name": "pade.profile.role", "value": role});
                if (email)      body.push({"name": "pade.profile.email", "value": email});

                if (body.length > 0)
                {
                    var url =  "https://" + host + "/rest/api/restapi/v1/meet/profile";
                    var permission =  "Basic " + btoa(username + ":" + password);
                    var options = {method: "POST", headers: {"authorization": permission, "content-type": "application/json"}, body: JSON.stringify(body)};

                    console.debug("fetch saveProfile", url, options);

                    fetch(url, options).then(function(response)
                    {
                        setTimeout(function() {alert('Profile Saved');});

                    }).catch(function (err) {
                        setTimeout(function() {alert('Error : ' + err);});
                        console.error('saveProfile error', err);
                    });
                }
            }
        });
    });

});

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function doDefaults(background)
{
    if (!chrome.extension)    // browser mode
    {
        setDefaultSetting("server", location.host);
        setDefaultSetting("domain", location.hostname);
        setDefaultSetting("useBasicAuth", false);
        setDefaultSetting("converseEmbedOfMeet", true);
        setDefaultSetting("useWebsocket", false);
    }
    else {
        setDefaultSetting("useWebsocket", true);
    }

    // connection
    setDefaultServer();

    // preferences
    setDefaultSetting("language", "en");
    setDefaultSetting("friendType", "xmpp");
    setDefaultSetting("enableLipSync", false);
    setDefaultSetting("audioOnly", false);
    setDefaultSetting("enableBlog", false);
    setDefaultSetting("showSharedCursor", true);
    setDefaultSetting("idleTimeout", 300);
	setDefaultSetting("pruneMessagesSize", 0);
	setDefaultSetting("renderMedia", true);
	setDefaultSetting("notifyAllMessages", true);
	setDefaultSetting("useUpDownCursorKeys", true);

    // config
    setDefaultSetting("startBitrate", 800);
    setDefaultSetting("resolution", 720);
    setDefaultSetting("minHDHeight", 540);
    setDefaultSetting("disableAudioLevels", true);

    // meeting
    setDefaultSetting("showCaptions", false);
    setDefaultSetting("enableTranscription", false);
    setDefaultSetting("transcribeLanguage", "en-GB");
    setDefaultSetting("VERTICAL_FILMSTRIP", true);
    setDefaultSetting("FILM_STRIP_MAX_HEIGHT", 90);
    setDefaultSetting("INITIAL_TOOLBAR_TIMEOUT", 20000);
    setDefaultSetting("TOOLBAR_TIMEOUT", 4000);
    setDefaultSetting("plannerNotice", 10);
    setDefaultSetting("plannerExpire", 15);
    setDefaultSetting("plannerCheck", 5);

    // community
    setDefaultSetting("chatWithOnlineContacts", true);
    setDefaultSetting("notifyWhenMentioned", true);

    setDefaultSetting("enableAdaptiveCardViewer", true);
    setDefaultSetting("conversePersistentStore", 'IndexedDB')
    setDefaultSetting("clearCacheOnConnect", true);
	setDefaultSetting("enableMucDirectory", true);
    setDefaultSetting("allowNonRosterMessaging", true);
    setDefaultSetting("autoListRooms", true);
    setDefaultSetting("autoReconnectConverse", true);
    setDefaultSetting("messageCarbons", true);
    setDefaultSetting("converseAutoStart", true);
    setDefaultSetting("showGroupChatStatusMessages", true);
    setDefaultSetting("converseTheme", "concord");
    setDefaultSetting("enableHomePage", true);
    setDefaultSetting("homePageView", "fullscreen");
    setDefaultSetting("homePage", chrome.runtime.getManifest().homepage_url);
    setDefaultSetting("converseOpenState", "online");
    setDefaultSetting("converseCloseState", "online");
    setDefaultSetting("enableBookmarks", true);
    setDefaultSetting("notifyRoomMentions", true);
    setDefaultSetting("notifyWhenClosed", true);
    setDefaultSetting("enableInfoPanel", true);
    setDefaultSetting("enablePasting", true);
    setDefaultSetting("converseAutoReOpen", true);
    setDefaultSetting("archivedMessagesPageSize", 51);
    setDefaultSetting("allowMsgPinning", true);
    setDefaultSetting("allowMsgReaction", true);
    setDefaultSetting("useMarkdown", true);
    setDefaultSetting("showToolbarIcons", true);
    setDefaultSetting("enableNotesTool", true);
    setDefaultSetting("enableDirectorySearch", true);
    // most people don't want this
    //setDefaultSetting("enableRssFeeds", true);
    setDefaultSetting("rssFeedCheck", 30);
    setDefaultSetting("beeFeedCheck", 10);
    setDefaultSetting("beeKeeperPageSize", 25);
    setDefaultSetting("alwaysShowOccupants", true);
    setDefaultSetting("moderatorTools", true);
    setDefaultSetting("converseAutoCompleteFilter", "contains");
    setDefaultSetting("converseTimeAgo", true);

    // most people won't want this
    //setDefaultSetting("enableVoiceChat", false);	
    //setDefaultSetting("enableVoiceChatText", true);

    // web apps
    setDefaultSetting("webApps", "web.skype.com, web.whatsapp.com, web.telegram.org, www.messenger.com, messages.google.com");

    // only office
    setDefaultSetting("onlyOfficeVersion", "5.2.2-2");
    setDefaultSetting("onlyzoom", 100);
    setDefaultSetting("onlycomments", true);
    setDefaultSetting("onlychat", true);
    setDefaultSetting("onlyleftMenu", true);
    setDefaultSetting("onlyrightMenu", true);
    setDefaultSetting("onlyheader", true);
    setDefaultSetting("onlystatusBar", true);
    setDefaultSetting("onlyautosave", true);
}

function setDefaultServer()
{
    if (!window.localStorage["store.settings.server"] || !window.localStorage["store.settings.domain"])
    {
        var doTheSetup = function(domain, server)
        {
            setDefaultSetting("server", server);
            setDefaultSetting("domain", domain);

            fetch("https://" + server + "/pade.json", {method: "GET"}).then(function(response){if (!response.ok) throw Error(response.statusText); return response.json()}).then(function(json)
            {
                console.debug("setDefaultServer - found branding", json);
                var overrides = Object.getOwnPropertyNames(json);

                for (var i=0; i<overrides.length; i++)
                {
                    var setting = overrides[i];
                    var override = json[setting];

                    if (override.value)
                    {
                        console.debug("setDefaultServer - overrride", setting, override.value);
                        window.localStorage["store.settings." + setting] = JSON.stringify(override.value);
                    }
                }

                if (getSetting("useWinSSO", false))
                {
                    setDefaultSetting("password", "__DEFAULT__WINSSO__");
                }

                window.location.reload();

            }).catch(function (err) {
                console.error('setDefaultServer pade.json file error', err);
                alert("Auto Configuartion error\n" + err);
                window.location.reload();
            });
        }

        if (chrome.tabs) chrome.tabs.query({}, function(tabs)
        {
            if (tabs)
            {
                var option_tab = tabs.filter(function(t) { return t.url.indexOf("/ofmeet") > -1; });    // depends on app name not changing

                console.debug("setDefaultServer - found tabs", option_tab, tabs);

                if (option_tab.length > 0)
                {
                    var url = option_tab[0].url.split("/");
                    var server = url[2];
                    var domain = url[2].split(":")[0];

                    console.debug("setDefaultServer - found ofmeet web page", server, domain, url);

                    fetch("https://" + server + "/ofmeet/config.js", {method: "GET"}).then(function(response){ return response.text()}).then(function(text)
                    {
                        var pos = text.indexOf("\"domain\": \"");

                        if (pos > -1)
                        {
                            var temp = text.substring(pos + 11);
                            pos = temp.indexOf("\"");
                            temp = temp.substring(0, pos);

                            if (temp != "")
                            {
                                domain = temp;
                                console.debug("setDefaultServer - found domain from config.js", domain);
                            }
                        }

                        if (confirm("Auto-Configure\n\nDomain: " + domain + "\nServer: " + server + "\n\nAre you sure??"))
                        {
                            doTheSetup(domain, server);
                        }

                    }).catch(function (err) {
                        console.warn('setDefaultServer config.js file error. using domain ' + domain, err);
                        doTheSetup(domain, server);
                    });
                }
            }
        });
    }
}

function setDefaultPassword(settings)
{
    if (settings.manifest.password)
    {
        settings.manifest.password.element.disabled = false;
    }
}

function setSetting(name, value)
{
    console.debug("setSetting", name, value);
    window.localStorage["store.settings." + name] = JSON.stringify(value);
}

function setDefaultSetting(name, defaultValue)
{
    console.debug("setDefaultSetting", name, defaultValue, window.localStorage["store.settings." + name]);

    if (!window.localStorage["store.settings." + name] && window.localStorage["store.settings." + name] != false)
    {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }
}

function getSetting(name, defaultValue)
{
    console.debug("getSetting", name);
    var value = defaultValue ? defaultValue : null;

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

function uploadApplication(event, settings, background)
{
    console.debug("uploadApplication", event);

    if (window.localStorage["store.settings.server"] && window.localStorage["store.settings.username"] && window.localStorage["store.settings.password"])
    {
        var files = event.target.files;
        var server = JSON.parse(window.localStorage["store.settings.server"]);
        var username = JSON.parse(window.localStorage["store.settings.username"]);
        var password = getPassword(JSON.parse(window.localStorage["store.settings.password"]));

        for (var i = 0, file; file = files[i]; i++)
        {
            console.debug("upload", file);

            if (file.name.endsWith(".zip") || file.name.endsWith(".h5p"))
            {
                var putUrl = "https://" + server + "/dashboard/upload?name=" + file.name + "&username=" + username;
                var req = new XMLHttpRequest();

                settings.manifest.uploadStatus.element.innerHTML = '<b style="color:green">uploading...</b>';

                req.onreadystatechange = function()
                {
                  if (this.readyState == 4 && this.status >= 200 && this.status < 400)
                  {
                    console.debug("pade.upload.app", this.statusText);
                    settings.manifest.uploadStatus.element.innerHTML = '<b style="color:red">' + this.statusText + '</b>';

                    setTimeout(function()
                    {
                         //background.reloadApp();

                    }, 2000);
                  }
                  else

                  if (this.readyState == 4 && this.status >= 400)
                  {
                    console.error("pade.upload.error", this.statusText);
                    settings.manifest.uploadStatus.element.innerHTML = '<b style="color:red">' + this.statusText + '</b>';
                  }

                };
                req.open("PUT", putUrl, true);
                req.setRequestHeader("Authorization", 'Basic ' + btoa(username+':'+password));
                req.send(file);
            } else {
                settings.manifest.uploadStatus.element.innerHTML = '<b style="color:red">application file must be a zip file</b>';
            }
        }

    } else {
        settings.manifest.uploadStatus.element.innerHTML = '<b style="color:red">user not configured</b>';
    }
}

function exportPreferences(settings)
{
    settings.manifest.importExportStatus.element.innerHTML = 'Exporting preferences, please wait....';
    const brandingExport = JSON.parse(JSON.stringify(branding));

    for (var i = 0; i < localStorage.length; i++)
    {
        if (localStorage.key(i).startsWith("store.settings.") && localStorage.key(i).indexOf("password") == -1)
        {
            const key = localStorage.key(i).substring(15);
            settings.manifest.importExportStatus.element.innerHTML = 'Processing....' + localStorage.key(i);

            if (!brandingExport[key] || brandingExport[key] == false || brandingExport[key] == "false" ) {
				brandingExport[key] = {disable: false};
			}
            brandingExport[key].value = localStorage.getItem(localStorage.key(i));
        }
    }

    console.log("exportPreferences", brandingExport);

    const blob = new Blob([JSON.stringify(brandingExport)], {type: "application/json"});

	if (chrome.downloads) {
		chrome.downloads.download({url: URL.createObjectURL(blob), filename: "pade.json"}, function(id)
		{
			settings.manifest.importExportStatus.element.innerHTML = 'Exported....pade.json';
		});
	}
}


function importPreferences(event, settings)
{
    if (event.target.files.length > 0)
    {
        var file = event.target.files[0];
        settings.manifest.importExportStatus.element.innerHTML = "Importing preferences from " + file.name;

            var reader = new FileReader();

            reader.onload = function(event)
            {
                try {
                    const json = JSON.parse(event.target.result);
                    const keys = Object.getOwnPropertyNames(json);

                    console.log("importPreferences", keys);

                    for (var i=0; i<keys.length; i++)
                    {
                        window.localStorage["store.settings." + keys[i]] = json[keys[i]].value;
                    }

                    window.location.reload();

                } catch (ex) {
                    console.error("importPreferences - error", ex);
                    settings.manifest.importExportStatus.element.innerHTML = '<b style="color:red">File could not be read! Error ' + ex;
                }
            };

            reader.onerror = function(event) {
                console.error("importPreferences - error", event);
                settings.manifest.importExportStatus.element.innerHTML = '<b style="color:red">File could not be read! Error ' + event.target.error.code;
            };

            reader.readAsText(file);

    } else {
        settings.manifest.importExportStatus.element.innerHTML = '<b style="color:red">No file was selected</b>';
    }
}


function reloadConverse()
{
	location.href = "/index.html";
}

function startSmartIdLogin(callback)
{
    if (getSetting("useSmartIdCardCert", false))
    {
        callback("https://" + getSetting("server", location.host) + "/pade/smartidcardcert");
        console.log("startSmartIdLogin via certicate");
    }
    else {
        var buttonUrl = "https://id.smartid.ee/oauth/authorize?client_id=s5D6gnTwOqmFISb7KY5maMe2XgEcKNOa&redirect_uri=https://igniterealtime.github.io/Pade/index.html&response_type=code";
        var idTab = null;

        var gup = function (url, name)
        {
            name = name.replace(/[[]/, "\[").replace(/[]]/, "\]");
            var regexS = "[\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(url);

            if (results == null) return ""; else return results[1];
        }

        chrome.tabs.create({url: buttonUrl, active: true}, function(tab)
        {
            console.log("startSmartIdLogin tab", tab);
            idTab = tab;

            chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab2)
            {
                if (tabId == idTab.id && changeInfo.url && changeInfo.url.startsWith("https://igniterealtime.github.io/Pade/index.html"))
                {
                    var code = gup(changeInfo.url, 'code');
                    if (idTab) chrome.tabs.remove(idTab.id);
                    callback("https://" + getSetting("server", location.host) + "/pade/smartidcard?code=" + code);
                    console.log("startSmartIdLogin via smartid.ee", code);
                }
            })
        });
    }
}

