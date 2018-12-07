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

                        addToolbarItem(view, id, "pade-options-" + id, '<a class="fas fa-cog" title="Options and Features"></a>');

                        setTimeout(function()
                        {
                            var options = document.getElementById("pade-options-" + id);

                            if (options) options.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();
                                var url = chrome.extension.getURL("options/index.html");
                                bgWindow.openWebAppsWindow(url, null, 1200, 900);

                            }, false);
                        });
                    }

                    return result;
                }
            }
        }
    });

    function newElement(el, id, html)
    {
        var ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        document.body.appendChild(ele);
        return ele;
    }

    var addToolbarItem = function(view, id, label, html)
    {
        var placeHolder = view.el.querySelector('#place-holder');

        if (!placeHolder)
        {
            var smiley = view.el.querySelector('.toggle-smiley.dropup');
            smiley.insertAdjacentElement('afterEnd', newElement('li', 'place-holder'));
            placeHolder = view.el.querySelector('#place-holder');
        }
        placeHolder.insertAdjacentElement('afterEnd', newElement('li', label, html));
    }
}));
