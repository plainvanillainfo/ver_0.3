const jsesc = require("jsesc");

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
        this.sendViewResultToClient = this.sendViewResultToClient.bind(this);
    }

    destroy() {
    }

    fromClient(message) {
        console.log("TemplateItem::fromClient(): ", message);
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
                ...messageIn
            }
        };
        this.parent.toClient(messageOut);
    }

    async requestViewFromDB(filter) {
        await this.session.database.getView(this.useCase.Detail.RetrieveView, filter, this.sendViewResultToClient);
    }

    async sendViewResultToClient(result) {
        if (result.length === 1) {
            this.keyName = Object.keys(result[0])[0];
            this.item = {
                Key: result[0][this.keyName],
                Attrs: result[0]
            };
            this.dbPath.push(this.item.Key);
        }
        this.toClient({Item: this.item});
    }

    async requestUpdateToDB(filter, data) {
        await this.session.database.putData(this.useCase.Detail.UpdateView, filter, data, this.sendViewResultToClient);
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
    }

    fromClient(message) {
        console.log("TemplateList::fromClient(): ", message);
        if (message.Action != null) {
            switch (message.Action) {
                case 'StartTemplateItem':
                    if (message.TemplateItem != null && message.TemplateItem.ItemKey != null && this.keyName != null) {
                        let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.useCase.Detail.UpdateUseCase);
                        this.childItemTemplates[message.TemplateItem.ItemKey] = new TemplateItem(this, useCaseFound);
                        let filter = '"' + this.keyName + "\" = '" + message.TemplateItem.ItemKey + "'";
                        this.childItemTemplates[message.TemplateItem.ItemKey].requestViewFromDB(filter);
                    }
                    break;
                case 'ContinueTemplateItem':
                    if (message.TemplateItem != null && message.TemplateItem.ItemKey != null) {
                        if (this.childItemTemplates[message.TemplateItem.ItemKey] != null) {
                            this.childItemTemplates[message.TemplateItem.ItemKey].fromClient(message.TemplateItem);
                        }
                    }
                    break;
                case 'UpdateItem':
                    if (message.TemplateItem != null && message.TemplateItem.ItemData != null && message.TemplateItem.ItemData.Attrs != null) {
                        let itemKey = null;
                        if (message.TemplateItem.ItemData.ItemKey == null) {
                            let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.useCase.Detail.AddUseCase);
                            if (useCaseFound != null && useCaseFound.Detail.AutoKey != null && useCaseFound.Detail.AutoKey === 'Yes') {
                                itemKey = '';
                            }
                            if (useCaseFound != null && useCaseFound.Detail.KeyAttribute != null && message.TemplateItem.ItemData.Attrs[useCaseFound.Detail.KeyAttribute] != null) {
                                itemKey = '';
                            }
                        } else {
                            itemKey = message.TemplateItem.ItemData.ItemKey;
                        }
                        if (itemKey != null && message.TemplateItem.ItemData.Attrs != null) {
                            console.log(" message.TemplateItem.ItemData: ", message.TemplateItem.ItemData);
                            let data = '';
                            if (itemKey !== '') {
                                for (let attrCur in message.TemplateItem.ItemData.Attrs) {
                                    let attrDetail = message.TemplateItem.ItemData.Attrs[attrCur];
                                    data += ('"' + attrCur + '" = ');
                                    data += ("E'" + jsesc(attrDetail.Value, { 'quotes': 'single' }) + "',");
                                }
                                if (data.length > 0) {
                                    let filter = '"' + this.keyName + "\" = '" + itemKey + "'";
                                    data = data.slice(0, -1);
                                    this.childItemTemplates[itemKey].requestUpdateToDB(filter, data);
                                }
                            } else {
                                let columns = '(';
                                data = '';
                                for (let attrCur in message.TemplateItem.ItemData.Attrs) {
                                    let attrDetail = message.TemplateItem.ItemData.Attrs[attrCur];
                                    columns += ('"' + attrCur + '",');
                                    data += ("E'" + jsesc(attrDetail.Value, { 'quotes': 'single' }) + "',");
                                }
                                if (data.length > 0) {
                                    columns = columns.slice(0, -1);
                                    columns += ') VALUES (';
                                    data = data.slice(0, -1);
                                    data += ')';
                                    this.requestInsertToDB(columns + data);
                                }
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
        //console.log(result);
        this.childItemList = [];
        if (result.length > 0) {
            this.keyName = Object.keys(result[0])[0];
            result.forEach(resultCur => {
                this.childItemList.push({
                    Key: resultCur[this.keyName],
                    Attrs: resultCur
                });
            });
        }
        this.toClient({Items: this.childItemList});
    }

    async requestInsertToDB(data) {
        await this.session.database.addData(this.useCase.Detail.AddView, data, this.sendViewResultToClient);
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
                case 'DrillDown':
                    if (this.useCaseElem.SubUseCase != null) {
                        let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.useCaseElem.SubUseCase);
                        if (useCaseFound != null) {
                            switch (useCaseFound.Detail.Format) {
                                case 'List':
                                    if (this.templateList == null) {
                                        this.templateList = new TemplateList(this, useCaseFound);
                                        let filter = '1=1';
                                        if (this.parent.item != null && useCaseFound.Detail.ViewFilterColumn != null) {
                                            filter = '"' + useCaseFound.Detail.ViewFilterColumn + "\" = '" + this.parent.item.Key + "'";
                                        }
                                        this.templateList.requestViewFromDB(filter);
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
