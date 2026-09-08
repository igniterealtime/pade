export const __rspack_esm_id = 1345;
export const __rspack_esm_ids = [1345];
export const __webpack_modules__ = {
"./src/plugins/chatview/lexical-editor.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _lexical_rich_text__rspack_import_2 = __webpack_require__("./node_modules/@lexical/rich-text/dist/LexicalRichText.prod.mjs");
/* import */ var _lexical_code__rspack_import_0 = __webpack_require__("./node_modules/@lexical/code/dist/LexicalCode.prod.mjs");
/* import */ var shared_rich_composer_editor_js__rspack_import_1 = __webpack_require__("./src/shared/rich-composer/editor.js");
/* import */ var shared_rich_composer_styling_js__rspack_import_3 = __webpack_require__("./src/shared/rich-composer/styling.js");
/**
 * @copyright The Converse.js contributors
 * @license Mozilla Public License (MPLv2)
 *
 * The chat composer's Lexical configuration, layered over the shared editor in
 * {@link shared/rich-composer/editor.js}.
 *
 * Like that module this one is only ever reached through the composer's dynamic
 * `import()` on first focus, so Lexical stays out of Converse's core bundle.
 *
 * Chat serializes to XEP-0393 Message Styling: a plain-text body carrying `*bold*`,
 * `_italic_`, `~strike~`, `` `code` ``, fenced blocks and `>` quotes. That is the whole
 * wire format, so unlike the Social composer there is no separate HTML export; the body
 * we hand to `sendMessage` is exactly what a plain-textarea user could have typed.
 */





// Class names Lexical stamps on its DOM for styling hooks. Editor-only: they never reach
// the wire, since the body is serialized from the document rather than from this markup.
const THEME = {
    quote: 'chat-rich__quote',
    code: 'chat-rich__code-block',
    text: {
        bold: 'chat-rich__bold',
        italic: 'chat-rich__italic',
        strikethrough: 'chat-rich__strike',
        code: 'chat-rich__code',
    },
};

/**
 * Attach a Lexical editor configured for chat messages.
 * @param {HTMLElement} rootEl - A `contenteditable` host element.
 * @param {object} [opts]
 * @param {() => void} [opts.onChange] - Called after each edit.
 * @returns {import('shared/rich-composer/types').RichEditor}
 */
function createChatEditor(rootEl, { onChange } = {}) {
    const handle = (0,shared_rich_composer_editor_js__rspack_import_1/* .createRichEditor */.e)(rootEl, {
        namespace: 'converse-chat-compose',
        nodes: [_lexical_rich_text__rspack_import_2/* .QuoteNode */.dJ, _lexical_code__rspack_import_0/* .CodeNode */.iK],
        theme: THEME,
        // Input and output are the same set here: what you type is what goes on the wire.
        transformers: shared_rich_composer_styling_js__rspack_import_3/* .STYLING_TRANSFORMERS */.mx,
        onChange,
    });

    return {
        ...handle,
        /**
         * The body to send. Lexical escapes markdown-special characters, but XEP-0393 has
         * no escape syntax, so those backslashes would travel as literal text.
         */
        getMarkdown: () => (0,shared_rich_composer_styling_js__rspack_import_3/* .stripMarkdownEscapes */.mg)(handle.getMarkdown()),
    };
}

__webpack_require__.d(__webpack_exports__, {
  createChatEditor: () => (createChatEditor)
});


},
"./src/shared/rich-composer/editor.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var lexical__rspack_import_0 = __webpack_require__("./node_modules/lexical/dist/Lexical.prod.mjs");
/* import */ var _lexical_rich_text__rspack_import_1 = __webpack_require__("./node_modules/@lexical/rich-text/dist/LexicalRichText.prod.mjs");
/* import */ var _lexical_history__rspack_import_2 = __webpack_require__("./node_modules/@lexical/history/dist/LexicalHistory.prod.mjs");
/* import */ var _lexical_html__rspack_import_4 = __webpack_require__("./node_modules/@lexical/html/dist/LexicalHtml.prod.mjs");
/* import */ var _lexical_link__rspack_import_5 = __webpack_require__("./node_modules/@lexical/link/dist/LexicalLink.prod.mjs");
/* import */ var _lexical_markdown__rspack_import_3 = __webpack_require__("./node_modules/@lexical/markdown/dist/LexicalMarkdown.prod.mjs");
/**
 * @copyright The Converse.js contributors
 * @license Mozilla Public License (MPLv2)
 *
 * The shared Lexical integration behind Converse's rich composers.
 *
 * **Every Lexical import lives in this module and its callers' config modules**, which
 * composers load with a dynamic `import()` on first focus, so the whole editor is split
 * into its own chunk and stays out of Converse's core bundle. Nothing here may be
 * imported statically from a composer (see {@link ./triggers.js} for the constants that
 * composers *do* need eagerly).
 *
 * Consumers serialize to different wire formats. The Social composer publishes
 * GitHub-flavoured Markdown, while chat sends XEP-0393 message styling.
 * The transformer sets are therefore injected rather than baked in.
 *
 * Note that input and output are separate sets. Lexical uses transformers both for
 * typing shortcuts and for serialization, but the two need not agree. That separation is
 * what lets every composer share one typing experience even though the generated wire
 * format differs. Since the editor is WYSIWYG, the differing output is invisible to the
 * user.
 *
 * Exposes a small, framework-agnostic handle so Lit components never touch Lexical
 * internals directly.
 */








/**
 * If the collapsed caret sits right after `regex`'s trigger token, return the typed
 * query (the regex's first capture), else `null`. Must run inside an editor state read.
 * @param {RegExp} regex
 * @returns {string|null}
 */
function $getTriggerQuery(regex) {
    const selection = (0,lexical__rspack_import_0/* .$getSelection */.vJq)();
    if (!(0,lexical__rspack_import_0/* .$isRangeSelection */.I2P)(selection) || !selection.isCollapsed()) return null;

    const node = selection.anchor.getNode();
    if (!(0,lexical__rspack_import_0/* .$isTextNode */.kFe)(node)) return null;

    const before = node.getTextContent().slice(0, selection.anchor.offset);
    return before.match(regex)?.[1] ?? null;
}

/**
 * Locate the trigger token ending at the collapsed caret, returning the text node and
 * the offsets it spans, or `null` if the caret has since moved off it. Must run inside
 * an editor update.
 * @param {string} trigger - The full trigger text, e.g. `:smile` or `@alice`.
 */
function $getTriggerRange(trigger) {
    const selection = (0,lexical__rspack_import_0/* .$getSelection */.vJq)();
    if (!(0,lexical__rspack_import_0/* .$isRangeSelection */.I2P)(selection) || !selection.isCollapsed()) return null;

    const node = selection.anchor.getNode();
    if (!(0,lexical__rspack_import_0/* .$isTextNode */.kFe)(node)) return null;

    const end = selection.anchor.offset;
    if (!node.getTextContent().slice(0, end).endsWith(trigger)) return null;

    return { node, start: end - trigger.length, end };
}

/**
 * Attach a Lexical rich-text editor to `rootEl` and return a small handle.
 * @param {HTMLElement} rootEl - A `contenteditable` host element.
 * @param {import('./types').RichEditorOptions} opts
 * @returns {import('./types').RichEditor}
 */
function createRichEditor(
    rootEl,
    {
        namespace = 'converse-rich-composer',
        nodes = [],
        theme = {},
        transformers,
        input_transformers,
        html_export,
        onChange,
    },
) {
    const editor = (0,lexical__rspack_import_0/* .createEditor */.ieJ)({
        namespace,
        nodes,
        theme,
        ...(html_export ? { html: { export: html_export } } : {}),
        onError: (e) => {
            // Surface Lexical's internal errors rather than swallowing them.
            throw e;
        },
    });
    editor.setRootElement(rootEl);

    const cleanup = (0,lexical__rspack_import_0/* .mergeRegister */.Sdt)(
        (0,_lexical_rich_text__rspack_import_1/* .registerRichText */.ZI)(editor),
        (0,_lexical_history__rspack_import_2/* .registerHistory */._M)(editor, (0,_lexical_history__rspack_import_2/* .createEmptyHistoryState */.ht)(), 1000),
        (0,_lexical_markdown__rspack_import_3/* .registerMarkdownShortcuts */.iM)(editor, input_transformers ?? transformers),
        onChange ? editor.registerUpdateListener(() => onChange()) : () => {},
    );

    return {
        editor,

        /** Serialize the document through the output transformers. */
        getMarkdown: () => editor.getEditorState().read(() => (0,_lexical_markdown__rspack_import_3/* .$convertToMarkdownString */.bk)(transformers)),

        /**
         * Replace the document with `text`, parsed through the same output transformers.
         * Used to restore a draft or load a message being corrected.
         *
         * Committed discretely, so callers can read the document straight back rather than
         * waiting for Lexical's normal (asynchronous) reconciliation.
         * @param {string} text
         */
        setMarkdown: (text) =>
            editor.update(
                () => {
                    (0,_lexical_markdown__rspack_import_3/* .$convertFromMarkdownString */.Wn)(text ?? '', transformers);
                    // Leave the caret at the end, where someone loading a draft or a message
                    // to correct would carry on typing. Without this the document has no
                    // selection at all, and nothing can tell where the caret notionally is.
                    (0,lexical__rspack_import_0/* .$getRoot */.NiT)().selectEnd();
                },
                { discrete: true },
            ),

        /** Serialize the document to HTML (normalised to XHTML by the caller, if needed). */
        getHtml: () => editor.getEditorState().read(() => (0,_lexical_html__rspack_import_4/* .$generateHtmlFromNodes */.g2)(editor, null)),

        isEmpty: () => editor.getEditorState().read(() => (0,lexical__rspack_import_0/* .$getRoot */.NiT)().getTextContent().trim().length === 0),

        // Discrete, like setMarkdown: callers routinely insert and then read the document
        // straight back (the composer serializes it to send), and Lexical's default
        // asynchronous commit would hand them the state from before the insert.
        insertText: (text) =>
            editor.update(
                () => {
                    let selection = (0,lexical__rspack_import_0/* .$getSelection */.vJq)();
                    if (!(0,lexical__rspack_import_0/* .$isRangeSelection */.I2P)(selection)) {
                        // Focus may sit elsewhere (e.g. an emoji picker) so there is no live
                        // range selection: fall back to appending at the very end.
                        (0,lexical__rspack_import_0/* .$getRoot */.NiT)().selectEnd();
                        selection = (0,lexical__rspack_import_0/* .$getSelection */.vJq)();
                    }
                    if ((0,lexical__rspack_import_0/* .$isRangeSelection */.I2P)(selection)) selection.insertText(text);
                },
                { discrete: true },
            ),

        /** Toggle an inline format on the selection: 'bold' | 'italic' | 'strikethrough' | 'code'. */
        format: (type) => editor.dispatchCommand(lexical__rspack_import_0/* .FORMAT_TEXT_COMMAND */.mB, type),

        /**
         * Whether a collapsed caret sits at the very start of the document. Stands in for
         * a textarea's `selectionEnd === 0`, which a contenteditable has no equivalent of.
         * An empty document counts as both start and end.
         */
        isCaretAtStart: () =>
            editor.getEditorState().read(() => {
                // An untouched editor has no selection at all, and an empty document has
                // nowhere else for the caret to be.
                if ((0,lexical__rspack_import_0/* .$getRoot */.NiT)().getTextContent().length === 0) return true;
                const selection = (0,lexical__rspack_import_0/* .$getSelection */.vJq)();
                if (!(0,lexical__rspack_import_0/* .$isRangeSelection */.I2P)(selection) || !selection.isCollapsed()) return false;
                if (selection.anchor.offset !== 0) return false;
                const first = (0,lexical__rspack_import_0/* .$getRoot */.NiT)().getFirstDescendant();
                return first === null || selection.anchor.getNode().is(first);
            }),

        /** Whether a collapsed caret sits at the very end of the document. */
        isCaretAtEnd: () =>
            editor.getEditorState().read(() => {
                if ((0,lexical__rspack_import_0/* .$getRoot */.NiT)().getTextContent().length === 0) return true;
                const selection = (0,lexical__rspack_import_0/* .$getSelection */.vJq)();
                if (!(0,lexical__rspack_import_0/* .$isRangeSelection */.I2P)(selection) || !selection.isCollapsed()) return false;
                const last = (0,lexical__rspack_import_0/* .$getRoot */.NiT)().getLastDescendant();
                if (last === null) return true;
                const node = selection.anchor.getNode();
                return node.is(last) && selection.anchor.offset === node.getTextContent().length;
            }),

        /**
         * If the collapsed caret sits right after `regex`'s trigger token, return the
         * typed query, else `null`. Drives a composer's inline typeahead; see
         * {@link ./triggers.js} for the shared patterns.
         * @param {RegExp} regex
         */
        getTriggerQuery: (regex) => editor.getEditorState().read(() => $getTriggerQuery(regex)),

        /**
         * Replace the trigger token immediately before the caret with `replacement`
         * (e.g. a resolved emoji glyph). A no-op if the caret has since moved off the
         * trigger. The caret ends up just after the replacement.
         * @param {string} trigger - The full trigger text, e.g. `:smile`.
         * @param {string} replacement
         */
        replaceTrigger: (trigger, replacement) =>
            editor.update(() => {
                const range = $getTriggerRange(trigger);
                if (!range) return;
                range.node.spliceText(range.start, trigger.length, replacement, true);
            }),

        /**
         * Replace the trigger token immediately before the caret with a link (`text`
         * linking to `url`), followed by a space. Serialized by a LINK transformer as
         * `[text](url)`, so only formats that have link syntax should use this. A no-op
         * if the caret has since moved off the trigger.
         * @param {string} trigger - The full trigger text, e.g. `@alice`.
         * @param {string} text - The link's text, e.g. `@Alice`.
         * @param {string} url - The link's target, e.g. `xmpp:alice@example.org`.
         */
        replaceTriggerWithLink: (trigger, text, url) =>
            editor.update(() => {
                const range = $getTriggerRange(trigger);
                if (!range) return;

                // Isolate the trigger's text node, then swap it for the link.
                const parts = range.node.splitText(range.start, range.end);
                const target = parts[range.start === 0 ? 0 : 1];
                const link = (0,_lexical_link__rspack_import_5/* .$createLinkNode */.zA)(url);

                link.append((0,lexical__rspack_import_0/* .$createTextNode */.sTu)(text));
                target.replace(link);

                const space = (0,lexical__rspack_import_0/* .$createTextNode */.sTu)(' ');
                link.insertAfter(space);
                space.select(1, 1);
            }),

        clear: () =>
            editor.update(
                () => {
                    (0,lexical__rspack_import_0/* .$getRoot */.NiT)().clear();
                },
                { discrete: true },
            ),

        /** Put the caret at the very start, as arrowing up does in a real browser. */
        selectStart: () => editor.update(() => (0,lexical__rspack_import_0/* .$getRoot */.NiT)().selectStart(), { discrete: true }),

        focus: () => editor.focus(),

        destroy: () => {
            cleanup();
            editor.setRootElement(null);
        },
    };
}

__webpack_require__.d(__webpack_exports__, {
  e: () => (createRichEditor)
});


},
"./src/shared/rich-composer/styling.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _lexical_markdown__rspack_import_0 = __webpack_require__("./node_modules/@lexical/markdown/dist/LexicalMarkdown.prod.mjs");
/**
 * @copyright The Converse.js contributors
 * @license Mozilla Public License (MPLv2)
 *
 * Lexical transformer sets for XEP-0393 Message Styling, the format chat sends on the
 * wire.
 *
 * XEP-0393 belongs to the *chat* family of markup (as used by Slack and WhatsApp) rather
 * than the CommonMark lineage, so a single `*` means **bold**, not italic:
 *
 *   XEP-0393    `*bold*`  `_italic_`  `~strike~`  `` `code` ``  `> quote`
 *   CommonMark  `**bold**`  `_italic_`  `~~strike~~`  `` `code` ``  `> quote`
 *
 * Several of Lexical's built-ins already agree with XEP-0393, so only bold and strikethrough
 * need defining here.
 *
 * Like the rest of the editor layer this module pulls in Lexical, so it must only ever be
 * reached through a composer's dynamic `import()`.
 */


/** `*bold*` (CommonMark would read this as italic). */
const BOLD_SINGLE_STAR = { format: ['bold'], tag: '*', type: 'text-format' };

/** `~strike~` (CommonMark requires a doubled `~~`). */
const STRIKE_SINGLE_TILDE = { format: ['strikethrough'], tag: '~', type: 'text-format' };

/**
 * The full XEP-0393 set, for chat's input *and* output.
 *
 * Consumers must register the nodes these need: `QuoteNode` (from `@lexical/rich-text`)
 * and `CodeNode` (from `@lexical/code`).
 */
const STYLING_TRANSFORMERS = [
    _lexical_markdown__rspack_import_0/* .CODE */.Sq, // '```' preformatted block (XEP-0393 § 5.1.2); must precede the span directives
    _lexical_markdown__rspack_import_0/* .QUOTE */.jA, // '>' quote, an element transformer
    BOLD_SINGLE_STAR,
    _lexical_markdown__rspack_import_0/* .ITALIC_UNDERSCORE */.gW,
    STRIKE_SINGLE_TILDE,
    _lexical_markdown__rspack_import_0/* .INLINE_CODE */.Up,
];

// Lexical escapes markdown-special characters when serializing, so a URL like
// `.../Ender's_Game` comes out as `.../Ender's\_Game`. XEP-0393 defines no escape syntax
// at all, so that backslash is not an escape on the wire: it is a literal character the
// recipient would render. Undo it.
const MARKDOWN_ESCAPE = /\\([\\*_~`>])/g;

/**
 * Strip the backslash escapes Lexical adds, which XEP-0393 has no notion of.
 * @param {string} text
 * @returns {string}
 */
function stripMarkdownEscapes(text) {
    return text.replace(MARKDOWN_ESCAPE, '$1');
}

/**
 * Build a typing-shortcut set that accepts XEP-0393's single-character markers *on top of*
 * a consumer's own set, so every composer shares one typing experience regardless of what
 * it serializes to.
 *
 * Callers must drop any transformer that claims a conflicting single `*` (CommonMark's
 * ITALIC_STAR), otherwise the two fight over the same tag. Doubled tags are kept and
 * ordered first, so typing `**bold**` still works for anyone used to CommonMark.
 *
 * @param {Array<any>} transformers - The consumer's own set (usually its output set).
 * @returns {Array<any>} A set suitable for `input_transformers`.
 */
function withStylingShortcuts(transformers) {
    const conflicting = new Set(['*', '~']);

    // Longer tags first: '**' must be tried before '*', else it matches as an empty bold.
    const kept = transformers.filter((t) => !(t.type === 'text-format' && conflicting.has(t.tag)));
    return [...kept, BOLD_SINGLE_STAR, STRIKE_SINGLE_TILDE];
}

__webpack_require__.d(__webpack_exports__, {
  Af: () => (withStylingShortcuts),
  mg: () => (stripMarkdownEscapes)
}, {
  mx: STYLING_TRANSFORMERS
});


},

};

//# sourceMappingURL=1345.js.map