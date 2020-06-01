(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs, _converse, localStream, callee;

    converse.plugins.add("jinglecalls", {
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

            _converse.api.settings.update({
                visible_toolbar_buttons: {call: true},
                jinglecalls_confirm: "Call?",
                jinglecalls_invitation: 'Incoming Call'
            });

            _converse.api.listen.on('addClientFeatures', () => {
              _converse.api.disco.own.features.add('urn:xmpp:jingle:1');
              _converse.api.disco.own.features.add('urn:xmpp:jingle:transports:ice-udp:1');
              _converse.api.disco.own.features.add('urn:xmpp:jingle:apps:rtp:1');
              _converse.api.disco.own.features.add('urn:xmpp:jingle:apps:dtls:0');
              _converse.api.disco.own.features.add('urn:xmpp:jingle:apps:rtp:audio');
              _converse.api.disco.own.features.add('urn:xmpp:jingle:apps:rtp:video');
            });

            _converse.api.listen.on('chatBoxClosed', function (chatbox)
            {
                if (localStream) terminateCall();
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                const toolbar = view.el.querySelector('.toggle-call');

                if (toolbar && view.model.get("type") == "chatroom" && !getSetting("enableAudioConfWidget", false)) {
                   toolbar.style.display = 'none';
                }
                else

                if (view.model.get("type") == "chatbox") {
                    toolbar.style.display = 'none';
                    const contact = _converse.presences.findWhere({'jid': view.model.get("jid")});

                    if (contact && contact.resources.models.length > 0)
                    {
                        const jid = view.model.get("jid") + '/' + contact.resources.models[0].get('name');
                        const stanza = $iq({'to': jid, 'type': 'get'}).c('query', {'xmlns': "http://jabber.org/protocol/disco#info"});

                        _converse.connection.sendIQ(stanza, function(iq) {
                            console.debug("features", view.model.get("jid"), iq);
                            const canJingle = iq.querySelector("feature[var='urn:xmpp:jingle:apps:rtp:video']");
                            if (canJingle) toolbar.style.display = '';
                        });
                    }
                }
            });

            _converse.api.listen.on('connected', function()
            {
                Promise.all([_converse.api.waitUntil('controlBoxInitialized'), _converse.api.waitUntil('VCardsInitialized'), _converse.api.waitUntil('rosterContactsFetched'), _converse.api.waitUntil('chatBoxesFetched'), _converse.api.waitUntil('roomsPanelRendered'), _converse.api.waitUntil('bookmarksInitialized')]).then(() =>
                {
                    _converse.connection.jingle.doListen();
                    _converse.connection.jingle.getStunAndTurnCredentials();
                });
            });

            setupJingle();
            console.log("jinglecalls plugin is ready");
        },

        overrides: {

            ChatBoxView: {

                toggleCall: function toggleCall(ev) {
                    ev.stopPropagation();

                    if (this.model.get("type") == "chatbox")
                    {
                        if (localStream)
                        {
                            terminateCall();

                        } else {
                            var jingleConfirm = _converse.api.settings.get("jinglecalls_confirm");

                            if (confirm(jingleConfirm))
                            {
                                const jid = this.model.attributes.jid;
                                const contact = _converse.presences.findWhere({'jid': jid});

                                if (contact && contact.resources.models.length > 0)
                                {
                                    getUserMediaWithConstraints(['audio', 'video'], jid, makeCall);
                                }
                                else alert('unable to call, ' + jid + ' not online');
                            }
                        }
                    }
                }
            }
        }
    });

    function setupWebRTC(callState)
    {
        if (localStream)
        {
            console.debug("setupWebRTC");
            const view = padeapi.getSelectedChatBox();

            if (view)
            {
                const div = view.el.querySelector(".jinglecalls");
                div.style.maxWidth = "40%";
                div.classList.remove('hiddenx');
                div.innerHTML = '<div class="row"><div class="col" style="vertical-align:top;min-width:100%;max-height:70%;margin-left:0px;padding-right:0px;" id="largevideocontainer"></div><div class="col" style="vertical-align:top;min-width:100%;max-height:30%;margin-left:0px;padding-right:0px;"><video style="vertical-align:bottom;min-width:100%;max-height:30%;margin-left:0px;padding-right:0px;" id="minivideo" autoplay="autoplay"/></div><div style="cursor:pointer;position: absolute; bottom: 5%; left: 10%; z-index: 100;"><span id="mute_audio_jingle"><svg style="fill:white;margin-left:4px" height="32" width="32" viewBox="0 0 32 32"><path d="M23.063 14.688h2.25c0 4.563-3.625 8.313-8 8.938v4.375h-2.625v-4.375c-4.375-.625-8-4.375-8-8.938h2.25c0 4 3.375 6.75 7.063 6.75s7.063-2.75 7.063-6.75zm-7.063 4c-2.188 0-4-1.813-4-4v-8c0-2.188 1.813-4 4-4s4 1.813 4 4v8c0 2.188-1.813 4-4 4z"></path></svg></span><span id="terminate_jingle"><svg style="fill:red;margin-left:4px" height="32" width="32" viewBox="0 0 32 32"><path d="M16 12c-2.125 0-4.188.313-6.125.938v4.125c0 .5-.313 1.063-.75 1.25a13.87 13.87 0 00-3.563 2.438c-.25.25-.563.375-.938.375s-.688-.125-.938-.375L.373 17.438c-.25-.25-.375-.563-.375-.938s.125-.688.375-.938c4.063-3.875 9.563-6.25 15.625-6.25s11.563 2.375 15.625 6.25c.25.25.375.563.375.938s-.125.688-.375.938l-3.313 3.313c-.25.25-.563.375-.938.375s-.688-.125-.938-.375a13.87 13.87 0 00-3.563-2.438c-.438-.188-.75-.625-.75-1.188V13c-1.938-.625-4-1-6.125-1z"></path></svg></span><span id="mute_video_jingle"><svg style="fill:white;margin-left:4px" height="32" width="32" viewBox="0 0 32 32"><path d="M22.688 14l5.313-5.313v14.625l-5.313-5.313v4.688c0 .75-.625 1.313-1.375 1.313h-16C4.563 24 4 23.437 4 22.687V9.312c0-.75.563-1.313 1.313-1.313h16c.75 0 1.375.563 1.375 1.313V14z"></path></svg></span></div></div>';

                $('#minivideo')[0].muted = true;
                $('#minivideo')[0].volume = 0;

                RTC.attachMediaStream($('#minivideo'), localStream);
                view.showHelpMessages([callState + ' Call']);

                view.el.querySelector("#mute_audio_jingle").addEventListener("click", function(evt)
                {
                    console.debug("setupWebRTC - mute audio");
                    const disabled = '<svg style="fill:white;margin-left:4px" height="24" width="24" viewBox="0 0 32 32"><path d="M5.688 4l22.313 22.313-1.688 1.688-5.563-5.563c-1 .625-2.25 1-3.438 1.188v4.375h-2.625v-4.375c-4.375-.625-8-4.375-8-8.938h2.25c0 4 3.375 6.75 7.063 6.75 1.063 0 2.125-.25 3.063-.688l-2.188-2.188c-.25.063-.563.125-.875.125-2.188 0-4-1.813-4-4v-1l-8-8zM20 14.875l-8-7.938v-.25c0-2.188 1.813-4 4-4s4 1.813 4 4v8.188zm5.313-.187a8.824 8.824 0 01-1.188 4.375L22.5 17.375c.375-.813.563-1.688.563-2.688h2.25z"></path></svg>';
                    const enabled = '<svg style="fill:white;margin-left:4px" height="32" width="32" viewBox="0 0 32 32"><path d="M23.063 14.688h2.25c0 4.563-3.625 8.313-8 8.938v4.375h-2.625v-4.375c-4.375-.625-8-4.375-8-8.938h2.25c0 4 3.375 6.75 7.063 6.75s7.063-2.75 7.063-6.75zm-7.063 4c-2.188 0-4-1.813-4-4v-8c0-2.188 1.813-4 4-4s4 1.813 4 4v8c0 2.188-1.813 4-4 4z"></path></svg>';

                    const active = localStream.getAudioTracks()[0].enabled;
                    localStream.getAudioTracks()[0].enabled =  !active;
                    view.el.querySelector("#mute_audio_jingle").innerHTML = !active ? enabled : disabled;
                });

                view.el.querySelector("#mute_video_jingle").addEventListener("click", function(evt)
                {
                    console.debug("setupWebRTC - mute video");
                    const disabled = '<svg style="fill:white;margin-left:4px" height="24" width="24" viewBox="0 0 32 32"><path d="M4.375 2.688L28 26.313l-1.688 1.688-4.25-4.25c-.188.125-.5.25-.75.25h-16c-.75 0-1.313-.563-1.313-1.313V9.313c0-.75.563-1.313 1.313-1.313h1L2.687 4.375zm23.625 6v14.25L13.062 8h8.25c.75 0 1.375.563 1.375 1.313v4.688z"></path></svg>';
                    const enabled = '<svg style="fill:white;margin-left:4px" height="32" width="32" viewBox="0 0 32 32"><path d="M22.688 14l5.313-5.313v14.625l-5.313-5.313v4.688c0 .75-.625 1.313-1.375 1.313h-16C4.563 24 4 23.437 4 22.687V9.312c0-.75.563-1.313 1.313-1.313h16c.75 0 1.375.563 1.375 1.313V14z"></path></svg>';

                    const active = localStream.getVideoTracks()[0].enabled;
                    localStream.getVideoTracks()[0].enabled =  !active;
                    view.el.querySelector("#mute_video_jingle").innerHTML = !active ? enabled : disabled;
                });

                view.el.querySelector("#terminate_jingle").addEventListener("click", function(evt)
                {
                    console.debug("setupWebRTC - terminate call");
                    terminateCall();
                });
            }
        }
    }

    function terminateCall()
    {
        if (callee) {
            _converse.connection.jingle.terminate(callee);
        } else {
            onCallTerminated();
        }
    }

    function makeCall(error, jid)
    {
        if (!error)
        {
            setupWebRTC('Outgoing');

            for (var i = 0; i < localStream.getAudioTracks().length; i++) {
                console.debug('using audio device "' + localStream.getAudioTracks()[i].label + '"');
            }
            for (i = 0; i < localStream.getVideoTracks().length; i++) {
                console.debug('using video device "' + localStream.getVideoTracks()[i].label + '"');
            }
            const id = Math.random().toString(36).substr(2, 12);

            const propose = $msg({type: 'chat', to: jid})
                .c('propose', {xmlns: 'urn:xmpp:jingle-message:0', id: id})
                .c('description', {xmlns: 'urn:xmpp:jingle:apps:rtp:1', media: 'video'}).up()
                .c('description', {xmlns: 'urn:xmpp:jingle:apps:rtp:1', media: 'audio'}).up().up()

            _converse.connection.send(propose);
        }
        else alert('unable to make call, ' + jid + ' no mic or webcam available');
    }

    function answerCall(error, caller)
    {
        if (!error)
        {
            setupWebRTC('Incoming');
            const accept = $msg({type: 'chat', to: Strophe.getBareJidFromJid(_converse.connection.jid)}).c('accept', {xmlns: 'urn:xmpp:jingle-message:0', id: caller.id});
            _converse.connection.send(accept);
            const proceed = $msg({type: 'chat', to: caller.from}).c('proceed', {xmlns: 'urn:xmpp:jingle-message:0', id: caller.id});
            _converse.connection.send(proceed);
            _converse.connection.send($pres({to: caller.from}));

        }
        else alert('unable to answer call, ' + jid + ' no mic or webcam available');
    }


    function onCallIncoming(event, sid) {
        console.debug('incoming call' + sid);

        var sess = _converse.connection.jingle.sessions[sid];
        sess.sendAnswer();
        sess.accept();

        // alternatively...
        //sess.terminate(busy)
        //connection.jingle.terminate(sid);
    }

    function onCallActive(event, videoelem, sid) {
        console.debug('call active ' + sid);
        callee = sid;
        //$(videoelem).appendTo('#largevideocontainer');
        _converse.connection.jingle.sessions[sid].getStats(1000);
    }

    function onCallTerminated(event, sid, reason) {
        console.debug('call terminated ' + sid + (reason ? (': ' + reason) : ''));
        if (localStream) localStream.getTracks().forEach(function (track) { track.stop(); });
        $('#largevideocontainer #largevideo').remove();
        document.getElementById('largevideocontainer').parentNode.parentNode.classList.add('hiddenx');
        callee = null;
        localStream = null;
    }

    function waitForRemoteVideo(selector, sid) {
        var sess = _converse.connection.jingle.sessions[sid];
        videoTracks = sess.remoteStream.getVideoTracks();
        if (videoTracks.length === 0 || selector[0].currentTime > 0) {
            $(document).trigger('callactive.jingle', [selector, sid]);
            RTC.attachMediaStream(selector, sess.remoteStream); // FIXME: why do i have to do this for FF?
            console.debug('waitForremotevideo', sess.peerconnection.iceConnectionState, sess.peerconnection.signalingState);
        } else {
            setTimeout(function () { waitForRemoteVideo(selector, sid); }, 100);
        }
    }

    function onRemoteStreamAdded(event, data, sid) {
        console.debug('Remote stream for session ' + sid + ' added.');
        //if ($('#largevideo').length !== 0) {
        //    console.debug('ignoring duplicate onRemoteStreamAdded...'); // FF 20
        //    return;
        //}
        // after remote stream has been added, wait for ice to become connected
        // old code for compat with FF22 beta
        //var el = $("<video autoplay='autoplay'/>").attr('id', 'largevideo');
        //RTC.attachMediaStream(el, data.stream);
        //waitForRemoteVideo(el, sid);
    }

    function onRemoteStreamRemoved(event, data, sid) {
        console.debug('Remote stream for session ' + sid + ' removed.');
    }

    function onIceConnectionStateChanged(event, sid, sess) {
        console.debug('ice state for', sid, sess.peerconnection.signalingState, sess.peerconnection.iceConnectionState, sess.remoteStream);

        if (sess.peerconnection.signalingState == 'stable' && sess.peerconnection.iceConnectionState == 'connected') {
            const view = padeapi.getSelectedChatBox();

            if (view)
            {
                var el = $("<video style='vertical-align:bottom;min-width:100%;max-height:70%;' autoplay='autoplay'/>").attr('id', 'largevideo');
                $(document).trigger('callactive.jingle', [el, sid]);
                RTC.attachMediaStream(el, sess.remoteStream);
                $(el).appendTo('#largevideocontainer');
            }
        }
    }

    function noStunCandidates(event) {
        console.warn('webrtc did not encounter stun candidates, NAT traversal will not work');
    }

    function setupJingle()
    {
        console.debug('setupJingle');

        window.RTC = setupRTC();

        Strophe.addConnectionPlugin('jingle', {
            connection: null,
            sessions: {},
            jid2session: {},
            ice_config: {iceServers: []},
            pc_constraints: {},
            media_constraints: {
                mandatory: {
                    'OfferToReceiveAudio': true,
                    'OfferToReceiveVideo': true
                }
                // MozDontOfferDataChannel: true when this is firefox
            },
            localStream: null,

            init: function (conn) {
                console.debug('setupJingle - init', conn);

                //this.ice_config.rtcpMuxPolicy = 'negotiate';        // BAO breaking change chrome M57
                this.connection = conn;
                this.connection.jingle.ice_config = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};

                if (RTC) {
                    this.connection.jingle.pc_constraints = RTC.pc_constraints;
                }

                $(document).bind('callincoming.jingle', onCallIncoming);
                $(document).bind('callactive.jingle', onCallActive);
                $(document).bind('callterminated.jingle', onCallTerminated);

                $(document).bind('remotestreamadded.jingle', onRemoteStreamAdded);
                $(document).bind('remotestreamremoved.jingle', onRemoteStreamRemoved);
                $(document).bind('iceconnectionstatechange.jingle', onIceConnectionStateChanged);
                $(document).bind('nostuncandidates.jingle', noStunCandidates);

                $(document).bind('ack.jingle', function (event, sid, ack) {
                    console.debug('setupJingle got stanza ack for ' + sid, ack);
                });
                $(document).bind('error.jingle', function (event, sid, err) {
                    console.debug('setupJingle got stanza error for ' + sid, err);
                });
                $(document).bind('packetloss.jingle', function (event, sid, loss) {
                    console.debug('setupJingle packetloss', sid, loss);
                });

                if (RTC !== null) {
                    RTCPeerconnection = RTC.peerconnection;

                    if (RTC.browser == 'firefox') {
                        this.connection.jingle.media_constraints.mandatory.MozDontOfferDataChannel = true;
                    }

                } else {
                    console.error('webrtc capable browser required');
                }
            },
            doListen: function () {
                this.connection.addHandler(this.onJingleMessage.bind(this), 'urn:xmpp:jingle-message:0', 'message', 'chat');
                this.connection.addHandler(this.onJingle.bind(this), 'urn:xmpp:jingle:1', 'iq', 'set');
            },
            onJingleMessage: function (msg) {
                console.debug('setupJingle - onJingleMessage', msg);
                const forwarded = msg.querySelector('forwarded');
                if (forwarded) return true;

                const propose = msg.querySelector('propose');
                const proceed = msg.querySelector('proceed');
                const from = msg.getAttribute('from');
                const caller = Strophe.getBareJidFromJid(from);

                if (propose)
                {
                    const id = propose.getAttribute('id');

                    padeapi.notifyText("Audio/Video Call", caller, caller, [{title: "Accept Call?", iconUrl: chrome.extension.getURL("check-solid.svg")}], function(notificationId, buttonIndex)
                    {
                        if (buttonIndex == 0)
                        {
                            _converse.api.chats.open(caller);
                            getUserMediaWithConstraints(['audio', 'video'], {id: id, from: from}, answerCall);
                        }

                    }, caller);
                }
                else

                if (proceed)
                {
                    _converse.connection.jingle.initiate(from, _converse.connection.jid);
                }

                return true;
            },

            onJingle: function (iq) {
                console.debug('setupJingle - onJingle', iq);
                var sid = $(iq).find('jingle').attr('sid');
                var action = $(iq).find('jingle').attr('action');
                // send ack first
                var ack = $iq({type: 'result',
                      to: iq.getAttribute('from'),
                      id: iq.getAttribute('id')
                });
                var sess = this.sessions[sid];
                if ('session-initiate' != action) {
                    if (sess === null) {
                        ack.type = 'error';
                        ack.c('error', {type: 'cancel'})
                           .c('item-not-found', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up()
                           .c('unknown-session', {xmlns: 'urn:xmpp:jingle:errors:1'});
                        this.connection.send(ack);
                        return true;
                    }
                    // compare from to sess.peerjid (bare jid comparison for later compat with message-mode)
                    // local jid is not checked
                    if (Strophe.getBareJidFromJid(iq.getAttribute('from')) != Strophe.getBareJidFromJid(sess.peerjid)) {
                        console.warn('jid mismatch for session id', sid, iq.getAttribute('from'), sess.peerjid);
                        ack.type = 'error';
                        ack.c('error', {type: 'cancel'})
                           .c('item-not-found', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up()
                           .c('unknown-session', {xmlns: 'urn:xmpp:jingle:errors:1'});
                        this.connection.send(ack);
                        return true;
                    }
                } else if (sess !== undefined) {
                    // existing session with same session id
                    // this might be out-of-order if the sess.peerjid is the same as from
                    ack.type = 'error';
                    ack.c('error', {type: 'cancel'})
                       .c('service-unavailable', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up();
                    console.warn('duplicate session id', sid);
                    this.connection.send(ack);
                    return true;
                }
                // FIXME: check for a defined action
                this.connection.send(ack);
                // see http://xmpp.org/extensions/xep-0166.html#concepts-session
                switch (action) {
                case 'session-initiate':
                    sess = new JingleSession($(iq).attr('to'), $(iq).find('jingle').attr('sid'), this.connection);
                    // configure session
                    if (this.localStream) {
                        sess.localStreams.push(this.localStream);
                    }
                    sess.media_constraints = this.media_constraints;
                    sess.pc_constraints = this.pc_constraints;
                    sess.ice_config = this.ice_config;

                    sess.initiate($(iq).attr('from'), false);
                    sess.setRemoteDescription($(iq).find('>jingle'), 'offer');

                    this.sessions[sess.sid] = sess;
                    this.jid2session[sess.peerjid] = sess;

                    // the callback should either
                    // .sendAnswer and .accept
                    // or .sendTerminate -- not necessarily synchronus
                    $(document).trigger('callincoming.jingle', [sess.sid]);
                    break;
                case 'session-accept':
                    sess.setRemoteDescription($(iq).find('>jingle'), 'answer');
                    sess.accept();
                    $(document).trigger('callaccepted.jingle', [sess.sid]);
                    break;
                case 'session-terminate':
                    sess.terminate();
                    this.terminate(sess.sid);
                    if ($(iq).find('>jingle>reason').length) {
                        $(document).trigger('callterminated.jingle', [
                            sess.sid,
                            $(iq).find('>jingle>reason>:first')[0].tagName,
                            $(iq).find('>jingle>reason>text').text()
                        ]);
                    } else {
                        $(document).trigger('callterminated.jingle', [sess.sid]);
                    }
                    break;
                case 'transport-info':
                    sess.addIceCandidate($(iq).find('>jingle>content'));
                    break;
                case 'session-info':
                    var affected;
                    if ($(iq).find('>jingle>ringing[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        $(document).trigger('ringing.jingle', [sess.sid]);
                    } else if ($(iq).find('>jingle>mute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        affected = $(iq).find('>jingle>mute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').attr('name');
                        $(document).trigger('mute.jingle', [sess.sid, affected]);
                    } else if ($(iq).find('>jingle>unmute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        affected = $(iq).find('>jingle>unmute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').attr('name');
                        $(document).trigger('unmute.jingle', [sess.sid, affected]);
                    }
                    break;
            case 'source-add':
                case 'addsource': // FIXME: proprietary
                    sess.addSource($(iq).find('>jingle>content'));
                    break;
                case 'source-remove':
                case 'removesource': // FIXME: proprietary
                    sess.removeSource($(iq).find('>jingle>content'));
                    break;
                default:
                    console.warn('jingle action not implemented', action);
                    break;
                }
                return true;
            },
            initiate: function (peerjid, myjid) { // initiate a new jinglesession to peerjid
                console.debug('setupJingle - initiate', peerjid, myjid);
                var sess = new JingleSession(myjid || this.connection.jid,
                                             Math.random().toString(36).substr(2, 12), // random string
                                             this.connection);
                // configure session
                if (this.localStream) {
                    sess.localStreams.push(this.localStream);
                }
                sess.media_constraints = this.media_constraints;
                sess.pc_constraints = this.pc_constraints;
                sess.ice_config = this.ice_config;

                sess.initiate(peerjid, true);
                this.sessions[sess.sid] = sess;
                this.jid2session[sess.peerjid] = sess;
                sess.sendOffer();
                return sess;
            },
            terminate: function (sid, reason, text) { // terminate by sessionid (or all sessions)
                console.debug('setupJingle - terminate', sid, reason, text);
                if (sid === null || sid === undefined) {
                    for (sid in this.sessions) {
                        if (this.sessions[sid].state != 'ended') {
                            this.sessions[sid].sendTerminate(reason || (!this.sessions[sid].active()) ? 'cancel' : null, text);
                            this.sessions[sid].terminate();
                        }
                        delete this.jid2session[this.sessions[sid].peerjid];
                        delete this.sessions[sid];
                    }
                } else if (this.sessions.hasOwnProperty(sid)) {
                    if (this.sessions[sid].state != 'ended') {
                        this.sessions[sid].sendTerminate(reason || (!this.sessions[sid].active()) ? 'cancel' : null, text);
                        this.sessions[sid].terminate();
                    }
                    delete this.jid2session[this.sessions[sid].peerjid];
                    delete this.sessions[sid];
                }

                $(document).trigger('callterminated.jingle', [sid, 'gone']);

            },
            terminateByJid: function (jid) {
                console.debug('setupJingle - terminateByJid', jid);
                if (this.jid2session.hasOwnProperty(jid)) {
                    var sess = this.jid2session[jid];
                    if (sess) {
                        sess.terminate();
                        delete this.sessions[sess.sid];
                        delete this.jid2session[jid];
                        $(document).trigger('callterminated.jingle', [sess.sid, 'gone']);
                    }
                }
            },
            getStunAndTurnCredentials: function () {
                console.debug('setupJingle - getStunAndTurnCredentials');
                // get stun and turn configuration from server via xep-0215
                // uses time-limited credentials as described in
                // http://tools.ietf.org/html/draft-uberti-behave-turn-rest-00
                //
                // see https://code.google.com/p/prosody-modules/source/browse/mod_turncredentials/mod_turncredentials.lua
                // for a prosody module which implements this
                //
                // currently, this doesn't work with updateIce and therefore credentials with a long
                // validity have to be fetched before creating the peerconnection
                // TODO: implement refresh via updateIce as described in
                //      https://code.google.com/p/webrtc/issues/detail?id=1650
                var self = this;
                this.connection.sendIQ(
                    $iq({type: 'get', to: this.connection.domain})
                        .c('services', {xmlns: 'urn:xmpp:extdisco:1'}).c('service', {host: 'turn.' + this.connection.domain}),
                    function (res) {
                        console.debug('setupJingle - getStunAndTurnCredentials', res);
                        var iceservers = [];
                        $(res).find('>services>service').each(function (idx, el) {
                            el = $(el);
                            var dict = {};
                            switch (el.attr('type')) {
                            case 'stun':
                                dict.url = 'stun:' + el.attr('host');
                                if (el.attr('port')) {
                                    dict.url += ':' + el.attr('port');
                                }
                                iceservers.push(dict);
                                break;
                            case 'turn':
                                dict.url = 'turn:';
                                if (el.attr('username')) {
                                    dict.username = el.attr('username');
                                }
                                dict.url += el.attr('host');
                                if (el.attr('port') && el.attr('port') != '3478') {
                                    dict.url += ':' + el.attr('port');
                                }
                                if (el.attr('transport') && el.attr('transport') != 'udp') {
                                    dict.url += '?transport=' + el.attr('transport');
                                }
                                if (el.attr('password')) {
                                    dict.credential = el.attr('password');
                                }
                                iceservers.push(dict);
                                break;
                            }
                        });
                        self.ice_config.iceServers = iceservers;
                    },
                    function (err) {
                        console.warn('getting turn credentials failed', err);
                        console.warn('is mod_turncredentials or similar installed?');
                    }
                );
                // implement push?
            }
        });
    }

    function JingleSession(me, sid, connection) {
        this.me = me;
        this.sid = sid;
        this.connection = connection;
        this.initiator = null;
        this.responder = null;
        this.isInitiator = null;
        this.peerjid = null;
        this.state = null;
        this.peerconnection = null;
        this.remoteStream = null;
        this.localSDP = null;
        this.remoteSDP = null;
        this.localStreams = [];
        this.relayedStreams = [];
        this.remoteStreams = [];
        this.startTime = null;
        this.stopTime = null;
        this.media_constraints = null;
        this.pc_constraints = null;
        this.ice_config = {};
        this.drip_container = [];

        this.usetrickle = true;
        this.usepranswer = false; // early transport warmup -- mind you, this might fail. depends on webrtc issue 1718
        this.usedrip = false; // dripping is sending trickle candidates not one-by-one

        this.hadstuncandidate = false;
        this.hadturncandidate = false;
        this.lasticecandidate = false;

        this.statsinterval = null;

        this.reason = null;

        this.addssrc = [];
        this.removessrc = [];
        this.pendingop = null;

        this.wait = true;

        // XEP-0172 support, non-standard
        this.nickname = null;

        // non-standard "please start muted" support for colibri/meet
        this.startmuted = false;

        // Filter for testcases with ICE Candidates
        this.filter_candidates = null;
    }

    JingleSession.prototype.initiate = function (peerjid, isInitiator) {
        var self = this;
        if (this.state !== null) {
            console.error('attempt to initiate on session ' + this.sid +
                      'in state ' + this.state);
            return;
        }
        this.isInitiator = isInitiator;
        this.state = 'pending';
        this.initiator = isInitiator ? this.me : peerjid;
        this.responder = !isInitiator ? this.me : peerjid;
        this.peerjid = peerjid;
        console.debug('create PeerConnection ' + JSON.stringify(this.ice_config));
        try {
            this.peerconnection = new RTCPeerconnection(this.ice_config,
                                                         this.pc_constraints);
        } catch (e) {
            console.error('Failed to create PeerConnection, exception: ',
                          e.message);
            console.error(e);
            return;
        }
        this.hadstuncandidate = false;
        this.hadturncandidate = false;
        this.lasticecandidate = false;
        this.peerconnection.onicecandidate = function (event) {
            self.sendIceCandidate(event.candidate);
        };
        this.peerconnection.onaddstream = function (event) {
            self.remoteStream = event.stream;
            self.remoteStreams.push(event.stream);
            $(document).trigger('remotestreamadded.jingle', [event, self.sid]);
        };
        this.peerconnection.onremovestream = function (event) {
            self.remoteStream = null;
            // FIXME: remove from this.remoteStreams
            $(document).trigger('remotestreamremoved.jingle', [event, self.sid]);
        };
        this.peerconnection.onsignalingstatechange = function (event) {
            if (!(self && self.peerconnection)) return;
        };
        this.peerconnection.oniceconnectionstatechange = function (event) {
            if (!(self && self.peerconnection)) return;
            switch (self.peerconnection.iceConnectionState) {
            case 'connected':
                this.startTime = new Date();
                break;
            case 'disconnected':
                this.stopTime = new Date();
                break;
            }
            $(document).trigger('iceconnectionstatechange.jingle', [self.sid, self]);
        };
        // add any local and relayed stream
        this.localStreams.forEach(function(stream) {
            self.peerconnection.addStream(stream);
        });
        this.relayedStreams.forEach(function(stream) {
            self.peerconnection.addStream(stream);
        });
    };

    JingleSession.prototype.accept = function () {
        var self = this;
        this.state = 'active';

        var pranswer = this.peerconnection.localDescription;
        if (!pranswer || pranswer.type != 'pranswer') {
            return;
        }
        console.debug('going from pranswer to answer');
        if (this.usetrickle) {
            // remove candidates already sent from session-accept
            var lines = SDPUtil.find_lines(pranswer.sdp, 'a=candidate:');
            for (var i = 0; i < lines.length; i++) {
                pranswer.sdp = pranswer.sdp.replace(lines[i] + '\r\n', '');
            }
        }
        while (SDPUtil.find_line(pranswer.sdp, 'a=inactive')) {
            // FIXME: change any inactive to sendrecv or whatever they were originally
            pranswer.sdp = pranswer.sdp.replace('a=inactive', 'a=sendrecv');
        }
        var prsdp = new SDP(pranswer.sdp);
        var accept = $iq({to: this.peerjid,
                 type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
               action: 'session-accept',
               initiator: this.initiator,
               responder: this.responder,
               sid: this.sid });
        prsdp.toJingle(accept, this.initiator == this.me ? 'initiator' : 'responder');
        this.connection.sendIQ(accept,
            function () {
                var ack = {};
                ack.source = 'answer';
                $(document).trigger('ack.jingle', [self.sid, ack]);
            },
            function (stanza) {
                var error = ($(stanza).find('error').length) ? {
                    code: $(stanza).find('error').attr('code'),
                    reason: $(stanza).find('error :first')[0].tagName,
                }:{};
                error.source = 'answer';
                $(document).trigger('error.jingle', [self.sid, error]);
            },
        10000);

        var sdp = this.peerconnection.localDescription.sdp;
        while (SDPUtil.find_line(sdp, 'a=inactive')) {
            // FIXME: change any inactive to sendrecv or whatever they were originally
            sdp = sdp.replace('a=inactive', 'a=sendrecv');
        }
        this.peerconnection.setLocalDescription(new RTCSessionDescription({type: 'answer', sdp: sdp}),
            function () {
                //console.debug('setLocalDescription success');
                $(document).trigger('setLocalDescription.jingle', [self.sid]);
            },
            function (e) {
                console.error('setLocalDescription failed', e);
            }
        );
    };

    JingleSession.prototype.terminate = function (reason) {
        this.state = 'ended';
        this.reason = reason;
        if (this.peerconnection) this.peerconnection.close();
        if (this.statsinterval !== null) {
            window.clearInterval(this.statsinterval);
            this.statsinterval = null;
        }
    };

    JingleSession.prototype.active = function () {
        return this.state == 'active';
    };

    JingleSession.prototype.sendIceCandidate = function (candidate) {
        var self = this;
        if (candidate && !this.lasticecandidate) {
            var ice = SDPUtil.iceparams(this.localSDP.media[candidate.sdpMLineIndex], this.localSDP.session);
            var jcand = SDPUtil.candidateToJingle(candidate.candidate);
            if (!(ice && jcand)) {
                console.error('failed to get ice && jcand');
                return;
            }
            ice.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';

            if (jcand.type === 'srflx') {
                this.hadstuncandidate = true;
            } else if (jcand.type === 'relay') {
                this.hadturncandidate = true;
            }

            if(this.filter_candidates === null || jcand.type === this.filter_candidates) {
                if (this.usetrickle) {
                    console.debug('sendIceCandidate using trickle');
                    if (this.usedrip) {
                        if (this.drip_container.length === 0) {
                            // start 20ms callout
                            window.setTimeout(function () {
                                console.debug('sending drip container');
                                if (self.drip_container.length === 0) return;
                                self.sendIceCandidates(self.drip_container);
                                self.drip_container = [];
                            }, 20);

                        }
                        this.drip_container.push(candidate);
                        return;
                    } else {
                        console.debug('sending single candidate');
                        self.sendIceCandidates([candidate]);
                    }
                }
            }
        } else {
            console.debug('sendIceCandidate: last candidate...');
            if (!this.usetrickle) {
                console.debug('should send full offer now...');
                var init = $iq({to: this.peerjid,
                           type: 'set'})
                    .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                       action: this.peerconnection.localDescription.type == 'offer' ? 'session-initiate' : 'session-accept',
                       initiator: this.initiator,
                       sid: this.sid});
                if (this.nickname !== null) {
                    init.c('nick', {xmlns:'http://jabber.org/protocol/nick'}).t(this.nickname).up();
                }
                if (this.startmuted) {
                    init.c('muted', {xmlns:'http://jitsi.org/protocol/meet#startmuted'}).up();
                }
                this.localSDP = new SDP(this.peerconnection.localDescription.sdp);
                this.localSDP.toJingle(init, this.initiator == this.me ? 'initiator' : 'responder');
                console.debug('try to send ack(offer)...');
                this.connection.sendIQ(init,
                    function () {
                        console.debug('Sent session initiate (ACK, offer)...');
                        var ack = {};
                        ack.source = 'offer';
                        $(document).trigger('ack.jingle', [self.sid, ack]);
                    },
                    function (stanza) {
                        self.state = 'error';
                        self.peerconnection.close();
                        var error = ($(stanza).find('error').length) ? {
                            code: $(stanza).find('error').attr('code'),
                            reason: $(stanza).find('error :first')[0].tagName,
                        }:{};
                        error.source = 'offer';
                        $(document).trigger('error.jingle', [self.sid, error]);
                    },
                10000);
            }
            this.lasticecandidate = true;
            console.debug('Have we encountered any srflx candidates? ' + this.hadstuncandidate);
            console.debug('Have we encountered any relay candidates? ' + this.hadturncandidate);

            if (!(this.hadstuncandidate || this.hadturncandidate) && this.peerconnection.signalingState != 'closed') {
                console.debug('no candidates found!');
                $(document).trigger('nostuncandidates.jingle', [this.sid]);
            }
        }
    };

    JingleSession.prototype.sendIceCandidates = function (candidates) {
        console.debug('sendIceCandidates', candidates);
        var cand = $iq({to: this.peerjid, type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
               action: 'transport-info',
               initiator: this.initiator,
               sid: this.sid});
        for (var mid = 0; mid < this.localSDP.media.length; mid++) {
            var cands = candidates.filter(function (el) { return el.sdpMLineIndex == mid; });
            var mline = SDPUtil.parse_mline(this.localSDP.media[mid].split('\r\n')[0]);
            if (cands.length > 0) {
                var ice = SDPUtil.iceparams(this.localSDP.media[mid], this.localSDP.session);
                ice.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';
                cand.c('content', {creator: this.initiator == this.me ? 'initiator' : 'responder',
                    name: (cands[0].sdpMid? cands[0].sdpMid : mline.media)
                }).c('transport', ice);
                for (var i = 0; i < cands.length; i++) {
                    cand.c('candidate', SDPUtil.candidateToJingle(cands[i].candidate)).up();
                }
                // add fingerprint
                if (SDPUtil.find_line(this.localSDP.media[mid], 'a=fingerprint:', this.localSDP.session)) {
                    var tmp = SDPUtil.parse_fingerprint(SDPUtil.find_line(this.localSDP.media[mid], 'a=fingerprint:', this.localSDP.session));
                    tmp.required = true;
                    cand.c('fingerprint').t(tmp.fingerprint);
                    delete tmp.fingerprint;
                    cand.attrs(tmp);
                    cand.up();
                }
                cand.up(); // transport
                cand.up(); // content
            }
        }
        // might merge last-candidate notification into this, but it is called alot later. See webrtc issue #2340
        //console.debug('was this the last candidate', this.lasticecandidate);
        console.debug('try to send ack(transportinfo)...');
        this.connection.sendIQ(cand,
            function () {
                var ack = {};
                ack.source = 'transportinfo';
                console.debug('Sent session initiate (ACK, transportinfo)...');
                $(document).trigger('ack.jingle', [this.sid, ack]);
            },
            function (stanza) {
                var error = ($(stanza).find('error').length) ? {
                    code: $(stanza).find('error').attr('code'),
                    reason: $(stanza).find('error :first')[0].tagName,
                }:{};
                error.source = 'transportinfo';
                $(document).trigger('error.jingle', [this.sid, error]);
            },
        10000);
    };


    JingleSession.prototype.sendOffer = function () {
        //console.debug('sendOffer...');
        var self = this;
        this.peerconnection.createOffer(function (sdp) {
                self.createdOffer(sdp);
            },
            function (e) {
                console.error('createOffer failed', e);
            },
            this.media_constraints
        );
    };

    JingleSession.prototype.createdOffer = function (sdp) {
        //console.debug('createdOffer', sdp);
        var self = this;
        this.localSDP = new SDP(sdp.sdp);
        //this.localSDP.mangle();
        if (this.usetrickle) {
            var init = $iq({to: this.peerjid,
                       type: 'set'})
                .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                   action: 'session-initiate',
                   initiator: this.initiator,
                   sid: this.sid});
            if (this.nickname !== null) {
                init.c('nick', {xmlns:'http://jabber.org/protocol/nick'}).t(this.nickname).up();
            }
            if (this.startmuted) {
                init.c('muted', {xmlns:'http://jitsi.org/protocol/meet#startmuted'}).up();
            }
            this.localSDP.toJingle(init, this.initiator == this.me ? 'initiator' : 'responder');
            this.connection.sendIQ(init,
                function () {
                    var ack = {};
                    ack.source = 'offer';
                    $(document).trigger('ack.jingle', [self.sid, ack]);
                },
                function (stanza) {
                    self.state = 'error';
                    self.peerconnection.close();
                    var error = ($(stanza).find('error').length) ? {
                        code: $(stanza).find('error').attr('code'),
                        reason: $(stanza).find('error :first')[0].tagName,
                    }:{};
                    error.source = 'offer';
                    $(document).trigger('error.jingle', [self.sid, error]);
                },
            10000);
        }
        sdp.sdp = this.localSDP.raw;
        this.peerconnection.setLocalDescription(sdp,
            function () {
                $(document).trigger('setLocalDescription.jingle', [self.sid]);
                //console.debug('setLocalDescription success');
            },
            function (e) {
                console.error('setLocalDescription failed', e);
            }
        );
        var cands = SDPUtil.find_lines(this.localSDP.raw, 'a=candidate:');
        for (var i = 0; i < cands.length; i++) {
            var cand = SDPUtil.parse_icecandidate(cands[i]);
            if (cand.type == 'srflx') {
                this.hadstuncandidate = true;
            } else if (cand.type == 'relay') {
                this.hadturncandidate = true;
            }
        }
    };

    JingleSession.prototype.setRemoteDescription = function (elem, desctype) {
        //console.debug('setting remote description... ', desctype);
        this.remoteSDP = new SDP('');
        this.remoteSDP.fromJingle(elem);
        if (this.peerconnection.remoteDescription !== null) {
            console.debug('setRemoteDescription when remote description is not null, should be pranswer', this.peerconnection.remoteDescription);
            if (this.peerconnection.remoteDescription.type == 'pranswer') {
                var pranswer = new SDP(this.peerconnection.remoteDescription.sdp);
                for (var i = 0; i < pranswer.media.length; i++) {
                    // make sure we have ice ufrag and pwd
                    if (!SDPUtil.find_line(this.remoteSDP.media[i], 'a=ice-ufrag:', this.remoteSDP.session)) {
                        if (SDPUtil.find_line(pranswer.media[i], 'a=ice-ufrag:', pranswer.session)) {
                            this.remoteSDP.media[i] += SDPUtil.find_line(pranswer.media[i], 'a=ice-ufrag:', pranswer.session) + '\r\n';
                        } else {
                            console.warn('no ice ufrag?');
                        }
                        if (SDPUtil.find_line(pranswer.media[i], 'a=ice-pwd:', pranswer.session)) {
                            this.remoteSDP.media[i] += SDPUtil.find_line(pranswer.media[i], 'a=ice-pwd:', pranswer.session) + '\r\n';
                        } else {
                            console.warn('no ice pwd?');
                        }
                    }
                    // copy over candidates
                    var lines = SDPUtil.find_lines(pranswer.media[i], 'a=candidate:');
                    for (var j = 0; j < lines.length; j++) {
                        this.remoteSDP.media[i] += lines[j] + '\r\n';
                    }
                }
                this.remoteSDP.raw = this.remoteSDP.session + this.remoteSDP.media.join('');
            }
        }
        var remotedesc = new RTCSessionDescription({type: desctype, sdp: this.remoteSDP.raw});

        this.peerconnection.setRemoteDescription(remotedesc,
            function () {
                //console.debug('setRemoteDescription success');
            },
            function (e) {
                console.error('setRemoteDescription error', e);
            }
        );
    };

    JingleSession.prototype.addIceCandidate = function (elem) {
        var self = this;
        if (this.peerconnection.signalingState == 'closed') {
            return;
        }

       if (!this.peerconnection.remoteDescription && this.peerconnection.signalingState == 'have-local-offer') {
            console.debug('trickle ice candidate arriving before session accept...');
            // create a PRANSWER for setRemoteDescription
            if (!this.remoteSDP) {
                var cobbled = 'v=0\r\n' +
                    'o=- ' + '1923518516' + ' 2 IN IP4 0.0.0.0\r\n' +// FIXME
                    's=-\r\n' +
                    't=0 0\r\n';
                // first, take some things from the local description
                for (var i = 0; i < this.localSDP.media.length; i++) {
                    cobbled += SDPUtil.find_line(this.localSDP.media[i], 'm=') + '\r\n';
                    cobbled += SDPUtil.find_lines(this.localSDP.media[i], 'a=rtpmap:').join('\r\n') + '\r\n';
                    if (SDPUtil.find_line(this.localSDP.media[i], 'a=mid:')) {
                        cobbled += SDPUtil.find_line(this.localSDP.media[i], 'a=mid:') + '\r\n';
                    }
                    cobbled += 'a=inactive\r\n';
                }
                this.remoteSDP = new SDP(cobbled);
            }
            // then add things like ice and dtls from remote candidate
            elem.each(function () {
                for (var i = 0; i < self.remoteSDP.media.length; i++) {
                    if (SDPUtil.find_line(self.remoteSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                            self.remoteSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                        if (!SDPUtil.find_line(self.remoteSDP.media[i], 'a=ice-ufrag:')) {
                            var tmp = $(this).find('transport');
                            self.remoteSDP.media[i] += 'a=ice-ufrag:' + tmp.attr('ufrag') + '\r\n';
                            self.remoteSDP.media[i] += 'a=ice-pwd:' + tmp.attr('pwd') + '\r\n';
                            tmp = $(this).find('transport>fingerprint');
                            if (tmp.length) {
                                self.remoteSDP.media[i] += 'a=fingerprint:' + tmp.attr('hash') + ' ' + tmp.text() + '\r\n';
                            } else {
                                console.debug('no dtls fingerprint (webrtc issue #1718?)');
                                self.remoteSDP.media[i] += 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD\r\n';
                            }
                            break;
                        }
                    }
                }
            });
            this.remoteSDP.raw = this.remoteSDP.session + this.remoteSDP.media.join('');

            // we need a complete SDP with ice-ufrag/ice-pwd in all parts
            // this makes the assumption that the PRANSWER is constructed such that the ice-ufrag is in all mediaparts
            // but it could be in the session part as well. since the code above constructs this sdp this can't happen however
            var iscomplete = this.remoteSDP.media.filter(function (mediapart) {
                return SDPUtil.find_line(mediapart, 'a=ice-ufrag:');
            }).length == this.remoteSDP.media.length;

            if (iscomplete) {
                console.debug('setting pranswer');
                try {
                    this.peerconnection.setRemoteDescription(new RTCSessionDescription({type: 'pranswer', sdp: this.remoteSDP.raw }),
                        function() {
                        },
                        function(e) {
                            console.debug('setRemoteDescription pranswer failed', e.toString());
                        });
                } catch (e) {
                    console.error('setting pranswer failed', e);
                }
            } else {
                //console.debug('not yet setting pranswer');
            }
       }
        // operate on each content element
        elem.each(function () {
            // would love to deactivate this, but firefox still requires it
            var idx = -1;
            var i;
            for (i = 0; i < self.remoteSDP.media.length; i++) {
                if (SDPUtil.find_line(self.remoteSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                    self.remoteSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                    idx = i;
                    break;
                }
            }
            if (idx == -1) { // fall back to localdescription
                for (i = 0; i < self.localSDP.media.length; i++) {
                    if (SDPUtil.find_line(self.localSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                        self.localSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                        idx = i;
                        break;
                    }
                }
            }
            var name = $(this).attr('name');
            // TODO: check ice-pwd and ice-ufrag?
            $(this).find('transport>candidate').each(function () {
                var line, candidate;
                line = SDPUtil.candidateFromJingle(this);
                candidate = new RTCIceCandidate({sdpMLineIndex: idx,
                                                sdpMid: name,
                                                candidate: line});
                try {
                    self.peerconnection.addIceCandidate(candidate);
                } catch (e) {
                    console.error('addIceCandidate failed', e.toString(), line);
                }
            });
        });
    };

    JingleSession.prototype.sendAnswer = function (provisional) {
        //console.debug('createAnswer', provisional);
        var self = this;
        this.peerconnection.createAnswer(
            function (sdp) {
                self.createdAnswer(sdp, provisional);
            },
            function (e) {
                console.error('createAnswer failed', e);
            },
            this.media_constraints
        );
    };

    JingleSession.prototype.createdAnswer = function (sdp, provisional) {
        //console.debug('createAnswer callback');
        var self = this;
        this.localSDP = new SDP(sdp.sdp);
        //this.localSDP.mangle();
        this.usepranswer = provisional === true;

        if (this.startmuted) {
            console.debug('we got a request to start muted...');
            this.connection.jingle.localStream.getAudioTracks().forEach(function (track) {
                track.enabled = false;
            });
            // doing this freezes local video, too (which probably means it should be replaced
            // by a symbol
            this.connection.jingle.localStream.getVideoTracks().forEach(function (track) {
                track.enabled = false;
            });

            // set video to recvonly
            this.localSDP.media[1] = this.localSDP.media[1].replace('a=sendrecv', 'a=recvonly');
            // and remove a=ssrc lines. Weird things happen otherwise
            SDPUtil.find_lines(this.localSDP.media[1], 'a=ssrc:').forEach(function (line) {
                self.localSDP.media[1] = self.localSDP.media[1].replace(line + '\r\n', '');
            });
            this.localSDP.raw = this.localSDP.session + this.localSDP.media.join('');
        }

        if (this.usetrickle) {
            if (!this.usepranswer) {
                var accept = $iq({to: this.peerjid,
                         type: 'set'})
                    .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                       action: 'session-accept',
                       initiator: this.initiator,
                       responder: this.responder,
                       sid: this.sid });
                this.localSDP.toJingle(accept, this.initiator == this.me ? 'initiator' : 'responder');
                this.connection.sendIQ(accept,
                    function () {
                        var ack = {};
                        ack.source = 'answer';
                        $(document).trigger('ack.jingle', [self.sid, ack]);
                    },
                    function (stanza) {
                        var error = ($(stanza).find('error').length) ? {
                            code: $(stanza).find('error').attr('code'),
                            reason: $(stanza).find('error :first')[0].tagName,
                        }:{};
                        error.source = 'answer';
                        $(document).trigger('error.jingle', [self.sid, error]);
                    },
                10000);
            } else {
                sdp.type = 'pranswer';
                for (var i = 0; i < this.localSDP.media.length; i++) {
                    this.localSDP.media[i] = this.localSDP.media[i].replace('a=sendrecv\r\n', 'a=inactive\r\n');
                }
                this.localSDP.raw = this.localSDP.session + this.localSDP.media.join('');
            }
        }
        sdp.sdp = this.localSDP.raw;
        this.peerconnection.setLocalDescription(sdp,
            function () {
                $(document).trigger('setLocalDescription.jingle', [self.sid]);
                //console.debug('setLocalDescription success');
            },
            function (e) {
                console.error('setLocalDescription failed', e);
            }
        );
        var cands = SDPUtil.find_lines(this.localSDP.raw, 'a=candidate:');
        for (var j = 0; j < cands.length; j++) {
            var cand = SDPUtil.parse_icecandidate(cands[j]);
            if (cand.type == 'srflx') {
                this.hadstuncandidate = true;
            } else if (cand.type == 'relay') {
                this.hadturncandidate = true;
            }
        }
    };

    JingleSession.prototype.sendTerminate = function (reason, text) {
        var self = this,
            term = $iq({to: this.peerjid,
                   type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
               action: 'session-terminate',
               initiator: this.initiator,
               sid: this.sid})
            .c('reason')
            .c(reason || 'success');

        if (text) {
            term.up().c('text').t(text);
        }

        this.connection.sendIQ(term,
            function () {
                self.peerconnection.close();
                self.peerconnection = null;
                self.terminate();
                var ack = {};
                ack.source = 'terminate';
                $(document).trigger('ack.jingle', [self.sid, ack]);
            },
            function (stanza) {
                var error = ($(stanza).find('error').length) ? {
                    code: $(stanza).find('error').attr('code'),
                    reason: $(stanza).find('error :first')[0].tagName,
                }:{};
                $(document).trigger('ack.jingle', [self.sid, error]);
            },
        10000);
        if (this.statsinterval !== null) {
            window.clearInterval(this.statsinterval);
            this.statsinterval = null;
        }
    };


    JingleSession.prototype.addSource = function (elem) {
        console.debug('addssrc', new Date().getTime());
        console.debug('ice', this.peerconnection.iceConnectionState);
        var sdp = new SDP(this.peerconnection.remoteDescription.sdp);

        var self = this;
        $(elem).each(function (idx, content) {
            var name = $(content).attr('name');
            console.debug('SSRC NAME', name);
            var lines = '';
            tmp = $(content).find('>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
            if(tmp.length === 0) {
                tmp = $(content).find('source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
            }
            tmp.each(function () {
                var ssrc = $(this).attr('ssrc');
                var msidToSsrc = {}
                $(this).find('>parameter').each(function () {
                    if($(this).attr('name') === 'msid') {
                        var msidValue = $(this).attr('value');
                        if(msidValue && msidValue.length > 0) {
                            msidToSsrc[ssrc] = msidValue.split(' ')[0];
                        }
                    }
                    lines += 'a=ssrc:' + ssrc + ' ' + $(this).attr('name');
                    if ($(this).attr('value') && $(this).attr('value').length)
                        lines += ':' + $(this).attr('value');
                    lines += '\r\n';
                });
                $(this).find('>ssrc-info[xmlns="http://jitsi.org/jitmeet"]').each(function(i3, ssrcInfoElement) {
                    var owner = ssrcInfoElement.getAttribute("owner");
                    if(owner && owner.length) {
                          $(document).trigger('jitsi.owner', {ssrc: ssrc, msid: msidToSsrc[ssrc], owner: owner});
                    }
                });
            });
            sdp.media.forEach(function(media, idx) {
                if (!SDPUtil.find_line(media, 'a=mid:' + name))
                    return;
                sdp.media[idx] += lines;
                if (!self.addssrc[idx]) self.addssrc[idx] = '';
                self.addssrc[idx] += lines;
            });
            sdp.raw = sdp.session + sdp.media.join('');
        });
        this.modifySources();
    };

    JingleSession.prototype.removeSource = function (elem) {
        console.debug('removessrc', new Date().getTime());
        console.debug('ice', this.peerconnection.iceConnectionState);
        var sdp = new SDP(this.peerconnection.remoteDescription.sdp);

        var self = this;
        $(elem).each(function (idx, content) {
            var name = $(content).attr('name');
            var lines = '';
            tmp = $(content).find('>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
            tmp.each(function () {
                var ssrc = $(this).attr('ssrc');
                $(this).find('>parameter').each(function () {
                    lines += 'a=ssrc:' + ssrc + ' ' + $(this).attr('name');
                    if ($(this).attr('value') && $(this).attr('value').length)
                        lines += ':' + $(this).attr('value');
                    lines += '\r\n';
                });
            });
            sdp.media.forEach(function(media, idx) {
                if (!SDPUtil.find_line(media, 'a=mid:' + name))
                    return;
                sdp.media[idx] += lines;
                if (!self.addssrc[idx]) self.removessrc[idx] = '';
                self.removessrc[idx] += lines;
            });
            sdp.raw = sdp.session + sdp.media.join('');
        });
        this.modifySources();
    };

    JingleSession.prototype.modifySources = function() {
        var self = this;
        if (this.peerconnection.signalingState == 'closed') return;
        if (!(this.addssrc.length || this.removessrc.length || this.pendingop !== null)) return;
        if (!(this.peerconnection.signalingState == 'stable' && this.peerconnection.iceConnectionState == 'connected')) {
            console.warn('modifySources not yet', this.peerconnection.signalingState, this.peerconnection.iceConnectionState);
            this.wait = true;
            window.setTimeout(function() { self.modifySources(); }, 250);
            return;
        }
        if (this.wait) {
            window.setTimeout(function() { self.modifySources(); }, 2500);
            this.wait = false;
            return;
        }

        var sdp = new SDP(this.peerconnection.remoteDescription.sdp);

        // add sources
        this.addssrc.forEach(function(lines, idx) {
            sdp.media[idx] += lines;
        });
        this.addssrc = [];

        // remove sources
        this.removessrc.forEach(function(lines, idx) {
            lines = lines.split('\r\n');
            lines.pop(); // remove empty last element;
            lines.forEach(function(line) {
                sdp.media[idx] = sdp.media[idx].replace(line + '\r\n', '');
            });
        });
        this.removessrc = [];

        sdp.raw = sdp.session + sdp.media.join('');
        this.peerconnection.setRemoteDescription(new RTCSessionDescription({type: 'offer', sdp: sdp.raw}),
            function() {
                self.peerconnection.createAnswer(
                    function(modifiedAnswer) {
                        // change video direction, see https://github.com/jitsi/jitmeet/issues/41
                        if (self.pendingop !== null) {
                            var sdp = new SDP(modifiedAnswer.sdp);
                            if (sdp.media.length > 1) {
                                switch(self.pendingop) {
                                case 'mute':
                                    sdp.media[1] = sdp.media[1].replace('a=sendrecv', 'a=recvonly');
                                    break;
                                case 'unmute':
                                    sdp.media[1] = sdp.media[1].replace('a=recvonly', 'a=sendrecv');
                                    break;
                                }
                                sdp.raw = sdp.session + sdp.media.join('');
                                modifiedAnswer.sdp = sdp.raw;
                            }
                            self.pendingop = null;
                        }

                        self.peerconnection.setLocalDescription(modifiedAnswer,
                            function() {
                                //console.debug('modified setLocalDescription ok');
                                $(document).trigger('setLocalDescription.jingle', [self.sid]);
                            },
                            function(error) {
                                console.debug('modified setLocalDescription failed');
                            }
                        );
                    },
                    function(error) {
                        console.debug('modified answer failed');
                    }
                );
            },
            function(error) {
                console.debug('modify failed');
            }
        );
    };

    // SDP-based mute by going recvonly/sendrecv
    // FIXME: should probably black out the screen as well
    JingleSession.prototype.hardMuteVideo = function (muted) {
        this.pendingop = muted ? 'mute' : 'unmute';
        this.modifySources();

        this.connection.jingle.localStream.getVideoTracks().forEach(function (track) {
            track.enabled = !muted;
        });
    };

    JingleSession.prototype.sendMute = function (muted, content) {
        var info = $iq({to: this.peerjid,
                 type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
               action: 'session-info',
               initiator: this.initiator,
               sid: this.sid });
        info.c(muted ? 'mute' : 'unmute', {xmlns: 'urn:xmpp:jingle:apps:rtp:info:1'});
        info.attrs({'creator': this.me == this.initiator ? 'creator' : 'responder'});
        if (content) {
            info.attrs({'name': content});
        }
        this.connection.send(info);
    };

    JingleSession.prototype.sendRinging = function () {
        var info = $iq({to: this.peerjid,
                 type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
               action: 'session-info',
               initiator: this.initiator,
               sid: this.sid });
        info.c('ringing', {xmlns: 'urn:xmpp:jingle:apps:rtp:info:1'});
        this.connection.send(info);
    };

    JingleSession.prototype.getStats = function (interval) {
        var self = this;
        var recv = {audio: 0, video: 0};
        var lost = {audio: 0, video: 0};
        var lastrecv = {audio: 0, video: 0};
        var lastlost = {audio: 0, video: 0};
        var loss = {audio: 0, video: 0};
        var delta = {audio: 0, video: 0};
        this.statsinterval = window.setInterval(function () {
            if (self && self.peerconnection && self.peerconnection.getStats) {
                self.peerconnection.getStats(function (stats) {
                    var results = stats.result();
                    // TODO: there are so much statistics you can get from this..
                    for (var i = 0; i < results.length; ++i) {
                        if (results[i].type == 'ssrc') {
                            var packetsrecv = results[i].stat('packetsReceived');
                            var packetslost = results[i].stat('packetsLost');
                            if (packetsrecv && packetslost) {
                                packetsrecv = parseInt(packetsrecv, 10);
                                packetslost = parseInt(packetslost, 10);

                                if (results[i].stat('googFrameRateReceived')) {
                                    lastlost.video = lost.video;
                                    lastrecv.video = recv.video;
                                    recv.video = packetsrecv;
                                    lost.video = packetslost;
                                } else {
                                    lastlost.audio = lost.audio;
                                    lastrecv.audio = recv.audio;
                                    recv.audio = packetsrecv;
                                    lost.audio = packetslost;
                                }
                            }
                        }
                    }
                    delta.audio = recv.audio - lastrecv.audio;
                    delta.video = recv.video - lastrecv.video;
                    loss.audio = (delta.audio > 0) ? Math.ceil(100 * (lost.audio - lastlost.audio) / delta.audio) : 0;
                    loss.video = (delta.video > 0) ? Math.ceil(100 * (lost.video - lastlost.video) / delta.video) : 0;
                    $(document).trigger('packetloss.jingle', [self.sid, loss]);
                });
            }
        }, interval || 3000);
        return this.statsinterval;
    };

    function SDP(sdp) {
        this.media = sdp.split('\r\nm=');
        for (var i = 1; i < this.media.length; i++) {
            this.media[i] = 'm=' + this.media[i];
            if (i != this.media.length - 1) {
                this.media[i] += '\r\n';
            }
        }
        this.session = this.media.shift() + '\r\n';
        this.raw = this.session + this.media.join('');
    }

    // remove iSAC and CN from SDP
    SDP.prototype.mangle = function () {
        var i, j, mline, lines, rtpmap, newdesc;
        for (i = 0; i < this.media.length; i++) {
            lines = this.media[i].split('\r\n');
            lines.pop(); // remove empty last element
            mline = SDPUtil.parse_mline(lines.shift());
            if (mline.media != 'audio')
                continue;
            newdesc = '';
            mline.fmt.length = 0;
            for (j = 0; j < lines.length; j++) {
                if (lines[j].substr(0, 9) == 'a=rtpmap:') {
                    rtpmap = SDPUtil.parse_rtpmap(lines[j]);
                    if (rtpmap.name == 'CN' || rtpmap.name == 'ISAC')
                        continue;
                    mline.fmt.push(rtpmap.id);
                    newdesc += lines[j] + '\r\n';
                } else {
                    newdesc += lines[j] + '\r\n';
                }
            }
            this.media[i] = SDPUtil.build_mline(mline) + '\r\n';
            this.media[i] += newdesc;
        }
        this.raw = this.session + this.media.join('');
    };

    // remove lines matching prefix from session section
    SDP.prototype.removeSessionLines = function(prefix) {
        var self = this;
        var lines = SDPUtil.find_lines(this.session, prefix);
        lines.forEach(function(line) {
            self.session = self.session.replace(line + '\r\n', '');
        });
        this.raw = this.session + this.media.join('');
        return lines;
    };

    // remove lines matching prefix from a media section specified by mediaindex
    // TODO: non-numeric mediaindex could match mid
    SDP.prototype.removeMediaLines = function(mediaindex, prefix) {
        var self = this;
        var lines = SDPUtil.find_lines(this.media[mediaindex], prefix);
        lines.forEach(function(line) {
            self.media[mediaindex] = self.media[mediaindex].replace(line + '\r\n', '');
        });
        this.raw = this.session + this.media.join('');
        return lines;
    };

    // add content's to a jingle element
    SDP.prototype.toJingle = function (elem, thecreator) {
        var i, j, k, mline, ssrc, rtpmap, tmp, line, lines;
        var self = this;
        // new bundle plan
        if (SDPUtil.find_line(this.session, 'a=group:')) {
            lines = SDPUtil.find_lines(this.session, 'a=group:');
            for (i = 0; i < lines.length; i++) {
                tmp = lines[i].split(' ');
                var semantics = tmp.shift().substr(8);
                elem.c('group', {xmlns: 'urn:xmpp:jingle:apps:grouping:0', semantics:semantics});
                for (j = 0; j < tmp.length; j++) {
                    elem.c('content', {name: tmp[j]}).up();
                }
                elem.up();
            }
        }
        // old bundle plan, to be removed
        var bundle = [];
        if (SDPUtil.find_line(this.session, 'a=group:BUNDLE')) {
            bundle = SDPUtil.find_line(this.session, 'a=group:BUNDLE ').split(' ');
            bundle.shift();
        }
        for (i = 0; i < this.media.length; i++) {
            mline = SDPUtil.parse_mline(this.media[i].split('\r\n')[0]);
            if (!(mline.media == 'audio' || mline.media == 'video')) {
                continue;
            }
            if (SDPUtil.find_line(this.media[i], 'a=ssrc:')) {
                ssrc = SDPUtil.find_line(this.media[i], 'a=ssrc:').substring(7).split(' ')[0]; // take the first
            } else {
                ssrc = false;
            }

            elem.c('content', {creator: thecreator, name: mline.media});
            if (SDPUtil.find_line(this.media[i], 'a=mid:')) {
                // prefer identifier from a=mid if present
                var mid = SDPUtil.parse_mid(SDPUtil.find_line(this.media[i], 'a=mid:'));
                elem.attrs({ name: mid });
            }
            if (SDPUtil.find_line(this.media[i], 'a=rtpmap:').length) {
                elem.c('description',
                     {xmlns: 'urn:xmpp:jingle:apps:rtp:1',
                      media: mline.media });
                if (ssrc) {
                    elem.attrs({ssrc: ssrc});
                }
                for (j = 0; j < mline.fmt.length; j++) {
                    rtpmap = SDPUtil.find_line(this.media[i], 'a=rtpmap:' + mline.fmt[j]);
                    const payload_type = SDPUtil.parse_rtpmap(rtpmap);

                    elem.c('payload-type', payload_type);
                    // put any 'a=fmtp:' + mline.fmt[j] lines into <param name=foo value=bar/>
                    if (SDPUtil.find_line(this.media[i], 'a=fmtp:' + mline.fmt[j])) {
                        tmp = SDPUtil.parse_fmtp(SDPUtil.find_line(this.media[i], 'a=fmtp:' + mline.fmt[j]));
                        for (k = 0; k < tmp.length; k++) {
                            elem.c('parameter', tmp[k]).up();
                        }
                    }
                    this.RtcpFbToJingle(i, elem, mline.fmt[j]); // XEP-0293 -- map a=rtcp-fb

                    elem.up();

                }
                if (SDPUtil.find_line(this.media[i], 'a=crypto:', this.session)) {
                    elem.c('encryption', {required: 1});
                    var crypto = SDPUtil.find_lines(this.media[i], 'a=crypto:', this.session);
                    crypto.forEach(function(line) {
                        elem.c('crypto', SDPUtil.parse_crypto(line)).up();
                    });
                    elem.up(); // end of encryption
                }

                if (ssrc) {
                    // new style mapping
                    elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                    // FIXME: group by ssrc and support multiple different ssrcs
                    var ssrclines = SDPUtil.find_lines(this.media[i], 'a=ssrc:');
                    ssrclines.forEach(function(line) {
                        idx = line.indexOf(' ');
                        var linessrc = line.substr(0, idx).substr(7);
                        if (linessrc != ssrc) {
                            elem.up();
                            ssrc = linessrc;
                            elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                        }
                        var kv = line.substr(idx + 1);
                        elem.c('parameter');
                        if (kv.indexOf(':') == -1) {
                            elem.attrs({ name: kv });
                        } else {
                            elem.attrs({ name: kv.split(':', 2)[0] });
                            elem.attrs({ value: kv.split(':', 2)[1] });
                        }
                        elem.up();
                    });
                    elem.up();
                }

                if (SDPUtil.find_line(this.media[i], 'a=rtcp-mux')) {
                    elem.c('rtcp-mux').up();
                }

                // XEP-0293 -- map a=rtcp-fb:*
                this.RtcpFbToJingle(i, elem, '*');

                // XEP-0294
                if (SDPUtil.find_line(this.media[i], 'a=extmap:')) {
                    lines = SDPUtil.find_lines(this.media[i], 'a=extmap:');
                    for (j = 0; j < lines.length; j++) {
                        tmp = SDPUtil.parse_extmap(lines[j]);
                        elem.c('rtp-hdrext', { xmlns: 'urn:xmpp:jingle:apps:rtp:rtp-hdrext:0',
                                        uri: tmp.uri,
                                        id: tmp.value });
                        if (tmp.hasOwnProperty('direction')) {
                            switch (tmp.direction) {
                            case 'sendonly':
                                elem.attrs({senders: 'responder'});
                                break;
                            case 'recvonly':
                                elem.attrs({senders: 'initiator'});
                                break;
                            case 'sendrecv':
                                elem.attrs({senders: 'both'});
                                break;
                            case 'inactive':
                                elem.attrs({senders: 'none'});
                                break;
                            }
                        }
                        // TODO: handle params
                        elem.up();
                    }
                }
                elem.up(); // end of description
            }

            // map ice-ufrag/pwd, dtls fingerprint, candidates
            this.TransportToJingle(i, elem);

            if (SDPUtil.find_line(this.media[i], 'a=sendrecv', this.session)) {
                elem.attrs({senders: 'both'});
            } else if (SDPUtil.find_line(this.media[i], 'a=sendonly', this.session)) {
                elem.attrs({senders: 'initiator'});
            } else if (SDPUtil.find_line(this.media[i], 'a=recvonly', this.session)) {
                elem.attrs({senders: 'responder'});
            } else if (SDPUtil.find_line(this.media[i], 'a=inactive', this.session)) {
                elem.attrs({senders: 'none'});
            }
            if (mline.port == '0') {
                // estos hack to reject an m-line
                elem.attrs({senders: 'rejected'});
            }
            elem.up(); // end of content
        }
        elem.up();
        return elem;
    };

    SDP.prototype.TransportToJingle = function (mediaindex, elem) {
        var i = mediaindex;
        var tmp;
        var self = this;
        elem.c('transport');

        // XEP-0320
        var fingerprints = SDPUtil.find_lines(this.media[mediaindex], 'a=fingerprint:', this.session);
        fingerprints.forEach(function(line) {
            tmp = SDPUtil.parse_fingerprint(line);
            tmp.xmlns = 'urn:xmpp:jingle:apps:dtls:0';
            elem.c('fingerprint').t(tmp.fingerprint);
            delete tmp.fingerprint;
            line = SDPUtil.find_line(self.media[mediaindex], 'a=setup:', self.session);
            if (line) {
                tmp.setup = line.substr(8);
            }
            elem.attrs(tmp);
            elem.up(); // end of fingerprint
        });
        tmp = SDPUtil.iceparams(this.media[mediaindex], this.session);
        if (tmp) {
            tmp.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';
            elem.attrs(tmp);
            // XEP-0176
            if (SDPUtil.find_line(this.media[mediaindex], 'a=candidate:', this.session)) { // add any a=candidate lines
                var lines = SDPUtil.find_lines(this.media[mediaindex], 'a=candidate:', this.session);
                lines.forEach(function (line) {
                    elem.c('candidate', SDPUtil.candidateToJingle(line)).up();
                });
            }
        }
        elem.up(); // end of transport
    };

    SDP.prototype.RtcpFbToJingle = function (mediaindex, elem, payloadtype) { // XEP-0293
        var lines = SDPUtil.find_lines(this.media[mediaindex], 'a=rtcp-fb:' + payloadtype);
        lines.forEach(function (line) {
            var tmp = SDPUtil.parse_rtcpfb(line);
            if (tmp.type == 'trr-int') {
                elem.c('rtcp-fb-trr-int', {xmlns: 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0', value: tmp.params[0]});
                elem.up();
            } else {
                elem.c('rtcp-fb', {xmlns: 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0', type: tmp.type});
                if (tmp.params.length > 0) {
                    elem.attrs({'subtype': tmp.params[0]});
                }
                elem.up();
            }
        });
    };

    SDP.prototype.RtcpFbFromJingle = function (elem, payloadtype) { // XEP-0293
        var media = '';
        var tmp = elem.find('>rtcp-fb-trr-int[xmlns="urn:xmpp:jingle:apps:rtp:rtcp-fb:0"]');
        if (tmp.length) {
            media += 'a=rtcp-fb:' + '*' + ' ' + 'trr-int' + ' ';
            if (tmp.attr('value')) {
                media += tmp.attr('value');
            } else {
                media += '0';
            }
            media += '\r\n';
        }
        tmp = elem.find('>rtcp-fb[xmlns="urn:xmpp:jingle:apps:rtp:rtcp-fb:0"]');
        tmp.each(function () {
            media += 'a=rtcp-fb:' + payloadtype + ' ' + $(this).attr('type');
            if ($(this).attr('subtype')) {
                media += ' ' + $(this).attr('subtype');
            }
            media += '\r\n';
        });
        return media;
    };

    // construct an SDP from a jingle stanza
    SDP.prototype.fromJingle = function (jingle) {
        var self = this;
        this.raw = 'v=0\r\n' +
            'o=- ' + '1923518516' + ' 2 IN IP4 0.0.0.0\r\n' +// FIXME
            's=-\r\n' +
            't=0 0\r\n';
        // http://tools.ietf.org/html/draft-ietf-mmusic-sdp-bundle-negotiation-04#section-8
        if ($(jingle).find('>group[xmlns="urn:xmpp:jingle:apps:grouping:0"]').length) {
            $(jingle).find('>group[xmlns="urn:xmpp:jingle:apps:grouping:0"]').each(function (idx, group) {
                var contents = $(group).find('>content').map(function (idx, content) {
                    return content.getAttribute('name');
                }).get();
                if (contents.length > 0) {
                    self.raw += 'a=group:' + (group.getAttribute('semantics') || group.getAttribute('type')) + ' ' + contents.join(' ') + '\r\n';
                }
            });
        } else if ($(jingle).find('>group[xmlns="urn:ietf:rfc:5888"]').length) {
            // temporary namespace, not to be used. to be removed soon.
            $(jingle).find('>group[xmlns="urn:ietf:rfc:5888"]').each(function (idx, group) {
                var contents = $(group).find('>content').map(function (idx, content) {
                    return content.getAttribute('name');
                }).get();
                if (group.getAttribute('type') !== null && contents.length > 0) {
                    self.raw += 'a=group:' + group.getAttribute('type') + ' ' + contents.join(' ') + '\r\n';
                }
            });
        } else {
            // for backward compability, to be removed soon
            // assume all contents are in the same bundle group, can be improved upon later
            var bundle = $(jingle).find('>content').filter(function (idx, content) {
                return $(content).find('>bundle').length > 0;
            }).map(function (idx, content) {
                return content.getAttribute('name');
            }).get();
            if (bundle.length) {
                this.raw += 'a=group:BUNDLE ' + bundle.join(' ') + '\r\n';
            }
        }

        this.session = this.raw;
        jingle.find('>content').each(function () {
            var m = self.jingle2media($(this));
            self.media.push(m);
        });

        // reconstruct msid-semantic -- apparently not necessary
        /*
        var msid = SDPUtil.parse_ssrc(this.raw);
        if (msid.hasOwnProperty('mslabel')) {
            this.session += "a=msid-semantic: WMS " + msid.mslabel + "\r\n";
        }
        */

        this.raw = this.session + this.media.join('');
    };

    // translate a jingle content element into an an SDP media part
    SDP.prototype.jingle2media = function (content) {
        var media = '',
            desc = content.find('description'),
            ssrc = desc.attr('ssrc'),
            self = this,
            tmp;

        tmp = { media: desc.attr('media') };
        tmp.port = '1';
        if (content.attr('senders') == 'rejected') {
            // estos hack to reject an m-line.
            tmp.port = '0';
        }
        if (content.find('>transport>fingerprint').length || desc.find('encryption').length) {
            tmp.proto = 'RTP/SAVPF';
        } else {
            tmp.proto = 'RTP/AVPF';
        }
        tmp.fmt = desc.find('payload-type').map(function () { return this.getAttribute('id'); }).get();
        media += SDPUtil.build_mline(tmp) + '\r\n';
        media += 'c=IN IP4 0.0.0.0\r\n';
        media += 'a=rtcp:1 IN IP4 0.0.0.0\r\n';
        tmp = content.find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]');
        if (tmp.length) {
            if (tmp.attr('ufrag')) {
                media += SDPUtil.build_iceufrag(tmp.attr('ufrag')) + '\r\n';
            }
            if (tmp.attr('pwd')) {
                media += SDPUtil.build_icepwd(tmp.attr('pwd')) + '\r\n';
            }
            tmp.find('>fingerprint').each(function () {
                // FIXME: check namespace at some point
                media += 'a=fingerprint:' + this.getAttribute('hash');
                media += ' ' + $(this).text();
                media += '\r\n';
                if (this.getAttribute('setup')) {
                    media += 'a=setup:' + this.getAttribute('setup') + '\r\n';
                }
            });
        }
        switch (content.attr('senders')) {
        case 'initiator':
            media += 'a=sendonly\r\n';
            break;
        case 'responder':
            media += 'a=recvonly\r\n';
            break;
        case 'none':
            media += 'a=inactive\r\n';
            break;
        case 'both':
            media += 'a=sendrecv\r\n';
            break;
        }
        media += 'a=mid:' + content.attr('name') + '\r\n';

        // <description><rtcp-mux/></description>
        // see http://code.google.com/p/libjingle/issues/detail?id=309 -- no spec though
        // and http://mail.jabber.org/pipermail/jingle/2011-December/001761.html
        if (desc.find('rtcp-mux').length) {
            media += 'a=rtcp-mux\r\n';
        }

        if (desc.find('encryption').length) {
            desc.find('encryption>crypto').each(function () {
                media += 'a=crypto:' + this.getAttribute('tag');
                media += ' ' + this.getAttribute('crypto-suite');
                media += ' ' + this.getAttribute('key-params');
                if (this.getAttribute('session-params')) {
                    media += ' ' + this.getAttribute('session-params');
                }
                media += '\r\n';
            });
        }
        desc.find('payload-type').each(function () {
            media += SDPUtil.build_rtpmap(this) + '\r\n';
            if ($(this).find('>parameter').length) {
                media += 'a=fmtp:' + this.getAttribute('id') + ' ';
                media += $(this).find('parameter').map(function () { return (this.getAttribute('name') ? (this.getAttribute('name') + '=') : '') + this.getAttribute('value'); }).get().join(';');
                media += '\r\n';
            }
            // xep-0293
            media += self.RtcpFbFromJingle($(this), this.getAttribute('id'));
        });

        // xep-0293
        media += self.RtcpFbFromJingle(desc, '*');

        // xep-0294
        tmp = desc.find('>rtp-hdrext[xmlns="urn:xmpp:jingle:apps:rtp:rtp-hdrext:0"]');
        tmp.each(function () {
            media += 'a=extmap:' + this.getAttribute('id') + ' ' + this.getAttribute('uri') + '\r\n';
        });

        content.find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]>candidate').each(function () {
            media += SDPUtil.candidateFromJingle(this);
        });

        tmp = content.find('description>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
        tmp.each(function () {
            var ssrc = this.getAttribute('ssrc');
            $(this).find('>parameter').each(function () {
                media += 'a=ssrc:' + ssrc + ' ' + this.getAttribute('name');
                if (this.getAttribute('value') && this.getAttribute('value').length)
                    media += ':' + this.getAttribute('value');
                media += '\r\n';
            });
        });
        return media;
    };

    SDPUtil = {
        iceparams: function (mediadesc, sessiondesc) {
            var data = null;
            if (SDPUtil.find_line(mediadesc, 'a=ice-ufrag:', sessiondesc) &&
                SDPUtil.find_line(mediadesc, 'a=ice-pwd:', sessiondesc)) {
                data = {
                    ufrag: SDPUtil.parse_iceufrag(SDPUtil.find_line(mediadesc, 'a=ice-ufrag:', sessiondesc)),
                    pwd: SDPUtil.parse_icepwd(SDPUtil.find_line(mediadesc, 'a=ice-pwd:', sessiondesc))
                };
            }
            return data;
        },
        parse_iceufrag: function (line) {
            return line.substring(12);
        },
        build_iceufrag: function (frag) {
            return 'a=ice-ufrag:' + frag;
        },
        parse_icepwd: function (line) {
            return line.substring(10);
        },
        build_icepwd: function (pwd) {
            return 'a=ice-pwd:' + pwd;
        },
        parse_mid: function (line) {
            return line.substring(6);
        },
        parse_mline: function (line) {
            var parts = line.substring(2).split(' '),
            data = {};
            data.media = parts.shift();
            data.port = parts.shift();
            data.proto = parts.shift();
            if (parts[parts.length - 1] === '') { // trailing whitespace
                parts.pop();
            }
            data.fmt = parts;
            return data;
        },
        build_mline: function (mline) {
            return 'm=' + mline.media + ' ' + mline.port + ' ' + mline.proto + ' ' + mline.fmt.join(' ');
        },
        parse_rtpmap: function (line) {
            var parts = line.substring(9).split(' '),
                data = {};
            data.id = parts.shift();
            parts = parts[0].split('/');
            data.name = parts.shift();
            data.clockrate = parts.shift();
            data.channels = parts.length ? parts.shift() : '1';
            return data;
        },
        build_rtpmap: function (el) {
            var line = 'a=rtpmap:' + el.getAttribute('id') + ' ' + el.getAttribute('name') + '/' + el.getAttribute('clockrate');
            if (el.getAttribute('channels') && el.getAttribute('channels') != '1') {
                line += '/' + el.getAttribute('channels');
            }
            return line;
        },
        parse_crypto: function (line) {
            var parts = line.substring(9).split(' '),
            data = {};
            data.tag = parts.shift();
            data['crypto-suite'] = parts.shift();
            data['key-params'] = parts.shift();
            if (parts.length) {
                data['session-params'] = parts.join(' ');
            }
            return data;
        },
        parse_fingerprint: function (line) { // RFC 4572
            var parts = line.substring(14).split(' '),
            data = {};
            data.hash = parts.shift();
            data.fingerprint = parts.shift();
            // TODO assert that fingerprint satisfies 2UHEX *(":" 2UHEX) ?
            return data;
        },
        parse_fmtp: function (line) {
            var parts = line.split(' '),
                i, key, value,
                data = [];
            parts.shift();
            parts = parts.join(' ').split(';');
            for (i = 0; i < parts.length; i++) {
                key = parts[i].split('=')[0];
                while (key.length && key[0] == ' ') {
                    key = key.substring(1);
                }
                value = parts[i].split('=')[1];
                if (key && value) {
                    data.push({name: key, value: value});
                } else if (key) {
                    // rfc 4733 (DTMF) style stuff
                    data.push({name: '', value: key});
                }
            }
            return data;
        },
        parse_icecandidate: function (line) {
            var candidate = {},
                elems = line.split(' ');
            candidate.foundation = elems[0].substring(12);
            candidate.component = elems[1];
            candidate.protocol = elems[2].toLowerCase();
            candidate.priority = elems[3];
            candidate.ip = elems[4];
            candidate.port = elems[5];
            // elems[6] => "typ"
            candidate.type = elems[7];
            candidate.generation = 0; // default value, may be overwritten below
            for (var i = 8; i < elems.length; i += 2) {
                switch (elems[i]) {
                case 'raddr':
                    candidate['rel-addr'] = elems[i + 1];
                    break;
                case 'rport':
                    candidate['rel-port'] = elems[i + 1];
                    break;
                case 'generation':
                    candidate.generation = elems[i + 1];
                    break;
                case 'tcptype':
                    if (candidate.protocol.toLowerCase() === 'tcp') {
                        candidate.tcptype = elems[i + 1];
                    }
                    break;
                default: // TODO
                    console.debug('parse_icecandidate not translating "' + elems[i] + '" = "' + elems[i + 1] + '"');
                }
            }
            candidate.network = '1';
            candidate.id = Math.random().toString(36).substr(2, 10); // not applicable to SDP -- FIXME: should be unique, not just random
            return candidate;
        },
        build_icecandidate: function (cand) {
            var line = ['a=candidate:' + cand.foundation, cand.component, cand.protocol, cand.priority, cand.ip, cand.port, 'typ', cand.type].join(' ');
            line += ' ';
            switch (cand.type) {
            case 'srflx':
            case 'prflx':
            case 'relay':
                if (cand.hasOwnAttribute('rel-addr') && cand.hasOwnAttribute('rel-port')) {
                    line += 'raddr';
                    line += ' ';
                    line += cand['rel-addr'];
                    line += ' ';
                    line += 'rport';
                    line += ' ';
                    line += cand['rel-port'];
                    line += ' ';
                }
                break;
            }
            if (cand.hasOwnAttribute('tcptype')) {
                line += 'tcptype';
                line += ' ';
                line += cand.tcptype;
                line += ' ';
            }
            line += 'generation';
            line += ' ';
            line += cand.hasOwnAttribute('generation') ? cand.generation : '0';
            return line;
        },
        parse_ssrc: function (desc) {
            // proprietary mapping of a=ssrc lines
            // TODO: see "Jingle RTP Source Description" by Juberti and P. Thatcher on google docs
            // and parse according to that
            var lines = desc.split('\r\n'),
                data = {};
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].substring(0, 7) == 'a=ssrc:') {
                    var idx = lines[i].indexOf(' ');
                    data[lines[i].substr(idx + 1).split(':', 2)[0]] = lines[i].substr(idx + 1).split(':', 2)[1];
                }
            }
            return data;
        },
        parse_rtcpfb: function (line) {
            var parts = line.substr(10).split(' ');
            var data = {};
            data.pt = parts.shift();
            data.type = parts.shift();
            data.params = parts;
            return data;
        },
        parse_extmap: function (line) {
            var parts = line.substr(9).split(' ');
            var data = {};
            data.value = parts.shift();
            if (data.value.indexOf('/') != -1) {
                data.direction = data.value.substr(data.value.indexOf('/') + 1);
                data.value = data.value.substr(0, data.value.indexOf('/'));
            } else {
                data.direction = 'both';
            }
            data.uri = parts.shift();
            data.params = parts;
            return data;
        },
        find_line: function (haystack, needle, sessionpart) {
            var lines = haystack.split('\r\n');
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].substring(0, needle.length) == needle) {
                    return lines[i];
                }
            }
            if (!sessionpart) {
                return false;
            }
            // search session part
            lines = sessionpart.split('\r\n');
            for (var j = 0; j < lines.length; j++) {
                if (lines[j].substring(0, needle.length) == needle) {
                    return lines[j];
                }
            }
            return false;
        },
        find_lines: function (haystack, needle, sessionpart) {
            var lines = haystack.split('\r\n'),
                needles = [];
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].substring(0, needle.length) == needle)
                    needles.push(lines[i]);
            }
            if (needles.length || !sessionpart) {
                return needles;
            }
            // search session part
            lines = sessionpart.split('\r\n');
            for (var j = 0; j < lines.length; j++) {
                if (lines[j].substring(0, needle.length) == needle) {
                    needles.push(lines[j]);
                }
            }
            return needles;
        },
        candidateToJingle: function (line) {
            if (line.indexOf('candidate:') === 0) {
                line = 'a=' + line;
            } else if (line.substring(0, 12) != 'a=candidate:') {
                console.debug('parseCandidate called with a line that is not a candidate line');
                console.debug(line);
                return null;
            }
            if (line.substring(line.length - 2) == '\r\n') // chomp it
                line = line.substring(0, line.length - 2);
            var candidate = {},
                elems = line.split(' '),
                i;
            if (elems[6] != 'typ') {
                console.debug('did not find typ in the right place');
                console.debug(line);
                return null;
            }
            candidate.foundation = elems[0].substring(12);
            candidate.component = elems[1];
            candidate.protocol = elems[2].toLowerCase();
            candidate.priority = elems[3];
            candidate.ip = elems[4];
            candidate.port = elems[5];
            // elems[6] => "typ"
            candidate.type = elems[7];
            candidate.generation = '0';

            for (i = 8; i < elems.length; i += 2) {
                switch (elems[i]) {
                case 'raddr':
                    candidate['rel-addr'] = elems[i + 1];
                    break;
                case 'rport':
                    candidate['rel-port'] = elems[i + 1];
                    break;
                case 'generation':
                    candidate.generation = elems[i + 1];
                    break;
                case 'tcptype':
                    candidate.tcptype = elems[i + 1];
                    break;
                default: // TODO
                    console.debug('not translating "' + elems[i] + '" = "' + elems[i + 1] + '"');
                }
            }
            candidate.network = '1';
            candidate.id = Math.random().toString(36).substr(2, 10); // not applicable to SDP -- FIXME: should be unique, not just random
            return candidate;
        },
        candidateFromJingle: function (cand) {
            var parts = [
                'a=candidate:' + cand.getAttribute('foundation'),
                cand.getAttribute('component'),
                cand.getAttribute('protocol'),
                cand.getAttribute('priority'),
                cand.getAttribute('ip'),
                cand.getAttribute('port'),
                'typ',
                cand.getAttribute('type')
            ];
            switch (cand.getAttribute('type')) {
            case 'srflx':
            case 'prflx':
            case 'relay':
                if (cand.getAttribute('rel-addr') && cand.getAttribute('rel-port')) {
                    parts.push('raddr');
                    parts.push(cand.getAttribute('rel-addr'));
                    parts.push('rport');
                    parts.push(cand.getAttribute('rel-port'));
                }
                break;
            }
            parts.push('generation');
            parts.push(cand.getAttribute('generation') || '0');
            return parts.join(' ') + '\r\n';
        }
    };

    function TraceablePeerConnection(ice_config, constraints) {
        var self = this;
        var RTCPeerconnection = navigator.mozGetUserMedia ? mozRTCPeerConnection : webkitRTCPeerConnection;
        this.peerconnection = new RTCPeerconnection(ice_config, constraints);
        this.updateLog = [];
        this.stats = {};
        this.statsinterval = null;
        this.maxstats = 300; // limit to 300 values, i.e. 5 minutes; set to 0 to disable

        // override as desired
        this.trace = function(what, info) {
            //console.warn('WTRACE', what, info);
            self.updateLog.push({
                time: new Date(),
                type: what,
                value: info || ""
            });
        };
        this.onicecandidate = null;
        this.peerconnection.onicecandidate = function (event) {
            self.trace('onicecandidate', JSON.stringify(event.candidate, null, ' '));
            if (self.onicecandidate !== null) {
                self.onicecandidate(event);
            }
        };
        this.onaddstream = null;
        this.peerconnection.onaddstream = function (event) {
            self.trace('onaddstream', event.stream.id);
            if (self.onaddstream !== null) {
                self.onaddstream(event);
            }
        };
        this.onremovestream = null;
        this.peerconnection.onremovestream = function (event) {
            self.trace('onremovestream', event.stream.id);
            if (self.onremovestream !== null) {
                self.onremovestream(event);
            }
        };
        this.onsignalingstatechange = null;
        this.peerconnection.onsignalingstatechange = function (event) {
            self.trace('onsignalingstatechange', self.signalingState);
            if (self.onsignalingstatechange !== null) {
                self.onsignalingstatechange(event);
            }
        };
        this.oniceconnectionstatechange = null;
        this.peerconnection.oniceconnectionstatechange = function (event) {
            self.trace('oniceconnectionstatechange', self.iceConnectionState);
            if (self.oniceconnectionstatechange !== null) {
                self.oniceconnectionstatechange(event);
            }
        };
        this.onnegotiationneeded = null;
        this.peerconnection.onnegotiationneeded = function (event) {
            self.trace('onnegotiationneeded');
            if (self.onnegotiationneeded !== null) {
                self.onnegotiationneeded(event);
            }
        };
        self.ondatachannel = null;
        this.peerconnection.ondatachannel = function (event) {
            self.trace('ondatachannel', event);
            if (self.ondatachannel !== null) {
                self.ondatachannel(event);
            }
        };
        if (!navigator.mozGetUserMedia) {
            this.statsinterval = window.setInterval(function() {
                self.peerconnection.getStats(function(stats) {
                    var results = stats.result();
                    for (var i = 0; i < results.length; ++i) {
                        //console.debug(results[i].type, results[i].id, results[i].names())
                        var now = new Date();
                        results[i].names().forEach(function (name) {
                            var id = results[i].id + '-' + name;
                            if (!self.stats[id]) {
                                self.stats[id] = {
                                    startTime: now,
                                    endTime: now,
                                    values: [],
                                    times: []
                                };
                            }
                            self.stats[id].values.push(results[i].stat(name));
                            self.stats[id].times.push(now.getTime());
                            if (self.stats[id].values.length > self.maxstats) {
                                self.stats[id].values.shift();
                                self.stats[id].times.shift();
                            }
                            self.stats[id].endTime = now;
                        });
                    }
                });

            }, 1000);
        }
    }

    dumpSDP = function(description) {
        return 'type: ' + description.type + '\r\n' + description.sdp;
    };

    ['signalingState', 'iceConnectionState', 'localDescription', 'remoteDescription'].forEach(function (prop) {
        Object.defineProperty(TraceablePeerConnection.prototype, prop, {
            get: function () {
                return this.peerconnection[prop];
            }
        });
    });

    TraceablePeerConnection.prototype.addStream = function (stream) {
        this.trace('addStream', stream.id);
        this.peerconnection.addStream(stream);
    };

    TraceablePeerConnection.prototype.removeStream = function (stream) {
        this.trace('removeStream', stream.id);
        this.peerconnection.removeStream(stream);
    };

    TraceablePeerConnection.prototype.createDataChannel = function (label, opts) {
        this.trace('createDataChannel', label, opts);
        this.peerconnection.createDataChannel(label, opts);
    };

    TraceablePeerConnection.prototype.setLocalDescription = function (description, successCallback, failureCallback) {
        var self = this;
        this.trace('setLocalDescription', dumpSDP(description));
        this.peerconnection.setLocalDescription(description,
            function () {
                self.trace('setLocalDescriptionOnSuccess');
                successCallback();
            },
            function (err) {
                self.trace('setLocalDescriptionOnFailure', err);
                failureCallback(err);
            }
        );
        /*
        if (this.statsinterval === null && this.maxstats > 0) {
            // start gathering stats
        }
        */
    };

    TraceablePeerConnection.prototype.setRemoteDescription = function (description, successCallback, failureCallback) {
        var self = this;
        this.trace('setRemoteDescription', dumpSDP(description));
        this.peerconnection.setRemoteDescription(description,
            function () {
                self.trace('setRemoteDescriptionOnSuccess');
                successCallback();
            },
            function (err) {
                self.trace('setRemoteDescriptionOnFailure', err);
                failureCallback(err);
            }
        );
        /*
        if (this.statsinterval === null && this.maxstats > 0) {
            // start gathering stats
        }
        */
    };

    TraceablePeerConnection.prototype.close = function () {
        this.trace('stop');
        if (this.statsinterval !== null) {
            window.clearInterval(this.statsinterval);
            this.statsinterval = null;
        }
        this.peerconnection.close();
    };

    TraceablePeerConnection.prototype.createOffer = function (successCallback, failureCallback, constraints) {
        var self = this;
        this.trace('createOffer', JSON.stringify(constraints, null, ' '));
        this.peerconnection.createOffer(
            function (offer) {
                self.trace('createOfferOnSuccess', dumpSDP(offer));
                successCallback(offer);
            },
            function(err) {
                self.trace('createOfferOnFailure', err);
                failureCallback(err);
            },
            constraints
        );
    };

    TraceablePeerConnection.prototype.createAnswer = function (successCallback, failureCallback, constraints) {
        var self = this;
        this.trace('createAnswer', JSON.stringify(constraints, null, ' '));
        this.peerconnection.createAnswer(
            function (answer) {
                self.trace('createAnswerOnSuccess', dumpSDP(answer));
                successCallback(answer);
            },
            function(err) {
                self.trace('createAnswerOnFailure', err);
                failureCallback(err);
            },
            constraints
        );
    };

    TraceablePeerConnection.prototype.addIceCandidate = function (candidate, successCallback, failureCallback) {
        var self = this;
        this.trace('addIceCandidate', JSON.stringify(candidate, null, ' '));
        this.peerconnection.addIceCandidate(candidate);
        this.peerconnection.addIceCandidate(candidate,
            function () {
                self.trace('addIceCandidateOnSuccess');
                if (successCallback) successCallback();
            },
            function (err) {
                self.trace('addIceCandidateOnFailure', err);
                if (failureCallback) failureCallback(err);
            }
        );
    };

    TraceablePeerConnection.prototype.getStats = function(callback) {
        if (navigator.mozGetUserMedia) {
            // ignore for now...
        } else {
            this.peerconnection.getStats(callback);
        }
    };

    // mozilla chrome compat layer -- very similar to adapter.js
    function setupRTC() {
        var RTC = null;
        if (navigator.mozGetUserMedia && mozRTCPeerConnection) {
            console.debug('This appears to be Firefox');
            var version = navigator.userAgent.match(/Firefox/) ? parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10) : 0;
            if (version >= 22) {
                RTC = {
                    peerconnection: mozRTCPeerConnection,
                    browser: 'firefox',
                    getUserMedia: navigator.mozGetUserMedia.bind(navigator),
                    attachMediaStream: function (element, stream) {
                        element[0].mozSrcObject = stream;
                        element[0].play();
                    },
                    pc_constraints: {}
                };
                RTCSessionDescription = mozRTCSessionDescription;
                RTCIceCandidate = mozRTCIceCandidate;
            }
        } else if (navigator.webkitGetUserMedia) {
            console.debug('This appears to be Chrome');
            RTC = {
                peerconnection: webkitRTCPeerConnection,
                browser: 'chrome',
                getUserMedia: navigator.webkitGetUserMedia.bind(navigator),
                attachMediaStream: function (element, stream) {
                    element[0].srcObject = stream;
                    element[0].play();
                },
                // DTLS should now be enabled by default but..
                pc_constraints: {'optional': [{'DtlsSrtpKeyAgreement': 'true'}]}
            };
        }
        if (RTC === null) {
            try { console.debug('Browser does not appear to be WebRTC-capable'); } catch (e) { }
        }
        return RTC;
    }

    function getUserMediaWithConstraints(um, jid, callback, resolution, bandwidth, fps) {
        var constraints = {audio: false, video: false};

        if (localStream) {
            localStream.getTracks().forEach(function (track) { track.stop(); });
            localStream = null;
        }

        if (um.indexOf('video') >= 0) {
            constraints.video = {mandatory: {}};// same behaviour as true
        }
        if (um.indexOf('audio') >= 0) {
            constraints.audio = {};// same behaviour as true
        }
        if (um.indexOf('screen') >= 0) {
            constraints.video = {
                "mandatory": {
                    "chromeMediaSource": "screen"
                }
            };
        }

        if (resolution && !constraints.video) {
            constraints.video = {mandatory: {}};// same behaviour as true
        }
        // see https://code.google.com/p/chromium/issues/detail?id=143631#c9 for list of supported resolutions
        switch (resolution) {
        // 16:9 first
        case '1080':
        case 'fullhd':
            constraints.video.mandatory.minWidth = 1920;
            constraints.video.mandatory.minHeight = 1080;
            break;
        case '720':
        case 'hd':
            constraints.video.mandatory.minWidth = 1280;
            constraints.video.mandatory.minHeight = 720;
            break;
        case '360':
            constraints.video.mandatory.minWidth = 640;
            constraints.video.mandatory.minHeight = 360;
            break;
        case '180':
            constraints.video.mandatory.minWidth = 320;
            constraints.video.mandatory.minHeight = 180;
            break;
            // 4:3
        case '960':
            constraints.video.mandatory.minWidth = 960;
            constraints.video.mandatory.minHeight = 720;
            break;
        case '640':
        case 'vga':
            constraints.video.mandatory.minWidth = 640;
            constraints.video.mandatory.minHeight = 480;
            break;
        case '320':
            constraints.video.mandatory.minWidth = 320;
            constraints.video.mandatory.minHeight = 240;
            break;
        default:
            if (navigator.userAgent.indexOf('Android') != -1) {
                constraints.video.mandatory.minWidth = 320;
                constraints.video.mandatory.minHeight = 240;
                constraints.video.mandatory.maxFrameRate = 15;
            }
            break;
        }

        // take what is configured and try not to be more intelligent
        if (constraints.video.minWidth) constraints.video.maxWidth = constraints.video.minWidth;
        if (constraints.video.minHeight) constraints.video.maxHeight = constraints.video.minHeight;

        if (bandwidth) { // doesn't work currently, see webrtc issue 1846
            if (!constraints.video) constraints.video = {mandatory: {}};//same behaviour as true
            constraints.video.optional = [{bandwidth: bandwidth}];
        }
        if (fps) { // for some cameras it might be necessary to request 30fps
            // so they choose 30fps mjpg over 10fps yuy2
            if (!constraints.video) constraints.video = {mandatory: {}};// same behaviour as tru;
            constraints.video.mandatory.minFrameRate = fps;
        }

        try {
            RTC.getUserMedia(constraints,
                    function (stream) {
                        console.debug('onUserMediaSuccess');
                        localStream = stream;
                        _converse.connection.jingle.localStream = stream;
                        callback(null, jid);
                    },
                    function (error) {
                        console.warn('Failed to get access to local media. Error ', error);
                        callback(error);
                    });
        } catch (e) {
            console.error('GUM failed: ', e);
            callback(e);
        }
    }
}));
