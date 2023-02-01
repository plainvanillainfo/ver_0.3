const jsesc = require("jsesc");
const { uuidv4 } = require("uuid4");

class TemplateItem {
    constructor(parent, useCase, key) {
        this.parent = parent;
        this.useCase = useCase;
        this.session = this.parent.session;
        this.dataItems = [];
        this.itemList = {};
        this.itemList[key] = {Key: key, Elems: {}};
		this.tableBase = {};
        this.selectQuery = null;
        this.updateQuery = null;
        this.insertQuery = null;
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
					if (message.ItemKey != null && this.itemList[message.ItemKey] != null && message.Attrs != null) {
						this.updateQuery = null;
						let dataItemCur = this.dataItems.find(cur => cur.Key === message.ItemKey);
						this.constructUpdate(message, dataItemCur);
						if (this.updateQuery != null) {
							this.sendToDbUpdate();
						}
					} else {
						console.log("TemplateItem::fromClient() - Put - this.itemList:\n", this.itemList, "\nthis.parent.parent.itemList:\n", this.parent.parent.itemList, "\n");
						this.insertQuery = null;
						let dataItemCur = {Key: '', Attrs: {}};
						this.constructInsert(message, dataItemCur);
						if (this.insertQuery != null) {
							//this.sendToDbInsert();
						}
					}
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
						if (useCaseElemFound != null) {
							/*
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
							*/
							let itemListEntry = this.itemList[message.TemplateElem.ItemKey];
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
		this.tableBase['Class'] = this.session.classes.find(cur => cur.Name === this.useCase.Detail.Class);
		this.tableBase['Name'] = this.tableBase['Class'].tableName;
		this.tableBase['SelectColumns'] = [
			{As: 'Id', Table: this.tableBase['Name'], Column: 'Id'},
			{As: 'Extension', Table: this.tableBase['Name'], Column: 'Extension'}
		];
		this.tableBase['FromTables'] = [
			{Table: this.tableBase['Name'], Alias: this.tableBase['Name']}
		];
		this.tableBase['WhereJoins'] = [];
		this.selectQuery = 'SELECT ';
		this.selectFrom = 'FROM ';
		this.selectWhere = 'WHERE';
		this.selectOrderBy = '';
		if (this.parent.itemParent != null) {
			let classParent = this.parent.parent.useCase.Detail.Class;
			this.tableBase['ParentTableName'] = this.session.classes.find(cur => cur.Name === classParent).tableName;
			this.tableBase['ParentToThisLinkTableName'] = this.tableBase['ParentTableName'] + '_CHILD_' + this.parent.useCaseElem.Attribute;
			this.tableBase['FromTables'].push({
				Table: this.tableBase['ParentToThisLinkTableName'],
				Alias: this.tableBase['ParentToThisLinkTableName']
			});
			this.selectWhere += (' "' + this.tableBase['ParentToThisLinkTableName'] + '"."ParentId" = \'' + this.parent.itemParent.Key + '\' AND ');
			this.tableBase['WhereJoins'].push({
				TableLeft: this.tableBase['ParentToThisLinkTableName'],
				ColumnLeft: 'ChildId', 
				TableRight: this.tableBase['Name'],
				ColumnRight: 'Id'
			});
			this.constructSelectApplyContext();	// HERE - filtration: 
		} else {
			this.selectWhere += ' 1=1';
		}
		this.useCase.Detail.Elems.forEach(elemCur => {
			let elemAttribute = this.useCase.Detail.Attributes.find(attributeCur => attributeCur.Name === elemCur.Attribute);
			this.constructSelectAddColumn(elemCur, elemAttribute, this.tableBase['Class'], this.tableBase['Name']);
		});
		this.tableBase['SelectColumns'].forEach((colCur, colIndex) => {
			this.selectQuery += ('"' + colCur.Table + '"."' + colCur.Column + '" AS "' + colCur.As + '"');
			if ((colIndex+1) < this.tableBase['SelectColumns'].length) {
				this.selectQuery += ', ';
			}
		});
		this.tableBase['FromTables'].forEach((tableCur, tableIndex) => {
			this.selectFrom += ('data."' + tableCur.Table + '" "' + tableCur.Alias + '"');
			if ((tableIndex+1) < this.tableBase['FromTables'].length) {
				this.selectFrom += ', ';
			}
		});
		this.tableBase['WhereJoins'].forEach((joinCur, joinIndex) => {
			this.selectWhere += ('"' + joinCur.TableLeft + '"."' + joinCur.ColumnLeft + '" = "' + joinCur.TableRight + '"."' + joinCur.ColumnRight + '"');
			if ((joinIndex+1) < this.tableBase['WhereJoins'].length) {
				this.selectWhere += ' AND ';
			}
		});
		this.selectQuery += (' ' + this.selectFrom + ' ' + this.selectWhere + ' ' + this.selectOrderBy);
	}

	constructSelectAddColumn(elemColumn, elemAttribute, ucClass, tableAlias) {
		//console.log("TemplateItem::constructSelectAddColumn(): ", elemColumn, elemAttribute);
        if (elemAttribute != null) {
			switch (elemAttribute.Type) {
				case 'Primitive':
					if (elemAttribute.Path.length === 1) {
						this.tableBase['SelectColumns'].push({
							As: elemColumn.Name,
							Table: tableAlias,
							Column: elemAttribute.Path[0]
						});
					}
					break;
				case 'Embedded':
				case 'Reference':
						if (elemAttribute.Path.length === 1) {
				        console.log("TemplateItem::constructSelectAddColumn() - Embedded: ", elemAttribute);
						let embeddedOrReferredComponent;
						let embeddedOrReferredTableName;
						if (elemAttribute.Type === 'Embedded') {
							embeddedOrReferredComponent = ucClass.Components.find(cur => cur.Name === elemAttribute.Path[0]);
							embeddedOrReferredTableName = this.session.classes.find(cur => cur.Name === embeddedOrReferredComponent.EmbeddedClass).tableName;
						} else {
							embeddedOrReferredComponent = ucClass.References.find(cur => cur.Name === elemAttribute.Path[0]);
							embeddedOrReferredTableName = this.session.classes.find(cur => cur.Name === embeddedOrReferredComponent.ReferredClass).tableName;
						}
						let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === elemColumn.SubUseCase);
						if (useCaseFound != null) {
							this.tableBase['SelectColumns'].push({
								As: elemColumn.Name,
								Table: elemAttribute.Name,
								Column: 'Id'
							});
							this.tableBase['FromTables'].push({
								Table: embeddedOrReferredTableName,
								Alias: elemAttribute.Name
							});
							this.tableBase['WhereJoins'].push({
								TableLeft: elemAttribute.Name,
								ColumnLeft: 'Id', 
								TableRight: tableAlias,
								ColumnRight: elemAttribute.Path[0]
							});
							let ucClassCur = this.session.classes.find(cur => cur.Name === useCaseFound.Detail.Class);
							useCaseFound.Detail.Elems.forEach(elemCur => {
								let elemAttributeCur = useCaseFound.Detail.Attributes.find(attributeCur => attributeCur.Name === elemCur.Attribute);
								this.constructSelectAddColumn(elemCur, elemAttributeCur, ucClassCur, elemAttribute.Name);
							});
						}
					}
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

	constructUpdate(message, dataItemCur) {
		console.log("TemplateItem::constructUpdate() this.selectFrom\n", this.selectFrom, "\nthis.selectWhere : \n", 
			this.selectWhere, "\nthis.tableBase : \n", JSON.stringify(this.tableBase) );
		let updateQueries = [];
		this.tableBase.SelectColumns.forEach(colCur => {
			let tableCur = this.tableBase.FromTables.find(cur => cur.Alias === colCur.Table);
			let updateQueryCur = updateQueries.find(cur => cur.Alias === tableCur.Alias);
			if (updateQueryCur == null) {
				updateQueryCur = {
					Alias: tableCur.Alias,
					Table: tableCur.Table,
					Sets: [],
					WhereId: dataItemCur.Attrs[colCur.As],
					QueryString: ''
				};
				updateQueries.push(updateQueryCur);
			}
			if (message.Attrs[colCur.Column] != null) {
				let setCur = updateQueryCur.Sets.find(cur => cur.Column === colCur.Column);
				if (setCur == null) {
					setCur = {
						Column: colCur.Column
					}
					updateQueryCur.Sets.push(setCur);
				}
				setCur.Value = message.Attrs[colCur.Column];
			}
		});
		let withString = 'WITH ';
		updateQueries.forEach((queryCur, queryIndex) => {
			if (queryCur.Sets.length > 0) {
				queryCur.QueryString = 'UPDATE data."' + queryCur.Table + '" SET ';
				queryCur.Sets.forEach((setCur, setIndex) => {
					queryCur.QueryString += ('"' + setCur.Column + '"=\'' + setCur.Value + '\'');
					if ((setIndex + 1) < queryCur.Sets.length) {
						queryCur.QueryString += ', ';
					}
				});
				queryCur.QueryString += ' WHERE "Id" = \'' + queryCur.WhereId + '\'';
				withString += (' update' + (queryIndex + 1).toString() + '(ok) AS ( ' + queryCur.QueryString + ' RETURNING \'ok\' )');
				if ((queryIndex + 1) < updateQueries.length) {
					withString += ',';
				}
				withString += ' ';
			}
		});
		updateQueries.forEach((queryCur, queryIndex) => {
			if (queryCur.Sets.length > 0) {
				withString += ('SELECT ok FROM update' + (queryIndex+1).toString());
				if ((queryIndex+1) < updateQueries.length) {
					withString += ' UNION ALL ';
				}
			}
		});
		this.updateQuery = withString;
		console.log(withString);
	}

	constructInsert(message, dataItemCur) {
		console.log("TemplateItem::constructInsert() this.selectFrom\n", this.selectFrom, "\nthis.selectWhere : \n", 
			this.selectWhere, "\nthis.tableBase : \n", JSON.stringify(this.tableBase) );
		let insertQueries = [];
		this.tableBase.SelectColumns.forEach(colCur => {
			let tableCur = this.tableBase.FromTables.find(cur => cur.Alias === colCur.Table);
			let insertQueryCur = insertQueries.find(cur => cur.Alias === tableCur.Alias);
			if (insertQueryCur == null) {
				insertQueryCur = {
					Alias: tableCur.Alias,
					Table: tableCur.Table,
					Sets: [],
					WhereId: dataItemCur.Attrs[colCur.As],
					QueryString: ''
				};
				insertQueries.push(insertQueryCur);
			}
			if (message.Attrs[colCur.Column] != null) {
				let setCur = insertQueryCur.Sets.find(cur => cur.Column === colCur.Column);
				if (setCur == null) {
					setCur = {
						Column: colCur.Column
					}
					insertQueryCur.Sets.push(setCur);
				}
				setCur.Value = message.Attrs[colCur.Column];
			}
		});
		let idNew = uuidv4();
		let withString = 'WITH ';
		insertQueries.forEach((queryCur, queryIndex) => {
			if (queryCur.Sets.length > 0) {
				queryCur.QueryString = 'INSERT INTO data."' + queryCur.Table + '" ("Id", ';
				queryCur.Sets.forEach((setCur, setIndex) => {
					queryCur.QueryString += ('"' + setCur.Column + '"');
					if ((setIndex + 1) < queryCur.Sets.length) {
						queryCur.QueryString += ', ';
					}
				});
				queryCur.QueryString += ') VALUES(\'' + idNew + '\', ';
				queryCur.Sets.forEach((setCur, setIndex) => {
					queryCur.QueryString += ('\'' + setCur.Value + '\'');
					if ((setIndex + 1) < queryCur.Sets.length) {
						queryCur.QueryString += ', ';
					}
				});
				queryCur.QueryString += ') ';
				//queryCur.QueryString += ' WHERE "Id" = \'' + queryCur.WhereId + '\'';
				withString += (' insert' + (queryIndex + 1).toString() + '(ok) AS ( ' + queryCur.QueryString + ' RETURNING \'ok\' )');
				if ((queryIndex + 1) < insertQueries.length) {
					withString += ',';
				}
				withString += ' ';
			}
		});
		insertQueries.forEach((queryCur, queryIndex) => {
			if (queryCur.Sets.length > 0) {
				withString += ('SELECT ok FROM insert' + (queryIndex+1).toString());
				if ((queryIndex+1) < insertQueries.length) {
					withString += ' UNION ALL ';
				}
			}
		});
		this.insertQuery = withString;
		console.log(withString);
	}

	stepDownToChild(elemChild) {
        let elemAttribute = this.useCase.Detail.Attributes.find(attributeCur => attributeCur.Name === elemChild.Attribute);
        if (elemAttribute != null) {
			switch (elemAttribute.Type) {
				case 'Child':
					//console.log("TemplateItem::stepDownToChild() - elemChild: ", elemChild.Name);
					this.dataItems.forEach(dataItemCur => {
						/*
						//console.log("TemplateItem::stepDownToChild() - dataItemCur.Key: ", dataItemCur.Key);
						console.log("TemplateItem::fromClient() - AAAAA 11111");
						let itemListEntry;
						if (this.itemList[dataItemCur.Key] == null) {
							console.log("TemplateItem::fromClient() - BBBBB 11111");
							itemListEntry = {Key: dataItemCur.Key, Elems: {}};
							this.itemList[dataItemCur.Key] = itemListEntry;
						} else {
							console.log("TemplateItem::fromClient() - CCCCC 11111");
							itemListEntry = this.itemList[dataItemCur.Key];
						}
						*/
						let itemListEntry = this.itemList[dataItemCur.Key];
						console.log("stepDownToChild - DDDDD 11111");
						if (itemListEntry.Elems[elemChild.Name] == null) {
							console.log("stepDownToChild - EEEEE 11111");
							let useCaseElemFound = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === elemChild.Name);
							itemListEntry.Elems[elemChild.Name] = new TemplateElem(this, useCaseElemFound, itemListEntry);
							// HERE: 
							itemListEntry.Elems[elemChild.Name].context = this.parent.context;
							itemListEntry.Elems[elemChild.Name].startTemplateItem();
						}
						console.log("stepDownToChild - FFFFF 11111");
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

    async sendToDbUpdate() {
        await this.session.database.doUpdate(this.updateQuery, this.receiveFromDb);
    }

    async sendToDbInsert(filter, data) {
        await this.session.database.doInsert(this.insertQuery, this.receiveFromDb);
    }

    async receiveFromDb(result) {
		result.forEach(resultCur => {
			console.log("TemplateItem::receiveFromDb() - resultCur:\n", resultCur);
			let dataItemCur = {
				Key: resultCur.Id,
				Attrs: {...resultCur}
			};
            this.dataItems.push(dataItemCur);

			if (this.itemList[dataItemCur.Key] == null) {
				console.log("receiveFromDb - lllllll");
				this.itemList[dataItemCur.Key] = {Key: dataItemCur.Key, Elems: {}};
			} else {
				console.log("receiveFromDb - mmmmmm");

			}

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
							console.log("TemplateElem::fromClient() - this.templateItem == null ");
							let useCaseFound;
							if (message.TemplateItem.TemplateItem != null) {
								useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.useCaseElem.SubUseCase);
							} else {
								useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === message.TemplateItem.UseCaseName);
							}
							if (useCaseFound != null) {
								console.log("TemplateElem::fromClient() - useCaseFound ", useCaseFound);
								if (useCaseFound.Detail.SubUseCase != null) {
									// This is a case of drilldown from list to form, where the form is presenting the same Item as the row
									// in the parent list, which was selected for drilldown
									//this.templateItem = this.parent;
									let subUseCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === useCaseFound.Detail.SubUseCase);
									if (subUseCaseFound != null) {
										//console.log("UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU");
										this.templateItem = new TemplateItem(this, subUseCaseFound);
										if (message.TemplateItem.TemplateItem != null) {
											//console.log("aaaaaaaaaaaaaaaaaaaaaa:\n"); //, this.itemParent,
											this.templateItem.fromClient(message.TemplateItem.TemplateItem);
										} else {
											//console.log("bbbbbbbbbbbbbbbbbbb");
											this.templateItem.fromClient(message.TemplateItem);
										}
									}
								}
							}
						} else {
							console.log("TemplateElem::fromClient() - this.templateItem != null "); //, this.templateItem);
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
