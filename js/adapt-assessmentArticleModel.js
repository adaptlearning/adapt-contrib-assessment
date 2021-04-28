define([
  'core/js/adapt',
  './adapt-assessmentQuestionBank'
], function(Adapt, QuestionBank) {

  var givenIdCount = 0;
  var assessmentConfigDefaults = {
    _isEnabled: true,
    _questions: {
      _resetType: 'soft',
      _canShowFeedback: false,
      _canShowMarking: false,
      _canShowModelAnswer: false
    },
    _suppressMarking: false,
    _isPercentageBased: true,
    _scoreToPass: 100,
    _includeInTotalScore: true,
    _assessmentWeight: 1,
    _isResetOnRevisit: true,
    _reloadPageOnReset: true,
    _attempts: 'infinite',
    _allowResetIfPassed: false
  };

  var AssessmentModel = {

    _getCurrentQuestionComponents: function() {
      return this.findDescendantModels('block')
        .filter(block => block.get('_isAvailable'))
        .reduce((questions, block) => questions.concat(block.findDescendantModels('question')), []);
    },

    _getAllQuestionComponents: function() {
      return this.findDescendantModels('question');
    },

    // Private functions
    _postInitialize: function() {
      if (!this.isAssessmentEnabled()) return;

      var assessmentConfig = this.getConfig();

      _.extend(this, {
        _originalChildModels: null,
        _questionBanks: null,
        _forceResetOnRevisit: false
      });

      var attemptsLeft;
      switch (assessmentConfig._attempts) {
        case 'infinite': case 0: case undefined: case -1: case null:
          attemptsLeft = 'infinite';
          break;
        default:
          attemptsLeft = assessmentConfig._attempts;
          break;
      }

      this.set({
        _assessmentCompleteInSession: false,
        _attemptInProgress: false,
        _isAssessmentComplete: false,
        _numberOfQuestionsAnswered: 0,
        _lastAttemptScoreAsPercent: 0,
        _attempts: attemptsLeft,
        _attemptsLeft: attemptsLeft,
        _attemptsSpent: 0
      });

      this.listenToOnce(Adapt, 'app:dataReady', this._onDataReady);
      this.listenTo(Adapt, 'remove', this._onRemove);

    },

    init: function() {
      // save original children
      this._originalChildModels = this.getChildren().models;

      this.setupCurrentQuestionComponents();

      this._setAssessmentOwnershipOnChildrenModels();

      // ensure the _questions attribute is set up (see https://github.com/adaptlearning/adapt_framework/issues/2971)
      this._updateQuestionsState();
    },

    setupCurrentQuestionComponents: function() {
      const assessmentQuestionsConfig = this.getConfig()._questions;
      this._getAllQuestionComponents().forEach(component => {
        component.set({
          _canShowFeedback: assessmentQuestionsConfig._canShowFeedback,
          _canShowMarking: assessmentQuestionsConfig._canShowMarking,
          _canShowModelAnswer: assessmentQuestionsConfig._canShowModelAnswer
        });
      });
    },

    _setAssessmentOwnershipOnChildrenModels: function() {
      // mark all children components as belonging to an assessment
      var assessmentConfig = this.get('_assessment');
      var childConfig = {
        _isPartOfAssessment: true,
        _assessmentId: assessmentConfig._id
      };
      for (var i = 0, l = this._originalChildModels.length; i < l; i++) {
        var blockModel = this._originalChildModels[i];
        blockModel.set(childConfig);
        // make sure components are set to _isPartOfAssessment for plp checking
        blockModel.setOnChildren(childConfig);
      }
    },

    _onDataReady: function() {
      // register assessment
      Adapt.assessment.register(this);
    },

    _setupAssessmentData: function(force, callback) {
      var assessmentConfig = this.getConfig();
      var state = this.getState();
      var shouldResetAssessment = (!this.get('_attemptInProgress') && !state.isPass) || force === true;
      var shouldResetQuestions = (assessmentConfig._isResetOnRevisit && (state.allowResetIfPassed || !state.isPass)) || force === true;

      if (shouldResetAssessment || shouldResetQuestions) {
        Adapt.trigger('assessments:preReset', this.getState(), this);
      }

      var quizModels;
      if (shouldResetAssessment) {
        this.set({
          _numberOfQuestionsAnswered: 0,
          _isAssessmentComplete: false,
          _assessmentCompleteInSession: false,
          _score: 0
        });
        this.getChildren().models = this._originalChildModels;
        if (assessmentConfig._banks &&
          assessmentConfig._banks._isEnabled &&
          assessmentConfig._banks._split.length > 1) {

          quizModels = this._setupBankedAssessment();
        } else if (assessmentConfig._randomisation &&
          assessmentConfig._randomisation._isEnabled) {

          quizModels = this._setupRandomisedAssessment();
        }
      }

      if (!quizModels) {
        // leave the order as before, completed or not
        quizModels = this.getChildren().models;
      } else if (quizModels.length === 0) {
        quizModels = this.getChildren().models;
        console.warn('assessment: Not enough unique questions to create a fresh assessment, using last selection');
      }

      this.getChildren().models = quizModels;

      this.setupCurrentQuestionComponents();
      if (shouldResetAssessment || shouldResetQuestions) {
        this._resetQuestions(function() {
          this.set('_attemptInProgress', true);
          Adapt.trigger('assessments:reset', this.getState(), this);

          finalise.apply(this);
        }.bind(this));
      } else {
        finalise.apply(this);
      }

      function finalise() {
        if (!state.isComplete) {
          this.set('_attemptInProgress', true);
        }

        this._overrideQuestionComponentSettings();
        this._setupQuestionListeners();
        this._checkNumberOfQuestionsAnswered();
        this._updateQuestionsState();

        Adapt.assessment.saveState();

        if (typeof callback === 'function') callback.apply(this);

        if (shouldResetAssessment || shouldResetQuestions) {
          Adapt.trigger('assessments:postReset', this.getState(), this);
        }
      }
    },

    _setupBankedAssessment: function() {
      var assessmentConfig = this.getConfig();

      this._setupBanks();

      // get random questions from banks
      var questionModels = [];
      for (var bankId in this._questionBanks) {
        if (this._questionBanks.hasOwnProperty(bankId)) { // skip over properties that were added to Array.prototype by the ES5-shim for IE8
          var questionBank = this._questionBanks[bankId];
          var questions = questionBank.getRandomQuestionBlocks();
          questionModels = questionModels.concat(questions);
        }
      }

      // if overall question order should be randomized
      if (assessmentConfig._banks._randomisation) {
        questionModels = _.shuffle(questionModels);
      }

      return questionModels;
    },

    _setupBanks: function() {
      var assessmentConfig = this.getConfig();
      var banks = assessmentConfig._banks._split.split(',');
      var bankId;

      this._questionBanks = [];

      // build fresh banks
      for (var i = 0, l = banks.length; i < l; i++) {
        var bank = banks[i];
        bankId = (i + 1);
        var questionBank = new QuestionBank(bankId, this.get('_id'), bank, true);

        this._questionBanks[bankId] = questionBank;
      }

      // add blocks to banks
      var children = this.getChildren().models;
      for (var j = 0, count = children.length; j < count; j++) {
        var blockModel = children[j];
        var blockAssessmentConfig = blockModel.get('_assessment');
        if (!blockAssessmentConfig) continue;
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
        const questionComponents = this._getAllQuestionComponents();
        questionComponents.forEach(model => model.set(newSettings, { pluginName: '_assessment' }));
      }
    },

    _setupQuestionListeners: function() {
      this._removeQuestionListeners();
      this.listenTo(this.getChildren(), 'change:_isInteractionComplete', this._onBlockCompleted);
    },

    _checkNumberOfQuestionsAnswered: function() {
      const questionComponents = this._getCurrentQuestionComponents();
      const numberOfQuestionsAnswered = questionComponents.filter(model => model.get('_isInteractionComplete')).length;
      this.set('_numberOfQuestionsAnswered', numberOfQuestionsAnswered);
    },

    _removeQuestionListeners: function() {
      this.stopListening(this.getChildren(), 'change:_isInteractionComplete', this._onBlockCompleted);
    },

    _onBlockCompleted: function(blockModel, value) {
      if (value === false) return;
      var questionModels = blockModel.findDescendantModels('question');
      questionModels.forEach(questionModel => {
        this._onQuestionCompleted(questionModel, value);
      });
    },

    _onQuestionCompleted: function(questionModel, value) {
      if (value === false) return;
      if (!questionModel.get('_isInteractionComplete')) return;

      var numberOfQuestionsAnswered = this.get('_numberOfQuestionsAnswered');
      numberOfQuestionsAnswered++;
      this.set('_numberOfQuestionsAnswered', numberOfQuestionsAnswered);

      this._updateQuestionsState();
      Adapt.assessment.saveState();

      this._checkAssessmentComplete();
    },

    _checkAssessmentComplete: function() {
      const numberOfQuestionsAnswered = this.get('_numberOfQuestionsAnswered');
      const allQuestionsAnswered = (numberOfQuestionsAnswered >= this._getCurrentQuestionComponents().length);
      if (!allQuestionsAnswered) return;
      this._onAssessmentComplete();
    },

    _onAssessmentComplete: function() {
      this.set('_attemptInProgress', false);
      this._spendAttempt();

      var scoreAsPercent = this._getScoreAsPercent();
      var score = this._getScore();
      var maxScore = this._getMaxScore();

      this.set({
        _scoreAsPercent: scoreAsPercent,
        _score: score,
        _maxScore: maxScore,
        _lastAttemptScoreAsPercent: scoreAsPercent,
        _assessmentCompleteInSession: true,
        _isAssessmentComplete: true
      });

      this._updateQuestionsState();

      this._checkIsPass();

      this._removeQuestionListeners();

      if (this._isMarkingSuppressionEnabled() && !this._isAttemptsLeft()) {
        _.defer(function() {
          this._overrideMarkingSettings();
          this._refreshQuestions();
        }.bind(this));
      }

      Adapt.trigger('assessments:complete', this.getState(), this);
    },

    _updateQuestionsState: function() {
      const questionComponents = this._getCurrentQuestionComponents();
      const questions = questionComponents.map(model => ({
        _id: model.get('_id'),
        _isCorrect: model.get('_isCorrect') === undefined ?
          null :
          model.get('_isCorrect')
      }));
      this.set('_questions', questions);
    },

    _checkIsPass: function() {
      var assessmentConfig = this.getConfig();

      var isPercentageBased = assessmentConfig._isPercentageBased;
      var scoreToPass = assessmentConfig._scoreToPass;

      var scoreAsPercent = this.get('_scoreAsPercent');
      var score = this.get('_score');

      var isPass = isPercentageBased ? (scoreAsPercent >= scoreToPass) : (score >= scoreToPass);

      this.set('_isPass', isPass);
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
      const questionComponents = this._getAllQuestionComponents();
      questionComponents.forEach(model => model.set(newMarkingSettings, { pluginName: '_assessment' }));
    },

    _refreshQuestions: function() {
      const questionComponents = this._getCurrentQuestionComponents();
      questionComponents.forEach(model => model.refresh());
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

      var attemptsSpent = this.get('_attemptsSpent');
      this.set('_attemptsSpent', ++attemptsSpent);

      if (this.get('_attempts') === 'infinite') return true;

      var attemptsLeft = this.get('_attemptsLeft');
      this.set('_attemptsLeft', --attemptsLeft);

      return true;
    },

    _getScore: function() {
      const questionComponents = this._getCurrentQuestionComponents();
      const score = questionComponents.reduce((score, model) => {
        return model.get('_isCorrect') && model.get('_questionWeight') ?
          score + model.get('_questionWeight') :
          score;
      }, 0);
      return score;
    },

    _getMaxScore: function() {
      const questionComponents = this._getCurrentQuestionComponents();
      const maxScore = questionComponents.reduce((maxScore, model) => {
        return model.get('_questionWeight') ?
          maxScore + model.get('_questionWeight') :
          maxScore;
      }, 0);
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

      var parentId = this.getParent().get('_id');
      var currentLocation = Adapt.location._currentId;

      // check if on assessment page and should rerender page
      if (currentLocation !== parentId) return false;
      if (!this.get('_isReady')) return false;

      return true;
    },

    _reloadPage: function(callback) {
      var assessmentConfig = this.getConfig();
      this._forceResetOnRevisit = true;
      this.listenToOnce(Adapt, 'pageView:ready', async () => {
        if (assessmentConfig._scrollToOnReset) {
          await Adapt.navigateToElement(this.get('_id'));
        }
        callback();
      });
      _.delay(() => {
        Backbone.history.navigate('#/id/' + Adapt.location._currentId, { replace: true, trigger: true });
      }, 250);
    },

    _resetQuestions: function(callback) {
      var assessmentConfig = this.getConfig();
      var syncIterations = 1; // number of synchronous iterations to perform
      var i = 0;
      var qs = this._getCurrentQuestionComponents();
      var len = qs.length;

      function step() {
        for (var j = 0, count = Math.min(syncIterations, len - i); j < count; i++, j++) {
          var question = qs[i];
          question.reset(assessmentConfig._questions._resetType, true);
        }

        i === len ? callback() : setTimeout(step);
      }

      step();
    },

    _onRemove: function() {
      this._removeQuestionListeners();
    },

    _setCompletionStatus: function() {
      this.set({
        _isComplete: true,
        _isInteractionComplete: true
      });
    },

    _checkIfQuestionsWereRestored: function() {
      if (this.get('_assessmentCompleteInSession')) return;
      if (!this.get('_isAssessmentComplete')) return;

      // fix for courses that do not remember the user selections
      // force assessment to reset if user revisits an assessment page in a new session which is completed
      var wereQuestionsRestored = true;

      var questions = this.get('_questions');
      for (var i = 0, l = questions.length; i < l; i++) {
        var question = questions[i];
        var questionModel = Adapt.findById(question._id);
        if (!questionModel.get('_isSubmitted')) {
          wereQuestionsRestored = false;
          break;
        }
      }

      if (!wereQuestionsRestored) {
        this.set('_assessmentCompleteInSession', true);
        return true;
      }

      return false;
    },

    // Public Functions
    isAssessmentEnabled: function() {
      if (this.get('_assessment') &&
        this.get('_assessment')._isEnabled) return true;
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
        this.once('reset', function() {
          this._isResetInProgress = false;
          if (typeof callback === 'function') {
            // eslint-disable-next-line standard/no-callback-literal
            callback(true);
          }
        });
        return;
      }

      var assessmentConfig = this.getConfig();

      // check if forcing reset via page revisit or force parameter
      force = this._forceResetOnRevisit || force === true;
      this._forceResetOnRevisit = false;

      var isPageReload = this._checkReloadPage();

      // stop resetting if not complete or not allowed
      if (this.get('_assessmentCompleteInSession') &&
        !assessmentConfig._isResetOnRevisit &&
        !isPageReload &&
        !force) {
        if (typeof callback === 'function') {
          // eslint-disable-next-line standard/no-callback-literal
          callback(false);
        }
        return false;
      }

      // check if new session and questions not restored
      var wereQuestionsRestored = this._checkIfQuestionsWereRestored();
      force = force || wereQuestionsRestored;
      // the assessment is going to be reset so we must reset attempts
      // otherwise assessment may not be set up properly in next session
      if (force && !this._isAttemptsLeft()) {
        this.set({
          _attemptsLeft: this.get('_attempts'),
          _attemptsSpent: 0
        });
      }

      var allowResetIfPassed = this.get('_assessment')._allowResetIfPassed;
      // stop resetting if no attempts left and allowResetIfPassed is false
      if (!this._isAttemptsLeft() && !force && !allowResetIfPassed) {
        // eslint-disable-next-line standard/no-callback-literal
        if (typeof callback === 'function') callback(false);
        return false;
      }

      if (!isPageReload) {
        // only perform this section when not attempting to reload the page
        // wait for reset to trigger
        this.once('reset', function() {
          this._isResetInProgress = false;
          if (typeof callback === 'function') {
            // eslint-disable-next-line standard/no-callback-literal
            callback(true);
          }
        });
        this._isResetInProgress = true;
        // perform asynchronous reset
        this._setupAssessmentData(force, function() {
          this.trigger('reset');
        });
      } else {
        this._reloadPage(function() {
          if (typeof callback === 'function') {
            // eslint-disable-next-line standard/no-callback-literal
            callback(true);
          }
        });
      }

      return true;
    },

    getSaveState: function() {
      var state = this.getState();
      let blocks;
      var cfg = this.getConfig();
      var banksActive = cfg._banks && cfg._banks._isEnabled && cfg._banks._split.length > 1;
      var randomisationActive = cfg._randomisation && cfg._randomisation._isEnabled;

      if (!banksActive && !randomisationActive) {
        // include presentation blocks in save state so that blocks without questions aren't removed
        blocks = this.findDescendantModels('block');
      } else {
        blocks = state.questions.map(question => Adapt.findById(question._id).getParent());
      }
      blocks = blocks.filter(block => {
        const trackingId = block.get('_trackingId');
        return Number.isInteger(trackingId) && trackingId >= 0;
      });
      const blockTrackingIds = blocks.map(block => block.get('_trackingId'));
      const blockCompletion = blocks.map(block => {
        let questions = block.findDescendantModels('question');
        return questions.map(question => question.get('_isCorrect') || false);
      });
      const blockData = [blockTrackingIds, blockCompletion];

      const saveState = [
        state.isComplete ? 1 : 0,
        state.attemptsSpent,
        state.maxScore || 0,
        state.score,
        state.attemptInProgress ? 1 : 0
      ];

      const dataPackage = [saveState, blockData];

      return dataPackage;
    },

    setRestoreState: function(dataPackage) {
      const restoreState = dataPackage[0];
      const blockData = dataPackage[1];
      var isComplete = restoreState[0] === 1;
      var attempts = this.get('_attempts');
      var attemptsSpent = restoreState[1];
      var maxScore = restoreState[2];
      var score = restoreState[3];
      var scoreAsPercent = score ? Math.round(score / maxScore * 100) : 0;
      var attemptInProgress = restoreState[4] === 1;

      let blocks = blockData[0].map(trackingId => Adapt.data.findWhere({ _trackingId: trackingId }));

      if (blocks.length) {
        this.getChildren().models = blocks;
      }

      this.set({
        _isAssessmentComplete: isComplete,
        _assessmentCompleteInSession: false,
        _attemptsSpent: attemptsSpent,
        _attemptInProgress: attemptInProgress,
        _attemptsLeft: (attempts === 'infinite' ? attempts : attempts - attemptsSpent),
        _maxScore: maxScore || this._getMaxScore(),
        _score: score || 0,
        _scoreAsPercent: scoreAsPercent,
        _lastAttemptScoreAsPercent: scoreAsPercent
      });

      var questions = [];
      blocks.forEach((block, blockIndex) => {
        const blockQuestions = block.findDescendantModels('question');
        blockQuestions.forEach((question, questionIndex) => {
          questions.push({
            _id: question.get('_id'),
            _isCorrect: blockData[1][blockIndex][questionIndex]
          });
        });
      });
      this.set('_questions', questions);

      if (isComplete) this._checkIsPass();

      Adapt.trigger('assessments:restored', this.getState(), this);

    },

    getState: function() {
      // return the current state of the assessment
      // create snapshot of values so as not to create memory leaks
      var assessmentConfig = this.getConfig();

      var state = {
        id: assessmentConfig._id,
        type: 'article-assessment',
        pageId: this.getParent().get('_id'),
        articleId: this.get('_id'),
        isEnabled: assessmentConfig._isEnabled,
        isComplete: this.get('_isAssessmentComplete'),
        isPercentageBased: assessmentConfig._isPercentageBased,
        scoreToPass: assessmentConfig._scoreToPass,
        score: this.get('_score'),
        scoreAsPercent: this.get('_scoreAsPercent'),
        maxScore: this.get('_maxScore'),
        isPass: this.get('_isPass'),
        includeInTotalScore: assessmentConfig._includeInTotalScore,
        assessmentWeight: assessmentConfig._assessmentWeight,
        attempts: this.get('_attempts'),
        attemptsSpent: this.get('_attemptsSpent'),
        attemptsLeft: this.get('_attemptsLeft'),
        attemptInProgress: this.get('_attemptInProgress'),
        lastAttemptScoreAsPercent: this.get('_lastAttemptScoreAsPercent'),
        questions: this.get('_questions'),
        resetType: assessmentConfig._questions._resetType,
        allowResetIfPassed: assessmentConfig._allowResetIfPassed,
        questionModels: new Backbone.Collection(this._getCurrentQuestionComponents())
      };

      return state;
    },

    getConfig: function() {
      var assessmentConfig = this.get('_assessment');

      if (!assessmentConfig) {
        assessmentConfig = $.extend(true, {}, assessmentConfigDefaults);
      } else {
        assessmentConfig = $.extend(true, {}, assessmentConfigDefaults, assessmentConfig);
      }

      if (assessmentConfig._id === undefined) {
        assessmentConfig._id = 'givenId' + (givenIdCount++);
      }

      this.set('_assessment', assessmentConfig);

      return assessmentConfig;
    }

  };

  return AssessmentModel;

});
