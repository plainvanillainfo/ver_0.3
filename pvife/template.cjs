const { UseCaseItem, UseCaseList, UseCaseElem } = require('./usecase.cjs');

class TemplateItem {
    constructor(parent, divTarget) {
        this.parent = parent;
        this.divTarget = divTarget;
        this.track = this.parent.track;
        this.elems = {};
        this.key = null;
    }

    destroy() {
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
                this.elems[menuItemCur.Name] = new TemplateElem(this, elemPicked, this.divTargetSub, false);
                //this.elems[menuItemCur.Name].initiateTrigger();
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
    }
    
    destroy() {
    }

    setUseCase(useCase) {
        this.useCase = useCase;
        console.log("TemplateList::setUseCase(): ", this.useCase);
        this.divTarget.appendChild(document.createTextNode(JSON.stringify(this.useCase)));
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
    }
    
    setUseCasePickList() {
    }

}

class TemplateElem {
    constructor(parent, useCaseElem, divTarget, isDrillDown) {
        this.parent = parent;
        this.useCaseElem = useCaseElem;
        this.divTarget = divTarget;
        this.isDrillDown = isDrillDown;
        this.track = this.parent.track;
        if (this.isDrillDown) {
            // Do breadcrumb logic liek ver_0.2 - TemplateElemWeb:: trigger() - case: Child
            this.track.div.appendChild(this.divTarget);
        } else {
            /*
            let child = this.divTarget.lastChild;
            while (child) {
                this.divTarget.removeChild(child);
                child = this.divTarget.lastChild;
            }
            */
            //this.divTarget.appendChild(document.createTextNode(JSON.stringify(this.useCaseElem)));
            if (this.useCaseElem.SubUseCase != null) {
                this.subUseCase = this.track.parent.useCases.find(useCaseCur => useCaseCur.Detail.Name === this.useCaseElem.SubUseCase);
                //this.divTarget.appendChild(document.createTextNode(JSON.stringify(this.subUseCase)));
                switch (this.subUseCase.Format) {
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

}

module.exports = {
    TemplateItem: TemplateItem
}
