// install trigger for sw - cache index.html

self.addEventListener('install', function(event) {
  var indexPage = new Request('index.html');
  event.waitUntil(
    fetch(indexPage).then(function(response) {
      return caches.open('offline').then(function(cache) {
        return cache.put(indexPage, response);
      });
  }));
});

// activate trigger

self.addEventListener('activate', function (event) {
    console.debug('Activated', event);
});


// fetch trigger - serve from cache or fetch from server, cache the file if not previously cached

self.addEventListener('fetch', function(event) {
  if (event.request.method == "GET") event.respondWith(
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

   data.url = location.href.substring(0, pos);

   console.debug('Push message', data);

   const options = {
        body: data.msgBody,
        icon: 'images/converse.png',
        vibrate: [100, 50, 100],
        data: data,
        actions: [
          {action: 'read', title: 'Read', icon: 'images/check-solid.png'},
          {action: 'ignore', title: 'Ignore', icon: 'images/times-solid.png'},
        ]
    };
    event.waitUntil(
        self.registration.showNotification("Pade - Converse", options)
    );
});

self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker]: \'pushsubscriptionchange\' event fired.');
});

self.addEventListener("pushsubscriptionchange", event => {
    localStorage.removeItem("pade.vapid.keys"); // force new subscription on next login
    client.postMessage(event.oldSubscription);  // send re-subscribe to web app if running
});

self.addEventListener('notificationclose', function(e) {
    console.debug('Closed notification', e.notification);
});

self.addEventListener('notificationclick', function(event) {
    console.debug('notificationclick', event);

    event.notification.close();

    if (event.action === 'read')
    {
        event.waitUntil(clients.matchAll({type: "window"}).then(function(clientList)
        {
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
                return clients.openWindow(event.notification.data.url + '#converse/' + event.notification.data.msgType + '?jid=' + event.notification.data.msgFrom);
            }
        }));
    }
}, false);