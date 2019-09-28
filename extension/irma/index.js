var domain = null;
var background = null;

window.addEventListener("load", function()
{
    document.title = chrome.i18n.getMessage('settings') + " IRMA Identity";
    background = chrome.extension.getBackgroundPage();
    var server = background.getSetting("server", null);
    domain = background.getSetting("domain", server);

    if (server)
    {
        var password = background.getSetting("password", null);
        var permission = i18n.get("uport_permission");
        var avatar = {};

        const request = {
          '@context': 'https://irma.app/ld/request/disclosure/v2',
          'disclose': [
            [
              ["pbdf.pbdf.mijnirma.email"]
            ],
            [
              ["pbdf.pbdf.email.email"]
            ],
            [
              ["pbdf.pbdf.mobilenumber.mobilenumber"]
            ]
          ]
        };

        const irmaServer = "https://" + server + "/irmaproxy";

        irma.startSession(irmaServer, request).then((pkg) => irma.handleSession(pkg.sessionPtr, {server: irmaServer, token: pkg.token, method: 'popup', language: 'en'})).then(result =>
        {
            console.log('Done', result)

            document.getElementById("loader").style.display = "inline";
            console.log("Authentication successful token:", result);

            const did = result.disclosed[0][0].rawvalue;
            const email = result.disclosed[1][0].rawvalue;;
            const name = email.split("@")[0];
            const phone = result.disclosed[2][0].rawvalue;
            const country = "Unknown";

            window.localStorage["store.settings.email"] =       JSON.stringify(email);
            window.localStorage["store.settings.phone"] =       JSON.stringify(phone);
            window.localStorage["store.settings.country"] =     JSON.stringify(country);
            window.localStorage["store.settings.displayname"] = JSON.stringify(name);

            document.getElementById("irma_status").innerHTML = "Please wait, registering..";

            var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/register";
            var options = {method: "POST", headers: {"authorization": permission}, body: JSON.stringify({name: name, email: email, phone: phone, country: country, address: did, publicKey: did, password: password, account: {}})};

            console.log("irma rest", url, options);

            fetch(url, options).then(function(response){ return response.text()}).then(function(userpass)
            {
                try {
                    userpass = JSON.parse(userpass);

                    console.log('irma register ok', userpass);

                    window.localStorage["store.settings.username"] = JSON.stringify(userpass.username);
                    window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(userpass.password));

                    document.getElementById("loader").style.display = "none";
                    setTimeout(function(){background.reloadApp();}, 1000);

                } catch (e) {
                    document.getElementById("loader").style.display = "none";
                    console.error('Credentials error', e);
                    document.getElementById("irma_status").innerHTML = "IRMA credentials update failure";
                }

            }).catch(function (err) {
                document.getElementById("loader").style.display = "none";
                console.error('Credentials error', err);
                document.getElementById("irma_status").innerHTML = "IRMA user registration failure";
            });

        }).catch(function(err) {
            console.error("Authentication failed!", err);
            document.getElementById("loader").style.display = "none";
            document.getElementById("irma_status").innerHTML = "IRMA authentication failed";
        });

    } else {
       document.getElementById("loader").style.display = "none";
       document.getElementById("irma_status").innerHTML = i18n.get("Please provide server and domain");
    }
});

