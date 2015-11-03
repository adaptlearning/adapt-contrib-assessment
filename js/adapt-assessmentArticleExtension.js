define([
    'coreJS/adapt',
    'coreViews/articleView',
    'coreModels/articleModel',
    './adapt-assessmentArticleView',
    './adapt-assessmentArticleModel',
    './assessment',
], function(Adapt, ArticleView, ArticleModel, AdaptAssessmentArticleView, AdaptAssessmentArticleModel) {

    /*  
        Here we are extending the articleView and articleModel in Adapt.
        This is to accomodate the assessment functionality on the article.
        The advantage of this method is that the assessment behaviour can utilize all of the predefined article behaviour in both the view and the model.
    */  

    //Extends core/js/views/articleView.js
    var ArticleViewInitialize = ArticleView.prototype.initialize;
    ArticleView.prototype.initialize = function(options) {
        if (this.model.get("_assessment") && this.model.get("_assessment")._isEnabled === true) {
            //extend the articleView with new functionality
            _.extend(this, AdaptAssessmentArticleView);
        }
        //initialize the article in the normal manner
        return ArticleViewInitialize.apply(this, arguments);
    };

    //Extends core/js/models/articleModel.js
    var ArticleModelInitialize = ArticleModel.prototype.initialize;
    ArticleModel.prototype.initialize = function(options) {
        if (this.get("_assessment") && this.get("_assessment")._isEnabled === true) {
            //extend the articleModel with new functionality
            _.extend(this, AdaptAssessmentArticleModel);

            //initialize the article in the normal manner
            var returnValue = ArticleModelInitialize.apply(this, arguments);

            //initialize assessment article
            this._postInitialize();

            return returnValue;
        }

        //initialize the article in the normal manner if no assessment
        return ArticleModelInitialize.apply(this, arguments);
    };

});
