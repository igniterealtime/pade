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
				let body = "";
                for (let i=0; i<text.length; i++) body = body + text[i];				
				renderDiagram(body, text);
            });

            mermaid.initialize({});

            console.debug("diagrams plugin is ready");
        }
    });

    function renderDiagram(body, text)
    {
		const msgId = Math.random().toString(36).substr(2,9);
        console.debug("doDiagram", body, text, msgId);

        if (body.length == 0) return;

        if (body.startsWith("graph TD") ||
            body.startsWith("graph TB") ||
            body.startsWith("graph BT") ||
            body.startsWith("graph RL") ||
            body.startsWith("graph LR") ||
            body.startsWith("pie") ||
            body.startsWith("gantt") ||
            body.startsWith("stateDiagram") ||
            body.startsWith("classDiagram") ||
            body.startsWith("sequenceDiagram") ||
            body.startsWith("erDiagram")) {

            text.addTemplateResult(0, body.length, html`<br/><div id="mermaid-${msgId}" class="mermaid">\n${body.replace(/<br>/g, '\n')}\n</div>`);

            setTimeout(function()
            {
				const ele = document.querySelector("#mermaid-" + msgId);
				
				if (ele) {
					ele.innerHTML = body;
					window.mermaid.init(ele);
				}
            }, 500);
        }
        else

        if (body.startsWith("X:1"))
        {
            text.addTemplateResult(0, body.length, html`<div id="abc-${msgId}"></div>`);

            setTimeout(function()
            {
                ABCJS.renderAbc("abc-" + msgId, body.replace(/<br>/g, '\n'));
            }, 500);
        }
    }
}));
