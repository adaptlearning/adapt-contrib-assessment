import Adapt from 'core/js/adapt';

class QuestionBank {

  constructor(quizBankid, articleId, numQuestionBlocks, uniqueQuestions) {
    this._id = quizBankid;
    this._articleId = articleId;
    this._numQuestionBlocks = numQuestionBlocks;
    this._uniqueQuestions = uniqueQuestions;
    this.questionBlocks = [];
    this.unUsedQuestionBlocks = undefined;
    this.usedQuestionBlocks = [];
  }

  getID() {
    return this._id;
  }

  addBlock(block) {
    this.questionBlocks.push(block);
  }

  getRandomQuestionBlocks() {
    this.checkResetUnunsedBlocks();

    const questionBlocks = [];
    const usedQuestionBlocks = this.usedQuestionBlocks.slice(0);

    for (let i = 0; i < this._numQuestionBlocks; i++) {
      let question = this.getRandomQuestion();
      if (question !== undefined) {
        questionBlocks.push(question);
        continue;
      }
      if (usedQuestionBlocks.length === 0) break;
      const index = Math.floor(Math.random() * (usedQuestionBlocks.length - 1));
      question = usedQuestionBlocks.splice(index, 1)[0];
      questionBlocks.push(question);
    }

    return questionBlocks;
  }

  checkResetUnunsedBlocks() {
    if (this.unUsedQuestionBlocks !== undefined && this._uniqueQuestions) return;

    this.unUsedQuestionBlocks = this.questionBlocks.slice(0);
  }

  getRandomQuestion() {
    if (this.unUsedQuestionBlocks !== undefined && this.unUsedQuestionBlocks.length < 1) {
      Adapt.log.warn('assessment:' + this._articleId + ' No more unique questions for _assessment._quizBankID ' + this._id);
      return undefined;
    }

    const index = Math.round(Math.random() * (this.unUsedQuestionBlocks.length - 1));
    const questionBlock = this.unUsedQuestionBlocks[index];
    this.usedQuestionBlocks.push(questionBlock);

    this.unUsedQuestionBlocks.splice(index, 1);

    return questionBlock;
  }
}

export default QuestionBank;
