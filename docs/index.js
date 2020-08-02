window.addEventListener("load", function()
{
    Notification.requestPermission().then(function(result)
    {
      console.log("Notification.requestPermission", result);
    });

    document.getElementById("inverse").src="inverse/index.html" + location.hash;
    document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " | " + chrome.runtime.getManifest().version;
});

