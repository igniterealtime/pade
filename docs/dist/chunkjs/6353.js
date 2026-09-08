export const __rspack_esm_id = 6353;
export const __rspack_esm_ids = [6353];
export const __webpack_modules__ = {
"./src/apps/social/lexical-editor.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _lexical_rich_text__rspack_import_3 = __webpack_require__("./node_modules/@lexical/rich-text/dist/LexicalRichText.prod.mjs");
/* import */ var _lexical_link__rspack_import_1 = __webpack_require__("./node_modules/@lexical/link/dist/LexicalLink.prod.mjs");
/* import */ var _lexical_markdown__rspack_import_0 = __webpack_require__("./node_modules/@lexical/markdown/dist/LexicalMarkdown.prod.mjs");
/* import */ var shared_rich_composer_editor_js__rspack_import_2 = __webpack_require__("./src/shared/rich-composer/editor.js");
/* import */ var shared_rich_composer_styling_js__rspack_import_4 = __webpack_require__("./src/shared/rich-composer/styling.js");
/* import */ var shared_rich_composer_triggers_js__rspack_import_5 = __webpack_require__("./src/shared/rich-composer/triggers.js");
/**
 * @copyright The Converse.js contributors
 * @license Mozilla Public License (MPLv2)
 *
 * The Social composer's Lexical configuration: transformer set, theme and node types,
 * layered over the shared editor in {@link shared/rich-composer/editor.js}.
 *
 * Like that module, this one is only ever reached through the composer's dynamic
 * `import()` on first focus, so both stay out of Converse's core bundle.
 *
 * It re-exposes the shared handle with mention/emoji-specific wrappers, so the composer
 * talks in terms of its own triggers rather than passing regexes around.
 */







// A curated transformer set: the inline styles and blocks a social post needs,
// serialized as standard (GitHub-flavoured-compatible) Markdown so Movim reads
// the `<content type="text">` we publish. Lists and fenced code blocks are left
// out for now (they need extra nodes/packages); images will be a
// TEXT_MATCH transformer later. Mentions are plain LinkNodes (`[@Name](xmpp:jid)`
// via LINK), so an XMPP client renders them as profile links and the renostr
// bridge can translate them to NIP-27 `nostr:` mentions.
const TRANSFORMERS = [
    _lexical_markdown__rspack_import_0/* .HEADING */.TB,
    _lexical_markdown__rspack_import_0/* .QUOTE */.jA,
    _lexical_markdown__rspack_import_0/* .BOLD_ITALIC_STAR */.eA,
    _lexical_markdown__rspack_import_0/* .BOLD_ITALIC_UNDERSCORE */.gb,
    _lexical_markdown__rspack_import_0/* .BOLD_STAR */.d7,
    _lexical_markdown__rspack_import_0/* .BOLD_UNDERSCORE */.Pi,
    // `_italic_` before `*italic*`: both are valid GFM, but only the underscore spelling
    // also means italic under XEP-0393 (where a single `*` is bold). Serializing the
    // unambiguous one keeps a post readable whichever convention renders it, including
    // Converse's own texture renderer, which applies XEP-0393 styling to post bodies.
    _lexical_markdown__rspack_import_0/* .ITALIC_UNDERSCORE */.gW,
    _lexical_markdown__rspack_import_0/* .ITALIC_STAR */.Eg,
    _lexical_markdown__rspack_import_0/* .STRIKETHROUGH */.WY,
    _lexical_markdown__rspack_import_0/* .INLINE_CODE */.Up,
    _lexical_markdown__rspack_import_0/* .LINK */.ps,
];

// Class names Lexical stamps onto its DOM for styling hooks. Kept minimal; these
// are editor-only and get stripped from the published XHTML (see the composer's
// htmlToXhtml normaliser), so they never reach the wire.
const THEME = {
    heading: {
        h1: 'social-rich__h1',
        h2: 'social-rich__h2',
        h3: 'social-rich__h3',
    },
    quote: 'social-rich__quote',
    link: 'social-rich__link',
    text: {
        bold: 'social-rich__bold',
        italic: 'social-rich__italic',
        strikethrough: 'social-rich__strike',
        code: 'social-rich__code',
    },
};

// LinkNode's own DOM export whitelists http(s)/mailto/sms/tel and rewrites every
// other scheme (so our xmpp: mention URIs) to about:blank. Export links with the
// raw URL instead; the composer runs the exported HTML through DOMPurify (whose
// URI allowlist includes xmpp:) before anything reaches the wire.
const HTML_EXPORT = new Map([
    [
        _lexical_link__rspack_import_1/* .LinkNode */.Db,
        (_editor, /** @type {LinkNode} */ node) => {
            const element = document.createElement('a');
            element.href = node.getURL();
            const title = node.getTitle();
            if (title) element.title = title;
            return { element };
        },
    ],
]);

/**
 * Attach a Lexical rich-text editor configured for Social posts.
 * @param {HTMLElement} rootEl - A `contenteditable` host element.
 * @param {object} [opts]
 * @param {() => void} [opts.onChange] - Called after each edit (e.g. to toggle a
 *      disabled Post button). Kept optional so the caller can avoid per-keystroke
 *      re-renders.
 * @returns {import('./types.ts').LexicalEditor}
 */
function createSocialEditor(rootEl, { onChange } = {}) {
    const handle = (0,shared_rich_composer_editor_js__rspack_import_2/* .createRichEditor */.e)(rootEl, {
        namespace: 'converse-social-compose',
        nodes: [_lexical_rich_text__rspack_import_3/* .HeadingNode */.jL, _lexical_rich_text__rspack_import_3/* .QuoteNode */.dJ, _lexical_link__rspack_import_1/* .LinkNode */.Db],
        theme: THEME,
        transformers: TRANSFORMERS,
        // Type the way chat does (XEP-0393's `*bold*`, `~strike~`) while still publishing
        // GitHub-flavoured Markdown, so the two composers feel the same. `**bold**` and
        // `~~strike~~` keep working for anyone used to CommonMark.
        input_transformers: (0,shared_rich_composer_styling_js__rspack_import_4/* .withStylingShortcuts */.Af)(TRANSFORMERS),
        html_export: HTML_EXPORT,
        onChange,
    });

    return {
        ...handle,

        /**
         * If the collapsed caret sits right after an emoji-shortname trigger
         * (a `:foo` token), return the typed query (`foo`), else `null`.
         */
        getEmojiQuery: () => handle.getTriggerQuery(shared_rich_composer_triggers_js__rspack_import_5/* .EMOJI_TRIGGER */.C),

        /**
         * Replace the `:query` trigger immediately before the caret with `replacement`
         * (the resolved emoji glyph).
         * @param {string} query - The chars typed after the colon (without the colon).
         * @param {string} replacement
         */
        replaceEmojiTrigger: (query, replacement) => handle.replaceTrigger(`:${query}`, replacement),

        /**
         * If the collapsed caret sits right after a mention trigger (an `@foo` token,
         * possibly a bare `@`), return the typed query (`foo`, or `''`), else `null`.
         */
        getMentionQuery: () => handle.getTriggerQuery(shared_rich_composer_triggers_js__rspack_import_5/* .MENTION_TRIGGER */.g),

        /**
         * Replace the `@query` trigger immediately before the caret with a link (the
         * mention: `text` linking to `url`), followed by a space.
         * @param {string} query - The chars typed after the `@` (without the `@`).
         * @param {string} text - The link's text (e.g. `@Alice`).
         * @param {string} url - The link's target (e.g. `xmpp:alice@example.org`).
         */
        replaceMentionTrigger: (query, text, url) => handle.replaceTriggerWithLink(`@${query}`, text, url),
    };
}

__webpack_require__.d(__webpack_exports__, {
  createSocialEditor: () => (createSocialEditor)
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

//# sourceMappingURL=6353.js.map