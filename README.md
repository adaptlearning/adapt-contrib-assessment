adapt-contrib-assessment
========================

A basic assessment for the Adapt Framework which attaches to an 'article' object to group various question components (such as [adapt-contrib-mcq](https://github.com/adaptlearning/adapt-contrib-mcq), [adapt-contrib-textInput](https://github.com/adaptlearning/adapt-contrib-textInput) and [adapt-contrib-matching](https://github.com/adaptlearning/adapt-contrib-matching)) and provide a score with feedback.

A [sample JSON](https://github.com/cgkineo/adapt-contrib-assessment/blob/master/example.json) is given below which can be added to a single article block:

```json
"_assessment": {
    "_isEnabled":true,
    "_isResetOnRevisit": true,
    "_canShowFeedback": false,
    "_startBlockCount": 0,
    "_endBlockCount": 1,
    "_assessmentPageLevelProgress": {
        "_incrementalMarking": true,
        "_showMarking": true,
        "_showProgress": true
    }, 
    "_banks": {
        "_isEnabled": false,
        "_split": "2,2"
    },
    "_randomisation": {
        "_isEnabled": true,
        "_blockCount": 4
    },
    "_isPercentageBased" : true,
    "_scoreToPass" : 75,
    "_completionMessage" : {
        "title" : "You have finished the assessment",
        "message": "You scored [SCORE] out of [MAXSCORE].  [FEEDBACK]"
    },
    "_bands": [
        {
            "_score": 0,
            "feedback": "Your score was below 25%. Why not have another try? Below is a list of areas you might want to study first.",
            "_showAssociatedLearning": true
        },
        {
            "_score": 25,
            "feedback": "Your score was below 50%. Why not have another try? Below is a list of areas you might want to study first.",
            "_showAssociatedLearning": true
        },
        {
            "_score": 50,
            "feedback": "Good effort, but you're score was under 75%. Let's try again? Below is a list of areas you might want to study first.",
            "_showAssociatedLearning": true
        },
        {
            "_score": 75,
            "feedback": "Great work. You passed the assessment article quiz.",
            "_showAssociatedLearning": false
        }
    ]
}
```

A description of attributes is as follows:

| Attribute        | Type| Description|
| :------------ |:-------------|:-----|
| _isEnabled  | Boolean   | Set to true to switch the assessment on
| _isResetOnRevisit  | Boolean   | Whether or not the user is given more than a single attempt at the quiz in a session
| _canShowFeedback  | Boolean   | Whether or not question components in the assesment display feedback
| _startBlockCount  | int   | Number of blocks appear in order at the start of the quiz, before question blocks are randomised or put into banks. Typically used for showing initial presentation blocks |
| _endBlockCount    | int   | Number of blocks appear at the end of the quiz, after randomised or banked question blocks |
| _assessmentPageLevelProgress | object | Sets config options for when using progress indicators in assessment. _incrementalMarking is whether to show progress as you go, or for it all to display on assessment complete. _showMarking and _showProgress should be self-explanatory and are not mutually exclusive |
| _banks    |  object |  Set "_isEnabled" (bool) to true to put question blocks into banks. "_split" (String) sets the split across banks e.g. "1,2,1" will pull 1 from bank 1, 2 from bank 2, 1 from bank 3, Quiz blocks in blocks.json have a "_quizBankID" property e.g. "_quizBankID": 1 |
| _randomisation | object  | Set "_isEnabled" (bool) to true to turn on randomisation of question blocks. "_blockCount" (int) sets the number of random blocks to be displayed. _randomisation -> _isEnabled can be used in conjunction with "_banks" |
| _isPercentageBased        | bool |Set this to *true* if the assessment should work on percentages, or *false* for otherwise|
| _scoreToPass         | int      | This is the 'pass' mark for the assessment.  If _isPercentageBased is set to *true* this will be a percentage, e.g. 60 would equal 60% |
| _completionMessage            | object | An object containing *title* and *message* string values.  Note that *message* can contain the following placeholders: [SCORE], [MAXSCORE] and [FEEDBACK] |
| _bands          | object array | An array of objects whose purpose is to define the score banding.  The attributes required for each object are _score and *feedback*

###Events

<table>
    <thead>
        <td><b>Event</b></td>
        <td><b>Description</b></td>
        <td><b>Object</b></td>        
    </thead>
    <tr valign="top">
        <td><i>assessment:complete</i></td>
        <td>Triggered when the user submits the last question component which is part of the assessment article </td>
        <td>
            <table>
                <tr>
                    <td>isPass</td>
                    <td>bool</td>
                </tr>
                <tr>
                    <td>score</td>
                    <td>int</td>
                </tr>
                <tr>
                    <td>scoreAsPercent</td>
                    <td>int</td>
                </tr>
                <tr>
                    <td>feedbackMessage</td>
                    <td>String</td>
                </tr>
                <tr>
                    <td>associatedLearning</td>
                    <td>Array</td>
                </tr>
            </table>
        
        </td>        
    </tr>
</table>