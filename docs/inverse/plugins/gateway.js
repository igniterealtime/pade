(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var rssInterval, htmlTemp = {};
    var Strophe, dayjs

    converse.plugins.add("gateway", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            Strophe = converse.env.Strophe;
            dayjs = converse.env.dayjs;

            _converse.api.listen.on('chatBoxInsertedIntoDOM', function (view)
            {
                if (getSetting("enableRssFeeds", false))
                {
                    var jid = view.model.get("jid");
                    var type = view.model.get("type");
                    console.debug("gateway chatBoxInsertedIntoDOM", jid, type);

                    if (jid === "rss@pade." + _converse.connection.domain)
                    {
                        if (getSetting("showRssToolbar", false)) {
                            view.el.querySelector('.chat-textarea').setAttribute("disabled", "true");
                        } else {
                            view.el.querySelector('.bottom-panel').style.display = "none";
                        }
                        rssChatCheck();
                    }
                    else

                    if (type == "chatroom")
                    {
                        setTimeout(function() {rssGroupChatCheck(view)}, 10000);
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
        },

        overrides: {

            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    const sender = this.model.get("sender");
                    const from = this.model.get("from");

                    if (from == "rss@pade." + _converse.connection.domain && sender == "me")
                    {
                        return false;
                    }

                    await this.__super__.renderChatMessage.apply(this, arguments);

                    if (getSetting("showRssSummary", false))
                    {
                        var messageDiv = this.el.querySelector('.chat-msg__text');
                        var msgId = this.model.get("msgid");
                        var html = htmlTemp[msgId];

                        if (messageDiv && html)
                        {
                            console.debug("renderChatMessage", msgId, html);
                            messageDiv.innerHTML = html;
                            //delete htmlTemp[msgId];
                        }
                    }
                }
            },

            ChatBoxView: {

            }
        }
    });

    var rssRefresh = function()
    {
        rssChatCheck();

        _converse.chatboxviews.model.models.forEach(function(view)
        {
            if (view.get('type') === "chatroom")
            {
                rssGroupChatCheck(_converse.chatboxviews.views[view.id]);
            }
        });
    }

    function rssChatCheck()
    {
        var rssUrls = getSetting("rssAtomFeedUrls", "").split("\n");
        console.debug("rssChatCheck", rssUrls);

        rssCheckEach(false, rssUrls, "rss-feed-", function(msgId, body, title, delay)
        {
           return '<message id="' + msgId + '" type="chat" to="' + _converse.connection.jid + '" from="' + "rss@pade." + _converse.connection.domain + '"><body>' + body + '</body><origin-id xmlns="urn:xmpp:sid:0" id="' + msgId + '"/>' + delay + '</message>';
        });
    }

    function rssGroupChatCheck(view)
    {
        const id = view.model.get("box_id");
        const jid = view.model.get("jid")
        const feedId = 'feed-' + id;

        chrome.storage.local.get(feedId, function(data)
        {
            if (data && data[feedId])
            {
                const rssUrls = Object.getOwnPropertyNames(data[feedId]);
                console.debug("rssGroupChatCheck", feedId, rssUrls);

                rssCheckEach(true, rssUrls, "rss-feed-" + id + "-", function(msgId, body, title, delay)
                {
                   return '<message id="' + msgId + '" type="groupchat" to="' + _converse.connection.jid + '" from="' + jid + '/' + title + '"><body>' + body + '</body><origin-id xmlns="urn:xmpp:sid:0" id="' + msgId + '"/>' + delay + '</message>';
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
                path: chrome.pade ? "https://" + getSetting("server") + "/pade/download?url=" + rssUrl : rssUrl
            }

            fetch(feed.path).then(function(response)
            {
                console.debug("RSSParser", feed, response)

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
                                console.debug("rssCheckEach pre", post.title, post);

                                var stamp = " - " + dayjs(post.published_from_feed).format('MMM DD YYYY HH:mm:ss');
                                var delay = "";

                                if (getSetting("useRssDate", false) == false)
                                {
                                    var delayStamp = dayjs(post.published_from_feed).format('YYYY-MM-DDTHH:mm:ssZ');
                                    delay = "<delay xmlns='urn:xmpp:delay' from='" + _converse.connection.domain + "' stamp='" + delayStamp + "'/>";
                                    stamp = "";
                                }

                                var msgId = prefix + btoa(post.guid);

                                if (post.title && post.title.trim() != "")
                                {
                                    var body = post.title + "\n" + (groupChat ? stamp : feed.title + stamp);
                                    htmlTemp[msgId] = "<b><a target='_blank' href='" + post.link + "'>" + post.title + "</a></b>" + (groupChat ? stamp : feed.title + stamp);

                                    if (getSetting("showRssSummary", false))
                                    {
                                        body = body + '\n' + clipboard2Markdown.convert(post.summary);
                                        htmlTemp[msgId] = htmlTemp[msgId] + "<br/>" + post.summary.replace(/<a /g, '<a target=_blank ');
                                    }
                                    body = body + '\n' + post.link;
                                    htmlTemp[msgId] = htmlTemp[msgId] + "<p/><a target='_blank' href='" + post.link + "'>" + post.link + "</a>";

                                    console.debug("rssCheckEach post", body);
                                    var msgDiv = document.getElementById("msg-" + msgId);

                                    if (!msgDiv && callback)
                                    {
                                        _converse.connection.injectMessage(callback(msgId, body, feed.title, delay));
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
