import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';
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
      assessment._assessment._questions._resetIncorrectOnly = true;
    });
    return true;
  });

  checkContent('adapt-contrib-assessment - check assessment._assessment._questions._resetIncorrectOnly attribute', async () => {
    const isValid = assessmentArticles.every(assessment => assessment._assessment._questions._resetIncorrectOnly !== undefined);
    if (!isValid) throw new Error('adapt-contrib-assessment - _resetIncorrectOnly not added to every instance of _assessment._questions');
    return true;
  });

  updatePlugin('adapt-contrib-assessment - update to v5.2.0', { name: 'adapt-contrib-assessment', version: '5.2.0', framework: '>=5.19.1' });
});
