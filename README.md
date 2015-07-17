#adapt-contrib-assessment

A basic assessment for the Adapt Framework which attaches to an 'article' object to group various question components (such as [adapt-contrib-mcq](https://github.com/adaptlearning/adapt-contrib-mcq), [adapt-contrib-textInput](https://github.com/adaptlearning/adapt-contrib-textInput) and [adapt-contrib-matching](https://github.com/adaptlearning/adapt-contrib-matching)) and provide a score with feedback.

##Installation

First, be sure to install the [Adapt Command Line Interface](https://github.com/adaptlearning/adapt-cli), then from the command line run:-

        adapt install adapt-contrib-assessment

This extension can also be installed by adding the extension to the adapt.json file before running `adapt install`:
 
        "adapt-contrib-assessment": "*"

##Usage
To be completed.

##Settings overview

A [sample JSON](https://github.com/adaptlearning/adapt-contrib-assessment/blob/master/example.json) is given below which can be added to an article:

NOTE: Please only include question blocks inside the assessment article. The article's children blocks may get randomised when the assessment attempt begins (depending on your settings), affecting the order of the blocks. Please put results components in a separate article and block.

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
        "_resetType": "soft",
        "_canShowFeedback": false
    },
    "_includeInTotalScore": true,
    "_assessmentWeight": 1,
    "_isResetOnRevisit": false,
    "_attempts": 2
}
```
NOTE: In the example above, you should use only one of the attributes, either `_banks": {...` or `"_randomisation": {...`


A description of the attributes is as follows:

| Attribute                 | Type         | Description|
| :-------------------------|:-------------|:-----------|
| _isEnabled                | bool         | Turns the assessment on or off. |
| _id                       | bool         | This is a unique name for the assessment. |
| _isPercentageBased        | bool         | Set this to `true` if the `scoreToPass` attribute should work on percentages, or `false` for otherwise. |
| _scoreToPass              | int          | This is the 'pass' mark for the assessment.  If `_isPercentageBased` is set to `true` this will be a percentage, e.g. 60 would equal 60%. |
| _banks                    | object       | Contains attributes for controlling which questions the user should receive based on a series of banks/question buckets (NOTE: This attribute cannot be used when the `_randomisation` attribute has been included). |
| _randomisation            | object       | Contains attributes for controlling how many random questions the user should receive (NOTE: This attribute cannot be used when the `_banks` attribute has been included). |
| _questions                | object       | Contains attributes for overriding question component behaviours. |
| _includeInTotalScore      | bool         | To signify that the score should be sent to the LMS as a proportional part of the total (as a percentage according to _assessmentWeight). |
| _assessmentWeight         | int          | If there are multiple assessments in the course, this value controls the proportion of the LMS score which is attributed to this assessment. 1 = 100%. |
| _isResetOnRevisit         | bool         | Controls if the assessment should automatically reset (up to the number of available attempts) when a user revisits the page. |
| _attempts                 | int / string | Controls the number of attempts available to the user. Infinite attempts can be specified using any of the following: `-1`,`0`,`null`,`undefined`,`"infinite"`. |
  

  
####block.json

```json
    "_quizBankID": "1",
```

Add the ```_quizBankID``` attribute to your blocks in order to organise the assessment article's blocks into banks. According to the ```_assessment._banks._split``` attribute from the assessment's article, a value of ```'2,1'``` in ```_assessment._banks._split``` would pick 2 blocks from bank 1 and and one block from bank 2. Quiz bank id's are a 1 index string value. 
  
  
####course.json

```json
"_assessment": {
    "_isPercentageBased": true,
    "_scoreToPass": 75,
    "_postTotalScoreToLms": true,
    "_requireAssessmentPassed": true
}
```


A description of the attributes is as follows:

| Attribute                 | Type         | Description|
| :-------------------------|:-------------|:-----|
| _isPercentageBased        | bool         | Set this to `true` if the scoreToPass attribute should work on percentages, or `false` otherwise. |
| _scoreToPass              | int          | This is the 'pass' mark for the assessment.  If `_isPercentageBased` is set to `true` this will be a percentage, e.g. 60 would equal 60%. |
| _postTotalScoreToLms           | bool         | To signify that the total score should be sent to the LMS (as a percentage). |
| _requireAssessmentPassed           | bool         | To signify that the progress calculations should account for a pass/fail rather than completion |



###Events

| Event | Description | Objects(s) |
|:------|:------------|:-----------|
| *assessment:register* | Triggered when an assessment is registered, between `app:dataReady` and `adapt:initialize` events. | stateObject, assessmentModel |
| *assessments:reset* | Triggered when an assessment is reset. | stateObject, assessmentModel |
| *assessments:complete* | Triggered when the user submits the last question of an assessment. | stateObject, assessmentModel | 
| *assessment:complete* | Triggered when the user submits the last question of the last assessment and the score is to be posted back to the LMS _(note that this event is `assessment` rather than `assessments`)_. | stateObject | 


####stateObject

The following table describes state object passed with the events above (with the exception of the final `assessment:complete` event, which passes a pared-down version of the state; attributes that are also attatched to this are denoted with an * next to the name).

| Attribute                 | Type         | Description|
| :-------------------------|:-------------|:-----|
| id                        | string       | The unique id of the assessment |
| type                      | string       | The assessment type (to allow for future assessment types, currently 'article-assessment' only) |
| pageId                    | string       | The page to which the assessment belongs (used to reset the assessment before a `pageView:preRender` event) |
| isEnabled                 | bool         | Returns a boolean signifying if the assessment is enabled |
| isComplete                | bool         | Returns a boolean signifying if the assessment is complete |
| isPercentageBased *       | bool         | Returns a boolean signifying if the assessment `scoreToPass` is percentage based |
| scoreToPass *             | int          | Defines the threshold score to signify a pass |
| score *                   | int          | Returns the current score of the assessment |
| scoreAsPercent *          | int          | Returns the current score of the assessment as a percentage, (`maxScore`/`score`) * 100 |
| maxScore *                | int          | Returns the maximum attainable score |
| isPass *                  | bool         | Returns a boolean signifying if the assessment is passed |
| includeInTotalScore            | bool         | Signifys that the assessment score will be posted to the LMS as part of the total score |
| assessmentWeight          | int          | Signifys the portion of the total Lms score which is derived from this assessment, (1 = 100%) |
| attempts                  | int          | The total number of attempts specified by the configuration (0 = infinite) |
| attemptsSpent             | int          | The total number of attempts spent by the user |
| attemptsLeft              | int / bool   | The total number of attempts remaining for the user or true if attempts=infinite |
| lastAttemptScoreAsPercent | int          | Returns the last attempt score |
| questions                 | object array | Contains an array of question objects `{ _id: string, _isCorrect: bool, title: string, displayTitle: string }` |
| assessments *             | int          | **NOTE: `assessment:complete` ONLY!**<br>Signifies the number of assessments passed to post back to the LMS | 
  
  
A description of the stateObject returned by the assessment:complete event is as follows:  
  
| Attribute                 | Type         | Description|
| :-------------------------|:-------------|:-----|
| isPercentageBased         | bool         | Returns a boolean signifying if the assessment `scoreToPass` is percentage based |
| requireAssessmentPassed         | bool         | Returns a boolean signifying if the course progress calculations should account for completion or pass/fail |
| scoreToPass               | int          | Defines the threshold score to signify a pass |
| score                     | int          | Returns the current score of the assessment |
| scoreAsPercent            | int          | Returns the current score of the assessment as a percentage, (`maxScore`/`score`) * 100 |
| maxScore                  | int          | Returns the maximum attainable score |
| isPass                    | bool         | Returns a boolean signifying if the assessment is passed |
| assessments               | int          | Signifies the number of assessments passed to post back to the Lms |
 

###Globals

```Adapt.assessment``` is a globally available variable. See below for descriptions of its public functions:    

| Function                  | Type                         | Description|
| :-------------------------|:-----------------------------|:-----|
| register(assessmentModel) | N/A                          | Registers the assessment for use with the `postToLms` feature and the `Adapt.assessment.get` function |
| get([id])                 | object array assessmentModel / object assessmentModel | Returns the assessmentModel by assessment id or returns an array of all models |
| getState()                | object StateObject | Returns the stateObject for the assessment:complete event signifying the total assessments state |
| saveState()                | N/A | Forces the assessment's states to be saved |
| getConfig()                | object | Returns the ``Adapt.course.get("_assessment")`` object with defaults applied |



###AssessmentModel  
  
The assessment models have a global API for each item return by a call to the ```Adapt.assessment.get([id]);``` function. See below for documentation about the available public functions:

| Function                  | Type               | Description|
| :-------------------------|:-------------------|:-----|
| isAssessmentEnabled()     | bool               | Returns if the assessment is enabled |
| canResetInPage()          | bool               | Returns if the assessment can be reset from within the page |
| reset([force])            | bool               | Resets or forces the reset of an assessment (will reload the page if on assessment page) |
| getState()                | object StateObject | Returns the stateObject for the assessment |
| getSaveState()                | object | Returns an object signifying all of the appropriate states which need to be saved for all assessments |
| setRestoreState()                | N/A | Takes the object from ``getStateSave()`` and restores the assessments to these states |
| getConfig()                | object | Returns the assessment model object with defaults applied |
=======

##Limitations
 
To be completed.

##Browser spec

This component has been tested to the standard Adapt browser specification.
