const { Database } = require('../pvibe/database.cjs');
const { Application } = require('./applications.cjs');
const { Server } = require('./servers.cjs');

class ServerMonitor {
    constructor(config) {
        this.config = config;
        this.applications = [];
        this.servers = [];
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
        this.instructionsReceivedFromDB({Type: 'CreateClasses'});
    }

    instructionsReceivedFromDB(instructions) {
        switch (instructions.Type) {
            case 'CreateClasses':
                // Read json files
                let applicationName = 'CPL';
                let applicationCur = this.applications.find(cur => cur.Name === applicationName);
                if (applicationCur == null) {
                    applicationCur = new Application({
                        Name: applicationName,
                        Dir: '/home/ubuntu/projects/CPL/test3/meta/'
                    });
                    this.applications.push(applicationCur);
                }
                applicationCur.createClasses();
                break;
            case 'CreateUseCases':
                break;
            case 'ManageProcess':
                // Start/stop O/S process
                let serverName = '';
                let serverCur = this.servers.find(cur => cur.Name === serverName);
                if (serverCur == null) {
                    serverCur = new Server({Name: serverName});
                    this.servers.push(serverCur);
                }
                break;
        }
    }
}

module.exports = {
    ServerMonitor: ServerMonitor
}
