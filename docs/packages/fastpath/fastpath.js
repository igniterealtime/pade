(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    let Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,dayjs, Model, BootstrapModal;		
    let FastpathDialog = null, fastpathDialog = null, __, html, _converse, _fastpath = {data: {}, workgroups: {}, agents: {}, questions: {}};

    converse.plugins.add("fastpath", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            html = converse.env.html;

            Strophe = converse.env.Strophe;
            $iq = converse.env.$iq;
            $msg = converse.env.$msg;
            $pres = converse.env.$pres;
            $build = converse.env.$build;
            b64_sha1 = converse.env.b64_sha1;
            Model = converse.env.Model;
            BootstrapModal = converse.env.BootstrapModal;			
            _ = converse.env._;
            __ = _converse.__;			
            dayjs = converse.env.dayjs;	
			

			FastpathDialog = BootstrapModal.extend({
				id: "plugin-fastpath-modal",			   
				initialize() {
					BootstrapModal.prototype.initialize.apply(this, arguments);
					this.listenTo(this.model, 'change', this.render);					
				},			
				toHTML() {						 
					return html`
					 <div class="modal-dialog modal-lg"> <div class="modal-content">
					 <div class="modal-header">
					   <h4 class="modal-title">Workroup Queues</h4>
					   <button type="button" class="close" data-dismiss="modal">&times;</button>
					 </div>
					 <div class="modal-body">
					 <div class="form-group">
					   <select class="form-control" id="fp-workgroup" name="fp-workgroup">
					   </select>
					    </div>
					 </div>
					 <div class="modal-footer"> <button title="Select" type="button" class="btn btn-success btn-select" data-dismiss="modal">Select</button> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>
					 </div> </div>`;					 

				},
				afterRender() {
				  this.el.addEventListener('shown.bs.modal', () =>
				  {
					console.debug("afterRender", this.el);
					let options = '<label for="fp-workgroup">Workgroup:</label>';

					const keys = Object.getOwnPropertyNames(_fastpath.workgroups);

					for (var i=0; i<keys.length; i++)
					{
						options = options + `       <option value="${_fastpath.workgroups[keys[i]].name}">${_fastpath.workgroups[keys[i]].name}</option>`
					}
					this.el.querySelector('#fp-workgroup').innerHTML = options;

				  }, false);
				},			
				events: {
					"click .btn-select": "selectQueue",
				},

				selectQueue() {
					const workgroupQueue = this.el.querySelector("#fp-workgroup").value.trim();
					console.debug("selectQueue", workgroupQueue);
					_fastpath.workgroup = workgroupQueue;
					setupWorkgroup();
				},

				endSession() {
				   this.modal.hide();
				}
			});
		
            _converse.api.listen.on('connected', function()
            {
                setupFastpath(function(supported)
                {
                    console.debug("fastpath discover", supported);
                    if (supported) addFastpathHandlers();
                });
            });

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
				const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));	
				buttons.push(html`
					<button class="muc-info-icon" title="${__('Fastpath: Workgroup Queues')}" @click=${doFastPath}/>
						<converse-icon class="fa fa-snowflake" size="1em"></converse-icon>
					</button>
				`);

                return buttons;
            });

            console.log("fastpath plugin is ready");
        }
    });
	
	function doFastPath(ev) {
        ev.stopPropagation();
        ev.preventDefault();
		
		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));		
		console.debug("doFastPath", chatview, toolbar_el.model);
        fastpathDialog = new FastpathDialog({ 'model': new Model({view: chatview}) });	
		fastpathDialog.show();
	}

    function setupFastpath(callback)     {
        _converse.connection.sendIQ(converse.env.$iq({type: 'get', to: "workgroup." + _converse.connection.domain}).c('workgroups', {jid: _converse.connection.jid, xmlns: "http://jabber.org/protocol/workgroup"}).tree(), function(resp)
        {
            const workgroupDivs = resp.querySelectorAll('workgroup');
            _fastpath.workgroups = {};

            workgroupDivs.forEach(function(item, index)
            {
                var jid = item.getAttribute('jid');
                var name = converse.env.Strophe.getNodeFromJid(jid);
                var room = 'workgroup-' + name + "@conference." + _converse.connection.domain;
                _fastpath.workgroups[name] = {jid: jid, name: name, room: room};

                if (!_fastpath.workgroup)
                {
                    _fastpath.workgroup = name;
                    setupWorkgroup();
                }

                console.debug("setupFastpath", room, jid);
            });

            if (callback) callback(true)

        }, function (error) {
            console.warn("Workgroups not available");
            if (callback) callback(false)
        });
    }

    function setupWorkgroup()
    {
        const workgroup = _fastpath.workgroups[_fastpath.workgroup].jid;
        console.debug("setupWorkgroup", _fastpath);

        _converse.connection.send(converse.env.$pres({to: workgroup}).c("show").t("chat").up().c("priority").t("9").up().c('agent-status', {'xmlns': "http://jabber.org/protocol/workgroup"}).c('max-chats').t("7"));

        const stanza = converse.env.$iq({type: 'get', to: workgroup}).c('agent-status-request', {xmlns: "http://jabber.org/protocol/workgroup"})

        _converse.connection.sendIQ(stanza, function(iq)
        {
            _fastpath.agents = {};
            const agentDivs = iq.querySelectorAll('agent');

            agentDivs.forEach(function(item, index)
            {
                var jid = item.getAttribute('jid');
                var name = converse.env.Strophe.getNodeFromJid(jid);
                _fastpath.agents[name] = {name: name, jid: jid};
            });

            const room = _fastpath.workgroups[_fastpath.workgroup].room;
            console.debug('setupWorkgroup - open ', room);
            _converse.api.rooms.open(room);

        }, function(error){
            console.error("setupWorkgroup error", error);
        });
    }

    function addFastpathHandlers()
    {
        console.debug('addFastpathHandlers');

        _converse.connection.addHandler(function(iq)
        {
            console.debug('fastpath handler', iq);

            const workgroupJid = iq.getAttribute('from');
            _converse.connection.send(converse.env.$iq({type: 'result', to: workgroupJid, id: iq.getAttribute('id')}));

            const offer = iq.querySelector('offer');
            const offerRevoke = iq.querySelector('offer-revoke');

            if (offer)
            {
                var id = offer.getAttribute('id');
                var jid = offer.getAttribute('jid').toLowerCase();
                var properties = {id: id, jid: jid, workgroupJid: workgroupJid};

                const props = iq.querySelectorAll('value');

                props.forEach(function(item, index)
                {
                    const name = item.getAttribute('name');
                    properties[name] = item.innerHTML;
                });

                console.debug("addFastpathHandlers offer", properties, workgroupJid);

                acceptRejectOffer(properties);
            }

            if (offerRevoke)
            {
                id = offerRevoke.getAttribute('id');
                jid = offerRevoke.getAttribute('jid').toLowerCase();

                console.debug("fastpath handler offer-revoke", workgroupJid, id, jid);
            }

            return true;

        }, "http://jabber.org/protocol/workgroup", 'iq', 'set');

        _converse.connection.addHandler(function(presence)
        {
            const to = presence.getAttribute('to');
            const type = presence.getAttribute('type');
            const from = converse.env.Strophe.getBareJidFromJid(presence.getAttribute('from'));

            let pres = "online";
            if (type) pres = type;

            console.debug("presence tracker", pres, from, to, type, presence);

            const agentStatus = presence.querySelectorAll('agent-status');
            const notifyQueueDetails = presence.querySelectorAll('notify-queue-details');
            const notifyQueue = presence.querySelectorAll('notify-queue');

            if (agentStatus.length > 0 || notifyQueueDetails.length > 0 || notifyQueue.length > 0)
            {
                var maxChats;

                agentStatus.forEach(function(agentStatusItem)
                {
                    var free = true;

                    var workGroup = converse.env.Strophe.getNodeFromJid(agentStatusItem.getAttribute('jid'));
                    if (!_fastpath.data[workGroup]) _fastpath.data[workGroup] = {conversations: {}};

                    presence.querySelectorAll('max-chats').forEach(function(max_chats)
                    {
                        _fastpath.data[workGroup].maxChats = max_chats.innerHTML;
                    });

                    var agent = converse.env.Strophe.getNodeFromJid(from);
                    if (!_fastpath.data[workGroup].conversations[agent]) _fastpath.data[workGroup].conversations[agent] = {};

                    _fastpath.data[workGroup].conversations[agent].agent = agent;

                    presence.querySelectorAll('show').forEach(function(show)
                    {
                        _fastpath.data[workGroup].conversations[agent].show = show.innerHTML;
                    });

                    presence.querySelectorAll('chat').forEach(function(item)
                    {
                        free = false;

                        _fastpath.data[workGroup].conversations[agent].sessionID = item.getAttribute('sessionID');
                        _fastpath.data[workGroup].conversations[agent].sessionJid = _fastpath.data[workGroup].conversations[agent].sessionID + "@conference." + _converse.connection.domain;

                        _fastpath.data[workGroup].conversations[agent].userID = converse.env.Strophe.getNodeFromJid(item.getAttribute('userID'));
                        _fastpath.data[workGroup].conversations[agent].startTime = item.getAttribute('startTime');
                        _fastpath.data[workGroup].conversations[agent].question = item.getAttribute('question');
                        _fastpath.data[workGroup].conversations[agent].username = item.getAttribute('username');
                        _fastpath.data[workGroup].conversations[agent].email = item.getAttribute('email');

                        var text = _fastpath.data[workGroup].conversations[agent].userID + " talking with " + _fastpath.data[workGroup].conversations[agent].username + " about " + _fastpath.data[workGroup].conversations[agent].question;
                        console.debug('agent-status message', _fastpath.data[workGroup].conversations[agent]);
                    });

                    console.debug("agent-status", workGroup, agent, _fastpath.data[workGroup]);

                    if (free)
                    {
                        console.debug("agent-status delete", workGroup, agent, _fastpath.data[workGroup]);
                        delete _fastpath.data[workGroup].conversations[agent];
                    }
                });

                notifyQueueDetails.forEach(function(item)
                {
                    var workGroup = converse.env.Strophe.getNodeFromJid(from);
                    if (!_fastpath.data[workGroup]) _fastpath.data[workGroup] = {conversations: {}};

                    presence.querySelectorAll('user').forEach(function(item)
                    {
                        var jid = item.getAttribute('jid');
                        var position, time, joinTime

                        item.querySelectorAll('position').forEach(function(item)
                        {
                            _fastpath.data[workGroup].position = item.innerHTML == "0" ? "first": item.innerHTML;
                        });

                        item.querySelectorAll('time').forEach(function(item)
                        {
                            _fastpath.data[workGroup].time = item.innerHTML;
                        });

                        item.querySelectorAll('join-time').forEach(function(item)
                        {
                            _fastpath.data[workGroup].joinTime = item.innerHTML;
                        });

                        if (_fastpath.data[workGroup].position && _fastpath.data[workGroup].time && _fastpath.data[workGroup].joinTime)
                        {
                            var text = "A caller has been waiting for " + _fastpath.data[workGroup].time + " secconds";
                            console.debug('notify-queue-details message  ' + text);
                        }
                    });
                    console.debug("notify-queue-details", workGroup, _fastpath.data[workGroup]);
                });

                notifyQueue.forEach(function()
                {
                    var workGroup = converse.env.Strophe.getNodeFromJid(from);
                    if (!_fastpath.data[workGroup]) _fastpath.data[workGroup] = {conversations: {}};

                    var count, oldest, waitTime, status

                    presence.querySelectorAll('count').forEach(function(item)
                    {
                        _fastpath.data[workGroup].count = item.innerHTML;
                    });

                    presence.querySelectorAll('oldest').forEach(function(item)
                    {
                        _fastpath.data[workGroup].oldest = item.innerHTML;
                    });

                    presence.querySelectorAll('time').forEach(function(item)
                    {
                        _fastpath.data[workGroup].waitTime = item.innerHTML;
                    });

                    presence.querySelectorAll('status').forEach(function(item)
                    {
                        _fastpath.data[workGroup].status = item.innerHTML;
                    });

                    if (_fastpath.data[workGroup].count && _fastpath.data[workGroup].oldest && _fastpath.data[workGroup].waitTime && _fastpath.data[workGroup].status)
                    {
                        var text = "There are " + count + " caller(s) waiting for as long as " + waitTime + " seconds";
                        console.debug('notify-queue message ' + text);
                    }

                    console.debug("notify-queue presence", workGroup, _fastpath.data[workGroup]);
                });
            }

            return true;

        }, null, 'presence');


        _converse.connection.addHandler(function(message)
        {
            const from = message.getAttribute('from');
            const to = message.getAttribute('to');
            const type = message.getAttribute('type');

            let id = from;
            let password = null;
            let offerer = converse.env.Strophe.getBareJidFromJid(from);
            let room = null;
            let workgroup = null;

            message.querySelectorAll('x').forEach(function(x)
            {
                const namespace = x.getAttribute("xmlns");

                message.querySelectorAll('offer').forEach(function(offer)
                {
                    offerer = offer.getAttribute('jid');
                });

                if (namespace == "jabber:x:conference")
                {
                    id = x.getAttribute('jid');
                    room = converse.env.Strophe.getNodeFromJid(id);

                    message.querySelectorAll('invite').forEach(function(invite)
                    {
                        workgroup = invite.getAttribute('from');
                    });

                    if (!password)
                    {
                        message.querySelectorAll('password').forEach(function(passwd)
                        {
                            password = passwd.innerHTML;
                        });
                    }

                    console.debug("message handler", from, to, message, workgroup, offerer)

                    if (workgroup && _fastpath.questions[workgroup])
                    {
                        const question = _fastpath.questions[workgroup].question ? _fastpath.questions[workgroup].question : "";
                        _converse.api.rooms.open(id, {name: question, nick: _converse.getDefaultMUCNickname(), password: password});

                        _converse.auto_join_on_invite = _fastpath.auto_join_on_invite; // restore converse auto_join
                    }
                }
            });

            return true;

        }, null, 'message');
    }

    function acceptRejectOffer(properties)
    {
        if (_fastpath && _fastpath.workgroup && properties.workgroupJid == _fastpath.workgroups[_fastpath.workgroup].jid)
        {
            var question = properties.question;
            if (!question) question = "Workgroups Ask";

            var email = properties.email;
            if (!email) email = converse.env.Strophe.getBareJidFromJid(properties.jid);

            _fastpath.questions[properties.workgroupJid] = properties;

            // save _converse.auto_join_on_invite
            _fastpath.auto_join_on_invite = _converse.auto_join_on_invite;
            _converse.auto_join_on_invite = true; // override converse auto_join

            console.debug("acceptRejectOffer", question, email);

            padeapi.notifyText(question, "Fastpath - " + email, properties.id, [{title: "Accept Offer?", iconUrl: chrome.extension.getURL("check-solid.svg")}, {title: "Reject Offer?", iconUrl: chrome.extension.getURL("times-solid.svg")}], function(notificationId, buttonIndex)
            {
                console.debug("handleAction callback", notificationId, buttonIndex);

                if (buttonIndex == 0)   // accept
                {
                    _converse.connection.send(converse.env.$iq({type: 'set', to: properties.workgroupJid}).c('offer-accept', {xmlns: "http://jabber.org/protocol/workgroup", jid: properties.jid, id: properties.id}));
                }
                else

                if (buttonIndex == 1)   // reject
                {
                    _converse.connection.send(converse.env.$iq({type: 'set', to: properties.workgroupJid}).c('offer-reject', {xmlns: "http://jabber.org/protocol/workgroup", jid: properties.jid, id: properties.id}));
                }

            });

        } else {
            console.warn("workgroup offer from unaccepted source", properties.workgroupJid);
        }
    }
}));
