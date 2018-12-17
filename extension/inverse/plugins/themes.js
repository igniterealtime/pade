
var theme = "plainsimple";

if (localStorage["store.settings.converseTheme"])
{
    theme = JSON.parse(localStorage["store.settings.converseTheme"]);
}

if (!document.getElementById(theme + '-css'))
{
    var head  = document.getElementsByTagName('head')[0];
    var link  = document.createElement('link');
    link.id   = theme + '-css';
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = 'plugins/css/' + theme + '.css';
    link.media = 'all';
    head.appendChild(link);
}