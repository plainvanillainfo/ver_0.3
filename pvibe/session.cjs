const { TemplateItem } = require('./template.cjs');

class Session {
    constructor(parent, id, ws) {
        this.parent = parent;
        this.id = id;
        this.ws = ws;
        this.database = this.parent.database;
        this.user = null;
        this.isClosed = false;
        this.entitlement = null;
        this.trackMain = new TrackServer(this, '1');
        this.tracks = {'1': this.trackMain};
        this.receiveMessage = this.receiveMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.sendEntitlement = this.sendEntitlement.bind(this);
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
                case 'UpdateItem':
                    //this.model.putItem(this.model.itemSeed, message.Item);
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

    accessNode(nodePath) {
        console.log("Session::accessNode");
        let retVal = null;
        /*
        if (this.isClosed == false) {
            let trackCur = nodePath.shift();
            console.log("Session::accessNode - trackCur.id: ", trackCur.id);
            if (this.tracks[trackCur.id] != null) {
                retVal = trackCur.accessNode(nodePath);
            }
        }
        */
        return retVal;
    }

}

class TrackServer {
    constructor(parent, trackId) {
        this.parent = parent;
        this.id = trackId;
        this.session = this.parent;
        this.track = this;
        this.isClosed = false;
        this.dbPath = [];
        this.templateItemRoot = null;
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
    }

    fromClient(message) {
        console.log("TrackServer::fromClient(): ", message); //," this.session.entitlement.UseCases: ", this.session.entitlement.UseCases, " this.session.entitlement.Identity: ", this.session.entitlement.Identity);
        if (message.Action != null && message.TemplateItem != null) {
            if (this.templateItemRoot == null) {
                let useCaseFound = this.session.entitlement.UseCases.find(
                    useCaseCur => useCaseCur.Id === this.session.entitlement.Identity[0].UseCase);
                if (useCaseFound != null ) {
                    this.templateItemRoot = new TemplateItem(this, useCaseFound);
                }
            }
            switch (message.Action) {
                case 'ContinueTemplateItem':
                    this.templateItemRoot.fromClient(message.TemplateItem);
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

    getInitialMessage() {
        return({
            UseCaseSpec: this.templateItemRoot.useCase.spec,
            ItemSpec:  this.templateItemRoot.item.getItemSpec()
        })
    }

}

module.exports = {
    Session: Session
}
