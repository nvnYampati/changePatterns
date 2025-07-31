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

        const doc = new this.jsPDF();

        // Box dimensions in points pt
        const x = 10;
        const y = 10;
        const width = 120;
        const height = 60;

        // Draw grey rectangle
        doc.setFillColor(200, 200, 200); // light grey
        doc.rect(x, y, width, height, 'F'); // 'F' for fill

        // Set text color and size
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);

        // Add multi-line text inside the box (auto-wrap manually)
        const margin = 5;
        const textX = x + margin;
        const textY = y + margin + 10;

        const splitText = doc.splitTextToSize(this.textValue, width - 2 * margin);
        doc.text(splitText, textX, textY);

        // Output PDF
        doc.save('Textbox_PDF.pdf');
    }

}