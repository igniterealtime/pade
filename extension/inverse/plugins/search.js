(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
    var searchDialog = null;

    converse.plugins.add("search", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            searchDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                },
                toHTML() {
                  return '<div class="modal" id="myModal"> <div class="modal-dialog"> <div class="modal-content">' +
                         '<div class="modal-header">' +
                         '  <h4 class="modal-title">Search</h4>' +
                         '  <button type="button" class="close" data-dismiss="modal">&times;</button>' +
                         '</div>' +
                         '<div class="modal-body"> Results.. </div>' +
                         '<div class="modal-footer"> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
                         '</div> </div> </div>';
                }
            });

            console.log("search plugin is ready");
        },

        'overrides': {
            ChatBoxView: {

                renderToolbar: function renderToolbar(toolbar, options) {
                    var result = this.__super__.renderToolbar.apply(this, arguments);

                    if (bgWindow)
                    {
                        var view = this;
                        var id = this.model.get("box_id");

                        var html = '<li id="pade-search-' + id + '"><a class="fa fa-search" title="Search"></a></li>';

                        $(this.el).find('.toggle-toolbar-menu .toggle-smiley dropup').after('<li id="place-holder"></li>');
                        $(this.el).find('#place-holder').after(html);

                        setTimeout(function()
                        {
                            var search = document.getElementById("pade-search-" + id);

                            search.addEventListener('click', function(evt)
                            {
                                evt.stopPropagation();

                                new searchDialog().show();

                            }, false);
                        });
                    }

                    return result;
                }
            }
        }
    });
}));
