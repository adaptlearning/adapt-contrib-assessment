define(function(require) {

    var Adapt = require('coreJS/adapt');

    var AssessmentView = Backbone.View.extend({
        initialize: function() {
            this.assessmentComponents = this.model.findDescendants('components');
            this.listenTo(this.assessmentComponents, 'change:_isComplete', this.assessmentComponentComplete);
            this.setUpQuiz();
        },

        assessmentComponentComplete: function() {
            if (this.model.get('_isComplete')) {
                this.assessmentComplete();
            }
        },

        assessmentComplete: function() {
            console.log('assessment complete');
            this.assessmentComponents.each(function(component) {
                console.log(component);
            });
            console.log(this.model);
        },
        setUpQuiz: function(){
            this.model.get('_assessment').score = 0;
            Adapt.mediator.on('questionView:feedback', function(event) {
                event.preventDefault();
            });
        }
        /*
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