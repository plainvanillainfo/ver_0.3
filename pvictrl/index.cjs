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
        this.instructionsReceivedFromDB({Type: 'CreateUseCases'});
        this.instructionsReceivedFromDB({Type: 'CreateUsers'});
    }

    instructionsReceivedFromDB(instructions) {
        let applicationName = 'CPL';
        //let applicationName = 'IHC';
        let applicationCur;
        let serverName = '';
        let serverCur;
        let dir = '/home/ubuntu/projects/CPL/test3/meta/';
        //let dir = '/home/ubuntu/projects/IHC/test3/meta/';
        switch (instructions.Type) {
            case 'CreateClasses':
                // Read json files
                applicationCur = this.applications.find(cur => cur.Name === applicationName);
                if (applicationCur == null) {
                    applicationCur = new Application({
                        Name: applicationName,
                        Dir: dir
                    });
                    this.applications.push(applicationCur);
                }
                applicationCur.createClasses();
                this.classes = applicationCur.classes;
                break;
            case 'CreateUseCases':
                applicationCur = this.applications.find(cur => cur.Name === applicationName);
                if (applicationCur == null) {
                    applicationCur = new Application({
                        Name: applicationName,
                        Dir: dir
                    });
                    this.applications.push(applicationCur);
                }
                applicationCur.classes = this.classes;
                applicationCur.createUseCases();
                break;
            case 'CreateUsers':
                applicationCur = this.applications.find(cur => cur.Name === applicationName);
                if (applicationCur == null) {
                    applicationCur = new Application({
                        Name: applicationName,
                        Dir: dir
                    });
                    this.applications.push(applicationCur);
                }
                applicationCur.createUsers();
                break;
            case 'ManageProcess':
                // Start/stop O/S process
                serverCur = this.servers.find(cur => cur.Name === serverName);
                if (serverCur == null) {
                    serverCur = new Server({ Name: serverName });
                    this.servers.push(serverCur);
                }
                break;
        }
    }
}

module.exports = {
    ServerMonitor: ServerMonitor
}
