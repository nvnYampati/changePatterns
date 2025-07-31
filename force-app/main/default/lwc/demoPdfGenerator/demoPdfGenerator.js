import { LightningElement, track } from 'lwc';
//base64_arraybuffer utrie text_segmentation css_line_break
// import base64_arraybuffer from '@salesforce/resourceUrl/base64_arraybuffer';
// import utrie from '@salesforce/resourceUrl/utrie';
// import text_segmentation from '@salesforce/resourceUrl/text_segmentation';
// import css_line_break from '@salesforce/resourceUrl/css_line_break';
// import DOMPurify from '@salesforce/resourceUrl/dompurify';
// import html2canvas from '@salesforce/resourceUrl/html2canvas';
import jsPDF from '@salesforce/resourceUrl/jsPDF';
import { loadScript } from 'lightning/platformResourceLoader';

export default class DemoPdfGenerator extends LightningElement {
    //static renderMode = 'light';
    @track textValue = '';
    jsPdfInitialized = false;
    jsPDF;
    html2canvas;
    imgsrc = '';


    renderedCallback() {
        if (this.jsPdfInitialized) {
            return;
        }
        
        //loads jspdf and html2canvas with dependents
        // loadScript(this, base64_arraybuffer).then(() => {
        //     console.log('base64_arraybuffer loaded successfully');
        //     loadScript(this, utrie).then(() => {
        //         console.log('utrie loaded successfully');
        //         loadScript(this, text_segmentation).then(() => {
        //             console.log('text_segmentation loaded successfully');
        //             loadScript(this, css_line_break).then(() => {
        //                 console.log('css_line_break loaded successfully');
        //                 loadScript(this, html2canvas).then(() => {
        //                     console.log('html2canvas loaded successfully');
        //                     loadScript(this, DOMPurify).then(() => {
        //                         console.log('DOMPurify loaded successfully');
                                loadScript(this, jsPDF).then(() => {
                                    console.log('jsPDF loaded successfully');
                                    
                                    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
                                    //const html2canvas = window.html2canvas;
                                    
                                    if (!jsPDF) {
                                        console.error('jsPDF failed to load. Check the static resource path.');
                                    } else {
                                        this.jsPdfInitialized = true;
                                        console.log('jsPDF loaded successfully.');
                                    }
                
                                    // if (!html2canvas) {
                                    //     console.error('html2canvas failed to load. Check the static resource path.');
                                    // } else {
                                    //     console.log('html2canvas loaded successfully.');
                                    // }
                                    // Assign to instance variables after ensuring they are loaded
                                    this.jsPDF = jsPDF;
                                    //this.html2canvas = html2canvas;
                                }).catch((error)=>{
                                    console.error('jsPDF load failed '+error);
                                });
            //                 }).catch((error)=>{
            //                     console.error('DOMPurify load failed '+error);
            //                 });
            //                 }).catch((error)=>{
            //                 console.error('html2canvas load failed '+error);
            //                 });
            //             }).catch((error)=>{
            //             console.error('css_line_break load failed '+error);
            //             });
            //         }).catch((error)=>{
            //         console.error('text_segmentation load failed '+error);
            //         });
            //     }).catch((error)=>{
            //     console.error('utrie load failed '+error);
            //     });
            // }).catch((error)=>{
            // console.error('base64_arraybuffer load failed '+error);
            // });
        
        /*Promise.all([
            loadScript(this, DOMPurify), loadScript(this, jsPDF)
        ]).then(() => {
            console.log('jsPDF loaded successfully');
        }).catch(error => {
            console.error('Error loading jsPDF', error);
        });*/
    }

    handleTextChange(event) {
        this.textValue = event.detail.value;
        console.log('this.textValue '+this.textValue);
    }

    generatePdfHtml() {
        if (!this.jsPDF || !this.html2canvas) {
            console.error('jsPDF or html2canvas is not properly loaded.');
            return;
        }

        let container = document.createElement('div');
        container.innerText = this.textValue;
        container.style.position = 'fixed'; // Ensure it's visible
        container.style.left = '50%';
        container.style.top = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.padding = '10px';
        container.style.backgroundColor = null;
        container.style.fontSize = '16px';
        container.style.width = '300px'; // Ensure width
        container.style.height = '150px'; // Ensure height
        container.style.zIndex = '-1'; // Hide but still render
        document.body.appendChild(container);

        setTimeout(() => {
            this.html2canvas(container, {
                useCORS: true,
                backgroundColor: null,
                scale: 2,
                foreignObjectRendering: true,
                removeContainer: true
            }).then(canvas => {
                if (!canvas) {
                    console.error('Failed to capture canvas.');
                    return;
                }
                console.log('Canvas captured successfully.');

                const doc = new this.jsPDF();
                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 10, 10, 180, 160);
                doc.save('download.pdf');

                document.body.removeChild(container); // Cleanup
            }).catch(error => {
                console.error('Error capturing canvas:', error);
            });
        }, 500); // Slight delay ensures element is fully rendered
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
       
    printDiv() {
        this.imgsrc = '';
        console.log('printDiv 1');      // this.template.querySelector('element[attribute="value"]');
        console.log('printDiv 1 . '+JSON.stringify(this.template.querySelector('.printPreviewDiv')) + ' refs - '+JSON.stringify(this.refs.printPreviewDiv));
        html2canvas(this.template.querySelector('.printPreviewDiv'),{ 
            scale: "5",
            onrendered: (canvas)=> {
                //show image
                console.log('printDiv 2');
                var myCanvas = this.template.querySelector('.my_canvas_id');
                console.log('printDiv 3');
                console.log('printDiv 3 '+JSON.stringify(myCanvas));
                var ctx = myCanvas.getContext('2d');
                console.log('printDiv 4');
                console.log('printDiv 4 '+JSON.stringify(ctx));
                ctx.webkitImageSmoothingEnabled = false;
                ctx.mozImageSmoothingEnabled = false;
                ctx.imageSmoothingEnabled = false;
                console.log('printDiv 5 '+JSON.stringify(ctx));
                var img = new Image;
                img.onload = function(){
                    ctx.drawImage(img,0,0,270,350); // Or at whatever offset you like
                };
                console.log('img >> ', canvas.toDataURL());
                img.src = canvas.toDataURL();
                console.log('printDiv 6 '+JSON.stringify(img));
                this.imgsrc = img.src;
                console.log('printDiv 7 '+JSON.stringify(this.imgsrc));
            }
        });
    }

    handlePOC(){
        console.log('Proof of concepts begins here');
    }
}       