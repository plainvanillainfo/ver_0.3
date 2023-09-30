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
        this.client.on('error', (err) => {
            console.error("Database::openDataDB() - client.on('error')", err.stack)
        })
        this.client.query(
            'SELECT * FROM functionality."AppConfig" ORDER BY "Param" ASC',
            (err, res) => {
            setConfigFromDB(res.rows);
        })
    }

    async openDataDBStartClient(clientConnectedToDB) {
        console.log("Database::openDataDBStartClient()");
        await this.client.connect();
        console.log("Database::openDataDBStartClient() - await returned");
        this.client.on('error', (err) => {
            console.error("Database::openDataDBStartClient() - client.on('error')", err.stack)
            clientConnectedToDB(false);
        });
        clientConnectedToDB(true);
    }

    async getEntitlement(messageIn, sendEntitlement) {
        //console.log("Database::getEntitlement()");
        this.client.query(
            'SELECT "Id" as "Id", "Detail" as "Detail" FROM functionality."UseCases" WHERE 1=1 ', 
            (err, res) => {
                if (err) {
                } else {
                    this.client.query(
                        'SELECT u."Id" as "UserId", u."Name" as "UserName", e."Id" as "EntitlementId", e."UseCase" as "UseCase", e."BaseObject" as "BaseObject" ' +
                        'FROM authorizations."Users" u, authorizations."Entitlements" e ' +
                        'WHERE u."Id" = \'' + messageIn.UserId + '\' AND u."Active" = TRUE AND e."UserId" = u."Id"',
                        (err1, res1) => {
                            if (err1) {
                            } else {
                                sendEntitlement(messageIn, res.rows, res1.rows);
                            }
                        });
                }
        });
    }

    async doSelect(query, doneSelect, messageId) {
        console.log("Database::doSelect() - query: ", query);
        this.client.query(
            query, 
            (err, res) => {
                if (err) {
                } else {
                    doneSelect(res.rows, messageId);
                }
        });
    }

    async doListen(channel, notifyListener) {
        let query = 'LISTEN record_changed';
        console.log("Database::setWatch() - query: ", query);
        this.client.query(query);
        this.client.on('notification', msg => {
            //console.log(msg.processId) // pid
            //console.log(msg.channel) // foo
            //console.log(msg.payload) // bar!
            notifyListener(msg);
          }
        )        
    }

    async doUpdate(query, doneUpdate) {
        console.log("Database::putData() - query: ", query);
        this.client.query(
            query, 
            (err, res) => {
                if (err) {
                } else {
                    doneUpdate(res.rows);
                }
        });
    }

    async doInsert(query, doneInsert) {
        console.log("Database::addData() - query: ", query);
        this.client.query(
            query, 
            (err, res) => {
                if (err) {
                } else {
                    doneInsert(res.rows);
                }
        });
    }

}

module.exports = {
    Database: Database
}
