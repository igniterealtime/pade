(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var contentDialog = null;
    var panelHTML = {};
    var _converse = null;

    converse.plugins.add("content", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

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

                    if (this.model.get("type") == "image")
                    {
                        this.el.querySelector('.modal-body').innerHTML = '<img id="pade-preview-image" src="' + this.model.get("url") + '"/>';
                    }
                    else

                    if (this.model.get("type") == "video")
                    {
                        this.el.querySelector('.modal-body').innerHTML = '<video controls id="pade-preview-image" src="' + this.model.get("url") + '"/>';
                    }
                    else

                    if (this.model.get("type") == "audio")
                    {
                        this.el.querySelector('.modal-body').innerHTML = '<audio controls id="pade-preview-image" src="' + this.model.get("url") + '"/>';
                    }

                    this.el.querySelector('.modal-title').innerHTML = "Media Content Preview<br/>" + this.model.get("url");
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                var id = view.model.get("box_id");
                var jid = view.model.get("jid");
                var type = view.model.get("type");

                if (type === "chatroom")
                {
                    var contentButton = addToolbarItem(view, id, "pade-content-" + id, '<a class="fa fa-list" title="Content Summary"></a>');

                    contentButton.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        toggleInfoBar(view, id, jid);

                    }, false);
                }
            });

            console.log("content plugin is ready");
        }
    });

    var toggleInfoBar = function(view, id, jid)
    {
        const chat_area = view.el.querySelector('.chat-area');
        const occupants_area = view.el.querySelector('.occupants.col-md-3.col-4');

        if (!panelHTML[id])
        {
            panelHTML[id] = occupants_area.innerHTML;
            occupants_area.innerHTML = '<div class="plugin-infobox">' + getHTML(id, jid) + '</div>';
            createInfoContent(occupants_area, jid, id);

        } else {
            occupants_area.innerHTML = panelHTML[id];
            panelHTML[id] = null;
        }
        view.scrollDown();
    }

    var createInfoContent = function(contentElement, jid, id)
    {
        var media = {photo:{urls:[]}, video:{urls:[]}, link:{urls:[]}, vmsg:{urls:[]}, ppt:{urls:[]}};

        console.debug("createInfoContent", jid, id);

        _converse.api.archive.query({before: '', max: 99999, 'groupchat': true, 'with': jid}).then(function(result)
        {
            const messages = result.messages;

            for (var i=0; i<messages.length; i++)
            {
                var body = messages[i].querySelector('body');
                var from = messages[i].querySelector('forwarded').querySelector('message').getAttribute('from').split("/")[1];

                if (body)
                {
                    var str = body.innerHTML;
                    var urls = str.match(/(https?:\/\/[^\s]+)/g);

                    if (urls && urls.length > 0)
                    {
                        for (var j=0; j<urls.length; j++)
                        {
                            var pos = urls[j].lastIndexOf("/");
                            var file = urls[j].substring(pos + 1);

                            console.debug("media", i, j, from, file, urls[j]);

                            if (isAudioURL(file))
                            {
                                media.vmsg.urls.push({url: urls[j], file: file, from: from, type: "audio"});
                            }
                            else

                            if (isImageURL(file))
                            {
                                media.photo.urls.push({url: urls[j], file: file, from: from, type: "image"});
                            }
                            else

                            if (isVideoURL(file))
                            {
                                media.video.urls.push({url: urls[j], file: file, from: from, type: "video"});
                            }

                            else {
                                media.link.urls.push({url: urls[j], file: urls[j], from: from, type: "link"});
                            }
                        }
                    }
                }
            }

            renderMedia(id, "vmsg", media.vmsg.urls);
            renderMedia(id, "photo", media.photo.urls);
            renderMedia(id, "video", media.video.urls);
            renderMedia(id, "ppt", media.ppt.urls);
            renderMedia(id, "link", media.link.urls);

            console.debug("media", media);
        });
    }

    var getHTML = function(id)
    {
        return '<h3>Media Content</h3>' +
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
               '    <summary id="' + id + '-vmsg-details">Voice Messages (<span id="' + id + '-vmsg-count">0</span>)<span style="float: right;" class="fa fa-file-audio"/></summary>' +
               '</details>' +
               '<details>' +
               '    <summary id="' + id + '-ppt-details">Interactive Content (<span id="' + id + '-ppt-count">0</span>)<span style="float: right;" class="fa fa-file-powerpoint"/></summary>' +
               '</details>';
    }

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
      return filename.endsWith('.mp4') || filename.endsWith('.webm');
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

        item.ele.name = item.type;
        item.ele.title = item.url;
        item.ele.innerHTML = item.file || item.url;
        item.ele.classList.add(className);
        document.body.appendChild(item.ele);

        item.ele.addEventListener('click', function(evt)
        {
            evt.stopPropagation();
            console.debug("media item clicked", evt.target.name, evt.target.title);

            if (evt.target.name == "image" || evt.target.name == "audio" || evt.target.name == "video")
            {
                previewDialog = new PreviewDialog({'model': new converse.env.Backbone.Model({url: evt.target.title, type: evt.target.name}) });
                previewDialog.show();
            }
            else

            if (evt.target.name == "link")
            {
                window.open(evt.target.title, "pade-media-link");
            }
            else {  // insert into textarea
                replyInverseChat(evt.target.title);
            }

        });

        return item.ele;
    }

    var renderMedia = function (id, eleName, urls)
    {
        urls.sort(sortUrls);

        var count = document.getElementById(id + "-" + eleName + "-count");
        var detail = document.getElementById(id + "-" + eleName + "-details");

        if (detail && count && urls.length > 0)
        {
            count.innerHTML = urls.length;

            for (var i=0; i<urls.length; i++)
            {
                detail.insertAdjacentElement('afterEnd', newItemElement('li', urls[i], "mediaItem"));
            }
        }
    }

    var hideElement = function (el)
    {
        return addClass("hidden", el);
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

    var getSelectedChatBox = function()
    {
        var views = _converse.chatboxviews.model.models;
        var view = null;

        console.debug("getSelectedChatBox", views);

        for (var i=0; i<views.length; i++)
        {
            if ((views[i].get('type') === "chatroom" || views[i].get('type') === "chatbox") && !views[i].get('hidden'))
            {
                view = _converse.chatboxviews.views[views[i].id];
                break;
            }
        }
        return view;
    }

    function replyInverseChat(text)
    {
        var box = getSelectedChatBox();

        console.debug("replyInverseChat", text, box);

        if (box)
        {
            var textArea = box.el.querySelector('.chat-textarea');
            if (textArea) textArea.value = ">" + text + "\n\n";
        }
    }
    function newElement (el, id, html, className)
    {
        var ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        if (className) ele.classList.add(className);
        document.body.appendChild(ele);
        return ele;
    }

    function addToolbarItem (view, id, label, html)
    {
        let placeHolder = view.el.querySelector('#place-holder');

        if (!placeHolder)
        {
            const toolbar = view.el.querySelector('.chat-toolbar');
            toolbar.appendChild(newElement('li', 'place-holder'));
            placeHolder = view.el.querySelector('#place-holder');
        }
        var newEle = newElement('li', label, html);
        placeHolder.insertAdjacentElement('afterEnd', newEle);
        return newEle;
    }
}));
