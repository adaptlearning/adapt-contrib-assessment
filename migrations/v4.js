import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, testStopWhere, testSuccessWhere, getCourse } from 'adapt-migrations';
import _ from 'lodash';

describe('adapt-contrib-assessment - v3.0.0 > v4.3.0', async () => {
  let assessmentArticles;

  whereFromPlugin('adapt-contrib-assessment - from v3.0.0', { name: 'adapt-contrib-assessment', version: '<4.3.0' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    assessmentArticles = content.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    return assessmentArticles.length;
  });

  mutateContent('adapt-contrib-assessment - add assessment._scrollToOnReset', async () => {
    assessmentArticles.forEach(assessment => {
      assessment._assessment._scrollToOnReset = false;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._scrollToOnReset attribute', async () => {
    const isValid = assessmentArticles.every(assessment => assessment._assessment._scrollToOnReset !== undefined);
    if (!isValid) throw new Error('adapt-contrib-assessment - _scrollToOnReset not added to every instance of assessment');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v4.3.0', { name: 'adapt-contrib-assessment', version: '4.3.0', framework: '>=5.4.0' });

  testSuccessWhere('correct version articles with/without assessment', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '4.2.0' }],
    content: [
      { _type: 'article', _id: 'c-100', _assessment: {} },
      { _type: 'article', _id: 'c-105' }
    ]
  });

  testStopWhere('no assessment articles', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '4.2.0' }],
    content: [{ _type: 'article' }]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '4.3.0' }]
  });
});

describe('adapt-contrib-assessment - v4.3.0 > v4.4.0', async () => {
  let course, assessmentConfig, assessmentArticles;

  whereFromPlugin('adapt-contrib-assessment - from v4.3.0', { name: 'adapt-contrib-assessment', version: '<4.4.0' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    course = getCourse();
    assessmentConfig = _.get(course, '_assessment');
    assessmentArticles = content.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    return assessmentConfig || assessmentArticles.length;
  });

  mutateContent('adapt-contrib-assessment - add course._scoreToPass attribute', async () => {
    if (!assessmentConfig) return true;
    assessmentConfig._scoreToPass = 60;
    return true;
  });

  mutateContent('adapt-contrib-assessment - add course._correctToPass attribute', async () => {
    if (!assessmentConfig) return true;
    assessmentConfig._correctToPass = 60;
    return true;
  });

  mutateContent('adapt-contrib-assessment - add assessment._correctToPass attribute', async () => {
    if (!assessmentArticles.length) return true;
    assessmentArticles.forEach(assessment => {
      assessment._assessment._correctToPass = 60;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check course._scoreToPass attribute', async () => {
    if (!assessmentConfig) return true;
    const isValid = assessmentConfig._scoreToPass === 60;
    if (!isValid) throw new Error('adapt-contrib-assessment - _scoreToPass not added to assessment config and set as 60.');
    return true;
  });

  checkContent('adapt-contrib-assessment - check course._correctToPass attribute', async () => {
    if (!assessmentConfig) return true;
    const isValid = assessmentConfig._correctToPass === 60;
    if (!isValid) throw new Error('adapt-contrib-assessment - _correctToPass not added to every instance of assessment and set as 60.');
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._correctToPass attribute', async () => {
    if (!assessmentArticles.length) return true;
    const isValid = assessmentArticles.every(assessment => assessment._assessment._correctToPass === 60);
    if (!isValid) throw new Error('adapt-contrib-assessment - _correctToPass not added to every instance of assessment and set as 60.');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v4.4.0', { name: 'adapt-contrib-assessment', version: '4.4.0', framework: '>=5.4.0' });

  testSuccessWhere('correct version with article assessment', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '4.3.0' }],
    content: [
      { _type: 'article', _id: 'c-100', _assessment: {} },
      { _type: 'article', _id: 'c-105' },
      { _type: 'course' }
    ]
  });

  testSuccessWhere('correct version with course assessment', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '4.3.0' }],
    content: [
      { _type: 'article', _id: 'c-100' },
      { _type: 'article', _id: 'c-105' },
      { _type: 'course', _assessment: {} }
    ]
  });

  testStopWhere('no assessment config or articles', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '4.3.0' }],
    content: [{ _type: 'article' }]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '4.4.0' }]
  });
});
