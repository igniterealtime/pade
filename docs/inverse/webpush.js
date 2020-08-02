var webpush = (function(push)
{
    var hostname, username, password, publicKey;

    function vapidGetPublicKey(host, user, pass)
    {
        var getUrl = "https://" + host + "/rest/api/restapi/v1/meet/webpush/" + user;
        var options = {method: "GET", headers: {"Authorization": "Basic " + btoa(user + ":" + pass), "Accept":"application/json", "Content-Type":"application/json"}};

        console.debug("vapidGetPublicKey", getUrl, options);

        fetch(getUrl, options).then(function(response) {return response.json()}).then(function(vapid)
        {
            if (vapid.publicKey)
            {
                console.debug("vapidGetPublicKey found", vapid);

                publicKey = vapid.publicKey;
                hostname = host;
                username = user;
                password = pass;

                navigator.serviceWorker.register('./serviceworker.js', {scope: './'}).then(initialiseState, initialiseError);
            } else {
                console.error("no web push, vapid public key not available");
            }

        }).catch(function (err) {
            console.error('vapidGetPublicKey error!', err);
        });
    }

    function initialiseError(error)
    {
        console.error("initialiseError", error);
    }

    function initialiseState(registration)
    {
        if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
            console.warn('Notifications aren\'t supported.');
            return;
        }

        if (Notification.permission === 'denied') {
            console.warn('The user has blocked notifications.');
            return;
        }

        if (!('PushManager' in window)) {
            console.warn('Push messaging isn\'t supported.');
            return;
        }

        console.debug("initialiseState", registration);

        navigator.serviceWorker.ready.then(function (serviceWorkerRegistration)
        {
            console.debug("initialiseState ready", serviceWorkerRegistration);

            serviceWorkerRegistration.pushManager.getSubscription().then(function (subscription)
            {
                console.debug("serviceWorkerRegistration getSubscription", subscription);

                if (!subscription && publicKey) {
                    subscribe();
                    return;
                }

                // Keep your server in sync with the latest subscriptionId
                sendSubscriptionToServer(subscription);
            })
            .catch(function(err) {
                console.warn('Error during getSubscription()', err);
            });
        });
    }

    function subscribe()
    {
        console.debug("subscribe", publicKey);

        navigator.serviceWorker.ready.then(function (serviceWorkerRegistration)
        {
            serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64UrlToUint8Array(publicKey)
            })
            .then(function (subscription) {
                return sendSubscriptionToServer(subscription);
            })
            .catch(function (e) {
                if (Notification.permission === 'denied') {
                    console.warn('Permission for Notifications was denied');
                } else {
                    console.error('Unable to subscribe to push.', e);
                }
            });
        });
    }

    function base64UrlToUint8Array(base64UrlData)
    {
        const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
        const base64 = (base64UrlData + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = atob(base64);
        const buffer = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            buffer[i] = rawData.charCodeAt(i);
        }

        return buffer;
    }

    function sendSubscriptionToServer(subscription)
    {
        console.debug("sendSubscriptionToServer", subscription);

        var key = subscription.getKey ? subscription.getKey('p256dh') : '';
        var auth = subscription.getKey ? subscription.getKey('auth') : '';

        var subscriptionString = JSON.stringify(subscription);  // TODO

        console.debug("web push subscription", {
            endpoint: subscription.endpoint,
            key: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : '',
            auth: auth ? btoa(String.fromCharCode.apply(null, new Uint8Array(auth))) : ''
        }, subscription);

        var resource = chrome.i18n.getMessage('manifest_shortExtensionName').toLowerCase() + "-" + BrowserDetect.browser + BrowserDetect.version + BrowserDetect.OS;
        var putUrl = "https://" + hostname + "/rest/api/restapi/v1/meet/webpush/" + username + "/" + resource;
        var options = {method: "PUT", body: JSON.stringify(subscription), headers: {"Authorization": "Basic " + btoa(username + ":" + password), "Accept":"application/json", "Content-Type":"application/json"}};

        return fetch(putUrl, options).then(function(response) {
            console.debug("subscribe response", response);

        }).catch(function (err) {
            console.error('subscribe error!', err);
        });
    }

    push.registerServiceWorker = function(host, username, password)
    {
        vapidGetPublicKey(host, username, password);
    }

    return push;

}(webpush || {}));