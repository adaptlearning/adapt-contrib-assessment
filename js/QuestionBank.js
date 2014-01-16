define(function(require) {
    
    var Adapt = require('require');

    var QuestionBank = {};

    QuestionBank.prototype.initialise = function(id, numQuestions){
       //console.log('QuestionBank.initialize: '); 
        this._id = id;
        this._numQuestions = numQuestions;   
        
        this.questions = [];
        this.unUsedQuestions = undefined;
    };
    
    QuestionBank.prototype.getID = function(){ 
        return this._id; 
    };
    
    QuestionBank.prototype.addBlock = function(block){
        //if(console) console.log("QuestionBank::addScreen " + block.id + " added to Bank ID: " + this._id);  
        this.questions.push(block);    
    };
    
    QuestionBank.prototype.getRandomQuestions = function(){
        
        var questions = [];
        
        for (var i = 0; i < this._numQuestions; i++) {
            var question = this.getRandomQuestion();
            if (question !== undefined) questions.push(question);
        }
            
        return questions;
    };
    
    QuestionBank.prototype.getRandomQuestion = function() {          
        if (this.unUsedQuestions === undefined) {
            this.unUsedQuestions = this.questions.slice(0);
        }        
        
        if (this.unUsedQuestions !== undefined && this.unUsedQuestions.length < 1)
        {
           if(console) console.error("QuestionBank::getRandomQuestion: Error, no more unused screens");
            return undefined;
        }
        
        var index = Math.round(Math.random() * (this.unUsedQuestions.length-1));
        var question = this.unUsedQuestions[index];
        
        // remove the question so we don't get it again
        this.unUsedQuestions.splice(index,1);
        
        return question;
    }

    return QuestionBank;

});