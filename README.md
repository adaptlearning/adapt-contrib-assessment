adapt-contrib-assessment
========================

A basic assessment for the Adapt Framework which attaches to an 'article' object to group various question components (such as [adapt-contrib-mcq](https://github.com/adaptlearning/adapt-contrib-mcq), [adapt-contrib-textInput](https://github.com/adaptlearning/adapt-contrib-textInput) and [adapt-contrib-matching](https://github.com/adaptlearning/adapt-contrib-matching).

A [sample JSON](https://github.com/adaptlearning/adapt-contrib-assessment/example.json) is given below which can be added to a single article block:

```json
"_assessment": {
    "_isPercentageBased" : true,
    "_scoreToPass" : 60,
    "_completionMessage" : {
        "_title" : "You have finished the assessment",
        "_message": "You have scored [SCORE] out of [MAXSCORE].  [FEEDBACK]"
    },
    "_bands": [
        {
            "_score": 0,
            "_feedback": "You must try harder"
        },
        {
            "_score": 25,
            "_feedback": "I think you can do better than this"
        },
        {
            "_score": 50,
            "_feedback": "Good effort, you're getting there..."
        },
        {
            "_score": 75,
            "_feedback": "Excellent!"
        }
    ]
}
```

A description of attributes is as follows:

| Attribute        | Type| Description|
| ------------- |:-------------|:-----|
| _isPercentageBased        | bool |Set this to *true* if the assessment should work on percentages, or *false* for otherwise|
| _scoreToPass         | int      | This is the 'pass' mark for the assessment.  If _isPercentageBased is set to *true* this will be a percentage, e.g. 60 would equal 60% |
| _completionMessage            | object | An object containing _title and _message string values.  Note that _message can contain the following placeholders: [SCORE], [MAXSCORE] and [FEEDBACK] |
| _bands          | object array | An array of objects whose purpose is to define the score banding.  The attributes required for each object are _score and _feedback

