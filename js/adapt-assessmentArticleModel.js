define([
	'coreJS/adapt',
	'./adapt-assessmentQuestionBank'
], function(Adapt, QuestionBank) {

	var AssessmentModel = {

		postInitialize: function() {
			if (!this.isAssessmentEnabled()) return;

			var assessmentConfig = this.get("_assessment");

			_.extend(this, {
				'_currentQuestionComponents': null,
				"_originalChildModels": null,
				"_questionBanks": null
			});

			this.set({
				'_assessmentCompleteInSession': false,
				'_attemptInProgress': false, 
				'_numberOfQuestionsAnswered': 0,
				'_lastAttemptScoreAsPercent': 0,
				"_attemptsLeft": parseInt(assessmentConfig._attempts || 0)
			});

		},

		init: function() {
			this._originalChildModels = this.getChildren().models;
			this._currentQuestionComponents = this.findDescendants("components").where({_isQuestionType: true});
			this.setAssessmentOwnershipOnChildrenModels();
			Adapt.assessment.addArticleAssessment(this, this.getStateModel());
			this.restoreArticleState();
		},

		restoreArticleState: function() {
			// if assessment completed in a previous session 
			// then set article model to complete
		
			var resetArticleCompletionStatus = !this.get('_isComplete') && Adapt.course.get('_isAssessmentPassed');
			if (!resetArticleCompletionStatus) return;
			
			this.setCompletionStatus();
		},

		setAssessmentOwnershipOnChildrenModels: function() {
			for (var i = 0, l = this._originalChildModels.length; i < l; i++) {
				var blockModel = this._originalChildModels[i];
				blockModel.set({
					_isPartOfAssessment: true
				});
			}
		},

		getAssessmentId: function() {
			var assessmentConfig = this.get("_assessment");
			return assessmentConfig._id;
		},

		isAssessmentEnabled: function() {
			if (this.get("_assessment") && this.get("_assessment")._isEnabled) return true;
			return false;
		},

		checkResetAssessment: function() {
			var assessmentConfig = this.get("_assessment");
			if (this.get("_assessmentCompleteInSession") && !assessmentConfig._isResetOnRevisit) return false;
			
			if (!this.isAttemptsLeft()) return;

			this.setAssessmentData();

			return true;
		},

		spendAttempt: function() {
			if (!this.isAttemptsLeft()) return false;

			var attemptsLeft = this.get('_attemptsLeft');
			attemptsLeft--;
			this.set('_attemptsLeft', attemptsLeft);

			return true;
		},

		isAttemptsLeft: function() {
			var assessmentConfig = this.get("_assessment");

			var isAttemptsEnabled = assessmentConfig._attempts && assessmentConfig._attempts > 0;
			if (!isAttemptsEnabled) return true;

			if (this.get('_attemptsLeft') === 0) return false;
		
			return true;
		},	

		setAssessmentData: function() {
			var assessmentConfig = this.get("_assessment");

			console.log("assessment:setAssessmentData", this);

			this.set("_numberOfQuestionsAnswered", 0);
			this.getChildren().models = this._originalChildModels;
			
			
			var quizModels;
			if (!this.get("_attemptInProgress")) {
				if(assessmentConfig._banks && assessmentConfig._banks._isEnabled && assessmentConfig._banks._split.length > 1) {
					console.log("setting up banked assessment")
					quizModels = this.setupBankedAssessment();				
				} else if(assessmentConfig._randomisation && assessmentConfig._randomisation._isEnabled) {
					console.log("setting up randomized assessment")
					quizModels = this.setupRandomisedAssessment();
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

			this.resetQuestions();
			this.overrideQuestionFeedbackAttributes();

			this.setupQuestionListeners();
			
		},

		setupBankedAssessment: function() {
			var assessmentConfig = this.get("_assessment");

			console.log("assessment:setupBankedAssessment", this);
			
			this.setupBanks();

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

		setupBanks: function() {
			if (this._questionBanks) return;

			var assessmentConfig = this.get("_assessment");
			var banks = assessmentConfig._banks._split.split(",");

			this._questionBanks = [];

			//build fresh banks
			for (var i = 0, l = banks.length; i < l; i++) {
				var bank = banks[i];
				var bankId = (i+1);
				var questionBank = new QuestionBank(bankId, this.get("_id"), bank, assessmentConfig._banks._uniqueQuestions);
				this._questionBanks[bankId] = questionBank;
			}

			//add blocks to banks
			var children = this.getChildren().models;
			for (var i = 0, l = children.length; i < l; i++) {
				var blockModel = children[i];
				var bankId = blockModel.get('_quizBankID');
				this._questionBanks[bankId].addBlock(blockModel);
			}
			console.log(this._questionBanks);
		},

		setupRandomisedAssessment: function() {
			var assessmentConfig = this.get("_assessment");

			console.log("assessment:setupRandomisedAssessment", this);

			var randomisationModel = assessmentConfig._randomisation;
			var blockModels = this.getChildren().models;
			
			var questionModels = _.shuffle(blockModels);

			questionModels = questionModels.slice(0, randomisationModel._blockCount);
			
			return questionModels;
		},

		resetQuestions: function() {
			var assessmentConfig = this.get("_assessment");
			var questionComponents = this._currentQuestionComponents;

			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				question.reset(assessmentConfig._isResetOnRevisit, true);
			}
		},

		overrideQuestionFeedbackAttributes: function() {
			var assessmentConfig = this.get("_assessment");
			var questionComponents = this._currentQuestionComponents;

			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				question.set({
					'_canShowFeedback': assessmentConfig._canShowFeedback
				}, { pluginName: "_assessment" });
			}

			//TODO: figure this out in results component
			/*var componentsCollection = new Backbone.Collection(this.allChildComponents);
			var resultsComponent = componentsCollection.findWhere({_component: "results"});
			if(resultsComponent) {
				resultsComponent.set({'_isResetOnRevisit': this.get('_isResetOnRevisit')}, {pluginName:"_assessment"});
			}*/
		},

		setupQuestionListeners: function() {
			var questionComponents = this._currentQuestionComponents;
			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				this.listenTo(question, 'change:_isInteractionComplete', this.onQuestionCompleted);
			}
			this.listenTo(Adapt, "remove", this.onRemove);
		},

		removeQuestionListeners: function() {
			var questionComponents = this._currentQuestionComponents;
			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				this.stopListening(question, 'change:_isInteractionComplete', this.onQuestionCompleted);
			}
		},


		onQuestionCompleted: function(questionModel, value) {
			if (value === false) return;
			if(!questionModel.get('_isInteractionComplete')) return;

			var numberOfQuestionsAnswered = this.get("_numberOfQuestionsAnswered");
			numberOfQuestionsAnswered++;
			this.set("_numberOfQuestionsAnswered", numberOfQuestionsAnswered);

			console.log("assessment:questionCompleted", questionModel);

			this.checkAssessmentComplete();
		},

		checkAssessmentComplete: function() {
			var numberOfQuestionsAnswered = this.get("_numberOfQuestionsAnswered");

			var allQuestionsAnswered = numberOfQuestionsAnswered >= this._currentQuestionComponents.length;
			if (!allQuestionsAnswered) return;
			
			this.onAssessmentComplete();
		},

		onAssessmentComplete: function() {
			var assessmentConfig = this.get("_assessment");

			this.set("_attemptInProgress", false);
			this.spendAttempt();

			console.log("assessment-model onAssessmentComplete");

			var scoreAsPercent = this.getScoreAsPercent();

			this.set({
				'_lastAttemptScoreAsPercent': scoreAsPercent,
				'_assessmentCompleteInSession': true,
			});

			this.removeQuestionListeners();		
			
			//Adapt.course.set('_isAssessmentAttemptComplete', true);

			Adapt.trigger('assessments:complete', this.getStateModel());
		},

		getScore: function() {
			var score = 0;
			var questionComponents = this._currentQuestionComponents;
			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				if (question.get('_isCorrect') && question.get('_questionWeight')) score += question.get('_questionWeight');
			}
			return score;
		},
		
		getMaxScore: function() {
			var maxScore = 0;
			var questionComponents = this._currentQuestionComponents;
			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var question = questionComponents[i];
				if (question.get('_questionWeight')) maxScore += question.get('_questionWeight');
			}
			return maxScore;
		},
		
		getScoreAsPercent: function() {
			if (this.getMaxScore() === 0) return 0;
			return Math.round((this.getScore() / this.getMaxScore()) * 100);
		},

		getLastAttemptScoreAsPercent: function() {
			return this.get('_lastAttemptScoreAsPercent');
		},

		getStateModel: function() {
			var assessmentConfig = this.get("_assessment");

			var isPercentageBased = assessmentConfig._isPercentageBased;
			var scoreToPass = assessmentConfig._scoreToPass;
			var score = this.getScore();
			var scoreAsPercent = this.getScoreAsPercent();
			var maxScore = this.getMaxScore();
			
			var isPass = false;
			if (isPercentageBased) {
				isPass = (scoreAsPercent >= scoreToPass) ? true : false;
			} else {
				isPass = (score >= scoreToPass) ? true : false;
			}

			var allBanks = {};
			var allQuestions = {};

			var questionComponents = this._currentQuestionComponents;
			for (var i = 0, l = questionComponents.length; i < l; i++) {
				var questionComponent = questionComponents[i];

				var blockModel = Adapt.findById(questionComponent.get("_parentId"));

				var questionModel = {
					_quizBankID: blockModel.get('_quizBankID'),
					_isCorrect: questionComponent.get("_isCorrect"),
					title: questionComponent.get("title"),
					_id: questionComponent.get("_id")
				};

				//build array of questions
				allQuestions[questionModel._id] = questionModel;

				//build hash of bank questions
				if (!allBanks[questionModel._quizBankID]) {
					allBanks[questionModel._quizBankID] = { allQuestions: {}, _quizBankID: questionModel._quizBankID };
				}
				allBanks[questionModel._quizBankID].allQuestions[questionModel._id] = questionModel;
			}

			return  {
				id: assessmentConfig._id,
				isPercentageBased: isPercentageBased,
				assessmentWeight: assessmentConfig._assessmentWeight,
				postScoreToLMS: assessmentConfig._postScoreToLMS,
				attemptsLeft: this.get("_attemptsLeft"),
				isPass: isPass,
				score: score,
				scoreAsPercent: scoreAsPercent,
				maxScore: maxScore,
				allQuestions: allQuestions,
				allBanks: allBanks
			};
		},

		onRemove: function() {
			this.removeQuestionListeners();
		}
	};

	return AssessmentModel;
});
