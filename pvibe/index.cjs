const { Database } = require('./database.cjs');
const { BFF } = require('./bff.cjs');
const { EngineRoom } = require('./engineroom.cjs');

class Backend {
    constructor(appDir) {
        console.log("Backend::constructor()");
        this.appDir = appDir;
        this.config = null;
        this.serverConfig = null;
        this.users = {};
        this.entitlements = {};
        this.items = {};
        this.sessions = {};
        process.on('exit', this.exitHandler);
        process.on('SIGTERM', this.exitHandler);
        process.on('SIGINT', this.exitHandler);     // catches ctrl+c event
        process.on('SIGUSR1', this.exitHandler);    // catches "kill pid" (for example: nodemon restart)
        process.on('SIGUSR2', this.exitHandler);
        process.on('uncaughtException', this.exitHandler);
        this.database = new Database(this);
        this.bff = new BFF(this);
        this.engineRoom = new EngineRoom(this);
    }

    async start() {
        console.log("Backend::start()");
        //let databaseOpenedResult  = await this.model.database.openDataDB();
        //console.log(databaseOpenedResult);
        //this.webServer.start();
    }
    
    async stop() {
        console.log("Server::stop()");
    }

    exitHandler(err) {
    }

}

module.exports = {
    Backend
}