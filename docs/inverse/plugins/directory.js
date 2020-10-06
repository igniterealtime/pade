(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
    var Strophe, $iq;
    var DirectoryDialog = null;
    var directoryDialog = null;

    converse.plugins.add("directory", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            Strophe = converse.env.Strophe;
            $iq = converse.env.$iq;

            DirectoryDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  const box =  padeapi.getSelectedChatBox();
                  let inviteButton = "";

                  if (box && box.model.get("type") == "chatroom")
                  {
                      inviteButton = '<button type="button" class="btn btn-success" data-dismiss="modal">Invite</button>';
                  }

                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title"><b>User Directory</b></h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body">' +
                         '<input id="pade-directory-query" class="form-control" type="text" placeholder="Type a query string and press [Enter] to search user directory" ><p/><div style="overflow-x:hidden; overflow-y:scroll; height: 400px;" id="pade-directory-results"></div>' +
                         '</div>' +
                         '<div class="modal-footer">' + inviteButton + '<button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                  var that = this;
                  this.el.addEventListener('shown.bs.modal', function()
                  {
                      if (that.model.get("query"))
                      {
                          that.doDirectory();
                      }
                      else {
                        that.el.querySelector('#pade-directory-query').focus();
                      }

                  }, false);
                },
                events: {
                    'keyup #pade-directory-query': 'keyUp',
                    'click .btn-success': 'doInvite'
                },

                keyUp(ev) {
                    if (ev.key === "Enter")
                    {
                        var query = this.el.querySelector("#pade-directory-query").value.trim();
                        this.model.set("query", query)
                        this.doDirectory();
                    }
                },

                doDirectory() {
                    var that = this;
                    var query = that.model.get("query");

                    if (query != "")
                    {
                        var directoryResults = that.el.querySelector("#pade-directory-results");
                        console.debug("doDirectory", query);

                        findUsers(query, function(userList)
                        {
                            displayUsers(userList, directoryResults);
                        });
                    }
                },

                doInvite() {
                    var invitees = this.el.querySelectorAll(".check-invitee");

                    var chatRoom =  padeapi.getSelectedChatBox();

                    if (chatRoom)
                    {
                        var roomJid = chatRoom.model.get("jid");

                        for (var i=0; i<invitees.length; i++)
                        {
                            console.debug('inviting - jid', invitees[i].getAttribute("data-jid"), invitees[i].checked);

                            if (invitees[i].checked)
                            {
                                chatRoom.model.directInvite(invitees[i].getAttribute("data-jid"), "Please join me in");
                            }
                        }
                    }
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                console.debug('directory - renderToolbar', view.model);

                if (!view.el.querySelector(".fa-male") && getSetting("showToolbarIcons", true))
                {
                    var id = view.model.get("box_id");
                    var directory = padeapi.addToolbarItem(view, id, "pade-directory-" + id, '<a title="Search User Directory"><span class="fa fa-male"></span><span class="fa fa-female"></span></a>');

                    directory.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        if (!directoryDialog)
                        {
                            directoryDialog = new DirectoryDialog({ 'model': new converse.env.Backbone.Model({}) });
                        }
                        directoryDialog.show();
                    }, false);
                }
            });

            console.log("directory plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                parseMessageForCommands: function(text) {
                    console.debug('directory - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();

                    if (command === "find")
                    {
                        if (!directoryDialog)
                        {
                            directoryDialog = new DirectoryDialog({ 'model': new converse.env.Backbone.Model({query: match[2]}) });
                        }
                        else {
                            directoryDialog.model.set("query", match[2]);
                        }
                        directoryDialog.show();
                        return true;
                    }
                    else

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                }
            }
        }
    });

    function findUsers(search, callback)
    {
        if (bgWindow && bgWindow.pade)
        {
            var url =  "https://" + bgWindow.pade.server + "/rest/api/restapi/v1/meet/profile/" + search;
            var options = {method: "GET", headers: {"authorization": "Basic " + btoa(bgWindow.pade.username + ":" + bgWindow.pade.password), "accept": "application/json"}};

            console.debug("findUsers", url, options);

            fetch(url, options).then(function(response){ return response.json()}).then(function(props)
            {
                console.debug("getUserProperties ok", props);
                if (callback) callback(props);

            }).catch(function (err) {           // no chat api, use XMMP search
                findUsers2(search, callback)
            });

        } else findUsers2(search, callback);
    }

    var findUsers2 = function (search, callback)
    {
        console.debug('findUsers2', search);

        var iq = $iq({type: 'set', to: "search." + _converse.connection.domain}).c('query', {xmlns: 'jabber:iq:search'}).c('x').t(search).up().c('email').t(search).up().c('nick').t(search);

        _converse.connection.sendIQ(iq, function(response)
        {
            var users = [];
            var items = response.querySelectorAll('query item');

            for (var i=0; i<items.length; i++)
            {
                console.debug('findUsers2 - item', items[i]);

                var jid = items[i].getAttribute('jid');
                var username = Strophe.getNodeFromJid(jid);
                var name = items[i].querySelector('nick').innerHTML;
                var email = items[i].querySelector('email').innerHTML;

                console.debug('findUsers2 response', username, name, jid, email);
                users.push({username: username, name: name, email: email, jid: jid});
            };

            if (callback) callback(users);

        }, function (error) {
            console.error('findUsers2', error);
        });
    }

    var removeDuplicates = function(userList)
    {
        console.debug('removeDuplicates', userList);

        var usersObj = {};

        for (var i=0; i < userList.length; i++ )
        {
            usersObj[userList[i].jid] = userList[i];
        }

        var users = new Array();

        for (var key in usersObj)
        {
            users.push(usersObj[key]);
        }

        return users;
    }

    var displayUsers = function(userList, directoryResults)
    {
        console.debug('displayUsers', userList);

        var box =  padeapi.getSelectedChatBox();
        var inviteHdr = "";
        if (box && box.model.get("type") == "chatroom") inviteHdr = "<th>Invite</th>";

        var users = removeDuplicates(userList);
        var html = "<table style='margin-left: 15px'><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th>" + inviteHdr + "</tr>";
        var count = 0;

        for (var i=0; i<users.length; i++)
        {
            var user = users[i];
            var inviteDetail = "";
            if (box && box.model.get("type") == "chatroom") inviteDetail = "<td><input class='check-invitee' data-jid='" + user.jid + "' type='checkbox'></td>";

            if (!user.email) user.email = "";
            if (!user.caller_id_number) user.caller_id_number = "";

            html = html + "<tr><td><a class='plugin-directory-jid' title='click here to open chat with " + user.jid + "' id='" + user.jid + "' href='#'>" + user.jid + "</a></td><td>" + user.name + "</td><td>" + user.email + "</td><td><a class='plugin-directory-phone' name='" + user.caller_id_number + "' id='phone-" + user.jid + "' title='Click here to call or transfer call to " + user.caller_id_number + "' href='#'>" + user.caller_id_number + "</a></td>" + inviteDetail + "</tr>";
        }
        html = html + "</table>"

        if (users.length == 0) html = "No user found";

        directoryResults.innerHTML = "<p/><p/>" + html;

        setTimeout(function()
        {
            var jids = directoryResults.querySelectorAll(".plugin-directory-jid");

            var setTheAvatar = function(element, imgHref)
            {
                element.innerHTML = "<img style='width: 22px;' src='" + imgHref + "'>" + element.innerHTML;
            }

            jids.forEach(function(element)
            {
                console.debug('displayUsers - jids', element.innerHTML);

                if (bgWindow) bgWindow.getVCard(element.innerHTML, function(vCard)
                {
                    console.debug("displayUsers vcard", vCard);
                    setTheAvatar(element, vCard.avatar ? vCard.avatar : bgWindow.createAvatar(element.innerHTML));

                }, function() {
                    setTheAvatar(element, bgWindow.createAvatar(element.innerHTML));
                });

                element.addEventListener("click", function(e)
                {
                    e.stopPropagation();
                    var user = e.target;

                    console.debug("findUsers - click", user.id, user.name, user.title);
                    _converse.api.chats.open(user.id)
                });
            });

            var phones = directoryResults.querySelectorAll(".plugin-directory-phone");

            for (var i=0; i<phones.length; i++)
            {
                console.debug('displayUsers - phones', phones);

                phones[i].addEventListener("click", function(e)
                {
                    e.stopPropagation();
                    var user = e.target;
                    var phone = getSetting("exten", null)

                    if (phone && phone != "" && bgWindow && bgWindow.pade.chatAPIAvailable)
                    {
                        console.debug("findUsers phone - click", user.name);

                        if (bgWindow) bgWindow.makePhoneCall(phone, user.name, function(err)
                        {
                            if (err) alert("Telephone call failed!!");
                        });

                    } else alert("Phone Extension not configured");
                });
            }

        }, 1000)
    }

}));
