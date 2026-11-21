// Renders public/og.png (1200x630 social preview) with Playwright.
// Usage: node scripts/make-og.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const font = (p) => `data:font/woff2;base64,${readFileSync(new URL(`node_modules/@fontsource/${p}`, root)).toString('base64')}`;
const img = (p) => `data:image/png;base64,${readFileSync(new URL(p, root)).toString('base64')}`;

const html = `<!doctype html><html><head><style>
@font-face{font-family:Fraunces;font-weight:800;src:url(${font('fraunces/files/fraunces-latin-800-normal.woff2')})}
@font-face{font-family:'Space Mono';font-weight:700;src:url(${font('space-mono/files/space-mono-latin-700-normal.woff2')})}
@font-face{font-family:Inter;font-weight:400;src:url(${font('inter/files/inter-latin-400-normal.woff2')})}
@font-face{font-family:Inter;font-weight:600;src:url(${font('inter/files/inter-latin-600-normal.woff2')})}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#F3E9D2;font-family:Inter;color:#2A211B;display:grid;grid-template-columns:620px 1fr;gap:40px;padding:72px 0 72px 72px;overflow:hidden}
.t{display:flex;flex-direction:column;justify-content:center}
.e{display:flex;align-items:center;gap:14px;font-family:'Space Mono';font-weight:700;font-size:20px;color:#5E5246;margin-bottom:28px}
.e i{width:48px;height:14px;border-radius:99px;border:2px solid #2A211B;background:linear-gradient(90deg,#D9643A 0 33%,#E8B23A 33% 66%,#1F6B5C 66%)}
h1{font-family:Fraunces;font-weight:800;font-size:66px;line-height:1.05;letter-spacing:-0.02em}
h1 span{background:linear-gradient(transparent 62%,#E8B23A 62%,#E8B23A 92%,transparent 92%)}
p{font-size:24px;color:#5E5246;margin-top:28px;line-height:1.45}
.u{color:#176B5B;font-weight:600}
.s{position:relative}
.s img{position:absolute;border-radius:18px;border:3px solid #2A211B;box-shadow:6px 6px 0 #2A211B;width:620px;object-fit:cover}
.a{top:0;left:0;height:300px}.b{top:250px;left:70px;height:290px}
</style></head><body>
<div class="t"><div class="e"><i></i>Zi-Dane Yan · Software Engineer</div>
<h1>I build useful software and <span>other things.</span></h1>
<p>Computer science at UNL, graduating December 2026.</p></div>
<div class="s"><img class="a" src="${img('src/assets/work/universe-map.png')}"><img class="b" src="${img('src/assets/work/stunt-double.png')}"></div>
</body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL('public/og.png', root).pathname });
await browser.close();
console.log('Wrote public/og.png');
