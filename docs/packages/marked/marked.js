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

			renderer.em = function(text) {
				return '*' + text + '*';
			};	

			renderer.blockquote = function(quote) {
				return '';
			};			
			
			marked.setOptions({
			  renderer: renderer
			});			
		
            _converse.api.listen.on('afterMessageBodyTransformed', function(text)
            {
				//console.debug("afterMessageBodyTransformed", text);
								
				if (text.indexOf('\n') != text.lastIndexOf('\n')) {	// apply only to paragraphs of text
					const parsed = marked.parse(text.toString());
					text.addTemplateResult(0, text.length, html([parsed]));
				}
            });
			
           console.debug("marked plugin is ready");
        }
    });

}));
