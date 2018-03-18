<%@ page import="org.jivesoftware.util.*, org.jivesoftware.openfire.user.*, org.jivesoftware.openfire.*, org.dom4j.*, java.net.*,
                 org.jivesoftware.openfire.vcard.VCardManager, java.util.*, java.net.URLEncoder, javax.xml.bind.DatatypeConverter"%>
<%
    String hostname = XMPPServer.getInstance().getServerInfo().getHostname();    
    String ourIpAddress = hostname;

    try {
        ourIpAddress = InetAddress.getByName(hostname).getHostAddress();
    } catch (Exception e) {  }
        
    String domain = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
    
    boolean isSwitchAvailable = JiveGlobals.getBooleanProperty("freeswitch.enabled", false);
    String sipDomain = JiveGlobals.getProperty("freeswitch.sip.hostname", ourIpAddress);
    
    String emailAddress = null;
    String nickName = null;  
    String userAvatar = null;
    
    String authorization = request.getHeader("authorization");
    
    if (authorization != null)
    {
        authorization = authorization.replaceFirst("[B|b]asic ", "");
        byte[] decodedBytes = DatatypeConverter.parseBase64Binary(authorization);

        if (decodedBytes != null && decodedBytes.length > 0) 
        {
            String[] userPass = new String(decodedBytes).split(":", 2);

            try {
                User user = XMPPServer.getInstance().getUserManager().getUser(userPass[0]);

                emailAddress = user.getEmail();
                nickName = user.getName();

                VCardManager vcardManager = VCardManager.getInstance();
                Element vcard = vcardManager.getVCard(userPass[0]);

                if (vcard != null)
                {
                    Element photo = vcard.element("PHOTO");

                    if (photo != null)
                    {
                        String type = photo.element("TYPE").getText();
                        String binval = photo.element("BINVAL").getText();

                        userAvatar = "data:" + type + ";base64," + binval.replace("\n", "").replace("\r", "");
                    }
                }            

            } catch (Exception e) {

            }        
        }
    }
  
%>
<html itemscope itemtype="http://schema.org/Product" prefix="og: http://ogp.me/ns#" xmlns="http://www.w3.org/1999/html">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="content-type" content="text/html;charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>
        var OFMEET_CONFIG = {
            emailAddress:<%= emailAddress == null ? null : "'" + emailAddress + "'" %>,
            nickName:<%= nickName == null ? null : "'" + nickName + "'" %>,
            userAvatar:<%= userAvatar == null ? null : "'" + userAvatar + "'" %>,            
            authorization: <%= authorization == null ? null : "'" + authorization + "'" %>,   
            
            isSwitchAvailable: <%= isSwitchAvailable %>,
            callcontrol:'<%= "callcontrol." + domain %>', 
            sip:'<%= sipDomain %>',              
            hostname:'<%= hostname %>',             
            domain:'<%= domain %>'
        };
    </script>    
    <script>
        window.indexLoadedTime = window.performance.now();
        console.log("(TIME) index.html loaded:\t", indexLoadedTime);
        // XXX the code below listeners for errors and displays an error message
        // in the document body when any of the required files fails to load.
        // The intention is to prevent from displaying broken page.
        var criticalFiles = [
            "config.js",
            "utils.js",
            "do_external_connect.js",
            "interface_config.js",
            "logging_config.js",
            "lib-jitsi-meet.min.js",
            "app.bundle.min.js",
            "all.css?v=2064"
        ];
        var loadErrHandler = function(e) {
            var target = e.target;
            // Error on <script> and <link>(CSS)
            // <script> will have .src and <link> .href
            var fileRef = (target.src ? target.src : target.href);
            if (("SCRIPT" === target.tagName || "LINK" === target.tagName)
                && criticalFiles.some(
                    function(file) { return fileRef.indexOf(file) !== -1 })) {
                window.onload = function() {
                    // The whole complex part below implements page reloads with
                    // "exponential backoff". The retry attempt is passes as
                    // "rCounter" query parameter
                    var href = window.location.href;

                    var retryMatch = href.match(/.+(\?|&)rCounter=(\d+)/);
                    var retryCountStr = retryMatch ? retryMatch[2] : "0";
                    var retryCount = Number.parseInt(retryCountStr);

                    if (retryMatch == null) {
                        var separator = href.indexOf("?") === -1 ? "?" : "&";
                        var hashIdx = href.indexOf("#");

                        if (hashIdx === -1) {
                            href += separator + "rCounter=1";
                        } else {
                            var hashPart = href.substr(hashIdx);

                            href = href.substr(0, hashIdx)
                                + separator + "rCounter=1" + hashPart;
                        }
                    } else {
                        var separator = retryMatch[1];

                        href = href.replace(
                            /(\?|&)rCounter=(\d+)/,
                            separator + "rCounter=" + (retryCount + 1));
                    }

                    var delay = Math.pow(2, retryCount) * 2000;
                    if (isNaN(delay) || delay < 2000 || delay > 60000)
                        delay = 10000;

                    var showMoreText = "show more";
                    var showLessText = "show less";

                    document.body.innerHTML
                        = "<div style='"
                        + "position: absolute;top: 50%;left: 50%;"
                        + "text-align: center;"
                        + "font-size: medium;"
                        + "font-weight: 400;"
                        + "transform: translate(-50%, -50%)'>"
                        + "Uh oh! We couldn't fully download everything we needed :(" // jshint ignore:line
                        + "<br/> "
                        + "We will try again shortly. In the mean time, check for problems with your Internet connection!" // jshint ignore:line
                        + "<br/><br/> "
                        + "<div id='moreInfo' style='"
                        + "display: none;'>" + "Missing " + fileRef
                        + "<br/><br/></div>"
                        + "<a id='showMore' style='"
                        + "text-decoration: underline;"
                        + "font-size:small;"
                        + "cursor: pointer'>" + showMoreText + "</a>"
                        + "&nbsp;&nbsp;&nbsp;"
                        + "<a href='" + href + "' style='"
                        + "text-decoration: underline;"
                        + "font-size:small;"
                        + "'>reload now</a>"
                        + "</div>";

                    var showMoreElem = document.getElementById("showMore");
                    showMoreElem.addEventListener('click', function () {
                            var moreInfoElem
                                    = document.getElementById("moreInfo");

                            if (showMoreElem.innerHTML === showMoreText) {
                                moreInfoElem.setAttribute(
                                    "style",
                                    "display: block;"
                                    + "color:#FF991F;"
                                    + "font-size:small;"
                                    + "user-select:text;");
                                showMoreElem.innerHTML = showLessText;
                            }
                            else {
                                moreInfoElem.setAttribute(
                                    "style", "display: none;");
                                showMoreElem.innerHTML = showMoreText;
                            }
                        });

                    window.setTimeout(
                        function () { window.location.replace(href); }, delay);

                    // Call extra handler if defined.
                    if (typeof postLoadErrorHandler === "function") {
                        postLoadErrorHandler();
                    }
                };
                window.removeEventListener(
                    'error', loadErrHandler, true /* capture phase */);
            }
        };
        window.addEventListener(
            'error', loadErrHandler, true /* capture phase type of listener */);
    </script>
    <script src="/ofmeet/config.js"></script>
    <script src="/ofmeet/interface_config.js"></script>

    <script src="libs/do_external_connect.min.js"></script>
    <script src="logging_config.js"></script>
    <script src="libs/lib-jitsi-meet.min.js"></script>
    <script src="libs/app.bundle.min.js"></script>
    <script src="ofmeet.js"></script>
    <link rel="stylesheet" href="css/all.css">
  </head>
  <body>
    <div id="react"></div>
    <div id="keyboard-shortcuts" class="keyboard-shortcuts" style="display:none;">
        <div class="content">
            <ul id="keyboard-shortcuts-list" class="shortcuts-list">
            </ul>
        </div>
    </div>
  </body>
</html>
