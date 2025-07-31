import { LightningElement, track } from 'lwc';
import jsPDF from '@salesforce/resourceUrl/jsPDF';
import { loadScript } from 'lightning/platformResourceLoader';

export default class DemoPdfGenStudio extends LightningElement {
     @track textValue = '';
    jsPdfInitialized = false;
    jsPDF;

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
            }).catch((error)=>{
            console.error('jsPDF load failed '+error);
        });
    }

    //handlers - start
    handleTextChange(event) {
        this.textValue = event.detail.value;
        console.log('this.textValue '+this.textValue);
    }

    
    handlePOC(){
        console.log('Proof of concepts begins here');
    }
    
    generatePdf() {
        this.generateTextBoxPdf();
        
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

}