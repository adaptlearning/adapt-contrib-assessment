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
        	this.listenTo(Adapt, "assessment:complete", this.onAssessmentComplete);
        },

        removeEventListeners: function() {
        	this.stopListening(Adapt, "assessment:complete", this.onAssessmentComplete);
        },

		onAssessmentComplete: function() {
			console.log("assessment:onAssessmentComplete", this.model);

			this.removeEventListeners();

			this.setCompletionStatus();
			
		}

	};

	return AssessmentView;

});