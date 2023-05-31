const jsesc = require("jsesc");
const { v4: uuidv4 } = require("uuid");

class TemplateItem {
    constructor(parent, useCase, key) {
        this.parent = parent;
        this.useCase = useCase;
        this.session = this.parent.session;
        this.dataItems = [];
		this.soleKey = key;
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
						console.log("TemplateItem::fromClient() - this.useCase.Detail' ", this.useCase.Detail);
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
							this.sendToDbInsert();
						}
					}
					break;
                case 'Drilldown':
					if ( message.TemplateItem != null) {
						console.log("Drilldown", message.TemplateItem, "\n", this.itemList);
						if (message.TemplateItem.ItemKey != null) {
							let itemListEntry = this.itemList[message.TemplateItem.ItemKey];
							if (itemListEntry != null ) {
								let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === message.TemplateItem.UseCaseName);
								if (useCaseFound != null) {
									itemListEntry.TemplateItemDrilldown = new TemplateItem(this, useCaseFound, message.TemplateItem.ItemKey);
									itemListEntry.TemplateItemDrilldown.constructSelect();
									itemListEntry.TemplateItemDrilldown.sendToDbSelect();
								}
							}
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
							let itemListEntry = this.itemList[message.TemplateElem.ItemKey];
							console.log("TemplateItem::fromClient() - useCaseElemFound != null");
	                        if (itemListEntry.Elems[useCaseElemName] == null) {
								console.log("TemplateItem::fromClient() - itemListEntry.Elems[useCaseElemName] == null");
                                let templateElemNew = new TemplateElem(this, useCaseElemFound, itemListEntry);
                                itemListEntry.Elems[useCaseElemName] = templateElemNew;
	                        }
	                        if (itemListEntry.Elems[useCaseElemName] != null) {
								console.log("TemplateItem::fromClient() - itemListEntry.Elems[useCaseElemName] != null");
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
		if (this.tableBase['Class'] == null) {
			console.log("TemplateItem::constructSelect() - this.tableBase['Class'].tableName == null", this.useCase.Detail, "\n", this.session.classes);
		}
		this.tableBase['Name'] = this.tableBase['Class'].tableName;
		this.tableBase['SelectColumns'] = [
			{As: 'Id', Table: this.tableBase['Name'], Column: 'Id'},
			{As: 'Extension', Table: this.tableBase['Name'], Column: 'Extension'}
		];
		this.tableBase['FromTables'] = [
			{Table: this.tableBase['Name'], Alias: this.tableBase['Name']}
		];
		this.tableBase['WhereJoins'] = [];
		this.tableBase['WhereTerms'] = [];
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
		} else {
			if (this.soleKey != null && this.soleKey !== '') {
				this.selectWhere += ' "Id"=\'' + this.soleKey + '\'';
			} else {
				this.selectWhere += ' 1=1';
			}
		}
		this.constructSelectApplyContext(); // HERE - filtration:
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
		if (this.useCase.Detail.Filter != null && this.useCase.Detail.Filter.Connector != null) {
			if (this.useCase.Detail.Filter.Connector === 'And') {
				this.tableBase['WhereTerms'].forEach((termCur) => {
					this.selectWhere += (' AND "' + termCur.Table + '"."' + termCur.Column + '" ' + termCur.Comparison + ' \'' + termCur.Value  + '\'');
				});
			} else {
				if (this.useCase.Detail.Filter.Connector === 'Or') {
					this.selectWhere += ' AND (';
					this.tableBase['WhereTerms'].forEach((termCur, termIndex) => {
						this.selectWhere += ('"' + termCur.Table + '"."' + termCur.Column + '" ' + termCur.Comparison + ' \'' + termCur.Value  + '\'');
						if ((termIndex+1) < this.tableBase['WhereTerms'].length) {
							this.selectWhere += ' OR ';
						}
					});
					this.selectWhere += ')';
				}
			}
		}
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
		//console.log("TemplateItem::constructSelectApplyContext():", JSON.stringify(this.useCase));
		if (this.useCase.Detail.Filter != null && this.useCase.Detail.Filter.Terms != null) {
			console.log("TemplateItem::AAAAA");
			if (this.useCase.Detail.Filter.Connector === 'And') {
				//console.log("TemplateItem::BBBBB");
				this.useCase.Detail.Filter.Terms.forEach(termCur => {
					let queryTerm = {
						Table: this.tableBase['Name'],
						Column: termCur.Attribute, 
						Comparison: '=',
						Value: termCur.Value
					};
					switch (termCur.Comparison) {
						case 'Eq':
							queryTerm.Comparison = '=';
							break;
						case 'Gt':
							queryTerm.Comparison = '>';
							break;
						case 'Lt':
							queryTerm.Comparison = '<';
							break;
						case 'Ge':
							queryTerm.Comparison = '>=';
							break;
						case 'Le':
							queryTerm.Comparison = '<=';
							break;
						case 'Ne':
							queryTerm.Comparison = '<>';
							break;
					}
					this.tableBase['WhereTerms'].push(queryTerm);
				});
			}
		}
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
		let insertQueryCur;
		this.tableBase.SelectColumns.forEach(colCur => {
			let tableCur = this.tableBase.FromTables.find(cur => cur.Alias === colCur.Table);
			insertQueryCur = insertQueries.find(cur => cur.Alias === tableCur.Alias);
			if (insertQueryCur == null) {
				insertQueryCur = {
					Alias: tableCur.Alias,
					Table: tableCur.Table,
					Sets: [],
					//WhereId: dataItemCur.Attrs[colCur.As],
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
		insertQueryCur = {
			Table: this.tableBase['ParentToThisLinkTableName'],
			Sets: [
				{
					Column: 'ParentId',
					Value: this.parent.itemParent.Key
				},
				{
					Column: 'ChildId',
					Value: idNew
				}
			],
			QueryString: ''
		};
		insertQueries.push(insertQueryCur);

		let withString = 'WITH ';
		insertQueries.forEach((queryCur, queryIndex) => {
			if (queryCur.Sets.length > 0) {
				queryCur.QueryString = 'INSERT INTO data."' + queryCur.Table + '" (';
				if ((queryIndex+1) < insertQueries.length) {
					queryCur.QueryString += '"Id", "Extension", ';
				}
				queryCur.Sets.forEach((setCur, setIndex) => {
					queryCur.QueryString += ('"' + setCur.Column + '"');
					if ((setIndex + 1) < queryCur.Sets.length) {
						queryCur.QueryString += ', ';
					}
				});
				queryCur.QueryString += ') VALUES(';
				if ((queryIndex+1) < insertQueries.length) {
					queryCur.QueryString += '\'' + idNew + '\', \'[]\', ';
				}
				queryCur.Sets.forEach((setCur, setIndex) => {
					queryCur.QueryString += ('\'' + setCur.Value + '\'');
					if ((setIndex + 1) < queryCur.Sets.length) {
						queryCur.QueryString += ', ';
					}
				});
				queryCur.QueryString += ') ';
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

		/*
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
		*/

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
						let itemListEntry = this.itemList[dataItemCur.Key];
						console.log("stepDownToChild - dataItemCur.Key", dataItemCur.Key);
						if (itemListEntry.Elems[elemChild.Name] == null) {
							console.log("stepDownToChild - itemListEntry.Elems[elemChild.Name] == null");
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
				console.log("receiveFromDb - this.itemList[dataItemCur.Key] == null");
				this.itemList[dataItemCur.Key] = {Key: dataItemCur.Key, Elems: {}, TemplateItemDrilldown: null};
			} else {
				console.log("receiveFromDb - mmmmmm");

			}

		});
		if (true || this.dataItems.length > 0) {
			let parentKey = this.parent.itemParent != null ? this.parent.itemParent.Key : this.parent.parent.itemParent != null ? this.parent.parent.itemParent.Key != null : null;
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
						this.templateItem.fromClient(message.TemplateItem);
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
            console.log("TemplateElem::startTemplateItem: ", this.useCaseElem.SubUseCase.Id);
            let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.useCaseElem.SubUseCase);
            if (useCaseFound != null) {
				//console.log("useCaseFound:\n", useCaseFound, "\n");
				this.templateItem = new TemplateItem(this, useCaseFound, '');
				this.templateItem.constructSelect();
				this.templateItem.sendToDbSelect();
			}
		}
	}
}

module.exports = {
    TemplateItem: TemplateItem
}
