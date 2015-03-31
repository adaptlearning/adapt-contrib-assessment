define([
	'coreJS/adapt',
	'./adapt-assessmentQuestionBank'
], function(Adapt, QuestionBank) {


	var givenIdCount = 0;
	var assessmentConfigDefaults = {
        "_isEnabled":true,
        "_questions": {
            "_isResetOnRevisit": "hard",
            "_canShowFeedback": false
        },
        "_isPercentageBased" : true,
        "_scoreToPass" : 100,
        "_postScoreToLMS": true,
        "_assessmentWeight": 1,
        "_isResetOnRevisit": true,
        "_isReloadPageOnReset": true,
        "_attempts": 0
    };

	var AssessmentModel = {

	//Private functions

		_postInitialize: function() {
			if (!this.isAssessmentEnabled()) return;

			var assessmentConfig = this._getAssessmentConfig();

			_.extend(this, {
				'_currentQuestionComponents': null,
				"_originalChildModels": null,
				"_questionBanks": null,
				"_forceResetOnRevisit": false
			});

			this.set({
				'_currentQuestionComponentIds': [],
				'_assessmentCompleteInSession': false,
				'_attemptInProgress': false, 
				'_numberOfQuestionsAnswered': 0,
				'_lastAttemptScoreAsPercent': 0,
				"_attemptsLeft": assessmentConfig._attempts > 0 ? assessmentConfig._attempts : true,
				"_attemptsSpent": 0
			});

			this.listenToOnce(Adapt, "app:dataReady", this._onDataReady);
			this.listenTo(Adapt, "remove", this._onRemove);

		},

		init: function() {
			//save original children
			this._originalChildModels = this.getChildren().models;
			//collect all question components
			this._currentQuestionComponents = this.findDescendants("components").where({_isQuestionType: true});
			var currentQuestionsCollection = new Backbone.Collection(this._currentQuestionComponents);
			this.set("_currentQuestionComponentIds", currentQuestionsCollection.pluck("_id"));

			this._setAssessmentOwnershipOnChildrenModels();

			//check if article is complete from previous session
			this._restoreArticleState();
		},

		_setAssessmentOwnershipOnChildrenModels: function() {
			//mark all children components as belonging to an assessment
			for (var i = 0, l = this._originalChildModels.length; i < l; i++) {
				var blockModel = this._originalChildModels[i];
				blockModel.set({
					_isPartOfAssessment: true
				});
			}
		},

		_restoreArticleState: function() {
			// if assessment completed in a previous session 
			// then set article model to complete
		
			var resetArticleCompletionStatus = !this.get('_isComplete') && 
													Adapt.course.get('_isAssessmentPassed');
			if (!resetArticleCompletionStatus) return;
			
			this.setCompletionStatus();
		},

		_onDataReady: function() {
			//register assessment
			Adapt.assessment.register(this);
		},

		_setupAssessmentData: function() {
			var assessmentConfig = this._getAssessmentConfig();

			this.set("_numberOfQuestionsAnswered", 0);
			this.getChildren().models = this._originalChildModels;
			
			
			var quizModels;
			if (!this.get("_attemptInProgress")) {
				if(assessmentConfig._banks && 
						assessmentConfig._banks._isEnabled && 
						assessmentConfig._banks._split.length > 1) {

					quizModels = this._setupBankedAssessment();				
				} else if(assessmentConfig._randomisation && 
						assessmentConfig._randomisation._isEnabled) {

					quizModels = this._setupRandomisedAssessment();
				}
				this.set("_attemptInProgress", true);
			}

			if (!quizModels) {
				// leave the order as before, completed or not
				quizModels = this.getChildren().models;
			} else if ( quizModels.length === 0 ) {
				quizModels = this.getChildren().models;
				console.warn("assessment: Not enough unique questions to create a fresh assessment, using last selection");
			}

			this.getChildren().models = quizModels;

			this._currentQuestionComponents = this.findDescendants('components').where({_isQuestionType: true});
			var currentQuestionsCollection = new Backbone.Collection(this._currentQuestionComponents);
			this.set("_currentQuestionComponentIds", currentQuestionsCollection.pluck("_id"));

			this._resetQuestions();
			this._overrideQuestionFeedbackAttributes();

			this._setupQuestionListeners();
			
		},

		_setupBankedAssessment: function() {
			var assessmentConfig = this._getAssessmentConfig();

			this._setupBanks();

			//get random questions from banks
			var questionModels = [];
			for (var bankId in this._questionBanks) {
				var questionBank = this._questionBanks[bankId];
				var questions = questionBank.getRandomQuestionBlocks();
				questionModels = questionModels.concat(questions);
			}

			//if overall question order should be randomized
			if (assessmentConfig._banks._randomizeBankQuestionOrder) {
				questionModels = _.shuffle(questionModels);
			}

			return questionModels;
		},

		_setupBanks: function() {
			if (this._questionBanks) return;

			var assessmentConfig = this._getAssessmentConfig();
			var banks = assessmentConfig._banks._split.split(",");

			this._questionBanks = [];

			//build fresh banks
			for (var i = 0, l = banks.length; i < l; i++) {
				var bank = banks[i];
				var bankId = (i+1);
				var questionBank = new QuestionBank(bankId, 
												this.get("_id"), 
												bank, 
												assessmentConfig._banks._uniqueQuestions);

				this._questionBanks[bankId] = questionBank;
			}

			//add blocks to banks
			var children = this.getChildren().models;
			for (var i = 0, l = children.length; i < l; i++) {
				var blockModel = children[i];
				var bankId = blockModel.get('_quizBankID');
				this._questionBanks[bankId].addBlock(blockModel);
			}

		},

		_setupRandomisedAssessment: function() {
			var assessmentConfig = this._getAssessmentConfig();

			var randomisationModel = assessmentConfig._randomisation;
			var blockModels = this.getChildren().models;
			
			var questionModels = _.shuffle(blockModels);

			questionModels = questionModels.slice(0, randomisationModel._blockCount);
			
			return questionModels;
		},

		_overrideQuestionFeedbackAttributes: function() {
			var assessmentConfig = this._getAssessmentConfig();
			var questionComponents = this._currentQuestionComponents;

			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				question.set({
					'_canShowFeedback': assessmentConfig._questions._canShowFeedback
				}, { pluginName: "_assessment" });
			}

			//TODO: figure this out in results component
			/*var componentsCollection = new Backbone.Collection(this.allChildComponents);
			var resultsComponent = componentsCollection.findWhere({_component: "results"});
			if(resultsComponent) {
				resultsComponent.set({'_isResetOnRevisit': this.get('_isResetOnRevisit')}, {pluginName:"_assessment"});
			}*/
		},

		_setupQuestionListeners: function() {
			var questionComponents = this._currentQuestionComponents;
			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				this.listenTo(question, 'change:_isInteractionComplete', this._onQuestionCompleted);
			}
		},

		_removeQuestionListeners: function() {
			var questionComponents = this._currentQuestionComponents;
			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				this.stopListening(question, 'change:_isInteractionComplete', this._onQuestionCompleted);
			}
		},

		_onQuestionCompleted: function(questionModel, value) {
			if (value === false) return;
			if(!questionModel.get('_isInteractionComplete')) return;

			var numberOfQuestionsAnswered = this.get("_numberOfQuestionsAnswered");
			numberOfQuestionsAnswered++;
			this.set("_numberOfQuestionsAnswered", numberOfQuestionsAnswered);

			this._checkAssessmentComplete();
		},

		_checkAssessmentComplete: function() {
			var numberOfQuestionsAnswered = this.get("_numberOfQuestionsAnswered");

			var allQuestionsAnswered = numberOfQuestionsAnswered >= this._currentQuestionComponents.length;
			if (!allQuestionsAnswered) return;
			
			this._onAssessmentComplete();
		},

		_onAssessmentComplete: function() {
			var assessmentConfig = this._getAssessmentConfig();

			this.set("_attemptInProgress", false);
			this._spendAttempt();

			var scoreAsPercent = this._getScoreAsPercent();

			this.set({
				'_lastAttemptScoreAsPercent': scoreAsPercent,
				'_assessmentCompleteInSession': true,
			});

			this._removeQuestionListeners();		
			
			Adapt.trigger('assessments:complete', this.getState(), this);
		},

		_isAttemptsLeft: function() {
			var assessmentConfig = this._getAssessmentConfig();

			var isAttemptsEnabled = assessmentConfig._attempts && 
										assessmentConfig._attempts > 0;

			if (!isAttemptsEnabled) return true;

			if (this.get('_attemptsLeft') === 0) return false;
		
			return true;
		},	

		_spendAttempt: function() {
			if (!this._isAttemptsLeft()) return false;

			var attemptsSpent = this.get("_attemptsSpent");
			attemptsSpent++;
			this.set("_attemptsSpent", attemptsSpent);

			if (this.get('_attempts') === 0) return true;

			var attemptsLeft = this.get('_attemptsLeft');
			attemptsLeft--;
			this.set('_attemptsLeft', attemptsLeft);

			return true;
		},

		_getScore: function() {
			var score = 0;
			var questionComponents = this._currentQuestionComponents;
			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				if (question.get('_isCorrect') && 
					question.get('_questionWeight')) {
					score += question.get('_questionWeight');
				}
			}
			return score;
		},
		
		_getMaxScore: function() {
			var maxScore = 0;
			var questionComponents = this._currentQuestionComponents;
			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				if (question.get('_questionWeight')) {
					maxScore += question.get('_questionWeight');
				}
			}
			return maxScore;
		},
		
		_getScoreAsPercent: function() {
			if (this._getMaxScore() === 0) return 0;
			return Math.round((this._getScore() / this._getMaxScore()) * 100);
		},

		_getLastAttemptScoreAsPercent: function() {
			return this.get('_lastAttemptScoreAsPercent');
		},

		_checkReloadPage: function() {
			if (!this.canResetInPage()) return false;

			var parentId = this.getParent().get("_id");
			var currentLocation = Adapt.location._currentId;

			//check if on assessment page and should rerender page
			if (currentLocation != parentId) return false;
			if (!this.get("_isReady")) return false;

			return true;
		},

		_reloadPage: function() {
			this._forceResetOnRevisit = true;

			Backbone.history.navigate("#/id/"+Adapt.location._currentId, { replace:true, trigger: true });
		},

		_resetQuestions: function() {
			var assessmentConfig = this._getAssessmentConfig();
			var questionComponents = this._currentQuestionComponents;

			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				question.reset(assessmentConfig._questions._isResetOnRevisit, true);
			}
		},

		_onRemove: function() {
			this._removeQuestionListeners();
		},

		_getAssessmentConfig: function() {
			var assessmentConfig = this.get("_assessment");

			if (assessmentConfig._id === undefined) {
				assessmentConfig._id = "givenId"+(givenIdCount++);
			}

			if (!assessmentConfig) {
				assessmentConfig = $.extend(true, {}, assessmentConfigDefaults);
			} else {
				assessmentConfig = $.extend(true, {}, assessmentConfigDefaults, assessmentConfig);
			}

			return assessmentConfig;
		},

	//Public Functions

		isAssessmentEnabled: function() {
			if (this.get("_assessment") && 
				this.get("_assessment")._isEnabled) return true;
			return false;
		},

		canResetInPage: function() {
			var assessmentConfig = this._getAssessmentConfig();
			if (assessmentConfig._isReloadPageOnReset === false) return false;
			return true;
		},

		reset: function(force) {
			var assessmentConfig = this._getAssessmentConfig();

			//check if forcing reset
			force = this._forceResetOnRevisit || force;
			this._forceResetOnRevisit = false;

			var isPageReload = this._checkReloadPage();

			//stop resetting if not complete or not allowed
			if (this.get("_assessmentCompleteInSession") && 
					!assessmentConfig._isResetOnRevisit && 
					!isPageReload && 
					!force) return false;
			
			//stop resetting if no attempts left
			if (!this._isAttemptsLeft() && !force) return false;

			if (!isPageReload) {
				//only perform this section when not attempting to reload the page
				this._setupAssessmentData();
				Adapt.trigger('assessments:reset', this.getState(), this);
			} else {
				this._reloadPage();
			}

			return true;
		},

		getState: function() {
			//return the current state of the assessment
			//create snapshot of values so as not to create memory leaks
			var assessmentConfig = this._getAssessmentConfig();

			var isPercentageBased = assessmentConfig._isPercentageBased;
			var scoreToPass = assessmentConfig._scoreToPass;
			var score = this._getScore();
			var scoreAsPercent = this._getScoreAsPercent();
			var maxScore = this._getMaxScore();
			
			var isPass = false;
			if (isPercentageBased) {
				isPass = (scoreAsPercent >= scoreToPass) ? true : false;
			} else {
				isPass = (score >= scoreToPass) ? true : false;
			}

			var questions = [];

			var questionComponents = this._currentQuestionComponents;
			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var questionComponent = questionComponents[i];

				var questionModel = {
					_id: questionComponent.get("_id"),
					_isCorrect: questionComponent.get("_isCorrect"),
					title: questionComponent.get("title"),
					displayTitle: questionComponent.get("displayTitle"),
				};

				//build array of questions
				questions.push(questionModel);

			}

			return  {
				id: assessmentConfig._id,
				type: "article-assessment",
				pageId: this.getParent().get("_id"),
				isEnabled: assessmentConfig._isEnabled,
				isComplete: this.get("_isComplete"),
				isPercentageBased: isPercentageBased,
				scoreToPass: scoreToPass,
				score: score,
				scoreAsPercent: scoreAsPercent,
				maxScore: maxScore,
				isPass: isPass,
				postScoreToLMS: assessmentConfig._postScoreToLMS,
				assessmentWeight: assessmentConfig._assessmentWeight,
				attempts: assessmentConfig._attempts,
				attemptsSpent: this.get("_attemptsSpent"),
				attemptsLeft: this.get("_attemptsLeft"),
				lastAttemptScoreAsPercent: this.get('_lastAttemptScoreAsPercent'),
				questions: questions
			};
		}
	};

	return AssessmentModel;
});
