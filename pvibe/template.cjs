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
			let classparent = this.parent.parent.useCase.Detail.Class;
			let linkTable = classparent + '_CHILD_'+ this.parent.useCaseElem.Attribute;
			this.selectFrom += ', data."' + linkTable + '"';
			this.selectWhere = 'WHERE data."' + linkTable + '"."ParentId" = \'' + this.parent.itemParent.Key + '\' AND ';
			this.selectWhere += ' data."' + linkTable + '"."ChildId" = data."' + this.useCase.Detail.Class + '"."Id"';
		} else {
			this.selectWhere = 'WHERE 1=1';
		}
        this.selectOrderBy = '';
		this.useCase.Detail.Elems.forEach(elemCur => {
			this.constructSelectNode(elemCur);
		});
		this.selectQuery += (this.selectColumns + ' ' + this.selectFrom + ' ' + this.selectWhere + ' ' + this.selectOrderBy);
	}

	constructSelectNode(elemNode) {
        console.log("TemplateItem::constructSelectNode() - elemNode: ", elemNode.Name);
        let elemAttribute = this.useCase.Detail.Attributes.find(attributeCur => attributeCur.Name === elemNode.Attribute);
        if (elemAttribute != null) {
			switch (elemAttribute.Type) {
				case 'Primitive':
					if (elemAttribute.Path.length === 1) {
						this.selectColumns += (',"' + elemAttribute.Path[0] + '"' );
					}
					break;
				case 'Embedded':
					break;
				case 'Reference':
					break;
				case 'Child':
					break;
				case 'Extension':
					break;
				default:
					break;
			}
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
		let dataItems = [];
		result.forEach(resultCur => {
			console.log("TemplateItem::receiveFromDb() - resultCur:\n", resultCur);
			let dataItemCur = {
				Key: resultCur.Id,
				Attrs: {...resultCur}
			};
            dataItems.push(dataItemCur);
		});
		if (dataItems.length > 0) {
			//this.toClient({DataItems: dataItems});
	        let messageOut = {
	            Action: 'StartTemplateItem',
	            TemplateItem: {
					DataItems: dataItems
	            }
	        };
	        this.parent.toClient(messageOut);
		}
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
