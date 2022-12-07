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
        this.receiveFromDb = this.receiveFromDb.bind(this);
    }

    fromClient(message) {
        console.log("TemplateItem::fromClient(): ", message);
        if (message.Action != null) {
            switch (message.Action) {
                case 'Start':
					if (this.useCase.Detail.Flow === 'Serial') {
						this.constructSelect();
						this.sendToDbSelect();
					}
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
        this.selectQuery = 'SELECT "Id","Extension"';
        this.selectColumns = '';
        this.selectFrom = 'FROM data."'+ this.useCase.Detail.Class + '" ';
        this.selectWhere = 'WHERE 1=1';
        this.selectOrderBy = '';
		this.useCase.Detail.Attributes.forEach(attributeCur => {
			this.constructSelectNode(attributeCur);
		});
		this.selectQuery += (this.selectColumns + ' ' + this.selectFrom + ' ' + this.selectWhere + ' ' + this.selectOrderBy);
	}

	constructSelectNode(attributeNode) {
        console.log("TemplateItem::constructSelectNode() - attributeNode: ", attributeNode.Name, attributeNode.Type);
        if (attributeNode.Type === 'Component') {
			this.selectColumns += (',"' + attributeNode.Column + '"' );
		} else {
			/*
			if (attributeNode.Paths != null) {
				attributeNode.Paths.forEach(pathCur => {
					this.constructSelectNodePathSeg(pathCur);
				});
			}
			*/
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

    async sendToDbSelect() {
        await this.session.database.doSelect(this.selectQuery, this.receiveFromDb);
    }

    async sendToDbUpdate(filter, data) {
        await this.session.database.doUpdate(this.useCase.Detail.UpdateView, filter, data, this.receiveFromDb);
    }

    async sendToDbInsert(filter, data) {
        await this.session.database.doInsert(this.useCase.Detail.UpdateView, filter, data, this.receiveFromDb);
    }

    async receiveFromDb(result) {
		result.forEach(resultCur => {
			console.log("TemplateItem::receiveFromDb() - resultCur:\n", resultCur);
		});
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
        
        /*
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
        */

        if (message.Action != null) {
            switch (message.Action) {
                case 'Start':
					if (this.useCase.Detail.Flow === 'Serial') {
						this.constructSelect();
						this.sendToDbSelect();
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
