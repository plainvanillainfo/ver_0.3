const { WebServer } = require('./webserver.cjs');

class BFF {
    constructor(parent) {
        this.parent = parent;
        this.database = this.parent.database;
        this.classes = null;
        this.users = {};
        this.entitlements = {};
        this.sessions = {};
        this.webServer = new WebServer(this);
    }

    async start(configWebAppServer) {
        console.log("BFF::start()");
        this.webServer.classes = this.classes;
        this.webServer.start(configWebAppServer);
    }

}

module.exports = {
    BFF: BFF
}
