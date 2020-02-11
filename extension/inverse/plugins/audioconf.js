(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs, _converse;
    converse.plugins.add("audioconf", {
        'dependencies': [],

        'initialize': function () {
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

            let username = getSetting("username");
            let password = getSetting("password");
            let server = getSetting("server");
            let domain = getSetting("domain");
            let connUrl = getSetting("boshUri", "https://" + server + "/http-bind");

            const baseUrl = getSetting("ofmeetUrl", "https://meet.jit.si");

            if (baseUrl.indexOf("https://" + server) == -1)
            {
                server = baseUrl.split("/")[2];
                domain = server.split(":")[0];
                connUrl = "https://" + server + "/http-bind";
                username = undefined;
                password = undefined;
            }

            _converse.api.settings.update({
                visible_toolbar_buttons: {call: true},
                click2_dial: {
                    custom_button_color: "orange",
                    custom_frame_color: "black",
                    dial_pad: "true",
                    did: "3001",
                    display_button: "false",
                    div_css_class_name: "btn-style-round-a",
                    draggable: "true",
                    incompatible_browser_configuration: "hide_widget",
                    placement: "bottom-right",
                    rating: "false",
                    ringback: "true",
                    server_url: "/inverse/plugins/audioconf",
                    show_branding: "false",
                    show_frame: "true",
                    text: "Audio Conference",
                    use_default_button_css: "true",
                    protocol: "xmpp",    // 'sip' or 'xmpp'
                    sip: {domain: "192.168.1.251", server: "wss://desktop-545pc5b:7443/sip/proxy?url=ws://192.168.1.251:5066", register: false, caller_uri: "sip:1002@192.168.1.251", authorization_user: "1002", password: "1234"},
                    xmpp: {domain: domain, server: connUrl, username: username, password: password}
                }
            });

            window.click2Dial = _converse.api.settings.get("click2_dial");

            const head  = document.getElementsByTagName('head')[0];
            const script  = document.createElement('script');
            script.src = click2Dial.server_url + '/scripts/click2dial.js';
            script.async = false;
            head.appendChild(script);

            _converse.api.listen.on('connected', function()
            {
                 const sip = {};

                _converse.connection.sendIQ($iq({type: 'get', to: "sipark." + _converse.connection.domain}).c('registration', {jid: _converse.connection.jid, xmlns: "http://www.jivesoftware.com/protocol/sipark"}).tree(), function(resp)
                {
                    $(resp).find('jid').each(function()                 {sip.jid = $(this).text();});
                    $(resp).find('username').each(function()            {sip.username = $(this).text();});
                    $(resp).find('authUsername').each(function()        {sip.authUsername = $(this).text();});
                    $(resp).find('displayPhoneNum').each(function()     {sip.displayPhoneNum = $(this).text();});
                    $(resp).find('password').each(function()            {sip.password = $(this).text();});
                    $(resp).find('server').each(function()              {sip.server = $(this).text() });
                    $(resp).find('enabled').each(function()             {sip.enabled = $(this).text();});
                    $(resp).find('outboundproxy').each(function()       {sip.outboundproxy = $(this).text();});
                    $(resp).find('promptCredentials').each(function()   {sip.promptCredentials = $(this).text();});

                    console.debug("get sip profile", sip);

                    if (sip.enabled != "false")
                    {
                        window.click2Dial.protocol = "sip";
                        window.click2Dial.sip.register = true;
                        window.click2Dial.sip.server = sip.server;
                        window.click2Dial.sip.server = "wss://" + getSetting("server") + "/sip/proxy?url=ws://" + sip.outboundproxy;
                        window.click2Dial.sip.caller_uri = "sip:" + sip.displayPhoneNum + "@" + sip.server;
                        window.click2Dial.sip.authorization_user = sip.authUsername;
                        window.click2Dial.sip.password = sip.password;
                    }


                }, function (error) {
                    console.warn("SIP profile not available. Ussing XMPP for audio-conf");
                });
            });

            window.addEventListener("beforeunload", function() {
                if (voxbone.WebRTC) voxbone.WebRTC.hangup();
            });

            console.log("audioconf plugin is ready");
        },

        'overrides': {
            MessageView: {

                transformOOBURL: function(url)
                {
                    if (url && url.startsWith("web+audio-conf:"))
                    {
                        const id = "audio-conf-" + Math.random().toString(36).substr(2,9);

                        function click2Call()
                        {
                            const div = document.getElementById(id);

                            if (div) div.addEventListener('click', function(evt)
                            {
                                window.click2Dial.did = evt.target.getAttribute('data-url').substring(15);
                                window.click2Dial.makeCall(true);
                            })
                            else setTimeout(click2Call);
                        }

                        setTimeout(click2Call);

                        return "<a data-url='" + url + "' id='" + id + "'>Click to join " + url.substring(15) + "</a>";
                    }
                    else {
                        return this.__super__.transformOOBURL.apply(this, arguments);
                    }
                }
            },

            ChatBoxView: {

                toggleCall: function toggleCall(ev) {
                    ev.stopPropagation();

                    if (!getSetting("enableSip", false) && confirm(window.click2Dial.text + "?"))
                    {
                        let room = Strophe.getNodeFromJid(this.model.get("jid")).toLowerCase();

                        if (this.model.get("type") == "chatbox")
                        {
                            room = bgWindow.makeRoomName(room);
                        }

                        console.debug("toggleCall", room);

                        if (!voxbone.WebRTC.rtcSession.isEnded || voxbone.WebRTC.rtcSession.isEnded())
                        {
                            window.click2Dial.did = "audioconf_" + room;
                            window.click2Dial.makeCall(true);

                            const attrs = this.model.getOutgoingMessageAttributes(window.click2Dial.text);
                            const message = this.model.messages.create(attrs);
                            message.set('oob_url', "web+audio-conf:" + window.click2Dial.did);
                            _converse.api.send(this.model.createMessageStanza(message));

                            //this.showHelpMessages(["Calling " + click2_dial.did]);
                        }
                        else {
                            this.showHelpMessages(["Active call in progress. Clear call and try again"]);
                        }
                    }
                }
            }
        }
    });
}));
