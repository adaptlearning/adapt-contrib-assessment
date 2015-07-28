define(function(require) {
    
    var QuestionBank = function(quizBankid, articleId, numQuestionBlocks, uniqueQuestions) {

        this._id = quizBankid;
        this._articleId = articleId;
        this._numQuestionBlocks = numQuestionBlocks;
        this._uniqueQuestions = uniqueQuestions;
        this.questionBlocks = [];
        this.unUsedQuestionBlocks = undefined;

    };

    QuestionBank.prototype = {

        getID: function() {
            return this._id;
        },

        addBlock: function(block) {
            this.questionBlocks.push(block);
        },

        getRandomQuestionBlocks: function() {
            this.checkResetUnunsedBlocks();

            var questionBlocks = [];

            for (var i = 0; i < this._numQuestionBlocks; i++) {
                var question = this.getRandomQuestion();
                if (question !== undefined) {
                    questionBlocks.push(question);
                }
            }
                
            return questionBlocks;
        },

        checkResetUnunsedBlocks: function() {
            if (this.unUsedQuestionBlocks !== undefined && this._uniqueQuestions) return;
            
            this.unUsedQuestionBlocks = this.questionBlocks.slice(0);
        },

        getRandomQuestion: function() {
            if (this.unUsedQuestionBlocks !== undefined && this.unUsedQuestionBlocks.length < 1) {
               console.warn("assessment:"+this._articleId+" No more unique questions for _assessment._quizBankID " + this._id);
               return undefined;
            }

            var index = Math.round(Math.random() * (this.unUsedQuestionBlocks.length-1));
            var questionBlock = this.unUsedQuestionBlocks[index];

            this.unUsedQuestionBlocks.splice(index, 1);

            return questionBlock;
        }
        
    };

    return QuestionBank;

});