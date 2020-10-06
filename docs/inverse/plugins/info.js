(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
    var _converse = null;
    var infoDialog = null;

    var Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs;
    var PreviewDialog = null, previewDialog = null;

    converse.plugins.add("info", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            Strophe = converse.env.Strophe;
            $iq = converse.env.$iq;
            $msg = converse.env.$msg;
            $pres = converse.env.$pres;
            $build = converse.env.$build;
            b64_sha1 = converse.env.b64_sha1;
            _ = converse.env._;
            Backbone = converse.env.Backbone;
            dayjs = converse.env.dayjs;

            PreviewDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">Media Content Preview</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body"></div>' +
                         '<div class="modal-footer"><button type="button" class="btn btn-danger" data-dismiss="modal">Close</button></div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                    const url = this.model.get("url");

                    if (this.model.get("type") == "image")
                    {
                        this.el.querySelector('.modal-body').innerHTML = '<img class="pade-preview-image" src="' + url + '"/>';
                    }
                    else

                    if (this.model.get("type") == "video")
                    {
                        if (url.endsWith(".tgs")) {
                            this.el.querySelector('.modal-body').innerHTML = '<tgs-player style="height: 512px; width: 512px;" autoplay controls loop mode="normal" src="' + url + '"></tgs-player>';

                        } else if (url.endsWith(".json")) {
                            this.el.querySelector('.modal-body').innerHTML = '<lottie-player autoplay controls loop mode="normal" src="' + url + '"></lottie-player>';
                        } else {
                            this.el.querySelector('.modal-body').innerHTML = '<video controls class="pade-preview-image" src="' + url + '"/>';
                        }
                    }
                    else

                    if (this.model.get("type") == "audio")
                    {
                        this.el.querySelector('.modal-body').innerHTML = '<audio controls class="pade-preview-image" src="' + url + '"/>';
                    }

                    this.el.querySelector('.modal-title').innerHTML = "Media Content Preview<br/>" + url + "<br/>" + this.model.get("from") + " - " + this.model.get("timestamp");
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                console.debug('info - renderToolbar', view.model);

                if (view.model.get("type") === "chatroom" && !view.el.querySelector(".fa-info") && getSetting("showToolbarIcons", true))
                {
                    var jid = view.model.get("jid");
                    var id = view.model.get("box_id");
                    var occupants = view.el.querySelector('.occupants');

                    if (occupants)
                    {
                        var infoButton = padeapi.addToolbarItem(view, id, "pade-info-" + id, '<a class="fas fa-info" title="Information"></a>');

                        infoButton.addEventListener('click', function(evt)
                        {
                            evt.stopPropagation();
                            toggleInfoBar(view, id, jid);

                        }, false);
                    }
                }
            });

            console.log("info plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                parseMessageForCommands: function(text) {
                    console.debug('info - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();
                    const view = this;

                    if (command === "subject" || command === "topic")
                    {
                        var id = this.model.get("box_id");
                        var jid = this.model.get("jid");

                        console.debug("new threaded conversation", match[2]);

                    }
                    else

                    if (command === "info")
                    {
                        var id = this.model.get("box_id");
                        var jid = this.model.get("jid");
                        toggleInfoBar(this, id, jid);
                        return true;
                    }
                    else

                    if (command === "feed" && this.model.get("type") == "chatroom")
                    {
                        if (!match[2])
                        {
                            view.showHelpMessages(["Missing Feed URL", "Try /feed http://feeds.bbci.co.uk/news/rss.xml"]);
                            return true;
                        }

                        const id = this.model.get("box_id");
                        const feedId = 'feed-' + id;

                        chrome.storage.local.get(feedId, function(data)
                        {
                            if (!data) data = {};
                            if (!data[feedId]) data[feedId] = {};

                            var feed = {path: match[2], url: chrome.pade ? "https://" + getSetting("server") + "/pade/download?url=" + match[2] : match[2]};

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

                                                view.showHelpMessages(["Feed " + feed.title + " added\n" + feed.path]);
                                                view.viewUnreadMessages();
                                                view.close();

                                                setTimeout(function() {_converse.api.rooms.open(view.model.get("jid"))});
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

                    if (command === "clearpins")
                    {
                        var id = this.model.get("box_id");
                        var jid = this.model.get("jid");

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

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                }
            }
        }
    });

    var toggleInfoBar = function(view, id, jid)
    {
        const chatroom_body = view.el.querySelector('.chatroom-body');
        let info_area = view.el.querySelector('.occupants-pade-info');

        if (!info_area)
        {
            info_area = document.createElement("div");
            info_area.classList.add('occupants-pade-info');
            info_area.classList.add('col-md-3');
            info_area.classList.add('col-4');
            chatroom_body.appendChild(info_area);
        }

        const occupants_area = view.el.querySelector('.occupants.col-md-3.col-4');

        if (occupants_area.style.display != "none")
        {
            occupants_area.style.display = "none";

            info_area.innerHTML = '<div class="plugin-infobox">' + getHTML(id, jid) + '</div>';
            info_area.style.display = "";

            createContentSummary(view, jid, id);
            createMediaContentSummary(jid, id);

            if (bgWindow && bgWindow.pade.activeWorkgroup)
            {
                createWorkgroups(jid, id);
            }

            createMylinks(jid, id);
            createBroadcastEndpoints(jid, id);

        } else {
            occupants_area.style.display = "";
            info_area.style.display = "none";
        }
        view.scrollDown();
    }

    var postMessage = function(view, text, spoiler_hint)
    {
        const attrs = view.model.getOutgoingMessageAttributes("*" + text + "*", spoiler_hint);
        view.model.messages.create(attrs);
    }

    var createMylinks = function(jid, id)
    {
        if (bgWindow && bgWindow.pade.collabDocs)
        {
            var urls = Object.getOwnPropertyNames(bgWindow.pade.collabDocs);

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
                    var urlName = bgWindow.pade.collabDocs[urls[i]];
                    console.debug('createMylinks', urls[i], urlName);

                    if (bgWindow && urlName != "Video conferencing web client")
                    {
                        if (isH5PURL(urls[i]))
                        {
                            h5pKount++;
                            var checked = bgWindow.pade.activeH5p == urls[i] ? "checked" : "";
                            h5pHtml += '<div title="' + urlName + '" class="mediaItem"><input name="info_h5p_url" class="info_active_url" ' + checked + ' type="radio" value="' + urls[i] + '"/>&nbsp;' + urlName + '</div>';

                        }
                        else

                        if (isPDFURL(urls[i]))
                        {
                            pdfKount++;
                            var checked = bgWindow.pade.activeUrl == urls[i] ? "checked" : "";
                            pdfHtml += '<div title="' + urlName + '" class="mediaItem"><input name="info_url" class="info_active_url" ' + checked + ' type="radio" value="' + urls[i] + '"/>&nbsp;' + urlName + '</div>';

                        }
                        else {
                            appsKount++;
                            var checked = bgWindow.pade.activeUrl == urls[i] ? "checked" : "";
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
                        var element = padeapi.__newElement('div', null, htmlArray[i].html);
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
                                        bgWindow.pade.activeH5p = activeUrls[k].value;
                                    }
                                    else {
                                        bgWindow.pade.activeUrl = activeUrls[k].value;
                                    }
                                }
                            }
                        });
                    }
                }

            }
        }
    }

    var createBroadcastEndpoints = function(jid, id)
    {
        console.debug("createBroadcastEndpoints", jid, id);

        _converse.connection.sendIQ($iq({type: 'get', to: "broadcast." + _converse.connection.domain}).c('query', {xmlns: "http://jabber.org/protocol/disco#items"}).tree(), function(resp)
        {
            var count = document.getElementById(id + "-broadcast-count");
            var detail = document.getElementById(id + "-broadcast-details");
            var items = resp.querySelectorAll('item');

            if (count && detail)
            {
                count.innerHTML = items.length;

                for (var i=0; i<items.length; i++)
                {
                    var jid = items[i].getAttribute('jid');
                    var name = Strophe.getNodeFromJid(jid);

                    console.debug('createBroadcastEndpoints', jid, name);

                    var html = '<li title="' + jid + '">' + name + '</li>';
                    var element = padeapi.__newElement('div', null, html);

                    element.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        console.debug("createBroadcastEndpoints click", evt.target.title);
                        _converse.api.chats.open(evt.target.title);
                    });

                    detail.insertAdjacentElement('afterEnd', element);
                }
            }

        }, function (error) {
             console.warn("Broadcast plugin not available");
        });
    }

    var createWorkgroups = function(jid, id)
    {
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

                if (bgWindow && detail)
                {
                    var html = "";

                    for (var i=0; i<workgroups.length; i++)
                    {
                        var jid = workgroups[i].getAttribute('jid');
                        var name = Strophe.getNodeFromJid(jid);
                        var room = 'workgroup-' + name + "@conference." + _converse.connection.domain;
                        var checked = bgWindow.pade.activeWorkgroup.jid == jid ? "checked" : "";

                        console.debug("get workgroups", room, jid);
                        html += '<input id="info_active_workgroup-' + id + '" type="radio" ' + checked + ' value="' + jid + '"/>&nbsp;' + name + '<br/>';
                    }

                    var element = padeapi.__newElement('div', null, html);

                    element.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        var activeWorkgroup = document.getElementsById(evt.target.id);

                        for (var i=0; i<activeWorkgroup.length; i++)
                        {
                            console.debug("createWorkgroups other click", activeWorkgroup[i].value, activeWorkgroup[i].checked);
                            if (activeWorkgroup[i].checked) bgWindow.setActiveWorkgroup(bgWindow.pade.participants[activeWorkgroup[i].value]);
                        }
                    });

                    detail.insertAdjacentElement('afterEnd', element);
                }

            }, function (error) {
                console.warn("Workgroups not available");
            });

            if (bgWindow && bgWindow.pade.fastpath[workGroup])
            {
                console.debug("createWorkgroups", workGroup, bgWindow.pade.fastpath[workGroup]);

                var fastpath = bgWindow.pade.fastpath[workGroup];
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

                    queueDetail.insertAdjacentElement('afterEnd', padeapi.__newElement('div', null, html));
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
                        var element = padeapi.__newElement('div', null, html);

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

    var createContentSummary = function(view, jid, id)
    {
        console.debug("createContentSummary", jid, id);

        if (chrome.storage)
        {
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

                    for (var i=0; i<keys.length; i++)
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

                        for (var i=0; i<keys.length; i++)
                        {
                            detail.insertAdjacentElement('afterEnd', newFeedItemElement('li', data[feedId][keys[i]], "mediaItem", id, view));
                            counter++;
                        }
                        count.innerHTML = counter;
                    }
                }

            });

            if (getSetting("enableThreading", false))
            {
                const topicId = 'topic-' + id;

                chrome.storage.local.get(topicId, function(data)
                {
                    console.debug('chrome.storage get topics', data);

                    if (data && data[topicId])
                    {
                        const keys = Object.getOwnPropertyNames(data[topicId]);
                        const count = document.getElementById(id + "-topics-count");
                        const detail = document.getElementById(id + "-topics-details");

                        if (detail && count && keys.length > 0)
                        {
                            let counter = 0;

                            for (var i=0; i<keys.length; i++)
                            {
                                if (typeof data[topicId][keys[i]] == "object")
                                {
                                    detail.insertAdjacentElement('afterEnd', newTopicItemElement(data[topicId][keys[i]], "mediaItem", id, view));
                                    counter++;
                                }
                            }
                            detail.insertAdjacentElement('afterEnd', newTopicItemElement({text: "All Topics", author: "system"}, "mediaItem", id, view));
                            count.innerHTML = counter;
                        }
                    }

                });
            }
        }
    }

    var newTopicItemElement = function(item, className, id, view)
    {
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

                        var jid = view.model.get("jid");
                        view.close();
                        setTimeout(function() { _converse.api.rooms.open(jid)});
                    });
                });
            }
        });

        return item.ele;
    }

    var newPinnedItemElement = function(el, item, className)
    {
        console.debug('newPinnedItemElement', item);
        // {from: from, msgId: msgId, message: pinnedMessage, nick : nick}

        item.ele = document.createElement(el);
        item.ele.name = item.msgId;
        item.ele.title = item.nick + " says " + item.message;
        item.ele.innerHTML = item.message;
        item.ele.classList.add(className);
        document.body.appendChild(item.ele);

        item.ele.addEventListener('click', function(evt)
        {
            evt.stopPropagation();
            console.debug("pinned item clicked", evt.target.name, evt.target.title);

            var elmnt = document.getElementById("msg-" + evt.target.name);
            if (elmnt) elmnt.scrollIntoView({block: "end", inline: "nearest", behavior: "smooth"});
        });

        return item.ele;
    }

    var newFeedItemElement = function(el, item, className, id, view)
    {
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

    var createMediaContentSummary = function(jid, id)
    {
        var media = {meetings:{rooms:[]}, recordings:{urls:[]}, photo:{urls:[]}, video:{urls:[]}, link:{urls:[]}, vmsg:{urls:[]}, ppt:{urls:[]}};

        console.debug("createMediaContentSummary", jid, id);

        _converse.api.archive.query({before: '', max: 999, 'groupchat': true, 'with': jid}).then(function(result) {
            const messages = result.messages;
            console.debug("createMediaContentSummary - query", messages);

            for (var i=0; i<messages.length; i++)
            {
                var body = messages[i].querySelector('body');
                var attachTo = messages[i].querySelector('attach-to');
                var msgId = messages[i].querySelector('forwarded').querySelector('message').getAttribute('id');
                var from = messages[i].querySelector('forwarded').querySelector('message').getAttribute('from').split("/")[1];

                var timestamp = undefined;
                var delay = messages[i].querySelector('forwarded').querySelector('delay');
                if (delay) timestamp = delay.getAttribute('stamp');
                var stamp = dayjs(timestamp).format('MMM DD YYYY HH:mm:ss');

                console.debug("archived msg", i, from, body, msgId);

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

    var resetReactions = function(body, attachTo)
    {
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

    var getHTML = function(id, jid)
    {
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

        if (bgWindow && (bgWindow.pade.activeH5p || bgWindow.pade.activeUrl))
        {
            html += '<h3>Collaborative Links</h3>' +
                    '<details>' +
                    '    <summary id="' + id + '-pdf-details">PDF Documents (<span id="' + id + '-pdf-count">0</span>)<span style="float: right;" class="fa fa-file"/></summary>' +
                    '</details>'+
                    '<details>' +
                    '    <summary id="' + id + '-apps-details">Applications (<span id="' + id + '-apps-count">0</span>)<span style="float: right;" class="fas fa-globe"/></summary>' +
                    '</details>';

            if (bgWindow.pade.activeH5p)
            {
                html += '<details>' +
                        '    <summary id="' + id + '-h5p-details">H5P Interactive Content (<span id="' + id + '-h5p-count">0</span>)<span style="float: right;" class="fa fa-h-square"/></summary>' +
                        '</details>';
            }
        }

        html += '<h3>Broadcasts</h3>' +
                '<details>' +
                '    <summary id="' + id + '-broadcast-details">Distribution Lists (<span id="' + id + '-broadcast-count">0</span>)<span style="float: right;" class="fas fa-bullhorn"/></summary>' +
                '</details>';

        return html;
    }

    var isH5PURL = function (url)
    {
      const filename = url.toLowerCase();
      return filename.indexOf("/h5p/") > -1
    };

    var isAudioMeetingURL = function (url)
    {
      const filename = url.toLowerCase();
      return filename.indexOf("/ofmeet-cdn/recordings/") > -1 && filename.endsWith(".audio.webm");
    };

    var isVideoMeetingURL = function (url)
    {
      const filename = url.toLowerCase();
      return filename.indexOf("/ofmeet-cdn/recordings/") > -1 && filename.endsWith(".video.webm");
    };

    var isMeeting = function (url)
    {
      const ofmeetUrl = getSetting("ofmeetUrl", null);
      const filename = url.toLowerCase();
      return ofmeetUrl && filename.indexOf(ofmeetUrl) > -1
    };

    var isPDFURL = function (url)
    {
      const filename = url.toLowerCase();
      return filename.endsWith('.pdf');
    };

    var isAudioURL = function (url)
    {
      const filename = url.toLowerCase();
      return filename.endsWith('.ogg') || filename.endsWith('.mp3') || filename.endsWith('.m4a');
    };

    var isImageURL = function (url)
    {
      const filename = url.toLowerCase();
      return filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png') || filename.endsWith('.gif') || filename.endsWith('.bmp') || filename.endsWith('.tiff') || filename.endsWith('.svg');
    };

    var isVideoURL = function (url)
    {
      const filename = url.toLowerCase();
      return filename.endsWith('.mp4') || filename.endsWith('.webm') || filename.endsWith('.tgs') || filename.endsWith('.json');
    };

    var isOpenOfficeDoc = function (url)
    {
        var openOfficeDoc = false;
        var pos = url.lastIndexOf(".");

        if (pos > -1)
        {
            var exten = url.substring(pos + 1);
            openOfficeDoc = "odt ods odp".indexOf(exten) > -1;
        }
        return openOfficeDoc;
    };

    var isOnlyOfficeDoc = function (url)
    {
        var onlyOfficeDoc = false;
        var pos = url.lastIndexOf(".");

        if (pos > -1)
        {
            var exten = url.substring(pos + 1);
            onlyOfficeDoc = "doc docx ppt pptx xls xlsx csv".indexOf(exten) > -1;
        }
        return onlyOfficeDoc;
    };

    var isH5p = function (url)
    {
        return url.indexOf("/h5p/") > -1;
    };

    var sortUrls = function (a,b)
    {
        if ( a.file < b.file )
            return -1;
        if ( a.file > b.file )
            return 1;
        return 0;
    };

    var newItemElement = function(el, item, className)
    {
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
                if (!previewDialog)
                {
                    previewDialog = new PreviewDialog({'model': new converse.env.Backbone.Model({url: url, type: type, timestamp: timestamp, from: from}) });
                }
                else {
                    previewDialog.model.set("url", url);
                    previewDialog.model.set("type", type);
                    previewDialog.model.set("timestamp", timestamp);
                    previewDialog.model.set("from", from);
                }
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
                if (bgWindow) bgWindow.openWebAppsWindow(chrome.extension.getURL("akowe/index.html?" + query), null, 1400, 900);
            }
            else {  // insert into textarea
                replyInverseChat(url);
            }

        });

        return item.ele;
    }

    var renderMedia = function (id, eleName, urls, check)
    {
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

    var validateUrl = function(url, callback)
    {
        console.debug("validateUrl check", url);

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
            callback();
        });
    }

    var renderMeeting = function (id, meetings)
    {
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

    var newMeetingElement = function(id, item)
    {
        item.ele = document.createElement("details");
        item.ele.title = item.url;
        item.ele.innerHTML = '<summary id="' + id + '-' + item.room + '-details">' + item.room + ' (<span id="' + id + '-' + item.room + '-count">0</span>)<span style="float: right;" class="fa fa-video fas fa-microphone"/></summary>';
        document.body.appendChild(item.ele);
        return item.ele;
    }

    var hideElement = function (el)
    {
        return addClass("hiddenx", el);
    }

    var addClass = function (className, el)
    {
      if (el instanceof Element)
      {
        el.classList.add(className);
      }
      return el;
    }

    var removeClass = function (className, el)
    {
      if (el instanceof Element)
      {
        el.classList.remove(className);
      }
      return el;
    }
}));
