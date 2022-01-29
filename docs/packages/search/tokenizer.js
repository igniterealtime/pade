function Tokenizer() { }

Tokenizer.prototype.getSentences = function (text) {
    if (text.length) {
        var punct = /[\.\?\!]$/;
        var words = text.split(/\s+/);
        var sentences = words.reduce(function (sentences, word, wordIndex, words) {
            if (wordIndex === 0 || punct.test(words[wordIndex - 1])) {
                sentences.push(word);
            }
            else {
                sentences[sentences.length - 1] += ' ' + word;
            }

            return sentences;
        }, []).filter(function (sentence) {
            return sentence.trim().length > 0;
        });

        return sentences;
    }

    return [];
};

Tokenizer.prototype.tokenizeAggressive = function (text) {
    return this.clean(text.split(/\W+/));
};

Tokenizer.prototype.tokenizeWithPunct = function (text) {
    return this.clean(text.match(/\S+/g));
};

Tokenizer.prototype.clean = function (array) {
    return array.filter(function (e) {
        return e;
    });
};
