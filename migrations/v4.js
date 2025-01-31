import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';

describe('adapt-contrib-assessment - v3.0.0 > v4.3.0', async () => {
  let articles, assessments;

  whereFromPlugin('adapt-contrib-assessment - from v3.0.0', { name: 'adapt-contrib-assessment', version: '<=4.3.0' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    articles = content.filter(({ _type }) => _type === 'article');
    assessments = articles.filter(({ _assessment }) => _assessment !== undefined);
    if (assessments.length > 0) return true;
  });

  /**
   * * Add JSON field and set attribute.
   */
  mutateContent('adapt-contrib-assessment - add assessment._scrollToOnReset', async () => {
    assessments.forEach(assessment => {
      assessment._scrollToOnReset = false;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._scrollToOnReset attribute', async () => {
    const isValid = assessments.every(assessment =>
      assessment._scrollToOnReset === false
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _scrollToOnReset not added to every instance of assessment');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v4.3.0', { name: 'adapt-contrib-assessment', version: '4.3.0', framework: '>=5.4.0' });
});

describe('adapt-contrib-assessment - v4.3.0 > v4.4.0', async () => {
  let course, assessmentConfig, assessments;

  whereFromPlugin('adapt-contrib-assessment - from v4.3.0', { name: 'adapt-contrib-assessment', version: '<=4.4.0' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    course = content.filter(({ _type }) => _type === 'course');
    assessmentConfig = course.find(({ _assessment }) => _assessment);
    if (assessmentConfig) return true;
  });

  /**
   * * Add JSON field and set attribute.
   */
  mutateContent('adapt-contrib-assessment - add assessment._scoreToPass', async () => {
    assessments.forEach(assessment => {
      assessment._scoreToPass = 60;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._scoreToPass attribute', async () => {
    const isValid = assessments.every(assessment =>
      assessment._scoreToPass === 60
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _scoreToPass not added to every instance of assessment and set as 60.');
    return true;
  });

  /**
   * * Add JSON field and set attribute.
   */
  mutateContent('adapt-contrib-assessment - add assessment._correctToPass', async () => {
    assessments.forEach(assessment => {
      assessment._correctToPass = 60;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._correctToPass attribute', async () => {
    const isValid = assessments.every(assessment =>
      assessment._correctToPass === 60
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _correctToPass not added to every instance of assessment and set as 60.');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v4.4.0', { name: 'adapt-contrib-assessment', version: '4.4.0', framework: '>=5.4.0' });
});

describe('adapt-contrib-assessment - v4.4.0 > v4.6.1', async () => {
  let articles, assessments;

  whereFromPlugin('adapt-contrib-assessment - from v4.4.0', { name: 'adapt-contrib-assessment', version: '<=4.6.1' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    articles = content.filter(({ _type }) => _type === 'article');
    assessments = articles.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    if (assessments.length > 0) return true;
  });

  /**
   * * Add JSON field and set attribute.
   */
  mutateContent('adapt-contrib-assessment - modify assessment._questions._resetType value', async () => {
    /**
     * ? Changing _resetType globally to 'hard' might have unintended consequences.
     * ? This change assumes that a hard reset is preferred in all cases, which may not be true for all users.
     */
    assessments.forEach(assessment => {
      assessment._questions.forEach(item => {
        item._resetType = 'hard';
      });
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._questions._resetType value', async () => {
    const isValid = assessments.every(assessment =>
      assessment._questions.every(item =>
        item._resetType === 'hard'
      )
    );
    if (!isValid) throw new Error('adapt-contrib-assessment - _resetType not set to "hard" for every instance of assessment._questions');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v4.6.1', { name: 'adapt-contrib-assessment', version: 'v4.6.1', framework: '>=5.11.0' });
});
