import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('adapt-contrib-assessment - v4.4.0 > v5.2.0', async () => {
  let assessmentArticles;

  whereFromPlugin('adapt-contrib-assessment - from v4.4.0', { name: 'adapt-contrib-assessment', version: '<5.2.0' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    assessmentArticles = content.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    return assessmentArticles.length;
  });

  mutateContent('adapt-contrib-assessment - add assessment._questions._resetIncorrectOnly attribute', async () => {
    assessmentArticles.forEach(assessment => {
      _.set(assessment, '_assessment._questions._resetIncorrectOnly', true);
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._assessment._questions._resetIncorrectOnly attribute', async () => {
    const isValid = assessmentArticles.every(assessment => _.has(assessment, '_assessment._questions._resetIncorrectOnly'));
    if (!isValid) throw new Error('adapt-contrib-assessment - _resetIncorrectOnly not added to every instance of _assessment._questions');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v5.2.0', { name: 'adapt-contrib-assessment', version: '5.2.0', framework: '>=5.19.1' });

  testSuccessWhere('correct version with/without article assessment', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '5.1.0' }],
    content: [
      { _type: 'article', _id: 'c-100', _assessment: {} },
      { _type: 'article', _id: 'c-105' }
    ]
  });

  testStopWhere('no assessment config or articles', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '5.1.0' }],
    content: [{ _type: 'article' }]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '5.2.0' }]
  });
});

describe('adapt-contrib-assessment - v5.4.1 > @@RELEASE_VERSION', async () => {
  let assessmentArticles;

  whereFromPlugin('adapt-contrib-assessment - from v5.4.1', { name: 'adapt-contrib-assessment', version: '<@@RELEASE_VERSION' });

  whereContent('adapt-contrib-assessment - where assessment', async content => {
    assessmentArticles = content.filter(({ _type, _assessment }) => _type === 'article' && _assessment !== undefined);
    return assessmentArticles.length;
  });

  mutateContent('adapt-contrib-assessment - add assessment._questions._allowComponentOverrides attribute', async () => {
    assessmentArticles.forEach(assessment => {
      _.set(assessment, '_assessment._questions._allowComponentOverrides', false);
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._questions._allowComponentOverrides attribute', async () => {
    const isValid = assessmentArticles.every(assessment => _.has(assessment, '_assessment._questions._allowComponentOverrides'));
    if (!isValid) throw new Error('adapt-contrib-assessment - _allowComponentOverrides not added to every instance of _assessment._questions');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to @@RELEASE_VERSION', { name: 'adapt-contrib-assessment', version: '@@RELEASE_VERSION', framework: '>=5.19.1' });

  testSuccessWhere('correct version with/without article assessment', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '5.4.1' }],
    content: [
      { _type: 'article', _id: 'c-100', _assessment: {} },
      { _type: 'article', _id: 'c-105' }
    ]
  });

  testStopWhere('no assessment config or articles', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '5.4.1' }],
    content: [{ _type: 'article' }]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-assessment', version: '@@RELEASE_VERSION' }]
  });
});
