import { LightningElement, track } from 'lwc';
import jsPDF from '@salesforce/resourceUrl/jsPDF';
import { loadScript } from 'lightning/platformResourceLoader';

export default class DemoPdfGenStudio extends LightningElement {
     @track textValue = '';
    jsPdfInitialized = false;
    jsPDF;
    @track paddingHorizontal = 10;
    @track paddingVertical = 10;
    @track boxColor = '#dddddd'; // Default gray
    @track textColor = '#000000'; // Default black
    @track elements = [
        {
            id: 'textbox-1',
            type: 'textbox',
            text: '',
            boxColor: '#dddddd',
            textColor: '#000000',
            paddingX: 10,
            paddingY: 10,
            showBorder: true,
            borderWidth: 1,
            borderColor: '#555555',
            width: 0, // ← NEW
            height: 0, // ← NEW
            style: ''
        }
    ];

    @track showBorder = true;
    @track borderWidth = 1;
    @track borderColor = '#555555';
    dummyDocForPreview;
    PREVIEW_SCALE = 0.5;

    currentElementId = 'textbox-1';

    get textboxElements() {
        return this.elements.filter(el => el.type === 'textbox');
    }

    connectedCallback() {
        this.elements.forEach(el => this.updateElementStyle(el));
    }

    //load 3rd party scripts
    renderedCallback() {
        if (this.jsPdfInitialized) {
            return;
        }
        loadScript(this, jsPDF).then(() => {
            console.log('jsPDF loaded successfully');
            
            const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            if (!jsPDF) {
                console.error('jsPDF failed to load. Check the static resource path.');
            } else {
                this.jsPdfInitialized = true;
                console.log('jsPDF loaded successfully.');
            }
            this.jsPDF = jsPDF;

            //instantiate the dummy preview doc
            this.dummyDocForPreview = new jsPDF({ unit: 'pt' });
            this.dummyDocForPreview.setFontSize(12);
            }).catch((error)=>{
            console.error('jsPDF load failed '+error);
        });
    }

    //handlers - start
    handleHorizontalPaddingChange(event) {
        this.paddingHorizontal = parseInt(event.detail.value, 10) || 0;
        this.updateElementProperty(this.currentElementId, 'paddingX', parseInt(event.detail.value, 10) || 0);
    }

    handleVerticalPaddingChange(event) {
        this.paddingVertical = parseInt(event.detail.value, 10) || 0;
        this.updateElementProperty(this.currentElementId, 'paddingY', parseInt(event.detail.value, 10) || 0);
    }

    handleTextChange(event) {
        this.textValue = event.detail.value;
        console.log('this.textValue '+this.textValue);
        this.updateElementProperty(this.currentElementId, 'text', event.detail.value);
    }

    
    handlePOC(){
        console.log('Proof of concepts begins here');
    }

    handleBoxColorChange(event) {
        this.boxColor = event.detail.value || '#ffffff';
        this.updateElementProperty(this.currentElementId, 'boxColor', event.detail.value || '#ffffff');
    }

    handleTextColorChange(event) {
        this.textColor = event.detail.value || '#000000';
        this.updateElementProperty(this.currentElementId, 'textColor', event.detail.value || '#000000');
    }

    hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };
        let sanitized = hex.replace(/^#/, '');
        if (sanitized.length === 3) {
            sanitized = sanitized.split('').map(c => c + c).join('');
        }
        const bigint = parseInt(sanitized, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }
    
    handleBorderToggle(event) {
        this.showBorder = event.detail.checked;
        this.updateElementProperty(this.currentElementId, 'showBorder', this.showBorder);
    }

    handleBorderWidthChange(event) {
        this.borderWidth = parseInt(event.detail.value, 10) || 0;
        this.updateElementProperty(this.currentElementId, 'borderWidth', this.borderWidth);
    }

    handleBorderColorChange(event) {
        this.borderColor = event.detail.value || '#555555';
        this.updateElementProperty(this.currentElementId, 'borderColor', this.borderColor);
    }

    generatePdf() {
        //this.generateTextBoxPdf();
        this.generateAutoSizedTextBoxPdf();
    }

    //handlers - end

    //helpers

    generateBasicPdf() {
        
        if (this.jsPdfInitialized) {
            console.log('generatePDF 1');
            //const { jsPDF } = window.jspdf;
            // Make sure to correctly reference the loaded jsPDF library.
            const doc = new this.jsPDF();
            console.log('generatePDF 2');
            //const doc = new jsPDF();
            // Add content to the PDF.
            doc.text(`${this.textValue}`, 10, 10);
            //doc.text(this.textValue, 10, 10);
            console.log('generatePDF 3');
            // Save the PDF.
            doc.save('Sample.pdf');
            console.log('generatePDF 4');
        } else {
            console.error('jsPDF library not initialised');
        }
    }

    generateAutoSizedTextBoxPdf() {
        if (!this.jsPdfInitialized || !this.jsPDF) {
            console.error('jsPDF not initialized.');
            return;
        }

        const doc = new this.jsPDF({
            unit: 'pt',
            format: 'a4',
            orientation: 'portrait'
        });

        const paddingX = this.paddingHorizontal || 10;
        const paddingY = this.paddingVertical || 10;

        doc.setFontSize(12);

        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        const maxLineWidth = 300;

        const wrappedText = doc.splitTextToSize(this.textValue, maxLineWidth);
        const longestLine = wrappedText.reduce((a, b) => a.length > b.length ? a : b, '');
        const textWidth = doc.getTextWidth(longestLine);
        const textHeight = wrappedText.length * lineHeight;

        const boxWidth = textWidth + 2 * paddingX;
        const boxHeight = textHeight + 2 * paddingY;

        const x = 40;
        const y = 60;

        // Convert hex to RGB for box color
        const bg = this.hexToRgb(this.boxColor);
        doc.setFillColor(bg.r, bg.g, bg.b);
        doc.setDrawColor(80); // Static border color

        const borderRgb = this.hexToRgb(this.borderColor);
        doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
        doc.setLineWidth(this.showBorder ? this.borderWidth : 0);
        doc.rect(x, y, boxWidth, boxHeight, this.showBorder ? 'FD' : 'F');

        // Convert hex to RGB for text color
        const fg = this.hexToRgb(this.textColor);
        doc.setTextColor(fg.r, fg.g, fg.b);

        const textX = x + paddingX;
        const textY = y + paddingY + fontSize;
        doc.text(wrappedText, textX, textY);

        doc.save('AutoSized_Textbox_Color.pdf');
    }

    generateTextBoxPdf() {
        if (!this.jsPdfInitialized || !this.jsPDF) {
            console.error('jsPDF not initialized.');
            return;
        }

        // jsPDF uses 'pt' by default (72pt = 1 inch)
        const doc = new this.jsPDF({
            unit: 'pt',
            format: 'a4',
            orientation: 'portrait'
        });

        // Position and dimensions (in pt)
        const x = 40;              // Left offset from edge
        const y = 60;              // Top offset from edge
        const width = 216;         // 3 inches
        const height = 144;        // 2 inches

        // Draw a grey filled rectangle with optional border
        doc.setFillColor(220, 220, 220); // light grey fill
        doc.setDrawColor(80);            // border color
        doc.rect(x, y, width, height, 'FD'); // Fill and Draw border

        // Prepare and insert text inside the box
        const padding = 10;
        const textX = x + padding;
        const textY = y + padding + 10; // slight vertical offset for top padding
        const maxTextWidth = width - 2 * padding;

        doc.setFontSize(12);
        doc.setTextColor(0); // black text

        const wrappedText = doc.splitTextToSize(this.textValue, maxTextWidth);
        doc.text(wrappedText, textX, textY);

        // Download the generated PDF
        doc.save('Textbox_3x2in.pdf');
    }

    //helpers = utils
    updateElementProperty(id, prop, value) {
        let el = this.elements.find(e => e.id === id);
        if (el) {
            el[prop] = value;
            this.updateElementStyle(el);
        }
    }

    updateElementStyle(el) {
        const doc = this.dummyDocForPreview;
        if (!doc) return;

        const scale = this.PREVIEW_SCALE;
        const fontSize = 12;
        const FONT_SCALE_CORRECTION = 0.4583;

        doc.setFontSize(fontSize);

        const maxTextWidth = 300 - 2 * (el.paddingX || 0);
        const wrappedLines = doc.splitTextToSize(el.text || '', maxTextWidth);

        const textMetrics = doc.getTextDimensions(wrappedLines);
        const textWidth = textMetrics.w;
        const textHeight = textMetrics.h;

        const boxWidth = textWidth + 2 * el.paddingX;
        const boxHeight = textHeight + 2 * el.paddingY;

        const scaledBoxWidth = boxWidth * scale;
        const scaledBoxHeight = boxHeight * scale;
        const scaledPaddingX = el.paddingX * scale;
        const scaledPaddingY = el.paddingY * scale;
        const scaledFontSizePx = (fontSize * FONT_SCALE_CORRECTION).toFixed(2);
        const scaledBorderWidth = el.borderWidth * scale;

        const PDF_OFFSET_X_PT = 40;
        const PDF_OFFSET_Y_PT = 60;
        const previewOffsetX = PDF_OFFSET_X_PT * this.PREVIEW_SCALE;
        const previewOffsetY = PDF_OFFSET_Y_PT * this.PREVIEW_SCALE;

        el.style = `
            background-color: ${el.boxColor};
            color: ${el.textColor};
            padding: ${scaledPaddingY}px ${scaledPaddingX}px;
            ${el.showBorder ? `border: ${scaledBorderWidth}px solid ${el.borderColor};` : 'border: none;'}
            margin-bottom: 1rem;
            font-size: ${scaledFontSizePx}px;
            line-height: 1.2;
            white-space: pre-wrap;
            word-break: break-word;
            overflow-wrap: break-word;
            width: ${scaledBoxWidth}px;
            height: ${scaledBoxHeight}px;
            max-width: ${300 * scale}px;
            box-sizing: border-box;
            position: absolute;
            left: ${previewOffsetX}px;
            top: ${previewOffsetY}px;
        `;
    }

    computeBoxDimensions(el) {
        if (!this.dummyDocForPreview) return;

        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        const maxLineWidth = 300;

        const doc = this.dummyDocForPreview;
        doc.setFontSize(fontSize); // ← Safe to do this here every time

        const wrappedText = doc.splitTextToSize(el.text || '', maxLineWidth);
        const longestLine = wrappedText.reduce((a, b) => a.length > b.length ? a : b, '');
        const textWidth = doc.getTextWidth(longestLine);
        const textHeight = wrappedText.length * lineHeight;

        el.width = textWidth + 2 * el.paddingX;
        el.height = textHeight;
    }

}