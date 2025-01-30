import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';

describe('adapt-contrib-assessment - v2.0.0 > v2.0.3', async () => {
  let articles, assessments;

  whereFromPlugin('adapt-contrib-assessment - from v2', { name: 'adapt-contrib-assessment', version: '<=2.0.3' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    articles = content.filter(({ _type }) => _type === 'article');
    assessments = articles.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    if (assessments.length > 0) return true;
  });

  /**
   * * Add JSON field and set attribute.
   */
  mutateContent('adapt-contrib-assessment - add assessment._questions._canShowModelAnswer', async () => {
    assessments.forEach(assessment => {
      assessment._canShowModelAnswer = false;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._questions._canShowModelAnswer attribute', async () => {
    const isValid = assessments.every(assessment =>
      assessment._questions.every(item =>
        item._canShowModelAnswer !== false
      )
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _canShowModelAnswer not added to every instance of assessment._questions');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v2.0.3', { name: 'adapt-contrib-assessment', version: '2.0.3', framework: '>=2' });
});

describe('adapt-contrib-assessment - v2.1.0 > v2.1.1', async () => {
  let articles, assessments;

  whereFromPlugin('adapt-contrib-assessment - from v2.1.0', { name: 'adapt-contrib-assessment', version: '<=2.1.1' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    articles = content.filter(({ _type }) => _type === 'article');
    assessments = articles.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    if (assessments) return true;
  });

  /**
   * * Modify existing attribute to new value.
   */
  mutateContent('adapt-contrib-assessment - add assessment._isPercentageBased', async () => {
    assessments.forEach(assessment => {
      if (assessment._isPercentageBased !== true) assessment._isPercentageBased = true;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._isPercentageBased attribute', async () => {
    const isValid = assessments.every(assessment =>
      assessment._isPercentageBased === true
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _isPercentageBased has been modified to true');
    return true;
  });

  /**
   * * Modify existing attribute to new value.
   */
  mutateContent('adapt-contrib-assessment - add assessment._canShowFeedback', async () => {
    assessments.forEach(assessment => {
      if (assessment._canShowFeedback !== false) assessment._canShowFeedback = false;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._canShowFeedback attribute', async () => {
    const isValid = assessments.every(assessment =>
      assessment._canShowFeedback === false
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _canShowFeedback has been modified to false');
    return true;
  });

  /**
   * * Modify existing attribute to new value.
   */
  mutateContent('adapt-contrib-assessment - add assessment._canShowMarking', async () => {
    assessments.forEach(assessment => {
      if (assessment._canShowMarking !== false) assessment._canShowMarking = false;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._canShowMarking attribute', async () => {
    const isValid = assessments.every(assessment =>
      assessment._canShowMarking === false
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _canShowMarking has been modified to false');
    return true;
  });

  /**
   * * Modify existing attribute to new value.
   */
  mutateContent('adapt-contrib-assessment - add assessment._canShowModelAnswer', async () => {
    assessments.forEach(assessment => {
      if (assessment._canShowModelAnswer !== false) assessment._canShowModelAnswer = false;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._canShowModelAnswer attribute', async () => {
    const isValid = assessments.every(assessment =>
      assessment._canShowModelAnswer === false
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _canShowModelAnswer has been modified to false');
    return true;
  });

  /**
   * * Remove existing attribute.
   */
  mutateContent('adapt-contrib-assessment - add assessment._requireAssessmentPassed', async () => {
    assessments.forEach(assessment => {
      delete assessment._requireAssessmentPassed;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._requireAssessmentPassed attribute', async () => {
    const isValid = assessments.every(assessment =>
      assessment._requireAssessmentPassed === undefined
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _requireAssessmentPassed has been removed');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v2.1.1', { name: 'adapt-contrib-assessment', version: '2.1.1', framework: '>=2' });
});

describe('adapt-contrib-assessment - v2.1.1 > v2.2.0', async () => {
  let articles, assessments;

  whereFromPlugin('adapt-contrib-assessment - from v2.1.1', { name: 'adapt-contrib-assessment', version: '<=2.2.0' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    articles = content.filter(({ _type }) => _type === 'article');
    assessments = articles.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    if (assessments) return true;
  });

  /**
   * * Modify Attribute
   */
  mutateContent('adapt-contrib-assessment - add assessment._includeInTotalScore attribute', async () => {
    assessments.forEach(assessment => {
      assessment._includeInTotalScore = true;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._includeInTotalScore attribute', async () => {
    const isValid = assessments.every(({ _includeInTotalScore }) => _includeInTotalScore === true);
    if (!isValid) throw new Error('adapt-contrib-assessment - _includeInTotalScore not modified to true in every assessment instance.');
    return true;
  });

  /**
   * * Add JSON field and set attribute.
   */
  mutateContent('adapt-contrib-assessment - add assessment._allowResetIfPassed', async () => {
    assessments.forEach(assessment => {
      assessment._allowResetIfPassed = false;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._allowResetIfPassed attribute', async () => {
    const isValid = assessments.every(assessment =>
      assessment._questions.every(item =>
        item._allowResetIfPassed === false
      )
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _allowResetIfPassed not added to every instance of assessment._questions');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v2.2.0', { name: 'adapt-contrib-assessment', version: 'v2.2.0', framework: '>=2' });
});
