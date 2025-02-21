import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';

describe('adapt-contrib-assessment - v2.0.0 > v2.0.3', async () => {
  let articles, assessments;

  whereFromPlugin('adapt-contrib-assessment - from v2.0.0', { name: 'adapt-contrib-assessment', version: '>=2.0.0 <2.0.3' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    articles = content.filter(({ _type }) => _type === 'article');
    assessments = articles.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    return assessments.length;
  });

  mutateContent('adapt-contrib-assessment - add assessment._questions._canShowModelAnswer attribute', async () => {
    assessments.forEach(assessment => {
      assessment._questions.forEach(item => {
        item._canShowModelAnswer = true;
      });
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._questions._canShowModelAnswer attribute', async () => {
    const isValid = assessments.every(assessment => _.has(assessment, '_assessment._questions._canShowModelAnswer'));
    if (!isValid) throw new Error('adapt-contrib-assessment - _canShowModelAnswer not added to every instance of assessment._questions');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v2.0.3', { name: 'adapt-contrib-assessment', version: '2.0.3', framework: '>=2.0.0' });
});

describe('adapt-contrib-assessment - v2.0.3 > v2.1.0', async () => {
  let articles, assessments;

  whereFromPlugin('adapt-contrib-assessment - from v2.0.3', { name: 'adapt-contrib-assessment', version: '<2.1.0' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    articles = content.filter(({ _type }) => _type === 'article');
    assessments = articles.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    return assessments.length;
  });

  mutateContent('adapt-contrib-assessment - add assessment._suppressMarking', async () => {
    assessments.forEach(assessment => {
      assessment._assessment._suppressMarking = true;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._suppressMarking attribute', async () => {
    const isValid = assessments.every(assessment =>
      assessment._assessment._suppressMarking === true
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _suppressMarking not added to every instance of assessment as true.');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v2.1.0', { name: 'adapt-contrib-assessment', version: '2.1.0', framework: '>=2.1.3' });
});

describe('adapt-contrib-assessment - v2.1.0 > v2.1.1', async () => {
  let articles, assessments;

  whereFromPlugin('adapt-contrib-assessment - from v2.1.0', { name: 'adapt-contrib-assessment', version: '<2.1.1' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    articles = content.filter(({ _type }) => _type === 'article');
    assessments = articles.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    if (assessments) return true;
  });

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

  mutateContent('adapt-contrib-assessment - add assessment._requireAssessmentPassed', async () => {
    assessments.forEach(assessment => {
      delete assessment._requireAssessmentPassed;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._requireAssessmentPassed attribute', async () => {
    const isValid = assessments.every(assessment => !_.has(assessment, '_requireAssessmentPassed'));
    if (!isValid) throw new Error('adapt-contrib-assessment - _requireAssessmentPassed has been removed');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v2.1.1', { name: 'adapt-contrib-assessment', version: '2.1.1', framework: '>=2.2.0' });
});

describe('adapt-contrib-assessment - v2.1.1 > v2.2.0', async () => {
  let articles, assessments;

  whereFromPlugin('adapt-contrib-assessment - from v2.1.1', { name: 'adapt-contrib-assessment', version: '<2.2.0' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    articles = content.filter(({ _type }) => _type === 'article');
    assessments = articles.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    if (assessments) return true;
  });

  mutateContent('adapt-contrib-assessment - add assessment._allowResetIfPassed', async () => {
    assessments.forEach(assessment => {
      assessment._assessment_questions._allowResetIfPassed = false;
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

  updatePlugin('adapt-contrib-assessment - update to v2.2.0', { name: 'adapt-contrib-assessment', version: 'v2.2.0', framework: '>=2.2.0' });
});
