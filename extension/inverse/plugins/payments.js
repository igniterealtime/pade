(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
    var TransferWiseDialog = null;
    var transferWiseDialog = null;

    converse.plugins.add("payments", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;


            TransferWiseDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  var view = this.model.get("view");
                  var email = view.model.vcard.get("email")
                  var label = view.model.getDisplayName();

                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">TransferWise Payment to ' + label + ' (' + email + ') </h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body"><form class="converse-form converse-form--modal profile-form" action="#">' +
                         '<div class="form-group">' +
                         '   <label for="tw-profile">Profile:</label>' +
                         '   <select class="form-control" id="tw-profile" name="tw-profile">' +
                         '       <option value="personal">Personal</option>' +
                         '       <option value="business">Business</option>' +
                         '   </select>' +
                         '</div>' +
                         '<div class="form-group">' +
                         '   <label for="tw-currency-source">Source Currency:</label>' +
                         '   <select class="form-control" id="tw-currency-source" name="tw-currency-source">' +
                         '       <option value="GBP">Pound</option>' +
                         '       <option value="USD">Dollar</option>' +
                         '       <option value="EUR">Euro</option>' +
                         '       <option value="AUD">Australian Dollar</option>' +
                         '       <option value="NZD">New Zealand Dollar</option>' +
                         '   </select>' +
                         '</div>' +
                         '<div class="form-group">' +
                         '   <label for="tw-currency-target">Target Currency:</label>' +
                         '   <select class="form-control" id="tw-currency-target" name="tw-currency-target">' +
                         '       <option value="GBP">Pound</option>' +
                         '       <option value="USD">Dollar</option>' +
                         '       <option value="EUR">Euro</option>' +
                         '       <option value="AUD">Australian Dollar</option>' +
                         '       <option value="NZD">New Zealand Dollar</option>' +
                         '   </select>' +
                         '</div>' +
                         '<div class="form-group">' +
                         '  <label for="tw-amount-source" class="col-form-label">Source Amount (enter this or target amount, but not both):</label>' +
                         '  <input id="tw-amount-source" type="text" class="form-control" name="tw-amount-source" value=""/>' +
                         '</div>' +
                         '<div class="form-group">' +
                         '  <label for="tw-amount-target" class="col-form-label">Target Amount (enter this or source amount, but not both):</label>' +
                         '  <input id="tw-amount-target" type="text" class="form-control" name="tw-amount-target" value=""/>' +
                         '</div>' +
                         '<div class="form-group">' +
                         '  <label for="tw-description" class="col-form-label">Description:</label>' +
                         '  <input id="tw-description" type="text" class="form-control" name="tw-descriptiont" value="' + label + '"/>' +
                         '</div>' +
                         '</form></div><div class="modal-footer"><button type="button" class="btn btn-success btn-transfer" data-dismiss="modal">Transfer</button> <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button></div>' +
                         '</div> </div> </div>';
                },
                events: {
                    "click .btn-transfer": "transferAmount",
                },

                transferAmount() {
                    var view = this.model.get("view");

                    if (bgWindow)
                    {
                        var profile = this.el.querySelector("#tw-profile").value.trim();
                        var sourceCurrency = this.el.querySelector("#tw-currency-source").value.trim();
                        var targetCurrency = this.el.querySelector("#tw-currency-target").value.trim();
                        var sourceAmount = this.el.querySelector("#tw-amount-source").value.trim();
                        var targetAmount = this.el.querySelector("#tw-amount-target").value.trim();
                        var description = this.el.querySelector("#tw-description").value.trim();

                        transferWiseAmount(view, profile, sourceCurrency, targetCurrency, sourceAmount, targetAmount, description);
                    }
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                if (bgWindow)
                {
                    var id = view.model.get("box_id");
                    var email = view.model.vcard.get("email");
                    var url = view.model.vcard.get("url");

                    if (view.model.get('type') === "chatbox" && bgWindow.pade.transferWiseProfile && bgWindow.pade.transferWiseProfile.length > 0 && email)
                    {
                        addToolbarItem(view, id, "webmeet-transferwise-" + id, '<a class="plugin-transferwise fa" title="TransferWise. Click to open"><img height="16" src="plugins/css/images/transferwise.svg"/></a>');

                        var transferWiseButton = document.getElementById("webmeet-transferwise-" + id);

                        if (transferWiseButton)
                        {
                            transferWiseButton.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                transferWiseDialog = new TransferWiseDialog({'model': new converse.env.Backbone.Model({view: view}) });
                                transferWiseDialog.show();

                            }, false);
                        }
                    }

                    if (getSetting("enableGooglePay", false))
                    {
                        addToolbarItem(view, id, "webmeet-googlepay-" + id, '<a class="plugin-googlepay fa" title="Google Pay. Click to open"><img height="16" src="plugins/css/images/google-pay-mark_800_gray.svg"/></a>');

                        var googlePay = document.getElementById("webmeet-googlepay-" + id);

                        if (googlePay)
                        {
                            googlePay.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                bgWindow.pade.activeView = view;
                                var googlePayUrl = "https://pay.google.com/payments/u/0/home#sendRequestMoney";
                                bgWindow.closeWebAppsWindow(googlePayUrl);
                                bgWindow.openWebAppsWindow(googlePayUrl, null, 590, 820);

                            }, false);
                        }
                    }

                    if (getSetting("enablePayPalMe", false) && url && url.indexOf("https://www.paypal.me/") > -1)
                    {
                        addToolbarItem(view, id, "webmeet-paypalme-" + id, '<a class="plugin-paypalme fa" title="PayPal Me. Click to open"><img height="16" src="plugins/css/images/pp-acceptance-small.png"/></a>');

                        var payPalMe = document.getElementById("webmeet-paypalme-" + id);

                        if (payPalMe)
                        {
                            payPalMe.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                bgWindow.pade.activeView = view;
                                bgWindow.closeWebAppsWindow(url);
                                bgWindow.openWebAppsWindow(url, null, 590, 880);

                            }, false);
                        }
                    }
                }

            });

            console.log("payments plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                parseMessageForCommands: function(text) {
                    console.debug('transferwise - parseMessageForCommands', text);

                    if (bgWindow)
                    {
                        const match = text.replace(/^\s*/, "").match(/^\/(.*?)(?: (.*))?$/) || [false, '', ''];
                        const command = match[1].toLowerCase();
                        const url = this.model.vcard.get("url");
                        const email = this.model.vcard.get("email");

                        if (command === "tw" && this.model.get('type') === "chatbox" && bgWindow.pade.transferWiseProfile && bgWindow.pade.transferWiseProfile.length > 0 && email)
                        {
                            transferWiseDialog = new TransferWiseDialog({'model': new converse.env.Backbone.Model({view: this}) });
                            transferWiseDialog.show();
                            return true;
                        }
                        else

                        if (command === "gp" && getSetting("enableGooglePay", false))
                        {
                            bgWindow.pade.activeView = this;
                            var googlePayUrl = "https://pay.google.com/payments/u/0/home#sendRequestMoney";
                            bgWindow.closeWebAppsWindow(googlePayUrl);
                            bgWindow.openWebAppsWindow(googlePayUrl, null, 590, 820);
                            return true;
                        }
                        else

                        if (command === "pp" && getSetting("enablePayPalMe", false) && url && url.indexOf("https://www.paypal.me/") > -1)
                        {
                            bgWindow.pade.activeView = this;
                            bgWindow.closeWebAppsWindow(url);
                            bgWindow.openWebAppsWindow(url, null, 590, 880);
                            return true;
                        }
                    }

                    return this.__super__.parseMessageForCommands.apply(this, arguments);
                }
            }
        }
    });

    function newElement(el, id, html)
    {
        var ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        document.body.appendChild(ele);
        return ele;
    }

    var addToolbarItem = function(view, id, label, html)
    {
        var placeHolder = view.el.querySelector('#place-holder');

        if (!placeHolder)
        {
            var smiley = view.el.querySelector('.toggle-smiley.dropup');
            smiley.insertAdjacentElement('afterEnd', newElement('li', 'place-holder'));
            placeHolder = view.el.querySelector('#place-holder');
        }
        placeHolder.insertAdjacentElement('afterEnd', newElement('li', label, html));
    }

    var transferWiseAmount = function(view, profile, sourceCurrency, targetCurrency, sourceAmount, targetAmount, description)
    {
        var label = view.model.getDisplayName();
        var email = view.model.vcard.get("email");
        var jid = view.model.vcard.get("jid");
        var senderId = bgWindow.pade.transferWiseProfile[0].id;
        var legalType = "PRIVATE";

        if (bgWindow.pade.transferWiseProfile.length > 1)
        {
            if (profile == bgWindow.pade.transferWiseProfile[1].type)
            {
                senderId = bgWindow.pade.transferWiseProfile[1].id;
                legalType = "BUSINESS";
            }
        }

        console.debug("transferWiseAmount", jid, label, email, profile, sourceCurrency, targetCurrency, sourceAmount, targetAmount, senderId, description);

        var data = {
            "profile": senderId,
            "source": sourceCurrency,
            "target": targetCurrency,
            "rateType": "FIXED",
            "type": "BALANCE_PAYOUT"
        };

        if (sourceAmount && sourceAmount != "")
        {
            data.sourceAmount = sourceAmount;
        }
        else

        if (targetAmount && targetAmount != "")
        {
            data.targetAmount = targetAmount;
        }


        fetch(bgWindow.pade.transferWiseUrl + '/quotes', {headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getSetting("transferWiseKey") },  method: 'POST', body: JSON.stringify(data)}).then(resp => {if (!resp.ok) throw Error(resp.statusText); return resp.json()}).then(function(quote)
        {
            createEmailRecipient(senderId, targetCurrency, email, quote, description, legalType);

        }).catch(function (err) {
            console.error("transferWiseAmount", err);
            alert("TransferWise payment failed\nUnable to get a quotet");
        });
    }

    var createEmailRecipient = function(senderId, targetCurrency, email, quote, description, legalType)
    {
        console.log("createEmailRecipient", senderId, targetCurrency, email, quote, description, legalType);

        var data = {
            "profile": senderId,
            "accountHolderName": description,
            "currency": targetCurrency,
            "type": "email",
            "legalType": legalType,
            "details": {
                "email": email
            }
        };

        fetch(bgWindow.pade.transferWiseUrl + '/accounts', {headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getSetting("transferWiseKey") },  method: 'POST', body: JSON.stringify(data)}).then(resp => { if (!resp.ok) throw Error(resp.statusText); return resp.json()}).then(function(recipient)
        {
            transferFund(quote, recipient);

        }).catch(function (err) {
            console.error("createEmailRecipient", err);
            alert("TransferWise payment failed\nUnable to create email recipient");
        });
    }

    var transferFund = function(quote, recipient)
    {
        console.log("transferFund", quote, recipient);

        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
        {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

        var data = {
          "targetAccount": recipient.id,
          "quote": quote.id,
          "customerTransactionId": uuid,
          "details" : {
              "reference" : "",
              "transferPurpose": "",
              "sourceOfFunds": ""
            }
         };

        fetch(bgWindow.pade.transferWiseUrl + '/transfers', {headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getSetting("transferWiseKey") },  method: 'POST', body: JSON.stringify(data)}).then(resp => { if (!resp.ok) throw Error(resp.statusText); return resp.json()}).then(function(transaction)
        {
            completeTransfer(quote, recipient, transaction);

        }).catch(function (err) {
            console.error("transferFund", err);
            alert("TransferWise payment failed\nUnable to create a transfer transaction");
        });

    }

    var completeTransfer = function(quote, recipient, transaction)
    {
        console.log("completeTransfer", quote, recipient, transaction);

        var data = {"type": "BALANCE"};

        fetch(bgWindow.pade.transferWiseUrl + '/transfers/' + transaction.id + '/payments', {headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getSetting("transferWiseKey") },  method: 'POST', body: JSON.stringify(data)}).then(resp => {if (!resp.ok) throw Error(resp.statusText); return resp.json()}).then(function(transfer)
        {
            alert("TransferWise payment transaction is " + transfer.status + ". Your transfer ID is: " + transaction.id + ".");

        }).catch(function (err) {
            console.error("completeTransfer", err);
            alert("TransferWise payment failed\nUnable to complete the transfer");
        });

    }

}));
