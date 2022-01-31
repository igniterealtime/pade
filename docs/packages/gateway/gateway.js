(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var rssInterval;
    var Strophe, dayjs

    converse.plugins.add("gateway", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            Strophe = converse.env.Strophe;
            dayjs = converse.env.dayjs;

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
				const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));	

				if (chatview && chatview.model.get("type") === "chatbox" && chatview.model.get("jid") == "rss@pade." + _converse.connection.domain) {				
					let form = chatview.getMessageForm();
					
					if (form) {
						form.onFormSubmitted = async (ev) => {
							ev.stopPropagation();
							const textarea = form.querySelector('.chat-textarea');
							const message_text = textarea.value.trim();
							textarea.value = '';					
							textarea.focus();
							console.log("gateway - typed text " + message_text);
						}
					}
				}
				
                return buttons;
            });
			
            _converse.api.listen.on('beforeMessageBodyTransformed', function(text)
            {	
				if (text.startsWith("RSS:")) {					
					text.addTemplateResult(0, text.length, html([text.substr(4)]));
				}
            });

            _converse.api.listen.on('chatRoomViewInitialized', function (view)
            {
				rssGroupChatCheck(view)
			});
			
            _converse.api.listen.on('chatBoxViewInitialized', function (view)
            {
                if (getSetting("enableRssFeeds", false))
                {
                    var jid = view.model.get("jid");
                    var type = view.model.get("type");
                    console.debug("chatBoxViewInitialized", jid, type);

                    if (jid === "rss@pade." + _converse.connection.domain)
                    {
                        if (getSetting("showRssToolbar", false)) {
							const textarea = view.querySelector('.chat-textarea')
                            if (textarea) textarea.setAttribute("disabled", "true");
                        } else {
                            view.querySelector('.bottom-panel').style.display = "none";
                        }
                        rssChatCheck();
                    }
                }
            });

            _converse.api.listen.on('connected', function()
            {
                _converse.connection.injectedMessage = function(element)
                {
                    console.debug("gateway injected message", element);

                    const id = element.getAttribute("id");
                    const xmlns = element.getAttribute("xmlns");
                    const to = element.getAttribute("to");
                    const query = element.querySelector("query");

                    if (query && query.getAttribute("xmlns") == "urn:xmpp:mam:2")
                    {
                        _converse.connection.injectMessage(`<iq type="result" id="${id}" to="${_converse.connection.jid}"/><fin xmlns="urn:xmpp:mam:2"><set xmlns="http://jabber.org/protocol/rsm"></set></fin>`);
                    }

                    if (to == "rss@pade." + _converse.connection.domain)
                    {

                    }
                }

                _converse.api.waitUntil('rosterContactsFetched').then(() => {

                    if (getSetting("enableRssFeeds", false))
                    {
                        window.addEventListener("unload", function ()
                        {
                            console.debug("gateway unloading all feed refreshing");

                            if (rssInterval) clearInterval(rssInterval);
                        });

                        var rssFeedCheck = getSetting("rssFeedCheck", 10) * 60000;
                        rssInterval = setInterval(rssRefresh, rssFeedCheck);

                        openChat("rss@pade." + _converse.connection.domain, getSetting("rssFeedTitle", "RSS Feed"), ["Bots"]);
                    }
                });
            });

            console.log("gateway plugin is ready");
        }
    });		

    var rssRefresh = function()
    {
        rssChatCheck();

        _converse.chatboxes.models.forEach(function(model)
        {
			const view = _converse.chatboxviews.views[model.id];
			
            if (model.get('type') === "chatroom" && view)
            {
                rssGroupChatCheck(view);
            }
        });
    }

    function rssChatCheck()
    {
		const from = "rss@pade." + _converse.connection.domain;
		const summary = getSetting("showRssSummary");
        var rssUrls = getSetting("rssAtomFeedUrls", "").split("\n");
        console.debug("rssChatCheck", rssUrls, summary, from);

        rssCheckEach(false, rssUrls, "rss-feed-chat-", async(msgId, html, title, delay) =>  {	
			const message = 'RSS:' + html;			
			const attrs = {message, body: message, id: msgId, msgId, type: 'chat', from, time: delay};  
			chatbox = await _converse.api.chats.get(from, {}, true);
			await (chatbox === null || chatbox === void 0 ? void 0 : chatbox.queueMessage(attrs));
        });
    }

    function rssGroupChatCheck(view)
    {
		const summary = getSetting("showRssSummary");		
        const id = view.model.get("box_id");
        const from = view.model.get("jid")
        const feedId = 'feed-' + id;

        console.debug("rssGroupChatCheck", feedId, from, summary, view.model);

        chrome.storage.local.get(feedId, function(data)
        {
            if (data && data[feedId])
            {
                const rssUrls = Object.getOwnPropertyNames(data[feedId]);
                console.debug("rssGroupChatCheck", feedId, rssUrls, summary);

                rssCheckEach(true, rssUrls, "rss-feed-muc-", async (msgId, html, title, delay) => {
					const message = 'RSS:' + html;					
					const attrs = {message, body: message, id: msgId, msgId, type: 'groupchat', from_muc: from, from: from + '/' + title, nick: title, time: delay};  
					chatbox = await _converse.api.rooms.get(from, {}, true);
					//console.debug("rssGroupChatCheck", chatbox, attrs);
					await (chatbox === null || chatbox === void 0 ? void 0 : chatbox.queueMessage(attrs));					
                });
            }
        });
    }

    function rssCheckEach(groupChat, rssUrls, prefix, callback)
    {
        rssUrls.forEach(function(rssUrl)
        {
            if (!rssUrl || rssUrl == "") return;

            // when pade.chat (pwa), use proxy servlet in pade openfire plugin to fetch feed URL contents and avoid CORS

            var feed = {
                path: chrome.pade ? (getSetting("domain") == "localhost" || location.protocol == "http:" ? "http://" : "https://") + getSetting("server") + "/pade/download?url=" + rssUrl : rssUrl
            }

            fetch(feed.path).then(function(response)
            {
                //console.debug("RSSParser", feed, response)

                if (response.ok)
                {
                    return response.text().then(function(body)
                    {
                        var parser = new RSSParser(feed);
                        parser.setResult(body);

                        parser.parse(function(parser)
                        {
                            parser.posts.forEach(function(post)
                            {
                                //console.debug("rssCheckEach pre", post.title, post);

                                var stamp = dayjs(post.published_from_feed).format('MMM DD YYYY HH:mm:ss');
                                var delay = dayjs(post.published_from_feed).format('YYYY-MM-DDTHH:mm:ssZ');;

                                var msgId = prefix + btoa(post.guid);

                                if (post.title && post.title.trim() != "")
                                {
                                    let htmlTemp = (groupChat ? stamp : feed.title + " - " + stamp) + "<br/><b><a target='_blank' href='" + post.link + "'>" + post.title + "</a></b>";

                                    if (getSetting("showRssSummary", false))
                                    {
                                        htmlTemp = htmlTemp + "<br/>" + post.summary.replace(/<a /g, '<a target=_blank ');
                                    }
                                    htmlTemp = htmlTemp + "<p/>";

                                    //console.debug("rssCheckEach post", htmlTemp);

                                    if (callback)
                                    {
                                        callback(msgId, htmlTemp, feed.title, delay);									
                                    }
                                }
                            });
                        });
                    });
                } else {
                    console.error("rssCheckEach", response)
                }
            }).catch(function (err) {
                console.error("rssCheckEach", err)
            });
        });
    }
}));
