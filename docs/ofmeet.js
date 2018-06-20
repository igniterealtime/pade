var ofmeet = (function(of)
{
    window.addEventListener("load", function()
    {
        var chatButton = document.getElementById("chatbutton");
        var chatFrame = document.getElementById("chatframe");

        chatButton.addEventListener("click", function (e)
        {
            //console.log("chatButton clicked");

            if (of.loaded == false)
            {
                chatFrame.src="webmeet/converse.html";
                chatFrame.style.display = "";
                of.loaded = true;
            }
            chatFrame.style.visibility = "visible";
            chatButton.style.visibility = "hidden";
        });
    });

    of.doBadge = function doBadge(count)
    {
        var unreadMessageHeading = document.getElementById("unreadMessageHeading");
        var unreadMessageIndicator = document.getElementById("unreadMessageIndicator");

        if (count == 0)
        {
            unreadMessageIndicator.style.visibility = "hidden";

        } else {
            unreadMessageIndicator.style.visibility = "visible";
            unreadMessageHeading.innerText = count;
        }
    }

    of.doExit = function doExit()
    {
        document.getElementById("chatbutton").style.visibility = "visible";
        document.getElementById("chatframe").style.visibility = "hidden";

        of.doBadge(0);
    }

    of.loaded = false;
    return of;

}(ofmeet || {}));

var root = document.createElement("div");
root.innerHTML = '<div class="ofmeet-button bubble"> <a id="chatbutton" class="lwc-chat-button"> <span id="unreadMessageIndicator" class="unreadMessageIndicator"><h3 id="unreadMessageHeading" class="heading">5</h3></span> <span class="lwc-button-icon"> <svg viewBox="0 0 38 35" style="width: inherit"> <path fill="#FFF" fill-rule="evenodd" d="M36.9 10.05c-1-4.27-4.45-7.6-8.8-8.4-2.95-.5-6-.78-9.1-.78-3.1 0-6.15.27-9.1.8-4.35.8-7.8 4.1-8.8 8.38-.4 1.5-.6 3.07-.6 4.7 0 1.62.2 3.2.6 4.7 1 4.26 4.45 7.58 8.8 8.37 2.95.53 6 .45 9.1.45v5.2c0 .77.62 1.4 1.4 1.4.3 0 .6-.12.82-.3l11.06-8.46c2.3-1.53 3.97-3.9 4.62-6.66.4-1.5.6-3.07.6-4.7 0-1.62-.2-3.2-.6-4.7zm-14.2 9.1H10.68c-.77 0-1.4-.63-1.4-1.4 0-.77.63-1.4 1.4-1.4H22.7c.76 0 1.4.63 1.4 1.4 0 .77-.63 1.4-1.4 1.4zm4.62-6.03H10.68c-.77 0-1.4-.62-1.4-1.38 0-.77.63-1.4 1.4-1.4h16.64c.77 0 1.4.63 1.4 1.4 0 .76-.63 1.38-1.4 1.38z"></path></svg> </span> <span id="chatIconText" class="lwc-button-text">Contact us</span> </a></div> <div class="ofmeet-chat"> <iframe id="chatframe"  allow="microphone; camera;" frameborder="0" seamless="seamless" allowfullscreen="true" scrolling="no" class="lwc-chat-frame chat open-chat" style="z-index: 2147483647;visibility:hidden;display:none;border-top: 50px;"></iframe> </div>';
document.body.appendChild(root);