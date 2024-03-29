const { TemplateItemClient, TemplateElemClient } = require('../pvibe/template_client.cjs');

class TemplateItem extends TemplateItemClient {
    constructor(parent, useCase, divItemSurrounding, isCoerced) {
        super(parent, useCase);
        console.log("TemplateItem::constructor");
        this.divItemSurrounding = divItemSurrounding;
        if (this.parent.divBreadcrumbs != null) {
            this.divBreadcrumbs = this.parent.divBreadcrumbs;
            this.olBreadcrumbs = this.parent.olBreadcrumbs;
            this.breadcrumbs = this.parent.breadcrumbs;
        }
        this.isCoerced = isCoerced;
        this.isLeaf = true;
        this.columns = [];
        this.templateItemCoercer = this;
        this.dataItems = [];
        this.itemCells = {};
        this.itemCellsParent = [];
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
        if (this.isCoerced === false) {
            this.templateItemCoercer = this;
            if (rendering.Stack != null) {
                if (rendering.Stack === 'Inherit') {
                    if (this.parent.divBreadcrumbs != null) {
                        this.divBreadcrumbs = this.parent.divBreadcrumbs;
                        this.olBreadcrumbs = this.parent.olBreadcrumbs;
                        this.breadcrumbs = this.parent.breadcrumbs;
                    } else {
                        this.divBreadcrumbs = document.createElement('nav');
                        this.divBreadcrumbs.setAttribute('aria-label', 'breadcrumb');
                        this.olBreadcrumbs = document.createElement('ol');
                        this.divBreadcrumbs.appendChild(this.olBreadcrumbs);
                        this.olBreadcrumbs.className = 'breadcrumb';
                        this.breadcrumbs = [this];
                    }
                } else {
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
                this.presentTable();
            } else {
                if (rendering.Format === 'Form') {
                    this.presentForm();
                }
            }
        } else {
            this.templateItemCoercer = parent.parent;
            this.setCoercedLeafStatus();
            if (this.parent.dataItemParent != null && this.parent.parent.itemCells != null) {
                this.parent.parent.itemCells[this.parent.dataItemParent.Key].forEach(cur => {
                    this.itemCellsParent.push(cur);
                });
            }
            }
        this.actionResult = '';
        this.actionCallback = this.actionCallback.bind(this);
    }

    setCoercedLeafStatus() {
        console.log("TemplateItem::setCoercedLeafStatus");
        this.useCase.Detail.Elems.forEach(elemCur => {
            this.setCoercedLeafStatusElem(elemCur);
        });
    }

    setCoercedLeafStatusElem(elem) {
        console.log("TemplateItem::setCoercedLeafStatusElem");
        if (elem.Rendering.Nesting != null && elem.Rendering.Nesting === 'Coerced') {
            console.log("TemplateItem::setCoercedLeafStatusElem - this.isLeaf = false");
            this.isLeaf = false;
            let subUseCase = this.session.useCases.find(cur => cur.Id === elem.SubUseCase);
            if (subUseCase != null) {
                subUseCase.Detail.Elems.forEach(elemCur => {
                    this.setCoercedLeafStatusElem(elemCur);
                });
            }
        }
    }
    
    continueTemplateElem(message) {
        console.log("TemplateItem::continueTemplateElem");
        if (message.UseCaseElemName != null) {
            console.log(message.TemplateItem, "\n",this.dataItems);
            if (this.templateItemSub != null && this.templateItemSub.templateItemSub != null && this.templateItemSub.dataItems.find(cur => cur.Key === message.TemplateItem.ParentKey)) {
                console.log("TemplateItem::continueTemplateElem - this.templateItemSub.templateItemSub.setDataItems()");
                //this.templateItemSub.templateItemSub.setDataItems(message.TemplateItem.DataItems);
            } else {
                let dataItemParent = message.TemplateItem.ParentKey != null && this.dataItems != null ? 
                    this.dataItems.find(cur => cur.Key === message.TemplateItem.ParentKey) 
                    : 
                    this.dataItems != null ? this.dataItems[0] : null;
                if (dataItemParent != null) {
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
        console.log("TemplateItem::renderSingleDataItem");
        switch (this.useCase.Detail.Flow) {
            case 'Parallel':
                switch (this.useCase.Detail.Rendering.Format) {
                    case 'Menu':
                        this.presentMenu(this.dataItems[0]);		// For forms with multiple items, [0] will change to [i]
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
        console.log("TemplateItem::renderMultipleDataItems");
        switch (this.useCase.Detail.Flow) {
            case 'Parallel':
                switch (this.useCase.Detail.Rendering.Format) {
                    case 'PickList':
                        this.presentPickList();
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
                        this.presentFormColumns();
                        break;
                    default:
                        break;
                }
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

    presentTable() {
        console.log("TemplateItem::presentTable");
        if (this.divItem == null) {
            this.divItem = document.createElement('div');
            this.divItemSurrounding.appendChild(this.divItem);
        }
        let createSpec = null;
        if (this.useCase.Detail.Rendering.Actions != null) {
            createSpec = this.useCase.Detail.Rendering.Actions.find(cur => cur.Name === 'Create');
            let buttonAdd = document.createElement('button');
            this.divItem.appendChild(buttonAdd);
            buttonAdd.className = 'btn btn-info add-new';
            buttonAdd.style.marginLeft = '70%';
            let iconAdd = document.createElement('i');
            iconAdd.className = 'bi bi-plus-circle';
            buttonAdd.appendChild(iconAdd);
            buttonAdd.appendChild(document.createTextNode("  "+createSpec.Label));
            buttonAdd.addEventListener('click', (event) => {
                event.preventDefault();
                console.log("TemplateItem - Add New");
                if (this.divItem == null) {
                    this.divItem = document.createElement('div');
                    this.divItemSurrounding.appendChild(this.divItem);
                }
                this.templateItemCoercer.divItemSub = document.createElement('div');
                this.templateItemCoercer.divItemSub.className = 'mb-3';
                this.templateItemCoercer.divItemSub.style.margin = '10px';
                let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === this.useCase.Detail.SubUseCase);
                this.templateItemSub = new TemplateItem(this, subUseCase, this.templateItemCoercer.divItemSub, this.templateItemCoercer.isCoerced);
                let itemCur = { Key: '00000000-0000-0000-0000-000000000001', Attrs: {} };     // New record key and data
                this.templateItemSub.dataItems.push(itemCur);
                //this.presentColumn(itemCur, this.itemCellsParent);
                //this.templateItemSub.itemCells[itemCur.Key] = this.itemCells[itemCur.Key];
                this.templateItemSub.presentFormColumns();
                this.pushBreadcrumb(this.templateItemSub);
            });
        }
        this.tableList = document.createElement('table');
        this.divItem.appendChild(this.tableList);
        this.tableList.className = 'table table-hover table-striped caption-top table-responsive';
        let tableHead = document.createElement('thead');
        this.tableList.appendChild(tableHead);
        this.tableHeadRow = document.createElement('tr');
        tableHead.appendChild(this.tableHeadRow);
        this.tableBody = document.createElement('tbody');
        this.tableList.appendChild(this.tableBody);
        this.useCase.Detail.Elems.forEach(elemCur => {
            this.presentTableElem(elemCur);
        });
    }

    presentTableElem(elem) {
        console.log("TemplateItem::presentTableElem");
        if (elem.Rendering.Nesting == null || elem.Rendering.Nesting !== 'Coerced') {
            if (elem.SubUseCase == null || (elem.Rendering.Format != null && elem.Rendering.Format === 'Compressed')) {
                if (this.columns.find(cur => cur === elem.Rendering.Label) == null) {
                    this.columns.push(elem.Rendering.Label);
                    let tableHeadRowHeader = document.createElement('th');
                    this.tableHeadRow.appendChild(tableHeadRowHeader);
                    tableHeadRowHeader.setAttribute("scope", "col");
                    tableHeadRowHeader.appendChild(document.createTextNode(elem.Rendering.Label));
                }
            } else {
                let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === elem.SubUseCase);
                if (subUseCase != null && elem.Rendering.Nesting != null && elem.Rendering.Nesting === 'Flattened') {
                    subUseCase.Detail.Elems.forEach(elemCur => {
                        this.presentTableElem(elemCur);
                    });
                }
            }
        } else {
            console.log("TemplateItem::presentTableElem - this.isLeaf = false");
            this.isLeaf = false;
            let subUseCase = this.session.useCases.find(cur => cur.Id === elem.SubUseCase);
            if (subUseCase != null) {
                subUseCase.Detail.Elems.forEach(elemCur => {
                    this.presentTableElem(elemCur);
                });
            }
        }
    }

    presentForm() {
        console.log("TemplateItem::presentForm");
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
        if (this.useCase.Detail.Rendering.Actions != null) {
            let divCur = document.createElement('div');
            this.formList.appendChild(divCur);
            divCur.className = 'mb-3';
            this.useCase.Detail.Rendering.Actions.forEach(actionCur => {
                let buttonCur = document.createElement('button');
                divCur.appendChild(buttonCur);
                buttonCur.className = 'btn btn-success';
                buttonCur.setAttribute("type", "button");
                buttonCur.id = actionCur.Name;
                buttonCur.style.width = "12em";
                buttonCur.style.marginLeft = '25%';
                buttonCur.style.marginRight = '30px';
                    buttonCur.appendChild(document.createTextNode(actionCur.Label));
                buttonCur.addEventListener('click', (event) => {
                    event.preventDefault();

                    let attrs = {};
                    let fUpdated = false;
                    for (let formAttrCur in this.formData) {
                        attrs[formAttrCur] = this.formData[formAttrCur];
                        fUpdated = true;
                    }
            
                    this.session.appConfig.WebAppCustomCode[actionCur.ActionFunction](
                        {
                            Action: actionCur.Name,
                            opt: {
                                Fund: attrs['Fund'],
                                effectiveEntryDate: attrs['EntryDate'],
                                routing: attrs['RoutingNumber'],
                                account: attrs['AccountNumber'],
                                amount: attrs['Amount'],
                                acct_name: attrs['AccountName'],
                                transactionCode: attrs['AccountType'],

                                immediateOriginName: 'IHC',
                                companyName: 'IHC',
                                companyEntryDescription: 'IHC DISTR',
                                user_id: ''
                            }
                        },
                         this.actionCallback
                    );
                });

                this.aCur = document.createElement('a');
                this.aCur.setAttribute("download", "downloaded.txt");
                this.aCur.appendChild(document.createTextNode("Download File"));
                divCur.appendChild(this.aCur);

            });
        }
    }

    presentFormElem(elem) {
        console.log("TemplateItem::presentFormElem");
        if (elem.Rendering.Nesting == null || elem.Rendering.Nesting !== 'Coerced') {
            if (elem.SubUseCase == null || (elem.Rendering.Format != null && elem.Rendering.Format === 'DrillDown')) {
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
                let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === elem.SubUseCase);
                if (subUseCase != null && elem.Rendering.Nesting != null && elem.Rendering.Nesting === 'Flattened') {
                    subUseCase.Detail.Elems.forEach(elemCur => {
                        this.presentFormElem(elemCur);
                    });
                }
            }
        } else {
            console.log("TemplateItem::presentFormElem - this.isLeaf = false");
            this.isLeaf = false;
            let subUseCase = this.session.useCases.find(cur => cur.Id === elem.SubUseCase);
            if (subUseCase != null) {
                subUseCase.Detail.Elems.forEach(elemCur => {
                    this.presentFormElem(elemCur);
                });

            }
        }
    }

    saveFormData() {
        console.log("TemplateItem::saveFormData");
        let attrs = {};
        let fUpdated = false;
        for (let formAttrCur in this.formData) {
            attrs[formAttrCur] = this.formData[formAttrCur];
            fUpdated = true;
        }
        if (fUpdated) {
            // Assuming a dataItem array of just 1. Generalize for multiple items
            this.toServer({
                Action: 'Put',
                ItemKey: this.dataItems[0].Key,
                Attrs: attrs
            });

        } else {
            this.popBreadcrumb();
        }
    }

    actionCallback(result) {
        console.log("TemplateItem::actionCallback");
        this.actionResult = result;
        this.aCur.setAttribute("href", "data:text/plain;charset=utf-8," + this.actionResult);
    }

    presentPickList() {
        console.log("TemplateItem::presentPickList");
    }

    presentTableRows() {
        console.log("TemplateItem::presentTableRows");
        this.dataItems.forEach(itemCur => {
            this.presentRow(itemCur, this.itemCellsParent);
        });
    }

    presentRow(itemCur, itemCellsParent) {
        console.log("TemplateItem::presentRow");
        this.itemCells[itemCur.Key] = [];
        itemCellsParent.forEach(cellParentCur => {
            let cellParentLocal = {...cellParentCur};
            if (cellParentCur.Td != null) {
                cellParentLocal.Td = cellParentCur.Td.cloneNode(true);
            }
            this.itemCells[itemCur.Key].push(cellParentLocal);
        });
        this.templateItemCoercer.columns.forEach(colCur => {
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
        this.presentRowCells(itemCur, this.useCase.Detail.Elems, null);
        if (this.isLeaf === true) {
            if (itemCur.isEmpty === false) {
                let tableItemRow = document.createElement('tr');
                this.templateItemCoercer.tableBody.appendChild(tableItemRow);
                tableItemRow.dataItem = itemCur;
                if (this.templateItemCoercer.useCase.Detail.Rendering.Actions != null &&
                    this.templateItemCoercer.useCase.Detail.Rendering.Actions.find(cur => cur.Name === 'DrillDown')) {
                    let renderingAction = this.templateItemCoercer.useCase.Detail.Rendering.Actions.find(cur => cur.Name === 'DrillDown');
                    if (renderingAction != null && this.useCase.Detail.SubUseCase != null) {
                        tableItemRow.addEventListener('click', (event) => {
                            event.preventDefault();
                            console.log("presentRow - Item picked: ", event.currentTarget.dataItem.Key);
                            if (this.divItem == null) {
                                this.divItem = document.createElement('div');
                                this.divItemSurrounding.appendChild(this.divItem);
                            }
                            this.templateItemCoercer.divItemSub = document.createElement('div');
                            this.templateItemCoercer.divItemSub.className = 'mb-3';
                            this.templateItemCoercer.divItemSub.style.margin = '10px';
                            let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === this.useCase.Detail.SubUseCase);
                            this.templateItemSub = new TemplateItem(this, subUseCase, this.templateItemCoercer.divItemSub, this.templateItemCoercer.isCoerced);
                            this.toServer({
                                Action: 'Drilldown',
                                TemplateItem: {
                                    ItemKey: event.currentTarget.dataItem.Key,
                                    UseCaseName: subUseCase.Detail.Name,
                                    Action: 'Start'
                                }
                            });
                            this.templateItemCoercer.pushBreadcrumb(this.templateItemSub);
                        });
                    }
                }
                this.itemCells[itemCur.Key].forEach(cellCur => {
                    if (cellCur.Td == null) {
                        cellCur.Td = document.createElement('td');
                    }
                    tableItemRow.appendChild(cellCur.Td);
                });
            }
        }
    }

    presentRowCells(itemCur, elems, cellCompressed) {
        console.log("TemplateItem::presentRowCells");
        elems.forEach(elemCur => {
            let cellCur;
            if (cellCompressed != null) {
                cellCur = cellCompressed;
            } else {
                cellCur = this.itemCells[itemCur.Key].find(cur => cur.Col === elemCur.Rendering.Label);
            }
            if (elemCur.SubUseCase == null) {
                let valueCur = itemCur.Attrs[elemCur.Name] != null ? itemCur.Attrs[elemCur.Name] : '';
                if (cellCur != null) {
                    if (cellCur.Td == null) {
                        cellCur.Td = document.createElement('td');
                    }
                    cellCur.Rendering = elemCur.Rendering;
                    cellCur.Elem = elemCur;
                    cellCur.Value = valueCur;
                    itemCur.isEmpty = false;
                    let displayValue = valueCur;
                    if (cellCur.Rendering.Width != null) {
                        if (cellCur.Td.style.width == null || (parseInt(cellCur.Rendering.Width) > parseInt(cellCur.Td.style.width))) {
                            cellCur.Td.style.width = cellCur.Rendering.Width;
                        }
                    }
                    if (cellCur.Rendering.Format != null) {
                        if (cellCur.Rendering.Format === 'Date') {
                            displayValue = cellCur.Value.substring(0, 19).replace('-', '/').replace('-', '/').replace('T', ' ');
                        }
                    }
                    if (cellCur.Rendering.Format === 'URL') {
                        let fileName = cellCur.Value.substring(displayValue.lastIndexOf('/') + 1);
                        let fileExt = fileName.substring(fileName.lastIndexOf('.') + 1);
                        switch (fileExt.toLowerCase()) {
                            case 'pdf':
                                let aCur = document.createElement('a');
                                aCur.setAttribute("href", displayValue);
                                aCur.setAttribute("download", fileName);
                                aCur.appendChild(document.createTextNode(fileName));
                                cellCur.Td.appendChild(aCur);
                                break;
                            case 'jpg':
                            case 'jpeg':
                            case 'gif':
                            case 'png':
                                let imgCur = document.createElement('img');
                                imgCur.setAttribute("src", displayValue);
                                imgCur.setAttribute("width", 'auto');
                                cellCur.Td.appendChild(imgCur);
                                break;
                            default:
                                break;
                        }
                    } else {
                        cellCur.Td.appendChild(document.createTextNode(displayValue));
                    }
                }
            } else {
                let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === elemCur.SubUseCase);
                if (subUseCase != null) {
                    if (elemCur.Rendering.Nesting != null && elemCur.Rendering.Nesting === 'Flattened') {
                        if (elemCur.Rendering.Format != null && elemCur.Rendering.Format === 'Compressed' || cellCompressed != null) {
                            if (cellCur.Td == null) {
                                cellCur.Td = document.createElement('td');
                            } else {
                                cellCur.Td.appendChild(document.createElement('br'));
                            }
                            this.presentRowCells(itemCur, subUseCase.Detail.Elems, cellCur);
                        } else {
                            this.presentRowCells(itemCur, subUseCase.Detail.Elems, null);
                        }
                    }
                }
            }
        });
    }

    presentFormColumns() {
        console.log("TemplateItem::presentFormColumns");
        this.dataItems.forEach(itemCur => {
            this.presentColumn(itemCur, this.itemCellsParent);
        });
    }

    presentColumn(itemCur, itemCellsParent) {
        console.log("TemplateItem::presentColumn");
        this.itemCells[itemCur.Key] = [];
        itemCellsParent.forEach(cellParentCur => {
            let cellParentLocal = {...cellParentCur};
            if (cellParentCur.Input != null) {
                cellParentLocal.Input = cellParentCur.Input.cloneNode(true);
            }
            this.itemCells[itemCur.Key].push(cellParentLocal);
        });
        this.templateItemCoercer.columns.forEach(colCur => {
            let cellCur = this.itemCells[itemCur.Key].find(cur => cur.Col === colCur);
            if (cellCur == null) {
                this.itemCells[itemCur.Key].push({
                    Col: colCur,
                    Value: '',
                    Input: null
                });
            }
        });
        itemCur.isEmpty = true;
        this.presentColumnCells(itemCur, this.useCase.Detail.Elems);
        if (this.isLeaf === true) {
            if (itemCur.isEmpty === false) {
            }
        }
    }

    presentColumnCells(itemCur, elems) {
        console.log("TemplateItem::presentColumnCells");
        elems.forEach(elemCur => {
            if (elemCur.SubUseCase == null || (elemCur.Rendering.Format != null && elemCur.Rendering.Format === 'DrillDown')) {
                let valueCur = itemCur.Attrs[elemCur.Name] != null ? itemCur.Attrs[elemCur.Name] : '';
                let cellCur = this.itemCells[itemCur.Key].find(cur => cur.Col === elemCur.Rendering.Label);
                if (cellCur != null) {
                    cellCur.Rendering = elemCur.Rendering;
                    cellCur.Elem = elemCur;
                    cellCur.Value = valueCur;
                    let divField = this.formList.firstChild;
                    while (divField != null) {
                        if (divField.rendering != null && divField.rendering.Label === cellCur.Col) {
                                // KLUDGE
                                if (divField.rendering.Label === 'TaskActions') {
                                    divField.rendering.Format = 'Textarea';
                                    divField.rendering.Rows = '6';
                                }
                                if (divField.rendering.Label === 'Attachments') {
                                    divField.rendering.Format = 'File';
                                }

                            if (divField.rendering.Format != null) {
                                switch (divField.rendering.Format) {
                                    case 'Text':
                                        cellCur.Input = document.createElement('input');
                                        cellCur.Input.id = cellCur.Elem.Name;
                                        divField.appendChild(cellCur.Input);
                                        cellCur.Input.setAttribute("type", "input");
                                        cellCur.Input.value = cellCur.Value;
                                        cellCur.Input.style.width = '70%';
                                        cellCur.Input.addEventListener('blur', (event) => {
                                            event.preventDefault();
                                            this.formData[event.target.id] = event.target.value
                                        });
                                        if (divField.rendering.Editable != null && divField.rendering.Editable.toLowerCase() === 'no') {
                                            cellCur.Input.disabled = true;
                                        }
                                        break;
                                    case 'File':
                                        cellCur.Input = document.createElement('input');
                                        cellCur.Input.id = cellCur.Elem.Name;
                                        divField.appendChild(cellCur.Input);
                                        cellCur.Input.setAttribute("type", "file");
                                        cellCur.Input.setAttribute("multiple", "");
                                        cellCur.Input.value = cellCur.Value;
                                        cellCur.Input.style.width = '70%';
                                        cellCur.Input.addEventListener('blur', (event) => {
                                            event.preventDefault();
                                            this.formData[event.target.id] = event.target.value;
                                            let labelCur = '';
                                            for (let cur = 0; cur < event.target.files.length; cur++) {
                                                labelCur += event.target.files[cur].name;
                                            };
                                            alert(labelCur);
                                            event.target.appendChild(document.createTextNode(labelCur));
                                        });
                                        if (divField.rendering.Editable != null && divField.rendering.Editable.toLowerCase() === 'no') {
                                            cellCur.Input.disabled = true;
                                        }
                                        break;
                                    case 'Date':
                                        cellCur.Input = document.createElement('div');
                                        divField.appendChild(cellCur.Input);
                                        cellCur.Input.className = 'input-group date';
                                        cellCur.Input.style.display = 'inline';
                                        let inputDate = document.createElement('input');
                                        inputDate.id = cellCur.Elem.Name;
                                        cellCur.Input.appendChild(inputDate);
                                        inputDate.setAttribute("type", "date");
                                        if (cellCur.Value != null && cellCur.Value > '') {
                                            let valueCur1 = new Date(cellCur.Value);
                                            inputDate.value = valueCur1.toISOString();
                                        } else {
                                            inputDate.value = '';
                                        }
                                        inputDate.style.width = '70%';
                                        inputDate.addEventListener('blur', (event) => {
                                            event.preventDefault();
                                            this.formData[event.target.id] = event.target.value;
                                        });
                                        let itemImgCal = document.createElement('i');
                                        cellCur.Input.appendChild(itemImgCal);
                                        itemImgCal.className = 'bi bi-calendar';
                                        itemImgCal.style.marginLeft = "10px";
                                        break;
                                    case 'Textarea':
                                        cellCur.Input = document.createElement('textarea');
                                        cellCur.Input.id = cellCur.Elem.Name;
                                        divField.appendChild(cellCur.Input);
                                        if (divField.rendering.Rows != null) {
                                            cellCur.Input.setAttribute("rows", divField.rendering.Rows);
                                        }
                                        cellCur.Input.value = cellCur.Value;
                                        cellCur.Input.style.width = '70%';
                                        cellCur.Input.addEventListener('blur', (event) => {
                                            event.preventDefault();
                                            this.formData[event.target.id] = event.target.value
                                        });
                                        if (divField.rendering.Editable != null && divField.rendering.Editable.toLowerCase() === 'no') {
                                            cellCur.Input.disabled = true;
                                        }
                                        break;
                                    case 'DrillDown':
                                        cellCur.Input = document.createElement('button');
                                        cellCur.Input.id = cellCur.Elem.Name;
                                        divField.appendChild(cellCur.Input);
                                        cellCur.Input.className = 'btn btn-primary';
                                        cellCur.Input.setAttribute("type", "button");
                                        cellCur.Input.style.width = "22em";
                                        cellCur.Input.appendChild(document.createTextNode(divField.rendering.Label));
                                        cellCur.Input.addEventListener('click', (event) => {
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
                                            let dataItem = this.dataItems[0];		// For forms with multiple items, [0] will change to [i]
                                            if (this.elemDataItems[dataItem.Key] == null) {
                                                this.elemDataItems[dataItem.Key] = {};
                                            }
                                            let templateElemPicked = null;
                                            if (this.elemDataItems[dataItem.Key][divField.elem.Name] == null) {
                                                templateElemPicked = new TemplateElem(this, dataItem, null, divField.elem, this.divItemSub);
                                                this.elemDataItems[dataItem.Key][divField.elem.Name] = templateElemPicked;
                                            } else {
                                                templateElemPicked = this.elemDataItems[dataItem.Key][divField.elem.Name];
                                            }
                                            if (this.dataElem == null) {
                                                this.toServer({
                                                    Action: 'ContinueTemplateElem',
                                                    ItemKey: itemCur.Key,
                                                    TemplateElem: {
                                                        ItemKey: itemCur.Key,
                                                        UseCaseElemName: divField.elem.Name,
                                                        Action: 'Start',
                                                        TemplateItem: {
                                                            UseCaseName: subUseCase.Detail.Name,
                                                            Action: 'Start'
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                        break;
                                    default:
                                        break;
                                }
                            } else {
                                cellCur.Input = document.createElement('input');
                                cellCur.Input.id = cellCur.Elem.Name;
                                divField.appendChild(cellCur.Input);
                                cellCur.Input.setAttribute("type", "input");
                                cellCur.Input.value = cellCur.Value; // valueCur;
                                cellCur.Input.style.width = '70%';
                                cellCur.Input.addEventListener('blur', (event) => {
                                    event.preventDefault();
                                    this.formData[event.target.id] = event.target.value
                                });
                                if (divField.rendering.Editable != null && divField.rendering.Editable.toLowerCase() === 'no') {
                                    cellCur.Input.disabled = true;
                                }
                            }
                            break;
                        } else {
                            divField = divField.nextSibling;
                        }
                    }
                }
            } else {
                let subUseCase = this.session.useCases.find(useCaseCur => useCaseCur.Id === elemCur.SubUseCase);
                if (elemCur.Rendering.Nesting != null && elemCur.Rendering.Nesting === 'Flattened') {
                    if (subUseCase != null) {
                        this.presentColumnCells(itemCur, subUseCase.Detail.Elems);
                    }
                }
            }
        });
    }

    /*
    case 'Json':
        cellCur.Input = document.createElement('textarea');
        divCur.appendChild(cellCur.Input);
        cellCur.Input.setAttribute("rows", "4");
        if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null) {
            cellCur.Input.value = JSON.stringify(this.item.Attrs[elemCur.Name]);
        } else {
            cellCur.Input.value = '';
        }
        cellCur.Input.style.width = '70%';
        cellCur.Input.addEventListener('blur', (event) => {
            event.preventDefault();
            this.formData[event.target.id] = event.target.value
        });
        if (elemCur.Editable != null && elemCur.Editable.toLowerCase() === 'no') {
            cellCur.Input.disabled = true;
        }
        break;
    case 'Textarea':
        cellCur.Input = document.createElement('textarea');
        divCur.appendChild(cellCur.Input);
        cellCur.Input.setAttribute("rows", "4");
        if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null) {
            cellCur.Input.value = this.item.Attrs[elemCur.Name];
        } else {
            cellCur.Input.value = '';
        }
        cellCur.Input.style.width = '70%';
        cellCur.Input.addEventListener('blur', (event) => {
            event.preventDefault();
            this.formData[event.target.id] = event.target.value
        });
        if (elemCur.Editable != null && elemCur.Editable.toLowerCase() === 'no') {
            cellCur.Input.disabled = true;
        }
        break;
    case 'Checkbox':
        cellCur.Input = document.createElement('input');
        divCur.appendChild(cellCur.Input);
        cellCur.Input.className = 'form-check-input';
        cellCur.Input.setAttribute("type", "checkbox");
        if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null && this.item.Attrs[elemCur.Name] !== "") {
            cellCur.Input.checked = true
        } else {
            cellCur.Input.checked = false;
        }
        cellCur.Input.style.marginRight = "1em";
        cellCur.Input.addEventListener('blur', (event) => {
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
        cellCur.Input = document.createElement('input');
        divCur.appendChild(cellCur.Input);
        cellCur.Input.className = 'form-check-input';
        cellCur.Input.setAttribute("type", "radio");
        cellCur.Input.style.width = '70%';
        if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null && this.item.Attrs[elemCur.Name] !== "") {
            cellCur.Input.checked = true
        } else {
            cellCur.Input.checked = false;
        }
        cellCur.Input.style.marginRight = "1em";
        cellCur.Input.addEventListener('blur', (event) => {
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
        cellCur.Input = document.createElement('select');
        divCur.appendChild(cellCur.Input);
        let valuePicked = '';
        if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null) {
            valuePicked = this.item.Attrs[elemCur.Name];
        }
        if (elemCur.ValueSet != null) {
            elemCur.ValueSet.forEach(itemCur => {
                let option = document.createElement('option');
                cellCur.Input.appendChild(option);
                if (itemCur === valuePicked) {
                    option.setAttribute('selected', 'selected');
                }
                let spanAttr = document.createElement('span');
                option.appendChild(spanAttr);
                spanAttr.appendChild(document.createTextNode(itemCur));
            });
        }
        cellCur.Input.addEventListener('change', (event) => {
            event.preventDefault();
            console.log("click on option", event.target.value);
            this.formData[elemCur.Name] = event.target.value;
        });
        break;
    case 'DrillDown':
        cellCur.Input = document.createElement('button');
        divCur.appendChild(cellCur.Input);
        cellCur.Input.className = 'btn btn-primary';
        cellCur.Input.setAttribute("type", "button");
        cellCur.Input.style.width = "22em";
        cellCur.Input.appendChild(document.createTextNode(labelText));
        cellCur.Input.addEventListener('click', (event) => {
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
        cellCur.Input = document.createElement('div');
        divCur.appendChild(cellCur.Input);
        cellCur.Input.style.display = "inline-block";
        cellCur.Input.style.width = '70%';
        elemPicked = this.useCase.elems[elemCur.Name];
        break;
    case 'InPlace':
        cellCur.Input = document.createElement('div');
        divCur.appendChild(cellCur.Input);
        cellCur.Input.style.display = "inline-block";
        cellCur.Input.style.width = '70%';
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
        console.log("TemplateItem::showCrumbs");
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
        console.log("TemplateElem::constructor");
        this.divItemParent = divItemParent;
        if (this.useCaseElem.Rendering != null && this.useCaseElem.Rendering.Nesting != null &&  this.useCaseElem.Rendering.Nesting === 'Coerced') {
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
            let isItemCoerced = (this.useCaseElem.Rendering.Nesting != null && this.useCaseElem.Rendering.Nesting === 'Coerced') ? true : false;
            this.templateItem = new TemplateItem(this, subUseCase, this.divElem, isItemCoerced);
            if (this.useCaseElem.Rendering.Format != null && this.useCaseElem.Rendering.Format === 'DrillDown') {
                this.parent.pushBreadcrumb(this.templateItem);
            }
        }
        this.templateItem.setDataItems(message.DataItems);
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
                            if (this.templateItem.templateItemSub != null) {
                                this.templateItem.templateItemSub.continueTemplateElem(message.TemplateElem);
                            } else {
                                this.templateItem.continueTemplateElem(message.TemplateElem);
                            }
                        }
                    }
                    break;
                case 'StartTemplateItem':
                    if (message.TemplateItem != null) {
                        if (this.templateItem.templateItemSub != null) {
                            this.templateItem.templateItemSub.setDataItems(message.TemplateItem.DataItems);
                        }
                    }
                    break;
                case 'ContinueTemplateItem':
                    if (message.TemplateItem != null) {
                        if (this.templateItem.templateItemSub != null) {
                            this.templateItem.templateItemSub.continueTemplateItem(message.TemplateItem);
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
        console.log("TemplateElem::show");
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
        console.log("TemplateElem::hide");
        if (this.visible == true) {
            this.divElem.style.visibility = 'hidden';
            this.divElem.style.display = 'none';
            this.visible = false;
        }
    }

    destroy() {
        console.log("TemplateElem::destroy");
        this.divItemParent.removeChild(this.divElem);
        this.divElem = null;
    }
}

module.exports = {
    TemplateItem: TemplateItem
}
