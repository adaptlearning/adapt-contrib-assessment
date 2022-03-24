import Adapt from 'core/js/adapt';
import logging from 'core/js/logging';
import AdaptArticleView from 'core/js/views/articleView';

const AssessmentView = {

  postRender() {
    AdaptArticleView.prototype.postRender.call(this);
    if (this.model.isAssessmentEnabled()) {
      this._setupEventListeners();

      const config = this.model.getConfig();
      if (config?._questions?._canShowMarking === false) {
        this.$el.addClass('has-no-marking');
      }
    }
    this.$el.addClass('is-assessment');
  },

  _setupEventListeners() {
    this.listenTo(Adapt, {
      'assessments:complete': this._onAssessmentComplete,
      'assessments:reset': this._onAssessmentReset,
      remove: this._onRemove
    });
  },

  _removeEventListeners() {
    this.stopListening(Adapt, {
      'assessments:complete': this._onAssessmentComplete,
      'assessments:reset': this._onAssessmentReset
    });
  },

  _onAssessmentComplete(state, model) {
    if (state.id !== this.model.get('_assessment')._id) return;

    logging.info('assessment complete', state, model);
  },

  _onAssessmentReset(state, model) {
    if (state.id !== this.model.get('_assessment')._id) return;

    logging.info('assessment reset', state, model);

  },

  _onRemove() {
    this._removeEventListeners();
  }

};

export default AssessmentView;
