(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var _converse = null;

    converse.plugins.add("audioconf", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            _converse.api.settings.update({
                visible_toolbar_buttons: {call: true},
            });

            window.click2Dial = {
                custom_button_color: "orange",
                custom_frame_color: "black",
                dial_pad: "true",
                did: "3001",
                display_button: "false",
                div_css_class_name: "btn-style-round-a",
                draggable: "false",
                incompatible_browser_configuration: "hide_widget",
                placement: "bottom-right",
                rating: "false",
                ringback: "true",
                server_url: "plugins/audioconf",
                show_branding: "false",
                show_frame: "true",
                text: "Ask",
                use_default_button_css: "true",
                protocol: "sip",    // 'sip' or 'xmpp'
                sip: {domain: "192.168.1.251", server: "wss://desktop-545pc5b:7443/sip/proxy?url=ws://192.168.1.251:5066", register: false, caller_uri: "sip:1002@192.168.1.251", authorization_user: "1002", password: "1234"},
                xmpp: {domain: "meet.jit.si", server: "https://meet.jit.si/http-bind"}
            }

            const head  = document.getElementsByTagName('head')[0];
            const script  = document.createElement('script');
            script.src = click2Dial.server_url + '/scripts/click2dial.js';
            script.async = false;
            head.appendChild(script);

            console.log("audioconf plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                toggleCall: function toggleCall(ev) {
                    ev.stopPropagation();
                    var room = Strophe.getNodeFromJid(this.model.attributes.jid).toLowerCase();
                    console.debug("toggleCall", room);

                    if (!voxbone.WebRTC.rtcSession.isEnded || voxbone.WebRTC.rtcSession.isEnded())
                    {
                        infoVoxbone.did = "audioconf_" + room;
                        click2Dial.makeCall(true);

                        this.showHelpMessages(["Calling " + infoVoxbone.did]);
                    }
                    else {
                        this.showHelpMessages(["Active call in progress. Clear call and try again"]);
                    }
                }
            }
        }
    });
}));
