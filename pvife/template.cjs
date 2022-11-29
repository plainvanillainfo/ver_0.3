const { TemplateItemClient } = require('../pvibe/template_client.cjs');

class TemplateItem extends TemplateItemClient{
    constructor(parent, divTarget) {
        super(parent);
        this.divTarget = divTarget;
    }

    renderUseCase() {
        console.log("TemplateItem::renderUseCase()");

    }
    
    renderDataItems() {
        console.log("TemplateItem::renderDataItems()");
    }

}

module.exports = {
    TemplateItem: TemplateItem
}
