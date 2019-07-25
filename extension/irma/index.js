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

        var sprequest = {
            "data": "foobar",
            "validity": 60,
            "request": {
                "content": [
                    {
                        "label": "username",
                        "attributes": ["pbdf.pbdf.mijnirma.email"]
                    },
                    {
                        "label": "email",
                        "attributes": ["pbdf.pbdf.email.email"]
                    },
                    {
                        "label": "phone number",
                        "attributes": ["pbdf.pbdf.mobilenumber.mobilenumber"]
                    }
                ]
            }
        };


        var success_fun = function(data) {
            document.getElementById("loader").style.display = "inline";

            var json = jwt_decode(data);
            console.log("Authentication successful token:", data, json);

            const did = json.attributes["pbdf.pbdf.mijnirma.email"];
            const email = json.attributes["pbdf.pbdf.email.email"];
            const name = email.split("@")[0];
            const phone = json.attributes["pbdf.pbdf.mobilenumber.mobilenumber"];
            const country = "Unknown";

            window.localStorage["store.settings.email"] =       JSON.stringify(email);
            window.localStorage["store.settings.phone"] =       JSON.stringify(phone);
            window.localStorage["store.settings.country"] =     JSON.stringify(country);
            window.localStorage["store.settings.displayname"] = JSON.stringify(name);

            document.getElementById("irma_status").innerHTML = "Please wait, registering..";

            var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/register";
            var options = {method: "POST", headers: {"authorization": permission}, body: JSON.stringify({name: name, email: email, phone: phone, country: country, address: did, publicKey: json.exp, password: password, account: {}})};

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
        }
        var cancel_fun = function() {
            console.error("IRMA Authentication cancelled!");
            document.getElementById("loader").style.display = "none";
            document.getElementById("irma_status").innerHTML = "IRMA user cancelled";
        }
        var error_fun = function() {
            console.log("Authentication failed!");
            document.getElementById("loader").style.display = "none";
            document.getElementById("irma_status").innerHTML = "IRMA authentication failed";
        }

        IRMA.init("https://demo.irmacard.org/tomcat/irma_api_server/api/v2/");
        IRMA.verify(IRMA.createUnsignedVerificationJWT(sprequest), success_fun, cancel_fun, error_fun);

    } else {
       document.getElementById("loader").style.display = "none";
       document.getElementById("irma_status").innerHTML = i18n.get("Please provide server and domain");
    }
});

