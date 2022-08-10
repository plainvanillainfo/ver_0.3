const { TemplateItem } = require('./template.cjs');

class Transmitter {
    constructor() {
        this.websocketBE = null;
        this.websocketBEIsActive = false;
        this.sessionId = null;
    }
    
    startSessionServer(parent, url) {
        this.parent = parent;
        this.websocketBE = new WebSocket(url);
        setTimeout(() => { this.keepAlive(); }, 30000);
        this.websocketBE.onopen = () => {
            this.websocketBEIsActive = true;
            console.log("Websocket opened");
        };
        this.websocketBE.onclose = (e) => {
            this.websocketBEIsActive = false;
            var reason = 'Unknown error';
            switch(e.code) {
                case 1000:
                  reason = 'Normal closure';
                  break;
                case 1001:
                  reason = 'An endpoint is going away';
                  break;
                case 1002:
                  reason = 'An endpoint is terminating the connection due to a protocol error.';
                  break;
                case 1003:
                  reason = 'An endpoint is terminating the connection because it has received a type of data it cannot accept';
                  break;
                case 1004:
                  reason = 'Reserved. The specific meaning might be defined in the future.';
                  break;
                case 1005:
                  reason = 'No status code was actually present';
                  break;
                case 1006:
                  reason = 'The connection was closed abnormally';
                  break;
                case 1007:
                  reason = 'The endpoint is terminating the connection because a message was received that contained inconsistent data';
                  break;
                case 1008:
                  reason = 'The endpoint is terminating the connection because it received a message that violates its policy';
                  break;
                case 1009:
                  reason = 'The endpoint is terminating the connection because a data frame was received that is too large';
                  break;
                case 1010:
                  reason = 'The client is terminating the connection because it expected the server to negotiate one or more extension, but the server didn\'t.';
                  break;
                case 1011:
                  reason = 'The server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.';
                  break;
                case 1012:
                  reason = 'The server is terminating the connection because it is restarting';
                  break;
                case 1013:
                  reason = 'The server is terminating the connection due to a temporary condition';
                  break;
                case 1015:
                  reason = 'The connection was closed due to a failure to perform a TLS handshake';
                  break;
                default:
                  break;
            }

            // Show 'closed' message on screen
            console.log("Websocket close error: " + reason);
        };
        this.websocketBE.onmessage = (evt) => {
            //console.log("Transmitter::onmessage: ", evt.data);
            var messageInParsed = JSON.parse(evt.data);
            if (messageInParsed.SessId != null) {
                if (this.sessionId == null) {
                    this.sessionId = messageInParsed.SessId;
                    this.parent.receivedFromServer(messageInParsed);
                } else {
                    if (messageInParsed.SessionId === this.SessId) {
                        this.parent.receivedFromServer(messageInParsed);
                    }
                }
            } else {
                this.parent.receivedFromServer(messageInParsed);
            }
        };
        this.websocketBE.onerror = (ev) => {
            console.log("Websocket open error: " + ev.data);
        }
    }

    keepAlive() {
        this.sendMessageToBE('{}'); 
        setTimeout(() => { this.keepAlive(); }, 30000);
    }
    
    sendMessageToBE(message) {
        if (this.websocketBEIsActive === true) {
            this.websocketBE.send(message);
        }
    }

}

class ClientWeb {
    constructor(parent, name) {
        this.name = name;
        this.templateItemRoot = new TemplateItem(this);
    }

    setViewerSpec(viewerSpec) {
        console.log("ClientWeb::setViewerSpec()");
    }

    setEntitlement(useCase, dataPat) {
        console.log("ClientWeb::setEntitlement()");
    }
    
    checkUserAuthentication() {
        if (this.parent.transmitter.websocketBEIsActive === true) {
            this.isAuthenticated = false;
            if (document.location.hash != null) {
                let cognitoData = {};
                let elementsString = decodeURIComponent(document.location.hash.substr(1, document.location.hash.length));
                let params = elementsString.split("&");
                for (let param of params) {
                    let values = param.split("=");
                    cognitoData[values[0]] = values[1];
                }
                if (cognitoData["id_token"] != null) {
                    let idDecoded = this.jwt_parse(cognitoData["id_token"]);
                    this.userId = idDecoded.email.toLowerCase();
                    this.isAuthenticated = true;
                }
            }
            this.setUserAccess();
        } else {
            setTimeout(() => { this.checkUserAuthentication(); }, 50);
        }
    }

    jwt_parse(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }

    setUserAccess() {
        if (this.isAuthenticated === true) {
            this.elementSignIn.style.visibility = 'hidden';
            this.elementSignIn.style.display = 'none';
            this.elementSignOut.style.visibility = 'visible';
            this.elementSignOut.style.display = 'inline';
            this.initiateTracks();
        } else {
            this.elementSignIn.style.visibility = 'visible';
            this.elementSignIn.style.display = 'inline';
            this.elementSignOut.style.visibility = 'hidden';
            this.elementSignOut.style.display = 'none';
            this.terminateTracks();
        }
    }

}

module.exports = {
    Transmitter,
    ClientWeb
}