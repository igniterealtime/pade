(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var SearchDialog = null;
    var searchDialog = null;
    var searchAvailable = false;
    var moment = converse.env.moment;

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
                         '<input id="pade-search-keywords" class="form-control" type="text" placeholder="Type a query and press [Enter] to search" ><p/><div id="pade-search-results"></div>' +
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
                    var view = this.model.get("view");
                    var jid = view.model.get("jid");
                    var type = view.model.get("type");

                    var that = this;
                    var keyword = that.model.get("keyword");
                    var searchRegExp = new RegExp('^(.*)(\s?' + keyword + ')', 'ig');
                    var tagRegExp = new RegExp("(\\b" + keyword + "\\b)", "gim");

                    console.debug("doSearch", keyword, jid);

                    if (keyword != "")
                    {
                        var searchResults = that.el.querySelector("#pade-search-results");
                        searchResults.innerHTML = "No Match";

                        _converse.api.archive.query({before: '', max: 9999999, 'groupchat':  type === "chatroom", 'with': jid}, messages =>
                        {
                            var html = "<table style='margin-left: 15px'><tr><th>Date</th><th>Message</th><th>Participant</th></tr>";

                            for (var i=0; i<messages.length; i++)
                            {
                                if (messages[i].querySelector('body'))
                                {
                                    var body = messages[i].querySelector('body').innerHTML;
                                    var delay = messages[i].querySelector('forwarded').querySelector('delay');
                                    var from = messages[i].querySelector('forwarded').querySelector('message').getAttribute('from');
                                    var time = delay ? delay.getAttribute('stamp') : moment().format();
                                    var pretty_time = moment(time).format('MMM DD<br/>HH:mm:ss');
                                    var pretty_from = type === "chatroom" ? from.split("/")[1] : from.split("@")[0];

                                    if (searchRegExp.test(body))
                                    {
                                        var tagged = body.replace(tagRegExp, "<span style=background-color:#FF9;color:#555;>$1</span>");
                                        html = html + "<tr><td>" + pretty_time + "</td><td>" + tagged + "</td><td>" + pretty_from + "</td></tr>";
                                    }
                                }
                            }

                            html =  html + "</table>";
                            searchResults.innerHTML = html;
                        });
                    }
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                if (!view.el.querySelector(".plugin-search"))
                {
                    var id = view.model.get("box_id");
                    addToolbarItem(view, id, "pade-search-" + id, '<a class="plugin-search fa fa-search" title="Search conversations for keywords"></a>');

                    var search = document.getElementById("pade-search-" + id);

                    if (search) search.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        searchDialog = new SearchDialog({ 'model': new converse.env.Backbone.Model({view: view}) });
                        searchDialog.show();
                    }, false);
                }
            });

            console.log("search plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                parseMessageForCommands: function(text) {
                    console.debug('search - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();

                    if (command === "search")
                    {
                        searchDialog = new SearchDialog({ 'model': new converse.env.Backbone.Model({keyword: match[2]}) });
                        searchDialog.show();
                        return true;
                    }
                    else

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                }
            },

            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    await this.__super__.renderChatMessage.apply(this, arguments);
                    var that = this;

                    if (searchAvailable)
                    {
                        converse.env._.each(that.el.querySelectorAll('.badge-hash-tag'), function (badge)
                        {
                            badge.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                console.debug("pade.hashtag click", badge.innerText);
                                searchDialog = new SearchDialog({ 'model': new converse.env.Backbone.Model({keyword: badge.innerText}) });
                                searchDialog.show();
                            }, false);
                        });
                    }
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
