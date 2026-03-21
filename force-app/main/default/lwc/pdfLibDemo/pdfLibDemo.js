import { LightningElement } from 'lwc';
import pdfLib from '@salesforce/resourceUrl/pdf_lib';
import { loadScript } from 'lightning/platformResourceLoader';

export default class PdfLibDemo extends LightningElement {
    pdfLibLoaded = false;

    renderedCallback() {
        if (this.pdfLibLoaded) return;
        this.pdfLibLoaded = true;

        loadScript(this, pdfLib)
            .then(() => console.log('pdf-lib loaded successfully.'))
            .catch((error) => console.error('Error loading pdf-lib:', error));
    }

    async handleDownload() {
        try {
            const { PDFDocument, rgb, StandardFonts } = window.PDFLib;

            // Create new PDF document
            const pdfDoc = await PDFDocument.create();

            // A4 size in points: 595.28 x 841.89
            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;
            const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
            const page2 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

            // Box dimensions
            const boxWidth = 300;
            const boxHeight = 100;
            const x = (A4_WIDTH - boxWidth) / 2;
            const y = (A4_HEIGHT - boxHeight) / 2;

            // Draw grey rectangle with black border
            page.drawRectangle({
                x,
                y,
                width: boxWidth,
                height: boxHeight,
                color: rgb(0.85, 0.85, 0.85), // light gray
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });

            // Embed font and draw text
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontSize = 20;
            const text = 'Hello from pdf-lib & LWC!';

            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const textX = x + (boxWidth - textWidth) / 2;
            const textY = y + (boxHeight / 2) - (fontSize / 2);

            page.drawText(text, {
                x: textX,
                y: textY,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
            });

            //adding page 2 
            page2.drawRectangle({
                x,
                y,
                width: boxWidth,
                height: boxHeight,
                color: rgb(0.85, 0.85, 0.85), // light gray
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });

            page2.drawText(text, {
                x: textX,
                y: textY,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
            });

            // Serialize PDF and download
            const pdfBytes = await pdfDoc.save();
            this.downloadFile(pdfBytes, 'Greeting_A4.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    }

    downloadFile(pdfBytes, fileName) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    }
}