import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';
import _ from 'lodash';

describe('adapt-contrib-assessment - v2.2.0 > v3.0.0', async () => {
  let course, assessmentConfig;

  whereFromPlugin('adapt-contrib-assessment - from v2.2.0', { name: 'adapt-contrib-assessment', version: '<3.0.0' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    course = content.filter(({ _type }) => _type === 'course');
    assessmentConfig = course.find(({ _assessment }) => _assessment);
    if (!assessmentConfig) throw new Error('No assessment configuration found.');
    return true;
  });

  mutateContent('adapt-contrib-assessment - add assessment._allowResetIfPassed', async () => {
    if (assessmentConfig) {
      delete assessmentConfig._postTotalScoreToLms;
    }
    return true;
  });

  checkContent('adapt-contrib-assessment - check course._postTotalScoreToLms attribute', async () => {
    const isValid = !_.has(assessmentConfig, '_postTotalScoreToLms');
    if (!isValid) throw new Error('adapt-contrib-assessment - _postTotalScoreToLms attribute was not removed from course file.');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v3.0.0', { name: 'adapt-contrib-assessment', version: '3.0.0', framework: '>=3.2.0' });
});
