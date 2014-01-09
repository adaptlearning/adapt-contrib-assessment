var SurrogateQuestionView = QuestionView;
QuestionView = QuestionView.extend({
    onSubmitClicked: function(event) {
        SurrogateQuestionView.prototype.onSubmitClicked.apply(this, [event]);
        if(!this.canSubmit()) return;
        var parentArticle = this.model.getParent('article');
        if(!!parentArticle.get('assessment')) Adapt.trigger("assessmentQuestionAnswered", parentArticle);
    }
})