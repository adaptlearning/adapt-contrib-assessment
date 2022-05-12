import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import logging from 'core/js/logging';
import location from 'core/js/location';
import router from 'core/js/router';
import QuestionBank from './adapt-assessmentQuestionBank';

let givenIdCount = 0;
const assessmentConfigDefaults = {
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
  _correctToPass: 100,
  _includeInTotalScore: true,
  _assessmentWeight: 1,
  _isResetOnRevisit: true,
  _reloadPageOnReset: true,
  _attempts: 'infinite',
  _allowResetIfPassed: false
};

const AssessmentModel = {

  _getCurrentQuestionComponents() {
    return this.findDescendantModels('block')
      .filter(block => block.get('_isAvailable'))
      .reduce((questions, block) => questions.concat(block.findDescendantModels('question')), []);
  },

  _getAllQuestionComponents() {
    return this.findDescendantModels('question');
  },

  // Private functions
  _postInitialize() {
    if (!this.isAssessmentEnabled()) return;

    const assessmentConfig = this.getConfig();

    Object.assign(this, {
      _originalChildModels: null,
      _questionBanks: null,
      _forceResetOnRevisit: false
    });

    let attemptsLeft;
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

  init() {
    // save original children
    this._originalChildModels = this.getChildren().models;

    this.setupCurrentQuestionComponents();

    this._setAssessmentOwnershipOnChildrenModels();

    // ensure the _questions attribute is set up (see https://github.com/adaptlearning/adapt_framework/issues/2971)
    this._updateQuestionsState();
  },

  setupCurrentQuestionComponents() {
    const assessmentQuestionsConfig = this.getConfig()._questions;
    this._getAllQuestionComponents().forEach(component => {
      component.set({
        _canShowFeedback: assessmentQuestionsConfig._canShowFeedback,
        _canShowMarking: assessmentQuestionsConfig._canShowMarking,
        _canShowModelAnswer: assessmentQuestionsConfig._canShowModelAnswer
      });
    });
  },

  _setAssessmentOwnershipOnChildrenModels() {
    // mark all children components as belonging to an assessment
    const assessmentConfig = this.get('_assessment');
    const childConfig = {
      _isPartOfAssessment: true,
      _assessmentId: assessmentConfig._id
    };

    for (const blockModel of this._originalChildModels) {
      blockModel.set(childConfig);
      // make sure components are set to _isPartOfAssessment for plp checking
      blockModel.setOnChildren(childConfig);
    }
  },

  // prevent default
  checkIfResetOnRevisit() {},

  _onDataReady() {
    // register assessment
    Adapt.assessment.register(this);
  },

  _setupAssessmentData(force, callback) {
    const assessmentConfig = this.getConfig();
    const state = this.getState();
    const hasAttemptsLeft = (state.attemptsLeft > 0 || state.attemptsLeft === 'infinite');
    const isFirstAttempt = (state.attemptsSpent === 0);
    const shouldResetOnRevisit = (isFirstAttempt || assessmentConfig._isResetOnRevisit) && !this.get('_attemptInProgress');
    const shouldResetAssessment = (shouldResetOnRevisit && !state.isPass && hasAttemptsLeft) || force === true;
    const shouldResetQuestions = (shouldResetOnRevisit && (state.allowResetIfPassed || !state.isPass)) || force === true;
    if (shouldResetAssessment || shouldResetQuestions) {
      Adapt.trigger('assessments:preReset', this.getState(), this);
    }
    let quizModels;
    if (shouldResetAssessment) {
      if (isFirstAttempt || assessmentConfig?._questions?._resetType === 'hard') {
        this.set({
          _numberOfQuestionsAnswered: 0,
          _isAssessmentComplete: false,
          _assessmentCompleteInSession: false,
          _score: 0
        });
      } else {
        this.set({
          _assessmentCompleteInSession: false
        });
      }
      this.getChildren().models = this._originalChildModels;
      if (assessmentConfig?._banks._isEnabled &&
        assessmentConfig?._banks._split.length > 1) {
        quizModels = this._setupBankedAssessment();
      } else if (assessmentConfig?._randomisation._isEnabled) {
        quizModels = this._setupRandomisedAssessment();
      }
    }
    if (!quizModels) {
      // leave the order as before, completed or not
      quizModels = this.getChildren().models;
    } else if (quizModels.length === 0) {
      quizModels = this.getChildren().models;
      logging.warn('assessment: Not enough unique questions to create a fresh assessment, using last selection');
    }
    this.getChildren().models = quizModels;
    this.setupCurrentQuestionComponents();
    if (shouldResetAssessment || shouldResetQuestions) {
      this._resetQuestions();
      this.set('_attemptInProgress', true);
      Adapt.trigger('assessments:reset', this.getState(), this);
    }
    if (!state.isComplete) {
      this.set('_attemptInProgress', true);
    }
    this._overrideQuestionComponentSettings();
    this._setupQuestionListeners();
    this._checkNumberOfQuestionsAnswered();
    this._updateQuestionsState();
    Adapt.assessment.saveState();
    this.trigger('reset');
    if (shouldResetAssessment || shouldResetQuestions) {
      Adapt.trigger('assessments:postReset', this.getState(), this);
    }
  },

  _setupBankedAssessment() {
    const assessmentConfig = this.getConfig();
    this._setupBanks();
    // Get random questions from banks
    let questionModels = this._questionBanks.flatMap(questionBank => questionBank.getRandomQuestionBlocks());
    // If overall question order should be randomized
    if (assessmentConfig._banks._randomisation) {
      questionModels = _.shuffle(questionModels);
    }
    return questionModels;
  },

  _setupBanks() {
    const assessmentConfig = this.getConfig();
    const bankSplits = assessmentConfig._banks._split.split(',');
    const hasBankSplitsChanged = (bankSplits.length !== this._questionBanks?.length);
    if (hasBankSplitsChanged) {
      // Generate new question banks if the split has changed
      this._questionBanks = [];
    }
    bankSplits.forEach((count, index) => {
      const bankId = (index + 1);
      const articleId = this.get('_id');
      // Keep question bank instances to preserve unused blocks over multi asessment attempts inside a session
      this._questionBanks[bankId] = (this._questionBanks[bankId] || new QuestionBank(bankId, articleId));
      // Recalculate available blocks incase they have changed or the count has changed in the split
      this._questionBanks[bankId].calculateAvailableQuestionBlocks(count);
    });
  },

  _setupRandomisedAssessment() {
    const assessmentConfig = this.getConfig();

    const randomisationModel = assessmentConfig._randomisation;
    const blockModels = this.getChildren().models;

    let questionModels = _.shuffle(blockModels);

    if (randomisationModel._blockCount > 0) {
      questionModels = questionModels.slice(0, randomisationModel._blockCount);
    }

    return questionModels;
  },

  _overrideQuestionComponentSettings() {
    const newSettings = this._getMarkingSettings();

    // Add any additional setting overrides here
    const questionConfig = this.getConfig()._questions;
    if (Object.prototype.hasOwnProperty.call(questionConfig, '_canShowFeedback')) {
      newSettings._canShowFeedback = questionConfig._canShowFeedback;
    }

    if (!_.isEmpty(newSettings)) {
      const questionComponents = this._getAllQuestionComponents();
      questionComponents.forEach(model => model.set(newSettings, { pluginName: '_assessment' }));
    }
  },

  _setupQuestionListeners() {
    this._removeQuestionListeners();
    this.listenTo(this, 'bubble:change:_isInteractionComplete', this._onCompletionEvent);
  },

  _checkNumberOfQuestionsAnswered() {
    const questionComponents = this._getCurrentQuestionComponents();
    const numberOfQuestionsAnswered = questionComponents.filter(model => model.get('_isInteractionComplete')).length;
    this.set('_numberOfQuestionsAnswered', numberOfQuestionsAnswered);
  },

  _removeQuestionListeners() {
    this.stopListening(this, 'bubble:change:_isInteractionComplete', this._onCompletionEvent);
  },

  _onCompletionEvent(event) {
    if (event.target?.isTypeGroup('block')) return this._onBlockCompleted(event.target, event.value);
    if (event.target?.isTypeGroup('questions')) return this._onQuestionCompleted(event.target, event.value);
  },

  _onBlockCompleted(blockModel, value) {
    if (value === false) return;
    const questionModels = blockModel.findDescendantModels('question');
    questionModels.forEach(questionModel => {
      this._onQuestionCompleted(questionModel, value);
    });
    if (!blockModel.get('_isInteractionComplete')) return;
    this._checkAssessmentComplete();
  },

  _onQuestionCompleted(questionModel, value) {
    if (value === false) return;
    if (!questionModel.get('_isInteractionComplete')) return;

    const numberOfQuestionsAnswered = this._getCurrentQuestionComponents().reduce((count, question) => (count += question.get('_isSubmitted') ? 1 : 0), 0);
    this.set('_numberOfQuestionsAnswered', numberOfQuestionsAnswered);

    this._updateQuestionsState();
    Adapt.assessment.saveState();

    this._checkAssessmentComplete();
  },

  _checkAssessmentComplete() {
    const allQuestionsAdded = (this.get('_requireCompletionOf') !== Number.POSITIVE_INFINITY);
    if (!allQuestionsAdded) return;
    const numberOfQuestionsAnswered = this.get('_numberOfQuestionsAnswered');
    const allQuestionsAnswered = (numberOfQuestionsAnswered >= this._getCurrentQuestionComponents().length);
    if (!allQuestionsAnswered) return;
    this._onAssessmentComplete();
  },

  _onAssessmentComplete() {
    const wasAttemptInProgess = this.get('_attemptInProgress');
    if (!wasAttemptInProgess) return;
    this.set('_attemptInProgress', false);
    this._spendAttempt();
    const _scoreAsPercent = this._getScoreAsPercent();
    const _score = this._getScore();
    const _maxScore = this._getMaxScore();
    const _minScore = this._getMinScore();
    const _correctCount = this._getCorrectCount();
    const _correctAsPercent = this._getCorrectAsPercent();
    const _questionCount = this._getQuestionCount();
    this.set({
      _scoreAsPercent,
      _score,
      _maxScore,
      _minScore,
      _correctAsPercent,
      _correctCount,
      _questionCount,
      _lastAttemptScoreAsPercent: _scoreAsPercent,
      _assessmentCompleteInSession: true,
      _isAssessmentComplete: true
    });
    this._updateQuestionsState();
    this._checkIsPass();
    this._removeQuestionListeners();
    if (this._isMarkingSuppressionEnabled() && (!this._isAttemptsLeft() || this._isPassed())) {
      _.defer(() => {
        this._overrideMarkingSettings();
        this._refreshQuestions();
      });
    }
    Adapt.trigger('assessments:complete', this.getState(), this);
  },

  _updateQuestionsState() {
    const questionComponents = this._getCurrentQuestionComponents();
    const questions = questionComponents.map(model => ({
      _id: model.get('_id'),
      _isCorrect: model.get('_isCorrect') ?? null
    }));
    this.set('_questions', questions);
  },

  _checkIsPass() {
    const assessmentConfig = this.getConfig();

    const isPercentageBased = assessmentConfig._isPercentageBased;
    const scoreToPass = assessmentConfig._scoreToPass;
    const correctToPass = assessmentConfig._correctToPass || 0;

    const scoreAsPercent = this.get('_scoreAsPercent');
    const score = this.get('_score');
    const correctAsPercent = this.get('_correctAsPercent');
    const correctCount = this.get('_correctCount');

    const isPass = isPercentageBased
      ? (scoreAsPercent >= scoreToPass && correctAsPercent >= correctToPass)
      : (score >= scoreToPass && correctCount >= correctToPass);

    this.set('_isPass', isPass);
  },

  _getMarkingSettings() {
    let markingSettings = {};

    if (this._shouldSuppressMarking()) {
      markingSettings = {
        _canShowMarking: false,
        _canShowModelAnswer: false
      };
    } else {
      const questionConfig = this.getConfig()._questions;

      if (Object.prototype.hasOwnProperty.call(questionConfig, '_canShowModelAnswer')) {
        markingSettings._canShowModelAnswer = questionConfig._canShowModelAnswer;
      }

      if (Object.prototype.hasOwnProperty.call(questionConfig, '_canShowMarking')) {
        markingSettings._canShowMarking = questionConfig._canShowMarking;
      }
    }

    return markingSettings;
  },

  _overrideMarkingSettings() {
    const newMarkingSettings = this._getMarkingSettings();
    const questionComponents = this._getAllQuestionComponents();
    questionComponents.forEach(model => model.set(newMarkingSettings, { pluginName: '_assessment' }));
  },

  _refreshQuestions() {
    const questionComponents = this._getCurrentQuestionComponents();
    questionComponents.forEach(model => model.refresh());
  },

  _shouldSuppressMarking() {
    return this._isMarkingSuppressionEnabled() && this._isAttemptsLeft() && !this._isPassed();
  },

  _isMarkingSuppressionEnabled() {
    const assessmentConfig = this.getConfig();
    return assessmentConfig._suppressMarking;
  },

  _isAttemptsLeft() {
    if (this.get('_attemptsLeft') === 0) return false;
    return true;
  },

  _isPassed() {
    return this.get('_isAssessmentComplete') && this.get('_isPass');
  },

  _spendAttempt() {
    if (!this._isAttemptsLeft()) return false;

    let attemptsSpent = this.get('_attemptsSpent');
    this.set('_attemptsSpent', ++attemptsSpent);

    if (this.get('_attempts') === 'infinite') return true;

    let attemptsLeft = this.get('_attemptsLeft');
    this.set('_attemptsLeft', --attemptsLeft);

    return true;
  },

  _getScore() {
    const questionComponents = this._getCurrentQuestionComponents();
    const score = questionComponents.reduce((score, model) => (score += model.score || 0), 0);
    return score;
  },

  _getMaxScore() {
    const questionComponents = this._getCurrentQuestionComponents();
    const maxScore = questionComponents.reduce((maxScore, model) => (maxScore += model.maxScore || 0), 0);
    return maxScore;
  },

  _getMinScore() {
    const questionComponents = this._getCurrentQuestionComponents();
    const minScore = questionComponents.reduce((minScore, model) => (minScore += model.minScore || 0), 0);
    return minScore;
  },

  _getScoreAsPercent() {
    const minScore = this._getMinScore();
    const maxScore = this._getMaxScore();
    const score = this._getScore();
    const range = (maxScore - minScore);
    return (range === 0) ? 0 : Math.round(((score - minScore) / range) * 100);
  },

  _getCorrectCount() {
    return this._getCurrentQuestionComponents().reduce((count, model) => (count += model.get('_isCorrect') ? 1 : 0), 0);
  },

  _getQuestionCount() {
    return this._getCurrentQuestionComponents().length;
  },

  _getCorrectAsPercent() {
    const questionCount = this._getQuestionCount();
    return (questionCount === 0) ? 0 : Math.round((this._getCorrectCount() / questionCount) * 100);
  },

  _getLastAttemptScoreAsPercent() {
    return this.get('_lastAttemptScoreAsPercent');
  },

  _checkReloadPage() {
    if (!this.canResetInPage()) return false;

    const parentId = this.getParent().get('_id');
    const currentLocation = location._currentId;

    // check if on assessment page and should rerender page
    if (currentLocation !== parentId) return false;
    if (!this.get('_isReady')) return false;

    return true;
  },

  _reloadPage(callback) {
    const assessmentConfig = this.getConfig();
    this._forceResetOnRevisit = true;
    this.listenToOnce(Adapt, 'pageView:ready', async () => {
      if (assessmentConfig._scrollToOnReset) {
        await router.navigateToElement(this.get('_id'));
      }
      callback();
    });
    _.delay(() => {
      Backbone.history.navigate('#/id/' + location._currentId, { replace: true, trigger: true });
    }, 250);
  },

  _resetQuestions() {
    const assessmentConfig = this.getConfig();
    const questionModels = this._getCurrentQuestionComponents();
    questionModels.forEach(model => model.reset(assessmentConfig._questions._resetType, true));
  },

  _onRemove() {
    this._removeQuestionListeners();
  },

  _setCompletionStatus() {
    this.set({
      _isComplete: true,
      _isInteractionComplete: true
    });
  },

  _checkIfQuestionsWereRestored() {
    if (this.get('_assessmentCompleteInSession')) return;
    if (!this.get('_isAssessmentComplete')) return;

    // fix for courses that do not remember the user selections
    // force assessment to reset if user revisits an assessment page in a new session which is completed
    let wereQuestionsRestored = true;

    const questions = this.get('_questions');
    for (const question of questions) {
      const questionModel = data.findById(question._id);
      if (questionModel.get('_isAvailable') && !questionModel.get('_isSubmitted')) {
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
  isAssessmentEnabled() {
    if (this.get('_assessment')?._isEnabled) return true;
    return false;
  },

  canResetInPage() {
    const assessmentConfig = this.getConfig();
    if (assessmentConfig._reloadPageOnReset === false) return false;
    return true;
  },

  reset(force, callback) {

    const assessmentConfig = this.getConfig();

    // check if forcing reset via page revisit or force parameter
    force = this._forceResetOnRevisit || force === true;
    this._forceResetOnRevisit = false;

    const isPageReload = this._checkReloadPage();

    // stop resetting if not complete or not allowed
    if (this.get('_assessmentCompleteInSession') &&
      !assessmentConfig._isResetOnRevisit &&
      !isPageReload &&
      !force) {
      // eslint-disable-next-line node/no-callback-literal
      if (typeof callback === 'function') callback(false);
      return false;
    }

    // check if new session and questions not restored
    const wereQuestionsRestored = this._checkIfQuestionsWereRestored();
    force = force || wereQuestionsRestored;
    // the assessment is going to be reset so we must reset attempts
    // otherwise assessment may not be set up properly in next session
    if (force && !this._isAttemptsLeft()) {
      this.set({
        _attemptsLeft: this.get('_attempts'),
        _attemptsSpent: 0
      });
    }

    const allowResetIfPassed = this.get('_assessment')._allowResetIfPassed;
    // stop resetting if no attempts left and allowResetIfPassed is false
    if (!this._isAttemptsLeft() && !force && !allowResetIfPassed) {
      // eslint-disable-next-line node/no-callback-literal
      if (typeof callback === 'function') callback(false);
      return false;
    }

    if (!isPageReload) {
      this._setupAssessmentData(force);
      // eslint-disable-next-line node/no-callback-literal
      if (typeof callback === 'function') callback(true);
    } else {
      this._reloadPage(() => {
        // eslint-disable-next-line node/no-callback-literal
        if (typeof callback === 'function') callback(true);
      });
    }

    return true;
  },

  getSaveState() {
    const state = this.getState();
    let blocks;
    const cfg = this.getConfig();
    const banksActive = cfg._banks?._isEnabled && cfg._banks._split.length > 1;
    const randomisationActive = cfg._randomisation?._isEnabled;

    if (!banksActive && !randomisationActive) {
      // include presentation blocks in save state so that blocks without questions aren't removed
      blocks = this.findDescendantModels('block');
    } else {
      blocks = state.questions.map(question => data.findById(question._id).getParent());
    }
    blocks = [...new Set(blocks)]
      .filter(block => block.trackingPosition);
    const blockTrackingPositions = blocks.map(block => block.trackingPosition);
    const blockCompletion = blocks.map(block => {
      const questions = block.findDescendantModels('question');
      return questions.map(question => question.get('_isCorrect') || false);
    });
    const blockData = [blockTrackingPositions, blockCompletion];

    const saveState = [
      state.isComplete ? 1 : 0,
      state.attemptsSpent,
      state.maxScore || 0,
      state.score,
      state.attemptInProgress ? 1 : 0,
      state.minScore || 0,
      state.correctAsPercent || 0,
      state.correctCount || 0,
      state.questionCount || 0
    ];

    const dataPackage = [saveState, blockData];

    return dataPackage;
  },

  setRestoreState(dataPackage) {
    const restoreState = dataPackage[0];
    const blockData = dataPackage[1];
    const _isAssessmentComplete = restoreState[0] === 1;
    const attempts = this.get('_attempts');
    const _attemptsSpent = restoreState[1];
    const maxScore = restoreState[2];
    const score = restoreState[3];
    const _scoreAsPercent = score ? Math.round(score / maxScore * 100) : 0;
    const _attemptInProgress = restoreState[4] === 1;
    const minScore = restoreState[5];
    const correctAsPercent = restoreState[6];
    const correctCount = restoreState[7];
    const questionCount = restoreState[8];

    const blocks = blockData[0].map(trackingPosition => {
      if (typeof trackingPosition === 'number') {
        // Backwards compability for courses which use _trackingId at block level
        return data.findWhere({ _trackingId: trackingPosition });
      }
      return data.findByTrackingPosition(trackingPosition);
    });

    if (blocks.length) {
      const nonBlockChildren = this.getChildren().models.filter(model => !model.isTypeGroup('block'));
      this.getChildren().models = blocks.concat(nonBlockChildren);
    }

    const _questions = [];
    blocks.forEach((block, blockIndex) => {
      const blockQuestions = block.findDescendantModels('question');
      blockQuestions.forEach((question, questionIndex) => {
        _questions.push({
          _id: question.get('_id'),
          _isCorrect: blockData[1][blockIndex][questionIndex]
        });
      });
    });

    this.set({
      _isAssessmentComplete,
      _assessmentCompleteInSession: false,
      _attemptsSpent,
      _attemptInProgress,
      _attemptsLeft: (attempts === 'infinite' ? attempts : attempts - _attemptsSpent),
      _maxScore: maxScore || this._getMaxScore(),
      _minScore: minScore || this._getMinScore(),
      _score: score || 0,
      _scoreAsPercent,
      _correctAsPercent: correctAsPercent || 0,
      _correctCount: correctCount || 0,
      _questions,
      _questionCount: questionCount || 0,
      _lastAttemptScoreAsPercent: _scoreAsPercent
    });

    if (_isAssessmentComplete) this._checkIsPass();

    Adapt.trigger('assessments:restored', this.getState(), this);

  },

  getState() {
    // return the current state of the assessment
    // create snapshot of values so as not to create memory leaks
    const assessmentConfig = this.getConfig();

    const state = {
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
      minScore: this.get('_minScore'),
      correctCount: this.get('_correctCount'),
      correctAsPercent: this.get('_correctAsPercent'),
      correctToPass: assessmentConfig._correctToPass,
      questionCount: this.get('_questionCount'),
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

  getConfig() {
    let assessmentConfig = this.get('_assessment');

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

export default AssessmentModel;
