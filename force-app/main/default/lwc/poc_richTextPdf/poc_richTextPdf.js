import { LightningElement, track } from 'lwc';
import handlebarsLib from '@salesforce/resourceUrl/handlebars';
import jsPdfLib from '@salesforce/resourceUrl/jsPDF';

import { loadScript } from 'lightning/platformResourceLoader';

export default class Poc_richTextPdf extends LightningElement {
    @track templateText = `
        <p>Hello <b>{{name}}</b>,</p>
        <p>Welcome to <i>jsPDF + Handlebars</i> with LWS.</p>
    `;
    @track templateData = JSON.stringify({ name: 'Naveen' }, null, 2);

    jsPDF = null;
    Handlebars = null;

    connectedCallback() {
        this.loadLibs();
    }

    async loadLibs() {
        try {
            await loadScript(this, jsPdfLib);
            this.jsPDF = window.jspdf.jsPDF;

            await loadScript(this, handlebarsLib);
            this.Handlebars = window.Handlebars;

            console.log('jsPDF + Handlebars loaded safely');
            console.log('jsPDF loaded?', !!window.jspdf);
        } catch (err) {
            console.error('Load error', err);
        }
    }

    handleTemplateChange(e) {
        this.templateText = e.target.value;
    }

    handleDataChange(e) {
        this.templateData = e.target.value;
    }

    async downloadPdf() {
        try {
            const dataObj = JSON.parse(this.templateData);

            // COMPILE TEMPLATE (SAFE)
            const compiled = this.Handlebars.compile(this.templateText);
            const html = compiled(dataObj);

            // START PDF
            const doc = new this.jsPDF({ unit: 'pt', format: 'a4' });

            // LWS-SAFE HTML → PDF RENDERER
            await this.renderHtmlSafe(doc, html);

            doc.save("test.pdf");
        } catch (err) {
            console.error('ERROR', err);
        }
    }

    /**
     * SAFE renderer: NO doc.html(), NO html2canvas, NO DOM writes
     * Supports: P, BR, B, I, TEXT
     */
    async renderHtmlSafe(doc, htmlString) {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(htmlString, "text/html");

        let y = 40;
        const x = 40;
        const lineHeight = 16;

        const walk = (node) => {

            if (node.nodeType === Node.TEXT_NODE) {
                const t = node.textContent.trim();
                if (t.length > 0) {
                    doc.text(t, x, y);
                    y += lineHeight;
                }
            }

            if (node.nodeType === Node.ELEMENT_NODE) {

                switch (node.tagName) {
                    case 'BR':
                        y += lineHeight;
                        break;

                    case 'P':
                        y += lineHeight / 2;
                        node.childNodes.forEach(ch => walk(ch));
                        y += lineHeight / 2;
                        break;

                    case 'B':
                        doc.setFont(undefined, 'bold');
                        node.childNodes.forEach(ch => walk(ch));
                        doc.setFont(undefined, 'normal');
                        break;

                    case 'I':
                        doc.setFont(undefined, 'italic');
                        node.childNodes.forEach(ch => walk(ch));
                        doc.setFont(undefined, 'normal');
                        break;

                    default:
                        // recursively handle everything else safely
                        node.childNodes.forEach(ch => walk(ch));
                }
            }
        };

        walk(parsed.body);
    }

    downloadPdfV2() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');

        const html = `
            <p>This is <b>bold</b> and <i>italic</i>.</p>
            <p style="color:red">This is red text.</p>
            <ul>
                <li>First</li>
                <li>Second</li>
            </ul>
        `;

        this.renderHtmlToJsPDF(html, doc, 40, 60, 18);

        doc.save("test.pdf");
    }

    tokenizeHtml(html) {
        const tokens = [];
        const regex = /<\/?[^>]+>|[^<]+/g;
        let match;

        while ((match = regex.exec(html))) {
            const part = match[0].trim();
            if (!part) continue;

            if (part.startsWith('</')) {
                tokens.push({
                    type: 'end',
                    tag: part.slice(2, -1)
                });
            }
            else if (part.startsWith('<')) {
                const tagMatch = part.match(/<(\w+)/);
                const tag = tagMatch ? tagMatch[1] : '';

                const attrs = {};
                const attrRegex = /(\w+)="([^"]*)"/g;
                let a;
                while ((a = attrRegex.exec(part))) {
                    attrs[a[1]] = a[2];
                }

                tokens.push({
                    type: 'start',
                    tag,
                    attrs
                });
            }
            else {
                tokens.push({
                    type: 'text',
                    text: part
                });
            }
        }

        return tokens;
    }

    renderHtmlToJsPDF(html, doc, startX, startY, lineHeight = 16) {
        let x = startX;
        let y = startY;

        const stack = [{
            bold: false,
            italic: false,
            underline: false,
            fontSize: 12,
            color: '#000000'
        }];

        const applyStyle = (ctx) => {
            let fontStyle = '';
            if (ctx.bold && ctx.italic) fontStyle = 'bolditalic';
            else if (ctx.bold) fontStyle = 'bold';
            else if (ctx.italic) fontStyle = 'italic';
            else fontStyle = 'normal';

            doc.setFont('helvetica', fontStyle);
            doc.setFontSize(ctx.fontSize);
            doc.setTextColor(ctx.color);
        };

        // 💡 Lightweight HTML parser (no DOM)
        const tokens = this.tokenizeHtml(html);

        for (const token of tokens) {
            const ctx = stack[stack.length - 1];

            if (token.type === 'start') {
                // push new style context
                const newCtx = {...ctx};

                if (token.tag === 'b' || token.tag === 'strong') newCtx.bold = true;
                if (token.tag === 'i' || token.tag === 'em') newCtx.italic = true;
                if (token.tag === 'u') newCtx.underline = true;

                if (token.tag === 'span' && token.attrs.style) {
                    const styles = token.attrs.style.split(';');
                    for (const s of styles) {
                        const [key, value] = s.split(':').map(x => x.trim());
                        if (key === 'color') newCtx.color = value;
                        if (key === 'font-size') newCtx.fontSize = parseInt(value);
                    }
                }

                if (token.tag === 'br') {
                    y += lineHeight;
                    x = startX;
                }

                if (token.tag === 'p') {
                    y += lineHeight;
                    x = startX;
                }

                if (token.tag === 'li') {
                    // bullet point
                    applyStyle(ctx);
                    doc.text('• ', x, y);
                    x += 10;
                }

                stack.push(newCtx);
                applyStyle(newCtx);
            }

            else if (token.type === 'end') {
                if (token.tag === 'p') {
                    y += lineHeight;
                    x = startX;
                }

                stack.pop();
                applyStyle(stack[stack.length - 1]);
            }

            else if (token.type === 'text') {
                const ctx = stack[stack.length - 1];
                applyStyle(ctx);

                const words = token.text.split(' ');
                for (const w of words) {
                    const wordWidth = doc.getTextWidth(w + ' ');

                    // wrap
                    if (x + wordWidth > 550) {
                        x = startX;
                        y += lineHeight;
                    }

                    doc.text(w, x, y);

                    if (ctx.underline) {
                        doc.line(x, y + 2, x + doc.getTextWidth(w), y + 2);
                    }

                    x += wordWidth;
                }
            }
        }

        return { x, y };
    }

    /** DEMO BUTTON HANDLER */
    handleGenerate() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("p", "pt", "a4");
        const html = `${this.templateText}`;
        // const html = `
        //     <p>This is <b>bold</b> and <i>italic</i>.</p>
        //     <p style="color:red; font-size:16px">Red 16px text.</p>
        //     <p><span style="color:blue">Blue span</span> mixed text.</p>
        //     <ul>
        //         <li>First item</li>
        //         <li><b>Bold item</b></li>
        //         <li><i>Italic item</i></li>
        //     </ul>
        // `;

        this.renderHtmlToPdf(doc, html, 40, 60);
        doc.save("test.pdf");
    }

    //------------------------------------------
    // MAIN RENDERER
    //------------------------------------------
    renderHtmlToPdf(doc, htmlString, startX = 40, startY = 60, lineHeight = 18) {
        const TEXT = window.Node.TEXT_NODE;
        const ELEMENT = window.Node.ELEMENT_NODE;

        let x = startX;
        let y = startY;

        const parser = new DOMParser();
        const dom = parser.parseFromString(htmlString, "text/html");

        if (!dom || !dom.body) {
            console.error("Invalid HTML input.");
            return;
        }

        const styleStack = [{
            bold: false,
            italic: false,
            underline: false,
            fontSize: 12,
            color: "#000000",
            listType: null,
            listIndex: 0
        }];

        //------------------------------------------
        // Safe apply style
        //------------------------------------------
        const applyStyle = (ctx) => {
            let style = "normal";
            if (ctx.bold && ctx.italic) style = "bolditalic";
            else if (ctx.bold) style = "bold";
            else if (ctx.italic) style = "italic";

            doc.setFont("helvetica", style);
            doc.setFontSize(ctx.fontSize);

            // --- ALWAYS convert color to R,G,B ---
            if (Array.isArray(ctx.color)) {
                doc.setTextColor(ctx.color[0], ctx.color[1], ctx.color[2]);
            } else if (typeof ctx.color === "string" && ctx.color.startsWith("#")) {
                const r = parseInt(ctx.color.substr(1, 2), 16);
                const g = parseInt(ctx.color.substr(3, 2), 16);
                const b = parseInt(ctx.color.substr(5, 2), 16);
                doc.setTextColor(r, g, b);
            } else {
                doc.setTextColor(0, 0, 0);
            }
        };

        //------------------------------------------
        // Safe color parser
        //------------------------------------------
        const parseColor = (c) => {
            if (!c) return [0,0,0];
            c = c.trim();

            if (c.startsWith("#")) {
                return [
                    parseInt(c.substr(1,2), 16),
                    parseInt(c.substr(3,2), 16),
                    parseInt(c.substr(5,2), 16)
                ];
            }

            if (c.startsWith("rgb")) {
                const nums = c.replace(/[^\d,]/g, "")
                            .split(",")
                            .map(n => parseInt(n.trim(), 10));
                return nums;  // [r,g,b]
            }

            return [0,0,0];
        };

        //------------------------------------------
        // Extract inline CSS safely
        //------------------------------------------
        const readInlineStyle = (styleString) => {
            const out = {};
            if (!styleString) return out;

            styleString.split(";").forEach(s => {
                const [key, value] = s.split(":").map(v => v && v.trim());
                if (!key || !value) return;

                if (key === "color") out.color = parseColor(value);
                if (key === "font-size") out.fontSize = parseInt(value, 10);
                if (key === "font-weight" && value === "bold") out.bold = true;
                if (key === "font-style" && value === "italic") out.italic = true;
                if (key === "text-decoration" && value === "underline") out.underline = true;
            });
            return out;
        };

        //------------------------------------------
        // Render text with wrapping
        //------------------------------------------
        const renderText = (text) => {
            const ctx = styleStack[styleStack.length - 1];
            applyStyle(ctx);

            const words = text.split(/\s+/);
            words.forEach(word => {
                const w = word + " ";
                const width = doc.getTextWidth(w);

                if (x + width > 550) {
                    x = startX;
                    y += lineHeight;
                }

                doc.text(w, x, y);

                // underline support
                if (ctx.underline) {
                    doc.line(x, y + 2, x + doc.getTextWidth(word), y + 2);
                }

                x += width;
            });
        };

        //------------------------------------------
        // Recursive walker
        //------------------------------------------
        const walk = (node) => {
            const ctx = styleStack[styleStack.length - 1];

            try {
                if (node.nodeType === TEXT) {
                    const clean = node.nodeValue.replace(/\s+/g, " ").trim();
                    if (clean.length > 0) renderText(clean);
                    return;
                }

                if (node.nodeType !== ELEMENT) return;

                const tag = node.tagName.toLowerCase();

                //------------------------------------------
                // Push new style frame
                //------------------------------------------
                const newCtx = { ...ctx };

                if (tag === "b" || tag === "strong") newCtx.bold = true;
                if (tag === "i" || tag === "em") newCtx.italic = true;
                if (tag === "u") newCtx.underline = true;

                if (tag === "span" && node.getAttribute("style")) {
                    Object.assign(newCtx, readInlineStyle(node.getAttribute("style")));
                }

                if (tag === "p") {
                    y += lineHeight;
                    x = startX;
                    if (node.getAttribute("style")) {
                        Object.assign(newCtx, readInlineStyle(node.getAttribute("style")));
                    }
                }

                if (tag === "br") {
                    y += lineHeight;
                    x = startX;
                }

                // List start
                if (tag === "ul") {
                    newCtx.listType = "ul";
                    newCtx.listIndex = 0;
                }
                if (tag === "ol") {
                    newCtx.listType = "ol";
                    newCtx.listIndex = 0;
                }

                styleStack.push(newCtx);
                applyStyle(newCtx);

                // <li>
                if (tag === "li") {
                    newCtx.listIndex += 1;

                    y += lineHeight;
                    x = startX + 20;

                    if (ctx.listType === "ul") {
                        doc.text("•", startX, y);
                    } else if (ctx.listType === "ol") {
                        doc.text(ctx.listIndex + ".", startX, y);
                    }
                }

                // Walk children
                node.childNodes.forEach(n => walk(n));

                //------------------------------------------
                // Pop
                //------------------------------------------
                styleStack.pop();
                applyStyle(styleStack[styleStack.length - 1]);

                if (tag === "p") {
                    y += lineHeight;
                    x = startX;
                }

            } catch (e) {
                console.error("Renderer crashed:", e);
                throw e;
            }
        };

        try {
            dom.body.childNodes.forEach(n => walk(n));
        } catch (e) {
            console.error("renderHtmlToPdf fatal:", e);
        }
    }

    //2 parallel poc
    handlebarsInitialized = false;
    templateText = '<h1>Hello {{name}}!</h1><p>You are {{age}} years old.</p>';
    jsonText = '{ "name": "Naveen", "age": 28 }';
    renderedHtml = '';

    handleTemplateChange(e) {
        this.templateText = e.target.value;
    }

    handleJsonChange(e) {
        this.jsonText = e.target.value;
    }

    renderPreview() {
        try {
            const data = JSON.parse(this.jsonText);
            const template = window.Handlebars.compile(this.templateText);
            this.renderedHtml = template(data);

            const previewEl = this.template.querySelector('.render-preview');
            previewEl.innerHTML = this.renderedHtml;
        } catch (err) {
            console.error('Error rendering template:', err);
            alert('Invalid JSON or Handlebars syntax.');
        }
    }

    async downloadPdf() {
        try {
            if (!window.jspdf || !window.Handlebars) {
                alert('Libraries not ready yet.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });

            // Simple conversion: stripping tags and adding as text
            const textContent = this.renderedHtml.replace(/<[^>]+>/g, '');
            //doc.text(textContent, 20, 40);
            const previewElement = this.template.querySelector('.render-preview'); // or your preview container
            doc.html(previewElement, {
                x: 10,
                y: 10,
                html2canvas: {
                    scale: 1,       // higher = sharper
                    useCORS: true     // allow external images, if any
                },
                callback: (doc) => {
                    doc.save('rendered-preview.pdf');
                }
            });

            doc.save('HandlebarsDemo.pdf');
        } catch (err) {
            console.error('Error generating PDF:', err);
        }
    }

    // ==========
    // Rich text editor POC
    // check for rendered callback
    // ==========

    @track htmlValue = '';
    savedRange = null;
    setupDone = false;

    // Save selection (called on keyup / mouseup inside editor)
    saveSelection = () => {
        try {
            const sel = window.getSelection();
            if (!sel) return;
            if (sel.rangeCount > 0) {
                this.savedRange = sel.getRangeAt(0).cloneRange();
            }
        } catch (e) {
            this.savedRange = null;
        }
    }

    // Restore saved selection into document selection
    restoreSelection = () => {
        try {
            if (!this.savedRange) return false;
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.savedRange);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Allow toolbar buttons to not blur the editor, but allow inputs to focus
    // handleToolbarMouseDown(event) {
    //     const tag = event.target.tagName;
    //     // If the user clicked a BUTTON (or inside a BUTTON), prevent default so editor keeps focus/selection
    //     if (event.target.closest && event.target.closest('button')) {
    //         event.preventDefault();
    //     }
    //     // Do NOT prevent for inputs (color / number) — allow input to focus
    // }
    
    // Generic button handler (bold/italic/underline/align/list)
    handleCmd(event) {
        event.preventDefault();
        const cmd = event.currentTarget.getAttribute('data-cmd');
        if (!cmd) return;

        // Try to restore selection (button click won't blur because we prevented mousedown)
        this.restoreSelection();

        try {
            document.execCommand(cmd, false, null);
        } catch (e) {
            // ignore
        }

        this.refreshValue();
        // Save selection after command
        this.saveSelection();
    }

    // Color inputs (oninput) - we use microtask so input can focus first
    handleColorChange(event) {
        const cmd = event.currentTarget.getAttribute('data-cmd'); // foreColor or hiliteColor
        const val = event.target.value;

        Promise.resolve().then(() => {
            // restore selection then run cmd
            this.restoreSelection();

            try {
                document.execCommand(cmd, false, val);
            } catch (e) {
                // fallback for highlight in some browsers
                if (cmd === 'hiliteColor') {
                    try { document.execCommand('backColor', false, val); } catch (ex) {}
                }
            }

            this.refreshValue();
            this.saveSelection();
        });
    }

    // Font-size numeric input handler (px). Uses the fontSize 7 trick then replaces with span
    handleFontSizeChange(event) {
        const px = parseInt(event.target.value, 10);
        if (!px || px < 6 || px > 200) return;

        // 🔥 Save current selection BEFORE anything else
        const selectionRestored = this.restoreSelection();

        if (!selectionRestored) {
            console.warn('No selection to apply font size');
            return;
        }

        try {
            // Apply temporary font tag
            document.execCommand('fontSize', false, 7);
        } catch (e) {
            console.error('execCommand fontSize failed', e);
            return;
        }

        // Replace <font size="7"> with styled span
        const editor = this.template.querySelector('.editor');

        if (editor) {
            const fonts = editor.querySelectorAll('font[size="7"]');

            fonts.forEach(f => {
                const span = document.createElement('span');

                span.style.fontSize = px + 'px';

                // Preserve existing styles
                if (f.style && f.style.cssText) {
                    span.style.cssText += ';' + f.style.cssText;
                }

                while (f.firstChild) {
                    span.appendChild(f.firstChild);
                }

                f.parentNode.replaceChild(span, f);
            });
        }

        this.refreshValue();
        this.saveSelection();
    }

    // Called when editing (keystroke/paste)
    handleInput() {
        this.saveSelection();
        this.refreshValue();
    }

    // Update tracked value and preview
    refreshValue() {
        const editor = this.template.querySelector('.editor');
        if (!editor) return;
        this.htmlValue = editor.innerHTML;
        this.updatePreview();
    }

    updatePreview() {
        const preview = this.template.querySelector('.preview');
        if (!preview) return;
        preview.innerHTML = this.htmlValue || '<i>(empty)</i>';
    }

    // Expose getter
    get value() {
        return this.htmlValue;
    }

    // ========= PDF GENERATOR PATCH =========
    // generateRichPdf() {
    //     console.log(`generateRichPdf >> `);
    //     // if (!this.jsPDF) {
    //     //     console.error("jsPDF not loaded");
    //     //     return;
    //     // }

    //     const doc = new this.jsPDF({ unit: "pt", format: "a4" });

    //     const html = this.editor.innerHTML;
    //     console.log(`generateRichPdf >> 1`);
    //     const parsed = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    //     console.log(`generateRichPdf >> 2`);
    //     let y = 40;

    //     const processNode = (node, style = {}) => {
    //         if (node.nodeType === Node.TEXT_NODE) {
    //             console.log(`generateRichPdf >> 3`);
    //             const text = node.textContent.trim();
    //             if (!text) return;
    //             console.log(`generateRichPdf >> 4`);
    //             doc.setFontSize(style.fontSize || 14);
    //             doc.setTextColor(style.color || "#000000");
    //             console.log(`generateRichPdf >> 5`);
    //             if (style.bold && style.italic) doc.setFont("helvetica", "bolditalic");
    //             else if (style.bold) doc.setFont("helvetica", "bold");
    //             else if (style.italic) doc.setFont("helvetica", "italic");
    //             else doc.setFont("helvetica", "normal");

    //             if (style.underline) {
    //                 doc.text(text, 40, y, { underline: true });
    //             } else {
    //                 doc.text(text, 40, y);
    //             }

    //             y += (style.fontSize || 14) * 1.4;
    //             return;
    //         }

    //         if (node.nodeType === Node.ELEMENT_NODE) {
    //             let nodeStyle = { ...style };

    //             const cs = node.style;

    //             if (cs.color) nodeStyle.color = cs.color;
    //             if (cs.backgroundColor) nodeStyle.bg = cs.backgroundColor;
    //             if (cs.fontWeight === "bold") nodeStyle.bold = true;
    //             if (cs.fontStyle === "italic") nodeStyle.italic = true;
    //             if (cs.textDecoration.includes("underline")) nodeStyle.underline = true;
    //             if (cs.fontSize) nodeStyle.fontSize = parseInt(cs.fontSize);

    //             if (node.tagName === "UL" || node.tagName === "OL") {
    //                 [...node.children].forEach((li, i) => {
    //                     const prefix = node.tagName === "UL" ? "• " : `${i + 1}. `;
    //                     doc.text(prefix + li.textContent.trim(), 40, y);
    //                     y += (nodeStyle.fontSize || 14) * 1.4;
    //                 });
    //                 return;
    //             }

    //             if (node.tagName === "BR") {
    //                 y += (nodeStyle.fontSize || 14) * 1.4;
    //                 return;
    //             }

    //             [...node.childNodes].forEach(child => processNode(child, nodeStyle));

    //             if (node.tagName === "P" || node.tagName === "DIV") {
    //                 y += (nodeStyle.fontSize || 14) * 1.4;
    //             }
    //         }
    //     };
    //     console.log(`generateRichPdf >> last-1`);
    //     processNode(parsed.body.firstChild);
    //     console.log(`generateRichPdf >> last`);
    //     doc.save("rich-text.pdf");
    //     console.log(`generateRichPdf >> ult`);
    // }

   generateRichPdf() {
        if (!this.jsPDF && window.jspdf) {
            this.jsPDF = window.jspdf.jsPDF;
        }

        if (!this.jsPDF) {
            console.error('jsPDF not loaded');
            return;
        }

        const doc = new this.jsPDF({ unit: "pt", format: "a4" });

        const editor = this.template.querySelector('.editor');
        if (!editor) return;

        const parsed = new DOMParser().parseFromString(`<div>${editor.innerHTML}</div>`, "text/html");

        const startX = 40;
        const pageWidth = 515;

        let y = 40;

        let line = [];
        let lineWidth = 0;

        //---------------------------------------------------
        const applyStyle = (style) => {
            if (style.bold && style.italic) doc.setFont("helvetica", "bolditalic");
            else if (style.bold) doc.setFont("helvetica", "bold");
            else if (style.italic) doc.setFont("helvetica", "italic");
            else doc.setFont("helvetica", "normal");

            doc.setFontSize(style.fontSize || 14);

            if (style.color && style.color.startsWith('#')) {
                const r = parseInt(style.color.substr(1, 2), 16);
                const g = parseInt(style.color.substr(3, 2), 16);
                const b = parseInt(style.color.substr(5, 2), 16);
                doc.setTextColor(r, g, b);
            } else {
                doc.setTextColor(0, 0, 0);
            }
        };

        //---------------------------------------------------
        const getAlignedX = (width, align) => {
            if (align === 'center') return startX + (pageWidth - width) / 2;
            if (align === 'right') return startX + (pageWidth - width);
            return startX;
        };

        //---------------------------------------------------
        const flushLine = (forceEmpty = false) => {
            // 🔥 KEY FIX: allow empty line rendering
            if (!line.length && !forceEmpty) return;

            const style = line[0]?.style || { fontSize: 14 };
            const align = style.align;

            const totalWidth = line.reduce((sum, seg) => {
                applyStyle(seg.style);
                return sum + doc.getTextWidth(seg.text);
            }, 0);

            let cursorX = getAlignedX(totalWidth, align);

            line.forEach(seg => {
                applyStyle(seg.style);

                doc.text(seg.text, cursorX, y);

                if (seg.style.underline) {
                    const underlineY = y + (seg.style.fontSize || 14) * 0.2;
                    doc.setLineWidth(0.5);
                    doc.line(cursorX, underlineY, cursorX + doc.getTextWidth(seg.text), underlineY);
                }

                cursorX += doc.getTextWidth(seg.text);
            });

            // 🔥 EVEN EMPTY LINE MOVES Y
            y += (style.fontSize || 14) * 1.4;

            line = [];
            lineWidth = 0;
        };

        //---------------------------------------------------
        const pushWord = (word, style) => {
            applyStyle(style);

            let renderText = word;

            if (/^\s+$/.test(word)) {
                renderText = word.replace(/ /g, '\u00A0'); // preserve spaces
            }

            const width = doc.getTextWidth(renderText);

            if (lineWidth + width > pageWidth) {
                flushLine();
            }

            line.push({
                text: renderText,
                style
            });

            lineWidth += width;
        };

        //---------------------------------------------------
        const processNode = (node, style = {}) => {

            // ✅ TEXT NODE
            if (node.nodeType === Node.TEXT_NODE) {
                const raw = node.textContent;

                // 🔥 CRITICAL FIX: preserve empty lines
                if (!raw.trim()) {
                    flushLine(true); // <-- THIS FIXES YOUR BUG
                    return;
                }

                const text = raw.replace(/\s+/g, ' ');
                const words = text.split(/(\s+)/);

                words.forEach(word => pushWord(word, style));
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) return;

            let newStyle = { ...style };
            const tag = node.tagName;
            const cs = node.style;

            //------------------------------------
            // STYLE
            //------------------------------------
            if (cs.color) newStyle.color = cs.color;
            if (cs.fontWeight === "bold") newStyle.bold = true;
            if (cs.fontStyle === "italic") newStyle.italic = true;
            if (cs.fontSize) newStyle.fontSize = parseInt(cs.fontSize);
            if (cs.textAlign) newStyle.align = cs.textAlign;

            if (tag === 'B' || tag === 'STRONG') newStyle.bold = true;
            if (tag === 'I' || tag === 'EM') newStyle.italic = true;
            if (tag === 'U') newStyle.underline = true;

            //------------------------------------
            // BLOCK START
            //------------------------------------
            if (tag === 'P' || tag === 'DIV') {
                flushLine();
            }

            //------------------------------------
            // EMPTY BLOCK FIX
            //------------------------------------
            if ((tag === 'DIV' || tag === 'P') && node.innerHTML.trim() === '<br>') {
                flushLine(true); // 🔥 THIS HANDLES EMPTY ENTER LINES
                return;
            }

            //------------------------------------
            if (tag === 'BR') {
                flushLine(true); // 🔥 BR also forces empty line
                return;
            }

            //------------------------------------
            // LISTS
            //------------------------------------
            if (tag === "UL" || tag === "OL") {
                [...node.children].forEach((li, i) => {
                    const prefix = tag === "UL" ? "• " : `${i + 1}. `;
                    pushWord(prefix, newStyle);
                    processNode(li, newStyle);
                    flushLine();
                });
                return;
            }

            //------------------------------------
            // CHILDREN
            //------------------------------------
            node.childNodes.forEach(child => processNode(child, newStyle));

            //------------------------------------
            // BLOCK END
            //------------------------------------
            if (tag === 'P' || tag === 'DIV') {
                flushLine();
            }
        };

        //---------------------------------------------------
        try {
            const root = parsed.body.firstChild;
            if (root) processNode(root);

            flushLine(); // final flush

            doc.save("rich-text.pdf");
        } catch (e) {
            console.error('PDF error', e);
        }
    }

    savedRange = null;
    saveSelection() {
        try {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                this.savedRange = sel.getRangeAt(0).cloneRange();
            }
        } catch (e) {
            this.savedRange = null;
        }
    }

    restoreSelection() {
        try {
            if (!this.savedRange) return false;

            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.savedRange);

            return true;
        } catch (e) {
            return false;
        }
    }

    handleToolbarMouseDown(event) {
        const isButton = event.target.closest('button');

        // Only prevent blur for buttons
        if (isButton) {
            event.preventDefault();
        }
    }
}