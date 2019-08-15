var bgWin = chrome.extension.getBackgroundPage();
var newRoot = bgWin.__converse.div;
var cloneRoot = newRoot.cloneNode(true);

window.addEventListener("unload", function()
{
    bgWin.document.replaceChild(newRoot, cloneRoot);
});

window.addEventListener("load", function()
{
    var oldRoot = document.documentElement;
    document.replaceChild(newRoot, oldRoot);
    bgWin.document.appendChild(cloneRoot);

    var head  = document.getElementsByTagName('head')[0];
    var link  = document.createElement('script');
    link.src = "scripts/converse.js";
    link.async = false;
    head.appendChild(link);
});
