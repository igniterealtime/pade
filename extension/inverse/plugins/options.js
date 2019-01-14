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

                parseMessageForCommands: function(text) {
                    console.debug('options - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();

                    if (command == "pref" && bgWindow) return dOptions();
                    else

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                },

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
                                dOptions();

                            }, false);
                        });
                    }

                    return result;
                }
            }
        }
    });

    var dOptions = function()
    {
        var url = chrome.extension.getURL("options/index.html");
        bgWindow.openWebAppsWindow(url, null, 1200, 900);

        return true;
    }

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
