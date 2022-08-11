const { TemplateItem } = require('./template.cjs');

class Session {
    constructor(parent, id, ws) {
        this.parent = parent;
        this.id = id;
        this.ws = ws;
        this.user = null;
        this.isClosed = false;
        this.useCases = {};
        this.templateItemRoot = new TemplateItem(this);
        this.receiveMessage = this.receiveMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
    }
    
    receiveMessage(message) {
        console.log("\nSession::receiveMessage: ", message);
        /*
        if (message.AppId != null && message.Action != null) {
            console.log("\nSession::receiveMessage: ", message);
            switch (message.Action) {
                case 'SendViewerSpec':
                    let viewerSpecCur = this.parent.config.Executables.find(cur => cur.Name === message.AppId && cur.Type === 'Viewer');
                    if (viewerSpecCur != null) {
                        this.forwardMessage({Action: 'ReceiveViewerSpec', ViewerSpec: viewerSpecCur});
                    }
                    break;
                case 'SendEntitlement':
                    if (message.UserId != null && message.TrackId != null) {
                        if (this.model.users[message.UserId] != null) {
                            let entitlementCur = this.model.users[message.UserId].entitlements[0];
                            this.trackMain.setUseCase(this.model.useCases[entitlementCur.UseCase]);
                            this.trackMain.setItem(this.model.getItem(entitlementCur.ItemPath));
                            this.forwardMessage({
                                Action: 'ReceiveEntitlement',
                                TrackId: message.TrackId,
                                Track: this.trackMain.getInitialMessage(),
                                ClassesFileContent: this.model.classesFileContent,
                                UseCasesFileContent: this.model.useCasesFileContent
                            });
                        }
                    }
                    break;
                case 'ContinueTrack':
                    if (message.TrackId != null && message.Track != null && this.tracks[message.TrackId] != null) {
                        this.tracks[message.TrackId].fromClient(message.Track);
                    }
                    break;
                case 'UpdateItem':
                    this.model.putItem(this.model.itemSeed, message.Item);
                    break;
                default:
                    break;        

            }
        }
        */
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