var StropheSharedConnectionWorker = (function (exports) {
    'use strict';

    const _NS = {
        DELAY: 'urn:xmpp:delay' /** XEP-0203 */,
        SM: 'urn:xmpp:sm:3'};
    /**
     * Common namespace constants from the XMPP RFCs and XEPs.
     * Extensible at runtime via {@link Strophe.addNamespace}, hence the string
     * index signature.
     */
    const NS = _NS;
    /**
     * The version of the page↔worker message protocol spoken between
     * WorkerWebsocket and dist/shared-connection-worker.js. A SharedWorker can
     * outlive the pages that spawned it, so after a deploy a freshly loaded page
     * may attach to a worker from an older build (or vice versa). The version is
     * exchanged on _connect/_attach so that a mismatch fails loudly instead of
     * silently misbehaving.
     */
    const SHARED_WORKER_PROTOCOL_VERSION = 3;
    /**
     * Connection status constants for use by the connection handler
     * callback.
     */
    const Status = {
        ATTACHED: 8,
        ATTACHFAIL: 12};
    const LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        FATAL: 4,
    };

    let logLevel = LOG_LEVELS.DEBUG;
    const log = {
        /**
         * Library consumers can use this function to set the log level of Strophe.
         * The default log level is Strophe.LogLevel.INFO.
         * @param level
         * @example Strophe.setLogLevel(Strophe.LogLevel.DEBUG);
         */
        setLogLevel(level) {
            if (level < LOG_LEVELS.DEBUG || level > LOG_LEVELS.FATAL) {
                throw new Error("Invalid log level supplied to setLogLevel");
            }
            logLevel = level;
        },
        /**
         *
         * Please note that data sent and received over the wire is logged
         * via {@link Strophe.Connection#rawInput|Strophe.Connection.rawInput()}
         * and {@link Strophe.Connection#rawOutput|Strophe.Connection.rawOutput()}.
         *
         * The different levels and their meanings are
         *
         *   DEBUG - Messages useful for debugging purposes.
         *   INFO - Informational messages.  This is mostly information like
         *     'disconnect was called' or 'SASL auth succeeded'.
         *   WARN - Warnings about potential problems.  This is mostly used
         *     to report transient connection errors like request timeouts.
         *   ERROR - Some error occurred.
         *   FATAL - A non-recoverable fatal error occurred.
         *
         * @param level - The log level of the log message.
         *     This will be one of the values in Strophe.LOG_LEVELS.
         * @param msg - The log message.
         */
        log(level, msg) {
            if (level < logLevel) {
                return;
            }
            if (level >= LOG_LEVELS.ERROR) {
                console === null || console === void 0 ? void 0 : console.error(msg);
            }
            else if (level === LOG_LEVELS.INFO) {
                console === null || console === void 0 ? void 0 : console.info(msg);
            }
            else if (level === LOG_LEVELS.WARN) {
                console === null || console === void 0 ? void 0 : console.warn(msg);
            }
            else if (level === LOG_LEVELS.DEBUG) {
                console === null || console === void 0 ? void 0 : console.debug(msg);
            }
        },
        /**
         * Log a message at the Strophe.LOG_LEVELS.DEBUG level.
         * @param msg - The log message.
         */
        debug(msg) {
            this.log(LOG_LEVELS.DEBUG, msg);
        },
        /**
         * Log a message at the Strophe.LOG_LEVELS.INFO level.
         * @param msg - The log message.
         */
        info(msg) {
            this.log(LOG_LEVELS.INFO, msg);
        },
        /**
         * Log a message at the Strophe.LOG_LEVELS.WARN level.
         * @param msg - The log message.
         */
        warn(msg) {
            this.log(LOG_LEVELS.WARN, msg);
        },
        /**
         * Log a message at the Strophe.LOG_LEVELS.ERROR level.
         * @param msg - The log message.
         */
        error(msg) {
            this.log(LOG_LEVELS.ERROR, msg);
        },
        /**
         * Log a message at the Strophe.LOG_LEVELS.FATAL level.
         * @param msg - The log message.
         */
        fatal(msg) {
            this.log(LOG_LEVELS.FATAL, msg);
        },
    };

    /**
     * XEP-0198 Stream Management
     *
     * Environment-free helpers.
     *
     * IMPORTANT: this module must be loadable in a SharedWorker global (it is
     * bundled into dist/shared-connection-worker.js), so keep it free of imports
     * beyond constants (no ../utils.ts or ../builder.ts, and no *module-level DOM access).
     */
    /** The 'h' counter is an unsignedInt that wraps back to zero (XEP-0198 §4). */
    const H_WRAP = 2 ** 32;
    /** Stanza names that count towards the 'h' counters (XEP-0198 §4). */
    const COUNTABLE = ['iq', 'presence', 'message'];
    /**
     * Escapes invalid xml characters (duplicated from ../utils.ts so the worker
     * bundle doesn't pull in utils and its dependencies).
     * @param text
     */
    function xmlEscape(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&apos;')
            .replace(/"/g, '&quot;');
    }
    /**
     * @returns A fresh, inactive SM state object.
     */
    function freshState() {
        return {
            boundJid: null,
            enableSent: false,
            enabled: false,
            hIn: 0,
            hOutAcked: 0,
            id: null,
            location: null,
            max: null,
            resumeSupported: false,
            resumed: false,
            sinceLastAck: 0,
            unacked: [],
        };
    }
    /**
     * Parse an 'h' attribute value into a wrapped unsigned 32-bit counter value.
     * @param value - The attribute value (may be undefined).
     * @returns The parsed value, or null if missing or invalid.
     */
    function parseH(value) {
        if (typeof value !== 'string')
            return null;
        const h = parseInt(value, 10);
        return Number.isNaN(h) || h < 0 ? null : h % H_WRAP;
    }
    /**
     * @param name - A top-level element's local tag name.
     * @returns true if the element counts towards the SM 'h' counters.
     */
    function isCountableStanza(name) {
        return COUNTABLE.includes(name);
    }
    /**
     * Remove the `from` attribute from a serialized stanza's root element, so a
     * re-sent stanza cannot carry a stale resource after a failed resumption. Only
     * the root opening tag is touched; nested `from` attributes (forwarded stanzas,
     * MUC addresses) are preserved. The server stamps the authoritative c2s `from`.
     * DOM-free string surgery, mirroring stampDelay.
     * @param serialized - The serialized stanza.
     * @returns The stanza with the root `from` removed (unchanged if none).
     */
    function stripFrom(serialized) {
        const end = serialized.indexOf('>');
        if (end === -1) {
            return serialized;
        }
        const openTag = serialized.slice(0, end);
        const rest = serialized.slice(end);
        // Values cannot contain their own delimiter quote (the serializer escapes it),
        // so a non-greedy match to the matching quote is safe. The leading \s is
        // consumed too, leaving no double space. Only the first (root) from is removed.
        const stripped = openTag.replace(/\sfrom=(["'])[\s\S]*?\1/, '');
        return stripped === openTag ? serialized : stripped + rest;
    }
    /**
     * Insert a XEP-0203 <delay/> child into a serialized stanza (DOM-free string
     * surgery). Used when re-sending salvaged stanzas after a failed resumption,
     * so the receiving client can show the original send time.
     * @param serialized - The serialized stanza.
     * @param name - The stanza's local tag name.
     * @param queuedAt - The original queueing time (ms since epoch).
     * @returns The stanza with a <delay/> child, or the unmodified input if it
     *     already carries one (or is malformed).
     */
    function stampDelay(serialized, name, queuedAt) {
        if (serialized.includes(NS.DELAY)) {
            return serialized;
        }
        const delay = `<delay xmlns="${NS.DELAY}" stamp="${new Date(queuedAt).toISOString()}"/>`;
        if (serialized.endsWith('/>')) {
            return `${serialized.slice(0, -2)}>${delay}</${name}>`;
        }
        const idx = serialized.lastIndexOf(`</${name}`);
        if (idx === -1) {
            return serialized;
        }
        return serialized.slice(0, idx) + delay + serialized.slice(idx);
    }

    /**
     * XEP-0198 Stream Management
     *
     * Storage backends for resumable session state.
     *
     * MemoryStorageBackend is environment-free and safe in the worker bundle.
     * SessionStorageBackend requires a browser page context, but only at
     * construction time, there is no module-level DOM access here.
     */
    /**
     * In-memory storage backend (Node, tests, or non-resumable setups).
     * State is serialized on save so callers can't mutate stored state by reference.
     */
    class MemoryStorageBackend {
        constructor() {
            this.store = new Map();
        }
        /**
         * @param key
         */
        load(key) {
            const stored = this.store.get(key);
            return stored ? JSON.parse(stored) : null;
        }
        /**
         * @param key
         * @param state
         */
        save(key, state) {
            this.store.set(key, JSON.stringify(state));
        }
        /**
         * @param key
         */
        clear(key) {
            this.store.delete(key);
        }
    }

    /**
     * XEP-0198 Stream Management engine.
     *
     * This class holds all SM state and logic (counters, the unacked queue, the
     * enable/resume lifecycle) and never touches a DOM Element or a raw websocket
     * frame, so the same class can be hosted by a page-side Connection or inside a
     * SharedWorker. Everything it needs from a stanza is captured in a minimal
     * {@link StanzaView}, produced by whichever side hosts it (dom.ts on the page,
     * parse.ts in the worker). Nonzas are emitted as strings through the injected
     * `sendRaw` function.
     *
     * IMPORTANT: this module must be loadable in a SharedWorker global (it is
     * bundled into dist/shared-connection-worker.js), so keep it free of imports
     * beyond log/constants and its worker-safe siblings, in particular no
     * ../utils.ts or ../builder.ts, and no module-level DOM access.
     */
    /**
     * The XEP-0198 Stream Management engine.
     *
     * Hosted by {@link Connection} (page) or by the shared-connection worker; fed
     * {@link StanzaView}s by a thin per-environment adapter. Emits nonzas through
     * the injected `sendRaw` function.
     */
    class StreamManagement {
        /**
         * @param sendRaw - Emits a serialized nonza (or re-sent stanza) towards the server.
         * @param options
         */
        constructor(sendRaw, options = {}) {
            this._sendRaw = sendRaw;
            this._options = Object.assign({ maxUnacked: 5, requestResume: true }, options);
            this._storage = this._options.storage || new MemoryStorageBackend();
            this._storageKey = null;
            this._state = freshState();
            this._resumePending = false;
            this._pendingResend = [];
            this.serverSupported = false;
        }
        /** The live SM state. Treat as read-only outside of tests. */
        get state() {
            return this._state;
        }
        /** Whether <enabled/> has been received and the SM session is active. */
        get enabled() {
            return this._state.enabled;
        }
        /** Whether the current session was established by resumption. */
        get resumed() {
            return this._state.resumed;
        }
        /** The full JID bound when the SM session was enabled. */
        get boundJid() {
            return this._state.boundJid;
        }
        /** Whether a <resume/> has been sent and not yet answered. */
        get resumePending() {
            return this._resumePending;
        }
        /**
         * Set the storage key (from the user's bare JID) and load any persisted
         * resumable state. Call before deciding between resume and fresh bind.
         * @param jid - The user's JID (a full JID is reduced to its bare form).
         */
        initialize(jid) {
            this._storageKey = `strophe-sm:${jid.split('/')[0].toLowerCase()}`;
            const stored = this._storage.load(this._storageKey);
            if (stored) {
                this._state = Object.assign(Object.assign({}, freshState()), stored);
            }
        }
        /**
         * @returns true if persisted state allows attempting <resume/>.
         */
        hasResumableState() {
            return !!(this._state.id && this._state.resumeSupported);
        }
        /**
         * Reset the in-memory engine (e.g. from Connection.reset()).
         * Persisted state is NOT touched — clearing storage is tied to intent
         * (clean close, logout, failed resume), not to connection reuse.
         */
        reset() {
            this._state = freshState();
            this._resumePending = false;
            this._pendingResend = [];
            this.serverSupported = false;
        }
        /** Remove persisted state (clean close, logout, failed resume). */
        clearPersistedState() {
            if (this._storageKey) {
                this._storage.clear(this._storageKey);
            }
        }
        /**
         * Send <enable/> to start a new SM session. Call after resource binding,
         * at the point CONNECTED is emitted. At most one <enable/> is sent per
         * stream — a second attempt SHOULD get the stream killed by the server
         * (XEP-0198 §3).
         * @param boundJid - The full JID that was just bound.
         */
        sendEnable(boundJid) {
            const s = this._state;
            if (s.enableSent) {
                log.warn('StreamManagement.sendEnable called but <enable/> was already sent for this session');
                return;
            }
            s.enableSent = true;
            s.enabled = false;
            s.resumed = false;
            s.id = null;
            s.max = null;
            s.location = null;
            s.resumeSupported = false;
            s.hIn = 0;
            s.hOutAcked = 0;
            s.sinceLastAck = 0;
            s.unacked = [];
            s.boundJid = boundJid;
            const resume = this._options.requestResume ? ' resume="true"' : '';
            const max = this._options.max ? ` max="${this._options.max}"` : '';
            this._sendRaw(`<enable xmlns="${NS.SM}"${resume}${max}/>`);
            this._persist();
        }
        /**
         * Send <resume/> for the persisted previous session. Call instead of
         * binding, once the post-SASL stream features advertise SM support.
         */
        sendResume() {
            const s = this._state;
            if (!this.hasResumableState()) {
                log.warn('StreamManagement.sendResume called without resumable state');
                return;
            }
            this._resumePending = true;
            this._sendRaw(`<resume xmlns="${NS.SM}" h="${s.hIn}" previd="${xmlEscape(s.id)}"/>`);
        }
        /**
         * @returns true once <enable/> has been sent, i.e. outbound stanzas are
         *     being tracked. Lets the caller skip building a {@link StanzaView}
         *     for {@link trackOutbound} when tracking is inactive, without
         *     reaching into the engine's state.
         */
        isTracking() {
            return this._state.enableSent;
        }
        /**
         * Track an outbound top-level element. Called for every element that
         * enters the send queue; non-countable elements are ignored here.
         * Active from the moment <enable/> is sent (not from <enabled/> receipt —
         * XEP-0198 starts the outbound counter at enable-send).
         * @param view
         */
        trackOutbound(view) {
            const s = this._state;
            if (!s.enableSent || !isCountableStanza(view.name)) {
                return;
            }
            s.unacked.push({ name: view.name, stanza: view.serialized, queuedAt: Date.now() });
            s.sinceLastAck += 1;
            const max = this._options.maxUnacked;
            if (max > 0 && s.sinceLastAck % max === 0) {
                this.requestAck();
            }
            this._persist();
        }
        /**
         * Process one inbound top-level element: count it if it is a countable
         * stanza (when the session is enabled), otherwise handle it as an SM
         * nonza (<r>/<a>/<enabled>/<resumed>/<failed>). Unrecognised elements are
         * ignored. Each host dispatches inbound elements to its own handlers
         * independently of this call, so nothing is returned.
         * @param view
         */
        onInbound(view) {
            if (isCountableStanza(view.name)) {
                this.onInboundStanza(view.name);
                return;
            }
            switch (view.name) {
                case 'r':
                    if (this._state.enabled)
                        this.sendAck();
                    break;
                case 'a':
                    this._handleAck(view);
                    break;
                case 'enabled':
                    this._handleEnabled(view);
                    break;
                case 'resumed':
                    this._handleResumed(view);
                    break;
                case 'failed':
                    this._handleFailed(view);
                    break;
            }
        }
        /** Send an unrequested ack request <r/> to the server. */
        requestAck() {
            this._sendRaw(`<r xmlns="${NS.SM}"/>`);
        }
        /**
         * Send an ack <a/> with the current inbound count. Used to answer <r/>,
         * and RECOMMENDED right before gracefully closing the stream (XEP-0198 §4)
         * so the server doesn't redeliver stanzas that were actually received.
         */
        sendAck() {
            this._sendRaw(`<a xmlns="${NS.SM}" h="${this._state.hIn}"/>`);
        }
        /**
         * Count an inbound top-level stanza by name. Adapters call this from
         * their dispatch loop for every inbound child element — non-countable
         * names and inactive sessions are no-ops, so no StanzaView needs to be
         * built for the common case.
         * @param name - The element's local tag name.
         */
        onInboundStanza(name) {
            if (this._state.enabled && isCountableStanza(name)) {
                this._state.hIn = (this._state.hIn + 1) % H_WRAP;
                this._persist();
            }
        }
        /**
         * Call when the stream is about to be closed cleanly: sends a final
         * <a/> so the server doesn't redeliver stanzas that were actually
         * received (RECOMMENDED, XEP-0198 §4), clears persisted state (a
         * cleanly closed stream is not resumable, XEP-0198 §Stream Closure) and
         * deactivates the engine, so nothing sent during teardown is tracked or
         * re-persisted.
         */
        onGracefulClose() {
            if (this._state.enabled) {
                this.sendAck();
            }
            this.clearPersistedState();
            this._state = freshState();
            this._resumePending = false;
            this._pendingResend = [];
        }
        /** Overridable event hook: an SM session was established via <enabled/>. */
        onEnabled() {
            return;
        }
        /** Overridable event hook: the previous session was resumed via <resumed/>. */
        onResumed() {
            return;
        }
        /**
         * Overridable event hook: <enable/> or <resume/> failed.
         * @param _view - The <failed/> nonza (inspect e.g. for <item-not-found/>).
         * @param _resumeFailed - true when the failure answered a <resume/> (the
         *     unacked queue was salvaged for re-send on the next session), false
         *     when it answered an <enable/>.
         */
        onFailed(_view, _resumeFailed) {
            return;
        }
        /**
         * Reconcile the server-reported 'h' against the unacked queue (mod 2^32).
         * An 'h' above our send count is logged and clamped rather than answered
         * with the spec's <handled-count-too-high/> stream close — a client
         * killing the stream over a server bug only hurts the user.
         * @param h
         */
        _reconcile(h) {
            const s = this._state;
            let delta = (h - s.hOutAcked + H_WRAP) % H_WRAP;
            if (delta > s.unacked.length) {
                log.error(`StreamManagement: server acked ${delta} stanzas but only ` +
                    `${s.unacked.length} are unacknowledged (h=${h}, previous h=${s.hOutAcked})`);
                delta = s.unacked.length;
            }
            s.unacked = s.unacked.slice(delta);
            s.hOutAcked = h;
        }
        /**
         * @param view
         */
        _handleAck(view) {
            const s = this._state;
            if (!s.enableSent && !s.enabled) {
                return;
            }
            const h = parseH(view.attrs.h);
            if (h === null) {
                log.error('StreamManagement: received <a/> without a valid h attribute');
                return;
            }
            this._reconcile(h);
            s.sinceLastAck = 0;
            this._persist();
        }
        /**
         * @param view
         */
        _handleEnabled(view) {
            const s = this._state;
            if (!s.enableSent) {
                log.warn('StreamManagement: received <enabled/> but <enable/> was not sent; ignoring');
                return;
            }
            s.enabled = true;
            s.id = view.attrs.id || null;
            const max = parseInt(view.attrs.max, 10);
            s.max = Number.isNaN(max) ? null : max;
            s.location = view.attrs.location || null;
            s.resumeSupported = ['true', '1'].includes(view.attrs.resume);
            this._resendPending();
            this._persist();
            this.onEnabled();
        }
        /**
         * @param view
         */
        _handleResumed(view) {
            const s = this._state;
            if (!s.id) {
                log.warn('StreamManagement: received <resumed/> without resumable state; ignoring');
                return;
            }
            this._resumePending = false;
            s.resumed = true;
            s.enabled = true;
            s.enableSent = true;
            const h = parseH(view.attrs.h);
            if (h !== null) {
                this._reconcile(h);
            }
            s.sinceLastAck = 0;
            // Re-send whatever the server didn't acknowledge (a MUST, XEP-0198
            // §5).The root `from` is stripped for symmetry with the failed-resume path;
            // on a resume the resource is unchanged, so this is a no-op for a valid
            // `from`. No delay stamp here since these go out on the same live session.
            for (const entry of s.unacked) {
                this._sendRaw(stripFrom(entry.stanza));
            }
            if (s.unacked.length) {
                this.requestAck();
            }
            this._persist();
            this.onResumed();
        }
        /**
         * <enable/> or <resume/> failed. Trim the queue by the optional 'h' on
         * <failed/>, reset the dead session and clear its persisted state.
         *
         * Only a failed *resumption* strands sent-but-undelivered stanzas, so
         * only then is the remaining queue salvaged for re-send once a fresh
         * session reaches <enabled/> (a SHOULD, XEP-0198 §4). When <failed/>
         * answers an <enable/> the stream is alive and bound — everything in
         * `unacked` was delivered normally; re-sending it later would duplicate
         * it.
         * @param view
         */
        _handleFailed(view) {
            const s = this._state;
            if (!s.enableSent && !s.id) {
                return;
            }
            const resumeFailed = this._resumePending;
            this._resumePending = false;
            const h = parseH(view.attrs.h);
            if (h !== null) {
                this._reconcile(h);
            }
            if (resumeFailed) {
                this._pendingResend = this._pendingResend.concat(s.unacked);
            }
            this._state = freshState();
            this.clearPersistedState();
            this.onFailed(view, resumeFailed);
        }
        /**
         * Re-send stanzas salvaged from a failed resumption on the freshly
         * enabled session. Messages are stamped with a XEP-0203 <delay/> carrying
         * their original send time. The re-sent stanzas enter the new session's
         * unacked queue in wire order.
         */
        _resendPending() {
            const pending = this._pendingResend;
            if (!pending.length) {
                return;
            }
            this._pendingResend = [];
            const s = this._state;
            for (const entry of pending) {
                // Strip the root `from` first: the salvaged strings still carry the
                // dead session's resource, which the freshly bound session would
                // reject as invalid-from. Then apply the message delay stamp.
                const stripped = stripFrom(entry.stanza);
                const stanza = entry.name === 'message' ? stampDelay(stripped, entry.name, entry.queuedAt) : stripped;
                this._sendRaw(stanza);
                s.unacked.push(Object.assign(Object.assign({}, entry), { stanza }));
                s.sinceLastAck += 1;
            }
            this.requestAck();
        }
        /** Persist the current state, if a storage key has been configured. */
        _persist() {
            if (this._storageKey) {
                this._storage.save(this._storageKey, this._state);
            }
        }
    }

    const OPENING_TAG = /^\s*<([a-zA-Z][^\s/>]*)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*\/?>/;
    const ATTRIBUTE = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    /**
     * Unescapes invalid xml characters (duplicated from ../utils.ts so the worker
     * bundle doesn't pull in utils and its dependencies).
     * @param text
     */
    function xmlUnescape(text) {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&apos;/g, "'")
            .replace(/&quot;/g, '"');
    }
    /**
     * Extract a {@link StanzaView} from a raw websocket frame by inspecting its
     * opening tag. Namespace prefixes are stripped from the tag name and
     * attribute values are XML-unescaped; the frame itself becomes the view's
     * `serialized` payload.
     * @param frame - The raw frame string.
     * @returns The view, or null if the frame doesn't start with a parseable tag.
     */
    function peekElement(frame) {
        const m = OPENING_TAG.exec(frame);
        if (!m) {
            return null;
        }
        const name = m[1].includes(':') ? m[1].slice(m[1].indexOf(':') + 1) : m[1];
        const attrs = {};
        ATTRIBUTE.lastIndex = 0;
        let attr;
        while ((attr = ATTRIBUTE.exec(m[2])) !== null) {
            attrs[attr[1]] = xmlUnescape(attr[2] !== undefined ? attr[2] : attr[3]);
        }
        return { name, attrs, serialized: frame };
    }

    /**
     * The SharedWorker side of Strophe's worker-based connection sharing:
     * multiple tabs (ports) share the single websocket connection managed here.
     *
     * Exactly one live port holds the 'primary' role and it drives the XMPP stream
     * (handshake, and at the application layer it is the tab that should respond
     * to stanzas). All other ports are 'secondary' and attach to the shared
     * session.
     *
     * The worker sends pings to probe port liveness. Pages answer from their
     * message handler, which browsers do not throttle. A silent port keeps
     * receiving broadcasts (a frozen tab replays them on thaw) until it has
     * been quiet for so long that it must be gone for good (30 mins).
     *
     * This file is built as a self-contained classic-worker script
     * (`dist/shared-connection-worker.js`) keep it free of DOM dependencies.
     */
    /** How often the worker pings its ports (and sweeps for gone ones). */
    const PING_INTERVAL = 30000;
    /**
     * How long the primary may stay silent before the worker fails over to the
     * freshest other port. Pongs are posted from the page's message handler,
     * which runs even in background-throttled tabs, so silence this long means
     * the tab is frozen, crashed or gone — not merely backgrounded.
     */
    const PRIMARY_TIMEOUT = 70000;
    /**
     * How long any port may stay silent before it is dropped entirely. Generous:
     * a frozen tab posts nothing but keeps its MessagePort, and every broadcast
     * posted to it while frozen is delivered when it thaws — dropping it early
     * would forfeit that replay. A dropped port that speaks again is re-admitted.
     */
    const PORT_GC_TIMEOUT = 30 * 60000;
    /** How long the socket is kept open after the last port has gone away. */
    const SOCKET_GRACE = 10000;
    /**
     * How long the worker waits for the server to answer an ack probe (<r/>)
     * before presuming the socket dead. Probes are sent from the sweep when an
     * SM-enabled stream has been quiet for a full PING_INTERVAL, and when a
     * tab (re)joins the established session. Without them, a silently dead
     * socket (NAT timeout, sleep/wake) is only discovered by the OS's TCP
     * timeout, which can take many minutes.
     */
    const PROBE_TIMEOUT = 10000;
    /** The page→worker methods that may be invoked via postMessage. */
    const METHODS = [
        '_connect',
        '_attach',
        '_pong',
        '_relinquish',
        'send',
        'close',
        '_closeSocket',
        '_smFeatures',
        '_bound',
    ];
    /**
     * The subset of METHODS that presumes a live socket. When one arrives after
     * the socket died, the sender is answered with _onClose instead of having
     * its message dropped into the void (see _onPortMessage).
     */
    const SESSION_METHODS = ['send', 'close', '_smFeatures', '_bound'];
    /**
     * Manages the shared websocket connection as well as the ports of the
     * connected tabs.
     */
    class ConnectionManager {
        constructor() {
            this.ports = new Map();
            this.socket = null;
            this.session = 'none';
            this.sm = null;
            this._pendingJoins = new Map();
            this._sweepTimer = null;
            this._graceTimer = null;
            this._probeTimer = null;
            this._lastInbound = 0;
        }
        /**
         * Register a newly connected port. It is admitted (and given a role) when
         * it first speaks.
         */
        addPort(port) {
            port.addEventListener('message', (e) => this._onPortMessage(port, e));
            port.start();
            if (!this._sweepTimer) {
                this._sweepTimer = setInterval(() => this._sweep(), PING_INTERVAL);
            }
        }
        /**
         * Dispatch a message from a port. Any message counts as liveness; a port
         * that was dropped (e.g. a long-frozen tab) is re-admitted here.
         */
        _onPortMessage(port, e) {
            const [method, ...args] = e.data;
            if (method === '_bye') {
                this._bye(port);
                return;
            }
            if (!METHODS.includes(method)) {
                this._post(port, 'log', 'error', `Found unhandled service worker message: ${method}`);
                return;
            }
            const info = this.ports.get(port);
            if (info) {
                info.lastSeen = Date.now();
            }
            else {
                // New port, or a dropped one speaking again (§ re-admission).
                const role = this._hasPrimary() ? 'secondary' : 'primary';
                this.ports.set(port, { role, lastSeen: Date.now() });
                if (method !== '_connect' && method !== '_attach') {
                    if (this._socketLive()) {
                        // Keep the page's role in sync — this demotes a stale
                        // primary (e.g. a frozen tab that was failed over while
                        // suspended).
                        this._post(port, '_role', role, this.jid);
                    }
                    else {
                        // The tab believes it belongs to a session that no longer
                        // exists (the socket died or was grace-closed while it was
                        // away). Tell it, so it reconnects instead of staying
                        // wedged in a connected-looking state.
                        this._post(port, '_onClose', 'The shared socket is gone');
                    }
                }
            }
            if (SESSION_METHODS.includes(method) && !this._socketReady()) {
                // The tab is talking to a dead (or still-connecting) socket —
                // no legitimate sender exists before the socket opens, since the
                // primary only starts the stream in reaction to _onOpen. Salvage
                // what can be salvaged and make reality visible instead of
                // dropping the message into the void (a send() on a CONNECTING
                // socket would throw and lose the frame).
                if (method === 'send') {
                    this._salvageFrame(port, args[0]);
                }
                this._post(port, '_onClose', 'The shared socket is gone');
                return;
            }
            this._cancelGrace();
            try {
                this[method](port, ...args);
            }
            catch (err) {
                console === null || console === void 0 ? void 0 : console.error(err);
            }
        }
        /**
         * Connect, or (when a live socket for the same user already exists)
         * join the shared session as a secondary instead of reconnecting (§2.5).
         * The first joiner becomes primary and drives the connection.
         */
        _connect(port, service, jid, version) {
            var _a;
            if (!this._checkVersion(port, version)) {
                return;
            }
            const sameUser = !this.jid || !jid || jid.split('/')[0].toLowerCase() === this.jid.split('/')[0].toLowerCase();
            if (this._socketLive() && sameUser) {
                // A tab (re)connecting is a good moment to verify that the
                // shared socket is actually alive: a reloaded page joining a
                // zombie session would otherwise only find out at the next
                // sweep-driven probe.
                this._probe();
                this._joinShared(port, '_connect');
                return;
            }
            this.service = service;
            this.jid = jid;
            // Per-stream SM state starts fresh; resumable state is reloaded from
            // the engine's storage when the primary reports SM support
            // (_smFeatures), mirroring the page-side connect() flow.
            (_a = this.sm) === null || _a === void 0 ? void 0 : _a.reset();
            // This port drives the new connection and becomes primary.
            for (const [p, info] of this.ports) {
                if (p !== port && info.role === 'primary') {
                    info.role = 'secondary';
                    this._post(p, '_role', 'secondary', this.jid);
                }
            }
            this.ports.get(port).role = 'primary';
            this._post(port, '_role', 'primary', this.jid);
            this._closeSocket();
            this.session = 'connecting';
            this.socket = new WebSocket(service, 'xmpp');
            // _onOpen goes only to the connecting (primary) port: every tab's
            // Websocket layer reacts to it by sending a stream-<open/>, and a
            // still-attached secondary doing so would corrupt the new stream.
            this.socket.onopen = () => this._post(port, '_onOpen');
            this.socket.onerror = (e) => this._onError(e);
            this.socket.onclose = (e) => this._onClose(e);
            this.socket.onmessage = (message) => this._onMessage(message);
        }
        /**
         * Attach to the shared session, if there is one.
         * @param port
         * @param _service
         * @param version - The page's SHARED_WORKER_PROTOCOL_VERSION.
         */
        _attach(port, _service, version) {
            if (!this._checkVersion(port, version)) {
                return;
            }
            if (this._socketLive()) {
                this._probe();
                this._joinShared(port, '_attach');
            }
            else {
                this._post(port, '_attachCallback', Status.ATTACHFAIL);
            }
        }
        /**
         * The primary reports that the post-SASL stream features advertise
         * XEP-0198 (§2.3). This is the resume-vs-bind decision point: only the
         * worker knows whether resumable state exists, so it either sends
         * <resume/> itself (answering with _smResumed/_smFailed once the server
         * replies) or tells the requesting port to proceed with binding.
         * @param port
         */
        _smFeatures(port) {
            const sm = this._ensureSM();
            sm.serverSupported = true;
            sm.initialize(this.jid);
            if (sm.hasResumableState()) {
                sm.sendResume();
            }
            else {
                this._post(port, '_smNoState');
            }
        }
        /**
         * The primary reports that the connect flow completed (resource bound,
         * or legacy auth/session establishment finished): adopt the bound JID as
         * the shared one so attaching secondaries and promotions hand out a
         * resource the server actually knows about, start a fresh SM session if
         * this stream's features advertised support (_smFeatures), and release
         * any joins parked on the handshake. The <enable/> is written before the
         * parked joins drain, so it precedes anything a newly attached tab sends.
         * @param _port
         * @param jid - The server-assigned full JID.
         */
        _bound(_port, jid) {
            var _a;
            this.jid = jid;
            if ((_a = this.sm) === null || _a === void 0 ? void 0 : _a.serverSupported) {
                this.sm.sendEnable(jid);
            }
            this._sessionEstablished();
        }
        /**
         * Lazily create the worker-resident engine. Its nonzas go straight to
         * the socket (outbound frames relay in receipt order, so nothing can be
         * overtaken), and its lifecycle events are forwarded to the tabs as the
         * _smEnabled/_smResumed/_smFailed messages that feed the page-side
         * mirrors and drive the primary's connect flow.
         */
        _ensureSM() {
            if (!this.sm) {
                const sm = new StreamManagement((data) => {
                    var _a;
                    (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(data);
                });
                sm.onEnabled = () => this._broadcast('_smEnabled', sm.state.id, sm.state.max, sm.state.boundJid);
                sm.onResumed = () => {
                    this.jid = sm.boundJid;
                    this._sessionEstablished();
                    this._broadcast('_smResumed', sm.boundJid, sm.state.id, sm.state.max);
                };
                // Only a failed *resumption* concerns the tabs (the primary must
                // fall back to binding); a refused <enable/> just means this
                // stream runs without SM.
                sm.onFailed = (_view, resumeFailed) => {
                    if (resumeFailed) {
                        this._broadcast('_smFailed');
                    }
                };
                this.sm = sm;
            }
            return this.sm;
        }
        /**
         * Liveness reply to the worker's _ping. The lastSeen update happens in
         * the dispatcher, so any message from a port counts. This method only
         * needs to exist.
         * @param _port
         */
        _pong(_port) {
            return;
        }
        /**
         * The page announces it is about to be frozen (its CPU stops): hand the
         * primary role to the freshest other port right away instead of making
         * the worker discover the freeze through missed pongs.
         * @param port
         */
        _relinquish(port) {
            const info = this.ports.get(port);
            if ((info === null || info === void 0 ? void 0 : info.role) !== 'primary') {
                return;
            }
            if (this.session === 'connecting') {
                this._primaryLost();
                return;
            }
            // With no other port, the tab keeps the role and resumes as primary.
            this._failover(port);
        }
        /**
         * Graceful removal (sent from pagehide). If the primary leaves, the next
         * live port is promoted on the same socket.
         * @param port
         */
        _bye(port) {
            const info = this.ports.get(port);
            if (!info)
                return;
            this.ports.delete(port);
            if (info.role === 'primary') {
                this._primaryLost();
            }
            if (this.ports.size === 0) {
                this._startGrace();
            }
        }
        /**
         * Relay an outbound frame to the socket, feeding it to the XEP-0198
         * engine and reflecting messages/presences to the other tabs.
         * @param port
         * @param data
         */
        send(port, data) {
            var _a;
            const view = peekElement(data);
            if ((view === null || view === void 0 ? void 0 : view.name) === 'close') {
                // A stream-closing <close/> triggers the final ack + state clearing,
                // and the engine writes that final <a/> straight to the socket, so
                // onGracefulClose() must run *before* the close frame goes out.
                (_a = this.sm) === null || _a === void 0 ? void 0 : _a.onGracefulClose();
                this.socket.send(data);
                return;
            }
            this.socket.send(data);
            if (this.sm) {
                if (view) {
                    // A countable stanza is tracked *after* it is written, because
                    // trackOutbound() may emit an <r/> which should ride behind the
                    // stanza it covers.
                    this.sm.trackOutbound(view);
                }
                else {
                    this._warnUnpeekable('outbound', data);
                }
            }
            if (view) {
                this._reflect(port, view.name, data);
            }
        }
        /**
         * Reflect an outbound message/presence to every tab except the sender,
         * so all tabs can render what any one of them sent. Delivered as its own
         * `_onStanzaSent` page message — never as `_onMessage` — because a sent
         * stanza must not enter the receiving tabs' inbound pipeline (stanza
         * handlers, SM counting, xmlInput). IQs are not reflected: they are
         * request/response traffic private to the sending tab.
         * @param sender - The port the stanza came from (gets no reflection).
         * @param name - The frame's tag name (from the peeker).
         * @param data - The raw outbound frame.
         */
        _reflect(sender, name, data) {
            if (name !== 'message' && name !== 'presence') {
                return;
            }
            for (const [port] of this.ports) {
                if (port !== sender) {
                    this._post(port, '_onStanzaSent', data);
                }
            }
        }
        /**
         * Send the stream-closing frame before disconnecting.
         * @param port
         * @param data
         */
        close(port, data) {
            var _a;
            if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
                try {
                    (_a = this.sm) === null || _a === void 0 ? void 0 : _a.onGracefulClose();
                    this.socket.send(data);
                }
                catch (e) {
                    this._post(port, 'log', 'error', e);
                    this._post(port, 'log', 'error', "Couldn't send <close /> tag.");
                }
            }
        }
        /**
         * Explicitly close the shared socket (a deliberate disconnect/logout —
         * a mere tab close sends `_bye` instead). Joins parked on the handshake
         * are answered with ATTACHFAIL: the session they were waiting for is
         * not going to happen.
         * @param _port
         */
        _closeSocket(_port) {
            this.session = 'none';
            this._cancelProbe();
            this._failPendingJoins();
            if (this.socket) {
                try {
                    this.socket.onclose = null;
                    this.socket.onerror = null;
                    this.socket.onmessage = null;
                    this.socket.close();
                }
                catch (e) {
                    this.ports.forEach((_info, p) => this._post(p, 'log', 'error', e));
                }
            }
            this.socket = null;
        }
        /**
         * @param e
         */
        _onClose(e) {
            this.session = 'none';
            this._cancelProbe();
            this._failPendingJoins();
            this._broadcast('_onClose', e.reason);
        }
        /**
         * Deliver an inbound frame to the tabs, feeding it to the XEP-0198
         * engine first: counting and <r/> → <a/> replies happen exactly once.
         * Lifecycle transitions (<enabled/>/<resumed/>/<failed/>) surface
         * through the engine's event hooks (see _ensureSM).
         *
         * Until the session is established, frames go only to the primary,
         * since only it is responsible for SASL negotiation and session setup.
         * Once established, frames are broadcast to all tabs.
         * @param message
         */
        _onMessage(message) {
            // Any inbound traffic proves the socket alive.
            this._lastInbound = Date.now();
            this._cancelProbe();
            if (this.sm && typeof message.data === 'string') {
                const view = peekElement(message.data);
                if (view) {
                    this.sm.onInbound(view);
                }
                else {
                    this._warnUnpeekable('inbound', message.data);
                }
            }
            if (this.session === 'established') {
                this._broadcast('_onMessage', { data: message.data });
            }
            else {
                const primary = this._primaryPort();
                if (primary) {
                    this._post(primary, '_onMessage', { data: message.data });
                }
            }
        }
        /**
         * @param error
         */
        _onError(error) {
            this._broadcast('_onError', error);
        }
        /**
         * Verify that the page and this worker were built against the same
         * page↔worker protocol. On mismatch the port is refused (and told the
         * socket is closed, so the page fails loudly rather than misbehaving).
         * @param port
         * @param version - The version the page sent along with _connect/_attach.
         * @returns true when the page speaks this worker's protocol.
         */
        _checkVersion(port, version) {
            var _a, _b;
            if (version === SHARED_WORKER_PROTOCOL_VERSION) {
                return true;
            }
            this._post(port, 'log', 'fatal', `Shared connection worker protocol mismatch (page: ${version}, worker: ` +
                `${SHARED_WORKER_PROTOCOL_VERSION}) — the page and dist/shared-connection-worker.js ` +
                `are from different builds`);
            if (version > SHARED_WORKER_PROTOCOL_VERSION) {
                // The page comes from a newer build than this worker.
                // Shut down, so that the pages' next connection attempt spawns a fresh worker.
                this._broadcast('_onClose', 'The shared connection worker is outdated and has shut down');
                this._closeSocket();
                (_b = (_a = globalThis).close) === null || _b === void 0 ? void 0 : _b.call(_a);
                return false;
            }
            // The page is older than this worker (a stale tab after a deploy):
            // refuse it so that it has to be reloaded to speak this protocol.
            this._post(port, '_onClose', 'Shared connection worker protocol mismatch');
            this.ports.delete(port);
            return false;
        }
        /**
         * @returns true when the socket exists and is not closing/closed. A
         *     CONNECTING socket counts: joins arriving during the handshake must
         *     be parked, not refused.
         */
        _socketLive() {
            return (this.socket && this.socket.readyState !== WebSocket.CLOSED && this.socket.readyState !== WebSocket.CLOSING);
        }
        /**
         * @returns true when the socket is OPEN, i.e. ready to carry frames.
         */
        _socketReady() {
            var _a;
            return ((_a = this.socket) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN;
        }
        /**
         * @returns true if any live port currently holds the primary role.
         */
        _hasPrimary() {
            return this._primaryPort() !== null;
        }
        /**
         * @returns The port currently holding the primary role, or null.
         */
        _primaryPort() {
            for (const [port, info] of this.ports) {
                if (info.role === 'primary')
                    return port;
            }
            return null;
        }
        /**
         * Join a port onto the shared session: it becomes secondary (or primary,
         * if no primary is left) and is attached. Joins that arrive while the
         * handshake is still in flight are parked.
         * @param port
         * @param origin - The method the join arrived through (see _pendingJoins).
         */
        _joinShared(port, origin) {
            var _a;
            if (this.session !== 'established') {
                if (!this._pendingJoins.has(port)) {
                    this._pendingJoins.set(port, origin);
                }
                return;
            }
            const info = this.ports.get(port);
            let hasOtherPrimary = false;
            for (const [p, i] of this.ports) {
                if (p !== port && i.role === 'primary') {
                    hasOtherPrimary = true;
                    break;
                }
            }
            info.role = hasOtherPrimary ? 'secondary' : info.role;
            this._post(port, '_role', info.role, this.jid);
            if ((_a = this.sm) === null || _a === void 0 ? void 0 : _a.enabled) {
                // Seed the joining tab's page-side SM mirror with the running
                // session (it missed the _smEnabled/_smResumed broadcast).
                this._post(port, '_smEnabled', this.sm.state.id, this.sm.state.max, this.sm.state.boundJid);
            }
            this._post(port, '_attachCallback', Status.ATTACHED, this.jid);
        }
        /**
         * The stream reached its usable state (resource bound or resumed):
         * record it and answer the joins that were parked on the handshake.
         */
        _sessionEstablished() {
            this.session = 'established';
            const pending = this._pendingJoins;
            this._pendingJoins = new Map();
            pending.forEach((origin, p) => this.ports.has(p) && this._joinShared(p, origin));
        }
        /**
         * Fail parked joins. The session they were waiting for died before it
         * was established. '_attach' joins get ATTACHFAIL; '_connect' joins are
         * told the socket closed, which fails the page's connect attempt so the
         * embedder's reconnect logic can retry.
         */
        _failPendingJoins() {
            const pending = this._pendingJoins;
            this._pendingJoins = new Map();
            pending.forEach((origin, p) => {
                if (origin === '_attach') {
                    this._post(p, '_attachCallback', Status.ATTACHFAIL);
                }
                else {
                    this._post(p, '_onClose', 'The shared connection could not be established');
                }
            });
        }
        /**
         * The primary is gone (bye, GC or freeze). If the session is established
         * the freshest remaining port takes over on the same socket. If the
         * handshake was still in flight, nobody else can finish it (only the
         * primary holds credentials): kill the socket so the remaining tabs
         * reconnect and elect a new primary.
         */
        _primaryLost() {
            if (this.session === 'connecting') {
                this._closeSocket();
                this._broadcast('_onClose', 'The connection-driving tab went away during the handshake');
            }
            else {
                this._promoteNext();
            }
        }
        /**
         * Promote the freshest port to primary — same socket, no reconnect.
         * @param exclude - A port that must not be picked (e.g. the one
         *     relinquishing the role).
         */
        _promoteNext(exclude) {
            const next = this._freshestPort(exclude);
            if (!next)
                return;
            this.ports.get(next).role = 'primary';
            this._post(next, '_promote', this.jid);
        }
        /**
         * Hand the primary role from `port` to the freshest other port, if any.
         * @param port - The current primary.
         * @param minLastSeen - Only consider candidates seen at or after this
         *     timestamp (so a failover never picks an equally-dead port).
         * @returns true if a failover happened.
         */
        _failover(port, minLastSeen = 0) {
            const next = this._freshestPort(port, minLastSeen);
            if (!next)
                return false;
            this.ports.get(port).role = 'secondary';
            this._post(port, '_role', 'secondary', this.jid);
            this.ports.get(next).role = 'primary';
            this._post(next, '_promote', this.jid);
            return true;
        }
        /**
         * @param exclude - A port to skip.
         * @param minLastSeen - Minimum lastSeen for a port to qualify.
         * @returns The most recently seen qualifying port, or null.
         */
        _freshestPort(exclude, minLastSeen = 0) {
            let best = null;
            let bestSeen = minLastSeen - 1;
            for (const [port, info] of this.ports) {
                if (port !== exclude && info.lastSeen > bestSeen) {
                    best = port;
                    bestSeen = info.lastSeen;
                }
            }
            return best;
        }
        /**
         * A frame was sent into a dead socket. If an SM session was active, feed
         * a stanza to the engine anyway: it lands in the unacked queue and is
         * replayed when the session is resumed over the next socket, so the
         * message the user just sent isn't lost to the bad timing. A <close/>
         * still ends the session: the final <a/> can't be delivered anymore
         * (the engine's sendRaw is null-guarded), but the persisted state is
         * cleared so the deliberately-ended session isn't resumed later.
         * @param port - The port the frame came from.
         * @param data - The raw outbound frame.
         */
        _salvageFrame(port, data) {
            if (!this.sm)
                return;
            const view = peekElement(data);
            if ((view === null || view === void 0 ? void 0 : view.name) === 'close') {
                this.sm.onGracefulClose();
            }
            else if (view) {
                this.sm.trackOutbound(view);
                if (this.sm.isTracking()) {
                    // The stanza sits in the queue and will be replayed on the
                    // next resume, so reflect it like any sent stanza.
                    this._reflect(port, view.name, data);
                }
            }
            else {
                this._warnUnpeekable('outbound', data);
            }
        }
        /**
         * Report a frame the regex peeker (see parse.ts) could not parse while an
         * SM session was active. Such a frame passes through uncounted and
         * untracked, so the XEP-0198 handled-stanza counters drift and stanzas
         * get duplicated (inbound) or lost (outbound) on the next resume —
         * exactly the silent corruption SM exists to prevent, so make it loud.
         *
         * Only frames that look like an element open are reported: the stream
         * prolog, whitespace keepalives and empty frames legitimately don't peek
         * and are never countable stanzas.
         *
         * The opening tag is included so the peeker can actually be fixed — it is
         * where the parse failed (peekElement only ever inspects the opening tag)
         * and is the whole diagnostic. The report stops at the first '>' (capped),
         * which keeps the stanza payload — message bodies and the like — out of
         * the logs.
         * @param direction
         * @param frame
         */
        _warnUnpeekable(direction, frame) {
            if (!/^\s*<[a-zA-Z]/.test(frame)) {
                return;
            }
            const MAX = 200;
            const tagEnd = frame.indexOf('>');
            const openTag = tagEnd !== -1 && tagEnd + 1 <= MAX ? frame.slice(0, tagEnd + 1) : frame.slice(0, MAX) + '…';
            this._broadcast('log', 'error', `StreamManagement: could not parse an ${direction} frame; it was not counted, ` +
                `so the handled-stanza counters may drift. Opening tag: ${openTag}`);
        }
        /**
         * Ping every port and act on prolonged silence. A live page answers
         * pings from its message handler even when its timers are throttled, so:
         * a primary silent past PRIMARY_TIMEOUT is failed over (but keeps
         * receiving — it may merely be frozen and will learn of its demotion on
         * thaw), and a port silent past PORT_GC_TIMEOUT is dropped for good.
         */
        _sweep() {
            const now = Date.now();
            for (const [port, info] of this.ports) {
                if (now - info.lastSeen > PORT_GC_TIMEOUT) {
                    this.ports.delete(port);
                    if (info.role === 'primary') {
                        this._primaryLost();
                    }
                    continue;
                }
                this._post(port, '_ping');
                if (info.role === 'primary' && now - info.lastSeen > PRIMARY_TIMEOUT) {
                    if (this.session === 'connecting') {
                        this._primaryLost();
                    }
                    else {
                        // Only fail over to a port that is provably fresher.
                        this._failover(port, now - PRIMARY_TIMEOUT);
                    }
                }
            }
            if (this.ports.size === 0 && this._socketLive()) {
                this._startGrace();
            }
            if (this.session === 'established' && now - this._lastInbound >= PING_INTERVAL) {
                this._probe();
            }
        }
        /**
         * Ask the server for an ack and treat a missing reply as socket death.
         * The <r/> doubles as a keepalive on quiet connections.
         */
        _probe() {
            var _a;
            if (this._probeTimer || !((_a = this.sm) === null || _a === void 0 ? void 0 : _a.enabled) || !this._socketReady()) {
                return;
            }
            this.sm.requestAck();
            this._probeTimer = setTimeout(() => {
                this._probeTimer = null;
                this._onSocketDead();
            }, PROBE_TIMEOUT);
        }
        _cancelProbe() {
            if (this._probeTimer) {
                clearTimeout(this._probeTimer);
                this._probeTimer = null;
            }
        }
        /**
         * The probe went unanswered: the socket is transmitting into the void.
         * Close it and tell the tabs, so they reconnect. The engine's state is
         * untouched, so the next stream resumes and replays the unacked queue.
         */
        _onSocketDead() {
            this._broadcast('log', 'warn', `StreamManagement: ack probe unanswered for ${PROBE_TIMEOUT}ms; presuming the socket dead`);
            this._closeSocket();
            this._broadcast('_onClose', 'The connection stopped responding');
        }
        /**
         * Close the socket if no port shows up within the grace period.
         */
        _startGrace() {
            if (this._graceTimer)
                return;
            this._graceTimer = setTimeout(() => {
                this._graceTimer = null;
                this._closeSocket();
            }, SOCKET_GRACE);
        }
        _cancelGrace() {
            if (this._graceTimer) {
                clearTimeout(this._graceTimer);
                this._graceTimer = null;
            }
        }
        /**
         * Send a message to a single port (worker→page traffic is port-targeted;
         * only genuine broadcasts use _broadcast).
         * @param port
         * @param msg
         */
        _post(port, ...msg) {
            port.postMessage(msg);
        }
        /**
         * Send a message to all live ports.
         * @param msg
         */
        _broadcast(...msg) {
            this.ports.forEach((_info, port) => port.postMessage(msg));
        }
    }
    let manager = null;
    if (typeof addEventListener === 'function') {
        addEventListener('connect', (e) => {
            manager = manager || new ConnectionManager();
            manager.addPort(e.ports[0]);
        });
    }

    exports.PING_INTERVAL = PING_INTERVAL;
    exports.PORT_GC_TIMEOUT = PORT_GC_TIMEOUT;
    exports.PRIMARY_TIMEOUT = PRIMARY_TIMEOUT;
    exports.PROBE_TIMEOUT = PROBE_TIMEOUT;
    exports.SOCKET_GRACE = SOCKET_GRACE;
    exports.default = ConnectionManager;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=shared-connection-worker.js.map
