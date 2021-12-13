(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var Strophe, $iq, DirectoryDialog = null, directoryDialog = null, _converse, dayjs, html, _, __, Model;

    converse.plugins.add("directory", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            Strophe = converse.env.Strophe;
            $iq = converse.env.$iq;
            html = converse.env.html;
            dayjs = converse.env.dayjs;
            Model = converse.env.Model;
            BootstrapModal = converse.env.BootstrapModal;
            _ = converse.env._;
            __ = _converse.__;

            DirectoryDialog = BootstrapModal.extend({
                id: "plugin-directory-modal",				
                initialize() {
                    BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.listenTo(this.model, 'change', this.render);
                },
                toHTML() {
                  return html`<div class="modal-dialog modal-lg" role="document"> <div class="modal-content">
                         <div class="modal-header"><h1 class="modal-title" id="converse-plugin-directory-label">Directory</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>
                         <div class="modal-body">
                         <input id="pade-directory-query" class="form-control" type="text" placeholder="Type a query string and press [Enter] to search user directory" ><p/><div id="pade-directory-results"></div>
                         </div>
                         <div class="modal-footer"> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>
                         </div> </div>`
                },
                afterRender() {
                  var that = this;
                  this.el.addEventListener('shown.bs.modal', function()
                  {
                      if (that.model.get("query"))
                      {
                          that.el.querySelector('#pade-directory-query').style.display = "none";
                          that.doDirectory();
                      }
                      else {
                        that.el.querySelector('#pade-directory-query').focus();
                      }

                  }, false);
                },
                events: {
                    'keyup #pade-directory-query': 'keyUp'
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
                }
            });

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
                console.debug("getToolbarButtons", toolbar_el.model.get("jid"));
                let color = "fill:var(--chat-toolbar-btn-color);";
                if (toolbar_el.model.get("type") == "chatroom") color = "fill:var(--muc-toolbar-btn-color);";

                buttons.push(html`
                    <button class="plugin-directory" title="${__('Lookup Directory')}" @click=${performDirectory}/>
                        <svg style="width:18px; height:18px;  ${color}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g><path d="M 2,0C 0.896,0,0,0.896,0,2l0,28 c0,1.104, 0.896,2, 2,2l 2,0 L 4,0 L 2,0 zM 26,0L 6,0 l0,32 l 20,0 c 1.104,0, 2-0.896, 2-2L 28,2 C 28,0.896, 27.104,0, 26,0z M 16.89,7.708 c 1.672,0, 3.026,1.356, 3.026,3.026c0,1.672-1.356,3.028-3.026,3.028c-1.672,0-3.028-1.356-3.028-3.028 C 13.862,9.062, 15.218,7.708, 16.89,7.708z M 12,21.614c0-3.668, 2.218-6.64, 4.952-6.64s 4.952,2.974, 4.952,6.64S 12,25.28, 12,21.614zM 30,2L 32,2L 32,8L 30,8zM 30,10L 32,10L 32,16L 30,16zM 30,18L 32,18L 32,24L 30,24z"></path></g></svg>
                    </button>
                `);

                return buttons;
            });

            console.debug("directory plugin is ready");
        }
    });

    var performDirectory = function(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();

        directoryDialog = new DirectoryDialog({ 'model': new Model({}) });
        directoryDialog.model.set("query", null);
        directoryDialog.show(ev);
    }

    var findUsers = function (search, callback)
    {
        console.debug('findUsers', search);

        var iq = $iq({type: 'set', to: "search." + _converse.connection.domain}).c('query', {xmlns: 'jabber:iq:search'}).c('x').t(search).up().c('email').t(search).up().c('nick').t(search);

        _converse.connection.sendIQ(iq, function(response)
        {
            console.debug('findUsers - response', response);			
            var users = [];
            var items = response.querySelectorAll('query item');

            for (var i=0; i<items.length; i++)
            {
                console.debug('findUsers - item', items[i]);

                var jid = items[i].getAttribute('jid');
                var username = Strophe.getNodeFromJid(jid);
                var name = items[i].querySelector('nick').innerHTML;
                var email = items[i].querySelector('email').innerHTML;

                console.debug('findUsers response', username, name, jid, email);
                users.push({username: username, name: name, email: email, jid: jid});
            };

            if (callback) callback(users);

        }, function (error) {
            console.error('findUsers', error);
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

        var users = removeDuplicates(userList);
        var html = "<div id='plugin-directory'><table style='margin-left: 15px'><tr><th>Name</th><th>JID</th><th>Email</th></tr>";
        var count = 0;

        for (var i=0; i<users.length; i++)
        {
            var user = users[i];
            if (!user.email) user.email = "";

            html = html + "<tr><td><a class='plugin-directory-jid' title='" + user.name + "' id='" + user.jid + "' href='#'>" + user.name + "</a></td><td>" + user.jid + "</td><td>" + user.email + "</td></tr>";
        }
        html = html + "</table></div>"

        if (users.length == 0) html = "No user found";

        directoryResults.innerHTML = "<p/><p/>" + html;

        setTimeout(function()
        {
            var jids = directoryResults.querySelectorAll(".plugin-directory-jid");

            for (var i=0; i<jids.length; i++)
            {
                console.debug('displayUsers - jids', jids[i]);

                jids[i].addEventListener("click", function(e)
                {
                    e.stopPropagation();
                    var user = e.target;

                    console.debug("findUsers - click", user.id, user.name, user.title);
                    _converse.api.chats.open(user.id, {'bring_to_foreground': true}, true);
                });
            }
        }, 1000);
    }

}));
