import ArticleView from 'core/js/views/articleView';
import ArticleModel from 'core/js/models/articleModel';
import AdaptAssessmentArticleView from './adapt-assessmentArticleView';
import AdaptAssessmentArticleModel from './adapt-assessmentArticleModel';
import './assessment';

/*
  * Here we are extending the articleView and articleModel in Adapt.
  * This is to accomodate the assessment functionality on the article.
  * The advantage of this method is that the assessment behaviour can utilize all of the predefined article behaviour in both the view and the model.
  */

// Extends core/js/views/articleView.js
const ArticleViewInitialize = ArticleView.prototype.initialize;
ArticleView.prototype.initialize = function(options) {
  if (this.model.get('_assessment')?._isEnabled === true) {
    // extend the articleView with new functionality
    Object.assign(this, AdaptAssessmentArticleView);
  }
  // initialize the article in the normal manner
  return ArticleViewInitialize.apply(this, arguments);
};

// Extends core/js/models/articleModel.js
const ArticleModelInitialize = ArticleModel.prototype.initialize;
ArticleModel.prototype.initialize = function(options) {
  if (this.get('_assessment')?._isEnabled === true) {
    // extend the articleModel with new functionality
    Object.assign(this, AdaptAssessmentArticleModel);

    // initialize the article in the normal manner
    const returnValue = ArticleModelInitialize.apply(this, arguments);

    // initialize assessment article
    this._postInitialize();

    return returnValue;
  }

  // initialize the article in the normal manner if no assessment
  return ArticleModelInitialize.apply(this, arguments);
};
