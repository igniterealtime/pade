var bgWin = chrome.extension.getBackgroundPage();

if (bgWin)
{
    const tasks = bgWin.getTasks();
    sessionStorage.setItem('vuex', tasks);
    console.debug("tasks - initial", tasks);
}
window.addEventListener("unload", function()
{
    console.debug("tasks unload");
    window.localStorage["store.settings." + location.href] = JSON.stringify({top: window.screenTop, left: window.screenLeft, width: window.outerWidth, height: window.outerHeight});
});

window.addEventListener("load", function()
{
    console.debug("tasks load");
    document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Tasks";
});

