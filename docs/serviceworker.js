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
    console.log('Activated', event);
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
    var data = event.data.text();

   console.log('Push message', data);
    data = JSON.parse(data);

    var options = {
        body: data.message,
        icon: 'icon.png',
        vibrate: [100, 50, 100],
        data: data,
        actions: [
          {action: 'read', title: 'Read', icon: 'images/check-solid.png'},
          {action: 'ignore', title: 'Ignore', icon: 'images/times-solid.png'},
        ]
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.action === 'read') {
        event.waitUntil(clients.openWindow(event.notification.data.url, event.notification.data.url));
    }
}, false);