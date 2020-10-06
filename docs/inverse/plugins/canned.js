(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var CannedDialog = null;
    var cannedDialog = null;

    converse.plugins.add("canned", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            CannedDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">Canned Responses</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body">' +
                         '<input id="pade-canned-responses" class="form-control" type="text" placeholder="Start typing to canned" ><p/><div style="overflow-x:hidden; overflow-y:scroll; height: 400px;" id="pade-canned-results"></div>' +
                         '</div>' +
                         '<div class="modal-footer"> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                  var that = this;
                  this.el.addEventListener('shown.bs.modal', function()
                  {
                      if (that.model.get("response"))
                      {
                          that.doCannedResponses();
                      }
                      else {
                        that.el.querySelector('#pade-canned-responses').focus();
                      }

                  }, false);
                },
                events: {
                    'keyup #pade-canned-responses': 'keyUp'
                },

                keyUp(ev) {
                    if (ev.key === "Enter")
                    {
                        var response = this.el.querySelector("#pade-canned-responses").value.trim();
                        this.model.set("response", response)
                        this.doCannedResponses();
                    }
                },

                doCannedResponses() {
                    var that = this;
                    var textArea = that.model.get("textArea");
                    var response = that.model.get("response");
                    var responses = that.model.get("responses");

                    if (response != "" && responses)
                    {
                        var html = "<table style='margin-left: 15px'><tr><th>Response</th><th>Description</th></tr>";
                        var count = 0, singleton = -1;

                        for (var i = 0; i < responses.length; i++)
                        {
                            if (response.length == 0 || responses[i].name.toLowerCase().indexOf(response.toLowerCase()) > -1 || responses[i].description.toLowerCase().indexOf(response.toLowerCase()) > -1)
                            {
                                singleton = i;
                                html = html + "<tr><td width='30%'>" + responses[i].name + "</td><td><a id='resp-" + count + "' href='#' title='click here to pate in input area'><pre>" + responses[i].description + "</pre></a></td></tr>";
                                count++;
                            }
                        }

                        if (count == 1)
                        {
                            textArea.value = responses[singleton].description;
                            this.modal.hide();

                        } else {

                            that.el.querySelector("#pade-canned-results").innerHTML = html;

                            setTimeout(function()
                            {
                                for (var i = 0; i < count; i++)
                                {
                                    that.el.querySelector("#resp-" + i).addEventListener("click", function(e)
                                    {
                                        e.stopPropagation();
                                        textArea.value = e.target.innerText;
                                        that.modal.hide();

                                    }, false);
                                }
                            },1000);
                        }
                    }
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                if (!view.el.querySelector(".fa-sticky-note") && getSetting("showToolbarIcons", true))
                {
                    var id = view.model.get("box_id");
                    var canned = padeapi.addToolbarItem(view, id, "pade-canned-" + id, '<a class="fas fa-sticky-note" title="Canned Responses/Replies"></a>');

                    canned.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation(view, id);
                        doCannedMsg(view);

                    }, false);
                }
            });

            console.log("canned plugin is ready");
        },

        'overrides': {
            ChatBoxView: {
                parseMessageForCommands: function(text) {
                    console.debug('canned - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();

                    if (command == "msg" && match[2]) return doCannedMsg(this, match[2]);
                    else

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                }
            }
        }
    });

    var doCannedMsg = function(view, response)
    {
        var id = view.model.get("box_id");
        var textArea = view.el.querySelector('.chat-textarea');
        var responses = getAnswersListFromStorage();

        console.debug("canned", response, responses);

        if (!cannedDialog)
        {
            cannedDialog = new CannedDialog({ 'model': new converse.env.Backbone.Model({response: response, responses: responses, textArea: textArea}) });
        }
        else {
            cannedDialog.model.set("textArea", textArea);
            cannedDialog.model.set("response", response);
            cannedDialog.model.set("responses", responses);
        }
        cannedDialog.show();

        return true;
    }

    var getAnswersListFromStorage  = function()
    {
        var localStorageKey = "store.settings.cannedResponses";
        var saved = localStorage.getItem(localStorageKey);
        var answers = [];

        if (saved && saved != '')
        {
            answers = JSON.parse(localStorage.getItem(localStorageKey));
        }
        return answers;
    }

}));
