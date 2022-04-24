// -------------------------------------------------------
//
//  General services worker listeners
//
// -------------------------------------------------------

self.addEventListener('install', function(event) {
    console.debug('install', event);
});
self.addEventListener('activate', function (event) {
    console.debug('activate', event);
});

self.addEventListener('message', function (event) {
	console.debug('message', event.data);
})

self.addEventListener('notificationclose', function(event) {
    console.debug('notificationclose', event.notification);
});

self.addEventListener('notificationclick', function(event) {
    console.debug('notificationclick', event);

    const source = new BroadcastChannel('pade-action');	
	source.postMessage({action: event.action, id: event.notification.data.id, reply: event.reply});	
}, false);

// -------------------------------------------------------
//
//  Chrome extension listeners
//
// -------------------------------------------------------

if (chrome.runtime) chrome.runtime.onInstalled.addListener((details) => {
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
	openPadeConverseWindow();	
});

if (chrome.runtime) chrome.runtime.onStartup.addListener(() => {
	console.debug("onStartup");	
	openPadeConverseWindow();
});

if (chrome.action) chrome.action.onClicked.addListener(() => {
	console.debug("action onClicked");	
	openPadeConverseWindow();
});

if (chrome.commands) chrome.commands.onCommand.addListener((command) => {
	console.debug('Command:', command);
	
	if (command == "activate_pade") {
		openPadeConverseWindow();
	}
});	

if (chrome.commands) {
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

function openPadeConverseWindow() {	

	chrome.storage.local.get('converseWin', (data) => {	
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

function createPadeConverseWindow() {
	console.debug("createPadeConverseWindow");		
	const data = {url: chrome.runtime.getURL("index.html"), type: "popup"};
	
	chrome.windows.create(data, (win) => {
		chrome.windows.update(win.id, {width: 1300, height: 900});
		chrome.storage.local.set({converseWin: win.id});
	});	
}

function doExtensionPage(url)
{
    if (chrome.tabs) 
	{
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
}
