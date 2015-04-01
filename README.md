adapt-contrib-assessment
========================

A basic assessment for the Adapt Framework which attaches to an 'article' object to group various question components (such as [adapt-contrib-mcq](https://github.com/adaptlearning/adapt-contrib-mcq), [adapt-contrib-textInput](https://github.com/adaptlearning/adapt-contrib-textInput) and [adapt-contrib-matching](https://github.com/adaptlearning/adapt-contrib-matching)) and provide a score with feedback.

A [sample JSON](https://github.com/adaptlearning/adapt-contrib-assessment/blob/master/example.json) is given below which can be added to an article:

####article.json

```json
"_assessment": {
    "_isEnabled":true,
    "_id": "Assessment 1",
    "_isPercentageBased" : true,
    "_scoreToPass" : 75,
    "_banks": {
        "_isEnabled": true,
        "_split": "2,1",
        "_randomisation": true
    },
    "_randomisation": {
        "_isEnabled": false,
        "_blockCount": 1
    },
    "_questions": {
        "_resetType": "hard",
        "_canShowFeedback": false
    },
    "_postScoreToLms": true,
    "_assessmentWeight": 1,
    "_isResetOnRevisit": false,
    "_attempts": 2
}
```

A description of the attributes is as follows:

| Attribute                 | Type         | Description|
| :-------------------------|:-------------|:-----|
| _isEnabled                | bool         | Turns the assessment on or off |
| _id                       | bool         | This is a unique name for the assessment |
| _isPercentageBased        | bool         | Set this to *true* if the scoreToPass attribute should work on percentages, or *false* for otherwise |
| _scoreToPass              | int          | This is the 'pass' mark for the assessment.  If _isPercentageBased is set to *true* this will be a percentage, e.g. 60 would equal 60% |
| _banks                    | object       | Contains attributes for controlling which questions the user should receive based on a series of banks/question buckets (use either _banks or _randomisation) |
| _randomisation            | object       | Contains attributes for controlling how many random questions the user should receive (use either _banks or _randomisation) |
| _questions                | object       | Contains attributes for overriding question component behaviours |
| _postScoreToLms           | bool         | To signify that the score should be sent to the Lms (as a percentage) |
| _assessmentWeight         | int          | If there are multiple assessments in the course, this value controls the proportion of the Lms score which is attributed to this assessment. 1 = 100% |
| _isResetOnRevisit         | bool         | Controls if the assessment chould automatically reset (up to the number of available attempts) when a user revisits the page |
| _attempts                 | int / string | Controls the number of attempts available to the user. "infinite" = infinite attempts |
  

  
####block.json

```json
    "_quizBankID": "1",
```

Add the ```_quizBankID``` attribute to your blocks in order to organise the assessment article's blocks into banks. According to the ```_assessment._banks._split``` attribute from the assessment's article, a value of ```'2,1'``` in ```_assessment._banks._split``` would pick 2 questions from bank 1 and and one question from bank 2. Quiz bank id's are a 1 index string value. 
  
  
####course.json

```json
"_assessment": {
    "_isPercentageBased": true,
    "_scoreToPass": 75,
    "_postTotalScoreToLms": true
}
```


A description of the attributes is as follows:

| Attribute                 | Type         | Description|
| :-------------------------|:-------------|:-----|
| _isPercentageBased        | bool         | Set this to *true* if the scoreToPass attribute should work on percentages, or *false* for otherwise |
| _scoreToPass              | int          | This is the 'pass' mark for the assessment.  If _isPercentageBased is set to *true* this will be a percentage, e.g. 60 would equal 60% |
| _postTotalScoreToLms           | bool         | To signify that the total score should be sent to the Lms (as a percentage) |



###Events

<table>
    <thead>
        <td><b>Event</b></td>
        <td><b>Description</b></td>     
        <td><b>Object(s)</b></td>  
    </thead>
    <tr valign="top">
        <td><i>assessments:register</i></td>
        <td>Triggered when an assessment is registered, between app:dataReady and adapt:initialize events </td>
        <td>stateObject, assessmentModel</td>
    </tr>
    <tr valign="top">
        <td><i>assessments:reset</i></td>
        <td>Triggered when an assessment is reset </td>
        <td>stateObject, assessmentModel</td>
    </tr>
    <tr valign="top">
        <td><i>assessments:complete</i></td>
        <td>Triggered when the user submits the last question of an assessment </td>
        <td>stateObject, assessmentModel</td>
    </tr>
    <tr valign="top">
        <td><i>assessment:complete</i></td>
        <td>Triggered when the user submits the last question of the last assessment and the score is to be posted back to the Lms </td>
        <td>stateObject</td>        
    </tr>
</table>

####stateObject

A description of the stateObject returned by the assessments:events is as follows:

| Attribute                 | Type         | Description|
| :-------------------------|:-------------|:-----|
| id                        | string       | The unique id of the assessment |
| type                      | string       | The assessment type (to allow for future assessment types, currently 'article-assessment' only) |
| pageId                    | string       | The page to which the assessment belongs (used to reset the assessment before a pageView:preRender event) |
| isEnabled                 | bool         | Returns a boolean signifying if the assessment is enabled |
| isComplete                | bool         | Returns a boolean signifying if the assessment is complete |
| isPercentageBased         | bool         | Returns a boolean signifying if the assessment scoreToPass is percentage based |
| scoreToPass               | int          | Defines the threshold score to signify a pass |
| score                     | int          | Returns the current score of the assessment |
| scoreAsPercent            | int          | Returns the current score of the assessment as a percentage, (maxScore/score) * 100 |
| maxScore                  | int          | Returns the maximum attainable score |
| isPass                    | bool         | Returns a boolean signifying if the assessment is passed |
| postScoreToLms            | bool         | Signifys that the assessment score will be posted to the Lms |
| assessmentWeight          | int          | Signifys the portion of the total Lms score which is derived from this assessment, (1 = 100%) |
| attempts                  | int          | The total number of attempts specified by the configuration (0 = infinite) |
| attemptsSpent             | int          | The total number of attempts spent by the user |
| attemptsLeft              | int / bool   | The total number of attempts remaining for the user or true if attempts=infinite |
| lastAttemptScoreAsPercent | int          | Returns the last attempt score |
| questions                 | object array | Contains an array of question objects { _id: string, _isCorrect: bool, title: string, displayTitle: string } |
  
  
A description of the stateObject returned by the assessment:complete event is as follows:  
  
| Attribute                 | Type         | Description|
| :-------------------------|:-------------|:-----|
| isPercentageBased         | bool         | Returns a boolean signifying if the assessment scoreToPass is percentage based |
| scoreToPass               | int          | Defines the threshold score to signify a pass |
| score                     | int          | Returns the current score of the assessment |
| scoreAsPercent            | int          | Returns the current score of the assessment as a percentage, (maxScore/score) * 100 |
| maxScore                  | int          | Returns the maximum attainable score |
| isPass                    | bool         | Returns a boolean signifying if the assessment is passed |
| assessments               | int          | Signifies the number of assessments passed to post back to the Lms |
 

###Globals

```Adapt.assessment``` is globally available.    
 
A description of its public functions is as follows:

| Function                  | Type                         | Description|
| :-------------------------|:-----------------------------|:-----|
| register(assessmentModel) | N/A                          | Registers the assessment for use with the postToLms feature and the `Adapt.assessment.get` function |
| get([id])                 | object array assessmentModel / object assessmentModel | Returns the assessmentModel by assessment id or returns an array of all models |


###AssessmentModel  
  
The assessment models have a global API for each item return by a call to the ```Adapt.assessment.get([id]);``` function.   
 
A description of the AssessmentModel's public functions is as follows:

| Function                  | Type               | Description|
| :-------------------------|:-------------------|:-----|
| isAssessmentEnabled()     | bool               | Returns if the assessment is enabled |
| canResetInPage()          | bool               | Returns if the assessment can be reset from within the page |
| reset([force])            | bool               | Resets or forces the reset of an assessment (will reload the page if on assessment page) |
| getState()                | object StateObject | Returns the stateObject for the assessment |






