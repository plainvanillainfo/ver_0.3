const { TemplateItem } = require('./template.cjs');

class Session {
    constructor(parent, id, ws) {
        this.parent = parent;
        this.config = this.parent.config;
        this.id = id;
        this.ws = ws;
        this.database = this.parent.database;
        this.classes = this.parent.classes;
        this.user = null;
        this.isClosed = false;
        this.entitlement = null;
        this.trackMain = new Track(this, '1');
        this.tracks = {'1': this.trackMain};
        this.dataTree = {};
        this.receiveMessage = this.receiveMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.sendEntitlement = this.sendEntitlement.bind(this);
        this.receiveFromDb = this.receiveFromDb.bind(this);

    }
    
    async receiveMessage(message) {
        if (message.AppId != null && message.Action != null) {
            console.log("\nSession::receiveMessage: ", message);
            switch (message.Action) {
                case 'SendViewerSpec':
                    let webAppCur = this.parent.parent.executables.find(cur => cur.Name === message.AppId);
                    if (webAppCur != null && webAppCur.WebAppClient != null) {
                        this.sendMessage({Action: 'ReceiveViewerSpec', ViewerSpec: webAppCur.WebAppClient});
                    }
                    break;
                case 'SendEntitlement':
                    if (message.UserId != null) {
                        await this.database.getEntitlement(message, this.sendEntitlement);
                    }
                    break;
                case 'ContinueTrack':
                    if (message.TrackId != null && message.Track != null && this.tracks[message.TrackId] != null) {
                        this.tracks[message.TrackId].fromClient(message.Track);
                    }
                    break;
                case 'FetchRows':
                    if (message.Id != null) {
                        console.log("this.config.DML", this.config.DML);
                        console.log("this.config.FeReactAppContext.MenuItems", this.config.FeReactAppContext.MenuItems);

                        this.sendMessage({
                            Id: message.Id, 
                            Action: 'ReceiveRows', 
                            Response: {
                                meta: {
                                    totalRowCount: 2
                                },
                                data: [
                                    {
                                        Id: 1,
                                        Name: 'Couuminity 1'
                                    },
                                    {
                                        Id: 2,
                                        Name: 'Couuminity 2'
                                    }
                                ]
                            }
                        });
                    }
                    break;
                default:
                    break;        

            }
        }
    }
    
    sendMessage(messageIn) {
        //console.log("Session::sendMessage ");
        if (this.ws != null) {
            let messageOut = {
                SessionId: this.id,
                ...messageIn
            };
            this.ws.send(JSON.stringify(messageOut));
        }
    }
    
    close() {
        console.log("Session::close: ", this.id);
        this.isClosed = true;
    }

    async sendEntitlement(messageIn, useCasesRaw, entitlementsRaw) {
        this.entitlement = {UseCases: useCasesRaw, Identity: entitlementsRaw};
        console.log("Session::sendEntitlement: ", this.entitlement);
        this.sendMessage({
            Action: 'ReceiveEntitlement',
            TrackId: messageIn.TrackId,
            Entitlement: this.entitlement
        });
    }

	constructSelect() {
		console.log("Session::constructSelect():");
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
			//this.selectWhere += (' "' + this.tableBase['ParentToThisLinkTableName'] + '"."ParentId" = \'' + this.parent.itemParent.Key + '\' AND ');
			this.selectWhere += (' "' + this.tableBase['ParentToThisLinkTableName'] + '"."ParentId" = \'' + this.parent.itemParent.Key + '\'');
			this.tableBase['WhereJoins'].push({
				TableLeft: this.tableBase['ParentToThisLinkTableName'],
				ColumnLeft: 'ChildId', 
				TableRight: this.tableBase['Name'],
				ColumnRight: 'Id'
			});
		} else {
			if (this.soleKey != null && this.soleKey !== '') {
				this.selectWhere +=  ('"'+ this.tableBase['Name'] + '"."Id"=\'' + this.soleKey + '\'');
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
		if (this.tableBase['WhereJoins'].length > 0) {
			this.selectWhere += ' AND ';
		}
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

    async sendToDbSelect() {
        await this.session.database.doSelect(this.selectQuery, this.receiveFromDb);
    }

    async receiveFromDb(result) {
        let dataItems = [];
		result.forEach(resultCur => {
			console.log("Session::receiveFromDb() - resultCur:\n", resultCur);
			let dataItemCur = {
				Key: resultCur.Id,
				Attrs: {...resultCur}
			};
            dataItems.push(dataItemCur);

            /*
			if (this.itemList[dataItemCur.Key] == null) {
				console.log("receiveFromDb - this.itemList[dataItemCur.Key] == null");
				this.itemList[dataItemCur.Key] = {Key: dataItemCur.Key, Elems: {}, TemplateItemDrilldown: null};
			} else {
				console.log("receiveFromDb - this.itemList[dataItemCur.Key] != null");
			}
            */

		});
		if (true) {
	        this.toClient(messageOut);
		}
    }

    toClient(messageIn) {
        let messageOut = {
            Action: 'ContinueTrack',
            TrackId: this.id,
            Track: {
                ...messageIn
            }
        };
        this.sendMessage(messageOut);
    }

}

class Track {
    constructor(parent, trackId) {
        this.parent = parent;
        this.id = trackId;
        this.session = this.parent;
        this.classes = this.parent.classes;
        this.track = this;
        this.isClosed = false;
        this.dbPath = [];
        this.templateItemRoot = null;
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
    }

    fromClient(message) {
        console.log("Track::fromClient(): ", message);
        if (message.Action != null && message.TemplateItem != null) {
            if (this.templateItemRoot == null) {
                let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.session.entitlement.Identity[0].UseCase);
                if (useCaseFound != null ) {
                    this.templateItemRoot = new TemplateItem(this, useCaseFound, this.session.entitlement.Identity[0].BaseObject);
                }
            }
            switch (message.Action) {
                case 'ContinueTemplateItem':
					if (this.templateItemRoot != null) {
						this.templateItemRoot.fromClient(message.TemplateItem);
					}
                    break;
                default:
                    break;
            }
        }
    }

    toClient(messageIn) {
        let messageOut = {
            Action: 'ContinueTrack',
            TrackId: this.id,
            Track: {
                ...messageIn
            }
        };
        this.parent.sendMessage(messageOut);
    }

}

module.exports = {
    Session: Session
}
