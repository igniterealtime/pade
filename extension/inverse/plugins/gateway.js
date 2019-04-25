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

    converse.plugins.add("gateway", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

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
                },

                afterShown: function() {

                    var id = this.model.get("box_id");
                    var jid = this.model.get("jid");
                    var type = this.model.get("type");

                    var display_name = this.model.getDisplayName().trim();
                    if (!display_name || display_name == "") display_name = jid;

                    if (jid === "rss@pade." + _converse.connection.domain)
                    {
                        console.debug("afterShown", id, jid, type);
                        rssCheck();
                    }


                    return this.__super__.afterShown.apply(this, arguments);
                }
            }
        }
    });

    function rssCheck()
    {
        var rssUrls = getSetting("rssAtomFeedUrls", "").split("\n");

        rssUrls.forEach(function(rssUrl)
        {
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

                                if (!msgDiv && post.title && post.title.trim() != "")
                                {
                                    var body = "### " + post.title + "\n" + feed.title + " - " + stamp;

                                    if (getSetting("showRssSummary", false))
                                    {
                                        body = body + '\n' + clipboard2Markdown.convert(post.summary)
                                    }
                                    body = body + '\n' + post.link;

                                    console.debug("rssCheck post", body);

                                    _converse.connection.injectMessage('<message id="' + msgId + '" type="chat" to="' + _converse.connection.jid + '" from="' + "rss@pade." + _converse.connection.domain + '"><body>' + body + '</body><origin-id xmlns="urn:xmpp:sid:0" id="' + msgId + '"/></message>');
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
