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
    var mucJids = {}, nextItem = 0;

    converse.plugins.add("muc-directory", {
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
                  return '<div class="modal" id="mucDirModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title"><b><p class="fa fa-comments"></p>&nbsp;Group Chat Directory</b></h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body">' +
                         '<div class="pade-col-container" style="overflow-x:hidden; overflow-y:scroll; height: 400px;" id="pade-directory-results"></div>' +
                         '</div>' +
                         '<div class="modal-footer"><button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
                         '</div> </div> </div>';
                },
                afterRender() {
                  const that = this;

                  this.el.addEventListener('shown.bs.modal', function()
                  {
                     that.doDirectory();

                  }, false);
                },
                events: {

                },

                doDirectory() {
                    console.debug("doDirectory");

                    function loadMore()
                    {
                        console.debug("loadMore", jids.length, nextItem);

                       if (nextItem < jids.length) for (var i = 0; i < 16; i++)
                       {
                            if (nextItem < jids.length)
                            {
                                getRoomDetails(jids[nextItem], directoryResults);
                                nextItem++;
                            }
                        }
                    }

                    const that = this;
                    const directoryResults = that.el.querySelector("#pade-directory-results");
                    let jids = Object.getOwnPropertyNames(mucJids);
                    //const jids = jids.sort();

                    directoryResults.addEventListener('scroll', function()
                    {
                        if (directoryResults.scrollTop + directoryResults.clientHeight >= directoryResults.scrollHeight) {
                            loadMore();
                        }
                    });

                    if (directoryResults.innerHTML == "") loadMore();
                }
            });

            Promise.all([_converse.api.waitUntil('controlBoxInitialized'), _converse.api.waitUntil('VCardsInitialized'), _converse.api.waitUntil('rosterContactsFetched'), _converse.api.waitUntil('chatBoxesFetched'), _converse.api.waitUntil('roomsPanelRendered'), _converse.api.waitUntil('bookmarksInitialized')]).then(() =>
            {
                const section = document.body.querySelector('.d-flex.controlbox-padded');

                if (section)
                {
                    const mucButton = __newElement('a', null, '<a class="controlbox-heading__btn fa fa-list-alt align-self-center" title="Find Group Chat"></a>');
                    section.appendChild(mucButton);

                    mucButton.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        if (!directoryDialog)
                        {
                            directoryDialog = new DirectoryDialog({ 'model': new converse.env.Backbone.Model({}) });
                        }
                        directoryDialog.show();

                    }, false);

                    getChats();
                }
            });

            console.log("muc directory plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                parseMessageForCommands: function(text) {
                    console.debug('directory - parseMessageForCommands', text);

                    const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                    const command = match[1].toLowerCase();

                    if (command === "dir")
                    {
                        if (!directoryDialog)
                        {
                            directoryDialog = new DirectoryDialog({ 'model': new converse.env.Backbone.Model({}) });
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

    function getChats()
    {
        const domains = {};
        domains[_converse.connection.domain] = {}; // boostrap with own domain;

        _converse.roster.forEach(function(contact)
        {
            console.debug("muc-directory contact", contact);

            const domain = converse.env.Strophe.getDomainFromJid(contact.get("id"));
            if (domain.indexOf("pade.") == -1) domains[domain] = {};
        });

        console.debug("muc-directory domains", domains);
        Object.getOwnPropertyNames(domains).forEach(getComponents);
    }

    async function getComponents(domain)
    {
        //console.debug("getComponents", domain);
        const stanza = await _converse.api.disco.items(domain);
        //console.debug("getComponents", stanza);
        stanza.querySelectorAll('item').forEach(getComponent);
    }

    async function getComponent(component)
    {
        //console.debug("getComponent", component);
        const jid = component.getAttribute("jid");
        const name = component.getAttribute("name");
        let isMuc = false;

        //console.debug("getComponent", jid, name);
        const stanza = await _converse.api.disco.info(jid);
        //console.debug("getComponent", stanza);

        stanza.querySelectorAll('feature').forEach(function(feature)
        {
            const type = feature.getAttribute("var");
            //console.debug("getComponent", type);
            if (type == "http://jabber.org/protocol/muc") isMuc = true;
        });

        if (isMuc)
        {
            const stanza2 = await _converse.api.disco.items(jid);
            //console.debug("getComponent muc rooms", stanza2);
            stanza2.querySelectorAll('item').forEach(getRoom);
        }
    }

    function getRoom(item)
    {
        const room = item.getAttribute("jid");
        console.debug("getRoom", room);
        mucJids[room] = {jid: room};
    }

    async function getRoomDetails(room, ele)
    {
        console.debug("getRoomDetails", room, ele);

        const stanza = await _converse.api.disco.info(room);

        mucJids[room].label = stanza.querySelector('identity').getAttribute("name");
        mucJids[room].subject = getValue(stanza.querySelector('field[var="muc#roominfo_subject"] > value'));
        mucJids[room].occupants = getValue(stanza.querySelector('field[var="muc#roominfo_occupants"] > value'));
        mucJids[room].description = getValue(stanza.querySelector('field[var="muc#roominfo_description"] > value'));

        _converse.connection.sendIQ(converse.env.$iq({type: 'get', to: room}).c('vCard', {xmlns: 'vcard-temp'}),

            function(iq)
            {
                const photo = iq.querySelector('vCard PHOTO');

                if (photo)
                {
                    const binval = photo.querySelector('BINVAL').innerHTML;
                    const type = photo.querySelector('TYPE').innerHTML

                    if (binval != "" &&  type != "")
                    {
                        mucJids[room].avatar = 'data:' + type + ';base64,' + binval;
                        createPanel(mucJids[room], ele);
                    }
                }
            },

            function (err)
            {
                mucJids[room].avatar = createAvatar(mucJids[room].label);
                createPanel(mucJids[room], ele);
            }
        );
    }

    function createPanel(room, chatgrid)
    {
        console.debug("createPanel", room, chatgrid);

        const html = '<div title="' + room.jid + '" data-room-jid="' + room.jid + '" class="pade-col-content"><span data-room-jid="' + room.jid + '" class="pade-col-badge" data-badge="' + room.occupants + '"><img style="width: 32px" data-room-jid="' + room.jid + '" class="avatar" src="' + room.avatar + '"/></span><h3 data-room-jid="' + room.jid + '">' + room.label + '</h3><p class="pade-col-desc" title="' + room.description + '">' + room.description + '</p></div>';
        const panel = __newElement('div', room.jid, html, 'pade-col');

        panel.addEventListener('click', function(evt)
        {
            evt.stopPropagation();

            const jid = evt.target.getAttribute('data-room-jid');
            console.debug("createPanel click", jid, evt.target);

            if (jid)
            {
                directoryDialog.modal.hide();
                _converse.api.rooms.open(jid);
            }

        });

        chatgrid.appendChild(panel);
    }

    function getValue(value)
    {
        return value && value.innerHTML != "" ? value.innerHTML : '&nbsp;';
    }

}));
