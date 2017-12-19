/**
 * ofmeet.js
 */

var ofmeet = (function(of)
{
    var firstTime = true;
    var firstTrack = true;
    var participants = {}

    function setup()
    {
        console.log("ofmeet.js setup", APP.connection, OFMEET_CONFIG.bgWin);

        if (!APP.connection || !OFMEET_CONFIG.bgWin)
        {
            setTimeout(function() {setup();}, 1000);
            return;
        }
        __init();


        window.addEventListener('message', function (event)
        {
            //console.log("addListener message", event.data);

            if (APP && APP.connection && OFMEET_CONFIG.bgWin && OFMEET_CONFIG.bgWin.pade.activeUrl && event.data)
            {
                event.data.from = OFMEET_CONFIG.nickName;
                event.data.username = OFMEET_CONFIG.username;

                if (event.data.event == "ofmeet.event.pdf.ready" || event.data.event == "ofmeet.event.pdf.goto")
                {
                    if (OFMEET_CONFIG.documentOwner)
                    {
                        event.data.owner = OFMEET_CONFIG.username;
                        event.data.url = OFMEET_CONFIG.bgWin.pade.activeUrl + "#" + event.data.page;
                        OFMEET_CONFIG.currentUrl = event.data.url;
                        APP.conference._room.sendOfMeet(JSON.stringify(event.data));
                    }
                }
                else

                if (event.data.event == "ofmeet.event.url.ready")
                {
                    console.log("addListener message collab", event.data);

                    if (OFMEET_CONFIG.documentOwner)
                    {
                        event.data.owner = OFMEET_CONFIG.username;
                        OFMEET_CONFIG.currentUrl = event.data.url;
                        APP.conference._room.sendOfMeet(JSON.stringify(event.data));
                    }

                    var ofMeetContent = document.getElementById("ofmeet-content");

                    if (ofMeetContent)
                    {
                        ofMeetContent.contentWindow.postMessage({ action: 'ofmeet.action.url.setup', owner: event.data.owner, room: APP.conference.roomName, user: OFMEET_CONFIG.nickName, username: OFMEET_CONFIG.username}, '*');
                    }
                }
                else {
                    APP.conference._room.sendOfMeet(JSON.stringify(event.data));
                }
            }
        });

        this.connection = APP.connection.xmpp.connection;
        of.connection = connection;

        of.connection.addHandler(function(message)
        {
            //console.log("ofmeet.js incoming xmpp", message);

            $(message).find('ofmeet').each(function ()
            {
                try {
                    var json = JSON.parse($(this).text());

                    if (json.event == "ofmeet.event.sip.join")
                    {
                        addSipParticipant(json);
                    }
                    else

                    if (json.event == "ofmeet.event.sip.leave")
                    {
                        removeSipParticipant(json);
                    }
                    else

                    if (json.event == "ofmeet.event.pdf.goto" || json.event == "ofmeet.event.pdf.ready" || json.event == "ofmeet.event.url.ready")
                    {
                        console.log("ofmeet.js document share", json);

                        var url = json.url;

                        if (json.event == "ofmeet.event.pdf.goto" || json.event == "ofmeet.event.pdf.ready")
                        {
                            url = chrome.extension.getURL("pdf/index.html?pdf=" + json.url);
                        }

                        var ofMeetContent = document.getElementById("ofmeet-content");

                        if (!ofMeetContent)
                        {
                            OFMEET_CONFIG.documentShare = true;
                            OFMEET_CONFIG.documentUser = json.owner;
                            OFMEET_CONFIG.largeVideoContainer = document.getElementById("largeVideoContainer").innerHTML;

                            document.getElementById("largeVideoContainer").innerHTML = OFMEET_CONFIG.iframe(url);
                            ofMeetContent = document.getElementById("ofmeet-content");
                        }

                        if (json.event == "ofmeet.event.pdf.goto" || json.event == "ofmeet.event.pdf.ready")
                        {
                            // for PDF, we need echo to move page for owner
                            ofMeetContent.contentWindow.location.href = url;
                        }
                        else

                        if (!OFMEET_CONFIG.documentOwner)
                        {
                            // for URLs, ignore echo for owner
                            ofMeetContent.contentWindow.location.href = url;
                        }
                    }
                    else

                    if (json.event == "ofmeet.event.url.end")
                    {
                        if (OFMEET_CONFIG.largeVideoContainer && OFMEET_CONFIG.documentShare)
                        {
                            document.getElementById("largeVideoContainer").innerHTML = OFMEET_CONFIG.largeVideoContainer;

                            OFMEET_CONFIG.documentShare = false;
                            OFMEET_CONFIG.documentUser = null;
                            OFMEET_CONFIG.largeVideoContainer = null;

                            // above code does not work properly
                            // brute force solution is to reload
                            window.location.href = "chrome.index.html?room=" + OFMEET_CONFIG.room;
                        }
                    }
                    else

                    if (json.event == "ofmeet.event.pdf.message")
                    {
                        var ofMeetContent = document.getElementById("ofmeet-content");

                        if (ofMeetContent && (OFMEET_CONFIG.showSharedCursor || !OFMEET_CONFIG.showSharedCursor && json.from != OFMEET_CONFIG.nickName))
                        {
                            console.log("ofmeet.event.pdf.message", json);
                            ofMeetContent.contentWindow.handlePdfShare(json.msg, json.from);
                        }
                    }
                    else

                    if (json.event == "ofmeet.event.url.message")
                    {
                        var ofMeetContent = document.getElementById("ofmeet-content");

                        if (ofMeetContent)
                        {
                            //console.log("ofmeet.event.url.message", json);
                            ofMeetContent.contentWindow.postMessage({ action: 'ofmeet.action.url.share', json: json}, '*');
                        }
                    }


                } catch (e) {}
            });

            return true;

        }, "jabber:x:ofmeet", 'message');

        APP.connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, function()
        {
            console.error("Connection Failed!", name)
        });

        APP.connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, function()
        {
            console.log("Connection Disconnected!")
        });

        setupHttpFileUpload();
    }

    function __init()
    {
        console.log("ofmeet.js __init");

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.CONFERENCE_JOINED, function()
        {
            console.log("ofmeet.js me joined");
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.CONFERENCE_LEFT, function()
        {
            console.log("ofmeet.js me left");
            hangup();
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.USER_LEFT, function(id)
        {
            console.log("ofmeet.js user left", id);
            checkIfDocOwnerGone(id);
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.USER_JOINED, function(id)
        {
            console.log("ofmeet.js user joined", id);
            refreshShare(id);
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.DOMINANT_SPEAKER_CHANGED, function(id)
        {
            //console.log("ofmeet.js dominant speaker changed", id);
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_REMOVED, function(track)
        {
            console.log("ofmeet.js track removed", track.getParticipantId(), track.getType());
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_ADDED, function(track)
        {
            console.log("ofmeet.js track added", track.getParticipantId(), track.getType());
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, function(track)
        {
            console.log("ofmeet.js track muted", track.getParticipantId(), track.getType(), track.isMuted());

            if (APP.conference.getMyUserId() == track.getParticipantId() && of.localStream)
            {
                var tracks = of.localStream.getAudioTracks();

                for (var i=0; i<tracks.length; i++)
                {
                    tracks[i].enabled = !track.isMuted();
                }
            }
        });

        if (APP.conference.roomName && OFMEET_CONFIG.isSwitchAvailable)
        {
            of.dialstring = APP.conference.roomName;
            connectSIP();
        }

        document.title = interfaceConfig.APP_NAME + " - " + APP.conference.roomName;
    }

    function connectSIP()
    {
        console.log("ofmeet.js connectSIP", config);

        var getUserMediaFailure = function(e)
        {
            window.console.error('getUserMedia failed:', e);
        }

        var getUserMediaSuccess = function(stream)
        {
            of.localStream = stream;
            of.sipUI = OFMEET_CONFIG.bgWin.etherlynk.sip.sipUI;

            of.sipUI.on('connected', function(e) {
                console.log("SIP Connected");
            });

            of.sipUI.on('disconnected', function(e) {
                console.log("SIP Disconnected");
            });

            of.sipUI.on('registered', function(e) {
                console.log("SIP Registered");
            });

            of.sipUI.on('registrationFailed', function(e) {
                console.log("Error: Registration Failed");
                APP.UI.messageHandler.notify("SIP Error " + e, null, null, "");
            });

            of.sipUI.on('unregistered', function(e) {
                console.log("Error: Unregistered");
            });

            of.sipUI.on('message', function(message) {
                console.log("SIP Message", message.body);
            });

            of.sipUI.on('invite', function (incomingSession) {

                var remoteSipAudio = new Audio();

                incomingSession.accept({
                    media : {
                    stream      : of.localStream,
                    constraints : { audio : true, video : false },
                    render      : { remote : remoteSipAudio},
                    }
                });
            });

            if (of.session == null)
            {
                setTimeout(function() { dial(); }, 250);
            }
        }

        console.log("ofmeet.js. SIP", OFMEET_CONFIG.sip, config.iceServers);
        navigator.getUserMedia({ audio : true, video : false }, getUserMediaSuccess, getUserMediaFailure);
    }

    function removeSipParticipant(event)
    {
        if (APP.conference.roomName == event.conference)
        {
            console.log("ofmeet.js. removeSipParticipant", event);
            APP.UI.removeUser(event.id, event.source);

            delete participants[event.id];
        }
    }

    function addSipParticipant(event)
    {
        if (participants[event.id]) return;
        if (APP.conference.roomName != event.conference) return;

        console.log("ofmeet.js. addSipParticipant", event);

        var participant =
        {
            getStatus: function()
            {
                return ""
            },
            getRole: function()
            {
                return "none"
            },
            supportsDTMF: function()
            {
                return false
            },
            getConnectionStatus: function()
            {
                return true
            },
            getId: function()
            {
                return event.id;
            },
            getDisplayName: function()
            {
                return event.source;
            },
            getFeatures: function()
            {
                return new Promise(function(resolve, reject)
                {
                    resolve({has: function(a){return false}});
                })
            }
        }

        APP.UI.addUser(participant);
        APP.UI.setUserAvatarUrl(event.id, "images/avatar2.png");

        participants[event.id] = participant;
    }

    function dial()
    {
        console.log("ofmeet.js. SIP", OFMEET_CONFIG.sip, config.iceServers);

        try {
            var remoteSipAudio = new Audio();
            of.session = of.sipUI.invite(of.dialstring,
            {
                media : {
                stream      : of.localStream,
                constraints : { audio : true, video : false },
                render      : { remote : remoteSipAudio},
                },
                extraHeaders: [ 'X-ofmeet-userid: ' + APP.conference.getMyUserId(), 'X-ofmeet-room: ' + APP.conference.roomName ]
            });

            of.session.direction = 'outgoing';
            of.session.sessionId  = getUniqueID();

            APP.UI.messageHandler.notify("SIP Dialed", null, null, "");

        } catch(e) {
            APP.UI.messageHandler.notify(e, null, null, "");
            throw(e);
        }
    }

    function createAvatar()
    {
        if (!OFMEET_CONFIG.userAvatar && OFMEET_CONFIG.nickName)
        {
            var canvas = document.createElement('canvas');
            canvas.style.display = 'none';
            canvas.width = '32';
            canvas.height = '32';
            document.body.appendChild(canvas);
            var context = canvas.getContext('2d');
            context.fillStyle = "#777";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = "16px Arial";
            context.fillStyle = "#fff";

            var first, last;
            var name = OFMEET_CONFIG.nickName.split(" ");

            if (name && name[0] && name.first != '')
            {
                first = name[0][0];
                last = name[1] && name[1] != '' ? name[1][0] : null;

                if (last) {
                    var initials = first + last;
                    context.fillText(initials.toUpperCase(), 3, 23);
                } else {
                    var initials = first;
                    context.fillText(initials.toUpperCase(), 10, 23);
                }
                var data = canvas.toDataURL();
                document.body.removeChild(canvas);
                OFMEET_CONFIG.userAvatar = data;
            }
        }
    }

    function hangup()
    {
        if (of.session)
        {
            if (of.session.startTime) {
                of.session.bye();

            } else if (of.session.reject) {
                of.session.reject();

            } else if (of.session.cancel) {
                of.session.cancel();
            }

            of.session = null;
        }
    }

    function getUniqueID()
    {
            return Math.random().toString(36).substr(2, 9);
    }

    function refreshShare(id)
    {
        if (OFMEET_CONFIG.documentShare && OFMEET_CONFIG.documentOwner && id.indexOf(OFMEET_CONFIG.username + "-") == -1)
        {
            var data = {event: "ofmeet.event.url.ready"};

            if (OFMEET_CONFIG.bgWin.pade.activeUrl.indexOf(".pdf") > -1)
            {
                data.event = "ofmeet.event.pdf.ready";
            }

            data.from = OFMEET_CONFIG.nickName;
            data.username = OFMEET_CONFIG.username;
            data.url = OFMEET_CONFIG.currentUrl;
            data.owner = data.username;

            console.log("ofmeet.js refreshShare", id, data);

            setTimeout(function()
            {
                APP.conference._room.sendOfMeet(JSON.stringify(data));

            }, 3000);
        }
    }

    function checkIfDocOwnerGone(id)
    {
        if (OFMEET_CONFIG.documentUser && id.indexOf(OFMEET_CONFIG.documentUser + "-") > -1)
        {
            // owner gone, end
            APP.conference._room.sendOfMeet('{"event": "ofmeet.event.url.end"}');
        }
    }

    function setupHttpFileUpload()
    {
        var dropZone = document.getElementById("chatconversation");

        if (dropZone)
        {
            dropZone.addEventListener('dragover', handleDragOver, false);
            dropZone.addEventListener('drop', handleDropFileSelect, false);
        }
    }

    function handleDragOver(evt)
    {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }

    function handleDropFileSelect(evt)
    {
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files;

        for (var i = 0, f; f = files[i]; i++)
        {
            uploadFile(f);
        }
    }

    function uploadFile(file)
    {
        console.log("uploadFile", file);

        var getUrl = null;
        var putUrl = null;
        var errorText = null;

        APP.conference._room.sendOfUpload(file, function(response)
        {
            console.log("uploadFile response", response);

            $(response).find('slot').each(function()
            {
                $(response).find('put').each(function()
                {
                    putUrl = $(this).text();
                });

                $(response).find('get').each(function()
                {
                    getUrl = $(this).text();
                });

                console.log("uploadFile", putUrl, getUrl);

                if (putUrl != null & getUrl != null)
                {
                    var req = new XMLHttpRequest();

                    req.onreadystatechange = function()
                    {
                      if (this.readyState == 4 && this.status >= 200 && this.status < 400)
                      {
                        console.log("uploadFile ok", this.statusText);
                        APP.conference._room.sendTextMessage(getUrl, OFMEET_CONFIG.username);
                      }
                      else

                      if (this.readyState == 4 && this.status >= 400)
                      {
                        console.error("uploadFile error", this.statusText);
                        APP.conference._room.sendTextMessage(this.statusText, OFMEET_CONFIG.username);
                       }

                    };
                    req.open("PUT", putUrl, true);
                    req.send(file);
                }
            });

        }, function(error) {

            $(error).find('text').each(function()
            {
                errorText = $(this).text();
                console.log("uploadFile error", errorText);
                APP.conference._room.sendTextMessage(errorText, OFMEET_CONFIG.username);
            });
        });
    }

    window.addEventListener("beforeunload", function(e)
    {
        console.log("ofmeet.js beforeunload");

        localStorage.removeItem("xmpp_username_override");
        localStorage.removeItem("xmpp_password_override");

        APP.conference._room.leave();

        hangup();

        if (of.connection)
        {
            of.connection.disconnect();
        }

        //e.returnValue = 'Ok';
    });

    window.addEventListener("unload", function (e)
    {
        console.log("ofmeet.js unload");

        localStorage.removeItem("xmpp_username_override");
        localStorage.removeItem("xmpp_password_override");
    });

    window.addEventListener("DOMContentLoaded", function()
    {
        console.log("ofmeet.js load");

        if (OFMEET_CONFIG)
        {
            createAvatar();

            if (OFMEET_CONFIG.emailAddress)    APP.conference.changeLocalEmail(OFMEET_CONFIG.emailAddress);
            if (OFMEET_CONFIG.nickName)        APP.conference.changeLocalDisplayName(OFMEET_CONFIG.nickName);
            if (OFMEET_CONFIG.userAvatar)      APP.conference.changeLocalAvatarUrl(OFMEET_CONFIG.userAvatar);
        }

        setTimeout(function() {setup();}, 1000);
    });

    if (OFMEET_CONFIG)
    {
        if (OFMEET_CONFIG.authorization)
        {
            console.log("ofmeet.js authorization", OFMEET_CONFIG);

            var authorization = atob(OFMEET_CONFIG.authorization).split(":");
            localStorage.setItem("xmpp_username_override", authorization[0] + "@" + OFMEET_CONFIG.domain);
            localStorage.setItem("xmpp_password_override", authorization[1]);
        }
    }

    config.dialInNumbersUrl     = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/phonenumberlist.json';
    config.dialInConfCodeUrl    = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/conferencemapper.json';
    config.dialOutCodesUrl      = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/countrycodes.json';
    config.dialOutAuthUrl       = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/authorizephone.json';
    config.peopleSearchUrl      = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/peoplesearch.json';
    config.inviteServiceUrl     = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/inviteservice.json';

    config.p2p = {
        enabled: true,
        stunServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
        ],
        preferH264: true
    }

    // Suspending video might cause problems with audio playback. Disabling until these are fixed.

    config.disableSuspendVideo = true;

    return of;

}(ofmeet || {}));

// external called from Jitsi-Meet

function ofmeetEtherpadClicked()
{
    console.log("ofmeet.etherpadClicked", OFMEET_CONFIG.bgWin.pade.activeUrl);

    if (OFMEET_CONFIG.bgWin.pade.activeUrl)
    {
        if (OFMEET_CONFIG.documentShare)
        {
            if (OFMEET_CONFIG.documentOwner)
            {
                OFMEET_CONFIG.documentShare = false;
                OFMEET_CONFIG.documentOwner = false;
                OFMEET_CONFIG.documentUser = null;
                OFMEET_CONFIG.largeVideoContainer = null;

                document.getElementById("largeVideoContainer").innerHTML = OFMEET_CONFIG.largeVideoContainer;

                // above code does not work properly
                // brute force solution is to reload

                APP.conference._room.sendOfMeet('{"event": "ofmeet.event.url.end"}');
                window.location.href = "chrome.index.html?room=" + OFMEET_CONFIG.room;
            }
        }
        else {
            OFMEET_CONFIG.documentShare = true;
            OFMEET_CONFIG.documentOwner = true;

            OFMEET_CONFIG.largeVideoContainer = document.getElementById("largeVideoContainer").innerHTML;

            var url = OFMEET_CONFIG.bgWin.pade.activeUrl;

            if (OFMEET_CONFIG.bgWin.pade.activeUrl.indexOf(".pdf") > -1)
            {
                url = chrome.extension.getURL("pdf/index.html?pdf=" + OFMEET_CONFIG.bgWin.pade.activeUrl);
            }

            document.getElementById("largeVideoContainer").innerHTML = OFMEET_CONFIG.iframe(url);
        }
    }
}