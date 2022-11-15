const { Database } = require('../pvibe/database.cjs');

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
            if (cur === 'AppLifeCycle') {
                this.queryDBForInstructions();
            }
        });
    }

    queryDBForInstructions() {

    }

    instructionsReceivedFromDB(instructions) {
        switch (instructions.Type) {
            case 'CreateClasses':
                break;
            case 'CreateUseCases':
                break;
        }
    }
}

module.exports = {
    ServerMonitor: ServerMonitor
}
