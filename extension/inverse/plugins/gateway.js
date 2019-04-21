(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var Strophe = converse.env.Strophe;

    converse.plugins.add("gateway", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            console.log("gateway plugin is ready");
        },

        'overrides': {
            onConnected: function () {
                var _converse = this;

                _converse.connection.injectedMessage = function(element)
                {
                    console.debug("gateway injected stanza handler", element);

                    // echo test
                    // const elem = new DOMParser().parseFromString("<iq type='set'><query xmlns='jabber:iq:roster'><item jid='newsfeed@pade.desktop-545pc5b' subscription='both'  name='News Feed'><group>Bots</group></item></query></iq>", "text/xml").documentElement;
                    // _converse.connection.sendIQ(elem, callback, errorback);
/*
                    if (typeof element.getAttribute === "function")
                    {
                        const from = element.getAttribute("from");
                        const to = element.getAttribute("to");
                        const body = element.querySelector('body') ? element.querySelector('body').innerHTML : "";

                        _converse.connection.injectMessage('<message type="chat" to="' + from + '" from="' + to + '"><body>' + body + '</body></message>');
                    }
*/
                }

                _converse.__super__.onConnected.apply(this, arguments);
            },

            ChatBoxView: {

                parseMessageForCommands: function(text) {
                    console.debug('gateway - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();

                    if (command === "???")
                    {
                        return true;
                    }
                    else

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                }
            }
        }
    });
}));
