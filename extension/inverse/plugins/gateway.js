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

    const beeKeeperUrl = getSetting("beeKeeperUrl", "https://playgroundapi.industrioushive.com");
    var rssInterval, htmlTemp = {}, beekeeper = {};

    converse.plugins.add("gateway", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            if (getSetting("enableBeeKeeper", false))
            {
                const url = beeKeeperUrl + "/accounts.json/login?username=" + getSetting("username") + "&password=" + getSetting("password") + "&key=foobar";

                fetch(url, {method: "GET"}).then(function(response){if (!response.ok) throw Error(response.statusText); return response.json()}).then(function(access)
                {
                    console.debug('beekeeper api access', access);

                    beekeeper.token = access.token;
                    beekeeper.accountId = access.id;

                }).catch(function (err) {
                    console.error('beekeeper api access denied error', err);
                });
            }

            console.log("gateway plugin is ready");
        },

        'overrides': {
            onConnected: function () {
                var _converse = this;

                _converse.api.listen.on('chatRoomOpened', function (view)
                {
                    console.debug("gateway chatRoomOpened", view);
                    rssGroupChatCheck(view);
                    beeKeeperGroupChatCheck(view);
                });

                _converse.api.listen.on('chatBoxOpened', function (view)
                {
                    console.debug("gateway chatBoxOpened", view);

                    var jid = view.model.get("jid");

                    if (jid === "rss@pade." + _converse.connection.domain)
                    {
                        view.el.querySelector('.chat-textarea').setAttribute("disabled", "true");
                        rssChatCheck();
                    }
                    else

                    if (jid === "beekeeper@pade." + _converse.connection.domain)
                    {
                        beeKeeperChatCheck();
                    }
                });

                Promise.all([_converse.api.waitUntil('rosterContactsFetched'), _converse.api.waitUntil('chatBoxesFetched'), _converse.api.waitUntil('bookmarksInitialized')]).then(() =>
                {
                    _converse.connection.injectedMessage = function(element)
                    {
                        const to = element.getAttribute("to");

                        if (to == "beekeeper@pade." + _converse.connection.domain)
                        {
                            handleBeeKeeperPosts(element);
                        }
                    }

                    if (getSetting("enableBeeKeeper", false))
                    {
                        const feedCheck = getSetting("beeFeedCheck", 10) * 60000;
                        beekeeper.interval = setInterval(beeKeeperRefresh, feedCheck);

                        if (beekeeper.accountId && beekeeper.token)
                        {
                            let url = "/account.json/" + beekeeper.accountId + "/friends?token=" + beekeeper.token + "&version=2&limit=" + getSetting("beeKeeperPageSize", "25");

                            fetch(beeKeeperUrl + url, {method: "GET"}).then(function(response){if (!response.ok) throw Error(response.statusText); return response.json()}).then(function(friends)
                            {
                                friends.items.forEach(function(friend)
                                {
                                    console.debug('beekeeper friend', friend);
                                    setAvatar(friend.name, friend.images.xs);
                                });

                            }).catch(function (err) {
                                console.error('beekeeper friends error', err);
                            });

                            url = "/topics.json/trending?token=" + beekeeper.token + "&limit=" + getSetting("beeKeeperPageSize", "25");

                            fetch(beeKeeperUrl + url, {method: "GET"}).then(function(response){if (!response.ok) throw Error(response.statusText); return response.json()}).then(function(topics)
                            {
                                console.debug('beekeeper topics', topics);

                                topics.items.forEach(function(topic)
                                {
                                    const roomJid = topic.slug + "@conference." + _converse.connection.domain;
                                    let room = _converse.chatboxes.get(roomJid);

                                    if (!room)
                                    {
                                        _converse.bookmarks.create({
                                            'jid': roomJid,
                                            'name': topic.name,
                                            'autojoin': false,
                                            'nick': _converse.nickname
                                        });

                                        room = _converse.chatboxes.get(roomJid);
                                        if (room) room.save('bookmarked', true);
                                    }
                                });

                                createRosterEntry("beekeeper@pade." + _converse.connection.domain, getSetting("beeKeeperTitle", "BeeKeeper Community"), "BeeKeeper Community");

                            }).catch(function (err) {
                                console.error('beekeeper topics error', err);
                            });
                        }
                    }

                    window.addEventListener("unload", function ()
                    {
                        console.debug("gateway unloading all feed refreshing");

                        if (rssInterval) clearInterval(rssInterval);
                        if (beekeeper && beekeeper.interval) clearInterval(beekeeper.interval);
                    });
                });

                _converse.__super__.onConnected.apply(this, arguments);

                if (getSetting("enableRssFeeds", false))
                {
                    var rssFeedCheck = getSetting("rssFeedCheck", 10) * 60000;
                    rssInterval = setInterval(rssRefresh, rssFeedCheck);

                    createRosterEntry("rss@pade." + _converse.connection.domain, getSetting("rssFeedTitle", "RSS Feed"), "RSS Feed");
                }

            },

            MessageView: {

                renderChatMessage: async function renderChatMessage()
                {
                    const sender = this.model.get("sender");
                    const jid = this.model.get("jid");

                    if (jid == "beekeeper@pade." + _converse.connection.domain && sender == "me")
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

    var createRosterEntry = function(jid, name, groups)
    {
        _converse.api.chats.open(jid, {fullname: name});

        if (bgWindow.pade.chatAPIAvailable)
        {
            var body = {
              "jid": jid,
              "nickname": name,
              "groups": groups,
            };

            var url =  "https://" + bgWindow.pade.server + "/rest/api/restapi/v1/meet/friend";
            var permission =  "Basic " + btoa(bgWindow.pade.username + ":" + bgWindow.pade.password);
            var options = {method: "POST", headers: {"authorization": permission, "content-type": "application/json"}, body: JSON.stringify(body)};

            console.debug("createRosterEntry", url, options);

            fetch(url, options).then(function(response)
            {
                console.debug('createRosterEntry ok');
                _converse.connection.injectMessage('<presence to="' + _converse.connection.jid + '" from="' + jid + '"/>');

            }).catch(function (err) {
                console.error('createRosterEntry', err, url, options);
            });
        }
    }


    var beeKeeperRefresh = function()
    {
        beeKeeperChatCheck();
    }

    var beeKeeperChatCheck = function()
    {
        //fetchBeeKeeper("profile", "/account.json/" + beekeeper.accountId + "/profile?token=" + beekeeper.token);
        //fetchBeeKeeper("friends", "/account.json/" + beekeeper.accountId + "/friends?token=" + beekeeper.token + "&version=2&limit=10");
        //fetchBeeKeeper("notifs", "/account.json/" + beekeeper.accountId + "/notifs?token=" + beekeeper.token + "&limit=10");
        //fetchBeeKeeper("topics_trending", "/topics.json/trending?token=" + beekeeper.token + "&limit=10");
        fetchBeeKeeper("newsfeed", "/account.json/" + beekeeper.accountId + "/newsfeed?token=" + beekeeper.token + "&limit=" + getSetting("beeKeeperPageSize", "25"));
    }

    function beeKeeperGroupChatCheck(view)
    {
        if (beekeeper.accountId && beekeeper.token)
        {
            const id = view.model.get("box_id");
            const jid = view.model.get("jid");
            const chatTopic = Strophe.getNodeFromJid(jid);
            const url = "/account.json/" + beekeeper.accountId + "/newsfeed?token=" + beekeeper.token + "&limit=" + getSetting("beeKeeperPageSize", "25");

            fetch(beeKeeperUrl + url, {method: "GET"}).then(function(response){if (!response.ok) throw Error(response.statusText); return response.json()}).then(function(posts)
            {
                posts.items.forEach(function(post)
                {
                    console.debug('beekeeper groupchat newsfeed', post);

                    if (post.topics && post.topics.length > 0)
                    {
                        post.topics.forEach(function(topic)
                        {
                            if (chatTopic == topic.data.slug) beeKeeperTopicFeed(topic.data.slug, post);
                        });
                    }

                });

            }).catch(function (err) {
                console.error('beekeeper groupchat newsfeed error', err);
            });
        }
    }


    var beeKeeperNewsFeed = function()
    {
        if (beekeeper.newsfeed)
        {
            beekeeper.newsfeed.items.forEach(function(post)
            {
                var msgId = "beekeeper-" + post._id;
                var msgDiv = document.getElementById("msg-" + msgId);

                if (!msgDiv)
                {
                    var delayStamp = moment(post.createdAt * 1).format('YYYY-MM-DDTHH:mm:ssZ');
                    var delay = "<delay xmlns='urn:xmpp:delay' from='" + _converse.connection.domain + "' stamp='" + delayStamp + "'/>";
                    var body = "";

                    if (post.postType == "media" && post.largeThumbnail)
                    {
                        body = body + ' ' + post.largeThumbnail + ' \n';
                    }

                    if (post.description && post.description.trim() != "")
                    {
                        body = body + post.description;
                    }

                    if (post.topics && post.topics.length > 0)
                    {
                        body = body + '\n'

                        post.topics.forEach(function(topic)
                        {
                            body = body + " #" + topic.data.name;
                        });
                    }

                    body = body + '\n\n ';

                    if (post.profile)
                    {
                         body = body + getProfile(post.profile);
                    }

                    console.debug("beeKeeperChatCheck", post, body, msgId, delay);

                    var reactions = {};
                    reactions[msgId] = {like: post.likes, dislike: 0}

                    chrome.storage.local.set(reactions, function()
                    {
                        _converse.connection.injectMessage('<message id="' + msgId + '" type="chat" to="' + _converse.connection.jid + '" from="' + "beekeeper@pade." + _converse.connection.domain + '"><body>' + body + '</body><origin-id xmlns="urn:xmpp:sid:0" id="' + msgId + '"/>' + delay + '</message>');

                        if (post.comments && post.comments.length > 0 && post.description && post.description.trim() != "")
                        {
                            beeKeeperNewsComents(post);
                        }
                    });
                }
            });
        }
    }

    var getProfile = function(profile)
    {
        var avatar = profile.images.xs.endsWith("/profile-default-image-f.png") ? "" : profile.images.xs;
        let profileBody = avatar + ' @' + profile.username + ' ' + (profile.username == profile.name ? '' : profile.name + ', ') + profile.bio + ' ';
        var stats = Object.getOwnPropertyNames(profile.stats);

        stats.forEach(function(stat)
        {
            profileBody = profileBody + ' | ' + stat + ": " + profile.stats[stat];
        });

        return profileBody;
    }

    var beeKeeperTopicFeed = function(topic, post)
    {
        var delayStamp = moment(post.createdAt * 1).format('YYYY-MM-DDTHH:mm:ssZ');
        var delay = "<delay xmlns='urn:xmpp:delay' from='" + _converse.connection.domain + "' stamp='" + delayStamp + "'/>";
        var msgId = "beekeeper-topic-" + post._id;

        var body = "";

        if (post.postType == "media" && post.largeThumbnail)
        {
            body = body + ' ' + post.largeThumbnail + ' \n';
        }

        if (post.description && post.description.trim() != "")
        {
            body = body + post.description;
        }

        var msgDiv = document.getElementById("msg-" + msgId);

        if (!msgDiv)
        {
            const from = topic + "@conference." + _converse.connection.domain + "/" + (post.profile.name || post.profile.username);
            console.debug("beeKeeperTopicFeed", from, topic, post, body, msgId, delay);

            _converse.connection.injectMessage('<message id="' + msgId + '" type="groupchat" to="' + _converse.connection.jid + '" from="' + from + '"><body>' + body + '</body><origin-id xmlns="urn:xmpp:sid:0" id="' + msgId + '"/>' + delay + '</message>');
        }
    }

    var beeKeeperNewsComents = function(post)
    {
        var postMsgId = "beekeeper-" + post._id;
        var posting = "<attach-to xmlns='urn:xmpp:message-attaching:1' id='" + postMsgId + "' />";
        var quote = ">" + post.description.split("\n")[0];

        post.comments.forEach(function(comment)
        {
            console.debug("beeKeeperNewsComents", post, postMsgId);

            var delayStamp = moment(comment.createdAt * 1).format('YYYY-MM-DDTHH:mm:ssZ');
            var delay = "<delay xmlns='urn:xmpp:delay' from='" + _converse.connection.domain + "' stamp='" + delayStamp + "'/>";
            var msgId = "beekeeper-" + comment._id;
            var body = quote + '\n\n' + comment.message + '\n\n ';

            if (comment.profile)
            {
                 body = body + getProfile(comment.profile);
            }

            console.debug("beeKeeperNewsComents", post, body, msgId, delay);

            var msgDiv = document.getElementById("msg-" + msgId);

            if (!msgDiv)
            {
                _converse.connection.injectMessage('<message id="' + msgId + '" type="chat" to="' + _converse.connection.jid + '" from="' + "beekeeper@pade." + _converse.connection.domain + '"><body>' + body + '</body><origin-id xmlns="urn:xmpp:sid:0" id="' + msgId + '"/>' + delay + posting + '</message>');
            }
        });
    }

    var fetchBeeKeeper = function(property, url)
    {
        fetch(beeKeeperUrl + url, {method: "GET"}).then(function(response){if (!response.ok) throw Error(response.statusText); return response.json()}).then(function(value)
        {
            console.debug('beekeeper api ' + property, value);
            beekeeper[property] = value;

            if (property == "newsfeed")
            {
                beeKeeperNewsFeed()
            }

        }).catch(function (err) {
            console.error('beekeeper api ' + property + ' error', err);
        });
    }

    var handleBeeKeeperPosts = function(element)
    {
        console.debug("handleBeeKeeperPosts", element);
        // echo test
        // const elem = new DOMParser().parseFromString("<iq type='set'><query xmlns='jabber:iq:roster'><item jid='newsfeed@pade.desktop-545pc5b' subscription='both'  name='News Feed'><group>Bots</group></item></query></iq>", "text/xml").documentElement;
        // _converse.connection.sendIQ(elem, callback, errorback);
/*
        if (typeof element.getAttribute === "function")
        {
            const body = element.querySelector('body') ? element.querySelector('body').innerHTML : "";

            _converse.connection.injectMessage('<message type="chat" to="' + from + '" from="' + to + '"><body>' + body + '</body></message>');
        }
*/
        const type = element.getAttribute("type");
        const id = element.getAttribute("id");
        const body = element.querySelector('body');

        if (type == "chat" && body)
        {
            let postData = {
              topics: [],
              createdAt: new Date().getTime(),
              postType: "text",
              description: body.innerHTML,
              avatar: "",
              isFavorite: false,
              favorites: 0,
              canEdit: false,
              isOwner: false,
              liked: false,
              likes: 0
            };

            let topics = body.innerHTML.match(/(#[A-Za-z0-9]+)/ig);

            if (topics && topics.length > 0)
            {
                topics.forEach(function(hash)
                {
                   postData.description = postData.description.replace(new RegExp(hash, 'g'), "");
                   postData.topics.push(hash.replace("#", ""));
                });
            }

            if (postData.topics.length == 0) postData.topics = [getSetting("beeKeeperTopic", "post")];

            const url = "/account.json/" + beekeeper.accountId + "/posts?token=" + beekeeper.token;
            const options = {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(postData)};

            fetch(beeKeeperUrl + url, options).then(function(response){if (!response.ok) throw Error(response.statusText); return response.json()}).then(function(value)
            {
                console.debug('handleBeeKeeperPosts ', url, options, value);
                fetchBeeKeeper("newsfeed", "/account.json/" + beekeeper.accountId + "/newsfeed?token=" + beekeeper.token + "&limit=" + getSetting("beeKeeperPageSize", "25"));

            }).catch(function (err) {
                console.error('handleBeeKeeperPosts error', err, url, options);
            });
        }
    }

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
                                console.debug("rssCheckEach pre", post.title, post);

                                var stamp = " - " + moment(post.published_from_feed).format('MMM DD YYYY HH:mm:ss');
                                var delay = "";

                                if (getSetting("useRssDate", false) == false)
                                {
                                    var delayStamp = moment(post.published_from_feed).format('YYYY-MM-DDTHH:mm:ssZ');
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
