# adapt-contrib-assessment

**Assessment** is an *extension* bundled with the [Adapt framework](https://github.com/adaptlearning/adapt_framework).
It is not a single [question component](https://github.com/adaptlearning/adapt_framework/wiki/Core-Plug-ins-in-the-Adapt-Learning-Framework#question-components). It is an extension that provides a score for all the [question components](https://github.com/adaptlearning/adapt_framework/wiki/Core-Plug-ins-in-the-Adapt-Learning-Framework#question-components) contained within a single [article](https://github.com/adaptlearning/adapt_framework/wiki/Framework-in-five-minutes#content-structure) and that communicates the score to the LMS if so configured. It does not display results. Results are presented with the [Assessment Results](https://github.com/adaptlearning/adapt-contrib-assessmentResults) component (for the results from a single assessment) or the [Assessment Results Total](https://github.com/adaptlearning/adapt-contrib-assessmentResultsTotal) component (for the results from multiple assessments).

>**Important:**
>The **Assessment** extension applies to the entire article. Since `_randomisation` may reorder blocks within the article, it is highly recommended to include only question components within the assessment article.
>
> **The Results component must be placed in a separate article, *not* within the assessment article.**
>
>Blocks inside an assessment article must contain a question. Any blocks containing only presentation components will not be rendered when the article is restored.

[Visit the **Assessment** wiki](https://github.com/adaptlearning/adapt-contrib-assessment/wiki) for explanations of key properties and for more information about its functionality such as [restoring state upon revisit](https://github.com/adaptlearning/adapt-contrib-assessment/wiki/Restore-assessment-state).

## Installation

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

**\_assessment** (object): The Assessment object that contains values for **\_scoreToPass** and **\_isPercentageBased**.

>**\_scoreToPass** (integer): This is the achievement score required to pass the assessment. The learner's score must be greater than or equal to this score. It is the cumulative raw score needed to pass unless **\_isPercentageBased** is set to `true`.

>**\_correctToPass** (integer): This is the achievement correctness required to pass the assessment. The learner's score must be greater than or equal to this score. It is the cumulative raw correctness needed to pass unless **\_isPercentageBased** is set to `true`.

>**\_isPercentageBased** (boolean): Determines whether the values of **\_scoreToPass** and **\_correctToPass** should be treated as percentages or as the raw score and correctness. For example, if **\_isPercentageBased** is set to `true`, a **\_scoreToPass** value of `60` will be treated as `60%`.

<div float align=right><a href="#top">Back to Top</a></div>

#### *articles.json*
The following attributes are appended to a particular article within *articles.json*. Multiple assessments may be used within a course, but they must be configured in separate articles.

**\_assessment** (object): The Assessment object that contains values for **\_isEnabled**, **\_id**, **\_isPercentageBased**, **\_scoreToPass**, **\_banks**, **\_randomisation**, **\_questions**, **\_includeInTotalScore**, **\_assessmentWeight**, **\_isResetOnRevisit**, and **\_attempts**.

>**_isEnabled** (boolean): Turns the assessment on or off. Acceptable values are `true` or `false`.

>**\_id** (string): This is a unique name for the assessment. This value is used by other plug-ins, such as [adapt-contrib-assessmentResults](https://github.com/adaptlearning/adapt-contrib-assessmentResults), to identify the assessment and to display its variables.

>**\_suppressMarking** (boolean): Suppresses the assessment question marking until completion of the assessment or until all attempts have been exhausted. Acceptable values are `true` or `false`.

>**\_scoreToPass** (number): This is the achievement score required to pass the assessment. The learner's score must be greater than or equal to this score. It is the cumulative raw score needed to pass unless **\_isPercentageBased** is set to `true`.

>**\_correctToPass** (number): This is the achievement correctness required to pass the assessment. The learner's correctness must be greater than or equal to this value. It is the cumulative raw correctness needed to pass unless **\_isPercentageBased** is set to `true`.

>**\_isPercentageBased** (boolean): Determines whether the values of **\_scoreToPass** and **\_correctToPass** should be treated as percentages or as the raw score and correctness. For example, if **\_isPercentageBased** is set to `true`, a **\_scoreToPass** value of `60` will be treated as `60%`.

>**\_includeInTotalScore** (boolean): Determines if the score from this assessment should be sent to the LMS. The score sent is a percentage according to **\_assessmentWeight.**

>**\_assessmentWeight** (number): If there are multiple assessments in the course, this value controls the proportion of the LMS score which is attributed to this assessment. 1 = 100%.

>**\_isResetOnRevisit** (boolean): Controls whether the assessment should be reset automatically (up to the number of available attempts) when a user revisits the page. Acceptable values are `true` or `false`.

>**\_attempts** (number): Controls the number of attempts available to the user. Any of the following values may be used to indicate an infinite number of attempts: `-1`, `0`, `null`, `undefined`, `"infinite"`. Note: If set to `"infinite"` and used in conjunction with [`_completionCriteria._requireAssessmentCompleted = true`](https://github.com/adaptlearning/adapt-contrib-core/blob/0b0a9a6ee95aef5c54b964a3955285c705d88a5d/schema/config.model.schema#L36-L43) the course will not be considered complete until the assessment is passed.

>**\_allowResetIfPassed** (boolean): Controls whether the assessment may be reset after it has been passed (whilst there are attempts remaining). Acceptable values are `true` or `false`.

>**\_scrollToOnReset** (boolean): Controls whether to scroll to the assessment after reset or to stay at the top of the assessment page. Acceptable values are `true` or `false`.

>**\_banks** (object): If **\_banks** is enabled, its attributes determine which questions from a series of question banks/buckets will be presented to the learner. Contains values for **\_isEnabled**, **\_split**, and **\_randomisation**. (Use either **\_banks** or **\_randomisation**; the value of their **\_isEnabled** attributes must be opposite booleans. If **\_banks** is enabled, blocks must be organized into questions banks by adding the **\_quizBankID** attribute referenced below. You must also have at least two banks; if you only have one bank of questions then the **\_randomisation** functionality is likely to be more appropriate to your needs).

>>**\_isEnabled** (boolean): Turns on or off the ability to use question banks.

>>**\_split** (string): This is a comma-separated list of numbers corresponding to the number of questions to be drawn from each identified block. The *position* of the numeral in the list corresponds to the **\_quizBankID** assigned to a block. The *value* of the number determines how many questions to retrieve randomly from that particular quiz bank. For example, a **\_split** with a value of "2,1" would pick 2 questions from bank 1 (`"_quizBankID": "1"`) and 1 question from bank 2 (`"_quizBankID": "2"`).

>>**\_randomisation** (boolean): Determines whether the questions will be displayed in the same order as the blocks are ordered in *blocks.json* or will be shuffled before they are presented to the learner. Acceptable values are `true` or `false`.

>**\_randomisation** (object): If **\_randomisation** is enabled, its attributes control how many random questions will be presented to the learner. Contains values for **\_isEnabled** and **\_blockCount**. Questions and the order in which they are presented are maintained throughout an attempt, should a learner leave the assessment incomplete and return later. (Use either **\_randomisation** or **\_banks**; the value of their **\_isEnabled** attributes must be opposite booleans.)

>>**\_isEnabled** (boolean): Turns on or off the ability to use **\_randomisation**.

>>**\_blockCount** (number): The number of blocks to present to the learner. (Questions are presented by blocks. If one component occupies a block, it will be presented alone. If multiple components occupy a block, they will always appear together.)

>**\_questions** (object): Contains attributes for overriding question component behaviours. Contains values for **\_resetType**, **\_canShowFeedback**, **\_canShowMarking** and **\_canShowModelAnswer**.

>>**\_resetType** (string): Determines whether the question component will register as completed when reset. When assigned a value of `soft`, the learner may continue to interact with it, but the component's `_isComplete` attribute remains set to `true`. When assigned `hard`, `_isComplete` is set to `false`, and the learner will be forced to complete it again if it is reset. Other plug-ins, such as [Page Level  Progress](https://github.com/adaptlearning/adapt-contrib-pageLevelProgress) and [Trickle](https://github.com/adaptlearning/adapt-contrib-trickle), base their behavior on the value of a component's `_isComplete` attribute. Acceptable values are `hard` or `soft`. For 'soft', when using trickle, please set the trickle Completion Attribute to `_isInteractionComplete'.

>>**\_canShowFeedback** (boolean): Determines whether question components within the assessment will be permitted to show its feedback. Acceptable values are `true` or `false`.

>>**\_canShowMarking** (boolean): Determines whether question components within the assessment will show the marking after the user has answered. Acceptable values are `true` or `false`.

>>**\_canShowModelAnswer** (boolean): Determines whether question components within the assessment will show the [**_showCorrectAnswer** button](https://github.com/adaptlearning/adapt_framework/wiki/Core-Buttons) or not if the user answers incorrectly. Acceptable values are `true` or `false`.

<div float align=right><a href="#top">Back to Top</a></div>

#### *blocks.json*
**\_assessment** (object): The Assessment object that contains a value for **\_quizBankID**.

>**\_quizBankID** (number): Add the **\_quizBankID** attribute to your assessment blocks in order to organize them into question banks/buckets. IDs are coordinated with positions in the **\_split** attribute. Quiz bank IDs are a 1-based index. The first position in the list corresponds to `"_quizBankID": 1`, the second position corresponds to `"_quizBankID": 2`, and so on. A value of '2,1' in **\_split** would pick 2 questions from `"_quizBankID": 1` and one question from `"_quizBankID": 2`.

<div float align=right><a href="#top">Back to Top</a></div>

#### *components.json*

**Numbering randomised questions**

If you need to display sequential question numbers within the component title when the questions are presented in a random order, the variables `{{questionNumber}}` and `{{questionCount}}` can be used within the `displayTitle` & `title` text.

### Events

**assessments:register**
Triggered when an assessment is registered. Occurs between `app:dataReady` and `adapt:initialize` events. Returns `stateObject`, `assessmentModel`

**assessments:reset**
Triggered when an assessment is reset. Returns `stateObject`, `assessmentModel`

**assessment:complete**
Triggered when the user submits the last question of the last assessment and the score is to be posted back to the LMS. Returns `stateObject`

**assessments:complete**
Triggered when the user submits the last question of one of the assessments. Returns `stateObject`, `assessmentModel`

**assessment:restored**
Triggered when all the assessments have been restored from 'offline storage' (typically SCORM or xAPI). Returns `stateObject`
<div float align=right><a href="#top">Back to Top</a></div>

#### stateObject

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
| scoreAsPercent            | int          | Returns the current score of the assessment as a percentage, (maxScore-minScore/score-minScore) * 100 |
| maxScore                  | int          | Returns the maximum attainable score |
| minScore                  | int          | Returns the minimum attainable score |
| correctCount              | int          | Returns the current correctness of the assessment |
| correctAsPercent          | int          | Returns the current correctness of the assessment as a percentage, (questionCount/correctCount) * 100 |
| correctToPass             | int          | Defines the threshold correctness to signify a pass |
| questionCount             | int          | Returns the number of questions in the assessment |
| isPass                    | bool         | Returns a boolean signifying if the assessment is passed |
| includeInTotalScore       | bool         | Signifies that the assessment score will be posted to the LMS |
| assessmentWeight          | int          | Signifies the portion of the total LMS score which is derived from this assessment, (1 = 100%) |
| attempts                  | int          | The total number of attempts specified by the configuration (0 = infinite) |
| attemptsSpent             | int          | The total number of attempts spent by the user |
| attemptsLeft              | int / bool   | The total number of attempts remaining for the user or true if attempts=infinite |
| lastAttemptScoreAsPercent | int          | Returns the last attempt score |
| questions                 | object array | Contains an array of question objects { _id: string, _isCorrect: bool, title: string, displayTitle: string } |
| resetType                 | string       | Returns a string signifying how the questions should be reset, either 'hard' or 'soft'  |
| allowResetIfPassed        | bool         | Returns a boolean signifying if the assessment can be reset after passing |
| questionModels            | object       | Contains a collection of the question models |



A description of the stateObject returned by the `assessment:complete` event is as follows:

| Attribute                 | Type         | Description|
| :-------------------------|:-------------|:-----|
| isComplete                | bool         | Returns a boolean signifying if the assessments are complete |
| isPercentageBased         | bool         | Returns a boolean signifying if the assessments scoreToPass is percentage based |
| isPass                    | bool         | Returns a boolean signifying if the assessments are passed |
| canRetry                  | bool         | Returns a boolean signifying if any assessment is not passed and has attempts left |
| maxScore                  | int          | Returns the maximum attainable score |
| minScore                  | int          | Returns the minimum attainable score |
| score                     | int          | Returns the current score of the assessments |
| scoreToPass               | int          | Defines the threshold score to signify a pass |
| scoreAsPercent            | int          | Returns the current score of the assessments as a percentage, (maxScore-minScore/score-minScore) * 100 |
| correctCount              | int          | Returns the current correctness of the assessments |
| correctAsPercent          | int          | Returns the current correctness of the assessments as a percentage, (questionCount/correctCount) * 100 |
| correctToPass             | int          | Defines the threshold correctness to signify a pass |
| questionCount             | int          | Returns the number of questions in the assessments |
| assessmentsComplete       | int          | Returns the number of complete assessments |
| assessments               | int          | Signifies the number of assessments passed to post back to the LMS |

## Limitations

**Assessment** must be used with [question components](https://github.com/adaptlearning/adapt_framework/wiki/Core-Plug-ins-in-the-Adapt-Learning-Framework#question-components) that extend and implement Adapt's [`questionView`](https://github.com/adaptlearning/adapt_framework/wiki/Developers-guide:-components#question-components). ~~Each block in an assessment article must contain a question, blocks with only presentation components will not be rendered on restore.~~ As of v2.0.9 blocks containing only presentation components can now safely be included in assessments.
If data is required to be passed to a SCORM conformant LMS, the [Spoor](https://github.com/adaptlearning/adapt-contrib-spoor) extension must be enabled. If [question components](https://github.com/adaptlearning/adapt_framework/wiki/Core-Plug-ins-in-the-Adapt-Learning-Framework#question-components) are required to display feedback after attempts, the [Tutor](https://github.com/adaptlearning/adapt-contrib-tutor) extension must be enabled. And if it is appropriate to display performance results to the learner, a separate component such as [Assessment Results](https://github.com/adaptlearning/adapt-contrib-assessmentResults) is required.

----------------------------
<a href="https://community.adaptlearning.org/" target="_blank"><img src="https://github.com/adaptlearning/documentation/blob/master/04_wiki_assets/plug-ins/images/adapt-logo-mrgn-lft.jpg" alt="adapt learning logo" align="right"></a>
**Author / maintainer:** Adapt Core Team with [contributors](https://github.com/adaptlearning/adapt-contrib-assessment/graphs/contributors)
**Accessibility support:** WAI AA
**RTL support:** Yes
**Cross-platform coverage:** Chrome, Chrome for Android, Firefox (ESR + latest version), Edge, IE11, Safari 13+14 for macOS/iOS/iPadOS, Opera
