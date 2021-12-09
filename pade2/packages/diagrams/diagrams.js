(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var _converse = null, html;

    converse.plugins.add("diagrams", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            html = converse.env.html;

            _converse.api.listen.on('afterMessageBodyTransformed', function(text)
            {				
				renderDiagram(text);
            });

            mermaid.initialize({});

            console.debug("diagrams plugin is ready");
        }
    });

    function renderDiagram(text)
    {
		const msgId = Math.random().toString(36).substr(2,9);
        //console.debug("doDiagram", text, msgId);

        if (text.length == 0) return;

        if (text.startsWith("graph TD") ||
            text.startsWith("graph TB") ||
            text.startsWith("graph BT") ||
            text.startsWith("graph RL") ||
            text.startsWith("graph LR") ||
            text.startsWith("pie") ||
            text.startsWith("gantt") ||
            text.startsWith("stateDiagram") ||
            text.startsWith("classDiagram") ||
            text.startsWith("sequenceDiagram") ||
            text.startsWith("erDiagram")) {

            text.addTemplateResult(0, text.length, html`<br/><div id="mermaid-${msgId}" class="mermaid">\n${text.replace(/<br>/g, '\n')}\n</div>`);

            setTimeout(function()
            {
				const ele = document.querySelector("#mermaid-" + msgId);
				
				if (ele) {
					ele.innerHTML = text;
					window.mermaid.init(ele);
				}
            }, 500);
        }
        else

        if (text.startsWith("X:1"))
        {
            text.addTemplateResult(0, text.length, html`<div id="abc-${msgId}"></div>`);

            setTimeout(function()
            {
                ABCJS.renderAbc("abc-" + msgId, text.replace(/<br>/g, '\n'));
            }, 500);
        }
    }
}));
