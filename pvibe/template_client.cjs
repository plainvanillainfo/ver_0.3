class TemplateItemClient {
    constructor(parent, useCase) {
        this.parent = parent;
        this.useCase = useCase;
        this.elems = {};
        this.toServer = this.toServer.bind(this);
    }

    fromServer(message) {
        console.log("TemplateItemClient::fromServer(): ", message);
        if (message.Action != null) {
            switch (message.Action) {
                case 'ContinueTemplateElem':
                    if (message.TemplateElem != null && message.TemplateElem.UseCaseElemName != null) {
                        if (this.elems[message.TemplateElem.UseCaseElemName] != null) {
                            this.elems[message.TemplateElem.UseCaseElemName].fromServer(message.TemplateElem);
                        }
                    }
                    break;
                default:
                    break;
            }
        }
        if (message.Item != null) {
            this.item = message.Item;
            switch (this.useCase.Detail.Format) {
                case 'Menu':
                    this.setUseCaseMenu();
                    break;
                case 'Form':
                    this.setUseCaseForm();
                    break;
                default:
                    break;
            }
        }
    }

    toServer(messageIn) {
        let messageOut = {
            Action: 'ContinueTemplateItem',
            TemplateItem: {
                UseCaseName: this.useCase.Detail.Name,
                ItemKey: this.itemKey,
                ...messageIn
            }
        };
        this.parent.toServer(messageOut);
    }

	setDataItems(dataItems) {
		this.dataItems = dataItems;
        console.log("TemplateItemClient::setDataItems(): ", this.dataItems);
        this.renderDataItems();
	}

}

class TemplateElemClient {
    constructor(parent, dataItemParent, dataElem, useCaseElem) {
        this.parent = parent;
        this.dataItemParent = dataItemParent;
        this.useCaseElem = useCaseElem;
        this.dataElem = dataElem;
        this.toServer = this.toServer.bind(this);
    }

    fromServer(message) {
        console.log("TemplateElemClient::fromServer(): ", message);
        if (message.Action != null) {
            switch (message.Action) {
                case 'ContinueTemplateList':
                    if (this.templateList != null && message.TemplateList != null) {
                        this.templateList.fromServer(message.TemplateList);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    toServer(messageIn) {
        let messageOut = {
            Action: 'ContinueTemplateElem',
            TemplateElem: {
				ItemKey: this.dataItemParent.Key,
                UseCaseElemName: this.useCaseElem.Name,
                ...messageIn
            }
        };
        this.parent.toServer(messageOut);
    }

}

module.exports = {
    TemplateItemClient: TemplateItemClient,
    TemplateElemClient: TemplateElemClient
}
