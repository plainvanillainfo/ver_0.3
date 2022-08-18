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

    async getEntitlement(messageIn, sendEntitlement) {
        console.log("Database::getEntitlement()");
        this.client.query(
            'SELECT "Id" as "Id", "Detail" as "Detail" FROM public."FEUseCase" WHERE 1=1 ', 
            (err, res) => {
            this.client.query(
                'SELECT u."Id" as "UserId", u."Name" as "UserName", e."Id" as "EntitlementId", e."UseCase" as "UseCase", e."BaseObject" as "BaseObject" ' +
                'FROM public."FEUser" u, public."FEEntitlement" e ' +
                'WHERE u."Id" = \'' + messageIn.UserId + '\' AND u."Active" = TRUE AND e."UserId" = u."Id"',
                (err1, res1) => {
                    sendEntitlement(messageIn, res.rows, res1.rows);
            });
        });
    }

    async getView(view, filter, sendViewResultToClient) {
        console.log("Database::getView()");
        this.client.query(
            'SELECT * FROM public."' + view + '" WHERE '+filter, 
            (err, res) => {
            sendViewResultToClient(res.rows);
        });
    }

}

module.exports = {
    Database: Database
}
