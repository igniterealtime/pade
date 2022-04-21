(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var Strophe, $iq, _converse, html, __, Model, BootstrapModal;
    var MUCDirectoryDialog = null;
    var mucDirectoryDialog = null;
    var mucJids = {}, nextItem = 0, nickColors = {}, roomJids = [];

    converse.plugins.add("muc-directory", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            html = converse.env.html;
            Model = converse.env.Model;
            BootstrapModal = converse.env.BootstrapModal;
            __ = _converse.__;
            Strophe = converse.env.Strophe;
            $iq = converse.env.$iq;

            MUCDirectoryDialog = BootstrapModal.extend({
                id: "plugin-muc-directory-modal",				
                initialize() {
                    BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  return html`
                     <div class="modal-dialog modal-lg">
                         <div class="modal-content">
                             <div class="modal-header"><h1 class="modal-title"><b><p class="fa fa-comments"></p>&nbsp;Group Chat Directory</b></h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>
                             <div class="modal-body">
                                <input id="pade-muc-directory-filter" class="form-control" type="text" placeholder="Type three or more characters to filter directory" ><p/><div class="pade-col-container" style="overflow-x:hidden; overflow-y:scroll; height: 400px;" id="pade-directory-results"></div>
                             </div>
                             <div class="modal-footer"><button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>
                         </div>
                     </div>
                `},
                afterRender() {
                  const that = this;

                  this.el.addEventListener('shown.bs.modal', function()
                  {
					 nextItem = 0;
                     that.doDirectory();

                  }, false);
                },
                events: {
                    'keyup #pade-muc-directory-filter': 'keyUp',
                },

                keyUp(ev) {
                    const filter = this.el.querySelector("#pade-muc-directory-filter").value.trim();
                    this.doFilter(filter);
                },

                loadMore() {
                    const directoryResults = this.el.querySelector("#pade-directory-results");
                    const filter = this.el.querySelector("#pade-muc-directory-filter").value.trim();

                    console.debug("loadMore", roomJids.length, nextItem);

                    if (nextItem < roomJids.length) for (let i = 0; i < 12; i++)
                    {
                        if (nextItem < roomJids.length)
                        {
                            getRoomDetails(roomJids[nextItem], directoryResults, filter);
                            nextItem++;
                        }
                    }
                },

                doFilter(filter) {
                    const panels = this.el.querySelectorAll('.pade-col > div');
                    console.debug("doFilter", filter, panels);
                    let needMore = false;

                    panels.forEach(function(panel)
                    {
                        panel.parentNode.style.display = "block";

                        const jid = panel.getAttribute("data-room-jid");
                        const name = panel.getAttribute("data-room-name");
                        const desc = panel.getAttribute("data-room-desc");

                        if (filter.length > 2 && jid.indexOf(filter) == -1 && name.indexOf(filter) == -1 && desc.indexOf(filter) == -1)
                        {
                            panel.parentNode.style.display = "none";
                            needMore = true;
                        }
                    });

                    if (needMore) this.loadMore();
                },

                async doDirectory() {
                    console.debug("doDirectory");

                    const directoryResults = this.el.querySelector("#pade-directory-results");
                    const that = this;

                    if (nextItem == 0)
                    {
						
                        roomJids = Object.getOwnPropertyNames(mucJids);
						
						if (roomJids.length == 0) {
							await fetchMUCs();
							roomJids = Object.getOwnPropertyNames(mucJids);
						}
						
                        // uncomment this if you want sorted listing
                        //roomJids = roomJids.sort();

                        directoryResults.addEventListener('scroll', function()
                        {
                            const left = directoryResults.scrollTop + directoryResults.clientHeight;
                            const right = directoryResults.scrollHeight - 1;

                            if (left >= right) {
                                that.loadMore();
                            }
                        });

                        this.loadMore();
                    }
                }
            });

            _converse.api.listen.on('chatRoomViewInitialized', function (view)
            {
                console.debug("chatRoomViewInitialized", view);
				extendUI();											
			});
			
            _converse.api.listen.on('chatBoxViewInitialized', function (view)
            {
                console.debug("chatBoxViewInitialized", view);
				extendUI();					
			});			

            console.debug("muc directory plugin is ready");
        }
    });
	
	async function fetchMUCs() {
		let page = 1;
		
		while (page < 20) {
			const response = await fetch('https://search.jabber.network/api/1.0/rooms/unsafe?p=' + page++);
			const data = await response.json();
			
			if (!data.items || data.items.length == 0)  break;
			console.debug("search.jabber.network", data.items);	

			for (item of data.items) 
			{							
				if (item.address && item.address != "null") {
					mucJids[item.address] = {jid: item.address};	
				}								
			}
		}	
	}
	
	function extendUI() {
		const section = document.body.querySelector('.controlbox-heading--groupchats');	

		if (section)
		{
			if (!section.parentNode.querySelector('.pade-muc-directory')) {	
				const mucButton = newElement('a', null, '<a class="controlbox-heading__btn fa fa-list-alt align-self-center" title="Find Group Chat"></a>', 'pade-muc-directory');
				section.parentNode.appendChild(mucButton);

				mucButton.addEventListener('click', function(evt)
				{
					evt.stopPropagation();

					mucDirectoryDialog = new MUCDirectoryDialog({ 'model': new Model({}) });
					mucDirectoryDialog.show();

				}, false);	
			}				
		}		
	}

    async function getRoomDetails(room, ele, filter)
    {
        //console.debug("getRoomDetails", room, filter);

        const stanza = await _converse.api.disco.info(room);

        mucJids[room].label = stanza.querySelector('identity').getAttribute("name") || room;
        mucJids[room].subject = getValue(stanza.querySelector('field[var="muc#roominfo_subject"] > value'));
        mucJids[room].occupants = getValue(stanza.querySelector('field[var="muc#roominfo_occupants"] > value'));
        mucJids[room].description = getValue(stanza.querySelector('field[var="muc#roominfo_description"] > value'));

        if (filter.length == 0 || (filter.length > 2 && (mucJids[room].jid.indexOf(filter) > -1 ||  mucJids[room].label.indexOf(filter) > -1 ||  mucJids[room].description.indexOf(filter) > -1)))
        {
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
                        } else {
							mucJids[room].avatar = createAvatar(mucJids[room].label);
							createPanel(mucJids[room], ele);							
						}
                    } else {
						mucJids[room].avatar = createAvatar(mucJids[room].label);
						createPanel(mucJids[room], ele);						
					}
                },

                function (err)
                {
                    mucJids[room].avatar = createAvatar(mucJids[room].label);
                    createPanel(mucJids[room], ele);
                }
            );
        }
    }

    function createPanel(room, chatgrid)
    {
        console.debug("createPanel", room, chatgrid);

        const html = '<div data-room-jid="' + room.jid + '" data-room-name="' + room.label + '" data-room-desc="' + room.description + '" title="' + room.jid + '" class="pade-col-content"><span data-room-jid="' + room.jid + '" class="pade-col-badge" data-badge="' + room.occupants + '"><img style="width: 32px" data-room-jid="' + room.jid + '" class="avatar" src="' + room.avatar + '"/></span><h3 data-room-jid="' + room.jid + '">' + room.label + '</h3><p class="pade-col-desc" title="' + room.description + '">' + room.description + '</p></div>';
        const panel = newElement('div', room.jid, html, 'pade-col');

        panel.addEventListener('click', function(evt)
        {
            evt.stopPropagation();

            const jid = evt.target.getAttribute('data-room-jid');
            console.debug("createPanel click", jid, evt.target);

            if (jid)
            {
                mucDirectoryDialog.modal.hide();
                _converse.api.rooms.open(jid, {'bring_to_foreground': true}, true);
            }

        });

        chatgrid.appendChild(panel);
    }

    function getValue(value)
    {
        return value && value.innerHTML != "" ? value.innerHTML : '&nbsp;';
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

    function getRandomColor(nickname)
    {
        if (nickColors[nickname])
        {
            return nickColors[nickname];
        }
        else {
            var letters = '0123456789ABCDEF';
            var color = '#';

            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            nickColors[nickname] = color;
            return color;
        }
    }

    function createAvatar(nickname, width, height, font)
    {
        if (_converse.vcards)
        {
            let vcard = _converse.vcards.findWhere({'jid': nickname});
            if (!vcard) vcard = _converse.vcards.findWhere({'nickname': nickname});

            if (vcard && vcard.get('image') && _converse.DEFAULT_IMAGE != vcard.get('image')) return "data:" + vcard.get('image_type') + ";base64," + vcard.get('image');
        }

        if (!nickname) nickname = "Anonymous";
        nickname = nickname.toLowerCase();

        if (!width) width = 32;
        if (!height) height = 32;
        if (!font) font = "16px Arial";

        var canvas = document.createElement('canvas');
        canvas.style.display = 'none';
        canvas.width = width;
        canvas.height = height;
        document.body.appendChild(canvas);
        var context = canvas.getContext('2d');
        context.fillStyle = getRandomColor(nickname);
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = font;
        context.fillStyle = "#fff";

        var first, last, pos = nickname.indexOf("@");
        if (pos > 0) nickname = nickname.substring(0, pos);

        var name = nickname.split(" ");
        if (name.length == 1) name = nickname.split(".");
        if (name.length == 1) name = nickname.split("-");
        var l = name.length - 1;

        if (name && name[0] && name.first != '')
        {
            first = name[0][0];
            last = name[l] && name[l] != '' && l > 0 ? name[l][0] : null;

            if (last) {
                var initials = first + last;
                context.fillText(initials.toUpperCase(), 3, 23);
            } else {
                var initials = first;
                context.fillText(initials.toUpperCase(), 10, 23);
            }
            var data = canvas.toDataURL();
            document.body.removeChild(canvas);
        }

        return canvas.toDataURL();
    }
}));
