define([
	'coreJS/adapt',
	'./adapt-assessmentArticleExtension'
], function(Adapt) {

	/*
		Here we setup a registry for all assessments
	*/

	Adapt.assessment = _.extend({
		_byArticleId: {},
		_byPageId: {},
		_byAssessmentId: {},
		_stateModels: {},

		initialize: function() {
			this.listenTo(Adapt, "assessments:complete", this.onAssessmentsComplete);
			this.listenTo(Adapt, "router:location", this.checkResetAssessmentsOnRevisit);
		},

		addArticleAssessment: function(articleModel, completedModel) {
			this._byArticleId[articleModel.get("_id")] = articleModel;

			if (this._byPageId[articleModel.get("_parentId")] === undefined) {
				this._byPageId[articleModel.get("_parentId")] = [];
			}
			this._byPageId[articleModel.get("_parentId")].push(articleModel);

			this._byAssessmentId[articleModel.get("_assessment")._id] = articleModel;
			this._stateModels[articleModel.get("_assessment")._id] = completedModel

		},

		getByArticleId: function(articleId) {
			return this._byArticleId[id];
		},

		getByPageId: function(pageId) {
			return this._byPageId[pageId];
		},

		getByAssessmentId: function(assessmentId) {
			return this._byAssessmentId[assessmentId];
		},

		onAssessmentsComplete: function(stateModel) {
			console.log("stateModel", stateModel);

			stateModel.isComplete = true;
			if (stateModel.id === undefined) return;

			if (!this._stateModels[stateModel.id]) {
				console.warn("assessments: stateModel was not registered when assessment was created");
			}
			this._stateModels[stateModel.id] = stateModel

			this.checkCourseCompletion();

			this.checkAssessmentsComplete();

			//need to add spoor assessment state saving

		},

		checkAssessmentsComplete: function() {
			var allAssessmentsComplete = true;
			var assessmentToPostBack = 0;
			for (var id in this._stateModels) {
				var stateModel = this._stateModels[id];
				if (!stateModel.postScoreToLMS) continue;
				if (!stateModel.isComplete) {
					allAssessmentsComplete = false;
					break;
				}
				assessmentToPostBack++;
			}

			if (!allAssessmentsComplete || assessmentToPostBack === 0) return false;

			this.postScoreToLMS();

			return true;
		},

		postScoreToLMS: function() {
			var score = 0;
			var maxScore = 0;
			var isPass = true;

			for (var id in this._stateModels) {
				var stateModel = this._stateModels[id];
				maxScore += stateModel.maxScore / stateModel.assessmentWeight;
				score += stateModel.score / stateModel.assessmentWeight;
				isPass = isPass === false ? false : stateModel.isPass;
			}

			var assessmentsConfig = Adapt.course.get("_assessments");
			var scoreAsPercent = (score / maxScore) * 100;

			if (assessmentsConfig._scoreToPass) {
				if (assessmentsConfig._isPercentageBased) {
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

		checkCourseCompletion: function() {
			// if the assessment is complete, and all non-assessment blocks are complete - then
			// all required course content has been viewed - set course to complete
			var nonAssessmentBlockModels = new Backbone.Collection(Adapt.blocks.where({_isPartOfAssessment: undefined}));
			var incompleteBlocks = nonAssessmentBlockModels.where({_isComplete: false});

			var areAllNonAssessmentBlocksComplete = (incompleteBlocks.length === 0);
			if (!areAllNonAssessmentBlocksComplete) return false;

			Adapt.course.set('_isComplete', true);

			return true;
		},

		checkResetAssessmentsOnRevisit: function(toObject) {
			/* 
				Here we hijack router:location to reorganise the assessment blocks 
				this must happen before trickle listens to block completion
			*/
			if (toObject._contentType !== "page") return;

			//initialize assessment on page visit before pageView:preRender (and trickle)
			var pageAssessmentModels = this.getByPageId(toObject._currentId);
			if (pageAssessmentModels === undefined) return;

			for (var i = 0, l = pageAssessmentModels.length; i < l; i++) {
				var pageAssessmentModel = pageAssessmentModels[i];
				pageAssessmentModel.checkResetAssessment();
			}

		}

	}, Backbone.Events);
	Adapt.assessment.initialize();

});