class TemplateItemClient {
    constructor(parent, useCase) {
        console.log("TemplateItemClient::constructor");
        this.parent = parent;
        this.session = this.parent.session;
        this.useCase = useCase;
        this.elemDataItems = {};
        this.toServer = this.toServer.bind(this);
    }

    fromServer(message) {
        console.log("TemplateItemClient::fromServer(): ", message);
        if (message.Action != null) {
            switch (message.Action) {
                case 'ContinueTemplateElem':
                    if (message.TemplateElem != null) {
                        this.continueTemplateElem(message.TemplateElem);
                    }
                    break;
                case 'ContinueTemplateItem':
                    if (message.TemplateItem != null) {
                        this.continueTemplateItem(message.TemplateItem);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    toServer(messageIn) {
        console.log("TemplateItemClient::toServer");
        let messageOut = {
            Action: 'ContinueTemplateItem',
            ItemKey: messageIn.TemplateItem!= null && messageIn.TemplateItem.TemplateElem != null && messageIn.TemplateItem.TemplateElem.ItemKey != null ?
                messageIn.TemplateItem.TemplateElem.ItemKey : null,
            TemplateItem: {
                UseCaseName: this.useCase.Detail.Name,
                ...messageIn
            }
        };
        this.parent.toServer(messageOut);
    }

    setDataItems(dataItems) {
        this.dataItems = dataItems;
        console.log("TemplateItemClient::setDataItems(): ", this.dataItems);
        switch (this.useCase.Detail.Cardinality) {
            case 'Single':
                if (this.dataItems.length === 1) {
                    if (this.useCase.Detail.Flow === 'Serial' && this.dataItems[0].Elems == null) {
                        this.toServer({
                            Action: 'Start'
                        });
                    } else {
                        this.renderSingleDataItem();
                    }
                }
                break;
            case 'Multiple':
                this.renderMultipleDataItems();
                break;
            default:
                break;
        }
    }

}

class TemplateElemClient {
    constructor(parent, dataItemParent, dataElem, useCaseElem) {
        console.log("TemplateElemClient::constructor");
        this.parent = parent;
        this.session = this.parent.session;
        this.dataItemParent = dataItemParent;
        this.useCaseElem = useCaseElem;
        this.dataElem = dataElem;
        this.toServer = this.toServer.bind(this);
    }

    fromServer(message) {
        console.log("TemplateElemClient::fromServer(): ", message);
        if (message.Action != null) {
            switch (message.Action) {
                case 'StartTemplateItem':
                    if (message.TemplateItem != null) {
                        this.startTemplateItem(message.TemplateItem);
                    }
                    break;
                case 'ContinueTemplateItem':
                    if (message.TemplateItem != null) {
                        this.continueTemplateItem(message.TemplateItem);
                    }
                    break;
                case 'ContinueTemplateElem':
                    if (message.TemplateElem != null) {
                        this.continueTemplateElem(message.TemplateElem);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    toServer(messageIn) {
        console.log("TemplateElemClient::toServer");
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
