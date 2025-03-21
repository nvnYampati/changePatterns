import { LightningElement, track } from 'lwc';
//base64_arraybuffer utrie text_segmentation css_line_break
import base64_arraybuffer from '@salesforce/resourceUrl/base64_arraybuffer';
import utrie from '@salesforce/resourceUrl/utrie';
import text_segmentation from '@salesforce/resourceUrl/text_segmentation';
import css_line_break from '@salesforce/resourceUrl/css_line_break';
import DOMPurify from '@salesforce/resourceUrl/dompurify';
import html2canvas from '@salesforce/resourceUrl/html2canvas';
import jsPDF from '@salesforce/resourceUrl/jsPDF';
import { loadScript } from 'lightning/platformResourceLoader';

export default class DemoPdfGenerator extends LightningElement {// lwcTextToPdf.js
    
        @track textValue = '';
        jsPdfInitialized = false;
        jsPDF;
        html2canvas;
    
        renderedCallback() {
            if (this.jsPdfInitialized) {
                return;
            }
            this.jsPdfInitialized = true;

            //loads html2canvas with dependents
            loadScript(this, base64_arraybuffer).then(() => {
                console.log('base64_arraybuffer loaded successfully');
                loadScript(this, utrie).then(() => {
                    console.log('utrie loaded successfully');
                    loadScript(this, text_segmentation).then(() => {
                        console.log('text_segmentation loaded successfully');
                        loadScript(this, css_line_break).then(() => {
                            console.log('css_line_break loaded successfully');
                            loadScript(this, html2canvas).then(() => {
                                console.log('html2canvas loaded successfully');
                                loadScript(this, DOMPurify).then(() => {
                                    console.log('DOMPurify loaded successfully');
                                    loadScript(this, jsPDF).then(() => {
                                        console.log('jsPDF loaded successfully');
                                        
                                        const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
                                        const html2canvas = window.html2canvas;
                    
                                        if (!jsPDF) {
                                            console.error('jsPDF failed to load. Check the static resource path.');
                                        } else {
                                            console.log('jsPDF loaded successfully.');
                                        }
                    
                                        if (!html2canvas) {
                                            console.error('html2canvas failed to load. Check the static resource path.');
                                        } else {
                                            console.log('html2canvas loaded successfully.');
                                        }
                                        // Assign to instance variables after ensuring they are loaded
                                        this.jsPDF = jsPDF;
                                        this.html2canvas = html2canvas;
                                    }).catch((error)=>{
                                        console.error('jsPDF load failed '+error);
                                    });
                                }).catch((error)=>{
                                    console.error('DOMPurify load failed '+error);
                                });
                              }).catch((error)=>{
                                console.error('html2canvas load failed '+error);
                              });
                          }).catch((error)=>{
                            console.error('css_line_break load failed '+error);
                          });
                      }).catch((error)=>{
                        console.error('text_segmentation load failed '+error);
                      });
                  }).catch((error)=>{
                    console.error('utrie load failed '+error);
                  });
              }).catch((error)=>{
                console.error('base64_arraybuffer load failed '+error);
              });
            
            /*Promise.all([
                loadScript(this, DOMPurify), loadScript(this, jsPDF)
            ]).then(() => {
                console.log('jsPDF loaded successfully');
            }).catch(error => {
                console.error('Error loading jsPDF', error);
            });*/
        }
    
        handleTextChange(event) {
            this.textValue = event.target.value;
        }
    
        generatePdf() {
            if (!this.jsPDF || !this.html2canvas) {
                console.error('jsPDF or html2canvas is not properly loaded.');
                return;
            }
            console.log('Libraries confirmed loaded:', this.jsPDF, this.html2canvas);
            
            console.log('Generating PDF...');
            const doc = new this.jsPDF();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.textValue;
            tempDiv.setAttribute('lwc:dom', 'manual');
            
            const container = this.template.querySelector('.pdf-container');
            if (!container) {
                console.error('PDF container not found.');
                return;
            }
            container.appendChild(tempDiv);
    
            this.html2canvas(tempDiv).then(canvas => {
                if (!canvas) {
                    console.error('Failed to capture canvas.');
                    return;
                }
                console.log('Canvas captured successfully.');
                
                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 10, 10, 180, 160);
                console.log('Saving PDF...');
                doc.save('download.pdf');
                console.log('PDF should have downloaded.');
                tempDiv.remove();
            }).catch(error => {
                console.error('Error capturing canvas:', error);
            });
        }
    }
    
        