(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;

    converse.plugins.add("markdown", {
        'dependencies': [],

        'initialize': function () {

            chrome.runtime.onMessage.addListener(function(message)
            {
                if (bgWindow.pade.activeView && message.markdown)
                {
                    console.log("chrome.runtime.onMessage", message);
                    bgWindow.pade.activeView.onMessageSubmitted(message.markdown);
                    bgWindow.closeWebAppsWindow(chrome.extension.getURL("inverse/plugins/editor.html"));
                }
            });

            console.log("markdown plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                renderToolbar: function renderToolbar(toolbar, options) {
                    var result = this.__super__.renderToolbar.apply(this, arguments);

                    if (bgWindow)
                    {
                        var view = this;
                        var id = this.model.get("box_id");

                        addToolbarItem(view, id, "webmeet-markdown-" + id, '<a class="fa" title="Markdown Editor. Click to open"><b style="font-size: large;">M&darr;</b></a>');

                        setTimeout(function()
                        {
                            var markdown = document.getElementById("webmeet-markdown-" + id);

                            markdown.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                bgWindow.pade.activeView = view;
                                var url = chrome.extension.getURL("inverse/plugins/editor.html");

                                bgWindow.closeWebAppsWindow(url);
                                bgWindow.openWebAppsWindow(url, null, 623, 600);

                            }, false);
                        });
                    }

                    return result;
                }
            }
        }
    });

    var newElement = function(el, id, html)
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
