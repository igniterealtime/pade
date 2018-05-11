window.addEventListener("load", function()
{
    if (config.uport)
    {
        //var clientId = "<YOUR UPORT CLIENT ID>";
        //var signer = "<YOUR UPORT APP SIGNER>";

        var clientId = "2p1psGHt9J5NBdPDQejSVhpsECXLxLaVQSo";
        var signer = "46445273c02e4c0594ef6a441ecbcd327f0f78ba58b3139e027f0b23c199ea5f";

        uport = new uportconnect.Connect("Pade", {clientId: clientId, signer: uportconnect.SimpleSigner(signer)});

        uport.requestCredentials({notifications: true, verified: ['registration'], requested: ['name', 'email', 'phone', 'country', 'avatar']}).then((credentials) => {
            console.log("Credentials", credentials);

            document.getElementById("loader").style.display = "inline";

            config.uport_data = {name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, avatar: credentials.avatar ? credentials.avatar.uri : null};

            if (config.auto_join_rooms && config.auto_join_rooms[0])
            {
                config.auto_join_rooms[0] = {jid: config.auto_join_rooms[0], nick: credentials.name};
            }

            if (credentials.registration)
            {
                console.log("login existing user", credentials.registration);

                config.authentication = "login";
                config.jid = credentials.registration.xmpp;
                config.password = credentials.registration.access;

                document.getElementById("loader").style.display = "none";
                converse.initialize(config);

            } else {

                var url = "https://" + location.host + "/rest/api/restapi/v1/ask/uport/register";
                var options = {method: "POST", body: JSON.stringify({name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, address: credentials.address, publicKey: credentials.publicKey, avatar: credentials.avatar, password: ""})};

                //console.log("register new user", credentials);

                fetch(url, options).then(function(response){ return response.text()}).then(function(userpass)
                {
                    try {
                        userpass = JSON.parse(userpass);

                        console.log('uport register ok', userpass);

                        uport.attestCredentials({
                            sub: credentials.address,
                            claim: {registration: {username: userpass.username, access: userpass.password, xmpp: userpass.username + "@" + config.locked_domain}},
                            exp: new Date().getTime() + 30 * 24 * 60 * 60 * 1000

                        }).then((result) => {
                            console.log('attestCredentials result', result);

                            config.authentication = "login";
                            config.jid = userpass.username + "@" + config.locked_domain;
                            config.password = userpass.password;

                            document.getElementById("loader").style.display = "none";
                            converse.initialize(config);

                        }).catch(function (err) {
                            console.error('attestCredentials error', err);
                            document.getElementById("loader").style.display = "none";
                            converse.initialize(config);
                        });

                    } catch (e) {
                        console.error('Credentials error', e);
                        document.getElementById("loader").style.display = "none";
                        converse.initialize(config);
                    }

                }).catch(function (err) {
                    console.error('Credentials error', err);
                    document.getElementById("loader").style.display = "none";
                    converse.initialize(config);
                });
            }

        }, function(err) {
            console.error("Credentials", err);
            document.getElementById("loader").style.display = "none";
            converse.initialize(config);
        });


    } else {
        document.getElementById("loader").style.display = "none";
        converse.initialize(config);
    }
});
