(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var _converse = null, html, __;

    converse.plugins.add("vmsg", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            html = converse.env.html;
            __ = _converse.__;

			class VmsgDialog extends _converse.exports.BaseModal {
				
                initialize() {
					super.initialize();					
					this.listenTo(this.model, "change", () => this.requestUpdate());

					this.addEventListener('shown.bs.modal', () => 
					{
						this.querySelector('.btn-upload-vmsg').addEventListener('click', (ev) => { 
							this.uploadVmsg(ev);
						});
					});				
                }
				
				renderModal() {
                  var view = this.model.get("view");
                  var id = view.model.get("id").split("@")[0];

                  return html`<div class="modal-dialog"> <div class="modal-content">
                         <div class="modal-header">
                           <h1 class="modal-title">Voice Message</h1>
                           <button type="button" class="close" data-dismiss="modal">&times;</button>
                         </div>
                         <div class="modal-body"><iframe id="iframe-vmsg-${id}" src="packages/vmsg/index.html" style="width:100%; height:300px; border:none; margin:0; padding:0; overflow:hidden;"></iframe></div>
                         <div class="modal-footer"> <button type="button" class="btn btn-success btn-upload-vmsg" data-dismiss="modal">Send</button> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>
                         </div> </div>`;
                }

                uploadVmsg() {
                    var view = this.model.get("view");
                    var id = view.model.get("id").split("@")[0];
                    var mp3File = this.el.querySelector("#iframe-vmsg-" + id).contentWindow.getMp3File();

                    console.log("upload vmsg", mp3File, id);

                    if (!mp3File)
                    {
                        alert("Nothing to upload!!");
                        return;
                    }
                    view.model.sendFiles([mp3File]);
                }
            }
			
			_converse.api.elements.define('converse-pade-vmsg-dialog', VmsgDialog);			

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
				let style = "width:18px; height:18px; fill:var(--chat-color);";
				if (toolbar_el.model.get("type") === "chatroom") {
					style = "width:18px; height:18px; fill:var(--muc-color);";
				}

                buttons.push(html`
                    <button class="btn plugin-vmsg" title="${__('Voice Message. Click to create')}" @click=${performVmsg}/>
                        <svg style="${style}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g><path d="M 14,25.808L 14,30 L 11,30 C 10.448,30, 10,30.448, 10,31C 10,31.552, 10.448,32, 11,32l 4.98,0 L 16.020,32 l 4.98,0 c 0.552,0, 1-0.448, 1-1c0-0.552-0.448-1-1-1L 18,30 l0-4.204 c 4.166-0.822, 8-4.194, 8-9.796L 26,13 C 26,12.448, 25.552,12, 25,12 S 24,12.448, 24,13L 24,16 c0,5.252-4.026,8-8,8c-3.854,0-8-2.504-8-8L 8,13 C 8,12.448, 7.552,12, 7,12S 6,12.448, 6,13L 6,16 C 6,21.68, 9.766,25.012, 14,25.808zM 16,20c 2.21,0, 4-1.79, 4-4L 20,4 c0-2.21-1.79-4-4-4S 12,1.79, 12,4l0,12 C 12,18.21, 13.79,20, 16,20z"></path></g></svg>
                    </button>
                `);

                return buttons;
            });

            console.debug("vmsg plugin is ready");
        }
    });

    function performVmsg(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();

		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));
		
		const model = new converse.env.Model();
		model.set({ view: chatview});
		_converse.api.modal.show('converse-pade-vmsg-dialog', { model });			
    }
}));
