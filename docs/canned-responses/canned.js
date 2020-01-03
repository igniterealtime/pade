(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var CannedDialog = null;
    var cannedDialog = null;
    var _converse = null;

    converse.plugins.add("canned", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            CannedDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">Canned Responses</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body">' +
                         '<input id="pade-canned-responses" class="form-control" type="text" placeholder="Start typing to canned" ><p/><div id="pade-canned-results"></div>' +
                         '</div>' +
                         '<div class="modal-footer"> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
                         '</div> </div> </div>';
                },
                events: {
                    'keyup #pade-canned-responses': 'keyUp'
                },

                keyUp(ev) {
                    if (ev.key === "Enter")
                    {
                        var response = this.el.querySelector("#pade-canned-responses").value.trim();
                        this.model.set("response", response)
                        this.doCannedResponses();
                    }
                },

                doCannedResponses() {
                    var that = this;
                    var textArea = that.model.get("textArea");
                    var response = that.model.get("response");
                    var responses = that.model.get("responses");

                    if (response != "" && responses)
                    {
                        var cannedResults = that.el.querySelector("#pade-canned-results");
                        var html = "<table style='margin-left: 15px'><tr><th>Response</th><th>Description</th></tr>";
                        var count = 0;

                        for (var i = 0; i < responses.length; i++)
                        {
                            if (response.length == 0 || responses[i].name.indexOf(response) > -1 || responses[i].description.toLowerCase().indexOf(response.toLowerCase()) > -1)
                            {
                                html = html + "<tr><td width='30%'>" + responses[i].name + "</td><td><a id='resp-" + count + "' href='#' title='click here to pate in input area'>" + responses[i].description + "</a></td></tr>";
                                count++;
                            }
                        }

                        cannedResults.innerHTML = html;

                        setTimeout(function()
                        {
                            for (var i = 0; i < count; i++)
                            {
                                that.el.querySelector("#resp-" + i).addEventListener("click", function(e)
                                {
                                    e.stopPropagation();
                                    textArea.value = e.target.innerText;

                                }, false);
                            }
                        },1000);
                    }
                }
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                const id = view.model.get("box_id");
                const textArea = view.el.querySelector('.chat-textarea');
                const canned = addToolbarItem(view, id, "pade-canned-" + id, '<a class="far fa-save" title="Canned Responses/Replies"></a>');

                canned.addEventListener('click', function(evt)
                {
                    evt.stopPropagation();

                    var responses = getAnswersListFromStorage()
                    console.log("canned", responses);

                    cannedDialog = new CannedDialog({ 'model': new converse.env.Backbone.Model({responses: responses, textArea: textArea}) });
                    cannedDialog.show();

                }, false);
            });

            console.log("canned plugin is ready");
        }
    });

    function newElement (el, id, html, className)
    {
        var ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        if (className) ele.classList.add(className);
        document.body.appendChild(ele);
        return ele;
    }

    function addToolbarItem (view, id, label, html)
    {
        let placeHolder = view.el.querySelector('#place-holder');

        if (!placeHolder)
        {
            const toolbar = view.el.querySelector('.chat-toolbar');
            toolbar.appendChild(newElement('li', 'place-holder'));
            placeHolder = view.el.querySelector('#place-holder');
        }
        var newEle = newElement('li', label, html);
        placeHolder.insertAdjacentElement('afterEnd', newEle);
        return newEle;
    }

    var getAnswersListFromStorage  = function()
    {
        var localStorageKey = "store.settings.cannedResponses";
        var saved = localStorage.getItem(localStorageKey);
        var answers = [];

        if (saved && saved != '')
        {
            answers = JSON.parse(localStorage.getItem(localStorageKey));
        }
        return answers;
    }

}));
