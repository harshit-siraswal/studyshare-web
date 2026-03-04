import { chromium } from 'playwright-core';

(async () => {
    // Launch using the locally installed playwright (if present in node_modules) or system
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.adaline.ai/?ref=landing.love');

    // Evaluate in browser to extract the exact CSS of the hero text
    const textStyle = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        if (!h1) return null;
        const style = window.getComputedStyle(h1);
        return {
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            color: style.color
        };
    });

    // Try to find the sliding doors images
    // Based on the subagent's description, the doors slide in. They might be images or divs with background images.
    const imageElements = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => img.src);
    });

    const bgElements = await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        return divs
            .map(div => window.getComputedStyle(div).backgroundImage)
            .filter(bg => bg && bg !== 'none' && bg.includes('url'));
    });

    console.log("=== Text Styles ===");
    console.log(JSON.stringify(textStyle, null, 2));

    console.log("\n=== Extracted Image URLs ===");
    imageElements.forEach(img => console.log(img));

    console.log("\n=== Extracted Background Images ===");
    [...new Set(bgElements)].forEach(bg => console.log(bg));

    await browser.close();
})();
