define([
	'coreJS/adapt',
	'coreViews/articleView'
], function(Adapt, AdaptArticleView) {

	var AssessmentView = {

		postRender: function() {
            AdaptArticleView.prototype.postRender.call(this);
            if (this.model.isAssessmentEnabled()) this._setupEventListeners();
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

		_onAssessmentComplete: function(state, model) {
			if (state.id != this.model.get("_assessment")._id) return;

			console.log("assessment complete", state, model);

			this.setCompletionStatus();
			
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