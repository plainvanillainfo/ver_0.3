const { Session } = require('./session.cjs');
const fs = require("fs");
const express = require('express');
const https = require('https');
const http = require('http');
const WebSocket = require('ws');
const randomstring = require("randomstring");
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');

class WebServer {
    constructor(parent) {
        this.parent = parent;
        this.wsConnections = [];
        this.classes = null;
        this.startupTimeBufferMillisec = 1;
    }

    async start(configWebAppServer) {
        console.log("WebServer::start()", configWebAppServer);
        this.keyFileDir = configWebAppServer.KeyFileDir;
        setTimeout(() => { 
            this.startWebsocketListening(configWebAppServer.WebsocketListenPort);
        }, this.startupTimeBufferMillisec);
        setTimeout(() => { 
            this.startUploadListening(configWebAppServer.UploadListenPort, configWebAppServer.UploadDir);
        }, this.startupTimeBufferMillisec);
    }

    startWebsocketListening(portNumber) {
        console.log("WebServer - startWebsocketListening: ", portNumber);
        this.port = {};
        this.port.express = express();
        this.port.express.use(bodyParser.urlencoded({extended: true}));
        try {
            let privKeyFile = this.keyFileDir + 'privkey.pem';
            let certFile = this.keyFileDir + 'fullchain.pem';
            if (fs.existsSync(privKeyFile)) {
                this.port.listener = https.createServer({
                    key: fs.readFileSync(privKeyFile),
                    cert: fs.readFileSync(certFile)
                }, this.port.express);
            } else {
                this.port.listener = http.createServer({}, this.port.express);
            }                
            if (portNumber != null) {
                console.log("listening on port websocket: ", portNumber);        
                this.port.wss = new WebSocket.Server({ server: this.port.listener });
                this.port.wss.on(
                    'connection',
                    (ws) => {
                        console.log("WS connection started.");
                        ws.isAlive = true;
                        ws.on('pong', 
                            () => {
                                ws.isAlive = true;
                            }
                        );
                        ws.on('message',
                            (message) => {
                                var messageIn = JSON.parse(message);
                                this.onReceivedWebsocketMessage(ws, messageIn);
                            }
                        );
                        ws.on('close',
                            (e) => {
                                console.log("WS connection closed. " + JSON.stringify(e));
                                this.onReceivedConnectionClosed(ws);
                            }
                        );
                        ws.send(JSON.stringify({
                            Action: 'StartSession'
                        }));
                    }        
                );
                const intervalPing = setInterval(() => {
                    this.port.wss.clients.forEach((ws) => {
                        if (ws.isAlive === false) return ws.terminate();
                        ws.isAlive = false;
                        ws.ping(() => {});
                    });
                }, 30000);
                this.port.wss.on('close', () => {
                    clearInterval(intervalPing);
                });
            }
            this.port.listener.listen(portNumber);          
            console.log('listening on port: ', portNumber);
        } catch (err) {
            console.error("WebServer - startWebsocketListening - cert file exists: "+ err);
        }
    }

    onReceivedWebsocketMessage(wsIn, messageIn) {
        let sessionId;
        let sessionCur = null;
        let wsConnection = this.wsConnections.find( ({ ws }) => ws === wsIn );
        if (wsConnection === undefined) {
            var dateISO = new Date().toISOString();
            var dateString = dateISO[2]+dateISO[3] + dateISO[5]+dateISO[6] + dateISO[8]+dateISO[9] +
                dateISO[11]+dateISO[12] + dateISO[14]+dateISO[15] + dateISO[17]+dateISO[18];
            do {
                sessionId = dateString + randomstring.generate({length:20});
            } while (this.parent.sessions[sessionId] != null);
            sessionCur = new Session(this.parent, sessionId, wsIn);
            this.parent.sessions[sessionId] = sessionCur
            this.wsConnections.push({ws: wsIn, sessionId: sessionId});
        } else {
            if (this.parent.sessions[wsConnection.sessionId] != null) {
                sessionCur = this.parent.sessions[wsConnection.sessionId];
            }
        }
        if (sessionCur != null) {
            sessionCur.receiveMessage(messageIn);
        }
    }

    onReceivedConnectionClosed(wsIn) {
        let sessionCur = null;
        for (sessionCur in this.parent.sessions) {
            let sessionDetail = this.parent.sessions[sessionCur];
            if (sessionDetail != null && sessionDetail.ws === wsIn) {
                sessionDetail.close();
                break;
            }
        }
        if (sessionCur != null) {
            delete this.parent.sessions[sessionCur];
        }
    }

    startUploadListening(portNumber, uploadDir) {
        console.log("WebServer - startUploadListening: ", portNumber);
        this.portUpload = {};
        this.portUpload.express = express();
        this.portUpload.express.use(bodyParser.urlencoded({extended: true}));
        this.portUpload.express.use(fileUpload({useTempFiles: true, tempFileDir: '/tmp/'}));
        try {
            let privKeyFile = this.keyFileDir + 'privkey.pem';
            let certFile = this.keyFileDir + 'fullchain.pem';
            if (fs.existsSync(privKeyFile)) {
                this.portUpload.listener = https.createServer({
                    key: fs.readFileSync(privKeyFile),
                    cert: fs.readFileSync(certFile)
                }, this.portUpload.express);
            } else {
                this.portUpload.listener = http.createServer({}, this.portUpload.express);
            }                
            this.portUpload.listener.listen(portNumber);          
            console.log('listening on port: ', portNumber);
        } catch (err) {
            console.error("WebServer - startUploadListening - cert file exists: "+ err);
        }
            
        /* Post data and/or files */
        this.portUpload.express.post('/', (req, res) => {
            console.log("app.post /: ", req.body)
            let fileCount = 0;
            let fileCountMoved = 0;
            for (var fileCur in req.files) {
                fileCount++;
            }
            let retCode = '';
            for (var fileCur in req.files) {
                var fileDetail = req.files[fileCur];
                console.log("app.post / fileDetail: ", fileDetail);
                console.log("File: ", uploadDir + fileDetail.name);
                fileDetail.mv(uploadDir + fileDetail.name, (err) => {
                    if (err) {
                        console.log("fileDetail.mv err: ", err);
                        //return res.status(500).send(err);
                    } else {
                        fileCountMoved++;
                        retCode += ("Received: " + fileDetail.name, + " - Size: " + fileDetail.size + "\n");
                        if (fileCountMoved === fileCount) {
                            res.status(200).send(retCode);
                        }
                    }
                });                    
            }
        });
    }

}

module.exports = {
    WebServer: WebServer
}