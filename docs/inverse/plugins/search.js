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
                         '<div class="modal-footer"> <button type="button" class="btn btn-success btn-search">Search</button><button type="button" class="btn btn-success btn-pdf">PDF</button>' + (getSetting("showWordCloud", false) ? '<button type="button" class="btn btn-success btn-word-cloud">Word Cloud</button>' : '') + '<button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
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
                    'click .btn-word-cloud': 'doWordCloud',
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
                doWordCloud() {
                    let cloudData = "";
                    const conv = this.model.get("pdf_body") || [];

                    conv.forEach(function(line)
                    {
                        cloudData = cloudData + line[1] + ' ' + line[2] + ' ';
                    });

                    if (cloudData.length > 0)
                    {
                        const searchResults = this.el.querySelector("#pade-search-results");
                        searchResults.innerHTML = "";
                        searchResults.style.cursor = "pointer";

                        searchResults.addEventListener("click", function(evt)
                        {
                            searchResults.requestFullscreen();
                            searchResults.innerHTML = "";

                            makeWordCloud({
                                width: screen.availWidth - 50,
                                height: screen.availHeight - 50,
                                font: "Helvetica",
                                container: {element: this.el, selector: "#pade-search-results"},
                                words: processData(cloudData)
                            });
                        });

                        makeWordCloud({
                            width: 700,
                            height: 500,
                            font: "Helvetica",
                            container: {element: this.el, selector: "#pade-search-results"},
                            words: processData(cloudData)
                        });
                    }
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
                    const search = padeapi.addToolbarItem(view, id, "pade-search-" + id, '<a class="plugin-search fa fa-search" title="Search conversations for keywords"></a>');

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

    function processData(strings)
    {
        if(!strings) return;

        // strip stringified objects, common words and punctuations from the string
        strings = strings.removeStopWords().toLowerCase().replace(/object Object/g, '').replace(/[\+\.,\/#!$%\^&\*{}=_`~]/g,'');

        // convert the str back in an array
        strings = strings.split(' ');

        // Count frequency of word occurance
        var wordCount = {};

        for(var i = 0; i < strings.length; i++) {
            if(!wordCount[strings[i]])
                wordCount[strings[i]] = 0;

            wordCount[strings[i]]++; // {'hi': 12, 'foo': 2 ...}
        }

        console.debug("processData", strings, wordCount);

        var wordCountArr = [];

        for(var prop in wordCount) {
            wordCountArr.push({text: prop, size: wordCount[prop] * 10});
        }

        return wordCountArr;
    }

    function makeWordCloud(options)
    {
        if(options == undefined) options = {}
        if(options.width == undefined) options.width = 300
        if(options.height == undefined) options.height = 300
        if(options.font == undefined) options.font = "Arial"
        if(options.container == undefined) options.container = "body"
        if(options.words == undefined) options.words = [{text: "This", size: 40}, {text: "is", size: 40}, {text: "an", size: 40}, {text: "Example", size: 40}]

        var fill = d3.scale.category20();

        d3.layout.cloud().size([options.width, options.height])
        .words(options.words)
        .rotate(function(d) { return ~~(Math.random() * 3) * 45 - 45; })
        .font(options.font)
        .fontSize(function(d) { return d.size; })
        .on("end", function(words) {
            d3.select(options.container.selector, options.container.element).append("svg")
            .attr("width", options.width)
            .attr("height", options.height)
            .append("g")
            .attr("transform", "translate(" + (options.width/2) + "," + (options.height/2) + ")")
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", function(d) { return d.size + "px"; })
            .style("font-family", options.font)
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; });
        })
        .start();
    }
}));
