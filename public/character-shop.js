(() => {
  const characters = [];
  const shop = { founding: [], packs: [], items: [], special: [] };
  const cats = {
    founding: { fa: 'تأسیس', en: 'FOUNDING', desc: 'محتوای مربوط به تأسیس' },
    packs: { fa: 'پک‌ها', en: 'PACKS', desc: 'پک‌های ویژه' },
    items: { fa: 'آیتم‌ها', en: 'ITEMS', desc: 'آیتم‌های قابل تهیه' },
    special: { fa: 'ویژه', en: 'SPECIAL', desc: 'محتوای ویژه' }
  };
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));

  function style() {
    if (document.getElementById('khcs-style')) return;
    const s = document.createElement('style');
    s.id = 'khcs-style';
    s.textContent = `
      .khcs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px;margin-top:28px}
      .khcs-empty{min-height:360px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(18,18,18,.72),rgba(5,5,5,.86));padding:35px 24px}
      .khcs-empty-mark{width:56px;height:56px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.16);color:#aaa;margin-bottom:16px}
      .khcs-empty h3{margin:0;font:600 22px Cinzel,serif;letter-spacing:1px;color:#e8e8e8}
      .khcs-empty p{max-width:520px;margin:10px auto 0;color:#777;line-height:1.9}
      .khcs-card{padding:0;border:1px solid rgba(255,255,255,.1);background:#0a0a0a;color:inherit;text-align:right;cursor:pointer;overflow:hidden;transition:.3s ease}
      .khcs-card:hover{transform:translateY(-5px);border-color:rgba(255,255,255,.3);box-shadow:0 18px 42px rgba(0,0,0,.45)}
      .khcs-card-img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block;background:#111}
      .khcs-card-body{padding:15px 16px 17px}
      .khcs-card-body h3{margin:0;color:#e8e8e8;font:600 20px Cinzel,serif}
      .khcs-card-body p{margin:8px 0 0;color:#858585;line-height:1.8;font-size:13px}
      .khcs-badge{position:absolute;top:12px;left:12px;padding:5px 9px;border:1px solid rgba(255,255,255,.28);background:rgba(7,7,7,.78);color:#ddd;font:10px Cinzel,serif;letter-spacing:1.4px}
      .khcs-img-wrap{position:relative}
      .khcs-shop{display:grid;grid-template-columns:minmax(0,1fr) 235px;gap:24px;margin-top:28px;direction:ltr}
      .khcs-shop-main{min-height:500px;direction:rtl}
      .khcs-shop-side{display:flex;flex-direction:column;gap:9px;direction:rtl}
      .khcs-tab{position:relative;width:100%;padding:17px 18px;border:1px solid rgba(255,255,255,.1);background:rgba(13,13,13,.88);text-align:right;color:#999;cursor:pointer}
      .khcs-tab span{display:block;color:#ddd;font-family:Vazirmatn,sans-serif;font-size:14px}
      .khcs-tab small{display:block;margin-top:4px;color:#5f5f5f;font:9px Cinzel,serif;letter-spacing:1.6px}
      .khcs-tab:hover,.khcs-tab.active{background:rgba(38,38,38,.92);border-color:rgba(255,255,255,.3)}
      .khcs-tab.active:before{content:'';position:absolute;top:0;bottom:0;right:0;width:3px;background:#9c0000}
      .khcs-head h3{margin:0;color:#eee;font:600 27px Cinzel,serif}.khcs-head p{margin:7px 0 20px;color:#707070}
      .khcs-shop-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:18px}
      .khcs-shop-card{border:1px solid rgba(255,255,255,.1);background:#0b0b0b;overflow:hidden}
      .khcs-shop-card img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#111}
      .khcs-shop-card-body{padding:14px 15px 16px}.khcs-shop-card-body h4{margin:0;color:#ddd}.khcs-shop-card-body p{margin:7px 0 0;color:#777;line-height:1.8;font-size:12px}
      .khcs-modal{max-width:980px}.khcs-detail{display:grid;grid-template-columns:minmax(260px,380px) 1fr;gap:28px;align-items:center}.khcs-detail img{width:100%;max-height:650px;object-fit:cover;background:#111}.khcs-detail h2{margin:0;font:600 31px Cinzel,serif;color:#eee}.khcs-detail p{margin-top:15px;color:#999;line-height:2}
      @media(max-width:760px){.khcs-shop{grid-template-columns:1fr}.khcs-shop-side{order:-1;display:grid;grid-template-columns:1fr 1fr}.khcs-detail{grid-template-columns:1fr}.khcs-detail img{max-height:430px}}
      @media(max-width:470px){.khcs-shop-side{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  const empty = (title, text) => `<div class='khcs-empty'><div class='khcs-empty-mark'>◈</div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;

  function showPage(id){
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === id));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === id || b.dataset.khcsPage === id));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function buildCharacters(main){
    const page=document.createElement('section');
    page.id='characters'; page.className='page';
    page.innerHTML=`<div class='page-title'><span>⚔</span><div><h2>CHARACTERS</h2><p>شخصیت‌های قلمرو را بشناس</p></div></div><div id='khcs-character-root'></div>`;
    main.appendChild(page);
    const root=document.getElementById('khcs-character-root');
    if(!characters.length){ root.innerHTML=empty('CHARACTERS','هنوز شخصیتی برای نمایش ثبت نشده است.'); return; }
    root.innerHTML=`<div class='khcs-grid'>${characters.map(c=>`<button class='khcs-card' type='button' data-khcs-character='${esc(c.id)}'><div class='khcs-img-wrap'>${c.image?`<img class='khcs-card-img' src='${esc(c.image)}' alt='${esc(c.name)}'>`:`<div class='khcs-card-img'></div>`}${c.premium?`<span class='khcs-badge'>PREMIUM</span>`:''}</div><div class='khcs-card-body'><h3>${esc(c.name)}</h3><p>${esc(c.about)}</p></div></button>`).join('')}</div>`;
  }

  function buildCharacterModal(){
    if(document.getElementById('khcs-modal')) return;
    const m=document.createElement('div'); m.id='khcs-modal'; m.className='modal hidden';
    m.innerHTML=`<div class='modal-card khcs-modal'><button class='close' type='button' id='khcs-close'>×</button><div id='khcs-detail'></div></div>`;
    document.body.appendChild(m);
    m.addEventListener('click',e=>{ if(e.target===m || e.target.id==='khcs-close') closeCharacter(); });
  }

  function openCharacter(id){
    const c=characters.find(x=>x.id===id); if(!c) return;
    const m=document.getElementById('khcs-modal'), d=document.getElementById('khcs-detail'); if(!m||!d) return;
    d.innerHTML=`<div class='khcs-detail'>${c.image?`<img src='${esc(c.image)}' alt='${esc(c.name)}'>`:`<div></div>`}<div><div class='eyebrow'>${c.premium?'PREMIUM CHARACTER':'CHARACTER'}</div><h2>${esc(c.name)}</h2><p>${esc(c.about)}</p></div></div>`;
    m.classList.remove('hidden'); document.body.classList.add('modal-open');
  }
  function closeCharacter(){const m=document.getElementById('khcs-modal');if(!m)return;m.classList.add('hidden');if(document.getElementById('castleModal')?.classList.contains('hidden')&&document.getElementById('registerModal')?.classList.contains('hidden'))document.body.classList.remove('modal-open');}

  function buildShop(main){
    const page=document.createElement('section'); page.id='shop'; page.className='page';
    page.innerHTML=`<div class='page-title'><span>🛒</span><div><h2>THE SHOP</h2><p>موارد مورد نیازت را از فروشگاه انتخاب کن</p></div></div><div class='khcs-shop'><div class='khcs-shop-main'><div id='khcs-shop-main'>${empty('WELCOME TO THE SHOP','یک دسته‌بندی را انتخاب کن.')}</div></div><aside class='khcs-shop-side'>${Object.entries(cats).map(([k,v],i)=>`<button class='khcs-tab ${i===0?'active':''}' type='button' data-khcs-shop='${k}'><span>${v.fa}</span><small>${v.en}</small></button>`).join('')}</aside></div>`;
    main.appendChild(page);
    openShop('founding');
  }

  function openShop(key){
    const cat=cats[key], root=document.getElementById('khcs-shop-main'); if(!cat||!root)return;
    document.querySelectorAll('.khcs-tab').forEach(b=>b.classList.toggle('active',b.dataset.khcsShop===key));
    const items=shop[key]||[];
    if(!items.length){ root.innerHTML=`<div class='khcs-head'><h3>${cat.fa}</h3><p>${cat.desc}</p></div>${empty(cat.fa,'این دسته هنوز محتوایی ندارد.')}`; return; }
    root.innerHTML=`<div class='khcs-head'><h3>${cat.fa}</h3><p>${cat.desc}</p></div><div class='khcs-shop-grid'>${items.map(i=>`<article class='khcs-shop-card'>${i.image?`<img src='${esc(i.image)}' alt='${esc(i.name)}'>`:`<div class='khcs-card-img'></div>`}<div class='khcs-shop-card-body'><h4>${esc(i.name)}</h4>${i.description?`<p>${esc(i.description)}</p>`:''}</div></article>`).join('')}</div>`;
  }

  function addNav(){
    const nav=document.querySelector('.nav'), main=document.querySelector('.game-app main');
    if(!nav||!main||document.getElementById('khcsCharactersNav'))return;
    const c=document.createElement('button'); c.id='khcsCharactersNav'; c.className='nav-btn'; c.type='button'; c.dataset.khcsPage='characters'; c.textContent='⚔ Characters';
    const s=document.createElement('button'); s.id='khcsShopNav'; s.className='nav-btn'; s.type='button'; s.dataset.khcsPage='shop'; s.textContent='🛒 Shop';
    nav.append(c,s);
    c.addEventListener('click',()=>showPage('characters')); s.addEventListener('click',()=>showPage('shop'));
    buildCharacters(main); buildCharacterModal(); buildShop(main);
  }

  document.addEventListener('click',e=>{
    const ch=e.target.closest('[data-khcs-character]'); if(ch){openCharacter(ch.dataset.khcsCharacter);return;}
    const sh=e.target.closest('[data-khcs-shop]'); if(sh){openShop(sh.dataset.khcsShop);}
  });

  function init(){style();addNav();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();