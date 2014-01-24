define(function(require) {

    var Adapt = require('coreJS/adapt');

    var AssessmentView = Backbone.View.extend({
        initialize: function() {
            this.listenTo(this.model, 'change:_isComplete', this.assessmentComplete);
            _.each(this.getQuestionComponents(), function(assessmentQuestionComponent) {
                this.listenTo(assessmentQuestionComponent, 'change:_isSubmitted', this.onQuestionComplete);
            }, this);

            this.setUpQuiz();
        },

        onQuestionComplete: function(questionModel) {
            if (questionModel.get('_isSubmitted')) {
                if (questionModel.get('_attempts') > 1 && questionModel.get('_attemptsLeft') > 0) {
                    this.showMultipleAttemptsAssessmentFeedback();
                }
            }
        },

        showMultipleAttemptsAssessmentFeedback: function() {
            Adapt.trigger('questionView:showFeedback', 
                {
                    title: this.model.get('_assessment')._multipleAttemptsFeedback.title,
                    message: this.model.get('_assessment')._multipleAttemptsFeedback.message
                }
            );
        },

        getQuestionComponents: function() {
            var childComponents = this.model.findDescendants('components');

            // Although we retrieve all decendants of the article, regarding the assessment
            // we are only interested in questions.  Currently we check for a
            // _questionWeight attribute
            return _.filter(childComponents.models, function(component) { 
                if (component.get('_questionWeight')) {
                    return component;
                } 
            });
        },

        assessmentComplete: function() {     
            var isPercentageBased = this.model.get('_assessment')._isPercentageBased;
            var scoreToPass = this.model.get('_assessment')._scoreToPass;
            var score = this.getScore();
            var scoreAsPercent = this.getScoreAsPercent();
            var isPass = false;

            this.showFeedback = true;

            Adapt.trigger('questionView:showFeedback', 
                {
                    title: this.model.get('_assessment')._completionMessage.title,
                    message: this.getFeedbackMessage(),
                    score: isPercentageBased ? scoreAsPercent + '%' : score
                }
            );

            if (isPercentageBased) {
                isPass = (scoreAsPercent >= scoreToPass) ? true : false; 
            } else {
                isPass = (score >= scoreToPass) ? true : false;
            }

            Adapt.trigger('assessment:complete', {isPass: isPass, score: score, scoreAsPercent: scoreAsPercent});
        },

        getFeedbackMessage: function() {
            var feedback = (this.model.get('_assessment')._completionMessage.message);

            feedback = feedback.replace("[SCORE]", this.getScore());
            feedback = feedback.replace("[MAXSCORE]", this.getMaxScore().toString());
            feedback = feedback.replace("[PERCENT]", this.getScoreAsPercent().toString());
            feedback = feedback.replace("[FEEDBACK]", this.getBandedFeedback().toString());

            return feedback;
        },

        setUpQuiz: function() {
            this.model.get('_assessment').score = 0;

            Adapt.mediator.on('questionView:feedback', function(event) {
                event.preventDefault();
            });
        },
        
        getScore: function() {
            var score = 0;

            _.each(this.getQuestionComponents(), function(component) {
                if (component.get('_isCorrect') && component.get('_score')) {
                    score += component.get('_score');   
                }
            });

            return score;
        },
        
        getMaxScore: function() {
            var maxScore = 0;

            _.each(this.getQuestionComponents(), function(component) {
                if (component.get('_questionWeight')) {
                    maxScore += component.get('_questionWeight');
                }
            });

            return maxScore;
        },
        
        getScoreAsPercent: function() {
            return Math.round((this.getScore() / this.getMaxScore()) * 100);
        },    
        
        resetQuiz: function() {
            this.model.set('_assessment').numberOfAnsweredQuestions = 0;
            this.model.set('_assessment').score = 0;
        },
        
        getBandedFeedback: function() {
            var bands = this.model.get('_assessment')._bands;
            var percent = this.getScoreAsPercent();
            
            for (var i = (bands.length - 1); i >= 0; i--) {
                if (percent >= bands[i]._score) {
                    return bands[i].feedback;
                }
            }
        }
        
    });

    Adapt.on('articleView:postRender', function(view) {
        if (view.model.get('_assessment')) {
            new AssessmentView({model:view.model});
        }
    });

})