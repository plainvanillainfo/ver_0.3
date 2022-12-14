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
                        break;
                }
            }
        });
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
    FileExportNACHA: FileExportNACHA
}