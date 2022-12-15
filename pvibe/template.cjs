const jsesc = require("jsesc");

class TemplateItem {
    constructor(parent, useCase, key) {
        this.parent = parent;
        this.useCase = useCase;
        this.session = this.parent.session;
        this.key = key;
        this.templateElems = {};
        this.dataItems = [];
        this.templateItems = {};
        //this.items = {};
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
								let useCaseElemFound = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === message.TemplateElem.UseCaseElemName);
								if (useCaseElemFound != null && useCaseElemFound.SubUseCase != null) {
									let templateItemDetail;
									if (this.templateItems[dataItemCur.Key] == null) {
										let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === useCaseElemFound.SubUseCase);
										templateItemDetail = new TemplateItem(this, useCaseFound, dataItemCur.Key); // {Key: dataItemCur.Key, Elems: {}};
										this.templateItems[dataItemCur.Key] = templateItemDetail;
									} else {
										templateItemDetail = this.templateItems[dataItemCur.Key];
									}
			                        if (templateItemDetail.templateElems[message.TemplateElem.UseCaseElemName] == null) {
			                            //let useCaseElemFound = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === message.TemplateElem.UseCaseElemName);
			                            if (useCaseElemFound != null) {
			                                let templateElemNew = new TemplateElem(this, useCaseElemFound, templateItemDetail);
			                                templateItemDetail.templateElems[message.TemplateElem.UseCaseElemName] = templateElemNew;
			                            }
			                        }
			                        if (templateItemDetail.templateElems[message.TemplateElem.UseCaseElemName] != null) {
			                            templateItemDetail.templateElems[message.TemplateElem.UseCaseElemName].fromClient(message.TemplateElem);
			                            templateItemDetail.templateElems[message.TemplateElem.UseCaseElemName].fromClient(message.TemplateElem);
			                        }
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
    
	constructSelect() {
        console.log("TemplateItem::constructSelect():");
        this.selectQuery = 'SELECT "Id","Extension"';
        this.selectColumns = '';
        this.selectFrom = 'FROM data."' + this.useCase.Detail.Class + '"';
        if (this.parent.itemParent != null) {
			let classparent = this.parent.parent.useCase.Detail.Class;
			let linkTable = classparent + '_CHILD_'+ this.parent.useCaseElem.Attribute;
			this.selectFrom += ', data."' + linkTable + '"';
			this.selectWhere = 'WHERE data."' + linkTable + '"."ParentId" = \'' + this.parent.itemParent.key + '\' AND ';
			this.selectWhere += ' data."' + linkTable + '"."ChildId" = data."' + this.useCase.Detail.Class + '"."Id"';
		} else {
			this.selectWhere = 'WHERE 1=1';
		}
        this.selectOrderBy = '';
		this.useCase.Detail.Elems.forEach(elemCur => {
			this.constructSelectAddColumn(elemCur);
		});
		this.selectQuery += (this.selectColumns + ' ' + this.selectFrom + ' ' + this.selectWhere + ' ' + this.selectOrderBy);
	}

	constructSelectAddColumn(elemColumn) {
        console.log("TemplateItem::constructSelectAddColumn() - elemColumn: ", elemColumn.Name);
        let elemAttribute = this.useCase.Detail.Attributes.find(attributeCur => attributeCur.Name === elemColumn.Attribute);
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

	/*
	constructSelectNodePathSeg(pathSeg) {
        console.log("TemplateItem::constructSelectNodePathSeg() - pathSeg: ", pathSeg.Child);
		if (pathSeg.Paths != null) {
			pathSeg.Paths.forEach(subPathCur => {
				this.constructSelectNodePathSeg(subPathCur);
			});
		}
	}
	*/

	stepDownToChild(elemChild) {
        console.log("TemplateItem::stepDownToChild() - elemChild: ", elemChild.Name);
        let elemAttribute = this.useCase.Detail.Attributes.find(attributeCur => attributeCur.Name === elemChild.Attribute);
        if (elemAttribute != null) {
			switch (elemAttribute.Type) {
				case 'Child':
					for (let templateItemCur in this.templateItems) {
						let templateItemDetail = this.templateItems[templateItemCur];
						
					}
					break;
				default:
					break;
			}
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
			let dataItemCur = {
				Key: resultCur.Id,
				Attrs: {...resultCur}
			};
            this.dataItems.push(dataItemCur);
		});
		if (this.dataItems.length > 0) {
			//this.toClient({DataItems: dataItems});
	        let messageOut = {
	            Action: 'StartTemplateItem',
	            TemplateItem: {
					DataItems: this.dataItems
	            }
	        };
	        this.parent.toClient(messageOut);
		}
		
		// Drilldown
		this.useCase.Detail.Elems.forEach(elemCur => {
			this.stepDownToChild(elemCur);
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
