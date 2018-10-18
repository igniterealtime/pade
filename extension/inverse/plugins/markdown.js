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
                if (bgWindow.pade.activeView)
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

                        var html = '<li id="webmeet-markdown-' + id + '"><a class="fa" title="Markdown Editor. Click to open"><b style="font-size: large;">M&darr;</b></a></li>';

                        $(this.el).find('.toggle-toolbar-menu .toggle-smiley dropup').after('<li id="place-holder"></li>');
                        $(this.el).find('#place-holder').after(html);

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
}));
