// install trigger for sw - cache index.html

self.addEventListener('install', function(event) {
  if (location.protocol.indexOf("http") > -1)
  {
      var indexPage = new Request('index.html');
      event.waitUntil(
        fetch(indexPage).then(function(response) {
          return caches.open('offline').then(function(cache) {
            return cache.put(indexPage, response);
          });
      }));
  }
});

// activate trigger

self.addEventListener('activate', function (event) {
    console.log('Activated', event);
});


// fetch trigger - serve from cache or fetch from server, cache the file if not previously cached

self.addEventListener('fetch', function(event) {
  if (location.protocol.indexOf("http") > -1 && event.request.method == "GET") event.respondWith(
    fetch(event.request).then(function(response) {
      return caches.open('offline').then(function(cache) {
          try {
            cache.put(event.request, response.clone());
        } catch (e) {};
        return response;
      });
    }).catch(function (error) {
      caches.match(event.request).then(function(resp) {
        return resp;
      });
    })
  );
});

// push trigger

self.addEventListener('push', function (event) {
   console.debug('push', event);

   const data = event.data.json();
   const pos = location.href.lastIndexOf('/') + 1;

   data.url = location.protocol + "//" + location.host + "/pade";

   console.debug('Push message', data);

   const options = {
        body: data.msgBody,
        icon: '../icon.png',
        vibrate: [100, 50, 100],
        data: data,
        actions: [
          {action: 'open', title: 'Open', type: 'button', icon: '../images/arrow_right.png'},
          {action: 'reply', title: 'Reply', type: 'text', icon: '../images/arrow_back.png', placeholder: 'Type reply here..'}
        ]
    };
    event.waitUntil(
        self.registration.showNotification("Pade - " + data.msgFrom, options)
    );
});

self.addEventListener("pushsubscriptionchange", function(e) {
    console.debug('pushsubscriptionchange', e);
});

self.addEventListener('notificationclose', function(e) {
    console.debug('Closed notification', e.notification);
});

self.addEventListener('notificationclick', function(event) {
    console.debug('notificationclick', event);

    event.notification.close();

    if (event.action === 'open' || event.reply)
    {
        event.notification.data.reply = event.reply;

        event.waitUntil(clients.matchAll({type: "window"}).then(function(clientList)
        {
            if (location.protocol.indexOf("chrome-extension") > -1)
            {
                const channel = new BroadcastChannel('sw-notification');
                channel.postMessage(event.notification.data);
            }
            else {

                if (event.reply && event.reply != "" && event.notification.data.token)
                {
                    var url =  "https://" + location.host + "/rest/api/restapi/v1/meet/message";
                    var options = {method: "POST", headers: {"authorization": event.notification.data.token, "accept": "application/json"}, body: JSON.stringify(event.notification.data) };

                    fetch(url, options).then(function(response)
                    {
                        console.debug("notificationclick response", response);

                    }).catch(function (err) {
                        console.error("notificationclick error", err);
                    });
                }
                else {
                    const url = event.notification.data.url;

                    for (var i = 0; i < clientList.length; i++) {
                        var client = clientList[i];
                        console.debug("found url", client.url, client);

                        if (client.url == event.notification.data.url && client.visibilityState == "visible") {
                            client.postMessage(event.notification.data);
                            return client.focus();
                        }
                    }
                    if (clients.openWindow) {
                        return clients.openWindow(event.notification.data.url);
                    }
                }
            }
        }));
    }
}, false);