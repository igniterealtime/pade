(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var SettingsDialog, settingsDialog = null;
    var _converse = null;

    window.converse_settings = {

      getConfig: function() {
        let config = {};

        for (var i = 0; i < localStorage.length; i++)
        {
            const value = localStorage.getItem(localStorage.key(i));
            let key = null;

            if (localStorage.key(i).startsWith("general.")) key = localStorage.key(i).substring(8);
            if (localStorage.key(i).startsWith("contacts.")) key = localStorage.key(i).substring(9);
            if (localStorage.key(i).startsWith("advanced.")) key = localStorage.key(i).substring(9);
            if (localStorage.key(i).startsWith("group_chat.")) key = localStorage.key(i).substring(11);
            if (localStorage.key(i).startsWith("user_interface.")) key = localStorage.key(i).substring(15);

            if (key) config[key] = JSON.parse(value);
        }

        console.log("getConfig", config);
        return config;
      }
    };

    converse.plugins.add("settings", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            SettingsDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                },
                toHTML() {
                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header">' +
                         '  <h4 class="modal-title">Converse Settings</h4>' +
                         '  <button type="button" class="close" data-dismiss="modal">&times;</button>' +
                         '</div>' +
                         '<div class="modal-body"><iframe frameborder="0" style="border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:600px;" src="settings/index.html"></iframe></div>' +
                         '<div class="modal-footer"> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
                         '</div> </div> </div>';
                }
            });

            _converse.api.listen.on('connected', function()
            {
                setTimeout(function()
                {
                    const section = document.body.querySelector('.controlbox-section.profile.d-flex');

                    if (section)
                    {
                        const prefButton = __newElement('a', null, '<a class="controlbox-heading__btn show-preferences fas fa-cog align-self-center" title="Preferences/Settings"></a>');
                        section.appendChild(prefButton);

                        prefButton.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();

                            if (!settingsDialog)
                            {
                                settingsDialog = new SettingsDialog({'model': new converse.env.Backbone.Model({}) });
                            }
                            settingsDialog.show();
                        }, false);
                    }
                }, 3000);
            });
            console.log("settings plugin is ready");
        }
    });

    function __newElement (el, id, html, className)
    {
        var ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        if (className) ele.classList.add(className);
        document.body.appendChild(ele);
        return ele;
    }
}));
