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
                    if (message.Id != null && this.config.DML.Views[message.List] != null) {
                        let selectQuery = this.config.DML.Views[message.List].SelectQuery;
                        if (message.ParentId != null && message.ParentId > '') {
                            selectQuery = selectQuery.replace('PARENT_ID', message.ParentId);
                        }
                        this.sendToDbSelect(selectQuery, message.Id);
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
        let retVal = '';
        return retVal;
    }

    async sendToDbSelect(selectQuery, messageId) {
        console.log("Session::sendToDbSelect() - selectQuery:\n", selectQuery);
        await this.database.doSelect(selectQuery, this.receiveFromDb, messageId);
    }

    async receiveFromDb(result, messageId) {
        let dataItems = [];
		result.forEach(resultCur => {
			console.log("Session::receiveFromDb() - resultCur: ", JSON.stringify(resultCur));
			let dataItemCur = {
				...resultCur
			};
            dataItems.push(dataItemCur);
		});
        let messageOut = {
            Id: messageId, 
            Action: 'ReceiveRows', 
            Response: {
                meta: {
                    totalRowCount: dataItems.length
                },
                data: dataItems
            }

        };
        this.sendMessage(messageOut);
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
