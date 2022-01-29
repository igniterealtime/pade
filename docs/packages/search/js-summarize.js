function JsSummarize(options)
{
    'use strict';

    /** @type {Number} This is the ideal sentence length and will give weight to
    sentences that are close to this length */
    this._idealSentenceLength = 20.0;
    /** @type {Array} This is an array of tokens to exlude when generating sentence value */
    this._excludeList = ["-", " ", ",", ".", "a", "e", "i", "o", "u", "t", "about", "above", "above", "across", "after", "afterwards", "again", "against", "all", "almost", "alone", "along", "already", "also", "although", "always", "am", "among", "amongst", "amoungst", "amount", "an", "and", "another", "any", "anyhow", "anyone", "anything", "anyway", "anywhere", "are", "around", "as", "at", "back", "be", "became", "because", "become", "becomes", "becoming", "been", "before", "beforehand", "behind", "being", "below", "beside", "besides", "between", "beyond", "both", "bottom", "but", "by", "call", "can", "cannot", "can't", "co", "con", "could", "couldn't", "de", "describe", "detail", "did", "do", "done", "down", "due", "during", "each", "eg", "eight", "either", "eleven", "else", "elsewhere", "empty", "enough", "etc", "even", "ever", "every", "everyone", "everything", "everywhere", "except", "few", "fifteen", "fifty", "fill", "find", "fire", "first", "five", "for", "former", "formerly", "forty", "found", "four", "from", "front", "full", "further", "get", "give", "go", "got", "had", "has", "hasnt", "have", "he", "hence", "her", "here", "hereafter", "hereby", "herein", "hereupon", "hers", "herself", "him", "himself", "his", "how", "however", "hundred", "i", "ie", "if", "in", "inc", "indeed", "into", "is", "it", "its", "it's", "itself", "just", "keep", "last", "latter", "latterly", "least", "less", "like", "ltd", "made", "make", "many", "may", "me", "meanwhile", "might", "mill", "mine", "more", "moreover", "most", "mostly", "move", "much", "must", "my", "myself", "name", "namely", "neither", "never", "nevertheless", "new", "next", "nine", "no", "nobody", "none", "noone", "nor", "not", "nothing", "now", "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto", "or", "other", "others", "otherwise", "our", "ours", "ourselves", "out", "over", "own", "part", "people", "per", "perhaps", "please", "put", "rather", "re", "said", "same", "see", "seem", "seemed", "seeming", "seems", "several", "she", "should", "show", "side", "since", "sincere", "six", "sixty", "so", "some", "somehow", "someone", "something", "sometime", "sometimes", "somewhere", "still", "such", "take", "ten", "than", "that", "the", "their", "them", "themselves", "then", "thence", "there", "thereafter", "thereby", "therefore", "therein", "thereupon", "these", "they", "thickv", "thin", "third", "this", "those", "though", "three", "through", "throughout", "thru", "thus", "to", "together", "too", "top", "toward", "towards", "twelve", "twenty", "two", "un", "under", "until", "up", "upon", "us", "use", "very", "via", "want", "was", "we", "well", "were", "what", "whatever", "when", "whence", "whenever", "where", "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever", "whether", "which", "while", "whither", "who", "whoever", "whole", "whom", "whose", "why", "will", "with", "within", "without", "would", "yet", "you", "your", "yours", "yourself", "yourselves", "the", "reuters", "news", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "mon", "tue", "wed", "thu", "fri", "sat", "sun", "rappler", "rapplercom", "inquirer", "yahoo", "home", "sports", "1", "10", "2012", "sa", "says", "tweet", "pm", "home", "homepage", "sports", "section", "newsinfo", "stories", "story", "photo", "2013", "na", "ng", "ang", "year", "years", "percent", "ko", "ako", "yung", "yun", "2", "3", "4", "5", "6", "7", "8", "9", "0", "time", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "philippine", "government", "police", "manila"];
    /**
     * This tokenizer is used to tokenize text into words or sentences
     * @type {Tokenizer}
     */
    this._tokenizer = new Tokenizer();

    /** @type {Number} The number of summary sentences to return */
    this._returnCount = 5;

    /** @type {Array} Sentence position value array. Used to score sentence position in text */
    this._positionValueArray = [
        {low:0, high:0.1, score:0.17},
        {low:0.1, high:0.2, score:0.23},
        {low:0.2, high:0.3, score:0.14},
        {low:0.3, high:0.4, score:0.08},
        {low:0.4, high:0.5, score:0.05},
        {low:0.5, high:0.6, score:0.04},
        {low:0.6, high:0.7, score:0.06},
        {low:0.7, high:0.8, score:0.04},
        {low:0.8, high:0.9, score:0.04},
        {low:0.9, high:1.0, score:0.15}
    ];

    if(!options) return;

    this._idealSentenceLength = options.idealSentenceLength || this._idealSentenceLength;
    this._returnCount = options.returnCount || this._returnCount;
    this._excludeList = options.excludeList || this._excludeList;
    this._positionValueArray = options.positionValueArray || this._positionValueArray;
}

/**
 * Main function. Will take in the correct text and return an array of sentences
 * in order of importance.
 *
 * @param  {string} title The title of the text
 * @param  {string} text The long text
 * @param  {object} options The options object used to override parameters
 * @return {array} an array of sentences that summarize the text
 */
JsSummarize.prototype.summarize = function (title, text) {

    if (text.length == 0) return [];

    var sentences = this.splitSentences(text);
    var keywords = this.keywords(text);
    var titleWords = this.splitWords(title)
    var scoredSentences = this.score(sentences, titleWords, keywords);

    //Sort by score, select just the sentences, and return 5 (or whatever is set in options)
    var self = this;
    var orderedList = scoredSentences.sort(function(a, b) {
        if (a.score < b.score) { return 1; }
        if (a.score > b.score) { return -1; }
        return 0;
    }).map(function(item) {
        return item.sentence;
    }).filter(function(sentence, idx) {
        return idx < self._returnCount;
    });

    return orderedList;
},

/**
 * Handles the bulk of the operations. This will score sentences based on
 * shared keywords in the title, amount of high frequency keywords, ideal length,
 * ideal position, sbs sentence algorithm,and the dbs sentence algorithm;
 *
 * @param  {array} sentences  The array of sentences that make up the large text
 * @param  {array} titleWords The array of word tokens that make up the text title
 * @param  {array} keywords   The array of high frequency keywords in the text
 * @return {array}            The array of computed summary sentences.
 */
JsSummarize.prototype.score = function (sentences, titleWords, keywords) {

    var scoredSentences = [];

    for(var i = 0; i < sentences.length; i++)
    {
        //Split the sentence into words
        var sentenceWords = this.splitWords(sentences[i]);
        //Score based on shared title words
        var titleFeature = this.titleScore(titleWords, sentenceWords);
        //Score based on sentence length
        var sentenceLength = this.lengthScore(sentenceWords);
        //Score based on sentence position
        var sentencePosition = this.sentencePosition(i+1, sentences.length);
        //Score based on SBS
        var sbsFeature = this.sbs(sentenceWords, keywords);
        //Score based on DBS
        var dbsFeature = this.dbs(sentenceWords, keywords);
        //Calculate frequency
        var frequency = (sbsFeature + dbsFeature) / 2.0 * 10.0;

        //Weighted average of scores from four categores
        var totalScore = (titleFeature*1.5 + frequency*2.0 + sentenceLength*1.0 + sentencePosition*1.0)/4.0;

        scoredSentences.push({sentence:sentences[i],score:totalScore});
    }

    return scoredSentences;
},

/**
 * Summation-based selection scoring
 * @param  {array} words    sentence to score
 * @param  {array} keywords list of keywords to score against
 * @return {number}          score
 */
JsSummarize.prototype.sbs = function (words, keywords) {
    if(words.length == 0) return 0;

    var score = 0;
    var contribution = 10;

    words.map(function (word) {
        var matches = keywords.filter(function (keyword) {
            return (keyword.word == word);
        });

        if (matches.length)
        {
            score += matches[0].score;
        }
    });

    return (1.0 / words.length) * (score/contribution);
},

/**
 * Density-based selection scoring
 * @param  {array} words    sentence to score
 * @param  {array} keywords list of keywords to score against
 * @return {number}          score
 */
JsSummarize.prototype.dbs = function (words, keywords) {
    if(words.length == 0) return 0;

    var total = 0;
    var first = null;
    var second = null;
    var keywordsFound = 0;

    words.map(function (word, i) {
        var matches = keywords.filter(function (keyword) {
            return (keyword.word == word);
        });

        if (matches.length) {
            ++keywordsFound;
            var score = matches[0].score;
            if (!first) {
                first = {index:i, score:score};
            }
            else {
                second = first;
                first = {index:i, score:score};
                var dif = first.index - second.index;
                total += (first.score*second.score) / (Math.pow(dif,2));
            }

        }
    });

    if(keywordsFound == 0) return 0;
    return (1/(keywordsFound*(keywordsFound+1)))*total;
},

/**
 * Uses tokenizer to split text into word tokens
 * @param  {string} text text to split into tokens
 * @return {array}      An array of words
 */
JsSummarize.prototype.splitWords = function (text) {
    return this._tokenizer.tokenizeAggressive(text.toLowerCase());
},

/**
 * Builds up a list of high frequency words (keywords) used throughout
 * the text. Uses the exclusion list to remove words that do not help the
 * sentence score.
 *
 * @param  {string} text Full text to parse
 * @return {array}      An array of high frequency keywords
 */
JsSummarize.prototype.keywords = function (text) {

    var splitText = this.splitWords(text);

    // NOTE: this is functionally identical code with different output.
    //
    // In V8 5.6.326.50 w/ lodash 2.3.0, all of these produce different results:
    // * lodash.sortBy().reverse()
    // * Array.sort(descendingCallback)
    // * Array.sort(ascendingCallback).reverse()
    var self = this;
    var words = splitText.filter(function (word) {
        return !self._excludeList.includes(word);
    }).reduce(function(groups, word) {
        for (var idx in groups) {
            if (groups[idx].word === word) {
                ++groups[idx].frequency;
                return groups;
            }
        }

        groups.push({word: word, frequency: 1, score: null});
        return groups;
    }, []).map(function(group) {
        // (frequency * 1.0 / splitText.length) * 1.5 + 1;
        group.score = (group.frequency * 1.0 / splitText.length) * 1.5 + 1;
        return group;
    }).sort(function(a, b) {
        if (a.score < b.score) { return 1; }
        if (a.score > b.score) { return -1; }
        return 0;
    }).
    filter(function(group, idx) {
        return idx < 10;
    });

    return words;
},

/**
 * Uses tokenizer to split text into sentences
 *
 * @param  {string} text Full text to split into sentences
 * @return {array}      The array of sentences
 */
JsSummarize.prototype.splitSentences = function (text) {
    return this._tokenizer.getSentences(text);
},

/**
 * Scores a sentence based on the ideal length
 * @param  {array} sentence Sentence word array to score
 * @return {number}          Score based on sentence length
 */
JsSummarize.prototype.lengthScore = function (sentence) {

    return 1 - Math.abs(this._idealSentenceLength - sentence.length) / this._idealSentenceLength;
},

/**
 * Scores a sentence based on shared words with the title
 *
 * @param  {string} title    Text Title
 * @param  {array} sentence Sentence word array to score
 * @return {number}          Score based on title
 */
JsSummarize.prototype.titleScore = function (title, sentence) {

    if(!title || !sentence) return 0;
    //Remove any words shared with the exclusion list
    var self = this;
    var titleWords = title.filter(function (word) {
        return !self._excludeList.includes(word);
    });

    var count = 0;
    sentence.map(function(word) {
        if (!self._excludeList.includes(word) && titleWords.includes(word)) {
            ++count;
        }
    })

    return count === 0? 0 : count/title.length;
},

/**
 * Scores a sentence based on its location in the text. Different sentence
 * positions indicate different probabilities of being an important sentence.
 *
 * @param  {number} index    Sentence index in array of text sentences
 * @param  {number} numberOfSentences The total number of sentences in the text
 * @return {number}      Scored based on sentence position
 */
JsSummarize.prototype.sentencePosition = function (index, numberOfSentences) {

    var normalized =  index*1.0 / numberOfSentences;

    for(var i = 0; i < this._positionValueArray.length; i++)
    {
        var position = this._positionValueArray[i];
        if(normalized > position.low && normalized <= position.high) return position.score;
    }

    return 0;
}

