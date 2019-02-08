var uportWin = null, credWin = null;

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

    document.getElementById("settings-label").innerHTML = chrome.i18n.getMessage('settings')

    doDefaults();

    new FancySettings.initWithManifest(function (settings)
    {
        var background = chrome.extension.getBackgroundPage();
        var avatar = getSetting("avatar");

        if (avatar)
        {
            document.getElementById("avatar").innerHTML = "<img style='width: 64px;' src='" + avatar + "' />";
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
            settings.manifest.status.element.innerHTML = 'Connecting, please wait....';
            validateCredentials();
        });

        if (settings.manifest.register) settings.manifest.register.addEvent("action", function ()
        {
            settings.manifest.status.element.innerHTML = 'Registering, please wait....';
            registerUser();
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
                                if (background.pade.chatWindow)
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

                for (var i=0; i<users.length; i++)
                {
                    document.getElementById(users[i].jid).addEventListener("click", function(e)
                    {
                        e.stopPropagation();
                        var user = e.target;

                        console.debug("findUsers - click", user.id, user.name, user.title);

                        if (getSetting("enableInverse"))
                        {
                            if (background.pade.chatWindow)
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

                    document.getElementById("check-" + users[i].jid).addEventListener("click", function(e)
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

                    document.getElementById("phone-" + users[i].jid).addEventListener("click", function(e)
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
                }
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

        if (settings.manifest.enableTouchPad) settings.manifest.enableTouchPad.addEvent("action", function ()
        {
            if (getSetting("enableTouchPad"))
            {
                background.addTouchPadMenu();

            } else {
               background.removeTouchPadMenu();
               localStorage.removeItem("store.settings.apcWindow");
            }

            location.reload()
        });

        if (settings.manifest.useSmartIdCard)
        {
            settings.manifest.useSmartIdCard.addEvent("action", function ()
            {
                location.reload()
            });

            var server = getSetting("server", null);
            var buttonUrl = "https://id.smartid.ee/oauth/authorize?client_id=s5D6gnTwOqmFISb7KY5maMe2XgEcKNOa&redirect_uri=https://igniterealtime.github.io/pade/redirect.html&response_type=code&method=ee-id-card";
            var idFrame = document.getElementById("id-login-iframe");

            if (idFrame && server)
            {
                window.addEventListener('message', function (event)
                {
                    if (event.data.url && event.data.event == "ofmeet.event.url.ready")
                    {
                        console.debug("Smart-ID URL", event.data.url);

                        var pos = event.data.url.indexOf( "https://igniterealtime.github.io/pade/redirect.html?code=" );

                        if (pos > -1)
                        {
                            code = event.data.url.substring(pos + 57);
                            console.debug("Smart-ID CODE", code);

                            fetch("https://" + server + "/apps/smartidcard?code=" + code, {method: "GET"}).then(function(response){ return response.json()}).then(function(json)
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

                                idFrame.src = buttonUrl;
                                background.reloadApp();

                            }).catch(function (err) {
                                console.error("Smart-ID DATA", err);
                                idFrame.outerHTML = "<b><a title='" + err + "'>Error</a></b>";
                            });
                        }
                    }
                });

                idFrame.src = buttonUrl;
            }
        }


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

        if (settings.manifest.enableSip) settings.manifest.enableSip.addEvent("action", function ()
        {
            background.reloadApp();
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

        if (settings.manifest.factoryReset) settings.manifest.factoryReset.addEvent("action", function ()
        {
            if (confirm(chrome.i18n.getMessage("resetConfirm")))
            {
                localStorage.clear();
                chrome.storage.local.clear();
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

        if (settings.manifest.enableAVCapture) settings.manifest.enableAVCapture.addEvent("action", function ()
        {
            if (getSetting("enableAVCapture"))
            {
                background.addAVCaptureMenu();

            } else {
               background.removeAVCaptureMenu();
            }
        });

        if (settings.manifest.enableVerto) settings.manifest.enableVerto.addEvent("action", function ()
        {
            if (getSetting("enableVerto"))
            {
                background.addVertoMenu();

            } else {
               background.removeVertoMenu();
            }
        });

        if (settings.manifest.desktopShareMode) settings.manifest.desktopShareMode.addEvent("action", function ()
        {
            background.reloadApp();
        });

        if (settings.manifest.showOnlyOnlineUsers) settings.manifest.showOnlyOnlineUsers.addEvent("action", function ()
        {
            background.reloadApp();
        });

        if (settings.manifest.useCredsMgrApi) settings.manifest.useCredsMgrApi.addEvent("action", function ()
        {
            background.reloadApp();
        });

        if (settings.manifest.qrcode) settings.manifest.qrcode.addEvent("action", function ()
        {
            if (window.localStorage["store.settings.server"])
            {
                var host = JSON.parse(window.localStorage["store.settings.server"]);
                var url = "https://" + host + "/dashboard/qrcode.jsp";

                chrome.windows.create({url: url, focused: true, type: "popup"}, function (win)
                {
                    chrome.windows.update(win.id, {drawAttention: true, width: 400, height: 270});
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

            if (getSetting("registerMEETProtocol"))
            {
                navigator.registerProtocolHandler("web+meet",  chrome.extension.getURL("jitsi-meet/chrome.index.html?url=%s"), "Pade - Meeting");
            }
        });

        if (settings.manifest.uport) settings.manifest.uport.addEvent("action", function ()
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


        function registerUser()
        {
            if (window.localStorage["store.settings.server"] && window.localStorage["store.settings.domain"] && window.localStorage["store.settings.username"] && window.localStorage["store.settings.email"])
            {
                var lynks = {};

                lynks.server = JSON.parse(window.localStorage["store.settings.server"]);
                lynks.domain = JSON.parse(window.localStorage["store.settings.domain"]);
                lynks.username = JSON.parse(window.localStorage["store.settings.username"]);
                lynks.avatar = background.createAvatar(lynks.username);
                lynks.email = JSON.parse(window.localStorage["store.settings.email"]);

                if (window.localStorage["store.settings.displayname"])
                {
                   lynks.displayname = JSON.parse(window.localStorage["store.settings.displayname"]);
                   lynks.avatar = background.createAvatar(lynks.displayname);
                }

                if (window.localStorage["store.settings.password"])
                {
                   lynks.password = JSON.parse(window.localStorage["store.settings.password"]);
                }

                lynks.connUrl = "https://" + lynks.server + "/http-bind/";

                if (window.localStorage["store.settings.useWebsocket"] && JSON.parse(window.localStorage["store.settings.useWebsocket"]))
                {
                    lynks.connUrl = "wss://" + lynks.server + "/ws/";
                }

                var connection = background.getConnection(lynks.connUrl);

                connection.addHandler(function(resp)
                {
                    var register = resp.querySelector('register');

                    if (register && resp.getAttribute("type") == "result")
                    {
                        console.debug("registerUser: register responses", register);

                        var error = register.getAttribute("error");

                        if (error) settings.manifest.status.element.innerHTML = '<b style="color:red">' + error + '</b>';

                        else {
                            var password = register.getAttribute("password");
                            if (password) setSetting("password", "token-" + btoa(password));

                            setTimeout(function()
                            {
                                connection.disconnect();
                                background.reloadApp();

                            }, 5000);
                        }
                    }

                    return true;

                }, null, 'iq');

                connection.connect(lynks.domain, "", function (status)
                {
                    console.debug("registerUser: register status", status);

                    if (status === 5)
                    {
                        var attrs = {xmlns: "http://igniterealtime.org/ofchat/register", from: lynks.username + "@" + lynks.domain, email: lynks.email, name: lynks.displayname, avatar: lynks.avatar, subject: chrome.i18n.getMessage('registerSubject')};
                        if (lynks.password && lynks.password != "") attrs.password = lynks.password;

                        var request = background.$iq({to: connection.domain, type: "set"}).c("register", attrs).t(chrome.i18n.getMessage('registerBody'));
                        connection.send(request);
                    }
                    else

                    if (status === 4)
                    {
                        settings.manifest.status.element.innerHTML = '<b style="color:red">bad server or domain</b>';
                        connection.disconnect();
                    }
                });

                setTimeout(function()
                {
                    connection.disconnect();
                    background.reloadApp();

                }, 60000);


            } else settings.manifest.status.element.innerHTML = '<b style="color:red">bad server, domain, username, display name or email</b>';

        }

        function validateCredentials()
        {
            if (window.localStorage["store.settings.server"] && window.localStorage["store.settings.domain"] && window.localStorage["store.settings.username"] && window.localStorage["store.settings.password"])
            {
                var lynks = {};

                lynks.server = JSON.parse(window.localStorage["store.settings.server"]);
                lynks.domain = JSON.parse(window.localStorage["store.settings.domain"]);
                lynks.username = JSON.parse(window.localStorage["store.settings.username"]);
                lynks.displayname = JSON.parse(window.localStorage["store.settings.displayname"]);
                lynks.password = getPassword(JSON.parse(window.localStorage["store.settings.password"]));

                if (lynks.server && lynks.domain && lynks.username && lynks.password)
                {
                    if (lynks.server.indexOf(":") == -1)
                    {
                        settings.manifest.status.element.innerHTML = '<b style="color:red">missing server port. use server:port or ipaddress:port</b>';
                    }
                    else

                    if (isNumeric(lynks.server.substring(lynks.server.indexOf(":") + 1)))
                    {
                        var connUrl = "https://" + lynks.server + "/http-bind/";

                        if (window.localStorage["store.settings.useWebsocket"] && JSON.parse(window.localStorage["store.settings.useWebsocket"]))
                        {
                            connUrl = "wss://" + lynks.server + "/ws/";
                        }
                        var connection = background.getConnection(connUrl);

                        if (window.localStorage["store.settings.useTotp"] && JSON.parse(window.localStorage["store.settings.useTotp"]))
                        {
                            var token = lynks.username + ":" + lynks.password;
                            background.setupSasl(token);
                        }

                        connection.connect(lynks.username + "@" + lynks.domain + "/" + lynks.username, lynks.password, function (status)
                        {
                            console.debug("status", status, lynks.username, lynks.displayname);

                            if (status === 5)
                            {
                                setTimeout(function() { background.reloadApp(); }, 1000);
                            }
                            else

                            if (status === 4)
                            {
                                setDefaultPassword(settings);
                                settings.manifest.status.element.innerHTML = '<b style="color:red">bad username or password</b>';
                            }
                        });
                    } else {
                        settings.manifest.status.element.innerHTML = '<b style="color:red" style="color:red">bad server port. use server:port or ipaddress:port</b>';
                    }
                }
                else {
                    if (!lynks.server) settings.manifest.status.element.innerHTML = '<b style="color:red">bad server</b>';
                    if (!lynks.domain) settings.manifest.status.element.innerHTML = '<b style="color:red">bad domain</b>';
                    if (!lynks.username) settings.manifest.status.element.innerHTML = '<b style="color:red">bad username</b>';
                    if (!lynks.password) settings.manifest.status.element.innerHTML = '<b style="color:red">bad password</b>';
                }

            } else settings.manifest.status.element.innerHTML = '<b style="color:red">bad server, domain, username or password</b>';
        }
    });


});

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function doDefaults()
{
    // connection
    setDefaultSetting("uportPermission", chrome.i18n.getMessage("uport_permission"));
    setDefaultSetting("useWebsocket", true);
    setDefaultServer();

    // preferences
    setDefaultSetting("language", "en");
    setDefaultSetting("friendType", "xmpp");
    setDefaultSetting("popupWindow", true);
    setDefaultSetting("enableLipSync", false);
    setDefaultSetting("enableCommunity", false);
    setDefaultSetting("audioOnly", false);
    setDefaultSetting("enableSip", false);
    setDefaultSetting("enableBlog", false);
    setDefaultSetting("showSharedCursor", true);
    setDefaultSetting("idleTimeout", 300);

    // config
    setDefaultSetting("startBitrate", 800);
    setDefaultSetting("resolution", 720);
    setDefaultSetting("minHDHeight", 540);

    // meeting
    setDefaultSetting("transcribeLanguage", "en-GB");
    setDefaultSetting("VERTICAL_FILMSTRIP", true);
    setDefaultSetting("FILM_STRIP_MAX_HEIGHT", 90);
    setDefaultSetting("INITIAL_TOOLBAR_TIMEOUT", 20000);
    setDefaultSetting("TOOLBAR_TIMEOUT", 4000);
    setDefaultSetting("p2pMode", true);
    setDefaultSetting("plannerNotice", 10);
    setDefaultSetting("plannerExpire", 15);
    setDefaultSetting("plannerCheck", 5);
    setDefaultSetting("channelLastN", 10);
    setDefaultSetting("startAudioMuted", 5);
    setDefaultSetting("startVideoMuted", 5);

    // community
    setDefaultSetting("chatWithOnlineContacts", true);
    setDefaultSetting("notifyWhenMentioned", true);

    // converse
    setDefaultSetting("enableInverse", true);
    setDefaultSetting("allowNonRosterMessaging", true);
    setDefaultSetting("autoReconnect", true);
    setDefaultSetting("messageCarbons", true);
    setDefaultSetting("converseAutoStart", true);
    setDefaultSetting("showGroupChatStatusMessages", true);
    setDefaultSetting("converseRosterIcons", true);
    setDefaultSetting("converseRosterFilter", true);
    setDefaultSetting("converseTheme", "plainsimple");
    setDefaultSetting("enableBookmarks", true);
    setDefaultSetting("notifyRoomMentions", true);
    setDefaultSetting("notifyWhenClosed", true);
    setDefaultSetting("enableInfoPanel", true);
    setDefaultSetting("useMarkdown", true);
    setDefaultSetting("archivedMessagesPageSize", 10);

    // web apps
    setDefaultSetting("webApps", "web.skype.com, web.whatsapp.com");

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

            fetch("https://" + server + "/pade.json", {method: "GET"}).then(function(response){ return response.json()}).then(function(json)
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

                if (getSetting("useWinSSO", false) || getSetting("useCredsMgrApi", false))
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

        chrome.tabs.query({}, function(tabs)
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
    console.debug("setDefaultSetting", name, defaultValue);

    if (!window.localStorage["store.settings." + name])
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
    if (background.pade.chatWindow.id)
    {
        chrome.extension.getViews({windowId: background.pade.chatWindow.id})[0].location.reload();
    }
}

function avatarError(error)
{
    console.error("uploadAvatar - error", error);
    settings.manifest.uploadAvatarStatus.element.innerHTML = '<b style="color:red">picture/avatar cannot be uploaded and saved</b>';
}
