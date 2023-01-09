const { TemplateItemClient, TemplateElemClient } = require('../pvibe/template_client.cjs');

class TemplateItem extends TemplateItemClient {
    constructor(parent, useCase, divItemSurrounding) {
        super(parent, useCase);
        this.divItemSurrounding = divItemSurrounding;
        this.isLeaf = true;
        /* 
        UI:
        labels
        collection
        selections
        stack
        pagination
        actions
        criteria
        search
        - paths
        - AIML
        - indexing
        - meta info
        - backend state for template
        */
        /*
        Rendering:
        - Stack: Inherit | Originate
        - Caption
        - Format: Table | Form
        - Direction: LeftRight | RightLeft
        - Criteria: []
        - Search: {}
        - Pagination: None | Numbered
        - Actions: []
        */
    
        let rendering = this.useCase.Detail.Rendering;
        if (rendering.Stack != null) {
            if (rendering.Stack === 'Inherit') {
                if (this.parent.divBreadcrumbs != null) {
                    this.divBreadcrumbs = this.parent.divBreadcrumbs;
                    this.breadcrumbs = this.parent.breadcrumbs;
                }
            }
        } else {
            if (this.parent.divBreadcrumbs != null) {
                this.divBreadcrumbs = this.parent.divBreadcrumbs;
                this.breadcrumbs = this.parent.breadcrumbs;
            }
        }
        if (rendering.Caption != null) {
            let headingCaption = document.createElement('h3');
            if (this.divItem == null) {
                this.divItem = document.createElement('div');
                this.divItemSurrounding.appendChild(this.divItem);
            }
            this.divItem.appendChild(headingCaption);
            headingCaption.appendChild(document.createTextNode(rendering.Caption));
        }
        if (rendering.Search != null) {
            let divSearch = document.createElement('div');
            if (this.divItem == null) {
                this.divItem = document.createElement('div');
                this.divItemSurrounding.appendChild(this.divItem);
            }
            this.divItem.appendChild(divSearch);
            let inputSearch = document.createElement('input');
            divSearch.appendChild(inputSearch);
            inputSearch.setAttribute("type", "text");
            inputSearch.setAttribute("placeholder", "Search..");

            let buttonClear = document.createElement('button');
            divSearch.appendChild(buttonClear);
            buttonClear.setAttribute("type", "button");
            buttonClear.id = 'clearbutton';
            let iconClear = document.createElement('i');
            buttonClear.appendChild(iconClear);
            iconClear.className = 'bi bi-x-circle';

            let buttonSearch = document.createElement('button');
            divSearch.appendChild(buttonSearch);
            buttonSearch.setAttribute("type", "button");
            buttonSearch.id = 'searchbutton';
            let iconSearch = document.createElement('i');
            buttonSearch.appendChild(iconSearch);
            iconSearch.className = 'bi bi-search';
        }
        if (rendering.Criteria != null) {
            let divCriteria = document.createElement('div');
            if (this.divItem == null) {
                this.divItem = document.createElement('div');
                this.divItemSurrounding.appendChild(this.divItem);
            }
            this.divItem.appendChild(divCriteria);
            divCriteria.appendChild(document.createTextNode('Criteria'));
        }
        if (rendering.Format === 'Table') {
            if (this.parent.useCaseElem == null || this.parent.useCaseElem.Rendering.Nesting == null || this.parent.useCaseElem.Rendering.Nesting !== 'Coerced') {
                this.presentTable();
            } else {
                this.presentTableRootStatus();
            }
        } else {
            if (rendering.Format === 'Form') {
                if (this.parent.useCaseElem == null || this.parent.useCaseElem.Rendering.Nesting == null || this.parent.useCaseElem.Rendering.Nesting !== 'Coerced') {
                    this.presentForm();
                } else {
                    this.presentFormRootStatus();
                }
            }
        }
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
                if (this.divItem == null) {
                    this.divItem = document.createElement('div');
                    this.divItemSurrounding.appendChild(this.divItem);
                }
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

    renderSingleDataItem() {
        switch (this.useCase.Detail.Flow) {
            case 'Parallel':
                switch (this.useCase.Detail.Rendering.Format) {
                    case 'Menu':
                        this.presentMenu(this.dataItems[0]);
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
                    case 'Table':
                        this.presentTableRows();
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
        if (this.divItem == null) {
            this.divItem = document.createElement('div');
            this.divItemSurrounding.appendChild(this.divItem);
        }
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

    /*
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
    tableCaption.appendChild(document.createTextNode(this.useCase.Detail.Rendering.Caption));
    let divTitleRowAddButton = document.createElement('div');
    divTitleRow.appendChild(divTitleRowAddButton);
    divTitleRowAddButton.className = 'col-sm-2';
    */
    /*
    if (this.useCase.Detail.AddUseCase != null) {
        let buttonAdd = document.createElement('button');
        divTitleRowAddButton.appendChild(buttonAdd);
        buttonAdd.className = 'btn btn-info add-new';
        buttonAdd.addEventListener('click', (event) => {
            event.preventDefault();
            console.log("TemplateList - Add New");
            this.divItemSub = document.createElement('div')
            this.divItemSub.style.margin = '10px';
            this.track.divItemSub.appendChild(this.divItemSub);
            let divCur = document.createElement('div');
            this.divItemSub.appendChild(divCur);
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
                this.track.divItemSub.removeChild(this.divItemSub);
            });

            this.templateSub = new TemplateItem(this, this.divItemSub);
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

    presentTable() {
        this.tableList = document.createElement('table');
        if (this.divItem == null) {
            this.divItem = document.createElement('div');
            this.divItemSurrounding.appendChild(this.divItem);
        }
        this.divItem.appendChild(this.tableList);
        this.tableList.className = 'table table-hover table-striped caption-top table-responsive';
        let tableHead = document.createElement('thead');
        this.tableList.appendChild(tableHead);
        this.tableHeadRow = document.createElement('tr');
        tableHead.appendChild(this.tableHeadRow);
        this.tableBody = document.createElement('tbody');
        this.tableList.appendChild(this.tableBody);
        this.columns = [];
        this.useCase.Detail.Elems.forEach(elemCur => {
            this.presentTableElem(elemCur);
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

    presentTableElem(elem) {
        if (elem.Rendering.Nesting == null || elem.Rendering.Nesting !== 'Coerced') {
            if (this.columns.find(cur => cur === elem.Rendering.Label) == null) {
                this.columns.push(elem.Rendering.Label);
                let tableHeadRowHeader = document.createElement('th');
                this.tableHeadRow.appendChild(tableHeadRowHeader);
                tableHeadRowHeader.setAttribute("scope", "col");
                tableHeadRowHeader.appendChild(document.createTextNode(elem.Rendering.Label));
            }
        } else {
            this.isLeaf = false;
            let subUseCase = this.session.useCases.find(cur => cur.Id === elem.SubUseCase);
            if (subUseCase != null) {
                subUseCase.Detail.Elems.forEach(elemCur => {
                    this.presentTableElem(elemCur);
                });
        
            }
        }
    }

    presentTableRootStatus() {
        this.useCase.Detail.Elems.forEach(elemCur => {
            this.presentTableRootStatusElem(elemCur);
        });
    }

    presentTableRootStatusElem(elem) {
        if (elem.Rendering.Nesting != null && elem.Rendering.Nesting === 'Coerced') {
            this.isLeaf = false;
            let subUseCase = this.session.useCases.find(cur => cur.Id === elem.SubUseCase);
            if (subUseCase != null) {
                subUseCase.Detail.Elems.forEach(elemCur => {
                    this.presentTableRootStatusElem(elemCur);
                });
        
            }
        }
    }

    presentForm() {
        this.tableList = document.createElement('table');
        if (this.divItem == null) {
            this.divItem = document.createElement('div');
            this.divItemSurrounding.appendChild(this.divItem);
        }
        this.divItem.appendChild(this.tableList);
        this.tableList.className = 'table table-hover table-striped caption-top table-responsive';
        let tableHead = document.createElement('thead');
        this.tableList.appendChild(tableHead);
        this.tableHeadRow = document.createElement('tr');
        tableHead.appendChild(this.tableHeadRow);
        this.tableBody = document.createElement('tbody');
        this.tableList.appendChild(this.tableBody);
        this.columns = [];
        this.useCase.Detail.Elems.forEach(elemCur => {
            this.presentFormElem(elemCur);
        });
    }

    presentFormElem(elem) {
        if (elem.Rendering.Nesting == null || elem.Rendering.Nesting !== 'Coerced') {
            if (this.columns.find(cur => cur === elem.Rendering.Label) == null) {
                this.columns.push(elem.Rendering.Label);
                let tableHeadRowHeader = document.createElement('th');
                this.tableHeadRow.appendChild(tableHeadRowHeader);
                tableHeadRowHeader.setAttribute("scope", "col");
                tableHeadRowHeader.appendChild(document.createTextNode(elem.Rendering.Label));
            }
        } else {
            this.isLeaf = false;
            let subUseCase = this.session.useCases.find(cur => cur.Id === elem.SubUseCase);
            if (subUseCase != null) {
                subUseCase.Detail.Elems.forEach(elemCur => {
                    this.presentFormElem(elemCur);
                });
        
            }
        }
    }

    presentFormRootStatus() {
        this.useCase.Detail.Elems.forEach(elemCur => {
            this.presentFormRootStatusElem(elemCur);
        });
    }

    presentFormRootStatusElem(elem) {
        if (elem.Rendering.Nesting != null && elem.Rendering.Nesting === 'Coerced') {
            this.isLeaf = false;
            let subUseCase = this.session.useCases.find(cur => cur.Id === elem.SubUseCase);
            if (subUseCase != null) {
                subUseCase.Detail.Elems.forEach(elemCur => {
                    this.presentFormRootStatusElem(elemCur);
                });
        
            }
        }
    }

    presentPickList(dataItem) {
        console.log("TemplateItem::presentPickList");
    }

    presentTableRows() {
        this.tableOwner = this;
        while (this.tableOwner.tableBody == null) {
            this.tableOwner = this.tableOwner.parent.parent; 
        }
        this.itemCells = {};
        let itemCellsParent = [];
        if (this.parent.dataItemParent != null && this.parent.parent.itemCells != null) {
            this.parent.parent.itemCells[this.parent.dataItemParent.Key].forEach(cur => {
                itemCellsParent.push({...cur});
            });
        }
        this.dataItems.forEach(itemCur => {
            this.itemCells[itemCur.Key] = [];
            itemCellsParent.forEach(cellCur => {
                this.itemCells[itemCur.Key].push({...cellCur});
            });
            this.tableOwner.columns.forEach(colCur => {
                let cellCur = this.itemCells[itemCur.Key].find(cur => cur.Col === colCur);
                if (cellCur == null) {
                    this.itemCells[itemCur.Key].push({
                        Col: colCur, 
                        Value: '',
                        Td: null
                    });
                }
            });
            itemCur.isEmpty = true;
            this.useCase.Detail.Elems.forEach(elemCur => {
                let valueCur = itemCur.Attrs[elemCur.Name] != null ? itemCur.Attrs[elemCur.Name] : '';
                if (valueCur.substring != null) {
                    valueCur = valueCur;
                }
                if (valueCur !== '') {
                    if (this.isLeaf === true) {
                        itemCur.isEmpty = false;
                    }
                }
                let cellCur = this.itemCells[itemCur.Key].find(cur => cur.Col === elemCur.Rendering.Label);
                if (cellCur != null) {
                    cellCur.Value = valueCur;
                    cellCur.Rendering = elemCur.Rendering;
                }
            });
        });

        if (this.isLeaf === true) {
            this.dataItems.forEach(itemCur => {
                if (itemCur.isEmpty === false) {
                    let tableItemRow = document.createElement('tr');
                    this.tableOwner.tableBody.appendChild(tableItemRow);
                    tableItemRow.addEventListener('click', (event) => {
                        event.preventDefault();
                        console.log("presentTableRows - Item picked: ", itemCur.Key);
                        if (this.useCase.Detail.SubUseCase != null) {
                            if (this.divItem == null) {
                                this.divItem = document.createElement('div');
                                this.divItemSurrounding.appendChild(this.divItem);
                            }
                            this.tableOwner.divItemSub = document.createElement('div');
                            let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === this.useCase.Detail.SubUseCase);
                            this.templateItemSub = new TemplateItem(this, subUseCase, this.tableOwner.divItemSub);
                            this.tableOwner.pushBreadcrumb(this.templateItemSub);
                        }
                    });

                    this.itemCells[itemCur.Key].forEach(cellCur => {
                        cellCur.Td = document.createElement('td');
                        tableItemRow.appendChild(cellCur.Td);
                        if (cellCur.Rendering != null) {
                            if (cellCur.Rendering.Width != null) {
                                cellCur.Td.style.width = cellCur.Rendering.Width;
                            }
                            if (cellCur.Rendering.Format != null) {
                                if (cellCur.Rendering.Format === 'Date') {
                                    cellCur.Value = cellCur.Value.substring(0, 19).replace('-', '/').replace('-', '/').replace('T', ' ');
                                }
                            }
                        }
                        cellCur.Td.appendChild(document.createTextNode(cellCur.Value));
                    });

                }
            });
        }

    }

    pushBreadcrumb(templatePushed) {
        console.log("TemplateItem::pushBreadcrumb");
        if (this.divBreadcrumbs == null) {
            this.divBreadcrumbs = document.createElement('nav');
            if (this.divItem == null) {
                this.divItem = document.createElement('div');
                this.divItemSurrounding.appendChild(this.divItem);
            }
            this.divItem.prepend(this.divBreadcrumbs);
            this.divBreadcrumbs.setAttribute('aria-label', 'breadcrumb');
            this.olBreadcrumbs = document.createElement('ol');
            this.divBreadcrumbs.appendChild(this.olBreadcrumbs);
            this.olBreadcrumbs.className = 'breadcrumb';
            this.breadcrumbs = [this];
            this.divItemSurrounding.appendChild(this.divItemSub);
            this.divItemSub.className = 'mb-3';
            this.divItemSub.style.margin = '10px';

            let buttonCur = document.createElement('button');
            this.divItemSub.appendChild(buttonCur);
            buttonCur.className = 'btn btn-info';
            buttonCur.setAttribute("type", "button");
            buttonCur.id = 'backbutton';
            buttonCur.style.width = "12em";
            buttonCur.appendChild(document.createTextNode("< Go Back"));
            
            buttonCur.addEventListener('click', (event) => {
                event.preventDefault();
                templatePushed.popBreadcrumb();
                if (templateItemSub.divItem != null) {
                    this.divItemSub.removeChild(templateItemSub.divItem);
                }
            });

        }
        //if (this.breadcrumbs.length > 0) {
        this.breadcrumbs[this.breadcrumbs.length-1].setVisibility(false);
        //}
        this.breadcrumbs.push(templatePushed);
        this.breadcrumbs[this.breadcrumbs.length-1].setVisibility(true);
        this.showCrumbs();
    }

    popBreadcrumb() {
        console.log("TemplateItem::popBreadcrumb");
        this.breadcrumbs[this.breadcrumbs.length-1].setVisibility(false);
        this.breadcrumbs.pop();
        this.breadcrumbs[this.breadcrumbs.length-1].setVisibility(true);
        this.showCrumbs();
    }

    showCrumbs() {
        let child = this.olBreadcrumbs.lastElementChild; 
        while (child) {
            this.olBreadcrumbs.removeChild(child);
            child = this.olBreadcrumbs.lastElementChild;
        }
        let itemId = '';
        this.breadcrumbs.forEach((crumbCur, indexCur) => {
            let liCrumb = document.createElement('li');
            this.olBreadcrumbs.appendChild(liCrumb);
            if (crumbCur.itemId != null) {
                itemId = crumbCur.itemId;
            }
            if (indexCur === (this.breadcrumbs.length-1)) {
                liCrumb.className = 'breadcrumb-item active';
                if (crumbCur.useCase != null) {
                    liCrumb.appendChild(document.createTextNode(crumbCur.useCase.Detail.Label + ' ' +  itemId));
                }
                if (crumbCur.useCaseElem != null) {
                    liCrumb.appendChild(document.createTextNode(crumbCur.useCaseElem.Label + ' ' +  itemId));
                }
            } else {
                liCrumb.className = 'breadcrumb-item';
                let aCrumb = document.createElement('a');
                liCrumb.appendChild(aCrumb);
                aCrumb.setAttribute('href', '#');
                if (crumbCur.useCase != null) {
                    aCrumb.appendChild(document.createTextNode(crumbCur.useCase.Detail.Label + ' ' +  itemId));
                }
                if (crumbCur.useCaseElem != null) {
                    aCrumb.appendChild(document.createTextNode(crumbCur.useCaseElem.Label + ' ' +  itemId));
                }
            }
        });
    }

    setVisibility(trueOrFalse) {
        console.log("TemplateItem::setVisibility", trueOrFalse);
        if (trueOrFalse === true) {
                this.divItem.style.visibility = 'visible';
                this.divItem.style.display = 'block';
        } else {
                this.divItem.style.visibility = 'hidden';
                this.divItem.style.display = 'none';
        }
    }

}

class TemplateElem extends TemplateElemClient {
    constructor(parent, dataItemParent, dataElem, useCaseElem,  divItemParent) {
        super(parent, dataItemParent, dataElem, useCaseElem);
        this.divItemParent = divItemParent;
        if (this.useCaseElem.Rendering.Nesting != null && this.useCaseElem.Rendering.Nesting === 'Coerced') {
            this.divElem = this.divItemParent;
        } else {
            this.divElem = document.createElement('div')
            this.divItemParent.appendChild(this.divElem);
        }
        this.visible = false;
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
