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
                  var jid = view.model.get("jid");
                  var email = view.model.vcard.get("email");
                  var label = view.model.getDisplayName() + " (" + (view.model.get("profile") ? "Direct" : email) + ") ";

                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-md"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">TransferWise Payment to ' + label + '</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body">' +
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
                         '  <label for="tw-amount-source" class="col-form-label">Source Amount:</label>' +
                         '  <input id="tw-amount-source" type="text" class="form-control" name="tw-amount-source" value="" placeholder="Enter this or target amount, but not both"/>' +
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
                         '  <label for="tw-amount-target" class="col-form-label">Target Amount:</label>' +
                         '  <input id="tw-amount-target" type="text" class="form-control" name="tw-amount-target" value="" placeholder="Enter this or source amount, but not both"/>' +
                         '</div>' +
                         '<div class="form-group">' +
                         '  <label for="tw-estimated-delivery" class="col-form-label">Estimated Delivery:</label>' +
                         '  <input disabled="true" id="tw-estimated-delivery" type="text" class="form-control" name="tw-estimated-delivery" value=""/>' +
                         '  <label for="tw-fee" class="col-form-label">Fee:</label>' +
                         '  <input disabled="true" id="tw-fee" type="text" class="form-control" name="tw-fee" value=""/>' +
                         '  <label for="tw-rate" class="col-form-label">Rate:</label>' +
                         '  <input disabled="true" id="tw-rate" type="text" class="form-control" name="tw-rate" value=""/>' +
                         '</div>' +
                         '<div class="form-group">' +
                         '  <label for="tw-description" class="col-form-label">Description:</label>' +
                         '  <input id="tw-description" type="text" class="form-control" name="tw-descriptiont" value="' + label + '"/>' +
                         '</div>' +
                         '</div><div class="modal-footer"><button data-twstatus="getquote" type="button" class="btn btn-success btn-transfer">Get Quote</button> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button></div>' +
                         '</div> </div> </div>';
                },
                events: {
                    "click .btn-transfer": "doTransferWise"
                },

                doTransferWise() {
                    doTransferWise(this.model.get("view"), this.el);
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                if (bgWindow && bgWindow.pade)
                {
                    var id = view.model.get("box_id");
                    var jid = view.model.get("jid");
                    var email = view.model.vcard.get("email");
                    var url = view.model.vcard.get("url");

                    if (view.model.get('type') === "chatbox" && bgWindow.pade.transferWiseProfile && bgWindow.pade.transferWiseProfile.length > 0 && email && getSetting("showToolbarIcons", true))
                    {
                        var transferWiseButton = padeapi.addToolbarItem(view, id, "webmeet-transferwise-" + id, '<a class="plugin-transferwise fa" title="TransferWise. Click to open"><img height="16" src="plugins/css/images/transferwise.svg"/></a>');

                        if (transferWiseButton)
                        {
                            transferWiseButton.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                if (!transferWiseDialog)
                                {
                                    transferWiseDialog = new TransferWiseDialog({'model': new converse.env.Backbone.Model({view: view}) });
                                }
                                else {
                                    transferWiseDialog.model.set("view", view);
                                }
                                transferWiseDialog.show();

                            }, false);
                        }
                    }

                    if (getSetting("enablePayPalMe", false) && url && url.indexOf("https://www.paypal.me/") > -1)
                    {
                        var payPalMe = padeapi.addToolbarItem(view, id, "webmeet-paypalme-" + id, '<a class="plugin-paypalme fa" title="PayPal Me. Click to open"><img height="16" src="plugins/css/images/pp-acceptance-small.png"/></a>');

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
                            if (!transferWiseDialog)
                            {
                                transferWiseDialog = new TransferWiseDialog({'model': new converse.env.Backbone.Model({view: this}) });
                            }
                            else {
                                transferWiseDialog.model.set("view", this);
                            }
                            transferWiseDialog.show();
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

    var doTransferWise = function(view, form)
    {
        console.debug("doTransferWise", view, form);

        var button = form.querySelector(".btn-transfer");

        if (button.getAttribute("data-twstatus") == "getquote")
        {
            getTransferWiseQuote(view, form);
        }
        else

        if (button.getAttribute("data-twstatus") == "transfer")
        {
            transferAmount(view, form);
        }
        else

        if (button.getAttribute("data-twstatus") == "reciept")
        {
            downloadReciept(view, form);
        }
    }

    var getTransferWiseQuote = function(view, form)
    {
        var profile = form.querySelector("#tw-profile").value.trim();
        var sourceCurrency = form.querySelector("#tw-currency-source").value.trim();
        var targetCurrency = form.querySelector("#tw-currency-target").value.trim();
        var sourceAmount = form.querySelector("#tw-amount-source").value.trim();
        var targetAmount = form.querySelector("#tw-amount-target").value.trim();
        var description = form.querySelector("#tw-description").value.trim();
        var button = form.querySelector(".btn-transfer");

        var label = view.model.getDisplayName();
        var email = view.model.vcard.get("email");
        var jid = view.model.get("jid");
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

        console.debug("getTransferWiseQuote", jid, label, email, profile, sourceCurrency, targetCurrency, sourceAmount, targetAmount, senderId, description);

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
        else {
            alert("Enter a source or target amount");
            return;
        }


        fetch(bgWindow.pade.transferWiseUrl + '/quotes', {headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getSetting("transferWiseKey") },  method: 'POST', body: JSON.stringify(data)}).then(resp => {if (!resp.ok) throw Error(resp.statusText); return resp.json()}).then(function(quote)
        {
            view.model.set("twQuote", quote);
            view.model.set("legalType", legalType);

            form.querySelector("#tw-amount-source").value = quote.sourceAmount;
            form.querySelector("#tw-amount-target").value = quote.targetAmount;

            form.querySelector("#tw-amount-source").setAttribute("disabled", true);
            form.querySelector("#tw-amount-target").setAttribute("disabled", true);
            form.querySelector("#tw-currency-source").setAttribute("disabled", true);
            form.querySelector("#tw-currency-target").setAttribute("disabled", true);
            form.querySelector("#tw-profile").setAttribute("disabled", true);
            form.querySelector("#tw-description").setAttribute("disabled", true);

            form.querySelector("#tw-estimated-delivery").value = (new Date(quote.deliveryEstimate)).toString();
            form.querySelector("#tw-fee").value = quote.fee;
            form.querySelector("#tw-rate").value = quote.rate;

            button.setAttribute("data-twstatus", "transfer");
            button.innerHTML = "Transfer";

        }).catch(function (err) {
            console.error("transferWiseAmount", err);
            alert("TransferWise payment failed\nUnable to get a quotet");
        });
    }

    var transferAmount = function(view, form)
    {
        console.log("transferAmount", view, form);

        var senderId = bgWindow.pade.transferWiseProfile[0].id;
        var targetCurrency = form.querySelector("#tw-currency-target").value.trim();
        var email = view.model.vcard.get("email");
        var quote = view.model.get("twQuote");
        var description = form.querySelector("#tw-description").value.trim();
        var legalType = view.model.get("legalType");

        createEmailRecipient(view, form, senderId, targetCurrency, email, quote, description, legalType);
    }

    var createEmailRecipient = function(view, form, senderId, targetCurrency, email, quote, description, legalType)
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
            transferFund(view, form, quote, recipient);

        }).catch(function (err) {
            console.error("createEmailRecipient", err);
            alert("TransferWise payment failed\nUnable to create email recipient");
        });
    }

    var transferFund = function(view, form, quote, recipient)
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
            if (confirm("Pleae confirm transfer. Are you sure?"))
            {
                completeTransfer(view, form, quote, recipient, transaction);
            }

        }).catch(function (err) {
            console.error("transferFund", err);
            alert("TransferWise payment failed\nUnable to create a transfer transaction");
        });

    }

    var completeTransfer = function(view, form, quote, recipient, transaction)
    {
        console.log("completeTransfer", quote, recipient, transaction);

        var data = {"type": "BALANCE"};

        fetch(bgWindow.pade.transferWiseUrl + '/transfers/' + transaction.id + '/payments', {headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getSetting("transferWiseKey") },  method: 'POST', body: JSON.stringify(data)}).then(resp => {if (!resp.ok) throw Error(resp.statusText); return resp.json()}).then(function(transfer)
        {
            view.model.set("twTransfer", transfer);
            view.model.set("twTransaction", transaction);

            alert("TransferWise payment transaction is " + transfer.status + ". Your transfer ID is: " + transaction.id + ".");

            if (transaction.status == "outgoing_payment_sent")
            {
                var button = form.querySelector(".btn-transfer");
                button.setAttribute("data-twstatus", "reciept");
                button.innerHTML = "Receipt";
            }
            var url = "https://transferwise.com/request/transferReceipt/" + transaction.id;
            submitMessage(view, url);

        }).catch(function (err) {
            console.error("completeTransfer", err);
            alert("TransferWise payment failed\nUnable to complete the transfer");
        });
    }

    var downloadReciept = function(view, form)
    {
        console.log("downloadReciept", view, form);

        var transaction = view.model.get("twTransaction");

        fetch(bgWindow.pade.transferWiseUrl + '/transfers/' + transaction.id + '/receipt.pdf', {headers: {Authorization: 'Bearer ' + getSetting("transferWiseKey") },  method: 'GET'}).then(resp => { if (!resp.ok) throw Error(resp.statusText); return resp.blob()}).then(function(blob)
        {
            chrome.downloads.download({url: URL.createObjectURL(blob)});

        }).catch(function (err) {
            console.error("downloadReciept", err);
            alert("TransferWise reciept failed\nUnable to get reciept for a transfer transaction");
        });
    }

    var submitMessage = function(view, msg)
    {
        view.model.sendMessage(msg);
    }

}));
