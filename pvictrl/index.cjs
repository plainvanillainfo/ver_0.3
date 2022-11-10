const { Database } = require('./database.cjs');

class ServerMonitor {
    constructor(config) {
        this.config = config;
    }

    async start() {
        this.doHeartbeat(); 
    }

    doHeartbeat() {
        setTimeout(() => {
            this.doHeartbeat({}); 
       }, this.config.HeartbeatIntervalInMS);        
    }
}

module.exports = {
    ServerMonitor: ServerMonitor
}
