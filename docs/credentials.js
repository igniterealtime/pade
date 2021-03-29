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

function setCredentials(creds, webAuthn)
{
	setSetting("username", creds.id);
	
    if (navigator.credentials)
    {
		if (webAuthn && !localStorage.getItem("ofmeet.webauthn.username")) 
		{
			registerWebAuthn(creds.id)
		}
		else {
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
}

function registerWebAuthn(username)
{				
	fetch(location.protocol + "//" + location.host + "/rest/api/restapi/v1/meet/webauthn/register/start/" + username, {method: "POST", body: username}).then(function(response){ return response.json()}).then((credentialCreationOptions) => 
	{	
		console.debug("/webauthn/register/start", credentialCreationOptions);
		
		// confirm webauthn register after first step because second step fails with a re-register
		localStorage.setItem("ofmeet.webauthn.username", username);			
	
		if (credentialCreationOptions.excludeCredentials) 
		{
			credentialCreationOptions.excludeCredentials.forEach(function (listItem) 
			{
				listItem.id = bufferDecode(listItem.id)
			});
		}
		
		credentialCreationOptions.challenge = bufferDecode(credentialCreationOptions.challenge);
		credentialCreationOptions.user.id = bufferDecode(credentialCreationOptions.user.id);
		return navigator.credentials.create({publicKey: credentialCreationOptions});
	
	}).then((cred) => {
		console.debug("/webauthn/register/start - cred", cred);	
		const credential = {};
		credential.id =     cred.id;
		credential.rawId =  bufferEncode(cred.rawId);
		credential.type =   cred.type;

		if (cred.response) {
		  const clientDataJSON = bufferEncode(cred.response.clientDataJSON);
		  const attestationObject = bufferEncode(cred.response.attestationObject);
		  credential.response = {clientDataJSON, attestationObject};
		  if (!credential.clientExtensionResults) credential.clientExtensionResults = {};
		}
		
		fetch(location.protocol + "//" + location.host + "/rest/api/restapi/v1/meet/webauthn/register/finish/" + username, {method: "POST", body: JSON.stringify(credential)}).then((success) => 
		{
			console.debug("webauthn/register/finish ok");			
			
		}).catch((error) => {
			console.error("webauthn/register/finish error", error);					
		})
		
	}).catch((error) => {
		console.error("webauthn/register/start error", error);					
	})		
}

function authenticateWebAuth(callback)
{
	if (localStorage.getItem("ofmeet.webauthn.username"))
	{
		const username = localStorage.getItem("ofmeet.webauthn.username");								

		fetch(location.protocol + "//" + location.host + "/rest/api/restapi/v1/meet/webauthn/authenticate/start/" + username, {method: "POST"}).then(function(response){ return response.json()}).then((options) => 
		{	
			console.debug("/webauthn/authenticate/start", options);
					
			options.publicKeyCredentialRequestOptions.allowCredentials.forEach(function (listItem) 
			{
				listItem.id = bufferDecode(listItem.id)
			});
			
			options.publicKeyCredentialRequestOptions.challenge = bufferDecode(options.publicKeyCredentialRequestOptions.challenge);						
			return navigator.credentials.get({publicKey: options.publicKeyCredentialRequestOptions});
		
		}).then((assertion) => {
			console.debug("/webauthn/authenticate/start - assertion", assertion, assertion.id, assertion.type);							
			const credential = {};
			credential.id =     assertion.id;
			credential.type =   assertion.type;
			credential.rawId =  bufferEncode(assertion.rawId);

			if (assertion.response) {
				const clientDataJSON = bufferEncode(assertion.response.clientDataJSON);
				const authenticatorData = bufferEncode(assertion.response.authenticatorData);
				const signature = bufferEncode(assertion.response.signature);
				const userHandle = bufferEncode(assertion.response.userHandle);
				credential.response = {clientDataJSON, authenticatorData,	signature, userHandle};
				if (!credential.clientExtensionResults) credential.clientExtensionResults = {};						  
			}
			
			fetch(location.protocol + "//" + location.host + "/rest/api/restapi/v1/meet/webauthn/authenticate/finish/" + username, {method: "POST", body: JSON.stringify(credential)}).then((success) => 
			{
				console.debug("webauthn/authenticate/finish ok");
				callback(username, credential.id);						
				
			}).catch((error) => {
				console.error("webauthn/authenticate/finish error", error);							
				callback(null, null);
			})
			
		}).catch((error) => {
			console.error("webauthn/authenticate/start error", error);							
			callback(null, null);
		})								
	}			
	else {
		callback(null, null);
	}
	
}
function bufferDecode(e) 
{
	const t = "==".slice(0, (4 - e.length % 4) % 4),
		n = e.replace(/-/g, "+").replace(/_/g, "/") + t,
		r = atob(n),
		o = new ArrayBuffer(r.length),
		c = new Uint8Array(o);
	for (let e = 0; e < r.length; e++) c[e] = r.charCodeAt(e);
	return o
}

function bufferEncode(e) 
{
	const t = new Uint8Array(e);
	let n = "";
	for (const e of t) n += String.fromCharCode(e);
	return btoa(n).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function setSetting(name, value)
{
    window.localStorage["store.settings." + name] = JSON.stringify(value);
}