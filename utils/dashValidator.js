
export class DashValidator {

    static async validatePage(page) {

        const violations = await page.evaluate(() => {

            const results = [];

            // Em dash, en dash and hyphen
            const dashRegex = /[\u2014\u2013-]/;

            // Elements containing code or technical content
            const excludedTags = [
                'SCRIPT',
                'STYLE',
                'NOSCRIPT',
                'TEMPLATE',
                'CODE',
                'PRE',
                'KBD',
                'SAMP'
            ];

            // Attributes containing actual user-facing copy
            const attributes = [
                'placeholder',
                'title',
                'aria-label',
                'alt',
                'value'
            ];

            // Exclude protected content from dash validation
            function removeProtectedContent(text) {

                const protectedPatterns = [

                    // URLs including http, https and www
                    /(?:https?:\/\/|www\.)[^\s<>"']+/gi,

                    // Email addresses
                    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,

                    // Domain names and subdomains
                    /\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s]*)?/gi,

                    // Phone numbers
                    /(?<!\w)\+?\d[\d\s().-]{5,}\d(?!\w)/g,

                    // Dates: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY
                    /\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/g

                ];

                let cleanedText = text;

                protectedPatterns.forEach(pattern => {
                    cleanedText = cleanedText.replace(pattern, '');
                });

                return cleanedText;
            }

            // Generate element selector for reporting
            function getSelector(element) {

                if (!element) {
                    return 'Unknown';
                }

                if (element.id) {
                    return `#${element.id}`;
                }

                let selector = element.tagName.toLowerCase();

                if (element.classList.length > 0) {
                    selector += '.' + [...element.classList].join('.');
                }

                return selector;
            }

            // Common validation function
            function checkText(text, type, selector) {

                if (!text || !text.trim()) {
                    return;
                }

                const cleanedText = removeProtectedContent(text);

                if (dashRegex.test(cleanedText)) {

                    results.push({
                        type,
                        text: text.trim(),
                        selector,
                        detectedDashes: [
                            ...new Set(cleanedText.match(/[\u2014\u2013-]/g))
                        ]
                    });
                }
            }

            // 1. Validate visible and hidden DOM text
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT
            );

            let node;

            while ((node = walker.nextNode())) {

                const parent = node.parentElement;

                if (!parent) continue;

                // Ignore code and technical elements
                if (parent.closest(excludedTags.join(','))) {
                    continue;
                }

                checkText(
                    node.textContent,
                    'Page Text',
                    getSelector(parent)
                );
            }

            // 2. Validate user-facing HTML attributes
            document.querySelectorAll('*').forEach(element => {

                if (excludedTags.includes(element.tagName)) {
                    return;
                }

                attributes.forEach(attribute => {

                    let value = element.getAttribute(attribute);

                    // Get the current input value, not only HTML attribute
                    if (
                        attribute === 'value' &&
                        element.matches('input, textarea')
                    ) {
                        value = element.value;
                    }

                    if (value) {

                        checkText(
                            value,
                            attribute,
                            getSelector(element)
                        );
                    }
                });
            });

            // 3. Validate page title
            checkText(
                document.title,
                'Page Title',
                'document.title'
            );

            // 4. Validate meta description
            const metaDescription = document.querySelector(
                'meta[name="description"]'
            );

            if (metaDescription) {

                checkText(
                    metaDescription.content,
                    'Meta Description',
                    'meta[name="description"]'
                );
            }

            return results;
        });

        return violations;
    }
}


//or

/*export class DashValidator {

    static async validatePage(page) {

            const violations = await page.evaluate(() => {
                const results = [];
                const dashRegex = /[\u2014\u2013-]/;
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT
                );

                let node;
                while ((node = walker.nextNode())) {
                    const text = node.textContent.trim();
                    if (dashRegex.test(text)) {
                        results.push({
                            type: "Page Text",
                            text,
                            selector: node.parentElement?.tagName
                        });
                    }
                }

                const attributes = ["placeholder", "title", "aria-label", "alt", "value"];
                document.querySelectorAll("*").forEach(element => {
                    attributes.forEach(attribute => {
                        const value = element.getAttribute(attribute);
                        if (value && dashRegex.test(value)) {
                            results.push({
                                type: attribute,
                                text: value,
                                selector: element.tagName
                            });
                        }
                    });
                });

                if (dashRegex.test(document.title)) {
                    results.push({
                        type: "Page Title",
                        text: document.title
                    });
                }

                const metaDescription = document.querySelector('meta[name="description"]');
                const description = metaDescription?.getAttribute("content");
                if (description && dashRegex.test(description)) {
                    results.push({
                        type: "Meta Description",
                        text: description
                    });
                }

                return results;
            });
      return violations;
    }
}*/