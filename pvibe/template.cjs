const { UseCaseItem, UseCaseList, UseCaseElem } = require('./usecase.cjs');

class TemplateItem {
    constructor(parent) {
        this.parent = parent;
        this.track = this.parent.track;
        this.elems = {};
        this.key = null;
        this.toClient = this.toClient.bind(this);
    }

    destroy() {
    }

    fromClient(message) {
        console.log("TemplateItem::fromClient(): ", message);
        if (message.Action != null) {
        }
    }

    toClient(messageIn) {
        let messageOut = {
            Action: 'ContinueTemplateItem',
            TemplateItem: {
                UseCaseName: this.useCase.Detail.Name,
                ItemId: this.key,
                ...messageIn
            }
        };
        this.parent.toClient(messageOut);
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
