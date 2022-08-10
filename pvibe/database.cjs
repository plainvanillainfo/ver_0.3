const { Pool, Client } = require('pg')

class Database {
    constructor(parent, dbConfig) {
        this.parent = parent;
        //this.databaseDir = this.parent.appDir;
        //this.dbNameData = 'db_' + this.parent.appName;
        //this.dbHandle = null;
        //this.nextItemkey = null;
    }
    
    openDataDB() {
    }

    initializeDataDB(resolve) {
    }
    
}

module.exports = {
    Database: Database
}
