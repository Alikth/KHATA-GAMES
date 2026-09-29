(() => {
  const CORE = '/js/castle-management-core.js?v=1';
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
  function decorate(el) {
    if (!el || el.dataset.khataIconized === '1') return;
    const match = keyForText(el.textContent);
    if (!match) return;
    const [key, file] = match;
    const raw = String(el.textContent || '').trim();
    const labelName = Object.entries(byLabel).find(([name]) => raw === name || raw.startsWith(name + ':') || raw.startsWith(name + ' '))?.[0];
    if (!labelName) return;
    const suffix = raw.slice(labelName.length);
    el.textContent = '';
    const img = document.createElement('img');
    img.src = '/assets/game-icons/' + file;
    img.alt = labelName;
    img.className = 'khata-item-icon';
    img.loading = 'lazy';
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
    style.textContent = '.khata-item-icon{width:24px;height:24px;object-fit:contain;vertical-align:middle;display:inline-block;margin-inline-end:5px;background:transparent;mix-blend-mode:darken;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}.cm-resources span .khata-item-icon{width:22px;height:22px}.cm-army-unit span .khata-item-icon{width:30px;height:30px}.cm-card-head strong .khata-item-icon{width:30px;height:30px}.cm-confirm-row span:first-child .khata-item-icon{width:22px;height:22px}@media(max-width:700px){.cm-army-unit span .khata-item-icon{width:27px;height:27px}}';
    document.head.appendChild(style);
  }
  function bootIcons() {
    injectStyle();
    scan(document);
    const root = document.getElementById('castleManagementRoot');
    if (root && !root.dataset.khataIconObserver) {
      const observer = new MutationObserver(() => scan(root));
      observer.observe(root, {childList: true, subtree: true});
      root.dataset.khataIconObserver = '1';
    }
  }
  const script = document.createElement('script');
  script.src = CORE;
  script.onload = () => {
    bootIcons();
    const modal = document.getElementById('castleManagementModal');
    if (modal && !modal.dataset.khataIconModalObserver) {
      new MutationObserver(bootIcons).observe(modal, {childList: true, subtree: true});
      modal.dataset.khataIconModalObserver = '1';
    }
  };
  script.onerror = () => console.error('KHATA castle-management core failed to load');
  document.head.appendChild(script);
})();
