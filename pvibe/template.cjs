const { UseCaseItem, UseCaseList, UseCaseElem } = require('./usecase.cjs');

class TemplateItem {
    constructor(parent, useCase) {
        this.parent = parent;
        this.useCase = useCase;
        this.track = this.parent.track;
        this.session = this.parent.session;
        this.elems = {};
        this.key = null;
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
    }

    destroy() {
    }

    fromClient(message) {
        console.log("TemplateItem::fromClient(): ", message); //, "\nthis.useCase: ", this.useCase);
        if (message.Action != null) {
            switch (message.Action) {
                case 'ContinueTemplateElem':
                    if (message.TemplateElem != null && message.TemplateElem.UseCaseElemName != null) {
                        if(this.elems[message.TemplateElem.UseCaseElemName] == null) {
                            let useCaseElemFound = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === message.TemplateElem.UseCaseElemName);
                            if (useCaseElemFound != null) {
                                let templateElemNew = new TemplateElem(this, useCaseElemFound);
                                this.elems[message.TemplateElem.UseCaseElemName] = templateElemNew;
                            }
                        }
                        if (this.elems[message.TemplateElem.UseCaseElemName] != null) {
                            this.elems[message.TemplateElem.UseCaseElemName].fromClient(message.TemplateElem);
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    }

    toClient(messageIn) {
        let messageOut = {
            Action: 'ContinueTemplateItem',
            TemplateItem: {
                UseCaseName: this.useCase.Detail.Name,
                ItemId: this.key,
                ...messageIn
            }
        };
        this.parent.toClient(messageOut);
    }

}

class TemplateList {
    constructor(parent, useCase) {
        this.parent = parent;
        this.useCase = useCase;
        this.track = this.parent.track;
        this.session = this.parent.session;
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
        this.sendViewResultToClient = this.sendViewResultToClient.bind(this);
        this.requestViewFromDB('1=1');
    }

    fromClient(message) {
        console.log("TemplateList::fromClient(): ", message);
    }

    toClient(messageIn) {
        let messageOut = {
            Action: 'ContinueTemplateList',
            TemplateList: {
                UseCaseName: this.useCase.Detail.Name,
                ...messageIn
            }
        };
        this.parent.toClient(messageOut);
    }

    async requestViewFromDB(filter) {
        await this.session.database.getView(this.useCase.Detail.View, filter, this.sendViewResultToClient);
    }

    async sendViewResultToClient(result) {
        console.log(result);
        this.toClient({Items: result});
    }

}

class TemplateElem {
    constructor(parent, useCaseElem) {
        this.parent = parent;
        this.useCaseElem = useCaseElem;
        this.track = this.parent.track;
        this.session = this.parent.session;
        this.itemParent = parent.item;
        this.fromClient = this.fromClient.bind(this);
        this.toClient = this.toClient.bind(this);
    }

    fromClient(message) {
        console.log("TemplateElem::fromClient(): ", message, "\nthis.useCaseElem: ", this.useCaseElem);
        if (this.useCaseElem.Format != null) {
            switch (this.useCaseElem.Format) {
                case 'MenuOption':
                    if (this.useCaseElem.SubUseCase != null) {
                        let useCaseFound = this.session.entitlement.UseCases.find(useCaseCur => useCaseCur.Id === this.useCaseElem.SubUseCase);
                        if (useCaseFound != null) {
                            console.log("TemplateElem::fromClient() - useCaseFound: ", useCaseFound);
                            switch (useCaseFound.Detail.Format) {
                                case 'List':
                                    if (this.templateList == null) {
                                        this.templateList = new TemplateList(this, useCaseFound);
                                    } else {
                                        if (message.TemplateList != null) {
                                            this.templateList.fromClient(message.TemplateList);
                                        }
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    }

    toClient(messageIn) {
        let messageOut = {
            Action: 'ContinueTemplateElem',
            TemplateElem: {
                UseCaseElemName: this.useCaseElem.Name,
                ...messageIn
            }
        };
        this.parent.toClient(messageOut);
    }
}

module.exports = {
    TemplateItem: TemplateItem
}


/*

{
  "Name": "Communities",
  "Label": "Communities",
  "Format": "List",
  "View": "Communities",
  "Elems": [
    {
      "Name": "Id",
      "Label": "Id"
    },
    {
      "Name": "Name",
      "Label": "Name"
    },
    {
      "Name": "MgmtCompanyId",
      "Label": "Management Company"
    },
    {
      "Name": "Abbreviation",
      "Label": "Abbreviation"
    },
    {
      "Name": "Location",
      "Label": "Location"
    }
  ]
}

 SELECT "Community"."Id",
    "Community"."Name",
    "Community"."MgmtCompanyId",
    "Community"."Abbreviation",
    "Community"."Location"
   FROM "Community";
*/