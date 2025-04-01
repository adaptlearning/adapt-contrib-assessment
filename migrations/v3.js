import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, getCourse, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('adapt-contrib-assessment - v2.2.0 > v3.0.0', async () => {
  let course, assessmentConfig;

  whereFromPlugin('adapt-contrib-assessment - from v2.2.0', { name: 'adapt-contrib-assessment', version: '<3.0.0' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    course = getCourse();
    assessmentConfig = _.get(course, '_assessment');
    return assessmentConfig;
  });

  mutateContent('adapt-contrib-assessment - remove course._postTotalScoreToLms', async () => {
    delete assessmentConfig._postTotalScoreToLms;
    return true;
  });

  checkContent('adapt-contrib-assessment - check course._postTotalScoreToLms attribute', async () => {
    const isValid = !_.has(assessmentConfig, '_postTotalScoreToLms');
    if (!isValid) throw new Error('adapt-contrib-assessment - _postTotalScoreToLms attribute was not removed from course file.');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v3.0.0', { name: 'adapt-contrib-assessment', version: '3.0.0', framework: '>=3.2.0' });

  testSuccessWhere('correct version with assessment config', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '2.2.0' }],
    content: [
      { _type: 'article', _id: 'c-100', _assessment: {} },
      { _type: 'article', _id: 'c-105' },
      { _type: 'course', _assessment: { _postTotalScoreToLms: true } }
    ]
  });

  testSuccessWhere('correct version with empty assessment config', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '2.2.0' }],
    content: [
      { _type: 'article', _id: 'c-100', _assessment: {} },
      { _type: 'article', _id: 'c-105' },
      { _type: 'course', _assessment: {} }
    ]
  });

  testStopWhere('no assessment config', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '2.2.0' }],
    content: [{ _type: 'article' }]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '3.0.0' }]
  });
});
