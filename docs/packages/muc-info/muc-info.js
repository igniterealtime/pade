(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    let __, html, _converse;
    let Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,dayjs, Model, BootstrapModal;		
	let PreviewDialog = null, previewDialog = null, pade = {}, fastpath = {}, translations = {};	

    converse.plugins.add("muc-info", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            html = converse.env.html;

            Strophe = converse.env.Strophe;
            $iq = converse.env.$iq;
            $msg = converse.env.$msg;
            $pres = converse.env.$pres;
            $build = converse.env.$build;
            b64_sha1 = converse.env.b64_sha1;
            Model = converse.env.Model;
            BootstrapModal = converse.env.BootstrapModal;			
            _ = converse.env._;
            __ = _converse.__;			
            dayjs = converse.env.dayjs;	

			Function.prototype.clone = function() {
				var cloneObj = this;
				if(this.__isClone) {
				  cloneObj = this.__clonedFrom;
				}

				var temp = function() { return cloneObj.apply(this, arguments); };
				for(var key in this) {
					temp[key] = this[key];
				}

				temp.__isClone = true;
				temp.__clonedFrom = cloneObj;

				return temp;
			};			

            PreviewDialog = BootstrapModal.extend({
                id: "plugin-muc-info-modal",			   
                initialize() {
                    BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.listenTo(this.model, 'change', this.render);					
                },
                toHTML() {
                  return html`<div class="modal-dialog modal-xl"> <div class="modal-content">
                         <div class="modal-header"><h1 class="modal-title">Media Content Preview</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>
                         <div class="modal-body"></div>
                         <div class="modal-footer"><button type="button" class="btn btn-danger" data-dismiss="modal">Close</button></div>
                         </div> </div>`;
                },
                afterRender() {
                    const url = this.model.get("url");
					
                    this.el.addEventListener('shown.bs.modal', () => 
					{		
						if (this.model.get("type") == "image") {
							this.el.querySelector('.modal-body').innerHTML = '<img class="pade-preview-image" src="' + url + '"/>';
						}
						else if (this.model.get("type") == "video") {
							if (url.endsWith(".tgs")) {
								this.el.querySelector('.modal-body').innerHTML = '<tgs-player style="height: 512px; width: 512px;" autoplay controls loop mode="normal" src="' + url + '"></tgs-player>';

							} else if (url.endsWith(".json")) {
								this.el.querySelector('.modal-body').innerHTML = '<lottie-player autoplay controls loop mode="normal" src="' + url + '"></lottie-player>';
							} else {
								this.el.querySelector('.modal-body').innerHTML = '<video controls class="pade-preview-image" src="' + url + '"/>';
							}
						}
						else if (this.model.get("type") == "audio") {
							this.el.querySelector('.modal-body').innerHTML = '<audio controls class="pade-preview-image" src="' + url + '"/>';
						}

						this.el.querySelector('.modal-title').innerHTML = "Media Content Preview<br/>" + url + "<br/>" + this.model.get("from") + " - " + this.model.get("timestamp");

                    }, false);					
                 }
            });

            _converse.on('message', function (data)
            {
                var message = data.stanza;
                var chatbox = data.chatbox;
                var attachTo = data.stanza.querySelector('attach-to');
                var body = message.querySelector('body');
                var history = message.querySelector('forwarded');

                //console.debug("message", data);

                if (!history && body && chatbox)
                {
                    // add translation

                    var id = chatbox.get("box_id");

                    if (getSetting("enableTranslation", false) && body.innerHTML.indexOf("--") != 0)
                    {
                        const tronId = 'translate-' + id;

                        chrome.storage.local.get(tronId, function(obj)
                        {
                            if (obj && obj[tronId])
                            {
                                fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + obj[tronId].target + "&tl=" + obj[tronId].source + "&dt=t&q=" + body.innerHTML).then(function(response){ return response.json()}).then(function(json)
                                {
                                    console.debug('translation ok', json[0][0][0]);
									const title = 'translate ' + obj[tronId].source + ' to ' + obj[tronId].target;
									const msgId = 'translate-' + Math.random().toString(36).substr(2,9);			
                                    const type = message.getAttribute("type");
                                    const from = message.getAttribute("from");
                                    const body = "*" + json[0][0][0] + "*";									
									let attrs = {message: body, body, id: msgId, msgId, type, from}; 
									
									if (type == "groupchat") {
										attrs = {message: body, body, id: msgId, msgId, type, from_muc: from, from: from + '/' + title, nick: title};  
									}
									
									chatbox.queueMessage(attrs);										

                                }).catch(function (err) {
                                    console.error('translation error', err);
                                });
                            }
                        });
                    }
                }
            });

            _converse.api.listen.on('sendMessage', function(data)
            {
				//console.debug("sendMessage", data);
				
                const id = data.chatbox.get("box_id");
                const body = data.message.get("message");

                if (getSetting("enableTranslation", false) && body && !body.startsWith("/") && !body.startsWith("--"))
                {
                    const tronId = 'translate-' + id;

                    chrome.storage.local.get(tronId, function(obj)
                    {
                        if (obj && obj[tronId])
                        {
                            fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + obj[tronId].source + "&tl=" + obj[tronId].target + "&dt=t&q=" + body).then(function(response){ return response.json()}).then(function(json)
                            {
                                console.debug('translation ok', json[0][0][0]);
                                data.chatbox.sendMessage({body: "--*" + json[0][0][0] + "*--"});

                            }).catch(function (err) {
                                console.error('translation error', err);
                            });
                        }
                    });
                }				
			});
			
			
            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
				const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));	
		
				if (chatview && chatview.model.get("type") === "chatroom") {
					buttons.push(html`
						<button class="muc-info-icon" title="${__('More Information')}" @click=${doInfo}/>
							<converse-icon class="fa fa-info-circle" size="1em"></converse-icon>
						</button>
					`);
				}
				return buttons;
			});

            _converse.api.listen.on('parseMessageForCommands', function(data, handled)
            {
				console.debug('parseMessageForCommands', data, handled);
				if (!handled) handled = parseMessageForCommands(data.model, data.text);
				return handled;
            });

            console.log("info plugin is ready");
        }
    })

    function doInfo(ev) {
        ev.stopPropagation();
        ev.preventDefault();
		
		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));		
		console.debug("doInfo", chatview, toolbar_el.model);
		
		const jid = toolbar_el.model.get("jid");
		const id = toolbar_el.model.get("box_id");
		const occupants = chatview.querySelector('.occupants');	

		console.debug("doInfo", jid, id, occupants);	
		toggleInfoBar(chatview, id, jid);
    }
	
    function toggleInfoBar(view, id, jid) {
        const chatroom_body = view.querySelector('.chatroom-body');
        let info_area = view.querySelector('.occupants-pade-info');

		console.debug("toggleInfoBar", view, jid, id);
		
        if (!info_area)
        {
            info_area = document.createElement("div");
            info_area.classList.add('occupants-pade-info');
            info_area.classList.add('col-md-3');
            info_area.classList.add('col-4');
            chatroom_body.appendChild(info_area);
        }

        const occupants_area = view.querySelector('.occupants.col-md-3.col-4');

        if (occupants_area.style.display != "none")
        {
			view.model.save({'hidden_occupants': true});			
            occupants_area.style.display = "none";

            info_area.innerHTML = '<div class="plugin-infobox">' + getHTML(id, jid) + '</div>';
            info_area.style.display = "";

            createContentSummary(view, jid, id);
            createMediaContentSummary(jid, id);
            createWorkgroups(jid, id);
            createMylinks(jid, id);
            createBroadcastEndpoints(jid, id);			


        } else {
			view.model.save({'hidden_occupants': false});	
            occupants_area.style.display = "";
            info_area.style.display = "none";
        }
        view.scrollDown();
    }	

    function getHTML(id, jid)  {
        console.debug("getHTML", jid, id);

        var html = '<h3>This Conversation</h3>' +
                   '<details>' +
                   '    <summary id="' + id + '-pinned-details">Pinned Messages (<span id="' + id + '-pinned-count">0</span>)<span style="float: right;" class="fas fa-thumbtack"/></summary>' +
                   '</details>' +
                   '<details>' +
                   '    <summary id="' + id + '-feed-details">Feeds (<span id="' + id + '-feed-count">0</span>)<span style="float: right;" class="far fa-newspaper"/></summary>' +
                   '</details>';


        if (getSetting("enableThreading", false))
        {
           html += '<details>' +
                   '    <summary id="' + id + '-topics-details">Topic Threads (<span id="' + id + '-topics-count">0</span>)<span style="float: right;" class="fas fa-comments"/></summary>' +
                   '</details>';
        }

           html += '<h3 id="' + id + '-meeting-recordings">Meeting Recordings</h3>' +
                   '<h3>Media Content</h3>' +
                   '<details>' +
                   '    <summary id="' + id + '-photo-details">Photos (<span id="' + id + '-photo-count">0</span>)<span style="float: right;" class="fa fa-photo"/></summary>' +
                   '</details>' +
                   '<details>' +
                   '    <summary id="' + id + '-video-details">Videos (<span id="' + id + '-video-count">0</span>)<span style="float: right;" class="fa fa-video"/></summary>' +
                   '</details>' +
                   '<details>' +
                   '    <summary id="' + id + '-link-details">Shared Links (<span id="' + id + '-link-count">0</span>)<span style="float: right;" class="fas fa-link"/></summary>' +
                   '</details>' +
                   '<details>' +
                   '    <summary id="' + id + '-vmsg-details">Voice Messages (<span id="' + id + '-vmsg-count">0</span>)<span style="float: right;" class="fas fa-microphone"/></summary>' +
                   '</details>' +
                   '<details>' +
                   '    <summary id="' + id + '-ppt-details">Interactive Content (<span id="' + id + '-ppt-count">0</span>)<span style="float: right;" class="fa fa-file-powerpoint"/></summary>' +
                   '</details>';

        if (jid.startsWith("workgroup-"))
        {
            html += '<h3>This Workgroup</h3>' +
                    '<details>' +
                    '    <summary id="' + id + '-wg-queue-details">Queue (<span id="' + id + '-wg-queue-count">0</span>)<span style="float: right;" class="fas fa-info-circle"/></summary>' +
                    '</details>' +
                    '<details>' +
                    '    <summary id="' + id + '-wg-chats-details">Conversations (<span id="' + id + '-wg-chats-count">0</span>)<span style="float: right;" class="fa fa-user"/></summary>' +
                    '</details>' +
                    '<details>' +
                    '    <summary id="' + id + '-wg-others-details">Other Workgroups (<span id="' + id + '-wg-others-count">0</span>)<span style="float: right;" class="fas fa-users"/></summary>' +
                    '</details>';
        }

        html += '<h3>Broadcasts</h3>' +
                '<details>' +
                '    <summary id="' + id + '-broadcast-details">Distribution Lists (<span id="' + id + '-broadcast-count">0</span>)<span style="float: right;" class="fas fa-bullhorn"/></summary>' +
                '</details>';

        return html;
    }
	
    function createWorkgroups(jid, id)   {
        console.debug("createWorkgroups", jid, id);

        if (jid.startsWith("workgroup-"))
        {
            var workGroup = jid.split("@")[0].substring(10);

            _converse.connection.sendIQ($iq({type: 'get', to: "workgroup." + _converse.connection.domain}).c('workgroups', {jid: _converse.connection.jid, xmlns: "http://jabber.org/protocol/workgroup"}).tree(), function(resp)
            {
                var workgroups = resp.querySelectorAll('workgroup');
                var count = document.getElementById(id + "-wg-others-count");

                if (count) count.innerHTML = workgroups.length;

                var detail = document.getElementById(id + "-wg-others-details");

                if (detail)
                {
                    var html = "";

                    for (var i=0; i<workgroups.length; i++)
                    {
                        var jid = workgroups[i].getAttribute('jid');
                        var name = Strophe.getNodeFromJid(jid);
                        var room = 'workgroup-' + name + "@conference." + _converse.connection.domain;
                        var checked = pade.activeWorkgroup.jid == jid ? "checked" : "";  

                        console.debug("get workgroups", room, jid);
                        html += '<input id="info_active_workgroup-' + id + '" type="radio" ' + checked + ' value="' + jid + '"/>&nbsp;' + name + '<br/>';
                    }

                    var element = newElement('div', null, html);

                    element.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        var activeWorkgroup = document.getElementsById(evt.target.id);

                        for (var i=0; i<activeWorkgroup.length; i++)
                        {
                            console.debug("createWorkgroups other click", activeWorkgroup[i].value, activeWorkgroup[i].checked);
							if (activeWorkgroup[i].checked) pade.activeWorkgroup = activeWorkgroup[i];
                            //if (activeWorkgroup[i].checked) bgWindow.setActiveWorkgroup(pade.participants[activeWorkgroup[i].value]);
                        }
                    });

                    detail.insertAdjacentElement('afterEnd', element);
                }

            }, function (error) {
                console.warn("Workgroups not available");
            });

            if (fastpath[workGroup])
            {
                console.debug("createWorkgroups", workGroup, fastpath[workGroup]);

                var fastpath = fastpath[workGroup];
                var queueCount = document.getElementById(id + "-wg-queue-count");

                if (queueCount) queueCount.innerHTML = fastpath.count;

                var queueDetail = document.getElementById(id + "-wg-queue-details");

                if (queueDetail)
                {
                    var html = '<table>';
                    var props = Object.getOwnPropertyNames(fastpath);

                    for (var i=0; i<props.length; i++)
                    {
                        if (props[i] == "oldest" || props[i] == "joinTime")
                        {
                            var dayjs_time = fastpath[props[i]];
                            dayjs_time = dayjs_time.substring(0,4) + "-" + dayjs_time.substring(4,6) + "-" + dayjs_time.substring(6);
                            html += '<tr><td>' + props[i] + '</td><td>' + dayjs(dayjs_time).fromNow() + '</td></tr>'
                        }
                        else

                        if (props[i] != "conversations")
                        {
                            html += '<tr><td>' + props[i] + '</td><td>' + fastpath[props[i]] + '</td></tr>'
                        }

                    }
                    html += '</table>';

                    queueDetail.insertAdjacentElement('afterEnd', newElement('div', null, html));
                }

                var keys = Object.getOwnPropertyNames(fastpath.conversations);
                var chatsDetail = document.getElementById(id + "-wg-chats-details");
                var chatsCount = document.getElementById(id + "-wg-chats-count");

                if (chatsCount) chatsCount.innerHTML = keys.length;


                if (chatsDetail)
                {
                    for (var k=0; k<keys.length; k++)
                    {
                        var conversation = fastpath.conversations[keys[k]];

                        console.debug("createWorkgroups conversation", conversation);

                        var html = '<li title="' + conversation.question + '">' + conversation.username + ' (' + conversation.agent + ')</li>';
                        var element = newElement('div', null, html);

                        element.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();

                            console.debug("createWorkgroups click", evt.target.title);
                            _converse.api.rooms.open(evt.target.title);

                        });

                        chatsDetail.insertAdjacentElement('afterEnd', element);
                    }
                }
            }
        }
    }	
	
	function createMylinks(jid, id)  {
        if (pade.collabDocs)  {
            var urls = Object.getOwnPropertyNames(pade.collabDocs);

            if (urls.length > 0)
            {
                var h5pCount = document.getElementById(id + "-h5p-count");
                var h5pDetail = document.getElementById(id + "-h5p-details");
                var pdfCount = document.getElementById(id + "-pdf-count");
                var pdfDetail = document.getElementById(id + "-pdf-details");
                var appsCount = document.getElementById(id + "-apps-count");
                var appsDetail = document.getElementById(id + "-apps-details");

                var h5pHtml = "", h5pKount = 0, pdfHtml = "", pdfKount = 0, appsHtml = "", appsKount = 0;

                for (var i=0; i<urls.length; i++)
                {
                    var urlName = pade.collabDocs[urls[i]];
                    console.debug('createMylinks', urls[i], urlName);

                    if (bgWindow && urlName != "Video conferencing web client")
                    {
                        if (isH5PURL(urls[i]))
                        {
                            h5pKount++;
                            var checked = pade.activeH5p == urls[i] ? "checked" : "";
                            h5pHtml += '<div title="' + urlName + '" class="mediaItem"><input name="info_h5p_url" class="info_active_url" ' + checked + ' type="radio" value="' + urls[i] + '"/>&nbsp;' + urlName + '</div>';

                        }
                        else

                        if (isPDFURL(urls[i]))
                        {
                            pdfKount++;
                            var checked = pade.activeUrl == urls[i] ? "checked" : "";
                            pdfHtml += '<div title="' + urlName + '" class="mediaItem"><input name="info_url" class="info_active_url" ' + checked + ' type="radio" value="' + urls[i] + '"/>&nbsp;' + urlName + '</div>';

                        }
                        else {
                            appsKount++;
                            var checked = pade.activeUrl == urls[i] ? "checked" : "";
                            appsHtml += '<div title="' + urlName + '" class="mediaItem"><input name="info_url" class="info_active_url" ' + checked + ' type="radio" value="' + urls[i] + '"/>&nbsp;' + urlName + '</div>';
                        }
                    }
                }

                if (h5pCount) h5pCount.innerHTML = h5pKount;
                if (pdfCount) pdfCount.innerHTML = pdfKount;
                if (appsCount) appsCount.innerHTML = appsKount;

                var htmlArray = [{html: h5pHtml, ele: h5pDetail}, {html: pdfHtml, ele: pdfDetail}, {html: appsHtml, ele: appsDetail}];

                for (var i = 0; i < htmlArray.length; i++)
                {
                    if (htmlArray[i].ele)
                    {
                        var element = newElement('div', null, htmlArray[i].html);
                        htmlArray[i].ele.insertAdjacentElement('afterEnd', element);

                        element.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();

                            var activeUrls = document.getElementsByClassName("info_active_url");

                            for (var k=0; k<activeUrls.length; k++)
                            {
                                console.debug("createMylinks click", activeUrls[k].value, activeUrls[k].checked);

                                if (activeUrls[k].checked)
                                {
                                    if (activeUrls[k].value.indexOf("/h5p/") > -1)
                                    {
                                        pade.activeH5p = activeUrls[k].value;
                                    }
                                    else {
                                        pade.activeUrl = activeUrls[k].value;
                                    }
                                }
                            }
                        });
                    }
                }

            }
        }
    }

    function createBroadcastEndpoints(jid, id) {
        console.debug("createBroadcastEndpoints", jid, id);

        _converse.connection.sendIQ($iq({type: 'get', to: "broadcast." + _converse.connection.domain}).c('query', {xmlns: "http://jabber.org/protocol/disco#items"}).tree(), function(resp)
        {
            const count = document.getElementById(id + "-broadcast-count");
            const detail = document.getElementById(id + "-broadcast-details");
            const items = resp.querySelectorAll('item');

            if (count && detail)
            {
                count.innerHTML = items.length;

                for (let i=0; i<items.length; i++)
                {
                    const jid = items[i].getAttribute('jid');
                    const name = Strophe.getNodeFromJid(jid);

                    console.debug('createBroadcastEndpoints', jid, name);

                    const html = '<li title="' + jid + '">' + name + '</li>';
                    const element = newElement('div', null, html);

                    element.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        console.debug("createBroadcastEndpoints click", evt.target.title);
                        _converse.api.chats.open(evt.target.title, {'bring_to_foreground': true}, true);
                    });

                    detail.insertAdjacentElement('afterEnd', element);
                }
            }

        }, function (error) {
             console.warn("Broadcast plugin not available");
        });
    }	
	
    function createContentSummary(view, jid, id)   {
        console.debug("createContentSummary", jid, id);

        if (chrome.storage) {
            let pinned = {};

            chrome.storage.local.get('pinned', function(data)
            {
                console.debug('chrome.storage get pinned', data);

                if (data && data.pinned) pinned = data.pinned;
                const keys = Object.getOwnPropertyNames(pinned);
                const count = document.getElementById(id + "-pinned-count");
                const detail = document.getElementById(id + "-pinned-details");

                if (detail && count && keys.length > 0)
                {
                    let counter = 0;

                    for (let i=0; i<keys.length; i++)
                    {
                        const item = pinned[keys[i]];

                        if (item.from == jid)
                        {
                            detail.insertAdjacentElement('afterEnd', newPinnedItemElement('li', item, "mediaItem"));
                            counter++;
                        }
                    }
                    count.innerHTML = counter;
                }

            });

            const feedId = 'feed-' + id;

            chrome.storage.local.get(feedId, function(data)
            {
                console.debug('chrome.storage get feed', data);

                if (data && data[feedId])
                {
                    const keys = Object.getOwnPropertyNames(data[feedId]);
                    const count = document.getElementById(id + "-feed-count");
                    const detail = document.getElementById(id + "-feed-details");

                    if (detail && count && keys.length > 0)
                    {
                        let counter = 0;

                        for (let i=0; i<keys.length; i++)
                        {
                            detail.insertAdjacentElement('afterEnd', newFeedItemElement('li', data[feedId][keys[i]], "mediaItem", id, view));
                            counter++;
                        }
                        count.innerHTML = counter;
                    }
                }

            });
        }
    }

    function newTopicItemElement(item, className, id, view)  {
        console.debug('newTopicItemElement', item);
        // {author: author, text: text}

        const topicId = "topic-" + id;
        const count = window.chatThreads[topicId][item.text] != undefined && item.text != "All Topics" ? window.chatThreads[topicId][item.text] : "";
        let checked = window.chatThreads[topicId].topic ? window.chatThreads[topicId].topic == item.text : item.text == "All Topics";

        item.ele = document.createElement("div");
        item.ele.title = "topic " + item.text + " set by " + item.author + " (" + count + ")";
        item.ele.id = "topic-div-" + id;
        item.ele.innerHTML = '<input name="topic-selection" class="topic-radio-button" type="radio" ' + (checked ? "checked" : "" )+ ' value="' + item.text + '"/>&nbsp;' + item.text + '<span style="float: right;">' + count + '</span><br/>';
        item.ele.classList.add(className);
        document.body.appendChild(item.ele);

        item.ele.addEventListener('click', function(evt)
        {
            console.debug("topic item clicked", evt.target.value, evt.target.checked);

            if (evt.target.value && evt.target.checked)
            {
                let targetValue = evt.target.value;

                if (evt.target.value == "All Topics")
                {
                     window.chatThreads[topicId].topic = undefined;
                     view.model.set("thread", undefined);
                     targetValue = undefined;
                }
                else {
                    if (!window.chatThreads[topicId])
                    {
                        window.chatThreads[topicId] = {topic: evt.target.value};
                        window.chatThreads[topicId][evt.target.value] = 0;
                    }

                    window.chatThreads[topicId].topic = evt.target.value;
                    view.model.set("thread", evt.target.value);
                }

                chrome.storage.local.get(topicId, function(obj)
                {
                    if (obj[topicId]) obj[topicId].thread = targetValue;

                    chrome.storage.local.set(obj, function() {
                        console.debug("active subject set",targetValue, id, obj);

                        const jid = view.model.get("jid");
                        view.close();
                        setTimeout(function() { _converse.api.rooms.open(jid)});
                    });
                });
            }
        });

        return item.ele;
    }

    function newPinnedItemElement(el, item, className) {
        console.debug('newPinnedItemElement', item);
        // {from: from, msgId: msgId, message: pinnedMessage, nick : nick}

        item.ele = document.createElement(el);
        item.ele.name = item.msgId;
        item.ele.title = item.message;
        item.ele.innerHTML = item.message;
        item.ele.classList.add(className);
        document.body.appendChild(item.ele);

        item.ele.addEventListener('click', function(evt)
        {
            evt.stopPropagation();
            console.debug("pinned item clicked", evt.target.name, evt.target.title);
			
			const elmnt = document.querySelector('[data-msgid="' + evt.target.name + '"]');			
            if (elmnt) elmnt.scrollIntoView({block: "end", inline: "nearest", behavior: "smooth"});
        });

        return item.ele;
    }

    function newFeedItemElement(el, item, className, id, view) {
        console.debug('newFeedItemElement', item, id);
        // {url: url, title: title}

        item.ele = document.createElement(el);

        item.ele.setAttribute("data-id", id);
        item.ele.setAttribute("data-url", item.url);

        item.ele.title = item.title;
        item.ele.innerHTML = item.url;
        item.ele.classList.add(className);
        document.body.appendChild(item.ele);

        item.ele.addEventListener('click', function(evt)
        {
            evt.stopPropagation();

            const id = evt.target.getAttribute("data-id");
            const url = evt.target.getAttribute("data-url");

            console.debug("feed item clicked", id, url);

            if (confirm("Do you wish to remove feed " + evt.target.title + "\n" + url))
            {
                const feedId = 'feed-' + id;

                chrome.storage.local.get(feedId, function(data)
                {
                    if (data && data[feedId] && data[feedId][url])
                    {
                        delete data[feedId][url]

                        chrome.storage.local.set(data, function(data)
                        {
                            console.debug("feed stored ok", feedId, data);

                            view.showHelpMessages(["Feed " + evt.target.title + " removed"]);
                            view.viewUnreadMessages();
                            view.clearMessages();
                            view.close();

                            setTimeout(function() {_converse.api.rooms.open(view.model.get("jid"))});
                        });
                    }
                });
            }

        });

        return item.ele;
    }

    function createMediaContentSummary(jid, id) {
        const media = {meetings:{rooms:[]}, recordings:{urls:[]}, photo:{urls:[]}, video:{urls:[]}, link:{urls:[]}, vmsg:{urls:[]}, ppt:{urls:[]}};

        console.debug("createMediaContentSummary", jid, id);

        _converse.api.archive.query({before: '', max: 999, 'groupchat': true, 'with': jid}).then(function(result) {
            const messages = result.messages;
            console.debug("createMediaContentSummary - query", messages);

            for (let i=0; i<messages.length; i++)
            {
                var body = messages[i].querySelector('body');
                var attachTo = messages[i].querySelector('attach-to');
                var msgId = messages[i].querySelector('forwarded').querySelector('message').getAttribute('id');
                var from = messages[i].querySelector('forwarded').querySelector('message').getAttribute('from').split("/")[1];

                var timestamp = undefined;
                var delay = messages[i].querySelector('forwarded').querySelector('delay');
                if (delay) timestamp = delay.getAttribute('stamp');
                var stamp = dayjs(timestamp).format('MMM DD YYYY HH:mm:ss');

                //console.debug("archived msg", i, from, body, msgId);

                if (body)
                {
                    if (attachTo) resetReactions(body, attachTo);

                    var str = body.innerHTML;
                    var urls = str.match(/((http|https|ftp)?:\/\/[^\s]+)/g);

                    if (urls && urls.length > 0)
                    {
                        for (var j=0; j<urls.length; j++)
                        {
                            var pos = urls[j].lastIndexOf("/");
                            var file = urls[j].substring(pos + 1);

                            console.debug("media", i, j, from, file, urls[j]);

                            if (isAudioMeetingURL(urls[j]))
                            {
                                file = file.substring(file.indexOf(".") + 1);
                                media.recordings.urls.push({timestamp: stamp, id: msgId, url: urls[j], file: file, from: from, type: "audio"});
                            }
                            else

                            if (isVideoMeetingURL(urls[j]))
                            {
                                file = file.substring(file.indexOf(".") + 1);
                                media.recordings.urls.push({timestamp: stamp, id: msgId, url: urls[j], file: file, from: from, type: "video"});
                            }
                            else

                            if (isAudioURL(file))
                            {
                                media.vmsg.urls.push({timestamp: stamp, id: msgId, url: urls[j], file: file, from: from, type: "audio"});
                            }
                            else

                            if (isImageURL(file))
                            {
                                media.photo.urls.push({timestamp: stamp, id: msgId, url: urls[j], file: file, from: from, type: "image"});
                            }
                            else

                            if (isVideoURL(file))
                            {
                                media.video.urls.push({timestamp: stamp, id: msgId, url: urls[j], file: file, from: from, type: "video"});
                            }
                            else

                            if (isOpenOfficeDoc(file))
                            {
                                media.ppt.urls.push({timestamp: stamp, id: msgId, url: urls[j], file: file, from: from, type: "odf"});
                            }
                            else

                            if (isOnlyOfficeDoc(file))
                            {
                                media.ppt.urls.push({timestamp: stamp, id: msgId, url: urls[j], file: file, from: from, type: "doc"});
                            }
                            else

                            if (isH5p(urls[j]))
                            {
                                media.ppt.urls.push({timestamp: stamp, id: msgId, url: urls[j], file: file, from: from, type: "h5p"});
                            }
                            else

                            if (isMeeting(urls[j]))
                            {
                                media.meetings.rooms.push({timestamp: stamp, id: msgId, url: urls[j], room: file, from: from, recordings: []});
                            }

                            else {
                                media.link.urls.push({timestamp: stamp, id: msgId, url: urls[j], file: urls[j], from: from, type: "link"});
                            }
                        }
                    }
                }
            }

            if (getSetting("postVideoRecordingUrl", false))
            {
                renderMeeting(id, media.meetings.rooms);

                for (var z=0; z<media.meetings.rooms.length; z++)
                {
                    renderMedia(id, media.meetings.rooms[z].room, media.recordings.urls, true);
                }
            }

            renderMedia(id, "vmsg", media.vmsg.urls);
            renderMedia(id, "photo", media.photo.urls);
            renderMedia(id, "video", media.video.urls);
            renderMedia(id, "ppt", media.ppt.urls);
            renderMedia(id, "link", media.link.urls);

            console.debug("media", media);

        }).catch(function (err) {
            console.error("createMediaContentSummary", err);
            alert("Timeout error fetching archived messages");
        });
    }

    function resetReactions(body, attachTo) {
        if (body.innerHTML.indexOf(":thumbsup:") > -1 || body.innerHTML.indexOf(":thumbsdown:") > -1)
        {
            const attachId = attachTo.getAttribute("id");
            const reaction = body.innerHTML.indexOf(":thumbsdown:") > -1 ? "dislike" : "like";

            if (chrome.storage && attachId)
            {
                chrome.storage.local.get(attachId, function(obj)
                {
                    if (!obj[attachId]) obj[attachId] = {};
                    if (!obj[attachId][reaction]) obj[attachId][reaction] = 0;

                    obj[attachId][reaction]++;

                    console.debug("info plugin - attach-to", attachId, reaction, obj[attachId][reaction]);
                    chrome.storage.local.set(obj);
                });
            }
        }
    }
    
	function isH5PURL(url)  {
      const filename = url.toLowerCase();
      return filename.indexOf("/h5p/") > -1
    };

    function isAudioMeetingURL(url)    {
      const filename = url.toLowerCase();
      return filename.indexOf("/ofmeet-cdn/recordings/") > -1 && filename.endsWith(".audio.webm");
    };

    function isVideoMeetingURL(url)     {
      const filename = url.toLowerCase();
      return filename.indexOf("/ofmeet-cdn/recordings/") > -1 && filename.endsWith(".video.webm");
    };

    function isMeeting(url)  {
      const ofmeetUrl = getSetting("ofmeetUrl", null);
      const filename = url.toLowerCase();
      return ofmeetUrl && filename.indexOf(ofmeetUrl) > -1
    };

    function isPDFURL(url)   {
      const filename = url.toLowerCase();
      return filename.endsWith('.pdf');
    };

    function isAudioURL(url) {
      const filename = url.toLowerCase();
      return filename.endsWith('.ogg') || filename.endsWith('.mp3') || filename.endsWith('.m4a');
    };

    function isImageURL(url) {
      const filename = url.toLowerCase();
      return filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png') || filename.endsWith('.gif') || filename.endsWith('.bmp') || filename.endsWith('.tiff') || filename.endsWith('.svg');
    };

    function isVideoURL(url)    {
      const filename = url.toLowerCase();
      return filename.endsWith('.mp4') || filename.endsWith('.webm') || filename.endsWith('.tgs') || filename.endsWith('.json');
    };

    function isOpenOfficeDoc(url)    {
        let openOfficeDoc = false;
        const pos = url.lastIndexOf(".");

        if (pos > -1)
        {
            const exten = url.substring(pos + 1);
            openOfficeDoc = "odt ods odp".indexOf(exten) > -1;
        }
        return openOfficeDoc;
    };

    function isOnlyOfficeDoc(url) {
        var onlyOfficeDoc = false;
        var pos = url.lastIndexOf(".");

        if (pos > -1)
        {
            var exten = url.substring(pos + 1);
            onlyOfficeDoc = "doc docx ppt pptx xls xlsx csv".indexOf(exten) > -1;
        }
        return onlyOfficeDoc;
    };

    function isH5p(url) {
        return url.indexOf("/h5p/") > -1;
    };

    function sortUrls(a,b) {
        if ( a.file < b.file )
            return -1;
        if ( a.file > b.file )
            return 1;
        return 0;
    };

    function newItemElement(el, item, className) {
        item.ele = document.createElement(el);
        item.ele.setAttribute('data-msgid', item.id);
        item.ele.setAttribute('data-from', item.from);
        item.ele.setAttribute('data-url', item.url);
        item.ele.setAttribute('data-timestamp', item.timestamp);
        item.ele.setAttribute('data-type', item.type);
        item.ele.title = item.from + ' ' + item.timestamp + ': ' + item.file;
        item.ele.innerHTML = item.file || item.url;
        item.ele.classList.add(className);
        document.body.appendChild(item.ele);

        item.ele.addEventListener('click', function(evt)
        {
            evt.stopPropagation();

            const type = evt.target.getAttribute('data-type');
            const url = evt.target.getAttribute('data-url');
            const msgId = evt.target.getAttribute('data-msgid');
            const timestamp = evt.target.getAttribute('data-timestamp');
            const from = evt.target.getAttribute('data-from');

            console.debug("media item clicked", type, url, msgId);

            var elmnt = document.getElementById("msg-" + msgId);
            if (elmnt) elmnt.scrollIntoView({block: "end", inline: "nearest", behavior: "smooth"});

            if (type == "image" || type == "audio" || type == "video")
            {
                previewDialog = new PreviewDialog({'model': new converse.env.Model({url: url, type: type, timestamp: timestamp, from: from}) });
                previewDialog.show();
            }
            else

            if (type == "link")
            {
                window.open(url, "pade-media-link");
            }
            else

            if (type == "odf")
            {
                const username = getSetting("username");
                const password = getSetting("password");
                const name = getSetting("displayname");
                const domain = getSetting("domain");
                const avatar = "data:" + _converse.xmppstatus.vcard.get("image_type") + ";base64," + _converse.xmppstatus.vcard.get("image");
                const file = url.substring(url.lastIndexOf("/") + 1);
                const bosh = "wss://" + getSetting("server") + "/ws/";

                const query = `audio=true&trace=true&pwd=${password}&username=${username}&name=${name}&avatar=${avatar}&docurl=${url}&docname=${file}&domain=${domain}&bosh=${bosh}`;
                openWebAppsWindow(chrome.extension.getURL("akowe/index.html?" + query), null, 1400, 900);
            }
            else {  // insert into textarea
                replyInverseChat(url);
            }

        });

        return item.ele;
    }

    function renderMedia(id, eleName, urls, check) {
        urls = urls.sort(sortUrls);

        var count = document.getElementById(id + "-" + eleName + "-count");
        var detail = document.getElementById(id + "-" + eleName + "-details");

        if (detail && count && urls.length > 0)
        {
            var total = 0;

            urls.forEach(function(element)
            {
                if (!check || (check && element.url.indexOf(eleName) > -1)) // find specific meeting div
                {
                    validateUrl(element, function(url)
                    {
                        if (url)
                        {
                            total++;
                            count.innerHTML = total;
                            detail.insertAdjacentElement('afterEnd', newItemElement('li', url, "mediaItem"));
                        }
                    });
                }
            });
        }
    }

    function validateUrl(url, callback) {
        //console.debug("validateUrl check", url);

		try {
			fetch(url.url).then(function(response)
			{
				if (response.ok)
				{
					callback(url);
					console.debug("validateUrl check ok", url);
				} else {
					callback();
				}
			}).catch(function (err) {
				//console.error("validateUrl err", err);				
				callback();
			});
		} catch (e) {
			//console.error("validateUrl err", e);				
			callback();			
		}	
    }

    function renderMeeting(id, meetings) {
        meetings = meetings.sort(sortUrls);
        var summary = document.getElementById(id + "-meeting-recordings");

        if (summary && meetings.length > 0)
        {
            for (var i=0; i<meetings.length; i++)
            {
                summary.insertAdjacentElement('afterEnd', newMeetingElement(id, meetings[i]));
            }
        }
    }

    function newMeetingElement(id, item) {
        item.ele = document.createElement("details");
        item.ele.title = item.url;
        item.ele.innerHTML = '<summary id="' + id + '-' + item.room + '-details">' + item.room + ' (<span id="' + id + '-' + item.room + '-count">0</span>)<span style="float: right;" class="fa fa-video fas fa-microphone"/></summary>';
        document.body.appendChild(item.ele);
        return item.ele;
    }

    function hideElement(el) {
        return addClass("hiddenx", el);
    }

    function addClass(className, el) {
      if (el instanceof Element)
      {
        el.classList.add(className);
      }
      return el;
    }

	function newElement(el, id, html, className) {
		const ele = document.createElement(el);
		if (id) ele.id = id;
		if (html) ele.innerHTML = html;
		if (className) ele.classList.add(className);
		document.body.appendChild(ele);
		return ele;
	}
    
	function removeClass(className, el)  {
      if (el instanceof Element)
      {
        el.classList.remove(className);
      }
      return el;
    }
	
	function injectMessage(model, title, body, json) {
		const msgid = 'inject-' + Math.random().toString(36).substr(2,9);
		const type = model.get("type") == "chatbox" ? "chat" : "groupchat";
		const from = model.get("jid");

		let attrs = {json, body, message: body, id: msgid, origin_id: msgid, msgid, type, from: _converse.jid, is_unstyled: false, references: []}; 
		
		if (type == "groupchat") {
			attrs = {json, body, message: body, id: msgid, origin_id: msgid, msgid, type, from_muc: from, from: from + '/' + title, nick: title, is_unstyled: false, references: []};  
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
		
		if (command == "wiki")
		{
			if (args.length > 0)
			{
				fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + text.slice(('/' + command).length + 1).trim(), {method: "GET"}).then(function(response){if (!response.ok) throw Error(response.statusText); return response.json()}).then(function(json)
				{
					console.debug('wikipedia ok', json);
					const body = "## " + json.displaytitle + '\n' + (json.thumbnail ? json.thumbnail.source : "") + '\n\n' + (json.type == "standard" ? json.extract : json.description) + '\n' + json.content_urls.desktop.page;					
					injectMessage(model, 'Wikipedia', body, json);
					
					if (json.type == "standard")
					{
						navigator.clipboard.writeText(body).then(function() {
							console.debug('wikipedia clipboard ok');
						}, function(err) {
							console.error('wikipedia clipboard error', err);
						});
					}

				}).catch(function (err) {
					console.error('wikipedia error', err);
				});
			} else {
				alert("Missing topic or subject", "Try /wiki xmpp");				
			}
			
			return true;			
		}
		else
			
		if (command === "feed" && model.get("type") == "chatroom")
		{
			if (args.length != 1)
			{
				alert("Missing Feed URL", "Try /feed http://feeds.bbci.co.uk/news/rss.xml");
				return true;
			}

			const id = model.get("box_id");
			const feedId = 'feed-' + id;

			chrome.storage.local.get(feedId, function(data)
			{
				if (!data) data = {};
				if (!data[feedId]) data[feedId] = {};

				var feed = {path: args[0], url: chrome.pade  ? (getSetting("domain") == "localhost" || location.protocol == "http:" ? "http://" : "https://") + getSetting("server") + "/pade/download?url=" + args[0] : args[0]};

				fetch(feed.url).then(function(response)
				{
					if (response.ok)
					{
						return response.text().then(function(body)
						{
							var parser = new RSSParser(feed);
							parser.setResult(body);

							parser.parse(function(parser)
							{
								data[feedId][feed.path] = {url: feed.path, title: feed.title};

								chrome.storage.local.set(data, function(data)
								{
									console.debug("feed stored ok", feedId, data);
									alert("stored feed " + feed.title);
								});
							});
						});
					} else {
						alert("Bad Feed URL \n" + feed.path);
						console.error("RSSParser", response)
					}
				}).catch(function (err) {
					alert("Cannot fetch Feed URL \n" + feed.path);
					console.error("RSSParser", err)
				});
			});

			return true;
		}
		else

		if (command === "clearpins") {
			var id = model.get("box_id");
			var jid = model.get("jid");

			chrome.storage.local.get('pinned', function(data)
			{
				console.debug('chrome.storage get', data);

				let pinned = {};
				if (data && data.pinned) pinned = data.pinned;
				const keys = Object.getOwnPropertyNames(pinned);

				for (var i=0; i<keys.length; i++)
				{
					const item = pinned[keys[i]];
					if (item.from == jid) delete pinned[keys[i]];
				}

				chrome.storage.local.set({pinned: pinned}, function() {
				  console.debug('chrome.storage is set for pinned', pinned);
				});
			});

			return true;
		}
		else

		if (command === "troff" && getSetting("enableTranslation", false))
		{
			const id = model.get("box_id");
			const tronId = 'translate-' + id;

			chrome.storage.local.remove(tronId, function(obj)
			{
				console.debug("translation removed ok", obj);
				alert("Translation disabled");
			});
			return true;
		}
		else
			
		if (command === "tron" && getSetting("enableTranslation", false))
		{
			const id = model.get("box_id");
			const tronId = 'translate-' + id;

			if (args.length < 2)
			{
				alert("Use as /tron <source> <target>\n\n<source> and <target> can be a valid language code like any of these en, de, es, fr, it, nl, pt, ja, ko, zh-CN");
				return true;
			}

			let data = {};
			data[tronId] = {source: args[0], target: args[1]};

			chrome.storage.local.set(data, function(obj)
			{
				console.debug("translation saved ok", obj);

				alert("Translation enabled for " + args[0] + " to " + args[1]);
			});

			return true;

		}		

		return false;
	}		
}));
