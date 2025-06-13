(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var _converse, dayjs, html, _, __;

    converse.plugins.add("search", {
        'dependencies': [],

        'initialize': function () {
            dayjs = converse.env.dayjs;
			
			_converse = this._converse;			
			__ = _converse.__
			
			html = converse.env.html;
			_  = converse.env._;
			
			class SearchDialog extends _converse.exports.BaseModal {

				initialize() {
					super.initialize();					
					this.listenTo(this.model, "change", () => this.requestUpdate());
					
					this.addEventListener('shown.bs.modal', () => {
					  
					  if (this.model.get("keyword"))
					  {
						  this.querySelector('#pade-search-keywords').value = this.model.get("keyword");
						  this.doSearch();
					  }
					  else {
						this.keyInput = this.querySelector('#pade-search-keywords');
						this.keyInput.focus();
						
						this.keyInput.addEventListener('keyup', (ev) => { 
							this.keyUp(ev);
						});	

						this.querySelector('.btn-pdf').addEventListener('click', (ev) => { 
							this.doPDF(ev);
						});	
						
						this.querySelector('.word-cloud').addEventListener('click', (ev) => { 
							this.doWordCloud(ev);
						});							
					  }

					});
				}

				getModalTitle () {
					return __('Search: %1$s', this.model.get('room'));
				}

				renderModal() {
                  return html`<div class="modal-dialog modal-xl" role="document"> <div class="modal-content">
                         <div class="modal-body">
                         <input value="${this.model.get('keyword') || ''}" id="pade-search-keywords" class="form-control" type="text" placeholder="Type a query and press [Enter] to search" ><p/><div id="pade-search-results"></div>
                         </div>
                         <div class="modal-footer">
                         <button type="button" class="btn btn-success btn-pdf">PDF</button>						 
						 <button type="button" class="btn btn-success btn-word-cloud">Word Cloud</button>						 
                         </div>
                         </div> </div>`;
				}

                keyUp(ev) {
					console.debug("keyUp", ev);
					
                    if (ev.key === "Enter")  {
                        var keyword = this.keyInput.value.trim();
                        this.model.set("keyword", keyword)
                        this.doSearch();
                    }
                }	

                doSearch() {
					console.debug("doSearch");
					
                    var view = this.model.get("view");
                    var jid = view.model.get("jid");
                    var type = view.model.get("type");
                    var groupchat = view.model.get("type") == "chatroom";
                    var method = _converse.api.settings.get("search_method");

                    var keyword = this.model.get("keyword");
                    var searchRegExp = undefined;
                    var tagRegExp = undefined;
                    var pdf_body = [];

                    console.debug("doSearch", keyword, jid);

                    if (keyword != "")
                    {
                        searchRegExp = new RegExp('^(.*)(\s?' + keyword + ')', 'i');
                        tagRegExp = new RegExp("(\\b" + keyword + "\\b)", "im");
                    }
                    var searchResults = this.querySelector("#pade-search-results");
                    searchResults.innerHTML = "No Match";
                    var html = "<table style='margin-left: 15px'><tr><th>Date</th><th>Person</th><th>Message</th></tr>";

                    if (method == "mam")
                    {
                        _converse.api.archive.query({before: '', max: 999, 'groupchat': groupchat, 'with': jid}).then((result) => {
                            const messages = result.messages;

                            for (var i=0; i<messages.length; i++)
                            {
                                if (messages[i].querySelector('body'))
                                {
                                    var body = messages[i].querySelector('body').innerHTML;
                                    var delay = messages[i].querySelector('forwarded').querySelector('delay');
                                    var from = messages[i].querySelector('forwarded').querySelector('message').getAttribute('from');
                                    var time = delay ? delay.getAttribute('stamp') : dayjs().format();
                                    var pretty_time = dayjs(time).format('MMM DD HH:mm:ss');
                                    var pretty_from = type === "chatroom" ? from.split("/")[1] : from.split("@")[0];
                                    if (!searchRegExp || searchRegExp.test(body)) pdf_body.push([pretty_time, pretty_from, body]);

                                    html =  html + makeHtml(searchRegExp, tagRegExp, body, pretty_time, pretty_from);
                                }
                            }

                            html =  html + "</table>";
                            searchResults.innerHTML = html;
                            this.model.set("pdf_body", pdf_body);
                        });
                    }
                    else {
                        var messages = view.model.messages.models;

                        for (var i=0; i<messages.length; i++)
                        {
                            var body = messages[i].get('message');
                            var from = messages[i].get('from');
                            var pretty_time = dayjs(messages[i].get('time')).format('MMM DD HH:mm:ss');
                            var pretty_from = from;
                            if (from) pretty_from =  messages[i].get('type') === "groupchat" ? from.split("/")[1] : from.split("@")[0];
                            if (!searchRegExp || searchRegExp.test(body)) pdf_body.push([pretty_time, pretty_from, body]);

                            html =  html + makeHtml(searchRegExp, tagRegExp, body, pretty_time, pretty_from);
                        }

                        html =  html + "</table>";
                        searchResults.innerHTML = html;
                        this.model.set("pdf_body", pdf_body);
                    }
                }
				
                doPDF() {
                    const margins = {
                      top: 70,
                      bottom: 40,
                      left: 30,
                      width: 550
                    };
                    const pdf = new jsPDF('p','pt','a4');

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
                }				

                doWordCloud() {
					if (!getSetting("showWordCloud", false)) {					
						debug.error('Enable word cloud and reload application');
						return;
					}
                    let cloudData = "";
                    const conv = this.model.get("pdf_body") || [];

                    conv.forEach(function(line)
                    {
                        cloudData = cloudData + line[1] + ' ' + line[2] + ' ';
                    });

                    if (cloudData.length > 0)
                    {
                        const searchResults = this.querySelector("#pade-search-results");
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
                                container: {element: this, selector: "#pade-search-results"},
                                words: processData(cloudData)
                            });
                        });

                        makeWordCloud({
                            width: 700,
                            height: 500,
                            font: "Helvetica",
                            container: {element: this, selector: "#pade-search-results"},
                            words: processData(cloudData)
                        });
                    }
                }				
			}
			
			_converse.api.elements.define('converse-pade-search-dialog', SearchDialog);			

            _converse.api.settings.extend({
                search_method: 'mam'         // use values mam or local
            });

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
				let style = "width:18px; height:18px; fill:var(--chat-color);";
				if (toolbar_el.model.get("type") === "chatroom") {
					style = "width:18px; height:18px; fill:var(--muc-color);";
				}

                buttons.push(html`
                    <button class="btn plugin-search" title="${__('Search conversations for keywords')}" @click=${performSearch}/>
                        <svg style="${style}" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 32 32" enable-background="new 0 0 16 16" xml:space="preserve"> <g><path d="M 2,30l 18,0 c 1.104,0, 2-0.896, 2-2l0-2.7 c 0.426-0.204, 0.824-0.448, 1.198-0.73l 6.138,6.138 c 0.196,0.196, 0.452,0.292, 0.708,0.292s 0.512-0.098, 0.708-0.292c 0.39-0.39, 0.39-1.024,0-1.414l-6.142-6.142 C 25.472,21.988, 26,20.56, 26,19c0-2.788-1.642-5.174-4-6.3L 22,2 c0-1.104-0.896-2-2-2L 2,0 C 0.896,0,0,0.896,0,2l0,26 C0,29.104, 0.896,30, 2,30z M 19,24C 16.244,24, 14,21.756, 14,19S 16.244,14, 19,14S 24,16.244, 24,19S 21.756,24, 19,24z M 2,2l 18,0 l0,10 L 5.286,12 C 4.576,12, 4,12.448, 4,13C 4,13.552, 4.576,14, 5.286,14l 8.826,0 C 13.038,15.048, 12.326,16.444, 12.1,18L 5,18 C 4.448,18, 4,18.448, 4,19 C 4,19.552, 4.448,20, 5,20l 7.1,0 c 0.49,3.388, 3.376,6, 6.9,6c 0.342,0, 0.67-0.054, 1-0.1L 20,28 L 2,28 L 2,2 zM 5,8l 12,0 C 17.552,8, 18,7.552, 18,7C 18,6.448, 17.552,6, 17,6l-12,0 C 4.448,6, 4,6.448, 4,7C 4,7.552, 4.448,8, 5,8z"></path></g></svg>
                    </button>
                `);

                return buttons;
            });

            _converse.api.listen.on('parseMessageForCommands', function(data, handled)
            {
				//console.debug('parseMessageForCommands', data, handled);
				if (!handled) handled = parseMessageForCommands(data.model, data.text);
				return handled;
            });
			
            console.debug("search plugin is ready");
        }
    });

    function performSearch(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();
        console.debug('performSearch', ev);
					
		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));
		
		const model = new converse.env.Model();
		model.set({ view: chatview});
		_converse.api.modal.show('converse-pade-search-dialog', { model });		
    }

    function makeHtml(searchRegExp, tagRegExp, body, pretty_time, pretty_from)
    {
        let html = "";

        if (!searchRegExp || searchRegExp.test(body))
        {
            var tagged = tagRegExp ? body.replace(tagRegExp, "<span style=background-color:#FF9;color:#555;>$1</span>") : body;
            html = html + "<tr><td>" + pretty_time + "</td><td>" + pretty_from + "</td><td>" + tagged + "</td></tr>";
        }
        return html;
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

    function isInViewport (elem) {
        var distance = elem.getBoundingClientRect();
        return (
            distance.top >= 0 &&
            distance.left >= 0 &&
            distance.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            distance.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

	function injectMessage(model, title, body) {
		const msgId = 'inject-' + Math.random().toString(36).substr(2,9);
		const type = model.get("type") == "chatbox" ? "chat" : "groupchat";
		const from = model.get("jid");

		let attrs = {message: body, body, id: msgId, msgId, type, from: _converse.jid}; 
		
		if (type == "groupchat") {
			attrs = {message: body, body, id: msgId, msgId, type, from_muc: from, from: from + '/' + title, nick: title};  
		}
		
		model.queueMessage(attrs);		
	}
	
	function parseMessageForCommands(model, text) {
		text = text.replace(/^\s*/, '');
		const command = (text.match(/^\/([a-zA-Z]*) ?/) || ['']).pop().toLowerCase();

		if (!command) {
			return false;
		}

		const args = text.slice(('/' + command).length + 1).trim().split(' ').filter(s => s) || [];
		//console.debug('parseMessageForCommands', command, args);

		if (command === "search" && args.length == 1)
		{
			const view = _converse.chatboxviews.get(model.get('jid'));			
			searchDialog = new SearchDialog({ 'model': new converse.env.Model({view: view, keyword: args[0]}) });
			searchDialog.model.set("keyword", args[0]);
			searchDialog.show();
			return true;
		}
		else
			
		if (command == "summary")
		{	
			const title = model.getDisplayName() + " - Summary";
			const messages = model.messages.models;
			let firstMsg = 0;
			
			console.debug('parseMessageForCommands - summary', title, messages, args);			

			if (args.length == 0 || args[0] != 'all') 
			{
				for (let i=0; i<messages.length; i++)
				{
					const msg = document.querySelector('[data-msgid="' + messages[i].get("msgid") + '"]');

					if (msg && isInViewport(msg))
					{
						console.debug("first message in view", msg);
						firstMsg = i;
						break;
					}
				}
			}

			let detail = "";

			for (var i=firstMsg; i<messages.length; i++)
			{
				const body = messages[i].get('message');
				const from = messages[i].get('from');
				const pretty_from =  messages[i].get('type') === "groupchat" ? from.split("/")[1] : from.split("@")[0];

				if (body && !body.startsWith('>')) {
					detail = detail + "*" + pretty_from + "* says " + body + "\n";
				}
			}

			const summarizer = new JsSummarize();
			const summary = summarizer.summarize('', detail);
			injectMessage(model, title, summary.join('\n'));
			return true;	
		}		

		return false;
	}		
}));
