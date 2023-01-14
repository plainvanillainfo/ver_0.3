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
                } else {
                    this.divBreadcrumbs = document.createElement('nav');
                    this.divBreadcrumbs.setAttribute('aria-label', 'breadcrumb');
                    this.olBreadcrumbs = document.createElement('ol');
                    this.divBreadcrumbs.appendChild(this.olBreadcrumbs);
                    this.olBreadcrumbs.className = 'breadcrumb';
                    this.breadcrumbs = [this];
                }
            } else{
                this.divBreadcrumbs = document.createElement('nav');
                this.divBreadcrumbs.setAttribute('aria-label', 'breadcrumb');
                this.olBreadcrumbs = document.createElement('ol');
                this.divBreadcrumbs.appendChild(this.olBreadcrumbs);
                this.olBreadcrumbs.className = 'breadcrumb';
                this.breadcrumbs = [this];
            }
        } else {
            if (this.parent.divBreadcrumbs != null) {
                this.divBreadcrumbs = this.parent.divBreadcrumbs;
                this.olBreadcrumbs = this.parent.olBreadcrumbs;
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

            if (this.templateItemSub != null && this.templateItemSub.templateItemSub != null && this.templateItemSub.dataItems.find(cur => cur.Key === message.TemplateItem.ParentKey)) {
                this.templateItemSub.templateItemSub.setDataItems(message.TemplateItem.DataItems);
            } else {

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
                    case 'Form':
                        this.presentFormRows();
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
            if (elem.SubUseCase == null) {
                if (this.columns.find(cur => cur === elem.Rendering.Label) == null) {
                    this.columns.push(elem.Rendering.Label);
                    let tableHeadRowHeader = document.createElement('th');
                    this.tableHeadRow.appendChild(tableHeadRowHeader);
                    tableHeadRowHeader.setAttribute("scope", "col");
                    tableHeadRowHeader.appendChild(document.createTextNode(elem.Rendering.Label));
                }
            } else {
                let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === elem.SubUseCase);
                if (elem.Rendering.Nesting != null && elem.Rendering.Nesting === 'Flattened') {
                    subUseCase.Detail.Elems.forEach(elemCur => {
                        this.presentTableElem(elemCur);
                    });
                }
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
        this.formList = document.createElement('form');
        if (this.divItem == null) {
            this.divItem = document.createElement('div');
            this.divItemSurrounding.appendChild(this.divItem);
        }
        this.divItem.appendChild(this.formList);
        this.columns = [];
        this.formData = {};
        this.fFormEditable = (this.useCase.Detail.Editable != null && this.useCase.Detail.Editable === 'Yes') ? true : false;
        this.useCase.Detail.Elems.forEach(elemCur => {
            this.presentFormElem(elemCur);
        });

        let fFormEditable = (this.useCase.Detail.Editable != null && this.useCase.Detail.Editable === 'Yes') ? true : false;

        if (fFormEditable) {
            let divCur = document.createElement('div');
            this.formList.appendChild(divCur);
            divCur.className = 'mb-3';
            let buttonCur = document.createElement('button');
            divCur.appendChild(buttonCur);
            buttonCur.className = 'btn btn-danger';
            buttonCur.setAttribute("type", "button");
            buttonCur.id = 'cancelbutton';
            buttonCur.style.width = "12em";
            buttonCur.style.marginLeft = '25%';
            buttonCur.style.marginRight = '30px';
            buttonCur.appendChild(document.createTextNode("Cancel"));
            buttonCur.addEventListener('click', (event) => {
                event.preventDefault();
                this.popBreadcrumb();
            });
            buttonCur = document.createElement('button');
            divCur.appendChild(buttonCur);
            buttonCur.className = 'btn btn-success';
            buttonCur.setAttribute("type", "button");
            buttonCur.id = 'savebutton';
            buttonCur.style.width = "12em";
            buttonCur.appendChild(document.createTextNode("Save"));
            buttonCur.addEventListener('click', (event) => {
                event.preventDefault();
                this.saveFormData();
            });
        }
    }

    saveFormData() {
        let attrs = {};
        let fUpdated = false;
        for (let formAttrCur in this.formData) {
            let formAttrDetail = this.formData[formAttrCur];
            attrs[formAttrCur] = {Type: 'P', Value: formAttrDetail};
            fUpdated = true;
        }
        if (fUpdated) {
            /*
            let messageOut = {
                Action: 'UpdateItem',
                TemplateItem: {
                    ItemData: {
                        ItemKey: this.itemKey,
                        Attrs: attrs,
                        ChildItems: {}
                    }
                }
            };
            this.parent.toServer(messageOut);
            */
        } else {
            this.popBreadcrumb();
        }
    }

    presentFormElem(elem) {
        if (elem.Rendering.Nesting == null || elem.Rendering.Nesting !== 'Coerced') {
            if (this.columns.find(cur => cur === elem.Rendering.Label) == null) {
                this.columns.push(elem.Rendering.Label);
                let divCur = document.createElement('div');
                this.formList.appendChild(divCur);
                divCur.style.marginBottom = "10px";
                let labelText = elem.Rendering.Label;
                divCur.rendering = elem.Rendering;
                divCur.elem = elem;
                let labelCur = document.createTextNode(labelText + ": ");
                let labelSpan = document.createElement('span');
                labelSpan.appendChild(labelCur);
                divCur.appendChild(labelSpan);
                labelSpan.style.display = "inline-block";
                labelSpan.style.verticalAlign = "top";
                labelSpan.style.width = "25%";
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
        if (this.parent.dataItemParent != null && this.parent.parent.itemCells != null && 
                this.parent.useCaseElem.Rendering.Nesting != null && this.parent.useCaseElem.Rendering.Nesting === 'Coerced') {
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
            this.presentTableRowsSetCellValue(itemCur, this.useCase.Detail.Elems);
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
                            this.tableOwner.divItemSub.className = 'mb-3';
                            this.tableOwner.divItemSub.style.margin = '10px';
                
                            let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === this.useCase.Detail.SubUseCase);
                            this.templateItemSub = new TemplateItem(this, subUseCase, this.tableOwner.divItemSub);
                            this.templateItemSub.itemCells = {};
                            this.templateItemSub.itemCells[itemCur.Key] = this.itemCells[itemCur.Key];
                            this.templateItemSub.setDataItems([itemCur]);
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

    presentTableRowsSetCellValue(itemCur, elems) {
        elems.forEach(elemCur => {
            if (elemCur.SubUseCase == null) {
                let valueCur = itemCur.Attrs[elemCur.Name] != null ? itemCur.Attrs[elemCur.Name] : '';
                if (this.isLeaf === true && valueCur !== '') {
                    itemCur.isEmpty = false;
                }
                let cellCur = this.itemCells[itemCur.Key].find(cur => cur.Col === elemCur.Rendering.Label);
                if (cellCur != null) {
                    cellCur.Value = valueCur;
                    cellCur.Rendering = elemCur.Rendering;
                    cellCur.Elem = elemCur;
                }
            } else {
                let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === elemCur.SubUseCase);
                if (elemCur.Rendering.Nesting != null && elemCur.Rendering.Nesting === 'Flattened') {
                    this.presentTableRowsSetCellValue(itemCur, subUseCase.Detail.Elems);
                }
            }
        });
    }

    presentFormRows() {
        this.dataItems.forEach(itemCur => {
            this.itemCells[itemCur.Key].forEach(cellCur => {
                let divField = this.formList.firstChild;
                while (divField != null) {
                    if (divField.rendering != null && divField.rendering.Label === cellCur.Col) {
                        let inputCur;
                        if (divField.rendering.Format != null) {
                            switch (divField.rendering.Format) {
                                case 'Text':
                                    inputCur = document.createElement('input');
                                    divField.appendChild(inputCur);
                                    inputCur.setAttribute("type", "input");
                                    inputCur.value = cellCur.Value;
                                    inputCur.style.width = '70%';
                                    inputCur.addEventListener('blur', (event) => {
                                        event.preventDefault();
                                        this.formData[event.target.id] = event.target.value
                                    });
                                    if (divField.rendering.Editable != null && divField.rendering.Editable.toLowerCase() === 'no') {
                                        inputCur.disabled = true;
                                    }
                                    break;
                                case 'Date':
                                    let divDate = document.createElement('div');
                                    divField.appendChild(divDate);
                                    divDate.className = 'input-group date';
                                    divDate.style.display = 'inline';
                                    inputCur = document.createElement('input');
                                    divDate.appendChild(inputCur);
                                    inputCur.setAttribute("type", "date");
                                    if (cellCur.Value != null && cellCur.Value > '') {
                                        let valueCur = new Date(cellCur.Value);
                                        inputCur.value = valueCur.toISOString();
                                    } else {
                                        inputCur.value = '';
                                    }
                                    inputCur.style.width = '70%';
                                    inputCur.addEventListener('blur', (event) => {
                                        event.preventDefault();
                                        this.formData[event.target.id] = event.target.value;
                                    });
                                    let itemImgCal = document.createElement('i');
                                    divDate.appendChild(itemImgCal);
                                    itemImgCal.className = 'bi bi-calendar';
                                    itemImgCal.style.marginLeft = "10px";
                                    break;
                                case 'Textarea':
                                    inputCur = document.createElement('textarea');
                                    divField.appendChild(inputCur);
                                    if (divField.rendering.Rows != null) {
                                        inputCur.setAttribute("rows", divField.rendering.Rows);
                                    }
                                    inputCur.value = cellCur.Value;
                                    inputCur.style.width = '70%';
                                    inputCur.addEventListener('blur', (event) => {
                                        event.preventDefault();
                                        this.formData[event.target.id] = event.target.value
                                    });
                                    if (divField.rendering.Editable != null && divField.rendering.Editable.toLowerCase() === 'no') {
                                        inputCur.disabled = true;
                                    }
                                    break;
                                case 'DrillDown':
                                    inputCur = document.createElement('button');
                                    divField.appendChild(inputCur);
                                    inputCur.className = 'btn btn-primary';
                                    inputCur.setAttribute("type", "button");
                                    inputCur.style.width = "22em";
                                    inputCur.appendChild(document.createTextNode(divField.rendering.Label));
                                    inputCur.addEventListener('click', (event) => {
                                        event.preventDefault();
                                        console.log("TemplateItem - DrillDown: ");
                                        if (this.divItem == null) {
                                            this.divItem = document.createElement('div');
                                            this.divItemSurrounding.appendChild(this.divItem);
                                        }
                                        this.divItemSub = document.createElement('div');
                                        this.divItemSub.className = 'mb-3';
                                        this.divItemSub.style.margin = '10px';
                                        let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === divField.elem.SubUseCase);
                                        this.templateItemSub = new TemplateItem(this, subUseCase, this.divItemSub);
                                        if (this.dataElem == null) {
                                            this.toServer({
                                                Action: 'ContinueTemplateElem',
                                                TemplateElem: {
                                                    ItemKey: itemCur.Key,
                                                    UseCaseElemName: divField.elem.Name,
                                                    Action: 'ContinueTemplateItem',
                                                    TemplateItem: {
                                                      UseCaseName: subUseCase.Detail.Name,
                                                      Action: 'Start'
                                                    }
                                                }
                                            });
                                        }
                                        this.pushBreadcrumb(this.templateItemSub);
                                    });
                                    break;
                                default:
                                    break;
                            }
                        } else {
                            inputCur = document.createElement('input');
                            divField.appendChild(inputCur);
                            inputCur.setAttribute("type", "input");
                            inputCur.value = cellCur.Value;
                            inputCur.style.width = '70%';
                            inputCur.addEventListener('blur', (event) => {
                                event.preventDefault();
                                this.formData[event.target.id] = event.target.value
                            });
                            if (divField.rendering.Editable != null && divField.rendering.Editable.toLowerCase() === 'no') {
                                inputCur.disabled = true;
                            }
                        }
                        break;
                    } else {
                        divField = divField.nextSibling;
                    }
                }
            });
        });
    }

    /*
    case 'Json':
        inputCur = document.createElement('textarea');
        divCur.appendChild(inputCur);
        inputCur.setAttribute("rows", "4");
        if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null) {
            inputCur.value = JSON.stringify(this.item.Attrs[elemCur.Name]);
        } else {
            inputCur.value = '';
        }
        inputCur.style.width = '70%';
        inputCur.addEventListener('blur', (event) => {
            event.preventDefault();
            this.formData[event.target.id] = event.target.value
        });
        if (elemCur.Editable != null && elemCur.Editable.toLowerCase() === 'no') {
            inputCur.disabled = true;
        }
        break;
    case 'Textarea':
        inputCur = document.createElement('textarea');
        divCur.appendChild(inputCur);
        inputCur.setAttribute("rows", "4");
        if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null) {
            inputCur.value = this.item.Attrs[elemCur.Name];
        } else {
            inputCur.value = '';
        }
        inputCur.style.width = '70%';
        inputCur.addEventListener('blur', (event) => {
            event.preventDefault();
            this.formData[event.target.id] = event.target.value
        });
        if (elemCur.Editable != null && elemCur.Editable.toLowerCase() === 'no') {
            inputCur.disabled = true;
        }
        break;
    case 'Checkbox':
        inputCur = document.createElement('input');
        divCur.appendChild(inputCur);
        inputCur.className = 'form-check-input';
        inputCur.setAttribute("type", "checkbox");
        if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null && this.item.Attrs[elemCur.Name] !== "") {
            inputCur.checked = true
        } else {
            inputCur.checked = false;
        }
        inputCur.style.marginRight = "1em";
        inputCur.addEventListener('blur', (event) => {
            event.preventDefault();
            this.formData[event.target.id] = event.target.checked;
        });
 
        inputLabel = document.createElement('label');
        divCur.appendChild(inputLabel);
        inputLabel.className = 'form-check-label';
        inputLabel.setAttribute("for", "flexCheckDisabled");
        if (elemCur.Legend != null) {
            inputLabel.appendChild(document.createTextNode(elemCur.Legend));
        }
        break;
    case 'Radio':
        inputCur = document.createElement('input');
        divCur.appendChild(inputCur);
        inputCur.className = 'form-check-input';
        inputCur.setAttribute("type", "radio");
        inputCur.style.width = '70%';
        if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null && this.item.Attrs[elemCur.Name] !== "") {
            inputCur.checked = true
        } else {
            inputCur.checked = false;
        }
        inputCur.style.marginRight = "1em";
        inputCur.addEventListener('blur', (event) => {
            event.preventDefault();
            //this.formData[event.target.id] = event.target.checked;
        });
 
        inputLabel = document.createElement('label');
        divCur.appendChild(inputLabel);
        inputLabel.className = 'form-check-label';
        inputLabel.setAttribute("for", "flexCheckDisabled");
        inputLabel.appendChild(document.createTextNode(labelText));
        break;
    case 'Dropdown':
        inputCur = document.createElement('select');
        divCur.appendChild(inputCur);
        let valuePicked = '';
        if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null) {
            valuePicked = this.item.Attrs[elemCur.Name];
        }
        if (elemCur.ValueSet != null) {
            elemCur.ValueSet.forEach(itemCur => {
                let option = document.createElement('option');
                inputCur.appendChild(option);
                if (itemCur === valuePicked) {
                    option.setAttribute('selected', 'selected');
                }
                let spanAttr = document.createElement('span');
                option.appendChild(spanAttr);
                spanAttr.appendChild(document.createTextNode(itemCur));
            });
        }
        inputCur.addEventListener('change', (event) => {
            event.preventDefault();
            console.log("click on option", event.target.value);
            this.formData[elemCur.Name] = event.target.value;
        });
        break;
    case 'DrillDown':
        inputCur = document.createElement('button');
        divCur.appendChild(inputCur);
        inputCur.className = 'btn btn-primary';
        inputCur.setAttribute("type", "button");
        inputCur.style.width = "22em";
        inputCur.appendChild(document.createTextNode(labelText));
        inputCur.addEventListener('click', (event) => {
            event.preventDefault();
            console.log("TemplateItem - DrillDown: ");
 
            this.divTargetSub = document.createElement('div')
            this.divTargetSub.style.margin = '10px';
            this.track.divTargetSub.appendChild(this.divTargetSub);
            let divCur = document.createElement('div');
            this.divTargetSub.appendChild(divCur);
            divCur.className = 'mb-3';
            if (this.elems[elemCur.Name] == null) {
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
                });
                this.elems[elemCur.Name] = new TemplateElem(this, elemCur, this.divTargetSub, true);
                //this.track.pushBreadcrumb(this.elems[elemCur.Name]);
            } else {
                this.elems[elemCur.Name].show();
            }
            this.track.pushBreadcrumb(this.elems[elemCur.Name]);
        });
        break;
    case 'Context':
        this.elems[elemCur.Name] = new TemplateElem(this, elemCur, divCur, false);
        break;
    case 'PickList':
        inputCur = document.createElement('div');
        divCur.appendChild(inputCur);
        inputCur.style.display = "inline-block";
        inputCur.style.width = '70%';
        elemPicked = this.useCase.elems[elemCur.Name];
        break;
    case 'InPlace':
        inputCur = document.createElement('div');
        divCur.appendChild(inputCur);
        inputCur.style.display = "inline-block";
        inputCur.style.width = '70%';
        elemPicked = this.useCase.elems[elemCur.Name];
        break;
 
    */

    pushBreadcrumb(templatePushed) {
        console.log("TemplateItem::pushBreadcrumb");
        if (this.divBreadcrumbs == null) {
            if (this.divItem == null) {
                this.divItem = document.createElement('div');
                this.divItemSurrounding.appendChild(this.divItem);
            }
            this.divItem.prepend(this.divBreadcrumbs);
        }
        this.divItemSurrounding.appendChild(this.divItemSub);
        this.divItemSurrounding.buttonBack = document.createElement('button');
        this.divItemSub.prepend(this.divItemSurrounding.buttonBack);
        this.divItemSurrounding.buttonBack.className = 'btn btn-info';
        this.divItemSurrounding.buttonBack.setAttribute("type", "button");
        this.divItemSurrounding.buttonBack.style.width = "12em";
        this.divItemSurrounding.buttonBack.appendChild(document.createTextNode("< Go Back"));
        this.divItemSurrounding.buttonBack.addEventListener('click', (event) => {
            event.preventDefault();
            this.popBreadcrumb();
        });
        let crumbTip = this.breadcrumbs[this.breadcrumbs.length-1];
        crumbTip.setVisibility(false);
        if (this.breadcrumbs.length > 1) {
            let crumbPrev = this.breadcrumbs[this.breadcrumbs.length-2];
            if (crumbPrev.divItemSurrounding != null && crumbPrev.divItemSurrounding.buttonBack != null) {
                crumbPrev.divItemSurrounding.buttonBack.style.visibility = 'hidden';
                crumbPrev.divItemSurrounding.buttonBack.style.display = 'none';
            }
        }
        this.breadcrumbs.push(templatePushed);
        crumbTip = this.breadcrumbs[this.breadcrumbs.length-1];
        crumbTip.setVisibility(true);
        this.showCrumbs();
    }

    popBreadcrumb() {
        console.log("TemplateItem::popBreadcrumb");
        let crumbTip = this.breadcrumbs[this.breadcrumbs.length-1];
        crumbTip.setVisibility(false);
        this.breadcrumbs.pop();
        crumbTip = this.breadcrumbs[this.breadcrumbs.length-1];
        crumbTip.divItemSurrounding.removeChild(crumbTip.divItemSub);
        crumbTip.setVisibility(true);
        if (this.breadcrumbs.length > 1) {
            let crumbPrev = this.breadcrumbs[this.breadcrumbs.length-2];
            if (crumbPrev.divItemSurrounding != null && crumbPrev.divItemSurrounding.buttonBack != null) {
                crumbPrev.divItemSurrounding.buttonBack.style.visibility = 'visible';
                crumbPrev.divItemSurrounding.buttonBack.style.display = 'inline';
            }
        }
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
        if (this.parent.divBreadcrumbs != null) {
            this.divBreadcrumbs = this.parent.divBreadcrumbs;
            this.olBreadcrumbs = this.parent.olBreadcrumbs;
            this.breadcrumbs = this.parent.breadcrumbs;
        }
        this.visible = false;
    }

    startTemplateItem(message) {
        console.log("TemplateElem::startTemplateItem");
        if (this.templateItem == null) {
            let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === this.useCaseElem.SubUseCase);
            this.templateItem = new TemplateItem(this, subUseCase, this.divElem);
            this.templateItem.setDataItems(message.DataItems);
        } else {
            // HERE:

            let r = 6;
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
