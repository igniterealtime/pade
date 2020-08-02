function getCredentials(username, password, callback)
{
    if (navigator.credentials)
    {
        navigator.credentials.get({password: true, federated: {providers: [ 'https://accounts.google.com' ]}}).then(function(credential)
        {
            console.log("credential management api get", credential);
            const creds = {err: !credential, id: username, password: password, anonymous: !password};

            if (credential)
            {
                creds.id = credential.id.split("@")[0];
                creds.password = credential.password;
            }

            if (callback) callback(creds);

        }).catch(function(err){
            console.error ("credential management api get error", err);
            if (callback) callback({err: err, id: username, password: password, anonymous: !password});
        });
    }
    else {
        if (callback) callback();
    }
}

function setCredentials(creds)
{
    if (navigator.credentials)
    {
        navigator.credentials.create({password: creds}).then(function(credential)
        {
            navigator.credentials.store(credential).then(function()
            {
                console.log("credential management api put", credential);

            }).catch(function (err) {
                console.error("credential management api put error", err);
            });

        }).catch(function (err) {
            console.error("credential management api put error", err);
        });
    }
}