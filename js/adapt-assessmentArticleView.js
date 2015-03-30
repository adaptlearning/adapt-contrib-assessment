define([
	'coreJS/adapt',
	'coreViews/articleView'
], function(Adapt, AdaptArticleView) {

	var AssessmentView = {

		postRender: function() {
            AdaptArticleView.prototype.postRender.call(this);
            if (this.model.isAssessmentEnabled()) this.setupEventListeners();
        },

        setupEventListeners: function() {
        	this.listenTo(Adapt, "assessments:complete", this.onAssessmentComplete);
        	this.listenTo(Adapt, "assessments:reset", this.onAssessmentReset);
        	this.listenTo(Adapt, "remove", this.onRemove);
        },

        removeEventListeners: function() {
        	this.stopListening(Adapt, "assessments:complete", this.onAssessmentComplete);
        	this.stopListening(Adapt, "assessments:reset", this.onAssessmentReset);
        },

		onAssessmentComplete: function(stateModel) {
			if (stateModel.id != this.model.get("_assessment")._id) return;

			console.log("assessment complete", stateModel);

			this.setCompletionStatus();
			
		},

		onAssessmentReset: function(stateModel) {
			if (stateModel.id != this.model.get("_assessment")._id) return;

			console.log("assessment reset", stateModel);

		},

		onRemove: function() {
			this.removeEventListeners();
		}

	};

	return AssessmentView;

});