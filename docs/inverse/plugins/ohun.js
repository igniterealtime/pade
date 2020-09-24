(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    let _converse, Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs;
    let ohunEnabled = getSetting("enableVoiceChat", true), ohun = {}, ohunRoom, configuration;

    window.addEventListener("unload", function()
    {
        const peers = Object.getOwnPropertyNames(ohun)

        for (let i=0; i<peers.length; i++)
        {
           ohun[peers[i]].peer.close();
           ohun[peers[i]].localStream.getTracks().forEach(track => track.stop());
        }
    });

    converse.plugins.add("ohun", {
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
                getOhunStatus(function(supported)
                {
                    console.debug("ohun discover", supported);
                    ohunEnabled = supported;
                    if (supported) listenForOhunEvents();
                });
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                if (view.model.get("type") == "chatroom")
                {
                    const id = view.model.get("box_id");
                    const jid = view.model.get("jid");

                    if (jid.endsWith(_converse.connection.domain) && ohunEnabled)
                    {
                        const voiceChat = padeapi.addToolbarItem(view, id, "ohun-voicechat-" + id, '<a data-status="off" data-jid="' + jid + '" class="fas fa-volume-up" title="Voice chat"></a>');

                        voiceChat.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();
                            const groupchat = _converse.chatboxes.get(evt.target.getAttribute("data-jid"));
                            if (configuration && groupchat) startVoiceChat(groupchat, this);

                        }, false);
                    }
               }
            });

            _converse.api.listen.on('chatBoxClosed', function (view)
            {
                const jid = view.model.get("jid");
                console.debug("chatBoxClosed", jid);
                disconnectKraken(view.model);
            });

            console.log("ohun plugin is ready");
        },

        overrides: {
            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    if (this.model.get("json_type")) {
                        const json = this.model.get("json_payload");
                        console.debug('ohun - renderChatMessage', this.model.get("json_jid"), json);

                        if (json.method == "publish" || json.method == "end")
                        {
                            this.model.set('message', '/me ' + (json.method == 'publish' ? 'starts' : 'stops') + ' ohun');
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
                    console.debug('ohun - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();
                    const view = this;

                    let nick = match[2];

                    if (ohunEnabled && _converse.connection.pass && _converse.connection.pass != "" && (command === "vchat"))
                    {
                        let jid = view.model.get("jid");

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
                        return true;
                    }

                    return false;
                }
            }
        }
    });

    function getOhunStatus(callback)
    {
        var url =  "https://" + getSetting("server") + "/ohun/kraken";
        var options = {method: "POST", headers: {"authorization": "Basic " + btoa(getSetting("username") + ":" + _converse.connection.pass), "accept": "application/json"}, body: JSON.stringify({id: uuidv4(), method: 'info', params: []}) };

        console.debug("getOhunStatus", url, options);

        fetch(url, options).then(function(response){ return response.json()}).then(function(info)
        {
            console.debug("getOhunStatus", info);
            callback(true);

        }).catch(function (err) {
            callback(false);
        });
    }

    function listenForOhunEvents()
    {
        console.debug("listenForOhunEvents");

        getStunTurn();
        addXmppEventHandler();
    }


    function addXmppEventHandler()
    {
        _converse.connection.addHandler(function (message)
        {
            const from = Strophe.getResourceFromJid(message.getAttribute("from"));
            const json_ele = message.querySelector("json");
            const json = JSON.parse(json_ele.innerHTML);

            const json_jid = Strophe.getBareJidFromJid(json_ele.getAttribute("jid"));
            const json_type = json_ele.getAttribute("type");
            if (json_type != "response") return true;

            const ohunRoom = room = decodeURIComponent(json.id);
            console.log("Ohun Message", from, json_type, json_jid, json.id, room, json);

            async function handleAnswer(json)
            {
                console.log("handleAnswer", from, json);
                ohun[room].ucid = json.data.track;
                await ohun[room].peer.setRemoteDescription(json.data.sdp);

                if (ohun[room].candidates)
                {
                    for (let i=0; i<ohun[room].candidates.length; i++)
                    {
                        console.log("handleAnswer - candidate", ohun[room].candidates[i]);
                        const body = JSON.stringify({id: room, method: 'trickle', params: [ohun[room].rnameRPC, ohun[room].unameRPC, ohun[room].ucid, JSON.stringify(ohun[room].candidates[i])]});
                        _converse.connection.send($msg({type: 'groupchat', to: room}).c("json",{xmlns: "urn:xmpp:json:0", type: "request"}).t(body));
                    }
                }
            }

            function subscribe()
            {
                console.log("listenForOhunEvents - subscribe", room);
                const body = JSON.stringify({id: room, method: 'subscribe', params: [ohun[room].rnameRPC, ohun[room].unameRPC, ohun[room].ucid]})
                _converse.connection.send($msg({type: 'groupchat', to: room}).c("json",{xmlns: "urn:xmpp:json:0", type: "request"}).t(body));
            }

            async function handleOffer(json)
            {
                console.log("handleOffer", from, json);
                await ohun[room].peer.setRemoteDescription(json.data);
                var sdp = await ohun[room].peer.createAnswer();
                await ohun[room].peer.setLocalDescription(sdp);
                const body = JSON.stringify({id: room, method: 'answer', params: [ohun[room].rnameRPC, ohun[room].unameRPC, ohun[room].ucid, JSON.stringify(sdp)]});
                _converse.connection.send($msg({type: 'groupchat', to: room}).c("json",{xmlns: "urn:xmpp:json:0", type: "request"}).t(body));
            }

            if (json.data && json.data.sdp)
            {
                if (json.data.sdp.type === 'answer')
                {
                    if (_converse.bare_jid == json_jid) handleAnswer(json);
                    setTimeout(subscribe, 1000);
                }
                else

                if (json.data.type === 'offer' && _converse.bare_jid == json_jid)
                {
                    handleOffer(json);
                }
            }

            return true;

        }, "urn:xmpp:json:0", 'message');
    }

    function getStunTurn()
    {
        configuration = {iceServers: [], bundlePolicy: 'max-bundle',  rtcpMuxPolicy: 'require', sdpSemantics: 'unified-plan'};

        _converse.connection.sendIQ($iq({type: 'get', to: _converse.connection.domain}).c('services', {xmlns: 'urn:xmpp:extdisco:1'}).c('service', {host: 'turn.' + _converse.connection.domain}), function (res)
        {
            console.debug('ohun - getStunAndTurnCredentials', res);

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
            const element = document.getElementById(id);

            console.debug("ohun attachBadge", jid, id, flag, room, element, stream);

            if (element)
            {
                const badges = element.querySelector(".occupant-badges");
                const html = '<a data-status="on" data-room="' + room + '" id="' + id + '" data-jid="' + jid + '" class="fas fa-volume-up" title="Voice chat" style="font-size: 20px;"></a>';
                let ohunEle = element.querySelector(".occupants-ohun");

                if (ohunEle)
                {
                    ohunEle.innerHTML = html;
                    ohunEle.style.display = "";
                }
                else {
                    ohunEle = newElement('span', null, html, 'occupants-ohun');
                    badges.appendChild(ohunEle);

                    ohunEle.addEventListener('click', function(evt)
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
                        const icon = ohunEle.querySelector("a");
                        //console.debug("ohun speaking", jid, ohunEle, icon);
                        changeIcon(icon, "fa-volume-up", "green", "on");
                    }
                });

                harker.on('stopped_speaking', function()
                {
                    if (stream.getTracks()[0].enabled)
                    {
                        const icon = ohunEle.querySelector("a");
                        //console.debug("ohun quiet", jid, ohunEle, icon);
                        changeIcon(icon, "fa-volume-up", "#aaa", "off");
                    }
                });

                ohun[room].icons[jid] = {icon: ohunEle, stream: stream, harker: harker};

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
        const ohunEle = ohun[room].icons[jid].icon;
        const stream = ohun[room].icons[jid].stream;
        const track = stream.getTracks()[0];

        if (ohunEle && stream)
        {
            const icon = ohunEle.querySelector("a");
            console.debug("ohun handleUserClick", jid, ohunEle, icon);

            if (!track.enabled) {
                track.enabled = true;
                changeIcon(icon, "fa-volume-up", "#aaa", "on");
                padeapi.getSelectedChatBox().showHelpMessages([jid + ' is unmuted']);
            } else {
                track.enabled = false;
                changeIcon(icon, "fa-volume-up", "red", "off");
                padeapi.getSelectedChatBox().showHelpMessages([jid + ' is muted']);
            }
        }
        else log.warn("No stream or icon found");
    }

    function startVoiceChat(chat, voiceChat)
    {
        console.debug("startVoiceChat", chat, voiceChat);
        const icon = voiceChat.querySelector("a");

        if (icon.getAttribute("data-status") == "off") {
            changeIcon(icon, "fa-volume-up", "green", "on");
            padeapi.getSelectedChatBox().showHelpMessages(['voice chat started']);
            connectKraken(chat);
        } else {
            changeIcon(icon, "fa-volume-up", "#aaa", "off");
            padeapi.getSelectedChatBox().showHelpMessages(['voice chat stopped']);
            disconnectKraken(chat);
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

    function connectKraken(chat)
    {
        const room = chat.get("jid");
        console.debug("ohun connect kraken", room);

        setupKraken(room);
    }

    function disconnectKraken(chat)
    {
        const room = chat.get("jid");
        console.debug("ohun disconnect kraken", room, ohun[room]);

        if (ohun[room])
        {
            ohun[room].localStream.getTracks().forEach((track) => { track.stop() });
            ohun[room].peer.close();

            const icons = Object.getOwnPropertyNames(ohun[room].icons)

            for (let i=0; i<icons.length; i++)
            {
               ohun[room].icons[icons[i]].icon.style.display = "none";
            }

            const body = JSON.stringify({id: room, method: 'end', params: [ohun[room].rnameRPC, ohun[room].unameRPC, ohun[room].ucid]})
            _converse.connection.send($msg({type: 'groupchat', to: room}).c("json",{xmlns: "urn:xmpp:json:0", type: "request"}).t(body));
        }
    }

    function getRoom()
    {
        let room = ohunRoom;
        if (!room) room = padeapi.getSelectedChatBox().model.get("jid");
        return room;
    }

    async function setupKraken(room)
    {
        console.debug("ohun setup kraken", room);
        ohun[room] = {candidates: [], icons: {}};

        ohun[room].peer = new RTCPeerConnection(configuration);
        ohun[room].peer.createDataChannel('useless');

        ohun[room].peer.onicecandidate = ({candidate}) =>
        {
            if (candidate)
            {
                const room = getRoom();
                console.log("candidate", ohun[room].ucid, candidate, room);

                if (ohun[room].ucid)
                {
                    const body = JSON.stringify({id: room, method: 'trickle', params: [ohun[room].rnameRPC, ohun[room].unameRPC, ohun[room].ucid, JSON.stringify(candidate)]});
                    _converse.connection.send($msg({type: 'groupchat', to: room}).c("json",{xmlns: "urn:xmpp:json:0", type: "request"}).t(body));
                }
                else {
                    ohun[room].candidates.push(candidate);
                }
            }
        };

        ohun[room].peer.ontrack = function(event)
        {
            const stream = event.streams[0];
            const uname = JSON.parse(atob(decodeURIComponent(stream.id)));
            const room = uname.room;
            const json_jid = uname.jid;
            console.debug('ohun track event', room, json_jid, stream);

            if (json_jid == _converse.bare_jid)
            {
                attachBadge(room, json_jid, true, ohun[room].localStream);
            }
            else {
                event.track.onmute = function(event)
                {
                  console.log("ohun onmute", event.target.id, event);
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

                attachBadge(room, json_jid, true, stream);
            }
        }

        try {
            const constraints = {audio: true, video: false };
            ohun[room].localStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.debug("ohun - local stream", ohun[room].localStream);

            ohun[room].localStream.getTracks().forEach((track) => {
                ohun[room].peer.addTrack(track, ohun[room].localStream);
            });

            publishStream(room);
        } catch (err) {
            console.error(err);
        }
    }

    async function publishStream(room)
    {
        ohun[room].rnameRPC = encodeURIComponent(Strophe.getNodeFromJid(room));
        ohun[room].unameRPC = encodeURIComponent(btoa(JSON.stringify({room: room, jid: _converse.bare_jid, nick: _converse.nickname})));

        console.debug("ohun - publish", room, ohun[room].rnameRPC, ohun[room].unameRPC, ohun[room].peer);

        await ohun[room].peer.setLocalDescription(await ohun[room].peer.createOffer());
        const body = JSON.stringify({id: room, method: 'publish', params: [ohun[room].rnameRPC, ohun[room].unameRPC, JSON.stringify(ohun[room].peer.localDescription)]})
        _converse.connection.send($msg({type: 'groupchat', to: room}).c("json",{xmlns: "urn:xmpp:json:0", type: "request"}).t(body));
    }

    function uuidv4()
    {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
    }
}));
