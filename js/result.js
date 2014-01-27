// Adapt.on("assessment:quizComplete", function(result) {
//     console.log(results)
// });

// Adapt.result = ComponentView.extend({
//     init: function() {
//         //this.model.set({complete:true});
//         this.feedbackToArray();
//         this.listenTo(Adapt, "quizComplete", this.onQuizComplete, this);
//         if (this.model.get("enableOnRevisit")) {
//             this.model.getParent("article").resetQuiz();
//             this.model.set("result", {});
//         }
            
//     },

//     feedbackToArray: function() {
//         var feedback = this.model.get("feedback");
//         var feedbackArray = [];
//         for (prop in feedback) {
//             feedbackArray.push(feedback[prop]);
//         }

//         this.model.set("feedback", feedbackArray);
//     },
    
//     onQuizComplete: function(){
//         this.feedback();

//         this.model.set({complete:true});

//         var score = this.model.getParent("article").getScore();
//         var scoreAsPercent = this.getScoreAsPercent(); 
//         var hasPassed = score >= this.model.get('passingScore');


//         if (Adapt.Spoor) {
//             if (this.model.get('submitScore')) {
//                 Adapt.Spoor.setScore(this.getScoreAsPercent());               
//             }

//             Adapt.Spoor.onQuizComplete(!!this.model.get('assessment'), hasPassed);
//         }

//         Adapt.trigger('assessment:quizComplete', {
//             pass: hasPassed, 
//             score: score,
//             scoreAsPercent: scoreAsPercent 
//         });
//     },    
    
//     getScoreAsPercent: function() {
//         return Math.round((this.model.getParent("article").getScore() / this.model.getParent("article").getMaxScore()) * 100);
//     },
    
//     feedback: function() {
        
//         var result = {};
    
//         var associatedLearning = this.model.getParent("article").getAssociatedLearning();  
        
//         var feedback = this.getBandedFeedback();
        
//         feedback = feedback.replace("[SCORE]", this.model.getParent("article").getScore());
//         feedback = feedback.replace("[MAXSCORE]", this.model.getParent("article").getMaxScore().toString());
//         feedback = feedback.replace("[PERCENT]", this.getScoreAsPercent().toString());
        
//         result.feedbackText = feedback;
        
//         if (associatedLearning.length > 0) {
//             result.reviewText = this.model.get('reviewText');
//             result.reviewTopics = [];
//             _.each(associatedLearning, function(model){
//                 result.reviewTopics.push(model.get('title'));
//             });
//         }
    
//         this.model.set('result', result);
        
//         var data = this.model.toJSON();
//         var template = Handlebars.templates[this.template];
        
//         var content = $('.result > .inner', template(data));
//         this.$('.result').html(content);
//     },
    
//     getBandedFeedback: function(){
//         var bands = this.model.get('bands');
//         var percent = this.getScoreAsPercent();
        
//         for (var i = 0; i < bands.length; i++){
//             var feedback = this.model.get('feedback');
//             if (percent >= bands[i]) return feedback[i];        
//         }
//     }
// },{
//     type:"Adapt.result"
// });
>>>>>>> develop
