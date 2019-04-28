(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
    var Strophe = converse.env.Strophe;
    var moment = converse.env.moment;
    var feedInterval;
    var htmlTemp = {};

    converse.plugins.add("gateway", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            _converse.api.listen.on('renderToolbar', function(view)
            {
                console.debug('gateway - renderToolbar', view.model);

                var jid = view.model.get("jid");

                if (jid === "rss@pade." + _converse.connection.domain)
                {
                    rssCheck();
                }
            });

            console.log("gateway plugin is ready");
        },

        'overrides': {
            onConnected: function () {
                var _converse = this;

                Promise.all([_converse.api.waitUntil('rosterContactsFetched'), _converse.api.waitUntil('chatBoxesFetched'), _converse.api.waitUntil('bookmarksInitialized')]).then(() =>
                {
                    _converse.connection.injectedMessage = function(element)
                    {
                        console.debug("gateway injected stanza handler", element);

                        // echo test
                        // const elem = new DOMParser().parseFromString("<iq type='set'><query xmlns='jabber:iq:roster'><item jid='newsfeed@pade.desktop-545pc5b' subscription='both'  name='News Feed'><group>Bots</group></item></query></iq>", "text/xml").documentElement;
                        // _converse.connection.sendIQ(elem, callback, errorback);
    /*
                        if (typeof element.getAttribute === "function")
                        {
                            const from = element.getAttribute("from");
                            const to = element.getAttribute("to");
                            const body = element.querySelector('body') ? element.querySelector('body').innerHTML : "";

                            _converse.connection.injectMessage('<message type="chat" to="' + from + '" from="' + to + '"><body>' + body + '</body></message>');
                        }
    */
                    }

                    if (getSetting("enableRssFeeds", false))
                    {
                        var feedCheck = getSetting("feedCheck", 10) * 60000;
                        //var feedCheck = 5000;
                        feedInterval = setInterval(rssCheck, feedCheck);

                        var jid = "rss@pade." + _converse.connection.domain;
                        var name = "RSS Feed";

                        _converse.api.chats.open(jid, {fullname: name});

                        if (bgWindow.pade.chatAPIAvailable)
                        {
                            var body = {
                              "jid": jid,
                              "nickname": name,
                              "groups": "RSS",
                            };

                            var url =  "https://" + bgWindow.pade.server + "/rest/api/restapi/v1/meet/friend";
                            var permission =  "Basic " + btoa(bgWindow.pade.username + ":" + bgWindow.pade.password);
                            var options = {method: "POST", headers: {"authorization": permission, "content-type": "application/json"}, body: JSON.stringify(body)};

                            console.debug("fetch create RSS Roster item", url, options);

                            fetch(url, options).then(function(response)
                            {
                                console.log('RSS roster creation ok');
                                _converse.connection.injectMessage('<presence to="' + _converse.connection.jid + '" from="' + jid + '"/>');

                                rssCheck();

                            }).catch(function (err) {
                                console.error('RSS roster creation error', err);
                            });
                        }


                        window.addEventListener("unload", function ()
                        {
                            console.debug("gateway unloading rss feed check");
                            if (feedInterval) clearInterval(feedInterval);
                        });
                    }
                })

                _converse.__super__.onConnected.apply(this, arguments);
            },

            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    await this.__super__.renderChatMessage.apply(this, arguments);

                    if (getSetting("showRssSummary", false))
                    {
                        var messageDiv = this.el.querySelector('.chat-msg__text');
                        var msgId = this.model.get("msgid");
                        var html = htmlTemp[msgId];

                        if (messageDiv && html)
                        {
                            messageDiv.innerHTML = html;
                            delete htmlTemp[msgId];
                        }
                    }
                }
            },

            ChatBoxView: {

                parseMessageForCommands: function(text) {
                    console.debug('gateway - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();

                    if (command === "???")
                    {
                        return true;
                    }
                    else

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                }
            }
        }
    });

    function rssCheck()
    {
        var rssUrls = getSetting("rssAtomFeedUrls", "").split("\n");

        rssUrls.forEach(function(rssUrl)
        {
            if (!rssUrl || rssUrl == "") return;

            var feed = {
                path: rssUrl
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
                                console.debug("rssCheck pre", post.title, post);

                                var stamp = moment(post.published_from_feed).format('MMM DD YYYY HH:mm:ss');
                                var msgId = "rss-feed-" + btoa(post.guid);
                                var msgDiv = document.getElementById("msg-" + msgId);

                                if (post.title && post.title.trim() != "")
                                {
                                    var body = "### " + post.title + "\n" + feed.title + " - " + stamp;
                                    htmlTemp[msgId] = "<h3><a target='_blank' href='" + post.link + "'>" + post.title + "</a></h3>" + feed.title + " - " + stamp;

                                    if (getSetting("showRssSummary", false))
                                    {
                                        body = body + '\n' + clipboard2Markdown.convert(post.summary);
                                        htmlTemp[msgId] = htmlTemp[msgId] + "<br/>" + post.summary;
                                    }
                                    body = body + '\n' + post.link;
                                    htmlTemp[msgId] = htmlTemp[msgId] + "<p/><a target='_blank' href='" + post.link + "'>" + post.link + "</a>";

                                    console.debug("rssCheck post", body);

                                    if (!msgDiv)
                                    {
                                        _converse.connection.injectMessage('<message id="' + msgId + '" type="chat" to="' + _converse.connection.jid + '" from="' + "rss@pade." + _converse.connection.domain + '"><body>' + body + '</body><origin-id xmlns="urn:xmpp:sid:0" id="' + msgId + '"/></message>');
                                    }
                                }
                            });
                        });
                    });
                } else {
                    console.error("RSSParser", response)
                }
            }).catch(function (err) {
                console.error("RSSParser", err)
            });


        });
    }
}));
