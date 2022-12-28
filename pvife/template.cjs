const { TemplateItemClient, TemplateElemClient } = require('../pvibe/template_client.cjs');

class TemplateItem extends TemplateItemClient {
    constructor(parent, useCase, divItem) {
        super(parent, useCase);
        this.divItem = divItem;
    }
    
    continueTemplateElem(message) {
        console.log("TemplateItem::continueTemplateElem");
        if (message.UseCaseElemName != null) {
            console.log(message.TemplateItem, "\n",this.dataItems);
            let dataItemParent = message.TemplateItem.ParentKey != null ? this.dataItems.find(cur => cur.Key === message.TemplateItem.ParentKey) : this.dataItems[0];
            if (this.elemDataItems[dataItemParent.Key] == null) {
                this.elemDataItems[dataItemParent.Key] = {};
            }
            if (this.elemDataItems[dataItemParent.Key][message.UseCaseElemName] == null) {
                let useCaseElemCur = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === message.UseCaseElemName);
                let templateElemNew = new TemplateElem(this, dataItemParent, null, useCaseElemCur, this.divItem);
                this.elemDataItems[dataItemParent.Key][message.UseCaseElemName] = templateElemNew;
            }
            if (this.elemDataItems[dataItemParent.Key][message.UseCaseElemName] != null) {
                this.elemDataItems[dataItemParent.Key][message.UseCaseElemName].fromServer(message);
            }
        }
    }

    continueTemplateItem(message) {
        console.log("TemplateItem::continueTemplateItem");
        if (message.Action != null) {
            switch (message.Action) {
                case 'ContinueTemplateElem':
                    if (message.TemplateElem != null) {
                        this.continueTemplateElem(message.TemplateElem);
                    }
                    break;
                default:
                    break;
            }
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
        switch (this.useCase.Detail.Flow) {
            case 'Parallel':
                switch (this.useCase.Detail.Rendering.Format) {
                    case 'PickList':
                        this.presentPickList(dataItem);
                        break;
                    default:
                        break;
                }
                break;
            case 'Serial':
                switch (this.useCase.Detail.Rendering.Format) {
                    case 'List':
                        if (this.tableList == null) {
                            this.presentTable(); 
                        }
                        dataItems.forEach(dataItemCur => {
                            this.divItem.appendChild(document.createElement('br'));
                            for (let attrCur in dataItemCur.Attrs) {
                                let attrDetail = dataItemCur.Attrs[attrCur];
                                if (attrCur !== 'Id') {
                                    this.divItem.appendChild(document.createTextNode('XYZ: ' + attrDetail));
                                }
                            }
                        });

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

    presentMenu(dataItem) {
        console.log("TemplateItem::presentMenu");
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
                console.log("TemplateItem::presentMenu - clicked on menu item", menuItemCur);
                let useCaseElemPicked = this.useCase.Detail.Elems.find(elemCur => elemCur.Name === menuItemCur.Name);
                let templateElemPicked = null;
                if (this.elemDataItems[dataItem.Key] == null) {
                    this.elemDataItems[dataItem.Key] = {};
                }
                if (this.elemDataItems[dataItem.Key][menuItemCur.Name] == null) {
                    templateElemPicked = new TemplateElem(this, dataItem, null, useCaseElemPicked, this.divMenuOptionPicked);
                    this.elemDataItems[dataItem.Key][menuItemCur.Name] = templateElemPicked;
                } else {
                    templateElemPicked = this.elemDataItems[dataItem.Key][menuItemCur.Name];
                }
                for (let elemCur in this.elemDataItems[dataItem.Key]) {
                    let elemDetail = this.elemDataItems[dataItem.Key][elemCur];
                    if (elemDetail.useCaseElem != null && elemDetail.useCaseElem.Name !== menuItemCur.Name) {
                        elemDetail.hide();
                    }
                }
                templateElemPicked.show();
            });
        });
    }

    presentTable() {
        let divTableWrapper = document.createElement('div');
        this.divItem.appendChild(divTableWrapper);
        divTableWrapper.className = 'table-wrapper';
        let divTitle = document.createElement('div');
        divTableWrapper.appendChild(divTitle);
        divTitle.className = 'table-title';
        let divTitleRow = document.createElement('div');
        divTitle.appendChild(divTitleRow);
        divTitleRow.className = 'row';
        let divTitleRowTitle = document.createElement('div');
        divTitleRow.appendChild(divTitleRowTitle);
        divTitleRowTitle.className = 'col-sm-10';
        let tableCaption = document.createElement('h3');
        divTitleRowTitle.appendChild(tableCaption);
        tableCaption.appendChild(document.createTextNode(this.useCase.Detail.Name));
        let divTitleRowAddButton = document.createElement('div');
        divTitleRow.appendChild(divTitleRowAddButton);
        divTitleRowAddButton.className = 'col-sm-2';

        /*
        if (this.useCase.Detail.AddUseCase != null) {
            let buttonAdd = document.createElement('button');
            divTitleRowAddButton.appendChild(buttonAdd);
            buttonAdd.className = 'btn btn-info add-new';
            buttonAdd.addEventListener('click', (event) => {
                event.preventDefault();
                console.log("TemplateList - Add New");
                this.divTargetSub = document.createElement('div')
                this.divTargetSub.style.margin = '10px';
                this.track.divTargetSub.appendChild(this.divTargetSub);
                let divCur = document.createElement('div');
                this.divTargetSub.appendChild(divCur);
                divCur.className = 'mb-3';

                let buttonCur = document.createElement('button');
                divCur.appendChild(buttonCur);
                buttonCur.className = 'btn btn-info';
                buttonCur.setAttribute("type", "button");
                buttonCur.id = 'backbutton';
                buttonCur.style.width = "12em";
                buttonCur.appendChild(document.createTextNode("< Go Back"));
                buttonCur.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.track.popBreadcrumb();
                    this.track.divTargetSub.removeChild(this.divTargetSub);
                });

                this.templateSub = new TemplateItem(this, this.divTargetSub);
                this.subUseCase = this.track.parent.useCases.find(useCaseCur => useCaseCur.Detail.Name === this.useCase.Detail.AddUseCase);
                this.templateSub.setUseCase(this.subUseCase);
                this.track.pushBreadcrumb(this.templateSub);
            });
            let iconAdd = document.createElement('i');
            divTitleRowTitle.appendChild(iconAdd);
            iconAdd.className = 'fa fa-plus';
            buttonAdd.appendChild(iconAdd);
            buttonAdd.appendChild(document.createTextNode('Add New'));
        }
        */

        this.tableList = document.createElement('table');
        divTableWrapper.appendChild(this.tableList);
        this.tableList.className = 'table table-hover table-striped caption-top table-responsive';
        let tableHead = document.createElement('thead');
        this.tableList.appendChild(tableHead);
        this.tableHeadRow = document.createElement('tr');
        tableHead.appendChild(this.tableHeadRow);
        this.tableBody = document.createElement('tbody');
        this.tableList.appendChild(this.tableBody);
        this.useCase.Detail.Elems.forEach(elemCur => {
            let tableHeadRowHeader = document.createElement('th');
            this.tableHeadRow.appendChild(tableHeadRowHeader);
            tableHeadRowHeader.setAttribute("scope", "col");
            tableHeadRowHeader.appendChild(document.createTextNode(elemCur.Rendering.Label));
        });
        /*
        let messageOut = {
            Action: 'StartTemplateList',
            TemplateElem: {
                UseCaseName: this.useCase.Detail.Name
            }
        };
        this.parent.toServer(messageOut);
        */
    }


    presentPickList(dataItem) {
        console.log("TemplateItem::presentPickList");
    }

}

class TemplateElem extends TemplateElemClient {
    constructor(parent, dataItemParent, dataElem, useCaseElem,  divItemParent) {
        super(parent, dataItemParent, dataElem, useCaseElem);
        this.divItemParent = divItemParent;
        this.divElem = document.createElement('div')
        this.divItemParent.appendChild(this.divElem);
        this.visible = false;
        this.divElem.appendChild(document.createTextNode(this.useCaseElem.Rendering.Label));
    }

    startTemplateItem(message) {
        console.log("TemplateElem::startTemplateItem");
        if (this.templateItem == null) {
            let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === this.useCaseElem.SubUseCase);
            this.templateItem = new TemplateItem(this, subUseCase, this.divElem);
            this.templateItem.setDataItems(message.DataItems);
        }
    }

    continueTemplateItem(message) {
        console.log("TemplateElem::continueTemplateItem");
        if (message.Action != null) {
            switch (message.Action) {
                case 'ContinueTemplateElem':
                    if (message.TemplateElem != null) {
                        if (this.templateItem == null) {
                            this.fromServer(message.TemplateElem);
                        } else {
                            this.templateItem.continueTemplateElem(message.TemplateElem);
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    }

    continueTemplateElem(message) {
        console.log("TemplateElem::continueTemplateElem");
        if (message.Action != null) {
            switch (message.Action) {
                case 'ContinueTemplateItem':
                    if (this.templateItem != null && message.TemplateItem != null) {
                        this.templateItem.continueTemplateItem(message.TemplateItem);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    show() {
        if (this.dataElem == null) {
            this.toServer({
                Action: 'Start',
                Context: {}
            });
        }
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
        this.divItemParent.removeChild(this.divElem);
        this.divElem = null;
    }
}

module.exports = {
    TemplateItem: TemplateItem
}
