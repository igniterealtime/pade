var editor;
var bgWindow = chrome.extension.getBackgroundPage();

document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Markdown Editor -" + bgWindow.pade.activeView.model.get("jid");

window.addEventListener("load", function()
{
    editor = new Editor();
    editor.render();

/* TODO - not working

    var textArea = $('#editor-textarea');
    textArea.pastableTextarea();

    textArea.on('pasteImage', function(ev, data)
    {
        console.log("pade - pasteImage", data);

    }).on('pasteImageError', function(ev, data){
        console.error('pasteImageError', data);

    }).on('pasteText', function(ev, data){
        console.log("pasteText", data);

    }).on('pasteTextRich', function(ev, data){
        //console.log("pasteTextRich", data);
        textArea.value = clipboard2Markdown.convert(data.text);

    }).on('pasteTextHtml', function(ev, data){
        //console.log("pasteTextHtml", data);
        textArea.value = clipboard2Markdown.convert(data.text);

    }).on('focus', function(){
        console.log("paste - focus");

    }).on('blur', function(){
        console.log("paste - blur");
    });
*/
});




