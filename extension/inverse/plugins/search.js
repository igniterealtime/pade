(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
    var SearchDialog = null;
    var searchDialog = null;

    converse.plugins.add("search", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            SearchDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">Search</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body">' +
                         '<input id="pade-search-keywords" class="form-control" type="text" placeholder="Type a Lucene query string and press Enter to search" ><p/><div id="pade-search-results"></div>' +
                         '</div>' +
                         '<div class="modal-footer"> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                  var that = this;
                  this.el.addEventListener('shown.bs.modal', function()
                  {
                      if (that.model.get("keyword"))
                      {
                          that.el.querySelector('#pade-search-keywords').style.display = "none";
                          that.doSearch();
                      }
                      else {
                        that.el.querySelector('#pade-search-keywords').focus();
                      }

                  }, false);
                },
                events: {
                    'keyup #pade-search-keywords': 'keyUp'
                },

                keyUp(ev) {
                    if (ev.key === "Enter")
                    {
                        var keyword = this.el.querySelector("#pade-search-keywords").value.trim();
                        this.model.set("keyword", keyword)
                        this.doSearch();
                    }
                },

                doSearch() {
                    var that = this;
                    var keyword = that.model.get("keyword");

                    if (keyword != "" && bgWindow)
                    {
                        var searchResults = that.el.querySelector("#pade-search-results");

                        bgWindow.searchConversations(keyword, function(html, conversations)
                        {
                            searchResults.innerHTML = html;

                            for (var i=0; i<conversations.length; i++)
                            {
                                that.el.querySelector("#conversation-" + conversations[i].conversationID).addEventListener("click", function(e)
                                {
                                    e.stopPropagation();
                                    chrome.extension.getViews({windowId: bgWindow.pade.chatWindow.id})[0].openChatPanel(e.target.title);

                                }, false);
                            }
                        });
                    }
                }
            });

            document.addEventListener('pade.search.setup', function(event)
            {
                console.log("pade.search.setup", event);

                var search = document.getElementById("pade-search-" + event.detail.id);

                search.addEventListener('click', function(evt)
                {
                    evt.stopPropagation();

                    searchDialog = new SearchDialog({ 'model': new converse.env.Backbone.Model({}) });
                    searchDialog.show();
                }, false);
            });

            console.log("search plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                renderToolbar: function renderToolbar(toolbar, options) {
                    var result = this.__super__.renderToolbar.apply(this, arguments);

                    var view = this;
                    var id = this.model.get("box_id");

                    addToolbarItem(view, id, "pade-search-" + id, '<a class="fa fa-search" title="Search"></a>');

                    setTimeout(function()
                    {
                        document.dispatchEvent(new CustomEvent('pade.search.setup', {detail: {id: id, view: view}}));
                    });

                    return result;
                }
            },
            MessageView: {

                renderChatMessage: function renderChatMessage()
                {
                    this.__super__.renderChatMessage.apply(this, arguments);

                    converse.env._.each(this.el.querySelectorAll('.badge-hash-tag'), function (badge)
                    {
                        badge.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();

                            console.log("pade.hashtag click", badge.innerText);
                            searchDialog = new SearchDialog({ 'model': new converse.env.Backbone.Model({keyword: badge.innerText}) });
                            searchDialog.show();
                        }, false);
                    });
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
