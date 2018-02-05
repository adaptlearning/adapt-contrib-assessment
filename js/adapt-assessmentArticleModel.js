define([
    'core/js/adapt',
    './adapt-assessmentQuestionBank'
], function(Adapt, QuestionBank) {


    var givenIdCount = 0;
    var assessmentConfigDefaults = {
        "_isEnabled":true,
        "_questions": {
            "_resetType": "soft",
            "_canShowFeedback": false,
            "_canShowMarking": false,
            "_canShowModelAnswer": false
        },
        "_suppressMarking": false,
        "_isPercentageBased" : true,
        "_scoreToPass" : 100,
        "_includeInTotalScore": true,
        "_assessmentWeight": 1,
        "_isResetOnRevisit": true,
        "_reloadPageOnReset": true,
        "_attempts": "infinite",
        "_allowResetIfPassed": false
    };

    var AssessmentModel = {

    //Private functions

        _postInitialize: function() {
            if (!this.isAssessmentEnabled()) return;

            var assessmentConfig = this.getConfig();

            _.extend(this, {
                '_currentQuestionComponents': null,
                "_originalChildModels": null,
                "_questionBanks": null,
                "_forceResetOnRevisit": false
            });

            var attemptsLeft;
            switch (assessmentConfig._attempts) {
                case "infinite": case 0: case undefined: case -1: case null:
                     attemptsLeft = "infinite";
                    break;
                default:
                    attemptsLeft = assessmentConfig._attempts;
                    break;
            }

            this.set({
                '_currentQuestionComponentIds': [],
                '_assessmentCompleteInSession': false,
                '_attemptInProgress': false,
                "_isAssessmentComplete": false,
                '_numberOfQuestionsAnswered': 0,
                '_lastAttemptScoreAsPercent': 0,
                "_attempts": attemptsLeft,
                "_attemptsLeft": attemptsLeft,
                "_attemptsSpent": 0
            });

            this.listenToOnce(Adapt, "app:dataReady", this._onDataReady);
            this.listenTo(Adapt, "remove", this._onRemove);

        },

        init: function() {
            //save original children
            this._originalChildModels = this.getChildren().models;
            //collect all question components
            this._currentQuestionComponents = _.filter(this.findDescendantModels("components"), function(comp) {
                return comp.get('_isQuestionType') === true;
            });
            this.set("_currentQuestionComponentIds", _.map(this._currentQuestionComponents, function(comp) {
                return comp.get("_id");
            }));

            this._setAssessmentOwnershipOnChildrenModels();

        },

        _setAssessmentOwnershipOnChildrenModels: function() {
            //mark all children components as belonging to an assessment
            for (var i = 0, l = this._originalChildModels.length; i < l; i++) {
                var blockModel = this._originalChildModels[i];
                blockModel.set({
                    _isPartOfAssessment: true
                });
                //make sure components are set to _isPartOfAssessment for plp checking
                blockModel.setOnChildren({
                    _isPartOfAssessment: true
                });
            }
        },


        _onDataReady: function() {
            //register assessment
            Adapt.assessment.register(this);
        },

        _setupAssessmentData: function(force, callback) {
            var assessmentConfig = this.getConfig();
            var state = this.getState();
            var shouldResetAssessment = (!this.get("_attemptInProgress") && !state.isPass) || force === true;
            var shouldResetQuestions = (assessmentConfig._isResetOnRevisit !== false && !state.isPass) || force === true;

            if (shouldResetAssessment || shouldResetQuestions) {
                Adapt.trigger('assessments:preReset', this.getState(), this);
            }
            
            var quizModels;
            if (shouldResetAssessment) {
                this.set("_numberOfQuestionsAnswered", 0);
                this.set("_isAssessmentComplete", false);
                this.set("_assessmentCompleteInSession", false);
                this.set("_score", 0);
                this.getChildren().models = this._originalChildModels;
                if(assessmentConfig._banks &&
                        assessmentConfig._banks._isEnabled &&
                        assessmentConfig._banks._split.length > 1) {

                    quizModels = this._setupBankedAssessment();
                } else if(assessmentConfig._randomisation &&
                        assessmentConfig._randomisation._isEnabled) {

                    quizModels = this._setupRandomisedAssessment();
                }
            }

            if (!quizModels) {
                // leave the order as before, completed or not
                quizModels = this.getChildren().models;
            } else if ( quizModels.length === 0 ) {
                quizModels = this.getChildren().models;
                console.warn("assessment: Not enough unique questions to create a fresh assessment, using last selection");
            }

            this.getChildren().models = quizModels;

            this._currentQuestionComponents = _.filter(this.findDescendantModels('components'), function(comp) {
                return comp.get('_isQuestionType') === true;
            });
            this.set("_currentQuestionComponentIds", _.map(this._currentQuestionComponents, function(comp) {
                return comp.get("_id");
            }));

            if (shouldResetAssessment || shouldResetQuestions) {
                this._resetQuestions(_.bind(function() {
                    this.set("_attemptInProgress", true);
                    Adapt.trigger('assessments:reset', this.getState(), this);

                    finalise.apply(this);
                }, this));
            } else {
                finalise.apply(this);
            }

            function finalise() {
                if (!state.isComplete) {
                    this.set("_attemptInProgress", true);
                }
                
                this._overrideQuestionComponentSettings();
                this._setupQuestionListeners();
                this._checkNumberOfQuestionsAnswered();
                this._updateQuestionsState();

                Adapt.assessment.saveState();

                if (typeof callback == 'function') callback.apply(this);
                
                if (shouldResetAssessment || shouldResetQuestions) {
                    Adapt.trigger('assessments:postReset', this.getState(), this);
                }
            }
        },

        _setupBankedAssessment: function() {
            var assessmentConfig = this.getConfig();

            this._setupBanks();

            //get random questions from banks
            var questionModels = [];
            for (var bankId in this._questionBanks) {
                if(this._questionBanks.hasOwnProperty(bankId)) { // skip over properties that were added to Array.prototype by the ES5-shim for IE8
                    var questionBank = this._questionBanks[bankId];
                    var questions = questionBank.getRandomQuestionBlocks();
                    questionModels = questionModels.concat(questions);
                }
            }

            //if overall question order should be randomized
            if (assessmentConfig._banks._randomisation) {
                questionModels = _.shuffle(questionModels);
            }

            return questionModels;
        },

        _setupBanks: function() {
            var assessmentConfig = this.getConfig();
            var banks = assessmentConfig._banks._split.split(",");
            var bankId;

            this._questionBanks = [];

            //build fresh banks
            for (var i = 0, l = banks.length; i < l; i++) {
                var bank = banks[i];
                bankId = (i+1);
                var questionBank = new QuestionBank(bankId, 
                                                this.get("_id"), 
                                                bank,
                                                true);

                this._questionBanks[bankId] = questionBank;
            }

            //add blocks to banks
            var children = this.getChildren().models;
            for (var j = 0, count = children.length; j < count; j++) {
                var blockModel = children[j];
                var blockAssessmentConfig = blockModel.get('_assessment');
                bankId = blockAssessmentConfig._quizBankID;
                this._questionBanks[bankId].addBlock(blockModel);
            }

        },

        _setupRandomisedAssessment: function() {
            var assessmentConfig = this.getConfig();

            var randomisationModel = assessmentConfig._randomisation;
            var blockModels = this.getChildren().models;

            var questionModels = _.shuffle(blockModels);

            if (randomisationModel._blockCount > 0) {
                questionModels = questionModels.slice(0, randomisationModel._blockCount);
            }
            
            return questionModels;
        },

        _overrideQuestionComponentSettings: function() {
            var newSettings = this._getMarkingSettings();

            // Add any additional setting overrides here
            var questionConfig = this.getConfig()._questions;
            if (questionConfig.hasOwnProperty('_canShowFeedback')) {
                newSettings._canShowFeedback = questionConfig._canShowFeedback;
            }

            if (!_.isEmpty(newSettings)) {
                for (var i = 0, l = this._currentQuestionComponents.length; i < l; i++) {
                    this._currentQuestionComponents[i].set(newSettings, { pluginName: "_assessment" });
                }
            }
        },

        _setupQuestionListeners: function() {
            var questionComponents = this._currentQuestionComponents;
            for (var i = 0, l = questionComponents.length; i < l; i++) {
                var question = questionComponents[i];
                if (question.get("_isInteractionComplete")) continue;
                this.listenTo(question, 'change:_isInteractionComplete', this._onQuestionCompleted);
            }
        },

        _checkNumberOfQuestionsAnswered: function() {
            var questionComponents = this._currentQuestionComponents;
            var numberOfQuestionsAnswered = 0;
            for (var i = 0, l = questionComponents.length; i < l; i++) {
                var question = questionComponents[i];
                if (question.get("_isInteractionComplete")) {
                    numberOfQuestionsAnswered++;
                }
            }
            this.set("_numberOfQuestionsAnswered", numberOfQuestionsAnswered);
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

            this._updateQuestionsState();
            Adapt.assessment.saveState();

            this._checkAssessmentComplete();
        },

        _checkAssessmentComplete: function() {
            var numberOfQuestionsAnswered = this.get("_numberOfQuestionsAnswered");

            var allQuestionsAnswered = numberOfQuestionsAnswered >= this._currentQuestionComponents.length;
            if (!allQuestionsAnswered) return;

            this._onAssessmentComplete();
        },

        _onAssessmentComplete: function() {
            var assessmentConfig = this.getConfig();

            this.set("_attemptInProgress", false);
            this._spendAttempt();

            var scoreAsPercent = this._getScoreAsPercent();
            var score = this._getScore();
            var maxScore = this._getMaxScore();

            this.set({
                '_scoreAsPercent': scoreAsPercent,
                '_score': score,
                '_maxScore': maxScore,
                '_lastAttemptScoreAsPercent': scoreAsPercent,
                '_assessmentCompleteInSession': true,
                '_isAssessmentComplete': true
            });

            this._updateQuestionsState();

            this._checkIsPass();

            this._removeQuestionListeners();

            if (this._isMarkingSuppressionEnabled() && !this._isAttemptsLeft()) {
                _.defer(_.bind(function() {
                    this._overrideMarkingSettings();
                    this._refreshQuestions();
                }, this));
            }

            Adapt.trigger('assessments:complete', this.getState(), this);
        },

        _updateQuestionsState: function() {
            var questions = [];

            var questionComponents = this._currentQuestionComponents;
            for (var i = 0, l = questionComponents.length; i < l; i++) {
                var questionComponent = questionComponents[i];

                var questionModel = {
                    _id: questionComponent.get("_id"),
                    _isCorrect: questionComponent.get("_isCorrect") === undefined ? null : questionComponent.get("_isCorrect")
                };

                //build array of questions
                questions.push(questionModel);

            }

            this.set({
                '_questions': questions
            });
        },

        _checkIsPass: function() {
            var assessmentConfig = this.getConfig();

            var isPercentageBased = assessmentConfig._isPercentageBased;
            var scoreToPass = assessmentConfig._scoreToPass;

            var scoreAsPercent = this.get("_scoreAsPercent");
            var score = this.get("_score");

            var isPass = isPercentageBased ? (scoreAsPercent >= scoreToPass) : (score >= scoreToPass);

            this.set("_isPass", isPass);
        },
        
        _getMarkingSettings: function() {
            var markingSettings = {};

            if (this._shouldSuppressMarking()) {
                markingSettings = {
                    _canShowMarking: false,
                    _canShowModelAnswer: false
                };
            } else {
                var questionConfig = this.getConfig()._questions;

                if (questionConfig.hasOwnProperty('_canShowModelAnswer')) {
                    markingSettings._canShowModelAnswer = questionConfig._canShowModelAnswer;
                }

                if (questionConfig.hasOwnProperty('_canShowMarking')) {
                    markingSettings._canShowMarking = questionConfig._canShowMarking;
                }
            }

            return markingSettings;
        },

        _overrideMarkingSettings: function() {
            var newMarkingSettings = this._getMarkingSettings();
            for (var i = 0, l = this._currentQuestionComponents.length; i < l; i++) {
                this._currentQuestionComponents[i].set(newMarkingSettings, {
                    pluginName: "_assessment"
                });
            }
        },

        _refreshQuestions: function() {
            for (var a = 0, b = this._currentQuestionComponents.length; a < b; a++) {
                var question = this._currentQuestionComponents[a];
                question.refresh();
            }
        },

        _shouldSuppressMarking: function() {
            return this._isMarkingSuppressionEnabled() && this._isAttemptsLeft();
        },

        _isMarkingSuppressionEnabled: function() {
            var assessmentConfig = this.getConfig();
            return assessmentConfig._suppressMarking;
        },

        _isAttemptsLeft: function() {
            if (this.get('_isAssessmentComplete') && this.get('_isPass')) return false;

            if (this.get('_attemptsLeft') === 0) return false;

            return true;
        },

        _spendAttempt: function() {
            if (!this._isAttemptsLeft()) return false;

            var attemptsSpent = this.get("_attemptsSpent");
            attemptsSpent++;
            this.set("_attemptsSpent", attemptsSpent);

            if (this.get('_attempts') == "infinite") return true;

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

            _.delay(function() {
                Backbone.history.navigate("#/id/"+Adapt.location._currentId, { replace:true, trigger: true });
            }, 250);
        },

        _resetQuestions: function(callback) {
            var assessmentConfig = this.getConfig();
            var syncIterations = 1; // number of synchronous iterations to perform
            var i = 0, qs = this._currentQuestionComponents, len = qs.length;

            function step() {
                for (var j=0, count=Math.min(syncIterations, len-i); j < count; i++, j++) {
                    var question = qs[i];
                    question.reset(assessmentConfig._questions._resetType, true);
                }

                i == len ? callback() : setTimeout(step);
            }

            step();
        },

        _onRemove: function() {
            this._removeQuestionListeners();
        },

        _setCompletionStatus: function() {
            this.set({
                "_isComplete": true,
                "_isInteractionComplete": true
            });
        },

        _checkIfQuestionsWereRestored: function() {
            if (this.get("_assessmentCompleteInSession")) return;
            if (!this.get("_isAssessmentComplete")) return;

            //fix for courses that do not remember the user selections
            //force assessment to reset if user revisits an assessment page in a new session which is completed
            var wereQuestionsRestored = true;

            var questions = this.get("_questions");
            for (var i = 0, l = questions.length; i < l; i++) {
                var question = questions[i];
                var questionModel = Adapt.findById(question._id);
                if (!questionModel.get("_isSubmitted")) {
                    wereQuestionsRestored = false;
                    break;
                }
            }

            if (!wereQuestionsRestored) {
                this.set("_assessmentCompleteInSession", true);
                return true;
            }

            return false;
        },


    //Public Functions

        isAssessmentEnabled: function() {
            if (this.get("_assessment") &&
                this.get("_assessment")._isEnabled) return true;
            return false;
        },

        canResetInPage: function() {
            var assessmentConfig = this.getConfig();
            if (assessmentConfig._reloadPageOnReset === false) return false;
            return true;
        },

        reset: function(force, callback) {
            
            if (this._isResetInProgress) {
                // prevent multiple resets from executing. 
                // keep callbacks in queue for when current reset is finished
                this.once("reset", function() {
                    this._isResetInProgress = false;
                    if (typeof callback == 'function') {
                        callback(true);
                    }
                });
                return;
            }
            
            var assessmentConfig = this.getConfig();

            //check if forcing reset via page revisit or force parameter
            force = this._forceResetOnRevisit || force === true;
            this._forceResetOnRevisit = false;

            var isPageReload = this._checkReloadPage();

            //stop resetting if not complete or not allowed
            if (this.get("_assessmentCompleteInSession") && 
                    !assessmentConfig._isResetOnRevisit && 
                    !isPageReload && 
                    !force) {
                if (typeof callback == 'function') {
                    callback(false);
                }
                return false;
            }
            
            //check if new session and questions not restored
            var wereQuestionsRestored = this._checkIfQuestionsWereRestored();
            force = force || wereQuestionsRestored;
            // the assessment is going to be reset so we must reset attempts
            // otherwise assessment may not be set up properly in next session
            if (wereQuestionsRestored && !this._isAttemptsLeft()) {
                this.set({'_attemptsLeft':this.get('_attempts')});
                this.set({'_attemptsSpent':0});
            }
            
            var allowResetIfPassed = this.get('_assessment')._allowResetIfPassed;
            //stop resetting if no attempts left and allowResetIfPassed is false
            if (!this._isAttemptsLeft() && !force && !allowResetIfPassed) {
                if (typeof callback == 'function') callback(false);
                return false;
            }

            if (!isPageReload) {
                // only perform this section when not attempting to reload the page
                // wait for reset to trigger
                this.once("reset", function() {
                    this._isResetInProgress = false;
                    if (typeof callback == 'function') {
                        callback(true);
                    }
                });
                this._isResetInProgress = true;
                // perform asynchronous reset
                this._setupAssessmentData(force, function() {
                    this.trigger("reset");
                });
            } else {
                this._reloadPage();
                if (typeof callback == 'function') {
                    callback(true);
                }
            }

            return true;
        },

        getSaveState: function() {
            var state = this.getState();
            var indexByIdQuestions = [];
            var cfg = this.getConfig();
            var banksActive = cfg._banks && cfg._banks._isEnabled && cfg._banks._split.length > 1;
            var randomisationActive = cfg._randomisation && cfg._randomisation._isEnabled;

            if (!banksActive && !randomisationActive) {
                // include presentation component IDs in save state so that blocks without questions aren't removed
                _.each(this.findDescendantModels("components"), function(component) {
                    var componentModel = {
                        _id: component.get("_id"),
                        _isCorrect: component.get("_isCorrect") === undefined ? null : component.get("_isCorrect")
                    };

                    indexByIdQuestions.push(componentModel);
                    
                });

                indexByIdQuestions = _.indexBy(indexByIdQuestions, "_id");
            } else {
                indexByIdQuestions = _.indexBy(state.questions, "_id");
            }

            for (var id in indexByIdQuestions) {
                if(indexByIdQuestions.hasOwnProperty(id)) {
                    indexByIdQuestions[id] = indexByIdQuestions[id]._isCorrect;
                }
            }

            var saveState = [
                state.isComplete ? 1:0,
                state.attemptsSpent,
                state.maxScore,
                state.score,
                state.attemptInProgress ? 1:0,
                indexByIdQuestions
            ];

            return saveState;
        },

        setRestoreState: function(restoreState) {
            var id;
            var isComplete = restoreState[0] == 1 ? true : false;
            var attempts = this.get("_attempts");
            var attemptsSpent = restoreState[1];
            var maxScore = restoreState[2];
            var score = restoreState[3];
            var attemptInProgress = restoreState[4] == 1 ? true : false;
            var scoreAsPercent;

            var indexByIdQuestions = restoreState[5];

            var blockIds = {};
            for (id in indexByIdQuestions) {
                if(indexByIdQuestions.hasOwnProperty(id)) {
                    var blockId = Adapt.findById(id).get("_parentId");
                    blockIds[blockId] = Adapt.findById(blockId);
                }
            }
            var restoredChildrenModels = _.values(blockIds);

            if (indexByIdQuestions) this.getChildren().models = restoredChildrenModels;


            this.set("_isAssessmentComplete", isComplete);
            this.set("_assessmentCompleteInSession", false);
            this.set("_attemptsSpent", attemptsSpent);
            this.set("_attemptInProgress", attemptInProgress);

            this.set('_attemptsLeft', (attempts === "infinite" ? attempts : attempts - attemptsSpent));

            this.set("_maxScore", maxScore || this._getMaxScore());
            this.set("_score", score || 0);

            if (score) {
                scoreAsPercent = Math.round( score / maxScore  * 100);
            } else {
                scoreAsPercent = 0;
            }

            this.set("_scoreAsPercent", scoreAsPercent);
            this.set("_lastAttemptScoreAsPercent", scoreAsPercent);

            var questions = [];
            for (id in indexByIdQuestions) {
                if(indexByIdQuestions.hasOwnProperty(id) && Adapt.findById(id).get("_isQuestionType")) {
                    questions.push({
                        _id: id,
                        _isCorrect: indexByIdQuestions[id]
                    });
                }
            }

            this.set("_questions", questions);

            if (isComplete) this._checkIsPass();
            
            Adapt.trigger("assessments:restored", this.getState(), this);

        },

        getState: function() {
            //return the current state of the assessment
            //create snapshot of values so as not to create memory leaks
            var assessmentConfig = this.getConfig();

            var state = {
                id: assessmentConfig._id,
                type: "article-assessment",
                pageId: this.getParent().get("_id"),
                articleId: this.get("_id"),
                isEnabled: assessmentConfig._isEnabled,
                isComplete: this.get("_isAssessmentComplete"),
                isPercentageBased: assessmentConfig._isPercentageBased,
                scoreToPass: assessmentConfig._scoreToPass,
                score: this.get("_score"),
                scoreAsPercent: this.get("_scoreAsPercent"),
                maxScore: this.get("_maxScore"),
                isPass: this.get("_isPass"),
                includeInTotalScore: assessmentConfig._includeInTotalScore,
                assessmentWeight: assessmentConfig._assessmentWeight,
                attempts: this.get("_attempts"),
                attemptsSpent: this.get("_attemptsSpent"),
                attemptsLeft: this.get("_attemptsLeft"),
                attemptInProgress: this.get("_attemptInProgress"),
                lastAttemptScoreAsPercent: this.get('_lastAttemptScoreAsPercent'),
                questions: this.get("_questions"),
                allowResetIfPassed: assessmentConfig._allowResetIfPassed,
                questionModels: new Backbone.Collection(this._currentQuestionComponents)
            };

            return state;
        },

        getConfig: function() {
            var assessmentConfig = this.get("_assessment");

            if (!assessmentConfig) {
                assessmentConfig = $.extend(true, {}, assessmentConfigDefaults);
            } else {
                assessmentConfig = $.extend(true, {}, assessmentConfigDefaults, assessmentConfig);
            }

            if (assessmentConfig._id === undefined) {
                assessmentConfig._id = "givenId"+(givenIdCount++);
            }

            this.set("_assessment", assessmentConfig);

            return assessmentConfig;
        }

    };

    return AssessmentModel;
});
