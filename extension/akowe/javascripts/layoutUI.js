/*global window, document, widgets, console, kotypeGlobals*/
window.addEventListener("load", function () {
    "use strict";
    var userMenu = new widgets.UserMenu(document.getElementById('userMenu'), kotypeGlobals.user, kotypeGlobals.urlPathPrefix + "/login", kotypeGlobals.urlPathPrefix + "/logout");
    if (!userMenu) {
        console.debug("no usermenu");
    }
});
