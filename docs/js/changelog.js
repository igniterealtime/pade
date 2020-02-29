window.addEventListener("load", function()
{
    var title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Changelog";

    document.title = title;
    document.getElementById("changelog").innerHTML = title;
});
