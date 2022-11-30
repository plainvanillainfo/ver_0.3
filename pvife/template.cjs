const { TemplateItemClient, TemplateElemClient } = require('../pvibe/template_client.cjs');

class TemplateItem extends TemplateItemClient {
    constructor(parent, divItem) {
        super(parent);
        this.divItem = divItem;
    }

    renderUseCase() {
        console.log("TemplateItem::renderUseCase()");
    }
    
    renderDataItems() {
        console.log("TemplateItem::renderDataItems()");
        switch (this.useCase.Detail.Cardinality) {
            case 'Single':
                if (this.dataItems.length === 1) {
                    this.renderSingleDataItem(this.dataItems[0]);
                }
                break;
            case 'Multiple':
                this.renderMultipleDataItems(this.dataItems);
                break;
            default:
                break;
        }
    }

    renderSingleDataItem(dataItem) {
        switch (this.useCase.Detail.Flow) {
            case 'Parallel':
                switch (this.useCase.Detail.Rendering.Format) {
                    case 'Menu':
                        this.presentMenu(dataItem);
                        break;
                    case 'Radio':
                        break;
                    default:
                        break;
                }
                break;
            case 'Serial':
                switch (this.useCase.Detail.Rendering.Format) {
                    case 'Form':
                        break;
                    case 'Markup':
                        break;
                    default:
                        break;
                }
                break;
                break;
            default:
                break;
        }
    }

    renderMultipleDataItems(dataItems) {
    }

    presentMenu(dataItem) {
        console.log("TemplateItem::setUseCaseMenu");
        this.nav = document.createElement('nav');
        this.divItem.appendChild(this.nav);
        this.nav.className = 'navbar navbar-expand-md navbar-dark bg-primary';
        this.divNav = document.createElement('div');
        this.nav.appendChild(this.divNav);
        this.divNav.className = 'container-fluid';
        this.divMenuOptionPicked = document.createElement('div')
        this.divItem.appendChild(this.divMenuOptionPicked);
        this.divMenuOptionPicked.style.margin = '10px';
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
        this.useCase.Detail.Elems.forEach(menuItemCur => {
            let itemLICur = document.createElement('li');
            this.ulMenu.appendChild(itemLICur);
            itemLICur.Label = menuItemCur.Rendering.Label;
            itemLICur.className = 'nav-item';
            itemLICur.A = document.createElement('a');
            itemLICur.appendChild(itemLICur.A);
            itemLICur.A.className = 'nav-link';
            itemLICur.A.setAttribute("href", "#");
            itemLICur.A.appendChild(document.createTextNode(itemLICur.Label));
            itemLICur.A.addEventListener('click', (event) => {
                event.preventDefault();
                console.log("TemplateItem::setUseCaseMenu - click on menu item", menuItemCur);
                let useCaseElemPicked = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === menuItemCur.Name);
                let templateElemPicked = null;
                if (this.elems[menuItemCur.Name] == null) {
                    templateElemPicked = new TemplateElem(this, useCaseElemPicked, this.divMenuOptionPicked);
                    this.elems[menuItemCur.Name] = templateElemPicked;
                } else {
                    templateElemPicked = this.elems[menuItemCur.Name];
                }
                for (let elemCur in this.elems) {
                    let elemDetail = this.elems[elemCur];
                    if (elemDetail.useCaseElem != null && elemDetail.useCaseElem.Name !== menuItemCur.Name) {
                        elemDetail.hide();
                    }
                }
                templateElemPicked.show();
            });
        });
    }

}

class TemplateElem extends TemplateElemClient {
    constructor(parent, useCaseElem,  divItemParent) {
        super(parent, useCaseElem);
        this.divItemParent = divItemParent;
        this.divElem = document.createElement('div')
        this.divItemParent.appendChild(this.divElem);
        this.visible = false;

        this.divElem.appendChild(document.createTextNode(JSON.stringify(this.useCaseElem)));

    }

    show() {
        if (this.visible == false) {
            this.divElem.style.visibility = 'visible';
            this.divElem.style.display = 'block';
            this.visible = true;
        }
    }

    hide() {
        if (this.visible == true) {
            this.divElem.style.visibility = 'hidden';
            this.divElem.style.display = 'none';
            this.visible = false;
        }
    }

    destroy() {

    }
}

module.exports = {
    TemplateItem: TemplateItem
}
