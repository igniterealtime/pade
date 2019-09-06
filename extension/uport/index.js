var uport = null;
var domain = null;
var background = null;

window.addEventListener("load", function()
{
    document.title = chrome.i18n.getMessage('settings') + " uPort Identity";

    background = chrome.extension.getBackgroundPage();

    var server = background.getSetting("server", null);
    domain = background.getSetting("domain", server);

    if (server)
    {
        document.getElementById("loader").style.display = "inline";

        var password = background.getSetting("password", null);
        var permission = i18n.get("uport_permission");
        var avatar = null;

        uport = new window.uportconnect('pade', {network: "mainnet"});
        console.log("requestDisclosure", uport);

        uport.onResponse('disclosureReq').then(res =>
        {
            const did = res.payload.did
            const json = res.payload
            console.log("Credentials", json);

            window.localStorage["store.settings.email"] =       JSON.stringify(json.email);
            window.localStorage["store.settings.phone"] =       JSON.stringify(json.phone);
            window.localStorage["store.settings.country"] =     JSON.stringify(json.country);
            window.localStorage["store.settings.displayname"] = JSON.stringify(json.name);

            if (json.avatar && json.avatar.uri)
            {
                avatar = json.avatar.uri;
                window.localStorage["store.settings.avatar"] = JSON.stringify(avatar);
            }

            document.getElementById("uport_status").innerHTML = "Please wait, registering..";

            var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/register";
            var options = {method: "POST", headers: {"authorization": permission}, body: JSON.stringify({name: json.name, email: json.email, phone: json.phone, country: json.country, address: json.did, publicKey: json.did, avatar: json.avatar, password: password, account: {}})};

            console.log("uport rest", url, options);

            fetch(url, options).then(function(response){ return response.text()}).then(function(userpass)
            {
                try {
                    userpass = JSON.parse(userpass);

                    console.log('uport register ok', userpass);

                    document.getElementById("uport_status").innerHTML = "Please scan the QR Code to store credentials";
                    window.localStorage["store.settings.username"] = JSON.stringify(userpass.username);
                    window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(userpass.password));

                    document.getElementById("loader").style.display = "none";

                    if (!json.registration)
                    {
                        uport.onResponse('verificationReq').then(credential =>
                        {
                            console.log("sendVerification", credential);
                            document.getElementById("uport_status").innerHTML = "";
                            setTimeout(function(){background.reloadApp();}, 20000);
                        });

                        uport.sendVerification({claim: {registration: {username: userpass.username, access: userpass.password, xmpp: userpass.username + "@" +  domain}}}, 'verificationReq');
                    }
                    else {
                        setTimeout(function(){background.reloadApp();}, 1000);
                    }

                } catch (e) {
                    document.getElementById("loader").style.display = "none";
                    console.error('Credentials error', e);
                    document.getElementById("uport_status").innerHTML = "uPort credentials update failure";
                }

            }).catch(function (err) {
                document.getElementById("loader").style.display = "none";
                console.error('Credentials error', err);
                document.getElementById("uport_status").innerHTML = "uPort user registration failure";
            });
        })

        uport.requestDisclosure({verified: ['registration'], requested: ['name', 'email', 'phone', 'country', 'avatar']});

    } else {
       document.getElementById("loader").style.display = "none";
       document.getElementById("uport_status").innerHTML = i18n.get("Please provide server and domain");
    }
});