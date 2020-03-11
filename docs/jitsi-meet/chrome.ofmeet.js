/**
 * ofmeet.js
 */

var ofmeet = (function(of)
{
    var firstTime = true;
    var firstTrack = true;
    var participants = {}
    var largeVideo = null;
    var remoteController = null;
    var remoteControlPort = null;
    var recordingAudioStream = null;
    var recordingVideoStream = null;

    var nickColors = {}

    var getRandomColor = function getRandomColor(nickname)
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


    of.createAvatar = function(nickname, width, height, font)
    {
        if (getSetting("converseRandomAvatars", false))
        {
            return "https://" + pade.server + "/randomavatar/" + nickname
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

        if (nickname)
        {
            var name = nickname.split(" ");
            if (name.length == 1) name = nickname.split(".");
            if (name.length == 1) name = nickname.split("-");
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
            }
        }

        var data = canvas.toDataURL();
        document.body.removeChild(canvas);
        return canvas.toDataURL();
    }

    function setup()
    {
        console.debug("ofmeet.js setup", APP.connection, OFMEET_CONFIG.bgWin);

        if (!APP.connection || !OFMEET_CONFIG.bgWin)
        {
            setTimeout(function() {setup();}, 1500);
            return;
        }
        __init();

        window.addEventListener('message', function (event)
        {
            console.debug("addListener message", event.data);

            // messages from remote control
            // {"postis":true,"scope":"jitsi-remote-control","method":"message","params":{"type":"request","data":{"name":"remote-control","type":"start","sourceId":"8Ppvxxlv3Zgncd5uiKx6zA=="},"id":1}}
            // {"postis":true,"scope":"jitsi-remote-control","method":"message","params":{"type":"event","data":{"name":"remote-control","type":"stop"}}}

            if (event.data && typeof event.data === 'string' && event.data.indexOf("jitsi-remote-control") > -1)
            {
                var eventData = JSON.parse(event.data);

                if (eventData)
                {
                    var data = eventData.params.data;

                    if (data.type == "start" && remoteController != null)
                    {
                        console.debug("addListener start", data);

                        APP.remoteControl.receiver.sendRemoteControlEndpointMessage(remoteController._id, {
                            type: "permissions",
                            action: remoteControlPort ? "grant" : "deny"
                        })
                    }
                    else

                    if (data.type == "stop")
                    {
                        remoteController = null;
                    }
                }

            }
            else

            // these are messages from the collaboration app in the shadow DOM content page

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
                    console.debug("addListener message collab", event.data);

                    // Starts here. When content page is ready and we have content to share,
                    // we start mouse/key event feed

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
            //console.debug("ofmeet.js incoming xmpp", message);

            $(message).find('ofmeet').each(function ()
            {
                try {
                    // these are messages from ofchat

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

                    // these are p2p messages from users collaborating

                    if (json.event == "ofmeet.event.pdf.goto" || json.event == "ofmeet.event.pdf.ready" || json.event == "ofmeet.event.url.ready")
                    {
                        //console.debug("ofmeet.js document share", json);

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

                            var reloadUrl = "chrome.index.html?room=" + OFMEET_CONFIG.room + (OFMEET_CONFIG.mode ? "&mode=" + OFMEET_CONFIG.mode : "");
                            window.location.href = reloadUrl;
                        }
                    }
                    else

                    if (json.event == "ofmeet.event.pdf.message")
                    {
                        var ofMeetContent = document.getElementById("ofmeet-content");

                        if (ofMeetContent && (OFMEET_CONFIG.showSharedCursor || !OFMEET_CONFIG.showSharedCursor && json.from != OFMEET_CONFIG.nickName))
                        {
                            //console.debug("ofmeet.event.pdf.message", json);
                            ofMeetContent.contentWindow.handlePdfShare(json.msg, json.from);
                        }
                    }
                    else

                    if (json.event == "ofmeet.event.url.message")
                    {
                        var ofMeetContent = document.getElementById("ofmeet-content");

                        if (ofMeetContent)
                        {
                            //console.debug("ofmeet.event.url.message", json);
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
            console.debug("Connection Disconnected!")
        });

        setupHttpFileUpload();
    }

    function __init()
    {
        console.debug("ofmeet.js __init");
        of.subtitles = document.getElementById("subtitles");

        remoteControlPort = OFMEET_CONFIG.bgWin.pade.remoteControlPort;

        if (remoteControlPort)
        {
            APP.remoteControl.receiver._onRemoteControlSupported();
        }

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.ENDPOINT_MESSAGE_RECEIVED, function(participant, message)
        {
            if (message.type != "stats")
            {
                console.debug("ofmeet.js endpoint_message", participant._id, message);

                if (message.type == "permissions")
                {
                    remoteController = participant;
                }
                else

                if (message.type == "keydown")
                {
                    remoteControlPort.postMessage({event: "ofmeet.remote.keydown", key: message.key});
                }
                else

                if (message.type == "keyup")
                {
                    remoteControlPort.postMessage({event: "ofmeet.remote.keyup", key: message.key});
                }
                else
                if (message.type == "mousemove")
                {
                    remoteControlPort.postMessage({event: "ofmeet.remote.mousemove", x: message.x, y: message.y});
                }
                else

                if (message.type == "mousedown")
                {
                    remoteControlPort.postMessage({event: "ofmeet.remote.mousedown", button: message.button});
                }
                else

                if (message.type == "mouseup")
                {
                    remoteControlPort.postMessage({event: "ofmeet.remote.mouseup", button: message.button});
                }
                else

                if (message.type == "mousedblclick")
                {
                    remoteControlPort.postMessage({event: "ofmeet.remote.mousedblclick", button: message.button});
                }
                else

                if (message.type == "mousescroll")
                {
                    remoteControlPort.postMessage({event: "ofmeet.remote.wheel", button: message.deltaY});
                }
                else

                if (message.type == "stop")
                {
                    if (remoteController)
                    {
                        APP.remoteControl.receiver.sendRemoteControlEndpointMessage(remoteController._id, {
                            type: "stop"
                        });
                    }
                }
            }
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.CONFERENCE_JOINED, function()
        {
            console.debug("ofmeet.js me joined");
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.CONFERENCE_LEFT, function()
        {
            console.debug("ofmeet.js me left");
            OFMEET_CONFIG.bgWin.etherlynk.stopRecorder();

            recordingAudioStream = null;
            recordingVideoStream = null;

            if (of.recognition)
            {
                of.recognitionActive = false;
                of.recognition.stop();
            }
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.MESSAGE_RECEIVED , function(id, text, ts)
        {
            var participant = APP.conference.getParticipantById(id);
            var displayName = participant ? participant._displayName || id.split("-")[0] : "Me";

            console.debug("ofmeet.js message", id, text, ts, displayName);

            if (OFMEET_CONFIG.enableCaptions && text.indexOf("https://") == -1)
            {
                of.subtitles.innerHTML = displayName + " : " + text;
            }
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.USER_LEFT, function(id)
        {
            console.debug("ofmeet.js user left", id);
            checkIfDocOwnerGone(id);
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.USER_JOINED, function(id)
        {
            console.debug("ofmeet.js user joined", id);
            refreshShare(id);
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.DOMINANT_SPEAKER_CHANGED, function(id)
        {
            //console.debug("ofmeet.js dominant speaker changed", id);
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_REMOVED, function(track)
        {
            console.debug("ofmeet.js track removed", track.getParticipantId());

            if (APP.conference.getMyUserId() == track.getParticipantId())
            {
                console.debug("ofmeet.js track removed", APP.conference.getMyUserId(), track.getParticipantId(), track.getType());

                OFMEET_CONFIG.bgWin.etherlynk.stopRecorder();

                if (track.getType() == "audio") recordingAudioStream = null;
                if (track.getType() == "video") recordingVideoStream = null;
            }
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_ADDED, function(track)
        {
            if (APP.conference.getMyUserId() == track.getParticipantId())
            {
                console.debug("ofmeet.js track added", track.getParticipantId(), track.getType(), track.isMuted());

                if (recordingVideoStream && recordingAudioStream && track.getType() == "video") // new video stream, close old
                {
                    OFMEET_CONFIG.bgWin.etherlynk.stopRecorder(function(size)
                    {
                        console.debug("ofmeet.js recording saved " + size);
                        recordingVideoStream = track.stream;

                        navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream)
                        {
                            startRecording(stream, recordingVideoStream);

                        }).catch(function(err) {
                            startRecording(recordingAudioStream, recordingVideoStream);
                        });
                    });
                }
                else

                if (config.startWithAudioMuted || config.startWithVideoMuted)
                {
                    if (track.getType() == "audio") recordingAudioStream = track.stream;
                    if (track.getType() == "video") recordingVideoStream = track.stream;

                    if (OFMEET_CONFIG.recordVideo)
                    {
                        if (recordingAudioStream && recordingVideoStream) startRecording(recordingAudioStream, recordingVideoStream);
                    }
                    else

                    if (OFMEET_CONFIG.recordAudio)
                    {
                        if (recordingAudioStream) startRecording(recordingAudioStream, null);
                    }
                }
            }
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, function(track)
        {
            console.debug("ofmeet.js track muted", track.getParticipantId(), track.getType(), track.isMuted());

            if (APP.conference.getMyUserId() == track.getParticipantId())
            {
                if (of.localStream)     // SIP synch
                {
                    var tracks = of.localStream.getAudioTracks();

                    for (var i=0; i<tracks.length; i++)
                    {
                        tracks[i].enabled = !track.isMuted();
                    }
                }

                if (of.recognition)
                {
                    if (track.isMuted())    // speech recog synch
                    {
                        console.debug("muted, stopping speech transcription");
                        of.recognitionActive = false;
                        of.recognition.stop();

                    } else {
                        console.debug("unmuted, starting speech transcription");
                        of.recognition.start();
                    }
                }
            }
        });

        if (APP.conference.roomName)
        {
            if (OFMEET_CONFIG.isSwitchAvailable)
            {
                of.dialstring = APP.conference.roomName;
                //connectSIP();

                /*
                document.addEventListener('contextmenu', function(e)
                {
                    e.preventDefault();

                    if (document.pictureInPictureElement)
                    {
                        document.exitPictureInPicture()
                          .then(() => {  })
                          .catch(() => { });

                    } else {

                        document.getElementById("largeVideo").requestPictureInPicture()
                        .then(() => { })
                        .catch(() => { });
                    }

                }, false)
                */
            }

            if (OFMEET_CONFIG.recordAudio || OFMEET_CONFIG.recordVideo)
            {
                if (!config.startWithAudioMuted && !config.startWithVideoMuted)
                {
                    startRecording(APP.conference.localAudio.stream, APP.conference.localVideo.stream);

                    recordingAudioStream = APP.conference.localAudio.stream;
                    recordingVideoStream = APP.conference.localVideo.stream;
                }
            }

            if (OFMEET_CONFIG.enableTranscription)
            {
                setupSpeechRecognition();
                of.recognition.start();
            }

            if (OFMEET_CONFIG.mode)  // webinar presenter mode, dont show remote users. only show you
            {
                if (OFMEET_CONFIG.mode == "attendee")
                {
                    interfaceConfig.FILM_STRIP_MAX_HEIGHT = 0;
                    OFMEET_CONFIG.showSharedCursor = false; // only show presenter cursor, not self
                }

                if (OFMEET_CONFIG.mode == "presenter") APP.UI.clickOnVideo(0);

                document.title = interfaceConfig.APP_NAME + " | Webinar " + OFMEET_CONFIG.mode;
                APP.UI.toggleFilmstrip();
            }
            else document.title = interfaceConfig.APP_NAME + " | " + APP.conference.roomName;
        }
    }

    function startRecording(audioStream, videoStream)
    {
        var nick = APP.conference.getMyUserId();
        var prefix = OFMEET_CONFIG.room + "." + nick + "." + getUniqueID();
        var audioFileName = prefix + ".audio.webm";
        var videoFileName = prefix + ".video.webm";

        OFMEET_CONFIG.bgWin.etherlynk.startRecorder(audioStream, videoStream, OFMEET_CONFIG.room, APP.conference.getMyUserId(), audioFileName, videoFileName);

        if (getSetting("postVideoRecordingUrl", false))
        {
            var audioFileUrl = "https://" + OFMEET_CONFIG.hostname + "/ofmeet-cdn/recordings/" + audioFileName;
            var videoFileUrl = "https://" + OFMEET_CONFIG.hostname + "/ofmeet-cdn/recordings/" + videoFileName;

            var currentChat = OFMEET_CONFIG.bgWin.getSelectedChatBox();

            if (OFMEET_CONFIG.recordVideo)
            {
                APP.conference._room.sendOfText(videoFileUrl);
                if (currentChat) currentChat.model.sendMessage(videoFileUrl);
            }
            else

            if (OFMEET_CONFIG.recordAudio)
            {
                APP.conference._room.sendOfText(audioFileUrl);
                if (currentChat) currentChat.model.sendMessage(audioFileUrl);
            }
        }
    }

    function connectSIP()
    {
        console.debug("ofmeet.js connectSIP", config);

        var getUserMediaFailure = function(e)
        {
            window.console.error('getUserMedia failed:', e);
        }

        var getUserMediaSuccess = function(stream)
        {
            of.localStream = stream;
            of.sipUI = OFMEET_CONFIG.bgWin.etherof.sip.sipUI;

            of.sipUI.on('connected', function(e) {
                console.debug("SIP Connected");
            });

            of.sipUI.on('disconnected', function(e) {
                console.debug("SIP Disconnected");
            });

            of.sipUI.on('registered', function(e) {
                console.debug("SIP Registered");
            });

            of.sipUI.on('registrationFailed', function(e) {
                console.debug("Error: Registration Failed");
                APP.UI.messageHandler.notify("SIP Error " + e, null, null, "");
            });

            of.sipUI.on('unregistered', function(e) {
                console.debug("Error: Unregistered");
            });

            of.sipUI.on('message', function(message) {
                console.debug("SIP Message", message.body);
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

        console.debug("ofmeet.js. SIP", OFMEET_CONFIG.sip, config.iceServers);
        navigator.getUserMedia({ audio : true, video : false }, getUserMediaSuccess, getUserMediaFailure);
    }

    function removeSipParticipant(event)
    {
        if (APP.conference.roomName == event.conference)
        {
            console.debug("ofmeet.js. removeSipParticipant", event);
            APP.UI.removeUser(event.id, event.source);

            delete participants[event.id];
        }
    }

    function addSipParticipant(event)
    {
        if (participants[event.id]) return;
        if (APP.conference.roomName != event.conference) return;

        console.debug("ofmeet.js. addSipParticipant", event);

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
        console.debug("ofmeet.js. SIP", OFMEET_CONFIG.sip, config.iceServers);

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

            console.debug("ofmeet.js refreshShare", id, data);

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
        console.debug("uploadFile", file);

        var getUrl = null;
        var putUrl = null;
        var errorText = null;

        APP.conference._room.sendOfUpload(file, function(response)
        {
            console.debug("uploadFile response", response);

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

                console.debug("uploadFile", putUrl, getUrl);

                if (putUrl != null & getUrl != null)
                {
                    var req = new XMLHttpRequest();

                    req.onreadystatechange = function()
                    {
                      if (this.readyState == 4 && this.status >= 200 && this.status < 400)
                      {
                        console.debug("uploadFile ok", this.statusText);
                        APP.conference._room.sendOfText(getUrl);
                      }
                      else

                      if (this.readyState == 4 && this.status >= 400)
                      {
                        console.error("uploadFile error", this.statusText);
                        APP.conference._room.sendOfText(this.statusText);
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
                console.debug("uploadFile error", errorText);
                APP.conference._room.sendOfText(errorText);
            });
        });
    }

    function setupSpeechRecognition()
    {
        console.debug("setupSpeechRecognition", event);

        of.recognition = new webkitSpeechRecognition();
        of.recognition.lang = OFMEET_CONFIG.transcribeLanguage;
        of.recognition.continuous = true;
        of.recognition.interimResults = false;

        of.recognition.onresult = function(event)
        {
            //console.debug("Speech recog event", event)

            if(event.results[event.resultIndex].isFinal==true)
            {
                var transcript = event.results[event.resultIndex][0].transcript;
                console.debug("Speech recog transcript", transcript);
                sendSpeechRecognition(transcript);
            }
        }

        of.recognition.onspeechend  = function(event)
        {
            //console.debug("Speech recog onspeechend", event);
        }

        of.recognition.onstart = function(event)
        {
            //console.debug("Speech to text started", event);
            of.recognitionActive = true;
        }

        of.recognition.onend = function(event)
        {
            //console.debug("Speech to text ended", event);

            if (of.recognitionActive)
            {
                //console.warn("Speech to text restarted");
                of.recognition.start();
            }
        }

        of.recognition.onerror = function(event)
        {
            console.error("Speech to text error", event);
        }
    }

    function sendSpeechRecognition(result)
    {
        if (result != "" && APP.conference && APP.conference._room)
        {
            var message = "[" + result + "]";
            console.debug("Speech recog result", APP.conference._room, message,  OFMEET_CONFIG.username);

            APP.conference._room.sendOfText(message);
            of.currentTranslation = [];
        }
    }

    window.addEventListener("beforeunload", function(e)
    {
        console.debug("ofmeet.js beforeunload");

        //e.returnValue = 'Ok';

        localStorage.removeItem("xmpp_username_override");
        localStorage.removeItem("xmpp_password_override");

        if (APP.conference._room) APP.conference._room.leave();

        hangup();

        if (of.connection)
        {
            of.connection.disconnect();
        }
    });

    window.addEventListener("unload", function (e)
    {
        console.debug("ofmeet.js unload");

        var setSetting = function(name, value)
        {
            window.localStorage["store.settings." + name] = JSON.stringify(value);
        }

        localStorage.removeItem("xmpp_username_override");
        localStorage.removeItem("xmpp_password_override");

        setSetting("videoWindow", {top: window.screenTop, left: window.screenLeft, width: window.outerWidth, height: window.outerHeight});
    });

    window.addEventListener("DOMContentLoaded", function()
    {
        console.debug("ofmeet.js load");
        setTimeout(function() {setup();}, 1000);
    });

    if (OFMEET_CONFIG)
    {
        if (OFMEET_CONFIG.authorization && OFMEET_CONFIG.sameOrigin)
        {
            console.debug("ofmeet.js authorization", OFMEET_CONFIG);

            var authorization = atob(OFMEET_CONFIG.authorization).split(":");
            localStorage.setItem("xmpp_username_override", authorization[0] + "@" + OFMEET_CONFIG.domain);
            localStorage.setItem("xmpp_password_override", authorization[1]);
        }
    }


    //config.dialInNumbersUrl     = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/phonenumberlist.json';
    //config.dialInConfCodeUrl    = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/conferencemapper.json';
    //config.dialOutCodesUrl      = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/countrycodes.json';
    //config.dialOutAuthUrl       = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/authorizephone.json';
    //config.peopleSearchUrl      = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/peoplesearch.json';
    //config.inviteServiceUrl     = 'https://' + OFMEET_CONFIG.hostname + '/ofmeet/inviteservice.json';

    config.p2p = {
        enabled: getSetting("p2pMode", false),
        stunServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
        ],
        preferH264: false
    }

    // Suspending video might cause problems with audio playback. Disabling until these are fixed.

    config.disableSuspendVideo = true;
    //config.disableThirdPartyRequests = true;

    if (OFMEET_CONFIG.mode)   // webinar mode, let presenter start manually
    {
        config.startWithAudioMuted = true;
        config.startWithVideoMuted = true;

        if (OFMEET_CONFIG.mode == "attendee")
        {
            interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("microphone"), 1);
            interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("camera"), 1);
            interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("desktop"), 1);
            interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("recording"), 1);
            interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("livestreaming"), 1);
            interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("etherpad"), 1);
            interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("sharedvideo"), 1);
            interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("filmstrip"), 1);
            interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("invite"), 1);
            interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("stats"), 1);
            interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("tileview"), 1);
        }
    }

    if (!OFMEET_CONFIG.converseEmbedOfMeet)
    {
        interfaceConfig.TOOLBAR_BUTTONS.splice(interfaceConfig.TOOLBAR_BUTTONS.indexOf("hangup"), 1);
    }
    return of;

}(ofmeet || {}));

// external called from Jitsi-Meet

function ofmeetEtherpadClicked()
{
    // TODO Collaboration disabled in generic version
    // Only implement in custom builds

    /*
    console.debug("ofmeet.etherpadClicked", OFMEET_CONFIG.bgWin.pade.activeUrl);

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
                var reloadUrl = "chrome.index.html?room=" + OFMEET_CONFIG.room + (OFMEET_CONFIG.mode ? "&mode=" + OFMEET_CONFIG.mode : "");
                window.location.href =reloadUrl;
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
    */
}
