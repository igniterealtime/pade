// -------------------------------------------------------
//
//  General services worker listeners
//
// -------------------------------------------------------

self.addEventListener('install', function(event) {
    console.debug('install', event);
	
	if (location.protocol != "chrome-extension:")
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
self.addEventListener('activate', function (event) {
    console.debug('activate', event);
	openPadeConverseWindow();	
});

self.addEventListener('fetch', function(event) {
  if (location.protocol != "chrome-extension:" && event.request.method == "GET") event.respondWith(
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

self.addEventListener('message', function (event) {
	console.debug('message', event.data);
})

self.addEventListener('push', function (event) {
   const data = event.data.json();
   console.debug('push', data);
   
   const options = {
        body: data.msgBody,
        icon: data.avatar || './icon.png',
        requireInteraction: true,
        persistent: true,
        sticky: true,
        vibrate: [100, 50, 100],
        data: data,
        actions: [
          {action: 'reply', type: 'text', title: 'Reply', icon: './check-solid.png', placeholder: 'Type a reply here..'},
          {action: 'ignore', type: 'button', title: 'Ignore', icon: './times-solid.png'},
        ]
    };
	
    event.waitUntil(
        self.registration.showNotification(data.fullname, options)
    );
});

self.addEventListener("pushsubscriptionchange", function(e) {
    console.debug('pushsubscriptionchange', e);
});

self.addEventListener('notificationclose', function(event) {
    console.debug('notificationclose', event.notification);
});

self.addEventListener('notificationclick', function(event) {
    console.debug('notificationclick', event);

    if (event.action === 'reject') {
        event.notification.close();

	} else if (event.action === 'join') {
		
		const actionChannel = new BroadcastChannel("pade.notification.action");	
		actionChannel.postMessage(event.notification.data);	
		
		chrome.storage.local.get('converseWin', (data) => 
		{	
			if (data.converseWin) {
				chrome.windows.getAll((windows) => {
					let window = null;

					for (let win of windows) {
						if (data.converseWin == win.id) window = win;
					}
					
					if (window) {
						chrome.windows.update(window.id, {focused: true});			
					}					
				});	
			}
		});		
		
	} else if (event.action === 'reply') {

		if (event.reply && event.reply != "") {
			const payload = {
				msgFrom: event.notification.data.msgFrom,
				msgType: event.notification.data.msgType,
				msgBody: event.notification.data.msgBody,
				reply: 	event.reply			
			};
			console.debug('notificationclick - reply', payload, event.reply);
			
			const postUrl = event.notification.data.url + "/rest/api/restapi/v1/meet/message";
			var options = {method: "POST", body: JSON.stringify(payload), headers: {"Authorization": event.notification.data.token, "Accept":"application/json", "Content-Type":"application/json"}};

			return fetch(postUrl, options).then(function(response) {
				console.debug("notificationclick - reply response", response);

			}).catch(function (err) {
				console.error('notificationclick - reply  error!', err);
			});			
	
		} else {
			if (location.protocol == "chrome-extension:") {
				const data = {url: chrome.runtime.getURL("./index.html"), type: "popup"};
				
				chrome.windows.create(data, (win) => {
					chrome.windows.update(win.id, {width: 1500, height: 900});
				});	
			} else {
				event.waitUntil(
					clients.openWindow("./index.html")
				);	
			}
		}
	    
		event.notification.close();	
    } 
});

// -------------------------------------------------------
//
//  Chrome extension listeners
//
// -------------------------------------------------------

if (location.protocol == "chrome-extension:") {
	chrome.runtime.onInstalled.addListener((details) => {
		console.debug("onInstalled");
		
		if (details.reason == "install")
		{
			console.debug("This is a first install!");

		} else if (details.reason == "update"){
			const thisVersion = chrome.runtime.getManifest().version;

			if (thisVersion != details.previousVersion)
			{
				console.debug("Updated from " + details.previousVersion + " to " + thisVersion + "!");			
				doExtensionPage("changelog.html");
			}
		}
	});

	chrome.runtime.onStartup.addListener(() => {
		console.debug("onStartup");	
		openPadeConverseWindow();		
	});

	chrome.action.onClicked.addListener(() => {
		console.debug("action onClicked");	
		openPadeConverseWindow();
	});

	chrome.commands.onCommand.addListener((command) => {
		console.debug('Command:', command);
		
		if (command == "activate_pade") {
			openPadeConverseWindow();
		}
	});	

	chrome.windows.onFocusChanged.addListener((win) => {
		//console.debug("onFocusChanged", win);	
	});	

	chrome.windows.onCreated.addListener((win) => {
		//console.debug("onCreated");		
	});	

	chrome.windows.onRemoved.addListener((win) => {
		//console.debug("onRemoved", win);	
		chrome.storage.local.get('converseWin', (data) => {	
			if (data.converseWin && data.converseWin == win) {	
				chrome.storage.local.remove('converseWin');	
			}
		});	
	});
}

// -------------------------------------------------------
//
//  Functions
//
// -------------------------------------------------------

const doExtensionPage = (url) => {
	chrome.tabs.query({}, (tabs) =>
	{
		const setupUrl = chrome.runtime.getURL(url);

		if (tabs) {
			const option_tab = tabs.filter(function(t) { return t.url === setupUrl; });

			if (option_tab.length) {
				chrome.tabs.update(option_tab[0].id, {highlighted: true, active: true});
			} else {
				chrome.tabs.create({url: setupUrl, active: true});
			}
		}
	});
}

const createPadeConverseWindow = () => {
	console.debug("createPadeConverseWindow");		
	const data = {url: chrome.runtime.getURL("index.html"), type: "popup"};
	
	chrome.windows.create(data, (win) => {
		chrome.storage.local.set({converseWin: win.id});			
		chrome.windows.update(win.id, {width: 1500, height: 900});
	});	
}
	
const openPadeConverseWindow = () => {	
	chrome.storage.local.get('converseWin', (data) => 
	{	
		if (data.converseWin) {
			chrome.windows.getAll((windows) => {
				let window = null;

				for (let win of windows) {
					if (data.converseWin == win.id) window = win;
				}
				
				if (window) {
					chrome.windows.update(window.id, {focused: true});			
				} else {
					createPadeConverseWindow();
				}					
			});	
		} else {
			createPadeConverseWindow();
		}
	});		
}
