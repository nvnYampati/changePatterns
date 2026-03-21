import { LightningElement, track } from 'lwc';
import { loadScript } from "lightning/platformResourceLoader";
import jsbarcodeLib  from '@salesforce/resourceUrl/jsBarCode';
import qrcodejs from '@salesforce/resourceUrl/qrcode';

import getAllSObjects from '@salesforce/apex/SchemaUtils.getAllSObjectsController';
import getFieldsForSObject from '@salesforce/apex/SchemaUtils.getFieldsForSObjectController';
import getChildObjectsForSObject from '@salesforce/apex/SchemaUtils.getRelatedSObjectsDetails';
import fetchDataTableDetails from '@salesforce/apex/DynamicInvokerPdfStudioController.getDataTableDetails';

export default class BarCodeGeneratorPoc extends LightningElement {

    @track inputValue = '1234567890'; // default barcode value
    jsBarcodeInitialized = false;
    qrText = '';
    qrLibInitialized = false;

    renderedCallback() {
        if (this.jsBarcodeInitialized && this.qrLibInitialized) return;
        this.jsBarcodeInitialized = true;

        Promise.all([
            loadScript(this, jsbarcodeLib)
        ])
        .then(() => {
            this.renderBarcode();
        })
        .catch(error => {
            console.error('Error loading JsBarcode:', error);
        });

        Promise.all([ loadScript(this, qrcodejs) ])
        .then(() => {
            this.qrLibInitialized = true;
        })
        .catch(error => {
            console.error('Error loading QRCode library', error);
        });
    }

    handleInputChange(event) {
        this.inputValue = event.target.value;
        this.renderBarcode();
    }

    renderBarcode() {
        const svgElement = this.template.querySelector('svg.barcode');
        if (svgElement && window.JsBarcode) {
            // Clear old barcode before regenerating
            while (svgElement.firstChild) {
                svgElement.removeChild(svgElement.firstChild);
            }

            // Generate barcode
            window.JsBarcode(svgElement, this.inputValue, {
                format: 'CODE128',
                lineColor: '#000',
                width: 2,
                height: 60,
                displayValue: true,
                fontSize: 14,
                margin: 8
            });
        }
    }

    handleQRInputChange(event) {
        this.qrText = event.target.value;
    }

    generateQrCode() {
        if (!this.qrLibInitialized) return;

        const container = this.template.querySelector('.qr-box');
        container.innerHTML = ''; // Clear old QR

        // eslint-disable-next-line no-undef
        new QRCode(container, {
            text: this.qrText || 'Hello LWC!',
            width: 128,
            height: 128,
        });
    }


    ////////////////////// SOQL builer

    @track allSObjects = [];
    @track filteredSObjects = [];
    @track fieldOptions = [];
    @track selectedSObject = '';
    @track selectedFields = [];
    @track searchKey = '';
    showSObjectList = false;
    showFieldOptions = false;
    @track fieldSearchKey = '';
    conditionLogic = 'ALL';
    customConditionInput = '';
    selectedSObjectChildObjects = [];
    @track filteredFieldOptions = [];

    get disableFIlter(){
        return this.selectedSObject == null || (Array.isArray(this.selectedSObject) && this.selectedSObject.length == 0);
    }
    
    get soqlQuery() {
        if(this.searchKey.length == 0) return '';
        
        const activeFilters = (Array.isArray(this.filters) && this.filters.length>0) ? this.filters : []; //.map((filter)=>{if(filter.value != null) return filter;})
            // .map((f, idx) => ({ idx: idx + 1, condition: f.condition }))
            // .filter(f => f.condition);
        let whereClause = '';
        if(Array.isArray(activeFilters) && activeFilters.length>0){
            if(this.selectedSObject == '') return ``;
            if (this.conditionLogic === 'ALL') {
                whereClause = activeFilters.map(f => f.condition).join(' AND ');
            } else if (this.conditionLogic === 'ANY') {
                whereClause = activeFilters.map(f => f.condition).join(' OR ');
            } else if (this.conditionLogic === 'CUSTOM') {
                // User enters condition like: (1 AND 2) OR 3
                // Replace filter numbers with actual conditions
                whereClause = this.customConditionInput;
                activeFilters.forEach(f => {
                    const regex = new RegExp('\\(' + f.serial + '\\)', 'g');       //new RegExp(`\\b(${f.serial})\\b`, 'g');
                    whereClause = whereClause.replace(regex, f.condition);
                    
                    // .replace(/\((\d+)\)/g, () => {
                    //     return f.condition;
                    // });
                    //.replace(regex, f.condition);
                });
            }
        }
        
        if(Array.isArray(this.selectedFields) && this.selectedFields.length == 0 && whereClause == '') 
            return `SELECT Id FROM ${this.selectedSObject}`;

        else if(Array.isArray(this.selectedFields) && this.selectedFields.length == 0 && whereClause != '') 
            return `SELECT Id FROM ${this.selectedSObject} WHERE ${whereClause}`;

        else if(Array.isArray(this.selectedFields) && this.selectedFields.length > 0 && whereClause == '') 
            return `SELECT Id, ${this.selectedFields.join(', ')} FROM ${this.selectedSObject}`;

        else if(Array.isArray(this.selectedFields) && this.selectedFields.length > 0 && whereClause != '') 
            return `SELECT Id, ${this.selectedFields.join(', ')} FROM ${this.selectedSObject} WHERE ${whereClause}`; 
        
        return `SELECT Id, ${this.selectedFields.join(', ')} FROM ${this.selectedSObject} WHERE ${whereClause}`;
    }

    
    get isCustomLogic(){
        return this.conditionLogic !== 'CUSTOM';
    }
    connectedCallback() {
        this.loadSObjects();
    }

    async loadSObjects() {
        try {
            const data = await getAllSObjects();
            if(Array.isArray(data) && data.length>0){
                this.allSObjects = data.map(item => ({
                    label: item.label + ' (' + item.apiName + ')',
                    value: item.apiName
                }));
                this.filteredSObjects = this.allSObjects;
            } else {
                this.allSObjects = [];
                this.filteredSObjects = [];
            }
        } catch (error) {
            console.error(error);
        }
    }

    handleSearchObjectFocus() {
        console.log('>> handleSearchObjectFocus <<');
        this.showSObjectList = true;
    }

    handleSearchChange(event) {
        this.searchKey = event.target.value.toLowerCase();
        if (this.searchKey && Array.isArray(this.allSObjects) && this.allSObjects.length>0) {
            this.filteredSObjects = this.allSObjects.filter(obj =>
                obj.label.toLowerCase().includes(this.searchKey) ||
                obj.value.toLowerCase().includes(this.searchKey)
            );
        } else {
            this.filteredSObjects = [];
        }
        this.showSObjectList = true;
    }
    
    handleFieldSelect(event) {
        const field = event.currentTarget.dataset.value;    //event.target.value;
        if (!this.selectedFields.includes(field)) {
            this.selectedFields = [...this.selectedFields, field];
            this.refreshFieldHighlights();
        }
        console.log('handleFieldSelect '+JSON.stringify(this.selectedFields));
    }

    removeField(event) {
        const field = event.currentTarget.dataset.value;
        this.selectedFields = (Array.isArray(this.selectedFields) && this.selectedFields.length>0)? this.selectedFields.filter(f => f !== field) : [];
        this.refreshFieldHighlights();
    }

    handleSearchObjectBlur(){
        console.log('>> handleSearchObjectBlur <<');
        //this.showSObjectList = false;
    }

    async handleSObjectClick(event) {
        this.selectedSObject = event.currentTarget.dataset.value;
        this.searchKey = this.selectedSObject;
        this.filteredSObjects = []; // collapse list after selection
        this.showSObjectList = false;
        this.selectedFields = [];
        this.filters = [];

        try {
            const data = await getFieldsForSObject({ sobjectName: this.selectedSObject });
            if(Array.isArray(data) && data?.length > 0){
                this.fieldOptions = data?.map(f => ({
                    label: f.label + ' (' + f.apiName + ')',
                    value: f.apiName,
                    className: '', // default
                    type: f.type,
                    picklistValues: f.picklistValues || []
                }));
                this.filteredFieldOptions = this.fieldOptions;
            } else {
                this.fieldOptions = [];
                this.filteredFieldOptions = [];
            }
            if(this.selectedSObject != ''){
                const relatedData = await getChildObjectsForSObject({ sobjectName: this.selectedSObject });
                this.selectedSObjectChildObjects = (Array.isArray(relatedData) && relatedData.length>0)? relatedData.map(f => ({
                    label: f.label + ' (' + f.name + ')',
                    value: f.name,
                    className: '', // default
                    type: f.type
                    //fields: f.fields || []
                })) : [];
            }
            console.log('>> selectedSObjectChildObjects << '+JSON.stringify(this.selectedSObjectChildObjects));
            this.refreshFieldHighlights();
        } catch (error) {
            console.error(error);
        }
    }

    openFieldOptions(){
        this.showFieldOptions = !this.showFieldOptions;
    }

    handleFieldSearchObjectFocus() {
        console.log('>> handleSearchObjectFocus <<');
        this.showFieldOptions = true;
    }

    handleFieldSearchChange(event) {
        this.fieldSearchKey = event.target.value.toLowerCase();
        if (this.fieldSearchKey && Array.isArray(this.fieldOptions) && this.fieldOptions.length>0) {
            this.filteredFieldOptions = this.fieldOptions.filter(obj =>
                obj.label.toLowerCase().includes(this.fieldSearchKey) ||
                obj.value.toLowerCase().includes(this.fieldSearchKey)
            );
        } else {
            this.filteredFieldOptions = [];
        }
        this.showFieldOptions = true;
    }
    
    
    handleFieldSearchObjectBlur(){
        console.log('>> handleSearchObjectBlur <<');
        //this.showSObjectList = false;
    }

    handleGetRecords(){
        fetchDataTableDetails({queryString: this.soqlQuery})
        .then((res)=>{
            if(res.success){
                console.log('has data >> '+JSON.stringify(res));
            } else console.log('no data >> '+JSON.stringify(res));
        }).catch((error)=>{
            console.error('fetchDataTableDetails >> '+JSON.stringify(error));
        });
    }

    // Filters Section

    filters = [];
    filterIndex = 0;

    // Add a new filter row
    addFilter() {
        this.filters = [
            ...this.filters,
            {
                id: `filter-${this.filterIndex}`,
                serial: this.filterIndex+1,         //filterIndex starts with 0
                field: null,
                type: null,
                isText: false,
                isNumeric: false,
                isPicklist: false,
                isMultiPicklist: false,
                picklistOptions: [],
                operator: null,
                value: null,
                condition: '',
                disableOperator: true
            }
        ];
        this.filterIndex++;
        this.reSerializeFilters();
    }

    // Handle field select
    handleFilterFieldSelect(event) {
        const index = event.target.dataset.id
        const fieldName = event.target.value;
        const fieldMeta = (Array.isArray(this.fieldOptions) && this.fieldOptions.length>0)? this.fieldOptions.find(f => f.value === fieldName) : {};
        console.log('fieldMeta >> '+JSON.stringify(fieldMeta));

        let type = null,
            isText = false,
            isNumeric = false,
            isPicklist = false,
            isMultiPicklist = false,
            isCheckBox = false,
            picklistOptions = [];

        if (fieldMeta && fieldMeta.hasOwnProperty('type') && fieldMeta.hasOwnProperty('picklistValues')) {
            type = fieldMeta.type;
            if (['STRING', 'TEXTAREA','URL', 'ID', 'REFERENCE'].includes(type)) {
                isText = true;
            } else if (['INTEGER', 'DOUBLE', 'CURRENCY', 'PERCENT','PHONE'].includes(type)) {
                isNumeric = true;
            } else if (type === 'PICKLIST') {
                isPicklist = true;
                picklistOptions = (Array.isArray(fieldMeta.picklistValues) && fieldMeta.picklistValues.length>0)? fieldMeta.picklistValues : []; //this.picklistValues[fieldName] || [];
            } else if (type === 'multipicklist' || type === 'MULTIPICKLIST') {
                isMultiPicklist = true;
                picklistOptions = (Array.isArray(fieldMeta.picklistValues) && fieldMeta.picklistValues.length>0)? fieldMeta.picklistValues : [];
            } else if (type === 'BOOLEAN') {
                isCheckBox = true;
            }
        }

        let currentFilter = {};
        if(Array.isArray(this.filters) && this.filters.length>0){
            this.filters = this.filters.map((f)=>{
                if(f.id == index){
                    f = {
                        ...f,
                        field: fieldName,
                        type,
                        isText,
                        isNumeric,
                        isPicklist,
                        isMultiPicklist,
                        isCheckBox,
                        picklistOptions,
                        operator: null,
                        value: null,
                        condition: '',
                        disableOperator: false
                    };
                    console.log(`currentFilter > ${f.id} > ${JSON.stringify(currentFilter)}`);
                }
                return f;
            });
            this.filters = [...this.filters]; // trigger re-render      .filter((f)=>{f!=index}), currentFilter
        }
        
        console.log(`this.filters ${JSON.stringify(this.filters)}`);
    }

    // Handle operator change
    handleFilterOperatorChange(event) {
        const index = event.target.dataset.id;
        this.updateFilterProp(index, 'operator', event.target.value);
        this.updateFilterCondition(index);
    }

    // Handle value change (text, numeric, picklist single)
    handleFilterValueChange(event) {
        const index = event.target.dataset.id;
        this.updateFilterProp(index, 'value', event.target.value);
        this.updateFilterCondition(index);
    }

    // Handle multi-picklist values
    handleMultiPicklistChange(event) {
        const index = event.target.dataset.id
        // Collect selected values
        const selected = (Array.isArray(Array.from(event.target.selectedOptions)) && Array.from(event.target.selectedOptions).length>0)? Array.from(event.target.selectedOptions).map(opt => opt.value) : [];
        this.updateFilterProp(index, 'value', selected);
        this.updateFilterCondition(index);
    }
    
    handleConditionLogicChange(event){
        const value = event.target.value;
        this.conditionLogic = value;
        if(value == 'CUSTOM') this.showCustomLogicInput = true;
        console.log(`handleConditionLogicChange >> ${this.conditionLogic}`);
        this.reSerializeFilters();
        this.filters = [...filters];
    }
 
    handleCustomLogicChange(event){
        this.customConditionInput = event.target.value;
        this.filters = [...filters];
    }

    // Build the condition string for one filter
    updateFilterCondition(index) {
        console.log(`updateFilterCondition >>`);
        let filter = {};
        if(Array.isArray(this.filters) && this.filters.length>0) this.filters.forEach((f)=>{if(f.id == index) filter = f;});
        console.log(`updateFilterCondition >> filter >> ${JSON.stringify(filter)}`);
        console.log(`filter.field ${filter.field} && filter.operator ${filter.operator} && filter.value  ${filter.value} !== null`);
        if (filter.field && filter.operator && filter.value !== null) {
            let val = filter.value;
            console.log(`updateFilterCondition >> if `);
            if (filter.isText) {
                val = `'${val}'`;
            } else if (filter.isPicklist) {
                val = `'${val}'`;
            } else if (filter.isMultiPicklist) {
                if (Array.isArray(val) && val.length > 0) {
                    val = `(${(Array.isArray(val) && val.length>0)?val.map(v => `'${v}'`).join(', '):''})`;
                    if (filter.operator === 'IN' || filter.operator === 'NOT IN') {
                        // use as-is
                    } else {
                        // fallback: use IN by default
                        filter.operator = 'IN';
                    }
                } else {
                    val = '';
                }
            } else if (filter.isCheckBox) {
                val = `${val}`;
            }
            filter.condition = val ? `${filter.field} ${filter.operator} ${val}` : '';
        } else {
            filter.condition = '';
            console.log(`updateFilterCondition >> else `);
        }

        this.filters = [...this.filters];
        console.log(`updateFilterCondition >> this.filters >> ${JSON.stringify(this.filters)}`);
    }

    ////////
    resetState(){
        this.showSObjectList = false;
    }

    refreshFieldHighlights() {
        if(Array.isArray(this.fieldOptions) && this.fieldOptions.length > 0){
            this.fieldOptions = this.fieldOptions.map(opt => ({
                ...opt,
                className: this.selectedFields.includes(opt.value) ? 'selected-option' : ''
            }));
        }
    }

    updateFilterProp(id, prop, value){
        if(Array.isArray(this.filters) && this.filters.length > 0){
            this.filters = this.filters.map((f) => {
                if(f.id == id){
                    f[prop] = value;
                }
                return f;
            });
        }
        console.log(`updateFilterProp >> ${JSON.stringify(this.filters)}`);
    }

    updateFilterProps(id, propValueObj){
        if(Array.isArray(this.filters) && this.filters.length > 0){
            this.filters = this.filters.forEach((f) => {
                if(f.id == id){
                    for(let prop in propValueObj){
                        f[prop] = propValueObj[prop];
                    }
                }
            });
        }
    }

    reSerializeFilters(){
        let customCondition = '';
        const filterLength = Array.isArray(this.filters)? this.filters.length : 0;
        if(filterLength > 0) this.filters = this.filters.map((f, idx) => {
            f.serial = idx+1;
            if(this.conditionLogic == 'ANY'){
                if (f.serial == filterLength) customCondition += `(${f.serial})`;
                else if(f.serial < filterLength) customCondition += `(${f.serial}) OR `;
            } else if (this.conditionLogic == 'ALL'){
                if (f.serial == filterLength) customCondition += `(${f.serial})`;
                else if(f.serial < filterLength) customCondition += `(${f.serial}) AND `;
            } else if (this.conditionLogic == 'CUSTOM'){
                if (f.serial == filterLength) customCondition += `(${f.serial})`;
                else if(f.serial < filterLength) customCondition += `(${f.serial}) OR `;
            }
            return f;
        });
        if(this.conditionLogic == 'ANY' || this.conditionLogic == 'ALL') this.customConditionInput = customCondition;
    }
}