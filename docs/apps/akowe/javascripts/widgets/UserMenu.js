/*global goog, widgets, window*/
goog.provide("widgets.UserMenu");

goog.require("goog.ui.Menu");
goog.require("goog.ui.MenuButton");
goog.require('goog.ui.Css3MenuButtonRenderer');

widgets.UserMenu = function (parentElement, user, loginUrlPath, logoutUrlPath) {
    "use strict";
    var menu,
        button,
        image;

    function init() {
        var item;

        menu = new goog.ui.Menu();
        menu.setId("UserMenu");

        if (user) {
            /* Disabled for now, until dialog implemented
            item = new goog.ui.MenuItem("Account");
            item.setId("account");
            menu.addItem(item);


            item = new goog.ui.MenuItem("Sign out");
            item.setId("logout");
            menu.addItem(item);
            */
            image = goog.dom.createDom("img", {
                class: "avatar-image",
                src: user.avatar_url,
                style: "border-color: " + user.color + ";"
            });

        } else {
            item = new goog.ui.MenuItem("Sign in");
            item.setId("login");
            menu.addItem(item);

            item = new goog.ui.MenuItem("Sign up");
            item.setId("signup");
            menu.addItem(item);
        }

        goog.events.listen(menu, goog.ui.Component.EventType.ACTION, function (e) {
            var actionType = e.target.getId();

            if (actionType === "logout") {
                window.location.href = logoutUrlPath;
            } else if (actionType === "login" || actionType === "signup") {
                window.location.href = loginUrlPath;
            }
        });

        button = new goog.ui.MenuButton(user ? user.name : "Account", menu, new goog.ui.Css3MenuButtonRenderer());
        button.render(parentElement);
        button.getElement().classList.add('user-menu');

        if (image) {
            button.getElement().appendChild(image);
        }
    }

    init();
};

goog.exportSymbol("widgets.UserMenu", widgets.UserMenu);
