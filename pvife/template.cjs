class TemplateItem {
    constructor(parent, divTarget) {
        this.parent = parent;
        this.divTarget = divTarget;
        this.track = this.parent.track;
        this.elems = {};
        this.itemKey = null;
        this.toServer = this.toServer.bind(this);
    }

    destroy() {
    }

    fromServer(message) {
        console.log("TemplateItem::fromServer(): ", message);
        if (message.Action != null) {
            switch (message.Action) {
                case 'ContinueTemplateElem':
                    if (message.TemplateElem != null && message.TemplateElem.UseCaseElemName != null) {
                        if (this.elems[message.TemplateElem.UseCaseElemName] != null) {
                            this.elems[message.TemplateElem.UseCaseElemName].fromServer(message.TemplateElem);
                        }
                    }
                    break;
                case 'AcceptData':
                    /*
                    if (this.item == null) {
                        this.item = new Item(this, null, message.Item.Id);
                    }
                    this.item.attrs = message.Item.Attrs;
                    this.item.ext = message.Item.Ext;
                    this.item.childItems = message.Item.ChildItems;
                    //this.setUseCaseForm();
                    this.refreshData();
                    break;
                    */
                default:
                    break;
            }
        }
        if (message.Item != null) {
            this.item = message.Item;
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
    }

    toServer(messageIn) {
        let messageOut = {
            Action: 'ContinueTemplateItem',
            TemplateItem: {
                UseCaseName: this.useCase.Detail.Name,
                ItemKey: this.itemKey,
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
        if (this.form != null) {
            this.divTarget.removeChild(this.form);
        }
        this.form = document.createElement('form');
        this.divTarget.appendChild(this.form);
        this.formData = {};
        let divCur;
        let buttonCur;
        let fFormEditable = this.useCase.Detail.Editable == null || this.useCase.Detail.Editable === 'Yes' ? true : false;
        this.useCase.Detail.Elems.forEach( (elemCur, elemIndex) => {
            divCur = document.createElement('div');
            this.form.appendChild(divCur);
            divCur.style.marginBottom = "10px";
            let labelText = elemCur.Label;
            let labelCur = document.createTextNode(labelText + ": ");
            let labelSpan = document.createElement('span');
            labelSpan.appendChild(labelCur);
            divCur.appendChild(labelSpan);
            labelSpan.style.display = "inline-block";
            labelSpan.style.verticalAlign = "top";
            labelSpan.style.width = "25%";
            let inputCur;
            let inputLabel;
            if (elemCur.Format != null) {
                switch (elemCur.Format) {
                    case 'Text':
                        inputCur = document.createElement('input');
                        divCur.appendChild(inputCur);
                        inputCur.setAttribute("type", "input");
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
                                //this.track.divTargetSub.removeChild(this.divTargetSub);
                            });

                            if (this.elems[elemCur.Name] == null) {
                                this.elems[elemCur.Name] = new TemplateElem(this, elemCur, this.divTargetSub, true);
                                this.track.pushBreadcrumb(this.elems[elemCur.Name]);
                            }
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
                        /*
                        this.elems[elemCur.Name] = new TemplateElemWeb(this, elemPicked, false, inputCur);
                        this.elems[elemCur.Name].initiateTrigger();
                        */ 
                        break;
                    case 'InPlace':
                        inputCur = document.createElement('div');
                        divCur.appendChild(inputCur);
                        inputCur.style.display = "inline-block";
                        inputCur.style.width = '70%';
                        elemPicked = this.useCase.elems[elemCur.Name];
                        /*
                        this.elems[elemCur.Name] = new TemplateElemWeb(this, elemPicked, false, inputCur);
                        this.elems[elemCur.Name].trigger();
                        */
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
                        //if (itemAttrCur.elemCur.Legend != null) {
                            inputLabel.appendChild(document.createTextNode(labelText));
                        //}

                        break;
                    case 'Date':
                        let divDate = document.createElement('div');
                        divCur.appendChild(divDate);
                        divDate.className = 'input-group date';
                        divDate.style.display = 'inline';
                        inputCur = document.createElement('input');
                        divDate.appendChild(inputCur);
                        inputCur.setAttribute("type", "date");
                        /*
                        let dateTemp = this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null ? this.item.Attrs[elemCur.Name] : '';
                        if (dateTemp > '') {
                            let valueCur = new Date(dateTemp);
                            inputCur.value = valueCur.toISOString().substr(0, 10);
                        }
                        */
                        if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null) {
                            let valueCur = new Date(this.item.Attrs[elemCur.Name]);
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
                                    option.setAttribute('selected','selected');
                                }
                                option.addEventListener('click', (event) => {
                                    event.preventDefault();
                                    console.log("click on option", itemCur);
                                    this.formData[elemCur.Name] = event.target.value;
                                });
                                let spanAttr = document.createElement('span');
                                option.appendChild(spanAttr);
                                spanAttr.appendChild(document.createTextNode(itemCur));
                            });
                        }
                        break;
                    default:
                        break;
                }
            } else {
                inputCur = document.createElement('input');
                divCur.appendChild(inputCur);
                inputCur.setAttribute("type", "input");
                if (this.item != null && this.item.Attrs != null && this.item.Attrs[elemCur.Name] != null) {
                    inputCur.value = this.item.Attrs[elemCur.Name];
                } else {
                    inputCur.checked = '';
                }
                inputCur.style.width = '70%';
                inputCur.addEventListener('blur', (event) => {
                    event.preventDefault();
                    this.formData[event.target.id] = event.target.value
                });
                if (elemCur.Editable != null && elemCur.Editable.toLowerCase() === 'no') {
                    inputCur.disabled = true;
                }
            }
            if (inputCur != null) {
                inputCur.id = elemCur.Name;
                if (!fFormEditable) {
                    inputCur.disabled = true;
                }
            }
        });

        if (fFormEditable) {
            divCur = document.createElement('div');
            this.form.appendChild(divCur);
            divCur.className = 'mb-3';
            buttonCur = document.createElement('button');
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
                this.track.popBreadcrumb();
                //this.track.div.removeChild(this.divTarget);
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
                /*
                if (this.useCase.Id === 'AlertTypeUpdate') {
                    let responseStart = window.prompt("Start Date", "");
                    if (responseStart != null && responseStart > "") {

                        let responseEnd = window.prompt("End Date", "");
                        if (responseEnd != null && responseEnd > "") {
                            alert(responseStart + " " + responseEnd);
                        }

                        alert(response);
                    }
                }
                */
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
            if (this.itemKey == null) {
                if (this.useCase.Detail.KeyAttribute != null) {
                    if (attrs[this.useCase.Detail.KeyAttribute] != null && attrs[this.useCase.Detail.KeyAttribute].Value != null) {
                        this.itemKey = attrs[this.useCase.Detail.KeyAttribute].Value;
                    }
                }
            }
            */
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
        } else {
            this.track.popBreadcrumb();
            //this.track.div.removeChild(this.divTarget);
        }
    }

    setItemKey(itemKey) {
        this.itemKey = itemKey;
        if (this.itemKey != null && this.useCase != null) {
            let messageOut = {
                Action: 'StartTemplateItem',
                TemplateItem: {
                    UseCaseName: this.useCase.Detail.Name,
                    ItemKey: this.itemKey
                }
            };
            this.parent.toServer(messageOut);
        }
    }

    setVisibility(trueOrFalse) {
        console.log("TemplateItem::setVisibility", trueOrFalse);
        if (trueOrFalse === true) {
            if (this.nav != null) {
                this.nav.style.visibility = 'visible';
                this.nav.style.display = 'flex';
                this.divTargetSub.style.visibility = 'visible';
                this.divTargetSub.style.display = 'block';
            } else {
                this.divTarget.style.visibility = 'visible';
                this.divTarget.style.display = 'block';
            }
        } else {
            if (this.nav != null) {
                this.nav.style.visibility = 'hidden';
                this.nav.style.display = 'none';
                this.divTargetSub.style.visibility = 'hidden';
                this.divTargetSub.style.display = 'none';
            } else {
                this.divTarget.style.visibility = 'hidden';
                this.divTarget.style.display = 'none';
            }
        }
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
            switch (message.Action) {
                case 'ContinueTemplateSub':
                    /*
                    if (this.templateSub != null && message.Template != null) {
                        this.templateSub.fromServer(message.Template);
                    }
                    break;
                    */
                case 'ContinueTemplateItem':
                    if (this.templateSub != null && message.TemplateItem != null) {
                        this.templateSub.fromServer(message.TemplateItem);
                    }
                    break;
                case 'AcceptDataList':
                    /*
                    if (message.ItemList != null) {
                        this.setListFromServer(message.ItemList);
                    }
                    break;
                    */
                default:
                    break;
            }
        }
        if (message.Items != null) {
            this.items = message.Items;
            //this.setUseCaseListRows();
            switch (this.useCase.Detail.Format) {
                case 'List':
                    this.setUseCaseListRows();
                    break;
                case 'PickList':
                    this.setUseCasePickListRows();
                    break;
                case 'Context':
                    this.setUseCasePickListRows();
                    break;
                default:
                    break;
            }
    
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
        //this.divTarget.appendChild(document.createTextNode(JSON.stringify(this.useCase)));
        this.divTarget.appendChild(this.elementPayload);
    }
    
    hide() {
        /*
        let child = this.divTarget.lastChild;
        while (child) {
            this.divTarget.removeChild(child);
            child = this.divTarget.lastChild;
        }
        */
        if (this.elementPayload != null) {
            this.divTarget.removeChild(this.elementPayload);
        }
    }

    setUseCase(useCase) {
        this.useCase = useCase;
        console.log("TemplateList::setUseCase(): ", this.useCase);
        switch (this.useCase.Detail.Format) {
            case 'List':
                this.elementPayload = document.createElement('div');
                this.divTarget.appendChild(this.elementPayload);
                this.setUseCaseList();
                break;
            case 'PickList':
                //this.elementPayload = document.createElement('select');
                this.setUseCasePickList();
                break;
            case 'Context':
                this.setUseCasePickList();
                break;
            default:
                break;
        }
    }
    
    setUseCaseList() {
        let divTableWrapper = document.createElement('div');
        this.elementPayload.appendChild(divTableWrapper);
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
        tableCaption.appendChild(document.createTextNode(this.useCase.Detail.Label));
        let divTitleRowAddButton = document.createElement('div');
        divTitleRow.appendChild(divTitleRowAddButton);
        divTitleRowAddButton.className = 'col-sm-2';

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
            tableHeadRowHeader.appendChild(document.createTextNode(elemCur.Label));
        });
        let messageOut = {
            Action: 'StartTemplateList',
            TemplateElem: {
                UseCaseName: this.useCase.Detail.Name
            }
        };
        this.parent.toServer(messageOut);
    }

    setUseCaseListRows() {
        this.items.forEach(itemCur => {
            let tableItemRow = document.createElement('tr');
            this.tableBody.appendChild(tableItemRow);
            tableItemRow.addEventListener('click', (event) => {
                event.preventDefault();
                console.log("TemplateList - item picked: ", itemCur.Key);

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
                if (this.useCase.Detail.UpdateUseCase != null) {
                    console.log("TemplateList - item picked: - this.useCase.Detail.UpdateUseCase != null ");
                    this.subUseCase = this.track.parent.useCases.find(useCaseCur => useCaseCur.Detail.Name === this.useCase.Detail.UpdateUseCase);
                    this.templateSub.setUseCase(this.subUseCase);
                    this.templateSub.setItemKey(itemCur.Key);
                    this.track.pushBreadcrumb(this.templateSub);
                }
            });

            this.useCase.Detail.Elems.forEach(elemCur => {
                let tableItemRowCell = document.createElement('td');
                tableItemRow.appendChild(tableItemRowCell);
                let valueCur = itemCur.Attrs[elemCur.Name] != null ? itemCur.Attrs[elemCur.Name].substr(0,1000) : ''
                tableItemRowCell.appendChild(document.createTextNode(valueCur));
            });
        });
    }
    
    setUseCasePickList() {
        this.selectList = document.createElement('select');
        this.divTarget.appendChild(this.selectList);
        let option = document.createElement('option');
        this.selectList.appendChild(option);
        let spanAttr = document.createElement('span');
        option.appendChild(spanAttr);
        spanAttr.appendChild(document.createTextNode('Select ...'));

        let messageOut = {
            Action: 'StartTemplateList',
            TemplateElem: {
                UseCaseName: this.useCase.Detail.Name
            }
        };
        this.parent.toServer(messageOut);

        /*
        inputCur = document.createElement('select');
        divCur.appendChild(inputCur);
        if (elemCur.ValueSet != null) {
            elemCur.ValueSet.forEach(itemCur => {
                let option = document.createElement('option');
                inputCur.appendChild(option);
                option.addEventListener('click', (event) => {
                    event.preventDefault();
                    console.log("click on option", itemCur);
                    this.formData[event.target.id] = event.target.value;
                });
                let spanAttr = document.createElement('span');
                option.appendChild(spanAttr);
                spanAttr.appendChild(document.createTextNode(itemCur));
            });
        }
        */

    }

    setUseCasePickListRows() {
        this.items.forEach(itemCur => {
            option = document.createElement('option');
            this.selectList.appendChild(option);
            option.addEventListener('click', (event) => {
                event.preventDefault();
                console.log("click on option", itemCur);
                if (this.parent.templateItemPicked != null) {
                    //this.parent.templateItemPicked.setItemId(itemCur.Id)
                }
            });
            spanAttr = document.createElement('span');
            option.appendChild(spanAttr);

            /*
            this.useCase.spec.Elems.forEach(elemCur => {
                let valueCur = itemCur.Attrs[elemCur.Name] != null ? itemCur.Attrs[elemCur.Name].Value : ''
                spanAttr.appendChild(document.createTextNode(valueCur + ' | '));
            });
            if (spanAttr.lastElementChild != null) {
                spanAttr.removeChild(spanAttr.lastElementChild);
            }
            */

            this.useCase.Detail.Elems.forEach(elemCur => {
                /*
                let tableItemRowCell = document.createElement('td');
                tableItemRow.appendChild(tableItemRowCell);
                let valueCur = itemCur.Attrs[elemCur.Name] != null ? itemCur.Attrs[elemCur.Name] : ''
                tableItemRowCell.appendChild(document.createTextNode(valueCur));
                */
                let valueCur = itemCur.Attrs[elemCur.Name] != null ? itemCur.Attrs[elemCur.Name] : ''
                spanAttr.appendChild(document.createTextNode(valueCur + ' | '));
            });

            //spanAttr.appendChild(document.createTextNode(itemCur));
        });
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
        //if (this.isDrillDown) {
            // Do breadcrumb logic like ver_0.2 - TemplateElemWeb:: trigger() - case: Child
            //this.track.div.appendChild(this.divTarget);
        //} else {
            if (this.useCaseElem.SubUseCase != null) {
                this.subUseCase = this.track.parent.useCases.find(useCaseCur => useCaseCur.Detail.Name === this.useCaseElem.SubUseCase);
                switch (this.subUseCase.Detail.Format) {
                    case 'List':
                    case 'PickList':
                    case 'Context':
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
        //}
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
            switch (this.subUseCase.Detail.Format) {
                case 'List':
                case 'PickList':
                    switch (message.Action) {
                        /*
                        case 'StartTemplateList':
                            this.trigger(message.TemplateList.ItemList);
                            break;
                        */
                        case 'ContinueTemplateList':
                            if (this.templateList != null && message.TemplateList != null) {
                                this.templateList.fromServer(message.TemplateList);
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                /*
                case 'Reference':
                    switch (message.Action) {
                        case 'StartTemplateList':
                            this.trigger(message.TemplateList.ItemList);
                            break;
                        case 'ContinueTemplateSub':
                            if (this.templateItemPicked != null && message.Template != null) {
                                this.templateItemPicked.fromServer(message.Template);
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                */
                default:
                    break;
            }
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

    setVisibility(trueOrFalse) {
        console.log("TemplateElem::setVisibility", trueOrFalse);
        if (trueOrFalse === true) {
            this.divTarget.style.visibility = 'visible';
            this.divTarget.style.display = 'block';
        } else {
            this.divTarget.style.visibility = 'hidden';
            this.divTarget.style.display = 'none';
        }
    }

}

module.exports = {
    TemplateItem: TemplateItem
}
