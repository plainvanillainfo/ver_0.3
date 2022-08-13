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
        this.client.query(
            'SELECT * FROM public."AppConfig" ORDER BY "Param" ASC',
            (err, res) => {
            setConfigFromDB(res.rows);
        })
    }

    async getEntitlement(userId, sendEntitlement) {
        console.log("Database::getEntitlement()");
        this.client.query(
            'SELECT u."Id" as UserId, u."Name" as UserName, e."Id" as EntitlementId, e."UseCase" as UseCase, e."BaseObject" as BaseObject ' +
            'FROM public."FEUser" u, public."FEEntitlement" e ' +
            'WHERE u."Id" = \'' + userId + '\' AND u."Active" = TRUE AND e."UserId" = u."Id"', 
            (err, res) => {
            sendEntitlement(res.rows);
        })
    }
    
}

module.exports = {
    Database: Database
}
