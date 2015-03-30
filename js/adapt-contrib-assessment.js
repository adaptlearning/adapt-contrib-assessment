define([
	'coreJS/adapt',
	'./adapt-assessmentArticleExtension'
], function(Adapt) {

	/*
		Here we setup a registry for all assessments
	*/

	var assessmentsConfigDefaults = {
        "_postScoreToLMS": true,
        "_isPercentageBased": true,
        "_scoreToPass": 100
    };

	Adapt.assessment = _.extend({

	//Private functions

		_assessments: _.extend([], {
			_byPageId: {},
			_byAssessmentId: {}
		}),

		initialize: function() {
			this.listenTo(Adapt, "assessments:complete", this._onAssessmentsComplete);
			this.listenTo(Adapt, "router:location", this._checkResetAssessmentsOnRevisit);
		},

		_onAssessmentsComplete: function(state) {
			var assessmentId = state.id;

			state.isComplete = true;

			if (assessmentId === undefined) return;

			if (!this._getStateByAssessmentId(assessmentId)) {
				console.warn("assessments: state was not registered when assessment was created");
			}

			this._checkCourseComplete();

			this._checkAssessmentsComplete();

			//need to add spoor assessment state saving

		},

		_checkResetAssessmentsOnRevisit: function(toObject) {
			/* 
				Here we hijack router:location to reorganise the assessment blocks 
				this must happen before trickle listens to block completion
			*/
			if (toObject._contentType !== "page") return;

			//initialize assessment on page visit before pageView:preRender (and trickle)
			var pageAssessmentModels = this._getAssessmentByPageId(toObject._currentId);
			if (pageAssessmentModels === undefined) return;

			for (var i = 0, l = pageAssessmentModels.length; i < l; i++) {
				var pageAssessmentModel = pageAssessmentModels[i];
				pageAssessmentModel.reset();
			}

		},

		_checkCourseComplete: function() {
			// if the assessment is complete, and all non-assessment blocks are complete - then
			// all required course content has been viewed - set course to complete
			var nonAssessmentBlockModels = new Backbone.Collection(Adapt.blocks.where({_isPartOfAssessment: undefined}));
			var incompleteBlocks = nonAssessmentBlockModels.where({_isComplete: false});

			var areAllNonAssessmentBlocksComplete = (incompleteBlocks.length === 0);
			if (!areAllNonAssessmentBlocksComplete) return false;

			Adapt.course.set('_isComplete', true);

			return true;
		},

		_checkAssessmentsComplete: function() {
			var allAssessmentsComplete = true;
			var assessmentToPostBack = 0;
			var states = this._getStatesByAssessmentId();

			for (var id in states) {
				var state = states[id];
				if (!state.postScoreToLMS) continue;
				if (!state.isComplete) {
					allAssessmentsComplete = false;
					break;
				}
				assessmentToPostBack++;
			}

			if (!allAssessmentsComplete || assessmentToPostBack === 0) return false;

			this._postScoreToLMS();

			return true;
		},

		_postScoreToLMS: function() {
			var assessmentsConfig = this._getAssessmentsConfig();

			if (assessmentsConfig._postScoreToLMS === false) return;

			var score = 0;
			var maxScore = 0;
			var isPass = true;

			var states = this._getStatesByAssessmentId();

			for (var id in states) {
				var state = states[id];
				maxScore += state.maxScore / state.assessmentWeight;
				score += state.score / state.assessmentWeight;
				isPass = isPass === false ? false : state.isPass;
			}

			
			var scoreAsPercent = (score / maxScore) * 100;

			if (assessmentsConfig._scoreToPass || 100) {
				if (assessmentsConfig._isPercentageBased || true) {
					if (assessmentsConfig._scoreToPass >= scoreAsPercent) isPass = true;
				} else {
					if (assessmentsConfig._scoreToPass >= score) isPass = true;
				}
			}

			//post completion to spoor
			Adapt.trigger("assessment:complete", {
				isPass: isPass,
				scoreAsPercent: scoreAsPercent
			});
		},	

		_getAssessmentsConfig: function () {
			var assessmentsConfig = Adapt.course.get("_assessment");

			if (assessmentsConfig === undefined) {
				assessmentsConfig = $.extend(true, {}, assessmentsConfigDefaults);
			} else {
				assessmentsConfig = $.extend(true, {}, assessmentsConfigDefaults, assessmentsConfig);
			}

			return assessmentsConfig;
		},

		_getAssessmentByPageId: function(pageId) {
			return this._assessments._byPageId[pageId];
		},

		_getStateByAssessmentId: function(assessmentId) {
			return this._assessments._byAssessmentId[assessmentId].getState();
		},

		_getStatesByAssessmentId: function() {
			var states = {};
			for (var i = 0, l = this._assessments.length; i < l; i++) {
				var assessmentModel = this._assessments[i];
				var state = assessmentModel.getState();
				states[state.id] = state;
			}
			return states;
		},


	//Public functions

		register: function(assessmentModel) {
			var state = assessmentModel.getState();
			var assessmentId = state.id;
			var pageId = state.pageId;

			if (this._assessments._byPageId[pageId] === undefined) {
				this._assessments._byPageId[pageId] = [];
			}
			this._assessments._byPageId[pageId].push(assessmentModel);

			if (assessmentId) {
				this._assessments._byAssessmentId[assessmentId] = assessmentModel;
			}

			this._assessments.push(assessmentModel);

			Adapt.trigger("assessments:register", state, assessmentModel);
		},

		get: function(id) {
			if (id === undefined) {
				return this._assessments.slice(0);
			} else {
				return this._assessments._byAssessmentId[id];
			}
		},

	}, Backbone.Events);

	Adapt.assessment.initialize();

});