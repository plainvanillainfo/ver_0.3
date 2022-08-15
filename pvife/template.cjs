const { UseCaseItem, UseCaseList, UseCaseElem } = require('./usecase.cjs');

class TemplateItem {
    constructor(parent, div) {
        this.parent = parent;
        this.div = div;
        this.UseCaseItem = null;
    }
    
    setUseCase(useCase) {
        this.useCase = useCase;
        console.log("TemplateItem::setUseCase(): ", this.useCase);
        switch (this.useCase.Details.Format) {
            case 'Menu':
                
                break;
            case 'Form':
                break;
            default:
                break;
        }
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
