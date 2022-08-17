const { UseCaseItem, UseCaseList, UseCaseElem } = require('./usecase.cjs');

class TemplateItem {
    constructor(parent, divTarget) {
        this.parent = parent;
        this.divTarget = divTarget;
        this.track = this.parent.track;
        this.elems = {};
        this.key = null;
        this.toServer = this.toServer.bind(this);
    }

    destroy() {
    }

    fromServer(message) {
        console.log("TemplateItem::fromServer(): ", message);
        if (message.Action != null) {
        }
    }

    toServer(messageIn) {
        let messageOut = {
            Action: 'ContinueTemplateItem',
            TemplateItem: {
                UseCaseName: this.useCase.Detail.Name,
                ItemId: this.key,
                ...messageIn
            }
        };
        this.parent.toServer(messageOut);
    }
    
    show() {
        this.divTarget.appendChild(document.createTextNode(JSON.stringify(this.useCase)));
    }
    
    hide() {
        let child = this.divTarget.lastChild;
        while (child) {
            this.divTarget.removeChild(child);
            child = this.divTarget.lastChild;
        }
    }
    
    setUseCase(useCase) {
        this.useCase = useCase;
        console.log("TemplateItem::setUseCase(): ", this.useCase);
        switch (this.useCase.Detail.Format) {
            case 'Menu':
                this.setUseCaseMenu();
                break;
            case 'Form':
                this.setUseCaseForm();
                break;
            default:
                break;
        }
    }

    setUseCaseMenu() {
        console.log("TemplateItem::setUseCaseMenu");
        this.nav = document.createElement('nav');
        this.divTarget.appendChild(this.nav);
        this.nav.className = 'navbar navbar-expand-md navbar-dark bg-primary';
        this.divNav = document.createElement('div');
        this.nav.appendChild(this.divNav);
        this.divNav.className = 'container-fluid';
        this.divTargetSub = document.createElement('div')
        this.divTarget.appendChild(this.divTargetSub);
        this.divTargetSub.style.margin = '10px';

        this.buttonCollapse = document.createElement('button');
        this.divNav.appendChild(this.buttonCollapse);
        this.buttonCollapse.className = 'navbar-toggler';
        this.buttonCollapse.setAttribute("type", "button");
        this.buttonCollapse.setAttribute("data-bs-toggle", "collapse");
        this.buttonCollapse.setAttribute("data-bs-target", "#menuContent");
        this.buttonCollapse.setAttribute("aria-controls", "menuContent");
        this.buttonCollapse.setAttribute("aria-expanded", "false");
        this.buttonCollapse.setAttribute("aria-label", "Toggle navigation");

        this.iconCollapse = document.createElement('span');
        this.buttonCollapse.appendChild(this.iconCollapse);
        this.buttonCollapse.className = 'navbar-toggler-icon';

        this.divMenu = document.createElement('div');
        this.divNav.appendChild(this.divMenu);
        this.divMenu.id = 'menuContent';
        this.divMenu.className = 'collapse navbar-collapse';

        this.ulMenu = document.createElement('ul');
        this.divMenu.appendChild(this.ulMenu);
        this.ulMenu.className = 'navbar-nav me-auto mb-2 mb-md-0';
        this.ulMenu.ItemLIs = [];
        this.useCase.Detail.Elems.forEach( (menuItemCur, menuItemIndex) => {
            let itemLICur;
            itemLICur = document.createElement('li');
            this.ulMenu.appendChild(itemLICur);
            itemLICur.Label = menuItemCur.Label;
            itemLICur.className = 'nav-item';
            this.ulMenu.ItemLIs.push(itemLICur);
            itemLICur.A = document.createElement('a');
            itemLICur.appendChild(itemLICur.A);
            itemLICur.A.className = 'nav-link';
            itemLICur.A.setAttribute("href", "#");
            itemLICur.A.appendChild(document.createTextNode(itemLICur.Label));
            itemLICur.A.addEventListener('click', (event) => {
                event.preventDefault();
                console.log("TemplateItem::setUseCaseMenu - click on menu item", menuItemCur);
                let elemPicked = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === menuItemCur.Name);
                if (this.elems[menuItemCur.Name] == null) {
                    this.elems[menuItemCur.Name] = new TemplateElem(this, elemPicked, this.divTargetSub, false);
                }
                for (let elemCur in this.elems) {
                    let elemDetail = this.elems[elemCur];
                    if (elemDetail.Name !== menuItemCur.Name) {
                        elemDetail.hide();
                    }
                }
                this.elems[menuItemCur.Name].show();
            });
        });
    }

    setUseCaseForm() {
        console.log("TemplateItem::setUseCaseForm");
    }

}

class TemplateList {
    constructor(parent, divTarget) {
        this.parent = parent;
        this.divTarget = divTarget;
        this.track = this.parent.track;
        this.elems = {};
        this.items = [];
        this.templateItems = [];
        this.toServer = this.toServer.bind(this);
    }

    destroy() {
    }

    fromServer(message) {
        console.log("TemplateList::fromServer(): ", message);
        if (message.Action != null) {
            /*
            switch (message.Action) {
                case 'ContinueTemplateSub':
                    if (this.templateSub != null && message.Template != null) {
                        this.templateSub.fromServer(message.Template);
                    }
                    break;
                case 'ContinueTemplate':
                    if (this.templateSub != null && message.Template != null) {
                        this.templateSub.fromServer(message.Template);
                    }
                    break;
                case 'AcceptDataList':
                    if (message.ItemList != null) {
                        this.setListFromServer(message.ItemList);
                    }
                    break;
                default:
                    break;
            }
            */
        }
    }

    toServer(messageIn) {
        let messageOut = {
            Action: 'ContinueTemplateList',
            TemplateList: {
                UseCaseName: this.useCase.Detail.Name,
                ...messageIn
            }
        };
        this.parent.toServer(messageOut);
    }
    
    show() {
        this.divTarget.appendChild(document.createTextNode(JSON.stringify(this.useCase)));
    }
    
    hide() {
        let child = this.divTarget.lastChild;
        while (child) {
            this.divTarget.removeChild(child);
            child = this.divTarget.lastChild;
        }
    }

    setUseCase(useCase) {
        this.useCase = useCase;
        console.log("TemplateList::setUseCase(): ", this.useCase);
        switch (this.useCase.Detail.Format) {
            case 'List':
                this.setUseCaseList();
                break;
            case 'PickList':
                this.setUseCasePickList();
                break;
            default:
                break;
        }
    }
    
    setUseCaseList() {
        let messageOut = {
            Action: 'StartTemplateList',
            TemplateElem: {
                UseCaseName: this.useCase.Detail.Name
            }
        };
        this.parent.toServer(messageOut);
    }
    
    setUseCasePickList() {
        let messageOut = {
            Action: 'StartTemplateList',
            TemplateElem: {
                UseCaseElemName: this.useCaseElem.spec.Name
            }
        };
        this.parent.toServer(messageOut);
    }

}

class TemplateElem {
    constructor(parent, useCaseElem, divTarget, isDrillDown) {
        this.parent = parent;
        this.useCaseElem = useCaseElem;
        this.divTarget = divTarget;
        this.isDrillDown = isDrillDown;
        this.track = this.parent.track;
        this.toServer = this.toServer.bind(this);
        if (this.isDrillDown) {
            // Do breadcrumb logic like ver_0.2 - TemplateElemWeb:: trigger() - case: Child
            this.track.div.appendChild(this.divTarget);
        } else {
            if (this.useCaseElem.SubUseCase != null) {
                this.subUseCase = this.track.parent.useCases.find(useCaseCur => useCaseCur.Detail.Name === this.useCaseElem.SubUseCase);
                switch (this.subUseCase.Detail.Format) {
                    case 'List':
                    case 'PickList':
                        this.templateList = new TemplateList(this, this.divTarget);
                        this.templateList.setUseCase(this.subUseCase);
                        break;
                    case 'Item':
                        this.templateItem = new TemplateItem(this, this.divTarget);
                        break;
                    default:
                        break;
                    
                }
            }
        }
    }

    destroy() {
        if (this.templateList != null) {
            this.templateList.destroy();
        }
        if (this.templateItem != null) {
            this.templateItem.destroy();
        }
    }

    fromServer(message) {
        console.log("TemplateElem::fromServer(): ", message);
        if (message.Action != null) {
        }
    }

    toServer(messageIn) {
        let messageOut = {
            Action: 'ContinueTemplateElem',
            TemplateElem: {
                UseCaseElemName: this.useCaseElem.Name,
                ...messageIn
            }
        };
        this.parent.toServer(messageOut);
    }
    
    show() {
        if (this.templateList != null) {
            this.templateList.show();
        }
        if (this.templateItem != null) {
            this.templateItem.show();
        }
    }
    
    hide() {
        if (this.templateList != null) {
            this.templateList.hide();
        }
        if (this.templateItem != null) {
            this.templateItem.hide();
        }
    }

}

module.exports = {
    TemplateItem: TemplateItem
}
