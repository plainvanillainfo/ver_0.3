const { Pool, Client } = require('pg')

class Database {
    constructor(parent, dbConfig) {
        this.parent = parent;
        this.client = new Client({
            user: dbConfig.User,
            host: dbConfig.Host,
            database: dbConfig.Database,
            password: dbConfig.Password,
            port: dbConfig.Port
        })
    }
    
    openDataDB() {
        console.log("Database::openDataDB()");
        await this.client.connect();
        console.log("Database::openDataDB() - await returned");
    }
    
}

module.exports = {
    Database: Database
}
