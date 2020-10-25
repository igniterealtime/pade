var uportWin = null, credWin = null, message_handler;

window.addEventListener("load", function()
{
    console.debug("options loaded");
})

window.addEventListener("unload", function ()
{
    console.debug("options unloaded");

    setSetting(location.href, {top: window.screenTop, left: window.screenLeft, width: window.outerWidth, height: window.outerHeight});

    if (uportWin) chrome.windows.remove(uportWin.id);
    if (credWin) chrome.windows.remove(credWin.id);
});

window.addEvent("domready", function () {

    chrome.windows.onRemoved.addListener(function(win)
    {
        if (uportWin && win == uportWin.id) uportWin = null;
        if (credWin && win == credWin.id) credWin = null;
    });

    var background = chrome.extension.getBackgroundPage();
    document.getElementById("settings-label").innerHTML = chrome.i18n.getMessage('settings')

    doDefaults(background);

    new FancySettings.initWithManifest(function (settings)
    {
        var avatar = getSetting("avatar");

        if (avatar)
        {
            document.getElementById("avatar").innerHTML = "<img style='width: 64px;' src='" + avatar + "' />";
        }

        if (chrome.pade)    // browser mode
        {
            //settings.manifest.server.element.parentElement.style.display = "none";
            //settings.manifest.domain.element.parentElement.style.display = "none";
            //settings.manifest.connect.element.parentElement.style.display = "none";

            document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " | Settings";
        }

        if (settings.manifest.meetingPlanner)
        {
            var planner = settings.manifest.meetingPlanner.element;
            planner.innerHTML = "<iframe frameborder='0' style='border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:700px;' src='../calendar/index.html'></iframe>";
        }

        if (settings.manifest.cannedResponses)
        {
            var planner = settings.manifest.cannedResponses.element;
            planner.innerHTML = "<iframe frameborder='0' style='border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:700px;' src='canned/index.html'></iframe>";
        }

        if (settings.manifest.uploadAvatar)
        {
            settings.manifest.uploadAvatar.element.innerHTML = "<input id='uploadAvatar' type='file' name='files[]'>";

            document.getElementById("uploadAvatar").addEventListener('change', function(event)
            {
                uploadAvatar(event, settings);
            });
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
            background.closeChatWindow();
            background.openChatWindow("inverse/index.html");
            window.close();
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
                background.openWebAppsWindow(url, null, screen.availWidth, screen.availHeight);
            }
        });

        if (settings.manifest.converseTheme) settings.manifest.converseTheme.addEvent("action", function ()
        {
            reloadConverse(background);
        });

        if (settings.manifest.publishLocation && settings.manifest.userLocation)
        {
            var setPublish = function()
            {
                settings.manifest.userLocation.element.innerHTML = getSetting("publishLocation", false) ? "<iframe frameborder='0' style='border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:600px;' src='location/index.html'></iframe>" : "";
                background.publishUserLocation();
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

        if (settings.manifest.convPdf) settings.manifest.convPdf.addEvent("action", function ()
        {
            var keywords = settings.manifest.convSearchString.element.value;

            if (!keywords || keywords.length == 0)
            {
                settings.manifest.convSearchResults.element.innerHTML = i18n.get("Enter the keywords delimted by space");
                return;
            }

            background.pdfConversations(keywords, function(blob, error)
            {
                if (!error) chrome.downloads.download({url: URL.createObjectURL(blob), filename: "conversations" + Math.random().toString(36).substr(2,9) + ".pdf"}, function(id)
                {
                    console.debug("PDF downloaded", id);
                });
            });

        });

        if (settings.manifest.convSearch) settings.manifest.convSearch.addEvent("action", function ()
        {
            var keywords = settings.manifest.convSearchString.element.value;

            if (!keywords || keywords.length == 0)
            {
                settings.manifest.convSearchResults.element.innerHTML = i18n.get("Enter the keywords delimted by space");
                return;
            }

            background.searchConversations(keywords, function(html, conversations)
            {
                settings.manifest.convSearchResults.element.innerHTML = html;

                for (var i=0; i<conversations.length; i++)
                {
                    try {
                        document.getElementById("conversation-" + conversations[i].conversationID).addEventListener("click", function(e)
                        {
                            e.stopPropagation();

                            if (e.target.title && getSetting("enableInverse"))
                            {
                                if (background.pade.chatWindow.id)
                                {
                                    chrome.extension.getViews({windowId: background.pade.chatWindow.id})[0].openChatPanel(e.target.title);
                                }
                                else {
                                    background.openChatWindow("inverse/index.html#converse/chat?jid=" + e.target.title);
                                }
                            }
                        }, false);

                    } catch (e) {

                    }
                }
            });
        });

        if (settings.manifest.roomsSearch) settings.manifest.roomsSearch.addEvent("action", function ()
        {
            var searchString = settings.manifest.roomsSearchString.element.value;
            var foundRooms = [];

            settings.manifest.roomsSearchResults.element.innerHTML = "please wait....";

            var messageHandler = function(message)
            {
                var body = message.querySelector('body');
                var from = message.querySelector('forwarded').querySelector('message').getAttribute('from');

                var timestamp = undefined;
                var delay = message.querySelector('forwarded').querySelector('delay');
                if (delay) timestamp = delay.getAttribute('stamp');
                var stamp = moment(timestamp).format('MMM DD YYYY HH:mm:ss')

                if (body)
                {
                    const nick = from.split("/")[1];
                    const room = from.split("/")[0];
                    const msg = body.innerHTML;
                    const div = document.getElementById("pade-room-conv-" + room);

                    console.debug("roomsSearch message", stamp, nick, room, msg, message, div);

                    if (div)
                    {
                        div.innerHTML = div.innerHTML + stamp + " <b>" + nick + "</b> " + msg + "<br/>"
                    }

                }

                return true;

            }

            background.findRooms(function(items)
            {
                console.debug("roomsSearch", items);

                if (message_handler) background.pade.connection.deleteHandler(message_handler);
                message_handler = background.pade.connection.addHandler(messageHandler, 'urn:xmpp:mam:2', 'message');

                var html = "<table style='margin-left: 15px'><tr><th>Name</th><th>Conversation</th></tr>";

                for (var i=0; i<items.length; i++)
                {
                    var jid = items[i].getAttribute('jid');
                    var name = items[i].getAttribute('name');

                    if (!searchString || searchString.length == 0 || jid.indexOf(searchString) > -1 || name.indexOf(searchString) > -1)
                    {
                        html = html + "<tr><td><a data-jid='" + jid + "' title='" + name + "' id='pade-room-" + jid + "' href='#'>" + name + "</a></td><td id='pade-room-conv-" + jid + "'></td></tr>";

                        foundRooms.push({jid: jid, name: name});
                        background.roomHistory(jid);
                    }
                }
                html = html + "</table>"
                settings.manifest.roomsSearchResults.element.innerHTML = html;

                for (var i=0; i<foundRooms.length; i++)
                {
                    document.getElementById("pade-room-" + foundRooms[i].jid).addEventListener("click", function(e)
                    {
                        e.stopPropagation();
                        var room = e.target.getAttribute("data-jid");
                        var title = e.target.title;

                        console.debug("findRooms - click", room);

                        if (getSetting("enableInverse"))
                        {
                            if (background.pade.chatWindow.id)
                            {
                                chrome.extension.getViews({windowId: background.pade.chatWindow.id})[0].openChat(room, title);
                            }
                            else {
                                background.openChatsWindow("inverse/index.html#converse/chat?jid=" + room, title);
                            }
                        }
                    });
                }

            });
        });

        if (settings.manifest.search) settings.manifest.search.addEvent("action", function ()
        {
            background.findUsers(settings.manifest.searchString.element.value, function(userList)
            {
                console.debug("findUsers", userList);

                var usersObj = {};

                for (var i=0; i < userList.length; i++ )
                {
                    usersObj[userList[i].jid] = userList[i];
                }

                var users = new Array();

                for (var key in usersObj)
                {
                    users.push(usersObj[key]);
                }

                var html = "<table style='margin-left: 15px'><tr><th>Name</th><th>ID</th><th>Email</th><th>Phone</th><th>Invite</th></tr>";
                var count = 0;

                for (var i=0; i<users.length; i++)
                {
                    var user = users[i];
                    user.room = background.makeRoomName(user.username);

                    if (!user.email) user.email = "";
                    if (!user.caller_id_number) user.caller_id_number = "";

                    var checked = settings.manifest.invitationList.element.value.indexOf(user.jid) > -1 ? "checked" : "";

                    html = html + "<tr><td><a title='" + user.name + "' name='" + user.room + "' id='" + user.jid + "' href='#'>" + user.name + "</a></td><td>" + user.jid + "</td><td>" + user.email + "</td><td><a name='" + user.caller_id_number + "' id='phone-" + user.jid + "' title='Click here to call or transfer call to " + user.caller_id_number + "' href='#'>" + user.caller_id_number + "</a></td><td><input id='check-" + user.jid + "' type='checkbox' " + checked + "></td></tr>";
                }
                html = html + "</table>"

                if (users.length == 0) html = "No user found";

                settings.manifest.searchResults.element.innerHTML = "<p/><p/>" + html;

                users.forEach(function(theUser)
                {
                    var element = document.getElementById(theUser.jid);

                    var setAvatar = function(imgHref)
                    {
                        element.innerHTML = "<img style='width: 22px;' src='" + imgHref + "'>" + element.innerHTML;
                    }

                    background.getVCard(theUser.jid, function(vCard)
                    {
                        console.debug("displayUsers vcard", vCard);
                        setAvatar(vCard.avatar ? vCard.avatar : background.createAvatar(element.innerHTML));

                    }, function() {
                        setAvatar(background.createAvatar(element.innerHTML));
                    });

                    element.addEventListener("click", function(e)
                    {
                        e.stopPropagation();
                        var user = e.target;

                        console.debug("findUsers - click", user.id, user.name, user.title);

                        if (getSetting("enableInverse"))
                        {
                            if (background.pade.chatWindow.id)
                            {
                                chrome.extension.getViews({windowId: background.pade.chatWindow.id})[0].openChat(user.id, user.title);
                            }
                            else {
                                background.openChatsWindow("inverse/index.html#converse/chat?jid=" + user.id, user.title);
                            }
                        }
                        else {
                            background.acceptCall(user.title, user.id, user.name);
                            background.inviteToConference(user.id, user.name);
                        }
                    });

                    document.getElementById("check-" + theUser.jid).addEventListener("click", function(e)
                    {
                        e.stopPropagation();
                        var invitation = e.target;

                        console.debug("inviteUser - click", invitation.id, invitation.checked);

                        var inviteList = settings.manifest.invitationList.element.value.split("\n");
                        var invitee = invitation.id.substring(6);

                        if (invitation.checked)
                        {
                            if (inviteList.indexOf(invitee) == -1) inviteList.push(invitee);

                        } else {
                            var index = inviteList.indexOf(invitee);
                            if (index > -1) inviteList.splice(index, 1);
                        }

                        settings.manifest.invitationList.element.value = inviteList.join("\n").trim();
                    });

                    document.getElementById("phone-" + theUser.jid).addEventListener("click", function(e)
                    {
                        e.stopPropagation();
                        var user = e.target;
                        var phone = getSetting("exten", null)

                        if (phone && phone != "" && background.pade.chatAPIAvailable)
                        {
                            console.debug("findUsers phone - click", user.name);

                            background.makePhoneCall(phone, user.name, function(err)
                            {
                                if (err) alert("Telephone call failed!!");
                            });

                        } else alert("Phone Extension not configured");
                    });
                });
            });
        });

        if (settings.manifest.inviteToMeeting) settings.manifest.inviteToMeeting.addEvent("action", function ()
        {
            var inviteList = settings.manifest.invitationList.element.value.split("\n");
            var room = "pade-" + Math.random().toString(36).substr(2,9);
            var invite = getSetting("meetingName");

            console.debug("inviteToMeeting", inviteList, room);

            background.openVideoWindow(room);

            for (var i=0; i<inviteList.length; i++)
            {
                background.inviteToConference(inviteList[i], room, invite);
            }
        });

        if (settings.manifest.saveMeeting) settings.manifest.saveMeeting.addEvent("action", function ()
        {
            var inviteList = settings.manifest.invitationList.element.value.split("\n");
            var room = "pade-" + Math.random().toString(36).substr(2,9);
            var invite = getSetting("meetingName");

            if (!invite || invite.length == 0 || inviteList.length == 0 || inviteList[0].length == 0)
            {
                alert(i18n.get("Enter a name for the meeting and select participants"))
                return;
            }

            var meetings = {};
            var encoded = window.localStorage["store.settings.savedMeetings"];
            if (encoded) meetings = JSON.parse(atob(encoded));

            meetings[room] = {room: room, invite: invite, inviteList: inviteList};
            window.localStorage["store.settings.savedMeetings"] = btoa(JSON.stringify(meetings));
        });

        if (settings.manifest.inviteMeetings) settings.manifest.inviteMeetings.addEvent("action", function ()
        {
            var keyword = settings.manifest.inviteMeetingsString.element.value;
            var meetings = {};
            var encoded = window.localStorage["store.settings.savedMeetings"];
            if (encoded) meetings = JSON.parse(atob(encoded));

            var doHTML = function()
            {
                var html = "<p/><p/><table style='margin-left: 15px'><tr><th>Meeting</th><th>Room</th><th>Participants</th><th><input id='select-all-rooms' type='checkbox'><a href='#' id='deleteSelected' title='Delete selected Meetings'>Delete</a></th></tr>";
                var saveMeetings = Object.getOwnPropertyNames(meetings);

                for (var i=0; i<saveMeetings.length; i++)
                {
                    var meeting = meetings[saveMeetings[i]];
                    var participants = "";

                    for (var j=0; j<meeting.inviteList.length; j++)
                    {
                        participants = participants + meeting.inviteList[j] + "<br/>"
                    }

                    var newItem = "<tr><td><a href='#' title='Invite and join this Meeting' id='invite-" + meeting.room + "'>" + meeting.invite + "</a></td><td><a href='#' id='join-" + meeting.room + "' title='Join this meeting'>" + meeting.room + "</a></td><td>" + participants + "</td><td><input id='select-" + meeting.room + "' type='checkbox'/></td></tr>";

                    if (keyword.length == 0 || newItem.toLowerCase().indexOf(keyword.toLowerCase()) > -1)
                    {
                        html = html + newItem;
                    }
                }

                settings.manifest.inviteMeetingsResults.element.innerHTML = html;
            }

            doHTML();

            document.getElementById("select-all-rooms").addEventListener("click", function(e)
            {
                e.stopPropagation();

                var saveMeetings = Object.getOwnPropertyNames(meetings);

                for (var i=0; i<saveMeetings.length; i++)
                {
                    var meeting = document.getElementById("select-" + saveMeetings[i]);
                    meeting.checked = !meeting.checked;
                }

            }, false);

            document.getElementById("deleteSelected").addEventListener("click", function(e)
            {
                e.stopPropagation();

                var didSomething = false;
                var saveMeetings = Object.getOwnPropertyNames(meetings);

                for (var i=0; i<saveMeetings.length; i++)
                {
                    var meeting = document.getElementById("select-" + saveMeetings[i]);

                    if (meeting.checked)
                    {
                        delete meetings[saveMeetings[i]];
                        didSomething = true;
                    }
                }

                if (didSomething)
                {
                    window.localStorage["store.settings.savedMeetings"] = btoa(JSON.stringify(meetings));
                    doHTML();
                }

            }, false);

            var saveMeetings = Object.getOwnPropertyNames(meetings);

            for (var i=0; i<saveMeetings.length; i++)
            {
                var savedMeeting = document.getElementById("invite-" + saveMeetings[i]);

                if (savedMeeting)
                {
                    savedMeeting.addEventListener("click", function(e)
                    {
                        e.stopPropagation();
                        var meeting = meetings[e.target.id.substring(7)];

                        for (var j=0; j<meeting.inviteList.length; j++)
                        {
                            // make sure we have a jid entry and not blank line

                            if (meeting.inviteList[j] && meeting.inviteList[j].indexOf("@") > -1)
                            {
                                background.inviteToConference(meeting.inviteList[j], meeting.room, meeting.invite);
                            }
                        }

                        background.openVideoWindow(meeting.room);

                    }, false);

                    document.getElementById("join-" + saveMeetings[i]).addEventListener("click", function(e)
                    {
                        e.stopPropagation();
                        background.openVideoWindow(e.target.id.substring(5));

                    }, false);
                }
            }
        });

        if (settings.manifest.popupWindow) settings.manifest.popupWindow.addEvent("action", function ()
        {
            if (getSetting("popupWindow"))
            {
                chrome.browserAction.setPopup({popup: ""});

            } else {
                chrome.browserAction.setPopup({popup: "popup.html"});
            }
        });

        if (settings.manifest.enableCommunity) settings.manifest.enableCommunity.addEvent("action", function ()
        {
            if (getSetting("enableCommunity"))
            {
                background.addCommunityMenu();

            } else {
               background.removeCommunityMenu();
            }
        });

        if (settings.manifest.enableInverse) settings.manifest.enableInverse.addEvent("action", function ()
        {
            if (getSetting("enableInverse"))
            {
                background.addInverseMenu();

            } else {
               background.removeInverseMenu();
            }

            localStorage.removeItem("store.settings.chatWindow");
            background.reloadApp();
        });

        if (settings.manifest.enableCannedResponses)
        {
            settings.manifest.enableCannedResponses.addEvent("action", function ()
            {
                settings.manifest.cannedResponses.element.style = getSetting("enableCannedResponses") ? "display:initial;" : "display: none;";
            });

            // default
            settings.manifest.cannedResponses.element.style = getSetting("enableCannedResponses") ? "display:initial;" : "display: none;";
        }

        if (settings.manifest.enableMeetingPlanner)
        {
            settings.manifest.enableMeetingPlanner.addEvent("action", function ()
            {
                settings.manifest.meetingPlanner.element.style = getSetting("enableMeetingPlanner") ? "display:initial;" : "display: none;";
            });

            // default
            settings.manifest.meetingPlanner.element.style = getSetting("enableMeetingPlanner") ? "display:initial;" : "display: none;";
        }

        if (settings.manifest.useSmartIdCard && chrome.tabs)
        {
            settings.manifest.useSmartIdCard.addEvent("action", function ()
            {
                if (!getSetting("useSmartIdCard", false)) setSetting("password", "");
                location.reload()
            });

            if (getSetting("useSmartIdCard", false) && !getSetting("password", null)) startSmartIdLogin(function(url)
            {
                console.debug("Smart-ID URL", url);

                fetch(url, {method: "GET"}).then(function(response){ return response.json()}).then(function(json)
                {
                    console.debug("Smart-ID DATA", json);

                    var fullName = null;
                    var email = null;

                    if (json.firstname && json.lastname)
                    {
                        fullName = json.firstname + " " + json.lastname;
                    }

                    if (json.email) email = json.email;

                    setSetting("username", json.idcode);
                    setSetting("password", json.password);

                    if (fullName) setSetting("displayname", fullName);
                    if (email) setSetting("email", email);

                    background.reloadApp();

                }).catch(function (err) {
                    console.error("Smart-ID DATA", err);
                    settings.manifest.status.element.innerHTML = '<b style="color:red">Smart-ID Error ' + err + '</b>';
                });
            });
        }

        if (settings.manifest.autoReconnect) settings.manifest.autoReconnect.addEvent("action", function ()
        {
            if (getSetting("autoReconnect", true))
            {
                background.pade.connection.connectionmanager.enable();
            }
            else {
                background.pade.connection.connectionmanager.disable();
            }
        });

        if (settings.manifest.ofmeetUrl) settings.manifest.ofmeetUrl.addEvent("action", function ()
        {
            background.pade.ofmeetUrl = getSetting("ofmeetUrl");
        });

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
                background.addOffice365Business();

            } else {
               background.removeOffice365Business();
            }
        });

        if (settings.manifest.enableOffice365Personal) settings.manifest.enableOffice365Personal.addEvent("action", function ()
        {
            if (getSetting("enableOffice365Personal"))
            {
                background.addOffice365Personal();

            } else {
               background.removeOffice365Personal();
            }
        });

        if (settings.manifest.enableWebApps) settings.manifest.enableWebApps.addEvent("action", function ()
        {
            if (getSetting("enableWebApps"))
            {
                background.addWebApps();

            } else {
               background.removeWebApps();
            }
        });

        if (settings.manifest.enableGmail) settings.manifest.enableGmail.addEvent("action", function ()
        {
            if (getSetting("enableGmail"))
            {
                background.addGmail();

            } else {
               background.removeGmail();
            }
        });

        if (settings.manifest.changelog) settings.manifest.changelog.addEvent("action", function ()
        {
            location.href = "../changelog.html";
        });

        if (settings.manifest.help) settings.manifest.help.addEvent("action", function ()
        {
            location.href = chrome.runtime.getManifest().homepage_url;
        });

        if (settings.manifest.useTotp) settings.manifest.useTotp.addEvent("action", function ()
        {
            background.reloadApp();
        });

        if (settings.manifest.useWinSSO) settings.manifest.useWinSSO.addEvent("action", function ()
        {
            setDefaultSetting("password", "__DEFAULT__WINSSO__")
            background.reloadApp();
        });

        if (settings.manifest.enableRemoteControl) settings.manifest.enableRemoteControl.addEvent("action", function ()
        {
            background.reloadApp();
        });

        if (settings.manifest.enableHomePage) settings.manifest.enableHomePage.addEvent("action", function ()
        {
            reloadConverse(background);
        });

        if (settings.manifest.factoryReset) settings.manifest.factoryReset.addEvent("action", function ()
        {
            let keepSettings = false;
            let savedSettings = JSON.parse(JSON.stringify(branding));

            if (confirm(chrome.i18n.getMessage("resetConfirm")))
            {
                if (confirm(chrome.i18n.getMessage("keepConfirm"))) // save settings
                {
                    keepSettings = true;

                    for (var i = 0; i < localStorage.length; i++)
                    {
                        if (localStorage.key(i).startsWith("store.settings.") && localStorage.key(i).indexOf("password") == -1)
                        {
                            const key = localStorage.key(i).substring(15);
                            if (!savedSettings[key]) savedSettings[key] = {disable: false};
                            savedSettings[key].value = localStorage.getItem(localStorage.key(i));
                        }
                    }
                }

                sessionStorage.clear();
                localStorage.clear();
                chrome.storage.local.clear();

                if (keepSettings)   // restore settings
                {
                    const keys = Object.getOwnPropertyNames(savedSettings);

                    for (var i=0; i<keys.length; i++)
                    {
                        window.localStorage["store.settings." + keys[i]] = savedSettings[keys[i]].value;
                    }
                }

                background.reloadApp();
            }
        });

        if (settings.manifest.useClientCert) settings.manifest.useClientCert.addEvent("action", function ()
        {
            setDefaultPassword(settings);
            background.reloadApp();
        });

        if (settings.manifest.enableBlog) settings.manifest.enableBlog.addEvent("action", function ()
        {
            if (getSetting("enableBlog"))
            {
                background.addBlogMenu();

            } else {
               background.removeBlogMenu();
            }
        });

        if (settings.manifest.enableBlast) settings.manifest.enableBlast.addEvent("action", function ()
        {
            if (getSetting("enableBlast"))
            {
                background.addBlastMenu();

            } else {
               background.removeBlastMenu();
            }
        });

        if (settings.manifest.enableDrawIO) settings.manifest.enableDrawIO.addEvent("action", function ()
        {
            if (getSetting("enableDrawIO"))
            {
                background.addDrawIOMenu();

            } else {
               background.removeDrawIOMenu();
            }
        });


        if (settings.manifest.qrcode) settings.manifest.qrcode.addEvent("action", function ()
        {
            if (window.localStorage["store.settings.server"])
            {
                var host = JSON.parse(window.localStorage["store.settings.server"]);
                var url = "https://" + host + "/dashboard/qrcode.jsp";

                chrome.windows.create({url: url, type: "popup"}, function (win)
                {
                    chrome.windows.update(win.id, {drawAttention: true, focused: true, width: 400, height: 270});
                });
            }
        });

        if (settings.manifest.updateCollabUrlList) settings.manifest.updateCollabUrlList.addEvent("action", function ()
        {
            background.updateCollabUrlList();
        });


        if (settings.manifest.registerUrlProtocols) settings.manifest.registerUrlProtocols.addEvent("action", function ()
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

        if (settings.manifest.uport) settings.manifest.uport.addEvent("action", function ()
        {
            if (getSetting("useUport") || getSetting("useIrma"))
            {
                if (uportWin) chrome.windows.remove(uportWin.id);

                var url = "uport/index.html";
                if (getSetting("useIrma")) url = "irma/index.html";

                chrome.windows.create({url: chrome.extension.getURL(url), type: "popup"}, function (win)
                {
                    uportWin = win;
                    chrome.windows.update(win.id, {drawAttention: true, focused: true, width: 680, height: 800});
                });
            }
        });

        if (settings.manifest.certificate) settings.manifest.certificate.addEvent("action", function ()
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
    if (chrome.pade)    // browser mode
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
    setDefaultSetting("uportPermission", chrome.i18n.getMessage("uport_permission"));
    setDefaultServer();

    // preferences
    setDefaultSetting("language", "en");
    setDefaultSetting("friendType", "xmpp");
    setDefaultSetting("enableLipSync", false);
    setDefaultSetting("enableCommunity", false);
    setDefaultSetting("audioOnly", false);
    setDefaultSetting("enableBlog", false);
    setDefaultSetting("showSharedCursor", true);
    setDefaultSetting("idleTimeout", 300);

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

    setDefaultSetting("conversePersistentStore", 'none')
    setDefaultSetting("clearCacheOnConnect", true);
    setDefaultSetting("allowNonRosterMessaging", true);
    setDefaultSetting("autoListRooms", true);
    setDefaultSetting("autoReconnect", true);
    setDefaultSetting("autoReconnectConverse", true);
    setDefaultSetting("messageCarbons", true);
    setDefaultSetting("converseAutoStart", true);
    // most people do want this
    //setDefaultSetting("showGroupChatStatusMessages", true);
    setDefaultSetting("converseTheme", "concord");
    setDefaultSetting("enableHomePage", false);
    setDefaultSetting("homePageView", "fullscreen");
    setDefaultSetting("conversePersistentStore", "localStorage");
    setDefaultSetting("homePage", chrome.runtime.getURL("help/index.html"));
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
    // most people don't want this
    //setDefaultSetting("enableRssFeeds", true);
    setDefaultSetting("rssFeedCheck", 10);
    setDefaultSetting("beeFeedCheck", 10);
    setDefaultSetting("beeKeeperPageSize", 25);
    setDefaultSetting("alwaysShowOccupants", true);
    setDefaultSetting("moderatorTools", true);
    setDefaultSetting("converseAutoCompleteFilter", "contains");
    setDefaultSetting("converseTimeAgo", true);
    setDefaultSetting("enableVoiceChat", true);
    // most people won't want this
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
                    chrome.extension.getBackgroundPage().reloadApp();
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

        if (settings.manifest.useClientCert && settings.manifest.useClientCert.element.checked)
        {
            settings.manifest.password.element.disabled = true;
            setDefaultSetting("password", settings.manifest.username.element.value);
        }
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
                         background.reloadApp();

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

            if (!brandingExport[key]) brandingExport[key] = {disable: false};
            brandingExport[key].value = localStorage.getItem(localStorage.key(i));
        }
    }

    console.log("exportPreferences", brandingExport);

    const blob = new Blob([JSON.stringify(brandingExport)], {type: "application/json"});

    chrome.downloads.download({url: URL.createObjectURL(blob), filename: "pade.json"}, function(id)
    {
        settings.manifest.importExportStatus.element.innerHTML = 'Exported....pade.json';
    });
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
                console.debug("uploadAvatar", dataUri);

                window.localStorage["store.settings.avatar"] = JSON.stringify(dataUri);

                var sourceImage = new Image();

                sourceImage.onload = function() {
                    var canvas = document.createElement("canvas");
                    canvas.width = 32;
                    canvas.height = 32;
                    canvas.getContext("2d").drawImage(sourceImage, 0, 0, 32, 32);

                    background.getVCard(jid, function(vCard)
                    {
                        console.debug("uploadAvatar - get vcard", vCard);
                        vCard.avatar = canvas.toDataURL();

                        background.setVCard(vCard, function(resp)
                        {
                            console.debug("uploadAvatar - set vcard", resp);
                            setTimeout(function() {location.reload();}, 500);

                        }, avatarError);

                    }, avatarError);
                }

                sourceImage.src = dataUri;
            };

            reader.onerror = function(event) {
                console.error("uploadAvatar - error", event);
                settings.manifest.uploadAvatarStatus.element.innerHTML = '<b style="color:red">File could not be read! Code ' + event.target.error.code;
            };

            reader.readAsDataURL(file);

        } else {
            settings.manifest.uploadAvatarStatus.element.innerHTML = '<b style="color:red">image file must be a png or jpg file</b>';
        }
    }
}

function reloadConverse(background)
{
    console.log("reloadConverse", background);

    if (background.pade.chatWindow)
    {
        chrome.extension.getViews({windowId: background.pade.chatWindow.id})[0].location.reload();
    }
}

function avatarError(error)
{
    console.error("uploadAvatar - error", error);
    settings.manifest.uploadAvatarStatus.element.innerHTML = '<b style="color:red">picture/avatar cannot be uploaded and saved</b>';
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
