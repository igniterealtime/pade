var uport = null;
var status = null;
var domain = null;
var background = null;
var identity = {}

function updateIdentity()
{
    console.log("updateIdentity", identity);

    uport.attestCredentials({
      sub: identity.address,
      claim: {registration: {username: identity.username, access: identity.password, xmpp: identity.xmpp, sip: identity.xmpp}},
      //exp: new Date().getTime() + 30 * 24 * 60 * 60 * 1000

    }).then((result) => {
        console.log('attestCredentials result', result);
        background.reloadApp();

    }).catch(function (err) {
        console.error('attestCredentials error', err);
        status.innerHTML = err;
    });
}

window.addEventListener("load", function()
{
    document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " uPort Identity";

    background = chrome.extension.getBackgroundPage();
    status = document.getElementById("status");

    if (window.localStorage["store.settings.server"])
    {
        var password = background.getSetting("password", null);
        var server = background.getSetting("server", null);
        domain = background.getSetting("domain", server);

        uport = new window.uportconnect.Connect(i18n.get("manifest_shortExtensionName"), {network: i18n.get("uport_ethereum_network"), clientId: i18n.get("uport_client_id"), signer: uportconnect.SimpleSigner(i18n.get("uport_signer"))});

        uport.requestCredentials({notifications: true, verified: ['registration'], requested: ['name', 'email', 'phone', 'country', 'avatar']}).then((credentials) => {
            console.log("Credentials", credentials);

            window.localStorage["store.settings.publicKey"] =   JSON.stringify(credentials.publicKey);
            window.localStorage["store.settings.address"] =     JSON.stringify(credentials.address);
            window.localStorage["store.settings.email"] =       JSON.stringify(credentials.email);
            window.localStorage["store.settings.phone"] =       JSON.stringify(credentials.phone);
            window.localStorage["store.settings.country"] =     JSON.stringify(credentials.country);
            window.localStorage["store.settings.displayname"] = JSON.stringify(credentials.name);

            if (credentials.avatar && credentials.avatar.uri)
            {
                window.localStorage["store.settings.avatar"] = JSON.stringify(credentials.avatar.uri);
            }

            if (credentials.registration)
            {
                // login existing user

                window.localStorage["store.settings.username"] = JSON.stringify(credentials.registration.username);
                window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(credentials.registration.access));

                setTimeout(function(){background.reloadApp();}, 500);

            } else {

                // register new user

                status.innerHTML = "Please wait, registering..";

                var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/register";
                var options = {method: "POST", body: JSON.stringify({name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, address: credentials.address, publicKey: credentials.publicKey, avatar: credentials.avatar, password: password})};

                console.log("uport rest", url, options);

                fetch(url, options).then(function(response){ return response.text()}).then(function(userpass)
                {
                    try {
                        userpass = JSON.parse(userpass);

                        console.log('uport register ok', userpass);

                        status.innerHTML = "";

                        identity.username = userpass.username;
                        identity.password = userpass.password;
                        identity.address = credentials.address;
                        identity.sip = userpass.username + "@" + domain;
                        identity.xmpp = userpass.username + "@" + domain;

                        window.localStorage["store.settings.username"] = JSON.stringify(userpass.username);
                        window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(userpass.password));

                        updateIdentity();

                    } catch (e) {
                        console.error('Credentials error', e);
                        status.innerHTML = "uport registration failed";
                    }

                }).catch(function (err) {
                    console.error('Credentials error', err);
                    status.innerHTML = err;
                });
            }

        }, function(err) {
            console.error("Credentials", err);
            status.innerHTML = err;
        });

    } else {
       status.innerHTML = i18n.get("Please provide server and domain");
    }
});