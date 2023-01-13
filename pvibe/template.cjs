const jsesc = require("jsesc");

class TemplateItem {
    constructor(parent, useCase, key) {
        this.parent = parent;
        this.useCase = useCase;
        this.session = this.parent.session;
        this.dataItems = [];
        this.itemList = {};
        this.itemList[key] = {Key: key, Elems: {}};
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
				case 'Put':

					/*
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
								this.requestInsertToDB(addView, columns + data);
							}
						}
					}
					*/

					break;
                case 'Refresh':
                    break;
                case 'Stop':
                    break;
                case 'ContinueTemplateElem':
                    if (message.TemplateElem != null && message.TemplateElem.UseCaseElemName != null) {
						console.log("TemplateItem::fromClient() - aaaaa");
						let useCaseElemName = message.TemplateElem.UseCaseElemName;
						let useCaseElemFound = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === useCaseElemName);
						if (useCaseElemFound != null && useCaseElemFound.SubUseCase != null) {
							console.log("TemplateItem::fromClient() - AAAAA");
							let itemListEntry;
							if (this.itemList[message.TemplateElem.ItemKey] == null) {
								console.log("TemplateItem::fromClient() - BBBBB");
								itemListEntry = {Key: message.TemplateElem.ItemKey, Elems: {}};
								this.itemList[message.TemplateElem.ItemKey] = itemListEntry;
							} else {
								console.log("TemplateItem::fromClient() - CCCCC");
								itemListEntry = this.itemList[message.TemplateElem.ItemKey];
							}
							console.log("TemplateItem::fromClient() - DDDDD");
	                        if (itemListEntry.Elems[useCaseElemName] == null) {
								console.log("TemplateItem::fromClient() - EEEEE");
                                let templateElemNew = new TemplateElem(this, useCaseElemFound, itemListEntry);
                                itemListEntry.Elems[useCaseElemName] = templateElemNew;
	                        }
							console.log("TemplateItem::fromClient() - FFFFF");
	                        if (itemListEntry.Elems[useCaseElemName] != null) {
								console.log("TemplateItem::fromClient() - GGGGG");
	                            itemListEntry.Elems[useCaseElemName].fromClient(message.TemplateElem);
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
		let parentKey = this.parent.itemParent != null ? this.parent.itemParent.Key : null;
        let messageOut = {
            Action: 'ContinueTemplateItem',
            TemplateItem: {
				ParentKey: parentKey,
                UseCaseName: this.useCase.Detail.Name,
                ...messageIn
            }
        };
        this.parent.toClient(messageOut);
    }
    
	constructSelect() {
		console.log("TemplateItem::constructSelect():");
		let tableName = this.session.classes.find(cur => cur.Name === this.useCase.Detail.Class).tableName;
		this.selectQuery = 'SELECT "Id","Extension"';
		this.selectColumns = '';
		this.selectFrom = 'FROM data."' + tableName + '"';
		if (this.parent.itemParent != null) {
			let classParent = this.parent.parent.useCase.Detail.Class;
			let parentTableName = this.session.classes.find(cur => cur.Name === classParent).tableName;
			let linkTable = parentTableName + '_CHILD_' + this.parent.useCaseElem.Attribute;
			this.selectFrom += ', data."' + linkTable + '"';
			this.selectWhere = 'WHERE data."' + linkTable + '"."ParentId" = \'' + this.parent.itemParent.Key + '\'';
			this.selectWhere += (' AND data."' + linkTable + '"."ChildId" = data."' + tableName + '"."Id"');
			// HERE: 
			this.constructSelectApplyContext();

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
        //console.log("TemplateItem::constructSelectAddColumn() - elemColumn: ", elemColumn.Name);
        let elemAttribute = this.useCase.Detail.Attributes.find(attributeCur => attributeCur.Name === elemColumn.Attribute);
        if (elemAttribute != null) {
			switch (elemAttribute.Type) {
				case 'Primitive':
					if (elemAttribute.Path.length === 1) {
						this.selectColumns += (',"' + elemAttribute.Path[0] + '"' );
					}
					break;
				case 'Embedded':
					if (elemAttribute.Path.length === 1) {
				        console.log("TemplateItem::constructSelectAddColumn() - Embedded: ", elemAttribute);
						let ucClass = this.session.classes.find(cur => cur.Name === this.useCase.Detail.Class);
						let embeddedComponent = ucClass.Components.find(cur => cur.Name === elemAttribute.Path[0]);
						let embeddedTableName = this.session.classes.find(cur => cur.Name === embeddedComponent.EmbeddedClass).tableName;

						this.selectFrom += ', data."' + embeddedTableName + '"';
						this.selectWhere += (' AND data."' + embeddedTableName + '"."Id" = data."' + ucClass.tableName + '."' + elemAttribute.Path[0] + '"');
						this.selectColumns += (', data."' + embeddedTableName + '".*' );
					}
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

	constructSelectApplyContext() {
		this.parent.context;
		
	}

	stepDownToChild(elemChild) {
        let elemAttribute = this.useCase.Detail.Attributes.find(attributeCur => attributeCur.Name === elemChild.Attribute);
        if (elemAttribute != null) {
			switch (elemAttribute.Type) {
				case 'Child':
					//console.log("TemplateItem::stepDownToChild() - elemChild: ", elemChild.Name);
					this.dataItems.forEach(dataItemCur => {
						let itemListEntry;
						if (this.itemList[dataItemCur.Key] == null) {
							itemListEntry = {Key: dataItemCur.Key, Elems: {}};
						} else {
							itemListEntry = this.itemList[dataItemCur.Key];
						}
						if (itemListEntry.Elems[elemChild.Name] == null) {
							let useCaseElemFound = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === elemChild.Name);
							itemListEntry.Elems[elemChild.Name] = new TemplateElem(this, useCaseElemFound, itemListEntry);
							// HERE: 
							itemListEntry.Elems[elemChild.Name].context = this.parent.context;
							itemListEntry.Elems[elemChild.Name].startTemplateItem();
						}
					});
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
			let parentKey = this.parent.itemParent != null ? this.parent.itemParent.Key : null;
	        let messageOut = {
	            Action: 'StartTemplateItem',
	            TemplateItem: {
					ParentKey: parentKey,
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
		this.context = null;
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
    }

    fromClient(message) {
        console.log("TemplateElem::fromClient(): ", message, "\nthis.useCaseElem: ", this.useCaseElem, "\n");
        if (message.Action != null) {
            switch (message.Action) {
                case 'Start':
					if (message.Context != null) {
							// HERE: 
							this.context = message.Context;
					}
					this.startTemplateItem();
                    break;
				case 'ContinueTemplateItem':
                    if (message.TemplateItem != null) {
						if (this.templateItem == null) {
							let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.useCaseElem.SubUseCase);
							if (useCaseFound != null) {
								console.log("TemplateElem::fromClient() - useCaseFound ", useCaseFound);
								if (useCaseFound.Detail.SubUseCase != null) {
									console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT");
									// This is a case of drilldown from list to form, where the form is presenting the same Item as the row
									// in the parent list, which was selected for drilldown
									//this.templateItem = this.parent;
									let subUseCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === useCaseFound.Detail.SubUseCase);
									if (subUseCaseFound != null) {
										console.log("UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU");
										this.templateItem = new TemplateItem(this, subUseCaseFound);
										if (message.TemplateItem.TemplateItem != null) {
											this.templateItem.fromClient(message.TemplateItem.TemplateItem);
										} else {
											this.templateItem.fromClient(message.TemplateItem);
										}
									}
								}
							}
						} else {
							//this.templateItem.fromClient(message.TemplateItem);
							if (message.TemplateItem.TemplateItem != null) {
								this.templateItem.fromClient(message.TemplateItem.TemplateItem);
							} else {
								this.templateItem.fromClient(message.TemplateItem);
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
    
    startTemplateItem() {
        if (this.useCaseElem.SubUseCase != null) {
            console.log("TemplateElem::startTemplateItem: ", this.useCaseElem.SubUseCase);
            let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.useCaseElem.SubUseCase);
            if (useCaseFound != null) {
				//console.log("useCaseFound:\n", useCaseFound, "\n");
				this.templateItem = new TemplateItem(this, useCaseFound);
				this.templateItem.constructSelect();
				this.templateItem.sendToDbSelect();
			}
		}
	}
}

module.exports = {
    TemplateItem: TemplateItem
}
