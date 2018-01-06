var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.Upload = (function(self, Candy, $)
{
    var connection = null;
    var nickname = null;

    self.init = function()
    {
        var html = '<li id="upload-control-icon" data-tooltip="Upload files"><img id="upload-control" src="candyshop/upload/paperclip.png"></span></li>';
        $('#emoticons-icon').after(html);

        $('#upload-control-icon').click(function(event)
        {
            CandyShop.Upload.showUploader(this);
        });

        $(Candy).on('candy:view.message.before-render', function(e, args)
        {
            var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            try {
                var temp = args.templateData.message.replace(exp, "<a target='_blank' href='$1'>$1</a>");
                if (temp && temp != "") args.templateData.message = temp;
            } catch (e) {}
        });

        $(Candy).on('candy:view.room.after-show', function(ev, obj)
        {
            var pane_html = Candy.View.Pane.Room.getPane(obj.roomJid);
            var dropZone = $(pane_html).find('.message-pane-wrapper')[0];

            dropZone.addEventListener('dragover', CandyShop.Upload.handleDragOver, false);
            dropZone.addEventListener('drop', CandyShop.Upload.handleDropFileSelect, false);

            console.log("candy:view.room.after-show", obj);
        });

        $(Candy).on('candy:view.room.after-hide', function(ev, obj)
        {
            var pane_html = Candy.View.Pane.Room.getPane(obj.roomJid);
            var dropZone = $(pane_html).find('.message-pane-wrapper')[0];

            dropZone.removeEventListener('dragover', CandyShop.Upload.handleDragOver, false);
            dropZone.removeEventListener('drop', CandyShop.Upload.handleDropFileSelect, false);

            console.log("candy:view.room.after-hide", obj);
        });
    };

    self.handleDragOver = function(evt)
    {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    };

    self.handleDropFileSelect = function(evt)
    {
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files;

        for (var i = 0, f; f = files[i]; i++)
        {
            CandyShop.Upload.uploadFile(f);
        }
    };


    self.showUploader = function(elem)
    {
        var handleClickFileSelect = function(evt)
        {
            var files = evt.target.files;

            for (var i = 0, f; f = files[i]; i++)
            {
                CandyShop.Upload.uploadFile(f);
            }

            var menu = $('#context-menu');
            Candy.View.Pane.Room.setFocusToForm(Candy.View.getCurrent().roomJid);
            menu.hide();
        }

        elem = $(elem);

        var pos = elem.offset();
        var menu = $('#context-menu');
        var upload = '<input type="file" id="files" name="files[]" multiple />'

        $('#tooltip').hide();

        content = $('ul', menu);
        content.html('<li class="upload">' + upload + '</li>');
        var fileButton = document.getElementById('files');
        fileButton.addEventListener('change', handleClickFileSelect, false);

        var posLeft = Candy.Util.getPosLeftAccordingToWindowBounds(menu, pos.left),
            posTop  = Candy.Util.getPosTopAccordingToWindowBounds(menu, pos.top);

        menu.css({'left': posLeft.px, 'top': posTop.px, backgroundPosition: posLeft.backgroundPositionAlignment + ' ' + posTop.backgroundPositionAlignment});
        menu.fadeIn('fast');

        return true;
    };


    self.uploadFile = function(file)
    {
        //console.log("CandyShop.Upload.uploadFile", file);
        var connection = Candy.Core.getConnection();

        var iq = $iq({type: 'get', to: "httpfileupload." + connection.domain}).c('request', {xmlns: "urn:xmpp:http:upload:0"}).c('filename').t(file.name).up().c('size').t(file.size);
        var getUrl = null;
        var putUrl = null;
        var errorText = null;

        connection.sendIQ(iq, function(response)
        {
            //console.log("CandyShop.Upload.uploadFile response", response);

            $(response).find('slot').each(function()
            {
                $(response).find('put').each(function()
                {
                    putUrl = $(this).text();
                });

                $(response).find('get').each(function()
                {
                    getUrl = $(this).text();
                });

                console.log("CandyShop.Upload.uploadFile", putUrl, getUrl);

                if (putUrl != null & getUrl != null)
                {
                    var req = new XMLHttpRequest();

                    req.onreadystatechange = function()
                    {
                      if (this.readyState == 4 && this.status >= 200 && this.status < 400)
                      {
                        console.log("CandyShop.Upload.ok", this.statusText);
                        Candy.Core.Action.Jabber.Room.Message(Candy.View.getCurrent().roomJid, getUrl, "groupchat");
                      }
                      else

                      if (this.readyState == 4 && this.status >= 400)
                      {
                        console.error("CandyShop.Upload.error", this.statusText);
                        Candy.Core.Action.Jabber.Room.Message(Candy.View.getCurrent().roomJid, this.statusText, "groupchat");
                      }

                    };
                    req.open("PUT", putUrl, true);
                    req.send(file);
                }
            });

        }, function(error) {

            $(error).find('text').each(function()
            {
                errorText = $(this).text();
                console.log("CandyShop.Upload.uploadFile error", errorText);
                Candy.Core.Action.Jabber.Room.Message(Candy.View.getCurrent().roomJid, errorText, "groupchat");
            });
        });
    };

    return self;
}(CandyShop.Upload || {}, Candy, jQuery));
