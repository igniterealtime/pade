(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var _converse = null;

    converse.plugins.add("marked", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

			var renderer = new marked.Renderer();

			renderer.link = function(href, title, text) {
				return renderImage(href, title, text);
			}
			
			renderer.image = function(href, title, text) {
				return renderImage(href, title, text);
			}
			
			marked.setOptions({
			  renderer: renderer
			});			
		
            _converse.api.listen.on('beforeMessageBodyTransformed', function(text)
            {
				//console.debug("beforeMessageBodyTransformed", text);
								
				if (text.indexOf('\n') != text.lastIndexOf('\n')) {	// apply only to paragraphs of text
					const parsed = marked.parse(text.toString());
					text.render_styling = false;
					text.references = [{begin: 0,  end: text.length,  template: html([parsed]) }];					
				}
            });
			
           console.debug("marked plugin is ready");
        }
    });
	
	function renderImage(href, title, text) {
		if (!title) title = href;
		const types = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg'];
		const image = !!types.filter(ext => href.endsWith(ext)).length;	
		return `<a title=${title} href=${href}>` + (image ? `<img src=${href}>` : text) + `</a>`;
	}
}));
