📦 General Architecture

    🔄 Refactored PDF logic into named functions:

        generateBasicPdf()

        generateTextBoxPdf()

        generateAutoSizedTextBoxPdf()

    🧱 Introduced structured @track elements array

        Now holds individual box objects (future-ready for multiple elements)

🎨 PDF Output

    ✅ Added fixed-size 3"x2" gray textbox generation (generateTextBoxPdf())

    ✅ Added auto-sizing textbox PDF with text wrapping + padding (generateAutoSizedTextBoxPdf())

    🎯 Accurate sizing using pt units (72pt = 1in)

    🌈 Dynamic text and background color supported via hex-to-RGB conversion

✍️ Input Enhancements

    ➕ Added lightning-input fields for:

        Horizontal padding (pt)

        Vertical padding (pt)

        Background color (hex)

        Text color (hex)

    🔁 All input values sync both:

        To the internal elements[] state

        To the live preview

🔍 Preview System

    🧪 Added live preview window in LWC

    🪟 Rendered each textbox using:

        Precomputed .style string per box

        Clean conditional rendering (for:each={textboxElements})

    🧼 Fixed invalid inline style use (style="...") by computing style in JS

🧠 State Management

    🧩 Each element now has:

        Semantic id (e.g., textbox-1)

        type, text, boxColor, textColor, paddingX, paddingY, style

    📌 Introduced:

        updateElementProperty(id, prop, value) — general-purpose setter

        updateElementStyle(el) — generates computed inline style string

    🧪 currentElementId tracks active box

🛠 Utility Additions

    🔧 hexToRgb() utility to convert hex color to RGB for jsPDF fill/text colors

    ✅ jsPDF loaded via renderedCallback() using loadScript

🧹 Cleanup & Conventions

    🧼 Removed invalid syntax ({box.type === 'textbox'})

    🧼 Moved preview logic to filtered getter textboxElements

    ✅ Now LWC-safe and compliant