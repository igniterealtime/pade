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
                display_button: "false",
                div_css_class_name: "btn-style-round-a",
                incompatible_browser_configuration: "hide_widget",
                rating: "false",
                server_url: "plugins/audioconf",
                show_branding: "false",
                did: "default",

                dial_pad: getSetting("audioConfDialpad", false) ? "true" : "false",
                placement: getSetting("audioConfPlacement", "bottom-right"),
                ringback: getSetting("audioConfRingback", true) ? "true" : "false",
                sip: {domain: getSetting("audioConfDomain"), server: getSetting("audioConfServer"), register: getSetting("audioConfRegister", false), caller_uri: getSetting("audioConfUri"), authorization_user: getSetting("audioConfUsername"), password: getSetting("audioConfPassword")}
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
