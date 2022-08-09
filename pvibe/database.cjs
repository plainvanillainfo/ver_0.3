class Database {
    constructor(parent, databaseDir) {
        this.parent = parent;
        this.databaseDir = databaseDir;
        this.dbNameData = 'db_' + this.parent.appName;
        this.dbHandle = null;
        this.nextItemkey = null;
    }
    
    openDataDB() {
    }

    initializeDataDB(resolve) {
    }
    
}

module.exports = {
    Database: Database
}
