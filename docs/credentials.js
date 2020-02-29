function getCredentials(callback)
{
    if (navigator.credentials)
    {
        navigator.credentials.get({password: true, federated: {providers: [ 'https://accounts.google.com' ]}, mediation: "silent"}).then(function(credential)
        {
            console.log("credential management api get", credential);
            if (callback) callback(credential);

        }).catch(function(err){
            console.error ("credential management api get error", err);
            if (callback) callback();
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