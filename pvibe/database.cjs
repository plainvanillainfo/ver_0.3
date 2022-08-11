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
    
    async openDataDB(setConfigFromDB) {
        console.log("Database::openDataDB()");
        await this.client.connect();
        console.log("Database::openDataDB() - await returned");

        this.client.query('SELECT * FROM public."AppConfig" ORDER BY "Param" ASC', (err, res) => {
            console.log(err, res)
            console.log(res.rows[0].Value)
            console.log(res.rows[1].Value)
            this.client.end()
        })
    }
    
}

module.exports = {
    Database: Database
}
