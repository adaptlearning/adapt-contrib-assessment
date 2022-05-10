import data from 'core/js/data';

class QuestionBank {

  constructor(quizBankId, articleId) {
    this._bankId = quizBankId;
    this._articleId = articleId;
    this._unusedQuestionBlocks = null;
    this._count = null;
  }

  calculateAvailableQuestionBlocks(count) {
    this._count = parseInt(count);
    const articleModel = data.findById(this._articleId);
    const children = articleModel.getAvailableChildModels();
    this._availableQuestionBlocks = children.map(blockModel => {
      if (blockModel.get('_assessment')?._quizBankID !== this._bankId) return null;
      return blockModel;
    }).filter(Boolean);
    const availableQuestionBlockIds = this._availableQuestionBlocks?.map(block => block.get('_id')) || [];
    const unusedQuestionBlockIds = this._unusedQuestionBlocks?.map(block => block.get('_id')) || [];
    const haveBlocksChanged = Boolean(_.difference(unusedQuestionBlockIds, availableQuestionBlockIds).length);
    if (!haveBlocksChanged) return;
    // Reset the unused question blocks if there are unused blocks which aren't available blocks
    this._unusedQuestionBlocks = null;
  }

  getRandomQuestionBlocks() {
    const questionBlocks = [];
    let i = 0;
    while (i++ < this._count) {
      const nextBlock = this.unusedQuestionBlocks.shift();
      questionBlocks.push(nextBlock);
    }
    return questionBlocks;
  }

  get unusedQuestionBlocks() {
    const hasUnusedQuestion = Boolean(this._unusedQuestionBlocks?.length);
    if (!hasUnusedQuestion) {
      // Start again with all questions blocks, shuffled
      this._unusedQuestionBlocks = _.shuffle(this._availableQuestionBlocks.slice(0));
    }
    return this._unusedQuestionBlocks;
  }

}

export default QuestionBank;
