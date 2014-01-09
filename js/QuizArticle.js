var assessmentModel;

Adapt.on('articleView:postRender', function(view) {
    if (view.model.get('assessment')) {
        assessmentModel = new AssessmentModel();
    }
});

Adapt.articles.on('change:_isComplete', function(model) {
    if (model.get('assessment')) {
        if (model.get('_isComplete')) {
            new ResultsScreen({model:assessmentModel});
        }
    }
});

var AsssessmentModel = Backbone.Model.extend({
    init: function() {
        this.set('child', 'blocks');
        this.set('type', 'article');
        this.listenTo(Adapt, "assessmentQuestionAnswered", this.onAssessmentQuestionAnswered);

        if (this.get('assessment')){
            this.setUpQuiz();
        }
        else{
             this.set('blocks', new BlocksCollection(this.get('blocks'), {parse: true}));
        }
        
        Adapt.Articles.add(this);
        this.setOnChildren('assessment', this.get('assessment'));
        this.listenToCollection();
    },
    setUpQuiz: function(){
        
        this.set('numberOfAnsweredQuestions', 0);
        
        this.questionBanks = new Array();
        this.allQuestionBlocks = new Array();
        this.quizQuestions = new Array();
        
        // default values are 0 start blocks, 1 end block (results screen)
        this.startBlockCount = (_.isNumber(this.get('startBlocks'))) ? this.get('startBlocks') : 0;
        this.endBlockCount = (_.isNumber(this.get('endBlocks'))) ? this.get('endBlocks') : 1;
        
        if(this.get('banks') && this.get('banks').length > 1) {
            var banks = this.get('banks').split(",");
            
            for(var i=0;i<banks.length;i++){
                var questions = banks[i]; 
                this.questionBanks.push(new Adapt.QuestionBank((i+1), questions));  
            }
        
            this.allQuestionBlocks = this.get('blocks').slice(this.startBlockCount, this.get('blocks').length - this.endBlockCount);
            
            this.populateQuestionBanks();
            
            this.buildBankedQuiz();
        }
        else if(this.get('randomise')){
            this.set('blocks', new BlocksCollection(this.randomiseAssessmentQuestions(this.get('blocks')), {parse: true}));
        } else {
            this.set('blocks', new BlocksCollection(this.get('blocks'), {parse: true}));  
        }
    },
    
    onQuizComplete: function(){
        Adapt.trigger("quizComplete");
        this.markLearningForReview();    
    },
    
    onAssessmentQuestionAnswered: function(questionParent) {
        if(questionParent == this) {
            var numberOfAnsweredQuestions = this.get('numberOfAnsweredQuestions') + 1,
                questionComponents = this.getQuestionComponents();
            if(numberOfAnsweredQuestions >= questionComponents.length) {
                this.onQuizComplete();
            }
            this.set('numberOfAnsweredQuestions', numberOfAnsweredQuestions);
        }
    },
    
    markLearningForReview: function(){
        var components = this.getChildren('components');
        _.each(components, function(component){
            if (component.get('complete') && !component.get('correct') && component.get('associatedLearning')){
                var model = Adapt.Utils.getModelFromId(component.get('associatedLearning'));
                model.set({markedForReview:true});
            }
        })
    },
        
    getAssociatedLearning: function(){
        var associatedLearning = [];
        var components = this.getChildren('components');
        _.each(components, function(component){
            if (component.get('complete') && !component.get('correct') && component.get('associatedLearning')) {
                var model = Adapt.Utils.getModelFromId(component.get('associatedLearning'));
                if (model && !_.contains(associatedLearning, model)) {
                    associatedLearning.push(model);
                }
            }
        })
       
        return associatedLearning;
    },
    
    getQuestionComponents: function() {
        var questionComponents = [];
        _.each(this.getChildren('components'), function(component) {
            if (component instanceof QuestionModel) {
                questionComponents.push(component);
            }
        }, this);
        return questionComponents;
    },
    
    getScore: function(){
               
        var score = _.reduce(this.getChildren('components'), function(memo, component){ 
            var score = component.get('correct') ? 1 : 0;
            return memo + score}, 0);
        return score;
    },
    
    getMaxScore: function(){
        return this.getQuestionComponents().length;
    },
    
    getScoreAsPercent: function(){
        return Math.round((this.getScore()/this.getMaxScore()) * 100);
    },    
    
    randomiseAssessmentQuestions: function(blocks) {
        
//        console.log("QuizArticle, randomiseAssessmentQuestions: "+ blocks.length);  
        
        var startBlocks = blocks.slice(0, this.startBlockCount);
        var questionBlocks = _.shuffle(blocks.slice(this.startBlockCount, blocks.length-this.endBlockCount));
        var endBlocks = blocks.slice(blocks.length-this.endBlockCount);
        var randomCount = (_.isNumber(this.get('randomCount')) && this.get('randomCount') > 0 && this.get('randomCount') < questionBlocks.length) ? this.get('randomCount') : questionBlocks.length;
        questionBlocks = questionBlocks.slice(0, randomCount);
        
        var randomisedBlocks = startBlocks.concat(questionBlocks).concat(endBlocks);
            
        return randomisedBlocks;
    },
    
    resetQuiz: function() {
        this.set("numberOfAnsweredQuestions", 0);
    },
    
    populateQuestionBanks: function() {
        for (var i=0; i < this.allQuestionBlocks.length; i++) {
            var questionBlock = this.allQuestionBlocks[i];
            //var bankID = questionBlock.get('bankID');
            var questionBank = this.getBankByID(questionBlock.bankID);
            
//            console.log(questionBlock.id + " - " + questionBlock.bankID);
            questionBank.addBlock(questionBlock); 
        }
    },
    
    getBankByID: function(id) {
        for(var i=0;i<this.questionBanks.length;i++){
            var qb = this.questionBanks[i];
            if(id===qb.getID()) return qb;
        }
    },
    
    buildBankedQuiz: function() {
        var blocks = this.get('blocks');         
        var startBlocks = blocks.slice(0, this.startBlockCount);
        var endBlocks = blocks.slice(blocks.length-this.endBlockCount);
        
        for (var i=0; i < this.questionBanks.length; i++) {
            var questions = this.questionBanks[i].getRandomQuestions();
            //console.log("bank " + i + " has " + questions.length + " questions");
            this.quizQuestions = this.quizQuestions.concat(questions);
        }  
         
         if(this.get('randomise')) this.quizQuestions = _.shuffle(this.quizQuestions);   
                
         var displayBlocks = startBlocks.concat(this.quizQuestions).concat(endBlocks);             
         this.set('blocks', new BlocksCollection(displayBlocks, {parse: true}));
    },
    
    readyForCompletion: function() {
        if(this._original("readyForCompletion")) {
            var components = this.getChildren('components');
            var allComplete = true;
            if(this.get('assessment')) {
                _.each(this.getQuestionComponents(), function(questionComponent){
                    if(!questionComponent.get('complete')){
                       allComplete = false;
                       return false;                
                    }
                });
            }
            return true;
        }
        return false;
    }
})

