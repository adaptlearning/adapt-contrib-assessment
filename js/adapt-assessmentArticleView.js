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
            this._setupQuestionNumbering();
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

        _setupQuestionNumbering: function() {
            var getRelatedQuestions = function(model) {
                var currentAssessmentId = model.get('_assessmentId');
                var currentAssessment =  Adapt.assessment.get(currentAssessmentId);
                return currentAssessment.getState().questionModels;
            }

            Handlebars.registerHelper("questionNumber", function getQuestionNumber() {
                var model = this.view.model;
                if (!model.get('_isPartOfAssessment')) return;
                return getRelatedQuestions(model).indexOf(model) + 1;
            });

            Handlebars.registerHelper("questionCount", function getTotalQuestions() {
                var model = this.view.model;
                if (!model.get('_isPartOfAssessment')) return;
                return getRelatedQuestions(model).length;
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
