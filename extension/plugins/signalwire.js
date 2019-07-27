(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    const Strophe = converse.env.Strophe;
    const $iq = converse.env.$iq;

    let client = null;
    let refreshToken = null;
    let currentCall = null;

    let space = null;
    let id = null;
    let key = null;
    let url = null

    converse.plugins.add("signalwire", {
        dependencies: [],

        initialize: function ()
        {
            space = getSetting("signalWireSpace");
            id = getSetting("signalWireId");
            key = getSetting("signalWireKey");
            url = "https://" + space + ".signalwire.com/api/relay/rest/jwt";

            console.debug("SignalWire JWT Token", space, id, key, url);

            fetch(url, {headers: {"authorization": "Basic " + btoa(id + ":" + key), 'Content-Type': 'application/json'},  method: 'POST'}).then(resp => {if (!resp.ok) throw Error(resp.statusText); return resp.json()}).then(function(token)
            {
                refreshToken = token;

                client = new Relay({project: id, token: token.jwt_token});
                client.on('signalwire.ready', handleReady);
                client.on('signalwire.error', handleError);
                client.on('signalwire.socket.close', handleClose);
                client.on('signalwire.socket.message', handleMessage);
                client.on('signalwire.notification', handleNotification);
                client.connect();

                console.log("signalwire plugin is ready", token, client);

            }).catch(function (err) {
                console.error("SignalWire JWT Token failed", err);
            });
        }
    });

    function handleReady()
    {
        console.debug("handleReady", Relay, client);
        //client.calling.onInbound("pade", handleCallUpdate);
    }

    function handleError(error)
    {
        console.debug("handleError", error);
    }

    function handleClose()
    {
        console.debug("handleClose");
    }

    function handleMessage(message)
    {
        console.debug("handleMessage", message);
    }

    function handleNotification(notification)
    {
        console.debug("handleNotification", notification);

        switch (notification.type)
        {
            case 'refreshToken':

                fetch(url, {headers: {"authorization": "Basic " + btoa(id + ":" + key), 'Content-Type': 'application/json'},  method: 'POST', body: JSON.stringify(refreshToken)}).then(resp => {if (!resp.ok) throw Error(resp.statusText); return resp.json()}).then(function(token)
                {
                    refreshToken = token;
                    console.debug("refreshToken token refreshed ok", token);

                }).catch(function (err) {
                    console.error("refreshToken", err);
                });
              break;

            case 'callUpdate':
                handleCallUpdate(notification.call);
                break;
            case 'userMediaError':
                console.error("userMediaError", "Permission denied or invalid audio/video params on getUserMedia");
                break;
        }
    }

    function handleCallUpdate(call)
    {
        console.debug("handleCallUpdate", call);

        currentCall = call;

        switch (call.state) {
        case 'new': // Setup the UI
          break;

        case 'trying': // You are trying to call someone and he's ringing now
          break;

        case 'ringing': // Someone is calling you
          break;

        case 'active': // Call has become active
          break;

        case 'hangup': // Call is over
          break;

        case 'destroy': // Call has been destroyed
          currentCall = null;
          break;
        }
    }

}));