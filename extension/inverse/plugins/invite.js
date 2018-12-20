(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
    var Strophe = converse.env.Strophe;
    var $iq = converse.env.$iq;
    var DirectoryDialog = null;
    var inviteDialog = null;
    var inviteAvailable = false;

    converse.plugins.add("invite", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            DirectoryDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title"><b>Invitations</b></h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body">' +
                         '<input id="pade-invite-query" class="form-control" type="text" placeholder="Type a query string and press [Enter] to find an invitation" ><p/><div id="pade-invite-results"></div>' +
                         '</div>' +
                         '<div class="modal-footer"> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                  var that = this;
                  this.el.addEventListener('shown.bs.modal', function()
                  {
                      if (that.model.get("query"))
                      {
                          that.el.querySelector('#pade-invite-query').style.display = "none";
                          that.doDirectory();
                      }
                      else {
                        that.el.querySelector('#pade-invite-query').focus();
                      }

                  }, false);
                },
                events: {
                    'keyup #pade-invite-query': 'keyUp'
                },

                keyUp(ev) {
                    if (ev.key === "Enter")
                    {
                        var query = this.el.querySelector("#pade-invite-query").value.trim();
                        this.model.set("query", query)
                        this.doDirectory();
                    }
                },

                doDirectory() {
                    var that = this;
                    var query = that.model.get("query");
                    var model = that.model.get("model");

                    if (query != "")
                    {
                        var inviteResults = that.el.querySelector("#pade-invite-results");
                        console.debug("doDirectory", query);

                        findInvitations(query, inviteResults, model);
                    }
                }
            });

            console.log("invite plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                renderToolbar: function renderToolbar(toolbar, options) {
                    var result = this.__super__.renderToolbar.apply(this, arguments);

                    var view = this;
                    var id = this.model.get("box_id");
                    var type = this.model.get("type");
                    var jid = this.model.get("jid");

                    if (type === "chatroom")
                    {
                        addToolbarItem(view, id, "pade-invite-" + id, '<a class="fas fa-user-plus" title="Invite others to this chat with a saved invitation"></a>');
                        inviteAvailable = true;

                        setTimeout(function()
                        {
                            var invite = document.getElementById("pade-invite-" + id);

                            if (invite) invite.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                inviteDialog = new DirectoryDialog({ 'model': new converse.env.Backbone.Model({model: view.model}) });
                                inviteDialog.show();
                            }, false);
                        });
                    }

                    return result;
                }
            }
        }
    });

    function findInvitations(keyword, inviteResults, model)
    {
        if (bgWindow)
        {
            var meetings = {};
            var encoded = window.localStorage["store.settings.savedMeetings"];
            if (encoded) meetings = JSON.parse(atob(encoded));

            var html = "<p/><p/><table style='margin-left: 15px'><tr><th>Meeting</th><th>Participants</th></tr>";
            var saveMeetings = Object.getOwnPropertyNames(meetings);

            console.debug("findInvitations", keyword, inviteResults, saveMeetings, meetings);

            for (var i=0; i<saveMeetings.length; i++)
            {
                var meeting = meetings[saveMeetings[i]];
                var participants = "";

                for (var j=0; j<meeting.inviteList.length; j++)
                {
                    participants = participants + meeting.inviteList[j] + "<br/>"
                }

                var newItem = "<tr><td><a href='#' class='plugin-invite-jid' title='Invite participants to join this Meeting' id='" + meeting.room + "'>" + meeting.invite + "</a></td><td>" + participants + "</td></tr>";

                if (keyword.length == 0 || newItem.toLowerCase().indexOf(keyword.toLowerCase()) > -1)
                {
                    html = html + newItem;
                }
            }

            inviteResults.innerHTML = html;

            setTimeout(function()
            {
                var saveMeetings = inviteResults.querySelectorAll(".plugin-invite-jid");

                for (var i=0; i<saveMeetings.length; i++)
                {
                    saveMeetings[i].addEventListener("click", function(e)
                    {
                        console.debug("findInvitations - click", e.target.id);

                        e.stopPropagation();

                        if (confirm(chrome.i18n ? chrome.i18n.getMessage("inviteConfirm") : "Are you sure?"))
                        {
                            var meeting = meetings[e.target.id];

                            for (var j=0; j<meeting.inviteList.length; j++)
                            {
                                // make sure we have a jid entry and not blank line

                                if (meeting.inviteList[j] && meeting.inviteList[j].indexOf("@") > -1)
                                {
                                    model.directInvite(meeting.inviteList[j], meeting.invite);
                                }
                            }
                            alert("Completed!!");
                        }

                    }, false);
                }

            }, 1000);
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
