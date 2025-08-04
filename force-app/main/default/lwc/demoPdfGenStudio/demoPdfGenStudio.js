import { LightningElement, track } from 'lwc';
import jsPDF from '@salesforce/resourceUrl/jsPDF';
import { loadScript } from 'lightning/platformResourceLoader';

export default class DemoPdfGenStudio extends LightningElement {
    @track textValue = '';
    jsPdfInitialized = false;
    jsPDF;
    @track paddingHorizontal = 10;
    @track paddingVertical = 10;
    @track boxColor = '#dddddd';
    @track textColor = '#000000';
    @track showBorder = true;
    @track borderWidth = 1;
    @track borderColor = '#555555';

    dummyDocForPreview;
    PREVIEW_SCALE = 0.5;
    currentElementId = 'textbox-1';

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
            width: 0,
            height: 0,
            style: ''
        }
    ];

    get textboxElements() {
        return this.elements.filter(el => el.type === 'textbox');
    }

    connectedCallback() {
        this.elements.forEach(el => this.updateElementStyle(el));
    }

    renderedCallback() {
        if (this.jsPdfInitialized) return;

        loadScript(this, jsPDF).then(() => {
            this.jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            if (this.jsPDF) {
                this.jsPdfInitialized = true;
                this.dummyDocForPreview = new this.jsPDF({ unit: 'pt' });
                this.dummyDocForPreview.setFontSize(12);
            } else {
                console.error('jsPDF failed to load.');
            }
        }).catch(error => {
            console.error('jsPDF load failed', error);
        });
    }

    // ========== Handlers for native input elements ==========

    handleTextChange(event) {
        this.textValue = event.target.value;
        this.updateElementProperty(this.currentElementId, 'text', this.textValue);
    }

    handleHorizontalPaddingChange(event) {
        this.paddingHorizontal = parseInt(event.target.value, 10) || 0;
        this.updateElementProperty(this.currentElementId, 'paddingX', this.paddingHorizontal);
    }

    handleVerticalPaddingChange(event) {
        this.paddingVertical = parseInt(event.target.value, 10) || 0;
        this.updateElementProperty(this.currentElementId, 'paddingY', this.paddingVertical);
    }

    handleBoxColorChange(event) {
        this.boxColor = event.target.value || '#ffffff';
        this.updateElementProperty(this.currentElementId, 'boxColor', this.boxColor);
    }

    handleTextColorChange(event) {
        this.textColor = event.target.value || '#000000';
        this.updateElementProperty(this.currentElementId, 'textColor', this.textColor);
    }

    handleBorderToggle(event) {
        this.showBorder = event.target.checked;
        this.updateElementProperty(this.currentElementId, 'showBorder', this.showBorder);
    }

    handleBorderWidthChange(event) {
        this.borderWidth = parseInt(event.target.value, 10) || 0;
        this.updateElementProperty(this.currentElementId, 'borderWidth', this.borderWidth);
    }

    handleBorderColorChange(event) {
        this.borderColor = event.target.value || '#555555';
        this.updateElementProperty(this.currentElementId, 'borderColor', this.borderColor);
    }

    // ========== PDF Generation ==========

    generatePdf() {
        this.generateAutoSizedTextBoxPdf();
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

    generateAutoSizedTextBoxPdf() {
        if (!this.jsPdfInitialized || !this.jsPDF) {
            console.error('jsPDF not initialized.');
            return;
        }

        const doc = new this.jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        const maxLineWidth = 300;

        const wrappedText = doc.splitTextToSize(this.textValue, maxLineWidth);
        const longestLine = wrappedText.reduce((a, b) => a.length > b.length ? a : b, '');
        const textWidth = doc.getTextWidth(longestLine);
        const textHeight = wrappedText.length * lineHeight;

        const boxWidth = textWidth + 2 * this.paddingHorizontal;
        const boxHeight = textHeight + 2 * this.paddingVertical;
        const x = 40;
        const y = 60;

        const bg = this.hexToRgb(this.boxColor);
        doc.setFillColor(bg.r, bg.g, bg.b);

        const borderRgb = this.hexToRgb(this.borderColor);
        doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
        doc.setLineWidth(this.showBorder ? this.borderWidth : 0);
        doc.rect(x, y, boxWidth, boxHeight, this.showBorder ? 'FD' : 'F');

        const fg = this.hexToRgb(this.textColor);
        doc.setTextColor(fg.r, fg.g, fg.b);
        doc.setFontSize(fontSize);

        const textX = x + this.paddingHorizontal;
        const textY = y + this.paddingVertical + fontSize;
        doc.text(wrappedText, textX, textY);

        doc.save('AutoSized_Textbox_Color.pdf');
    }

    // ========== Styling & Element Update Helpers ==========

    updateElementProperty(id, prop, value) {
        const el = this.elements.find(e => e.id === id);
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

        const boxWidth = textMetrics.w + 2 * el.paddingX;
        const boxHeight = textMetrics.h + 2 * el.paddingY;

        el.style = `
            background-color: ${el.boxColor};
            color: ${el.textColor};
            padding: ${el.paddingY * scale}px ${el.paddingX * scale}px;
            ${el.showBorder ? `border: ${el.borderWidth * scale}px solid ${el.borderColor};` : 'border: none;'}
            margin-bottom: 1rem;
            font-size: ${(fontSize * FONT_SCALE_CORRECTION).toFixed(2)}px;
            line-height: 1.2;
            white-space: pre-wrap;
            word-break: break-word;
            overflow-wrap: break-word;
            width: ${boxWidth * scale}px;
            height: ${boxHeight * scale}px;
            max-width: ${300 * scale}px;
            box-sizing: border-box;
            position: absolute;
            left: ${40 * scale}px;
            top: ${60 * scale}px;
        `;
    }
}