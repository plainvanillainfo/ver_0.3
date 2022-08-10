const { WebServer } = require('./webserver.cjs');
const { Session } = require('./session.cjs');

class BFF {
    constructor(parent) {
        this.users = {};
        this.entitlements = {};
        this.sessions = {};
        this.webServer = new WebServer(this);
    }

    async start() {
        console.log("BFF::start()");
        this.webServer.start();
    }

}

module.exports = {
    BFF: BFF
}