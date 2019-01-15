(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var VmsgDialog = null;
    var vmsgDialog = null;

    converse.plugins.add("vmsg", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            VmsgDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                },
                toHTML() {
                  var view = this.model.get("view");
                  var id = view.model.get("id").split("@")[0];

                  return '<div class="modal" id="myModal"> <div class="modal-dialog"> <div class="modal-content">' +
                         '<div class="modal-header">' +
                         '  <h1 class="modal-title">Voice Message</h1>' +
                         '  <button type="button" class="close" data-dismiss="modal">&times;</button>' +
                         '</div>' +
                         '<div class="modal-body"><iframe id="iframe-vmsg-' + id + '" src="plugins/vmsg/index.html" style="width:100%; height:300px; border:none; margin:0; padding:0; overflow:hidden;"></iframe></div>' +
                         '<div class="modal-footer"> <button type="button" class="btn btn-success btn-upload-vmsg" data-dismiss="modal">Upload</button> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
                         '</div> </div> </div>';
                },
                events: {
                    "click .btn-upload-vmsg": "uploadVmsg",
                },

                uploadVmsg() {
                    var view = this.model.get("view");
                    var id = view.model.get("id").split("@")[0];
                    var mp3File = this.el.querySelector("#iframe-vmsg-" + id).contentWindow.getMp3File();

                    console.debug("upload vmsg", mp3File, id);

                    if (!mp3File)
                    {
                        alert("Nothing to upload!!");
                        return;
                    }
                    view.model.sendFiles([mp3File]);
                }
            });

            console.log("vmsg plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                parseMessageForCommands: function(text) {
                    console.debug('vmsg - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();

                    if (command === "vmsg")
                    {
                        vmsgDialog = new VmsgDialog({ 'model': new converse.env.Backbone.Model({view: this}) });
                        vmsgDialog.show();
                        return true;
                    }
                    else

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                },

                renderToolbar: function renderToolbar(toolbar, options) {

                    var id = this.model.get("box_id");

                    _converse.api.listen.on('renderToolbar', function(view)
                    {
                        isFileUploadAvailable(id, view, function()
                        {
                            addToolbarItem(view, id, "pade-vmsg-" + id, '<a class="fas fa-microphone" title="Voice Message. Click to create"></a>');

                            var vmsg = document.getElementById("pade-vmsg-" + id);

                            if (vmsg) vmsg.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                vmsgDialog = new VmsgDialog({ 'model': new converse.env.Backbone.Model({view: view}) });
                                vmsgDialog.show();

                            }, false);
                        });
                    });

                    return this.__super__.renderToolbar.apply(this, arguments);
                }
            }
        }
    });

    var isFileUploadAvailable = async function(id, view, callback)
    {
        if (id == view.model.get("box_id"))
        {
            const result = await _converse.api.disco.supports('urn:xmpp:http:upload:0', _converse.domain);
            if (result.length > 0 && !view.el.querySelector(".fa-microphone")) callback();
        }
    }

    var newElement = function (el, id, html)
    {
        var ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        document.body.appendChild(ele);
        return ele;
    }

    var addToolbarItem = function(view, id, label, html)
    {
        var placeHolder = view.el.querySelector('#place-holder');

        if (!placeHolder)
        {
            var smiley = view.el.querySelector('.toggle-smiley.dropup');
            smiley.insertAdjacentElement('afterEnd', newElement('li', 'place-holder'));
            placeHolder = view.el.querySelector('#place-holder');
        }
        placeHolder.insertAdjacentElement('afterEnd', newElement('li', label, html));
    }
}));
