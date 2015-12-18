# adapt-contrib-assessment  
    
**Assessment** is an *extension* bundled with the [Adapt framework](https://github.com/adaptlearning/adapt_framework).  
It is not a single [question component](https://github.com/adaptlearning/adapt_framework/wiki/Core-Plug-ins-in-the-Adapt-Learning-Framework#question-components). It is an extension that provides a score for all the [question components](https://github.com/adaptlearning/adapt_framework/wiki/Core-Plug-ins-in-the-Adapt-Learning-Framework#question-components) contained within a single [article](https://github.com/adaptlearning/adapt_framework/wiki/Framework-in-five-minutes#content-structure) and that communicates the score to the LMS if so configured. It does not display results. Results are presented with the [Assessment Results](https://github.com/adaptlearning/adapt-contrib-assessmentResults) component (for the results from a single assessment) or the [Assessment Results Total](https://github.com/adaptlearning/adapt-contrib-assessmentResultsTotal) component (for the results from multiple assessments).

>**Important:**  
>The **Assessment** extension applies to the entire article. Since `_randomisation` may reorder blocks within the article, it is highly recommended to include only question components within the assessment article. The Results component should be placed in a separate article, *not* within the assessment article.  

[Visit the **Assessment** wiki](https://github.com/adaptlearning/adapt-contrib-assessment/wiki) for more information about its functionality and for explanations of key properties. 

##Installation

As one of Adapt's *[core extensions](https://github.com/adaptlearning/adapt_framework/wiki/Core-Plug-ins-in-the-Adapt-Learning-Framework#extensions),* **Assessment** is included with the [installation of the Adapt framework](https://github.com/adaptlearning/adapt_framework/wiki/Manual-installation-of-the-Adapt-framework#installation) and the [installation of the Adapt authoring tool](https://github.com/adaptlearning/adapt_authoring/wiki/Installing-Adapt-Origin).

* If **Assessment** has been uninstalled from the Adapt framework, it may be reinstalled.
With the [Adapt CLI](https://github.com/adaptlearning/adapt-cli) installed, run the following from the command line:  
`adapt install adapt-contrib-assessment`

    Alternatively, this component can also be installed by adding the following line of code to the *adapt.json* file:  
    `"adapt-contrib-assessment": "*"`  
    Then running the command:  
    `adapt install`  
    (This second method will reinstall all plug-ins listed in *adapt.json*.)  

* If **Assessment** has been uninstalled from the Adapt authoring tool, it may be reinstalled using the [Plug-in Manager](https://github.com/adaptlearning/adapt_authoring/wiki/Plugin-Manager).  

<div float align=right><a href="#top">Back to Top</a></div>

## Settings Overview

**Assessment** is configured with the attributes that follow. It is configured on three levels of the [content structure](https://github.com/adaptlearning/adapt_framework/wiki/Framework-in-five-minutes#content-structure): course (*course.json*), article (*articles.json*), and block (*blocks.json*). The attributes are so grouped below and are properly formatted as JSON in [*example.json*](https://github.com/adaptlearning/adapt-contrib-assessment/blob/master/example.json). Visit the [**Assessment** wiki](https://github.com/adaptlearning/adapt-contrib-assessment/wiki) for more information about how they appear in the [authoring tool](https://github.com/adaptlearning/adapt_authoring/wiki).   

### Attributes  

#### *course.json*  
The following attributes, set within *course.json*, configure the defaults for all assessments in the course. These attributes can be overridden on a per assessment basis by setting attributes of the same names in *articles.json*.

**_assessment** (object): The Assessment object that contains values for **_scoreToPass**, **_isPercentageBased**, **_postTotalScoreToLms**, and **_requireAssessmentPassed**. 

>**_scoreToPass** (integer): This is the achievement score required to pass the assessment. The learner's score must be greater than or equal to this score. It is the cumulative raw score needed to pass unless **_isPercentageBased** is set to `true`.

>**_isPercentageBased** (boolean): Determines whether the value of **_scoreToPass** should be treated as a percentage or as the raw score. For example, if **_isPercentageBased** is set to `true`, a **_scoreToPass** value of `60` will be treated as `60%`. 

>**_postTotalScoreToLms** (boolean): Specifies whether the total score (as a percentage) should be sent to the LMS. Acceptable values are `true` or `false`.   

>**_requireAssessmentPassed** (boolean): Determines if a pass is required for each assessment to be completed. 

<div float align=right><a href="#top">Back to Top</a></div>

#### *articles.json*  
The following attributes are appended to a particular article within *articles.json*. Multiple assessments may be used within a course, but they must be configured in separate articles.

**_assessment** (object): The Assessment object that contains values for **_isEnabled**, **_id**, **_isPercentageBased**, **_scoreToPass**, **_banks**, **_randomisation**,  **_questions**, **_includeInTotalScore**, **_assessmentWeight**, **_isResetOnRevisit**, and **_attempts**.  

>**_isEnabled** (boolean): Turns the assessment on or off. Acceptable values are `true` or `false`. 

>**_id** (string): This is a unique name for the assessment. This value is used by other plug-ins, such as [adapt-contrib-assessmentResults](https://github.com/adaptlearning/adapt-contrib-assessmentResults), to identify the assessment and to display its variables.

>**_isPercentageBased** (boolean): Determines whether the value of **_scoreToPass** should be treated as a percentage or as the raw score. For example, if **_isPercentageBased** is set to `true`, a **_scoreToPass** value of `60` will be treated as `60%`.   

>**_scoreToPass** (number): This is the achievement score required to pass the assessment. The learner's score must be greater than or equal to this score. It is the cumulative raw score needed to pass unless **_isPercentageBased** is set to `true`.    

>**_includeInTotalScore** (boolean): Determines if the score from this assessment should be sent to the LMS. The score sent is a percentage according to _assessmentWeight.   

>**_banks** (object): If **_banks** is enabled, its attributes determine which questions from a series of question banks/buckets will be presented to the learner. Contains values for **_isEnabled**, **_split**, and **_randomisation**.   (Use either **_banks** or **_randomisation**; the value of their **_isEnabled** attributes must be opposite booleans. If **_banks** is enabled, blocks must be organized into questions banks by adding the **_quizBankID** attribute referenced below.)

>>**_isEnabled** (boolean): Turns on or off the ability to use question banks.  

>>**_split** (string): This is a comma-separated list of numbers corresponding to the number of questions to be drawn from each identified block. The *position* of the numberal in the list corresponds to the **_quizBankID** assigned to a block. The *value* of the number determines how many questions to retrieve randomly from that particular quiz bank. For example, a **_split** with a value of "2,1" would pick 2 questions from bank 1 (`"_quizBankID": "1"`) and 1 question from bank 2 (`"_quizBankID": "2"`).  

>>**_randomisation** (boolean): Determines whether the questions will be displayed in the same order as the blocks are ordered in *blocks.json* or will be shuffled before they are presented to the learner. Acceptable values are `true` or `false`.

>**_randomisation** (object): If **_randomisation** is enabled, its attributes control how many random questions will be presented to the learner. Contains values for **_isEnabled** and **_blockCount**. Questions and the order in which they are presented are maintained throughout an attempt, should a learner leave the assessment incomplete and return later. (Use either **_randomisation** or **_banks**; the value of their **_isEnabled** attributes must be opposite booleans.)

>>**_isEnabled** (boolean): Turns on or off the ability to use **_randomisation**.      

>>**_blockCount** (number): The number of blocks to present to the learner. (Questions are presented by blocks. If one component occupies a block, it will be presented alone. If multiple components occupy a block, they will always appear together.) 

>**_questions** (object): Contains attributes for overriding question component behaviours. Contains values for **_resetType**, **_canShowFeedback**, **_canShowMarking** and **_canShowModelAnswer**.

>>**_resetType** (string): Determines whether the question component will register as completed when reset. When assigned a value of `soft`, the learner may continue to interact with it, but the component's `_isComplete` attribute remains set to `true`. When assigned `hard`, `_isComplete` is set to `false`, and the learner will be forced to complete it again if it is reset. Other plug-ins, such as [Page Level  Progress](https://github.com/adaptlearning/adapt-contrib-pageLevelProgress) and [Trickle](https://github.com/adaptlearning/adapt-contrib-trickle), base their behavior on the value of a component's `_isComplete` attribute. Acceptable values are `hard` or `soft`.

>>**_canShowFeedback** (boolean): Determines whether question components within the assessment will be permitted to show its feedback. Acceptable values are `true` or `false`.

>>**_canShowMarking** (boolean): Determines whether question components within the assessment will show the marking after the user has answered. Acceptable values are `true` or `false`.

>>**_canShowModelAnswer** (boolean): Determines whether question components within the assessment will show the [**_showCorrectAnswer** button](https://github.com/adaptlearning/adapt_framework/wiki/Core-Buttons) or not if the user answers incorrectly. Acceptable values are `true` or `false`.

>**_assessmentWeight** (number): If there are multiple assessments in the course, this value controls the proportion of the LMS score which is attributed to this assessment. 1 = 100%.    

>**_isResetOnRevisit** (boolean): Controls whether the assessment should be reset automatically (up to the number of available attempts) when a user revisits the page. Acceptable values are `true` or `false`.   

>**_attempts** (number): Controls the number of attempts available to the user. Any of the following values may be used to indicate an infinite number of attempts: `-1`, `0`, `null`, `undefined`, `"infinite"`.  

<div float align=right><a href="#top">Back to Top</a></div>

#### *blocks.json*  
**_assessment** (object): The Assessment object that contains a value for **_quizBankID**.

>**_quizBankID** (string): Add the **_quizBankID** attribute to your assessment blocks in order to organize them into question banks/buckets. IDs are coordinated with positions in the **_split** attribute. Quiz bank IDs are a 1-based index. The first position in the list corresponds to `"_quizBankID": 1`, the second position corresponds to `"_quizBankID": 2`, and so on. A value of '2,1' in **_split** would pick 2 questions from `"_quizBankID": 1` and one question from `"_quizBankID": 2`.  

<div float align=right><a href="#top">Back to Top</a></div>

### Events

**assessments:register**   
Triggered when an assessment is registered. Occurs between app:dataReady and adapt:initialize events. Returns `stateObject`, `assessmentModel`  

**assessments:reset**  
Triggered when an assessment is reset. Returns `stateObject`, `assessmentModel`  

**assessments:complete**  
Triggered when the user submits the last question of an assessment. Returns `stateObject`, `assessmentModel`  

**assessment:complete**   
Triggered when the user submits the last question of the last assessment and the score is to be posted back to the LMS. Returns `stateObject`  
<div float align=right><a href="#top">Back to Top</a></div>

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
| postScoreToLms            | bool         | Signifies that the assessment score will be posted to the LMS |
| assessmentWeight          | int          | Signifies the portion of the total LMS score which is derived from this assessment, (1 = 100%) |
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
| assessments               | int          | Signifies the number of assessments passed to post back to the LMS |

## Limitations
 
**Assessment** must be used with [question components](https://github.com/adaptlearning/adapt_framework/wiki/Core-Plug-ins-in-the-Adapt-Learning-Framework#question-components) that extend and implement Adapt's [`questionView`](https://github.com/adaptlearning/adapt_framework/wiki/Developers-guide:-components#question-components). 
If data is required to be passed to a SCORM conformant LMS, the [Spoor](https://github.com/adaptlearning/adapt-contrib-spoor) extension must be enabled. If [question components](https://github.com/adaptlearning/adapt_framework/wiki/Core-Plug-ins-in-the-Adapt-Learning-Framework#question-components) are required to display feedback after attempts, the [Tutor](https://github.com/adaptlearning/adapt-contrib-tutor) extension must be enabled. And if it is appropriate to display performance results to the learner, a separate component such as [Assessment Results](https://github.com/adaptlearning/adapt-contrib-assessmentResults) is required.  

----------------------------
**Version number:**  2.0   <a href="https://community.adaptlearning.org/" target="_blank"><img src="https://github.com/adaptlearning/documentation/blob/master/04_wiki_assets/plug-ins/images/adapt-logo-mrgn-lft.jpg" alt="adapt learning logo" align="right"></a> 
**Framework versions:** 2.0  
**Author / maintainer:** Adapt Core Team with [contributors](https://github.com/adaptlearning/adapt-contrib-assessment/graphs/contributors)    
**Accessibility support:** WAI AA   
**RTL support:** yes  
**Cross-platform coverage:** Chrome, Chrome for Android, Firefox (ESR + latest version), IE 11, IE10, IE9, IE8, IE Mobile 11, Safari for iPhone (iOS 7+8), Safari for iPad (iOS 7+8), Safari 8, Opera    
