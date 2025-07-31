import { LightningElement } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import jsPDF from '@salesforce/resourceUrl/jsPDF';
import axios from '@salesforce/resourceUrl/axios';

export default class PocCompPdfGen extends LightningElement {
    jsPDF;
    axios;
    testUrl = '';
    jsPdfInitialized = false;
    axiosInitialized = false;
    connectedCallback(){
        let ele = this.template.querySelector('.targetClassName');
        console.log('element div - '+JSON.stringify(ele));
    }

    renderedCallback(){
        loadScript(this, axios).then(() => {
                console.log('axios loaded successfully');
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

                    const axios = window.axios?.axios || window.axios;
                    
                    if (!axios) {
                        console.error('jsPDF failed to load. Check the static resource path.');
                    } else {
                        this.axiosInitialized = true;
                        console.log('jsPDF loaded successfully.');
                    }
                    this.axios = axios;
                }).catch((error)=>{
                    console.error('axios load failed '+error);
                });
        }).catch((error)=>{
                console.error('axios load failed '+error);
        });
    }

    generatePDFfromURL(url) {
        try {
            const { jsPDF } = window.jspdf;
            const { axios } = window.axios;
            
            const response = axios.get(url);
            const textContent = response.data;
            const doc = new jsPDF();
            doc.text(textContent, 10, 10);
            doc.save('sample.pdf');
            console.log('PDF generated successfully');
        } catch (error) {
            console.error('Error fetching URL:', error);
        }
    }

    handlePOC1(){
        this.generatePdf();
        // this.generatePDFfromURL('https://google.com');
    }

    generatePdf() {
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
}