const { TemplateItemClient } = require('../pvibe/template_client.cjs');

class TemplateItem extends TemplateItemClient{
    constructor(parent, divTarget) {
        super(parent);
        this.divTarget = divTarget;
    }

    setUseCase(useCase) {
        super.setUseCase(useCase);
        console.log("TemplateItem::setUseCase()");
        
    }

    setDataItems(dataItems) {
        super.setDataItems(dataItems);
        console.log("TemplateItem::setDataItems()");
        switch (this.useCase.Detail.Rendering.Format) {
			case 'Menu':
			
				break;
			default:
				break;
		}
    }

}

module.exports = {
    TemplateItem: TemplateItem
}
