(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;

    converse.plugins.add("options", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            console.log("options plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                renderToolbar: function renderToolbar(toolbar, options) {
                    var result = this.__super__.renderToolbar.apply(this, arguments);

                    if (bgWindow)
                    {
                        var view = this;
                        var id = this.model.get("box_id");

                        var html = '<li id="pade-options-' + id + '"><a class="fas fa-cog" title="Pade Options and Features"></a></li>';

                        $(this.el).find('.toggle-toolbar-menu .toggle-smiley dropup').after('<li id="place-holder"></li>');
                        $(this.el).find('#place-holder').after(html);

                        setTimeout(function()
                        {
                            var options = document.getElementById("pade-options-" + id);

                            options.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();
                                var url = chrome.extension.getURL("options/index.html");
                                bgWindow.openWebAppsWindow(url, null, 1150, 900);

                            }, false);
                        });
                    }

                    return result;
                }
            }
        }
    });
}));
