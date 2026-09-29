(() => {
  const CORE = '/js/castle-management-core.js?v=2';
  const ICONS = {
    coins: ['coins.webp', 'سکه'], wood: ['wood.webp', 'چوب'], stone: ['stone.webp', 'سنگ'], iron: ['iron.webp', 'آهن'],
    meat: ['meat.webp', 'گوشت'], fish: ['fish.webp', 'ماهی'], grain: ['grain.webp', 'غلات'], horses: ['horses.webp', 'اسب'],
    dragon_glass: ['dragon-glass.webp', 'شیشه اژدها'], tar: ['tar.webp', 'قیر'], grapes: ['grapes.webp', 'انگور'],
    swordsman: ['swordsman.webp', 'شمشیرزن'], archer: ['archer.webp', 'کماندار'], spearman: ['spearman.webp', 'نیزه‌دار'], cavalry: ['cavalry.webp', 'سواره‌نظام'],
    ladder: ['ladder.webp', 'نردبان'], ram: ['ram.webp', 'دژکوب'], catapult: ['catapult.webp', 'منجنیق'], scorpion: ['scorpion.webp', 'اسکورپین'], siege_tower: ['siege-tower.webp', 'برج محاصره']
  };
  const byLabel = Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [v[1], [k, v[0]]]));
  const processedUrls = new Map();

  function keyForText(text) {
    const t = String(text || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '').trim();
    for (const [label, value] of Object.entries(byLabel)) if (t === label || t.startsWith(label + ':') || t.startsWith(label + ' ')) return value;
    return null;
  }

  // The supplied artwork contains a white/near-white canvas around the item.
  // Remove only near-white pixels connected to the image edges, preserving white details inside the artwork.
  async function makeTransparentBackground(img, sourceUrl) {
    if (processedUrls.has(sourceUrl)) return processedUrls.get(sourceUrl);
    const promise = new Promise((resolve) => {
      const run = () => {
        try {
          const canvas = document.createElement('canvas');
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (!w || !h) return resolve(sourceUrl);
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);
          const image = ctx.getImageData(0, 0, w, h);
          const data = image.data;
          const seen = new Uint8Array(w * h);
          const queue = new Int32Array(w * h);
          let head = 0, tail = 0;
          const isBackground = (i) => {
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            return a > 0 && r >= 238 && g >= 238 && b >= 238 && Math.max(r, g, b) - Math.min(r, g, b) <= 18;
          };
          const push = (x, y) => {
            const p = y * w + x;
            if (!seen[p]) { seen[p] = 1; queue[tail++] = p; }
          };
          for (let x = 0; x < w; x++) { push(x, 0); if (h > 1) push(x, h - 1); }
          for (let y = 1; y < h - 1; y++) { push(0, y); if (w > 1) push(w - 1, y); }
          while (head < tail) {
            const p = queue[head++];
            const i = p * 4;
            if (!isBackground(i)) continue;
            data[i + 3] = 0;
            const x = p % w, y = (p / w) | 0;
            if (x > 0) { const n = p - 1; if (!seen[n]) push(x - 1, y); }
            if (x + 1 < w) { const n = p + 1; if (!seen[n]) push(x + 1, y); }
            if (y > 0) { const n = p - w; if (!seen[n]) push(x, y - 1); }
            if (y + 1 < h) { const n = p + w; if (!seen[n]) push(x, y + 1); }
          }
          ctx.putImageData(image, 0, 0);
          canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : sourceUrl), 'image/png');
        } catch (_) { resolve(sourceUrl); }
      };
      if (img.complete) run(); else img.addEventListener('load', run, { once: true });
    });
    processedUrls.set(sourceUrl, promise);
    return promise;
  }

  function decorate(el) {
    if (!el || el.dataset.khataIconized === '1') return;
    const match = keyForText(el.textContent);
    if (!match) return;
    const [, file] = match;
    const raw = String(el.textContent || '').trim();
    const labelName = Object.entries(byLabel).find(([name]) => raw === name || raw.startsWith(name + ':') || raw.startsWith(name + ' '))?.[0];
    if (!labelName) return;
    const suffix = raw.slice(labelName.length);
    el.textContent = '';
    const img = document.createElement('img');
    const sourceUrl = '/assets/game-icons/' + file;
    img.src = sourceUrl;
    img.alt = labelName;
    img.className = 'khata-item-icon';
    img.loading = 'lazy';
    img.addEventListener('load', async () => {
      const transparentUrl = await makeTransparentBackground(img, sourceUrl);
      if (transparentUrl !== sourceUrl && document.contains(img)) img.src = transparentUrl;
    }, { once: true });
    el.append(img, document.createTextNode(' ' + labelName + suffix));
    el.dataset.khataIconized = '1';
  }

  function scan(root = document) {
    root.querySelectorAll?.('.cm-resources span, .cm-army-unit span, .cm-card-head strong, .cm-confirm-row span:first-child').forEach(decorate);
  }

  function injectStyle() {
    if (document.getElementById('khata-item-icons-style')) return;
    const style = document.createElement('style');
    style.id = 'khata-item-icons-style';
    style.textContent = '.khata-item-icon{width:24px;height:24px;object-fit:contain;vertical-align:middle;display:inline-block;margin-inline-end:5px;background:transparent;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}.cm-resources span .khata-item-icon{width:22px;height:22px}.cm-army-unit span .khata-item-icon{width:30px;height:30px}.cm-card-head strong .khata-item-icon{width:30px;height:30px}.cm-confirm-row span:first-child .khata-item-icon{width:22px;height:22px}@media(max-width:700px){.cm-army-unit span .khata-item-icon{width:27px;height:27px}}';
    document.head.appendChild(style);
  }

  function bootIcons() {
    injectStyle();
    scan(document);
    const root = document.getElementById('castleManagementRoot');
    if (root && !root.dataset.khataIconObserver) {
      const observer = new MutationObserver(() => scan(root));
      observer.observe(root, { childList: true, subtree: true });
      root.dataset.khataIconObserver = '1';
    }
  }

  const script = document.createElement('script');
  script.src = CORE;
  script.onload = () => {
    bootIcons();
    const modal = document.getElementById('castleManagementModal');
    if (modal && !modal.dataset.khataIconModalObserver) {
      new MutationObserver(bootIcons).observe(modal, { childList: true, subtree: true });
      modal.dataset.khataIconModalObserver = '1';
    }
  };
  script.onerror = () => console.error('KHATA castle-management core failed to load');
  document.head.appendChild(script);
})();
