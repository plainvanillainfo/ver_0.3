const { WebServer } = require('./webserver.cjs');
const { Session } = require('./session.cjs');

class BFF {
    constructor(parent) {
        this.users = {};
        this.entitlements = {};
        this.sessions = {};
    }

}

module.exports = {
    BFF: BFF
}