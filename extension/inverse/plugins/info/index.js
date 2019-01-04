window.addEventListener("load", function()
{
    var urlParam = function (name)
    {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (!results) { return undefined; }
        return unescape(results[1] || undefined);
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
      return filename.endsWith('.mp4') || filename.endsWith('.webm');
    };

    var isOnlyOfficeDoc = function (url)
    {
        var onlyOfficeDoc = false;
        var pos = url.lastIndexOf(".");

        if (pos > -1)
        {
            var exten = url.substring(pos + 1);
            onlyOfficeDoc = "doc docx ppt pptx xls xlsx csv pdf".indexOf(exten) > -1;
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

    var newElement = function(el, item, className)
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
                previewDialog = new PreviewDialog({'model': new top.inverse.env.Backbone.Model({url: evt.target.title, type: evt.target.name}) });
                previewDialog.show();
            }
            else {  // insert into textarea
                top.replyInverseChat(evt.target.title);
            }

        });

        return item.ele;
    }

    var renderMedia = function (eleName, urls)
    {
        urls.sort(sortUrls);

        var count = document.getElementById(eleName + "-count");
        var detail = document.getElementById(eleName + "-details");

        if (detail && count && urls.length > 0)
        {
            count.innerHTML = urls.length;

            for (var i=0; i<urls.length; i++)
            {
                detail.insertAdjacentElement('afterEnd', newElement('li', urls[i], "mediaItem"));
            }
        }
    };

    PreviewDialog = top._inverse.BootstrapModal.extend({
        initialize() {
            top._inverse.BootstrapModal.prototype.initialize.apply(this, arguments);
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

    var jid = urlParam("jid");
    var type = urlParam("type");
    var id = urlParam("id");
    var media = {photo:{urls:[]}, video:{urls:[]}, link:{urls:[]}, vmsg:{urls:[]}, ppt:{urls:[]}};

    console.debug("Info - Chatbox", jid, type, id);

    top._inverse.api.archive.query({before: '', max: 9999999, 'groupchat': true, 'with': jid}, messages =>
    {
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
                        else

                        if (isOnlyOfficeDoc(file))
                        {
                            media.ppt.urls.push({url: urls[j], file: file, from: from, type: "doc"});
                        }
                        else

                        if (isH5p(urls[j]))
                        {
                            media.ppt.urls.push({url: urls[j], file: file, from: from, type: "h5p"});
                        }

                        else {
                            media.link.urls.push({url: urls[j], file: urls[j], from: from, type: "link"});
                        }
                    }
                }
            }
        }

        renderMedia("vmsg", media.vmsg.urls);
        renderMedia("photo", media.photo.urls);
        renderMedia("video", media.video.urls);
        renderMedia("ppt", media.ppt.urls);
        renderMedia("link", media.link.urls);

        console.debug("media", media);
    });
});