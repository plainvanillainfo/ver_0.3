const { UseCaseItem, UseCaseList, UseCaseElem } = require('./usecase.cjs');

class TemplateItem {
    constructor(parent, div) {
        this.parent = parent;
        this.div = div;
        this.UseCaseItem = null;
    }

}

class TemplateList {
    constructor(parent) {
        this.UseCaseList = null;
    }

}

class TemplateElem {
    constructor(parent) {
        this.UseCaseElem = null;
    }

}

module.exports = {
    TemplateItem: TemplateItem
}
