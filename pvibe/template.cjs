const jsesc = require("jsesc");

class TemplateItem {
    constructor(parent, useCase) {
        this.parent = parent;
        this.useCase = useCase;
        this.session = this.parent.session;
        this.dataItems = [];
        this.items = {};
        this.selectQuery = null;
        this.listenQuery = null;
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
        this.receiveFromDb = this.receiveFromDb.bind(this);
        if (this.parent.itemParent != null) {
			console.log("TemplateItem::constructor() - this.parent.itemParent: ", this.parent.itemParent);
		}
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
						if (message.TemplateElem.ItemKey != null) {
							let dataItemCur = this.dataItems.find(dataItemCur => dataItemCur.Key === message.TemplateElem.ItemKey);
							if (dataItemCur != null) {
								let itemCur;
								if (this.items[dataItemCur.Key] == null) {
									itemCur = {Key: dataItemCur.Key, Elems: {}};
									this.items[dataItemCur.Key] = itemCur;
								} else {
									itemCur = this.items[dataItemCur.Key];
								}
		                        if(itemCur.Elems[message.TemplateElem.UseCaseElemName] == null) {
		                            let useCaseElemFound = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === message.TemplateElem.UseCaseElemName);
		                            if (useCaseElemFound != null) {
		                                let templateElemNew = new TemplateElem(this, useCaseElemFound, itemCur);
		                                itemCur.Elems[message.TemplateElem.UseCaseElemName] = templateElemNew;
		                            }
		                        }
		                        if (itemCur.Elems[message.TemplateElem.UseCaseElemName] != null) {
		                            itemCur.Elems[message.TemplateElem.UseCaseElemName].fromClient(message.TemplateElem);
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
        console.log("TemplateItem::constructSelect():");
        this.selectQuery = 'SELECT "Id","Extension"';
        this.selectColumns = '';
        this.selectFrom = 'FROM data."' + this.useCase.Detail.Class + '"';
        if (this.parent.itemParent != null) {
			let classparent = this.parent.itemParent.parent.useCase.Detail.Class;
			let linkTable = classparent + '_CHILD_'+ this.parent.Attribute;
			this.selectFrom += ', data."' + linkTable + '"';
			this.selectWhere = 'WHERE data."' + linkTable + '"."ParentId" = \'' + this.parent.itemParent.Key + '\' AND ';
			this.selectWhere += ' data."' + linkTable + '"."ChildId" = data."' + this.useCase.Detail.Class + '"';
		} else {
			this.selectWhere = 'WHERE 1=1';
		}
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
    constructor(parent, useCaseElem, itemParent) {
        this.parent = parent;
        this.useCaseElem = useCaseElem;
        this.session = this.parent.session;
        this.itemParent = itemParent;
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
    }

    fromClient(message) {
        console.log("TemplateElem::fromClient(): ", message, "\nthis.useCaseElem: ", this.useCaseElem, "\n");
        if (message.Action != null) {
            switch (message.Action) {
                case 'Start':
			        if (this.useCaseElem.SubUseCase != null) {
			            console.log("TemplateElem::fromClient() - this.useCaseElem.SubUseCase: ", this.useCaseElem.SubUseCase);
			            let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.useCaseElem.SubUseCase);
			            if (useCaseFound != null) {
							console.log("useCaseFound:\n", useCaseFound, "\n");
							this.templateItem = new TemplateItem(this, useCaseFound);
							this.templateItem.constructSelect();
							this.templateItem.sendToDbSelect();
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
