(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var SearchDialog = null;
    var searchDialog = null;
    var _converse, dayjs;

    converse.plugins.add("search", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            dayjs = converse.env.dayjs;

            _converse.api.settings.update({
                search_max: 999,
                search_free_text_search: false
            });


            SearchDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                    const view = this.model.get("view");
                    const jid = view.model.get("jid");
                    const type = view.model.get("type");

                    let roomLabel = view.model.getDisplayName();
                    let participants = '';

                    participants = participants + '   <select class="form-control" id="pade-search-participant" name="pade-search-participant">';
                    participants = participants + '       <option value="' + jid + '">' + roomLabel + '</option>';

                    this.model.set("participant", jid); // default

                    if (type == _converse.CHATROOMS_TYPE)
                    {
                        roomLabel = roomLabel + " (All)"

                        view.model.occupants.each(function (occupant) {
                            if (occupant.get("jid")) participants = participants + '       <option value="' + occupant.get("jid") + '">' + occupant.get("nick") + '</option>';
                        });
                    }
                    participants = participants + '   </select>';

                    return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">Search</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body">' +
                         '<div class="form-group">' +
                         '<div class="row">' +
                         '  <div class="col">' +
                         '    <input id="pade-search-keywords" class="form-control" type="text" placeholder="Type a query and press [Enter] to search" >' +
                         '  </div>' +
                         '  <div class="col">' +
                         participants +
                         '  </div>' +
                         '</div>' +
                         '<div class="row">' +
                         '  <div class="col">' +
                         '    <label for="pade-search-start" class="col-form-label">Start:</label>' +
                         '    <input id="pade-search-start" type="text" class="form-control" name="pade-search-start"/>' +
                         '  </div>' +
                         '  <div class="col">' +
                         '    <label for="pade-search-end" class="col-form-label">End:</label>' +
                         '    <input id="pade-search-end" type="text" class="form-control" name="pade-search-end"/>' +
                         '  </div>' +
                         '</div><p/>' +
                         '</div>' +
                         '<div class="form-group">' +
                         '<div id="pade-search-results"></div>' +
                         '</div>' +
                         '</div>' +
                         '<div class="modal-footer"> <button type="button" class="btn btn-success btn-search">Search</button><button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                  const that = this;

                  this.el.addEventListener('shown.bs.modal', function()
                  {
                        flatpickr('#pade-search-end', {dateFormat: 'Z', enableTime: true, defaultDate: new Date()});
                        const keyword = that.model.get("keyword");

                        let start = dayjs().startOf('day');

                        if (keyword)
                        {
                            if (keyword != "") start = new Date(0);
                            flatpickr('#pade-search-start', {dateFormat: 'Z', enableTime: true, defaultDate: new Date(start)});

                            that.el.querySelector("#pade-search-keywords").value = that.model.get("keyword");
                            that.el.querySelector('#pade-search-keywords').style.display = "none";
                            that.el.querySelector('#pade-search-participant').style.display = "none";
                            that.doSearch();
                        }
                        else {
                            flatpickr('#pade-search-start', {dateFormat: 'Z', enableTime: true, defaultDate: new Date(start)});
                            that.el.querySelector('#pade-search-keywords').focus();
                        }

                  }, false);
                },
                events: {
                    'keyup #pade-search-keywords': 'clickSearch',
                    'click .btn-search': 'doSearch'
                },

                clickSearch(ev) {
                    if (ev.key === "Enter")
                    {
                        this.doSearch();
                    }
                },

                doSearch() {
                    const start = this.el.querySelector("#pade-search-start").value;
                    const end = this.el.querySelector("#pade-search-end").value;

                    let keyword = this.el.querySelector("#pade-search-keywords").value.trim();
                    let participant = this.el.querySelector("#pade-search-participant");
                    if (participant) participant = participant.value.trim();

                    const view = this.model.get("view");
                    const jid = view.model.get("jid");
                    const type = view.model.get("type");
                    const groupchat = view.model.get("type") == "chatroom";

                    if (keyword.startsWith("/p"))
                    {
                        let temp = keyword.substring(3).trim();
                        const pos = temp.indexOf(" ");

                        if (pos > -1)
                        {
                            keyword = temp.substring(pos + 1);

                            if (groupchat)
                            {
                                participant = temp.substring(0, pos);
                                if (participant.indexOf("@") == -1) participant = participant + "@" + _converse.connection.domain;
                            }
                        }
                    }

                    const that = this;
                    const searchRegExp = new RegExp('^(.*)(\s?' + keyword + ')', 'i');
                    const tagRegExp = new RegExp("(\\b" + keyword + "\\b)", "im");

                    console.debug("doSearch", keyword, participant);

                    const searchResults = that.el.querySelector("#pade-search-results");
                    searchResults.innerHTML = "No Match";

                    _converse.api.archive.query({to: jid, start: start, end: end, before: '', search: keyword, max: _converse.api.settings.get("search_max"), 'groupchat': groupchat, 'with': participant}).then(function(result)
                    {
                        const messages = result.messages;
                        let html = "<div><div class='row'><div class='col'><b>Date</b></div><div class='col'><b>Participant</b></div><div class='col'><b>Message</b></div></div><p/>";

                        for (let i=0; i<messages.length; i++)
                        {
                            if (messages[i].querySelector('body'))
                            {
                                const body = messages[i].querySelector('body').innerHTML;
                                const delay = messages[i].querySelector('forwarded').querySelector('delay');
                                const from = messages[i].querySelector('forwarded').querySelector('message').getAttribute('from');
                                const time = delay ? delay.getAttribute('stamp') : dayjs().format();
                                const pretty_time = dayjs(time).format('MMM DD HH:mm:ss');
                                const pretty_from = type === "chatroom" ? from.split("/")[1] : from.split("@")[0];

                                if (keyword == "" || _converse.api.settings.get("search_free_text_search") || searchRegExp.test(body))
                                {
                                    const tagged = body.replace(tagRegExp, "<span style=background-color:#FF9;color:#555;>$1</span>");
                                    html = html + "<div class='row'><div class='col'>" + pretty_time + "</div><div class='col'>" + pretty_from + "</div><div class='col'>" + tagged + "</div></div>";
                                }
                            }
                        }

                        html =  html + "</div>";
                        searchResults.innerHTML = html;
                    });
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                const id = view.model.get("box_id");
                const search = addToolbarItem(view, id, "pade-search-" + id, '<a class="plugin-search fa fa-search" title="Search conversations for keywords"></a>');

                if (search) search.addEventListener('click', function(evt)
                {
                    evt.stopPropagation();

                    searchDialog = new SearchDialog({ 'model': new converse.env.Backbone.Model({view: view}) });
                    searchDialog.show();
                }, false);
            });

            console.log("search plugin is ready");
        },

        'overrides': {
            ChatBoxView: {
                parseMessageForCommands: function(text) {
                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();

                    console.debug('search - parseMessageForCommands', command, match);

                    if (command === "search")
                    {
                        searchDialog = new SearchDialog({ 'model': new converse.env.Backbone.Model({view: this, keyword: match[2]}) });
                        searchDialog.show();
                        return true;
                    }
                    else

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                }
            }
        }
    });

    function newElement (el, id, html, className)
    {
        const ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        if (className) ele.classList.add(className);
        document.body.appendChild(ele);
        return ele;
    }

    function addToolbarItem (view, id, label, html)
    {
        let placeHolder = view.el.querySelector('#place-holder');

        if (!placeHolder)
        {
            const toolbar = view.el.querySelector('.chat-toolbar');
            toolbar.appendChild(newElement('li', 'place-holder'));
            placeHolder = view.el.querySelector('#place-holder');
        }
        const newEle = newElement('li', label, html);
        placeHolder.insertAdjacentElement('afterEnd', newEle);
        return newEle;
    }

}));
