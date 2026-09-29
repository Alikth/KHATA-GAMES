(() => {
  const CORE = '/js/castle-management-core.js?v=3';
  const ICONS = {
    coins: ['coins.webp', 'سکه'], wood: ['wood.webp', 'چوب'], stone: ['stone.webp', 'سنگ'], iron: ['iron.webp', 'آهن'],
    meat: ['meat.webp', 'گوشت'], fish: ['fish.webp', 'ماهی'], grain: ['grain.webp', 'غلات'], horses: ['horses.webp', 'اسب'],
    dragon_glass: ['dragon-glass.webp', 'شیشه اژدها'], tar: ['tar.webp', 'قیر'], grapes: ['grapes.webp', 'انگور'],
    swordsman: ['swordsman.webp', 'شمشیرزن'], archer: ['archer.webp', 'کماندار'], spearman: ['spearman.webp', 'نیزه‌دار'], cavalry: ['cavalry.webp', 'سواره‌نظام'],
    ladder: ['ladder.webp', 'نردبان'], ram: ['ram.webp', 'دژکوب'], catapult: ['catapult.webp', 'منجنیق'], scorpion: ['scorpion.webp', 'اسکورپین'], siege_tower: ['siege-tower.webp', 'برج محاصره']
  };
  const byLabel = Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [v[1], [k, v[0]]]));

  function keyForText(text) {
    const t = String(text || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '').trim();
    for (const [label, value] of Object.entries(byLabel)) if (t === label || t.startsWith(label + ':') || t.startsWith(label + ' ')) return value;
    return null;
  }

  // The supplied WebP assets contain a baked white canvas. Draw each asset into
  // a real <canvas> and erase only the near-white pixels connected to its edges.
  // Using canvas (instead of blob/data URLs) also works under the site's CSP.
  function replaceWithTransparentCanvas(img) {
    if (!img || img.dataset.khataProcessed === '1' || !img.naturalWidth) return;
    try {
      const w = img.naturalWidth, h = img.naturalHeight;
      const source = document.createElement('canvas');
      source.width = w; source.height = h;
      source.className = img.className;
      source.setAttribute('aria-label', img.alt || '');
      source.title = img.title || '';
      source.dataset.khataProcessed = '1';
      const ctx = source.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      const pixels = ctx.getImageData(0, 0, w, h);
      const data = pixels.data;
      const seen = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0, tail = 0;
      const bg = (p) => {
        const i = p * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        return a > 0 && r >= 232 && g >= 232 && b >= 232 && (max - min) <= 22;
      };
      const push = (p) => { if (!seen[p]) { seen[p] = 1; queue[tail++] = p; } };
      for (let x = 0; x < w; x++) { push(x); if (h > 1) push((h - 1) * w + x); }
      for (let y = 1; y < h - 1; y++) { push(y * w); if (w > 1) push(y * w + w - 1); }
      while (head < tail) {
        const p = queue[head++];
        if (!bg(p)) continue;
        data[p * 4 + 3] = 0;
        const x = p % w, y = (p / w) | 0;
        if (x > 0) push(p - 1);
        if (x + 1 < w) push(p + 1);
        if (y > 0) push(p - w);
        if (y + 1 < h) push(p + w);
      }
      ctx.putImageData(pixels, 0, 0);
      // Match the original image's rendered size.
      source.style.cssText = img.style.cssText;
      source.width = img.width || 24;
      source.height = img.height || 24;
      source.style.width = (img.width || 24) + 'px';
      source.style.height = (img.height || 24) + 'px';
      img.replaceWith(source);
    } catch (error) {
      console.warn('KHATA icon transparency failed', error);
    }
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
    img.src = '/assets/game-icons/' + file;
    img.alt = labelName;
    img.className = 'khata-item-icon';
    img.loading = 'eager';
    img.addEventListener('load', () => replaceWithTransparentCanvas(img), { once: true });
    el.append(img, document.createTextNode(' ' + labelName + suffix));
    el.dataset.khataIconized = '1';
    if (img.complete) replaceWithTransparentCanvas(img);
  }

  function scan(root = document) {
    root.querySelectorAll?.('.cm-resources span, .cm-army-unit span, .cm-card-head strong, .cm-confirm-row span:first-child').forEach(decorate);
  }

  function injectStyle() {
    if (document.getElementById('khata-item-icons-style')) return;
    const style = document.createElement('style');
    style.id = 'khata-item-icons-style';
    style.textContent = '.khata-item-icon{width:24px;height:24px;object-fit:contain;vertical-align:middle;display:inline-block;margin-inline-end:5px;background:transparent;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}.cm-resources span .khata-item-icon{width:22px;height:22px}.cm-army-unit span .khata-item-icon{width:30px;height:30px}.cm-card-head strong .khata-item-icon{width:30px;height:30px}.cm-confirm-row span:first-child .khata-item-icon{width:22px;height:22px}.cm-resources canvas.khata-item-icon{width:22px;height:22px}.cm-army-unit canvas.khata-item-icon{width:30px;height:30px}.cm-card-head strong canvas.khata-item-icon{width:30px;height:30px}.cm-confirm-row span:first-child canvas.khata-item-icon{width:22px;height:22px}@media(max-width:700px){.cm-army-unit span .khata-item-icon,.cm-army-unit canvas.khata-item-icon{width:27px;height:27px}}';
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
