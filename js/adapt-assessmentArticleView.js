define([
    'core/js/adapt',
    'core/js/views/articleView'
], function(Adapt, AdaptArticleView) {

    var AssessmentView = {

        postRender: function() {
            AdaptArticleView.prototype.postRender.call(this);
            if (this.model.isAssessmentEnabled()) {
                this._setupEventListeners();

                var config = this.model.getConfig();
                if (config && config._questions && config._questions._canShowMarking === false) {
                    this.$el.addClass('no-marking');
                }
            }
            this.setupQuestionNumbering();
            this.$el.addClass('assessment');
        },

        _setupEventListeners: function() {
            this.listenTo(Adapt, "assessments:complete", this._onAssessmentComplete);
            this.listenTo(Adapt, "assessments:reset", this._onAssessmentReset);
            this.listenTo(Adapt, "remove", this._onRemove);
        },

        _removeEventListeners: function() {
            this.stopListening(Adapt, "assessments:complete", this._onAssessmentComplete);
            this.stopListening(Adapt, "assessments:reset", this._onAssessmentReset);
        },

        setupQuestionNumbering: function() {
            Handlebars.registerHelper("questionNumber", function getQuestionNumber() {
                var currentArticle = this._parent.attributes._parentId;
                var currentAssessment =  Adapt.assessment.get().filter(function(assessment) {
                    return assessment.attributes._id === currentArticle;
                })[0];
                var questionComponents = currentAssessment._currentQuestionComponents;
                return questionComponents.indexOf(Adapt.findById(this._id)) + 1;
            });

            Handlebars.registerHelper("totalQuestions", function getTotalQuestions() {
                var currentArticle = this._parent.attributes._parentId
                var currentAssessment =  Adapt.assessment.get().filter(function(assessment) {
                    return assessment.attributes._id === currentArticle;
                })[0];
                var questionComponents = currentAssessment._currentQuestionComponents;
                return questionComponents.length;
            });
        },

        _onAssessmentComplete: function(state, model) {
            if (state.id != this.model.get("_assessment")._id) return;

            console.log("assessment complete", state, model);
        },

        _onAssessmentReset: function(state, model) {
            if (state.id != this.model.get("_assessment")._id) return;

            console.log("assessment reset", state, model);

        },

        _onRemove: function() {
            this._removeEventListeners();
        }

    };

    return AssessmentView;

});
