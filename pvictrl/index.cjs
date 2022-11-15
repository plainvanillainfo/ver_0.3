const { Database } = require('./database.cjs');

class ServerMonitor {
    constructor(config) {
        this.config = config;
    }

    async start() {
        this.doHeartbeat(); 
    }

    doHeartbeat() {
        this.monitorAsConfigured();
        setTimeout(() => {
            this.doHeartbeat({}); 
       }, this.config.HeartbeatIntervalInMS);        
    }

    monitorAsConfigured() {
        this.config.Jobs.forEach(cur => {
            console.log(cur);
        });
    }
}

module.exports = {
    ServerMonitor: ServerMonitor
}
