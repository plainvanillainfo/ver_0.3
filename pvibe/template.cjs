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
            switch (message.Action) {
                case 'ContinueTemplateElem':
                    if (message.TemplateElem != null && message.TemplateElem.UseCaseElemName != null) {
                        if(this.elems[message.TemplateElem.UseCaseElemName] != null) {
                            this.elems[message.TemplateElem.UseCaseElemName].fromClient(message.TemplateElem);
                        } else {
                            let templateElemNew = new TemplateElem(this, this.useCase.elems[message.TemplateElem.UseCaseElemName]);
                            this.elems[message.TemplateElem.UseCaseElemName] = templateElemNew;
                            //templateElemNew.trigger();
                        }
                    }
                    break;
                default:
                    break;
            }
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
    constructor(parent, useCaseElem) {
        this.parent = parent;
        this.useCaseElem = useCaseElem;
        this.track = this.parent.track;
        this.session = this.parent.session;
        //this.model = this.parent.model;
        this.itemParent = parent.item;
        this.toClient = this.toClient.bind(this);
        //this.trigger = this.trigger.bind(this);
    }

    fromClient(message) {
        console.log("TemplateItem::fromClient(): ", message);
    }

    toClient(messageIn) {
        let messageOut = {
            Action: 'ContinueTemplateElem',
            TemplateElem: {
                UseCaseName: this.useCase.Detail.Name,
                ...messageIn
            }
        };
        this.parent.toClient(messageOut);
    }

}

module.exports = {
    TemplateItem: TemplateItem
}
