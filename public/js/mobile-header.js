(function(){
  // War rules/UI are loaded for both player and admin views.
  if(!window.__khataWarRulesLoaded){
    window.__khataWarRulesLoaded=true;
    const s=document.createElement('script');
    s.src='/js/war-rules-v2.js?v=3';
    s.async=false;
    document.head.appendChild(s);
  }

  // Castle management is opened from My Castles. Load its JS in the background
  // so the first click does not wait for a second network round-trip.
  if(!window.khataOpenCastleManagement&&!window.__khataCastleManagementPreload){
    window.__khataCastleManagementPreload=true;
    const s=document.createElement('script');
    s.src='/js/castle-management-v2.js?v=17';
    s.async=true;
    s.onload=()=>{window.__khataCastleManagementPreloaded=true;};
    s.onerror=()=>{window.__khataCastleManagementPreload=false;};
    document.head.appendChild(s);
  }


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

  mobile.addEventListener?.('change',function(){
    if(!mobile.matches)layer.remove();
  });

  // Replace the old asset emojis with the custom game artwork supplied for resources,
  // troops and siege equipment. This is intentionally DOM-based so every castle view
  // gets the same visual set without touching game data or combat logic.
  (function installAssetIcons(){
    if(window.__khataAssetIconsInstalled)return;
    window.__khataAssetIconsInstalled=true;
    const map={
      archer:[0,0],catapult:[1,0],cavalry:[2,0],coins:[3,0],dragon_glass:[4,0],fish:[5,0],grain:[6,0],
      grapes:[0,1],horses:[1,1],iron:[2,1],ladder:[3,1],lord:[4,1],meat:[5,1],ram:[6,1],
      scorpion:[0,2],siege_tower:[1,2],spearman:[2,2],stone:[3,2],swordsman:[4,2],tar:[5,2],wood:[6,2]
    };
    const labels=[
      ['سواره‌نظام','cavalry'],['سواره نظام','cavalry'],['کماندار','archer'],['شمشیرزن','swordsman'],['نیزه‌دار','spearman'],['نیزه دار','spearman'],
      ['نردبان','ladder'],['منجنیق','catapult'],['دژکوب','ram'],['اسکورپین','scorpion'],['اسکورپ','scorpion'],['برج محاصره','siege_tower'],
      ['سکه','coins'],['چوب','wood'],['سنگ','stone'],['آهن','iron'],['گوشت','meat'],['ماهی','fish'],['غلات','grain'],['اسب','horses'],['شیشه اژدها','dragon_glass'],['قیر','tar'],['انگور','grapes'],['لرد','lord']
    ];
    let spriteUrl=null;
    function iconKey(text){
      const t=String(text||'');
      for(const [label,key] of labels)if(t.includes(label))return key;
      return null;
    }
    function installSpriteStyle(){
      if(document.getElementById('khata-asset-icon-style'))return;
      const st=document.createElement('style');st.id='khata-asset-icon-style';
      st.textContent='.khata-asset-icon{display:inline-block;width:28px;height:28px;flex:0 0 28px;background-image:url("'+spriteUrl+'");background-size:224px 96px;background-repeat:no-repeat;vertical-align:-8px;margin-inline-end:5px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.38))}.cm-resources .khata-asset-icon{width:30px;height:30px;flex-basis:30px;vertical-align:-9px}.cm-army-unit .khata-asset-icon,.cm-card-head .khata-asset-icon{width:34px;height:34px;flex-basis:34px;vertical-align:-11px;border-radius:6px}.cm-card-meta .khata-asset-icon{width:20px;height:20px;flex-basis:20px;vertical-align:-5px;margin-inline-end:3px}';
      document.head.appendChild(st);
    }
    function apply(root=document){
      if(!spriteUrl)return;
      installSpriteStyle();
      const nodes=root.querySelectorAll?.('.cm-resources span,.cm-army-unit span,.cm-card-head strong,.cm-card-meta span,.cm-workshop span')||[];
      nodes.forEach(el=>{
        if(el.dataset.khataAssetIcon)return;
        const key=iconKey(el.textContent);if(!key)return;
        const [col,row]=map[key];
        const icon=document.createElement('i');icon.className='khata-asset-icon';icon.setAttribute('aria-hidden','true');icon.style.backgroundPosition=(-col*32)+'px '+(-row*32)+'px';
        const clone=el.cloneNode(true);clone.querySelectorAll?.('.khata-asset-icon').forEach(x=>x.remove());
        const text=clone.textContent.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u{27BF}\uFE0F\u200D]/gu,'').replace(/\s{2,}/g,' ').trim();
        el.textContent='';el.append(icon,document.createTextNode(text));el.dataset.khataAssetIcon='1';
      });
    }
    async function boot(){
      try{
        const res=await fetch('/assets/icons-sprite.b64?v=1',{cache:'force-cache'});
        if(!res.ok)return;
        const b64=await res.text();
        const raw=atob(b64.trim()),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
        spriteUrl=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
        apply();
        new MutationObserver(()=>apply()).observe(document.body,{subtree:true,childList:true});
      }catch(e){console.debug('asset icons unavailable',e);}
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  })();
})();
