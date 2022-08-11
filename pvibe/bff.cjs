const { WebServer } = require('./webserver.cjs');
const { Session } = require('./session.cjs');

class BFF {
    constructor(parent) {
        this.parent = parent;
        this.users = {};
        this.entitlements = {};
        this.sessions = {};
        this.webServer = new WebServer(this);
    }

    async start(configWebAppServer) {
        console.log("BFF::start()");
        this.webServer.start(configWebAppServer);
    }

}

module.exports = {
    BFF: BFF
}