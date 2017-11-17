window.addEvent("domready", function () {
    
    window.localStorage["store.settings.config"] = null;

    new FancySettings.initWithManifest(function (settings) 
    {
        var background = chrome.extension.getBackgroundPage();        

        settings.manifest.connect.addEvent("action", function () 
        {
            reloadApp()
        });

        function reloadApp(){
            
            openAppWindow()
        }

	function openAppWindow()
	{
		if (window.localStorage["store.settings.server"] && window.localStorage["store.settings.domain"] && window.localStorage["store.settings.username"] && window.localStorage["store.settings.password"])
		{
			var lynks = {};
			
			lynks.server = JSON.parse(window.localStorage["store.settings.server"]);
			lynks.domain = JSON.parse(window.localStorage["store.settings.domain"]);	
			lynks.username = JSON.parse(window.localStorage["store.settings.username"]);	
			lynks.password = JSON.parse(window.localStorage["store.settings.password"]);	

			if (lynks.server && lynks.domain && lynks.username && lynks.password)
			{
				background.reloadApp();
			}
			else {			
				if (!server) settings.manifest.status.element.innerHTML = '<b>bad server</b>';
				if (!domain) settings.manifest.status.element.innerHTML = '<b>bad domain</b>';
				if (!username) settings.manifest.status.element.innerHTML = '<b>bad username</b>';
				if (!password) settings.manifest.status.element.innerHTML = '<b>bad password</b>';								
			}
	     	
	     	} else settings.manifest.status.element.innerHTML = '<b>bad bad server, domain, username or password</b>';
	}
    });
    

});
