(function(){
  const mobile=window.matchMedia('(max-width:600px)');
  if(!mobile.matches)return;

  document.documentElement.classList.add('mobile-fx-enabled');
  document.body.classList.add('mobile-fx-enabled');

  const hero=document.querySelector('.hero');
  if(hero){
    hero.style.backgroundImage='url("/assets/hero-4k.png?v=1")';
    hero.style.backgroundSize='cover';
    hero.style.backgroundPosition='center center';
  }

  const layer=document.createElement('div');
  layer.className='mobile-fx-layer';
  layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<div class="mobile-fx-vignette"></div><div class="mobile-fx-glow"></div>';
  document.body.appendChild(layer);

  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced){
    for(let i=0;i<14;i++){
      const ember=document.createElement('i');
      ember.className='mobile-fx-ember';
      ember.style.left=(5+Math.random()*90)+'%';
      ember.style.bottom=(-5+Math.random()*25)+'vh';
      ember.style.setProperty('--drift',(-24+Math.random()*48)+'px');
      ember.style.animationDuration=(4.5+Math.random()*5)+'s';
      ember.style.animationDelay=(-Math.random()*8)+'s';
      layer.appendChild(ember);
    }
  }

  let lastHaptic=0;
  function haptic(ms){
    const now=Date.now();
    if(now-lastHaptic<80)return;
    lastHaptic=now;
    if(navigator.vibrate&&!reduced)navigator.vibrate(ms||8);
  }

  function ripple(x,y){
    if(reduced)return;
    const el=document.createElement('span');
    el.className='mobile-fx-ripple';
    el.style.left=x+'px';
    el.style.top=y+'px';
    document.body.appendChild(el);
    el.addEventListener('animationend',()=>el.remove(),{once:true});
  }

  function flash(){
    if(reduced)return;
    const el=document.createElement('span');
    el.className='mobile-fx-flash';
    document.body.appendChild(el);
    el.addEventListener('animationend',()=>el.remove(),{once:true});
  }

  document.addEventListener('pointerdown',function(e){
    const target=e.target.closest('button,.game-card,[role="button"],.castle-card,.region-marker');
    if(!target)return;
    ripple(e.clientX,e.clientY);
    haptic(7);
  },{passive:true});

  document.addEventListener('click',function(e){
    const target=e.target.closest('.primary,.game-card,.castle-card,.region-marker');
    if(!target)return;
    if(target.classList.contains('game-card')||target.classList.contains('castle-card')||target.classList.contains('region-marker')){
      haptic(10);
      flash();
    }
  });

  document.addEventListener('click',function(e){
    const target=e.target.closest('.nav-btn,.primary,.danger');
    if(!target||reduced)return;
    const app=document.getElementById('gameApp');
    if(app){app.classList.remove('mobile-fx-shake');void app.offsetWidth;app.classList.add('mobile-fx-shake');}
  });

  // Mobile-only Persian army/fleet labels with subtle fantasy motion.
  const unitLabels={
    cavalry:'🏇 سواره‌نظام', archer:'🏹 کماندار', swordsman:'🗡 شمشیرزن',
    spearman:'🔱 نیزه‌دار', red_cloak:'🩸 ردا سرخ', ranger:'🥷 رنجر',
    winter_soldier:'🐺 سرباز زمستان', vale_knight:'⚔️ شوالیه ویل',
    crossbowman:'🏹 کراسبو‌دار', dragon_knight:'🐉 شوالیه اژدها',
    axeman:'🪓 تبر‌دار', flower_knight:'🏵 شوالیه گل', hammer_wielder:'🔨 پتک‌دار',
    dornish_spearman:'🔱 نیزه‌دار دورنیش', warship:'⚔️ کشتی جنگی', transport:'🚢 کشتی ترابری'
  };

  const style=document.createElement('style');
  style.textContent=`
    @media(max-width:600px){
      #castleManagementRoot .cm-army{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;}
      #castleManagementRoot .cm-army h4{grid-column:1/-1;margin:2px 0 3px;text-shadow:0 0 18px rgba(199,164,86,.18);}
      #castleManagementRoot .cm-army > span{
        position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:8px;
        min-height:42px;padding:8px 10px;border:1px solid rgba(199,164,86,.12);border-radius:12px;
        background:linear-gradient(135deg,rgba(255,255,255,.045),rgba(255,255,255,.012));
        color:#eee9dc;font-family:Vazirmatn,system-ui,sans-serif;font-size:12px;font-weight:700;
        box-shadow:inset 0 1px rgba(255,255,255,.035),0 7px 18px rgba(0,0,0,.16);
        animation:khataUnitFloat 3.6s ease-in-out infinite;transition:transform .18s,border-color .18s,box-shadow .18s;
      }
      #castleManagementRoot .cm-army > span:nth-of-type(2n){animation-delay:.35s}
      #castleManagementRoot .cm-army > span:nth-of-type(3n){animation-delay:.7s}
      #castleManagementRoot .cm-army > span:before{content:"";position:absolute;inset:0 auto 0 0;width:2px;background:linear-gradient(180deg,transparent,#c7a456,transparent);opacity:.55;animation:khataUnitLine 2.8s ease-in-out infinite;}
      #castleManagementRoot .cm-army > span:after{content:"";position:absolute;inset:-40% -70%;background:linear-gradient(110deg,transparent 42%,rgba(255,255,255,.055) 50%,transparent 58%);transform:translateX(-65%);animation:khataUnitShimmer 4.8s ease-in-out infinite;pointer-events:none;}
      #castleManagementRoot .cm-army > span:active{transform:scale(.97);border-color:rgba(199,164,86,.42);box-shadow:0 0 20px rgba(199,164,86,.08);}
      #castleManagementRoot .cm-army > span b{position:relative;z-index:1;color:#fff2c9;font-size:15px;font-weight:900;direction:ltr;text-shadow:0 0 10px rgba(199,164,86,.18);}
      #castleManagementRoot .cm-army > span{direction:rtl;}
      @keyframes khataUnitFloat{0%,100%{transform:translateY(0);opacity:.9}50%{transform:translateY(-2px);opacity:1}}
      @keyframes khataUnitLine{0%,100%{opacity:.25;transform:translateY(-18%)}50%{opacity:.9;transform:translateY(18%)}}
      @keyframes khataUnitShimmer{0%,65%{transform:translateX(-65%)}82%,100%{transform:translateX(65%)}}
    }
    @media(max-width:600px) and (max-width:380px){#castleManagementRoot .cm-army{grid-template-columns:1fr}.#castleManagementRoot .cm-army > span{font-size:12px;}}
    @media(prefers-reduced-motion:reduce){#castleManagementRoot .cm-army > span,#castleManagementRoot .cm-army > span:before,#castleManagementRoot .cm-army > span:after{animation:none!important}}
  `;
  document.head.appendChild(style);

  function decorateArmy(){
    const root=document.getElementById('castleManagementRoot');
    if(!root)return;
    root.querySelectorAll('.cm-army > span').forEach(span=>{
      const match=span.textContent.trim().match(/^([a-z_]+)\s*:/i);
      if(!match)return;
      const key=match[1].toLowerCase();
      const label=unitLabels[key];
      if(!label)return;
      const b=span.querySelector('b');
      if(!b)return;
      const raw=String(b.textContent).replace(/[^0-9.-]/g,'');
      const count=Number(raw);
      const display=Number.isFinite(count)?count.toLocaleString('fa-IR'):raw;
      span.innerHTML=label+' <b>'+display+'</b>';
    });
  }

  const observer=new MutationObserver(()=>decorateArmy());
  observer.observe(document.body,{subtree:true,childList:true});
  decorateArmy();
})();