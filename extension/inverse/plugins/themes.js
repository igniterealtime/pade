
var __theme = "concord";

if (localStorage["store.settings.converseTheme"])
{
    __theme = JSON.parse(localStorage["store.settings.converseTheme"]);
}

if (!document.getElementById(__theme + '-css'))
{
    var head  = document.getElementsByTagName('head')[0];
    var link  = document.createElement('link');
    link.id   = __theme + '-css';
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = 'plugins/css/' + __theme + '.css';
    link.media = 'all';
    head.appendChild(link);
}

window.addEventListener("load", function()
{
    document.getElementById("conversejs").classList.add("theme-" + __theme);
});