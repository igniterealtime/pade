var uport = null;
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
        document.getElementById("loader").style.display = "none";
        console.error('attestCredentials error', err);
        document.getElementById("uport_status").innerHTML = "uPort credentials attestation failure";
    });
}

window.addEventListener("load", function()
{
    document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " uPort Identity";

    background = chrome.extension.getBackgroundPage();

    var server = background.getSetting("server", null);
    domain = background.getSetting("domain", server);

    if (server)
    {
        var password = background.getSetting("password", null);
        var permission = i18n.get("uport_permission");
        var avatar = null;

        var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/" + i18n.get("manifest_shortExtensionName").toLowerCase() + "/" + i18n.get("uport_client_id");
        var options = {method: "GET", headers: {"authorization": permission}};

        fetch(url, options).then(function(response){ return response.text()}).then(function(signer)
        {
            console.log("Signer", signer, i18n.get("manifest_shortExtensionName"));

            uport = new window.uportconnect.Connect(i18n.get("manifest_shortExtensionName"), {network: i18n.get("uport_ethereum_network"), clientId: i18n.get("uport_client_id"), signer: uportconnect.SimpleSigner(signer)});

            uport.requestCredentials({notifications: true, verified: ['registration'], requested: ['name', 'email', 'phone', 'country', 'avatar']}).then((credentials) => {
                console.log("Credentials", credentials);

                document.getElementById("loader").style.display = "inline";

                background.pade.uPort = uport;

                window.localStorage["store.settings.publicKey"] =   JSON.stringify(credentials.publicKey);
                window.localStorage["store.settings.address"] =     JSON.stringify(credentials.address);
                window.localStorage["store.settings.email"] =       JSON.stringify(credentials.email);
                window.localStorage["store.settings.phone"] =       JSON.stringify(credentials.phone);
                window.localStorage["store.settings.country"] =     JSON.stringify(credentials.country);
                window.localStorage["store.settings.displayname"] = JSON.stringify(credentials.name);

                if (credentials.avatar && credentials.avatar.uri)
                {
                    avatar = credentials.avatar.uri;
                    window.localStorage["store.settings.avatar"] = JSON.stringify(avatar);
                }

                if (credentials.registration && credentials.registration.xmpp)
                {
                    if (credentials.registration.xmpp.indexOf("@" + domain) > -1)
                    {
                        // login existing user

                        window.localStorage["store.settings.username"] = JSON.stringify(credentials.registration.username);
                        window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(credentials.registration.access));

                        setTimeout(function(){background.reloadApp();}, 500);

                    } else {
                        console.error('Login error', error);
                        document.getElementById("uport_status").innerHTML = "uPort credentials are not for server " + server + ", found " + credentials.registration.xmpp;
                    }

                } else {

                    // register new user

                    document.getElementById("uport_status").innerHTML = "Please wait, registering..";

                    var web3 = uport.getWeb3();
                    var account = null;

                    //var paymentABI = web3.eth.contract([ { "constant": true, "inputs": [ { "name": "externalPaymentId", "type": "uint256" } ], "name": "checkIfPaymentExists", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "externalPaymentId", "type": "uint256" } ], "name": "refund", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [ { "name": "externalPaymentId", "type": "uint256" } ], "name": "getStatus", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "externalPaymentId", "type": "uint256" } ], "name": "complete", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "getBillingAddress", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "externalPaymentId", "type": "uint256" } ], "name": "pay", "outputs": [], "payable": true, "type": "function" }, { "constant": false, "inputs": [ { "name": "externalPaymentId", "type": "uint256" }, { "name": "price", "type": "uint256" } ], "name": "startNewPayment", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [ { "name": "externalPaymentId", "type": "uint256" } ], "name": "getPrice", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "type": "function" }, { "inputs": [ { "name": "_billingAddress", "type": "address" } ], "payable": false, "type": "constructor" }, { "payable": true, "type": "fallback" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "externalPaymentId", "type": "uint256" } ], "name": "PaymentPaid", "type": "event" } ]);
                    //var payment = paymentABI.at('0x9bd0a645da0fb37d1c667c2105bc0256bc191d89');

                    web3.eth.getAccounts((error, result) =>
                    {
                        console.log("account", account, error);

                        if (error) {
                            console.error('Account error', error);
                            document.getElementById("uport_status").innerHTML = "uPort account get failure";

                        } else {
                            account = result[0];
                            console.log('Account:' + account);

                            var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/register";
                            var options = {method: "POST", headers: {"authorization": permission}, body: JSON.stringify({name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, address: credentials.address, publicKey: credentials.publicKey, avatar: credentials.avatar, password: password, account: account})};

                            console.log("uport rest", url, options);

                            fetch(url, options).then(function(response){ return response.text()}).then(function(userpass)
                            {
                                try {
                                    userpass = JSON.parse(userpass);

                                    console.log('uport register ok', userpass);

                                    document.getElementById("uport_status").innerHTML = "";

                                    identity.username = userpass.username;
                                    identity.password = userpass.password;
                                    identity.address = credentials.address;
                                    identity.sip = userpass.username + "@" + domain;
                                    identity.xmpp = userpass.username + "@" + domain;

                                    window.localStorage["store.settings.username"] = JSON.stringify(userpass.username);
                                    window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(userpass.password));

                                    updateIdentity();

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
                        }
                    });
                }

            }, function(err) {
                document.getElementById("loader").style.display = "none";
                console.error("Credentials", err);
                document.getElementById("uport_status").innerHTML = "uPort credentials fetch failure";
            });

        }).catch(function (err) {
            document.getElementById("loader").style.display = "none";
            console.error('uPort permission error', err);
            document.getElementById("uport_status").innerHTML = 'uPort permission failure';
        });

    } else {
       document.getElementById("loader").style.display = "none";
       document.getElementById("uport_status").innerHTML = i18n.get("Please provide server and domain");
    }
});