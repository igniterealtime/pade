(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    let _converse, Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs;
    let voiceChatEnabled = getSetting("enableVoiceChat", true), voiceChat = {}, voiceChatRoom, configuration;

    window.addEventListener("unload", function()
    {
        const peers = Object.getOwnPropertyNames(voiceChat)

        for (let i=0; i<peers.length; i++)
        {
           if (voiceChat[peers[i]].peer)         voiceChat[peers[i]].peer.close();
           if (voiceChat[peers[i]].localStream)  voiceChat[peers[i]].localStream.getTracks().forEach(track => track.stop());
        }
    });

    converse.plugins.add("voicechat", {
        dependencies: [],

        initialize: function () {
            _converse = this._converse;
            Strophe = converse.env.Strophe;
            $iq = converse.env.$iq;
            $msg = converse.env.$msg;
            $pres = converse.env.$pres;
            $build = converse.env.$build;
            b64_sha1 = converse.env.b64_sha1;
            _ = converse.env._;
            Backbone = converse.env.Backbone;
            dayjs = converse.env.dayjs;


            _converse.api.listen.on('connected', function()
            {
                if (voiceChatEnabled)
                {
                    getVoiceChatStatus(function(supported)
                    {
                        console.debug("voiceChat discover", supported);
                        voiceChatEnabled = supported;
                        if (supported) listenForVoiceChatEvents();
                    });
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                const id = view.model.get("box_id");
                const jid = view.model.get("jid");

                if (jid.endsWith(_converse.connection.domain) && voiceChatEnabled)
                {
                    voiceChat[jid] = {};

                    const voiceChat = padeapi.addToolbarItem(view, id, "voiceChat-voiceChat-" + id, '<a data-status="off" data-jid="' + jid + '" class="fas fa-volume-up" style="color:#aaa" title="Voice chat"></a>');

                    voiceChat.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        if (voiceChatEnabled)
                        {
                            const jid = evt.target.getAttribute("data-jid");
                            const view = _converse.chatboxviews.get(jid);

                            if (configuration && view)
                            {
                                voiceChat[jid].view = view;
                                startVoiceChat(view.model, this);
                            }
                        }
                        else alert("VoiceChat is not available");

                    }, false);
                }
            });

            _converse.api.listen.on('chatBoxClosed', function (view)
            {
                const jid = view.model.get("jid");
                console.debug("chatBoxClosed", jid);
                disconnectKraken(view.model, true);
            });

            console.log("voiceChat plugin is ready");
        },

        overrides: {
            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    if (this.model.get("json_type")) {
                        const json = this.model.get("json_payload");
                        console.debug('voiceChat - renderChatMessage', this.model.get("json_jid"), json);

                        if (json.method == "publish" || json.method == "end")
                        {
                            this.model.set('message', '/me ' + (json.method == 'publish' ? 'starts' : 'stops') + ' voiceChat');
                            await this.__super__.renderChatMessage.apply(this, arguments);
                        }
                    } else {
                        await this.__super__.renderChatMessage.apply(this, arguments);
                    }
                }
            },

            ChatBoxView: {

                parseMessageForCommands: function(text)
                {
                    console.debug('voiceChat - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();
                    const view = this;

                    let nick = match[2];

                    if (voiceChatEnabled && _converse.connection.pass && _converse.connection.pass != "" && (command === "vchat"))
                    {
                        let jid = view.model.get("jid");

                        if (voiceChat[jid].localStream)
                        {
                            if (this.model.get("type") == "chatroom")
                            {
                                if (!nick)
                                {
                                    this.showHelpMessages(["Nickname required"]);
                                    return true;
                                }

                                nick = nick.trim();
                                if (nick.startsWith("@")) nick = nick.substring(1);
                            }

                            const occupant = this.model.occupants.findWhere({'nick': nick});

                            if (occupant) {
                                handleUserClick(jid, occupant.get('jid'));
                            } else {
                                this.showHelpMessages(["Nickname not found"]);
                            }
                        } else {
                            this.showHelpMessages(["VoiceChat not yet started"]);
                        }
                        return true;
                    }

                    return false;
                }
            }
        },

        closeKraken: function(chat)
        {
            console.debug("closeKraken", chat);
            disconnectKraken(chat, true);
        }
    });

    function getVoiceChatStatus(callback)
    {
        var url =  "https://" + getSetting("server") + "/voiceChat/kraken";
        var options = {method: "POST", headers: {"authorization": "Basic " + btoa(getSetting("username") + ":" + _converse.connection.pass), "accept": "application/json"}, body: JSON.stringify({id: uuidv4(), method: 'info', params: []}) };

        console.debug("getVoiceChatStatus", url, options);

        fetch(url, options).then(function(response){ return response.json()}).then(function(info)
        {
            console.debug("getVoiceChatStatus", info);
            callback(true);

        }).catch(function (err) {
            callback(false);
        });
    }

    function listenForVoiceChatEvents()
    {
        console.debug("listenForVoiceChatEvents");

        getStunTurn();
        addXmppEventHandler();
    }


    function addXmppEventHandler()
    {
        _converse.connection.addHandler(function (message)
        {
            const to = Strophe.getBareJidFromJid(message.getAttribute("to"));
            const from = Strophe.getBareJidFromJid(message.getAttribute("from"));
            const json_ele = message.querySelector("json");
            const json = JSON.parse(json_ele.innerHTML);

            voiceChatRoom = decodeURIComponent(json.id);
            const room = voiceChatRoom;

            const json_jid = Strophe.getBareJidFromJid(json_ele.getAttribute("jid"));
            const json_type = json_ele.getAttribute("type");

            async function handlePeerEnd(json)
            {
                console.debug("handlePeerEnd", from, json);
                const chat = _converse.chatboxes.get(room);
                disconnectKraken(chat, false);
            }

            async function handlePeerTrickle(json)
            {
                console.debug("handlePeerTrickle", from, json);

                const data = JSON.parse(json.params[3]);
                const candidate = new RTCIceCandidate(data);
                await voiceChat[room].peer.addIceCandidate(candidate);
            }

            async function handlePeerAnswer(json)
            {
                console.debug("handlePeerAnswer", from, json);

                voiceChat[room].ucid = json.id;
                const data = JSON.parse(json.params[2]);
                await voiceChat[room].peer.setRemoteDescription(new RTCSessionDescription(data));
                sendCandidates();
            }

            async function handlePeerPublish(json)
            {
                console.debug("handlePublish", from, json);

                padeapi.notifyText("Voice Chat?", from, from, [{title: "Accept Call?", iconUrl: chrome.extension.getURL("check-solid.svg")}, {title: "Reject Call?", iconUrl: chrome.extension.getURL("times-solid.svg")}], function(notificationId, buttonIndex)
                {
                    if (buttonIndex == 0)
                    {
                        _converse.api.chats.open(from).then(chat =>
                        {
                            const room = chat.get("jid");
                            const view = _converse.chatboxviews.views[chat.id];
                            const icon = view.el.querySelector(".fa-volume-up");

                            voiceChat[room].p2p = json;
                            voiceChat[room].sfu = false;
                            voiceChat[room].view = view;
                            connectKraken(chat, icon);
                        });
                    }

                }, from);
            }

            async function handleAnswer(json)
            {
                console.debug("handleAnswer", from, json);
                voiceChat[room].ucid = json.data.track;
                await voiceChat[room].peer.setRemoteDescription(json.data.sdp);
                sendCandidates();
            }

            function sendCandidates()
            {
                console.debug("sendCandidates", room);

                if (voiceChat[room].candidates)
                {
                    for (let i=0; i<voiceChat[room].candidates.length; i++)
                    {
                        console.debug("handleAnswer - candidate", voiceChat[room].candidates[i]);
                        sendMessage('trickle', room, voiceChat[room].candidates[i]);
                    }
                }
            }

            function subscribe()
            {
                console.debug("listenForVoiceChatEvents - subscribe", room);
                sendMessage('subscribe', room);
            }

            async function handleOffer(json)
            {
                console.debug("handleOffer", from, json);
                await voiceChat[room].peer.setRemoteDescription(json.data);
                var sdp = await voiceChat[room].peer.createAnswer();
                await voiceChat[room].peer.setLocalDescription(sdp);
                sendMessage('answer', room, sdp);
            }

            if (json_type == "response")
            {
                console.debug("VoiceChat Response", from, json_jid, json.id, room, json);

                if (json.data && json.data.sdp)
                {
                    if (json.data.sdp.type === 'answer')
                    {
                        if (_converse.bare_jid == json_jid) handleAnswer(json);
                        if (voiceChat[room].peer) setTimeout(subscribe, 1000);
                    }
                    else

                    if (json.data.type === 'offer' && _converse.bare_jid == json_jid)
                    {
                        handleOffer(json);
                    }
                }
            }
            else

            if (json_type == "peer" && _converse.bare_jid == to)
            {
                console.debug("VoiceChat Request", to, from, json_jid, json.id, room, json);

                if (json.method === 'publish')  handlePeerPublish(json);
                if (json.method === 'answer')   handlePeerAnswer(json);
                if (json.method === 'trickle')  handlePeerTrickle(json);
                if (json.method === 'end')      handlePeerEnd(json);
            }

            return true;

        }, "urn:xmpp:json:0", 'message');
    }

    function getStunTurn()
    {
        configuration = {iceServers: [], bundlePolicy: 'max-bundle',  rtcpMuxPolicy: 'require', sdpSemantics: 'unified-plan'};

        _converse.connection.sendIQ($iq({type: 'get', to: _converse.connection.domain}).c('services', {xmlns: 'urn:xmpp:extdisco:1'}).c('service', {host: 'turn.' + _converse.connection.domain}), function (res)
        {
            console.debug('voiceChat - getStunAndTurnCredentials', res);

            res.querySelectorAll('service').forEach(function (el)
            {
                console.debug('getStunTurn - getStunAndTurnCredentials - item', el);
                var dict = {};

                switch (el.getAttribute('type'))
                {
                case 'stun':
                    dict.url = 'stun:' + el.getAttribute('host');
                    if (el.getAttribute('port')) {
                        dict.url += ':' + el.getAttribute('port');
                    }
                    configuration.iceServers.push(dict);
                    break;
                case 'turn':
                    dict.url = 'turn:';

                    if (el.getAttribute('username')) {
                        dict.username = el.getAttribute('username');
                    }
                    dict.url += el.getAttribute('host');

                    if (el.getAttribute('port')) {
                        dict.url += ':' + el.getAttribute('port');
                    }
                    if (el.getAttribute('transport')) {
                        dict.url += '?transport=' + el.getAttribute('transport');
                    }
                    if (el.getAttribute('password')) {
                        dict.credential = el.getAttribute('password');
                    }
                    configuration.iceServers.push(dict);
                    break;
                }
            });

            if (configuration.iceServers.length > 0)
            {
                configuration.iceTransportPolicy = 'relay';
                console.debug('getStunTurn - getStunAndTurnCredentials - config', configuration);
            }

        }, function (err) {
            console.warn('getting turn credentials failed', err);
        });
    }

    function loadJS(name)
    {
        var s1 = document.createElement('script');
        s1.src = name;
        s1.async = false;
        document.body.appendChild(s1);
    }

    function loadCSS(name)
    {
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = name;
        head.appendChild(link);
    }

    function newElement(el, id, html, className)
    {
        var ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        if (className) ele.classList.add(className);
        document.body.appendChild(ele);
        return ele;
    }

    function attachBadge(room, jid, flag, stream)
    {
        const chatbox = _converse.chatboxes.get(room);

        if (chatbox)
        {
            const occupant = chatbox.occupants.findWhere({'jid': jid});
            const id = occupant.get('id');
            const nick = occupant.get('nick');
            const element = document.getElementById(id);

            console.debug("voiceChat attachBadge", jid, nick, flag, room, element, stream);

            if (element)
            {
                const badges = element.querySelector(".occupant-badges");
                const html = '<a data-status="on" data-room="' + room + '" id="' + id + '" data-jid="' + jid + '" class="fas fa-volume-up" title="Voice chat" style="font-size: 20px;"></a>';
                let voiceChatEle = element.querySelector(".occupants-voiceChat");

                if (voiceChatEle)
                {
                    voiceChatEle.innerHTML = html;
                    voiceChatEle.style.display = "";
                }
                else {
                    voiceChatEle = newElement('span', null, html, 'occupants-voiceChat');
                    badges.appendChild(voiceChatEle);

                    voiceChatEle.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();
                        handleUserClick(evt.target.getAttribute("data-room"), evt.target.getAttribute("data-jid"));

                    }, false);

                }

                const harker = hark(stream, {interval: 100, history: 4 });

                harker.on('speaking', function()
                {
                    if (stream.getTracks()[0].enabled)
                    {
                        const icon = voiceChatEle.querySelector("a");
                        //console.debug("voiceChat speaking", jid, voiceChatEle, icon);
                        changeIcon(icon, "fa-volume-up", "green", "on");
                        showStatusMessage(voiceChat[room].view, nick + ' is speaking');
                    }
                });

                harker.on('stopped_speaking', function()
                {
                    if (stream.getTracks()[0].enabled)
                    {
                        const icon = voiceChatEle.querySelector("a");
                        //console.debug("voiceChat quiet", jid, voiceChatEle, icon);
                        changeIcon(icon, "fa-volume-up", "#aaa", "off");
                        showStatusMessage(voiceChat[room].view, nick + ' stopped speaking');
                    }
                });

                voiceChat[room].icons[jid] = {icon: voiceChatEle, stream: stream, harker: harker, nick: nick};

            }
        }
    }

    function showStatusMessage(view, msg)
    {
        if (view && msg)
        {
            const div = view.el.querySelector(".message.chat-info");
            //console.debug("showStatusMessage", div, msg);

            if (div) {
                div.innerHTML = msg
            } else {
                view.showHelpMessages([msg]);
            }
        }
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
    }

    function handleUserClick(room, jid)
    {
        const voiceChatEle = voiceChat[room].icons[jid].icon;
        const stream = voiceChat[room].icons[jid].stream;
        const nick = voiceChat[room].icons[jid].nick;
        const track = stream.getTracks()[0];

        if (voiceChatEle && stream)
        {
            const icon = voiceChatEle.querySelector("a");
            console.debug("voiceChat handleUserClick", jid, nick, voiceChatEle, icon);

            if (!track.enabled) {
                track.enabled = true;
                changeIcon(icon, "fa-volume-up", "#aaa", "on");
                showStatusMessage(voiceChat[room].view, nick + ' is unmuted');
            } else {
                track.enabled = false;
                changeIcon(icon, "fa-volume-up", "red", "off");
                showStatusMessage(voiceChat[room].view, nick + ' is muted');
            }
        }
        else log.warn("No stream or icon found");
    }

    function startVoiceChat(chat, voiceChat)
    {
        console.debug("startVoiceChat", chat, voiceChat);
        const icon = voiceChat.querySelector("a");

        if (icon.getAttribute("data-status") == "off") {

            if (confirm("VoiceChat with " + chat.get("jid"))) connectKraken(chat, icon);

        } else {
            disconnectKraken(chat, true);
        }
    }

    function changeIcon(icon, newClass, color, status)
    {
        icon.classList.remove("fa-volume-off");
        icon.classList.remove("fa-volume-up");
        icon.classList.remove("fa-volume-down");
        icon.classList.add(newClass);
        icon.style.color = color;
        icon.setAttribute("data-status", status);
    }

    function connectKraken(chat, icon)
    {
        const room = chat.get("jid");
        const sfu = chat.get("type") == "chatroom";
        console.debug("voiceChat connect kraken", room, sfu);

        setupKraken(room, sfu, icon);

        if (getSetting("enableVoiceChatText", false))
        {
            setupSpeechRecognition(room);
        }
    }

    function disconnectKraken(chat, send)
    {
        if (chat)
        {
            const room = chat.get("jid");
            console.debug("voiceChat disconnect kraken", room, voiceChat[room]);

            if (send) sendMessage('end', room);

            if (voiceChat[room])
            {
                if (voiceChat[room].icons && voiceChat[room].localStream && voiceChat[room].peer)
                {
                    voiceChat[room].localStream.getTracks().forEach((track) => { track.stop() });
                    voiceChat[room].peer.close();

                    const icons = Object.getOwnPropertyNames(voiceChat[room].icons)

                    for (let i=0; i<icons.length; i++)
                    {
                       voiceChat[room].icons[icons[i]].icon.style.display = "none";
                    }

                    updateVoiceChatIcon(room, 'voice chat stopped', "#aaa", "off");
                }

                if (voiceChat[room].recognitionActive && voiceChat[room].recognition)
                {
                    voiceChat[room].recognition.stop();
                    voiceChat[room].recognitionActive = false;
                }

                voiceChat[room] = {};
            }
        }
    }

    function updateVoiceChatIcon(room, msg, color, status)
    {
        console.debug("updateVoiceChatIcon", room, msg, color, status);

        showStatusMessage(voiceChat[room].view, msg);
        changeIcon(voiceChat[room].icon, "fa-volume-up", color, status);

        const id = voiceChat[room].view.model.get('box_id');
        const item = document.getElementById('pade-active-conv-voiceChat-' + id);

        if (item)
        {
            item.style.color = color;
            item.style.visibility = (status == "off") ? "hidden" : "visible";
        }
    }

    function getRoom()
    {
        let room = voiceChatRoom;
        if (!room) room = padeapi.getSelectedChatBox().model.get("jid");
        return room;
    }

    async function setupKraken(room, sfu, icon)
    {
        console.debug("voiceChat setup kraken", room, sfu);

        voiceChat[room].candidates = [];
        voiceChat[room].icons= {};
        voiceChat[room].icon = icon;
        voiceChat[room].sfu = sfu;

        voiceChat[room].peer = new RTCPeerConnection(configuration);
        voiceChat[room].peer.createDataChannel('useless');

        voiceChat[room].peer.onicecandidate = ({candidate}) =>
        {
            if (candidate)
            {
                const chat = getRoom();
                console.debug("candidate", voiceChat[room].ucid, candidate, chat);

                if (voiceChat[chat].ucid)
                {
                    sendMessage('trickle', chat, candidate);
                }
                else {
                    voiceChat[chat].candidates.push(candidate);
                }
            }
        };

        voiceChat[room].peer.ontrack = function(event)
        {
            const stream = event.streams[0];
            let chat = getRoom();

            function createAudioElement()
            {
                event.track.onmute = function(event)
                {
                  console.debug("voiceChat onmute", event.target.id, event);
                }

                const aid = 'peer-audio-' + stream.id;
                let el = document.getElementById(aid);

                if (el) {
                    el.srcObject = stream;
                } else {
                    el = document.createElement(event.track.kind)
                    el.id = aid;
                    el.srcObject = stream;
                    el.autoplay = true;
                    el.controls = false;
                    document.body.appendChild(el);
                }
            }

            if (!voiceChat[chat].sfu || voiceChat[chat].p2p)
            {
                console.debug('voiceChat track p2p data', stream);

                createAudioElement();
                updateVoiceChatIcon(chat, 'voice chat started', "red", "on");

            } else {
                const uname = JSON.parse(atob(decodeURIComponent(stream.id)));
                const json_jid = uname.jid;

                chat = uname.room;
                console.debug('voiceChat track sfu data', chat, json_jid, stream);

                if (json_jid == _converse.bare_jid)
                {
                    attachBadge(chat, json_jid, true, voiceChat[chat].localStream);
                    updateVoiceChatIcon(chat, 'voice chat started', "red", "on");
                }
                else {
                    createAudioElement();
                    attachBadge(chat, json_jid, true, stream);
                }
            }
        }

        try {
            const constraints = {audio: true, video: false };
            voiceChat[room].localStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.debug("voiceChat - local stream", voiceChat[room].localStream);

            voiceChat[room].localStream.getTracks().forEach((track) => {
                voiceChat[room].peer.addTrack(track, voiceChat[room].localStream);
            });

            if (voiceChat[room].p2p) {
                answerStream(room);
            } else {
                publishStream(room);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function answerStream(room)
    {
        voiceChat[room].rnameRPC = encodeURIComponent(Strophe.getNodeFromJid(room));
        voiceChat[room].unameRPC = encodeURIComponent(btoa(JSON.stringify({room: room, jid: _converse.bare_jid, nick: _converse.nickname})));

        console.debug("answerStream", room, voiceChat[room].p2p);

        const data = JSON.parse(voiceChat[room].p2p.params[2]);

        await voiceChat[room].peer.setRemoteDescription(new RTCSessionDescription(data));
        var sdp = await voiceChat[room].peer.createAnswer();
        await voiceChat[room].peer.setLocalDescription(sdp);
        sendMessage('answer', room, sdp);
    }

    async function publishStream(room)
    {
        voiceChat[room].rnameRPC = encodeURIComponent(Strophe.getNodeFromJid(room));
        voiceChat[room].unameRPC = encodeURIComponent(btoa(JSON.stringify({room: room, jid: _converse.bare_jid, nick: _converse.nickname})));

        await voiceChat[room].peer.setLocalDescription(await voiceChat[room].peer.createOffer());

        console.debug("voiceChat - publish", room, voiceChat[room].rnameRPC, voiceChat[room].unameRPC, voiceChat[room].peer.localDescription);
        sendMessage('publish', room, voiceChat[room].peer.localDescription);
    }

    function sendMessage(method, room, payload)
    {
        console.debug("sendMessage", method, room, payload);

        if (voiceChat[room])
        {
            const target = voiceChat[room].sfu ? room : _converse.bare_jid;
            const json_type = voiceChat[room].sfu ? 'request' : 'peer';
            const type = voiceChat[room].sfu ? 'groupchat' : 'chat';
            const params = [voiceChat[room].rnameRPC, voiceChat[room].unameRPC];

            if (voiceChat[room].ucid)    params.push(voiceChat[room].ucid);
            if (payload)            params.push(JSON.stringify(payload));

            const body = JSON.stringify({id: target, method: method, params: params});
            _converse.connection.send($msg({type: type, to: room}).c("json",{xmlns: "urn:xmpp:json:0", type: json_type}).t(body));
        }
        else console.warn("sendMessage - voice chat not ready");
    }

    function uuidv4()
    {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
    }

    function setupSpeechRecognition(room)
    {
        console.debug("setupSpeechRecognition", room);

        voiceChat[room].recognition = new webkitSpeechRecognition();
        voiceChat[room].recognition.lang = getSetting("transcribeLanguage", "en-GB");
        voiceChat[room].recognition.continuous = true;
        voiceChat[room].recognition.interimResults = false;

        voiceChat[room].recognition.onresult = function(event)
        {
            console.debug("Speech recog event", event)

            if(event.results[event.resultIndex].isFinal==true)
            {
                const transcript = event.results[event.resultIndex][0].transcript;
                console.debug("Speech recog transcript", transcript);
                voiceChat[room].view.model.sendMessage(transcript);
            }
        }

        voiceChat[room].recognition.onspeechend  = function(event)
        {
            console.debug("Speech recog onspeechend", event);
        }

        voiceChat[room].recognition.onstart = function(event)
        {
            console.debug("Speech to text started", event);
            voiceChat[room].recognitionActive = true;
        }

        voiceChat[room].recognition.onend = function(event)
        {
            console.debug("Speech to text ended", event);

            if (voiceChat[room].recognitionActive)
            {
                console.debug("Speech to text restarted");
                setTimeout(function() {voiceChat[room].recognition.start()}, 1000);
            }
        }

        voiceChat[room].recognition.onerror = function(event)
        {
            console.debug("Speech to text error", event);
        }

        voiceChat[room].recognition.start();
    }
}));
