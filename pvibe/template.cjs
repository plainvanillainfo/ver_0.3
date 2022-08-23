const { UseCaseItem, UseCaseList, UseCaseElem } = require('./usecase.cjs');

class TemplateItem {
    constructor(parent, useCase) {
        this.parent = parent;
        this.useCase = useCase;
        this.track = this.parent.track;
        this.session = this.parent.session;
        this.elems = {};
        this.key = null;
        this.dbPath = [...this.parent.dbPath];
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
    }

    destroy() {
    }

    fromClient(message) {
        console.log("TemplateItem::fromClient(): ", message); //, "\nthis.useCase: ", this.useCase);
        if (message.Action != null) {
            switch (message.Action) {
                case 'ContinueTemplateElem':
                    if (message.TemplateElem != null && message.TemplateElem.UseCaseElemName != null) {
                        if(this.elems[message.TemplateElem.UseCaseElemName] == null) {
                            let useCaseElemFound = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === message.TemplateElem.UseCaseElemName);
                            if (useCaseElemFound != null) {
                                let templateElemNew = new TemplateElem(this, useCaseElemFound);
                                this.elems[message.TemplateElem.UseCaseElemName] = templateElemNew;
                            }
                        }
                        if (this.elems[message.TemplateElem.UseCaseElemName] != null) {
                            this.elems[message.TemplateElem.UseCaseElemName].fromClient(message.TemplateElem);
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
                ItemKey: this.key,
                ...messageIn
            }
        };
        this.parent.toClient(messageOut);
    }

    setUseCase(useCase) {
        console.log("TemplateItem::setUseCase: ");
        this.useCase = useCase;
    }

    /*
    setItem(item) {
        console.log("TemplateItem::setItem: ", item);
        this.item = item;
        this.dbPath.push(this.item.id);
    }
    */

    /*
    pushOutData() {
        console.log("TemplateItem::pushOutData - item.dbId, id: "); //, this.session.id, this.item.dbId, this.item.id);
        let messageOut = {
            Action: 'ContinueTemplateItemSub',
            TemplateItem: {
                Action: 'AcceptData',
                Item: {
                    
                    Id: this.item.id,
                    Ext: this.item.ext,
                    Attrs: this.item.attrs,
                    ChildItems: {}
                    
                }
            }
        };
        this.parent.toClient(messageOut);
    }
    */

    async requestViewFromDB(filter) {
        await this.session.database.getView(this.useCase.RetrieveView, filter, this.sendViewResultToClient);
    }

    async sendViewResultToClient(result) {
        console.log(result);
        if (result.length === 1) {
            let keyName = Object.keys(result[0])[0];
            this.item = {
                Key: result[0][keyName],
                Attrs: result[0]
            };
            this.dbPath.push(this.item.Key);
        }
        this.toClient({Item: this.item});
    }

}

class TemplateList {
    constructor(parent, useCase) {
        this.parent = parent;
        this.useCase = useCase;
        this.track = this.parent.track;
        this.session = this.parent.session;
        this.childItemList = [];
        this.childItemTemplates = {};
        this.dbPath = [...this.parent.dbPath];
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
        this.sendViewResultToClient = this.sendViewResultToClient.bind(this);
        this.requestViewFromDB('1=1');
    }

    fromClient(message) {
        console.log("TemplateList::fromClient(): ", message);
        if (message.Action != null) {
            switch (message.Action) {
                case 'StartTemplateItem':
                    if (message.TemplateItem != null && message.TemplateItem.ItemKey != null) {
                        this.childItemTemplates[message.TemplateItem.ItemKey] = new TemplateItem(this, this.useCase.Detail.UpdateUseCase);
                        console.log("TemplateList::fromClient() - this.useCase.Detail: ", this.useCase.Detail);
                        if (this.session.entitlement.UseCases[this.useCase.Detail.UpdateUseCase] != null) {
                            this.childItemTemplates[message.TemplateItem.ItemKey].setUseCase(this.session.entitlement.UseCases[this.useCase.Detail.UpdateUseCase]);
                        }
                        this.childItemTemplates[message.TemplateItem.ItemKey].requestViewFromDB('"Id" = ' +message.TemplateItem.ItemKey);
                    }
                    break;
                case 'ContinueTemplateItem':
                    if (message.TemplateItem != null && message.TemplateItem.ItemKey != null) {
                        if (this.childItemTemplates[message.TemplateItem.ItemKey] != null) {
                            this.childItemTemplates[message.TemplateItem.ItemKey].fromClient(message.Template);
                        }
                    }
                    break;
                case 'UpdateItem':
                    if (message.TemplateItem != null && message.TemplateItem.ItemData != null) {
                        let itemKey = null;
                        if (message.TemplateItem.ItemData.Id == null) {
                            if (this.useCase.spec.SubUseCase != null) {
                                let useCaseSub = this.model.useCases[this.useCase.spec.SubUseCase];
                                console.log("TemplateListServer::fromClient() - useCaseSub.spec: ", useCaseSub.spec);
                                if (useCaseSub.spec.AutoKey != null && useCaseSub.spec.AutoKey == 'Number') {
                                    let itemKeyNew = 0;
                                    if (this.childItemList != null && this.childItemList.ListItems != null) {
                                        this.childItemList.ListItems.forEach(listItemCur => {
                                            let parsedId = parseInt(listItemCur.id);
                                            if (isNaN(parsedId) == false) {
                                                if (parsedId > itemKeyNew) {
                                                    itemKeyNew = parsedId;
                                                }
                                            }
                                        });
                                    }
                                    itemKeyNew++;
                                    itemKey = itemKeyNew.toString();
                                    message.TemplateItem.ItemData.Id = itemKey;
                                }
                            }
                        } else {
                            itemKey = message.TemplateItem.ItemData.Id;
                        }
                        if (itemKey != null) {
                            let itemLocal = {
                                ChildItems: {},
                                Attrs: {},
                                Ext: ''
                            };
                            itemLocal.ChildItems[this.parent.useCaseElem.spec.Path.Attribute] = [message.Template.ItemData];
                            this.model.putItem(this.itemParent, itemLocal);
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
            Action: 'ContinueTemplateList',
            TemplateList: {
                UseCaseName: this.useCase.Detail.Name,
                ...messageIn
            }
        };
        this.parent.toClient(messageOut);
    }

    async requestViewFromDB(filter) {
        await this.session.database.getView(this.useCase.Detail.View, filter, this.sendViewResultToClient);
    }

    async sendViewResultToClient(result) {
        console.log(result);
        this.childItemList = [];
        if (result.length > 0) {
            let keyName = Object.keys(result[0])[0];
            result.forEach(resultCur => {
                this.childItemList.push({
                    Key: resultCur[keyName],
                    Attrs: resultCur
                });
            });
        }
        this.toClient({Items: this.childItemList});
    }

}

class TemplateElem {
    constructor(parent, useCaseElem) {
        this.parent = parent;
        this.useCaseElem = useCaseElem;
        this.track = this.parent.track;
        this.session = this.parent.session;
        this.itemParent = parent.item;
        this.dbPath = [...this.parent.dbPath, this.useCaseElem.Name];
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
    }

    fromClient(message) {
        console.log("TemplateElem::fromClient(): ", message, "\nthis.useCaseElem: ", this.useCaseElem);
        if (this.useCaseElem.Format != null) {
            switch (this.useCaseElem.Format) {
                case 'MenuOption':
                    if (this.useCaseElem.SubUseCase != null) {
                        let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.useCaseElem.SubUseCase);
                        if (useCaseFound != null) {
                            console.log("TemplateElem::fromClient() - useCaseFound: ", useCaseFound);
                            switch (useCaseFound.Detail.Format) {
                                case 'List':
                                    if (this.templateList == null) {
                                        this.templateList = new TemplateList(this, useCaseFound);
                                    } else {
                                        if (message.TemplateList != null) {
                                            this.templateList.fromClient(message.TemplateList);
                                        }
                                    }
                                    break;
                                default:
                                    break;
                            }
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
            Action: 'ContinueTemplateElem',
            TemplateElem: {
                UseCaseElemName: this.useCaseElem.Name,
                ...messageIn
            }
        };
        this.parent.toClient(messageOut);
    }
}

module.exports = {
    TemplateItem: TemplateItem
}


/*

{
  "Name": "Communities",
  "Label": "Communities",
  "Format": "List",
  "View": "Communities",
  "Elems": [
    {
      "Name": "Id",
      "Label": "Id"
    },
    {
      "Name": "Name",
      "Label": "Name"
    },
    {
      "Name": "MgmtCompanyId",
      "Label": "Management Company"
    },
    {
      "Name": "Abbreviation",
      "Label": "Abbreviation"
    },
    {
      "Name": "Location",
      "Label": "Location"
    }
  ]
}

 SELECT "Community"."Id",
    "Community"."Name",
    "Community"."MgmtCompanyId",
    "Community"."Abbreviation",
    "Community"."Location"
   FROM "Community";
*/