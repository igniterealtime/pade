(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var SearchDialog = null;
    var searchDialog = null;

    var Strophe, dayjs

    converse.plugins.add("search", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            Strophe = converse.env.Strophe;
            dayjs = converse.env.dayjs;

            _converse.api.settings.update({
                search_max: 999,
                search_free_text_search: true
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
                         '<div style="overflow-x:hidden; overflow-y:scroll; height: 400px;" id="pade-search-results"></div>' +
                         '</div>' +
                         '</div>' +
                         '<div class="modal-footer"> <button type="button" class="btn btn-success btn-search">Search</button><button type="button" class="btn btn-success btn-pdf">PDF</button><button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
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
                            flatpickr('#pade-search-start', {dateFormat: "Y-m-d H:i", enableTime: true, defaultDate: new Date(start)});

                            that.el.querySelector("#pade-search-keywords").value = that.model.get("keyword");;
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
                    'click .btn-search': 'doSearch',
                    'click .btn-pdf': 'doPDF',
                    'click .btn-danger': 'doDestroy'
                },

                clickSearch(ev) {
                    if (ev.key === "Enter")
                    {
                        this.doSearch();
                    }
                },

                doDestroy() {

                },
                doPDF() {
                    const margins = {
                      top: 70,
                      bottom: 40,
                      left: 30,
                      width: 550
                    };
                    const pdf = new jsPDF('p','pt','a4');
                    //pdf.setFontSize(18);

                    pdf.autoTable({
                        head: [['Date', 'Person', 'Message']],
                        body: this.model.get("pdf_body"),
                        columnStyles: {
                            0: {cellWidth: 100},
                            1: {cellWidth: 100},
                            2: {cellWidth: 300}
                        }
                    })

                    const view = this.model.get("view");
                    const roomLabel = view.model.getDisplayName() || view.model.get("jid");
                    pdf.save(roomLabel + '.pdf')
                },
                doSearch() {
                    const start = this.el.querySelector("#pade-search-start").value;
                    const end = this.el.querySelector("#pade-search-end").value;
                    const pdf_body = [];

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
                        let html = "<div class='row'><div style='max-width: 20%;' class='col'><b>Date</b></div><div style='max-width: 15%;' class='col'><b>Person</b></div><div class='col'><b>Message</b></div></div>";
                        let ids = [];

                        for (let i=0; i<messages.length; i++)
                        {
                            if (messages[i].querySelector('body'))
                            {
                                const body = messages[i].querySelector('body').innerHTML;
                                const message = messages[i].querySelector('forwarded').querySelector('message');
                                const from = message.getAttribute('from');
                                const originId = message.querySelector('origin-id');
                                const stanzaId = message.querySelector('stanza-id');

                                if (originId || stanzaId)
                                {
                                    const delay = messages[i].querySelector('forwarded').querySelector('delay');
                                    const time = delay ? delay.getAttribute('stamp') : dayjs().format();
                                    const pretty_time = dayjs(time).format('MMM DD HH:mm:ss');
                                    const pretty_from = type === "chatroom" ? from.split("/")[1] : from.split("@")[0];

                                    if ((keyword == "" || _converse.api.settings.get("search_free_text_search")) && searchRegExp.test(body))
                                    {
                                        const id = originId ? originId.getAttribute('id') : stanzaId.getAttribute('id');
                                        ids.push(id);
                                        const tagged = body.replace(tagRegExp, "<span style=background-color:#FF9;color:#555;><a href='#' data-id='" + id + "' id='search-" + id + "'>$1</a></span>");
                                        html = html + "<div class='row'><div style='max-width: 20%;' class='col'>" + pretty_time + "</div><div style='max-width: 15%;' class='col'>" + pretty_from + "</div><div class='col'>" + tagged + "</div></div>";
                                        pdf_body.push([pretty_time, pretty_from, body]);
                                    }
                                }
                            }
                        }

                        html =  html + "</div>";
                        searchResults.innerHTML = html;
                        that.model.set("pdf_body", pdf_body);

                        for (var i=0; i<ids.length; i++)
                        {
                            var button = document.getElementById("search-" + ids[i]);

                            if (button) button.addEventListener('click', function(evt)
                            {
                                //evt.stopPropagation();

                                var elmnt = document.getElementById("msg-" + evt.target.getAttribute("data-id"));
                                // chrome bug
                                //if (elmnt) elmnt.scrollIntoView({block: "end", inline: "nearest", behavior: "smooth"});
                                if (elmnt) elmnt.scrollIntoView(false);

                            }, false);
                        }
                    });
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                if (getSetting("showToolbarIcons", true))
                {
                    const id = view.model.get("box_id");
                    const search = addToolbarItem(view, id, "pade-search-" + id, '<a class="plugin-search fa fa-search" title="Search conversations for keywords"></a>');

                    console.debug('search - renderToolbar', search, view.model);

                    if (search) search.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        if (!searchDialog)
                        {
                            searchDialog = new SearchDialog({ 'model': new converse.env.Backbone.Model({view: view}) });
                        }
                        else {
                            searchDialog.model.set("view", view);
                        }
                        searchDialog.show();
                    }, false);
                }
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
                        if (!searchDialog)
                        {
                            searchDialog = new SearchDialog({ 'model': new converse.env.Backbone.Model({view: this, keyword: match[2]}) });
                        }
                        else {
                            searchDialog.model.set("view", this);
                            searchDialog.model.set("keyword", match[2]);
                        }

                        searchDialog.show();
                        return true;
                    }
                    else

                    if (command === "summary")
                    {
                        const title = match[2] || this.model.getDisplayName();
                        const messages = this.model.messages.models;
                        let firstMsg = 0;

                        for (let i=0; i<messages.length; i++)
                        {
                            const msg = document.getElementById("msg-" + messages[i].get("msgid"));

                            if (msg && isInViewport(msg))
                            {
                                console.debug("first message in view", msg);
                                firstMsg = i;
                                break;
                            }
                        }

                        let detail = "";

                        for (var i=firstMsg; i<messages.length; i++)
                        {
                            const body = messages[i].get('message');
                            const from = messages[i].get('from');
                            const pretty_from =  messages[i].get('type') === "groupchat" ? from.split("/")[1] : from.split("@")[0];

                            if (body && !body.startsWith('>')) {
                                detail = detail + pretty_from + " says " + body + ". ";
                            }
                        }

                        const summarizer = new JsSummarize();
                        const summary = summarizer.summarize(title, detail);
                        summary.unshift("---------- Summary ----------");
                        this.showHelpMessages(summary);
                        this.viewUnreadMessages();

                        return true;
                    }

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                }
            },

            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    await this.__super__.renderChatMessage.apply(this, arguments);

                    var source = this.model.get("from") || this.model.get("jid");
                    var box_jid = Strophe.getBareJidFromJid(source);
                    var view = _converse.chatboxviews.get(box_jid);

                    if (view)
                    {
                        this.el.querySelectorAll('.badge-hash-tag').forEach(function(hashtag)
                        {
                            var oldMsg = view.model.messages.findWhere({'msgid': hashtag.getAttribute("data-hashtag")});

                            if (oldMsg)
                            {
                                const nick = Strophe.getResourceFromJid(oldMsg.get('from'));
                                hashtag.title = nick + ": " + oldMsg.get('message');
                                hashtag.innerText = "this";
                            }

                            hashtag.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                console.debug("pade.hashtag click", evt.target);

                                const tag = document.getElementById("msg-" + evt.target.getAttribute("data-hashtag"));

                                // can't find old message, we default to groupchat room

                                if (tag) tag.scrollIntoView({block: "end", inline: "nearest", behavior: "smooth"});
                                else {
                                    const roomJid = evt.target.getAttribute("data-hashtag") + "@conference." + _converse.connection.domain;
                                    _converse.api.rooms.open(roomJid, {name: evt.target.getAttribute("data-hashtag"), nick: getSetting("displayname")});

                                }
                            }, false);
                        });

                        this.el.querySelectorAll('.mention').forEach(function(mention)
                        {
                            mention.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                console.debug("pade.mention click", evt.target);

                                const jid = evt.target.getAttribute("data-jid");

                                if (jid) {
                                    _converse.api.chats.open(jid, {fullname: evt.target.getAttribute("data-mention")});
                                }
                                else {
                                    const contact = _converse.roster.findWhere({'user_id': evt.target.getAttribute("data-mention")});

                                    if (contact) {
                                        _converse.api.chats.open(contact.get("jid"), {fullname: contact.get("nickname") || contact.get("fullname")});
                                    }
                                }

                            }, false);
                        });
                    }
                }
            }
        }
    });

    function isInViewport (elem) {
        var distance = elem.getBoundingClientRect();
        return (
            distance.top >= 0 &&
            distance.left >= 0 &&
            distance.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            distance.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
}));
