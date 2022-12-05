const jsesc = require("jsesc");

class TemplateItem {
    constructor(parent, useCase) {
        this.parent = parent;
        this.useCase = useCase;
        this.session = this.parent.session;
        this.elems = {};
        this.selectQuery = null;
        this.listenQuery = null;
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
        this.dbDoneSelect = this.dbDoneSelect.bind(this);
    }

    fromClient(message) {
        console.log("TemplateItem::fromClient(): ", message);
        if (message.Action != null) {
            switch (message.Action) {
                case 'Start':
					this.constructSelect();
                    break;
                case 'Refresh':
                    break;
                case 'Stop':
                    break;
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
    
	setDataItems(dataItems) {
		this.dataItems = dataItems;
	}

	constructSelect() {
        console.log("TemplateItem::constructSelect() -: ");
        this.selectQuery = '';
		this.useCase.Detail.Attributes.forEach(attributeCur => {
			this.constructSelectNode(attributeCur);
		});
	}

	constructSelectNode(attributeNode) {
        console.log("TemplateItem::constructSelectNode() - attributeNode: ", attributeNode.Name, attributeNode.Type);
		if (attributeNode.Paths != null) {
			attributeNode.Paths.forEach(pathCur => {
				this.constructSelectNodePathSeg(pathCur);
			});
		}
	}

	constructSelectNodePathSeg(pathSeg) {
        console.log("TemplateItem::constructSelectNodePathSeg() - pathSeg: ", pathSeg.Child);
		if (pathSeg.Paths != null) {
			pathSeg.Paths.forEach(subPathCur => {
				this.constructSelectNodePathSeg(subPathCur);
			});
		}
	}

	constructListen(selectResult) {
	}
	
    async dbDoSelect(filter) {
        await this.session.database.doSelect(this.useCase.Detail.RetrieveView, filter, this.dbDoneSelect);
    }

    async dbDoUpdate(filter, data) {
        await this.session.database.doUpdate(this.useCase.Detail.UpdateView, filter, data, this.dbDoneSelect);
    }

    async dbDoInsert(filter, data) {
        await this.session.database.doInsert(this.useCase.Detail.UpdateView, filter, data, this.dbDoneSelect);
    }

    async dbDoneSelect(result) {
        if (result.length === 1) {
			if (this.useCase.Detail.Listen != null && this.useCase.Detail.Listen === 'Yes') {
				this.constructListen(result);
			}
            this.keyName = Object.keys(result[0])[0];
            this.item = {
                Key: result[0][this.keyName],
                Attrs: result[0]
            };
        }
        this.toClient({Item: this.item});
    }

}

class TemplateElem {
    constructor(parent, useCaseElem) {
        this.parent = parent;
        this.useCaseElem = useCaseElem;
        this.session = this.parent.session;
        this.itemParent = parent.item;
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
    }

    fromClient(message) {
        console.log("TemplateElem::fromClient(): ", message, "\nthis.useCaseElem: ", this.useCaseElem);
        if (this.useCaseElem.SubUseCase != null) {
            console.log("TemplateElem::fromClient() - this.useCaseElem.SubUseCase: ", this.useCaseElem.SubUseCase);
            let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.useCaseElem.SubUseCase);
            if (useCaseFound != null) {
                switch (useCaseFound.Detail.Format) {
                    case 'List':
                    case 'PickList': 
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
