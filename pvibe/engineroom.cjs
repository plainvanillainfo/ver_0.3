const WebSocket = require('ws');
const { TemplateItemClient, TemplateElemClient } = require('./template_client.cjs');
const { Nacha } = require('./engine_nacha.cjs');

class EngineRoom {
    constructor(parent, config) {
        this.parent = parent;
        this.config = config;
        this.engines = [];
    }

    async start() {
        console.log("EngineRoom::start()");
        this.parent.executables.forEach(executableCur => {
            if (executableCur.Type != null && executableCur.Type === 'Engine' && executableCur.Name != null) {
                let customCode = null;
                if (this.config.EngineCustomCode != null && this.config.EngineCustomCode[executableCur.Name] != null) {
                    customCode = this.config.EngineCustomCode[executableCur.Name];
                }
                switch (executableCur.Name) {
                    case 'SecApiIoInterface':
                        this.engines[executableCur.Name] = new RESTApiSession(this, executableCur, customCode);
                        break;
                    case 'SecEdgarInterface':
                        this.engines[executableCur.Name] = new FileFetch(this, executableCur, customCode);
                        break;
                    case 'TwilioInterface':
                        this.engines[executableCur.Name] = new RESTApiSession(this, executableCur, customCode);
                        break;
                    case 'NACHAFileGeneration':
                        this.engines[executableCur.Name] = new FileExportNACHA(this, executableCur, customCode);
                        break;
                    default:
                        this.engines[executableCur.Name] = new ClientEngine(this, executableCur.Name);
				        this.hostname = '';
				        this.websocketPort = this.config.WebsocketListenPort.toString();
				        this.websocketProtocol = 'wss';
				        this.transmitter = new Transmitter();
				        this.transmitter.startSessionServer(this, this.websocketProtocol+ '://' + this.hostname + ':' + this.websocketPort);
                        break;
                }
            }
        });
    }

}

class Transmitter {
    constructor(parent) {
        this.parent = parent;
        this.websocketBE = null;
        this.websocketBEIsActive = false;
        this.sessionId = null;
    }
    
    startSessionServer(url) {
        this.websocketBE = new WebSocket(url, [], {rejectUnauthorized: false});
        this.websocketBE.on('open', () => {
            this.websocketBEIsActive = true;
            console.log("Websocket opened");
            setTimeout(() => { this.keepAlive(); }, 30000);
        });
        this.websocketBE.on('ping', () => {
            clearTimeout(this.pingTimeout);
            setTimeout(() => { this.keepAlive(); }, 30000);
        });
        this.websocketBE.on('close', (e) => {
            this.websocketBEIsActive = false;
            console.log("Websocket closed: ", e);
            clearTimeout(this.pingTimeout);
        });
        this.websocketBE.on('message', (data) => {
            //console.log("Transmitter::websocketBE - data: ", data.toString());
            var messageInParsed = JSON.parse(data);
            if (messageInParsed.SessionId != null) {
                if (this.sessionId == null) {
                    this.sessionId = messageInParsed.SessionId;
                        this.parent.receivedFromServer(messageInParsed);
                } else {
                    if (messageInParsed.SessionId === this.sessionId) {
                        this.parent.receivedFromServer(messageInParsed);
                    }
                }
            } else {
                this.parent.receivedFromServer(messageInParsed);
            }
        });
        this.websocketBE.on('error', (e) => {
            console.log("Websocket open error: " + e);
        });
    }
    
    sendMessageToBE(message) {
        if (this.websocketBEIsActive === true) {
            this.websocketBE.send(message);
        } else {
            // TBD: Restart session if necessary
            console.log("Transmitter::sendMessageToBE - this.websocketBEIsActive !== true");
        }
    }
    
    keepAlive() {
        this.websocketBE.send('{}');
        this.pingTimeout = setTimeout(() => { this.keepAlive(); }, 30000 + 1000);
    }    
}

class ClientEngine {
    constructor(parent, name) {
        this.parent = parent;
        this.name = name;
        this.appConfig = parent.appConfig;
        this.tracks = {};
        this.useCases = null;
        this.fromServer = this.fromServer.bind(this);
        this.toServer = this.toServer.bind(this);
    }

    fromServer(message) {
        console.log("ClientEngine::fromServer(): ", message);
        switch (message.Action) {
            case 'StartSession':
                this.toServer({Action: 'SendViewerSpec'});
                break;
            case 'ReceiveViewerSpec':
                this.setViewerSpec(message.ViewerSpec);
                break;
            case 'ReceiveEntitlement':
                this.setEntitlement(message.Entitlement);
                break;
            case 'ContinueTrack':
                if (message.TrackId != null && message.Track != null && this.tracks[message.TrackId] != null) {
                    this.tracks[message.TrackId].fromServer(message.Track);
                }
                break;
            default:
                break;        
        }
    }

    toServer(messageIn) {
        this.parent.sendToServer(messageIn);
    }

    setViewerSpec(viewerSpec) {
        console.log("ClientEngine::setViewerSpec()");
        //if (viewerSpec.DriverUseCase != null) {
        //    this.driverUseCase = viewerSpec.DriverUseCase;
        //}
        //this.checkUserAuthentication();
    }

    setEntitlement(trackId, template, classesFileContent, useCasesFileContent) {
        console.log("ClientEngine::setEntitlement()");
        //super.setEntitlement(trackId, template, this.name, classesFileContent, useCasesFileContent);
        //this.initializeClasses(classesFileContent, viewerName);
        //this.initializeUseCases(useCasesFileContent, viewerName);
        //this.tracks[trackId].setUseCase(this.useCases[track.UseCaseSpec.Name]);        
    }
    
    checkUserAuthentication() {
        this.userId = 'DefaultEngine';
        this.isAuthenticated = true;
        this.setUserAccess();
    }

    setUserAccess() {
        if (this.isAuthenticated === true) {
            this.initiateTracks();
        } else {
            this.terminateTracks();
        }
    }

    initiateTracks() {
        let trackFirst = new Track(this, '1', divTrackNew);
        this.tracks[trackFirst.id] = trackFirst;
        this.toServer({
            Action: 'SendEntitlement',
            TrackId: trackFirst.id,
            UserId: this.userId
        });
    }

    terminateTracks() {
    }

}

class Track {
    constructor(parent, trackId) {
        this.parent = parent;
        this.id = trackId;
	}

    fromServer(message) {
        console.log("Track::fromServer(): ", message);
        if (message.Action != null && message.TemplateItem != null) {
            switch (message.Action) {
                case 'ContinueTemplateItem':
                    this.templateItemRoot.fromServer(message.TemplateItem);
                    break;
                default:
                    break;
            }
        }
    }

    toServer(messageIn) {
        let messageOut = {
            TrackId: this.id,
            Action: 'ContinueTrack',
            Track :{
                ...messageIn
            }
        };
        this.parent.toServer(messageOut);
    }

    setRoot(useCase, dataItems) {
        console.log("Track::setRoot()");
        this.templateItemRoot = new TemplateItem(this, useCase, this.divItem);
        this.templateItemRoot.setDataItems(dataItems);
    }
	
}

class TemplateItem extends TemplateItemClient {
    constructor(parent, useCase, divItemSurrounding) {
        super(parent, useCase);
	}
	
}

class ChildProcess {
    constructor(parent) {
    }
}

class RESTApiSession {
    constructor(parent, spec, customCode) {
        this.parent = parent;
        this.spec = spec;
        this.customCode = customCode;
    }
}

class FileTransfer {
    constructor(parent, customCode) {
        this.parent = parent;
        this.spec = spec;
        this.customCode = customCode;
    }
}

class FileFetch {
    constructor(parent) {
    }
}

class FileImport {
    constructor(parent) {
    }
}

class FileImportCSV {
    constructor(parent) {
    }
}

class FileImportPDF {
    constructor(parent) {
    }
}

class FileImportHTML {
    constructor(parent) {
    }
}

class FileImportXML {
    constructor(parent) {
    }
}

class FileExportNACHA {
    constructor(parent, spec, customCode) {
        this.parent = parent;
        this.spec = spec;
        this.customCode = customCode;
        setTimeout(() => { this.customCode({Action: 'Start', EngineInstance: this}); }, 1);
    }

    startNachaFile() {
        let nacha = Nacha({
            destinationRouting: destinationRouting,
            destinationName: destinationName,
            immediateOrigin: immediateOrigin,
            immediateOriginName: 'IHC',
            companyName: 'IHC',
            //companyIdentification: '1861470447',
            fileCreationDate: effectiveEntryDate,
            fileCreationTime: '1304',
            fileId: 'A'
        });        
    }
}

module.exports = {
    EngineRoom: EngineRoom,
    ClientEngine: ClientEngine,
    FileExportNACHA: FileExportNACHA
}
