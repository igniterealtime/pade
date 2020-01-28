/*jslint unparam: true*/
/*global runtime, core, ops, location, io*/

var ClientAdaptor = (function() {
    "use strict";

var OperationRouter = function (socket, odfContainer, errorCb) {
    var EVENT_BEFORESAVETOFILE = "beforeSaveToFile",
        EVENT_SAVEDTOFILE = "savedToFile",
        EVENT_HASLOCALUNSYNCEDOPERATIONSCHANGED = "hasLocalUnsyncedOperationsChanged",
        EVENT_HASSESSIONHOSTCONNECTIONCHANGED =   "hasSessionHostConnectionChanged",
        EVENT_MEMBERADDED = "memberAdded",
        EVENT_MEMBERCHANGED = "memberChanged",
        EVENT_MEMBERREMOVED = "memberRemoved",
        eventNotifier = new core.EventNotifier([
            EVENT_BEFORESAVETOFILE,
            EVENT_SAVEDTOFILE,
            EVENT_HASLOCALUNSYNCEDOPERATIONSCHANGED,
            EVENT_HASSESSIONHOSTCONNECTIONCHANGED,
            EVENT_MEMBERADDED,
            EVENT_MEMBERCHANGED,
            EVENT_MEMBERREMOVED,
            ops.OperationRouter.signalProcessingBatchStart,
            ops.OperationRouter.signalProcessingBatchEnd
        ]),

        operationFactory,
        playbackFunction,

        lastServerSyncHeadId = 0,
        sendClientOpspecsLock = false,
        sendClientOpspecsTask,
        hasSessionHostConnection = true,
        unplayedServerOpSpecQueue = [],
        unsyncedClientOpSpecQueue = [],
        operationTransformer = new ops.OperationTransformer(),

        /**@const*/sendClientOpspecsDelay = 300;


    function playbackOpspecs(opspecs) {
        var op, i;

        if (!opspecs.length) {
            return;
        }

        eventNotifier.emit(ops.OperationRouter.signalProcessingBatchStart, {});
        for (i = 0; i < opspecs.length; i += 1) {
            op = operationFactory.create(opspecs[i]);
            if (op !== null) {
                if (!playbackFunction(op)) {
                    eventNotifier.emit(ops.OperationRouter.signalProcessingBatchEnd, {});
                    errorCb("opExecutionFailure");
                    return;
                }
            } else {
                eventNotifier.emit(ops.OperationRouter.signalProcessingBatchEnd, {});
                errorCb("Unknown opspec: " + runtime.toJson(opspecs[i]));
                return;
            }
        }
        eventNotifier.emit(ops.OperationRouter.signalProcessingBatchEnd, {});
    }

    function handleNewServerOpsWithUnsyncedClientOps(serverOps) {
        var transformResult = operationTransformer.transform(unsyncedClientOpSpecQueue, serverOps);

        if (!transformResult) {
            errorCb("Has unresolvable conflict.");
            return false;
        }

        unsyncedClientOpSpecQueue = transformResult.opSpecsA;
        unplayedServerOpSpecQueue = unplayedServerOpSpecQueue.concat(transformResult.opSpecsB);

        return true;
    }

    function handleNewClientOpsWithUnplayedServerOps(clientOps) {
        var transformResult = operationTransformer.transform(clientOps, unplayedServerOpSpecQueue);

        if (!transformResult) {
            errorCb("Has unresolvable conflict.");
            return false;
        }

        unsyncedClientOpSpecQueue = unsyncedClientOpSpecQueue.concat(transformResult.opSpecsA);
        unplayedServerOpSpecQueue = transformResult.opSpecsB;

        return true;
    }

    function receiveServerOpspecs(headId, serverOpspecs) {
        if (serverOpspecs.length == 0) return;

        if (unsyncedClientOpSpecQueue.length > 0) {
            handleNewServerOpsWithUnsyncedClientOps(serverOpspecs);
            // could happen that ops from server make client ops obsolete
            if (unsyncedClientOpSpecQueue.length === 0) {
                eventNotifier.emit(EVENT_HASLOCALUNSYNCEDOPERATIONSCHANGED, false);
            }
        } else {
            // apply directly
            playbackOpspecs(serverOpspecs);
        }
        lastServerSyncHeadId = headId;
    }

    function sendClientOpspecs() {
        var originalUnsyncedLength = unsyncedClientOpSpecQueue.length;

        if (originalUnsyncedLength) {
            sendClientOpspecsLock = true;

            socket.emit("new_ops", {
                head: lastServerSyncHeadId,
                ops: unsyncedClientOpSpecQueue
            }, function (response) {
                if (response.conflict === true) {
                    sendClientOpspecs();
                } else {
                    lastServerSyncHeadId = response.head;
                    // on success no other server ops should have sneaked in meanwhile, so no need to check
                    // got no other client ops meanwhile?
                    if (unsyncedClientOpSpecQueue.length === originalUnsyncedLength) {
                        unsyncedClientOpSpecQueue.length = 0;
                        // finally apply all server ops collected while waiting for sync
                        playbackOpspecs(unplayedServerOpSpecQueue);
                        unplayedServerOpSpecQueue.length = 0;
                        eventNotifier.emit(EVENT_HASLOCALUNSYNCEDOPERATIONSCHANGED, false);
                        sendClientOpspecsLock = false;
                    } else {
                        // send off the new client ops directly
                        unsyncedClientOpSpecQueue.splice(0, originalUnsyncedLength);
                        sendClientOpspecs();
                    }
                }
            });
        }
    }

    this.receiveServerOpspecs = function(headId, serverOpspecs) {
        receiveServerOpspecs(headId, serverOpspecs);
    };

    this.setOperationFactory = function (f) {
        operationFactory = f;
    };

    this.setPlaybackFunction = function (f) {
        playbackFunction = f;
    };

    this.push = function (operations) {
        var clientOpspecs = [],
            now = Date.now(),
            hasLocalUnsyncedOpsBefore = (unsyncedClientOpSpecQueue.length !== 0),
            hasLocalUnsyncedOpsNow;

        operations.forEach(function(op) {
            var opspec = op.spec();

            opspec.timestamp = now;
            clientOpspecs.push(opspec);
        });

        playbackOpspecs(clientOpspecs);

        if (unplayedServerOpSpecQueue.length > 0) {
            handleNewClientOpsWithUnplayedServerOps(clientOpspecs);
        } else {
            unsyncedClientOpSpecQueue = unsyncedClientOpSpecQueue.concat(clientOpspecs);
        }

        hasLocalUnsyncedOpsNow = (unsyncedClientOpSpecQueue.length !== 0);
        if (hasLocalUnsyncedOpsNow !== hasLocalUnsyncedOpsBefore) {
            eventNotifier.emit(EVENT_HASLOCALUNSYNCEDOPERATIONSCHANGED, hasLocalUnsyncedOpsNow);
        }

        sendClientOpspecsTask.trigger();
    };

    this.requestReplay = function (cb) {
        var cbOnce = function () {
            eventNotifier.unsubscribe(ops.OperationRouter.signalProcessingBatchEnd, cbOnce);
            cb();
        };
        // hack: relies on at least addmember op being added for ourselves and being executed
        eventNotifier.subscribe(ops.OperationRouter.signalProcessingBatchEnd, cbOnce);

        socket.on("new_ops", function (data) {
            receiveServerOpspecs(data.head, data.ops);
        });

        receiveServerOpspecs(getCounter(), kotypeGlobals.self);
        socket.emit("new_ops", {head: getCounter(), ops: kotypeGlobals.self});

        Object.getOwnPropertyNames(kotypeGlobals.pendingOccupants).forEach(function(occupant)
        {
            receiveServerOpspecs(getCounter(), kotypeGlobals.pendingOccupants[occupant]);
            delete kotypeGlobals.pendingOccupants[occupant];
        });
    };

    this.close = function (cb) {
        cb();
    };

    this.subscribe = function (eventId, cb) {
        eventNotifier.subscribe(eventId, cb);
    };

    this.unsubscribe = function (eventId, cb) {
        eventNotifier.unsubscribe(eventId, cb);
    };

    this.hasLocalUnsyncedOps = function () {
        return unsyncedClientOpSpecQueue.length !== 0;
    };

    this.hasSessionHostConnection = function () {
        return hasSessionHostConnection;
    };

    function getCounter()
    {
        return Math.round((new Date()).getTime() / 1000);
    }

    function init() {
        sendClientOpspecsTask = core.Task.createTimeoutTask(function () {
            if (!sendClientOpspecsLock) {
                sendClientOpspecs();
            }
        }, sendClientOpspecsDelay);
    }
    init();
};

var ClientAdaptor = function (documentId, documentURL, urlPathPrefix, connectedCb, kickedCb, disconnectedCb) {
    var memberId, opRouter, socket, callbacks = {}, messages = {}, nickColors = {}, members = {};

    this.getMemberId = function () {
        return memberId;
    };

    this.getGenesisUrl = function () {
        return documentURL;
    };

    this.createOperationRouter = function (odfContainer, errorCb) {
        runtime.assert(Boolean(memberId), "You must be connected to a session before creating an operation router");
        opRouter = new OperationRouter(socket, odfContainer, errorCb);
        return opRouter;
    };

    this.joinSession = function (cb) {

        kotypeGlobals.pendingOccupants = {};

        kotypeGlobals.conference = kotypeGlobals.connection.initJitsiConference(kotypeGlobals.documentId, {openBridgeChannel: false});

        kotypeGlobals.conference.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, function ()
        {
            console.debug("conference joined!", kotypeGlobals.conference.room.roomjid, kotypeGlobals.conference.room.myroomjid);

            const id = Strophe.getResourceFromJid(kotypeGlobals.conference.room.myroomjid);
            kotypeGlobals.user.color = getRandomColor(id);
            kotypeGlobals.self = addMembers(kotypeGlobals.user, id);
            memberId = kotypeGlobals.self[0].memberid;
            cb(memberId);
        });

        kotypeGlobals.conference.on(JitsiMeetJS.events.conference.CONFERENCE_LEFT, function ()
        {
            console.debug("conference left!", pade.port);
            kickedCb();

            const id = Strophe.getResourceFromJid(kotypeGlobals.conference.room.myroomjid);
            socket.emit("new_ops", {head: getCounter(), ops: removeMember(id)});
        });

        kotypeGlobals.conference.on(JitsiMeetJS.events.conference.USER_JOINED, function (id)
        {
            console.debug("user join", id);

            members[id] = {avatar_url: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiA8cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzU1NSIvPgogPGNpcmNsZSBjeD0iNjQiIGN5PSI0MSIgcj0iMjQiIGZpbGw9IiNmZmYiLz4KIDxwYXRoIGQ9Im0yOC41IDExMiB2LTEyIGMwLTEyIDEwLTI0IDI0LTI0IGgyMyBjMTQgMCAyNCAxMiAyNCAyNCB2MTIiIGZpbGw9IiNmZmYiLz4KPC9zdmc+Cg==", color: getRandomColor(id), username: id, name: "Unknown"};

            const memberOps = addMembers(members[id], id);

            if (opRouter) {
                //opRouter.receiveServerOpspecs(getCounter(), memberOps);
            } else {
                //kotypeGlobals.pendingOccupants[id] = memberOps;
            }
        });

        kotypeGlobals.conference.on(JitsiMeetJS.events.conference.USER_LEFT, function (id)
        {
            console.debug("user left", id);
            delete kotypeGlobals.pendingOccupants[id];
            delete members[id];

            if (opRouter) opRouter.receiveServerOpspecs(getCounter(), removeMember(id));
        });

        kotypeGlobals.conference.on(JitsiMeetJS.events.conference.ENDPOINT_MESSAGE_RECEIVED, function(id, message)
        {
            console.debug("endpoint_message", id, message);
        });

        kotypeGlobals.conference.join();
    };

    this.leaveSession = function (cb) {

        if (kotypeGlobals.conference)
        {
            kotypeGlobals.conference.join();
            cb();
        }
    };

    this.getSocket = function () {
        return socket;
    };

    function getCounter()
    {
        return Math.round((new Date()).getTime() / 1000);
    }

    function getRandomColor(nickname) {
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

    function addMembers (user, id) {
        const timestamp = Date.now();
        const memberId = id;

        return [{
            optype: "AddMember",
            memberid: memberId,
            timestamp: timestamp,
            setProperties: {
                fullName: user.name,
                color: user.color,
                imageUrl: user.avatar_url
            }
        }];
    }


    function removeMember (id) {
        const timestamp = Date.now();
        const memberId = id;

        return [{optype: "RemoveCursor", memberid: memberId, timestamp: timestamp}, {optype: "RemoveMember", memberid: memberId, timestamp: timestamp}];
    }

    function handleMucMessage(msg)
    {
        const participant = Strophe.getResourceFromJid($(msg).attr("from"));
        const id = $(msg).attr("id");

        if (kotypeGlobals.conference.room.myroomjid != $(msg).attr("from"))
        {
            $(msg).find("body").each(function()
            {
                const action = $(this).attr("action");
                const json = JSON.parse($(this).text());

                console.debug("handleMucMessage", id, action, json);

                if (!messages[action]) messages[action] = [];
                messages[action].push(json);
            });
        }

        Object.getOwnPropertyNames(callbacks).forEach(function(action)
        {
            handleMessages(action);
        });

        return true;
    }

    function handleMessages(action)
    {
        if (messages[action]) messages[action].forEach(function(json)
        {
            console.debug("on handler triggered", action, json);

            if (callbacks[action])
            {
                callbacks[action](json);
            }
        });

        delete messages[action];
    }

    function sanitizePendingOps()
    {
        if (!messages["new_ops"]) return;

        console.debug("sanitizePendingOps before", messages["new_ops"]);

        var ops = messages["new_ops"], unbalancedCursors = {}, unbalancedMembers = {}, lastAccessDate = new Date(),  newOps = [],  i;

        for (i = 0; i < ops.length; i += 1) {
            if (ops[i].optype === "AddCursor") {
                unbalancedCursors[ops[i].memberid] = true;
            } else if (ops[i].optype === "RemoveCursor") {
                unbalancedCursors[ops[i].memberid] = false;
            } else if (ops[i].optype === "AddMember") {
                unbalancedMembers[ops[i].memberid] = true;
            } else if (ops[i].optype === "RemoveMember") {
                unbalancedMembers[ops[i].memberid] = false;
            }
        }

        Object.keys(unbalancedCursors).forEach(function (memberId) {
            if (unbalancedCursors[memberId]) {
                newOps.push({
                    optype: "RemoveCursor",
                    memberid: memberId,
                    timestamp: lastAccessDate
                });
            }
        });

        Object.keys(unbalancedMembers).forEach(function (memberId) {
            if (unbalancedMembers[memberId]) {
                newOps.push({
                    optype: "RemoveMember",
                    memberid: memberId,
                    timestamp: lastAccessDate
                });
            }
        });

        if (newOps.length) {
            messages["new_ops"] = messages["new_ops"].concat(newOps);
            console.debug("sanitizePendingOps after", messages["new_ops"]);
        }
    }

    function init()
    {
        kotypeGlobals.connection = new JitsiMeetJS.JitsiConnection(null, null, kotypeGlobals.xmppConfig);
        const xmpp = kotypeGlobals.connection.xmpp.connection;

        xmpp.addHandler(handleMucMessage, "urn:xmpp:json:0", "message", "groupchat");

        kotypeGlobals.connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, function(id)
        {
            console.debug("akowe connection connected!", id);
            connectedCb();
        });

        kotypeGlobals.connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, function()
        {
            console.error("akowe connection failed!")
            disconnectedCb();
        });

        kotypeGlobals.connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, function()
        {
            console.debug("akowe connection disconnected!");
            disconnectedCb();
        });

        socket = {
            on: function(action, callback) {
                console.debug("on handler activated", action);
                callbacks[action] = callback;
                if (action == "new_ops") sanitizePendingOps()
                //if (opRouter) handleMessages(action); // process any pending messages;
            },
            emit: function(action, payload, callback) {
                const head = getCounter();
                const text = JSON.stringify(payload);

                console.debug("emit", action, text, head);
                xmpp.send($msg({id: head, type: "groupchat", to: kotypeGlobals.conference.room.roomjid}).c("body", {xmlns: "urn:xmpp:json:0", action: action}).t(text));
                if (callback) callback({head: head});
            }
        }

        kotypeGlobals.connection.connect();
    }

    init();
};

return ClientAdaptor;

}());
