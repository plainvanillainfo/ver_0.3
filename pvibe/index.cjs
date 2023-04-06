const { Database } = require('./database.cjs');
const { BFF } = require('./bff.cjs');
const { EngineRoom } = require('./engineroom.cjs');

/*
* The application's back end executable has code like this to run this code:
* 
* const { Backend } = require('plainvanillainfo/pvibe');
* process.on('uncaughtException', function (error) {
*    console.log(error.stack);
* });
*
* process.on('unhandledRejection', (reason, promise) => {
*     console.log('Unhandled Rejection at:', reason.stack || reason)
* })
*
* let appConfig = {
*     Name: 'APP', 
*     DB: {
*         User: 'postgres',
*         Host: 'localhost',
*         Database: 'JUNK',
*         Password: '*********',
*         Port: 8506,
*     }
* };
* let backendInstance = new Backend(appConfig);
* setTimeout(() => { backendInstance.start({}); }, 500);
* 
*/
class Backend {
    constructor(config) {
        console.log("Backend::constructor()");
        this.config = config;
        this.classes = null;
        this.users = {};
        this.entitlements = {};
        this.items = {};
        //this.sessions = {};
        process.on('exit', this.exitHandler);
        process.on('SIGTERM', this.exitHandler);
        process.on('SIGINT', this.exitHandler);     // catches ctrl+c event
        process.on('SIGUSR1', this.exitHandler);    // catches "kill pid" (for example: nodemon restart)
        process.on('SIGUSR2', this.exitHandler);
        process.on('uncaughtException', this.exitHandler);
        this.identity = null;
        this.executables = [];
        this.setConfigFromDB = this.setConfigFromDB.bind(this);
        this.database = new Database(this, this.config.DB);
        if  (config.Usage != null && config.Usage === 'Engines') {
            this.engineRoom = new EngineRoom(this, config);
        } else {
            this.bff = new BFF(this);
        }
    }

    async start() {
        console.log("Backend::start()");
        await this.database.openDataDB(this.setConfigFromDB);
    }

    async setConfigFromDB(configRows) {
        configRows.forEach(rowCur => {
            console.log(rowCur);
            switch (rowCur.Param) {
                case 'Identity':
                    this.identity = rowCur.Value;
                    break;
                case 'Executables':
                    this.executables = rowCur.Value;
                    break;
                case 'Classes':
                    this.classes = rowCur.Value;
                    break;
                default:
                    break;
            }
        });
        if (this.bff != null) {
            let webAppServer = this.executables.find(cur => cur.WebAppServer != null);
            if (webAppServer != null) {
                this.bff.classes = this.classes;
                this.bff.start(webAppServer.WebAppServer);
            }
        } else {
            this.engineRoom.classes = this.classes;
            this.engineRoom.start();
        }
    }
    
    async stop() {
        console.log("Backend::stop()");
    }

    exitHandler(err) {
    }

}

module.exports = {
    Backend
}