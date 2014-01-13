define(function(require) {

    var Adapt = require('coreJS/adapt');

    var AssessmentView = Backbone.View.extend({
        initialize: function() {
            var childComponents = this.model.findDescendants('components');

            // Although we retrieve all decendants of the article, regarding the assessment
            // we are only interested in questions.  Currently we check for a
            // _questionWeight attribute
            this.assessmentComponents = _.filter(childComponents.models, function(component) {
                if (component.get('_questionWeight')) {
                    return component;
                }
            });

            this.listenTo(this.assessmentComponents, 'change:_isComplete', this.assessmentComponentComplete);
            this.setUpQuiz();
        },

        getQuestionComponents: function() {
            return _.filter(this.model.findDescendants('components'), function(component) { 
                if (component.get('_questionWeight')) {
                    return component;
                } 
            });
        },

        assessmentComponentComplete: function() {
            if (this.model.get('_isComplete')) {
                this.assessmentComplete();
            }
        },

        assessmentComplete: function() {
            console.log('assessment complete');
            this.assessmentComponents.each(function(component) {
                // console.log(component);
            });
            // console.log(this.model);


            console.log('score = ' + this.getScore());
            console.log('max = ' + this.getMaxScore());
            // Adapt.trigger('questionView:feedback', {
            //     title: 'Title',
            //     message:'Congratulations, loser!'
            // });
        },

        setUpQuiz: function(){
            this.model.get('_assessment').score = 0;
            Adapt.mediator.on('questionView:feedback', function(event) {
                event.preventDefault();
            });
        },
        
        getScore: function(){
            var score = 0;

            this.assessmentComponents.each(function(component) {
                if (component.get('_isCorrect')) {
                    console.log(component);
                    score++;
                }
            });

            return score;
            // var score = _.reduce(this.getChildren('components'), function(memo, component){ 
            //     var score = component.get('correct') ? 1 : 0;
            //     return memo + score}, 0);
            // return score;
        },
        
        
        getMaxScore: function(){
            var maxScore = 0;

            // this.assessmentComponents.each(function(component) {
            //     if (component.get('_score')) {
            //         maxScore = maxScore + component.get('_score');
            //     }
            // });

            return maxScore;
        },
        
        getScoreAsPercent: function(){
            return Math.round((this.getScore()/this.getMaxScore()) * 100);
        }    
        /*
        resetQuiz: function() {
            this.set("numberOfAnsweredQuestions", 0);
        },
        
        */
    });

    Adapt.on('articleView:postRender', function(view) {
        console.log('articleView:postRender')
        if (view.model.get('_assessment')) {
            new AssessmentView({model:view.model});
        }
    });

})