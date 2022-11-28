const { TemplateItemClient } = require('../pvibe/template_client.cjs');

class TemplateItem extends TemplateItemClient{
    constructor(parent, divTarget) {
        super(parent);
        this.divTarget = divTarget;
    }

    
    show() {
        this.divTarget.appendChild(document.createTextNode(JSON.stringify(this.useCase)));
    }
    
    hide() {
        let child = this.divTarget.lastChild;
        while (child) {
            this.divTarget.removeChild(child);
            child = this.divTarget.lastChild;
        }
    }
    
    setUseCase(useCase) {
        this.useCase = useCase;
        console.log("TemplateItem::setUseCase(): ", this.useCase);
    }

}

module.exports = {
    TemplateItem: TemplateItem
}
