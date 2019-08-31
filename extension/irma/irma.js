(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.IRMA = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var jwt_decode = require("jwt-decode");
require("bootstrap");
var kjua = require("kjua");

// Import translations
var en = require("./languages/en.js").default;
var nl = require("./languages/nl.js").default;
var translations = { en: en, nl: nl };
var defaultLang = "en"; // Default after init, and fallback when a language string is not defined.

var STATUS_CHECK_INTERVAL = 500;
var DEFAULT_TIMEOUT = 120 * 1000;

var Action = {
    Verifying: "Verifying",
    Issuing: "Issuing",
    Signing: "Signing"
};

var UserAgent = {
    Desktop: "Desktop",
    Android: "Android",
    iOS: "iOS"
};

var ErrorCodes = {
    ConnectionError: {
        Initial: "CONNERR_INITIAL",
        Status: "CONNERR_STATUS",
        Proof: "CONNERR_PROOF"
    },
    ProtocolError: {
        Initial: "PROTERR_INITIAL",
        Sessiondata: "PROTERR_SESSIONDATA",
        Status: {
            Initial: "PROTERR_STATUS_INITIAL",
            Connected: "PROTERR_STATUS_CONNECTED"
        }
    },
    InternalError: {
        State: "INTERR_STATE"
    },
    Cancelled: "CANCELLED",
    Timeout: "TIMEOUT",
    Rejected: "REJECTED"
};

var State = {
    Initialized: "Initialized",
    PopupReady: "PopupReady",
    SessionStarted: "SessionStarted",
    ClientConnected: "ClientConnected",
    Cancelled: "Cancelled",
    Timeout: "Timeout",
    Done: "Done"
};
var state = State.Done;

var popupModel = {
    "irma-title": "",
    "irma-text": "",
    "irma-loader": "",
    "irma-cancel-button": ""
};
var curLang;

var Loglevel = {
    None: 3,
    Error: 2,
    Warn: 1,
    Info: 0
};
var loglevel; // Determines which messages are written to log

var DefaultOptions = {
    lang: defaultLang,
    loglevel: Loglevel.Info,
    newServer: false
};

// Data for irma logo
var IrmaLogo = "data:image/png;base64,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";

// Extra state, this flag is set when we timeout locally but the
// status socket is still active. After this flag is set, we assume
// that errors while polling (if the status socket dies) are due to
// a timeout.
var sessionTimedOut = false;

// State to manage setup
var librarySetup = false;

var ua;

var sessionPackage;
var sessionCounter = 0;

var successCallback;
var cancelCallback;
var failureCallback;

var sessionId;
var apiServer;
var apiServerNew;
var action;
var actionPath;
var qrcodeDialog;

var statusWebsocket;

var fallbackTimer;
var timeoutTimer;

function log(level) {
    var _console, _console2, _console3, _console4;

    if (level < loglevel) return; // Early out if not needed

    for (var _len = arguments.length, msg = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        msg[_key - 1] = arguments[_key];
    }

    switch (level) {
        case Loglevel.Error:
            (_console = console).error.apply(_console, ["ERROR:"].concat(msg));
            break;
        case Loglevel.Warn:
            (_console2 = console).warn.apply(_console2, ["WARNING:"].concat(msg));
            break;
        case Loglevel.Info:
            (_console3 = console).info.apply(_console3, ["INFO:"].concat(msg));
            break;
        default:
            (_console4 = console).log.apply(_console4, msg);
    }
}

function info() {
    checkInit();
    log(Loglevel.Info, "IRMA API server:", apiServer);
}

function failure(errorcode, msg) {
    for (var _len2 = arguments.length, data = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        data[_key2 - 2] = arguments[_key2];
    }

    log.apply(undefined, [Loglevel.Error, errorcode, msg].concat(data));

    state = State.Done;
    closePopup();
    cancelTimers();

    if (typeof failureCallback !== "undefined") {
        failureCallback.apply(undefined, [errorcode, msg].concat(data));
    }
}

// Basic translation functions
function getTranslatedString(id) {
    var parts = id.split('.');
    var res = translations[curLang];
    for (var part in parts) {
        if (res === undefined) break;
        res = res[parts[part]];
    }

    if (res === undefined) {
        res = translations[defaultLang];
        for (var part in parts) {
            if (res === undefined) break;
            res = res[parts[part]];
        }
    }

    if (res === undefined) return "";else return res;
}

function refreshTranslation() {
    for (var element in popupModel) {
        $('#' + element).text(getTranslatedString(popupModel[element]));
    }
}

function popupChangeContent(el, id) {
    popupModel[el] = id;
    $('#' + el).text(getTranslatedString(id));
}

function setLang(lang) {
    curLang = lang;
    refreshTranslation();
}

function getSetupFromMetas() {
    log(Loglevel.Info, "Running getSetupFromMetas");
    var metas = document.getElementsByTagName("meta");
    for (var i = 0; i < metas.length; i++) {
        var meta_name = metas[i].getAttribute("name");
        if (meta_name === null) {
            continue;
        }

        meta_name = meta_name.toLowerCase();
        log(Loglevel.Info, "Examining meta: ", meta_name);
        if (meta_name === "irma-api-server") {
            apiServer = metas[i].getAttribute("value");
            log(Loglevel.Info, "API server set to", apiServer);
        }
    }
}

/* TODO: Incomplete user agent detection */
function detectUserAgent() {
    if (/Android/i.test(navigator.userAgent)) {
        log(Loglevel.Info, "Detected Android");
        ua = UserAgent.Android;
    } else if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        // https://stackoverflow.com/questions/9038625/detect-if-device-is-ios
        log(Loglevel.Info, "Detected iOS");
        ua = UserAgent.iOS;
    } else {
        log(Loglevel.Info, "Neither Android nor iOS, assuming desktop");
        ua = UserAgent.Desktop;
    }
}

function userCancelled() {
    cancelSession();

    var xhr = new XMLHttpRequest();
    xhr.open("DELETE", encodeURI(actionPath + sessionId));
    xhr.onload = function () {};
    xhr.send();
}

function sendSessionToPopup() {

    $("#irma-qrcode").empty().append(kjua({
        text: JSON.stringify(sessionPackage),
        size: 230,
        crisp: false
    }));
    $("#irma-spinner").hide();
    $(".irma-option-container").show();

}

function showMessageOnPopup(id) {
    popupChangeContent("irma-text", id);
    $(".irma-option-container").hide();
}

function doSessionFromQr(qr, success_cb, cancel_cb, failure_cb) {
    clearState();
    showPopup();
    setAndCheckCallbacks(success_cb, cancel_cb, failure_cb);

    actionPath = qr.u.substr(0, qr.u.lastIndexOf("/")) + "/"; // Strip session token
    apiServer = actionPath.substr(0, actionPath.lastIndexOf("/")) + "/"; // Also strip session type (e.g., "issue")
    sessionId = qr.u.substr(qr.u.lastIndexOf("/") + 1, qr.u.length);
    sessionPackage = qr;
    startSession();
}

function issue(jwt, success_cb, cancel_cb, failure_cb) {
    checkInit();

    action = Action.Issuing;
    actionPath = apiServer + (apiServerNew ? "session" : "issue/");
    doInitialRequest(jwt, success_cb, cancel_cb, failure_cb);
}

function issueFromQr(qr, success_cb, cancel_cb, failure_cb) {
    checkInit();

    action = Action.Issuing;
    doSessionFromQr(qr, success_cb, cancel_cb, failure_cb);
}

function verify(request, success_cb, cancel_cb, failure_cb) {
    checkInit();

    // Also support bare (i.e., non-JWT) service provider requests for backwards compatibility
    // We assume that the user meant to create an unsigned JWT.
    var jwt;
    if ((typeof request === "undefined" ? "undefined" : _typeof(request)) === "object") {
        log(Loglevel.Warn, "calling IRMA.verify with a bare service provider request " + "is deprecated, you should pass a JWT instead. For now your request will be " + "converted to an unsigned JWT, but you should consider doing this yourself " + "(e.g. using IRMA.createUnsignedVerificationJWT).");
        jwt = createUnsignedVerificationJWT(request);
    } else {
        // Assume it is a JWT and let the API server figure out if it is valid
        jwt = request;
    }

    action = Action.Verifying;
    actionPath = apiServer + (apiServerNew ? "session" : "verification/");
    doInitialRequest(jwt, success_cb, cancel_cb, failure_cb);
}

function verifyFromQr(qr, success_cb, cancel_cb, failure_cb) {
    checkInit();

    action = Action.Verifying;
    doSessionFromQr(qr, success_cb, cancel_cb, failure_cb);
}

function sign(signatureRequest, success_cb, cancel_cb, failure_cb) {
    checkInit();

    action = Action.Signing;
    actionPath = apiServer + (apiServerNew ? "session" : "signature/");
    doInitialRequest(signatureRequest, success_cb, cancel_cb, failure_cb);
}

function signFromQr(qr, success_cb, cancel_cb, failure_cb) {
    checkInit();

    action = Action.Signing;
    doSessionFromQr(qr, success_cb, cancel_cb, failure_cb);
}

function clearState() {
    // Check if there is an old unfinished session going on
    if (state !== State.Cancelled && state !== State.Timeout && state !== State.Done) {
        log(Loglevel.Info, "Found previously active session, cancelling that one first");
        cancelSession(true);
    }

    state = State.Initialized;
    sessionCounter++;
    sessionPackage = {};
    sessionTimedOut = false;
}

function setAndCheckCallbacks(success_cb, cancel_cb, failure_cb) {
    successCallback = success_cb;
    cancelCallback = cancel_cb;
    failureCallback = failure_cb;

    // Ensure that all the callbacks are properly bound
    if (typeof successCallback !== "function") {
        log(Loglevel.Warn, "successCallback is not defined.", "irma.js will not return any results!");
        successCallback = function successCallback() {};
    }

    if (typeof cancelCallback !== "function") {
        log(Loglevel.Warn, "cancelCallback is not defined.", "irma.js will not notify cancel events!");
        cancelCallback = function cancelCallback() {};
    }

    if (typeof failureCallback !== "function") {
        log(Loglevel.Warn, "failureCallback is not defined.", "irma.js will not notify error events!");
        failureCallback = function failureCallback() {};
    }
}

function showPopup() {
    if (ua === UserAgent.Desktop) {

        // Popup code
        log(Loglevel.Info, "Trying to open popup");
        var serverPage;
        if (action === Action.Issuing) serverPage = "Issue";else if (action === Action.Verifying) serverPage = "Verify";else serverPage = "Sign";

        // Add modal
        $("<div id='irma-server-modal' class='modal fade' tabindex='-1' role='dialog' aria-hidden='true'>" + "<div class='modal-dialog'><div class='modal-content'><div class='modal-body'>" + "<div class='irma-page'>" + "<div class='irma-content'>" + "<img src='" + IrmaLogo + "' class='irma-logo-top' alt='IRMA logo'></img>" + "<div class='irma-title' id='irma-title'></div>" + "<p id='irma-text'></p>" + "<div id='irma-spinner' class='irma-load6'>" + "<div class='irma-loader' id='irma-loader'></div>" + "</div>" + "<div class='irma-option-container' style='display:none;'>" + "<div id='irma-qrcode' class='irma-option-box'></div>" + "</div>" + "</div>" + "<div class='irma-button-box'>" + "<button class='irma-button' id='irma-cancel-button'></button>" + "</div>" + "</div>" + "</div></div></div></div>").appendTo("body");

        // Write text
        popupChangeContent("irma-cancel-button", "Common.Cancel");
        popupChangeContent("irma-loader", "Common.WaitData");
        popupChangeContent("irma-title", serverPage + ".Title");
        popupChangeContent("irma-text", serverPage + ".Body");

        // Bind cancel action
        $("#irma-cancel-button").on("click", userCancelled);

        // Remove modal from dom again when it is done
        $("#irma-server-modal").on("hidden.bs.modal", function () {
            $("#irma-server-modal").remove();
        });

        $("#irma-server-modal .modal-content").css({
            "width": "455px",
            "height": "570px",
            "margin": "0",
            "padding": "0"
        });
        $("#irma-server-modal .modal-content .modal-body").css({
            "padding": "8"
        });
        $("#irma-server-modal .modal-content").css({
            "margin": "0 auto",
            "border-radius": "0"
        });

        // Show the modal
        $("#irma-server-modal").modal({ backdrop: "static", keyboard: false });
    }
}

function doInitialRequest(request, success_cb, cancel_cb, failure_cb) {
    setAndCheckCallbacks(success_cb, cancel_cb, failure_cb);
    clearState();
    showPopup();

    var xhr = new XMLHttpRequest();
    xhr.open("POST", encodeURI(actionPath));
    xhr.setRequestHeader("Content-Type", "text/plain");
    var currentSessionCounter = sessionCounter;
    xhr.onload = function () {
        handleInitialServerMessage(xhr, currentSessionCounter);
    };
    xhr.onerror = function () {
        failure(ErrorCodes.ConnectionError.Initial, 'Could not do initial request to the API server', xhr.statusText);
    };
    xhr.send(request);
}

function handleInitialServerMessage(xhr, scounter) {
    if (scounter !== sessionCounter) {
        log(Loglevel.Info, "Intervering result from old session, ignoring!!!");
        return;
    }

    if (xhr.status !== 200) {
        var msg = "Initial call to server API failed. Returned status of " + xhr.status;
        failure(ErrorCodes.ConnectionError.Initial, msg);
        return;
    }

    var sessionData;
    try {
        sessionData = JSON.parse(xhr.responseText);
    } catch (err) {
        failure(ErrorCodes.ProtocolError.Initial, "Cannot parse server initial message: " + xhr.responseText, err);
        return;
    }

    if (apiServerNew) {
        sessionId = sessionData.token;
        sessionData = sessionData.sessionPtr;
    } else {
        sessionId = sessionData.u;
    }

    if (typeof sessionId === "undefined") {
        failure(ErrorCodes.ProtocolError.Sessiondata, "Field 'u' or 'v' missing in initial server message");
        return;
    }

    log(Loglevel.Info, "Setting sessionPackage");
    sessionPackage = sessionData;
    if (!apiServerNew) {
        sessionPackage.u = actionPath + sessionId;
    }
    log(Loglevel.Info, "sessionPackage", sessionPackage);

    startSession();
}

function processInitialServerMessage(sessionData, success_cb, cancel_cb, failure_cb, QRCodeDialog)
{
    action = Action.Verifying;
    actionPath = apiServer + (apiServerNew ? "session" : "verification/");

    setAndCheckCallbacks(success_cb, cancel_cb, failure_cb);
    clearState();
    qrcodeDialog = new QRCodeDialog({'model': new converse.env.Backbone.Model({title: 'IRMA Verification', callback: userCancelled}) });


    if (apiServerNew) {
        sessionId = sessionData.token;
        sessionData = sessionData.sessionPtr;
    } else {
        sessionId = sessionData.u;
    }

    if (typeof sessionId === "undefined") {
        failure(ErrorCodes.ProtocolError.Sessiondata, "Field 'u' or 'v' missing in initial server message");
        return;
    }

    log(Loglevel.Info, "Setting sessionPackage");
    sessionPackage = sessionData;

    if (!apiServerNew) {
        sessionPackage.u = actionPath + sessionId;
    }
    log(Loglevel.Info, "sessionPackage", sessionPackage);

    qrcodeDialog.model.set("qrcode", kjua({text: JSON.stringify(sessionPackage), size: 230, crisp: false}));
    qrcodeDialog.show();

    state = State.SessionStarted;
    return qrcodeDialog;
}

function startSession() {
    //setupClientMonitoring();
    setupFallbackMonitoring();
    setupTimeoutMonitoring();
    //connectClientToken();

    sendSessionToPopup();
    state = State.SessionStarted;
}

function setupClientMonitoring() {
    var url = apiServer.replace(/^http/, "ws") + "status/" + sessionId;
    try {
        statusWebsocket = new WebSocket(url);
    } catch (Err) {
        log(Loglevel.Info, "Websocket setup failed");
    }
    statusWebsocket.onmessage = receiveStatusMessage;
}

/*
 * Periodically check if verification has completed when the
 * websocket is not active.
 */
function setupFallbackMonitoring() {
    var status_url = actionPath + (apiServerNew ? "/" : "") + sessionId + "/status";

    var checkVerificationStatus = function checkVerificationStatus() {
        if (state === State.Done || state === State.Cancelled) {
            clearTimeout(fallbackTimer);
            return;
        }

        if (typeof statusWebsocket === "undefined" || statusWebsocket.readyState !== 1) {
            // Status WebSocket is not active, check using polling
            var xhr = new XMLHttpRequest();
            xhr.open("GET", encodeURI(status_url + "?" + Math.random()));
            xhr.onload = function () {
                handleFallbackStatusUpdate(xhr);
            };
            xhr.send();
        }
    };

    fallbackTimer = setInterval(checkVerificationStatus, STATUS_CHECK_INTERVAL);
}

/*
 * This function makes sure that just before the
 * session to the server times out, we do a manual
 * timeout if the statusSocket is not connected.
 */
function setupTimeoutMonitoring() {
    log(Loglevel.Info, "Timeout monitoring started");
    var checkTimeoutMonitor = function checkTimeoutMonitor() {
        log(Loglevel.Info, "timeout monitoring fired");
        if (typeof statusWebsocket === "undefined" || statusWebsocket.readyState !== 1) {
            // Status WebSocket is not active, manually call timeout
            log(Loglevel.Info, "Manually timing out");
            timeoutSession();
        } else {
            // We should timeout shortly, setting state reflect this
            sessionTimedOut = true;
        }
    };

    timeoutTimer = setTimeout(checkTimeoutMonitor, DEFAULT_TIMEOUT);
}

/*
 * Handle polled status updates. There is no state , so status
 * messages will be repeatedly processed by this function.
 */
function handleFallbackStatusUpdate(xhr) {
    if (xhr.status === 200) {
        // Success
        var data = xhr.responseText;
        switch (data) {
            case "\"INITIALIZED\"":
                // No need to do anything
                break;
            case "\"CONNECTED\"":
                handleStatusMessageSessionStarted("CONNECTED");
                break;
            case "\"DONE\"":
                handleStatusMessageClientConnected("DONE");
                break;
            case "\"CANCELLED\"":
                cancelSession();
                break;
            case "\"TIMEOUT\"":
                timeoutSession();
                break;
            default:
                log(Loglevel.Warn, "Got unexpected state in poll: ", data);
                break;
        }
    } else {
        // Ignore all errors when already done
        if (state === State.Done || state === State.Cancelled) {
            return;
        }

        // TODO: for now also assume timeout on 400 status code
        if (sessionTimedOut || xhr.status === 400) {
            // When timed-out we can ignore errors.
            log(Loglevel.Info, "Assuming polling error is due to timeout");
            timeoutSession();
            return;
        }
        failure(ErrorCodes.ConnectionError.Status, "Status poll from server failed. Returned status of " + xhr.status, xhr);
    }
}

function cancelTimers() {
    if (typeof fallbackTimer !== "undefined") {
        clearTimeout(fallbackTimer);
    }
    if (typeof timeoutTimer !== "undefined") {
        clearTimeout(timeoutTimer);
    }
}

function connectClientToken() {
    var url = "qr/json/" + encodeURIComponent(JSON.stringify(sessionPackage));
    if (ua === UserAgent.Android) {
        var intent = "intent://" + url + "#Intent;package=org.irmacard.cardemu;scheme=cardemu;" + "l.timestamp=" + Date.now() + ";" + "S.qr=" + encodeURIComponent(JSON.stringify(sessionPackage)) + ";" + "S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dorg.irmacard.cardemu;end";
        window.location.href = intent;
    } else if (ua === UserAgent.iOS) {
        window.location.href = "irma://" + url;
    }
}

function receiveStatusMessage(data) {
    var msg = data.data;

    if (msg === "CANCELLED") {
        cancelSession();
        return;
    }

    if (msg === "TIMEOUT") {
        log(Loglevel.Info, "Received status message TIMEOUT, timing out");
        timeoutSession();
        return;
    }

    switch (state) {
        case State.SessionStarted:
            handleStatusMessageSessionStarted(msg);
            break;
        case State.ClientConnected:
            handleStatusMessageClientConnected(msg);
            break;
        default:
            failure(ErrorCodes.InternalError.State, "ERROR: unknown current state", state);
            break;
    }
}

function handleStatusMessageSessionStarted(msg) {
    switch (msg) {
        case "CONNECTED":
            if (state === State.SessionStarted) {
                log(Loglevel.Info, "Client device has connected with the server");
                state = State.ClientConnected;
                showMessageOnPopup("Messages.FollowInstructions");
                if (qrcodeDialog) qrcodeDialog.startSession();
            }
            break;
        default:
            failure(ErrorCodes.ProtocolError.Status.Initial, "unknown status message in Initialized state", msg);
            break;
    }
}

function handleStatusMessageClientConnected(msg) {
    switch (msg) {
        case "DONE":
            log(Loglevel.Info, "Server returned DONE");

            state = State.Done;
            closePopup();
            //closeWebsocket();

            if (action === Action.Verifying) finishVerification();else if (action === Action.Issuing) finishIssuance();else if (action === Action.Signing) finishSigning();
            break;
        default:
            failure(ErrorCodes.ProtocolError.Status.Connected, "unknown status message in Connected state", msg);
            break;
    }
}

function finishIssuance() {
    cancelTimers();
    successCallback();
}

function finishVerification() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", encodeURI(actionPath + (apiServerNew ? "/" : "") + sessionId + (apiServerNew ? "/getproof" : "/getproof")));
    xhr.onload = function () {
        handleProofMessageFromServer(xhr);
    };
    xhr.send();
}

function finishSigning() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", encodeURI(actionPath + (apiServerNew ? "/" : "") + sessionId + (apiServerNew ? "/getproof" : "/getsignature")));
    xhr.onload = function () {
        handleProofMessageFromServer(xhr);
    };
    xhr.send();
}

function closePopup() {
    if (qrcodeDialog) qrcodeDialog.endSession();
    else {
        if (ua !== UserAgent.Android) {
            log(Loglevel.Info, "Closing popup");
            $("#irma-server-modal").modal("hide");
        }
    }
}

function cancelSession() {
    var cancelOld = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    log(Loglevel.Info, "Token cancelled authentication", cancelOld);
    state = State.Cancelled;

    cancelTimers();
    if (!cancelOld) {
        closePopup();
        cancelCallback(ErrorCodes.Cancelled, "User cancelled authentication");
    }
}

function closeWebsocket() {
    // Close websocket if it is still open
    if (typeof statusWebsocket === "undefined" || statusWebsocket.readyState === 1) {
        statusWebsocket.close();
    }
}

function timeoutSession() {
    log(Loglevel.Info, "Session timeout");
    state = State.Timeout;

    //closeWebsocket();
    closePopup();
    cancelTimers();
    cancelCallback(ErrorCodes.Timeout, "Session timeout, please try again");
}

function handleProofMessageFromServer(xhr) {
    if (xhr.status === 200) {
        // Success
        var data = xhr.responseText;
        log(Loglevel.Info, "Proof data: ", data);

        cancelTimers();

        var token = jwt_decode(data);
        if (token.status === "VALID") {
            successCallback(data);
        } else {
            log(Loglevel.Info, "Server rejected proof: ", token.status);
            failureCallback(ErrorCodes.Rejected, "Server rejected the proof", data);
        }
    } else {
        // Failure
        failure(ErrorCodes.ConnectionError.Proof, "Request for proof from server failed. Returned status of " + xhr.status, xhr);
    }
}

function base64url(src) {
    var res = btoa(src);

    // Remove padding characters
    res = res.replace(/=+$/, "");

    // Replace non-url characters
    res = res.replace(/\+/g, "-");
    res = res.replace(/\//g, "_");

    return res;
}

function createJWT(request, requesttype, subject, issuer) {
    checkInit();

    log(Loglevel.Warn, "Creating unsigned JWT!!!");
    var header = {
        alg: "none",
        typ: "JWT"
    };

    var payload = {
        sub: subject,
        iss: issuer,
        iat: Math.floor(Date.now() / 1000)
    };
    payload[requesttype] = request;

    return base64url(JSON.stringify(header)) + "." + base64url(JSON.stringify(payload)) + ".";
}

function createUnsignedJWT(iprequest) {
    log(Loglevel.Warn, "this function is deprecated and may be removed in later " + "versions. Use IRMA.createUnsignedIssuanceJWT instead.");
    return createUnsignedIssuanceJWT(iprequest);
}

function createUnsignedIssuanceJWT(iprequest) {
    return createJWT(iprequest, "iprequest", "issue_request", "testip");
}

function createUnsignedVerificationJWT(sprequest) {
    return createJWT(sprequest, "sprequest", "verification_request", "testsp");
}

function createUnsignedSignatureJWT(absrequest) {
    return createJWT(absrequest, "absrequest", "signature_request", "testsigclient");
}

function init(irmaapiserver, options) {
    if (!options) {
        options = DefaultOptions;
    } else {
        Object.keys(DefaultOptions).forEach(function (k) {
            if (!options[k]) {
                options[k] = DefaultOptions[k];
            }
        });
    }

    loglevel = options.loglevel;
    if (librarySetup) {
        log(Loglevel.Warn, "double call to init.");
        return;
    }

    if (irmaapiserver === undefined) {
        log(Loglevel.Warn, "Fetching api server from meta tags is deprecated, and may be removed in future versions.");
        getSetupFromMetas();
    } else {
        apiServer = irmaapiserver;
    }

    detectUserAgent();
    setLang(options.lang);
    apiServerNew = options.newServer;
    librarySetup = true;
}

function checkInit() {
    if (!librarySetup) {
        log(Loglevel.Warn, "No previous call to init, fetching api and web server from meta tags");
        init();
    }
}

exports.init = init;
exports.kjua = kjua;
exports.setLang = setLang;
exports.sign = sign;
exports.verify = verify;
exports.issue = issue;
exports.info = info;
exports.signFromQr = signFromQr;
exports.verifyFromQr = verifyFromQr;
exports.issueFromQr = issueFromQr;
exports.createUnsignedJWT = createUnsignedJWT;
exports.createUnsignedIssuanceJWT = createUnsignedIssuanceJWT;
exports.createUnsignedVerificationJWT = createUnsignedVerificationJWT;
exports.createUnsignedSignatureJWT = createUnsignedSignatureJWT;
exports.ErrorCodes = ErrorCodes;
exports.processInitialServerMessage = processInitialServerMessage;

},{"./languages/en.js":2,"./languages/nl.js":3,"bootstrap":4,"jwt-decode":18,"kjua":21}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    Common: {
        WaitData: "Waiting for data...",
        Cancel: "Cancel"
    },
    Messages: {
        FollowInstructions: "Please follow the instructions in your IRMA app"
    },
    Sign: {
        Title: "signing",
        Body: "A website requests that you sign a message using some IRMA attributes. Please scan the QR code with your IRMA app."
    },
    Verify: {
        Title: "showing attribute(s)",
        Body: "A website requests that you disclose some IRMA attributes. Please scan the QR code with your IRMA app."
    },
    Issue: {
        Title: "issuing attribute(s)",
        Body: "A website wants to issue some IRMA attributes to you. Please scan the QR code with your IRMA app."
    }
};

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    Common: {
        WaitData: "Wachten op data...",
        Cancel: "Annuleren"
    },
    Messages: {
        FollowInstructions: "Volg de instructies in uw IRMA app."
    },
    Sign: {
        Title: "ondertekenen",
        Body: "Een website vraagt u een bericht te ondertekenen met enkele IRMA attributen. Scan de QR code met uw IRMA app."
    },
    Verify: {
        Title: "attributen tonen",
        Body: "Een website vraagt u enkele IRMA attributen te tonen. Scan de QR code met uw IRMA app."
    },
    Issue: {
        Title: "attributen uitgeven",
        Body: "Een website wil u enkele IRMA attributen geven. Scan de QR code met uw IRMA app."
    }
};

},{}],4:[function(require,module,exports){
// This file is autogenerated via the `commonjs` Grunt task. You can require() this file in a CommonJS environment.
require('../../js/transition.js')
require('../../js/alert.js')
require('../../js/button.js')
require('../../js/carousel.js')
require('../../js/collapse.js')
require('../../js/dropdown.js')
require('../../js/modal.js')
require('../../js/tooltip.js')
require('../../js/popover.js')
require('../../js/scrollspy.js')
require('../../js/tab.js')
require('../../js/affix.js')
},{"../../js/affix.js":5,"../../js/alert.js":6,"../../js/button.js":7,"../../js/carousel.js":8,"../../js/collapse.js":9,"../../js/dropdown.js":10,"../../js/modal.js":11,"../../js/popover.js":12,"../../js/scrollspy.js":13,"../../js/tab.js":14,"../../js/tooltip.js":15,"../../js/transition.js":16}],5:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: affix.js v3.3.7
 * http://getbootstrap.com/javascript/#affix
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function (element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options)

    this.$target = $(this.options.target)
      .on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.bs.affix.data-api',  $.proxy(this.checkPositionWithEventLoop, this))

    this.$element     = $(element)
    this.affixed      = null
    this.unpin        = null
    this.pinnedOffset = null

    this.checkPosition()
  }

  Affix.VERSION  = '3.3.7'

  Affix.RESET    = 'affix affix-top affix-bottom'

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  }

  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {
    var scrollTop    = this.$target.scrollTop()
    var position     = this.$element.offset()
    var targetHeight = this.$target.height()

    if (offsetTop != null && this.affixed == 'top') return scrollTop < offsetTop ? 'top' : false

    if (this.affixed == 'bottom') {
      if (offsetTop != null) return (scrollTop + this.unpin <= position.top) ? false : 'bottom'
      return (scrollTop + targetHeight <= scrollHeight - offsetBottom) ? false : 'bottom'
    }

    var initializing   = this.affixed == null
    var colliderTop    = initializing ? scrollTop : position.top
    var colliderHeight = initializing ? targetHeight : height

    if (offsetTop != null && scrollTop <= offsetTop) return 'top'
    if (offsetBottom != null && (colliderTop + colliderHeight >= scrollHeight - offsetBottom)) return 'bottom'

    return false
  }

  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) return this.pinnedOffset
    this.$element.removeClass(Affix.RESET).addClass('affix')
    var scrollTop = this.$target.scrollTop()
    var position  = this.$element.offset()
    return (this.pinnedOffset = position.top - scrollTop)
  }

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1)
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var height       = this.$element.height()
    var offset       = this.options.offset
    var offsetTop    = offset.top
    var offsetBottom = offset.bottom
    var scrollHeight = Math.max($(document).height(), $(document.body).height())

    if (typeof offset != 'object')         offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function')    offsetTop    = offset.top(this.$element)
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)

    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom)

    if (this.affixed != affix) {
      if (this.unpin != null) this.$element.css('top', '')

      var affixType = 'affix' + (affix ? '-' + affix : '')
      var e         = $.Event(affixType + '.bs.affix')

      this.$element.trigger(e)

      if (e.isDefaultPrevented()) return

      this.affixed = affix
      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null

      this.$element
        .removeClass(Affix.RESET)
        .addClass(affixType)
        .trigger(affixType.replace('affix', 'affixed') + '.bs.affix')
    }

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - height - offsetBottom
      })
    }
  }


  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.affix')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.affix

  $.fn.affix             = Plugin
  $.fn.affix.Constructor = Affix


  // AFFIX NO CONFLICT
  // =================

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


  // AFFIX DATA-API
  // ==============

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
      var data = $spy.data()

      data.offset = data.offset || {}

      if (data.offsetBottom != null) data.offset.bottom = data.offsetBottom
      if (data.offsetTop    != null) data.offset.top    = data.offsetTop

      Plugin.call($spy, data)
    })
  })

}(jQuery);

},{}],6:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: alert.js v3.3.7
 * http://getbootstrap.com/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // ALERT CLASS DEFINITION
  // ======================

  var dismiss = '[data-dismiss="alert"]'
  var Alert   = function (el) {
    $(el).on('click', dismiss, this.close)
  }

  Alert.VERSION = '3.3.7'

  Alert.TRANSITION_DURATION = 150

  Alert.prototype.close = function (e) {
    var $this    = $(this)
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = $(selector === '#' ? [] : selector)

    if (e) e.preventDefault()

    if (!$parent.length) {
      $parent = $this.closest('.alert')
    }

    $parent.trigger(e = $.Event('close.bs.alert'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      // detach from parent, fire event then clean up data
      $parent.detach().trigger('closed.bs.alert').remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent
        .one('bsTransitionEnd', removeElement)
        .emulateTransitionEnd(Alert.TRANSITION_DURATION) :
      removeElement()
  }


  // ALERT PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.alert')

      if (!data) $this.data('bs.alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.alert

  $.fn.alert             = Plugin
  $.fn.alert.Constructor = Alert


  // ALERT NO CONFLICT
  // =================

  $.fn.alert.noConflict = function () {
    $.fn.alert = old
    return this
  }


  // ALERT DATA-API
  // ==============

  $(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close)

}(jQuery);

},{}],7:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: button.js v3.3.7
 * http://getbootstrap.com/javascript/#buttons
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = function (element, options) {
    this.$element  = $(element)
    this.options   = $.extend({}, Button.DEFAULTS, options)
    this.isLoading = false
  }

  Button.VERSION  = '3.3.7'

  Button.DEFAULTS = {
    loadingText: 'loading...'
  }

  Button.prototype.setState = function (state) {
    var d    = 'disabled'
    var $el  = this.$element
    var val  = $el.is('input') ? 'val' : 'html'
    var data = $el.data()

    state += 'Text'

    if (data.resetText == null) $el.data('resetText', $el[val]())

    // push to event loop to allow forms to submit
    setTimeout($.proxy(function () {
      $el[val](data[state] == null ? this.options[state] : data[state])

      if (state == 'loadingText') {
        this.isLoading = true
        $el.addClass(d).attr(d, d).prop(d, true)
      } else if (this.isLoading) {
        this.isLoading = false
        $el.removeClass(d).removeAttr(d).prop(d, false)
      }
    }, this), 0)
  }

  Button.prototype.toggle = function () {
    var changed = true
    var $parent = this.$element.closest('[data-toggle="buttons"]')

    if ($parent.length) {
      var $input = this.$element.find('input')
      if ($input.prop('type') == 'radio') {
        if ($input.prop('checked')) changed = false
        $parent.find('.active').removeClass('active')
        this.$element.addClass('active')
      } else if ($input.prop('type') == 'checkbox') {
        if (($input.prop('checked')) !== this.$element.hasClass('active')) changed = false
        this.$element.toggleClass('active')
      }
      $input.prop('checked', this.$element.hasClass('active'))
      if (changed) $input.trigger('change')
    } else {
      this.$element.attr('aria-pressed', !this.$element.hasClass('active'))
      this.$element.toggleClass('active')
    }
  }


  // BUTTON PLUGIN DEFINITION
  // ========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.button')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.button', (data = new Button(this, options)))

      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  var old = $.fn.button

  $.fn.button             = Plugin
  $.fn.button.Constructor = Button


  // BUTTON NO CONFLICT
  // ==================

  $.fn.button.noConflict = function () {
    $.fn.button = old
    return this
  }


  // BUTTON DATA-API
  // ===============

  $(document)
    .on('click.bs.button.data-api', '[data-toggle^="button"]', function (e) {
      var $btn = $(e.target).closest('.btn')
      Plugin.call($btn, 'toggle')
      if (!($(e.target).is('input[type="radio"], input[type="checkbox"]'))) {
        // Prevent double click on radios, and the double selections (so cancellation) on checkboxes
        e.preventDefault()
        // The target component still receive the focus
        if ($btn.is('input,button')) $btn.trigger('focus')
        else $btn.find('input:visible,button:visible').first().trigger('focus')
      }
    })
    .on('focus.bs.button.data-api blur.bs.button.data-api', '[data-toggle^="button"]', function (e) {
      $(e.target).closest('.btn').toggleClass('focus', /^focus(in)?$/.test(e.type))
    })

}(jQuery);

},{}],8:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: carousel.js v3.3.7
 * http://getbootstrap.com/javascript/#carousel
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // CAROUSEL CLASS DEFINITION
  // =========================

  var Carousel = function (element, options) {
    this.$element    = $(element)
    this.$indicators = this.$element.find('.carousel-indicators')
    this.options     = options
    this.paused      = null
    this.sliding     = null
    this.interval    = null
    this.$active     = null
    this.$items      = null

    this.options.keyboard && this.$element.on('keydown.bs.carousel', $.proxy(this.keydown, this))

    this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element
      .on('mouseenter.bs.carousel', $.proxy(this.pause, this))
      .on('mouseleave.bs.carousel', $.proxy(this.cycle, this))
  }

  Carousel.VERSION  = '3.3.7'

  Carousel.TRANSITION_DURATION = 600

  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true,
    keyboard: true
  }

  Carousel.prototype.keydown = function (e) {
    if (/input|textarea/i.test(e.target.tagName)) return
    switch (e.which) {
      case 37: this.prev(); break
      case 39: this.next(); break
      default: return
    }

    e.preventDefault()
  }

  Carousel.prototype.cycle = function (e) {
    e || (this.paused = false)

    this.interval && clearInterval(this.interval)

    this.options.interval
      && !this.paused
      && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))

    return this
  }

  Carousel.prototype.getItemIndex = function (item) {
    this.$items = item.parent().children('.item')
    return this.$items.index(item || this.$active)
  }

  Carousel.prototype.getItemForDirection = function (direction, active) {
    var activeIndex = this.getItemIndex(active)
    var willWrap = (direction == 'prev' && activeIndex === 0)
                || (direction == 'next' && activeIndex == (this.$items.length - 1))
    if (willWrap && !this.options.wrap) return active
    var delta = direction == 'prev' ? -1 : 1
    var itemIndex = (activeIndex + delta) % this.$items.length
    return this.$items.eq(itemIndex)
  }

  Carousel.prototype.to = function (pos) {
    var that        = this
    var activeIndex = this.getItemIndex(this.$active = this.$element.find('.item.active'))

    if (pos > (this.$items.length - 1) || pos < 0) return

    if (this.sliding)       return this.$element.one('slid.bs.carousel', function () { that.to(pos) }) // yes, "slid"
    if (activeIndex == pos) return this.pause().cycle()

    return this.slide(pos > activeIndex ? 'next' : 'prev', this.$items.eq(pos))
  }

  Carousel.prototype.pause = function (e) {
    e || (this.paused = true)

    if (this.$element.find('.next, .prev').length && $.support.transition) {
      this.$element.trigger($.support.transition.end)
      this.cycle(true)
    }

    this.interval = clearInterval(this.interval)

    return this
  }

  Carousel.prototype.next = function () {
    if (this.sliding) return
    return this.slide('next')
  }

  Carousel.prototype.prev = function () {
    if (this.sliding) return
    return this.slide('prev')
  }

  Carousel.prototype.slide = function (type, next) {
    var $active   = this.$element.find('.item.active')
    var $next     = next || this.getItemForDirection(type, $active)
    var isCycling = this.interval
    var direction = type == 'next' ? 'left' : 'right'
    var that      = this

    if ($next.hasClass('active')) return (this.sliding = false)

    var relatedTarget = $next[0]
    var slideEvent = $.Event('slide.bs.carousel', {
      relatedTarget: relatedTarget,
      direction: direction
    })
    this.$element.trigger(slideEvent)
    if (slideEvent.isDefaultPrevented()) return

    this.sliding = true

    isCycling && this.pause()

    if (this.$indicators.length) {
      this.$indicators.find('.active').removeClass('active')
      var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)])
      $nextIndicator && $nextIndicator.addClass('active')
    }

    var slidEvent = $.Event('slid.bs.carousel', { relatedTarget: relatedTarget, direction: direction }) // yes, "slid"
    if ($.support.transition && this.$element.hasClass('slide')) {
      $next.addClass(type)
      $next[0].offsetWidth // force reflow
      $active.addClass(direction)
      $next.addClass(direction)
      $active
        .one('bsTransitionEnd', function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () {
            that.$element.trigger(slidEvent)
          }, 0)
        })
        .emulateTransitionEnd(Carousel.TRANSITION_DURATION)
    } else {
      $active.removeClass('active')
      $next.addClass('active')
      this.sliding = false
      this.$element.trigger(slidEvent)
    }

    isCycling && this.cycle()

    return this
  }


  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.carousel')
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option)
      var action  = typeof option == 'string' ? option : options.slide

      if (!data) $this.data('bs.carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) data[action]()
      else if (options.interval) data.pause().cycle()
    })
  }

  var old = $.fn.carousel

  $.fn.carousel             = Plugin
  $.fn.carousel.Constructor = Carousel


  // CAROUSEL NO CONFLICT
  // ====================

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old
    return this
  }


  // CAROUSEL DATA-API
  // =================

  var clickHandler = function (e) {
    var href
    var $this   = $(this)
    var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) // strip for ie7
    if (!$target.hasClass('carousel')) return
    var options = $.extend({}, $target.data(), $this.data())
    var slideIndex = $this.attr('data-slide-to')
    if (slideIndex) options.interval = false

    Plugin.call($target, options)

    if (slideIndex) {
      $target.data('bs.carousel').to(slideIndex)
    }

    e.preventDefault()
  }

  $(document)
    .on('click.bs.carousel.data-api', '[data-slide]', clickHandler)
    .on('click.bs.carousel.data-api', '[data-slide-to]', clickHandler)

  $(window).on('load', function () {
    $('[data-ride="carousel"]').each(function () {
      var $carousel = $(this)
      Plugin.call($carousel, $carousel.data())
    })
  })

}(jQuery);

},{}],9:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: collapse.js v3.3.7
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

/* jshint latedef: false */

+function ($) {
  'use strict';

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  var Collapse = function (element, options) {
    this.$element      = $(element)
    this.options       = $.extend({}, Collapse.DEFAULTS, options)
    this.$trigger      = $('[data-toggle="collapse"][href="#' + element.id + '"],' +
                           '[data-toggle="collapse"][data-target="#' + element.id + '"]')
    this.transitioning = null

    if (this.options.parent) {
      this.$parent = this.getParent()
    } else {
      this.addAriaAndCollapsedClass(this.$element, this.$trigger)
    }

    if (this.options.toggle) this.toggle()
  }

  Collapse.VERSION  = '3.3.7'

  Collapse.TRANSITION_DURATION = 350

  Collapse.DEFAULTS = {
    toggle: true
  }

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('width')
    return hasWidth ? 'width' : 'height'
  }

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in')) return

    var activesData
    var actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing')

    if (actives && actives.length) {
      activesData = actives.data('bs.collapse')
      if (activesData && activesData.transitioning) return
    }

    var startEvent = $.Event('show.bs.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    if (actives && actives.length) {
      Plugin.call(actives, 'hide')
      activesData || actives.data('bs.collapse', null)
    }

    var dimension = this.dimension()

    this.$element
      .removeClass('collapse')
      .addClass('collapsing')[dimension](0)
      .attr('aria-expanded', true)

    this.$trigger
      .removeClass('collapsed')
      .attr('aria-expanded', true)

    this.transitioning = 1

    var complete = function () {
      this.$element
        .removeClass('collapsing')
        .addClass('collapse in')[dimension]('')
      this.transitioning = 0
      this.$element
        .trigger('shown.bs.collapse')
    }

    if (!$.support.transition) return complete.call(this)

    var scrollSize = $.camelCase(['scroll', dimension].join('-'))

    this.$element
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize])
  }

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in')) return

    var startEvent = $.Event('hide.bs.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    var dimension = this.dimension()

    this.$element[dimension](this.$element[dimension]())[0].offsetHeight

    this.$element
      .addClass('collapsing')
      .removeClass('collapse in')
      .attr('aria-expanded', false)

    this.$trigger
      .addClass('collapsed')
      .attr('aria-expanded', false)

    this.transitioning = 1

    var complete = function () {
      this.transitioning = 0
      this.$element
        .removeClass('collapsing')
        .addClass('collapse')
        .trigger('hidden.bs.collapse')
    }

    if (!$.support.transition) return complete.call(this)

    this.$element
      [dimension](0)
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION)
  }

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']()
  }

  Collapse.prototype.getParent = function () {
    return $(this.options.parent)
      .find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]')
      .each($.proxy(function (i, element) {
        var $element = $(element)
        this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element)
      }, this))
      .end()
  }

  Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) {
    var isOpen = $element.hasClass('in')

    $element.attr('aria-expanded', isOpen)
    $trigger
      .toggleClass('collapsed', !isOpen)
      .attr('aria-expanded', isOpen)
  }

  function getTargetFromTrigger($trigger) {
    var href
    var target = $trigger.attr('data-target')
      || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') // strip for ie7

    return $(target)
  }


  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.collapse')
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data && options.toggle && /show|hide/.test(option)) options.toggle = false
      if (!data) $this.data('bs.collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.collapse

  $.fn.collapse             = Plugin
  $.fn.collapse.Constructor = Collapse


  // COLLAPSE NO CONFLICT
  // ====================

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old
    return this
  }


  // COLLAPSE DATA-API
  // =================

  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var $this   = $(this)

    if (!$this.attr('data-target')) e.preventDefault()

    var $target = getTargetFromTrigger($this)
    var data    = $target.data('bs.collapse')
    var option  = data ? 'toggle' : $this.data()

    Plugin.call($target, option)
  })

}(jQuery);

},{}],10:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: dropdown.js v3.3.7
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop'
  var toggle   = '[data-toggle="dropdown"]'
  var Dropdown = function (element) {
    $(element).on('click.bs.dropdown', this.toggle)
  }

  Dropdown.VERSION = '3.3.7'

  function getParent($this) {
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = selector && $(selector)

    return $parent && $parent.length ? $parent : $this.parent()
  }

  function clearMenus(e) {
    if (e && e.which === 3) return
    $(backdrop).remove()
    $(toggle).each(function () {
      var $this         = $(this)
      var $parent       = getParent($this)
      var relatedTarget = { relatedTarget: this }

      if (!$parent.hasClass('open')) return

      if (e && e.type == 'click' && /input|textarea/i.test(e.target.tagName) && $.contains($parent[0], e.target)) return

      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this.attr('aria-expanded', 'false')
      $parent.removeClass('open').trigger($.Event('hidden.bs.dropdown', relatedTarget))
    })
  }

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this)

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    clearMenus()

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $(document.createElement('div'))
          .addClass('dropdown-backdrop')
          .insertAfter($(this))
          .on('click', clearMenus)
      }

      var relatedTarget = { relatedTarget: this }
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this
        .trigger('focus')
        .attr('aria-expanded', 'true')

      $parent
        .toggleClass('open')
        .trigger($.Event('shown.bs.dropdown', relatedTarget))
    }

    return false
  }

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return

    var $this = $(this)

    e.preventDefault()
    e.stopPropagation()

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    if (!isActive && e.which != 27 || isActive && e.which == 27) {
      if (e.which == 27) $parent.find(toggle).trigger('focus')
      return $this.trigger('click')
    }

    var desc = ' li:not(.disabled):visible a'
    var $items = $parent.find('.dropdown-menu' + desc)

    if (!$items.length) return

    var index = $items.index(e.target)

    if (e.which == 38 && index > 0)                 index--         // up
    if (e.which == 40 && index < $items.length - 1) index++         // down
    if (!~index)                                    index = 0

    $items.eq(index).trigger('focus')
  }


  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.dropdown')

      if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.dropdown

  $.fn.dropdown             = Plugin
  $.fn.dropdown.Constructor = Dropdown


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    .on('keydown.bs.dropdown.data-api', toggle, Dropdown.prototype.keydown)
    .on('keydown.bs.dropdown.data-api', '.dropdown-menu', Dropdown.prototype.keydown)

}(jQuery);

},{}],11:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: modal.js v3.3.7
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function (element, options) {
    this.options             = options
    this.$body               = $(document.body)
    this.$element            = $(element)
    this.$dialog             = this.$element.find('.modal-dialog')
    this.$backdrop           = null
    this.isShown             = null
    this.originalBodyPad     = null
    this.scrollbarWidth      = 0
    this.ignoreBackdropClick = false

    if (this.options.remote) {
      this.$element
        .find('.modal-content')
        .load(this.options.remote, $.proxy(function () {
          this.$element.trigger('loaded.bs.modal')
        }, this))
    }
  }

  Modal.VERSION  = '3.3.7'

  Modal.TRANSITION_DURATION = 300
  Modal.BACKDROP_TRANSITION_DURATION = 150

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  }

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget)
  }

  Modal.prototype.show = function (_relatedTarget) {
    var that = this
    var e    = $.Event('show.bs.modal', { relatedTarget: _relatedTarget })

    this.$element.trigger(e)

    if (this.isShown || e.isDefaultPrevented()) return

    this.isShown = true

    this.checkScrollbar()
    this.setScrollbar()
    this.$body.addClass('modal-open')

    this.escape()
    this.resize()

    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this))

    this.$dialog.on('mousedown.dismiss.bs.modal', function () {
      that.$element.one('mouseup.dismiss.bs.modal', function (e) {
        if ($(e.target).is(that.$element)) that.ignoreBackdropClick = true
      })
    })

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade')

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body) // don't move modals dom position
      }

      that.$element
        .show()
        .scrollTop(0)

      that.adjustDialog()

      if (transition) {
        that.$element[0].offsetWidth // force reflow
      }

      that.$element.addClass('in')

      that.enforceFocus()

      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget })

      transition ?
        that.$dialog // wait for modal to slide in
          .one('bsTransitionEnd', function () {
            that.$element.trigger('focus').trigger(e)
          })
          .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
        that.$element.trigger('focus').trigger(e)
    })
  }

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault()

    e = $.Event('hide.bs.modal')

    this.$element.trigger(e)

    if (!this.isShown || e.isDefaultPrevented()) return

    this.isShown = false

    this.escape()
    this.resize()

    $(document).off('focusin.bs.modal')

    this.$element
      .removeClass('in')
      .off('click.dismiss.bs.modal')
      .off('mouseup.dismiss.bs.modal')

    this.$dialog.off('mousedown.dismiss.bs.modal')

    $.support.transition && this.$element.hasClass('fade') ?
      this.$element
        .one('bsTransitionEnd', $.proxy(this.hideModal, this))
        .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
      this.hideModal()
  }

  Modal.prototype.enforceFocus = function () {
    $(document)
      .off('focusin.bs.modal') // guard against infinite focus loop
      .on('focusin.bs.modal', $.proxy(function (e) {
        if (document !== e.target &&
            this.$element[0] !== e.target &&
            !this.$element.has(e.target).length) {
          this.$element.trigger('focus')
        }
      }, this))
  }

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide()
      }, this))
    } else if (!this.isShown) {
      this.$element.off('keydown.dismiss.bs.modal')
    }
  }

  Modal.prototype.resize = function () {
    if (this.isShown) {
      $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this))
    } else {
      $(window).off('resize.bs.modal')
    }
  }

  Modal.prototype.hideModal = function () {
    var that = this
    this.$element.hide()
    this.backdrop(function () {
      that.$body.removeClass('modal-open')
      that.resetAdjustments()
      that.resetScrollbar()
      that.$element.trigger('hidden.bs.modal')
    })
  }

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  Modal.prototype.backdrop = function (callback) {
    var that = this
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $(document.createElement('div'))
        .addClass('modal-backdrop ' + animate)
        .appendTo(this.$body)

      this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (this.ignoreBackdropClick) {
          this.ignoreBackdropClick = false
          return
        }
        if (e.target !== e.currentTarget) return
        this.options.backdrop == 'static'
          ? this.$element[0].focus()
          : this.hide()
      }, this))

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      if (!callback) return

      doAnimate ?
        this.$backdrop
          .one('bsTransitionEnd', callback)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      var callbackRemove = function () {
        that.removeBackdrop()
        callback && callback()
      }
      $.support.transition && this.$element.hasClass('fade') ?
        this.$backdrop
          .one('bsTransitionEnd', callbackRemove)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callbackRemove()

    } else if (callback) {
      callback()
    }
  }

  // these following methods are used to handle overflowing modals

  Modal.prototype.handleUpdate = function () {
    this.adjustDialog()
  }

  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight

    this.$element.css({
      paddingLeft:  !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
      paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
    })
  }

  Modal.prototype.resetAdjustments = function () {
    this.$element.css({
      paddingLeft: '',
      paddingRight: ''
    })
  }

  Modal.prototype.checkScrollbar = function () {
    var fullWindowWidth = window.innerWidth
    if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
      var documentElementRect = document.documentElement.getBoundingClientRect()
      fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left)
    }
    this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth
    this.scrollbarWidth = this.measureScrollbar()
  }

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
    this.originalBodyPad = document.body.style.paddingRight || ''
    if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
  }

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', this.originalBodyPad)
  }

  Modal.prototype.measureScrollbar = function () { // thx walsh
    var scrollDiv = document.createElement('div')
    scrollDiv.className = 'modal-scrollbar-measure'
    this.$body.append(scrollDiv)
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
    this.$body[0].removeChild(scrollDiv)
    return scrollbarWidth
  }


  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.modal')
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data) $this.data('bs.modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option](_relatedTarget)
      else if (options.show) data.show(_relatedTarget)
    })
  }

  var old = $.fn.modal

  $.fn.modal             = Plugin
  $.fn.modal.Constructor = Modal


  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


  // MODAL DATA-API
  // ==============

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this   = $(this)
    var href    = $this.attr('href')
    var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) // strip for ie7
    var option  = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

    if ($this.is('a')) e.preventDefault()

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus')
      })
    })
    Plugin.call($target, option, this)
  })

}(jQuery);

},{}],12:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: popover.js v3.3.7
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }

  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js')

  Popover.VERSION  = '3.3.7'

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype)

  Popover.prototype.constructor = Popover

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS
  }

  Popover.prototype.setContent = function () {
    var $tip    = this.tip()
    var title   = this.getTitle()
    var content = this.getContent()

    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
    $tip.find('.popover-content').children().detach().end()[ // we use append for html objects to maintain js events
      this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
    ](content)

    $tip.removeClass('fade top bottom left right in')

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()
  }

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent()
  }

  Popover.prototype.getContent = function () {
    var $e = this.$element
    var o  = this.options

    return $e.attr('data-content')
      || (typeof o.content == 'function' ?
            o.content.call($e[0]) :
            o.content)
  }

  Popover.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.arrow'))
  }


  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.popover')
      var options = typeof option == 'object' && option

      if (!data && /destroy|hide/.test(option)) return
      if (!data) $this.data('bs.popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.popover

  $.fn.popover             = Plugin
  $.fn.popover.Constructor = Popover


  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(jQuery);

},{}],13:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: scrollspy.js v3.3.7
 * http://getbootstrap.com/javascript/#scrollspy
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  function ScrollSpy(element, options) {
    this.$body          = $(document.body)
    this.$scrollElement = $(element).is(document.body) ? $(window) : $(element)
    this.options        = $.extend({}, ScrollSpy.DEFAULTS, options)
    this.selector       = (this.options.target || '') + ' .nav li > a'
    this.offsets        = []
    this.targets        = []
    this.activeTarget   = null
    this.scrollHeight   = 0

    this.$scrollElement.on('scroll.bs.scrollspy', $.proxy(this.process, this))
    this.refresh()
    this.process()
  }

  ScrollSpy.VERSION  = '3.3.7'

  ScrollSpy.DEFAULTS = {
    offset: 10
  }

  ScrollSpy.prototype.getScrollHeight = function () {
    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight)
  }

  ScrollSpy.prototype.refresh = function () {
    var that          = this
    var offsetMethod  = 'offset'
    var offsetBase    = 0

    this.offsets      = []
    this.targets      = []
    this.scrollHeight = this.getScrollHeight()

    if (!$.isWindow(this.$scrollElement[0])) {
      offsetMethod = 'position'
      offsetBase   = this.$scrollElement.scrollTop()
    }

    this.$body
      .find(this.selector)
      .map(function () {
        var $el   = $(this)
        var href  = $el.data('target') || $el.attr('href')
        var $href = /^#./.test(href) && $(href)

        return ($href
          && $href.length
          && $href.is(':visible')
          && [[$href[offsetMethod]().top + offsetBase, href]]) || null
      })
      .sort(function (a, b) { return a[0] - b[0] })
      .each(function () {
        that.offsets.push(this[0])
        that.targets.push(this[1])
      })
  }

  ScrollSpy.prototype.process = function () {
    var scrollTop    = this.$scrollElement.scrollTop() + this.options.offset
    var scrollHeight = this.getScrollHeight()
    var maxScroll    = this.options.offset + scrollHeight - this.$scrollElement.height()
    var offsets      = this.offsets
    var targets      = this.targets
    var activeTarget = this.activeTarget
    var i

    if (this.scrollHeight != scrollHeight) {
      this.refresh()
    }

    if (scrollTop >= maxScroll) {
      return activeTarget != (i = targets[targets.length - 1]) && this.activate(i)
    }

    if (activeTarget && scrollTop < offsets[0]) {
      this.activeTarget = null
      return this.clear()
    }

    for (i = offsets.length; i--;) {
      activeTarget != targets[i]
        && scrollTop >= offsets[i]
        && (offsets[i + 1] === undefined || scrollTop < offsets[i + 1])
        && this.activate(targets[i])
    }
  }

  ScrollSpy.prototype.activate = function (target) {
    this.activeTarget = target

    this.clear()

    var selector = this.selector +
      '[data-target="' + target + '"],' +
      this.selector + '[href="' + target + '"]'

    var active = $(selector)
      .parents('li')
      .addClass('active')

    if (active.parent('.dropdown-menu').length) {
      active = active
        .closest('li.dropdown')
        .addClass('active')
    }

    active.trigger('activate.bs.scrollspy')
  }

  ScrollSpy.prototype.clear = function () {
    $(this.selector)
      .parentsUntil(this.options.target, '.active')
      .removeClass('active')
  }


  // SCROLLSPY PLUGIN DEFINITION
  // ===========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.scrollspy')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.scrollspy

  $.fn.scrollspy             = Plugin
  $.fn.scrollspy.Constructor = ScrollSpy


  // SCROLLSPY NO CONFLICT
  // =====================

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old
    return this
  }


  // SCROLLSPY DATA-API
  // ==================

  $(window).on('load.bs.scrollspy.data-api', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      Plugin.call($spy, $spy.data())
    })
  })

}(jQuery);

},{}],14:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: tab.js v3.3.7
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TAB CLASS DEFINITION
  // ====================

  var Tab = function (element) {
    // jscs:disable requireDollarBeforejQueryAssignment
    this.element = $(element)
    // jscs:enable requireDollarBeforejQueryAssignment
  }

  Tab.VERSION = '3.3.7'

  Tab.TRANSITION_DURATION = 150

  Tab.prototype.show = function () {
    var $this    = this.element
    var $ul      = $this.closest('ul:not(.dropdown-menu)')
    var selector = $this.data('target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    if ($this.parent('li').hasClass('active')) return

    var $previous = $ul.find('.active:last a')
    var hideEvent = $.Event('hide.bs.tab', {
      relatedTarget: $this[0]
    })
    var showEvent = $.Event('show.bs.tab', {
      relatedTarget: $previous[0]
    })

    $previous.trigger(hideEvent)
    $this.trigger(showEvent)

    if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) return

    var $target = $(selector)

    this.activate($this.closest('li'), $ul)
    this.activate($target, $target.parent(), function () {
      $previous.trigger({
        type: 'hidden.bs.tab',
        relatedTarget: $this[0]
      })
      $this.trigger({
        type: 'shown.bs.tab',
        relatedTarget: $previous[0]
      })
    })
  }

  Tab.prototype.activate = function (element, container, callback) {
    var $active    = container.find('> .active')
    var transition = callback
      && $.support.transition
      && ($active.length && $active.hasClass('fade') || !!container.find('> .fade').length)

    function next() {
      $active
        .removeClass('active')
        .find('> .dropdown-menu > .active')
          .removeClass('active')
        .end()
        .find('[data-toggle="tab"]')
          .attr('aria-expanded', false)

      element
        .addClass('active')
        .find('[data-toggle="tab"]')
          .attr('aria-expanded', true)

      if (transition) {
        element[0].offsetWidth // reflow for transition
        element.addClass('in')
      } else {
        element.removeClass('fade')
      }

      if (element.parent('.dropdown-menu').length) {
        element
          .closest('li.dropdown')
            .addClass('active')
          .end()
          .find('[data-toggle="tab"]')
            .attr('aria-expanded', true)
      }

      callback && callback()
    }

    $active.length && transition ?
      $active
        .one('bsTransitionEnd', next)
        .emulateTransitionEnd(Tab.TRANSITION_DURATION) :
      next()

    $active.removeClass('in')
  }


  // TAB PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.tab')

      if (!data) $this.data('bs.tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tab

  $.fn.tab             = Plugin
  $.fn.tab.Constructor = Tab


  // TAB NO CONFLICT
  // ===============

  $.fn.tab.noConflict = function () {
    $.fn.tab = old
    return this
  }


  // TAB DATA-API
  // ============

  var clickHandler = function (e) {
    e.preventDefault()
    Plugin.call($(this), 'show')
  }

  $(document)
    .on('click.bs.tab.data-api', '[data-toggle="tab"]', clickHandler)
    .on('click.bs.tab.data-api', '[data-toggle="pill"]', clickHandler)

}(jQuery);

},{}],15:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: tooltip.js v3.3.7
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function (element, options) {
    this.type       = null
    this.options    = null
    this.enabled    = null
    this.timeout    = null
    this.hoverState = null
    this.$element   = null
    this.inState    = null

    this.init('tooltip', element, options)
  }

  Tooltip.VERSION  = '3.3.7'

  Tooltip.TRANSITION_DURATION = 150

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  }

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled   = true
    this.type      = type
    this.$element  = $(element)
    this.options   = this.getOptions(options)
    this.$viewport = this.options.viewport && $($.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : (this.options.viewport.selector || this.options.viewport))
    this.inState   = { click: false, hover: false, focus: false }

    if (this.$element[0] instanceof document.constructor && !this.options.selector) {
      throw new Error('`selector` option must be specified when initializing ' + this.type + ' on the window.document object!')
    }

    var triggers = this.options.trigger.split(' ')

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i]

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
      } else if (trigger != 'manual') {
        var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin'
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'

        this.$element.on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
      }
    }

    this.options.selector ?
      (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
      this.fixTitle()
  }

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS
  }

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      }
    }

    return options
  }

  Tooltip.prototype.getDelegateOptions = function () {
    var options  = {}
    var defaults = this.getDefaults()

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value
    })

    return options
  }

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusin' ? 'focus' : 'hover'] = true
    }

    if (self.tip().hasClass('in') || self.hoverState == 'in') {
      self.hoverState = 'in'
      return
    }

    clearTimeout(self.timeout)

    self.hoverState = 'in'

    if (!self.options.delay || !self.options.delay.show) return self.show()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show()
    }, self.options.delay.show)
  }

  Tooltip.prototype.isInStateTrue = function () {
    for (var key in this.inState) {
      if (this.inState[key]) return true
    }

    return false
  }

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusout' ? 'focus' : 'hover'] = false
    }

    if (self.isInStateTrue()) return

    clearTimeout(self.timeout)

    self.hoverState = 'out'

    if (!self.options.delay || !self.options.delay.hide) return self.hide()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide()
    }, self.options.delay.hide)
  }

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type)

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e)

      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0])
      if (e.isDefaultPrevented() || !inDom) return
      var that = this

      var $tip = this.tip()

      var tipId = this.getUID(this.type)

      this.setContent()
      $tip.attr('id', tipId)
      this.$element.attr('aria-describedby', tipId)

      if (this.options.animation) $tip.addClass('fade')

      var placement = typeof this.options.placement == 'function' ?
        this.options.placement.call(this, $tip[0], this.$element[0]) :
        this.options.placement

      var autoToken = /\s?auto?\s?/i
      var autoPlace = autoToken.test(placement)
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

      $tip
        .detach()
        .css({ top: 0, left: 0, display: 'block' })
        .addClass(placement)
        .data('bs.' + this.type, this)

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)
      this.$element.trigger('inserted.bs.' + this.type)

      var pos          = this.getPosition()
      var actualWidth  = $tip[0].offsetWidth
      var actualHeight = $tip[0].offsetHeight

      if (autoPlace) {
        var orgPlacement = placement
        var viewportDim = this.getPosition(this.$viewport)

        placement = placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ? 'top'    :
                    placement == 'top'    && pos.top    - actualHeight < viewportDim.top    ? 'bottom' :
                    placement == 'right'  && pos.right  + actualWidth  > viewportDim.width  ? 'left'   :
                    placement == 'left'   && pos.left   - actualWidth  < viewportDim.left   ? 'right'  :
                    placement

        $tip
          .removeClass(orgPlacement)
          .addClass(placement)
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

      this.applyPlacement(calculatedOffset, placement)

      var complete = function () {
        var prevHoverState = that.hoverState
        that.$element.trigger('shown.bs.' + that.type)
        that.hoverState = null

        if (prevHoverState == 'out') that.leave(that)
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        $tip
          .one('bsTransitionEnd', complete)
          .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
        complete()
    }
  }

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip   = this.tip()
    var width  = $tip[0].offsetWidth
    var height = $tip[0].offsetHeight

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10)
    var marginLeft = parseInt($tip.css('margin-left'), 10)

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  marginTop  = 0
    if (isNaN(marginLeft)) marginLeft = 0

    offset.top  += marginTop
    offset.left += marginLeft

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function (props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        })
      }
    }, offset), 0)

    $tip.addClass('in')

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth
    var actualHeight = $tip[0].offsetHeight

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)

    if (delta.left) offset.left += delta.left
    else offset.top += delta.top

    var isVertical          = /top|bottom/.test(placement)
    var arrowDelta          = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight'

    $tip.offset(offset)
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical)
  }

  Tooltip.prototype.replaceArrow = function (delta, dimension, isVertical) {
    this.arrow()
      .css(isVertical ? 'left' : 'top', 50 * (1 - delta / dimension) + '%')
      .css(isVertical ? 'top' : 'left', '')
  }

  Tooltip.prototype.setContent = function () {
    var $tip  = this.tip()
    var title = this.getTitle()

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
    $tip.removeClass('fade in top bottom left right')
  }

  Tooltip.prototype.hide = function (callback) {
    var that = this
    var $tip = $(this.$tip)
    var e    = $.Event('hide.bs.' + this.type)

    function complete() {
      if (that.hoverState != 'in') $tip.detach()
      if (that.$element) { // TODO: Check whether guarding this code with this `if` is really necessary.
        that.$element
          .removeAttr('aria-describedby')
          .trigger('hidden.bs.' + that.type)
      }
      callback && callback()
    }

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    $tip.removeClass('in')

    $.support.transition && $tip.hasClass('fade') ?
      $tip
        .one('bsTransitionEnd', complete)
        .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
      complete()

    this.hoverState = null

    return this
  }

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element
    if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
    }
  }

  Tooltip.prototype.hasContent = function () {
    return this.getTitle()
  }

  Tooltip.prototype.getPosition = function ($element) {
    $element   = $element || this.$element

    var el     = $element[0]
    var isBody = el.tagName == 'BODY'

    var elRect    = el.getBoundingClientRect()
    if (elRect.width == null) {
      // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
      elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top })
    }
    var isSvg = window.SVGElement && el instanceof window.SVGElement
    // Avoid using $.offset() on SVGs since it gives incorrect results in jQuery 3.
    // See https://github.com/twbs/bootstrap/issues/20280
    var elOffset  = isBody ? { top: 0, left: 0 } : (isSvg ? null : $element.offset())
    var scroll    = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() }
    var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null

    return $.extend({}, elRect, scroll, outerDims, elOffset)
  }

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2 } :
           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } :
           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
        /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }

  }

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 }
    if (!this.$viewport) return delta

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0
    var viewportDimensions = this.getPosition(this.$viewport)

    if (/right|left/.test(placement)) {
      var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight
      if (topEdgeOffset < viewportDimensions.top) { // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
      }
    } else {
      var leftEdgeOffset  = pos.left - viewportPadding
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth
      if (leftEdgeOffset < viewportDimensions.left) { // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset
      } else if (rightEdgeOffset > viewportDimensions.right) { // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
      }
    }

    return delta
  }

  Tooltip.prototype.getTitle = function () {
    var title
    var $e = this.$element
    var o  = this.options

    title = $e.attr('data-original-title')
      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

    return title
  }

  Tooltip.prototype.getUID = function (prefix) {
    do prefix += ~~(Math.random() * 1000000)
    while (document.getElementById(prefix))
    return prefix
  }

  Tooltip.prototype.tip = function () {
    if (!this.$tip) {
      this.$tip = $(this.options.template)
      if (this.$tip.length != 1) {
        throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!')
      }
    }
    return this.$tip
  }

  Tooltip.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))
  }

  Tooltip.prototype.enable = function () {
    this.enabled = true
  }

  Tooltip.prototype.disable = function () {
    this.enabled = false
  }

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled
  }

  Tooltip.prototype.toggle = function (e) {
    var self = this
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type)
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions())
        $(e.currentTarget).data('bs.' + this.type, self)
      }
    }

    if (e) {
      self.inState.click = !self.inState.click
      if (self.isInStateTrue()) self.enter(self)
      else self.leave(self)
    } else {
      self.tip().hasClass('in') ? self.leave(self) : self.enter(self)
    }
  }

  Tooltip.prototype.destroy = function () {
    var that = this
    clearTimeout(this.timeout)
    this.hide(function () {
      that.$element.off('.' + that.type).removeData('bs.' + that.type)
      if (that.$tip) {
        that.$tip.detach()
      }
      that.$tip = null
      that.$arrow = null
      that.$viewport = null
      that.$element = null
    })
  }


  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.tooltip')
      var options = typeof option == 'object' && option

      if (!data && /destroy|hide/.test(option)) return
      if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tooltip

  $.fn.tooltip             = Plugin
  $.fn.tooltip.Constructor = Tooltip


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(jQuery);

},{}],16:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: transition.js v3.3.7
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap')

    var transEndEventNames = {
      WebkitTransition : 'webkitTransitionEnd',
      MozTransition    : 'transitionend',
      OTransition      : 'oTransitionEnd otransitionend',
      transition       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }

    return false // explicit for ie8 (  ._.)
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false
    var $el = this
    $(this).one('bsTransitionEnd', function () { called = true })
    var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

  $(function () {
    $.support.transition = transitionEnd()

    if (!$.support.transition) return

    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function (e) {
        if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
      }
    }
  })

}(jQuery);

},{}],17:[function(require,module,exports){
var Base64 = require('Base64');

function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str).replace(/(.)/g, function (m, p) {
    var code = p.charCodeAt(0).toString(16).toUpperCase();
    if (code.length < 2) {
      code = '0' + code;
    }
    return '%' + code;
  }));
}

module.exports = function(str) {
  var output = str.replace(/-/g, "+").replace(/_/g, "/");
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += "==";
      break;
    case 3:
      output += "=";
      break;
    default:
      throw "Illegal base64url string!";
  }

  try{
    return b64DecodeUnicode(output);
  } catch (err) {
    return Base64.atob(output);
  }
};

},{"Base64":20}],18:[function(require,module,exports){
'use strict';

var base64_url_decode = require('./base64_url_decode');
var json_parse = require('./json_parse');

module.exports = function (token) {
  if (!token) {
    throw new Error('Invalid token specified');
  }

  return json_parse(base64_url_decode(token.split('.')[1]));
};

},{"./base64_url_decode":17,"./json_parse":19}],19:[function(require,module,exports){
module.exports = function (str) {
  var parsed;
  if (typeof JSON === 'object') {
    parsed = JSON.parse(str);
  } else {
    parsed = eval('(' + str + ')');
  }
  return parsed;
};

},{}],20:[function(require,module,exports){
;(function () {

  var
    object = typeof exports != 'undefined' ? exports : this, // #8: web workers
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    INVALID_CHARACTER_ERR = (function () {
      // fabricate a suitable error object
      try { document.createElement('$'); }
      catch (error) { return error; }}());

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  object.btoa || (
  object.btoa = function (input) {
    for (
      // initialize result and counter
      var block, charCode, idx = 0, map = chars, output = '';
      // if the next input index does not exist:
      //   change the mapping table to "="
      //   check if d has no fractional digits
      input.charAt(idx | 0) || (map = '=', idx % 1);
      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
      charCode = input.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) throw INVALID_CHARACTER_ERR;
      block = block << 8 | charCode;
    }
    return output;
  });

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  object.atob || (
  object.atob = function (input) {
    input = input.replace(/=+$/, '')
    if (input.length % 4 == 1) throw INVALID_CHARACTER_ERR;
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = input.charAt(idx++);
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  });

}());

},{}],21:[function(require,module,exports){
/*! kjua v0.1.2 - https://larsjung.de/kjua/ */
!function(r,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.kjua=t():r.kjua=t()}(this,function(){return function(r){function t(n){if(e[n])return e[n].exports;var o=e[n]={exports:{},id:n,loaded:!1};return r[n].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var e={};return t.m=r,t.c=e,t.p="",t(0)}([function(r,t,e){"use strict";var n=e(1),o=n.createCanvas,i=n.canvasToImg,a=n.dpr,u=e(2),f=e(3),c=e(4);r.exports=function(r){var t=Object.assign({},u,r),e=f(t.text,t.ecLevel,t.minVersion,t.quiet),n=t.ratio||a,l=o(t.size,n),s=l.getContext("2d");return s.scale(n,n),c(e,s,t),"image"===t.render?i(l):l}},function(r,t){"use strict";var e=window,n=e.document,o=e.devicePixelRatio||1,i=function(r){return n.createElement(r)},a=function(r,t){return r.getAttribute(t)},u=function(r,t,e){return r.setAttribute(t,e)},f=function(r,t){var e=i("canvas");return u(e,"width",r*t),u(e,"height",r*t),e.style.width=r+"px",e.style.height=r+"px",e},c=function(r){var t=i("img");return u(t,"crossorigin","anonymous"),u(t,"src",r.toDataURL("image/png")),u(t,"width",a(r,"width")),u(t,"height",a(r,"height")),t.style.width=r.style.width,t.style.height=r.style.height,t};r.exports={createCanvas:f,canvasToImg:c,dpr:o}},function(r,t){"use strict";r.exports={render:"image",crisp:!0,minVersion:1,ecLevel:"L",size:200,ratio:null,fill:"#333",back:"#fff",text:"no text",rounded:0,quiet:0,mode:"plain",mSize:30,mPosX:50,mPosY:50,label:"no label",fontname:"sans",fontcolor:"#333",image:null}},function(r,t){"use strict";var e="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(r){return typeof r}:function(r){return r&&"function"==typeof Symbol&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r},n=/code length overflow/i,o=function(){var e=function(){function r(t,e){if("undefined"==typeof t.length)throw new Error(t.length+"/"+e);var n=function(){for(var r=0;r<t.length&&0==t[r];)r+=1;for(var n=new Array(t.length-r+e),o=0;o<t.length-r;o+=1)n[o]=t[o+r];return n}(),o={};return o.getAt=function(r){return n[r]},o.getLength=function(){return n.length},o.multiply=function(t){for(var e=new Array(o.getLength()+t.getLength()-1),n=0;n<o.getLength();n+=1)for(var i=0;i<t.getLength();i+=1)e[n+i]^=a.gexp(a.glog(o.getAt(n))+a.glog(t.getAt(i)));return r(e,0)},o.mod=function(t){if(o.getLength()-t.getLength()<0)return o;for(var e=a.glog(o.getAt(0))-a.glog(t.getAt(0)),n=new Array(o.getLength()),i=0;i<o.getLength();i+=1)n[i]=o.getAt(i);for(var i=0;i<t.getLength();i+=1)n[i]^=a.gexp(a.glog(t.getAt(i))+e);return r(n,0).mod(t)},o}var t=function(t,e){var o=236,a=17,l=t,s=n[e],g=null,h=0,d=null,w=new Array,y={},p=function(r,t){h=4*l+17,g=function(r){for(var t=new Array(r),e=0;e<r;e+=1){t[e]=new Array(r);for(var n=0;n<r;n+=1)t[e][n]=null}return t}(h),m(0,0),m(h-7,0),m(0,h-7),E(),B(),M(r,t),l>=7&&T(r),null==d&&(d=x(l,s,w)),b(d,t)},m=function(r,t){for(var e=-1;e<=7;e+=1)if(!(r+e<=-1||h<=r+e))for(var n=-1;n<=7;n+=1)t+n<=-1||h<=t+n||(0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4?g[r+e][t+n]=!0:g[r+e][t+n]=!1)},A=function(){for(var r=0,t=0,e=0;e<8;e+=1){p(!0,e);var n=i.getLostPoint(y);(0==e||r>n)&&(r=n,t=e)}return t},B=function(){for(var r=8;r<h-8;r+=1)null==g[r][6]&&(g[r][6]=r%2==0);for(var t=8;t<h-8;t+=1)null==g[6][t]&&(g[6][t]=t%2==0)},E=function(){for(var r=i.getPatternPosition(l),t=0;t<r.length;t+=1)for(var e=0;e<r.length;e+=1){var n=r[t],o=r[e];if(null==g[n][o])for(var a=-2;a<=2;a+=1)for(var u=-2;u<=2;u+=1)a==-2||2==a||u==-2||2==u||0==a&&0==u?g[n+a][o+u]=!0:g[n+a][o+u]=!1}},T=function(r){for(var t=i.getBCHTypeNumber(l),e=0;e<18;e+=1){var n=!r&&1==(t>>e&1);g[Math.floor(e/3)][e%3+h-8-3]=n}for(var e=0;e<18;e+=1){var n=!r&&1==(t>>e&1);g[e%3+h-8-3][Math.floor(e/3)]=n}},M=function(r,t){for(var e=s<<3|t,n=i.getBCHTypeInfo(e),o=0;o<15;o+=1){var a=!r&&1==(n>>o&1);o<6?g[o][8]=a:o<8?g[o+1][8]=a:g[h-15+o][8]=a}for(var o=0;o<15;o+=1){var a=!r&&1==(n>>o&1);o<8?g[8][h-o-1]=a:o<9?g[8][15-o-1+1]=a:g[8][15-o-1]=a}g[h-8][8]=!r},b=function(r,t){for(var e=-1,n=h-1,o=7,a=0,u=i.getMaskFunction(t),f=h-1;f>0;f-=2)for(6==f&&(f-=1);;){for(var c=0;c<2;c+=1)if(null==g[n][f-c]){var l=!1;a<r.length&&(l=1==(r[a]>>>o&1));var s=u(n,f-c);s&&(l=!l),g[n][f-c]=l,o-=1,o==-1&&(a+=1,o=7)}if(n+=e,n<0||h<=n){n-=e,e=-e;break}}},k=function(t,e){for(var n=0,o=0,a=0,u=new Array(e.length),f=new Array(e.length),c=0;c<e.length;c+=1){var l=e[c].dataCount,s=e[c].totalCount-l;o=Math.max(o,l),a=Math.max(a,s),u[c]=new Array(l);for(var g=0;g<u[c].length;g+=1)u[c][g]=255&t.getBuffer()[g+n];n+=l;var h=i.getErrorCorrectPolynomial(s),v=r(u[c],h.getLength()-1),d=v.mod(h);f[c]=new Array(h.getLength()-1);for(var g=0;g<f[c].length;g+=1){var w=g+d.getLength()-f[c].length;f[c][g]=w>=0?d.getAt(w):0}}for(var y=0,g=0;g<e.length;g+=1)y+=e[g].totalCount;for(var p=new Array(y),m=0,g=0;g<o;g+=1)for(var c=0;c<e.length;c+=1)g<u[c].length&&(p[m]=u[c][g],m+=1);for(var g=0;g<a;g+=1)for(var c=0;c<e.length;c+=1)g<f[c].length&&(p[m]=f[c][g],m+=1);return p},x=function(r,t,e){for(var n=u.getRSBlocks(r,t),c=f(),l=0;l<e.length;l+=1){var s=e[l];c.put(s.getMode(),4),c.put(s.getLength(),i.getLengthInBits(s.getMode(),r)),s.write(c)}for(var g=0,l=0;l<n.length;l+=1)g+=n[l].dataCount;if(c.getLengthInBits()>8*g)throw new Error("code length overflow. ("+c.getLengthInBits()+">"+8*g+")");for(c.getLengthInBits()+4<=8*g&&c.put(0,4);c.getLengthInBits()%8!=0;)c.putBit(!1);for(;;){if(c.getLengthInBits()>=8*g)break;if(c.put(o,8),c.getLengthInBits()>=8*g)break;c.put(a,8)}return k(c,n)};return y.addData=function(r){var t=c(r);w.push(t),d=null},y.isDark=function(r,t){if(r<0||h<=r||t<0||h<=t)throw new Error(r+","+t);return g[r][t]},y.getModuleCount=function(){return h},y.make=function(){p(!1,A())},y.createTableTag=function(r,t){r=r||2,t="undefined"==typeof t?4*r:t;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+t+"px;",e+='">',e+="<tbody>";for(var n=0;n<y.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<y.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+r+"px;",e+=" height: "+r+"px;",e+=" background-color: ",e+=y.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},y.createImgTag=function(r,t){r=r||2,t="undefined"==typeof t?4*r:t;var e=y.getModuleCount()*r+2*t,n=t,o=e-t;return v(e,e,function(t,e){if(n<=t&&t<o&&n<=e&&e<o){var i=Math.floor((t-n)/r),a=Math.floor((e-n)/r);return y.isDark(a,i)?0:1}return 1})},y};t.stringToBytes=function(r){for(var t=new Array,e=0;e<r.length;e+=1){var n=r.charCodeAt(e);t.push(255&n)}return t},t.createStringToBytes=function(r,t){var e=function(){for(var e=g(r),n=function(){var r=e.read();if(r==-1)throw new Error;return r},o=0,i={};;){var a=e.read();if(a==-1)break;var u=n(),f=n(),c=n(),l=String.fromCharCode(a<<8|u),s=f<<8|c;i[l]=s,o+=1}if(o!=t)throw new Error(o+" != "+t);return i}(),n="?".charCodeAt(0);return function(r){for(var t=new Array,o=0;o<r.length;o+=1){var i=r.charCodeAt(o);if(i<128)t.push(i);else{var a=e[r.charAt(o)];"number"==typeof a?(255&a)==a?t.push(a):(t.push(a>>>8),t.push(255&a)):t.push(n)}}return t}};var e={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},n={L:1,M:0,Q:3,H:2},o={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},i=function(){var t=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],n=1335,i=7973,u=21522,f={},c=function(r){for(var t=0;0!=r;)t+=1,r>>>=1;return t};return f.getBCHTypeInfo=function(r){for(var t=r<<10;c(t)-c(n)>=0;)t^=n<<c(t)-c(n);return(r<<10|t)^u},f.getBCHTypeNumber=function(r){for(var t=r<<12;c(t)-c(i)>=0;)t^=i<<c(t)-c(i);return r<<12|t},f.getPatternPosition=function(r){return t[r-1]},f.getMaskFunction=function(r){switch(r){case o.PATTERN000:return function(r,t){return(r+t)%2==0};case o.PATTERN001:return function(r,t){return r%2==0};case o.PATTERN010:return function(r,t){return t%3==0};case o.PATTERN011:return function(r,t){return(r+t)%3==0};case o.PATTERN100:return function(r,t){return(Math.floor(r/2)+Math.floor(t/3))%2==0};case o.PATTERN101:return function(r,t){return r*t%2+r*t%3==0};case o.PATTERN110:return function(r,t){return(r*t%2+r*t%3)%2==0};case o.PATTERN111:return function(r,t){return(r*t%3+(r+t)%2)%2==0};default:throw new Error("bad maskPattern:"+r)}},f.getErrorCorrectPolynomial=function(t){for(var e=r([1],0),n=0;n<t;n+=1)e=e.multiply(r([1,a.gexp(n)],0));return e},f.getLengthInBits=function(r,t){if(1<=t&&t<10)switch(r){case e.MODE_NUMBER:return 10;case e.MODE_ALPHA_NUM:return 9;case e.MODE_8BIT_BYTE:return 8;case e.MODE_KANJI:return 8;default:throw new Error("mode:"+r)}else if(t<27)switch(r){case e.MODE_NUMBER:return 12;case e.MODE_ALPHA_NUM:return 11;case e.MODE_8BIT_BYTE:return 16;case e.MODE_KANJI:return 10;default:throw new Error("mode:"+r)}else{if(!(t<41))throw new Error("type:"+t);switch(r){case e.MODE_NUMBER:return 14;case e.MODE_ALPHA_NUM:return 13;case e.MODE_8BIT_BYTE:return 16;case e.MODE_KANJI:return 12;default:throw new Error("mode:"+r)}}},f.getLostPoint=function(r){for(var t=r.getModuleCount(),e=0,n=0;n<t;n+=1)for(var o=0;o<t;o+=1){for(var i=0,a=r.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||t<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||t<=o+f||0==u&&0==f||a==r.isDark(n+u,o+f)&&(i+=1);i>5&&(e+=3+i-5)}for(var n=0;n<t-1;n+=1)for(var o=0;o<t-1;o+=1){var c=0;r.isDark(n,o)&&(c+=1),r.isDark(n+1,o)&&(c+=1),r.isDark(n,o+1)&&(c+=1),r.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(var n=0;n<t;n+=1)for(var o=0;o<t-6;o+=1)r.isDark(n,o)&&!r.isDark(n,o+1)&&r.isDark(n,o+2)&&r.isDark(n,o+3)&&r.isDark(n,o+4)&&!r.isDark(n,o+5)&&r.isDark(n,o+6)&&(e+=40);for(var o=0;o<t;o+=1)for(var n=0;n<t-6;n+=1)r.isDark(n,o)&&!r.isDark(n+1,o)&&r.isDark(n+2,o)&&r.isDark(n+3,o)&&r.isDark(n+4,o)&&!r.isDark(n+5,o)&&r.isDark(n+6,o)&&(e+=40);for(var l=0,o=0;o<t;o+=1)for(var n=0;n<t;n+=1)r.isDark(n,o)&&(l+=1);var s=Math.abs(100*l/t/t-50)/5;return e+=10*s},f}(),a=function(){for(var r=new Array(256),t=new Array(256),e=0;e<8;e+=1)r[e]=1<<e;for(var e=8;e<256;e+=1)r[e]=r[e-4]^r[e-5]^r[e-6]^r[e-8];for(var e=0;e<255;e+=1)t[r[e]]=e;var n={};return n.glog=function(r){if(r<1)throw new Error("glog("+r+")");return t[r]},n.gexp=function(t){for(;t<0;)t+=255;for(;t>=256;)t-=255;return r[t]},n}(),u=function(){var r=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],t=function(r,t){var e={};return e.totalCount=r,e.dataCount=t,e},e={},o=function(t,e){switch(e){case n.L:return r[4*(t-1)+0];case n.M:return r[4*(t-1)+1];case n.Q:return r[4*(t-1)+2];case n.H:return r[4*(t-1)+3];default:return}};return e.getRSBlocks=function(r,e){var n=o(r,e);if("undefined"==typeof n)throw new Error("bad rs block @ typeNumber:"+r+"/errorCorrectLevel:"+e);for(var i=n.length/3,a=new Array,u=0;u<i;u+=1)for(var f=n[3*u+0],c=n[3*u+1],l=n[3*u+2],s=0;s<f;s+=1)a.push(t(c,l));return a},e}(),f=function(){var r=new Array,t=0,e={};return e.getBuffer=function(){return r},e.getAt=function(t){var e=Math.floor(t/8);return 1==(r[e]>>>7-t%8&1)},e.put=function(r,t){for(var n=0;n<t;n+=1)e.putBit(1==(r>>>t-n-1&1))},e.getLengthInBits=function(){return t},e.putBit=function(e){var n=Math.floor(t/8);r.length<=n&&r.push(0),e&&(r[n]|=128>>>t%8),t+=1},e},c=function(r){var n=e.MODE_8BIT_BYTE,o=t.stringToBytes(r),i={};return i.getMode=function(){return n},i.getLength=function(r){return o.length},i.write=function(r){for(var t=0;t<o.length;t+=1)r.put(o[t],8)},i},l=function(){var r=new Array,t={};return t.writeByte=function(t){r.push(255&t)},t.writeShort=function(r){t.writeByte(r),t.writeByte(r>>>8)},t.writeBytes=function(r,e,n){e=e||0,n=n||r.length;for(var o=0;o<n;o+=1)t.writeByte(r[o+e])},t.writeString=function(r){for(var e=0;e<r.length;e+=1)t.writeByte(r.charCodeAt(e))},t.toByteArray=function(){return r},t.toString=function(){var t="";t+="[";for(var e=0;e<r.length;e+=1)e>0&&(t+=","),t+=r[e];return t+="]"},t},s=function(){var r=0,t=0,e=0,n="",o={},i=function(r){n+=String.fromCharCode(a(63&r))},a=function(r){if(r<0);else{if(r<26)return 65+r;if(r<52)return 97+(r-26);if(r<62)return 48+(r-52);if(62==r)return 43;if(63==r)return 47}throw new Error("n:"+r)};return o.writeByte=function(n){for(r=r<<8|255&n,t+=8,e+=1;t>=6;)i(r>>>t-6),t-=6},o.flush=function(){if(t>0&&(i(r<<6-t),r=0,t=0),e%3!=0)for(var o=3-e%3,a=0;a<o;a+=1)n+="="},o.toString=function(){return n},o},g=function(r){var t=r,e=0,n=0,o=0,i={};i.read=function(){for(;o<8;){if(e>=t.length){if(0==o)return-1;throw new Error("unexpected end of file./"+o)}var r=t.charAt(e);if(e+=1,"="==r)return o=0,-1;r.match(/^\s$/)||(n=n<<6|a(r.charCodeAt(0)),o+=6)}var i=n>>>o-8&255;return o-=8,i};var a=function(r){if(65<=r&&r<=90)return r-65;if(97<=r&&r<=122)return r-97+26;if(48<=r&&r<=57)return r-48+52;if(43==r)return 62;if(47==r)return 63;throw new Error("c:"+r)};return i},h=function(r,t){var e=r,n=t,o=new Array(r*t),i={};i.setPixel=function(r,t,n){o[t*e+r]=n},i.write=function(r){r.writeString("GIF87a"),r.writeShort(e),r.writeShort(n),r.writeByte(128),r.writeByte(0),r.writeByte(0),r.writeByte(0),r.writeByte(0),r.writeByte(0),r.writeByte(255),r.writeByte(255),r.writeByte(255),r.writeString(","),r.writeShort(0),r.writeShort(0),r.writeShort(e),r.writeShort(n),r.writeByte(0);var t=2,o=u(t);r.writeByte(t);for(var i=0;o.length-i>255;)r.writeByte(255),r.writeBytes(o,i,255),i+=255;r.writeByte(o.length-i),r.writeBytes(o,i,o.length-i),r.writeByte(0),r.writeString(";")};var a=function(r){var t=r,e=0,n=0,o={};return o.write=function(r,o){if(r>>>o!=0)throw new Error("length over");for(;e+o>=8;)t.writeByte(255&(r<<e|n)),o-=8-e,r>>>=8-e,n=0,e=0;n|=r<<e,e+=o},o.flush=function(){e>0&&t.writeByte(n)},o},u=function(r){for(var t=1<<r,e=(1<<r)+1,n=r+1,i=f(),u=0;u<t;u+=1)i.add(String.fromCharCode(u));i.add(String.fromCharCode(t)),i.add(String.fromCharCode(e));var c=l(),s=a(c);s.write(t,n);var g=0,h=String.fromCharCode(o[g]);for(g+=1;g<o.length;){var v=String.fromCharCode(o[g]);g+=1,i.contains(h+v)?h+=v:(s.write(i.indexOf(h),n),i.size()<4095&&(i.size()==1<<n&&(n+=1),i.add(h+v)),h=v)}return s.write(i.indexOf(h),n),s.write(e,n),s.flush(),c.toByteArray()},f=function(){var r={},t=0,e={};return e.add=function(n){if(e.contains(n))throw new Error("dup key:"+n);r[n]=t,t+=1},e.size=function(){return t},e.indexOf=function(t){return r[t]},e.contains=function(t){return"undefined"!=typeof r[t]},e};return i},v=function(r,t,e,n){for(var o=h(r,t),i=0;i<t;i+=1)for(var a=0;a<r;a+=1)o.setPixel(a,i,e(a,i));var u=l();o.write(u);for(var f=s(),c=u.toByteArray(),g=0;g<c.length;g+=1)f.writeByte(c[g]);f.flush();var v="";return v+="<img",v+=' src="',v+="data:image/gif;base64,",v+=f,v+='"',v+=' width="',v+=r,v+='"',v+=' height="',v+=t,v+='"',n&&(v+=' alt="',v+=n,v+='"'),v+="/>"};return t}();return function(e){"function"==typeof define&&define.amd?define([],e):"object"==typeof t&&(r.exports=e())}(function(){return e}),!function(r){r.stringToBytes=function(r){function t(r){for(var t=[],e=0;e<r.length;e++){var n=r.charCodeAt(e);n<128?t.push(n):n<2048?t.push(192|n>>6,128|63&n):n<55296||n>=57344?t.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&r.charCodeAt(e)),t.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return t}return t(r)}}(e),e}(),i=function(r,t){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1;i=Math.max(1,i);for(var a=i;a<=40;a+=1)try{var u=function(){var e=o(a,t);e.addData(r),e.make();var n=e.getModuleCount(),i=function(r,t){return r>=0&&r<n&&t>=0&&t<n&&e.isDark(r,t)};return{v:{text:r,level:t,version:a,moduleCount:n,isDark:i}}}();if("object"===("undefined"==typeof u?"undefined":e(u)))return u.v}catch(r){if(!n.test(r.message))throw r}return null},a=function(){var r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"L",e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1,n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:0,o=i(r,t,e);if(o){var a=o.isDark;o.moduleCount+=2*n,o.isDark=function(r,t){return a(r-n,t-n)}}return o};r.exports=a},function(r,t,e){"use strict";var n=e(5),o=e(6),i=function(r,t){r.fillStyle=t.back,r.fillRect(0,0,t.size,t.size)},a=function(r,t,e,n,o,i){r.isDark(o,i)&&t.rect(i*n,o*n,n,n)},u=function(r,t,e){if(r){var o=e.rounded>0&&e.rounded<=100?n:a,i=r.moduleCount,u=e.size/i,f=0;e.crisp&&(u=Math.floor(u),f=Math.floor((e.size-u*i)/2)),t.translate(f,f),t.beginPath();for(var c=0;c<i;c+=1)for(var l=0;l<i;l+=1)o(r,t,e,u,c,l);t.fillStyle=e.fill,t.fill(),t.translate(-f,-f)}},f=function(r,t,e){i(t,e),u(r,t,e),o(t,e)};r.exports=f},function(r,t){"use strict";var e=function(r){return{c:r,m:function(){var r;return(r=this.c).moveTo.apply(r,arguments),this},l:function(){var r;return(r=this.c).lineTo.apply(r,arguments),this},a:function(){var r;return(r=this.c).arcTo.apply(r,arguments),this}}},n=function(r,t,e,n,o,i,a,u,f,c){a?r.m(t+i,e):r.m(t,e),u?r.l(n-i,e).a(n,e,n,o,i):r.l(n,e),f?r.l(n,o-i).a(n,o,t,o,i):r.l(n,o),c?r.l(t+i,o).a(t,o,t,e,i):r.l(t,o),a?r.l(t,e+i).a(t,e,n,e,i):r.l(t,e)},o=function(r,t,e,n,o,i,a,u,f,c){a&&r.m(t+i,e).l(t,e).l(t,e+i).a(t,e,t+i,e,i),u&&r.m(n-i,e).l(n,e).l(n,e+i).a(n,e,n-i,e,i),f&&r.m(n-i,o).l(n,o).l(n,o-i).a(n,o,n-i,o,i),c&&r.m(t+i,o).l(t,o).l(t,o-i).a(t,o,t+i,o,i)},i=function(r,t,i,a,u,f){var c=f*a,l=u*a,s=c+a,g=l+a,h=.005*i.rounded*a,v=r.isDark,d=u-1,w=u+1,y=f-1,p=f+1,m=v(u,f),A=v(d,y),B=v(d,f),E=v(d,p),T=v(u,p),M=v(w,p),b=v(w,f),k=v(w,y),x=v(u,y),D=e(t);m?n(D,c,l,s,g,h,!B&&!x,!B&&!T,!b&&!T,!b&&!x):o(D,c,l,s,g,h,B&&x&&A,B&&T&&E,b&&T&&M,b&&x&&k)};r.exports=i},function(r,t){"use strict";var e=function(r,t){var e=t.size,n="bold "+.01*t.mSize*e+"px "+t.fontname;r.strokeStyle=t.back,r.lineWidth=.01*t.mSize*e*.1,r.fillStyle=t.fontcolor,r.font=n;var o=r.measureText(t.label).width,i=.01*t.mSize,a=o/e,u=(1-a)*t.mPosX*.01,f=(1-i)*t.mPosY*.01,c=u*e,l=f*e+.75*t.mSize*.01*e;r.strokeText(t.label,c,l),r.fillText(t.label,c,l)},n=function(r,t){var e=t.size,n=t.image.naturalWidth||1,o=t.image.naturalHeight||1,i=.01*t.mSize,a=i*n/o,u=(1-a)*t.mPosX*.01,f=(1-i)*t.mPosY*.01,c=u*e,l=f*e,s=a*e,g=i*e;r.drawImage(t.image,c,l,s,g)},o=function(r,t){var o=t.mode;"label"===o?e(r,t):"image"===o&&n(r,t)};r.exports=o}])});
},{}]},{},[1])(1)
});
