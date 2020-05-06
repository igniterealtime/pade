(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var VmsgDialog = null;
    var vmsgDialog = null;
    var _converse = null;

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

            _converse.api.listen.on('renderToolbar', function(view)
            {
                if (!view.el.querySelector(".fa-microphone") && getSetting("showToolbarIcons", true))
                {
                    var id = view.model.get("box_id");
                    var vmsg = padeapi.addToolbarItem(view, id, "pade-vmsg-" + id, '<a class="fas fa-microphone" title="Voice Message. Click to create"></a>');

                    if (vmsg) vmsg.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        if (!vmsgDialog)
                        {
                            vmsgDialog = new VmsgDialog({ 'model': new converse.env.Backbone.Model({view: view}) });
                        }
                        else {
                            vmsgDialog.model.set("view", view);
                        }
                        vmsgDialog.show();

                    }, false);
                };
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
                        if (!vmsgDialog)
                        {
                            vmsgDialog = new VmsgDialog({ 'model': new converse.env.Backbone.Model({view: this}) });
                        }
                        else {
                            vmsgDialog.model.set("view", this);
                        }
                        vmsgDialog.show();
                        return true;
                    }
                    else

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                }
            }
        }
    });
}));
