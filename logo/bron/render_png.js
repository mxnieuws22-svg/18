// Rendert de SVG's naar PNG en maakt de social-media-bestanden.
// Gebruik (met Playwright geinstalleerd):  node logo/bron/render_png.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const L = path.resolve(__dirname, '..');
const data = f => 'data:image/svg+xml;base64,' + fs.readFileSync(`${L}/svg/${f}`).toString('base64');
const dims = f => { const t = fs.readFileSync(`${L}/svg/${f}`, 'utf8'); const m = t.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); return [+m[1], +m[2]]; };
(async () => {
  const b = await chromium.launch();
  async function shot(html, w, h, out, transparent = true) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(`<html><body style="margin:0;background:transparent">${html}</body></html>`);
    await p.waitForTimeout(150);
    await p.screenshot({ path: out, omitBackground: transparent });
    await p.close();
  }
  const img = (f, w, h, extra = '') => `<img src="${data(f)}" style="width:${w}px;height:${h}px;display:block;${extra}">`;
  for (const f of ['lwprints3d-liggend', 'lwprints3d-liggend-wit', 'lwprints3d-staand', 'lwprints3d-staand-wit', 'lwprints3d-beeldmerk', 'lwprints3d-beeldmerk-wit']) {
    const [vw, vh] = dims(f + '.svg');
    for (const w of [2000, 600]) { const h = Math.round(w * vh / vw); await shot(img(f + '.svg', w, h), w, h, `${L}/png/${f}-${w}.png`); }
  }
  await shot(img('lwprints3d-profielfoto.svg', 1080, 1080), 1080, 1080, `${L}/png/lwprints3d-profielfoto-1080.png`);
  for (const s of [512, 180, 32]) await shot(img('lwprints3d-favicon.svg', s, s), s, s, `${L}/png/lwprints3d-favicon-${s}.png`);
  const font = "font-family:'Liberation Sans',Arial,sans-serif";
  const [lw, lh] = dims('lwprints3d-liggend-wit.svg');
  await shot(`<div style="width:1640px;height:624px;background:#111;position:relative;${font}">
    <img src="${data('lwprints3d-liggend-wit.svg')}" style="position:absolute;left:600px;top:130px;width:960px;height:${Math.round(960 * lh / lw)}px">
    <div style="position:absolute;left:640px;top:480px;color:#fff;font-size:38px;font-weight:700;letter-spacing:2px">3D-PRINTSERVICE · OSS</div>
    <div style="position:absolute;left:640px;top:534px;color:#aab;font-size:26px">Onderdelen, prototypes en producten op maat · onderdeel van LWPRINTS</div>
    <div style="position:absolute;left:0;bottom:0;width:1640px;height:12px;background:#1F8BFF"></div></div>`, 1640, 624, `${L}/social/facebook-omslag-1640x624.png`, false);
  await shot(`<div style="width:1080px;height:1350px;background:#111;position:relative;${font}">
    <div style="position:absolute;left:80px;top:90px;width:120px;height:12px;background:#1F8BFF"></div>
    <div style="position:absolute;left:80px;top:140px;color:#fff;font-size:76px;font-weight:700;line-height:1.1;width:900px">Jouw titel<br>komt hier</div>
    <div style="position:absolute;left:80px;top:360px;color:#aab;font-size:36px;width:900px">Plaats hier je foto of tekst</div>
    <img src="${data('lwprints3d-liggend-wit.svg')}" style="position:absolute;right:50px;bottom:40px;width:420px;height:${Math.round(420 * lh / lw)}px">
    </div>`, 1080, 1350, `${L}/social/instagram-post-sjabloon-1080x1350.png`, false);
  await b.close(); console.log('png en social klaar');
})();
