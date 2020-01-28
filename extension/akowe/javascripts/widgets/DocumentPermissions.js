goog.provide("widgets.DocumentPermissions");

goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Css3ButtonRenderer');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.Dialog');

widgets.DocumentPermissions = function (parentElement, user, socket) {
    var menu,
        dialog,
        button,
        checkbox;

    function applyPermissionsChange() {
        socket.emit("access_change", {
            access: checkbox.getChecked() ? "public" : "private"
        });
    }

    function renderPermissionsChange(response) {
        checkbox.setChecked(response.access === "public");
    }

    function init() {
        // Dialog
        dialog = new goog.ui.Dialog(null, true);
        dialog.setTitle("Document access");
        dialog.setContent(
            "<div class='checkbox'>" +
                "<span id='publicCheckbox'></span>" +
                "Allow users that are not logged-in to edit this document" +
            "</div>" +
            "<h2>Copy this URL to invite others:</h2>" +
            "<textarea readonly class='input url-box'>" +
                kotypeGlobals.documentURL +
            "</textarea>"
        );
        dialog.setButtonSet(goog.ui.Dialog.ButtonSet.OK);
        dialog.setVisible(true);
        dialog.setVisible(false);
        // Check Box
        checkbox = new goog.ui.Checkbox();
        checkbox.decorate(goog.dom.getElement("publicCheckbox"));
        checkbox.setLabel(checkbox.getElement().parentNode);

        // Menu button
        button = new goog.ui.CustomButton("Share", new goog.ui.Css3ButtonRenderer());
        button.render(parentElement);
        button.getElement().classList.add('button');
        button.getElement().classList.add('blue');
        button.getElement().classList.add('share-button');

        goog.events.listen(checkbox, goog.ui.Component.EventType.CHANGE, applyPermissionsChange);
        goog.events.listen(button, goog.ui.Component.EventType.ACTION, function (e) {
            dialog.setVisible(true);
        });

        button.setVisible(true);

        socket.on("access_changed", renderPermissionsChange);
        socket.emit("access_get", {}, renderPermissionsChange);

        if (user.identity === "guest") {
            button.setVisible(false);
        } else {
            socket.on("disconnect", function () {
                button.setVisible(false);
            });
            socket.on("connect", function () {
                button.setVisible(true);
            });
        }
    }

    init();
};

goog.exportSymbol("widgets.DocumentPermissions", widgets.DocumentPermissions);
