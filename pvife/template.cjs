const { UseCaseItem, UseCaseList, UseCaseElem } = require('./usecase.cjs');

class TemplateItem {
    constructor(parent, divTarget) {
        this.parent = parent;
        this.divTarget = divTarget;
        this.UseCaseItem = null;
    }
    
    setUseCase(useCase) {
        this.useCase = useCase;
        console.log("TemplateItem::setUseCase(): ", this.useCase);
        switch (this.useCase.Details.Format) {
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
        this.useCase.Details.Elems.forEach( (menuItemCur, menuItemIndex) => {
            let itemLICur;
            /*
            if (menuItemCur.Viewers[0].ViewerSpec.MenuGroup != null) {
                itemLICur = this.ulMenu.ItemLIs.find(cur => cur.Label === menuItemCur.Viewers[0].ViewerSpec.MenuGroup[0]);
                if (itemLICur == null) {
                    itemLICur = document.createElement('li');
                    this.ulMenu.appendChild(itemLICur);
                    itemLICur.Label = menuItemCur.Viewers[0].ViewerSpec.MenuGroup[0];
                    itemLICur.GroupElems = [];
                    itemLICur.className = 'nav-item';
                    this.ulMenu.ItemLIs.push(itemLICur);
                    itemLICur.A = document.createElement('a');
                    itemLICur.appendChild(itemLICur.A);
                    itemLICur.A.className = 'nav-link';
                    itemLICur.A.setAttribute("href", "#");
                    itemLICur.A.appendChild(document.createTextNode(itemLICur.Label));
                    itemLICur.A.addEventListener('click', (event) => {
                        event.preventDefault();
                        console.log("TemplateWeb::setUseCaseMenu - click on menu item", itemLICur);
                        alert(JSON.stringify(itemLICur.GroupElems));

                        //
                        // HERE: Present a recursive Form
                        //
                        this.elems[itemLICur.Label] = new CompositeElenWeb(this);

                    });
                }
                itemLICur.GroupElems.push({Name: menuItemCur.Name});
            } else {
                */
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
                    //let elemPicked = this.useCase.elems[menuItemCur.Name];
                    //this.elems[menuItemCur.Name] = new TemplateElemWeb(this, elemPicked, false, this.divTargetSub);
                    //this.elems[menuItemCur.Name].initiateTrigger();
                });
                
            //}
        });
    }

    setUseCaseForm() {
        console.log("TemplateItem::setUseCaseForm");
    }

}

class TemplateList {
    constructor(parent) {
        this.UseCaseList = null;
    }

}

class TemplateElem {
    constructor(parent) {
        this.UseCaseElem = null;
    }

}

module.exports = {
    TemplateItem: TemplateItem
}
