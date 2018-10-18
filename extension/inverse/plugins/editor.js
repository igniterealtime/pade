var editor = new Editor();
var bgWindow = chrome.extension.getBackgroundPage();

document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Markdown Editor -" + bgWindow.pade.activeView.model.get("jid");

window.addEventListener("load", function()
{
    editor.render();
});


