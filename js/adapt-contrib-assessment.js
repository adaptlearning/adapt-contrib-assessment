define([
	'coreJS/adapt',
	'./adapt-assessmentArticleExtension'
], function(Adapt) {

	/*
		Here we setup a registry for all assessments
	*/

	var assessmentsConfigDefaults = {
        "_postTotalScoreToLms": true,
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

		_checkAssessmentsComplete: function() {
			var allAssessmentsComplete = true;
			var assessmentToPostBack = 0;
			var states = this._getStatesByAssessmentId();

			var assessmentStates = [];

			for (var id in states) {
				var state = states[id];
				if (!state.postScoreToLms) continue;
				if (!state.isComplete) {
					allAssessmentsComplete = false;
					break;
				}
				assessmentToPostBack++;
				assessmentStates.push(state);
			}

			if (!allAssessmentsComplete || assessmentToPostBack === 0) return false;

			if (assessmentToPostBack === 1) {
				this._setupSingleAssessmentConfiguration(assessmentStates[0]);
			}

			this._postScoreToLms();

			return true;
		},

		_setupSingleAssessmentConfiguration: function(assessmentState) {
			var assessmentsConfig = Adapt.course.get("_assessment");
			if (assessmentsConfig === undefined) {
				assessmentsConfig = $.extend(true, {}, assessmentsConfigDefaults, {
					"_postTotalScoreToLms": assessmentState.postScoreToLms,
					"_isPercentageBased": assessmentState.isPercentageBased,
        			"_scoreToPass": assessmentState.scoreToPass
				});
				Adapt.course.set("_assessment", assessmentsConfig);
			}
		},

		_postScoreToLms: function() {
			var assessmentsConfig = this._getAssessmentsConfig();

			if (assessmentsConfig._postTotalScoreToLms === false) return;

			var score = 0;
			var maxScore = 0;
			var isPass = true;
			var totalAssessments = 0;

			var states = this._getStatesByAssessmentId();

			for (var id in states) {
				var state = states[id];
				totalAssessments++;
				maxScore += state.maxScore / state.assessmentWeight;
				score += state.score / state.assessmentWeight;
				isPass = isPass === false ? false : state.isPass;
			}

			
			var scoreAsPercent = Math.round((score / maxScore) * 100);

			if (assessmentsConfig._scoreToPass || 100) {
				if (assessmentsConfig._isPercentageBased || true) {
					if (scoreAsPercent >= assessmentsConfig._scoreToPass) isPass = true;
				} else {
					if (score >= assessmentsConfig._scoreToPass) isPass = true;
				}
			}

			//post completion to spoor
			_.defer(function() {
				Adapt.trigger("assessment:complete", {
					isPercentageBased: assessmentsConfig._isPercentageBased,
					isPass: isPass,
					scoreAsPercent: scoreAsPercent,
					maxScore: maxScore,
					score: score,
					assessments: totalAssessments
				});
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