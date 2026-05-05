import { LightningElement, track } from 'lwc';
import jsPdfLib from '@salesforce/resourceUrl/jsPDF';

import { loadScript } from 'lightning/platformResourceLoader';

export default class Poc_richTextEditorPdf extends LightningElement {
    @track toolbarState = {
        bold: false,
        italic: false,
        underline: false,
        unorderedList: false,
        orderedList: false,
        align: 'left',
        fontSize: 16
    }; 

    get boldClass() {
        return this.toolbarState.bold ? 'active-btn' : '';
    }

    get italicClass() {
        return this.toolbarState.italic ? 'active-btn' : '';
    }

    get underlineClass() {
        return this.toolbarState.underline ? 'active-btn' : '';
    }

    get ulClass() {
        return this.toolbarState.unorderedList ? 'active-btn' : '';
    }

    get alignCenterClass() {
        return this.toolbarState.align === 'center' ? 'active-btn' : '';
    }

    connectedCallback() {
        this.loadLibs();
    }

    async loadLibs() {
        try {
            await loadScript(this, jsPdfLib);
            this.jsPDF = window.jspdf.jsPDF;
            console.log('jsPDF loaded?', !!window.jspdf);
        } catch (err) {
            console.error('Load error', err);
        }
    }

    handleToolbarMouseDown(event) {
        const isButton = event.target.closest('button');

        // Only prevent blur for buttons
        if (isButton) {
            event.preventDefault();
        }
    }

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
            this.updateToolbarState();
        });
    }

    handleKeyUp() {
        this.saveSelection();
        this.updateToolbarState();
    }

    handleMouseUp() {
        this.saveSelection();
        this.updateToolbarState();
    }

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
        this.updateToolbarState();
    }

    handleInput() {
        this.saveSelection();
        this.refreshValue();
        this.updateToolbarState();
    }

    generateRichPdf() {
        if (!this.jsPDF && window.jspdf) {
            this.jsPDF = window.jspdf.jsPDF;
        }

        if (!this.jsPDF) {
            console.error('jsPDF not loaded');
            return;
        }

        const doc = new this.jsPDF({ unit: "pt", format: "a4" });

        const pageHeight = doc.internal.pageSize.getHeight();
        const marginTop = 40;
        const marginBottom = 40;
        const usableHeight = pageHeight - marginBottom;

        const editor = this.template.querySelector('.editor');
        if (!editor) return;

        const parsed = new DOMParser().parseFromString(`<div>${editor.innerHTML}</div>`, "text/html");

        const startX = 40;
        const pageWidth = 515;      //A4 size - margins(l+r)

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
            // KEY FIX: allow empty line rendering
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

            // EVEN EMPTY LINE MOVES Y
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
            const PX_TO_PT = 0.75;

            // TEXT NODE
            if (node.nodeType === Node.TEXT_NODE) {
                const raw = node.textContent;

                // CRITICAL FIX: preserve empty lines
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
            if (cs.fontSize) newStyle.fontSize =  parseInt(cs.fontSize) * PX_TO_PT;
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
                flushLine(true); // THIS HANDLES EMPTY ENTER LINES
                return;
            }

            //------------------------------------
            if (tag === 'BR') {
                flushLine(true); // BR also forces empty line
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

    updateToolbarState() {
        try {
            this.toolbarState = {
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                unorderedList: document.queryCommandState('insertUnorderedList'),
                orderedList: document.queryCommandState('insertOrderedList'),
                align: this.getAlignment(),
                fontSize: this.getFontSize()
            };
        } catch (e) {
            // ignore
        }
    }

    getAlignment() {
        if (document.queryCommandState('justifyCenter')) return 'center';
        if (document.queryCommandState('justifyRight')) return 'right';
        if (document.queryCommandState('justifyFull')) return 'justify';
        return 'left';
    }

    getFontSize() {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return 16;

        let node = sel.anchorNode;
        if (!node) return 16;

        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }

        const size = window.getComputedStyle(node).fontSize;
        return parseInt(size);
    }
}