/*
 * HTML5 ChromeExtension
 *
 * Notify user using chrome extension API if new messages come in.
 */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.ChromeExtension = (function(self, Candy, $) {
  /** Object: _options
   * Options for this plugin's operation
   *
   * Options:
   *   (Boolean) notifyNormalMessage - Notification on normalmessage. Defaults to false
   *   (Boolean) notifyPersonalMessage - Notification for private messages. Defaults to true
   *   (Boolean) notifyMention - Notification for mentions. Defaults to true
   *   (Integer) closeTime - Time until closing the Notification. (0 = Don't close) Defaults to 3000
   *   (String)  title - Title to be used in notification popup. Set to null to use the contact's name.
   *   (Boolean) requireInteraction - Enables the use of  closetime 0 to let notifications remain visible.
   *   (String)  icon - Path to use for image/icon for notification popup.
   */
  var _options = {
    notifyNormalMessage: true,
    notifyPersonalMessage: true,
    notifyMention: true,
    closeTime: 3000,
    title: 'Chat Message',
    requireInteraction: true,
    icon: window.location.origin + '/' + Candy.View.getOptions().assets + '/img/favicon.png'
  };

  /** Function: init
   * Initializes the notifications plugin.
   *
   * Parameters:
   *   (Object) options - The options to apply to this plugin
   *
   * @return void
   */
  self.init = function(options) {
    // apply the supplied options to the defaults specified
    $.extend(true, _options, options);

     // Add Listener for Notifications
     $(Candy).on('candy:view.message.notify', self.handleNotification);
  };


  /** Function: handleNotification
   * Descriptions
   *
   * Parameters:
   *   (Array) args
   *
   * @return void
   */
  self.handleNotification = function(e, args) 
  {
    // Check if window has focus, so no notification needed
    
    if (!document.hasFocus()) 
    {
      if(_options.notifyNormalMessage || (self.mentionsMe(args.message) && _options.notifyMention) || (_options.notifyPersonalMessage && Candy.View.Pane.Chat.rooms[args.roomJid].type === 'chat')) 
      {
        // Create the notification.
        
	ofmeet.util.startAudioAlert();
	bgWindow.ChromeUi.drawAttentionChat();
	bgWindow.ChromeUi.notifyText(!_options.title ? args.name : _options.title, args.message);        
      }
    }
  };

  self.mentionsMe = function(message) {
    var message = message.toLowerCase(),
        nick = Candy.Core.getUser().getNick().toLowerCase(),
        cid = Strophe.getNodeFromJid(Candy.Core.getUser().getJid()).toLowerCase(),
        jid = Candy.Core.getUser().getJid().toLowerCase();
    if (message.indexOf(nick) === -1 &&
      message.indexOf(cid) === -1 &&
      message.indexOf(jid) === -1) {
      return false;
    }
    return true;
  };

  return self;
}(CandyShop.ChromeExtension || {}, Candy, jQuery));
